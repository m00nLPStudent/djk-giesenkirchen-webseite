-- B15.23B1 proposal. MANUAL EXECUTION ONLY.
-- Hardens legacy person tables without changing rows or the role matrix.
BEGIN;

DO $guard$
DECLARE
  target text;
  privilege_name text;
  expected_policies text[];
BEGIN
  IF to_regclass('public.coaches') IS NULL
     OR to_regclass('public.board_members') IS NULL
     OR to_regclass('public.club_contacts') IS NULL THEN
    RAISE EXCEPTION 'B15.23B1 aborted: target table missing';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_class c WHERE c.oid='public.coaches'::regclass AND c.relrowsecurity AND NOT c.relforcerowsecurity)
     OR NOT EXISTS (SELECT 1 FROM pg_class c WHERE c.oid='public.board_members'::regclass AND c.relrowsecurity AND NOT c.relforcerowsecurity)
     OR NOT EXISTS (SELECT 1 FROM pg_class c WHERE c.oid='public.club_contacts'::regclass AND NOT c.relrowsecurity AND NOT c.relforcerowsecurity) THEN
    RAISE EXCEPTION 'B15.23B1 aborted: unexpected RLS baseline';
  END IF;

  expected_policies := ARRAY[
    'Allow public insert coaches','Allow public update coaches','Allow public delete coaches',
    'Allow public select coaches','Public can read coaches',
    'board_members_insert_all','board_members_update_all','board_members_delete_all','board_members_select_all',
    'club_contacts_insert_admin','club_contacts_update_admin','club_contacts_delete_admin','club_contacts_read_public_active'
  ];
  IF EXISTS (
    SELECT 1 FROM unnest(expected_policies) expected(policyname)
    WHERE NOT EXISTS (
      SELECT 1 FROM pg_policies p
      WHERE p.schemaname='public'
        AND p.policyname=expected.policyname
        AND p.tablename = CASE
          WHEN expected.policyname LIKE 'Allow public%' OR expected.policyname='Public can read coaches' THEN 'coaches'
          WHEN expected.policyname LIKE 'board_members%' THEN 'board_members'
          ELSE 'club_contacts'
        END
    )
  ) THEN
    RAISE EXCEPTION 'B15.23B1 aborted: expected live policy baseline is incomplete';
  END IF;
  IF (SELECT count(*) FROM pg_policies WHERE schemaname='public' AND tablename IN ('coaches','board_members','club_contacts')) <> 13 THEN
    RAISE EXCEPTION 'B15.23B1 aborted: unexpected additional target-table policies';
  END IF;

  FOREACH target IN ARRAY ARRAY['coaches','board_members','club_contacts'] LOOP
    FOREACH privilege_name IN ARRAY ARRAY['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER'] LOOP
      IF NOT has_table_privilege('anon',format('public.%I',target),privilege_name)
         OR NOT has_table_privilege('authenticated',format('public.%I',target),privilege_name)
         OR NOT has_table_privilege('service_role',format('public.%I',target),privilege_name) THEN
        RAISE EXCEPTION 'B15.23B1 aborted: missing baseline privilege % on %', privilege_name, target;
      END IF;
    END LOOP;
  END LOOP;

  IF to_regprocedure('public.remove_entity(text,uuid)') IS NULL
     OR to_regprocedure('public.synchronize_media_assignment(text,uuid,uuid,text)') IS NULL
     OR has_function_privilege('anon','public.remove_entity(text,uuid)','EXECUTE')
     OR has_function_privilege('authenticated','public.remove_entity(text,uuid)','EXECUTE')
     OR NOT has_function_privilege('service_role','public.remove_entity(text,uuid)','EXECUTE')
     OR has_function_privilege('anon','public.synchronize_media_assignment(text,uuid,uuid,text)','EXECUTE')
     OR has_function_privilege('authenticated','public.synchronize_media_assignment(text,uuid,uuid,text)','EXECUTE')
     OR NOT has_function_privilege('service_role','public.synchronize_media_assignment(text,uuid,uuid,text)','EXECUTE') THEN
    RAISE EXCEPTION 'B15.23B1 aborted: unexpected RPC execute baseline';
  END IF;
END
$guard$;

DROP POLICY "Allow public insert coaches" ON public.coaches;
DROP POLICY "Allow public update coaches" ON public.coaches;
DROP POLICY "Allow public delete coaches" ON public.coaches;
DROP POLICY "Allow public select coaches" ON public.coaches;
DROP POLICY "Public can read coaches" ON public.coaches;

DROP POLICY board_members_insert_all ON public.board_members;
DROP POLICY board_members_update_all ON public.board_members;
DROP POLICY board_members_delete_all ON public.board_members;
DROP POLICY board_members_select_all ON public.board_members;

DROP POLICY club_contacts_insert_admin ON public.club_contacts;
DROP POLICY club_contacts_update_admin ON public.club_contacts;
DROP POLICY club_contacts_delete_admin ON public.club_contacts;
DROP POLICY club_contacts_read_public_active ON public.club_contacts;

ALTER TABLE public.coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY coaches_public_read_active ON public.coaches
FOR SELECT TO anon, authenticated
USING (is_active = true);

CREATE POLICY coaches_admin_read ON public.coaches
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.admin_profiles ap
  JOIN public.admin_user_roles ur ON ur.user_id=ap.id
  JOIN public.admin_roles r ON r.id=ur.role_id
  LEFT JOIN public.admin_role_permissions rp ON rp.role_id=r.id
  LEFT JOIN public.admin_permissions p ON p.id=rp.permission_id
  WHERE ap.is_active=true AND r.is_active=true
    AND (ap.id=auth.uid() OR lower(ap.email)=lower(auth.jwt()->>'email'))
    AND (r.key='superadmin' OR p.key IN ('coaches.view','coaches.create','coaches.edit','coaches.delete'))
));

CREATE POLICY coaches_admin_insert ON public.coaches
FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.admin_profiles ap
  JOIN public.admin_user_roles ur ON ur.user_id=ap.id
  JOIN public.admin_roles r ON r.id=ur.role_id
  LEFT JOIN public.admin_role_permissions rp ON rp.role_id=r.id
  LEFT JOIN public.admin_permissions p ON p.id=rp.permission_id
  WHERE ap.is_active=true AND r.is_active=true
    AND (ap.id=auth.uid() OR lower(ap.email)=lower(auth.jwt()->>'email'))
    AND (r.key='superadmin' OR p.key='coaches.create')
));

CREATE POLICY coaches_admin_update ON public.coaches
FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.admin_profiles ap JOIN public.admin_user_roles ur ON ur.user_id=ap.id
  JOIN public.admin_roles r ON r.id=ur.role_id LEFT JOIN public.admin_role_permissions rp ON rp.role_id=r.id
  LEFT JOIN public.admin_permissions p ON p.id=rp.permission_id
  WHERE ap.is_active=true AND r.is_active=true AND (ap.id=auth.uid() OR lower(ap.email)=lower(auth.jwt()->>'email'))
    AND (r.key='superadmin' OR p.key IN ('coaches.edit','coaches.delete'))
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.admin_profiles ap JOIN public.admin_user_roles ur ON ur.user_id=ap.id
  JOIN public.admin_roles r ON r.id=ur.role_id LEFT JOIN public.admin_role_permissions rp ON rp.role_id=r.id
  LEFT JOIN public.admin_permissions p ON p.id=rp.permission_id
  WHERE ap.is_active=true AND r.is_active=true AND (ap.id=auth.uid() OR lower(ap.email)=lower(auth.jwt()->>'email'))
    AND (r.key='superadmin' OR p.key IN ('coaches.edit','coaches.delete'))
));

CREATE POLICY coaches_admin_delete ON public.coaches
FOR DELETE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.admin_profiles ap JOIN public.admin_user_roles ur ON ur.user_id=ap.id
  JOIN public.admin_roles r ON r.id=ur.role_id LEFT JOIN public.admin_role_permissions rp ON rp.role_id=r.id
  LEFT JOIN public.admin_permissions p ON p.id=rp.permission_id
  WHERE ap.is_active=true AND r.is_active=true AND (ap.id=auth.uid() OR lower(ap.email)=lower(auth.jwt()->>'email'))
    AND (r.key='superadmin' OR p.key='coaches.delete')
));

CREATE POLICY board_members_public_read_active ON public.board_members
FOR SELECT TO anon, authenticated USING (is_active = true);

CREATE POLICY board_members_admin_read ON public.board_members
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.admin_profiles ap JOIN public.admin_user_roles ur ON ur.user_id=ap.id
  JOIN public.admin_roles r ON r.id=ur.role_id LEFT JOIN public.admin_role_permissions rp ON rp.role_id=r.id
  LEFT JOIN public.admin_permissions p ON p.id=rp.permission_id
  WHERE ap.is_active=true AND r.is_active=true AND (ap.id=auth.uid() OR lower(ap.email)=lower(auth.jwt()->>'email'))
    AND (r.key='superadmin' OR p.key IN ('settings.view','settings.edit'))
));

CREATE POLICY board_members_admin_insert ON public.board_members
FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.admin_profiles ap JOIN public.admin_user_roles ur ON ur.user_id=ap.id
  JOIN public.admin_roles r ON r.id=ur.role_id LEFT JOIN public.admin_role_permissions rp ON rp.role_id=r.id
  LEFT JOIN public.admin_permissions p ON p.id=rp.permission_id
  WHERE ap.is_active=true AND r.is_active=true AND (ap.id=auth.uid() OR lower(ap.email)=lower(auth.jwt()->>'email'))
    AND (r.key='superadmin' OR p.key='settings.edit')
));

CREATE POLICY board_members_admin_update ON public.board_members
FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.admin_profiles ap JOIN public.admin_user_roles ur ON ur.user_id=ap.id
  JOIN public.admin_roles r ON r.id=ur.role_id LEFT JOIN public.admin_role_permissions rp ON rp.role_id=r.id
  LEFT JOIN public.admin_permissions p ON p.id=rp.permission_id
  WHERE ap.is_active=true AND r.is_active=true AND (ap.id=auth.uid() OR lower(ap.email)=lower(auth.jwt()->>'email'))
    AND (r.key='superadmin' OR p.key='settings.edit')
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.admin_profiles ap JOIN public.admin_user_roles ur ON ur.user_id=ap.id
  JOIN public.admin_roles r ON r.id=ur.role_id LEFT JOIN public.admin_role_permissions rp ON rp.role_id=r.id
  LEFT JOIN public.admin_permissions p ON p.id=rp.permission_id
  WHERE ap.is_active=true AND r.is_active=true AND (ap.id=auth.uid() OR lower(ap.email)=lower(auth.jwt()->>'email'))
    AND (r.key='superadmin' OR p.key='settings.edit')
));

CREATE POLICY club_contacts_public_read_active ON public.club_contacts
FOR SELECT TO anon, authenticated
USING (is_public = true AND is_active = true);

CREATE POLICY club_contacts_admin_read ON public.club_contacts
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.admin_profiles ap JOIN public.admin_user_roles ur ON ur.user_id=ap.id
  JOIN public.admin_roles r ON r.id=ur.role_id LEFT JOIN public.admin_role_permissions rp ON rp.role_id=r.id
  LEFT JOIN public.admin_permissions p ON p.id=rp.permission_id
  WHERE ap.is_active=true AND r.is_active=true AND (ap.id=auth.uid() OR lower(ap.email)=lower(auth.jwt()->>'email'))
    AND (r.key='superadmin' OR p.key IN ('settings.view','settings.edit'))
));

CREATE POLICY club_contacts_admin_insert ON public.club_contacts
FOR INSERT TO authenticated WITH CHECK (EXISTS (
  SELECT 1 FROM public.admin_profiles ap JOIN public.admin_user_roles ur ON ur.user_id=ap.id
  JOIN public.admin_roles r ON r.id=ur.role_id LEFT JOIN public.admin_role_permissions rp ON rp.role_id=r.id
  LEFT JOIN public.admin_permissions p ON p.id=rp.permission_id
  WHERE ap.is_active=true AND r.is_active=true AND (ap.id=auth.uid() OR lower(ap.email)=lower(auth.jwt()->>'email'))
    AND (r.key='superadmin' OR p.key='settings.edit')
));

CREATE POLICY club_contacts_admin_update ON public.club_contacts
FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.admin_profiles ap JOIN public.admin_user_roles ur ON ur.user_id=ap.id
  JOIN public.admin_roles r ON r.id=ur.role_id LEFT JOIN public.admin_role_permissions rp ON rp.role_id=r.id
  LEFT JOIN public.admin_permissions p ON p.id=rp.permission_id
  WHERE ap.is_active=true AND r.is_active=true AND (ap.id=auth.uid() OR lower(ap.email)=lower(auth.jwt()->>'email'))
    AND (r.key='superadmin' OR p.key='settings.edit')
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.admin_profiles ap JOIN public.admin_user_roles ur ON ur.user_id=ap.id
  JOIN public.admin_roles r ON r.id=ur.role_id LEFT JOIN public.admin_role_permissions rp ON rp.role_id=r.id
  LEFT JOIN public.admin_permissions p ON p.id=rp.permission_id
  WHERE ap.is_active=true AND r.is_active=true AND (ap.id=auth.uid() OR lower(ap.email)=lower(auth.jwt()->>'email'))
    AND (r.key='superadmin' OR p.key='settings.edit')
));

CREATE POLICY club_contacts_admin_delete ON public.club_contacts
FOR DELETE TO authenticated USING (EXISTS (
  SELECT 1 FROM public.admin_profiles ap JOIN public.admin_user_roles ur ON ur.user_id=ap.id
  JOIN public.admin_roles r ON r.id=ur.role_id LEFT JOIN public.admin_role_permissions rp ON rp.role_id=r.id
  LEFT JOIN public.admin_permissions p ON p.id=rp.permission_id
  WHERE ap.is_active=true AND r.is_active=true AND (ap.id=auth.uid() OR lower(ap.email)=lower(auth.jwt()->>'email'))
    AND (r.key='superadmin' OR p.key='settings.edit')
));

-- Remove table and legacy column grants before assigning the minimum table grants.
REVOKE ALL PRIVILEGES ON TABLE public.coaches, public.board_members, public.club_contacts FROM PUBLIC, anon, authenticated;
DO $columns$
DECLARE row record;
BEGIN
  FOR row IN SELECT table_name,column_name FROM information_schema.columns
             WHERE table_schema='public' AND table_name IN ('coaches','board_members','club_contacts')
  LOOP
    EXECUTE format('REVOKE ALL PRIVILEGES (%I) ON TABLE public.%I FROM PUBLIC, anon, authenticated',row.column_name,row.table_name);
  END LOOP;
END
$columns$;

GRANT SELECT ON TABLE public.coaches, public.board_members, public.club_contacts TO anon;
GRANT SELECT ON TABLE public.coaches, public.board_members, public.club_contacts TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.coaches TO authenticated;
GRANT INSERT, UPDATE ON TABLE public.board_members TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.club_contacts TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.coaches, public.board_members, public.club_contacts TO service_role;

-- Reassert the already-secure RPC contract without broadening it.
REVOKE ALL ON FUNCTION public.remove_entity(text,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.remove_entity(text,uuid) TO service_role;
REVOKE ALL ON FUNCTION public.synchronize_media_assignment(text,uuid,uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.synchronize_media_assignment(text,uuid,uuid,text) TO service_role;

COMMIT;
