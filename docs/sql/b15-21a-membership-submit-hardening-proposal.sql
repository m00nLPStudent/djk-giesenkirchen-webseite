-- B15.21A final proposal. DO NOT RUN AUTOMATICALLY.
-- Verified against the live preflight from 2026-08-26:
-- RLS disabled; anon/authenticated have broad table and column privileges.

BEGIN;

-- These columns are intentionally non-idempotent: the confirmed live schema does
-- not contain them. Unexpected schema drift must abort instead of being hidden.
ALTER TABLE public.membership_requests
  ADD COLUMN privacy_consent boolean NOT NULL DEFAULT false,
  ADD COLUMN privacy_consent_at timestamptz,
  ADD COLUMN privacy_policy_version text;

ALTER TABLE public.membership_requests
  ADD CONSTRAINT membership_requests_privacy_consent_evidence_check CHECK (
    (privacy_consent = false AND privacy_consent_at IS NULL AND privacy_policy_version IS NULL)
    OR
    (privacy_consent = true AND privacy_consent_at IS NOT NULL AND nullif(btrim(privacy_policy_version), '') IS NOT NULL)
  );

-- The historical app_metadata role policies are not part of the current
-- permission architecture and must not become active when RLS is enabled.
DROP POLICY IF EXISTS membership_requests_insert_public ON public.membership_requests;
DROP POLICY IF EXISTS membership_requests_select_admin ON public.membership_requests;
DROP POLICY IF EXISTS membership_requests_update_admin ON public.membership_requests;
DROP POLICY IF EXISTS membership_requests_delete_admin ON public.membership_requests;

ALTER TABLE public.membership_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_requests NO FORCE ROW LEVEL SECURITY;

-- Browser roles receive no direct table access. This removes SELECT, INSERT,
-- UPDATE, DELETE, TRUNCATE, REFERENCES and TRIGGER in one operation.
REVOKE ALL PRIVILEGES ON TABLE public.membership_requests FROM PUBLIC, anon, authenticated;

-- Also remove independently granted column privileges. Table-level REVOKE does
-- not necessarily revoke grants made explicitly on individual columns.
DO $block$
DECLARE
  all_columns text;
BEGIN
  SELECT string_agg(quote_ident(a.attname), ', ' ORDER BY a.attnum)
  INTO all_columns
  FROM pg_attribute a
  WHERE a.attrelid = 'public.membership_requests'::regclass
    AND a.attnum > 0
    AND NOT a.attisdropped;

  IF all_columns IS NOT NULL THEN
    EXECUTE format(
      'REVOKE SELECT (%s), INSERT (%s), UPDATE (%s), REFERENCES (%s) ON TABLE public.membership_requests FROM PUBLIC, anon, authenticated',
      all_columns,
      all_columns,
      all_columns,
      all_columns
    );
  END IF;
END
$block$;

-- All application reads and writes occur only after server-side authorization.
-- service_role keeps the complete access required by submit and admin workflows.
GRANT ALL PRIVILEGES ON TABLE public.membership_requests TO service_role;

COMMIT;
