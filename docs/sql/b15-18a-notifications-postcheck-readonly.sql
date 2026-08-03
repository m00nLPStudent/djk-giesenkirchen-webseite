-- B15.18A read-only postcheck. Execute only after both proposal files.
SELECT c.relname, c.relrowsecurity, c.relforcerowsecurity
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname = 'notifications';

SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'notifications'
ORDER BY cmd, policyname;

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'notifications'
ORDER BY ordinal_position;

SELECT indexname, indexdef FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'notifications'
ORDER BY indexname;

SELECT trigger_name, action_statement FROM information_schema.triggers
WHERE event_object_schema = 'public' AND event_object_table = 'notifications';

SELECT grantee, privilege_type, is_grantable
FROM information_schema.role_table_grants
WHERE table_schema = 'public' AND table_name = 'notifications'
ORDER BY grantee, privilege_type;

SELECT policyname, cmd FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'notifications'
  AND (coalesce(qual, '') ~* '^\\s*true\\s*$' OR coalesce(with_check, '') ~* '^\\s*true\\s*$');
