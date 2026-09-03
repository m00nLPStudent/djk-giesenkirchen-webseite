-- B15.24H2: READ-ONLY live preflight for department-aware master data.
-- Run manually in the Supabase SQL editor. This file contains SELECT statements only.

-- H2P.01_TEAM_TEMPLATE_SCHEMA
SELECT
  'H2P.01_TEAM_TEMPLATE_SCHEMA' AS section,
  c.ordinal_position,
  c.column_name,
  c.data_type,
  c.udt_schema,
  c.udt_name,
  c.is_nullable,
  c.column_default,
  c.is_identity,
  c.is_generated
FROM information_schema.columns AS c
WHERE c.table_schema = 'public'
  AND c.table_name = 'team_templates'
ORDER BY c.ordinal_position;

-- H2P.01A_TEAM_TEMPLATE_RELATION_CANDIDATES
-- Inventories direct columns, foreign keys and mapping tables without assuming a column name.
WITH relation_columns AS MATERIALIZED (
  SELECT c.table_schema, c.table_name, c.column_name, c.data_type
  FROM information_schema.columns AS c
  WHERE c.table_schema = 'public'
    AND (
      (c.table_name = 'team_templates' AND c.column_name ~* '(department|sport|section|category|scope|group|type|metadata|json)')
      OR (c.table_name ~* '(team.*template|template.*team)' AND c.column_name ~* '(department|sport|section|category|scope|group|type|metadata|json)')
    )
)
SELECT 'H2P.01A_TEAM_TEMPLATE_RELATION_CANDIDATES' AS section, rc.*
FROM relation_columns AS rc
ORDER BY rc.table_schema, rc.table_name, rc.column_name;

-- H2P.02_TEAM_TEMPLATE_DATA
SELECT
  'H2P.02_TEAM_TEMPLATE_DATA' AS section,
  to_jsonb(tt)->>'id' AS template_id,
  to_jsonb(tt)->>'name_de' AS name_de,
  to_jsonb(tt)->>'slug' AS slug,
  to_jsonb(tt)->>'age_group' AS age_group,
  to_jsonb(tt)->>'is_active' AS is_active,
  to_jsonb(tt)->>'sort_order' AS sort_order,
  NULLIF(to_jsonb(tt)->>'department_id', '') AS department_id,
  NULLIF(to_jsonb(tt)->>'sport_id', '') AS sport_id,
  NULLIF(to_jsonb(tt)->>'category_id', '') AS category_id,
  CASE
    WHEN concat_ws(' ', to_jsonb(tt)->>'name_de', to_jsonb(tt)->>'slug', to_jsonb(tt)->>'age_group')
      ~* '(bambini|junior|jugend|herren|damen|senior|u[0-9]+|fussball|fußball|torwart)' THEN 'likely_football'
    WHEN concat_ws(' ', to_jsonb(tt)->>'name_de', to_jsonb(tt)->>'slug', to_jsonb(tt)->>'age_group')
      ~* '(tischtennis|table[ -]?tennis|tt[ -])' THEN 'likely_table_tennis'
    ELSE 'manual_review'
  END AS suggested_classification
FROM public.team_templates AS tt
ORDER BY
  COALESCE(NULLIF(to_jsonb(tt)->>'sort_order', '')::integer, 2147483647),
  COALESCE(to_jsonb(tt)->>'name_de', to_jsonb(tt)->>'slug'),
  to_jsonb(tt)->>'id';

-- H2P.02A_TEAM_TEMPLATE_COUNTS
SELECT
  'H2P.02A_TEAM_TEMPLATE_COUNTS' AS section,
  count(*) AS total_count,
  count(*) FILTER (WHERE COALESCE(NULLIF(to_jsonb(tt)->>'is_active', '')::boolean, true)) AS active_count,
  count(*) FILTER (WHERE NOT COALESCE(NULLIF(to_jsonb(tt)->>'is_active', '')::boolean, true)) AS inactive_count,
  count(*) FILTER (WHERE concat_ws(' ', to_jsonb(tt)->>'name_de', to_jsonb(tt)->>'slug', to_jsonb(tt)->>'age_group') ~* '(bambini|junior|jugend|herren|damen|senior|u[0-9]+|fussball|fußball|torwart)') AS likely_football_count,
  count(*) FILTER (WHERE concat_ws(' ', to_jsonb(tt)->>'name_de', to_jsonb(tt)->>'slug', to_jsonb(tt)->>'age_group') ~* '(tischtennis|table[ -]?tennis|tt[ -])') AS likely_table_tennis_count
FROM public.team_templates AS tt;

-- H2P.03_DEPARTMENTS
SELECT
  'H2P.03_DEPARTMENTS' AS section,
  to_jsonb(d)->>'id' AS department_id,
  to_jsonb(d)->>'slug' AS slug,
  COALESCE(to_jsonb(d)->>'name_de', to_jsonb(d)->>'name', to_jsonb(d)->>'title') AS department_name,
  to_jsonb(d)->>'is_active' AS is_active
FROM public.departments AS d
WHERE to_jsonb(d)->>'slug' IN ('fussball', 'tischtennis')
ORDER BY to_jsonb(d)->>'slug';

-- H2P.04_BOARD_ROLE_SCHEMA
SELECT
  'H2P.04_BOARD_ROLE_SCHEMA' AS section,
  c.ordinal_position,
  c.column_name,
  c.data_type,
  c.udt_schema,
  c.udt_name,
  c.is_nullable,
  c.column_default,
  c.is_identity,
  c.is_generated
FROM information_schema.columns AS c
WHERE c.table_schema = 'public'
  AND c.table_name = 'board_roles'
ORDER BY c.ordinal_position;

-- H2P.04A_BOARD_ROLE_RELATION_CANDIDATES
WITH relation_columns AS MATERIALIZED (
  SELECT c.table_schema, c.table_name, c.column_name, c.data_type
  FROM information_schema.columns AS c
  WHERE c.table_schema = 'public'
    AND (
      (c.table_name = 'board_roles' AND c.column_name ~* '(department|sport|section|category|scope|group|type|metadata|json)')
      OR (c.table_name ~* '(board.*role|role.*board)' AND c.column_name ~* '(department|sport|section|category|scope|group|type|metadata|json)')
    )
)
SELECT 'H2P.04A_BOARD_ROLE_RELATION_CANDIDATES' AS section, rc.*
FROM relation_columns AS rc
ORDER BY rc.table_schema, rc.table_name, rc.column_name;

-- H2P.05_BOARD_ROLE_DATA
SELECT
  'H2P.05_BOARD_ROLE_DATA' AS section,
  to_jsonb(br)->>'id' AS board_role_id,
  COALESCE(to_jsonb(br)->>'key', to_jsonb(br)->>'slug', to_jsonb(br)->>'code') AS role_key,
  COALESCE(to_jsonb(br)->>'name_de', to_jsonb(br)->>'name', to_jsonb(br)->>'title_de', to_jsonb(br)->>'role_de') AS role_name,
  to_jsonb(br)->>'is_active' AS is_active,
  to_jsonb(br)->>'sort_order' AS sort_order,
  NULLIF(to_jsonb(br)->>'department_id', '') AS department_id,
  COALESCE(to_jsonb(br)->>'scope', to_jsonb(br)->>'category', to_jsonb(br)->>'role_group', to_jsonb(br)->>'role_type', to_jsonb(br)->>'sport', to_jsonb(br)->>'section') AS existing_scope_value,
  NULLIF(to_jsonb(br)->>'metadata', '') IS NOT NULL AS has_metadata
FROM public.board_roles AS br
ORDER BY
  COALESCE(NULLIF(to_jsonb(br)->>'sort_order', '')::integer, 2147483647),
  COALESCE(to_jsonb(br)->>'name_de', to_jsonb(br)->>'name', to_jsonb(br)->>'title_de'),
  to_jsonb(br)->>'id';

-- H2P.05A_REQUIRED_TABLE_TENNIS_BOARD_ROLES
WITH required_roles(required_name, sort_order) AS MATERIALIZED (
  VALUES
    ('1. Vorsitzender', 10),
    ('2. Vorsitzender', 20),
    ('Geschäftsführer', 30),
    ('2. Geschäftsführer', 40),
    ('Kassenwart', 50),
    ('stellvertretender Kassenwart', 60)
), available_roles AS MATERIALIZED (
  SELECT
    br.id,
    COALESCE(to_jsonb(br)->>'name_de', to_jsonb(br)->>'name', to_jsonb(br)->>'title_de', to_jsonb(br)->>'role_de') AS role_name,
    COALESCE(NULLIF(to_jsonb(br)->>'is_active', '')::boolean, true) AS is_active,
    NULLIF(to_jsonb(br)->>'department_id', '') AS department_id
  FROM public.board_roles AS br
)
SELECT
  'H2P.05A_REQUIRED_TABLE_TENNIS_BOARD_ROLES' AS section,
  rr.required_name,
  ar.id AS matching_role_id,
  ar.role_name AS matching_role_name,
  ar.is_active,
  ar.department_id,
  CASE WHEN ar.id IS NULL THEN 'missing' ELSE 'present' END AS availability
FROM required_roles AS rr
LEFT JOIN available_roles AS ar
  ON lower(regexp_replace(ar.role_name, '\s+', ' ', 'g')) = lower(regexp_replace(rr.required_name, '\s+', ' ', 'g'))
ORDER BY rr.sort_order, ar.id;

-- H2P.06_BOARD_MEMBER_RELATION
-- Structural output only; no names, contact fields or member data are selected.
SELECT
  'H2P.06_BOARD_MEMBER_RELATION' AS section,
  c.ordinal_position,
  c.column_name,
  c.data_type,
  c.is_nullable,
  c.column_default
FROM information_schema.columns AS c
WHERE c.table_schema = 'public'
  AND c.table_name = 'board_members'
  AND c.column_name IN ('id', 'role_id', 'department_id')
ORDER BY c.ordinal_position;

-- H2P.06A_BOARD_MEMBER_FOREIGN_KEYS
SELECT
  'H2P.06A_BOARD_MEMBER_FOREIGN_KEYS' AS section,
  con.conname AS constraint_name,
  con.conrelid::regclass::text AS source_relation,
  pg_get_constraintdef(con.oid, true) AS constraint_definition,
  con.confrelid::regclass::text AS referenced_relation
FROM pg_catalog.pg_constraint AS con
WHERE con.contype = 'f'
  AND con.conrelid = 'public.board_members'::regclass
ORDER BY con.conname;

-- H2P.07_TEAM_TEMPLATE_RLS
SELECT
  'H2P.07_TEAM_TEMPLATE_RLS' AS section,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS force_rls,
  pg_get_userbyid(c.relowner) AS owner
FROM pg_catalog.pg_class AS c
JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname = 'team_templates';

SELECT
  'H2P.07A_TEAM_TEMPLATE_POLICIES' AS section,
  p.policyname,
  p.permissive,
  p.roles,
  p.cmd,
  p.qual AS using_expression,
  p.with_check AS with_check_expression
FROM pg_catalog.pg_policies AS p
WHERE p.schemaname = 'public' AND p.tablename = 'team_templates'
ORDER BY p.cmd, p.policyname;

-- H2P.08_BOARD_ROLE_RLS
SELECT
  'H2P.08_BOARD_ROLE_RLS' AS section,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS force_rls,
  pg_get_userbyid(c.relowner) AS owner
FROM pg_catalog.pg_class AS c
JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname = 'board_roles';

SELECT
  'H2P.08A_BOARD_ROLE_POLICIES' AS section,
  p.policyname,
  p.permissive,
  p.roles,
  p.cmd,
  p.qual AS using_expression,
  p.with_check AS with_check_expression
FROM pg_catalog.pg_policies AS p
WHERE p.schemaname = 'public' AND p.tablename = 'board_roles'
ORDER BY p.cmd, p.policyname;

-- H2P.09_GRANTS
SELECT
  'H2P.09_GRANTS' AS section,
  g.table_name,
  g.grantee,
  g.privilege_type,
  g.is_grantable
FROM information_schema.role_table_grants AS g
WHERE g.table_schema = 'public'
  AND g.table_name IN ('team_templates', 'board_roles', 'board_members', 'departments')
  AND g.grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY g.table_name, g.grantee, g.privilege_type;

-- H2P.09A_COLUMN_GRANTS
SELECT
  'H2P.09A_COLUMN_GRANTS' AS section,
  g.table_name,
  g.column_name,
  g.grantee,
  g.privilege_type,
  g.is_grantable
FROM information_schema.role_column_grants AS g
WHERE g.table_schema = 'public'
  AND g.table_name IN ('team_templates', 'board_roles', 'board_members', 'departments')
  AND g.grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY g.table_name, g.column_name, g.grantee, g.privilege_type;

-- H2P.09B_EFFECTIVE_TABLE_PRIVILEGES
WITH target_roles(role_name) AS MATERIALIZED (
  VALUES ('anon'), ('authenticated'), ('service_role')
), target_tables(table_name) AS MATERIALIZED (
  VALUES ('team_templates'), ('board_roles'), ('board_members'), ('departments')
)
SELECT
  'H2P.09B_EFFECTIVE_TABLE_PRIVILEGES' AS section,
  tt.table_name,
  tr.role_name,
  has_table_privilege(tr.role_name, format('public.%I', tt.table_name), 'SELECT') AS can_select,
  has_table_privilege(tr.role_name, format('public.%I', tt.table_name), 'INSERT') AS can_insert,
  has_table_privilege(tr.role_name, format('public.%I', tt.table_name), 'UPDATE') AS can_update,
  has_table_privilege(tr.role_name, format('public.%I', tt.table_name), 'DELETE') AS can_delete,
  has_table_privilege(tr.role_name, format('public.%I', tt.table_name), 'TRUNCATE') AS can_truncate,
  has_table_privilege(tr.role_name, format('public.%I', tt.table_name), 'REFERENCES') AS can_references,
  has_table_privilege(tr.role_name, format('public.%I', tt.table_name), 'TRIGGER') AS can_trigger
FROM target_tables AS tt
CROSS JOIN target_roles AS tr
ORDER BY tt.table_name, tr.role_name;

-- H2P.10_CONSTRAINTS_INDEXES
SELECT
  'H2P.10A_CONSTRAINTS' AS section,
  con.conrelid::regclass::text AS relation_name,
  con.conname AS constraint_name,
  con.contype AS constraint_type,
  pg_get_constraintdef(con.oid, true) AS constraint_definition,
  CASE WHEN con.confrelid = 0 THEN NULL ELSE con.confrelid::regclass::text END AS referenced_relation,
  con.convalidated AS is_validated
FROM pg_catalog.pg_constraint AS con
WHERE con.conrelid IN (
  'public.team_templates'::regclass,
  'public.board_roles'::regclass,
  'public.board_members'::regclass,
  'public.departments'::regclass
)
ORDER BY relation_name, con.contype, con.conname;

SELECT
  'H2P.10B_INDEXES' AS section,
  i.tablename,
  i.indexname,
  i.indexdef
FROM pg_catalog.pg_indexes AS i
WHERE i.schemaname = 'public'
  AND i.tablename IN ('team_templates', 'board_roles', 'board_members', 'departments')
ORDER BY i.tablename, i.indexname;

-- H2P.10C_FOREIGN_KEY_GRAPH
-- Includes potential direct and mapping-table relations involving the target master data.
SELECT
  'H2P.10C_FOREIGN_KEY_GRAPH' AS section,
  con.conrelid::regclass::text AS source_relation,
  con.conname AS constraint_name,
  pg_get_constraintdef(con.oid, true) AS constraint_definition,
  con.confrelid::regclass::text AS referenced_relation
FROM pg_catalog.pg_constraint AS con
WHERE con.contype = 'f'
  AND (
    con.conrelid IN ('public.team_templates'::regclass, 'public.board_roles'::regclass, 'public.departments'::regclass)
    OR con.confrelid IN ('public.team_templates'::regclass, 'public.board_roles'::regclass, 'public.departments'::regclass)
  )
ORDER BY source_relation, con.conname;
