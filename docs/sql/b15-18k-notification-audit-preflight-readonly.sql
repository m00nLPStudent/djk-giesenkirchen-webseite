-- B15.18K read-only preflight. Do not mutate data.
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'notification_audit'
ORDER BY ordinal_position;

SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'notification_audit'
ORDER BY policyname;

SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public' AND table_name = 'notification_audit'
ORDER BY grantee, privilege_type;

SELECT routine_name, specific_name, security_type, routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('append_notification_audit', 'load_notification_audit_monitoring')
ORDER BY routine_name, specific_name;

SELECT grantee, routine_name, privilege_type
FROM information_schema.role_routine_grants
WHERE specific_schema = 'public'
  AND routine_name IN ('append_notification_audit', 'load_notification_audit_monitoring')
ORDER BY routine_name, grantee;

SELECT status, count(*) AS rows
FROM public.notification_audit
GROUP BY status
ORDER BY status;

SELECT error_class, count(*) AS rows
FROM public.notification_audit
WHERE error_class IS NOT NULL
GROUP BY error_class
ORDER BY rows DESC, error_class;

SELECT key, count(*) AS rows
FROM public.notification_audit a
CROSS JOIN LATERAL jsonb_object_keys(a.metadata) AS key
GROUP BY key
ORDER BY key;
