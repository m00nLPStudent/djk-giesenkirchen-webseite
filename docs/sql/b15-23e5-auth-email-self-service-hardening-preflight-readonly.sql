-- B15.23E5: READ-ONLY preflight for a possible auth.users email-change guard.
-- Manual execution only. This file changes neither schema, configuration nor data.

BEGIN TRANSACTION READ ONLY;

SELECT a.attnum, a.attname AS column_name,
  pg_catalog.format_type(a.atttypid, a.atttypmod) AS data_type,
  a.attnotnull AS not_null,
  pg_get_expr(d.adbin, d.adrelid) AS column_default
FROM pg_attribute a
LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum
WHERE a.attrelid=to_regclass('auth.users') AND a.attnum>0 AND NOT a.attisdropped
ORDER BY a.attnum;

SELECT c.oid::regclass AS relation, r.rolname AS owner,
  c.relrowsecurity AS rls_enabled, c.relforcerowsecurity AS force_rls,
  current_user AS inspected_as
FROM pg_class c JOIN pg_roles r ON r.oid=c.relowner
WHERE c.oid=to_regclass('auth.users');

SELECT t.tgname AS trigger_name, t.tgenabled AS enabled_mode,
  t.tgisinternal AS is_internal, t.tgfoid::regprocedure::text AS function_signature,
  pg_get_triggerdef(t.oid, true) AS trigger_definition
FROM pg_trigger t
WHERE t.tgrelid=to_regclass('auth.users')
ORDER BY t.tgisinternal, t.tgname;

WITH trigger_functions AS MATERIALIZED (
  SELECT DISTINCT p.oid,p.prosecdef,p.proconfig,p.proowner
  FROM pg_trigger t JOIN pg_proc p ON p.oid=t.tgfoid
  WHERE t.tgrelid=to_regclass('auth.users') AND p.prokind='f'
)
SELECT f.oid::regprocedure::text AS function_signature,
  f.prosecdef AS security_definer, f.proconfig, owner_role.rolname AS owner,
  pg_get_functiondef(f.oid) AS function_definition
FROM trigger_functions f JOIN pg_roles owner_role ON owner_role.oid=f.proowner
ORDER BY f.oid::regprocedure::text;

SELECT con.conname AS constraint_name, con.contype AS constraint_type,
  pg_get_constraintdef(con.oid,true) AS definition
FROM pg_constraint con WHERE con.conrelid=to_regclass('auth.users')
ORDER BY con.conname;

SELECT index_rel.relname AS index_name, idx.indisunique AS is_unique,
  idx.indisprimary AS is_primary, pg_get_indexdef(idx.indexrelid) AS index_definition
FROM pg_index idx JOIN pg_class index_rel ON index_rel.oid=idx.indexrelid
WHERE idx.indrelid=to_regclass('auth.users') ORDER BY index_rel.relname;

SELECT role_name, privilege_name,
  has_table_privilege(role_name,'auth.users',privilege_name) AS granted
FROM unnest(ARRAY['anon','authenticated','service_role','supabase_auth_admin']) AS roles(role_name)
CROSS JOIN unnest(ARRAY['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER']) AS privileges(privilege_name)
ORDER BY role_name,privilege_name;

-- Aggregate only: no address, token or user identifier is returned.
SELECT count(*) AS auth_user_count,
  count(*) FILTER (WHERE COALESCE(to_jsonb(u)->>'email_change','')<>'') AS users_with_pending_email_change,
  count(*) FILTER (WHERE NULLIF(to_jsonb(u)->>'email_change_sent_at','') IS NOT NULL) AS users_with_email_change_sent_at
FROM auth.users u;

SELECT status,count(*) AS request_count
FROM public.admin_email_change_requests GROUP BY status ORDER BY status;

WITH normal_functions AS MATERIALIZED (
  SELECT p.oid,p.prosecdef,p.proconfig,p.proowner
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE p.prokind='f' AND n.nspname='public'
), matching_functions AS MATERIALIZED (
  SELECT f.*,pg_get_functiondef(f.oid) AS definition FROM normal_functions f
)
SELECT m.oid::regprocedure::text AS function_signature,
  m.prosecdef AS security_definer,m.proconfig,owner_role.rolname AS owner,m.definition
FROM matching_functions m JOIN pg_roles owner_role ON owner_role.oid=m.proowner
WHERE m.definition ILIKE '%auth.users%' OR m.definition ILIKE '%email_change%'
ORDER BY m.oid::regprocedure::text;

COMMIT;
