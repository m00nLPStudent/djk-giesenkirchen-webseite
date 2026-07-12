function toSet(values = []) {
  return new Set((values || []).filter(Boolean));
}

export function mapTeamAssignmentRows(rows = []) {
  return (rows || [])
    .filter((row) => row?.is_active !== false)
    .map((row) => ({
      id: row.id || null,
      adminProfileId: row.admin_profile_id || null,
      teamId: row.team_id || null,
      assignmentType: row.assignment_type || null,
      isActive: row.is_active !== false,
      createdAt: row.created_at || null,
      updatedAt: row.updated_at || null,
      createdBy: row.created_by || null,
      updatedBy: row.updated_by || null,
    }));
}

export async function loadAdminProfileTeamAssignments(
  supabase,
  adminProfileId,
) {
  if (!supabase || !adminProfileId) {
    return { data: [], error: null };
  }

  const { data, error } = await supabase
    .from("admin_profile_team_assignments")
    .select("*")
    .eq("admin_profile_id", adminProfileId)
    .eq("is_active", true);

  if (error) {
    return { data: [], error };
  }

  return {
    data: mapTeamAssignmentRows(data),
    error: null,
  };
}

export async function getAssignedTeamIds(adminProfileId, { supabase } = {}) {
  const { data, error } = await loadAdminProfileTeamAssignments(
    supabase,
    adminProfileId,
  );

  if (error) {
    return { data: [], error };
  }

  return {
    data: Array.from(toSet((data || []).map((row) => row.teamId))),
    error: null,
  };
}

export function buildScopeContext({
  adminProfileId = null,
  roleKeys = [],
  permissionKeys = [],
  roleScopeTypes = [],
  teamAssignmentRows = [],
} = {}) {
  const assignedTeamIds = toSet(teamAssignmentRows.map((row) => row.teamId));

  return {
    adminProfileId,
    roleKeys: toSet(roleKeys),
    permissionKeys: toSet(permissionKeys),
    roleScopeTypes: toSet(roleScopeTypes),
    teamAssignmentRows,
    assignedTeamIds,
  };
}
