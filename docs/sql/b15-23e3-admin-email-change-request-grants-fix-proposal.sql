-- B15.23E3.2 minimal grants fix proposal. Do not execute automatically.
-- The live table already grants service_role CRUD plus three unneeded privileges.
BEGIN;

DO $$
BEGIN
  IF to_regclass('public.admin_email_change_requests') IS NULL THEN
    RAISE EXCEPTION 'public.admin_email_change_requests is missing; stop and review';
  END IF;
END $$;

REVOKE REFERENCES, TRIGGER, TRUNCATE
ON TABLE public.admin_email_change_requests
FROM service_role;

COMMIT;
