function buildRestorePayload(assignment) {
  return {
    team_season_id: assignment.teamSeasonId,
    shirt_number: assignment.shirtNumber ?? null,
    position_de: assignment.positionDe || null,
    position_en: assignment.positionEn || null,
    is_captain: Boolean(assignment.isCaptain),
    is_active: assignment.isActive !== false,
    sort_order: assignment.sortOrder ?? 0,
  };
}

export function createPlayerAssignmentRollbackPlan(
  existingAssignments = [],
  editAssignmentsResult = {},
) {
  const existingById = new Map(
    (existingAssignments || []).map((assignment) => [
      assignment.playerTeamSeasonId,
      assignment,
    ]),
  );

  return [
    ...(editAssignmentsResult.deactivatedIds || []).map((assignmentId) => ({
      type: "toggle",
      assignmentId,
      isActive: true,
    })),
    ...(editAssignmentsResult.updatedIds || []).flatMap((assignmentId) => {
      const assignment = existingById.get(assignmentId);
      return assignment
        ? [
            {
              type: "restore",
              assignmentId,
              payload: buildRestorePayload(assignment),
            },
          ]
        : [];
    }),
    ...(editAssignmentsResult.reactivatedIds || []).flatMap((assignmentId) => {
      const assignment = existingById.get(assignmentId);
      return assignment
        ? [
            {
              type: "restore",
              assignmentId,
              payload: buildRestorePayload(assignment),
            },
          ]
        : [];
    }),
    ...(editAssignmentsResult.insertedIds || []).map((assignmentId) => ({
      type: "toggle",
      assignmentId,
      isActive: false,
    })),
  ];
}
