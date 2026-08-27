-- B15.21D4 proposal only. Do not execute automatically.
-- Execute only after the read-only preflight was reviewed and explicitly approved.
BEGIN;

DO $$
BEGIN
  IF to_regclass('public.notifications') IS NULL THEN
    RAISE EXCEPTION 'public.notifications is missing';
  END IF;
  IF to_regprocedure('public.set_updated_at()') IS NULL THEN
    RAISE EXCEPTION 'public.set_updated_at() is missing';
  END IF;
  IF to_regclass('public.notification_deliveries') IS NOT NULL THEN
    RAISE EXCEPTION 'public.notification_deliveries already exists; stop and review';
  END IF;
END $$;

CREATE TABLE public.notification_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('email')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed', 'skipped')),
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count BETWEEN 0 AND 100),
  provider_key text NULL CHECK (provider_key IS NULL OR char_length(provider_key) <= 50),
  provider_message_id text NULL CHECK (provider_message_id IS NULL OR char_length(provider_message_id) <= 300),
  last_error_class text NULL CHECK (last_error_class IS NULL OR char_length(last_error_class) <= 100),
  locked_at timestamptz NULL,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notification_deliveries_notification_channel_key UNIQUE (notification_id, channel),
  CONSTRAINT notification_deliveries_sent_state_check CHECK (
    (status = 'sent' AND sent_at IS NOT NULL) OR (status <> 'sent' AND sent_at IS NULL)
  ),
  CONSTRAINT notification_deliveries_lock_state_check CHECK (
    (status = 'sending' AND locked_at IS NOT NULL) OR (status <> 'sending' AND locked_at IS NULL)
  ),
  CONSTRAINT notification_deliveries_attempt_state_check CHECK (
    (status IN ('sending', 'sent', 'failed') AND attempt_count >= 1)
    OR status IN ('pending', 'skipped')
  ),
  CONSTRAINT notification_deliveries_provider_message_state_check CHECK (
    provider_message_id IS NULL OR status = 'sent'
  )
);

CREATE INDEX notification_deliveries_pending_idx
  ON public.notification_deliveries (next_attempt_at, created_at)
  WHERE status IN ('pending', 'failed');

CREATE TRIGGER notification_deliveries_set_updated_at
  BEFORE UPDATE ON public.notification_deliveries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.notification_deliveries ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public.notification_deliveries FROM PUBLIC, anon, authenticated;
GRANT ALL PRIVILEGES ON TABLE public.notification_deliveries TO service_role;

COMMENT ON TABLE public.notification_deliveries IS
  'B15.21D4 server-only operational delivery ledger for notification channels. Dashboard notification content remains in public.notifications; immutable monitoring remains in public.notification_audit.';

COMMIT;
