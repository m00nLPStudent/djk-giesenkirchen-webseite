-- B15.21D8 read-only preflight. Do not modify data or schema.
-- Run and review this file before considering the separate D8 proposal.

SELECT c.oid::regclass AS relation, c.relkind, pg_get_userbyid(c.relowner) AS owner,
       c.relrowsecurity, c.relforcerowsecurity
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN (
    'notifications', 'notification_preferences', 'notification_audit',
    'notification_deliveries', 'notification_email_settings',
    'notification_email_global_settings', 'admin_profiles'
  )
ORDER BY c.relname;

SELECT table_name, ordinal_position, column_name, data_type, udt_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'notifications', 'notification_preferences', 'notification_audit',
    'notification_deliveries', 'notification_email_settings',
    'notification_email_global_settings', 'admin_profiles'
  )
ORDER BY table_name, ordinal_position;

SELECT conrelid::regclass AS relation, conname, contype, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = ANY (ARRAY[
  to_regclass('public.notifications'),
  to_regclass('public.notification_preferences'),
  to_regclass('public.notification_audit'),
  to_regclass('public.notification_deliveries'),
  to_regclass('public.notification_email_settings'),
  to_regclass('public.notification_email_global_settings'),
  to_regclass('public.admin_profiles')
]::oid[])
ORDER BY conrelid::regclass::text, conname;

SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'notifications', 'notification_preferences', 'notification_audit',
    'notification_deliveries', 'notification_email_settings',
    'notification_email_global_settings', 'admin_profiles'
  )
ORDER BY tablename, indexname;

SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'notifications', 'notification_preferences', 'notification_audit',
    'notification_deliveries', 'notification_email_settings',
    'notification_email_global_settings', 'admin_profiles'
  )
ORDER BY tablename, policyname;

SELECT grantee, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN (
    'notifications', 'notification_preferences', 'notification_audit',
    'notification_deliveries', 'notification_email_settings',
    'notification_email_global_settings', 'admin_profiles'
  )
  AND grantee IN ('PUBLIC', 'anon', 'authenticated', 'service_role')
ORDER BY table_name, grantee, privilege_type;

SELECT grantee, table_name, column_name, privilege_type
FROM information_schema.role_column_grants
WHERE table_schema = 'public'
  AND table_name IN ('notification_email_settings', 'notification_email_global_settings')
  AND grantee IN ('PUBLIC', 'anon', 'authenticated', 'service_role')
ORDER BY table_name, grantee, column_name, privilege_type;

SELECT event_object_table, trigger_name, event_manipulation, action_timing, action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table IN (
    'notification_preferences', 'notification_deliveries',
    'notification_email_settings', 'notification_email_global_settings'
  )
ORDER BY event_object_table, trigger_name, event_manipulation;

-- MATERIALIZED prevents pg_get_functiondef from being evaluated for aggregates/window functions.
WITH callable AS MATERIALIZED (
  SELECT p.oid, p.prosecdef, p.proconfig, p.proowner
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.prokind IN ('f', 'p')
)
SELECT c.oid::regprocedure AS signature, c.prosecdef,
       c.proconfig, pg_get_userbyid(c.proowner) AS owner,
       pg_get_functiondef(c.oid) AS definition
FROM callable c
WHERE pg_get_functiondef(c.oid) ~* 'notification_(preferences|deliveries|email_settings|email_global_settings)'
ORDER BY c.oid::regprocedure::text;

SELECT
  to_regprocedure('public.set_updated_at()') IS NOT NULL AS has_set_updated_at,
  to_regclass('public.notification_email_settings') AS email_settings_name_conflict,
  to_regclass('public.notification_email_global_settings') AS global_settings_name_conflict;

-- Aggregated only: no recipient, message, metadata or e-mail address is returned.
SELECT type AS notification_type, count(*) AS row_count
FROM public.notifications
GROUP BY type
ORDER BY type;

SELECT status, channel, count(*) AS delivery_count
FROM public.notification_deliveries
GROUP BY status, channel
ORDER BY status, channel;

SELECT notification_type, count(*) AS preference_count,
       count(*) FILTER (WHERE in_app_enabled = false) AS disabled_in_app_count
FROM public.notification_preferences
GROUP BY notification_type
ORDER BY notification_type;
