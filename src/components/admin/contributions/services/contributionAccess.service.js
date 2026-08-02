import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import { createSupabaseAdminClient } from "@/lib/supabase.admin";
import { CONTRIBUTION_ACTION_CODES } from "../core/contributionConstants";
import { buildContributionError } from "./actionResult";

function mapPermissionFailure(result) {
  if (result?.reason === "no-session") {
    return buildContributionError(
      CONTRIBUTION_ACTION_CODES.UNAUTHORIZED,
      result.message || "Keine aktive Session.",
    );
  }

  return buildContributionError(
    CONTRIBUTION_ACTION_CODES.FORBIDDEN,
    result?.message || "Berechtigung fehlt.",
  );
}

export async function resolveContributionServerContext(requiredPermission) {
  const permissionResult = await assertAdminActionPermission({
    requiredPermission,
  });

  if (!permissionResult.ok) {
    return {
      ok: false,
      result: mapPermissionFailure(permissionResult),
    };
  }

  const adminClient = createSupabaseAdminClient();
  if (!adminClient) {
    return {
      ok: false,
      result: buildContributionError(
        CONTRIBUTION_ACTION_CODES.DATABASE_ERROR,
        "Der serverseitige Beitragszugriff ist nicht konfiguriert.",
      ),
    };
  }

  return {
    ok: true,
    auth: permissionResult,
    actorProfileId: permissionResult.profile?.id || null,
    readClient: adminClient,
    writeClient: adminClient,
  };
}
