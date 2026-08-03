import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase.admin";
import { createNotificationsOnce } from "./notifications.service";
import { buildPlayerAssignedNotification, buildPlayerRemovedNotification, buildPlayerUpdatedNotification, buildTeamArchivedNotification, buildTrainerNotification, chooseSafeTarget, deduplicateRecipients } from "./assignmentNotification.core.mjs";
import { loadCoachRecipientSource, loadTeamRecipientSource, loadTeamRecipientSourceForProfiles } from "./teamNotificationRecipients.repository";

function permissionMap(source) {
  const permissionById = new Map(source.permissions.map((row) => [row.id, row.key]));
  const permissionsByRole = new Map();
  for (const link of source.rolePermissions) permissionsByRole.set(link.role_id, [...(permissionsByRole.get(link.role_id) || []), permissionById.get(link.permission_id)].filter(Boolean));
  const rolesByUser = new Map();
  for (const link of source.roleLinks) rolesByUser.set(link.user_id, [...(rolesByUser.get(link.user_id) || []), link.role_id]);
  return new Map(source.profiles.map((profile) => [profile.id, [...new Set((rolesByUser.get(profile.id) || []).flatMap((roleId) => permissionsByRole.get(roleId) || []))]]));
}

export async function resolveTeamNotificationRecipients(db, teamSeasonIds, actorUserId) {
  const result = await loadTeamRecipientSource(db, teamSeasonIds);
  if (result.error || !result.data) return { recipients: [], error: result.error };
  const source = result.data;
  const activeProfileIds = new Set(source.profiles.map((row) => row.id));
  const coachById = new Map(source.coaches.filter((row) => row.admin_profile_id && activeProfileIds.has(row.admin_profile_id)).map((row) => [row.id, row]));
  const permissions = permissionMap(source);
  return {
    recipients: deduplicateRecipients(source.assignments.flatMap((assignment) => {
      const coach = coachById.get(assignment.coach_id);
      return coach ? [{ userId: coach.admin_profile_id, teamSeasonId: assignment.team_season_id, permissionKeys: permissions.get(coach.admin_profile_id) || [] }] : [];
    }), actorUserId),
    error: null,
  };
}

export async function resolveCoachNotificationRecipient(db, coachId, actorUserId) {
  const result = await loadCoachRecipientSource(db, coachId);
  return { recipient: result.data?.userId && result.data.userId !== actorUserId ? result.data : null, error: result.error };
}

async function resolveLinkedCoachRecipients(db, coaches, actorUserId) {
  const profileIds = [...new Set((coaches || []).filter((coach) => coach?.is_active !== false).map((coach) => coach.admin_profile_id).filter(Boolean))];
  const result = await loadTeamRecipientSourceForProfiles(db, profileIds);
  return { recipients: deduplicateRecipients(result.data || [], actorUserId), error: result.error };
}

export async function deliverAssignmentNotifications({ events = [], recipientsByTeamSeason = new Map(), directRecipient = null, actorUserId }) {
  const db = createSupabaseAdminClient();
  if (!db || !events.length) return { delivered: 0, skipped: events.length, error: db ? null : new Error("Notification-Service-Client ist nicht konfiguriert.") };
  const inputs = [];
  for (const event of events) {
    const recipients = directRecipient ? [directRecipient] : recipientsByTeamSeason.get(event.metadata?.teamSeasonId) || [];
    for (const recipient of deduplicateRecipients(recipients, actorUserId)) inputs.push({ ...event, recipientUserId: recipient.userId, actorUserId, targetUrl: chooseSafeTarget(recipient, event) });
  }
  const result = await createNotificationsOnce(inputs, { db });
  return { delivered: result.data?.length || 0, skipped: inputs.length - (result.data?.length || 0), error: result.error || null };
}

export function logNotificationFailure(context, error) {
  if (!error) return;
  console.error("[assignment-notification]", { context, message: error.message || "Unbekannter Notification-Fehler" });
}

async function recipientMapForEvents(db, events, actorUserId) {
  const teamSeasonIds = [...new Set(events.map((event) => event.metadata?.teamSeasonId).filter(Boolean))];
  const result = await resolveTeamNotificationRecipients(db, teamSeasonIds, actorUserId);
  const map = new Map(teamSeasonIds.map((id) => [id, result.recipients.filter((recipient) => recipient.teamSeasonId === id)]));
  return { map, error: result.error };
}

export async function notifyPlayerAssignmentChange({ player, change, actorUserId }) {
  if (!change || change.operation === "UNCHANGED_ASSIGNMENT") return { delivered: 0, skipped: 0, error: null };
  const events = [];
  const previous = change.previousAssignment;
  const target = change.targetAssignment;
  if (previous && previous.teamSeasonId !== target?.teamSeasonId) events.push(buildPlayerRemovedNotification({ player, assignment: previous, assignmentId: previous.playerTeamSeasonId }));
  if (target && (!previous || previous.teamSeasonId !== target.teamSeasonId)) events.push(buildPlayerAssignedNotification({ player, assignment: target, assignmentId: change.assignmentId }));
  else events.push(buildPlayerUpdatedNotification({ player, assignment: target, assignmentId: change.assignmentId }));
  const db = createSupabaseAdminClient();
  if (!db) return { delivered: 0, skipped: events.length, error: new Error("Notification-Service-Client ist nicht konfiguriert.") };
  const recipients = await recipientMapForEvents(db, events, actorUserId);
  if (recipients.error) return { delivered: 0, skipped: events.length, error: recipients.error };
  return deliverAssignmentNotifications({ events, recipientsByTeamSeason: recipients.map, actorUserId });
}

export async function notifyCoachAssignmentChange({ coach, change, actorUserId }) {
  if (!change) return { delivered: 0, skipped: 0, error: null };
  const previousBySeason = new Map((change.previousAssignments || []).filter((item) => item.isActive !== false).map((item) => [item.teamSeasonId, item]));
  const nextBySeason = new Map((change.nextAssignments || []).filter((item) => item.isActive !== false).map((item) => [item.teamSeasonId, item]));
  const events = [];
  for (const [teamSeasonId, previous] of previousBySeason) {
    const next = nextBySeason.get(teamSeasonId);
    if (!next) events.push(buildTrainerNotification({ type: "trainer_removed", coach, assignment: previous, previousRole: previous.roleDe, assignmentId: previous.coachTeamSeasonId }));
    else if ((previous.roleDe || "").trim() !== (next.roleDe || "").trim()) events.push(buildTrainerNotification({ type: "trainer_changed", coach, assignment: next, previousRole: previous.roleDe, assignmentId: next.coachTeamSeasonId || previous.coachTeamSeasonId }));
  }
  for (const [teamSeasonId, next] of nextBySeason) if (!previousBySeason.has(teamSeasonId)) events.push(buildTrainerNotification({ type: "trainer_assigned", coach, assignment: next, assignmentId: next.coachTeamSeasonId || change.insertedIds?.[0] }));
  if (!events.length) return { delivered: 0, skipped: 0, error: null };
  const db = createSupabaseAdminClient();
  if (!db) return { delivered: 0, skipped: events.length, error: new Error("Notification-Service-Client ist nicht konfiguriert.") };
  const resolved = await resolveCoachNotificationRecipient(db, coach.id, actorUserId);
  if (resolved.error) return { delivered: 0, skipped: events.length, error: resolved.error };
  if (!resolved.recipient) return { delivered: 0, skipped: events.length, error: null };
  return deliverAssignmentNotifications({ events, directRecipient: resolved.recipient, actorUserId });
}

export async function notifyTeamRosterChange({ previous, next, actorUserId }) {
  if (!next) return { delivered: 0, skipped: 0, error: null };
  const db = createSupabaseAdminClient();
  if (!db) return { delivered: 0, skipped: 0, error: new Error("Notification-Service-Client ist nicht konfiguriert.") };
  const oldPlayers = new Map((previous?.players || []).map((item) => [item.id, item]));
  const newPlayers = new Map((next.players || []).map((item) => [item.id, item]));
  const oldCoaches = new Map((previous?.coaches || []).map((item) => [item.id, item]));
  const newCoaches = new Map((next.coaches || []).map((item) => [item.id, item]));
  const oldRecipients = await resolveLinkedCoachRecipients(db, previous?.coaches || [], actorUserId);
  const newRecipients = await resolveLinkedCoachRecipients(db, next.coaches || [], actorUserId);
  const directRecipients = await resolveLinkedCoachRecipients(db, [...(previous?.coaches || []), ...(next.coaches || [])], actorUserId);
  if (oldRecipients.error || newRecipients.error || directRecipients.error) return { delivered: 0, skipped: 0, error: oldRecipients.error || newRecipients.error || directRecipients.error };
  const directById = new Map(directRecipients.recipients.map((recipient) => [recipient.userId, recipient]));
  const deliveries = [];
  for (const [id, player] of oldPlayers) if (!newPlayers.has(id)) deliveries.push({ event: buildPlayerRemovedNotification({ player, assignment: player, assignmentId: player.assignmentId }), recipients: oldRecipients.recipients });
  for (const [id, player] of newPlayers) if (!oldPlayers.has(id)) deliveries.push({ event: buildPlayerAssignedNotification({ player, assignment: player, assignmentId: player.assignmentId }), recipients: newRecipients.recipients });
  for (const [id, coach] of oldCoaches) if (!newCoaches.has(id)) deliveries.push({ event: buildTrainerNotification({ type: "trainer_removed", coach, assignment: coach, previousRole: coach.roleDe, assignmentId: coach.assignmentId }), recipients: [directById.get(coach.admin_profile_id)].filter(Boolean) });
  for (const [id, coach] of newCoaches) if (!oldCoaches.has(id)) deliveries.push({ event: buildTrainerNotification({ type: "trainer_assigned", coach, assignment: coach, assignmentId: coach.assignmentId }), recipients: [directById.get(coach.admin_profile_id)].filter(Boolean) });
  const inputs = deliveries.flatMap(({ event, recipients }) => deduplicateRecipients(recipients, actorUserId).map((recipient) => ({ ...event, recipientUserId: recipient.userId, actorUserId, targetUrl: chooseSafeTarget(recipient, event) })));
  const result = await createNotificationsOnce(inputs, { db });
  return { delivered: result.data?.length || 0, skipped: inputs.length - (result.data?.length || 0), error: result.error || null };
}

export async function notifyTeamArchived({ snapshot, actorUserId }) {
  if (!snapshot) return { delivered: 0, skipped: 0, error: null };
  const db = createSupabaseAdminClient();
  if (!db) return { delivered: 0, skipped: 0, error: new Error("Notification-Service-Client ist nicht konfiguriert.") };
  const resolved = await resolveLinkedCoachRecipients(db, snapshot.coaches || [], actorUserId);
  if (resolved.error) return { delivered: 0, skipped: 0, error: resolved.error };
  const event = buildTeamArchivedNotification({ team: { id: snapshot.teamId }, assignment: snapshot, assignmentId: snapshot.teamSeasonId });
  const inputs = resolved.recipients.map((recipient) => ({ ...event, recipientUserId: recipient.userId, actorUserId, targetUrl: chooseSafeTarget(recipient, event) }));
  const result = await createNotificationsOnce(inputs, { db });
  return { delivered: result.data?.length || 0, skipped: inputs.length - (result.data?.length || 0), error: result.error || null };
}
