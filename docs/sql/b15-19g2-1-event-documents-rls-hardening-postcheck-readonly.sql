-- B15.19G2.1 read-only postcheck. No writes.
SELECT c.relrowsecurity AS rls_enabled,c.relforcerowsecurity AS force_rls_enabled
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relname='event_documents';

SELECT policyname,roles,cmd,qual,with_check
FROM pg_policies
WHERE schemaname='public' AND tablename='event_documents'
ORDER BY policyname;

SELECT NOT EXISTS(
  SELECT 1 FROM pg_policies
  WHERE schemaname='public' AND tablename='event_documents'
    AND cmd IN('INSERT','UPDATE','DELETE')
    AND ('anon'=ANY(roles) OR 'authenticated'=ANY(roles) OR 'public'=ANY(roles))
) AS no_direct_client_write_policies;

SELECT EXISTS(
  SELECT 1 FROM pg_policies
  WHERE schemaname='public' AND tablename='event_documents'
    AND policyname='event_documents_public_read' AND cmd='SELECT'
    AND 'anon'=ANY(roles) AND 'authenticated'=ANY(roles)
) AS public_read_policy_present;

SELECT grantee,privilege_type
FROM information_schema.role_table_grants
WHERE table_schema='public' AND table_name='event_documents'
  AND grantee IN('anon','authenticated','service_role')
ORDER BY grantee,privilege_type;

SELECT role_name,
  has_table_privilege(role_name,'public.event_documents','SELECT') can_select,
  has_table_privilege(role_name,'public.event_documents','INSERT') can_insert,
  has_table_privilege(role_name,'public.event_documents','UPDATE') can_update,
  has_table_privilege(role_name,'public.event_documents','DELETE') can_delete
FROM (VALUES('anon'),('authenticated'),('service_role')) roles(role_name);

SELECT r.routine_name,r.security_type,p.grantee,p.privilege_type
FROM information_schema.routines r
LEFT JOIN information_schema.routine_privileges p
  ON p.specific_schema=r.specific_schema AND p.specific_name=r.specific_name
WHERE r.routine_schema='public'
  AND r.routine_name IN('synchronize_media_assignment','cleanup_event_document_media_usage')
ORDER BY r.routine_name,p.grantee;

SELECT tgname,pg_get_triggerdef(oid) definition
FROM pg_trigger WHERE tgrelid='public.event_documents'::regclass AND NOT tgisinternal;

SELECT conname,contype,pg_get_constraintdef(oid) definition
FROM pg_constraint
WHERE conrelid='public.event_documents'::regclass
  AND conname IN('event_documents_event_id_fkey','event_documents_media_asset_id_fkey')
ORDER BY conname;

SELECT count(*) event_document_usages
FROM public.media_asset_usages
WHERE entity_type='event_document' AND field_name='file';

SELECT ed.id
FROM public.event_documents ed
LEFT JOIN public.media_asset_usages u
  ON u.entity_type='event_document' AND u.entity_id=ed.id
  AND u.field_name='file' AND u.media_asset_id=ed.media_asset_id
WHERE ed.media_asset_id IS NOT NULL AND u.id IS NULL;
