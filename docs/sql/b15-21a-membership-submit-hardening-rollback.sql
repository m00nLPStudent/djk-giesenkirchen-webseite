-- B15.21A access rollback proposal. DO NOT RUN AUTOMATICALLY.
-- SECURITY DOWNGRADE: restores the confirmed insecure live access model.
-- Consent columns and evidence are intentionally preserved to avoid data loss.

BEGIN;

ALTER TABLE public.membership_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_requests NO FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS membership_requests_insert_public ON public.membership_requests;
DROP POLICY IF EXISTS membership_requests_select_admin ON public.membership_requests;
DROP POLICY IF EXISTS membership_requests_update_admin ON public.membership_requests;
DROP POLICY IF EXISTS membership_requests_delete_admin ON public.membership_requests;

CREATE POLICY membership_requests_insert_public
  ON public.membership_requests FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY membership_requests_select_admin
  ON public.membership_requests FOR SELECT TO public
  USING (auth.role() = 'authenticated' AND auth.jwt()->'app_metadata'->>'role' = 'admin');

CREATE POLICY membership_requests_update_admin
  ON public.membership_requests FOR UPDATE TO public
  USING (auth.role() = 'authenticated' AND auth.jwt()->'app_metadata'->>'role' = 'admin')
  WITH CHECK (auth.role() = 'authenticated' AND auth.jwt()->'app_metadata'->>'role' = 'admin');

CREATE POLICY membership_requests_delete_admin
  ON public.membership_requests FOR DELETE TO public
  USING (auth.role() = 'authenticated' AND auth.jwt()->'app_metadata'->>'role' = 'admin');

GRANT ALL PRIVILEGES ON TABLE public.membership_requests TO anon, authenticated, service_role;

COMMIT;
