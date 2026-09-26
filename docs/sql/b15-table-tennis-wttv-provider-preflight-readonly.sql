-- B15 - Table-tennis WTTV provider migration preflight
-- READ-ONLY. Run manually in the Supabase SQL Editor and return every result
-- block WTTVP.01 through WTTVP.17 before preparing proposal/rollback SQL.
--
-- This file contains metadata and SELECT queries only. It does not call any
-- application function and does not modify schema, privileges or data.

-- WTTVP.01 Target relation, owner and RLS state.
SELECT 'WTTVP.01_RELATION' AS section,
       n.nspname AS schema_name,
       c.relname AS relation_name,
       c.relkind AS relation_kind,
       pg_catalog.pg_get_userbyid(c.relowner) AS owner_name,
       c.relrowsecurity AS rls_enabled,
       c.relforcerowsecurity AS force_rls,
       c.relpersistence AS persistence
FROM pg_catalog.pg_class AS c
JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname = 'team_season_external_competitions';

-- WTTVP.02 Exact column contract, including identity/generated metadata.
SELECT 'WTTVP.02_COLUMNS' AS section,
       cols.ordinal_position,
       cols.column_name,
       cols.data_type,
       cols.udt_schema,
       cols.udt_name,
       cols.is_nullable,
       cols.column_default,
       cols.is_identity,
       cols.identity_generation,
       cols.is_generated,
       cols.generation_expression
FROM information_schema.columns AS cols
WHERE cols.table_schema = 'public'
  AND cols.table_name = 'team_season_external_competitions'
ORDER BY cols.ordinal_position;

-- WTTVP.03 Primary key, foreign keys, unique and check constraints.
SELECT 'WTTVP.03_CONSTRAINTS' AS section,
       con.conname AS constraint_name,
       con.contype AS constraint_type,
       pg_catalog.pg_get_constraintdef(con.oid, true) AS definition,
       CASE
         WHEN con.confrelid = 0 THEN NULL
         ELSE con.confrelid::regclass::text
       END AS referenced_relation
FROM pg_catalog.pg_constraint AS con
WHERE con.conrelid = 'public.team_season_external_competitions'::regclass
ORDER BY con.contype, con.conname;

-- WTTVP.04 Index inventory.
SELECT 'WTTVP.04_INDEXES' AS section,
       indexes.indexname AS index_name,
       indexes.indexdef AS definition
FROM pg_catalog.pg_indexes AS indexes
WHERE indexes.schemaname = 'public'
  AND indexes.tablename = 'team_season_external_competitions'
ORDER BY indexes.indexname;

-- WTTVP.05 Complete policy inventory.
SELECT 'WTTVP.05_POLICIES' AS section,
       policies.policyname AS policy_name,
       policies.permissive,
       policies.roles,
       policies.cmd,
       policies.qual AS using_expression,
       policies.with_check AS with_check_expression
FROM pg_catalog.pg_policies AS policies
WHERE policies.schemaname = 'public'
  AND policies.tablename = 'team_season_external_competitions'
ORDER BY policies.cmd, policies.policyname;

-- WTTVP.06 Raw table ACL, including PUBLIC (grantee OID 0).
SELECT 'WTTVP.06_TABLE_ACL' AS section,
       CASE
         WHEN acl.grantee = 0 THEN 'PUBLIC'
         ELSE pg_catalog.pg_get_userbyid(acl.grantee)
       END AS grantee,
       pg_catalog.pg_get_userbyid(acl.grantor) AS grantor,
       acl.privilege_type,
       acl.is_grantable
FROM pg_catalog.pg_class AS c
CROSS JOIN LATERAL pg_catalog.aclexplode(
  COALESCE(c.relacl, pg_catalog.acldefault('r', c.relowner))
) AS acl
WHERE c.oid = 'public.team_season_external_competitions'::regclass
ORDER BY grantee, acl.privilege_type;

-- WTTVP.07 Explicit column ACL. No rows means no explicit column grants.
SELECT 'WTTVP.07_COLUMN_ACL' AS section,
       attribute.attname AS column_name,
       CASE
         WHEN acl.grantee = 0 THEN 'PUBLIC'
         ELSE pg_catalog.pg_get_userbyid(acl.grantee)
       END AS grantee,
       pg_catalog.pg_get_userbyid(acl.grantor) AS grantor,
       acl.privilege_type,
       acl.is_grantable
FROM pg_catalog.pg_attribute AS attribute
CROSS JOIN LATERAL pg_catalog.aclexplode(attribute.attacl) AS acl
WHERE attribute.attrelid =
        'public.team_season_external_competitions'::regclass
  AND attribute.attnum > 0
  AND NOT attribute.attisdropped
ORDER BY attribute.attnum, grantee, acl.privilege_type;

-- WTTVP.08 Effective privileges for application roles.
SELECT 'WTTVP.08_EFFECTIVE_PRIVILEGES' AS section,
       role_name,
       has_table_privilege(
         role_name,
         'public.team_season_external_competitions',
         'SELECT'
       ) AS can_select,
       has_table_privilege(
         role_name,
         'public.team_season_external_competitions',
         'INSERT'
       ) AS can_insert,
       has_table_privilege(
         role_name,
         'public.team_season_external_competitions',
         'UPDATE'
       ) AS can_update,
       has_table_privilege(
         role_name,
         'public.team_season_external_competitions',
         'DELETE'
       ) AS can_delete,
       has_table_privilege(
         role_name,
         'public.team_season_external_competitions',
         'TRUNCATE'
       ) AS can_truncate,
       has_table_privilege(
         role_name,
         'public.team_season_external_competitions',
         'REFERENCES'
       ) AS can_reference,
       has_table_privilege(
         role_name,
         'public.team_season_external_competitions',
         'TRIGGER'
       ) AS can_trigger
FROM (VALUES ('anon'), ('authenticated'), ('service_role')) AS roles(role_name)
ORDER BY role_name;

-- WTTVP.09 Triggers and their definitions.
SELECT 'WTTVP.09_TRIGGERS' AS section,
       trigger_row.tgname AS trigger_name,
       trigger_row.tgenabled AS trigger_enabled,
       trigger_row.tgisinternal AS is_internal,
       trigger_row.tgfoid::regprocedure::text AS function_signature,
       pg_catalog.pg_get_triggerdef(trigger_row.oid, true) AS trigger_definition
FROM pg_catalog.pg_trigger AS trigger_row
WHERE trigger_row.tgrelid =
        'public.team_season_external_competitions'::regclass
ORDER BY trigger_row.tgisinternal, trigger_row.tgname;

-- WTTVP.10 Trigger-function metadata and definitions. The MATERIALIZED CTE
-- excludes aggregates/window functions before pg_get_functiondef is evaluated.
WITH trigger_function_oids AS MATERIALIZED (
  SELECT DISTINCT trigger_row.tgfoid AS oid
  FROM pg_catalog.pg_trigger AS trigger_row
  WHERE trigger_row.tgrelid =
          'public.team_season_external_competitions'::regclass
),
safe_functions AS MATERIALIZED (
  SELECT proc.oid,
         proc.prosecdef,
         proc.proconfig,
         proc.proacl,
         proc.proowner,
         pg_catalog.pg_get_userbyid(proc.proowner) AS owner_name,
         pg_catalog.pg_get_function_result(proc.oid) AS return_type,
         pg_catalog.pg_get_function_arguments(proc.oid) AS arguments,
         pg_catalog.pg_get_functiondef(proc.oid) AS function_definition
  FROM pg_catalog.pg_proc AS proc
  JOIN trigger_function_oids ON trigger_function_oids.oid = proc.oid
  WHERE proc.prokind IN ('f', 'p')
)
SELECT 'WTTVP.10_TRIGGER_FUNCTIONS' AS section,
       safe_functions.oid::regprocedure::text AS function_signature,
       safe_functions.arguments,
       safe_functions.return_type,
       safe_functions.owner_name,
       safe_functions.prosecdef AS security_definer,
       safe_functions.proconfig,
       EXISTS (
         SELECT 1
         FROM pg_catalog.aclexplode(
           COALESCE(
             safe_functions.proacl,
             pg_catalog.acldefault('f', safe_functions.proowner)
           )
         ) AS function_acl
         WHERE function_acl.grantee = 0
           AND function_acl.privilege_type = 'EXECUTE'
       ) AS public_can_execute,
       has_function_privilege(
         'anon', safe_functions.oid, 'EXECUTE'
       ) AS anon_can_execute,
       has_function_privilege(
         'authenticated', safe_functions.oid, 'EXECUTE'
       ) AS authenticated_can_execute,
       has_function_privilege(
         'service_role', safe_functions.oid, 'EXECUTE'
       ) AS service_role_can_execute,
       safe_functions.function_definition
FROM safe_functions
ORDER BY safe_functions.oid::regprocedure::text;

-- WTTVP.11 Current click-TT configuration rows. These are technical
-- competition identifiers, not auth/user identifiers or secrets.
SELECT 'WTTVP.11_CLICK_TT_CONFIGURATIONS' AS section,
       config.id,
       config.team_season_id,
       config.provider,
       config.association,
       config.external_season_key,
       config.external_group_id,
       config.league_slug,
       config.external_team_id,
       config.is_active,
       config.created_at,
       config.updated_at
FROM public.team_season_external_competitions AS config
WHERE config.provider = 'click_tt'
ORDER BY config.team_season_id, config.id;

-- WTTVP.12 Resolve every click-TT row to department, team, team season and
-- season. The result must make 1. Herren, 2. Herren and any senior team
-- unambiguous without inferring a mapping.
SELECT 'WTTVP.12_TEAM_SEASON_MAPPING' AS section,
       config.id AS configuration_id,
       config.team_season_id,
       team_season.team_id,
       team.name_de AS team_name,
       team.slug AS team_slug,
       team_season.name_de AS team_season_name,
       season.id AS season_id,
       season.name AS season_name,
       season.is_current AS season_is_current,
       department.id AS department_id,
       department.slug AS department_slug,
       config.association,
       config.external_season_key,
       config.external_group_id,
       config.league_slug,
       config.external_team_id,
       config.is_active AS configuration_is_active,
       team_season.is_active AS team_season_is_active,
       team.is_active AS team_is_active
FROM public.team_season_external_competitions AS config
LEFT JOIN public.team_seasons AS team_season
  ON team_season.id = config.team_season_id
LEFT JOIN public.teams AS team ON team.id = team_season.team_id
LEFT JOIN public.seasons AS season ON season.id = team_season.season_id
LEFT JOIN public.departments AS department
  ON department.id = team.department_id
WHERE config.provider = 'click_tt'
ORDER BY season.name, team.sort_order, team.name_de, config.id;

-- WTTVP.13 Search public-schema metadata for an existing semantically suitable
-- championship/competition scope field. Values are deliberately not selected.
SELECT 'WTTVP.13_SCOPE_COLUMN_CANDIDATES' AS section,
       cols.table_schema,
       cols.table_name,
       cols.ordinal_position,
       cols.column_name,
       cols.data_type,
       cols.is_nullable,
       cols.column_default
FROM information_schema.columns AS cols
WHERE cols.table_schema = 'public'
  AND (
    cols.column_name ILIKE '%championship%'
    OR cols.column_name ILIKE '%competition_scope%'
    OR cols.column_name ILIKE '%association_scope%'
    OR cols.column_name ILIKE '%external_championship%'
    OR cols.column_name ILIKE '%district%'
    OR cols.column_name ILIKE '%region%'
  )
ORDER BY cols.table_name, cols.ordinal_position;

-- WTTVP.14 Exact external_team_id contract and constraints that mention it.
SELECT 'WTTVP.14_EXTERNAL_TEAM_ID_CONTRACT' AS section,
       cols.table_schema,
       cols.table_name,
       cols.column_name,
       cols.data_type,
       cols.udt_schema,
       cols.udt_name,
       cols.is_nullable,
       cols.column_default,
       constraint_row.constraint_name,
       constraint_row.constraint_type,
       constraint_row.definition AS constraint_definition
FROM information_schema.columns AS cols
LEFT JOIN LATERAL (
  SELECT con.conname AS constraint_name,
         con.contype AS constraint_type,
         pg_catalog.pg_get_constraintdef(con.oid, true) AS definition
  FROM pg_catalog.pg_constraint AS con
  WHERE con.conrelid =
          'public.team_season_external_competitions'::regclass
    AND pg_catalog.pg_get_constraintdef(con.oid, true)
          ILIKE '%external_team_id%'
) AS constraint_row ON true
WHERE cols.table_schema = 'public'
  AND cols.table_name = 'team_season_external_competitions'
  AND cols.column_name = 'external_team_id'
ORDER BY constraint_row.constraint_name;

-- WTTVP.15 Views/materialized views whose stored definition references the
-- configuration relation or one of its provider fields.
WITH view_definitions AS MATERIALIZED (
  SELECT views.schemaname AS schema_name,
         views.viewname AS relation_name,
         'view'::text AS relation_kind,
         views.definition
  FROM pg_catalog.pg_views AS views
  WHERE views.schemaname NOT IN ('pg_catalog', 'information_schema')
  UNION ALL
  SELECT materialized.schemaname AS schema_name,
         materialized.matviewname AS relation_name,
         'materialized_view'::text AS relation_kind,
         materialized.definition
  FROM pg_catalog.pg_matviews AS materialized
  WHERE materialized.schemaname NOT IN ('pg_catalog', 'information_schema')
)
SELECT 'WTTVP.15_DEPENDENT_VIEWS' AS section,
       view_definitions.schema_name,
       view_definitions.relation_name,
       view_definitions.relation_kind,
       view_definitions.definition
FROM view_definitions
WHERE view_definitions.definition ILIKE
        '%team_season_external_competitions%'
   OR view_definitions.definition ~*
        'external_team_id|external_group_id|external_season_key|association|league_slug'
ORDER BY view_definitions.schema_name, view_definitions.relation_name;

-- WTTVP.16 Functions/procedures whose source references the relation or its
-- provider fields. MATERIALIZED safe_functions guarantees that definitions
-- are requested only for normal functions/procedures, never aggregates or
-- window functions.
WITH candidate_functions AS MATERIALIZED (
  SELECT proc.oid,
         namespace.nspname AS schema_name,
         proc.proname,
         proc.prosecdef,
         proc.proconfig,
         proc.proowner,
         pg_catalog.pg_get_userbyid(proc.proowner) AS owner_name
  FROM pg_catalog.pg_proc AS proc
  JOIN pg_catalog.pg_namespace AS namespace
    ON namespace.oid = proc.pronamespace
  WHERE namespace.nspname NOT IN ('pg_catalog', 'information_schema')
    AND proc.prokind IN ('f', 'p')
),
safe_functions AS MATERIALIZED (
  SELECT candidate_functions.*,
         pg_catalog.pg_get_functiondef(candidate_functions.oid)
           AS function_definition
  FROM candidate_functions
)
SELECT 'WTTVP.16_DEPENDENT_FUNCTIONS' AS section,
       safe_functions.oid::regprocedure::text AS function_signature,
       safe_functions.schema_name,
       safe_functions.owner_name,
       safe_functions.prosecdef AS security_definer,
       safe_functions.proconfig,
       safe_functions.function_definition
FROM safe_functions
WHERE safe_functions.function_definition ILIKE
        '%team_season_external_competitions%'
   OR safe_functions.function_definition ~*
        'external_team_id|external_group_id|external_season_key|association|league_slug'
ORDER BY safe_functions.oid::regprocedure::text;

-- WTTVP.17 Sanitized integrity summary for proposal planning.
SELECT 'WTTVP.17_INTEGRITY_SUMMARY' AS section,
       count(*) FILTER (
         WHERE config.provider = 'click_tt'
       ) AS click_tt_configuration_count,
       count(*) FILTER (
         WHERE config.provider = 'click_tt' AND config.is_active
       ) AS active_click_tt_configuration_count,
       count(*) FILTER (
         WHERE config.provider = 'click_tt'
           AND team_season.id IS NULL
       ) AS missing_team_season_count,
       count(*) FILTER (
         WHERE config.provider = 'click_tt' AND team.id IS NULL
       ) AS missing_team_count,
       count(*) FILTER (
         WHERE config.provider = 'click_tt'
           AND season.id IS NULL
       ) AS missing_season_count,
       count(*) FILTER (
         WHERE config.provider = 'click_tt'
           AND department.slug IS DISTINCT FROM 'tischtennis'
       ) AS non_table_tennis_scope_count,
       count(DISTINCT config.external_team_id) FILTER (
         WHERE config.provider = 'click_tt'
       ) AS distinct_external_team_id_count,
       count(DISTINCT config.external_group_id) FILTER (
         WHERE config.provider = 'click_tt'
       ) AS distinct_external_group_id_count
FROM public.team_season_external_competitions AS config
LEFT JOIN public.team_seasons AS team_season
  ON team_season.id = config.team_season_id
LEFT JOIN public.teams AS team ON team.id = team_season.team_id
LEFT JOIN public.seasons AS season ON season.id = team_season.season_id
LEFT JOIN public.departments AS department
  ON department.id = team.department_id;
