-- B15.21D8 read-only postcheck. Run only after separately approved proposal execution.

SELECT c.oid::regclass AS relation, pg_get_userbyid(c.relowner) AS owner,
       c.relrowsecurity, c.relforcerowsecurity,
       obj_description(c.oid, 'pg_class') AS table_comment
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('notification_email_settings', 'notification_email_global_settings')
ORDER BY c.relname;

SELECT table_name, ordinal_position, column_name, data_type, udt_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('notification_email_settings', 'notification_email_global_settings')
ORDER BY table_name, ordinal_position;

SELECT conrelid::regclass AS relation, conname, contype, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid IN (
  'public.notification_email_settings'::regclass,
  'public.notification_email_global_settings'::regclass
)
ORDER BY conrelid::regclass::text, conname;

SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('notification_email_settings', 'notification_email_global_settings')
ORDER BY tablename, indexname;

SELECT event_object_table, trigger_name, event_manipulation, action_timing, action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table IN ('notification_email_settings', 'notification_email_global_settings')
ORDER BY event_object_table, trigger_name, event_manipulation;

SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('notification_email_settings', 'notification_email_global_settings')
ORDER BY tablename, policyname;

SELECT grantee, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN ('notification_email_settings', 'notification_email_global_settings')
  AND grantee IN ('PUBLIC', 'anon', 'authenticated', 'service_role')
ORDER BY table_name, grantee, privilege_type;

SELECT grantee, table_name, column_name, privilege_type
FROM information_schema.role_column_grants
WHERE table_schema = 'public'
  AND table_name IN ('notification_email_settings', 'notification_email_global_settings')
  AND grantee IN ('PUBLIC', 'anon', 'authenticated', 'service_role')
ORDER BY table_name, grantee, column_name, privilege_type;

SELECT table_name, role_name,
       has_table_privilege(role_name, format('public.%I', table_name), 'SELECT') AS can_select,
       has_table_privilege(role_name, format('public.%I', table_name), 'INSERT') AS can_insert,
       has_table_privilege(role_name, format('public.%I', table_name), 'UPDATE') AS can_update,
       has_table_privilege(role_name, format('public.%I', table_name), 'DELETE') AS can_delete,
       has_table_privilege(role_name, format('public.%I', table_name), 'TRUNCATE') AS can_truncate,
       has_table_privilege(role_name, format('public.%I', table_name), 'REFERENCES') AS can_reference,
       has_table_privilege(role_name, format('public.%I', table_name), 'TRIGGER') AS can_trigger
FROM (VALUES ('notification_email_settings'), ('notification_email_global_settings')) t(table_name)
CROSS JOIN (VALUES ('anon'), ('authenticated'), ('service_role')) r(role_name)
ORDER BY table_name, role_name;

SELECT count(*) AS unexpected_policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('notification_email_settings', 'notification_email_global_settings');

SELECT setting_key, email_delivery_enabled, updated_by, created_at, updated_at
FROM public.notification_email_global_settings
ORDER BY setting_key;

SELECT notification_type, email_enabled
FROM public.notification_email_settings
ORDER BY notification_type;

SELECT count(*) AS configured_type_count,
       count(*) FILTER (WHERE email_enabled) AS enabled_type_count,
       count(*) FILTER (WHERE NOT email_enabled) AS disabled_type_count
FROM public.notification_email_settings;

SELECT
  (SELECT count(*) = 1
   FROM public.notification_email_global_settings
   WHERE setting_key = 'global' AND email_delivery_enabled = false) AS master_starts_disabled,
  coalesce((SELECT email_enabled
            FROM public.notification_email_settings
            WHERE notification_type = '__future_unknown_type__'), false) = false AS missing_type_is_default_denied,
  (SELECT count(*) = 27 FROM public.notification_email_settings) AS exact_initial_type_count,
  (SELECT count(*) = 16 FROM public.notification_email_settings WHERE email_enabled) AS exact_initial_enabled_count,
  (SELECT count(*) = 11 FROM public.notification_email_settings WHERE NOT email_enabled) AS exact_initial_disabled_count;

WITH expected(notification_type, email_enabled) AS (
  VALUES
    ('membership_created', true),
    ('membership_assigned', true),
    ('membership_forwarded', true),
    ('membership_processing', true),
    ('membership_completed', true),
    ('trainer_assigned', true),
    ('trainer_removed', true),
    ('trainer_changed', true),
    ('player_assigned', true),
    ('team_changed', true),
    ('membership_payment_overdue', true),
    ('membership_payment_partial_open', true),
    ('member_activated', true),
    ('member_deactivated', true),
    ('member_archived', true),
    ('event_updated', true),
    ('player_removed', false),
    ('player_updated', false),
    ('membership_payment_created', false),
    ('membership_payment_updated', false),
    ('membership_payment_received', false),
    ('membership_payment_deleted', false),
    ('membership_payment_due_soon', false),
    ('membership_payment_due_today', false),
    ('membership_payment_deferral_ending', false),
    ('event_created', false),
    ('event_cancelled', false)
), mismatches AS (
  (SELECT * FROM expected EXCEPT SELECT notification_type, email_enabled FROM public.notification_email_settings)
  UNION ALL
  (SELECT notification_type, email_enabled FROM public.notification_email_settings EXCEPT SELECT * FROM expected)
)
SELECT count(*) = 0 AS exact_type_key_and_value_matrix,
       count(*) AS missing_unexpected_or_wrong_value_count
FROM mismatches;

-- Compare with the manually confirmed D8 preflight baseline; no notification content is returned.
SELECT type AS notification_type, count(*) AS row_count
FROM public.notifications
GROUP BY type
ORDER BY type;

SELECT
  count(*) = 5 AS exact_preflight_notification_count,
  count(*) FILTER (WHERE type = 'membership_created') = 3 AS exact_membership_created_count,
  count(*) FILTER (WHERE type = 'membership_forwarded') = 2 AS exact_membership_forwarded_count,
  count(*) FILTER (WHERE type NOT IN ('membership_created', 'membership_forwarded')) = 0 AS no_unexpected_notification_types
FROM public.notifications;

SELECT status, channel, count(*) AS delivery_count
FROM public.notification_deliveries
GROUP BY status, channel
ORDER BY status, channel;

SELECT
  count(*) = 1 AS exact_preflight_delivery_count,
  count(*) FILTER (WHERE channel = 'email' AND status = 'sent') = 1 AS exact_sent_email_delivery_count,
  count(*) FILTER (WHERE channel <> 'email' OR status <> 'sent') = 0 AS no_unexpected_delivery_states
FROM public.notification_deliveries;

SELECT count(*) AS duplicate_notification_idempotency_groups
FROM (
  SELECT recipient_user_id, type, metadata->>'idempotencyKey'
  FROM public.notifications
  WHERE nullif(metadata->>'idempotencyKey', '') IS NOT NULL
  GROUP BY recipient_user_id, type, metadata->>'idempotencyKey'
  HAVING count(*) > 1
) duplicates;

SELECT
  count(*) FILTER (WHERE recipient_user_id IS NULL) AS missing_recipient_count,
  count(*) FILTER (WHERE nullif(metadata->>'idempotencyKey', '') IS NULL) AS missing_idempotency_key_count
FROM public.notifications;
