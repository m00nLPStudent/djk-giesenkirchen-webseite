-- B15.19G2.2 read-only postcheck. No writes.
SELECT role_name,
  has_table_privilege(role_name,'public.event_documents','SELECT') AS can_select,
  has_table_privilege(role_name,'public.event_documents','INSERT') AS can_insert,
  has_table_privilege(role_name,'public.event_documents','UPDATE') AS can_update,
  has_table_privilege(role_name,'public.event_documents','DELETE') AS can_delete,
  has_table_privilege(role_name,'public.event_documents','TRUNCATE') AS can_truncate,
  has_table_privilege(role_name,'public.event_documents','REFERENCES') AS can_reference,
  has_table_privilege(role_name,'public.event_documents','TRIGGER') AS can_trigger
FROM (VALUES('anon'),('authenticated'),('service_role')) AS roles(role_name)
ORDER BY role_name;

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
) AS public_read_policy_present;

SELECT conname,contype,pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid='public.event_documents'::regclass
  AND conname IN('event_documents_event_id_fkey','event_documents_media_asset_id_fkey')
ORDER BY conname;

SELECT tgname,pg_get_triggerdef(oid) AS definition
FROM pg_trigger
WHERE tgrelid='public.event_documents'::regclass AND NOT tgisinternal
ORDER BY tgname;

SELECT
  r.routine_name,
  r.security_type,
  p.grantee,
  p.privilege_type
FROM information_schema.routines AS r
LEFT JOIN information_schema.routine_privileges AS p
  ON p.specific_schema=r.specific_schema AND p.specific_name=r.specific_name
WHERE r.routine_schema='public'
  AND r.routine_name IN('synchronize_media_assignment','cleanup_event_document_media_usage')
ORDER BY r.routine_name,p.grantee;
