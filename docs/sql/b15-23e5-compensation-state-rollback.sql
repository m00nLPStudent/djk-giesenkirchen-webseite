-- B15.23E5.2.4: fail-closed rollback of the unused compensation state.
-- MANUAL EXECUTION ONLY. Audit-bearing compensation rows block this rollback.

BEGIN;

DO $preflight$
BEGIN
  IF to_regclass('public.admin_email_change_requests') IS NULL THEN
    RAISE EXCEPTION 'admin_email_change_requests is missing; stop';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='admin_email_change_requests'
      AND column_name='compensation_started_at'
      AND data_type='timestamp with time zone' AND is_nullable='YES'
  ) THEN RAISE EXCEPTION 'compensation column contract missing; stop'; END IF;
  IF EXISTS (SELECT 1 FROM public.admin_email_change_requests WHERE status='compensating') THEN
    RAISE EXCEPTION 'active compensation exists; preserve state and stop';
  END IF;
  IF EXISTS (SELECT 1 FROM public.admin_email_change_requests
             WHERE status='failed' AND compensation_started_at IS NOT NULL) THEN
    RAISE EXCEPTION 'compensation audit data exists; preserve audit and stop';
  END IF;
  IF EXISTS (SELECT 1 FROM public.admin_email_change_requests
             WHERE status NOT IN ('pending','confirming','compensating','completed','cancelled','expired','failed')) THEN
    RAISE EXCEPTION 'unknown status exists; stop';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    WHERE c.conrelid=to_regclass('public.admin_email_change_requests')
      AND c.conname='admin_email_change_requests_status_check'
      AND pg_get_constraintdef(c.oid,true) ILIKE '%compensating%'
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    WHERE c.conrelid=to_regclass('public.admin_email_change_requests')
      AND c.conname='admin_email_change_requests_state_check'
      AND pg_get_constraintdef(c.oid,true) ILIKE '%compensation_started_at%'
  ) THEN RAISE EXCEPTION 'unexpected migrated constraint contract; stop'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_index i JOIN pg_class x ON x.oid=i.indexrelid
    WHERE i.indrelid=to_regclass('public.admin_email_change_requests')
      AND x.relname='admin_email_change_requests_one_active_user_idx'
      AND i.indisunique AND i.indisvalid
      AND pg_get_indexdef(i.indexrelid) ILIKE '%compensating%'
  ) THEN RAISE EXCEPTION 'unexpected migrated index contract; stop'; END IF;
END
$preflight$;

DROP INDEX public.admin_email_change_requests_one_active_user_idx;

ALTER TABLE public.admin_email_change_requests
  DROP CONSTRAINT admin_email_change_requests_status_check,
  DROP CONSTRAINT admin_email_change_requests_state_check;

ALTER TABLE public.admin_email_change_requests
  DROP COLUMN compensation_started_at;

ALTER TABLE public.admin_email_change_requests
  ADD CONSTRAINT admin_email_change_requests_status_check CHECK (
    status IN ('pending','confirming','completed','cancelled','expired','failed')
  ),
  ADD CONSTRAINT admin_email_change_requests_state_check CHECK (
    (status='pending' AND confirmed_at IS NULL AND cancelled_at IS NULL AND expired_at IS NULL AND completed_at IS NULL AND locked_at IS NULL AND failure_code IS NULL)
    OR (status='confirming' AND confirmed_at IS NOT NULL AND cancelled_at IS NULL AND expired_at IS NULL AND completed_at IS NULL AND locked_at IS NOT NULL AND failure_code IS NULL)
    OR (status='completed' AND confirmed_at IS NOT NULL AND cancelled_at IS NULL AND expired_at IS NULL AND completed_at IS NOT NULL AND locked_at IS NULL AND failure_code IS NULL)
    OR (status='cancelled' AND cancelled_at IS NOT NULL AND expired_at IS NULL AND completed_at IS NULL AND locked_at IS NULL AND failure_code IS NULL)
    OR (status='expired' AND confirmed_at IS NULL AND cancelled_at IS NULL AND expired_at IS NOT NULL AND completed_at IS NULL AND locked_at IS NULL AND failure_code IS NULL)
    OR (status='failed' AND cancelled_at IS NULL AND expired_at IS NULL AND completed_at IS NULL AND locked_at IS NULL AND failure_code IS NOT NULL)
  );

CREATE UNIQUE INDEX admin_email_change_requests_one_active_user_idx
  ON public.admin_email_change_requests(user_id)
  WHERE status IN ('pending','confirming');

COMMIT;
