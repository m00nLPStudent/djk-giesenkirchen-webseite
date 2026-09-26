import { PUBLIC_SITE_LOGO_URL, PUBLIC_SITE_NAME } from "../../../config/publicSite.js";

const DEPARTMENT_ORDER = Object.freeze({ fussball: 0, tischtennis: 1 });
const numberOrLast = (value) => Number.isFinite(Number(value)) ? Number(value) : Number.MAX_SAFE_INTEGER;

export function isPublicResultVisible(row, now = new Date()) {
  if (!row?.is_published || Number.isNaN(now.getTime())) return false;
  const start = new Date(row.visible_from || row.played_at);
  const end = new Date(row.visible_until || (new Date(row.played_at).getTime() + 7 * 86400000));
  return !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && now >= start && now < end;
}

export function sortPublicResults(rows = []) {
  return [...rows].sort((left, right) =>
    (DEPARTMENT_ORDER[left.departmentSlug] ?? 99) - (DEPARTMENT_ORDER[right.departmentSlug] ?? 99)
    || numberOrLast(left.teamSortOrder) - numberOrLast(right.teamSortOrder)
    || numberOrLast(left.teamSeasonSortOrder) - numberOrLast(right.teamSeasonSortOrder)
    || new Date(right.playedAt).getTime() - new Date(left.playedAt).getTime()
    || String(left.id).localeCompare(String(right.id)),
  );
}

export function createPublicResultDto(row, opponentLogoUrl = null) {
  const teamSeason = row?.team_seasons;
  const team = teamSeason?.teams;
  const department = team?.departments;
  if (!row?.id || !teamSeason?.id || !team?.id || !["fussball", "tischtennis"].includes(department?.slug)) return null;

  const club = { name: PUBLIC_SITE_NAME, logoUrl: PUBLIC_SITE_LOGO_URL };
  const opponent = { name: row.opponent_name, logoUrl: opponentLogoUrl || null };
  const home = row.club_is_home ? club : opponent;
  const away = row.club_is_home ? opponent : club;

  return {
    id: row.id,
    departmentSlug: department.slug,
    teamName: teamSeason.name_de || team.name_de,
    teamSortOrder: team.sort_order,
    teamSeasonSortOrder: teamSeason.sort_order,
    playedAt: row.played_at,
    competitionLabel: row.competition_label || null,
    homeName: home.name,
    awayName: away.name,
    homeScore: row.club_is_home ? row.club_score : row.opponent_score,
    awayScore: row.club_is_home ? row.opponent_score : row.club_score,
    homeLogoUrl: home.logoUrl,
    awayLogoUrl: away.logoUrl,
  };
}

export function createPublicResultDtos(rows = [], logoUrls = new Map()) {
  return sortPublicResults(rows.map((row) => createPublicResultDto(row, logoUrls.get(row.opponent_logo_media_asset_id) || null)).filter(Boolean));
}
