-- B15.23E5.2.4: sanitized READ-ONLY postcheck after the manual migration.

BEGIN TRANSACTION READ ONLY;

SELECT n.nspname AS schema_name,c.relname AS relation_name,c.relkind,
  owner_role.rolname AS owner,c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS force_rls
FROM pg_class c
JOIN pg_namespace n ON n.oid=c.relnamespace
JOIN pg_roles owner_role ON owner_role.oid=c.relowner
WHERE c.oid=to_regclass('public.admin_email_change_requests');

SELECT ordinal_position,column_name,data_type,udt_name,is_nullable,column_default
FROM information_schema.columns
WHERE table_schema='public' AND table_name='admin_email_change_requests'
ORDER BY ordinal_position;

SELECT
  count(*) FILTER (WHERE column_name='compensation_started_at') AS compensation_column_count,
  bool_and(data_type='timestamp with time zone' AND is_nullable='YES' AND column_default IS NULL)
    FILTER (WHERE column_name='compensation_started_at') AS compensation_column_contract_valid
FROM information_schema.columns
WHERE table_schema='public' AND table_name='admin_email_change_requests';

SELECT con.conname AS constraint_name,con.contype AS constraint_type,
  con.convalidated AS validated,pg_get_constraintdef(con.oid,true) AS definition
FROM pg_constraint con
WHERE con.conrelid=to_regclass('public.admin_email_change_requests')
ORDER BY con.conname;

SELECT index_rel.relname AS index_name,idx.indisunique AS is_unique,
  idx.indisprimary AS is_primary,idx.indisvalid AS is_valid,
  pg_get_expr(idx.indpred,idx.indrelid) AS predicate,
  pg_get_indexdef(idx.indexrelid) AS index_definition
FROM pg_index idx
JOIN pg_class index_rel ON index_rel.oid=idx.indexrelid
WHERE idx.indrelid=to_regclass('public.admin_email_change_requests')
ORDER BY index_rel.relname;

SELECT t.tgname AS trigger_name,t.tgenabled AS enabled_mode,
  t.tgisinternal AS is_internal,t.tgfoid::regprocedure::text AS function_signature,
  pg_get_triggerdef(t.oid,true) AS trigger_definition
FROM pg_trigger t
WHERE t.tgrelid=to_regclass('public.admin_email_change_requests')
ORDER BY t.tgisinternal,t.tgname;

SELECT schemaname,tablename,policyname,permissive,roles,cmd,qual,with_check
FROM pg_policies
WHERE schemaname='public' AND tablename='admin_email_change_requests'
ORDER BY policyname;

SELECT grantee,privilege_type,is_grantable
FROM information_schema.role_table_grants
WHERE table_schema='public' AND table_name='admin_email_change_requests'
  AND grantee IN ('PUBLIC','anon','authenticated','service_role')
ORDER BY grantee,privilege_type;

SELECT grantee,column_name,privilege_type,is_grantable
FROM information_schema.role_column_grants
WHERE table_schema='public' AND table_name='admin_email_change_requests'
  AND grantee IN ('PUBLIC','anon','authenticated','service_role')
ORDER BY grantee,column_name,privilege_type;

SELECT role_name,privilege_name,
  has_table_privilege(role_name,'public.admin_email_change_requests',privilege_name)
    AS effective_privilege
FROM unnest(ARRAY['anon','authenticated','service_role']) roles(role_name)
CROSS JOIN unnest(ARRAY[
  'SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER'
]) privileges(privilege_name)
ORDER BY role_name,privilege_name;

SELECT status,count(*) AS request_count
FROM public.admin_email_change_requests
GROUP BY status
ORDER BY status;

SELECT
  count(*) AS total_request_count,
  count(*) FILTER (WHERE status NOT IN (
    'pending','confirming','compensating','completed','cancelled','expired','failed'
  )) AS unknown_status_count,
  count(*) FILTER (WHERE status='compensating') AS compensating_count,
  count(*) FILTER (WHERE NOT (
    (status='pending' AND confirmed_at IS NULL AND cancelled_at IS NULL AND expired_at IS NULL AND completed_at IS NULL AND locked_at IS NULL AND failure_code IS NULL AND compensation_started_at IS NULL)
    OR (status='confirming' AND confirmed_at IS NOT NULL AND cancelled_at IS NULL AND expired_at IS NULL AND completed_at IS NULL AND locked_at IS NOT NULL AND failure_code IS NULL AND compensation_started_at IS NULL)
    OR (status='compensating' AND confirmed_at IS NOT NULL AND cancelled_at IS NULL AND expired_at IS NULL AND locked_at IS NOT NULL AND failure_code IS NULL AND compensation_started_at IS NOT NULL)
    OR (status='completed' AND confirmed_at IS NOT NULL AND cancelled_at IS NULL AND expired_at IS NULL AND completed_at IS NOT NULL AND locked_at IS NULL AND failure_code IS NULL AND compensation_started_at IS NULL)
    OR (status='cancelled' AND cancelled_at IS NOT NULL AND expired_at IS NULL AND completed_at IS NULL AND locked_at IS NULL AND failure_code IS NULL AND compensation_started_at IS NULL)
    OR (status='expired' AND confirmed_at IS NULL AND cancelled_at IS NULL AND expired_at IS NOT NULL AND completed_at IS NULL AND locked_at IS NULL AND failure_code IS NULL AND compensation_started_at IS NULL)
    OR (status='failed' AND cancelled_at IS NULL AND expired_at IS NULL AND completed_at IS NULL AND locked_at IS NULL AND failure_code IS NOT NULL)
  )) AS invalid_state_count
FROM public.admin_email_change_requests;

SELECT
  (SELECT count(*) FROM information_schema.columns
   WHERE table_schema='public' AND table_name='admin_email_change_requests'
     AND column_name='compensation_started_at'
     AND data_type='timestamp with time zone' AND is_nullable='YES'
     AND column_default IS NULL)=1 AS compensation_column_ok,
  EXISTS (SELECT 1 FROM pg_constraint c
          WHERE c.conrelid=to_regclass('public.admin_email_change_requests')
            AND c.conname='admin_email_change_requests_status_check'
            AND pg_get_constraintdef(c.oid,true) ILIKE '%compensating%') AS status_constraint_ok,
  EXISTS (SELECT 1 FROM pg_constraint c
          WHERE c.conrelid=to_regclass('public.admin_email_change_requests')
            AND c.conname='admin_email_change_requests_state_check'
            AND pg_get_constraintdef(c.oid,true) ILIKE '%compensation_started_at%') AS state_constraint_ok,
  EXISTS (SELECT 1 FROM pg_index i JOIN pg_class x ON x.oid=i.indexrelid
          WHERE i.indrelid=to_regclass('public.admin_email_change_requests')
            AND x.relname='admin_email_change_requests_one_active_user_idx'
            AND i.indisunique AND i.indisvalid
            AND pg_get_indexdef(i.indexrelid) ILIKE '%compensating%') AS active_index_ok,
  (SELECT count(*)=0 FROM pg_policies
   WHERE schemaname='public' AND tablename='admin_email_change_requests') AS no_policies,
  NOT EXISTS (
    SELECT 1 FROM (VALUES ('anon'::text),('authenticated')) r(role_name)
    CROSS JOIN (VALUES ('SELECT'::text),('INSERT'),('UPDATE'),('DELETE'),('TRUNCATE'),('REFERENCES'),('TRIGGER')) p(privilege_name)
    WHERE has_table_privilege(r.role_name,'public.admin_email_change_requests',p.privilege_name)
  ) AS no_client_privileges,
  has_table_privilege('service_role','public.admin_email_change_requests','SELECT')
    AND has_table_privilege('service_role','public.admin_email_change_requests','INSERT')
    AND has_table_privilege('service_role','public.admin_email_change_requests','UPDATE')
    AND has_table_privilege('service_role','public.admin_email_change_requests','DELETE')
    AS service_role_crud_ok;

COMMIT;
