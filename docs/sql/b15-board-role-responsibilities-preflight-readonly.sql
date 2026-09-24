-- B15 / Version 1.0.6 preparation
-- Board role responsibilities: live schema and security preflight.
-- READ-ONLY ONLY. Run manually in the Supabase SQL Editor and export every result block.
-- No person names, contact details, user ids or board member ids are selected.

-- BRRPF.01_RELEVANT_RELATIONS
SELECT
  n.nspname AS schema_name,
  c.relname AS relation_name,
  c.relkind AS relation_kind,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS force_rls_enabled,
  pg_get_userbyid(c.relowner) AS owner_name
FROM pg_catalog.pg_class AS c
JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND (
    c.relname IN ('board_members', 'board_roles', 'departments')
    OR c.relname ~* '(board.*responsib|responsib.*board|board.*task|task.*board)'
  )
ORDER BY c.relname;

-- BRRPF.02_RELEVANT_COLUMNS
SELECT
  c.table_schema,
  c.table_name,
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
  AND (
    c.table_name IN ('board_members', 'board_roles', 'departments')
    OR c.table_name ~* '(board.*responsib|responsib.*board|board.*task|task.*board)'
  )
ORDER BY c.table_name, c.ordinal_position;

-- BRRPF.03_EXISTING_RESPONSIBILITY_CANDIDATES
SELECT
  c.table_schema,
  c.table_name,
  c.ordinal_position,
  c.column_name,
  c.data_type,
  c.udt_name,
  c.is_nullable,
  c.column_default
FROM information_schema.columns AS c
WHERE c.table_schema = 'public'
  AND (
    c.table_name ~* '(board|role|position|function)'
    OR c.column_name ~* '(responsib|zust.nd|aufgabe|task|duty|description|note|metadata)'
  )
  AND c.column_name ~* '(responsib|zust.nd|aufgabe|task|duty|description|note|metadata)'
ORDER BY c.table_name, c.ordinal_position;

-- BRRPF.04_CONSTRAINTS_AND_FOREIGN_KEYS
SELECT
  n.nspname AS schema_name,
  tbl.relname AS table_name,
  con.conname AS constraint_name,
  con.contype AS constraint_type,
  pg_get_constraintdef(con.oid, true) AS definition,
  ref_ns.nspname AS referenced_schema,
  ref_tbl.relname AS referenced_table,
  con.convalidated AS is_validated
FROM pg_catalog.pg_constraint AS con
JOIN pg_catalog.pg_class AS tbl ON tbl.oid = con.conrelid
JOIN pg_catalog.pg_namespace AS n ON n.oid = tbl.relnamespace
LEFT JOIN pg_catalog.pg_class AS ref_tbl ON ref_tbl.oid = con.confrelid
LEFT JOIN pg_catalog.pg_namespace AS ref_ns ON ref_ns.oid = ref_tbl.relnamespace
WHERE n.nspname = 'public'
  AND (
    tbl.relname IN ('board_members', 'board_roles', 'departments')
    OR tbl.relname ~* '(board.*responsib|responsib.*board|board.*task|task.*board)'
  )
ORDER BY tbl.relname, con.conname;

-- BRRPF.05_INDEXES
SELECT
  schemaname AS schema_name,
  tablename AS table_name,
  indexname AS index_name,
  indexdef AS index_definition
FROM pg_catalog.pg_indexes
WHERE schemaname = 'public'
  AND (
    tablename IN ('board_members', 'board_roles', 'departments')
    OR tablename ~* '(board.*responsib|responsib.*board|board.*task|task.*board)'
  )
ORDER BY tablename, indexname;

-- BRRPF.06_RLS_POLICIES
SELECT
  schemaname AS schema_name,
  tablename AS table_name,
  policyname AS policy_name,
  permissive,
  roles,
  cmd,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_catalog.pg_policies
WHERE schemaname = 'public'
  AND (
    tablename IN ('board_members', 'board_roles', 'departments')
    OR tablename ~* '(board.*responsib|responsib.*board|board.*task|task.*board)'
  )
ORDER BY tablename, policyname;

-- BRRPF.07_TABLE_GRANTS
SELECT
  g.table_schema,
  g.table_name,
  g.grantee,
  g.privilege_type,
  g.is_grantable
FROM information_schema.role_table_grants AS g
WHERE g.table_schema = 'public'
  AND g.grantee IN ('anon', 'authenticated', 'service_role')
  AND (
    g.table_name IN ('board_members', 'board_roles', 'departments')
    OR g.table_name ~* '(board.*responsib|responsib.*board|board.*task|task.*board)'
  )
ORDER BY g.table_name, g.grantee, g.privilege_type;

-- BRRPF.08_COLUMN_GRANTS
SELECT
  g.table_schema,
  g.table_name,
  g.column_name,
  g.grantee,
  g.privilege_type,
  g.is_grantable
FROM information_schema.column_privileges AS g
WHERE g.table_schema = 'public'
  AND g.grantee IN ('anon', 'authenticated', 'service_role')
  AND (
    g.table_name IN ('board_members', 'board_roles', 'departments')
    OR g.table_name ~* '(board.*responsib|responsib.*board|board.*task|task.*board)'
  )
ORDER BY g.table_name, g.column_name, g.grantee, g.privilege_type;

-- BRRPF.09_TRIGGERS
SELECT
  n.nspname AS schema_name,
  c.relname AS table_name,
  t.tgname AS trigger_name,
  pg_get_triggerdef(t.oid, true) AS trigger_definition,
  t.tgenabled AS enabled_state
FROM pg_catalog.pg_trigger AS t
JOIN pg_catalog.pg_class AS c ON c.oid = t.tgrelid
JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND NOT t.tgisinternal
  AND (
    c.relname IN ('board_members', 'board_roles', 'departments')
    OR c.relname ~* '(board.*responsib|responsib.*board|board.*task|task.*board)'
  )
ORDER BY c.relname, t.tgname;

-- BRRPF.10_RELEVANT_FUNCTIONS
-- The MATERIALIZED prefilter excludes aggregates/window functions before
-- pg_get_functiondef is evaluated.
WITH function_candidates AS MATERIALIZED (
  SELECT
    p.oid,
    n.nspname AS schema_name,
    p.proname AS function_name,
    p.prosecdef AS security_definer,
    p.proconfig,
    pg_get_userbyid(p.proowner) AS owner_name
  FROM pg_catalog.pg_proc AS p
  JOIN pg_catalog.pg_namespace AS n ON n.oid = p.pronamespace
  WHERE p.prokind IN ('f', 'p')
    AND n.nspname NOT IN ('pg_catalog', 'information_schema')
), function_definitions AS MATERIALIZED (
  SELECT
    f.*,
    f.oid::regprocedure::text AS function_signature,
    pg_get_functiondef(f.oid) AS function_definition
  FROM function_candidates AS f
)
SELECT
  f.schema_name,
  f.function_signature,
  f.security_definer,
  f.proconfig,
  f.owner_name,
  has_function_privilege('anon', f.oid, 'EXECUTE') AS anon_execute,
  has_function_privilege('authenticated', f.oid, 'EXECUTE') AS authenticated_execute,
  has_function_privilege('service_role', f.oid, 'EXECUTE') AS service_role_execute,
  f.function_definition
FROM function_definitions AS f
WHERE f.function_definition ~* '(board_members|board_roles|board.*responsib|responsib.*board)'
ORDER BY f.function_signature;

-- BRRPF.11_ROLE_SCOPE_CONTRACT
-- Role names/slugs and department slugs are structural metadata, not person data.
SELECT
  COALESCE(d.slug, 'shared_or_club') AS role_department_scope,
  br.slug AS role_slug,
  br.name_de AS role_name,
  br.is_active,
  br.sort_order
FROM public.board_roles AS br
LEFT JOIN public.departments AS d ON d.id = br.department_id
ORDER BY role_department_scope, br.sort_order NULLS LAST, br.slug;

-- BRRPF.12_ASSIGNMENT_COUNTS_BY_SCOPE_AND_ROLE
-- Aggregates only; no board member ids or personal fields are returned.
SELECT
  bm.organization_scope,
  COALESCE(d.slug, 'no_department') AS member_department_scope,
  COALESCE(br.slug, 'no_role') AS role_slug,
  COUNT(*) AS assignment_count,
  COUNT(*) FILTER (WHERE bm.is_active = true) AS active_assignment_count
FROM public.board_members AS bm
LEFT JOIN public.departments AS d ON d.id = bm.department_id
LEFT JOIN public.board_roles AS br ON br.id = bm.role_id
GROUP BY bm.organization_scope, COALESCE(d.slug, 'no_department'), COALESCE(br.slug, 'no_role')
ORDER BY bm.organization_scope, member_department_scope, role_slug;

-- BRRPF.13_SHARED_ROLE_USAGE_ACROSS_ORGANIZATION_SCOPES
-- This determines whether one responsibilities field on board_roles would
-- incorrectly couple club and department-specific responsibilities.
SELECT
  br.slug AS role_slug,
  br.name_de AS role_name,
  COALESCE(role_department.slug, 'shared_or_club') AS role_department_scope,
  COUNT(*) FILTER (
    WHERE bm.organization_scope = 'club' AND bm.department_id IS NULL
  ) AS club_assignment_count,
  COUNT(*) FILTER (
    WHERE bm.organization_scope = 'department'
  ) AS department_assignment_count,
  ARRAY_AGG(DISTINCT member_department.slug ORDER BY member_department.slug)
    FILTER (WHERE member_department.slug IS NOT NULL) AS assigned_department_slugs
FROM public.board_roles AS br
LEFT JOIN public.departments AS role_department ON role_department.id = br.department_id
LEFT JOIN public.board_members AS bm ON bm.role_id = br.id
LEFT JOIN public.departments AS member_department ON member_department.id = bm.department_id
GROUP BY br.id, br.slug, br.name_de, role_department.slug
ORDER BY role_department_scope, br.sort_order NULLS LAST, br.slug;

-- BRRPF.14_PERMISSION_CONTRACT
SELECT
  p.key AS permission_key,
  p.name AS permission_name,
  p.category AS permission_category,
  COUNT(DISTINCT arp.role_id) AS assigned_role_count
FROM public.admin_permissions AS p
LEFT JOIN public.admin_role_permissions AS arp ON arp.permission_id = p.id
WHERE p.key IN ('board.view', 'board.create', 'board.edit', 'board.delete')
GROUP BY p.id, p.key, p.name, p.category
ORDER BY p.key;

-- BRRPF.15_SAFE_SUMMARY
SELECT
  to_regclass('public.board_members') IS NOT NULL AS board_members_exists,
  to_regclass('public.board_roles') IS NOT NULL AS board_roles_exists,
  to_regclass('public.departments') IS NOT NULL AS departments_exists,
  EXISTS (
    SELECT 1
    FROM information_schema.columns AS c
    WHERE c.table_schema = 'public'
      AND c.table_name IN ('board_members', 'board_roles')
      AND c.column_name ~* '(responsib|zust.nd|aufgabe|task|duty)'
  ) AS existing_responsibility_column,
  EXISTS (
    SELECT 1
    FROM pg_catalog.pg_class AS c
    JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind IN ('r', 'p', 'v', 'm')
      AND c.relname ~* '(board.*responsib|responsib.*board|board.*task|task.*board)'
  ) AS existing_responsibility_relation;
