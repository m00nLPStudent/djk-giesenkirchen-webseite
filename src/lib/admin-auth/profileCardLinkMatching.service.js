import {
  fetchAdminProfileById,
  fetchAdminProfiles,
} from "@/lib/admin-auth/adminProfiles.repository";
import {
  getBoardMemberLinkForProfile,
  getCoachLinkForProfile,
  listBoardMembersForLinking,
  listCoachesForLinking,
  normalizeEmailForCardMatching,
} from "@/lib/admin-auth/profileCardLinks.repository";

function buildResult(status, matches = [], warning = null) {
  return {
    status,
    matches,
    warning,
  };
}

function maskEmail(value = "") {
  const normalized = normalizeEmailForCardMatching(value);
  if (!normalized) return "";

  const [localPart, domainPart] = normalized.split("@");
  if (!localPart || !domainPart) return "***";

  const left = localPart.slice(0, 1);
  const right = localPart.slice(-1);
  return `${left}***${right}@${domainPart}`;
}

function evaluateMatches(candidates = [], adminProfileId) {
  if (!candidates.length) {
    return buildResult("no_match", []);
  }

  if (candidates.length > 1) {
    return buildResult(
      "ambiguous_match",
      candidates,
      "Mehrere exakte Treffer gefunden. Keine automatische Zuordnung.",
    );
  }

  const [candidate] = candidates;

  if (!candidate.admin_profile_id) {
    return buildResult("exact_match", [candidate]);
  }

  if (candidate.admin_profile_id === adminProfileId) {
    return buildResult("already_linked", [candidate]);
  }

  return buildResult(
    "already_linked",
    [candidate],
    "Treffer ist bereits einem anderen Profil zugeordnet.",
  );
}

function toMatchCandidate(row = {}) {
  return {
    id: row.id || null,
    label: row.label || "Unbenannte Kachel",
    admin_profile_id: row.admin_profile_id || null,
    email_masked: maskEmail(row.email || ""),
  };
}

export async function previewProfileCardEmailMatches(adminProfileId, client) {
  if (!adminProfileId) {
    return {
      ok: false,
      message: "Ungueltige Profil-ID.",
      board: buildResult("no_match"),
      coach: buildResult("no_match"),
    };
  }

  const { data: profile, error: profileError } = await fetchAdminProfileById(
    adminProfileId,
    client,
  );

  if (profileError) {
    return {
      ok: false,
      message: "Profil konnte nicht geladen werden.",
      board: buildResult("no_match"),
      coach: buildResult("no_match"),
      error: profileError,
    };
  }

  const allProfilesResult = await fetchAdminProfiles(client);
  if (allProfilesResult.error) {
    return {
      ok: false,
      message: "Profile konnten nicht geladen werden.",
      board: buildResult("no_match"),
      coach: buildResult("no_match"),
      error: allProfilesResult.error,
    };
  }

  const normalizedProfileEmail = normalizeEmailForCardMatching(
    profile?.email || "",
  );
  if (!normalizedProfileEmail) {
    return {
      ok: true,
      profileEmailMasked: "",
      board: buildResult("no_match", [], "Profil hat keine matchbare E-Mail."),
      coach: buildResult("no_match", [], "Profil hat keine matchbare E-Mail."),
    };
  }

  const duplicateProfiles = (allProfilesResult.data || []).filter((entry) => {
    if (!entry?.id || entry.id === adminProfileId) return false;
    return (
      normalizeEmailForCardMatching(entry.email || "") ===
      normalizedProfileEmail
    );
  });

  const [
    boardListResult,
    coachListResult,
    boardLinkedResult,
    coachLinkedResult,
  ] = await Promise.all([
    listBoardMembersForLinking(client),
    listCoachesForLinking(client),
    getBoardMemberLinkForProfile(adminProfileId, client),
    getCoachLinkForProfile(adminProfileId, client),
  ]);

  if (boardListResult.error || coachListResult.error) {
    return {
      ok: false,
      message: "Kachel-Liste konnte nicht geladen werden.",
      board: buildResult("no_match"),
      coach: buildResult("no_match"),
      error: boardListResult.error || coachListResult.error,
    };
  }

  const boardCandidates = (boardListResult.data || [])
    .filter(
      (row) =>
        normalizeEmailForCardMatching(row.email || "") ===
        normalizedProfileEmail,
    )
    .map(toMatchCandidate);

  const coachCandidates = (coachListResult.data || [])
    .filter(
      (row) =>
        normalizeEmailForCardMatching(row.email || "") ===
        normalizedProfileEmail,
    )
    .map(toMatchCandidate);

  let board = evaluateMatches(boardCandidates, adminProfileId);
  let coach = evaluateMatches(coachCandidates, adminProfileId);

  if (boardLinkedResult.data?.id) {
    board = buildResult("already_linked", [
      toMatchCandidate(boardLinkedResult.data),
    ]);
  }

  if (coachLinkedResult.data?.id) {
    coach = buildResult("already_linked", [
      toMatchCandidate(coachLinkedResult.data),
    ]);
  }

  const duplicateWarning = duplicateProfiles.length
    ? "Mehrere Admin-Profile teilen dieselbe normalisierte E-Mail. Keine automatische Zuordnung."
    : null;

  return {
    ok: true,
    profileEmailMasked: maskEmail(profile?.email || ""),
    duplicateProfileCount: duplicateProfiles.length,
    duplicateProfileWarning: duplicateWarning,
    board,
    coach,
  };
}
