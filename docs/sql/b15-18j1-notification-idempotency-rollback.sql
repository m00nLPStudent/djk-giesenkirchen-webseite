-- Optional technical rollback. Removes only the atomic idempotency index.
-- Do not run while concurrent scheduler deliveries are active.
DROP INDEX IF EXISTS public.notifications_recipient_type_idempotency_unique;
