-- B15.21A final preflight / live-state diagnosis. READ ONLY.

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'membership_requests'
ORDER BY ordinal_position;

SELECT c.conname, pg_get_constraintdef(c.oid) AS definition
FROM pg_constraint c
WHERE c.conrelid = 'public.membership_requests'::regclass
ORDER BY c.conname;

SELECT c.relrowsecurity, c.relforcerowsecurity, r.rolname AS table_owner
FROM pg_class c
JOIN pg_roles r ON r.oid = c.relowner
WHERE c.oid = 'public.membership_requests'::regclass;

SELECT policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'membership_requests'
ORDER BY policyname;

SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'membership_requests'
  AND grantee IN ('PUBLIC', 'anon', 'authenticated', 'service_role')
ORDER BY grantee, privilege_type;

SELECT grantee, column_name, privilege_type
FROM information_schema.column_privileges
WHERE table_schema = 'public'
  AND table_name = 'membership_requests'
  AND grantee IN ('PUBLIC', 'anon', 'authenticated', 'service_role')
ORDER BY grantee, column_name, privilege_type;

SELECT role_name, privilege,
       has_table_privilege(role_name, 'public.membership_requests', privilege) AS allowed
FROM unnest(ARRAY['anon', 'authenticated', 'service_role']) AS role_name
CROSS JOIN unnest(ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER']) AS privilege
ORDER BY role_name, privilege;

-- Stable fingerprint of the five existing rows. New B15.21A consent columns are
-- excluded so this value remains comparable after the additive schema change.
SELECT count(*) AS request_count,
       md5(COALESCE(string_agg(
         (to_jsonb(mr) - ARRAY['privacy_consent', 'privacy_consent_at', 'privacy_policy_version'])::text,
         E'\n' ORDER BY mr.id
       ), '')) AS existing_data_fingerprint
FROM public.membership_requests mr;

SELECT id, slug, is_active
FROM public.departments
WHERE lower(slug) IN ('fussball', 'fußball')
ORDER BY slug;

-- Materialization guarantees pg_get_functiondef is evaluated only for normal
-- functions/procedures, never aggregates or window functions.
WITH eligible_routines AS MATERIALIZED (
  SELECT p.oid, p.prosecdef, p.proconfig, p.proowner
  FROM pg_proc p
  WHERE p.prokind IN ('f', 'p')
), routine_definitions AS MATERIALIZED (
  SELECT e.*, pg_get_functiondef(e.oid) AS definition
  FROM eligible_routines e
)
SELECT d.oid::regprocedure::text AS routine_signature,
       d.prosecdef AS security_definer,
       d.proconfig,
       owner_role.rolname AS owner,
       d.definition
FROM routine_definitions d
JOIN pg_roles owner_role ON owner_role.oid = d.proowner
WHERE d.definition ILIKE '%membership_requests%'
ORDER BY d.oid::regprocedure::text;

WITH eligible_routines AS MATERIALIZED (
  SELECT p.oid
  FROM pg_proc p
  WHERE p.prokind IN ('f', 'p')
), routine_definitions AS MATERIALIZED (
  SELECT e.oid, pg_get_functiondef(e.oid) AS definition
  FROM eligible_routines e
), referenced_routines AS MATERIALIZED (
  SELECT d.oid
  FROM routine_definitions d
  WHERE d.definition ILIKE '%membership_requests%'
)
SELECT r.oid::regprocedure::text AS routine_signature,
       role_name,
       has_function_privilege(role_name, r.oid, 'EXECUTE') AS can_execute
FROM referenced_routines r
CROSS JOIN unnest(ARRAY['anon', 'authenticated', 'service_role']) AS role_name
ORDER BY r.oid::regprocedure::text, role_name;
