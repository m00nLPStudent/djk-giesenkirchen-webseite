-- B15 / Version 1.0.8: board-role "Webmaster" live preflight.
-- READ-ONLY: run manually in the Supabase SQL Editor and return every result block.
-- This file inventories the live contract only. It deliberately chooses no target values.

-- BRWPF.01_RELATION
SELECT
  'BRWPF.01_RELATION' AS section,
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
  AND c.relname = 'board_roles';

-- BRWPF.02_COLUMNS
SELECT
  'BRWPF.02_COLUMNS' AS section,
  a.attnum AS ordinal_position,
  a.attname AS column_name,
  pg_catalog.format_type(a.atttypid, a.atttypmod) AS data_type,
  NOT a.attnotnull AS is_nullable,
  pg_catalog.pg_get_expr(ad.adbin, ad.adrelid) AS column_default,
  a.attidentity AS identity_kind,
  a.attgenerated AS generated_kind,
  col.collname AS collation_name
FROM pg_catalog.pg_attribute AS a
JOIN pg_catalog.pg_class AS c ON c.oid = a.attrelid
JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
LEFT JOIN pg_catalog.pg_attrdef AS ad
  ON ad.adrelid = a.attrelid AND ad.adnum = a.attnum
LEFT JOIN pg_catalog.pg_collation AS col ON col.oid = a.attcollation
WHERE n.nspname = 'public'
  AND c.relname = 'board_roles'
  AND a.attnum > 0
  AND NOT a.attisdropped
ORDER BY a.attnum;

-- BRWPF.03_CONSTRAINTS
SELECT
  'BRWPF.03_CONSTRAINTS' AS section,
  con.conname AS constraint_name,
  con.contype AS constraint_type,
  con.convalidated AS is_validated,
  pg_catalog.pg_get_constraintdef(con.oid, true) AS definition
FROM pg_catalog.pg_constraint AS con
WHERE con.conrelid = 'public.board_roles'::regclass
ORDER BY con.contype, con.conname;

-- BRWPF.04_INDEXES
SELECT
  'BRWPF.04_INDEXES' AS section,
  i.indexname AS index_name,
  i.indexdef AS index_definition
FROM pg_catalog.pg_indexes AS i
WHERE i.schemaname = 'public'
  AND i.tablename = 'board_roles'
ORDER BY i.indexname;

-- BRWPF.05_ORGANIZATION_WIDE_ROLES
-- Role master data contains no personal data; complete rows are intentional here.
SELECT
  'BRWPF.05_ORGANIZATION_WIDE_ROLES' AS section,
  br.*
FROM public.board_roles AS br
WHERE br.department_id IS NULL
ORDER BY br.sort_order NULLS LAST, br.slug, br.id;

-- BRWPF.06_DEPARTMENT_ROLES
SELECT
  'BRWPF.06_DEPARTMENT_ROLES' AS section,
  br.*,
  d.slug AS department_slug,
  d.name_de AS department_name_de,
  d.is_active AS department_is_active
FROM public.board_roles AS br
LEFT JOIN public.departments AS d ON d.id = br.department_id
WHERE br.department_id IS NOT NULL
ORDER BY d.slug, br.sort_order NULLS LAST, br.slug, br.id;

-- BRWPF.07_WEBMASTER_BOARD_ROLE_COLLISIONS
SELECT
  'BRWPF.07_WEBMASTER_BOARD_ROLE_COLLISIONS' AS section,
  br.*,
  d.slug AS department_slug
FROM public.board_roles AS br
LEFT JOIN public.departments AS d ON d.id = br.department_id
WHERE lower(coalesce(br.slug, '')) LIKE '%webmaster%'
   OR lower(coalesce(br.name_de, '')) LIKE '%webmaster%'
   OR lower(coalesce(br.name_en, '')) LIKE '%webmaster%'
ORDER BY br.sort_order NULLS LAST, br.slug, br.id;

-- BRWPF.08_SEPARATE_TECHNICAL_ADMIN_ROLE
-- This confirms separation only; it does not use the technical role as board master data.
SELECT
  'BRWPF.08_SEPARATE_TECHNICAL_ADMIN_ROLE' AS section,
  ar.id,
  ar.key,
  ar.name,
  ar.description,
  ar.sort_order,
  ar.is_active
FROM public.admin_roles AS ar
WHERE lower(ar.key) = 'webmaster'
   OR lower(ar.name) = 'webmaster'
ORDER BY ar.key, ar.id;

-- BRWPF.09_FOREIGN_KEYS
SELECT
  'BRWPF.09_FOREIGN_KEYS' AS section,
  con.conname AS constraint_name,
  con.conrelid::regclass::text AS source_relation,
  con.confrelid::regclass::text AS referenced_relation,
  pg_catalog.pg_get_constraintdef(con.oid, true) AS definition,
  con.confupdtype AS update_action_code,
  con.confdeltype AS delete_action_code
FROM pg_catalog.pg_constraint AS con
WHERE con.contype = 'f'
  AND (
    con.conrelid = 'public.board_roles'::regclass
    OR con.confrelid = 'public.board_roles'::regclass
  )
ORDER BY source_relation, constraint_name;

-- BRWPF.10_DEPENDENT_VIEWS
SELECT DISTINCT
  'BRWPF.10_DEPENDENT_VIEWS' AS section,
  view_ns.nspname AS view_schema,
  view_class.relname AS view_name,
  view_class.relkind AS view_kind,
  pg_catalog.pg_get_viewdef(view_class.oid, true) AS view_definition
FROM pg_catalog.pg_depend AS dep
JOIN pg_catalog.pg_rewrite AS rewrite_rule ON rewrite_rule.oid = dep.objid
JOIN pg_catalog.pg_class AS view_class ON view_class.oid = rewrite_rule.ev_class
JOIN pg_catalog.pg_namespace AS view_ns ON view_ns.oid = view_class.relnamespace
WHERE dep.refobjid = 'public.board_roles'::regclass
  AND view_class.relkind IN ('v', 'm')
ORDER BY view_schema, view_name;

-- BRWPF.11_RELEVANT_ROUTINES
-- Materialization prevents routine deparsing from being applied to unsupported pg_proc rows.
WITH eligible_routines AS MATERIALIZED (
  SELECT
    p.oid,
    n.nspname AS routine_schema,
    p.proname AS routine_name,
    p.proowner,
    p.prosecdef,
    p.proconfig,
    pg_catalog.pg_get_function_identity_arguments(p.oid) AS identity_arguments
  FROM pg_catalog.pg_proc AS p
  JOIN pg_catalog.pg_namespace AS n ON n.oid = p.pronamespace
  WHERE p.prokind IN ('f', 'p')
), routine_definitions AS MATERIALIZED (
  SELECT
    er.*,
    pg_catalog.pg_get_functiondef(er.oid) AS routine_definition
  FROM eligible_routines AS er
)
SELECT
  'BRWPF.11_RELEVANT_ROUTINES' AS section,
  rd.oid::regprocedure::text AS exact_signature,
  rd.routine_schema,
  rd.routine_name,
  rd.identity_arguments,
  pg_catalog.pg_get_userbyid(rd.proowner) AS owner_name,
  rd.prosecdef AS security_definer,
  rd.proconfig,
  rd.routine_definition
FROM routine_definitions AS rd
WHERE rd.routine_definition ~* '\mboard_roles\M'
ORDER BY rd.oid::regprocedure::text;

-- BRWPF.12_TRIGGERS
SELECT
  'BRWPF.12_TRIGGERS' AS section,
  t.tgname AS trigger_name,
  t.tgenabled AS enabled_state,
  t.tgisinternal AS is_internal,
  t.tgfoid::regprocedure::text AS function_signature,
  pg_catalog.pg_get_triggerdef(t.oid, true) AS trigger_definition
FROM pg_catalog.pg_trigger AS t
WHERE t.tgrelid = 'public.board_roles'::regclass
ORDER BY t.tgisinternal, t.tgname;

-- BRWPF.13_POLICIES
SELECT
  'BRWPF.13_POLICIES' AS section,
  p.policyname,
  p.permissive,
  p.roles,
  p.cmd,
  p.qual AS using_expression,
  p.with_check AS with_check_expression
FROM pg_catalog.pg_policies AS p
WHERE p.schemaname = 'public'
  AND p.tablename = 'board_roles'
ORDER BY p.cmd, p.policyname;

-- BRWPF.14_TABLE_GRANTS
SELECT
  'BRWPF.14_TABLE_GRANTS' AS section,
  g.grantee,
  g.privilege_type,
  g.is_grantable
FROM information_schema.role_table_grants AS g
WHERE g.table_schema = 'public'
  AND g.table_name = 'board_roles'
ORDER BY g.grantee, g.privilege_type;

-- BRWPF.15_COLUMN_GRANTS
SELECT
  'BRWPF.15_COLUMN_GRANTS' AS section,
  g.grantee,
  g.column_name,
  g.privilege_type,
  g.is_grantable
FROM information_schema.role_column_grants AS g
WHERE g.table_schema = 'public'
  AND g.table_name = 'board_roles'
ORDER BY g.grantee, g.column_name, g.privilege_type;

-- BRWPF.16_EFFECTIVE_TABLE_PRIVILEGES
WITH checked_roles(role_name) AS MATERIALIZED (
  VALUES ('anon'::text), ('authenticated'), ('service_role')
), checked_privileges(privilege_name) AS MATERIALIZED (
  VALUES ('SELECT'::text), ('INSERT'), ('UPDATE'), ('DELETE'),
         ('TRUNCATE'), ('REFERENCES'), ('TRIGGER')
)
SELECT
  'BRWPF.16_EFFECTIVE_TABLE_PRIVILEGES' AS section,
  r.role_name,
  p.privilege_name,
  pg_catalog.has_table_privilege(
    r.role_name,
    'public.board_roles',
    p.privilege_name
  ) AS has_privilege
FROM checked_roles AS r
CROSS JOIN checked_privileges AS p
ORDER BY r.role_name, p.privilege_name;

-- BRWPF.17_SCOPE_AND_SORT_ORDER_CONTRACT
SELECT
  'BRWPF.17_SCOPE_AND_SORT_ORDER_CONTRACT' AS section,
  count(*) AS total_role_count,
  count(*) FILTER (WHERE department_id IS NULL) AS organization_wide_count,
  count(*) FILTER (WHERE department_id IS NOT NULL) AS department_role_count,
  count(*) FILTER (WHERE is_active = true) AS active_count,
  count(*) FILTER (WHERE is_active = false) AS inactive_count,
  min(sort_order) AS minimum_sort_order,
  max(sort_order) AS maximum_sort_order,
  count(*) FILTER (WHERE sort_order IS NULL) AS null_sort_order_count,
  count(DISTINCT slug) AS distinct_slug_count
FROM public.board_roles;

-- BRWPF.18_SORT_ORDER_NEIGHBORHOODS
SELECT
  'BRWPF.18_SORT_ORDER_NEIGHBORHOODS' AS section,
  br.department_id IS NULL AS is_organization_wide,
  d.slug AS department_slug,
  br.slug,
  br.name_de,
  br.name_en,
  br.sort_order,
  br.is_active
FROM public.board_roles AS br
LEFT JOIN public.departments AS d ON d.id = br.department_id
ORDER BY
  br.department_id IS NOT NULL,
  d.slug NULLS FIRST,
  br.sort_order NULLS LAST,
  br.slug,
  br.id;

-- BRWPF.19_DUPLICATE_AND_SCOPE_SUMMARY
WITH duplicate_slugs AS MATERIALIZED (
  SELECT br.slug, count(*) AS occurrence_count
  FROM public.board_roles AS br
  GROUP BY br.slug
  HAVING count(*) > 1
), webmaster_candidates AS MATERIALIZED (
  SELECT count(*) AS candidate_count
  FROM public.board_roles AS br
  WHERE lower(coalesce(br.slug, '')) LIKE '%webmaster%'
     OR lower(coalesce(br.name_de, '')) LIKE '%webmaster%'
     OR lower(coalesce(br.name_en, '')) LIKE '%webmaster%'
)
SELECT
  'BRWPF.19_DUPLICATE_AND_SCOPE_SUMMARY' AS section,
  to_regclass('public.board_roles') IS NOT NULL AS board_roles_exists,
  (SELECT count(*) FROM duplicate_slugs) AS duplicate_slug_group_count,
  (SELECT candidate_count FROM webmaster_candidates) AS webmaster_candidate_count,
  count(*) FILTER (
    WHERE br.department_id IS NULL AND br.is_active = true
  ) AS active_organization_wide_count,
  count(*) FILTER (
    WHERE br.department_id IS NOT NULL AND br.is_active = true
  ) AS active_department_role_count
FROM public.board_roles AS br;
