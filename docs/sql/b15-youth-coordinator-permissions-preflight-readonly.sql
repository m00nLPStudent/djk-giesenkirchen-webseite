-- B15 youth-coordinator permissions / team full-save preflight (READ ONLY).
-- Manual execution only in the Supabase SQL Editor.
-- One statement and one CSV-friendly result set. No PII is selected.

WITH
blocks(result_block, result_order) AS (
  VALUES
    ('01_relevant_admin_roles', 1),
    ('02_youth_role_identity', 2),
    ('03_youth_effective_permissions', 3),
    ('04_team_permission_matrix', 4),
    ('05_results_permission_matrix', 5),
    ('06_settings_contact_permission_matrix', 6),
    ('07_role_permission_assignments', 7),
    ('08_role_assignment_counts', 8),
    ('09_department_scope_structure', 9),
    ('10_youth_board_role_structure', 10),
    ('11_team_seasons_rls', 11),
    ('12_team_seasons_policies', 12),
    ('13_team_seasons_write_contract', 13),
    ('14_team_seasons_grants', 14),
    ('15_team_seasons_constraints', 15),
    ('16_team_season_inventory', 16),
    ('17_edit_without_create_roles', 17),
    ('18_full_save_risk_candidates', 18),
    ('19_permission_helpers', 19),
    ('20_permission_helper_execute_acl', 20),
    ('21_full_save_target_rls', 21),
    ('22_full_save_target_policies', 22),
    ('23_full_save_target_grants', 23),
    ('24_settings_contact_security', 24),
    ('25_settings_contact_policies', 25),
    ('26_results_security', 26),
    ('27_results_policies', 27),
    ('28_results_department_inventory', 28),
    ('29_assignment_integrity', 29),
    ('30_summary', 30)
),
api_roles(role_name) AS (
  VALUES ('anon'), ('authenticated'), ('service_role')
),
target_permissions(permission_key) AS (
  VALUES
    ('teams.view'), ('teams.create'), ('teams.edit'), ('teams.delete'),
    ('results.view'), ('results.create'), ('results.edit'),
    ('results.delete'), ('results.publish'),
    ('settings.view'), ('settings.edit')
),
full_save_tables(table_name) AS (
  VALUES
    ('teams'), ('seasons'), ('team_seasons'), ('player_team_seasons'),
    ('coach_team_seasons'), ('team_training_times'),
    ('team_training_exceptions'), ('team_season_year_groups')
),
settings_tables(table_name) AS (
  VALUES ('club_settings'), ('club_contacts'), ('pages')
),
role_permissions AS MATERIALIZED (
  SELECT
    role_row.id AS role_id,
    role_row.key AS role_key,
    role_row.name AS role_name,
    role_row.is_active AS role_active,
    permission_row.key AS permission_key,
    permission_row.category AS permission_category
  FROM public.admin_roles AS role_row
  LEFT JOIN public.admin_role_permissions AS link
    ON link.role_id = role_row.id
  LEFT JOIN public.admin_permissions AS permission_row
    ON permission_row.id = link.permission_id
),
safe_routines AS MATERIALIZED (
  SELECT
    proc.oid,
    proc.proname,
    proc.proowner,
    proc.prosecdef,
    proc.proconfig,
    proc.proacl,
    namespace.nspname,
    pg_catalog.pg_get_function_identity_arguments(proc.oid) AS identity_arguments,
    pg_catalog.pg_get_function_result(proc.oid) AS result_type,
    pg_catalog.pg_get_userbyid(proc.proowner) AS owner_name
  FROM pg_catalog.pg_proc AS proc
  JOIN pg_catalog.pg_namespace AS namespace ON namespace.oid = proc.pronamespace
  WHERE namespace.nspname = 'public'
    AND proc.prokind IN ('f', 'p')
    AND (
      proc.proname ILIKE '%permission%'
      OR proc.proname ILIKE '%department%'
      OR proc.proname ILIKE '%team%scope%'
    )
),
routine_inventory AS MATERIALIZED (
  SELECT safe.*, pg_catalog.pg_get_functiondef(safe.oid) AS function_definition
  FROM safe_routines AS safe
),
raw(result_block, result_order, row_sort, data) AS MATERIALIZED (
  SELECT '01_relevant_admin_roles', 1, role_row.key,
    jsonb_build_object(
      'role_key', role_row.key,
      'role_name', role_row.name,
      'is_active', role_row.is_active,
      'sort_order', role_row.sort_order
    )
  FROM public.admin_roles AS role_row

  UNION ALL
  SELECT '02_youth_role_identity', 2, role_row.key,
    jsonb_build_object(
      'role_key', role_row.key,
      'role_name', role_row.name,
      'description', role_row.description,
      'is_active', role_row.is_active,
      'matches_youth_contract', role_row.key IN ('jugendleiter', 'jugendkoordinator')
    )
  FROM public.admin_roles AS role_row
  WHERE role_row.key IN ('jugendleiter', 'jugendkoordinator')
     OR role_row.key ILIKE '%jugend%'
     OR role_row.name ILIKE '%jugend%'

  UNION ALL
  SELECT '03_youth_effective_permissions', 3,
    format('%s/%s', permissions.role_key, permissions.permission_key),
    jsonb_build_object(
      'role_key', permissions.role_key,
      'role_active', permissions.role_active,
      'permission_key', permissions.permission_key,
      'permission_category', permissions.permission_category
    )
  FROM role_permissions AS permissions
  WHERE permissions.role_key IN ('jugendleiter', 'jugendkoordinator')
    AND permissions.permission_key IS NOT NULL

  UNION ALL
  SELECT '04_team_permission_matrix', 4, role_row.key,
    jsonb_build_object(
      'role_key', role_row.key,
      'role_active', role_row.is_active,
      'teams_view', EXISTS (SELECT 1 FROM role_permissions rp WHERE rp.role_id = role_row.id AND rp.permission_key = 'teams.view'),
      'teams_create', EXISTS (SELECT 1 FROM role_permissions rp WHERE rp.role_id = role_row.id AND rp.permission_key = 'teams.create'),
      'teams_edit', EXISTS (SELECT 1 FROM role_permissions rp WHERE rp.role_id = role_row.id AND rp.permission_key = 'teams.edit'),
      'teams_delete', EXISTS (SELECT 1 FROM role_permissions rp WHERE rp.role_id = role_row.id AND rp.permission_key = 'teams.delete'),
      'superadmin_bypass_in_application', role_row.key = 'superadmin'
    )
  FROM public.admin_roles AS role_row

  UNION ALL
  SELECT '05_results_permission_matrix', 5, role_row.key,
    jsonb_build_object(
      'role_key', role_row.key,
      'role_active', role_row.is_active,
      'results_view', EXISTS (SELECT 1 FROM role_permissions rp WHERE rp.role_id = role_row.id AND rp.permission_key = 'results.view'),
      'results_create', EXISTS (SELECT 1 FROM role_permissions rp WHERE rp.role_id = role_row.id AND rp.permission_key = 'results.create'),
      'results_edit', EXISTS (SELECT 1 FROM role_permissions rp WHERE rp.role_id = role_row.id AND rp.permission_key = 'results.edit'),
      'results_delete', EXISTS (SELECT 1 FROM role_permissions rp WHERE rp.role_id = role_row.id AND rp.permission_key = 'results.delete'),
      'results_publish', EXISTS (SELECT 1 FROM role_permissions rp WHERE rp.role_id = role_row.id AND rp.permission_key = 'results.publish')
    )
  FROM public.admin_roles AS role_row

  UNION ALL
  SELECT '06_settings_contact_permission_matrix', 6, role_row.key,
    jsonb_build_object(
      'role_key', role_row.key,
      'role_active', role_row.is_active,
      'settings_view', EXISTS (SELECT 1 FROM role_permissions rp WHERE rp.role_id = role_row.id AND rp.permission_key = 'settings.view'),
      'settings_edit', EXISTS (SELECT 1 FROM role_permissions rp WHERE rp.role_id = role_row.id AND rp.permission_key = 'settings.edit'),
      'settings_route_contract', 'settings.view',
      'contact_action_contract', 'settings.edit'
    )
  FROM public.admin_roles AS role_row

  UNION ALL
  SELECT '07_role_permission_assignments', 7,
    format('%s/%s', permissions.role_key, permissions.permission_key),
    jsonb_build_object(
      'role_key', permissions.role_key,
      'role_active', permissions.role_active,
      'permission_key', permissions.permission_key,
      'permission_category', permissions.permission_category
    )
  FROM role_permissions AS permissions
  WHERE permissions.permission_key IN (SELECT permission_key FROM target_permissions)

  UNION ALL
  SELECT '08_role_assignment_counts', 8, role_row.key,
    jsonb_build_object(
      'role_key', role_row.key,
      'role_active', role_row.is_active,
      'assigned_profile_count', count(DISTINCT assignment.user_id),
      'active_profile_assignment_count', count(DISTINCT assignment.user_id) FILTER (WHERE profile.is_active IS TRUE),
      'primary_assignment_count', count(*) FILTER (WHERE assignment.is_primary IS TRUE)
    )
  FROM public.admin_roles AS role_row
  LEFT JOIN public.admin_user_roles AS assignment ON assignment.role_id = role_row.id
  LEFT JOIN public.admin_profiles AS profile ON profile.id = assignment.user_id
  GROUP BY role_row.id, role_row.key, role_row.is_active

  UNION ALL
  SELECT '09_department_scope_structure', 9, department.slug,
    jsonb_build_object(
      'department_slug', department.slug,
      'department_name', department.name_de,
      'is_active', department.is_active,
      'team_count', (SELECT count(*) FROM public.teams team WHERE team.department_id = department.id),
      'active_team_count', (SELECT count(*) FROM public.teams team WHERE team.department_id = department.id AND team.is_active IS TRUE)
    )
  FROM public.departments AS department

  UNION ALL
  SELECT '10_youth_board_role_structure', 10, board_role.slug,
    jsonb_build_object(
      'board_role_slug', board_role.slug,
      'board_role_name', board_role.name_de,
      'department_slug', department.slug,
      'department_active', department.is_active,
      'is_active', board_role.is_active
    )
  FROM public.board_roles AS board_role
  LEFT JOIN public.departments AS department ON department.id = board_role.department_id
  WHERE board_role.slug IN ('jugendleiter', 'jugendkoordinator')

  UNION ALL
  SELECT '11_team_seasons_rls', 11, relation.relname,
    jsonb_build_object(
      'table_name', relation.relname,
      'owner', pg_catalog.pg_get_userbyid(relation.relowner),
      'rls_enabled', relation.relrowsecurity,
      'force_rls', relation.relforcerowsecurity
    )
  FROM pg_catalog.pg_class AS relation
  JOIN pg_catalog.pg_namespace AS namespace ON namespace.oid = relation.relnamespace
  WHERE namespace.nspname = 'public'
    AND relation.relname = 'team_seasons'
    AND relation.relkind IN ('r', 'p')

  UNION ALL
  SELECT '12_team_seasons_policies', 12, format('%s/%s', policy.cmd, policy.policyname),
    jsonb_build_object(
      'policy_name', policy.policyname,
      'command', policy.cmd,
      'permissive', policy.permissive,
      'roles', policy.roles,
      'using', policy.qual,
      'with_check', policy.with_check
    )
  FROM pg_catalog.pg_policies AS policy
  WHERE policy.schemaname = 'public' AND policy.tablename = 'team_seasons'

  UNION ALL
  SELECT '13_team_seasons_write_contract', 13, format('%s/%s', policy.cmd, policy.policyname),
    jsonb_build_object(
      'policy_name', policy.policyname,
      'command', policy.cmd,
      'roles', policy.roles,
      'using', policy.qual,
      'with_check', policy.with_check,
      'references_teams_create', COALESCE(policy.with_check, '') ILIKE '%teams.create%' OR COALESCE(policy.qual, '') ILIKE '%teams.create%',
      'references_teams_edit', COALESCE(policy.with_check, '') ILIKE '%teams.edit%' OR COALESCE(policy.qual, '') ILIKE '%teams.edit%'
    )
  FROM pg_catalog.pg_policies AS policy
  WHERE policy.schemaname = 'public'
    AND policy.tablename = 'team_seasons'
    AND policy.cmd IN ('INSERT', 'UPDATE')

  UNION ALL
  SELECT '14_team_seasons_grants', 14, format('%s/%s', role.role_name, privilege.privilege_name),
    jsonb_build_object(
      'role', role.role_name,
      'privilege', privilege.privilege_name,
      'effective', pg_catalog.has_table_privilege(role.role_name, 'public.team_seasons', privilege.privilege_name)
    )
  FROM api_roles AS role
  CROSS JOIN (VALUES ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE'), ('TRUNCATE'), ('REFERENCES'), ('TRIGGER')) AS privilege(privilege_name)

  UNION ALL
  SELECT '15_team_seasons_constraints', 15, constraint_row.conname,
    jsonb_build_object(
      'constraint_name', constraint_row.conname,
      'constraint_type', constraint_row.contype,
      'definition', pg_catalog.pg_get_constraintdef(constraint_row.oid, true)
    )
  FROM pg_catalog.pg_constraint AS constraint_row
  WHERE constraint_row.conrelid = 'public.team_seasons'::regclass

  UNION ALL
  SELECT '16_team_season_inventory', 16, department.slug,
    jsonb_build_object(
      'department_slug', department.slug,
      'team_count', count(DISTINCT team.id),
      'team_season_count', count(team_season.id),
      'active_team_season_count', count(*) FILTER (WHERE team.is_active IS TRUE AND team_season.is_active IS TRUE),
      'unique_team_season_pairs', count(DISTINCT (team_season.team_id, team_season.season_id))
    )
  FROM public.departments AS department
  LEFT JOIN public.teams AS team ON team.department_id = department.id
  LEFT JOIN public.team_seasons AS team_season ON team_season.team_id = team.id
  GROUP BY department.slug

  UNION ALL
  SELECT '17_edit_without_create_roles', 17, role_row.key,
    jsonb_build_object(
      'role_key', role_row.key,
      'role_active', role_row.is_active,
      'teams_edit', true,
      'teams_create', false
    )
  FROM public.admin_roles AS role_row
  WHERE EXISTS (SELECT 1 FROM role_permissions rp WHERE rp.role_id = role_row.id AND rp.permission_key = 'teams.edit')
    AND NOT EXISTS (SELECT 1 FROM role_permissions rp WHERE rp.role_id = role_row.id AND rp.permission_key = 'teams.create')

  UNION ALL
  SELECT '18_full_save_risk_candidates', 18, role_row.key,
    jsonb_build_object(
      'role_key', role_row.key,
      'role_active', role_row.is_active,
      'formal_edit_permission', true,
      'formal_create_permission', false,
      'application_full_save_gate_for_existing_team', 'teams.edit',
      'team_seasons_upsert_insert_policy_expected_permission', 'teams.create',
      'potential_upsert_insert_rls_risk', true
    )
  FROM public.admin_roles AS role_row
  WHERE role_row.key <> 'trainer'
    AND EXISTS (SELECT 1 FROM role_permissions rp WHERE rp.role_id = role_row.id AND rp.permission_key = 'teams.edit')
    AND NOT EXISTS (SELECT 1 FROM role_permissions rp WHERE rp.role_id = role_row.id AND rp.permission_key = 'teams.create')

  UNION ALL
  SELECT '19_permission_helpers', 19, format('%s.%s(%s)', routine.nspname, routine.proname, routine.identity_arguments),
    jsonb_build_object(
      'signature', format('%I.%I(%s)', routine.nspname, routine.proname, routine.identity_arguments),
      'result_type', routine.result_type,
      'owner', routine.owner_name,
      'security_definer', routine.prosecdef,
      'proconfig', routine.proconfig,
      'definition', routine.function_definition
    )
  FROM routine_inventory AS routine
  WHERE routine.function_definition ILIKE '%admin_permission%'
     OR routine.function_definition ILIKE '%admin_role%'
     OR routine.function_definition ILIKE '%department_id%'

  UNION ALL
  SELECT '20_permission_helper_execute_acl', 20,
    format('%s.%s(%s)/%s', routine.nspname, routine.proname, routine.identity_arguments, role.role_name),
    jsonb_build_object(
      'signature', format('%I.%I(%s)', routine.nspname, routine.proname, routine.identity_arguments),
      'role', role.role_name,
      'effective_execute', pg_catalog.has_function_privilege(role.role_name, routine.oid, 'EXECUTE'),
      'public_execute', EXISTS (
        SELECT 1
        FROM pg_catalog.aclexplode(COALESCE(routine.proacl, pg_catalog.acldefault('f', routine.proowner))) AS acl
        WHERE acl.grantee = 0 AND acl.privilege_type = 'EXECUTE'
      )
    )
  FROM safe_routines AS routine
  CROSS JOIN api_roles AS role

  UNION ALL
  SELECT '21_full_save_target_rls', 21, target.table_name,
    jsonb_build_object(
      'table_name', target.table_name,
      'exists', relation.oid IS NOT NULL,
      'owner', pg_catalog.pg_get_userbyid(relation.relowner),
      'rls_enabled', relation.relrowsecurity,
      'force_rls', relation.relforcerowsecurity
    )
  FROM full_save_tables AS target
  LEFT JOIN pg_catalog.pg_namespace AS namespace ON namespace.nspname = 'public'
  LEFT JOIN pg_catalog.pg_class AS relation
    ON relation.relnamespace = namespace.oid
   AND relation.relname = target.table_name
   AND relation.relkind IN ('r', 'p')

  UNION ALL
  SELECT '22_full_save_target_policies', 22,
    format('%s/%s/%s', policy.tablename, policy.cmd, policy.policyname),
    jsonb_build_object(
      'table_name', policy.tablename,
      'policy_name', policy.policyname,
      'command', policy.cmd,
      'roles', policy.roles,
      'using', policy.qual,
      'with_check', policy.with_check
    )
  FROM pg_catalog.pg_policies AS policy
  WHERE policy.schemaname = 'public'
    AND policy.tablename IN (SELECT table_name FROM full_save_tables)

  UNION ALL
  SELECT '23_full_save_target_grants', 23,
    format('%s/%s/%s', target.table_name, role.role_name, privilege.privilege_name),
    jsonb_build_object(
      'table_name', target.table_name,
      'role', role.role_name,
      'privilege', privilege.privilege_name,
      'effective', CASE WHEN pg_catalog.to_regclass(format('public.%I', target.table_name)) IS NULL THEN NULL
        ELSE pg_catalog.has_table_privilege(role.role_name, format('public.%I', target.table_name), privilege.privilege_name) END
    )
  FROM full_save_tables AS target
  CROSS JOIN api_roles AS role
  CROSS JOIN (VALUES ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE')) AS privilege(privilege_name)

  UNION ALL
  SELECT '24_settings_contact_security', 24, target.table_name,
    jsonb_build_object(
      'table_name', target.table_name,
      'exists', relation.oid IS NOT NULL,
      'rls_enabled', relation.relrowsecurity,
      'force_rls', relation.relforcerowsecurity,
      'anon_select', CASE WHEN relation.oid IS NULL THEN NULL ELSE pg_catalog.has_table_privilege('anon', relation.oid, 'SELECT') END,
      'authenticated_select', CASE WHEN relation.oid IS NULL THEN NULL ELSE pg_catalog.has_table_privilege('authenticated', relation.oid, 'SELECT') END,
      'authenticated_insert', CASE WHEN relation.oid IS NULL THEN NULL ELSE pg_catalog.has_table_privilege('authenticated', relation.oid, 'INSERT') END,
      'authenticated_update', CASE WHEN relation.oid IS NULL THEN NULL ELSE pg_catalog.has_table_privilege('authenticated', relation.oid, 'UPDATE') END,
      'authenticated_delete', CASE WHEN relation.oid IS NULL THEN NULL ELSE pg_catalog.has_table_privilege('authenticated', relation.oid, 'DELETE') END,
      'service_role_all', CASE WHEN relation.oid IS NULL THEN NULL ELSE pg_catalog.has_table_privilege('service_role', relation.oid, 'SELECT,INSERT,UPDATE,DELETE') END
    )
  FROM settings_tables AS target
  LEFT JOIN pg_catalog.pg_namespace AS namespace ON namespace.nspname = 'public'
  LEFT JOIN pg_catalog.pg_class AS relation
    ON relation.relnamespace = namespace.oid
   AND relation.relname = target.table_name
   AND relation.relkind IN ('r', 'p')

  UNION ALL
  SELECT '25_settings_contact_policies', 25,
    format('%s/%s/%s', policy.tablename, policy.cmd, policy.policyname),
    jsonb_build_object(
      'table_name', policy.tablename,
      'policy_name', policy.policyname,
      'command', policy.cmd,
      'roles', policy.roles,
      'using', policy.qual,
      'with_check', policy.with_check
    )
  FROM pg_catalog.pg_policies AS policy
  WHERE policy.schemaname = 'public'
    AND policy.tablename IN (SELECT table_name FROM settings_tables)

  UNION ALL
  SELECT '26_results_security', 26, relation.relname,
    jsonb_build_object(
      'table_name', relation.relname,
      'owner', pg_catalog.pg_get_userbyid(relation.relowner),
      'rls_enabled', relation.relrowsecurity,
      'force_rls', relation.relforcerowsecurity,
      'anon_select', pg_catalog.has_table_privilege('anon', relation.oid, 'SELECT'),
      'authenticated_select', pg_catalog.has_table_privilege('authenticated', relation.oid, 'SELECT'),
      'authenticated_insert', pg_catalog.has_table_privilege('authenticated', relation.oid, 'INSERT'),
      'authenticated_update', pg_catalog.has_table_privilege('authenticated', relation.oid, 'UPDATE'),
      'authenticated_delete', pg_catalog.has_table_privilege('authenticated', relation.oid, 'DELETE'),
      'service_role_all', pg_catalog.has_table_privilege('service_role', relation.oid, 'SELECT,INSERT,UPDATE,DELETE')
    )
  FROM pg_catalog.pg_class AS relation
  JOIN pg_catalog.pg_namespace AS namespace ON namespace.oid = relation.relnamespace
  WHERE namespace.nspname = 'public'
    AND relation.relname = 'club_results'
    AND relation.relkind IN ('r', 'p')

  UNION ALL
  SELECT '27_results_policies', 27, format('%s/%s', policy.cmd, policy.policyname),
    jsonb_build_object(
      'policy_name', policy.policyname,
      'command', policy.cmd,
      'roles', policy.roles,
      'using', policy.qual,
      'with_check', policy.with_check
    )
  FROM pg_catalog.pg_policies AS policy
  WHERE policy.schemaname = 'public' AND policy.tablename = 'club_results'

  UNION ALL
  SELECT '28_results_department_inventory', 28, department.slug,
    jsonb_build_object(
      'department_slug', department.slug,
      'department_active', department.is_active,
      'result_count', count(result_row.id),
      'published_result_count', count(*) FILTER (WHERE result_row.is_published IS TRUE),
      'active_team_season_count', count(DISTINCT team_season.id) FILTER (
        WHERE team.is_active IS TRUE AND team_season.is_active IS TRUE
      )
    )
  FROM public.departments AS department
  LEFT JOIN public.teams AS team ON team.department_id = department.id
  LEFT JOIN public.team_seasons AS team_season ON team_season.team_id = team.id
  LEFT JOIN public.club_results AS result_row ON result_row.team_season_id = team_season.id
  WHERE department.slug IN ('fussball', 'tischtennis')
  GROUP BY department.slug, department.is_active

  UNION ALL
  SELECT '29_assignment_integrity', 29, check_row.check_name,
    jsonb_build_object('check', check_row.check_name, 'issue_count', check_row.issue_count)
  FROM (
    SELECT 'duplicate_role_permission_links' AS check_name, count(*)::bigint AS issue_count
    FROM (
      SELECT role_id, permission_id
      FROM public.admin_role_permissions
      GROUP BY role_id, permission_id
      HAVING count(*) > 1
    ) AS duplicate_links
    UNION ALL
    SELECT 'duplicate_team_season_pairs', count(*)::bigint
    FROM (
      SELECT team_id, season_id
      FROM public.team_seasons
      GROUP BY team_id, season_id
      HAVING count(*) > 1
    ) AS duplicate_pairs
    UNION ALL
    SELECT 'results_without_team_season', count(*)::bigint
    FROM public.club_results AS result_row
    LEFT JOIN public.team_seasons AS team_season ON team_season.id = result_row.team_season_id
    WHERE team_season.id IS NULL
    UNION ALL
    SELECT 'team_seasons_without_team', count(*)::bigint
    FROM public.team_seasons AS team_season
    LEFT JOIN public.teams AS team ON team.id = team_season.team_id
    WHERE team.id IS NULL
    UNION ALL
    SELECT 'team_seasons_without_season', count(*)::bigint
    FROM public.team_seasons AS team_season
    LEFT JOIN public.seasons AS season ON season.id = team_season.season_id
    WHERE season.id IS NULL
  ) AS check_row

  UNION ALL
  SELECT '30_summary', 30, summary.check_name,
    jsonb_build_object('check', summary.check_name, 'value', summary.check_value)
  FROM (
    SELECT 'youth_admin_role_keys' AS check_name,
      COALESCE(string_agg(role_row.key, ',' ORDER BY role_row.key), '<none>') AS check_value
    FROM public.admin_roles AS role_row
    WHERE role_row.key IN ('jugendleiter', 'jugendkoordinator') OR role_row.key ILIKE '%jugend%'
    UNION ALL
    SELECT 'youth_settings_view_assignment_count', count(*)::text
    FROM role_permissions
    WHERE role_key IN ('jugendleiter', 'jugendkoordinator') AND permission_key = 'settings.view'
    UNION ALL
    SELECT 'youth_settings_edit_assignment_count', count(*)::text
    FROM role_permissions
    WHERE role_key IN ('jugendleiter', 'jugendkoordinator') AND permission_key = 'settings.edit'
    UNION ALL
    SELECT 'youth_results_permission_count', count(*)::text
    FROM role_permissions
    WHERE role_key IN ('jugendleiter', 'jugendkoordinator') AND permission_key LIKE 'results.%'
    UNION ALL
    SELECT 'youth_teams_edit_assignment_count', count(*)::text
    FROM role_permissions
    WHERE role_key IN ('jugendleiter', 'jugendkoordinator') AND permission_key = 'teams.edit'
    UNION ALL
    SELECT 'youth_teams_create_assignment_count', count(*)::text
    FROM role_permissions
    WHERE role_key IN ('jugendleiter', 'jugendkoordinator') AND permission_key = 'teams.create'
    UNION ALL
    SELECT 'active_youth_role_assignment_count', count(*)::text
    FROM public.admin_user_roles AS assignment
    JOIN public.admin_roles AS role_row ON role_row.id = assignment.role_id
    JOIN public.admin_profiles AS profile ON profile.id = assignment.user_id
    WHERE role_row.is_active IS TRUE
      AND profile.is_active IS TRUE
      AND role_row.key IN ('jugendleiter', 'jugendkoordinator')
    UNION ALL
    SELECT 'team_seasons_policy_count', count(*)::text
    FROM pg_catalog.pg_policies
    WHERE schemaname = 'public' AND tablename = 'team_seasons'
    UNION ALL
    SELECT 'roles_with_teams_edit_without_create', count(*)::text
    FROM public.admin_roles AS role_row
    WHERE EXISTS (SELECT 1 FROM role_permissions rp WHERE rp.role_id = role_row.id AND rp.permission_key = 'teams.edit')
      AND NOT EXISTS (SELECT 1 FROM role_permissions rp WHERE rp.role_id = role_row.id AND rp.permission_key = 'teams.create')
    UNION ALL
    SELECT 'football_department_exists', (count(*) = 1)::text
    FROM public.departments WHERE slug = 'fussball' AND is_active IS TRUE
    UNION ALL
    SELECT 'table_tennis_department_exists', (count(*) = 1)::text
    FROM public.departments WHERE slug = 'tischtennis' AND is_active IS TRUE
  ) AS summary
),
combined AS MATERIALIZED (
  SELECT
    block.result_block,
    block.result_order,
    row_number() OVER (
      PARTITION BY block.result_block
      ORDER BY raw.row_sort NULLS FIRST
    )::bigint AS row_order,
    CASE WHEN raw.data IS NULL THEN 'empty'::text ELSE 'data'::text END AS row_type,
    COALESCE(
      raw.data,
      jsonb_build_object('message', 'No rows returned for this block.')
    ) AS data
  FROM blocks AS block
  LEFT JOIN raw
    ON raw.result_block = block.result_block
   AND raw.result_order = block.result_order
)
SELECT result_block, result_order, row_order, row_type, data
FROM combined
ORDER BY result_order, row_order;
