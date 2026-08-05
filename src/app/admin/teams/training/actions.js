"use server";

import { revalidatePath } from "next/cache";
import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import { canAccessTeamOnServer, loadServerTeamScopeContext } from "@/components/admin/teams/serverTeamScope";
import { getTrainingExceptionPlan, getTrainingTimePlan, normalizeTrainingExceptionPayload, normalizeTrainingTimePayload } from "@/components/admin/teams/training/trainingMutation.core.mjs";
import { logTrainingNotificationFailure, notifyTrainingMutation } from "@/components/admin/notifications/trainingNotifications.service";
import { revalidatePublicContent } from "@/lib/revalidation/publicContentRevalidation";

const errorResult = (message) => ({ data: null, error: { message } });

async function loadBaseAuth() {
  const auth = await assertAdminActionPermission({ requiredPermission: "teams.edit" });
  if (!auth.ok) return { error: errorResult(auth.message || "Berechtigung fehlt.") };
  return { auth, scope: await loadServerTeamScopeContext(auth) };
}

async function loadTeamContext(db, teamSeasonId) {
  if (!teamSeasonId) return { error: { message: "Team-Saison fehlt." } };
  const seasonRow = await db.from("team_seasons").select("id, team_id, season_id, name_de, is_active").eq("id", teamSeasonId).maybeSingle();
  if (seasonRow.error || !seasonRow.data) return { error: seasonRow.error || { message: "Team-Saison nicht gefunden." } };
  const [team, season] = await Promise.all([
    db.from("teams").select("*").eq("id", seasonRow.data.team_id).maybeSingle(),
    db.from("seasons").select("id, name, slug").eq("id", seasonRow.data.season_id).maybeSingle(),
  ]);
  if (team.error || !team.data || season.error) return { error: team.error || season.error || { message: "Mannschaft nicht gefunden." } };
  return { data: { teamSeasonId: seasonRow.data.id, teamId: team.data.id, teamName: seasonRow.data.name_de || team.data.name_de, seasonId: seasonRow.data.season_id, seasonLabel: season.data?.name || season.data?.slug || null }, team: team.data };
}

async function authorizeContext(authState, teamSeasonId) {
  const context = await loadTeamContext(authState.auth.supabaseServer, teamSeasonId);
  if (context.error) return context;
  if (!canAccessTeamOnServer(authState.scope, context.team)) return { error: { message: "Du hast keinen Zugriff auf diese Mannschaft." } };
  return context;
}

function revalidateTraining(teamId) {
  revalidatePath("/admin/events");
  revalidatePath("/admin/teams");
  if (teamId) revalidatePath(`/admin/teams/${teamId}`);
  revalidatePublicContent("events");
}

async function notify(auth, input, label) {
  const result = await notifyTrainingMutation({ ...input, actorUserId: auth.userId });
  logTrainingNotificationFailure(label, result.error);
}

export async function createTrainingTimeAction(payload) {
  const items = (Array.isArray(payload) ? payload : [payload]).map(normalizeTrainingTimePayload);
  const teamSeasonIds = [...new Set(items.map((item) => item.team_season_id).filter(Boolean))];
  if (!items.length || teamSeasonIds.length !== 1) return errorResult("Genau eine Team-Saison ist erforderlich.");
  const state = await loadBaseAuth();
  if (state.error) return state.error;
  const context = await authorizeContext(state, teamSeasonIds[0]);
  if (context.error) return errorResult(context.error.message);
  const write = await state.auth.supabaseServer.from("team_training_times").insert(items).select("*");
  if (write.error) return write;
  const ids = (write.data || []).map((item) => item.id);
  const postcheck = ids.length ? await state.auth.supabaseServer.from("team_training_times").select("*").in("id", ids) : { data: [], error: null };
  if (postcheck.error || postcheck.data?.length !== ids.length) return errorResult(postcheck.error?.message || "Postcheck der Trainingszeiten fehlgeschlagen.");
  revalidateTraining(context.data.teamId);
  for (const item of postcheck.data || []) await notify(state.auth, { model: "time", plan: getTrainingTimePlan(null, item), next: item, teamContext: context.data }, "training-time-created");
  return { data: postcheck.data, error: null };
}

export async function updateTrainingTimeAction(id, payload) {
  const state = await loadBaseAuth();
  if (state.error) return state.error;
  const before = await state.auth.supabaseServer.from("team_training_times").select("*").eq("id", id).maybeSingle();
  if (before.error || !before.data) return errorResult(before.error?.message || "Trainingszeit nicht gefunden.");
  const nextPayload = normalizeTrainingTimePayload(payload);
  const oldContext = await authorizeContext(state, before.data.team_season_id);
  if (oldContext.error) return errorResult(oldContext.error.message);
  const newContext = nextPayload.team_season_id === before.data.team_season_id ? oldContext : await authorizeContext(state, nextPayload.team_season_id);
  if (newContext.error) return errorResult(newContext.error.message);
  const write = await state.auth.supabaseServer.from("team_training_times").update(nextPayload).eq("id", id).select("*").single();
  if (write.error) return write;
  const plan = getTrainingTimePlan(before.data, write.data);
  revalidateTraining(oldContext.data.teamId);
  if (newContext.data.teamId !== oldContext.data.teamId) revalidateTraining(newContext.data.teamId);
  if (plan && oldContext.data.teamSeasonId !== newContext.data.teamSeasonId) {
    await notify(state.auth, { model: "time", plan: getTrainingTimePlan(before.data, null), previous: before.data, teamContext: oldContext.data }, "training-time-team-removed");
    await notify(state.auth, { model: "time", plan: getTrainingTimePlan(null, write.data), next: write.data, teamContext: newContext.data }, "training-time-team-created");
  } else if (plan) await notify(state.auth, { model: "time", plan, previous: before.data, next: write.data, teamContext: oldContext.data }, "training-time-updated");
  return write;
}

export async function deleteTrainingTimeAction(id) {
  const state = await loadBaseAuth();
  if (state.error) return state.error;
  const before = await state.auth.supabaseServer.from("team_training_times").select("*").eq("id", id).maybeSingle();
  if (before.error || !before.data) return errorResult(before.error?.message || "Trainingszeit nicht gefunden.");
  const context = await authorizeContext(state, before.data.team_season_id);
  if (context.error) return errorResult(context.error.message);
  const write = await state.auth.supabaseServer.from("team_training_times").delete().eq("id", id);
  if (write.error) return write;
  const postcheck = await state.auth.supabaseServer.from("team_training_times").select("id").eq("id", id).maybeSingle();
  if (postcheck.error || postcheck.data) return errorResult(postcheck.error?.message || "Trainingszeit konnte nicht sicher entfernt werden.");
  revalidateTraining(context.data.teamId);
  await notify(state.auth, { model: "time", plan: getTrainingTimePlan(before.data, null), previous: before.data, teamContext: context.data }, "training-time-removed");
  return { data: null, error: null };
}

async function loadExceptionSnapshot(db, id) {
  const result = await db.from("team_training_exceptions").select("*").eq("id", id).maybeSingle();
  if (result.error || !result.data) return { error: result.error || { message: "Trainingsausnahme nicht gefunden." } };
  const time = await db.from("team_training_times").select("*").eq("id", result.data.team_training_time_id).maybeSingle();
  return time.error || !time.data ? { error: time.error || { message: "Trainingszeit nicht gefunden." } } : { data: result.data, time: time.data };
}

export async function createTrainingExceptionAction(payload) {
  const normalized = normalizeTrainingExceptionPayload(payload);
  const state = await loadBaseAuth();
  if (state.error) return state.error;
  const time = await state.auth.supabaseServer.from("team_training_times").select("*").eq("id", normalized.team_training_time_id).maybeSingle();
  if (time.error || !time.data) return errorResult(time.error?.message || "Trainingszeit nicht gefunden.");
  const context = await authorizeContext(state, time.data.team_season_id);
  if (context.error) return errorResult(context.error.message);
  const write = await state.auth.supabaseServer.from("team_training_exceptions").insert(normalized).select("*").single();
  if (write.error) return write;
  revalidateTraining(context.data.teamId);
  await notify(state.auth, { model: "exception", plan: getTrainingExceptionPlan(null, write.data), next: write.data, teamContext: context.data }, "training-exception-created");
  return write;
}

export async function updateTrainingExceptionAction(id, payload) {
  const state = await loadBaseAuth();
  if (state.error) return state.error;
  const before = await loadExceptionSnapshot(state.auth.supabaseServer, id);
  if (before.error) return errorResult(before.error.message);
  const context = await authorizeContext(state, before.time.team_season_id);
  if (context.error) return errorResult(context.error.message);
  const normalized = normalizeTrainingExceptionPayload(payload);
  if (normalized.team_training_time_id !== before.data.team_training_time_id) return errorResult("Die Trainingszeit einer Ausnahme kann nicht gewechselt werden.");
  const write = await state.auth.supabaseServer.from("team_training_exceptions").update(normalized).eq("id", id).select("*").single();
  if (write.error) return write;
  revalidateTraining(context.data.teamId);
  await notify(state.auth, { model: "exception", plan: getTrainingExceptionPlan(before.data, write.data), previous: before.data, next: write.data, teamContext: context.data }, "training-exception-updated");
  return write;
}

export async function deleteTrainingExceptionAction(id) {
  const state = await loadBaseAuth();
  if (state.error) return state.error;
  const before = await loadExceptionSnapshot(state.auth.supabaseServer, id);
  if (before.error) return errorResult(before.error.message);
  const context = await authorizeContext(state, before.time.team_season_id);
  if (context.error) return errorResult(context.error.message);
  const write = await state.auth.supabaseServer.from("team_training_exceptions").delete().eq("id", id);
  if (write.error) return write;
  const postcheck = await state.auth.supabaseServer.from("team_training_exceptions").select("id").eq("id", id).maybeSingle();
  if (postcheck.error || postcheck.data) return errorResult(postcheck.error?.message || "Ausnahme konnte nicht sicher entfernt werden.");
  revalidateTraining(context.data.teamId);
  await notify(state.auth, { model: "exception", plan: getTrainingExceptionPlan(before.data, null), previous: before.data, teamContext: context.data }, "training-exception-removed");
  return { data: null, error: null };
}
