import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase.admin";
import { loadAdminProfileScopeContext } from "@/lib/admin-auth/scopes";
import { loadMediaUrlMap, synchronizeMediaAssignment } from "@/components/admin/media-library/media.service";
import { canAccessResultTeamSeason, isEligibleResultLogo, resolveResultDepartmentSlugs, validateResultInput } from "./results.core.mjs";
import * as repository from "./results.repository";

const failure = (error, errors = null) => ({ ok: false, error, errors });
const roleKeys = (auth) => (auth.roles || []).map((role) => role.key).filter(Boolean);
const has = (auth, permission) => auth.roles?.some((role) => role.key === "superadmin") || auth.permissions?.includes(permission);

export async function loadResultScope(auth) {
  const loaded = await loadAdminProfileScopeContext({ adminProfileId: auth.profile.id, userId: auth.userId, roleKeys: roleKeys(auth), permissionKeys: auth.permissions || [], supabase: auth.supabaseServer });
  if (loaded.sources?.managedDepartmentError) return failure("Der Abteilungsbereich konnte nicht eindeutig ermittelt werden.");
  return { ok: true, context: loaded.context, departmentSlugs: resolveResultDepartmentSlugs(loaded.context) };
}

export async function loadResultsAdmin(auth) {
  const scope = await loadResultScope(auth);
  if (!scope.ok || !scope.departmentSlugs.length) return failure(scope.error || "Kein Ergebnisbereich freigegeben.");
  const db = createSupabaseAdminClient();
  if (!db) return failure("Ergebnis-Service ist nicht konfiguriert.");
  const [resultsResult, teamSeasonsResult] = await Promise.all([repository.listResults(db), repository.listActiveTeamSeasons(db)]);
  if (resultsResult.error || teamSeasonsResult.error) return failure("Ergebnisse konnten nicht geladen werden.");
  const teamSeasons = (teamSeasonsResult.data || []).filter((item) => canAccessResultTeamSeason(scope.context, item));
  const allowedIds = new Set(teamSeasons.map((item) => item.id));
  const results = (resultsResult.data || []).filter((item) => allowedIds.has(item.team_season_id));
  const logoUrls = await loadMediaUrlMap(results.map((item) => item.opponent_logo_media_asset_id), ["public"], "image");
  return { ok: true, results: results.map((item) => ({ ...item, opponent_logo_url: logoUrls.data.get(item.opponent_logo_media_asset_id) || null })), teamSeasons, departmentSlugs: scope.departmentSlugs };
}

async function resolveScopedTeamSeason(db, auth, id) {
  const scope = await loadResultScope(auth);
  if (!scope.ok) return scope;
  const result = await repository.getTeamSeason(db, id);
  if (result.error || !result.data) return failure("Die Mannschaftssaison wurde nicht gefunden.");
  if (!canAccessResultTeamSeason(scope.context, result.data)) return failure("Diese Mannschaftssaison liegt außerhalb deines erlaubten Bereichs.");
  return { ok: true, data: result.data, scope: scope.context };
}

async function resolveScopedResult(db, auth, id) {
  const current = await repository.getResult(db, id);
  if (current.error || !current.data) return failure("Das Ergebnis wurde nicht gefunden.");
  const scoped = await resolveScopedTeamSeason(db, auth, current.data.team_season_id);
  return scoped.ok ? { ok: true, data: current.data, scope: scoped.scope } : scoped;
}

export async function saveResult(input, auth) {
  const validation = validateResultInput(input);
  if (!validation.ok) return failure("Bitte die markierten Felder prüfen.", validation.errors);
  const value = validation.value;
  const permission = value.id ? "results.edit" : "results.create";
  if (!has(auth, permission)) return failure("Berechtigung fehlt.");
  if (value.isPublished && !has(auth, "results.publish")) return failure("Berechtigung zum Veröffentlichen fehlt.");
  const db = createSupabaseAdminClient();
  if (!db) return failure("Ergebnis-Service ist nicht konfiguriert.");
  const current = value.id ? await resolveScopedResult(db, auth, value.id) : { ok: true, data: null };
  if (!current.ok) return current;
  if (current.data?.is_published !== value.isPublished && !has(auth, "results.publish")) return failure("Berechtigung zum Ändern des Veröffentlichungsstatus fehlt.");
  const target = await resolveScopedTeamSeason(db, auth, value.teamSeasonId);
  if (!target.ok) return target;
  if (value.opponentLogoMediaAssetId) {
    const media = await repository.getMediaAsset(db, value.opponentLogoMediaAssetId);
    if (media.error || !isEligibleResultLogo(media.data)) return failure("Das Gegnerlogo muss ein aktives öffentliches Resultatbild sein.");
  }
  const payload = { team_season_id: value.teamSeasonId, competition_label: value.competitionLabel, played_at: value.playedAt, club_is_home: value.clubIsHome, opponent_name: value.opponentName, club_score: value.clubScore, opponent_score: value.opponentScore, opponent_logo_media_asset_id: value.opponentLogoMediaAssetId, is_published: value.isPublished, visible_from: value.visibleFrom, visible_until: value.visibleUntil, updated_by: auth.profile.id };
  if (!value.id) payload.created_by = auth.profile.id;
  const saved = value.id ? await repository.updateResult(db, value.id, payload) : await repository.insertResult(db, payload);
  if (saved.error || !saved.data) return failure("Das Ergebnis konnte nicht gespeichert werden.");
  const mediaChanged = current.data?.opponent_logo_media_asset_id !== value.opponentLogoMediaAssetId;
  if (mediaChanged) {
    const sync = await synchronizeMediaAssignment("result", saved.data.id, value.opponentLogoMediaAssetId, "opponent_logo");
    if (sync.error) {
      if (!current.data) await repository.deleteResult(db, saved.data.id);
      else await repository.updateResult(db, current.data.id, { team_season_id: current.data.team_season_id, competition_label: current.data.competition_label, played_at: current.data.played_at, club_is_home: current.data.club_is_home, opponent_name: current.data.opponent_name, club_score: current.data.club_score, opponent_score: current.data.opponent_score, opponent_logo_media_asset_id: current.data.opponent_logo_media_asset_id, is_published: current.data.is_published, visible_from: current.data.visible_from, visible_until: current.data.visible_until, updated_by: current.data.updated_by });
      return failure("Die Logo-Zuordnung konnte nicht gespeichert werden.");
    }
  }
  return { ok: true, data: saved.data };
}

export async function toggleResultPublished(id, auth) {
  if (!has(auth, "results.publish")) return failure("Berechtigung zum Veröffentlichen fehlt.");
  const db = createSupabaseAdminClient(); if (!db) return failure("Ergebnis-Service ist nicht konfiguriert.");
  const current = await resolveScopedResult(db, auth, id); if (!current.ok) return current;
  const result = await repository.updateResult(db, id, { is_published: !current.data.is_published, updated_by: auth.profile.id });
  return result.error || !result.data ? failure("Der Status konnte nicht geändert werden.") : { ok: true, data: result.data };
}

export async function removeResult(id, auth) {
  if (!has(auth, "results.delete")) return failure("Berechtigung zum Löschen fehlt.");
  const db = createSupabaseAdminClient(); if (!db) return failure("Ergebnis-Service ist nicht konfiguriert.");
  const current = await resolveScopedResult(db, auth, id); if (!current.ok) return current;
  const result = await repository.deleteResult(db, id);
  return result.error || !result.data ? failure("Das Ergebnis konnte nicht gelöscht werden.") : { ok: true, data: result.data };
}
