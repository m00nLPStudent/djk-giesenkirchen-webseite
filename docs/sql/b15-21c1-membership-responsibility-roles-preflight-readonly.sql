-- B15.21C1 READ-ONLY preflight. Execute manually before the proposal.
SELECT id, key, name, description, sort_order, is_active
FROM public.admin_roles
WHERE key IN ('superadmin','vorstand','fussball-vorstand','jugendleiter','jugendkoordinator','tischtennis-vorstand','damen-gymnastik-vorstand','behindertensport-vorstand','kassierer','trainer','betreuer')
ORDER BY key;

SELECT id, key, name, category
FROM public.admin_permissions
WHERE key IN ('membership_requests.view','membership_requests.edit','membership_requests.forward')
ORDER BY key;

SELECT r.key AS role_key, p.key AS permission_key
FROM public.admin_role_permissions rp
JOIN public.admin_roles r ON r.id = rp.role_id
JOIN public.admin_permissions p ON p.id = rp.permission_id
WHERE p.key LIKE 'membership_requests.%'
ORDER BY r.key, p.key;

SELECT r.key AS role_key, count(*) AS assigned_user_count
FROM public.admin_user_roles ur
JOIN public.admin_roles r ON r.id = ur.role_id
WHERE r.key IN ('tischtennis-vorstand','damen-gymnastik-vorstand','behindertensport-vorstand')
GROUP BY r.key
ORDER BY r.key;

SELECT request_type, count(*) AS request_count
FROM public.membership_requests
GROUP BY request_type
ORDER BY request_type;

SELECT c.relrowsecurity, c.relforcerowsecurity
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname = 'membership_requests';

SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public' AND table_name = 'membership_requests'
ORDER BY grantee, privilege_type;
