-- Read-only postcheck. Execute after schema and RLS proposals.
SELECT c.relname, c.relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname='notification_audit';
SELECT policyname, cmd, roles, qual, with_check FROM pg_policies WHERE schemaname='public' AND tablename='notification_audit' ORDER BY policyname;
SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_schema='public' AND table_name='notification_audit' ORDER BY ordinal_position;
SELECT indexname, indexdef FROM pg_indexes WHERE schemaname='public' AND tablename='notification_audit' ORDER BY indexname;
SELECT routine_name, security_type FROM information_schema.routines WHERE routine_schema='public' AND routine_name='load_notification_audit_monitoring';
SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='notification_audit' AND (coalesce(qual,'') ~* '(^|[^a-z])true([^a-z]|$)' OR coalesce(with_check,'') ~* '(^|[^a-z])true([^a-z]|$)');
SELECT table_name, privilege_type, grantee FROM information_schema.role_table_grants WHERE table_schema='public' AND table_name='notification_audit' ORDER BY grantee, privilege_type;
