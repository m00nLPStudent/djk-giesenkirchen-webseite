import { buildTeamCoachSelectionState } from "@/components/admin/teams/teamCoachAssignments.core.mjs";

export const TEAM_FORM_TABS = [
  { id: "season", label: "Saison" },
  { id: "base", label: "Mannschaft" },
  { id: "description", label: "Beschreibung" },
  { id: "training", label: "Trainingszeiten" },
  { id: "players", label: "Kader" },
  { id: "staff", label: "Trainer" },
  { id: "competition", label: "Spielbetrieb" },
  { id: "contact", label: "Kontakt" },
  { id: "media", label: "Medien" },
  { id: "settings", label: "Einstellungen" },
];

export function getCurrentSeason(seasons = []) {
  const currentSeasons = (seasons || []).filter((season) => season.is_current);
  return currentSeasons.length === 1 ? currentSeasons[0] : null;
}

export function findTeamSeason(teamSeasons = [], seasonId) {
  return (
    teamSeasons.find((teamSeason) => teamSeason.season_id === seasonId) || null
  );
}

export function getAssignedIds(assignments = [], teamSeasonId, fieldName) {
  if (!teamSeasonId) return [];

  return assignments
    .filter((assignment) => assignment.team_season_id === teamSeasonId)
    .map((assignment) => assignment[fieldName])
    .filter(Boolean);
}

export function getPersonName(person = {}) {
  const fullName =
    `${person.first_name || ""} ${person.last_name || ""}`.trim();
  return fullName || person.name || person.name_de || "Ohne Namen";
}

export function belongsToTeam(item = {}, teamId) {
  if (!teamId) return true;
  return !item.team_id || item.team_id === teamId;
}

export function buildCoachTeamState({
  coaches = [],
  coachAssignments = [],
  currentSeasonCoachAssignments = [],
  teamSeasonId = null,
}) {
  return buildTeamCoachSelectionState({
    coaches,
    coachAssignments,
    currentSeasonCoachAssignments,
    teamSeasonId,
  });
}
