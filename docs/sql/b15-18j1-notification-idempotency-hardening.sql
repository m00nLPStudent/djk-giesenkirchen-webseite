-- Proposal only. Do not execute automatically.
-- STOP if the read-only preflight returns rows. No automatic cleanup is performed.
BEGIN;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.notifications
    WHERE nullif(metadata->>'idempotencyKey', '') IS NOT NULL
    GROUP BY recipient_user_id, type, metadata->>'idempotencyKey'
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate notification idempotency keys exist; stop and review the separate cleanup strategy.';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS notifications_recipient_type_idempotency_unique
ON public.notifications (recipient_user_id, type, (metadata->>'idempotencyKey'))
WHERE nullif(metadata->>'idempotencyKey', '') IS NOT NULL;
COMMIT;

