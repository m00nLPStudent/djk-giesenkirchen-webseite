-- B15.21D4 read-only postcheck. Run only after a separately approved proposal execution.

SELECT c.oid::regclass AS relation, pg_get_userbyid(c.relowner) AS owner, c.relrowsecurity, c.relforcerowsecurity
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname = 'notification_deliveries';

SELECT obj_description('public.notification_deliveries'::regclass, 'pg_class') AS table_comment;

SELECT ordinal_position, column_name, data_type, udt_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'notification_deliveries'
ORDER BY ordinal_position;

SELECT conname, contype, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.notification_deliveries'::regclass
ORDER BY conname;

SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'notification_deliveries'
ORDER BY indexname;

SELECT trigger_name, event_manipulation, action_timing, action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public' AND event_object_table = 'notification_deliveries'
ORDER BY trigger_name, event_manipulation;

SELECT policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'notification_deliveries'
ORDER BY policyname;

SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public' AND table_name = 'notification_deliveries'
  AND grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY grantee, privilege_type;

SELECT grantee, column_name, privilege_type
FROM information_schema.role_column_grants
WHERE table_schema = 'public' AND table_name = 'notification_deliveries'
  AND grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY grantee, column_name, privilege_type;

SELECT
  has_table_privilege('anon', 'public.notification_deliveries', 'SELECT') AS anon_select,
  has_table_privilege('anon', 'public.notification_deliveries', 'INSERT') AS anon_insert,
  has_table_privilege('anon', 'public.notification_deliveries', 'UPDATE') AS anon_update,
  has_table_privilege('anon', 'public.notification_deliveries', 'DELETE') AS anon_delete,
  has_table_privilege('anon', 'public.notification_deliveries', 'TRUNCATE') AS anon_truncate,
  has_table_privilege('anon', 'public.notification_deliveries', 'REFERENCES') AS anon_references,
  has_table_privilege('anon', 'public.notification_deliveries', 'TRIGGER') AS anon_trigger,
  has_table_privilege('authenticated', 'public.notification_deliveries', 'SELECT') AS authenticated_select,
  has_table_privilege('authenticated', 'public.notification_deliveries', 'INSERT') AS authenticated_insert,
  has_table_privilege('authenticated', 'public.notification_deliveries', 'UPDATE') AS authenticated_update,
  has_table_privilege('authenticated', 'public.notification_deliveries', 'DELETE') AS authenticated_delete,
  has_table_privilege('authenticated', 'public.notification_deliveries', 'TRUNCATE') AS authenticated_truncate,
  has_table_privilege('authenticated', 'public.notification_deliveries', 'REFERENCES') AS authenticated_references,
  has_table_privilege('authenticated', 'public.notification_deliveries', 'TRIGGER') AS authenticated_trigger,
  has_table_privilege('service_role', 'public.notification_deliveries', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') AS service_role_required_access;

SELECT count(*) AS unexpected_policies
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'notification_deliveries';

SELECT count(*) AS delivery_rows_after_schema_install
FROM public.notification_deliveries;

SELECT
  count(*) AS notification_count,
  count(*) FILTER (WHERE nullif(metadata->>'idempotencyKey', '') IS NULL) AS missing_notification_idempotency_key_count,
  count(*) FILTER (WHERE recipient_user_id IS NULL) AS missing_recipient_count
FROM public.notifications;

SELECT count(*) AS duplicate_notification_idempotency_groups
FROM (
  SELECT recipient_user_id, type, metadata->>'idempotencyKey'
  FROM public.notifications
  WHERE nullif(metadata->>'idempotencyKey', '') IS NOT NULL
  GROUP BY recipient_user_id, type, metadata->>'idempotencyKey'
  HAVING count(*) > 1
) duplicates;
