-- B15.23E5.2.3: READ-ONLY live preflight for the explicit compensation state.
-- Manual execution only. No UUID, email, token, or row-level personal data is returned.

BEGIN TRANSACTION READ ONLY;

-- 1. Relation identity, owner, RLS and FORCE RLS.
SELECT
  n.nspname AS schema_name,
  c.relname AS relation_name,
  c.relkind,
  owner_role.rolname AS owner,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS force_rls
FROM pg_class c
JOIN pg_namespace n ON n.oid=c.relnamespace
JOIN pg_roles owner_role ON owner_role.oid=c.relowner
WHERE c.oid=to_regclass('public.admin_email_change_requests');

-- 2. Exact columns, types, nullability and defaults.
SELECT
  a.attnum AS ordinal_position,
  a.attname AS column_name,
  pg_catalog.format_type(a.atttypid,a.atttypmod) AS data_type,
  a.attnotnull AS not_null,
  pg_get_expr(d.adbin,d.adrelid) AS column_default
FROM pg_attribute a
LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum
WHERE a.attrelid=to_regclass('public.admin_email_change_requests')
  AND a.attnum>0
  AND NOT a.attisdropped
ORDER BY a.attnum;

-- 3. Explicit compensation-related column inventory.
SELECT
  count(*) FILTER (WHERE a.attname='compensation_started_at') AS compensation_started_at_count,
  count(*) FILTER (WHERE a.attname ILIKE '%compensat%') AS compensation_related_column_count,
  coalesce(array_agg(a.attname ORDER BY a.attnum)
    FILTER (WHERE a.attname ILIKE '%compensat%'),'{}'::name[]) AS compensation_related_columns
FROM pg_attribute a
WHERE a.attrelid=to_regclass('public.admin_email_change_requests')
  AND a.attnum>0
  AND NOT a.attisdropped;

-- 4. Every PK/FK/UNIQUE/CHECK constraint with its current definition.
SELECT
  con.conname AS constraint_name,
  con.contype AS constraint_type,
  con.convalidated AS validated,
  con.condeferrable AS deferrable,
  con.condeferred AS initially_deferred,
  pg_get_constraintdef(con.oid,true) AS definition
FROM pg_constraint con
WHERE con.conrelid=to_regclass('public.admin_email_change_requests')
ORDER BY con.conname;

-- 5. Every index, including predicate and uniqueness.
SELECT
  index_rel.relname AS index_name,
  idx.indisunique AS is_unique,
  idx.indisprimary AS is_primary,
  idx.indisvalid AS is_valid,
  idx.indisready AS is_ready,
  pg_get_expr(idx.indpred,idx.indrelid) AS predicate,
  pg_get_indexdef(idx.indexrelid) AS index_definition
FROM pg_index idx
JOIN pg_class index_rel ON index_rel.oid=idx.indexrelid
WHERE idx.indrelid=to_regclass('public.admin_email_change_requests')
ORDER BY index_rel.relname;

-- 6. Trigger inventory. No row data is returned.
SELECT
  t.tgname AS trigger_name,
  t.tgenabled AS enabled_mode,
  t.tgisinternal AS is_internal,
  t.tgfoid::regprocedure::text AS function_signature,
  pg_get_triggerdef(t.oid,true) AS trigger_definition
FROM pg_trigger t
WHERE t.tgrelid=to_regclass('public.admin_email_change_requests')
ORDER BY t.tgisinternal,t.tgname;

-- 7. Policies. The expected server-only result is empty.
SELECT schemaname,tablename,policyname,permissive,roles,cmd,qual,with_check
FROM pg_policies
WHERE schemaname='public' AND tablename='admin_email_change_requests'
ORDER BY policyname;

-- 8. Direct table and column grants.
SELECT grantee,privilege_type,is_grantable
FROM information_schema.role_table_grants
WHERE table_schema='public'
  AND table_name='admin_email_change_requests'
  AND grantee IN ('PUBLIC','anon','authenticated','service_role')
ORDER BY grantee,privilege_type;

SELECT grantee,column_name,privilege_type,is_grantable
FROM information_schema.role_column_grants
WHERE table_schema='public'
  AND table_name='admin_email_change_requests'
  AND grantee IN ('PUBLIC','anon','authenticated','service_role')
ORDER BY grantee,column_name,privilege_type;

-- 9. Effective privileges for actual login roles.
SELECT role_name,privilege_name,
  has_table_privilege(role_name,'public.admin_email_change_requests',privilege_name)
    AS effective_privilege
FROM unnest(ARRAY['anon','authenticated','service_role']) roles(role_name)
CROSS JOIN unnest(ARRAY[
  'SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER'
]) privileges(privilege_name)
ORDER BY role_name,privilege_name;

-- 10. Sanitized status distribution only.
SELECT status,count(*) AS request_count
FROM public.admin_email_change_requests
GROUP BY status
ORDER BY status;

SELECT
  count(*) AS total_request_count,
  count(*) FILTER (WHERE status NOT IN (
    'pending','confirming','completed','cancelled','expired','failed'
  )) AS unknown_status_count,
  count(*) FILTER (WHERE status='compensating') AS existing_compensating_count
FROM public.admin_email_change_requests;

-- 11. Sanitized state-consistency counts for the proposed migration.
SELECT
  count(*) FILTER (WHERE status='pending' AND (
    confirmed_at IS NOT NULL OR cancelled_at IS NOT NULL OR expired_at IS NOT NULL
    OR completed_at IS NOT NULL OR locked_at IS NOT NULL OR failure_code IS NOT NULL
  )) AS invalid_pending_count,
  count(*) FILTER (WHERE status='confirming' AND (
    confirmed_at IS NULL OR cancelled_at IS NOT NULL OR expired_at IS NOT NULL
    OR completed_at IS NOT NULL OR locked_at IS NULL OR failure_code IS NOT NULL
  )) AS invalid_confirming_count,
  count(*) FILTER (WHERE status='completed' AND (
    confirmed_at IS NULL OR cancelled_at IS NOT NULL OR expired_at IS NOT NULL
    OR completed_at IS NULL OR locked_at IS NOT NULL OR failure_code IS NOT NULL
  )) AS invalid_completed_count,
  count(*) FILTER (WHERE status='failed' AND (
    cancelled_at IS NOT NULL OR expired_at IS NOT NULL OR completed_at IS NOT NULL
    OR locked_at IS NOT NULL OR failure_code IS NULL
  )) AS invalid_failed_count
FROM public.admin_email_change_requests;

-- 12. Views/materialized views whose stored definition references the relation or statuses.
WITH candidate_views AS MATERIALIZED (
  SELECT c.oid,n.nspname,c.relname,c.relkind
  FROM pg_class c
  JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE c.relkind IN ('v','m')
    AND n.nspname NOT IN ('pg_catalog','information_schema')
), view_definitions AS MATERIALIZED (
  SELECT v.*,pg_get_viewdef(v.oid,true) AS definition
  FROM candidate_views v
)
SELECT nspname AS schema_name,relname AS view_name,relkind,definition
FROM view_definitions
WHERE definition ILIKE '%admin_email_change_requests%'
   OR (definition ILIKE '%confirming%' AND definition ILIKE '%completed%')
ORDER BY nspname,relname;

-- 13. Only normal functions are materialized before pg_get_functiondef is called.
WITH normal_functions AS MATERIALIZED (
  SELECT p.oid,p.prosecdef,p.proconfig,p.proowner,n.nspname
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE p.prokind='f'
    AND n.nspname NOT IN ('pg_catalog','information_schema')
), function_definitions AS MATERIALIZED (
  SELECT f.*,pg_get_functiondef(f.oid) AS definition
  FROM normal_functions f
)
SELECT
  f.oid::regprocedure::text AS function_signature,
  f.prosecdef AS security_definer,
  f.proconfig,
  owner_role.rolname AS owner,
  f.definition
FROM function_definitions f
JOIN pg_roles owner_role ON owner_role.oid=f.proowner
WHERE f.definition ILIKE '%admin_email_change_requests%'
   OR (f.definition ILIKE '%confirming%' AND f.definition ILIKE '%completed%')
ORDER BY f.oid::regprocedure::text;

-- 14. Other catalog dependencies on the table.
SELECT
  dependent_ns.nspname AS dependent_schema,
  dependent_class.relname AS dependent_object,
  dependent_class.relkind AS dependent_kind,
  dep.deptype AS dependency_type
FROM pg_depend dep
JOIN pg_class dependent_class ON dependent_class.oid=dep.objid
JOIN pg_namespace dependent_ns ON dependent_ns.oid=dependent_class.relnamespace
WHERE dep.refobjid=to_regclass('public.admin_email_change_requests')
ORDER BY dependent_ns.nspname,dependent_class.relname,dep.deptype;

COMMIT;
