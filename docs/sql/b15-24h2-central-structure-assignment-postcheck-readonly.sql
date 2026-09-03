-- B15.24H2 - Central structure and assignment model
-- READ-ONLY postcheck. Run manually after the change proposal.

-- H2CSA.P01 Columns, types, nullability and defaults.
SELECT
  c.table_name,
  c.column_name,
  c.data_type,
  c.udt_name,
  c.is_nullable,
  c.column_default
FROM information_schema.columns c
WHERE c.table_schema = 'public'
  AND (c.table_name, c.column_name) IN (
    ('players', 'department_id'),
    ('coaches', 'department_id'),
    ('teams', 'department_id'),
    ('board_members', 'department_id'),
    ('board_members', 'organization_scope')
  )
ORDER BY c.table_name, c.column_name;

-- H2CSA.P02 Exact foreign keys.
SELECT
  tbl.relname AS table_name,
  con.conname AS constraint_name,
  pg_get_constraintdef(con.oid, true) AS constraint_definition
FROM pg_catalog.pg_constraint con
JOIN pg_catalog.pg_class tbl ON tbl.oid = con.conrelid
JOIN pg_catalog.pg_namespace n ON n.oid = tbl.relnamespace
WHERE n.nspname = 'public'
  AND tbl.relname IN ('players', 'coaches', 'teams')
  AND con.contype = 'f'
  AND EXISTS (
    SELECT 1 FROM unnest(con.conkey) key(attnum)
    JOIN pg_catalog.pg_attribute a ON a.attrelid = tbl.oid AND a.attnum = key.attnum
    WHERE a.attname = 'department_id'
  )
ORDER BY tbl.relname, con.conname;

-- H2CSA.P03 New indexes.
SELECT tablename, indexname, indexdef
FROM pg_catalog.pg_indexes
WHERE schemaname = 'public'
  AND indexname IN (
    'players_department_id_idx',
    'coaches_department_id_idx',
    'board_members_organization_scope_idx'
  )
ORDER BY indexname;

-- H2CSA.P04 Board constraints.
SELECT conname AS constraint_name, pg_get_constraintdef(oid, true) AS constraint_definition
FROM pg_catalog.pg_constraint
WHERE conrelid = 'public.board_members'::regclass
  AND conname IN (
    'board_members_organization_scope_values_check',
    'board_members_organization_scope_department_check'
  )
ORDER BY conname;

-- H2CSA.P05 Player distribution. Existing rows must remain unassigned immediately after migration.
SELECT
  count(*) AS total,
  count(*) FILTER (WHERE p.department_id IS NULL) AS unassigned,
  count(*) FILTER (WHERE d.slug = 'fussball') AS football,
  count(*) FILTER (WHERE d.slug = 'tischtennis') AS table_tennis,
  count(*) FILTER (WHERE p.department_id IS NOT NULL AND d.id IS NULL) AS broken_or_unknown
FROM public.players p
LEFT JOIN public.departments d ON d.id = p.department_id;

-- H2CSA.P06 Coach distribution. Existing rows must remain unassigned immediately after migration.
SELECT
  count(*) AS total,
  count(*) FILTER (WHERE c.department_id IS NULL) AS unassigned,
  count(*) FILTER (WHERE d.slug = 'fussball') AS football,
  count(*) FILTER (WHERE d.slug = 'tischtennis') AS table_tennis,
  count(*) FILTER (WHERE c.department_id IS NOT NULL AND d.id IS NULL) AS broken_or_unknown
FROM public.coaches c
LEFT JOIN public.departments d ON d.id = c.department_id;

-- H2CSA.P07 Team distribution. Confirmed baseline: 11 total, 6 NULL, 4 football, 1 table tennis.
SELECT
  count(*) AS total,
  count(*) FILTER (WHERE t.department_id IS NULL) AS unassigned,
  count(*) FILTER (WHERE d.slug = 'fussball') AS football,
  count(*) FILTER (WHERE d.slug = 'tischtennis') AS table_tennis,
  count(*) FILTER (WHERE t.department_id IS NOT NULL AND d.id IS NULL) AS broken_or_unknown
FROM public.teams t
LEFT JOIN public.departments d ON d.id = t.department_id;

-- H2CSA.P08 Board backfill and consistency.
SELECT
  count(*) AS total,
  count(*) FILTER (WHERE organization_scope = 'club') AS club,
  count(*) FILTER (WHERE organization_scope = 'department') AS department,
  count(*) FILTER (WHERE organization_scope = 'unassigned') AS unassigned,
  count(*) FILTER (
    WHERE (organization_scope = 'department') IS DISTINCT FROM (department_id IS NOT NULL)
  ) AS inconsistent
FROM public.board_members;

-- H2CSA.P09 RLS remains enabled and is not weakened through FORCE changes.
SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled, c.relforcerowsecurity AS force_rls
FROM pg_catalog.pg_class c
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname IN ('players', 'coaches', 'teams', 'board_members')
ORDER BY c.relname;

-- H2CSA.P10 Complete SELECT-policy inventory; inspect that no legacy public policy bypasses the new predicates.
SELECT tablename, policyname, roles, cmd, qual
FROM pg_catalog.pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('players', 'coaches', 'teams', 'board_members')
  AND cmd = 'SELECT'
ORDER BY tablename, policyname;

-- H2CSA.P11 Effective table and column grants for browser/service roles.
SELECT 'table' AS grant_scope, table_name, NULL::text AS column_name, grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN ('players', 'coaches', 'teams', 'board_members')
  AND grantee IN ('anon', 'authenticated', 'service_role')
UNION ALL
SELECT 'column', table_name, column_name, grantee, privilege_type
FROM information_schema.role_column_grants
WHERE table_schema = 'public'
  AND table_name IN ('players', 'coaches', 'teams', 'board_members')
  AND grantee IN ('anon', 'authenticated', 'service_role')
  AND column_name IN ('department_id', 'organization_scope')
ORDER BY table_name, grant_scope, column_name NULLS FIRST, grantee, privilege_type;

-- H2CSA.P12 Explicit effective mutation checks for the protected columns.
SELECT
  role_name,
  has_column_privilege(role_name, 'public.players', 'department_id', 'INSERT') AS player_department_insert,
  has_column_privilege(role_name, 'public.players', 'department_id', 'UPDATE') AS player_department_update,
  has_column_privilege(role_name, 'public.coaches', 'department_id', 'INSERT') AS coach_department_insert,
  has_column_privilege(role_name, 'public.coaches', 'department_id', 'UPDATE') AS coach_department_update,
  has_column_privilege(role_name, 'public.board_members', 'organization_scope', 'INSERT') AS board_scope_insert,
  has_column_privilege(role_name, 'public.board_members', 'organization_scope', 'UPDATE') AS board_scope_update
FROM (VALUES ('anon'), ('authenticated'), ('service_role')) roles(role_name)
ORDER BY role_name;

-- H2CSA.P13 Final assertions.
WITH column_state AS MATERIALIZED (
  SELECT
    count(*) FILTER (WHERE table_name = 'players' AND column_name = 'department_id' AND udt_name = 'uuid' AND is_nullable = 'YES' AND column_default IS NULL) = 1 AS player_column_ok,
    count(*) FILTER (WHERE table_name = 'coaches' AND column_name = 'department_id' AND udt_name = 'uuid' AND is_nullable = 'YES' AND column_default IS NULL) = 1 AS coach_column_ok,
    count(*) FILTER (WHERE table_name = 'board_members' AND column_name = 'organization_scope' AND udt_name = 'text' AND is_nullable = 'NO' AND column_default = '''unassigned''::text') = 1 AS board_scope_ok
  FROM information_schema.columns
  WHERE table_schema = 'public'
),
fk_state AS MATERIALIZED (
  SELECT bool_and(pg_get_constraintdef(con.oid, true) = 'FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL') AS all_fks_ok,
         count(*) = 3 AS fk_count_ok
  FROM pg_catalog.pg_constraint con
  JOIN pg_catalog.pg_class tbl ON tbl.oid = con.conrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = tbl.relnamespace
  WHERE n.nspname = 'public' AND tbl.relname IN ('players', 'coaches', 'teams') AND con.contype = 'f'
    AND EXISTS (SELECT 1 FROM unnest(con.conkey) k(attnum) JOIN pg_catalog.pg_attribute a ON a.attrelid = tbl.oid AND a.attnum = k.attnum WHERE a.attname = 'department_id')
),
index_state AS MATERIALIZED (
  SELECT
    count(*) FILTER (WHERE indexname = 'players_department_id_idx' AND indexdef NOT ILIKE '% WHERE %') = 1 AS player_index_ok,
    count(*) FILTER (WHERE indexname = 'coaches_department_id_idx' AND indexdef NOT ILIKE '% WHERE %') = 1 AS coach_index_ok,
    count(*) FILTER (WHERE indexname = 'board_members_organization_scope_idx' AND indexdef NOT ILIKE '% WHERE %') = 1 AS board_index_ok
  FROM pg_catalog.pg_indexes WHERE schemaname = 'public'
),
policy_state AS MATERIALIZED (
  SELECT
    bool_and(qual ILIKE '%department_id IS NOT NULL%') FILTER (WHERE tablename = 'players') AS public_player_fail_closed,
    bool_and(qual ILIKE '%department_id IS NOT NULL%') FILTER (WHERE tablename = 'coaches') AS public_coach_fail_closed,
    bool_and(qual ILIKE '%department_id IS NOT NULL%') FILTER (WHERE tablename = 'teams' AND ('anon' = ANY(roles) OR 'public' = ANY(roles))) AS public_team_fail_closed,
    bool_and(qual ILIKE '%organization_scope%' AND qual ILIKE '%club%' AND qual ILIKE '%department%') FILTER (WHERE tablename = 'board_members' AND ('anon' = ANY(roles) OR 'public' = ANY(roles))) AS public_board_fail_closed
  FROM pg_catalog.pg_policies
  WHERE schemaname = 'public' AND cmd = 'SELECT'
    AND tablename IN ('players', 'coaches', 'teams', 'board_members')
    AND ('anon' = ANY(roles) OR 'public' = ANY(roles))
),
rls_state AS MATERIALIZED (
  SELECT bool_and(c.relrowsecurity) AND count(*) = 4 AS rls_ok
  FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname IN ('players', 'coaches', 'teams', 'board_members')
),
board_state AS MATERIALIZED (
  SELECT
    count(*) FILTER (WHERE (organization_scope = 'department') IS DISTINCT FROM (department_id IS NOT NULL)) = 0 AS board_consistency_ok,
    count(*) = 6 AND count(*) FILTER (WHERE organization_scope = 'club') = 5
      AND count(*) FILTER (WHERE organization_scope = 'department') = 1
      AND count(*) FILTER (WHERE organization_scope = 'unassigned') = 0 AS board_backfill_expected
  FROM public.board_members
),
privilege_state AS MATERIALIZED (
  SELECT
    NOT has_column_privilege('anon', 'public.players', 'department_id', 'INSERT, UPDATE')
    AND NOT has_column_privilege('authenticated', 'public.players', 'department_id', 'INSERT, UPDATE')
    AND NOT has_column_privilege('anon', 'public.coaches', 'department_id', 'INSERT, UPDATE')
    AND NOT has_column_privilege('authenticated', 'public.coaches', 'department_id', 'INSERT, UPDATE')
    AND NOT has_column_privilege('anon', 'public.board_members', 'organization_scope', 'INSERT, UPDATE')
    AND NOT has_column_privilege('authenticated', 'public.board_members', 'organization_scope', 'INSERT, UPDATE')
    AND has_column_privilege('service_role', 'public.players', 'department_id', 'INSERT')
    AND has_column_privilege('service_role', 'public.players', 'department_id', 'UPDATE')
    AND has_column_privilege('service_role', 'public.coaches', 'department_id', 'INSERT')
    AND has_column_privilege('service_role', 'public.coaches', 'department_id', 'UPDATE')
    AND has_column_privilege('service_role', 'public.board_members', 'organization_scope', 'INSERT')
    AND has_column_privilege('service_role', 'public.board_members', 'organization_scope', 'UPDATE') AS privilege_contract_ok
)
SELECT
  cs.player_column_ok,
  cs.coach_column_ok,
  (fs.all_fks_ok AND fs.fk_count_ok) AS team_fk_ok,
  cs.board_scope_ok,
  bs.board_consistency_ok,
  ix.player_index_ok,
  ix.coach_index_ok,
  ix.board_index_ok,
  ps.public_player_fail_closed,
  ps.public_coach_fail_closed,
  ps.public_team_fail_closed,
  ps.public_board_fail_closed,
  rs.rls_ok,
  pv.privilege_contract_ok,
  NOT EXISTS (SELECT 1 FROM public.players WHERE department_id IS NOT NULL) AS player_no_backfill,
  NOT EXISTS (SELECT 1 FROM public.coaches WHERE department_id IS NOT NULL) AS coach_no_backfill,
  ((SELECT count(*) FROM public.teams) = 11
    AND (SELECT count(*) FROM public.teams WHERE department_id IS NULL) = 6
    AND (SELECT count(*) FROM public.teams t JOIN public.departments d ON d.id = t.department_id WHERE d.slug = 'fussball') = 4
    AND (SELECT count(*) FROM public.teams t JOIN public.departments d ON d.id = t.department_id WHERE d.slug = 'tischtennis') = 1) AS teams_unchanged,
  bs.board_backfill_expected
FROM column_state cs CROSS JOIN fk_state fs CROSS JOIN index_state ix CROSS JOIN policy_state ps
CROSS JOIN rls_state rs CROSS JOIN board_state bs CROSS JOIN privilege_state pv;
