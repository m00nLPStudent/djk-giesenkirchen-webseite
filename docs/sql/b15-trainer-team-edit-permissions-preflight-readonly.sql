-- B15 trainer team edit permissions - live preflight (READ ONLY)
-- Run manually in Supabase SQL Editor with "No limit".
-- One SELECT statement, one combined result set, no personal contact data.

WITH
blocks(result_block, result_order) AS MATERIALIZED (
  VALUES
    ('01_schema_team_seasons', 1), ('02_schema_teams', 2),
    ('03_schema_coaches', 3), ('04_trainer_team_assignment_schema', 4),
    ('05_team_related_tables', 5), ('06_team_seasons_rls_status', 6),
    ('07_team_seasons_policies', 7), ('08_team_seasons_grants', 8),
    ('09_teams_policies', 9), ('10_coaches_policies', 10),
    ('11_assignment_table_policies', 11), ('12_team_related_rls_policies', 12),
    ('13_team_related_grants', 13), ('14_team_related_triggers', 14),
    ('15_team_related_functions', 15), ('16_permission_catalog_team_related', 16),
    ('17_trainer_role_permissions', 17), ('18_football_board_permissions', 18),
    ('19_webmaster_permissions', 19), ('20_superadmin_permissions', 20),
    ('21_admin_role_structure', 21), ('22_admin_profile_role_mapping', 22),
    ('23_department_structure', 23), ('24_active_football_team_seasons', 24),
    ('25_coach_team_assignments', 25), ('26_assignment_integrity', 26),
    ('27_orphan_assignments', 27), ('28_cross_department_assignments', 28),
    ('29_media_team_contract', 29), ('30_existing_team_scope_helpers', 30),
    ('31_team_season_write_helpers', 31), ('32_audit_contract', 32),
    ('33_relevant_fk_contract', 33), ('34_rls_security_definer_dependencies', 34),
    ('35_summary', 35)
),
team_relations(table_name) AS MATERIALIZED (
  VALUES
    ('teams'), ('team_seasons'), ('seasons'), ('departments'), ('team_templates'),
    ('coaches'), ('coach_team_seasons'), ('players'), ('player_team_seasons'),
    ('admin_profile_team_assignments'), ('team_training_times'),
    ('team_training_exceptions'), ('team_season_year_groups'),
    ('team_season_external_competitions'), ('media_assets'), ('media_asset_usages')
),
assignment_relations(table_name) AS MATERIALIZED (
  VALUES ('coach_team_seasons'), ('player_team_seasons'), ('admin_profile_team_assignments')
),
api_roles(role_name) AS MATERIALIZED (
  VALUES ('anon'), ('authenticated'), ('service_role')
),
target_roles(role_key) AS MATERIALIZED (
  VALUES ('trainer'), ('fussball-vorstand'), ('webmaster'), ('superadmin')
),
safe_routines AS MATERIALIZED (
  SELECT p.*, n.nspname
  FROM pg_catalog.pg_proc AS p
  JOIN pg_catalog.pg_namespace AS n ON n.oid = p.pronamespace
  WHERE p.prokind IN ('f', 'p')
    AND n.nspname = 'public'
),
routine_inventory AS MATERIALIZED (
  SELECT
    p.oid,
    p.nspname,
    p.proname,
    pg_catalog.pg_get_function_identity_arguments(p.oid) AS identity_arguments,
    pg_catalog.pg_get_function_result(p.oid) AS result_type,
    pg_catalog.pg_get_userbyid(p.proowner) AS owner_name,
    p.prosecdef,
    p.proconfig,
    p.proacl,
    pg_catalog.pg_get_functiondef(p.oid) AS function_definition
  FROM safe_routines AS p
),
raw(result_block, result_order, row_sort, data) AS MATERIALIZED (
  SELECT '01_schema_team_seasons', 1, lpad(c.ordinal_position::text, 5, '0'),
    jsonb_build_object('column_name', c.column_name, 'data_type', c.data_type,
      'udt_name', c.udt_name, 'nullable', c.is_nullable, 'default', c.column_default,
      'identity', c.is_identity, 'generated', c.is_generated)
  FROM information_schema.columns AS c
  WHERE c.table_schema = 'public' AND c.table_name = 'team_seasons'

  UNION ALL
  SELECT '02_schema_teams', 2, lpad(c.ordinal_position::text, 5, '0'),
    jsonb_build_object('column_name', c.column_name, 'data_type', c.data_type,
      'udt_name', c.udt_name, 'nullable', c.is_nullable, 'default', c.column_default,
      'identity', c.is_identity, 'generated', c.is_generated)
  FROM information_schema.columns AS c
  WHERE c.table_schema = 'public' AND c.table_name = 'teams'

  UNION ALL
  SELECT '03_schema_coaches', 3, lpad(c.ordinal_position::text, 5, '0'),
    jsonb_build_object('column_name', c.column_name, 'data_type', c.data_type,
      'udt_name', c.udt_name, 'nullable', c.is_nullable, 'default', c.column_default,
      'identity', c.is_identity, 'generated', c.is_generated)
  FROM information_schema.columns AS c
  WHERE c.table_schema = 'public' AND c.table_name = 'coaches'

  UNION ALL
  SELECT '04_trainer_team_assignment_schema', 4,
    format('%s/%05s', c.table_name, c.ordinal_position),
    jsonb_build_object('table_name', c.table_name, 'column_name', c.column_name,
      'data_type', c.data_type, 'udt_name', c.udt_name, 'nullable', c.is_nullable,
      'default', c.column_default, 'identity', c.is_identity, 'generated', c.is_generated)
  FROM information_schema.columns AS c
  WHERE c.table_schema = 'public'
    AND c.table_name IN (SELECT table_name FROM assignment_relations)

  UNION ALL
  SELECT '05_team_related_tables', 5, target.table_name,
    jsonb_build_object('table_name', target.table_name, 'exists', cls.oid IS NOT NULL,
      'relation_kind', cls.relkind, 'owner', pg_catalog.pg_get_userbyid(cls.relowner),
      'estimated_rows', cls.reltuples::bigint)
  FROM team_relations AS target
  LEFT JOIN pg_catalog.pg_namespace AS ns ON ns.nspname = 'public'
  LEFT JOIN pg_catalog.pg_class AS cls ON cls.relnamespace = ns.oid
    AND cls.relname = target.table_name AND cls.relkind IN ('r', 'p', 'v', 'm')

  UNION ALL
  SELECT '06_team_seasons_rls_status', 6, cls.relname,
    jsonb_build_object('table_name', cls.relname, 'rls_enabled', cls.relrowsecurity,
      'force_rls', cls.relforcerowsecurity, 'owner', pg_catalog.pg_get_userbyid(cls.relowner),
      'table_acl', cls.relacl)
  FROM pg_catalog.pg_class AS cls
  JOIN pg_catalog.pg_namespace AS ns ON ns.oid = cls.relnamespace
  WHERE ns.nspname = 'public' AND cls.relname = 'team_seasons' AND cls.relkind IN ('r', 'p')

  UNION ALL
  SELECT '07_team_seasons_policies', 7, format('%s/%s', p.cmd, p.policyname),
    jsonb_build_object('policy_name', p.policyname, 'command', p.cmd,
      'permissive', p.permissive, 'roles', p.roles, 'using', p.qual, 'with_check', p.with_check)
  FROM pg_catalog.pg_policies AS p
  WHERE p.schemaname = 'public' AND p.tablename = 'team_seasons'

  UNION ALL
  SELECT '08_team_seasons_grants', 8, format('%s/%s', role.role_name, privilege.privilege_name),
    jsonb_build_object('role', role.role_name, 'privilege', privilege.privilege_name,
      'effective', has_table_privilege(role.role_name, 'public.team_seasons', privilege.privilege_name))
  FROM api_roles AS role
  CROSS JOIN (VALUES ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE'), ('TRUNCATE'), ('REFERENCES'), ('TRIGGER')) AS privilege(privilege_name)

  UNION ALL
  SELECT '09_teams_policies', 9, format('%s/%s', p.cmd, p.policyname),
    jsonb_build_object('policy_name', p.policyname, 'command', p.cmd,
      'permissive', p.permissive, 'roles', p.roles, 'using', p.qual, 'with_check', p.with_check)
  FROM pg_catalog.pg_policies AS p
  WHERE p.schemaname = 'public' AND p.tablename = 'teams'

  UNION ALL
  SELECT '10_coaches_policies', 10, format('%s/%s', p.cmd, p.policyname),
    jsonb_build_object('policy_name', p.policyname, 'command', p.cmd,
      'permissive', p.permissive, 'roles', p.roles, 'using', p.qual, 'with_check', p.with_check)
  FROM pg_catalog.pg_policies AS p
  WHERE p.schemaname = 'public' AND p.tablename = 'coaches'

  UNION ALL
  SELECT '11_assignment_table_policies', 11, format('%s/%s/%s', p.tablename, p.cmd, p.policyname),
    jsonb_build_object('table_name', p.tablename, 'policy_name', p.policyname,
      'command', p.cmd, 'permissive', p.permissive, 'roles', p.roles,
      'using', p.qual, 'with_check', p.with_check)
  FROM pg_catalog.pg_policies AS p
  WHERE p.schemaname = 'public' AND p.tablename IN (SELECT table_name FROM assignment_relations)

  UNION ALL
  SELECT '12_team_related_rls_policies', 12, format('%s/%s/%s', p.tablename, p.cmd, p.policyname),
    jsonb_build_object('table_name', p.tablename, 'policy_name', p.policyname,
      'command', p.cmd, 'permissive', p.permissive, 'roles', p.roles,
      'using', p.qual, 'with_check', p.with_check)
  FROM pg_catalog.pg_policies AS p
  WHERE p.schemaname = 'public' AND p.tablename IN (SELECT table_name FROM team_relations)

  UNION ALL
  SELECT '13_team_related_grants', 13,
    format('%s/%s/%s', target.table_name, role.role_name, privilege.privilege_name),
    jsonb_build_object('table_name', target.table_name, 'role', role.role_name,
      'privilege', privilege.privilege_name,
      'effective', CASE WHEN to_regclass(format('public.%I', target.table_name)) IS NULL THEN NULL
        ELSE has_table_privilege(role.role_name, format('public.%I', target.table_name), privilege.privilege_name) END)
  FROM team_relations AS target
  CROSS JOIN api_roles AS role
  CROSS JOIN (VALUES ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE'), ('TRUNCATE'), ('REFERENCES'), ('TRIGGER')) AS privilege(privilege_name)

  UNION ALL
  SELECT '14_team_related_triggers', 14, format('%s/%s', tbl.relname, trg.tgname),
    jsonb_build_object('table_name', tbl.relname, 'trigger_name', trg.tgname,
      'enabled', trg.tgenabled, 'definition', pg_catalog.pg_get_triggerdef(trg.oid, true),
      'function_signature', trg.tgfoid::regprocedure::text)
  FROM pg_catalog.pg_trigger AS trg
  JOIN pg_catalog.pg_class AS tbl ON tbl.oid = trg.tgrelid
  JOIN pg_catalog.pg_namespace AS ns ON ns.oid = tbl.relnamespace
  WHERE ns.nspname = 'public' AND NOT trg.tgisinternal
    AND tbl.relname IN (SELECT table_name FROM team_relations)

  UNION ALL
  SELECT '15_team_related_functions', 15, format('%s(%s)', r.proname, r.identity_arguments),
    jsonb_build_object('signature', format('%I.%I(%s)', r.nspname, r.proname, r.identity_arguments),
      'result_type', r.result_type, 'owner', r.owner_name, 'security_definer', r.prosecdef,
      'proconfig', r.proconfig, 'public_execute', EXISTS (
        SELECT 1 FROM pg_catalog.aclexplode(COALESCE(r.proacl, pg_catalog.acldefault('f', p.proowner))) acl
        WHERE acl.grantee = 0 AND acl.privilege_type = 'EXECUTE'),
      'anon_execute', has_function_privilege('anon', r.oid, 'EXECUTE'),
      'authenticated_execute', has_function_privilege('authenticated', r.oid, 'EXECUTE'),
      'service_role_execute', has_function_privilege('service_role', r.oid, 'EXECUTE'),
      'definition', r.function_definition)
  FROM routine_inventory AS r
  JOIN safe_routines AS p ON p.oid = r.oid
  WHERE r.function_definition ~* '(team_seasons|coach_team_seasons|player_team_seasons|team_training_times|admin_profile_team_assignments|media_asset_usages)'

  UNION ALL
  SELECT '16_permission_catalog_team_related', 16, permission.key,
    jsonb_build_object('permission_id', permission.id, 'permission_key', permission.key,
      'name', permission.name, 'description', permission.description, 'category', permission.category)
  FROM public.admin_permissions AS permission
  WHERE permission.key ~* '(team|coach|player|training|media|football|squad|contact|season)'

  UNION ALL
  SELECT CASE role.key
      WHEN 'trainer' THEN '17_trainer_role_permissions'
      WHEN 'fussball-vorstand' THEN '18_football_board_permissions'
      WHEN 'webmaster' THEN '19_webmaster_permissions'
      ELSE '20_superadmin_permissions'
    END,
    CASE role.key WHEN 'trainer' THEN 17 WHEN 'fussball-vorstand' THEN 18 WHEN 'webmaster' THEN 19 ELSE 20 END,
    COALESCE(permission.key, '<no-permission>'),
    jsonb_build_object('role_id', role.id, 'role_key', role.key, 'role_active', role.is_active,
      'permission_id', permission.id, 'permission_key', permission.key,
      'permission_category', permission.category)
  FROM public.admin_roles AS role
  LEFT JOIN public.admin_role_permissions AS link ON link.role_id = role.id
  LEFT JOIN public.admin_permissions AS permission ON permission.id = link.permission_id
  WHERE role.key IN (SELECT role_key FROM target_roles)
    AND (permission.key IS NULL OR permission.key ~* '(team|coach|player|training|media|football|squad|contact|season)')

  UNION ALL
  SELECT '21_admin_role_structure', 21, format('%s/%s', c.table_name, lpad(c.ordinal_position::text, 5, '0')),
    jsonb_build_object('table_name', c.table_name, 'column_name', c.column_name,
      'data_type', c.data_type, 'nullable', c.is_nullable, 'default', c.column_default)
  FROM information_schema.columns AS c
  WHERE c.table_schema = 'public'
    AND c.table_name IN ('admin_roles', 'admin_permissions', 'admin_role_permissions', 'admin_user_roles', 'admin_profiles')

  UNION ALL
  SELECT '22_admin_profile_role_mapping', 22, format('%s/%s', role.key, link.user_id),
    jsonb_build_object('admin_profile_id', link.user_id, 'role_id', link.role_id,
      'role_key', role.key, 'role_active', role.is_active, 'is_primary', link.is_primary)
  FROM public.admin_user_roles AS link
  JOIN public.admin_roles AS role ON role.id = link.role_id
  WHERE role.key IN (SELECT role_key FROM target_roles)

  UNION ALL
  SELECT '23_department_structure', 23, department.slug,
    jsonb_build_object('department_id', department.id, 'slug', department.slug,
      'is_active', department.is_active)
  FROM public.departments AS department

  UNION ALL
  SELECT '24_active_football_team_seasons', 24, format('%s/%s', season_row.team_id, season_row.id),
    jsonb_build_object('team_season_id', season_row.id, 'team_id', season_row.team_id,
      'season_id', season_row.season_id, 'department_id', team.department_id,
      'team_active', team.is_active, 'team_season_active', season_row.is_active)
  FROM public.team_seasons AS season_row
  JOIN public.teams AS team ON team.id = season_row.team_id
  JOIN public.departments AS department ON department.id = team.department_id
  WHERE department.slug = 'fussball' AND department.is_active AND team.is_active AND season_row.is_active

  UNION ALL
  SELECT '25_coach_team_assignments', 25, assignment.id::text,
    jsonb_build_object('assignment_id', assignment.id, 'coach_id', assignment.coach_id,
      'team_season_id', assignment.team_season_id, 'team_id', season_row.team_id,
      'season_id', season_row.season_id, 'department_id', team.department_id,
      'assignment_active', assignment.is_active, 'team_season_active', season_row.is_active,
      'team_active', team.is_active)
  FROM public.coach_team_seasons AS assignment
  LEFT JOIN public.team_seasons AS season_row ON season_row.id = assignment.team_season_id
  LEFT JOIN public.teams AS team ON team.id = season_row.team_id

  UNION ALL
  SELECT '26_assignment_integrity', 26, integrity.check_name,
    jsonb_build_object('check', integrity.check_name, 'count', integrity.issue_count)
  FROM (
    SELECT 'duplicate_active_coach_team_season' AS check_name, count(*)::bigint AS issue_count
    FROM (SELECT coach_id, team_season_id FROM public.coach_team_seasons WHERE is_active
      GROUP BY coach_id, team_season_id HAVING count(*) > 1) duplicate_rows
    UNION ALL
    SELECT 'coach_assignment_missing_coach', count(*) FROM public.coach_team_seasons assignment
      LEFT JOIN public.coaches coach ON coach.id = assignment.coach_id WHERE coach.id IS NULL
    UNION ALL
    SELECT 'coach_assignment_missing_team_season', count(*) FROM public.coach_team_seasons assignment
      LEFT JOIN public.team_seasons season_row ON season_row.id = assignment.team_season_id WHERE season_row.id IS NULL
  ) AS integrity

  UNION ALL
  SELECT '27_orphan_assignments', 27, orphan.check_name,
    jsonb_build_object('check', orphan.check_name, 'count', orphan.issue_count)
  FROM (
    SELECT 'player_assignment_missing_player' AS check_name, count(*)::bigint AS issue_count
    FROM public.player_team_seasons assignment
    LEFT JOIN public.players player ON player.id = assignment.player_id WHERE player.id IS NULL
    UNION ALL
    SELECT 'player_assignment_missing_team_season', count(*) FROM public.player_team_seasons assignment
    LEFT JOIN public.team_seasons season_row ON season_row.id = assignment.team_season_id WHERE season_row.id IS NULL
  ) AS orphan

  UNION ALL
  SELECT '28_cross_department_assignments', 28, assignment.id::text,
    jsonb_build_object('assignment_id', assignment.id, 'coach_id', assignment.coach_id,
      'team_season_id', assignment.team_season_id, 'coach_department_id', coach.department_id,
      'team_department_id', team.department_id)
  FROM public.coach_team_seasons AS assignment
  JOIN public.coaches AS coach ON coach.id = assignment.coach_id
  JOIN public.team_seasons AS season_row ON season_row.id = assignment.team_season_id
  JOIN public.teams AS team ON team.id = season_row.team_id
  WHERE assignment.is_active AND coach.department_id IS DISTINCT FROM team.department_id

  UNION ALL
  SELECT '29_media_team_contract', 29, format('%s/%s', c.table_name, c.column_name),
    jsonb_build_object('table_name', c.table_name, 'column_name', c.column_name,
      'data_type', c.data_type, 'nullable', c.is_nullable)
  FROM information_schema.columns AS c
  WHERE c.table_schema = 'public'
    AND ((c.table_name IN ('teams', 'team_seasons') AND c.column_name ILIKE '%media_asset_id%')
      OR (c.table_name = 'media_asset_usages' AND c.column_name IN ('media_asset_id', 'entity_type', 'entity_id', 'field_name')))

  UNION ALL
  SELECT '30_existing_team_scope_helpers', 30, format('%s(%s)', r.proname, r.identity_arguments),
    jsonb_build_object('signature', format('%I.%I(%s)', r.nspname, r.proname, r.identity_arguments),
      'owner', r.owner_name, 'security_definer', r.prosecdef, 'proconfig', r.proconfig,
      'definition', r.function_definition)
  FROM routine_inventory AS r
  WHERE r.proname ~* '(team|scope|permission|coach)'
    AND r.function_definition ~* '(auth\.uid|admin_profile|team_season|team_id|permission)'

  UNION ALL
  SELECT '31_team_season_write_helpers', 31, format('%s(%s)', r.proname, r.identity_arguments),
    jsonb_build_object('signature', format('%I.%I(%s)', r.nspname, r.proname, r.identity_arguments),
      'owner', r.owner_name, 'security_definer', r.prosecdef, 'proconfig', r.proconfig,
      'definition', r.function_definition)
  FROM routine_inventory AS r
  WHERE r.function_definition ~* '(insert[[:space:]]+into|update|delete[[:space:]]+from)[[:space:][:alnum:]_\."]*team_seasons'

  UNION ALL
  SELECT '32_audit_contract', 32, format('%s/%s', c.table_name, c.column_name),
    jsonb_build_object('table_name', c.table_name, 'column_name', c.column_name,
      'data_type', c.data_type, 'nullable', c.is_nullable, 'default', c.column_default)
  FROM information_schema.columns AS c
  WHERE c.table_schema = 'public' AND c.table_name IN (SELECT table_name FROM team_relations)
    AND c.column_name IN ('created_at', 'created_by', 'updated_at', 'updated_by')

  UNION ALL
  SELECT '33_relevant_fk_contract', 33, format('%s/%s', source.relname, constraint_row.conname),
    jsonb_build_object('source_table', source.relname, 'constraint_name', constraint_row.conname,
      'constraint_type', constraint_row.contype,
      'target_table', target.relname, 'definition', pg_catalog.pg_get_constraintdef(constraint_row.oid, true))
  FROM pg_catalog.pg_constraint AS constraint_row
  JOIN pg_catalog.pg_class AS source ON source.oid = constraint_row.conrelid
  JOIN pg_catalog.pg_namespace AS ns ON ns.oid = source.relnamespace
  LEFT JOIN pg_catalog.pg_class AS target ON target.oid = constraint_row.confrelid
  WHERE ns.nspname = 'public' AND source.relname IN (SELECT table_name FROM team_relations)
    AND constraint_row.contype IN ('p', 'f', 'u', 'c')

  UNION ALL
  SELECT '34_rls_security_definer_dependencies', 34,
    format('%s/%s(%s)', dependent.relname, r.proname, r.identity_arguments),
    jsonb_build_object('table_name', dependent.relname,
      'function_signature', format('%I.%I(%s)', r.nspname, r.proname, r.identity_arguments),
      'owner', r.owner_name, 'security_definer', r.prosecdef, 'proconfig', r.proconfig,
      'definition', r.function_definition)
  FROM routine_inventory AS r
  JOIN pg_catalog.pg_depend AS dependency ON dependency.classid = 'pg_proc'::regclass
    AND dependency.objid = r.oid AND dependency.refclassid = 'pg_class'::regclass
  JOIN pg_catalog.pg_class AS dependent ON dependent.oid = dependency.refobjid
  JOIN pg_catalog.pg_namespace AS ns ON ns.oid = dependent.relnamespace
  WHERE ns.nspname = 'public' AND dependent.relname IN (SELECT table_name FROM team_relations)

  UNION ALL
  SELECT '35_summary', 35, summary.check_name,
    jsonb_build_object('check', summary.check_name, 'value', summary.check_value)
  FROM (
    SELECT 'team_seasons_rls_enabled' AS check_name,
      COALESCE((SELECT cls.relrowsecurity::text FROM pg_catalog.pg_class cls
        JOIN pg_catalog.pg_namespace ns ON ns.oid = cls.relnamespace
        WHERE ns.nspname = 'public' AND cls.relname = 'team_seasons'), '<missing>') AS check_value
    UNION ALL SELECT 'team_seasons_policy_count', count(*)::text FROM pg_catalog.pg_policies
      WHERE schemaname = 'public' AND tablename = 'team_seasons'
    UNION ALL SELECT 'trainer_team_permission_count', count(*)::text
      FROM public.admin_roles role
      JOIN public.admin_role_permissions link ON link.role_id = role.id
      JOIN public.admin_permissions permission ON permission.id = link.permission_id
      WHERE role.key = 'trainer' AND permission.key ~* '(team|coach|player|training|media|football|squad|contact|season)'
    UNION ALL SELECT 'active_football_team_season_count', count(*)::text
      FROM public.team_seasons season_row JOIN public.teams team ON team.id = season_row.team_id
      JOIN public.departments department ON department.id = team.department_id
      WHERE department.slug = 'fussball' AND department.is_active AND team.is_active AND season_row.is_active
    UNION ALL SELECT 'active_coach_team_assignment_count', count(*)::text
      FROM public.coach_team_seasons WHERE is_active
    UNION ALL SELECT 'manual_profile_team_assignment_relation_exists',
      (to_regclass('public.admin_profile_team_assignments') IS NOT NULL)::text
  ) AS summary
),
combined AS MATERIALIZED (
  SELECT
    block.result_block,
    block.result_order,
    row_number() OVER (PARTITION BY block.result_block ORDER BY raw.row_sort NULLS FIRST)::bigint AS row_order,
    CASE WHEN raw.data IS NULL THEN 'empty'::text ELSE 'data'::text END AS row_type,
    COALESCE(raw.data, jsonb_build_object('message', 'No rows returned for this block.')) AS data
  FROM blocks AS block
  LEFT JOIN raw ON raw.result_block = block.result_block AND raw.result_order = block.result_order
)
SELECT result_block, result_order, row_order, row_type, data
FROM combined
ORDER BY result_order, row_order;
