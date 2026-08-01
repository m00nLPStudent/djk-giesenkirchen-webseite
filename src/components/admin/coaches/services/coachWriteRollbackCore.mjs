export function createCoachAssignmentRollbackPlan(
  existingAssignments = [],
  editAssignmentsResult = {},
) {
  const existingById = new Map(
    (existingAssignments || []).map((assignment) => [
      assignment.coachTeamSeasonId,
      assignment,
    ]),
  );

  const restoreRows = (ids = [], isActiveResolver) =>
    (ids || []).flatMap((assignmentId) => {
      const assignment = existingById.get(assignmentId);
      if (!assignment) return [];

      return [
        {
          type: "restore",
          assignmentId,
          payload: {
            team_season_id: assignment.teamSeasonId,
            role_de: assignment.roleDe,
            role_en: assignment.roleEn,
            is_active: isActiveResolver(assignment),
            sort_order: assignment.sortOrder ?? 0,
          },
        },
      ];
    });

  return [
    ...(editAssignmentsResult.deactivatedIds || []).map((assignmentId) => ({
      type: "toggle",
      assignmentId,
      isActive: true,
    })),
    ...restoreRows(editAssignmentsResult.updatedIds, () => true),
    ...restoreRows(
      editAssignmentsResult.reactivatedIds,
      (assignment) => assignment.isActive !== false,
    ),
    ...(editAssignmentsResult.insertedIds || []).map((assignmentId) => ({
      type: "toggle",
      assignmentId,
      isActive: false,
    })),
  ];
}
