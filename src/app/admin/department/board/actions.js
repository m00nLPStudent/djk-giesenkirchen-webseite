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

export async function saveBoardMemberWithScopeAction(
  memberPayload,
  boardMemberId = null,
) {
  const permissionResult = await assertAdminActionPermission({
    requiredPermission: boardMemberId ? "settings.view" : "settings.edit",
  });

  if (!permissionResult.ok) {
    return buildError(permissionResult.message || "Berechtigung fehlt.");
  }

  const scopeContext = await loadServerPersonScopeContext(permissionResult);
  const supabaseServer = permissionResult.supabaseServer;

  if (boardMemberId) {
    const member = await loadBoardMemberById(supabaseServer, boardMemberId);
    if (!member) {
      return buildError("Vorstandsmitglied nicht gefunden.");
    }

    if (!canEditBoardMemberOnServer(scopeContext, member)) {
      return buildError("Du darfst dieses Vorstandsprofil nicht bearbeiten.");
    }
  } else if (!canCreateBoardMemberOnServer(scopeContext)) {
    return buildError("Du darfst keine Vorstandsmitglieder erstellen.");
  }

  const { error } = await saveBoardMember(memberPayload || {}, boardMemberId, {
    client: supabaseServer,
  });

  if (error) {
    return buildError(error.message || "Fehler beim Speichern.");
  }

  revalidatePath("/admin/department");

  return { error: null };
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

  const result = await supabaseServer.rpc("remove_entity", {
    entity_type: "board_member",
    entity_uuid: boardMemberId,
  });

  if (!result.error) {
    revalidatePath("/admin/department");
  }

  return result;
}
