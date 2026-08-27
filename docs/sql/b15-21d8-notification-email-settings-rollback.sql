-- B15.21D8 rollback proposal only. Do not execute automatically.
-- This removes only the two D8 settings structures and their rows.
BEGIN;

DO $$
DECLARE
  type_comment text;
  global_comment text;
BEGIN
  IF to_regclass('public.notification_email_settings') IS NOT NULL THEN
    SELECT obj_description('public.notification_email_settings'::regclass, 'pg_class') INTO type_comment;
    IF type_comment IS DISTINCT FROM
      'B15.21D8 server-only global per-notification-type e-mail enablement. Missing rows are default-deny.'
    THEN
      RAISE EXCEPTION 'public.notification_email_settings is not marked as the B15.21D8 table; stop and review';
    END IF;
  END IF;

  IF to_regclass('public.notification_email_global_settings') IS NOT NULL THEN
    SELECT obj_description('public.notification_email_global_settings'::regclass, 'pg_class') INTO global_comment;
    IF global_comment IS DISTINCT FROM
      'B15.21D8 server-only singleton master switch for all notification e-mail delivery; initially disabled.'
    THEN
      RAISE EXCEPTION 'public.notification_email_global_settings is not marked as the B15.21D8 table; stop and review';
    END IF;
  END IF;

  DROP TABLE IF EXISTS public.notification_email_settings;
  DROP TABLE IF EXISTS public.notification_email_global_settings;
END $$;

COMMIT;
