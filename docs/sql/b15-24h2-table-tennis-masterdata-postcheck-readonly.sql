-- B15.24H2: READ-ONLY postcheck for the master-data migration.
-- Run manually after the proposal. This file contains SELECT statements only.

-- H2M.01_COLUMNS
SELECT 'H2M.01_COLUMNS' AS section, c.table_name, c.column_name, c.data_type,
       c.is_nullable, c.column_default
FROM information_schema.columns AS c
WHERE c.table_schema = 'public'
  AND c.table_name IN ('team_templates', 'board_roles')
  AND c.column_name = 'department_id'
ORDER BY c.table_name;

-- H2M.02_FOREIGN_KEYS
SELECT 'H2M.02_FOREIGN_KEYS' AS section,
       c.conrelid::regclass::text AS relation_name,
       c.conname AS constraint_name,
       pg_get_constraintdef(c.oid, true) AS constraint_definition,
       c.convalidated AS is_validated
FROM pg_catalog.pg_constraint AS c
WHERE c.contype = 'f'
  AND c.conrelid IN ('public.team_templates'::regclass, 'public.board_roles'::regclass)
ORDER BY relation_name, c.conname;

-- H2M.03_INDEXES
SELECT 'H2M.03_INDEXES' AS section, i.tablename, i.indexname, i.indexdef
FROM pg_catalog.pg_indexes AS i
WHERE i.schemaname = 'public'
  AND i.tablename IN ('team_templates', 'board_roles')
  AND i.indexdef LIKE '%department_id%'
ORDER BY i.tablename, i.indexname;

-- H2M.04_TEAM_TEMPLATE_BACKFILL
SELECT 'H2M.04_TEAM_TEMPLATE_BACKFILL' AS section,
       count(*) AS total_count,
       count(*) FILTER (WHERE tt.department_id IS NULL) AS null_department_count,
       count(*) FILTER (WHERE d.slug = 'fussball') AS football_count,
       count(*) FILTER (WHERE d.slug = 'tischtennis') AS table_tennis_count,
       count(*) FILTER (WHERE d.id IS NULL) AS broken_department_reference_count
FROM public.team_templates AS tt
LEFT JOIN public.departments AS d ON d.id = tt.department_id;

-- H2M.05_SHARED_BOARD_ROLES
SELECT 'H2M.05_SHARED_BOARD_ROLES' AS section, br.slug, br.name_de,
       br.department_id IS NULL AS is_organization_wide
FROM public.board_roles AS br
WHERE br.slug IN (
  'erster-vorsitzender', 'zweiter-vorsitzender', 'erster-geschaeftsfuehrer',
  'zweiter-geschaeftsfuehrer', 'kassenwart', 'stellvertretender-kassenwart'
)
ORDER BY br.sort_order, br.slug;

-- H2M.06_FOOTBALL_BOARD_ROLES
SELECT 'H2M.06_FOOTBALL_BOARD_ROLES' AS section, br.slug, br.name_de,
       d.slug AS department_slug, d.is_active AS department_is_active
FROM public.board_roles AS br
LEFT JOIN public.departments AS d ON d.id = br.department_id
WHERE br.slug IN (
  'abteilungsleiter-fussball', 'jugendleiter', 'jugendkoordinator',
  'sportlicher-leiter', 'stellvertretender-abteilungsleiter', 'materialwart',
  'schiedsrichterobmann'
)
ORDER BY br.sort_order, br.slug;

-- H2M.07_PLATZWART_AND_RENAME
SELECT 'H2M.07_PLATZWART_AND_RENAME' AS section, br.slug, br.name_de,
       br.department_id IS NULL AS department_is_null
FROM public.board_roles AS br
WHERE br.slug IN ('platzwart', 'erster-geschaeftsfuehrer')
ORDER BY br.slug;

-- H2M.08_ROLE_DUPLICATES_AND_COUNTS
SELECT 'H2M.08_ROLE_DUPLICATES_AND_COUNTS' AS section,
       (SELECT count(*) FROM public.board_roles) AS total_role_count,
       (SELECT count(*) FROM public.board_roles GROUP BY slug HAVING count(*) > 1 LIMIT 1) IS NULL AS no_duplicate_slugs,
       (SELECT count(*) FROM public.board_roles WHERE slug IN (
         'erster-vorsitzender', 'zweiter-vorsitzender', 'erster-geschaeftsfuehrer',
         'zweiter-geschaeftsfuehrer', 'kassenwart', 'stellvertretender-kassenwart'
       )) AS shared_role_count,
       (SELECT count(*) FROM public.board_roles WHERE slug IN (
         'abteilungsleiter-fussball', 'jugendleiter', 'jugendkoordinator',
         'sportlicher-leiter', 'stellvertretender-abteilungsleiter', 'materialwart',
         'schiedsrichterobmann'
       )) AS football_role_count;

-- H2M.09_BOARD_MEMBER_RELATION_INTEGRITY
-- Aggregate-only: no member names, contacts or IDs are returned.
-- The proposal additionally compares a transaction-local before/after fingerprint
-- and aborts if any board_members row changes while it runs.
SELECT 'H2M.09_BOARD_MEMBER_RELATION_INTEGRITY' AS section,
       count(*) AS total_member_count,
       count(*) FILTER (WHERE bm.role_id IS NOT NULL AND br.id IS NULL) AS broken_role_reference_count,
       count(*) FILTER (WHERE bm.department_id IS NOT NULL AND d.id IS NULL) AS broken_department_reference_count,
       count(*) FILTER (
         WHERE br.department_id IS NOT NULL
           AND bm.department_id IS DISTINCT FROM br.department_id
       ) AS incompatible_role_department_count
FROM public.board_members AS bm
LEFT JOIN public.board_roles AS br ON br.id = bm.role_id
LEFT JOIN public.departments AS d ON d.id = bm.department_id;

-- H2M.10_RLS_AND_POLICIES
SELECT 'H2M.10_RLS' AS section, n.nspname AS schema_name, c.relname AS table_name,
       c.relrowsecurity AS rls_enabled, c.relforcerowsecurity AS force_rls,
       pg_get_userbyid(c.relowner) AS owner
FROM pg_catalog.pg_class AS c
JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('team_templates', 'board_roles')
ORDER BY c.relname;

SELECT 'H2M.10A_POLICIES' AS section, p.tablename, p.policyname, p.roles,
       p.cmd, p.qual AS using_expression, p.with_check AS with_check_expression
FROM pg_catalog.pg_policies AS p
WHERE p.schemaname = 'public'
  AND p.tablename IN ('team_templates', 'board_roles')
ORDER BY p.tablename, p.cmd, p.policyname;

-- H2M.11_GRANTS
SELECT 'H2M.11_GRANTS' AS section, g.table_name, g.grantee,
       g.privilege_type, g.is_grantable
FROM information_schema.role_table_grants AS g
WHERE g.table_schema = 'public'
  AND g.table_name IN ('team_templates', 'board_roles')
  AND g.grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY g.table_name, g.grantee, g.privilege_type;

-- H2M.12_FINAL_ASSERTIONS
WITH football_department AS MATERIALIZED (
  SELECT id FROM public.departments WHERE slug = 'fussball' AND is_active = true
), policy_counts AS MATERIALIZED (
  SELECT p.tablename, count(*) AS policy_count
  FROM pg_catalog.pg_policies AS p
  WHERE p.schemaname = 'public' AND p.tablename IN ('team_templates', 'board_roles')
  GROUP BY p.tablename
)
SELECT
  'H2M.12_FINAL_ASSERTIONS' AS section,
  (SELECT count(*) FROM public.team_templates) = 14 AS template_count_ok,
  NOT EXISTS (SELECT 1 FROM public.team_templates WHERE department_id IS NULL) AS template_not_null_ok,
  (SELECT count(*) FROM public.team_templates tt JOIN football_department fd ON fd.id = tt.department_id) = 14 AS template_football_backfill_ok,
  (SELECT count(*) FROM public.board_roles) = 19 AS board_role_count_ok,
  (SELECT count(*) FROM public.board_roles WHERE slug IN (
    'erster-vorsitzender', 'zweiter-vorsitzender', 'erster-geschaeftsfuehrer',
    'zweiter-geschaeftsfuehrer', 'kassenwart', 'stellvertretender-kassenwart'
  ) AND department_id IS NULL) = 6 AS shared_roles_null_ok,
  (SELECT count(*) FROM public.board_roles br JOIN football_department fd ON fd.id = br.department_id
   WHERE br.slug IN ('abteilungsleiter-fussball', 'jugendleiter', 'jugendkoordinator',
     'sportlicher-leiter', 'stellvertretender-abteilungsleiter', 'materialwart', 'schiedsrichterobmann')) = 7 AS football_roles_ok,
  EXISTS (SELECT 1 FROM public.board_roles WHERE slug = 'platzwart' AND department_id IS NULL) AS platzwart_null_ok,
  EXISTS (SELECT 1 FROM public.board_roles WHERE slug = 'erster-geschaeftsfuehrer' AND name_de = 'Geschäftsführer') AS rename_ok,
  NOT EXISTS (SELECT 1 FROM public.board_roles WHERE slug NOT IN (
    'abteilungsleiter-fussball', 'jugendleiter', 'jugendkoordinator',
    'sportlicher-leiter', 'stellvertretender-abteilungsleiter', 'materialwart', 'schiedsrichterobmann'
  ) AND department_id IS NOT NULL) AS all_other_roles_null_ok,
  NOT EXISTS (SELECT 1 FROM public.board_roles GROUP BY slug HAVING count(*) > 1) AS no_role_duplicates,
  (SELECT policy_count FROM policy_counts WHERE tablename = 'team_templates') = 4 AS team_template_policy_count_unchanged,
  (SELECT policy_count FROM policy_counts WHERE tablename = 'board_roles') = 1 AS board_role_policy_count_unchanged;
