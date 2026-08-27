-- B15.21D4 rollback proposal only. Do not execute automatically.
-- This removes only the D4 operational delivery ledger and its rows.
BEGIN;

DO $$
DECLARE
  relation_comment text;
BEGIN
  IF to_regclass('public.notification_deliveries') IS NULL THEN
    RETURN;
  END IF;
  SELECT obj_description('public.notification_deliveries'::regclass, 'pg_class') INTO relation_comment;
  IF relation_comment IS DISTINCT FROM
    'B15.21D4 server-only operational delivery ledger for notification channels. Dashboard notification content remains in public.notifications; immutable monitoring remains in public.notification_audit.'
  THEN
    RAISE EXCEPTION 'public.notification_deliveries is not marked as the B15.21D4 table; stop and review';
  END IF;
  DROP TABLE public.notification_deliveries;
END $$;

COMMIT;
