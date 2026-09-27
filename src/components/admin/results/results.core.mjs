const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const RESULT_DEPARTMENT_SLUGS = Object.freeze(["fussball", "tischtennis"]);

const clean = (value) => String(value ?? "").trim();
const validDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};
const score = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= 0 && number <= 32767 ? number : null;
};

export function resolveResultDepartmentSlugs(scopeContext = {}) {
  const roles = new Set(scopeContext.roleKeys || []);
  if (scopeContext.isGlobal || roles.has("superadmin") || roles.has("webmaster")) {
    return [...RESULT_DEPARTMENT_SLUGS];
  }
  if (scopeContext.canAccessYouthAll || (scopeContext.roleScopeTypes || []).includes("youth_all")) {
    return ["fussball"];
  }
  return RESULT_DEPARTMENT_SLUGS.includes(scopeContext.managedDepartmentSlug)
    ? [scopeContext.managedDepartmentSlug]
    : [];
}

export function canAccessResultDepartment(scopeContext, departmentSlug) {
  return resolveResultDepartmentSlugs(scopeContext).includes(departmentSlug);
}

export function canAccessResultTeamSeason(scopeContext, teamSeason) {
  return Boolean(
    teamSeason?.is_active === true &&
    teamSeason?.teams?.is_active === true &&
    teamSeason?.teams?.departments?.is_active === true &&
    teamSeason?.seasons?.is_active === true &&
    canAccessResultDepartment(scopeContext, teamSeason?.teams?.departments?.slug),
  );
}

export function validateResultInput(input = {}) {
  const errors = {};
  const teamSeasonId = clean(input.teamSeasonId);
  const opponentName = clean(input.opponentName);
  const competitionLabel = clean(input.competitionLabel);
  const playedAt = validDate(input.playedAt);
  const clubScore = score(input.clubScore);
  const opponentScore = score(input.opponentScore);
  const useVisibilityOverride = input.useVisibilityOverride === true;
  const visibleFrom = useVisibilityOverride ? validDate(input.visibleFrom) : null;
  const visibleUntil = useVisibilityOverride ? validDate(input.visibleUntil) : null;
  const mediaAssetId = clean(input.opponentLogoMediaAssetId) || null;

  if (!UUID_PATTERN.test(teamSeasonId)) errors.teamSeasonId = "Bitte eine Mannschaftssaison auswählen.";
  if (!opponentName || opponentName.length > 160) errors.opponentName = "Der Gegnername muss 1 bis 160 Zeichen enthalten.";
  if (competitionLabel.length > 120) errors.competitionLabel = "Der Wettbewerb darf höchstens 120 Zeichen enthalten.";
  if (!playedAt) errors.playedAt = "Bitte einen gültigen Spielzeitpunkt angeben.";
  if (clubScore === null) errors.clubScore = "Der Vereinsstand muss eine ganze Zahl ab 0 sein.";
  if (opponentScore === null) errors.opponentScore = "Der Gegnerstand muss eine ganze Zahl ab 0 sein.";
  if (mediaAssetId && !UUID_PATTERN.test(mediaAssetId)) errors.opponentLogoMediaAssetId = "Das Gegnerlogo ist ungültig.";
  if (useVisibilityOverride && (!visibleFrom || !visibleUntil)) errors.visibility = "Für den individuellen Zeitraum sind Beginn und Ende erforderlich.";
  if (visibleFrom && visibleUntil && new Date(visibleUntil) <= new Date(visibleFrom)) errors.visibility = "Das Ende muss nach dem Beginn liegen.";

  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      id: UUID_PATTERN.test(clean(input.id)) ? clean(input.id) : null,
      teamSeasonId,
      competitionLabel: competitionLabel || null,
      playedAt,
      clubIsHome: input.clubIsHome !== false,
      opponentName,
      clubScore,
      opponentScore,
      opponentLogoMediaAssetId: mediaAssetId,
      isPublished: input.isPublished === true,
      visibleFrom,
      visibleUntil,
    },
  };
}

export function getEffectiveVisibility(result) {
  const start = result?.visible_from || result?.played_at || null;
  const end = result?.visible_until || (result?.played_at
    ? new Date(new Date(result.played_at).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
    : null);
  return { start, end, isOverride: Boolean(result?.visible_from && result?.visible_until) };
}

export function isEligibleResultLogo(asset) {
  return Boolean(asset && !asset.is_archived && asset.media_kind === "image" && asset.visibility === "public" && asset.purpose === "result");
}
