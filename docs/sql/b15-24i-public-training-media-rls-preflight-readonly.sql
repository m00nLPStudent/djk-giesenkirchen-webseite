-- B15.24I I.5F2 - Public Training / Media RLS privilege preflight
-- READ-ONLY. Manuell im Supabase SQL Editor ausfuehren. Keine Nutzdatenausgabe.

-- I5F2.01_RELATIONS_RLS
WITH targets(schema_name, relation_name) AS (
  VALUES
    ('public', 'department_training_times'),
    ('public', 'department_sections'),
    ('public', 'departments'),
    ('public', 'media_assets')
)
SELECT 'I5F2.01_RELATIONS_RLS' AS section,
       t.schema_name, t.relation_name,
       c.oid IS NOT NULL AS relation_exists,
       c.relkind,
       c.relrowsecurity AS rls_enabled,
       c.relforcerowsecurity AS force_rls,
       pg_catalog.pg_get_userbyid(c.relowner) AS owner
FROM targets t
LEFT JOIN pg_catalog.pg_namespace n ON n.nspname = t.schema_name
LEFT JOIN pg_catalog.pg_class c
  ON c.relnamespace = n.oid AND c.relname = t.relation_name
ORDER BY t.relation_name;

-- I5F2.02_POLICIES
SELECT 'I5F2.02_POLICIES' AS section,
       schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_catalog.pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('department_training_times', 'department_sections', 'media_assets')
ORDER BY tablename, policyname;

-- I5F2.03_TABLE_PRIVILEGES
WITH roles(role_name) AS (VALUES ('anon'), ('authenticated'), ('service_role')),
targets(relation_name) AS (
  VALUES ('department_training_times'), ('department_sections'), ('departments'), ('media_assets')
)
SELECT 'I5F2.03_TABLE_PRIVILEGES' AS section,
       r.role_name, t.relation_name,
       pg_catalog.has_table_privilege(r.role_name, 'public.' || t.relation_name, 'SELECT') AS can_select,
       pg_catalog.has_table_privilege(r.role_name, 'public.' || t.relation_name, 'INSERT') AS can_insert,
       pg_catalog.has_table_privilege(r.role_name, 'public.' || t.relation_name, 'UPDATE') AS can_update,
       pg_catalog.has_table_privilege(r.role_name, 'public.' || t.relation_name, 'DELETE') AS can_delete
FROM roles r CROSS JOIN targets t
ORDER BY r.role_name, t.relation_name;

-- I5F2.04_COLUMN_PRIVILEGES
WITH roles(role_name) AS (VALUES ('anon'), ('authenticated'), ('service_role')),
columns AS (
  SELECT table_schema, table_name, column_name, ordinal_position
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name IN ('department_training_times', 'department_sections', 'departments', 'media_assets')
)
SELECT 'I5F2.04_COLUMN_PRIVILEGES' AS section,
       r.role_name, c.table_name, c.column_name,
       pg_catalog.has_column_privilege(
         r.role_name,
         c.table_schema || '.' || c.table_name,
         c.column_name,
         'SELECT'
       ) AS can_select
FROM roles r CROSS JOIN columns c
ORDER BY r.role_name, c.table_name, c.ordinal_position;

-- I5F2.05_MEDIA_POLICY_DEPENDENCY
SELECT 'I5F2.05_MEDIA_POLICY_DEPENDENCY' AS section,
       tablename, policyname,
       qual ILIKE '%media_assets%' AS reads_media_assets,
       qual ILIKE '%image_media_asset_id%' AS reads_image_reference,
       qual ILIKE '%media_kind%' AS checks_media_kind,
       qual ILIKE '%visibility%' AS checks_visibility,
       qual ILIKE '%is_archived%' AS checks_archived,
       qual
FROM pg_catalog.pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('department_sections', 'department_training_times')
ORDER BY tablename, policyname;

-- I5F2.06_PUBLIC_FUNCTIONS
WITH eligible AS MATERIALIZED (
  SELECT p.oid, p.prosecdef, p.proconfig, p.proowner
  FROM pg_catalog.pg_proc p
  JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.prokind IN ('f', 'p')
), definitions AS MATERIALIZED (
  SELECT e.*, pg_catalog.pg_get_functiondef(e.oid) AS definition
  FROM eligible e
)
SELECT 'I5F2.06_PUBLIC_FUNCTIONS' AS section,
       d.oid::regprocedure::text AS exact_signature,
       d.prosecdef AS security_definer,
       d.proconfig,
       pg_catalog.pg_get_userbyid(d.proowner) AS owner,
       d.definition
FROM definitions d
WHERE d.oid = to_regprocedure('public.get_public_department_section(text)')
   OR d.definition ILIKE '%department_sections%'
   OR d.definition ILIKE '%department_training_times%'
   OR d.definition ILIKE '%media_assets%'
ORDER BY d.oid::regprocedure::text;

-- I5F2.07_FUNCTION_PRIVILEGES
WITH eligible AS MATERIALIZED (
  SELECT p.oid, p.proacl, p.proowner
  FROM pg_catalog.pg_proc p
  JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.prokind IN ('f', 'p')
), definitions AS MATERIALIZED (
  SELECT e.*, pg_catalog.pg_get_functiondef(e.oid) AS definition
  FROM eligible e
), relevant AS MATERIALIZED (
  SELECT * FROM definitions
  WHERE oid = to_regprocedure('public.get_public_department_section(text)')
     OR definition ILIKE '%department_sections%'
     OR definition ILIKE '%department_training_times%'
     OR definition ILIKE '%media_assets%'
)
SELECT 'I5F2.07_FUNCTION_PRIVILEGES' AS section,
       r.oid::regprocedure::text AS exact_signature,
       EXISTS (
         SELECT 1
         FROM pg_catalog.aclexplode(COALESCE(r.proacl, pg_catalog.acldefault('f', r.proowner))) acl
         WHERE acl.grantee = 0 AND acl.privilege_type = 'EXECUTE'
       ) AS public_execute,
       pg_catalog.has_function_privilege('anon', r.oid, 'EXECUTE') AS anon_execute,
       pg_catalog.has_function_privilege('authenticated', r.oid, 'EXECUTE') AS authenticated_execute,
       pg_catalog.has_function_privilege('service_role', r.oid, 'EXECUTE') AS service_role_execute
FROM relevant r
ORDER BY r.oid::regprocedure::text;

-- I5F2.08_SECTION_MEDIA_STATES
SELECT 'I5F2.08_SECTION_MEDIA_STATES' AS section,
       count(*) FILTER (WHERE d.slug = 'behindertensport') AS behindertensport_sections,
       count(*) FILTER (
         WHERE d.slug = 'behindertensport' AND d.is_active AND s.is_active AND s.is_published
       ) AS public_candidate_sections,
       count(*) FILTER (
         WHERE d.slug = 'behindertensport' AND d.is_active AND s.is_active AND s.is_published
           AND s.image_media_asset_id IS NULL
       ) AS public_candidates_without_image,
       count(*) FILTER (
         WHERE d.slug = 'behindertensport' AND d.is_active AND s.is_active AND s.is_published
           AND s.image_media_asset_id IS NOT NULL
       ) AS public_candidates_with_image
FROM public.department_sections s
JOIN public.departments d ON d.id = s.department_id;

-- I5F2.09_TRAINING_PUBLIC_STATES
SELECT 'I5F2.09_TRAINING_PUBLIC_STATES' AS section,
       count(*) FILTER (WHERE d.slug = 'behindertensport') AS total_training_rows,
       count(*) FILTER (
         WHERE d.slug = 'behindertensport' AND d.is_active AND s.is_active AND s.is_published
           AND t.is_active
           AND (t.effective_from IS NULL OR t.effective_from <= CURRENT_DATE)
           AND (t.effective_until IS NULL OR t.effective_until >= CURRENT_DATE)
       ) AS expected_public_training_rows,
       count(DISTINCT t.department_id) FILTER (
         WHERE d.slug = 'behindertensport' AND t.department_id = s.department_id
       ) AS correlated_department_count
FROM public.department_training_times t
JOIN public.departments d ON d.id = t.department_id
LEFT JOIN public.department_sections s ON s.department_id = t.department_id;

-- I5F2.10_FINAL_DIAGNOSTIC
WITH section_policy AS MATERIALIZED (
  SELECT qual
  FROM pg_catalog.pg_policies
  WHERE schemaname = 'public' AND tablename = 'department_sections'
    AND policyname = 'department_sections_public_read'
), training_policy AS MATERIALIZED (
  SELECT qual
  FROM pg_catalog.pg_policies
  WHERE schemaname = 'public' AND tablename = 'department_training_times'
    AND policyname = 'department_training_times_public_read'
)
SELECT 'I5F2.10_FINAL_DIAGNOSTIC' AS section,
       (SELECT count(*) = 1
          AND bool_and(qual ILIKE '%d.id = department_training_times.department_id%')
          AND bool_and(qual ILIKE '%s.department_id = department_training_times.department_id%')
        FROM training_policy) AS training_policy_correlated,
       (SELECT count(*) = 1 AND bool_and(qual ILIKE '%media_assets%') FROM section_policy)
         AS section_policy_reads_media_assets,
       pg_catalog.has_table_privilege('anon', 'public.media_assets', 'SELECT')
         AS anon_has_media_assets_select,
       pg_catalog.has_table_privilege('authenticated', 'public.media_assets', 'SELECT')
         AS authenticated_has_media_assets_select,
       (SELECT count(*) = 1 AND bool_and(qual ILIKE '%media_assets%') FROM section_policy)
         AS public_section_requires_media_table_access,
       (SELECT count(*) = 1 AND bool_and(qual ILIKE '%department_sections%') FROM training_policy)
         AND (SELECT count(*) = 1 AND bool_and(qual ILIKE '%media_assets%') FROM section_policy)
         AS public_training_transitively_requires_media_table_access,
       false AS raw_media_grant_recommended,
       to_regclass('public.department_sections') IS NOT NULL AS section_policy_decoupling_possible,
       to_regclass('public.department_training_times') IS NOT NULL AS public_training_rpc_possible,
       (SELECT count(*) = 1 AND bool_and(qual ILIKE '%media_assets%') FROM section_policy)
         AND NOT pg_catalog.has_table_privilege('anon', 'public.media_assets', 'SELECT')
         AS db_correction_required;
