-- B15 results module: live database preflight (READ ONLY)
-- Execute this complete file once in the Supabase SQL Editor with "No limit" selected.
-- The single final resultset preserves all 30 logical result blocks as ordered JSONB rows.
-- Empty result blocks emit an explicit marker row and therefore remain visible in CSV exports.
-- This inventory does not call application functions and does not expose profile/user data.

WITH
-- RMPF.01_CORE_AND_TARGET_RELATIONS
block_01_source AS MATERIALIZED (
SELECT
  'RMPF.01_CORE_AND_TARGET_RELATIONS' AS section,
  expected.relation_name,
  to_regclass(format('public.%I', expected.relation_name)) IS NOT NULL AS exists_in_public,
  class.relkind,
  CASE class.relkind WHEN 'r' THEN 'table' WHEN 'p' THEN 'partitioned table'
    WHEN 'v' THEN 'view' WHEN 'm' THEN 'materialized view' WHEN 'f' THEN 'foreign table'
    ELSE NULL END AS relation_kind,
  pg_get_userbyid(class.relowner) AS owner
FROM (VALUES
  ('club_results'), ('teams'), ('team_seasons'), ('seasons'), ('departments'),
  ('media_assets'), ('media_asset_usages'), ('admin_permissions'), ('admin_roles'),
  ('admin_role_permissions'), ('admin_user_roles'), ('board_roles'),
  ('news'), ('events'), ('downloads')
) AS expected(relation_name)
LEFT JOIN pg_namespace namespace ON namespace.nspname = 'public'
LEFT JOIN pg_class class ON class.relnamespace = namespace.oid AND class.relname = expected.relation_name
ORDER BY expected.relation_name
),
block_01_rows AS MATERIALIZED (
  SELECT
    'RMPF.01_CORE_AND_TARGET_RELATIONS'::text AS result_block,
    1::integer AS result_order,
    row_number() OVER (ORDER BY source_row.relation_name)::bigint AS row_order,
    'data'::text AS row_type,
    to_jsonb(source_row) AS data
  FROM block_01_source source_row
),
block_01_export AS MATERIALIZED (
  SELECT result_block, result_order, row_order, row_type, data
  FROM block_01_rows
  UNION ALL
  SELECT
    'RMPF.01_CORE_AND_TARGET_RELATIONS'::text,
    1::integer,
    1::bigint,
    'empty'::text,
    jsonb_build_object('message', 'block executed successfully; no rows returned')
  WHERE NOT EXISTS (SELECT 1 FROM block_01_rows)
),

-- RMPF.02_RESULT_MATCH_RELATION_CANDIDATES
block_02_source AS MATERIALIZED (
SELECT
  'RMPF.02_RESULT_MATCH_RELATION_CANDIDATES' AS section,
  namespace.nspname AS schema_name,
  class.relname AS relation_name,
  CASE class.relkind WHEN 'r' THEN 'table' WHEN 'p' THEN 'partitioned table'
    WHEN 'v' THEN 'view' WHEN 'm' THEN 'materialized view' WHEN 'f' THEN 'foreign table'
    ELSE class.relkind::text END AS relation_kind,
  pg_get_userbyid(class.relowner) AS owner
FROM pg_class class
JOIN pg_namespace namespace ON namespace.oid = class.relnamespace
WHERE class.relkind IN ('r', 'p', 'v', 'm', 'f')
  AND namespace.nspname NOT IN ('pg_catalog', 'information_schema')
  AND class.relname ~* '(result|match|score|fixture|game)'
ORDER BY namespace.nspname, class.relname
),
block_02_rows AS MATERIALIZED (
  SELECT
    'RMPF.02_RESULT_MATCH_RELATION_CANDIDATES'::text AS result_block,
    2::integer AS result_order,
    row_number() OVER (ORDER BY source_row.schema_name, source_row.relation_name)::bigint AS row_order,
    'data'::text AS row_type,
    to_jsonb(source_row) AS data
  FROM block_02_source source_row
),
block_02_export AS MATERIALIZED (
  SELECT result_block, result_order, row_order, row_type, data
  FROM block_02_rows
  UNION ALL
  SELECT
    'RMPF.02_RESULT_MATCH_RELATION_CANDIDATES'::text,
    2::integer,
    1::bigint,
    'empty'::text,
    jsonb_build_object('message', 'block executed successfully; no rows returned')
  WHERE NOT EXISTS (SELECT 1 FROM block_02_rows)
),

-- RMPF.03_CORE_COLUMNS
block_03_source AS MATERIALIZED (
SELECT
  'RMPF.03_CORE_COLUMNS' AS section,
  column_row.table_name,
  column_row.ordinal_position,
  column_row.column_name,
  column_row.data_type,
  column_row.udt_schema,
  column_row.udt_name,
  column_row.is_nullable,
  column_row.column_default,
  column_row.is_identity,
  column_row.identity_generation,
  column_row.is_generated,
  column_row.generation_expression
FROM information_schema.columns column_row
WHERE column_row.table_schema = 'public'
  AND column_row.table_name IN ('teams', 'team_seasons', 'seasons', 'departments')
ORDER BY column_row.table_name, column_row.ordinal_position
),
block_03_rows AS MATERIALIZED (
  SELECT
    'RMPF.03_CORE_COLUMNS'::text AS result_block,
    3::integer AS result_order,
    row_number() OVER (ORDER BY source_row.table_name, source_row.ordinal_position)::bigint AS row_order,
    'data'::text AS row_type,
    to_jsonb(source_row) AS data
  FROM block_03_source source_row
),
block_03_export AS MATERIALIZED (
  SELECT result_block, result_order, row_order, row_type, data
  FROM block_03_rows
  UNION ALL
  SELECT
    'RMPF.03_CORE_COLUMNS'::text,
    3::integer,
    1::bigint,
    'empty'::text,
    jsonb_build_object('message', 'block executed successfully; no rows returned')
  WHERE NOT EXISTS (SELECT 1 FROM block_03_rows)
),

-- RMPF.04_CORE_CONSTRAINTS
block_04_source AS MATERIALIZED (
SELECT
  'RMPF.04_CORE_CONSTRAINTS' AS section,
  class.relname AS table_name,
  constraint_row.conname AS constraint_name,
  constraint_row.contype AS constraint_type,
  pg_get_constraintdef(constraint_row.oid, true) AS definition,
  constraint_row.convalidated AS is_validated,
  constraint_row.condeferrable AS is_deferrable,
  constraint_row.condeferred AS is_initially_deferred
FROM pg_constraint constraint_row
JOIN pg_class class ON class.oid = constraint_row.conrelid
JOIN pg_namespace namespace ON namespace.oid = class.relnamespace
WHERE namespace.nspname = 'public'
  AND class.relname IN ('teams', 'team_seasons', 'seasons', 'departments')
ORDER BY class.relname, constraint_row.contype, constraint_row.conname
),
block_04_rows AS MATERIALIZED (
  SELECT
    'RMPF.04_CORE_CONSTRAINTS'::text AS result_block,
    4::integer AS result_order,
    row_number() OVER (ORDER BY source_row.table_name, source_row.constraint_type, source_row.constraint_name)::bigint AS row_order,
    'data'::text AS row_type,
    to_jsonb(source_row) AS data
  FROM block_04_source source_row
),
block_04_export AS MATERIALIZED (
  SELECT result_block, result_order, row_order, row_type, data
  FROM block_04_rows
  UNION ALL
  SELECT
    'RMPF.04_CORE_CONSTRAINTS'::text,
    4::integer,
    1::bigint,
    'empty'::text,
    jsonb_build_object('message', 'block executed successfully; no rows returned')
  WHERE NOT EXISTS (SELECT 1 FROM block_04_rows)
),

-- RMPF.05_CORE_INDEXES
block_05_source AS MATERIALIZED (
SELECT
  'RMPF.05_CORE_INDEXES' AS section,
  index_row.tablename AS table_name,
  index_row.indexname AS index_name,
  index_row.indexdef AS definition
FROM pg_indexes index_row
WHERE index_row.schemaname = 'public'
  AND index_row.tablename IN ('teams', 'team_seasons', 'seasons', 'departments')
ORDER BY index_row.tablename, index_row.indexname
),
block_05_rows AS MATERIALIZED (
  SELECT
    'RMPF.05_CORE_INDEXES'::text AS result_block,
    5::integer AS result_order,
    row_number() OVER (ORDER BY source_row.table_name, source_row.index_name)::bigint AS row_order,
    'data'::text AS row_type,
    to_jsonb(source_row) AS data
  FROM block_05_source source_row
),
block_05_export AS MATERIALIZED (
  SELECT result_block, result_order, row_order, row_type, data
  FROM block_05_rows
  UNION ALL
  SELECT
    'RMPF.05_CORE_INDEXES'::text,
    5::integer,
    1::bigint,
    'empty'::text,
    jsonb_build_object('message', 'block executed successfully; no rows returned')
  WHERE NOT EXISTS (SELECT 1 FROM block_05_rows)
),

-- RMPF.06_CORE_RLS
block_06_source AS MATERIALIZED (
SELECT
  'RMPF.06_CORE_RLS' AS section,
  class.relname AS table_name,
  class.relrowsecurity AS rls_enabled,
  class.relforcerowsecurity AS force_rls
FROM pg_class class
JOIN pg_namespace namespace ON namespace.oid = class.relnamespace
WHERE namespace.nspname = 'public'
  AND class.relkind IN ('r', 'p')
  AND class.relname IN ('teams', 'team_seasons', 'seasons', 'departments')
ORDER BY class.relname
),
block_06_rows AS MATERIALIZED (
  SELECT
    'RMPF.06_CORE_RLS'::text AS result_block,
    6::integer AS result_order,
    row_number() OVER (ORDER BY source_row.table_name)::bigint AS row_order,
    'data'::text AS row_type,
    to_jsonb(source_row) AS data
  FROM block_06_source source_row
),
block_06_export AS MATERIALIZED (
  SELECT result_block, result_order, row_order, row_type, data
  FROM block_06_rows
  UNION ALL
  SELECT
    'RMPF.06_CORE_RLS'::text,
    6::integer,
    1::bigint,
    'empty'::text,
    jsonb_build_object('message', 'block executed successfully; no rows returned')
  WHERE NOT EXISTS (SELECT 1 FROM block_06_rows)
),

-- RMPF.07_CORE_POLICIES
block_07_source AS MATERIALIZED (
SELECT
  'RMPF.07_CORE_POLICIES' AS section,
  policy.tablename AS table_name,
  policy.policyname AS policy_name,
  policy.permissive,
  policy.roles,
  policy.cmd,
  policy.qual AS using_expression,
  policy.with_check AS with_check_expression
FROM pg_policies policy
WHERE policy.schemaname = 'public'
  AND policy.tablename IN ('teams', 'team_seasons', 'seasons', 'departments')
ORDER BY policy.tablename, policy.policyname
),
block_07_rows AS MATERIALIZED (
  SELECT
    'RMPF.07_CORE_POLICIES'::text AS result_block,
    7::integer AS result_order,
    row_number() OVER (ORDER BY source_row.table_name, source_row.policy_name)::bigint AS row_order,
    'data'::text AS row_type,
    to_jsonb(source_row) AS data
  FROM block_07_source source_row
),
block_07_export AS MATERIALIZED (
  SELECT result_block, result_order, row_order, row_type, data
  FROM block_07_rows
  UNION ALL
  SELECT
    'RMPF.07_CORE_POLICIES'::text,
    7::integer,
    1::bigint,
    'empty'::text,
    jsonb_build_object('message', 'block executed successfully; no rows returned')
  WHERE NOT EXISTS (SELECT 1 FROM block_07_rows)
),

-- RMPF.08_CORE_TABLE_GRANTS
block_08_source AS MATERIALIZED (
SELECT
  'RMPF.08_CORE_TABLE_GRANTS' AS section,
  grant_row.table_name,
  grant_row.grantee,
  grant_row.privilege_type,
  grant_row.is_grantable
FROM information_schema.role_table_grants grant_row
WHERE grant_row.table_schema = 'public'
  AND grant_row.table_name IN ('teams', 'team_seasons', 'seasons', 'departments')
  AND grant_row.grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY grant_row.table_name, grant_row.grantee, grant_row.privilege_type
),
block_08_rows AS MATERIALIZED (
  SELECT
    'RMPF.08_CORE_TABLE_GRANTS'::text AS result_block,
    8::integer AS result_order,
    row_number() OVER (ORDER BY source_row.table_name, source_row.grantee, source_row.privilege_type)::bigint AS row_order,
    'data'::text AS row_type,
    to_jsonb(source_row) AS data
  FROM block_08_source source_row
),
block_08_export AS MATERIALIZED (
  SELECT result_block, result_order, row_order, row_type, data
  FROM block_08_rows
  UNION ALL
  SELECT
    'RMPF.08_CORE_TABLE_GRANTS'::text,
    8::integer,
    1::bigint,
    'empty'::text,
    jsonb_build_object('message', 'block executed successfully; no rows returned')
  WHERE NOT EXISTS (SELECT 1 FROM block_08_rows)
),

-- RMPF.09_CORE_COLUMN_GRANTS
block_09_source AS MATERIALIZED (
SELECT
  'RMPF.09_CORE_COLUMN_GRANTS' AS section,
  grant_row.table_name,
  grant_row.column_name,
  grant_row.grantee,
  grant_row.privilege_type,
  grant_row.is_grantable
FROM information_schema.role_column_grants grant_row
WHERE grant_row.table_schema = 'public'
  AND grant_row.table_name IN ('teams', 'team_seasons', 'seasons', 'departments')
  AND grant_row.grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY grant_row.table_name, grant_row.column_name, grant_row.grantee, grant_row.privilege_type
),
block_09_rows AS MATERIALIZED (
  SELECT
    'RMPF.09_CORE_COLUMN_GRANTS'::text AS result_block,
    9::integer AS result_order,
    row_number() OVER (ORDER BY source_row.table_name, source_row.column_name, source_row.grantee, source_row.privilege_type)::bigint AS row_order,
    'data'::text AS row_type,
    to_jsonb(source_row) AS data
  FROM block_09_source source_row
),
block_09_export AS MATERIALIZED (
  SELECT result_block, result_order, row_order, row_type, data
  FROM block_09_rows
  UNION ALL
  SELECT
    'RMPF.09_CORE_COLUMN_GRANTS'::text,
    9::integer,
    1::bigint,
    'empty'::text,
    jsonb_build_object('message', 'block executed successfully; no rows returned')
  WHERE NOT EXISTS (SELECT 1 FROM block_09_rows)
),

-- RMPF.10_ACTIVE_FOOTBALL_AND_TABLE_TENNIS_TEAM_SEASONS
block_10_source AS MATERIALIZED (
SELECT
  'RMPF.10_ACTIVE_FOOTBALL_AND_TABLE_TENNIS_TEAM_SEASONS' AS section,
  department.id AS department_id,
  department.slug AS department_slug,
  department.name_de AS department_name,
  team.id AS team_id,
  team.slug AS team_slug,
  team.name_de AS team_name,
  team.age_group,
  team.sort_order AS team_sort_order,
  team.is_active AS team_is_active,
  team_season.id AS team_season_id,
  team_season.name_de AS team_season_name,
  team_season.age_group AS team_season_age_group,
  team_season.sort_order AS team_season_sort_order,
  team_season.is_active AS team_season_is_active,
  season.id AS season_id,
  season.name AS season_name,
  season.is_current AS season_is_current,
  season.is_active AS season_is_active,
  season.sort_order AS season_sort_order
FROM public.team_seasons team_season
JOIN public.teams team ON team.id = team_season.team_id
JOIN public.departments department ON department.id = team.department_id
JOIN public.seasons season ON season.id = team_season.season_id
WHERE department.slug IN ('fussball', 'tischtennis')
  AND department.is_active IS TRUE
  AND team.is_active IS TRUE
  AND team_season.is_active IS TRUE
  AND season.is_active IS TRUE
ORDER BY department.slug, team.sort_order, team_season.sort_order, team.name_de, team_season.id
),
block_10_rows AS MATERIALIZED (
  SELECT
    'RMPF.10_ACTIVE_FOOTBALL_AND_TABLE_TENNIS_TEAM_SEASONS'::text AS result_block,
    10::integer AS result_order,
    row_number() OVER (ORDER BY source_row.department_slug, source_row.team_sort_order NULLS LAST, source_row.team_season_sort_order NULLS LAST, source_row.team_name, source_row.team_season_id)::bigint AS row_order,
    'data'::text AS row_type,
    to_jsonb(source_row) AS data
  FROM block_10_source source_row
),
block_10_export AS MATERIALIZED (
  SELECT result_block, result_order, row_order, row_type, data
  FROM block_10_rows
  UNION ALL
  SELECT
    'RMPF.10_ACTIVE_FOOTBALL_AND_TABLE_TENNIS_TEAM_SEASONS'::text,
    10::integer,
    1::bigint,
    'empty'::text,
    jsonb_build_object('message', 'block executed successfully; no rows returned')
  WHERE NOT EXISTS (SELECT 1 FROM block_10_rows)
),

-- RMPF.11_TEAM_SEASON_REFERENCE_CONTRACT
block_11_source AS MATERIALIZED (
SELECT
  'RMPF.11_TEAM_SEASON_REFERENCE_CONTRACT' AS section,
  source_namespace.nspname AS source_schema,
  source_class.relname AS source_table,
  constraint_row.conname AS constraint_name,
  pg_get_constraintdef(constraint_row.oid, true) AS definition,
  target_namespace.nspname AS target_schema,
  target_class.relname AS target_table,
  constraint_row.confupdtype AS update_action_code,
  constraint_row.confdeltype AS delete_action_code
FROM pg_constraint constraint_row
JOIN pg_class source_class ON source_class.oid = constraint_row.conrelid
JOIN pg_namespace source_namespace ON source_namespace.oid = source_class.relnamespace
JOIN pg_class target_class ON target_class.oid = constraint_row.confrelid
JOIN pg_namespace target_namespace ON target_namespace.oid = target_class.relnamespace
WHERE constraint_row.contype = 'f'
  AND target_namespace.nspname = 'public'
  AND target_class.relname = 'team_seasons'
ORDER BY source_namespace.nspname, source_class.relname, constraint_row.conname
),
block_11_rows AS MATERIALIZED (
  SELECT
    'RMPF.11_TEAM_SEASON_REFERENCE_CONTRACT'::text AS result_block,
    11::integer AS result_order,
    row_number() OVER (ORDER BY source_row.source_schema, source_row.source_table, source_row.constraint_name)::bigint AS row_order,
    'data'::text AS row_type,
    to_jsonb(source_row) AS data
  FROM block_11_source source_row
),
block_11_export AS MATERIALIZED (
  SELECT result_block, result_order, row_order, row_type, data
  FROM block_11_rows
  UNION ALL
  SELECT
    'RMPF.11_TEAM_SEASON_REFERENCE_CONTRACT'::text,
    11::integer,
    1::bigint,
    'empty'::text,
    jsonb_build_object('message', 'block executed successfully; no rows returned')
  WHERE NOT EXISTS (SELECT 1 FROM block_11_rows)
),

-- RMPF.12_MEDIA_COLUMNS
block_12_source AS MATERIALIZED (
SELECT
  'RMPF.12_MEDIA_COLUMNS' AS section,
  column_row.table_name,
  column_row.ordinal_position,
  column_row.column_name,
  column_row.data_type,
  column_row.udt_name,
  column_row.is_nullable,
  column_row.column_default
FROM information_schema.columns column_row
WHERE column_row.table_schema = 'public'
  AND column_row.table_name IN ('media_assets', 'media_asset_usages')
ORDER BY column_row.table_name, column_row.ordinal_position
),
block_12_rows AS MATERIALIZED (
  SELECT
    'RMPF.12_MEDIA_COLUMNS'::text AS result_block,
    12::integer AS result_order,
    row_number() OVER (ORDER BY source_row.table_name, source_row.ordinal_position)::bigint AS row_order,
    'data'::text AS row_type,
    to_jsonb(source_row) AS data
  FROM block_12_source source_row
),
block_12_export AS MATERIALIZED (
  SELECT result_block, result_order, row_order, row_type, data
  FROM block_12_rows
  UNION ALL
  SELECT
    'RMPF.12_MEDIA_COLUMNS'::text,
    12::integer,
    1::bigint,
    'empty'::text,
    jsonb_build_object('message', 'block executed successfully; no rows returned')
  WHERE NOT EXISTS (SELECT 1 FROM block_12_rows)
),

-- RMPF.13_MEDIA_CONSTRAINTS_AND_INDEXES
block_13_source AS MATERIALIZED (
WITH media_objects AS MATERIALIZED (
  SELECT
    class.relname AS table_name,
    'constraint'::text AS object_type,
    constraint_row.conname AS object_name,
    pg_get_constraintdef(constraint_row.oid, true) AS definition
  FROM pg_constraint constraint_row
  JOIN pg_class class ON class.oid = constraint_row.conrelid
  JOIN pg_namespace namespace ON namespace.oid = class.relnamespace
  WHERE namespace.nspname = 'public'
    AND class.relname IN ('media_assets', 'media_asset_usages')
  UNION ALL
  SELECT index_row.tablename, 'index', index_row.indexname, index_row.indexdef
  FROM pg_indexes index_row
  WHERE index_row.schemaname = 'public'
    AND index_row.tablename IN ('media_assets', 'media_asset_usages')
)
SELECT 'RMPF.13_MEDIA_CONSTRAINTS_AND_INDEXES' AS section, *
FROM media_objects
ORDER BY table_name, object_type, object_name
),
block_13_rows AS MATERIALIZED (
  SELECT
    'RMPF.13_MEDIA_CONSTRAINTS_AND_INDEXES'::text AS result_block,
    13::integer AS result_order,
    row_number() OVER (ORDER BY source_row.table_name, source_row.object_type, source_row.object_name)::bigint AS row_order,
    'data'::text AS row_type,
    to_jsonb(source_row) AS data
  FROM block_13_source source_row
),
block_13_export AS MATERIALIZED (
  SELECT result_block, result_order, row_order, row_type, data
  FROM block_13_rows
  UNION ALL
  SELECT
    'RMPF.13_MEDIA_CONSTRAINTS_AND_INDEXES'::text,
    13::integer,
    1::bigint,
    'empty'::text,
    jsonb_build_object('message', 'block executed successfully; no rows returned')
  WHERE NOT EXISTS (SELECT 1 FROM block_13_rows)
),

-- RMPF.14_MEDIA_RLS_POLICIES_AND_GRANTS
block_14_source AS MATERIALIZED (
WITH media_security AS MATERIALIZED (
  SELECT class.relname AS table_name, 'rls'::text AS object_type,
    NULL::text AS object_name, NULL::text AS role_name,
    format('enabled=%s force=%s', class.relrowsecurity, class.relforcerowsecurity) AS detail
  FROM pg_class class
  JOIN pg_namespace namespace ON namespace.oid = class.relnamespace
  WHERE namespace.nspname = 'public' AND class.relname IN ('media_assets', 'media_asset_usages')
  UNION ALL
  SELECT policy.tablename, 'policy', policy.policyname, array_to_string(policy.roles, ','),
    format('cmd=%s using=%s check=%s', policy.cmd, coalesce(policy.qual, ''), coalesce(policy.with_check, ''))
  FROM pg_policies policy
  WHERE policy.schemaname = 'public' AND policy.tablename IN ('media_assets', 'media_asset_usages')
  UNION ALL
  SELECT grant_row.table_name, 'grant', grant_row.privilege_type, grant_row.grantee,
    format('grantable=%s', grant_row.is_grantable)
  FROM information_schema.role_table_grants grant_row
  WHERE grant_row.table_schema = 'public'
    AND grant_row.table_name IN ('media_assets', 'media_asset_usages')
    AND grant_row.grantee IN ('anon', 'authenticated', 'service_role')
)
SELECT 'RMPF.14_MEDIA_RLS_POLICIES_AND_GRANTS' AS section, *
FROM media_security
ORDER BY table_name, object_type, object_name, role_name
),
block_14_rows AS MATERIALIZED (
  SELECT
    'RMPF.14_MEDIA_RLS_POLICIES_AND_GRANTS'::text AS result_block,
    14::integer AS result_order,
    row_number() OVER (ORDER BY source_row.table_name, source_row.object_type, source_row.object_name, source_row.role_name)::bigint AS row_order,
    'data'::text AS row_type,
    to_jsonb(source_row) AS data
  FROM block_14_source source_row
),
block_14_export AS MATERIALIZED (
  SELECT result_block, result_order, row_order, row_type, data
  FROM block_14_rows
  UNION ALL
  SELECT
    'RMPF.14_MEDIA_RLS_POLICIES_AND_GRANTS'::text,
    14::integer,
    1::bigint,
    'empty'::text,
    jsonb_build_object('message', 'block executed successfully; no rows returned')
  WHERE NOT EXISTS (SELECT 1 FROM block_14_rows)
),

-- RMPF.15_MEDIA_FUNCTIONS_AND_TRIGGERS
block_15_source AS MATERIALIZED (
WITH candidate_routines AS MATERIALIZED (
  SELECT procedure_row.oid, procedure_row.proname, procedure_row.prosecdef,
    procedure_row.proowner, procedure_row.proconfig
  FROM pg_proc procedure_row
  JOIN pg_namespace namespace ON namespace.oid = procedure_row.pronamespace
  WHERE namespace.nspname = 'public'
    AND procedure_row.prokind IN ('f', 'p')
    AND (procedure_row.proname ILIKE '%media%' OR procedure_row.proname ILIKE '%asset%')
), routine_inventory AS MATERIALIZED (
  SELECT oid, oid::regprocedure::text AS signature, proname,
    prosecdef AS security_definer, pg_get_userbyid(proowner) AS owner,
    proconfig, pg_get_functiondef(oid) AS definition
  FROM candidate_routines
), trigger_inventory AS MATERIALIZED (
  SELECT class.relname AS table_name, trigger_row.tgname AS trigger_name,
    trigger_row.tgenabled, procedure_row.oid::regprocedure::text AS function_signature,
    pg_get_triggerdef(trigger_row.oid, true) AS definition
  FROM pg_trigger trigger_row
  JOIN pg_class class ON class.oid = trigger_row.tgrelid
  JOIN pg_namespace namespace ON namespace.oid = class.relnamespace
  JOIN pg_proc procedure_row ON procedure_row.oid = trigger_row.tgfoid
  WHERE NOT trigger_row.tgisinternal
    AND namespace.nspname = 'public'
    AND class.relname IN ('media_assets', 'media_asset_usages')
)
SELECT 'RMPF.15_MEDIA_FUNCTIONS_AND_TRIGGERS' AS section,
  'routine'::text AS object_type, NULL::text AS table_name,
  routine.signature AS object_name, NULL::text AS enabled,
  routine.security_definer, routine.owner, routine.proconfig,
  routine.definition
FROM routine_inventory routine
UNION ALL
SELECT 'RMPF.15_MEDIA_FUNCTIONS_AND_TRIGGERS', 'trigger', trigger_row.table_name,
  trigger_row.trigger_name, trigger_row.tgenabled::text, NULL::boolean, NULL::text,
  NULL::text[], trigger_row.definition
FROM trigger_inventory trigger_row
ORDER BY object_type, table_name, object_name
),
block_15_rows AS MATERIALIZED (
  SELECT
    'RMPF.15_MEDIA_FUNCTIONS_AND_TRIGGERS'::text AS result_block,
    15::integer AS result_order,
    row_number() OVER (ORDER BY source_row.object_type, source_row.table_name NULLS FIRST, source_row.object_name)::bigint AS row_order,
    'data'::text AS row_type,
    to_jsonb(source_row) AS data
  FROM block_15_source source_row
),
block_15_export AS MATERIALIZED (
  SELECT result_block, result_order, row_order, row_type, data
  FROM block_15_rows
  UNION ALL
  SELECT
    'RMPF.15_MEDIA_FUNCTIONS_AND_TRIGGERS'::text,
    15::integer,
    1::bigint,
    'empty'::text,
    jsonb_build_object('message', 'block executed successfully; no rows returned')
  WHERE NOT EXISTS (SELECT 1 FROM block_15_rows)
),

-- RMPF.16_MEDIA_FUNCTION_EXECUTE_ACL
block_16_source AS MATERIALIZED (
WITH candidate_routines AS MATERIALIZED (
  SELECT procedure_row.oid, procedure_row.proowner, procedure_row.proacl
  FROM pg_proc procedure_row
  JOIN pg_namespace namespace ON namespace.oid = procedure_row.pronamespace
  WHERE namespace.nspname = 'public'
    AND procedure_row.prokind IN ('f', 'p')
    AND (procedure_row.proname ILIKE '%media%' OR procedure_row.proname ILIKE '%asset%')
), public_acl AS MATERIALIZED (
  SELECT routine.oid,
    coalesce(bool_or(acl.grantee = 0 AND acl.privilege_type = 'EXECUTE'), false) AS public_execute
  FROM candidate_routines routine
  LEFT JOIN LATERAL aclexplode(coalesce(routine.proacl, acldefault('f', routine.proowner))) acl ON true
  GROUP BY routine.oid
)
SELECT
  'RMPF.16_MEDIA_FUNCTION_EXECUTE_ACL' AS section,
  routine.oid::regprocedure::text AS function_signature,
  acl.public_execute,
  has_function_privilege('anon', routine.oid, 'EXECUTE') AS anon_execute,
  has_function_privilege('authenticated', routine.oid, 'EXECUTE') AS authenticated_execute,
  has_function_privilege('service_role', routine.oid, 'EXECUTE') AS service_role_execute
FROM candidate_routines routine
JOIN public_acl acl ON acl.oid = routine.oid
ORDER BY routine.oid::regprocedure::text
),
block_16_rows AS MATERIALIZED (
  SELECT
    'RMPF.16_MEDIA_FUNCTION_EXECUTE_ACL'::text AS result_block,
    16::integer AS result_order,
    row_number() OVER (ORDER BY source_row.function_signature)::bigint AS row_order,
    'data'::text AS row_type,
    to_jsonb(source_row) AS data
  FROM block_16_source source_row
),
block_16_export AS MATERIALIZED (
  SELECT result_block, result_order, row_order, row_type, data
  FROM block_16_rows
  UNION ALL
  SELECT
    'RMPF.16_MEDIA_FUNCTION_EXECUTE_ACL'::text,
    16::integer,
    1::bigint,
    'empty'::text,
    jsonb_build_object('message', 'block executed successfully; no rows returned')
  WHERE NOT EXISTS (SELECT 1 FROM block_16_rows)
),

-- RMPF.17_PERMISSION_AND_ROLE_TABLE_CONTRACTS
block_17_source AS MATERIALIZED (
SELECT
  'RMPF.17_PERMISSION_AND_ROLE_TABLE_CONTRACTS' AS section,
  class.relname AS table_name,
  constraint_row.conname AS constraint_name,
  constraint_row.contype AS constraint_type,
  pg_get_constraintdef(constraint_row.oid, true) AS definition
FROM pg_constraint constraint_row
JOIN pg_class class ON class.oid = constraint_row.conrelid
JOIN pg_namespace namespace ON namespace.oid = class.relnamespace
WHERE namespace.nspname = 'public'
  AND class.relname IN ('admin_permissions', 'admin_roles', 'admin_role_permissions', 'admin_user_roles')
ORDER BY class.relname, constraint_row.contype, constraint_row.conname
),
block_17_rows AS MATERIALIZED (
  SELECT
    'RMPF.17_PERMISSION_AND_ROLE_TABLE_CONTRACTS'::text AS result_block,
    17::integer AS result_order,
    row_number() OVER (ORDER BY source_row.table_name, source_row.constraint_type, source_row.constraint_name)::bigint AS row_order,
    'data'::text AS row_type,
    to_jsonb(source_row) AS data
  FROM block_17_source source_row
),
block_17_export AS MATERIALIZED (
  SELECT result_block, result_order, row_order, row_type, data
  FROM block_17_rows
  UNION ALL
  SELECT
    'RMPF.17_PERMISSION_AND_ROLE_TABLE_CONTRACTS'::text,
    17::integer,
    1::bigint,
    'empty'::text,
    jsonb_build_object('message', 'block executed successfully; no rows returned')
  WHERE NOT EXISTS (SELECT 1 FROM block_17_rows)
),

-- RMPF.18_PERMISSION_NAMING_INVENTORY
block_18_source AS MATERIALIZED (
SELECT
  'RMPF.18_PERMISSION_NAMING_INVENTORY' AS section,
  permission_row.id AS permission_id,
  permission_row.key AS permission_key,
  permission_row.name AS permission_name,
  permission_row.category,
  permission_row.description
FROM public.admin_permissions permission_row
WHERE permission_row.key ~ '^(news|events|downloads|teams|board|results)\.'
ORDER BY split_part(permission_row.key, '.', 1), permission_row.key
),
block_18_rows AS MATERIALIZED (
  SELECT
    'RMPF.18_PERMISSION_NAMING_INVENTORY'::text AS result_block,
    18::integer AS result_order,
    row_number() OVER (ORDER BY source_row.permission_key)::bigint AS row_order,
    'data'::text AS row_type,
    to_jsonb(source_row) AS data
  FROM block_18_source source_row
),
block_18_export AS MATERIALIZED (
  SELECT result_block, result_order, row_order, row_type, data
  FROM block_18_rows
  UNION ALL
  SELECT
    'RMPF.18_PERMISSION_NAMING_INVENTORY'::text,
    18::integer,
    1::bigint,
    'empty'::text,
    jsonb_build_object('message', 'block executed successfully; no rows returned')
  WHERE NOT EXISTS (SELECT 1 FROM block_18_rows)
),

-- RMPF.19_TARGET_ADMIN_ROLES_AND_PERMISSION_MAPPINGS
block_19_source AS MATERIALIZED (
SELECT
  'RMPF.19_TARGET_ADMIN_ROLES_AND_PERMISSION_MAPPINGS' AS section,
  role_row.id AS role_id,
  role_row.key AS role_key,
  role_row.name AS role_name,
  role_row.description AS role_description,
  role_row.is_active AS role_is_active,
  role_row.sort_order AS role_sort_order,
  permission_row.key AS permission_key
FROM public.admin_roles role_row
LEFT JOIN public.admin_role_permissions link ON link.role_id = role_row.id
LEFT JOIN public.admin_permissions permission_row ON permission_row.id = link.permission_id
WHERE role_row.key IN ('superadmin', 'webmaster', 'fussball-vorstand', 'tischtennis-vorstand')
ORDER BY role_row.key, permission_row.key
),
block_19_rows AS MATERIALIZED (
  SELECT
    'RMPF.19_TARGET_ADMIN_ROLES_AND_PERMISSION_MAPPINGS'::text AS result_block,
    19::integer AS result_order,
    row_number() OVER (ORDER BY source_row.role_key, source_row.permission_key NULLS FIRST)::bigint AS row_order,
    'data'::text AS row_type,
    to_jsonb(source_row) AS data
  FROM block_19_source source_row
),
block_19_export AS MATERIALIZED (
  SELECT result_block, result_order, row_order, row_type, data
  FROM block_19_rows
  UNION ALL
  SELECT
    'RMPF.19_TARGET_ADMIN_ROLES_AND_PERMISSION_MAPPINGS'::text,
    19::integer,
    1::bigint,
    'empty'::text,
    jsonb_build_object('message', 'block executed successfully; no rows returned')
  WHERE NOT EXISTS (SELECT 1 FROM block_19_rows)
),

-- RMPF.20_RESULTS_PERMISSION_COLLISION_AND_ROLE_SUMMARY
block_20_source AS MATERIALIZED (
WITH expected_permissions(permission_key) AS MATERIALIZED (
  VALUES ('results.view'), ('results.create'), ('results.edit'), ('results.delete'), ('results.publish')
), target_roles(role_key) AS MATERIALIZED (
  VALUES ('superadmin'), ('webmaster'), ('fussball-vorstand'), ('tischtennis-vorstand')
)
SELECT
  'RMPF.20_RESULTS_PERMISSION_COLLISION_AND_ROLE_SUMMARY' AS section,
  role_target.role_key,
  role_row.id AS live_role_id,
  role_row.name AS live_role_name,
  role_row.is_active AS live_role_active,
  permission_target.permission_key,
  permission_row.id AS live_permission_id,
  EXISTS (
    SELECT 1 FROM public.admin_role_permissions link
    WHERE link.role_id = role_row.id AND link.permission_id = permission_row.id
  ) AS mapping_exists
FROM target_roles role_target
CROSS JOIN expected_permissions permission_target
LEFT JOIN public.admin_roles role_row ON role_row.key = role_target.role_key
LEFT JOIN public.admin_permissions permission_row ON permission_row.key = permission_target.permission_key
ORDER BY role_target.role_key, permission_target.permission_key
),
block_20_rows AS MATERIALIZED (
  SELECT
    'RMPF.20_RESULTS_PERMISSION_COLLISION_AND_ROLE_SUMMARY'::text AS result_block,
    20::integer AS result_order,
    row_number() OVER (ORDER BY source_row.role_key, source_row.permission_key)::bigint AS row_order,
    'data'::text AS row_type,
    to_jsonb(source_row) AS data
  FROM block_20_source source_row
),
block_20_export AS MATERIALIZED (
  SELECT result_block, result_order, row_order, row_type, data
  FROM block_20_rows
  UNION ALL
  SELECT
    'RMPF.20_RESULTS_PERMISSION_COLLISION_AND_ROLE_SUMMARY'::text,
    20::integer,
    1::bigint,
    'empty'::text,
    jsonb_build_object('message', 'block executed successfully; no rows returned')
  WHERE NOT EXISTS (SELECT 1 FROM block_20_rows)
),

-- RMPF.21_ADMIN_SECURITY_POLICIES_AND_GRANTS
block_21_source AS MATERIALIZED (
WITH admin_security AS MATERIALIZED (
  SELECT policy.tablename AS table_name, 'policy'::text AS object_type,
    policy.policyname AS object_name, array_to_string(policy.roles, ',') AS role_name,
    format('cmd=%s using=%s check=%s', policy.cmd, coalesce(policy.qual, ''), coalesce(policy.with_check, '')) AS detail
  FROM pg_policies policy
  WHERE policy.schemaname = 'public'
    AND policy.tablename IN ('admin_permissions', 'admin_roles', 'admin_role_permissions', 'admin_user_roles')
  UNION ALL
  SELECT grant_row.table_name, 'grant', grant_row.privilege_type, grant_row.grantee,
    format('grantable=%s', grant_row.is_grantable)
  FROM information_schema.role_table_grants grant_row
  WHERE grant_row.table_schema = 'public'
    AND grant_row.table_name IN ('admin_permissions', 'admin_roles', 'admin_role_permissions', 'admin_user_roles')
    AND grant_row.grantee IN ('anon', 'authenticated', 'service_role')
)
SELECT 'RMPF.21_ADMIN_SECURITY_POLICIES_AND_GRANTS' AS section, *
FROM admin_security
ORDER BY table_name, object_type, object_name, role_name
),
block_21_rows AS MATERIALIZED (
  SELECT
    'RMPF.21_ADMIN_SECURITY_POLICIES_AND_GRANTS'::text AS result_block,
    21::integer AS result_order,
    row_number() OVER (ORDER BY source_row.table_name, source_row.object_type, source_row.object_name, source_row.role_name)::bigint AS row_order,
    'data'::text AS row_type,
    to_jsonb(source_row) AS data
  FROM block_21_source source_row
),
block_21_export AS MATERIALIZED (
  SELECT result_block, result_order, row_order, row_type, data
  FROM block_21_rows
  UNION ALL
  SELECT
    'RMPF.21_ADMIN_SECURITY_POLICIES_AND_GRANTS'::text,
    21::integer,
    1::bigint,
    'empty'::text,
    jsonb_build_object('message', 'block executed successfully; no rows returned')
  WHERE NOT EXISTS (SELECT 1 FROM block_21_rows)
),

-- RMPF.22_WEBMASTER_CONCEPT_SEPARATION
block_22_source AS MATERIALIZED (
SELECT
  'RMPF.22_WEBMASTER_CONCEPT_SEPARATION' AS section,
  'admin_role'::text AS concept,
  role_row.id,
  role_row.key AS technical_key,
  role_row.name AS display_name,
  role_row.description,
  role_row.is_active
FROM public.admin_roles role_row
WHERE role_row.key = 'webmaster'
UNION ALL
SELECT
  'RMPF.22_WEBMASTER_CONCEPT_SEPARATION',
  'board_role', board_role.id, board_role.slug, board_role.name_de,
  board_role.name_en, board_role.is_active
FROM public.board_roles board_role
WHERE board_role.slug = 'webmaster'
ORDER BY concept
),
block_22_rows AS MATERIALIZED (
  SELECT
    'RMPF.22_WEBMASTER_CONCEPT_SEPARATION'::text AS result_block,
    22::integer AS result_order,
    row_number() OVER (ORDER BY source_row.concept)::bigint AS row_order,
    'data'::text AS row_type,
    to_jsonb(source_row) AS data
  FROM block_22_source source_row
),
block_22_export AS MATERIALIZED (
  SELECT result_block, result_order, row_order, row_type, data
  FROM block_22_rows
  UNION ALL
  SELECT
    'RMPF.22_WEBMASTER_CONCEPT_SEPARATION'::text,
    22::integer,
    1::bigint,
    'empty'::text,
    jsonb_build_object('message', 'block executed successfully; no rows returned')
  WHERE NOT EXISTS (SELECT 1 FROM block_22_rows)
),

-- RMPF.23_DEPARTMENT_SCOPE_FOUNDATION
block_23_source AS MATERIALIZED (
SELECT
  'RMPF.23_DEPARTMENT_SCOPE_FOUNDATION' AS section,
  department.id AS department_id,
  department.slug AS department_slug,
  department.name_de AS department_name,
  department.is_active,
  count(team.id) FILTER (WHERE team.is_active IS TRUE) AS active_team_count,
  count(team_season.id) FILTER (WHERE team.is_active IS TRUE AND team_season.is_active IS TRUE) AS active_team_season_count
FROM public.departments department
LEFT JOIN public.teams team ON team.department_id = department.id
LEFT JOIN public.team_seasons team_season ON team_season.team_id = team.id
WHERE department.slug IN ('fussball', 'tischtennis')
GROUP BY department.id, department.slug, department.name_de, department.is_active
ORDER BY department.slug
),
block_23_rows AS MATERIALIZED (
  SELECT
    'RMPF.23_DEPARTMENT_SCOPE_FOUNDATION'::text AS result_block,
    23::integer AS result_order,
    row_number() OVER (ORDER BY source_row.department_slug)::bigint AS row_order,
    'data'::text AS row_type,
    to_jsonb(source_row) AS data
  FROM block_23_source source_row
),
block_23_export AS MATERIALIZED (
  SELECT result_block, result_order, row_order, row_type, data
  FROM block_23_rows
  UNION ALL
  SELECT
    'RMPF.23_DEPARTMENT_SCOPE_FOUNDATION'::text,
    23::integer,
    1::bigint,
    'empty'::text,
    jsonb_build_object('message', 'block executed successfully; no rows returned')
  WHERE NOT EXISTS (SELECT 1 FROM block_23_rows)
),

-- RMPF.24_COMPARABLE_AUDIT_AND_PUBLISH_COLUMNS
block_24_source AS MATERIALIZED (
SELECT
  'RMPF.24_COMPARABLE_AUDIT_AND_PUBLISH_COLUMNS' AS section,
  column_row.table_name,
  column_row.ordinal_position,
  column_row.column_name,
  column_row.data_type,
  column_row.udt_name,
  column_row.is_nullable,
  column_row.column_default
FROM information_schema.columns column_row
WHERE column_row.table_schema = 'public'
  AND column_row.table_name IN ('news', 'events', 'downloads')
  AND column_row.column_name IN (
    'is_published', 'published_at', 'created_at', 'updated_at',
    'created_by', 'updated_by', 'created_by_user_id', 'updated_by_user_id'
  )
ORDER BY column_row.table_name, column_row.ordinal_position
),
block_24_rows AS MATERIALIZED (
  SELECT
    'RMPF.24_COMPARABLE_AUDIT_AND_PUBLISH_COLUMNS'::text AS result_block,
    24::integer AS result_order,
    row_number() OVER (ORDER BY source_row.table_name, source_row.ordinal_position)::bigint AS row_order,
    'data'::text AS row_type,
    to_jsonb(source_row) AS data
  FROM block_24_source source_row
),
block_24_export AS MATERIALIZED (
  SELECT result_block, result_order, row_order, row_type, data
  FROM block_24_rows
  UNION ALL
  SELECT
    'RMPF.24_COMPARABLE_AUDIT_AND_PUBLISH_COLUMNS'::text,
    24::integer,
    1::bigint,
    'empty'::text,
    jsonb_build_object('message', 'block executed successfully; no rows returned')
  WHERE NOT EXISTS (SELECT 1 FROM block_24_rows)
),

-- RMPF.25_COMPARABLE_PUBLISH_RLS
block_25_source AS MATERIALIZED (
SELECT
  'RMPF.25_COMPARABLE_PUBLISH_RLS' AS section,
  policy.tablename AS table_name,
  policy.policyname AS policy_name,
  policy.permissive,
  policy.roles,
  policy.cmd,
  policy.qual AS using_expression,
  policy.with_check AS with_check_expression
FROM pg_policies policy
WHERE policy.schemaname = 'public'
  AND policy.tablename IN ('news', 'events', 'downloads')
ORDER BY policy.tablename, policy.policyname
),
block_25_rows AS MATERIALIZED (
  SELECT
    'RMPF.25_COMPARABLE_PUBLISH_RLS'::text AS result_block,
    25::integer AS result_order,
    row_number() OVER (ORDER BY source_row.table_name, source_row.policy_name)::bigint AS row_order,
    'data'::text AS row_type,
    to_jsonb(source_row) AS data
  FROM block_25_source source_row
),
block_25_export AS MATERIALIZED (
  SELECT result_block, result_order, row_order, row_type, data
  FROM block_25_rows
  UNION ALL
  SELECT
    'RMPF.25_COMPARABLE_PUBLISH_RLS'::text,
    25::integer,
    1::bigint,
    'empty'::text,
    jsonb_build_object('message', 'block executed successfully; no rows returned')
  WHERE NOT EXISTS (SELECT 1 FROM block_25_rows)
),

-- RMPF.26_COMPARABLE_TRIGGERS
block_26_source AS MATERIALIZED (
SELECT
  'RMPF.26_COMPARABLE_TRIGGERS' AS section,
  class.relname AS table_name,
  trigger_row.tgname AS trigger_name,
  trigger_row.tgenabled,
  procedure_row.oid::regprocedure::text AS function_signature,
  pg_get_triggerdef(trigger_row.oid, true) AS definition
FROM pg_trigger trigger_row
JOIN pg_class class ON class.oid = trigger_row.tgrelid
JOIN pg_namespace namespace ON namespace.oid = class.relnamespace
JOIN pg_proc procedure_row ON procedure_row.oid = trigger_row.tgfoid
WHERE NOT trigger_row.tgisinternal
  AND namespace.nspname = 'public'
  AND class.relname IN ('news', 'events', 'downloads', 'teams', 'team_seasons', 'media_assets', 'media_asset_usages')
ORDER BY class.relname, trigger_row.tgname
),
block_26_rows AS MATERIALIZED (
  SELECT
    'RMPF.26_COMPARABLE_TRIGGERS'::text AS result_block,
    26::integer AS result_order,
    row_number() OVER (ORDER BY source_row.table_name, source_row.trigger_name)::bigint AS row_order,
    'data'::text AS row_type,
    to_jsonb(source_row) AS data
  FROM block_26_source source_row
),
block_26_export AS MATERIALIZED (
  SELECT result_block, result_order, row_order, row_type, data
  FROM block_26_rows
  UNION ALL
  SELECT
    'RMPF.26_COMPARABLE_TRIGGERS'::text,
    26::integer,
    1::bigint,
    'empty'::text,
    jsonb_build_object('message', 'block executed successfully; no rows returned')
  WHERE NOT EXISTS (SELECT 1 FROM block_26_rows)
),

-- RMPF.27_COMPARABLE_NUMERIC_TEXT_AND_TIME_CONSTRAINTS
block_27_source AS MATERIALIZED (
SELECT
  'RMPF.27_COMPARABLE_NUMERIC_TEXT_AND_TIME_CONSTRAINTS' AS section,
  class.relname AS table_name,
  constraint_row.conname AS constraint_name,
  pg_get_constraintdef(constraint_row.oid, true) AS definition
FROM pg_constraint constraint_row
JOIN pg_class class ON class.oid = constraint_row.conrelid
JOIN pg_namespace namespace ON namespace.oid = class.relnamespace
WHERE namespace.nspname = 'public'
  AND constraint_row.contype = 'c'
  AND (
    pg_get_constraintdef(constraint_row.oid, true) ~* '(score|length|char_length|created_at|updated_at|published_at|visible|effective)'
    OR class.relname IN ('news', 'events', 'downloads', 'media_assets')
  )
ORDER BY class.relname, constraint_row.conname
),
block_27_rows AS MATERIALIZED (
  SELECT
    'RMPF.27_COMPARABLE_NUMERIC_TEXT_AND_TIME_CONSTRAINTS'::text AS result_block,
    27::integer AS result_order,
    row_number() OVER (ORDER BY source_row.table_name, source_row.constraint_name)::bigint AS row_order,
    'data'::text AS row_type,
    to_jsonb(source_row) AS data
  FROM block_27_source source_row
),
block_27_export AS MATERIALIZED (
  SELECT result_block, result_order, row_order, row_type, data
  FROM block_27_rows
  UNION ALL
  SELECT
    'RMPF.27_COMPARABLE_NUMERIC_TEXT_AND_TIME_CONSTRAINTS'::text,
    27::integer,
    1::bigint,
    'empty'::text,
    jsonb_build_object('message', 'block executed successfully; no rows returned')
  WHERE NOT EXISTS (SELECT 1 FROM block_27_rows)
),

-- RMPF.28_COMPARABLE_INDEX_PATTERNS
block_28_source AS MATERIALIZED (
SELECT
  'RMPF.28_COMPARABLE_INDEX_PATTERNS' AS section,
  index_row.tablename AS table_name,
  index_row.indexname AS index_name,
  index_row.indexdef AS definition
FROM pg_indexes index_row
WHERE index_row.schemaname = 'public'
  AND index_row.tablename IN ('news', 'events', 'downloads', 'teams', 'team_seasons', 'media_assets', 'media_asset_usages')
ORDER BY index_row.tablename, index_row.indexname
),
block_28_rows AS MATERIALIZED (
  SELECT
    'RMPF.28_COMPARABLE_INDEX_PATTERNS'::text AS result_block,
    28::integer AS result_order,
    row_number() OVER (ORDER BY source_row.table_name, source_row.index_name)::bigint AS row_order,
    'data'::text AS row_type,
    to_jsonb(source_row) AS data
  FROM block_28_source source_row
),
block_28_export AS MATERIALIZED (
  SELECT result_block, result_order, row_order, row_type, data
  FROM block_28_rows
  UNION ALL
  SELECT
    'RMPF.28_COMPARABLE_INDEX_PATTERNS'::text,
    28::integer,
    1::bigint,
    'empty'::text,
    jsonb_build_object('message', 'block executed successfully; no rows returned')
  WHERE NOT EXISTS (SELECT 1 FROM block_28_rows)
),

-- RMPF.29_PLATFORM_ROLES_AND_EFFECTIVE_TARGET_PRIVILEGES
block_29_source AS MATERIALIZED (
WITH platform_roles(role_name) AS MATERIALIZED (
  VALUES ('anon'), ('authenticated'), ('service_role')
), target_relations(relation_name) AS MATERIALIZED (
  VALUES ('teams'), ('team_seasons'), ('media_assets'), ('media_asset_usages'),
    ('admin_permissions'), ('admin_roles'), ('admin_role_permissions'), ('admin_user_roles')
), existing_platform_roles AS MATERIALIZED (
  SELECT platform.role_name, role_row.oid AS role_oid
  FROM platform_roles platform
  LEFT JOIN pg_roles role_row ON role_row.rolname = platform.role_name
), existing_target_relations AS MATERIALIZED (
  SELECT target.relation_name, relation_row.oid AS relation_oid
  FROM target_relations target
  JOIN pg_class relation_row ON relation_row.oid = to_regclass(format('public.%I', target.relation_name))
)
SELECT
  'RMPF.29_PLATFORM_ROLES_AND_EFFECTIVE_TARGET_PRIVILEGES' AS section,
  platform.role_name,
  platform.role_oid IS NOT NULL AS role_exists,
  target.relation_name,
  has_table_privilege(platform.role_oid, target.relation_oid, 'SELECT') AS can_select,
  has_table_privilege(platform.role_oid, target.relation_oid, 'INSERT') AS can_insert,
  has_table_privilege(platform.role_oid, target.relation_oid, 'UPDATE') AS can_update,
  has_table_privilege(platform.role_oid, target.relation_oid, 'DELETE') AS can_delete
FROM existing_platform_roles platform
CROSS JOIN existing_target_relations target
ORDER BY platform.role_name, target.relation_name
),
block_29_rows AS MATERIALIZED (
  SELECT
    'RMPF.29_PLATFORM_ROLES_AND_EFFECTIVE_TARGET_PRIVILEGES'::text AS result_block,
    29::integer AS result_order,
    row_number() OVER (ORDER BY source_row.role_name, source_row.relation_name)::bigint AS row_order,
    'data'::text AS row_type,
    to_jsonb(source_row) AS data
  FROM block_29_source source_row
),
block_29_export AS MATERIALIZED (
  SELECT result_block, result_order, row_order, row_type, data
  FROM block_29_rows
  UNION ALL
  SELECT
    'RMPF.29_PLATFORM_ROLES_AND_EFFECTIVE_TARGET_PRIVILEGES'::text,
    29::integer,
    1::bigint,
    'empty'::text,
    jsonb_build_object('message', 'block executed successfully; no rows returned')
  WHERE NOT EXISTS (SELECT 1 FROM block_29_rows)
),

-- RMPF.30_PREFLIGHT_SUMMARY_COUNTS
block_30_source AS MATERIALIZED (
SELECT
  'RMPF.30_PREFLIGHT_SUMMARY_COUNTS' AS section,
  (SELECT count(*) FROM public.departments WHERE slug IN ('fussball', 'tischtennis')) AS target_department_count,
  (SELECT count(*) FROM public.teams team JOIN public.departments department ON department.id = team.department_id
    WHERE department.slug IN ('fussball', 'tischtennis') AND team.is_active IS TRUE) AS active_target_team_count,
  (SELECT count(*) FROM public.team_seasons team_season
    JOIN public.teams team ON team.id = team_season.team_id
    JOIN public.departments department ON department.id = team.department_id
    JOIN public.seasons season ON season.id = team_season.season_id
    WHERE department.slug IN ('fussball', 'tischtennis') AND department.is_active IS TRUE
      AND team.is_active IS TRUE AND team_season.is_active IS TRUE AND season.is_active IS TRUE) AS active_target_team_season_count,
  (SELECT count(*) FROM public.admin_permissions WHERE key LIKE 'results.%') AS existing_results_permission_count,
  (SELECT count(*) FROM public.admin_roles WHERE key IN ('superadmin', 'webmaster', 'fussball-vorstand', 'tischtennis-vorstand')) AS target_admin_role_count,
  (SELECT count(*) FROM pg_class class JOIN pg_namespace namespace ON namespace.oid = class.relnamespace
    WHERE class.relkind IN ('r', 'p', 'v', 'm', 'f')
      AND namespace.nspname NOT IN ('pg_catalog', 'information_schema')
      AND class.relname ~* '(result|match|score|fixture|game)') AS result_match_candidate_relation_count,
  to_regclass('public.club_results') IS NOT NULL AS club_results_exists
),
block_30_rows AS MATERIALIZED (
  SELECT
    'RMPF.30_PREFLIGHT_SUMMARY_COUNTS'::text AS result_block,
    30::integer AS result_order,
    row_number() OVER (ORDER BY source_row.section)::bigint AS row_order,
    'data'::text AS row_type,
    to_jsonb(source_row) AS data
  FROM block_30_source source_row
),
block_30_export AS MATERIALIZED (
  SELECT result_block, result_order, row_order, row_type, data
  FROM block_30_rows
  UNION ALL
  SELECT
    'RMPF.30_PREFLIGHT_SUMMARY_COUNTS'::text,
    30::integer,
    1::bigint,
    'empty'::text,
    jsonb_build_object('message', 'block executed successfully; no rows returned')
  WHERE NOT EXISTS (SELECT 1 FROM block_30_rows)
),

all_results AS MATERIALIZED (
  SELECT * FROM block_01_export
  UNION ALL
  SELECT * FROM block_02_export
  UNION ALL
  SELECT * FROM block_03_export
  UNION ALL
  SELECT * FROM block_04_export
  UNION ALL
  SELECT * FROM block_05_export
  UNION ALL
  SELECT * FROM block_06_export
  UNION ALL
  SELECT * FROM block_07_export
  UNION ALL
  SELECT * FROM block_08_export
  UNION ALL
  SELECT * FROM block_09_export
  UNION ALL
  SELECT * FROM block_10_export
  UNION ALL
  SELECT * FROM block_11_export
  UNION ALL
  SELECT * FROM block_12_export
  UNION ALL
  SELECT * FROM block_13_export
  UNION ALL
  SELECT * FROM block_14_export
  UNION ALL
  SELECT * FROM block_15_export
  UNION ALL
  SELECT * FROM block_16_export
  UNION ALL
  SELECT * FROM block_17_export
  UNION ALL
  SELECT * FROM block_18_export
  UNION ALL
  SELECT * FROM block_19_export
  UNION ALL
  SELECT * FROM block_20_export
  UNION ALL
  SELECT * FROM block_21_export
  UNION ALL
  SELECT * FROM block_22_export
  UNION ALL
  SELECT * FROM block_23_export
  UNION ALL
  SELECT * FROM block_24_export
  UNION ALL
  SELECT * FROM block_25_export
  UNION ALL
  SELECT * FROM block_26_export
  UNION ALL
  SELECT * FROM block_27_export
  UNION ALL
  SELECT * FROM block_28_export
  UNION ALL
  SELECT * FROM block_29_export
  UNION ALL
  SELECT * FROM block_30_export
)
SELECT
  result_block,
  result_order,
  row_order,
  row_type,
  data
FROM all_results
ORDER BY result_order ASC, row_order ASC;
