import {
  fetchBoardMemberById,
  fetchCoachById,
  getBoardMemberLinkForProfile,
  getCoachLinkForProfile,
  linkBoardMemberToProfile,
  linkCoachToProfile,
  unlinkBoardMemberFromProfile,
  unlinkCoachFromProfile,
} from "@/lib/admin-auth/profileCardLinks.repository";
import { formatSupabaseError } from "@/lib/admin-auth/adminDiagnostics";
import {
  executeUnlinkByProfile,
  logHelperIntent,
  logUnlinkWrite,
  mapError,
  toLinkIntent,
} from "./usersActionProfileCardLinkDiagnostics";

async function rollbackBoardLink(previousBoardId, profileId, supabaseServer) {
  if (!previousBoardId || !profileId) return;
  await linkBoardMemberToProfile(previousBoardId, profileId, supabaseServer);
}

async function rollbackCoachLink(previousCoachId, profileId, supabaseServer) {
  if (!previousCoachId || !profileId) return;
  await linkCoachToProfile(previousCoachId, profileId, supabaseServer);
}
export async function applyBoardMemberLinkForProfile({
  adminProfileId,
  boardMemberId,
  supabaseServer,
}) {
  const intent = toLinkIntent(boardMemberId);
  if (intent.mode === "unchanged") {
    logHelperIntent("board", intent.mode, false);
    return { ok: true, changed: false };
  }

  const targetId = intent.id;

  const currentResult = await getBoardMemberLinkForProfile(
    adminProfileId,
    supabaseServer,
  );

  if (currentResult.error) {
    return mapError(
      formatSupabaseError(
        currentResult.error,
        "Aktuelle Vorstandsverknuepfung konnte nicht gelesen werden.",
      ),
      currentResult.error,
    );
  }

  const currentLink = currentResult.data || null;
  logHelperIntent(
    "board",
    intent.mode,
    intent.mode === "unlink" && Boolean(currentLink?.id),
  );

  if (intent.mode === "unlink") {
    if (!currentLink?.id) {
      return { ok: true, changed: false };
    }
    const unlinkExecution = await executeUnlinkByProfile({
      field: "board",
      adminProfileId,
      unlinkRepository: (profileId) =>
        unlinkBoardMemberFromProfile(profileId, supabaseServer),
      failureMessage: "Vorstandsverknuepfung konnte nicht entfernt werden.",
    });

    if (!unlinkExecution.ok && unlinkExecution.mappedError) {
      return unlinkExecution.mappedError;
    }

    if (!unlinkExecution.ok) {
      return {
        ok: false,
        reason: "write-failed",
        message:
          "Vorstandsverknuepfung konnte nicht bestaetigt entfernt werden.",
      };
    }

    return { ok: true, changed: true };
  }

  if (currentLink?.id === targetId) {
    return { ok: true, changed: false };
  }

  const targetResult = await fetchBoardMemberById(targetId, supabaseServer);
  if (targetResult.error) {
    return mapError(
      formatSupabaseError(
        targetResult.error,
        "Vorstandskachel konnte nicht geladen werden.",
      ),
      targetResult.error,
    );
  }

  if (!targetResult.data?.id) {
    return {
      ok: false,
      reason: "not-found",
      message: "Ausgewaehlte Vorstandskachel existiert nicht.",
    };
  }

  if (
    targetResult.data.admin_profile_id &&
    targetResult.data.admin_profile_id !== adminProfileId
  ) {
    return {
      ok: false,
      reason: "already-linked",
      message: "Vorstandskachel ist bereits einem anderen Profil zugeordnet.",
    };
  }

  const previousBoardId = currentLink?.id || null;
  if (previousBoardId && previousBoardId !== targetId) {
    const removeCurrent = await linkBoardMemberToProfile(
      previousBoardId,
      null,
      supabaseServer,
    );

    if (removeCurrent.error) {
      return mapError(
        formatSupabaseError(
          removeCurrent.error,
          "Bisherige Vorstandsverknuepfung konnte nicht geloest werden.",
        ),
        removeCurrent.error,
      );
    }
  }

  const linkTarget = await linkBoardMemberToProfile(
    targetId,
    adminProfileId,
    supabaseServer,
  );

  if (linkTarget.error) {
    logUnlinkWrite({
      field: "board",
      rollbackTriggered: true,
      rollbackReason: "link-target-failed",
    });
    await rollbackBoardLink(previousBoardId, adminProfileId, supabaseServer);
    return mapError(
      formatSupabaseError(
        linkTarget.error,
        "Vorstandskachel konnte nicht verknuepft werden.",
      ),
      linkTarget.error,
    );
  }

  return { ok: true, changed: true };
}

export async function applyCoachLinkForProfile({
  adminProfileId,
  coachId,
  supabaseServer,
}) {
  const intent = toLinkIntent(coachId);
  if (intent.mode === "unchanged") {
    logHelperIntent("coach", intent.mode, false);
    return { ok: true, changed: false };
  }

  const targetId = intent.id;

  const currentResult = await getCoachLinkForProfile(
    adminProfileId,
    supabaseServer,
  );

  if (currentResult.error) {
    return mapError(
      formatSupabaseError(
        currentResult.error,
        "Aktuelle Trainerverknuepfung konnte nicht gelesen werden.",
      ),
      currentResult.error,
    );
  }

  const currentLink = currentResult.data || null;
  logHelperIntent(
    "coach",
    intent.mode,
    intent.mode === "unlink" && Boolean(currentLink?.id),
  );

  if (intent.mode === "unlink") {
    if (!currentLink?.id) {
      return { ok: true, changed: false };
    }
    const unlinkExecution = await executeUnlinkByProfile({
      field: "coach",
      adminProfileId,
      unlinkRepository: (profileId) =>
        unlinkCoachFromProfile(profileId, supabaseServer),
      failureMessage: "Trainerverknuepfung konnte nicht entfernt werden.",
    });

    if (!unlinkExecution.ok && unlinkExecution.mappedError) {
      return unlinkExecution.mappedError;
    }

    if (!unlinkExecution.ok) {
      return {
        ok: false,
        reason: "write-failed",
        message: "Trainerverknuepfung konnte nicht bestaetigt entfernt werden.",
      };
    }

    return { ok: true, changed: true };
  }

  if (currentLink?.id === targetId) {
    return { ok: true, changed: false };
  }

  const targetResult = await fetchCoachById(targetId, supabaseServer);
  if (targetResult.error) {
    return mapError(
      formatSupabaseError(
        targetResult.error,
        "Trainerkachel konnte nicht geladen werden.",
      ),
      targetResult.error,
    );
  }

  if (!targetResult.data?.id) {
    return {
      ok: false,
      reason: "not-found",
      message: "Ausgewaehlte Trainerkachel existiert nicht.",
    };
  }

  if (
    targetResult.data.admin_profile_id &&
    targetResult.data.admin_profile_id !== adminProfileId
  ) {
    return {
      ok: false,
      reason: "already-linked",
      message: "Trainerkachel ist bereits einem anderen Profil zugeordnet.",
    };
  }

  const previousCoachId = currentLink?.id || null;
  if (previousCoachId && previousCoachId !== targetId) {
    const removeCurrent = await linkCoachToProfile(
      previousCoachId,
      null,
      supabaseServer,
    );

    if (removeCurrent.error) {
      return mapError(
        formatSupabaseError(
          removeCurrent.error,
          "Bisherige Trainerverknuepfung konnte nicht geloest werden.",
        ),
        removeCurrent.error,
      );
    }
  }

  const linkTarget = await linkCoachToProfile(
    targetId,
    adminProfileId,
    supabaseServer,
  );

  if (linkTarget.error) {
    logUnlinkWrite({
      field: "coach",
      rollbackTriggered: true,
      rollbackReason: "link-target-failed",
    });
    await rollbackCoachLink(previousCoachId, adminProfileId, supabaseServer);
    return mapError(
      formatSupabaseError(
        linkTarget.error,
        "Trainerkachel konnte nicht verknuepft werden.",
      ),
      linkTarget.error,
    );
  }

  return { ok: true, changed: true };
}

export async function applyProfileCardLinks({
  adminProfileId,
  linkedBoardMemberId,
  linkedCoachId,
  supabaseServer,
}) {
  const boardResult = await applyBoardMemberLinkForProfile({
    adminProfileId,
    boardMemberId: linkedBoardMemberId,
    supabaseServer,
  });

  if (!boardResult.ok) {
    return boardResult;
  }

  const coachResult = await applyCoachLinkForProfile({
    adminProfileId,
    coachId: linkedCoachId,
    supabaseServer,
  });

  if (!coachResult.ok) {
    return coachResult;
  }

  return {
    ok: true,
    changed: Boolean(boardResult.changed || coachResult.changed),
  };
}
