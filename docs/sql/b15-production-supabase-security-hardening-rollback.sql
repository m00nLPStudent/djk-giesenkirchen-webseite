-- B15 - Productive Supabase security hardening
-- Phase 3: rollback to the confirmed 14-result-set live baseline.
-- MANUAL EXECUTION ONLY if the matching proposal must be reverted.

BEGIN;

DO $guard$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'club_settings'
      AND policyname = 'club_settings_public_read'
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'news_documents'
      AND policyname = 'news_documents_public_read'
  ) THEN
    RAISE EXCEPTION 'Hardened policy baseline not found; rollback aborted';
  END IF;
END
$guard$;

-- Remove the additive transition guard (it did not exist in the preflight).
DROP TRIGGER news_enforce_publication_transition ON public.news;
DROP FUNCTION public.enforce_news_publication_transition();

-- Remove hardened policies.
DROP POLICY club_settings_public_read ON public.club_settings;
DROP POLICY club_settings_insert_settings_edit ON public.club_settings;
DROP POLICY club_settings_update_settings_edit ON public.club_settings;
DROP POLICY club_settings_delete_settings_edit ON public.club_settings;

DROP POLICY membership_request_recipients_select_authorized ON public.membership_request_recipients;
DROP POLICY membership_request_recipients_insert_authorized ON public.membership_request_recipients;
DROP POLICY membership_request_recipients_update_authorized ON public.membership_request_recipients;
DROP POLICY membership_request_recipients_delete_authorized ON public.membership_request_recipients;

DROP POLICY pages_public_read_published ON public.pages;
DROP POLICY pages_authenticated_read ON public.pages;
DROP POLICY pages_insert_settings_edit ON public.pages;
DROP POLICY pages_update_settings_edit ON public.pages;
DROP POLICY pages_delete_settings_edit ON public.pages;

DROP POLICY events_public_read_published ON public.events;
DROP POLICY events_authenticated_read ON public.events;

DROP POLICY news_public_read_published ON public.news;
DROP POLICY news_authenticated_read ON public.news;
DROP POLICY news_insert_authorized ON public.news;
DROP POLICY news_update_authorized ON public.news;
DROP POLICY news_delete_authorized ON public.news;

DROP POLICY news_documents_public_read ON public.news_documents;
DROP POLICY news_documents_authenticated_read ON public.news_documents;
DROP POLICY news_documents_insert_authorized ON public.news_documents;
DROP POLICY news_documents_update_authorized ON public.news_documents;
DROP POLICY news_documents_delete_authorized ON public.news_documents;

-- Restore the exact preflight policies.
CREATE POLICY club_settings_delete_admin ON public.club_settings
  FOR DELETE TO PUBLIC
  USING (auth.role() = 'authenticated' AND auth.jwt()->'app_metadata'->>'role' = 'admin');
CREATE POLICY club_settings_insert_admin ON public.club_settings
  FOR INSERT TO PUBLIC
  WITH CHECK (auth.role() = 'authenticated' AND auth.jwt()->'app_metadata'->>'role' = 'admin');
CREATE POLICY club_settings_read_all ON public.club_settings
  FOR SELECT TO PUBLIC USING (true);
CREATE POLICY club_settings_update_admin ON public.club_settings
  FOR UPDATE TO PUBLIC
  USING (auth.role() = 'authenticated' AND auth.jwt()->'app_metadata'->>'role' = 'admin')
  WITH CHECK (auth.role() = 'authenticated' AND auth.jwt()->'app_metadata'->>'role' = 'admin');

CREATE POLICY membership_request_recipients_delete_admin
  ON public.membership_request_recipients FOR DELETE TO PUBLIC
  USING (auth.role() = 'authenticated' AND auth.jwt()->'app_metadata'->>'role' = 'admin');
CREATE POLICY membership_request_recipients_insert_admin
  ON public.membership_request_recipients FOR INSERT TO PUBLIC
  WITH CHECK (auth.role() = 'authenticated' AND auth.jwt()->'app_metadata'->>'role' = 'admin');
CREATE POLICY membership_request_recipients_select_admin
  ON public.membership_request_recipients FOR SELECT TO PUBLIC
  USING (auth.role() = 'authenticated' AND auth.jwt()->'app_metadata'->>'role' = 'admin');
CREATE POLICY membership_request_recipients_update_admin
  ON public.membership_request_recipients FOR UPDATE TO PUBLIC
  USING (auth.role() = 'authenticated' AND auth.jwt()->'app_metadata'->>'role' = 'admin')
  WITH CHECK (auth.role() = 'authenticated' AND auth.jwt()->'app_metadata'->>'role' = 'admin');

CREATE POLICY pages_delete_dev ON public.pages FOR DELETE TO anon, authenticated USING (true);
CREATE POLICY pages_insert_dev ON public.pages FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY pages_read_published ON public.pages FOR SELECT TO PUBLIC USING (is_published = true);
CREATE POLICY pages_update_dev ON public.pages FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY events_admin_delete ON public.events FOR DELETE TO anon, authenticated USING (true);
CREATE POLICY events_admin_insert ON public.events FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY events_admin_update ON public.events FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY events_public_read_published ON public.events FOR SELECT TO anon, authenticated USING (is_published = true);

CREATE POLICY "Public can delete news" ON public.news FOR DELETE TO PUBLIC USING (true);
CREATE POLICY "Public can insert news" ON public.news FOR INSERT TO PUBLIC WITH CHECK (true);
CREATE POLICY "Public can read news" ON public.news FOR SELECT TO PUBLIC USING (true);
CREATE POLICY "Public can update news" ON public.news FOR UPDATE TO PUBLIC USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon delete news documents" ON public.news_documents FOR DELETE TO anon USING (true);
CREATE POLICY "Allow anon insert news documents" ON public.news_documents FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update news documents" ON public.news_documents FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated delete news documents" ON public.news_documents FOR DELETE TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert news documents" ON public.news_documents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update news documents" ON public.news_documents FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read news documents" ON public.news_documents FOR SELECT TO PUBLIC USING (is_public = true);

-- Restore all seven preflight table privileges for all three Data-API roles.
GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE
  public.club_settings,
  public.membership_request_recipients,
  public.pages,
  public.events,
  public.news,
  public.news_documents
TO anon, authenticated, service_role;

-- Restore original ineffective RLS status on the three critical tables.
ALTER TABLE public.club_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_request_recipients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages DISABLE ROW LEVEL SECURITY;

-- Restore effective helper configuration and EXECUTE baseline.
ALTER FUNCTION public.is_superadmin_actor() SET search_path = public;
GRANT EXECUTE ON FUNCTION public.is_superadmin_actor() TO PUBLIC;

COMMIT;
