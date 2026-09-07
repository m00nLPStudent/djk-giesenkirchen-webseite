-- B15.24I I.3C security correction postcheck
-- READ-ONLY: ausschliesslich SELECT/WITH.

-- I3C.01_TRAINING_POLICY
SELECT 'I3C.01_TRAINING_POLICY' AS section, policyname, roles, cmd, qual,
       qual ILIKE '%department_training_times.department_id%' AS outer_row_correlated,
       qual ILIKE '%d.id = department_training_times.department_id%'
         AS department_correlation_visible,
       qual ILIKE '%s.department_id = department_training_times.department_id%'
         AS section_correlation_visible
FROM pg_catalog.pg_policies
WHERE schemaname = 'public'
  AND tablename = 'department_training_times'
  AND policyname = 'department_training_times_public_read';

-- I3C.02_CROSS_DEPARTMENT_FAIL_CLOSED_CONTRACT
WITH policy AS MATERIALIZED (
  SELECT qual FROM pg_catalog.pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'department_training_times'
    AND policyname = 'department_training_times_public_read'
)
SELECT 'I3C.02_CROSS_DEPARTMENT_FAIL_CLOSED_CONTRACT' AS section,
       count(*) = 1 AS exactly_one_policy,
       bool_and(qual ILIKE '%d.id = department_training_times.department_id%')
         AS training_department_required,
       bool_and(qual ILIKE '%s.department_id = department_training_times.department_id%')
         AS section_department_required
FROM policy;

-- I3C.03_RAW_CONTACT_COLUMN_PRIVILEGES
WITH roles(role_name) AS MATERIALIZED (
  VALUES ('anon'), ('authenticated'), ('service_role')
), columns(column_name) AS MATERIALIZED (
  VALUES ('contact_name'), ('contact_email'), ('contact_phone')
)
SELECT 'I3C.03_RAW_CONTACT_COLUMN_PRIVILEGES' AS section,
       r.role_name, c.column_name,
       pg_catalog.has_column_privilege(
         r.role_name, 'public.department_sections', c.column_name, 'SELECT'
       ) AS effective_select
FROM roles r CROSS JOIN columns c
ORDER BY r.role_name, c.column_name;

-- I3C.04_PUBLIC_READ_FUNCTION
WITH eligible AS MATERIALIZED (
  SELECT p.oid, p.prosecdef, p.proconfig, p.proowner
  FROM pg_catalog.pg_proc p
  JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.prokind IN ('f', 'p')
    AND p.oid = to_regprocedure('public.get_public_department_section(text)')
)
SELECT 'I3C.04_PUBLIC_READ_FUNCTION' AS section,
       e.oid::regprocedure::text AS exact_signature,
       e.prosecdef AS security_definer, e.proconfig,
       pg_catalog.pg_get_userbyid(e.proowner) AS owner,
       pg_catalog.pg_get_functiondef(e.oid) AS definition,
       pg_catalog.has_function_privilege('anon', e.oid, 'EXECUTE') AS anon_execute,
       pg_catalog.has_function_privilege('authenticated', e.oid, 'EXECUTE') AS authenticated_execute,
       pg_catalog.has_function_privilege('service_role', e.oid, 'EXECUTE') AS service_role_execute
FROM eligible e;

-- I3C.05_CONTACT_MASK_CONTRACT
WITH eligible AS MATERIALIZED (
  SELECT p.oid
  FROM pg_catalog.pg_proc p
  WHERE p.prokind IN ('f', 'p')
    AND p.oid = to_regprocedure('public.get_public_department_section(text)')
), definition AS MATERIALIZED (
  SELECT pg_catalog.pg_get_functiondef(oid) AS body FROM eligible
)
SELECT 'I3C.05_CONTACT_MASK_CONTRACT' AS section,
       count(*) = 1 AS function_exists,
       bool_and(body ILIKE '%CASE WHEN s.contact_is_public IS TRUE THEN s.contact_name ELSE NULL END%')
         AS name_masked,
       bool_and(body ILIKE '%CASE WHEN s.contact_is_public IS TRUE THEN s.contact_email ELSE NULL END%')
         AS email_masked,
       bool_and(body ILIKE '%CASE WHEN s.contact_is_public IS TRUE THEN s.contact_phone ELSE NULL END%')
         AS phone_masked,
       bool_and(body ILIKE '%s.is_active IS TRUE%') AS active_required,
       bool_and(body ILIKE '%s.is_published IS TRUE%') AS published_required,
       bool_and(body ILIKE '%d.is_active IS TRUE%') AS active_department_required
FROM definition;

-- I3C.06_RLS_AND_WRITE_PRIVILEGES
WITH tables(table_name) AS MATERIALIZED (
  VALUES ('department_sections'), ('department_training_times')
), roles(role_name) AS MATERIALIZED (
  VALUES ('anon'), ('authenticated'), ('service_role')
)
SELECT 'I3C.06_RLS_AND_WRITE_PRIVILEGES' AS section,
       t.table_name, r.role_name, c.relrowsecurity AS rls_enabled,
       pg_catalog.has_table_privilege(r.role_name, format('public.%I', t.table_name), 'INSERT') AS can_insert,
       pg_catalog.has_table_privilege(r.role_name, format('public.%I', t.table_name), 'UPDATE') AS can_update,
       pg_catalog.has_table_privilege(r.role_name, format('public.%I', t.table_name), 'DELETE') AS can_delete
FROM tables t
JOIN pg_catalog.pg_namespace n ON n.nspname = 'public'
JOIN pg_catalog.pg_class c ON c.relnamespace = n.oid AND c.relname = t.table_name
CROSS JOIN roles r
ORDER BY t.table_name, r.role_name;

-- I3C.07_ROLE_PERMISSION_MATRIX_UNCHANGED
WITH roles(role_key) AS MATERIALIZED (
  VALUES ('superadmin'), ('vorstand'), ('fussball-vorstand'),
         ('tischtennis-vorstand'), ('trainer'), ('betreuer'),
         ('kassierer'), ('webmaster')
), permissions(permission_key) AS MATERIALIZED (
  VALUES ('department_sections.view'), ('department_sections.edit')
)
SELECT 'I3C.07_ROLE_PERMISSION_MATRIX_UNCHANGED' AS section,
       expected.role_key, expected.permission_key,
       EXISTS (
         SELECT 1 FROM public.admin_role_permissions rp
         JOIN public.admin_roles r ON r.id = rp.role_id
         JOIN public.admin_permissions p ON p.id = rp.permission_id
         WHERE r.key = expected.role_key AND p.key = expected.permission_key
       ) AS assigned
FROM (
  SELECT roles.role_key, permissions.permission_key
  FROM roles CROSS JOIN permissions
) expected
ORDER BY expected.role_key, expected.permission_key;

-- I3C.08_BASE_CONTRACT_UNCHANGED
SELECT 'I3C.08_BASE_CONTRACT_UNCHANGED' AS section,
       (SELECT count(*) FROM public.department_sections) AS section_count,
       (SELECT count(*) FROM public.department_training_times) AS training_count,
       EXISTS (
         SELECT 1 FROM pg_catalog.pg_constraint
         WHERE conrelid = 'public.media_asset_usages'::regclass
           AND conname = 'media_asset_usages_entity_type_check'
           AND pg_catalog.pg_get_constraintdef(oid) ILIKE '%department_section%'
       ) AS media_usage_contract_intact,
       pg_catalog.pg_get_functiondef(
         'public.synchronize_media_assignment(text,uuid,uuid,text)'::regprocedure
       ) ILIKE '%department_section%' AS media_rpc_intact;

-- I3C.09_FINAL_SECURITY_CONTRACT
SELECT 'I3C.09_FINAL_SECURITY_CONTRACT' AS section,
       (SELECT count(*) = 1 FROM pg_catalog.pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'department_training_times'
          AND policyname = 'department_training_times_public_read'
          AND qual ILIKE '%d.id = department_training_times.department_id%'
          AND qual ILIKE '%s.department_id = department_training_times.department_id%')
         AS training_policy_correlated,
       NOT pg_catalog.has_column_privilege('anon', 'public.department_sections', 'contact_name', 'SELECT')
       AND NOT pg_catalog.has_column_privilege('anon', 'public.department_sections', 'contact_email', 'SELECT')
       AND NOT pg_catalog.has_column_privilege('anon', 'public.department_sections', 'contact_phone', 'SELECT')
         AS anon_raw_contact_denied,
       NOT pg_catalog.has_column_privilege('authenticated', 'public.department_sections', 'contact_name', 'SELECT')
       AND NOT pg_catalog.has_column_privilege('authenticated', 'public.department_sections', 'contact_email', 'SELECT')
       AND NOT pg_catalog.has_column_privilege('authenticated', 'public.department_sections', 'contact_phone', 'SELECT')
         AS authenticated_raw_contact_denied,
       pg_catalog.has_function_privilege('anon', 'public.get_public_department_section(text)', 'EXECUTE')
       AND pg_catalog.has_function_privilege('authenticated', 'public.get_public_department_section(text)', 'EXECUTE')
         AS public_read_available,
       (SELECT relrowsecurity FROM pg_catalog.pg_class
        WHERE oid = 'public.department_sections'::regclass)
       AND (SELECT relrowsecurity FROM pg_catalog.pg_class
            WHERE oid = 'public.department_training_times'::regclass)
         AS rls_intact;
