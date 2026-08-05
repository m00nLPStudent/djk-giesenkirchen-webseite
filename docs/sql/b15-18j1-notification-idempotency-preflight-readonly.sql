-- Read-only. Run before the hardening proposal. No message text or personal clear data.
SELECT
  metadata->>'idempotencyKey' AS idempotency_key,
  recipient_user_id,
  type AS notification_type,
  count(*) AS row_count,
  min(created_at) AS earliest_created_at,
  max(created_at) AS latest_created_at
FROM public.notifications
WHERE nullif(metadata->>'idempotencyKey', '') IS NOT NULL
GROUP BY recipient_user_id, type, metadata->>'idempotencyKey'
HAVING count(*) > 1
ORDER BY row_count DESC, earliest_created_at;

