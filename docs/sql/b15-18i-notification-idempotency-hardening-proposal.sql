-- SUPERSEDED by b15-18j1-notification-idempotency-hardening.sql.
-- Kept as the B15.18I design record; do not execute this older proposal.
-- Closes the proven race between duplicate lookup and concurrent inserts.
BEGIN;
CREATE UNIQUE INDEX notifications_recipient_type_idempotency_unique
ON public.notifications (recipient_user_id, type, (metadata->>'idempotencyKey'))
WHERE nullif(metadata->>'idempotencyKey','') IS NOT NULL;
COMMIT;
-- Coordinated application change required before execution: the central insert
-- repository must treat unique_violation as an idempotent duplicate, not as a
-- domain failure. Existing duplicate keys must be checked before index creation.
