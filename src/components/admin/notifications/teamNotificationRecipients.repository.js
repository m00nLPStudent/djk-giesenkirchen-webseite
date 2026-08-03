import "server-only";

export async function loadTeamRecipientSource(db, teamSeasonIds = []) {
  const ids = [...new Set(teamSeasonIds.filter(Boolean))];
  if (!ids.length) return { data: [], error: null };
  const assignments = await db.from("coach_team_seasons").select("id, coach_id, team_season_id, role_de, is_active").in("team_season_id", ids).eq("is_active", true);
  if (assignments.error) return { data: [], error: assignments.error };
  const coachIds = [...new Set((assignments.data || []).map((row) => row.coach_id).filter(Boolean))];
  if (!coachIds.length) return { data: [], error: null };
  const coaches = await db.from("coaches").select("id, admin_profile_id, is_active").in("id", coachIds).eq("is_active", true);
  if (coaches.error) return { data: [], error: coaches.error };
  const profileIds = [...new Set((coaches.data || []).map((row) => row.admin_profile_id).filter(Boolean))];
  if (!profileIds.length) return { data: [], error: null };
  const [profiles, roleLinks] = await Promise.all([
    db.from("admin_profiles").select("id, is_active").in("id", profileIds).eq("is_active", true),
    db.from("admin_user_roles").select("user_id, role_id").in("user_id", profileIds),
  ]);
  if (profiles.error || roleLinks.error) return { data: [], error: profiles.error || roleLinks.error };
  const roleIds = [...new Set((roleLinks.data || []).map((row) => row.role_id).filter(Boolean))];
  const rolePermissions = roleIds.length ? await db.from("admin_role_permissions").select("role_id, permission_id").in("role_id", roleIds) : { data: [], error: null };
  if (rolePermissions.error) return { data: [], error: rolePermissions.error };
  const permissionIds = [...new Set((rolePermissions.data || []).map((row) => row.permission_id).filter(Boolean))];
  const permissions = permissionIds.length ? await db.from("admin_permissions").select("id, key").in("id", permissionIds) : { data: [], error: null };
  if (permissions.error) return { data: [], error: permissions.error };
  return { data: { assignments: assignments.data || [], coaches: coaches.data || [], profiles: profiles.data || [], roleLinks: roleLinks.data || [], rolePermissions: rolePermissions.data || [], permissions: permissions.data || [] }, error: null };
}

export async function loadCoachRecipientSource(db, coachId) {
  const result = await db.from("coaches").select("id, admin_profile_id, is_active").eq("id", coachId).maybeSingle();
  if (result.error || !result.data?.admin_profile_id) return { data: null, error: result.error };
  const source = await loadTeamRecipientSourceForProfiles(db, [result.data.admin_profile_id]);
  return { data: source.data?.[0] || null, error: source.error };
}

export async function loadTeamRecipientSourceForProfiles(db, profileIds) {
  const profiles = await db.from("admin_profiles").select("id, is_active").in("id", profileIds).eq("is_active", true);
  if (profiles.error) return { data: [], error: profiles.error };
  const links = await db.from("admin_user_roles").select("user_id, role_id").in("user_id", profileIds);
  if (links.error) return { data: [], error: links.error };
  const roleIds = [...new Set((links.data || []).map((row) => row.role_id).filter(Boolean))];
  const rolePermissions = roleIds.length ? await db.from("admin_role_permissions").select("role_id, permission_id").in("role_id", roleIds) : { data: [], error: null };
  const permissionIds = [...new Set((rolePermissions.data || []).map((row) => row.permission_id).filter(Boolean))];
  const permissions = permissionIds.length ? await db.from("admin_permissions").select("id, key").in("id", permissionIds) : { data: [], error: null };
  if (rolePermissions.error || permissions.error) return { data: [], error: rolePermissions.error || permissions.error };
  const permissionById = new Map((permissions.data || []).map((row) => [row.id, row.key]));
  const permissionIdsByRole = new Map();
  for (const row of rolePermissions.data || []) permissionIdsByRole.set(row.role_id, [...(permissionIdsByRole.get(row.role_id) || []), row.permission_id]);
  return { data: (profiles.data || []).map((profile) => ({ userId: profile.id, permissionKeys: [...new Set((links.data || []).filter((link) => link.user_id === profile.id).flatMap((link) => permissionIdsByRole.get(link.role_id) || []).map((id) => permissionById.get(id)).filter(Boolean))] })), error: null };
}
