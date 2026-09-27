-- B15 trainer team edit permissions - postcheck (READ ONLY)
-- One SELECT statement, one combined result set.

WITH
blocks(result_block, result_order) AS MATERIALIZED (
  VALUES
    ('01_team_seasons_rls', 1),
    ('02_team_seasons_policies', 2),
    ('03_team_seasons_api_grants', 3),
    ('04_trainer_permissions', 4),
    ('05_elevated_role_permissions', 5),
    ('06_team_scope_relations', 6),
    ('07_assignment_integrity', 7),
    ('08_cross_department_integrity', 8),
    ('09_permission_helper', 9),
    ('10_overall', 10)
),
api_roles(role_name) AS MATERIALIZED (
  VALUES ('anon'), ('authenticated'), ('service_role')
),
helper_routine AS MATERIALIZED (
  SELECT p.oid, p.proowner, p.prosecdef, p.proconfig, p.proacl,
    pg_catalog.pg_get_functiondef(p.oid) AS definition
  FROM pg_catalog.pg_proc p
  JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'current_admin_has_non_table_tennis_permission'
    AND pg_catalog.pg_get_function_identity_arguments(p.oid) = 'requested_permission text'
    AND p.prokind = 'f'
),
raw(result_block, result_order, row_sort, data) AS MATERIALIZED (
  SELECT '01_team_seasons_rls', 1, 'team_seasons',
    jsonb_build_object('table_name', c.relname, 'rls_enabled', c.relrowsecurity,
      'force_rls', c.relforcerowsecurity, 'owner', pg_catalog.pg_get_userbyid(c.relowner))
  FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = 'team_seasons' AND c.relkind IN ('r', 'p')

  UNION ALL
  SELECT '02_team_seasons_policies', 2, format('%s/%s', p.cmd, p.policyname),
    jsonb_build_object('policy_name', p.policyname, 'command', p.cmd,
      'roles', p.roles, 'permissive', p.permissive, 'using', p.qual,
      'with_check', p.with_check)
  FROM pg_catalog.pg_policies p
  WHERE p.schemaname = 'public' AND p.tablename = 'team_seasons'

  UNION ALL
  SELECT '03_team_seasons_api_grants', 3, format('%s/%s', r.role_name, v.privilege_name),
    jsonb_build_object('role', r.role_name, 'privilege', v.privilege_name,
      'effective', has_table_privilege(r.role_name, 'public.team_seasons', v.privilege_name))
  FROM api_roles r
  CROSS JOIN (VALUES ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE')) v(privilege_name)

  UNION ALL
  SELECT '04_trainer_permissions', 4, COALESCE(p.key, '<no-permission>'),
    jsonb_build_object('role_key', r.key, 'role_active', r.is_active,
      'permission_key', p.key, 'permission_category', p.category)
  FROM public.admin_roles r
  LEFT JOIN public.admin_role_permissions rp ON rp.role_id = r.id
  LEFT JOIN public.admin_permissions p ON p.id = rp.permission_id
  WHERE r.key = 'trainer'

  UNION ALL
  SELECT '05_elevated_role_permissions', 5, format('%s/%s', r.key, COALESCE(p.key, '<no-permission>')),
    jsonb_build_object('role_key', r.key, 'role_active', r.is_active,
      'permission_key', p.key, 'permission_category', p.category)
  FROM public.admin_roles r
  LEFT JOIN public.admin_role_permissions rp ON rp.role_id = r.id
  LEFT JOIN public.admin_permissions p ON p.id = rp.permission_id
  WHERE r.key IN ('fussball-vorstand', 'webmaster', 'superadmin')
    AND (p.key IS NULL OR p.key ~* '(team|player|coach|training|media|season)')

  UNION ALL
  SELECT '06_team_scope_relations', 6, relation_name,
    jsonb_build_object('relation_name', relation_name,
      'exists', to_regclass(format('public.%I', relation_name)) IS NOT NULL)
  FROM (VALUES ('admin_profiles'), ('coaches'), ('coach_team_seasons'),
    ('team_seasons'), ('teams'), ('admin_profile_team_assignments')) rel(relation_name)

  UNION ALL
  SELECT '07_assignment_integrity', 7, check_name,
    jsonb_build_object('check', check_name, 'issue_count', issue_count)
  FROM (
    SELECT 'coach_assignment_missing_coach' AS check_name, count(*)::bigint AS issue_count
    FROM public.coach_team_seasons a LEFT JOIN public.coaches c ON c.id = a.coach_id
    WHERE c.id IS NULL
    UNION ALL
    SELECT 'coach_assignment_missing_team_season', count(*)
    FROM public.coach_team_seasons a LEFT JOIN public.team_seasons ts ON ts.id = a.team_season_id
    WHERE ts.id IS NULL
    UNION ALL
    SELECT 'player_assignment_missing_player', count(*)
    FROM public.player_team_seasons a LEFT JOIN public.players p ON p.id = a.player_id
    WHERE p.id IS NULL
    UNION ALL
    SELECT 'player_assignment_missing_team_season', count(*)
    FROM public.player_team_seasons a LEFT JOIN public.team_seasons ts ON ts.id = a.team_season_id
    WHERE ts.id IS NULL
  ) checks

  UNION ALL
  SELECT '08_cross_department_integrity', 8, 'active_coach_cross_department',
    jsonb_build_object('check', 'active_coach_cross_department', 'issue_count', count(*))
  FROM public.coach_team_seasons a
  JOIN public.coaches c ON c.id = a.coach_id
  JOIN public.team_seasons ts ON ts.id = a.team_season_id
  JOIN public.teams t ON t.id = ts.team_id
  WHERE a.is_active AND c.department_id IS DISTINCT FROM t.department_id

  UNION ALL
  SELECT '09_permission_helper', 9, p.oid::regprocedure::text,
    jsonb_build_object(
      'signature', p.oid::regprocedure::text,
      'owner', pg_catalog.pg_get_userbyid(p.proowner),
      'security_definer', p.prosecdef,
      'proconfig', p.proconfig,
      'trainer_direct_generic_write_denied',
        p.definition ILIKE '%role_row.key <> ''trainer''%',
      'public_execute_denied', NOT EXISTS (
        SELECT 1
        FROM pg_catalog.aclexplode(
          COALESCE(p.proacl, pg_catalog.acldefault('f', p.proowner))
        ) acl
        WHERE acl.grantee = 0 AND acl.privilege_type = 'EXECUTE'),
      'authenticated_execute', has_function_privilege('authenticated', p.oid, 'EXECUTE'),
      'service_role_execute', has_function_privilege('service_role', p.oid, 'EXECUTE'),
      'definition', p.definition
    )
  FROM helper_routine p

  UNION ALL
  SELECT '10_overall', 10, 'contract',
    jsonb_build_object(
      'rls_enabled', COALESCE((SELECT c.relrowsecurity FROM pg_catalog.pg_class c
        JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'team_seasons'), false),
      'trainer_has_teams_edit', EXISTS (SELECT 1 FROM public.admin_roles r
        JOIN public.admin_role_permissions rp ON rp.role_id = r.id
        JOIN public.admin_permissions p ON p.id = rp.permission_id
        WHERE r.key = 'trainer' AND r.is_active AND p.key = 'teams.edit'),
      'trainer_has_teams_create', EXISTS (SELECT 1 FROM public.admin_roles r
        JOIN public.admin_role_permissions rp ON rp.role_id = r.id
        JOIN public.admin_permissions p ON p.id = rp.permission_id
        WHERE r.key = 'trainer' AND r.is_active AND p.key = 'teams.create'),
      'insert_policy_requires_teams_create', EXISTS (
        SELECT 1 FROM pg_catalog.pg_policies p
        WHERE p.schemaname = 'public' AND p.tablename = 'team_seasons'
          AND p.cmd = 'INSERT' AND p.with_check ILIKE '%teams.create%'),
      'update_policy_requires_teams_edit', EXISTS (
        SELECT 1 FROM pg_catalog.pg_policies p
        WHERE p.schemaname = 'public' AND p.tablename = 'team_seasons'
          AND p.cmd = 'UPDATE' AND p.qual ILIKE '%teams.edit%'
          AND p.with_check ILIKE '%teams.edit%'),
      'unexpected_policy_count', (
        SELECT count(*) FROM pg_catalog.pg_policies p
        WHERE p.schemaname = 'public' AND p.tablename = 'team_seasons'
          AND p.policyname NOT IN (
            'h1_team_seasons_public_read_active',
            'h1_team_seasons_admin_read_department',
            'team_seasons_insert_department_permission',
            'team_seasons_update_department_permission',
            'team_seasons_delete_department_permission'
          )),
      'trainer_direct_generic_write_denied', EXISTS (
        SELECT 1 FROM helper_routine p
        WHERE p.definition ILIKE '%role_row.key <> ''trainer''%'),
      'database_change_expected', true,
      'overall_ok',
        COALESCE((SELECT c.relrowsecurity FROM pg_catalog.pg_class c
          JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
          WHERE n.nspname = 'public' AND c.relname = 'team_seasons'), false)
        AND EXISTS (SELECT 1 FROM public.admin_roles r
          JOIN public.admin_role_permissions rp ON rp.role_id = r.id
          JOIN public.admin_permissions p ON p.id = rp.permission_id
          WHERE r.key = 'trainer' AND r.is_active AND p.key = 'teams.edit')
        AND NOT EXISTS (SELECT 1 FROM public.admin_roles r
          JOIN public.admin_role_permissions rp ON rp.role_id = r.id
          JOIN public.admin_permissions p ON p.id = rp.permission_id
          WHERE r.key = 'trainer' AND r.is_active AND p.key = 'teams.create')
        AND EXISTS (SELECT 1 FROM pg_catalog.pg_policies p
          WHERE p.schemaname = 'public' AND p.tablename = 'team_seasons'
            AND p.cmd = 'INSERT' AND p.with_check ILIKE '%teams.create%')
        AND EXISTS (SELECT 1 FROM pg_catalog.pg_policies p
          WHERE p.schemaname = 'public' AND p.tablename = 'team_seasons'
            AND p.cmd = 'UPDATE' AND p.qual ILIKE '%teams.edit%'
            AND p.with_check ILIKE '%teams.edit%')
        AND NOT EXISTS (SELECT 1 FROM pg_catalog.pg_policies p
          WHERE p.schemaname = 'public' AND p.tablename = 'team_seasons'
            AND p.policyname NOT IN (
              'h1_team_seasons_public_read_active',
              'h1_team_seasons_admin_read_department',
              'team_seasons_insert_department_permission',
              'team_seasons_update_department_permission',
              'team_seasons_delete_department_permission'
            ))
        AND EXISTS (SELECT 1 FROM helper_routine helper
          WHERE helper.definition ILIKE '%role_row.key <> ''trainer''%')
    )
),
combined AS MATERIALIZED (
  SELECT b.result_block, b.result_order,
    row_number() OVER (PARTITION BY b.result_block ORDER BY r.row_sort NULLS FIRST)::bigint AS row_order,
    CASE WHEN r.data IS NULL THEN 'empty'::text ELSE 'data'::text END AS row_type,
    COALESCE(r.data, jsonb_build_object('message', 'No rows returned for this block.')) AS data
  FROM blocks b
  LEFT JOIN raw r ON r.result_block = b.result_block AND r.result_order = b.result_order
)
SELECT result_block, result_order, row_order, row_type, data
FROM combined
ORDER BY result_order, row_order;
