export function normalizeCoachRole(role = "") {
  return String(role)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

export function isTrainerRole(role) {
  const normalized = normalizeCoachRole(role);
  return normalized === "trainer" || normalized === "haupttrainer";
}

export function isCoTrainerRole(role) {
  const normalized = normalizeCoachRole(role);
  return (
    normalized === "co-trainer" ||
    normalized === "cotrainer" ||
    normalized === "co-trainerin" ||
    normalized === "co-trainer/in"
  );
}

export function isSupervisorRole(role) {
  const normalized = normalizeCoachRole(role);
  return (
    normalized === "betreuer" ||
    normalized === "betreuerin" ||
    normalized === "team-betreuer" ||
    normalized === "teammanager"
  );
}

function getCoachAssignments(coach = {}) {
  return Array.isArray(coach.assignments) ? coach.assignments : [];
}

function getCoachRoleLabels(coach = {}) {
  if (Array.isArray(coach.roleLabels) && coach.roleLabels.length > 0) {
    return coach.roleLabels;
  }

  return [coach.primaryRoleLabel].filter(Boolean);
}

function getCoachTeamIds(coach = {}) {
  return Array.from(
    new Set(
      getCoachAssignments(coach)
        .map((assignment) => assignment.teamId)
        .filter(Boolean),
    ),
  );
}

export function getUniqueAssignedTeams(coaches = []) {
  const teams = new Map();

  coaches.forEach((coach) => {
    getCoachAssignments(coach).forEach((assignment) => {
      if (!assignment?.teamId) return;

      const existing = teams.get(assignment.teamId) || {
        id: assignment.teamId,
        name:
          assignment.teamNameDe ||
          assignment.teamNameEn ||
          "Keine Mannschaft",
        slug: assignment.teamSlug || null,
        coaches: [],
      };

      if (!existing.coaches.some((item) => item.id === coach.id)) {
        existing.coaches.push(coach);
      }

      teams.set(assignment.teamId, existing);
    });
  });

  return Array.from(teams.values());
}

export function getCoachStats(coaches = []) {
  return {
    trainer: coaches.filter((coach) =>
      getCoachRoleLabels(coach).some((role) => isTrainerRole(role)),
    ).length,
    coTrainer: coaches.filter((coach) =>
      getCoachRoleLabels(coach).some((role) => isCoTrainerRole(role)),
    ).length,
    supervisors: coaches.filter((coach) =>
      getCoachRoleLabels(coach).some((role) => isSupervisorRole(role)),
    ).length,
    teams: getUniqueAssignedTeams(coaches).length,
  };
}

export function filterCoachesByStats(coaches = [], filter = "alle") {
  if (filter === "trainer") {
    return coaches.filter((coach) =>
      getCoachRoleLabels(coach).some((role) => isTrainerRole(role)),
    );
  }

  if (filter === "co-trainer") {
    return coaches.filter((coach) =>
      getCoachRoleLabels(coach).some((role) => isCoTrainerRole(role)),
    );
  }

  if (filter === "betreuer") {
    return coaches.filter((coach) =>
      getCoachRoleLabels(coach).some((role) => isSupervisorRole(role)),
    );
  }

  if (filter === "mannschaften") {
    return coaches.filter((coach) => getCoachTeamIds(coach).length > 0);
  }

  return coaches;
}
