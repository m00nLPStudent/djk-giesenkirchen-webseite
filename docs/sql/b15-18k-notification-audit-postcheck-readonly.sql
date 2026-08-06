-- B15.18K read-only postcheck. Expected: no authenticated INSERT and no UPDATE/DELETE policies.
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'notification_audit'
ORDER BY policyname;

SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public' AND table_name = 'notification_audit'
ORDER BY grantee, privilege_type;

SELECT grantee, routine_name, privilege_type
FROM information_schema.role_routine_grants
WHERE specific_schema = 'public' AND routine_name = 'append_notification_audit'
ORDER BY grantee;

SELECT has_table_privilege('authenticated', 'public.notification_audit', 'INSERT') AS authenticated_can_insert,
       has_table_privilege('authenticated', 'public.notification_audit', 'UPDATE') AS authenticated_can_update,
       has_table_privilege('authenticated', 'public.notification_audit', 'DELETE') AS authenticated_can_delete,
       has_function_privilege('authenticated', 'public.append_notification_audit(text,text,uuid,uuid,integer,integer,integer,integer,integer,integer,text,text,text,text,jsonb)', 'EXECUTE') AS authenticated_can_append,
       has_function_privilege('service_role', 'public.append_notification_audit(text,text,uuid,uuid,integer,integer,integer,integer,integer,integer,text,text,text,text,jsonb)', 'EXECUTE') AS service_role_can_append;

SELECT count(*) AS mutation_policy_count
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'notification_audit' AND cmd IN ('INSERT', 'UPDATE', 'DELETE');
