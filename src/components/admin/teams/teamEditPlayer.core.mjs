export function isEligibleTeamEditPlayer(
  player,
  { departmentId = null, teamId = null, currentTeamIds = [], assignedToTeam = false, departmentByTeamId = new Map() } = {},
) {
  if (!player || player.is_active === false) return false;
  if (departmentId && player.department_id !== departmentId) return false;
  if (!currentTeamIds.length) return true;
  if (currentTeamIds.some((currentTeamId) => departmentByTeamId.get(currentTeamId) !== departmentId)) return false;
  if (!teamId) return false;
  return currentTeamIds.includes(teamId) || assignedToTeam;
}
