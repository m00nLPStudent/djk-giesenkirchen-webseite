-- B15.16G1 read-only preflight. Execute manually before reviewing proposals.
SELECT c.relname, c.relrowsecurity, c.relforcerowsecurity
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname = 'team_templates';

SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies WHERE schemaname = 'public' AND tablename = 'team_templates'
ORDER BY cmd, policyname;

SELECT grantee, privilege_type FROM information_schema.role_table_grants
WHERE table_schema = 'public' AND table_name = 'team_templates'
ORDER BY grantee, privilege_type;

SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'team_templates' ORDER BY ordinal_position;

SELECT trigger_name, event_manipulation, action_statement FROM information_schema.triggers
WHERE event_object_schema = 'public' AND event_object_table = 'team_templates';

SELECT n.nspname AS schema_name, p.proname, pg_get_function_identity_arguments(p.oid) AS arguments, p.prosecdef AS security_definer
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND (p.proname ILIKE '%permission%' OR p.proname ILIKE '%superadmin%' OR p.proname ILIKE '%admin%')
ORDER BY p.proname;

SELECT ar.key AS role_key, ap.key AS permission_key, ar.is_active AS role_active
FROM public.admin_role_permissions arp JOIN public.admin_roles ar ON ar.id = arp.role_id
JOIN public.admin_permissions ap ON ap.id = arp.permission_id
WHERE ap.key IN ('settings.view', 'settings.edit') ORDER BY ap.key, ar.key;

SELECT count(*) AS profiles_total, count(*) FILTER (WHERE direct_user.id = profile.id) AS direct_id_matches,
       count(*) FILTER (WHERE direct_user.id IS NULL AND email_user.id IS NOT NULL) AS email_only_matches
FROM public.admin_profiles profile LEFT JOIN auth.users direct_user ON direct_user.id = profile.id
LEFT JOIN auth.users email_user ON lower(email_user.email) = lower(profile.email);

SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check FROM pg_policies
WHERE schemaname = 'public' AND tablename IN ('team_templates', 'club_settings', 'pages', 'club_contacts')
ORDER BY tablename, cmd, policyname;
