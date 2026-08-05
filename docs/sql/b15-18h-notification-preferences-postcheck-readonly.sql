SELECT c.relname, c.relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname='notification_preferences';
SELECT column_name,data_type,is_nullable,column_default FROM information_schema.columns WHERE table_schema='public' AND table_name='notification_preferences' ORDER BY ordinal_position;
SELECT policyname,cmd,roles,qual,with_check FROM pg_policies WHERE schemaname='public' AND tablename='notification_preferences' ORDER BY policyname;
SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='notification_preferences' AND (coalesce(qual,'') ~* '(^|[^a-z])true([^a-z]|$)' OR coalesce(with_check,'') ~* '(^|[^a-z])true([^a-z]|$)');
SELECT constraint_name,constraint_type FROM information_schema.table_constraints WHERE table_schema='public' AND table_name='notification_preferences' ORDER BY constraint_name;
