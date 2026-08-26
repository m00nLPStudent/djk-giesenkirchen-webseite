-- B15.21C1 READ-ONLY postcheck.
SELECT id, key, name, is_active
FROM public.admin_roles
WHERE key IN ('tischtennis-vorstand','damen-gymnastik-vorstand','behindertensport-vorstand')
ORDER BY key;

WITH expected(role_key, permission_key) AS (
  SELECT roles.role_key, permissions.permission_key
  FROM unnest(ARRAY['vorstand','fussball-vorstand','jugendleiter','tischtennis-vorstand','damen-gymnastik-vorstand','behindertensport-vorstand']) AS roles(role_key)
  CROSS JOIN unnest(ARRAY['membership_requests.view','membership_requests.edit','membership_requests.forward']) AS permissions(permission_key)
)
SELECT e.role_key, e.permission_key,
  EXISTS (
    SELECT 1 FROM public.admin_role_permissions rp
    JOIN public.admin_roles r ON r.id = rp.role_id
    JOIN public.admin_permissions p ON p.id = rp.permission_id
    WHERE r.key = e.role_key AND r.is_active = true AND p.key = e.permission_key
  ) AS present
FROM expected e
ORDER BY e.role_key, e.permission_key;

SELECT c.relrowsecurity, c.relforcerowsecurity
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname = 'membership_requests';

SELECT role_name,
  has_table_privilege(role_name, 'public.membership_requests', 'SELECT') AS can_select,
  has_table_privilege(role_name, 'public.membership_requests', 'INSERT') AS can_insert,
  has_table_privilege(role_name, 'public.membership_requests', 'UPDATE') AS can_update,
  has_table_privilege(role_name, 'public.membership_requests', 'DELETE') AS can_delete
FROM unnest(ARRAY['anon','authenticated','service_role']) AS role_name
ORDER BY role_name;

SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'membership_requests'
ORDER BY policyname;
