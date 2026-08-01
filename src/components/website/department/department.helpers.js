function normalizeText(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function getDepartmentPersonDisplayName(person = {}) {
  const firstName = normalizeText(person.firstName || person.first_name);
  const lastName = normalizeText(person.lastName || person.last_name);
  const fullName = normalizeText([firstName, lastName].filter(Boolean).join(" "));

  return (
    normalizeText(person.displayName) ||
    fullName ||
    normalizeText(person.name) ||
    "Name nicht hinterlegt"
  );
}

export function getCoachTeamName(coach = {}) {
  if ((coach.teamNames || []).length > 1) {
    return `${coach.primaryTeamName} +${coach.teamNames.length - 1} weitere`;
  }
  if (coach.primaryTeamName) return coach.primaryTeamName;
  if (coach.teams?.name_de) return coach.teams.name_de;
  return "Keine Mannschaft zugeordnet";
}

export function mapBoardMemberForDisplay(member = {}) {
  return {
    ...member,
    role_de: member.board_roles?.name_de || member.role_de,
    role_en: member.board_roles?.name_en || member.role_en,
  };
}
