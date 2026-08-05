-- Read-only verification.
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'notifications'
  AND indexname = 'notifications_recipient_type_idempotency_unique';

SELECT count(*) AS duplicate_group_count
FROM (
  SELECT 1 FROM public.notifications
  WHERE nullif(metadata->>'idempotencyKey', '') IS NOT NULL
  GROUP BY recipient_user_id, type, metadata->>'idempotencyKey'
  HAVING count(*) > 1
) duplicates;

