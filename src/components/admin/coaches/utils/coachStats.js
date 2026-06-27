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

export function getUniqueAssignedTeams(coaches = []) {
  const teams = new Map();

  coaches.forEach((coach) => {
    const team = Array.isArray(coach.teams) ? coach.teams[0] : coach.teams;
    const teamId = team?.id || coach.team_id;
    const teamName = team?.name_de || coach.team_name;

    if (!teamId || !teamName) return;

    teams.set(teamId, {
      id: teamId,
      name: teamName,
      slug: team?.slug,
      coaches: coaches.filter((item) => item.team_id === teamId),
    });
  });

  return Array.from(teams.values());
}

export function getCoachStats(coaches = []) {
  return {
    trainer: coaches.filter((coach) => isTrainerRole(coach.role)).length,
    coTrainer: coaches.filter((coach) => isCoTrainerRole(coach.role)).length,
    supervisors: coaches.filter((coach) => isSupervisorRole(coach.role)).length,
    teams: getUniqueAssignedTeams(coaches).length,
  };
}

export function filterCoachesByStats(coaches = [], filter = "alle") {
  if (filter === "trainer") {
    return coaches.filter((coach) => isTrainerRole(coach.role));
  }

  if (filter === "co-trainer") {
    return coaches.filter((coach) => isCoTrainerRole(coach.role));
  }

  if (filter === "betreuer") {
    return coaches.filter((coach) => isSupervisorRole(coach.role));
  }

  if (filter === "mannschaften") {
    return coaches.filter((coach) => coach.team_id);
  }

  return coaches;
}
