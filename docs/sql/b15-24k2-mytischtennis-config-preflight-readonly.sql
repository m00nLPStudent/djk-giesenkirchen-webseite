-- B15.24K2 - myTischtennis/click-TT team-season configuration preflight
-- READ-ONLY. Run manually in Supabase before reviewing the change proposal.

-- K2P.01 Required relations, owners and RLS state.
SELECT 'K2P.01_RELATIONS' AS section,
       n.nspname AS schema_name,
       c.relname AS relation_name,
       c.relkind,
       pg_catalog.pg_get_userbyid(c.relowner) AS owner_name,
       c.relrowsecurity AS rls_enabled,
       c.relforcerowsecurity AS force_rls
FROM pg_catalog.pg_class AS c
JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('departments', 'teams', 'seasons', 'team_seasons',
                    'team_season_external_competitions')
ORDER BY c.relname;

-- K2P.02 Exact team_seasons column contract and collision check.
SELECT 'K2P.02_TEAM_SEASONS_COLUMNS' AS section,
       a.attnum AS ordinal_position,
       a.attname AS column_name,
       pg_catalog.format_type(a.atttypid, a.atttypmod) AS data_type,
       a.attnotnull AS not_null,
       pg_catalog.pg_get_expr(d.adbin, d.adrelid) AS column_default
FROM pg_catalog.pg_attribute AS a
JOIN pg_catalog.pg_class AS c ON c.oid = a.attrelid
JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
LEFT JOIN pg_catalog.pg_attrdef AS d
  ON d.adrelid = a.attrelid AND d.adnum = a.attnum
WHERE n.nspname = 'public'
  AND c.relname = 'team_seasons'
  AND a.attnum > 0
  AND NOT a.attisdropped
ORDER BY a.attnum;

-- K2P.03 Existing external/provider-like columns anywhere relevant.
SELECT 'K2P.03_EXTERNAL_COLUMNS' AS section,
       table_name, ordinal_position, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('teams', 'team_seasons', 'team_season_external_competitions')
  AND (
    column_name ILIKE '%external%'
    OR column_name ILIKE '%provider%'
    OR column_name ILIKE '%click%'
    OR column_name ILIKE '%tischtennis%'
    OR column_name ILIKE '%fussball_de%'
    OR column_name ILIKE '%fupa%'
  )
ORDER BY table_name, ordinal_position;

-- K2P.04 Constraints on team_seasons and any colliding target relation.
SELECT 'K2P.04_CONSTRAINTS' AS section,
       con.conrelid::regclass::text AS relation_name,
       con.conname AS constraint_name,
       con.contype AS constraint_type,
       pg_catalog.pg_get_constraintdef(con.oid, true) AS definition
FROM pg_catalog.pg_constraint AS con
WHERE con.conrelid IN (
  'public.team_seasons'::regclass,
  COALESCE(to_regclass('public.team_season_external_competitions'),
           'public.team_seasons'::regclass)
)
ORDER BY relation_name, constraint_name;

-- K2P.05 Indexes on team_seasons and any existing target relation.
SELECT 'K2P.05_INDEXES' AS section,
       schemaname, tablename, indexname, indexdef
FROM pg_catalog.pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('team_seasons', 'team_season_external_competitions')
ORDER BY tablename, indexname;

-- K2P.06 Complete RLS policy inventory.
SELECT 'K2P.06_POLICIES' AS section,
       schemaname, tablename, policyname, permissive, roles, cmd,
       qual AS using_expression,
       with_check AS with_check_expression
FROM pg_catalog.pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('team_seasons', 'team_season_external_competitions')
ORDER BY tablename, cmd, policyname;

-- K2P.07 Table grants for application roles.
SELECT 'K2P.07_TABLE_GRANTS' AS section,
       table_name, grantee, privilege_type, is_grantable
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN ('team_seasons', 'team_season_external_competitions')
  AND grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY table_name, grantee, privilege_type;

-- K2P.08 Column grants, including inherited table-wide access visibility.
SELECT 'K2P.08_COLUMN_GRANTS' AS section,
       table_name, column_name, grantee, privilege_type, is_grantable
FROM information_schema.role_column_grants
WHERE table_schema = 'public'
  AND table_name IN ('team_seasons', 'team_season_external_competitions')
  AND grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY table_name, column_name, grantee, privilege_type;

-- K2P.09 Required key types and foreign-key targets.
SELECT 'K2P.09_KEY_TYPES' AS section,
       table_name, column_name, data_type, udt_schema, udt_name, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (table_name, column_name) IN (
    ('departments', 'id'), ('departments', 'slug'),
    ('teams', 'id'), ('teams', 'department_id'),
    ('seasons', 'id'),
    ('team_seasons', 'id'), ('team_seasons', 'team_id'),
    ('team_seasons', 'season_id'), ('team_seasons', 'is_active')
  )
ORDER BY table_name, column_name;

-- K2P.10 Sanitized TT configuration readiness counts; no names or PII.
SELECT 'K2P.10_TT_READINESS' AS section,
       count(DISTINCT t.id) FILTER (WHERE d.slug = 'tischtennis') AS tt_team_count,
       count(ts.id) FILTER (WHERE d.slug = 'tischtennis') AS tt_team_season_count,
       count(ts.id) FILTER (
         WHERE d.slug = 'tischtennis' AND t.is_active = true AND ts.is_active = true
       ) AS active_tt_team_season_count,
       count(ts.id) FILTER (
         WHERE d.slug <> 'tischtennis' OR d.slug IS NULL
       ) AS non_tt_team_season_count
FROM public.teams AS t
LEFT JOIN public.departments AS d ON d.id = t.department_id
LEFT JOIN public.team_seasons AS ts ON ts.team_id = t.id;

-- K2P.11 Collision statistics without querying an unknown relation.
SELECT 'K2P.11_TARGET_COLLISION' AS section,
       to_regclass('public.team_season_external_competitions') AS target_relation,
       s.n_live_tup AS estimated_live_rows,
       s.n_dead_tup AS estimated_dead_rows
FROM (VALUES (1)) AS anchor(value)
LEFT JOIN pg_catalog.pg_stat_user_tables AS s
  ON s.schemaname = 'public'
 AND s.relname = 'team_season_external_competitions';

-- K2P.12 Required roles and UUID generator availability.
SELECT 'K2P.12_PREREQUISITES' AS section,
       to_regrole('anon') IS NOT NULL AS anon_exists,
       to_regrole('authenticated') IS NOT NULL AS authenticated_exists,
       to_regrole('service_role') IS NOT NULL AS service_role_exists,
       to_regprocedure('gen_random_uuid()') IS NOT NULL AS gen_random_uuid_exists;

-- K2P.13 Existing permission keys and role mappings used by the later server
-- action. The live permission catalogue is admin_permissions.key; assignments
-- are admin_role_permissions -> admin_roles.
WITH expected(permission_key) AS MATERIALIZED (
  VALUES ('teams.view'), ('teams.edit')
)
SELECT 'K2P.13_TEAM_PERMISSIONS' AS section,
       expected.permission_key,
       permission_row.id IS NOT NULL AS permission_exists,
       COALESCE(
         array_agg(DISTINCT role_row.key::text ORDER BY role_row.key::text)
           FILTER (WHERE role_row.key IS NOT NULL),
         ARRAY[]::text[]
       ) AS assigned_role_keys,
       to_regprocedure(
         'public.current_admin_permission_allows_department(text,uuid)'
       ) IS NOT NULL AS department_permission_helper_exists
FROM expected
LEFT JOIN public.admin_permissions AS permission_row
  ON permission_row.key = expected.permission_key
LEFT JOIN public.admin_role_permissions AS role_permission
  ON role_permission.permission_id = permission_row.id
LEFT JOIN public.admin_roles AS role_row
  ON role_row.id = role_permission.role_id
GROUP BY expected.permission_key, permission_row.id
ORDER BY expected.permission_key;
