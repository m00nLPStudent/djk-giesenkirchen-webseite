import {
  formatSupabaseError,
  isLikelyRlsError,
} from "@/lib/admin-auth/adminDiagnostics";
import { withRlsHint } from "./usersActionWriteHelpers";

export function toLinkIntent(value) {
  if (value === undefined) return { mode: "unchanged", id: null };
  if (value === null) return { mode: "unlink", id: null };
  const normalized = String(value || "").trim();
  if (!normalized) return { mode: "unlink", id: null };
  return { mode: "link", id: normalized };
}

export function logHelperIntent(field, intent, unlinkRepositoryCalled) {
  if (process.env.NODE_ENV !== "development") return;
  console.log("[B12.2a-1.1][CardLink][Helper]", {
    field,
    intent,
    unlinkRepositoryCalled,
  });
}

export function logUnlinkWrite(stage) {
  if (process.env.NODE_ENV !== "development") return;
  console.log("[B12.2a-1.2][CardLink][UnlinkWrite]", stage);
}

export function mapError(message, error) {
  return {
    ok: false,
    reason: isLikelyRlsError(error?.message || "")
      ? "rls-blocked"
      : "write-failed",
    message: withRlsHint(message),
    error,
  };
}

export async function executeUnlinkByProfile({
  field,
  adminProfileId,
  unlinkRepository,
  failureMessage,
}) {
  logUnlinkWrite({
    field,
    unlinkIntentReceived: true,
    adminProfileIdPresent: Boolean(adminProfileId),
    repositoryCalled: true,
    filterColumn: "admin_profile_id",
  });

  let unlinkResult;
  try {
    unlinkResult = await unlinkRepository(adminProfileId);
  } catch (error) {
    logUnlinkWrite({
      field,
      supabaseErrorCode: error?.code || null,
      hasErrorMessage: Boolean(error?.details || error?.message),
    });
    return {
      ok: false,
      mappedError: mapError(formatSupabaseError(error, failureMessage), error),
    };
  }

  const rows = unlinkResult?.rows || [];
  const rowsUpdated = unlinkResult?.rowsUpdated || 0;
  const allRowsUnlinked = rows.every((row) => row?.admin_profile_id === null);
  logUnlinkWrite({
    field,
    rowsUpdated,
    returnedRowsCount: rows.length,
    returnedRowsAllNull: allRowsUnlinked,
  });

  if (rowsUpdated < 1 || !allRowsUnlinked) {
    return { ok: false, mappedError: null };
  }

  return { ok: true };
}
