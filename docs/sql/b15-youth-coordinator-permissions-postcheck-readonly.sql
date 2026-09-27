-- B15 youth-coordinator permissions postcheck (READ ONLY).
-- Execute manually only after the proposal. One statement / one result set.

WITH
blocks(result_block, result_order) AS (
  VALUES
    ('01_youth_role', 1),
    ('02_youth_target_permissions', 2),
    ('03_youth_forbidden_permissions', 3),
    ('04_reference_role_permissions', 4),
    ('05_team_seasons_rls', 5),
    ('06_team_seasons_policies', 6),
    ('07_team_seasons_write_contract', 7),
    ('08_role_permission_integrity', 8),
    ('09_department_foundation', 9),
    ('10_results_foundation', 10),
    ('11_overall', 11)
),
target_permissions(permission_key) AS (
  VALUES
    ('results.view'), ('results.create'), ('results.edit'),
    ('results.delete'), ('results.publish'),
    ('teams.view'), ('teams.edit'), ('teams.delete')
),
reference_roles(role_key) AS (
  VALUES ('superadmin'), ('trainer'), ('webmaster'), ('fussball-vorstand')
),
youth_role AS MATERIALIZED (
  SELECT id, key, name, is_active
  FROM public.admin_roles
  WHERE key = 'jugendleiter'
),
youth_permissions AS MATERIALIZED (
  SELECT permission_row.key AS permission_key
  FROM youth_role AS role_row
  JOIN public.admin_role_permissions AS link ON link.role_id = role_row.id
  JOIN public.admin_permissions AS permission_row ON permission_row.id = link.permission_id
),
checks AS MATERIALIZED (
  SELECT 'active_youth_role_exactly_once' AS check_name,
    ((SELECT count(*) FROM youth_role WHERE is_active IS TRUE) = 1) AS ok
  UNION ALL
  SELECT 'settings_view_removed', NOT EXISTS (SELECT 1 FROM youth_permissions WHERE permission_key = 'settings.view')
  UNION ALL
  SELECT 'settings_edit_absent', NOT EXISTS (SELECT 1 FROM youth_permissions WHERE permission_key = 'settings.edit')
  UNION ALL
  SELECT 'all_results_permissions_present',
    ((SELECT count(*) FROM youth_permissions WHERE permission_key LIKE 'results.%') = 5)
  UNION ALL
  SELECT 'teams_create_absent', NOT EXISTS (SELECT 1 FROM youth_permissions WHERE permission_key = 'teams.create')
  UNION ALL
  SELECT 'required_team_permissions_present',
    ((SELECT count(*) FROM youth_permissions WHERE permission_key IN ('teams.view', 'teams.edit', 'teams.delete')) = 3)
  UNION ALL
  SELECT 'team_seasons_rls_enabled', COALESCE((
    SELECT relation.relrowsecurity
    FROM pg_catalog.pg_class AS relation
    JOIN pg_catalog.pg_namespace AS namespace ON namespace.oid = relation.relnamespace
    WHERE namespace.nspname = 'public' AND relation.relname = 'team_seasons'
  ), false)
  UNION ALL
  SELECT 'team_seasons_policy_count_unchanged',
    ((SELECT count(*) FROM pg_catalog.pg_policies WHERE schemaname = 'public' AND tablename = 'team_seasons') = 5)
  UNION ALL
  SELECT 'insert_contract_uses_teams_create', EXISTS (
    SELECT 1 FROM pg_catalog.pg_policies
    WHERE schemaname = 'public' AND tablename = 'team_seasons' AND cmd = 'INSERT'
      AND COALESCE(with_check, '') ILIKE '%teams.create%'
  )
  UNION ALL
  SELECT 'update_contract_uses_teams_edit', EXISTS (
    SELECT 1 FROM pg_catalog.pg_policies
    WHERE schemaname = 'public' AND tablename = 'team_seasons' AND cmd = 'UPDATE'
      AND COALESCE(qual, '') ILIKE '%teams.edit%'
      AND COALESCE(with_check, '') ILIKE '%teams.edit%'
  )
  UNION ALL
  SELECT 'no_duplicate_role_permission_links', NOT EXISTS (
    SELECT 1 FROM public.admin_role_permissions
    GROUP BY role_id, permission_id HAVING count(*) > 1
  )
  UNION ALL
  SELECT 'football_and_table_tennis_departments_intact',
    ((SELECT count(*) FROM public.departments WHERE slug IN ('fussball', 'tischtennis') AND is_active IS TRUE) = 2)
  UNION ALL
  SELECT 'results_foundation_intact',
    (pg_catalog.to_regclass('public.club_results') IS NOT NULL
      AND (SELECT count(*) FROM public.admin_permissions WHERE key LIKE 'results.%') = 5)
),
raw(result_block, result_order, row_sort, data) AS MATERIALIZED (
  SELECT '01_youth_role', 1, role_row.key,
    jsonb_build_object('role_key', role_row.key, 'role_name', role_row.name, 'is_active', role_row.is_active)
  FROM youth_role AS role_row

  UNION ALL
  SELECT '02_youth_target_permissions', 2, target.permission_key,
    jsonb_build_object(
      'permission_key', target.permission_key,
      'assigned', EXISTS (SELECT 1 FROM youth_permissions current_row WHERE current_row.permission_key = target.permission_key)
    )
  FROM target_permissions AS target

  UNION ALL
  SELECT '03_youth_forbidden_permissions', 3, forbidden.permission_key,
    jsonb_build_object(
      'permission_key', forbidden.permission_key,
      'assigned', EXISTS (SELECT 1 FROM youth_permissions current_row WHERE current_row.permission_key = forbidden.permission_key),
      'expected', false
    )
  FROM (VALUES ('settings.view'), ('settings.edit'), ('teams.create')) AS forbidden(permission_key)

  UNION ALL
  SELECT '04_reference_role_permissions', 4,
    format('%s/%s', role_row.key, permission_row.key),
    jsonb_build_object('role_key', role_row.key, 'permission_key', permission_row.key)
  FROM reference_roles AS expected_role
  JOIN public.admin_roles AS role_row ON role_row.key = expected_role.role_key
  JOIN public.admin_role_permissions AS link ON link.role_id = role_row.id
  JOIN public.admin_permissions AS permission_row ON permission_row.id = link.permission_id
  WHERE permission_row.key LIKE 'teams.%'
     OR permission_row.key LIKE 'results.%'
     OR permission_row.key LIKE 'settings.%'

  UNION ALL
  SELECT '05_team_seasons_rls', 5, relation.relname,
    jsonb_build_object(
      'table_name', relation.relname,
      'rls_enabled', relation.relrowsecurity,
      'force_rls', relation.relforcerowsecurity,
      'owner', pg_catalog.pg_get_userbyid(relation.relowner)
    )
  FROM pg_catalog.pg_class AS relation
  JOIN pg_catalog.pg_namespace AS namespace ON namespace.oid = relation.relnamespace
  WHERE namespace.nspname = 'public' AND relation.relname = 'team_seasons'

  UNION ALL
  SELECT '06_team_seasons_policies', 6, format('%s/%s', policy.cmd, policy.policyname),
    jsonb_build_object(
      'policy_name', policy.policyname, 'command', policy.cmd,
      'roles', policy.roles, 'using', policy.qual, 'with_check', policy.with_check
    )
  FROM pg_catalog.pg_policies AS policy
  WHERE policy.schemaname = 'public' AND policy.tablename = 'team_seasons'

  UNION ALL
  SELECT '07_team_seasons_write_contract', 7, format('%s/%s', policy.cmd, policy.policyname),
    jsonb_build_object(
      'policy_name', policy.policyname, 'command', policy.cmd,
      'uses_teams_create', COALESCE(policy.qual, '') ILIKE '%teams.create%' OR COALESCE(policy.with_check, '') ILIKE '%teams.create%',
      'uses_teams_edit', COALESCE(policy.qual, '') ILIKE '%teams.edit%' OR COALESCE(policy.with_check, '') ILIKE '%teams.edit%',
      'using', policy.qual, 'with_check', policy.with_check
    )
  FROM pg_catalog.pg_policies AS policy
  WHERE policy.schemaname = 'public' AND policy.tablename = 'team_seasons'
    AND policy.cmd IN ('INSERT', 'UPDATE')

  UNION ALL
  SELECT '08_role_permission_integrity', 8, check_row.check_name,
    jsonb_build_object('check', check_row.check_name, 'ok', check_row.ok)
  FROM checks AS check_row
  WHERE check_row.check_name IN (
    'no_duplicate_role_permission_links',
    'active_youth_role_exactly_once'
  )

  UNION ALL
  SELECT '09_department_foundation', 9, department.slug,
    jsonb_build_object(
      'department_slug', department.slug,
      'is_active', department.is_active,
      'active_team_season_count', count(DISTINCT team_season.id) FILTER (
        WHERE team.is_active IS TRUE AND team_season.is_active IS TRUE
      )
    )
  FROM public.departments AS department
  LEFT JOIN public.teams AS team ON team.department_id = department.id
  LEFT JOIN public.team_seasons AS team_season ON team_season.team_id = team.id
  WHERE department.slug IN ('fussball', 'tischtennis')
  GROUP BY department.slug, department.is_active

  UNION ALL
  SELECT '10_results_foundation', 10, department.slug,
    jsonb_build_object(
      'department_slug', department.slug,
      'result_count', count(result_row.id),
      'published_result_count', count(*) FILTER (WHERE result_row.is_published IS TRUE)
    )
  FROM public.departments AS department
  LEFT JOIN public.teams AS team ON team.department_id = department.id
  LEFT JOIN public.team_seasons AS team_season ON team_season.team_id = team.id
  LEFT JOIN public.club_results AS result_row ON result_row.team_season_id = team_season.id
  WHERE department.slug IN ('fussball', 'tischtennis')
  GROUP BY department.slug

  UNION ALL
  SELECT '11_overall', 11, check_row.check_name,
    jsonb_build_object('check', check_row.check_name, 'ok', check_row.ok)
  FROM checks AS check_row

  UNION ALL
  SELECT '11_overall', 11, 'zz_overall_ok',
    jsonb_build_object('check', 'overall_ok', 'ok', bool_and(check_row.ok))
  FROM checks AS check_row
),
combined AS MATERIALIZED (
  SELECT
    block.result_block,
    block.result_order,
    row_number() OVER (PARTITION BY block.result_block ORDER BY raw.row_sort NULLS FIRST)::bigint AS row_order,
    CASE WHEN raw.data IS NULL THEN 'empty'::text ELSE 'data'::text END AS row_type,
    COALESCE(raw.data, jsonb_build_object('message', 'No rows returned for this block.')) AS data
  FROM blocks AS block
  LEFT JOIN raw
    ON raw.result_block = block.result_block
   AND raw.result_order = block.result_order
)
SELECT result_block, result_order, row_order, row_type, data
FROM combined
ORDER BY result_order, row_order;
