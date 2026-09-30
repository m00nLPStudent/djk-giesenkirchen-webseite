export function createPlayerAssignmentSyncPlan(
  existingAssignments = [],
  selectedPlayerIds = [],
) {
  const desiredPlayerIds = [
    ...new Set(selectedPlayerIds.filter(Boolean).map(String)),
  ];
  const existingByPlayerId = new Map();

  for (const assignment of existingAssignments) {
    const playerId = String(assignment?.player_id || "");
    if (!playerId || existingByPlayerId.has(playerId)) {
      throw new Error("Ungültiger bestehender Mannschaftskader");
    }
    existingByPlayerId.set(playerId, assignment);
  }

  const desiredPlayerIdSet = new Set(desiredPlayerIds);
  const deactivatedAssignments = existingAssignments
    .filter(
      (assignment) =>
        assignment?.is_active === true &&
        !desiredPlayerIdSet.has(String(assignment?.player_id || "")),
    )
    .map((assignment) => ({ id: assignment.id, is_active: false }))
    .filter((assignment) => assignment.id);

  const retainedAssignments = [];
  const addedAssignments = [];

  desiredPlayerIds.forEach((playerId, sortOrder) => {
    const existing = existingByPlayerId.get(playerId);
    if (existing) {
      if (existing.sort_order !== sortOrder || existing.is_active !== true) {
        retainedAssignments.push({
          id: existing.id,
          sort_order: sortOrder,
          is_active: true,
        });
      }
      return;
    }

    addedAssignments.push({
      player_id: playerId,
      sort_order: sortOrder,
      is_active: true,
    });
  });

  return {
    addedAssignments,
    deactivatedAssignments,
    retainedAssignments,
  };
}
