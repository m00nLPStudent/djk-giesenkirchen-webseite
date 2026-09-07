-- B15.24I I.3 - Postcheck nach manueller Proposal-Ausfuehrung
-- READ-ONLY: ausschliesslich SELECT/WITH.

-- I3PC.01_DEPARTMENTS
SELECT 'I3PC.01_DEPARTMENTS' AS section, slug, name_de, is_active, sort_order
FROM public.departments
WHERE slug IN ('behindertensport', 'damen-gymnastik')
ORDER BY slug;

-- I3PC.02_RELATIONS_AND_RLS
WITH expected(table_name) AS MATERIALIZED (
  VALUES ('department_sections'), ('department_training_times')
)
SELECT 'I3PC.02_RELATIONS_AND_RLS' AS section, e.table_name,
       c.relname IS NOT NULL AS exists,
       c.relrowsecurity AS rls_enabled, c.relforcerowsecurity AS force_rls
FROM expected e
LEFT JOIN pg_catalog.pg_namespace n ON n.nspname = 'public'
LEFT JOIN pg_catalog.pg_class c
  ON c.relnamespace = n.oid AND c.relname = e.table_name AND c.relkind = 'r'
ORDER BY e.table_name;

-- I3PC.03_COLUMNS
SELECT 'I3PC.03_COLUMNS' AS section, table_name, ordinal_position,
       column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('department_sections', 'department_training_times')
ORDER BY table_name, ordinal_position;

-- I3PC.04_CONSTRAINTS_AND_DELETE_CONTRACTS
SELECT 'I3PC.04_CONSTRAINTS_AND_DELETE_CONTRACTS' AS section,
       rel.relname AS table_name, con.conname AS constraint_name,
       con.contype AS constraint_type,
       pg_catalog.pg_get_constraintdef(con.oid, true) AS definition,
       ref.relname AS referenced_table, con.confdeltype AS delete_action
FROM pg_catalog.pg_constraint con
JOIN pg_catalog.pg_class rel ON rel.oid = con.conrelid
JOIN pg_catalog.pg_namespace n ON n.oid = rel.relnamespace
LEFT JOIN pg_catalog.pg_class ref ON ref.oid = con.confrelid
WHERE n.nspname = 'public'
  AND rel.relname IN ('department_sections', 'department_training_times')
ORDER BY rel.relname, con.contype, con.conname;

-- I3PC.05_INDEXES
SELECT 'I3PC.05_INDEXES' AS section, tablename, indexname, indexdef
FROM pg_catalog.pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('department_sections', 'department_training_times')
ORDER BY tablename, indexname;

-- I3PC.06_POLICIES
SELECT 'I3PC.06_POLICIES' AS section, tablename, policyname,
       permissive, roles, cmd, qual, with_check
FROM pg_catalog.pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('department_sections', 'department_training_times')
ORDER BY tablename, cmd, policyname;

-- I3PC.07_EFFECTIVE_TABLE_PRIVILEGES
WITH tables(table_name) AS MATERIALIZED (
  VALUES ('department_sections'), ('department_training_times')
), roles(role_name) AS MATERIALIZED (
  VALUES ('anon'), ('authenticated'), ('service_role')
), privileges(privilege_name) AS MATERIALIZED (
  VALUES ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE'), ('TRUNCATE'),
         ('REFERENCES'), ('TRIGGER')
)
SELECT 'I3PC.07_EFFECTIVE_TABLE_PRIVILEGES' AS section,
       t.table_name, r.role_name, p.privilege_name,
       pg_catalog.has_table_privilege(
         r.role_name, format('public.%I', t.table_name), p.privilege_name
       ) AS effective_privilege
FROM tables t CROSS JOIN roles r CROSS JOIN privileges p
ORDER BY t.table_name, r.role_name, p.privilege_name;

-- I3PC.08_COLUMN_PRIVILEGES
SELECT 'I3PC.08_COLUMN_PRIVILEGES' AS section, table_name, column_name,
       grantee, privilege_type, is_grantable
FROM information_schema.column_privileges
WHERE table_schema = 'public'
  AND table_name IN ('department_sections', 'department_training_times')
  AND grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY table_name, grantee, column_name, privilege_type;

-- I3PC.09_PERMISSIONS
SELECT 'I3PC.09_PERMISSIONS' AS section, key, name, description, category
FROM public.admin_permissions
WHERE key IN ('department_sections.view', 'department_sections.edit')
ORDER BY key;

-- I3PC.10_ROLE_PERMISSION_MATRIX
WITH roles(role_key) AS MATERIALIZED (
  VALUES ('superadmin'), ('vorstand'), ('fussball-vorstand'),
         ('tischtennis-vorstand'), ('trainer'), ('betreuer'),
         ('kassierer'), ('webmaster'), ('behindertensport-vorstand'),
         ('damen-gymnastik-vorstand')
), permissions(permission_key) AS MATERIALIZED (
  VALUES ('department_sections.view'), ('department_sections.edit')
)
SELECT 'I3PC.10_ROLE_PERMISSION_MATRIX' AS section,
       expected.role_key, expected.permission_key,
       r.id IS NOT NULL AS role_exists, p.id IS NOT NULL AS permission_exists,
       EXISTS (
         SELECT 1 FROM public.admin_role_permissions rp
         WHERE rp.role_id = r.id AND rp.permission_id = p.id
       ) AS assigned
FROM (
  SELECT roles.role_key, permissions.permission_key
  FROM roles CROSS JOIN permissions
) expected
LEFT JOIN public.admin_roles r ON r.key = expected.role_key
LEFT JOIN public.admin_permissions p ON p.key = expected.permission_key
ORDER BY expected.role_key, expected.permission_key;

-- I3PC.11_MEDIA_USAGE_CONTRACT
SELECT 'I3PC.11_MEDIA_USAGE_CONTRACT' AS section,
       con.conname AS constraint_name,
       pg_catalog.pg_get_constraintdef(con.oid, true) AS definition,
       pg_catalog.pg_get_constraintdef(con.oid, true) ILIKE '%department_section%'
         AS department_section_allowed
FROM pg_catalog.pg_constraint con
WHERE con.conrelid = 'public.media_asset_usages'::regclass
  AND con.conname = 'media_asset_usages_entity_type_check';

-- I3PC.12_MEDIA_ROUTINES_AND_TRIGGERS
WITH eligible AS MATERIALIZED (
  SELECT p.oid, p.prosecdef, p.proconfig, p.proowner
  FROM pg_catalog.pg_proc p
  JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.prokind IN ('f', 'p')
    AND p.proname IN ('synchronize_media_assignment', 'cleanup_department_section_media_usage')
)
SELECT 'I3PC.12_MEDIA_ROUTINES_AND_TRIGGERS' AS section,
       e.oid::regprocedure::text AS exact_signature,
       e.prosecdef AS security_definer, e.proconfig,
       pg_catalog.pg_get_userbyid(e.proowner) AS owner,
       pg_catalog.pg_get_functiondef(e.oid) AS definition,
       pg_catalog.has_function_privilege('anon', e.oid, 'EXECUTE') AS anon_execute,
       pg_catalog.has_function_privilege('authenticated', e.oid, 'EXECUTE') AS authenticated_execute,
       pg_catalog.has_function_privilege('service_role', e.oid, 'EXECUTE') AS service_role_execute
FROM eligible e
ORDER BY e.oid::regprocedure::text;

-- I3PC.13_TABLE_TRIGGERS
SELECT 'I3PC.13_TABLE_TRIGGERS' AS section, rel.relname AS table_name,
       trg.tgname AS trigger_name, trg.tgenabled,
       pg_catalog.pg_get_triggerdef(trg.oid, true) AS definition
FROM pg_catalog.pg_trigger trg
JOIN pg_catalog.pg_class rel ON rel.oid = trg.tgrelid
JOIN pg_catalog.pg_namespace n ON n.oid = rel.relnamespace
WHERE n.nspname = 'public' AND NOT trg.tgisinternal
  AND rel.relname IN ('department_sections', 'department_training_times')
ORDER BY rel.relname, trg.tgname;

-- I3PC.14_DATA_COUNTS
SELECT 'I3PC.14_DATA_COUNTS' AS section,
       (SELECT count(*) FROM public.department_sections) AS section_count,
       (SELECT count(*) FROM public.department_training_times) AS training_count,
       (SELECT count(*) FROM public.media_asset_usages
        WHERE entity_type = 'department_section') AS section_media_usage_count;

-- I3PC.15_FINAL_CONTRACT
SELECT 'I3PC.15_FINAL_CONTRACT' AS section,
  (SELECT count(*) = 1 FROM public.departments
   WHERE slug = 'behindertensport' AND name_de = 'Behindertensport' AND is_active IS TRUE)
    AS behindertensport_department_ok,
  (SELECT count(*) = 1 FROM public.departments
   WHERE slug = 'damen-gymnastik' AND is_active IS TRUE)
    AS gymnastics_department_unchanged,
  (SELECT relrowsecurity FROM pg_catalog.pg_class
   WHERE oid = 'public.department_sections'::regclass) AS section_rls_ok,
  (SELECT relrowsecurity FROM pg_catalog.pg_class
   WHERE oid = 'public.department_training_times'::regclass) AS training_rls_ok,
  NOT pg_catalog.has_table_privilege('anon', 'public.department_sections', 'INSERT,UPDATE,DELETE')
    AS anon_section_write_denied,
  NOT pg_catalog.has_table_privilege('authenticated', 'public.department_sections', 'INSERT,UPDATE,DELETE')
    AS authenticated_section_write_denied,
  NOT pg_catalog.has_table_privilege('anon', 'public.department_training_times', 'INSERT,UPDATE,DELETE')
    AS anon_training_write_denied,
  NOT pg_catalog.has_table_privilege('authenticated', 'public.department_training_times', 'INSERT,UPDATE,DELETE')
    AS authenticated_training_write_denied,
  (pg_catalog.has_table_privilege('service_role', 'public.department_sections', 'SELECT')
   AND pg_catalog.has_table_privilege('service_role', 'public.department_sections', 'INSERT')
   AND pg_catalog.has_table_privilege('service_role', 'public.department_sections', 'UPDATE')
   AND pg_catalog.has_table_privilege('service_role', 'public.department_sections', 'DELETE'))
    AS service_section_crud_ok,
  (pg_catalog.has_table_privilege('service_role', 'public.department_training_times', 'SELECT')
   AND pg_catalog.has_table_privilege('service_role', 'public.department_training_times', 'INSERT')
   AND pg_catalog.has_table_privilege('service_role', 'public.department_training_times', 'UPDATE')
   AND pg_catalog.has_table_privilege('service_role', 'public.department_training_times', 'DELETE'))
    AS service_training_crud_ok,
  (SELECT count(*) = 0 FROM public.department_sections) AS no_initial_sections,
  (SELECT count(*) = 0 FROM public.department_training_times) AS no_initial_training_times;
