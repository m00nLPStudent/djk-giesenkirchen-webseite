import {
  matchesActiveStatus,
  matchesSearch,
  uniqueValues,
} from "../../utils/list.js";

export function calculateAge(birthdate) {
  if (!birthdate) return null;

  const birthday = new Date(birthdate);
  const today = new Date();
  let age = today.getFullYear() - birthday.getFullYear();
  const monthDiff = today.getMonth() - birthday.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthday.getDate())) {
    age = age - 1;
  }

  return age;
}

export function comparePlayersByIdentity(a = {}, b = {}) {
  const lastName = String(a.last_name || "").localeCompare(String(b.last_name || ""));
  if (lastName !== 0) return lastName;

  const firstName = String(a.first_name || "").localeCompare(String(b.first_name || ""));
  if (firstName !== 0) return firstName;

  return String(a.id || "").localeCompare(String(b.id || ""));
}

export function sortPlayersByIdentity(players = []) {
  return [...players].sort(comparePlayersByIdentity);
}

export function sortPlayers(players, sortBy) {
  return [...players].sort((a, b) => {
    const nameA = `${a.last_name || ""} ${a.first_name || ""}`.toLowerCase();
    const nameB = `${b.last_name || ""} ${b.first_name || ""}`.toLowerCase();
    const teamA = getPrimaryTeamName(a).toLowerCase();
    const teamB = getPrimaryTeamName(b).toLowerCase();
    const positionA = getPrimaryPosition(a).toLowerCase();
    const positionB = getPrimaryPosition(b).toLowerCase();
    const ageA = calculateAge(a.birthdate);
    const ageB = calculateAge(b.birthdate);

    if (sortBy === "name_desc") return nameB.localeCompare(nameA);
    if (sortBy === "shirt_number") return (a.shirt_number || 999) - (b.shirt_number || 999);
    if (sortBy === "age_asc") return (ageA ?? 999) - (ageB ?? 999);
    if (sortBy === "age_desc") return (ageB ?? -1) - (ageA ?? -1);
    if (sortBy === "year_group") {
      return (
        String(a.year_group || "9999").localeCompare(String(b.year_group || "9999")) ||
        comparePlayersByIdentity(a, b)
      );
    }
    if (sortBy === "team") {
      return teamA.localeCompare(teamB) || comparePlayersByIdentity(a, b);
    }
    if (sortBy === "position") {
      return positionA.localeCompare(positionB) || comparePlayersByIdentity(a, b);
    }
    if (sortBy === "created_at") {
      return new Date(b.created_at || 0) - new Date(a.created_at || 0) || comparePlayersByIdentity(a, b);
    }

    return comparePlayersByIdentity(a, b);
  });
}

function getAssignments(player = {}) {
  return Array.isArray(player.assignments) ? player.assignments : [];
}

function getPlayerTeamIds(player = {}) {
  return [...new Set(getAssignments(player).map((assignment) => assignment?.teamId).filter(Boolean))];
}

function getPrimaryTeamName(player = {}) {
  return (
    player.primaryAssignment?.teamNameDe ||
    player.primaryAssignment?.teamNameEn ||
    player.teams?.name_de ||
    player.primaryTeamName ||
    ""
  );
}

function getPlayerPositionsForFilter(player = {}) {
  const assignmentPositions = getAssignments(player)
    .map((assignment) => assignment?.positionDe || assignment?.positionEn)
    .filter(Boolean);

  return [...new Set(assignmentPositions)];
}

function getPrimaryPosition(player = {}) {
  return (
    player.primaryAssignment?.positionDe ||
    player.primaryAssignment?.positionEn ||
    ""
  );
}

function isCaptain(player = {}) {
  return getAssignments(player).some((assignment) => assignment?.isCaptain);
}

export function getPlayerTeams(players = []) {
  const teamOptions = new Map();

  players.forEach((player) => {
    getAssignments(player).forEach((assignment) => {
      if (!assignment?.teamId) return;

      const label =
        assignment.teamNameDe ||
        assignment.teamNameEn ||
        player.primaryTeamName ||
        "Keine Mannschaft";

      teamOptions.set(assignment.teamId, label);
    });
  });

  return [...teamOptions.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => String(a.name).localeCompare(String(b.name)));
}

export function getPlayerPositions(players = []) {
  return uniqueValues(
    players.flatMap((player) => getPlayerPositionsForFilter(player)),
    (position) => position,
  );
}

export function filterPlayers(players = [], filters = {}) {
  const {
    search = "",
    statusFilter = "all",
    teamFilter = "all",
    genderFilter = "all",
    nationalityFilter = "all",
    positionFilter = "all",
    captainFilter = "all",
    sortBy = "name_asc",
  } = filters;

  const result = players.filter((player) => {
    if (
      !matchesSearch(
        [
          player.first_name,
          player.last_name,
          player.shirt_number,
          getPrimaryPosition(player),
          player.year_group,
          getPrimaryTeamName(player),
          ...(player.teamNames || []),
        ],
        search,
      )
    ) {
      return false;
    }

    if (!matchesActiveStatus(player, statusFilter)) return false;
    if (teamFilter !== "all" && !getPlayerTeamIds(player).includes(teamFilter)) {
      return false;
    }
    if (genderFilter !== "all" && player.gender !== genderFilter) return false;
    if (nationalityFilter !== "all" && player.nationality !== nationalityFilter) return false;
    if (
      positionFilter !== "all" &&
      !getPlayerPositionsForFilter(player).includes(positionFilter)
    ) {
      return false;
    }
    if (captainFilter === "captain" && !isCaptain(player)) return false;
    if (captainFilter === "not_captain" && isCaptain(player)) return false;

    return true;
  });

  return sortPlayers(result, sortBy);
}
