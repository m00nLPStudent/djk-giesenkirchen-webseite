-- B15.21D4 read-only preflight. Do not modify data or schema.
-- Review every result before considering the separate proposal.

SELECT c.oid::regclass AS relation, c.relkind, c.relrowsecurity, c.relforcerowsecurity
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('notifications', 'notification_preferences', 'notification_audit', 'notification_deliveries')
ORDER BY c.relname;

SELECT table_name, ordinal_position, column_name, data_type, udt_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('notifications', 'notification_preferences', 'notification_audit', 'notification_deliveries')
ORDER BY table_name, ordinal_position;

SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('notifications', 'notification_preferences', 'notification_audit', 'notification_deliveries')
ORDER BY tablename, policyname;

SELECT grantee, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN ('notifications', 'notification_preferences', 'notification_audit', 'notification_deliveries')
  AND grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY table_name, grantee, privilege_type;

SELECT grantee, table_name, column_name, privilege_type
FROM information_schema.role_column_grants
WHERE table_schema = 'public'
  AND table_name IN ('notifications', 'notification_preferences', 'notification_audit', 'notification_deliveries')
  AND grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY table_name, grantee, column_name, privilege_type;

SELECT conrelid::regclass AS relation, conname, contype, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid IN (
  to_regclass('public.notifications'),
  to_regclass('public.notification_preferences'),
  to_regclass('public.notification_audit'),
  to_regclass('public.notification_deliveries')
)
ORDER BY conrelid::regclass::text, conname;

SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('notifications', 'notification_preferences', 'notification_audit', 'notification_deliveries')
ORDER BY tablename, indexname;

SELECT
  to_regprocedure('public.set_updated_at()') IS NOT NULL AS has_set_updated_at,
  to_regprocedure('public.append_notification_audit(text,text,uuid,uuid,integer,integer,integer,integer,integer,integer,text,text,text,text,jsonb)') IS NOT NULL AS has_hardened_audit_append;

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

-- Aggregated only: no address values are returned.
SELECT
  count(*) FILTER (WHERE is_active = true) AS active_admin_profiles,
  count(*) FILTER (WHERE is_active = true AND nullif(btrim(email), '') IS NULL) AS active_profiles_without_email,
  count(*) FILTER (WHERE is_active = true AND nullif(btrim(email), '') IS NOT NULL) AS active_profiles_with_email
FROM public.admin_profiles;

SELECT count(*) AS duplicate_active_email_groups
FROM (
  SELECT lower(btrim(email))
  FROM public.admin_profiles
  WHERE is_active = true AND nullif(btrim(email), '') IS NOT NULL
  GROUP BY lower(btrim(email))
  HAVING count(*) > 1
) duplicates;
