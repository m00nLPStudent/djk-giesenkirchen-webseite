export const TABLE_TENNIS_DEPARTMENT_SLUG = "tischtennis";
export const TABLE_TENNIS_COMPETITION_STATUS = "external_integration_deferred";

const text = (value) => String(value || "").trim();

export function publicMediaUrlsOrEmpty(result) {
  return result?.error || !(result?.data instanceof Map) ? new Map() : result.data;
}

export function mergePublicTableTennisSummaries(teams = [], details = []) {
  return teams.map((team, index) => ({
    ...team,
    imageUrl: details[index]?.data?.team?.imageUrl || team.imageUrl || null,
    training: details[index]?.data?.training || [],
    contact: details[index]?.data?.contact || null,
  }));
}

export function buildPublicTableTennisTeamHref(slug) {
  return `/tischtennis/mannschaften/${encodeURIComponent(text(slug))}`;
}

export function normalizePublicTableTennisTeamSlug(value) {
  const raw = text(value);
  if (!raw) return null;
  try {
    const decoded = decodeURIComponent(raw).trim();
    return decoded && !decoded.includes("/") && !decoded.includes("\\") && !decoded.includes("\0") ? decoded : null;
  } catch {
    return null;
  }
}

export function selectCurrentPublicSeason(seasons = []) {
  const active = seasons.filter((season) => season?.is_active === true);
  return active.find((season) => season.is_current === true) || active[0] || null;
}

export function isDepartmentCompatible(record, departmentId) {
  return Boolean(departmentId && record?.department_id === departmentId);
}

export function selectPublicTableTennisTeams({ teams = [], teamSeasons = [], departmentId, season } = {}) {
  if (!departmentId || !season?.id) return [];
  const seasonByTeam = new Map(
    teamSeasons
      .filter((item) => item?.is_active === true && item.season_id === season.id)
      .map((item) => [item.team_id, item]),
  );

  return teams
    .filter((team) => team?.is_active === true && isDepartmentCompatible(team, departmentId))
    .filter((team) => seasonByTeam.has(team.id))
    .map((team) => ({ team, teamSeason: seasonByTeam.get(team.id), season }))
    .sort((left, right) =>
      (left.team.sort_order ?? Number.MAX_SAFE_INTEGER) - (right.team.sort_order ?? Number.MAX_SAFE_INTEGER)
      || text(left.team.name_de).localeCompare(text(right.team.name_de), "de"),
    );
}

export function normalizePublicTableTennisTraining(item, today = new Date().toISOString().slice(0, 10)) {
  if (item?.is_active !== true) return null;
  if (item.effective_from && item.effective_from > today) return null;
  if (item.effective_until && item.effective_until < today) return null;
  return {
    id: item.id,
    weekday: item.weekday,
    startTime: item.start_time || null,
    endTime: item.end_time || null,
    trainingType: item.training_type || null,
    locationType: item.training_location_type || null,
    locationName: item.location_name || null,
    locationAddress: item.location_address || null,
    locationCity: item.location_city || null,
    effectiveFrom: item.effective_from || null,
    effectiveUntil: item.effective_until || null,
  };
}

export function selectPublicTableTennisRoster(assignments = [], departmentId) {
  const seen = new Set();
  return assignments.flatMap((assignment) => {
    const player = Array.isArray(assignment?.players) ? assignment.players[0] : assignment?.players;
    if (assignment?.is_active !== true || player?.is_active !== true || !isDepartmentCompatible(player, departmentId) || seen.has(player.id)) return [];
    seen.add(player.id);
    return [{
      id: player.id,
      name: text(`${player.first_name || ""} ${player.last_name || ""}`),
      description: player.description_de || null,
      yearGroup: player.year_group || null,
      strongHand: player.strong_hand || null,
      imageMediaAssetId: player.image_media_asset_id || null,
      legacyImageUrl: player.image_url || player.photo_url || null,
      sortOrder: assignment.sort_order ?? null,
    }];
  }).sort((a, b) => (a.sortOrder ?? Number.MAX_SAFE_INTEGER) - (b.sortOrder ?? Number.MAX_SAFE_INTEGER) || a.name.localeCompare(b.name, "de"));
}

export function selectPublicTableTennisCoaches(assignments = [], departmentId) {
  const seen = new Set();
  return assignments.flatMap((assignment) => {
    const coach = Array.isArray(assignment?.coaches) ? assignment.coaches[0] : assignment?.coaches;
    if (assignment?.is_active !== true || coach?.is_active !== true || !isDepartmentCompatible(coach, departmentId) || seen.has(coach.id)) return [];
    seen.add(coach.id);
    return [{
      id: coach.id,
      name: text(coach.name || `${coach.first_name || ""} ${coach.last_name || ""}`),
      role: assignment.role_de || coach.role_de || coach.role || null,
      license: coach.license || null,
      email: coach.email || null,
      phone: coach.phone || null,
      whatsapp: coach.whatsapp || null,
      imageMediaAssetId: coach.image_media_asset_id || null,
      legacyImageUrl: coach.image_url || coach.photo_url || null,
      sortOrder: assignment.sort_order ?? null,
    }];
  }).sort((a, b) => (a.sortOrder ?? Number.MAX_SAFE_INTEGER) - (b.sortOrder ?? Number.MAX_SAFE_INTEGER) || a.name.localeCompare(b.name, "de"));
}

export function selectPublicTableTennisBoard(members = [], departmentId) {
  return members
    .filter((member) => member?.is_active === true && member.organization_scope === "department" && isDepartmentCompatible(member, departmentId))
    .map((member) => ({
      id: member.id,
      name: text(`${member.first_name || ""} ${member.last_name || ""}`),
      role: member.board_roles?.name_de || member.role_de || null,
      email: member.email || null,
      phone: member.phone || null,
      imageMediaAssetId: member.image_media_asset_id || null,
      legacyImageUrl: member.image_url || null,
      sortOrder: member.sort_order ?? null,
    }))
    .sort((a, b) => (a.sortOrder ?? Number.MAX_SAFE_INTEGER) - (b.sortOrder ?? Number.MAX_SAFE_INTEGER) || a.name.localeCompare(b.name, "de"));
}

export function resolvePublicTableTennisContact({ team } = {}) {
  if (team && (team.contact_email || team.contact_phone)) {
    return {
      source: "team",
      name: team.contact_name || null,
      email: team.contact_email || null,
      phone: team.contact_phone || null,
      whatsapp: null,
      imageMediaAssetId: team.contact_image_media_asset_id || null,
      legacyImageUrl: team.contact_image_url || null,
    };
  }
  return null;
}

export function applyPublicMediaUrl(item, mediaUrls = new Map()) {
  if (!item) return null;
  return {
    ...item,
    imageUrl: item.imageMediaAssetId
      ? mediaUrls.get(item.imageMediaAssetId) || null
      : item.legacyImageUrl || null,
  };
}

export function resolvePublicTableTennisTeamImage({ team = {}, teamSeason = {}, mediaUrls = new Map() } = {}) {
  if (teamSeason.team_image_media_asset_id) return mediaUrls.get(teamSeason.team_image_media_asset_id) || null;
  if (teamSeason.team_image_url) return teamSeason.team_image_url;
  if (team.team_image_media_asset_id) return mediaUrls.get(team.team_image_media_asset_id) || null;
  return team.team_image_url || null;
}

export function createPublicTableTennisTeamDto({ team, teamSeason, season, imageUrl = null } = {}) {
  return {
    id: team.id,
    slug: team.slug,
    name: teamSeason?.name_de || team.name_de,
    description: teamSeason?.description_de || team.description_de || null,
    sortOrder: team.sort_order ?? null,
    season: season ? { id: season.id, name: season.name || season.name_de || null } : null,
    imageUrl,
    contactSummary: team.contact_name || null,
  };
}
