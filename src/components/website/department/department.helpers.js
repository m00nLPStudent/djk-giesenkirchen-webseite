export function getCoachTeamName(coach = {}) {
  if (coach.teams?.name_de) return coach.teams.name_de;
  if (coach.team_name) return coach.team_name;
  return "Keine Mannschaft zugeordnet";
}

export function mapBoardMemberForDisplay(member = {}) {
  return {
    ...member,
    role_de: member.board_roles?.name_de || member.role_de,
    role_en: member.board_roles?.name_en || member.role_en,
  };
}
