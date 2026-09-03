"use server";

import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import {
  canCreateBoardMemberOnServer,
  canDeleteBoardMemberOnServer,
  canEditBoardMemberOnServer,
  canManageAllBoardMembersOnServer,
  loadServerPersonScopeContext,
} from "@/components/admin/persons/serverPersonScope";
import { saveBoardMember } from "@/components/admin/board/services/board.service";
import { revalidatePath } from "next/cache";
import { canManageMedia, loadMediaLibrary, resolveEntityImageMedia, synchronizeMediaAssignment, uploadMediaAsset } from "@/components/admin/media-library/media.service";
import { normalizePickerPurpose } from "@/components/admin/media-library/mediaPurpose.config.mjs";
import { createSupabaseAdminClient } from "@/lib/supabase.admin";
import { resolveBoardOrganizationTarget } from "@/components/admin/board/boardOrganizationScope.core.mjs";
import { buildOwnBoardCardPayload } from "@/components/admin/board/boardRoleContract.core.mjs";

const SAFE_MEDIA_ERRORS = new Set(["Keine Datei ausgewÃ¤hlt.", "Dateityp ist nicht erlaubt.", "Datei ist zu groÃŸ.", "Dateiinhalt passt nicht zum Dateityp."]);

function buildError(message) {
  return { error: { message } };
}

async function loadBoardMemberById(client, boardMemberId) {
  const { data } = await client
    .from("board_members")
    .select("*")
    .eq("id", boardMemberId)
    .maybeSingle();

  return data || null;
}

const TABLE_TENNIS_SHARED_ROLE_SLUGS = new Set(["erster-vorsitzender", "zweiter-vorsitzender", "erster-geschaeftsfuehrer", "zweiter-geschaeftsfuehrer", "kassenwart", "stellvertretender-kassenwart"]);

async function validateBoardRoleDepartment(db, roleId, departmentId) {
  if (!roleId) return "Bitte eine Funktion auswählen.";
  const [roleResult, departmentResult] = await Promise.all([
    db.from("board_roles").select("id, slug, department_id, is_active").eq("id", roleId).maybeSingle(),
    departmentId ? db.from("departments").select("id, slug, is_active").eq("id", departmentId).maybeSingle() : Promise.resolve({ data: null, error: null }),
  ]);
  if (roleResult.error || !roleResult.data?.is_active) return "Die gewählte Funktion ist nicht zulässig.";
  if (roleResult.data.department_id && roleResult.data.department_id !== departmentId) return "Die Funktion gehört zu einer anderen Abteilung.";
  if (departmentResult.data?.slug === "tischtennis"
    && (roleResult.data.department_id || !TABLE_TENNIS_SHARED_ROLE_SLUGS.has(roleResult.data.slug))) {
    return "Für Tischtennis ist diese Funktion nicht zulässig.";
  }
  return null;
}

function revalidateBoardPaths() {
  revalidatePath("/admin/department");
  revalidatePath("/admin/club/board");
  revalidatePath("/admin/football/board");
  revalidatePath("/admin/table-tennis/board");
}

async function authorizeBoardMedia(boardMemberId = null) {
  const permissionResult = await assertAdminActionPermission({ requiredPermission: boardMemberId ? "board.edit" : "board.create" });
  if (!permissionResult.ok) return { ok: false, message: permissionResult.message || "Berechtigung fehlt." };
  const scopeContext = await loadServerPersonScopeContext(permissionResult);
  if (boardMemberId) {
    const member = await loadBoardMemberById(permissionResult.supabaseServer, boardMemberId);
    if (!member || !canEditBoardMemberOnServer(scopeContext, member)) return { ok: false, message: "Du darfst dieses Vorstandsprofil nicht bearbeiten." };
  } else if (!canCreateBoardMemberOnServer(scopeContext)) return { ok: false, message: "Du darfst keine Vorstandsmitglieder erstellen." };
  return { ok: true, permissionResult };
}

export async function saveBoardMemberWithScopeAction(
  memberPayload,
  boardMemberId = null,
  mutationContext = {},
) {
  const permissionResult = await assertAdminActionPermission({
    requiredPermission: boardMemberId ? "board.edit" : "board.create",
  });

  if (!permissionResult.ok) {
    return buildError(permissionResult.message || "Berechtigung fehlt.");
  }

  const scopeContext = await loadServerPersonScopeContext(permissionResult);
  const supabaseServer = permissionResult.supabaseServer;

  let existingMember = null;
  if (boardMemberId) {
    existingMember = await loadBoardMemberById(supabaseServer, boardMemberId);
    if (!existingMember) {
      return buildError("Vorstandsmitglied nicht gefunden.");
    }

    if (!canEditBoardMemberOnServer(scopeContext, existingMember)) {
      return buildError("Du darfst dieses Vorstandsprofil nicht bearbeiten.");
    }
  } else if (!canCreateBoardMemberOnServer(scopeContext)) {
    return buildError("Du darfst keine Vorstandsmitglieder erstellen.");
  }

  let routeDepartment = null;
  const routeOrganizationScope = mutationContext?.organizationScope === "club" ? "club" : null;
  if (routeOrganizationScope && mutationContext?.departmentSlug) {
    return buildError("Der Organisationsbereich ist ungültig.");
  }
  if (routeOrganizationScope && existingMember
    && (existingMember.organization_scope !== "club" || existingMember.department_id)) {
    return buildError("Das Vorstandsprofil gehört nicht zum Gesamtverein.");
  }
  if (mutationContext?.departmentSlug) {
    const { data: expectedDepartment } = await supabaseServer.from("departments").select("id").eq("slug", mutationContext.departmentSlug).eq("is_active", true).maybeSingle();
    if (!expectedDepartment?.id) return buildError("Die Abteilung ist nicht verfügbar.");
    if (existingMember && existingMember.department_id !== expectedDepartment.id) return buildError("Das Vorstandsprofil gehört zu einer anderen Abteilung.");
    routeDepartment = expectedDepartment;
  }

  const canManageAllBoardMembers = canManageAllBoardMembersOnServer(scopeContext);
  if (existingMember && !canManageAllBoardMembers) {
    const ownPayload = buildOwnBoardCardPayload(memberPayload, existingMember);
    if (!ownPayload.ok) return buildError(ownPayload.message);
    memberPayload = { ...existingMember, ...ownPayload.data };
  }
  const organizationTarget = resolveBoardOrganizationTarget({
    requestedScope: memberPayload?.organization_scope,
    requestedDepartmentId: memberPayload?.department_id,
    existingMember,
    managedDepartmentId: scopeContext.managedDepartmentId,
    routeDepartmentId: routeDepartment?.id,
    routeOrganizationScope,
    isGlobal: canManageAllBoardMembers,
  });
  if (!organizationTarget.ok) return buildError(organizationTarget.message);
  if (!scopeContext.isGlobal && organizationTarget.data.organization_scope === "unassigned") {
    return buildError("Nicht zugeordnete Vorstandseinträge dürfen nur Superadmins verwalten.");
  }

  if (organizationTarget.data.department_id) {
    const { data: activeDepartment, error: departmentError } = await supabaseServer
      .from("departments")
      .select("id")
      .eq("id", organizationTarget.data.department_id)
      .eq("is_active", true)
      .maybeSingle();
    if (departmentError || !activeDepartment?.id) return buildError("Die gewählte Abteilung ist nicht verfügbar.");
  }

  memberPayload = { ...memberPayload, ...organizationTarget.data };
  const roleValidationError = await validateBoardRoleDepartment(supabaseServer, memberPayload?.role_id, memberPayload.department_id);
  if (roleValidationError) return buildError(roleValidationError);
  const allowedVisibilities = canManageMedia(permissionResult.roles) ? ["public", "admin"] : ["public"];
  const mediaResult = await resolveEntityImageMedia(memberPayload?.image_media_asset_id || null, { allowArchived: Boolean(existingMember?.image_media_asset_id === memberPayload?.image_media_asset_id), allowedVisibilities });
  if (mediaResult.error) return buildError(mediaResult.error.message);
  const writeClient = createSupabaseAdminClient();
  if (!writeClient) return buildError("Vorstands-Service ist nicht konfiguriert.");
  const { data, error } = await saveBoardMember(memberPayload || {}, boardMemberId, {
    client: writeClient,
  });

  if (error) {
    return buildError(error.message || "Fehler beim Speichern.");
  }
  const usageResult = await synchronizeMediaAssignment("board_member", data.id, mediaResult.data?.id || null);
  if (usageResult.error) return buildError("Die Vorstandsbild-Verwendung konnte nicht gespeichert werden.");

  revalidateBoardPaths();

  return { error: null };
}

export async function loadBoardMediaPickerAction(filters = {}, boardMemberId = null) {
  const auth = await authorizeBoardMedia(boardMemberId);
  if (!auth.ok) return { ok: false, error: auth.message, items: [], total: 0 };
  const allowed = canManageMedia(auth.permissionResult.roles) ? ["public", "admin"] : ["public"];
  const visibility = allowed.includes(filters.visibility) ? filters.visibility : allowed;
  const purpose = normalizePickerPurpose(filters.purpose, "board");
  const result = await loadMediaLibrary({ ...filters, kind: "image", visibility, purpose, archived: "active" });
  return result.error ? { ok: false, error: "Medien konnten nicht geladen werden.", items: [], total: 0 } : { ok: true, items: result.data, total: result.count || 0 };
}

export async function uploadBoardMediaAction(formData, boardMemberId = null) {
  const auth = await authorizeBoardMedia(boardMemberId);
  if (!auth.ok) return { ok: false, error: auth.message };
  const file = formData.get("file");
  if (!file || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) return { ok: false, error: "FÃ¼r Vorstandsbilder sind nur JPEG, PNG und WebP erlaubt." };
  const result = await uploadMediaAsset(file, { displayName: formData.get("displayName"), altText: formData.get("altText"), visibility: "public", purpose: "board" }, auth.permissionResult.profile.id);
  if (result.error) return { ok: false, error: SAFE_MEDIA_ERRORS.has(result.error.message) ? result.error.message : "Das Vorstandsbild konnte nicht hochgeladen werden." };
  const resolved = await resolveEntityImageMedia(result.data.id, { purpose: "board" });
  return resolved.error ? { ok: false, error: "Das hochgeladene Bild konnte nicht geladen werden." } : { ok: true, item: resolved.data };
}

export async function removeBoardMemberWithScopeAction(boardMemberId) {
  const permissionResult = await assertAdminActionPermission({
    requiredPermission: "board.delete",
  });

  if (!permissionResult.ok) {
    return buildError(permissionResult.message || "Berechtigung fehlt.");
  }

  const scopeContext = await loadServerPersonScopeContext(permissionResult);
  const supabaseServer = permissionResult.supabaseServer;

  if (!canDeleteBoardMemberOnServer(scopeContext)) {
    return buildError("Du darfst keine Vorstandsmitglieder loeschen.");
  }

  const existingMember = await loadBoardMemberById(
    supabaseServer,
    boardMemberId,
  );
  if (!existingMember) {
    return buildError("Vorstandsmitglied nicht gefunden.");
  }
  if (!canEditBoardMemberOnServer(scopeContext, existingMember)) return buildError("Du darfst dieses Vorstandsprofil nicht löschen.");

  const db = createSupabaseAdminClient();
  if (!db) return buildError("Vorstands-Service ist nicht konfiguriert.");
  const result = await db.from("board_members").delete().eq("id", boardMemberId);

  if (!result.error) {
    revalidateBoardPaths();
  }

  return result;
}
