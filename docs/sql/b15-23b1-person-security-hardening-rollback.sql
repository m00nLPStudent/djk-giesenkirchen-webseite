-- B15.23B1 rollback. MANUAL EXECUTION ONLY.
-- Restores the confirmed pre-B15.23B1 effective security baseline; changes no rows.
BEGIN;

DO $guard$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class c WHERE c.oid='public.coaches'::regclass AND c.relrowsecurity AND NOT c.relforcerowsecurity)
     OR NOT EXISTS (SELECT 1 FROM pg_class c WHERE c.oid='public.board_members'::regclass AND c.relrowsecurity AND NOT c.relforcerowsecurity)
     OR NOT EXISTS (SELECT 1 FROM pg_class c WHERE c.oid='public.club_contacts'::regclass AND c.relrowsecurity AND NOT c.relforcerowsecurity) THEN
    RAISE EXCEPTION 'B15.23B1 rollback aborted: unexpected RLS state';
  END IF;
  IF (SELECT count(*) FROM pg_policies WHERE schemaname='public' AND policyname IN (
      'coaches_public_read_active','coaches_admin_read','coaches_admin_insert','coaches_admin_update','coaches_admin_delete',
      'board_members_public_read_active','board_members_admin_read','board_members_admin_insert','board_members_admin_update',
      'club_contacts_public_read_active','club_contacts_admin_read','club_contacts_admin_insert','club_contacts_admin_update','club_contacts_admin_delete'
    )) <> 14 THEN
    RAISE EXCEPTION 'B15.23B1 rollback aborted: hardened policy set is incomplete';
  END IF;
  IF has_table_privilege('anon','public.coaches','INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
     OR has_table_privilege('anon','public.board_members','INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
     OR has_table_privilege('anon','public.club_contacts','INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') THEN
    RAISE EXCEPTION 'B15.23B1 rollback aborted: anon write baseline is not hardened';
  END IF;
  IF has_function_privilege('anon','public.remove_entity(text,uuid)','EXECUTE')
     OR has_function_privilege('authenticated','public.remove_entity(text,uuid)','EXECUTE')
     OR has_function_privilege('anon','public.synchronize_media_assignment(text,uuid,uuid,text)','EXECUTE')
     OR has_function_privilege('authenticated','public.synchronize_media_assignment(text,uuid,uuid,text)','EXECUTE') THEN
    RAISE EXCEPTION 'B15.23B1 rollback aborted: RPC contract changed';
  END IF;
END
$guard$;

DROP POLICY coaches_public_read_active ON public.coaches;
DROP POLICY coaches_admin_read ON public.coaches;
DROP POLICY coaches_admin_insert ON public.coaches;
DROP POLICY coaches_admin_update ON public.coaches;
DROP POLICY coaches_admin_delete ON public.coaches;
DROP POLICY board_members_public_read_active ON public.board_members;
DROP POLICY board_members_admin_read ON public.board_members;
DROP POLICY board_members_admin_insert ON public.board_members;
DROP POLICY board_members_admin_update ON public.board_members;
DROP POLICY club_contacts_public_read_active ON public.club_contacts;
DROP POLICY club_contacts_admin_read ON public.club_contacts;
DROP POLICY club_contacts_admin_insert ON public.club_contacts;
DROP POLICY club_contacts_admin_update ON public.club_contacts;
DROP POLICY club_contacts_admin_delete ON public.club_contacts;

CREATE POLICY "Allow public insert coaches" ON public.coaches FOR INSERT TO PUBLIC WITH CHECK (true);
CREATE POLICY "Allow public update coaches" ON public.coaches FOR UPDATE TO PUBLIC USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete coaches" ON public.coaches FOR DELETE TO PUBLIC USING (true);
CREATE POLICY "Allow public select coaches" ON public.coaches FOR SELECT TO PUBLIC USING (true);
CREATE POLICY "Public can read coaches" ON public.coaches FOR SELECT TO PUBLIC USING (is_active = true);

CREATE POLICY board_members_insert_all ON public.board_members FOR INSERT TO PUBLIC WITH CHECK (true);
CREATE POLICY board_members_update_all ON public.board_members FOR UPDATE TO PUBLIC USING (true) WITH CHECK (true);
CREATE POLICY board_members_delete_all ON public.board_members FOR DELETE TO PUBLIC USING (true);
CREATE POLICY board_members_select_all ON public.board_members FOR SELECT TO PUBLIC USING (true);

CREATE POLICY club_contacts_insert_admin ON public.club_contacts FOR INSERT TO PUBLIC
WITH CHECK (auth.role()='authenticated' AND auth.jwt()->'app_metadata'->>'role'='admin');
CREATE POLICY club_contacts_update_admin ON public.club_contacts FOR UPDATE TO PUBLIC
USING (auth.role()='authenticated' AND auth.jwt()->'app_metadata'->>'role'='admin')
WITH CHECK (auth.role()='authenticated' AND auth.jwt()->'app_metadata'->>'role'='admin');
CREATE POLICY club_contacts_delete_admin ON public.club_contacts FOR DELETE TO PUBLIC
USING (auth.role()='authenticated' AND auth.jwt()->'app_metadata'->>'role'='admin');
CREATE POLICY club_contacts_read_public_active ON public.club_contacts FOR SELECT TO PUBLIC
USING (is_public=true AND is_active=true);

ALTER TABLE public.club_contacts DISABLE ROW LEVEL SECURITY;

GRANT ALL PRIVILEGES ON TABLE public.coaches, public.board_members, public.club_contacts TO anon, authenticated, service_role;

COMMIT;
