"use server";

import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import {
  canCreateBoardMemberOnServer,
  canDeleteBoardMemberOnServer,
  canEditBoardMemberOnServer,
  loadServerPersonScopeContext,
} from "@/components/admin/persons/serverPersonScope";
import { saveBoardMember } from "@/components/admin/board/services/board.service";
import { revalidatePath } from "next/cache";
import { canManageMedia, loadMediaLibrary, resolveEntityImageMedia, synchronizeMediaAssignment, uploadMediaAsset } from "@/components/admin/media-library/media.service";
import { normalizePickerPurpose } from "@/components/admin/media-library/mediaPurpose.config.mjs";
import { createSupabaseAdminClient } from "@/lib/supabase.admin";

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

async function authorizeBoardMedia(boardMemberId = null) {
  const permissionResult = await assertAdminActionPermission({ requiredPermission: "settings.edit" });
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
) {
  const permissionResult = await assertAdminActionPermission({
    requiredPermission: "settings.edit",
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

  const allowedVisibilities = canManageMedia(permissionResult.roles) ? ["public", "admin"] : ["public"];
  const mediaResult = await resolveEntityImageMedia(memberPayload?.image_media_asset_id || null, { allowArchived: Boolean(existingMember?.image_media_asset_id === memberPayload?.image_media_asset_id), allowedVisibilities });
  if (mediaResult.error) return buildError(mediaResult.error.message);
  const { data, error } = await saveBoardMember(memberPayload || {}, boardMemberId, {
    client: supabaseServer,
  });

  if (error) {
    return buildError(error.message || "Fehler beim Speichern.");
  }
  const usageResult = await synchronizeMediaAssignment("board_member", data.id, mediaResult.data?.id || null);
  if (usageResult.error) return buildError("Die Vorstandsbild-Verwendung konnte nicht gespeichert werden.");

  revalidatePath("/admin/department");

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
    requiredPermission: "settings.edit",
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

  const db = createSupabaseAdminClient();
  if (!db) return buildError("Vorstands-Service ist nicht konfiguriert.");
  const result = await db.from("board_members").delete().eq("id", boardMemberId);

  if (!result.error) {
    revalidatePath("/admin/department");
  }

  return result;
}
