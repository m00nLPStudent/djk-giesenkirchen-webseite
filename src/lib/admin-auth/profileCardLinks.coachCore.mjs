import { createCoachReadDto } from "../../components/admin/persons/coachReadDto.js";
import {
  buildCurrentSeasonResolution,
  createCoachSeasonalReadModelMap,
  toUniqueIds,
} from "../../components/admin/persons/seasonalReadModelCore.mjs";
import { createCardRow } from "./profileCardLinks.core.mjs";

function normalizeString(value) {
  return typeof value === "string" && value.trim() ? value : null;
}

export function buildCoachAssignmentsByCoachId(
  assignmentRows = [],
  teamSeasonRows = [],
  activeSeasonId = null,
) {
  if (!activeSeasonId) return new Map();

  const teamSeasonsById = new Map(
    (teamSeasonRows || []).map((row) => [row.id, row]),
  );

  return (assignmentRows || []).reduce((map, row) => {
    const teamSeason = teamSeasonsById.get(row?.team_season_id);
    if (
      !row?.coach_id ||
      !teamSeason?.id ||
      teamSeason.is_active === false ||
      teamSeason.season_id !== activeSeasonId
    ) {
      return map;
    }

    const assignments = map.get(row.coach_id) || [];
    assignments.push({
      coachId: row.coach_id,
      coachTeamSeasonId: row.id || null,
      teamSeasonId: teamSeason.id,
      teamId: teamSeason.team_id || null,
      teamNameDe: normalizeString(teamSeason.name_de),
      teamNameEn: normalizeString(teamSeason.name_en),
      teamSlug: normalizeString(teamSeason.slug),
      roleDe: normalizeString(row.role_de),
      roleEn: normalizeString(row.role_en),
      isActive: row.is_active !== false,
      sortOrder: row.sort_order ?? null,
      createdAt: row.created_at ?? null,
    });
    map.set(row.coach_id, assignments);
    return map;
  }, new Map());
}

export function createCoachCardRows(
  rows = [],
  { currentSeasonRows = [], assignmentRows = [], teamSeasonRows = [] } = {},
) {
  const coachIds = toUniqueIds((rows || []).map((row) => row?.id));
  const seasonResolution = buildCurrentSeasonResolution(currentSeasonRows);
  const assignmentsByCoachId = buildCoachAssignmentsByCoachId(
    assignmentRows,
    teamSeasonRows,
    seasonResolution.activeSeasonId,
  );
  const readModels = createCoachSeasonalReadModelMap({
    coachIds,
    seasonResolution,
    assignmentsByCoachId,
  });

  return (rows || []).map((row) => {
    const coachDto = createCoachReadDto(row, readModels.get(row.id) || {});
    return createCardRow(row, "coach", { coachDto });
  });
}
