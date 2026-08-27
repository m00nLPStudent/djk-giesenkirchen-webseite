-- B15.21D8 proposal only. Do not execute automatically.
-- Execute only after the read-only preflight was reviewed and explicitly approved.
BEGIN;

DO $$
BEGIN
  IF to_regclass('public.notifications') IS NULL THEN
    RAISE EXCEPTION 'public.notifications is missing';
  END IF;
  IF to_regclass('public.notification_deliveries') IS NULL THEN
    RAISE EXCEPTION 'public.notification_deliveries is missing';
  END IF;
  IF to_regclass('public.admin_profiles') IS NULL THEN
    RAISE EXCEPTION 'public.admin_profiles is missing';
  END IF;
  IF to_regprocedure('public.set_updated_at()') IS NULL THEN
    RAISE EXCEPTION 'public.set_updated_at() is missing';
  END IF;
  IF to_regrole('anon') IS NULL OR to_regrole('authenticated') IS NULL OR to_regrole('service_role') IS NULL THEN
    RAISE EXCEPTION 'one or more required Supabase roles are missing';
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'admin_profiles'
      AND column_name = 'id' AND udt_name = 'uuid'
  ) THEN
    RAISE EXCEPTION 'public.admin_profiles.id is missing or is not uuid';
  END IF;
  IF to_regclass('public.notification_email_settings') IS NOT NULL THEN
    RAISE EXCEPTION 'public.notification_email_settings already exists; stop and review';
  END IF;
  IF to_regclass('public.notification_email_global_settings') IS NOT NULL THEN
    RAISE EXCEPTION 'public.notification_email_global_settings already exists; stop and review';
  END IF;
END $$;

CREATE TABLE public.notification_email_settings (
  notification_type text PRIMARY KEY,
  email_enabled boolean NOT NULL DEFAULT false,
  updated_by uuid NULL REFERENCES public.admin_profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notification_email_settings_type_check CHECK (
    notification_type = btrim(notification_type)
    AND char_length(notification_type) BETWEEN 1 AND 100
    AND notification_type ~ '^[a-z][a-z0-9_]*$'
  )
);

CREATE TABLE public.notification_email_global_settings (
  setting_key text PRIMARY KEY,
  email_delivery_enabled boolean NOT NULL DEFAULT false,
  updated_by uuid NULL REFERENCES public.admin_profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notification_email_global_settings_singleton_check CHECK (setting_key = 'global')
);

CREATE TRIGGER notification_email_settings_set_updated_at
  BEFORE UPDATE ON public.notification_email_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER notification_email_global_settings_set_updated_at
  BEFORE UPDATE ON public.notification_email_global_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.notification_email_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_email_global_settings ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public.notification_email_settings FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.notification_email_global_settings FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.notification_email_settings TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.notification_email_global_settings TO service_role;

-- The master switch starts OFF. Installing the schema can therefore never start a mail flood.
INSERT INTO public.notification_email_global_settings (setting_key, email_delivery_enabled)
VALUES ('global', false);

-- Explicit initial recommendation. Missing/future type rows remain denied by application policy.
INSERT INTO public.notification_email_settings (notification_type, email_enabled) VALUES
  ('membership_created', true),
  ('membership_assigned', true),
  ('membership_forwarded', true),
  ('membership_completed', true),
  ('trainer_assigned', true),
  ('trainer_removed', true),
  ('trainer_changed', true),
  ('player_assigned', true),
  ('team_changed', true),
  ('membership_processing', true),
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
  ('event_cancelled', false);

COMMENT ON TABLE public.notification_email_settings IS
  'B15.21D8 server-only global per-notification-type e-mail enablement. Missing rows are default-deny.';
COMMENT ON TABLE public.notification_email_global_settings IS
  'B15.21D8 server-only singleton master switch for all notification e-mail delivery; initially disabled.';

COMMIT;
