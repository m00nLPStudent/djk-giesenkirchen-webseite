-- B15.22B postcheck. READ ONLY. Run manually after the proposal.

SELECT c.oid::regclass AS relation, c.relrowsecurity AS rls_enabled,
       c.relforcerowsecurity AS force_rls, pg_get_userbyid(c.relowner) AS owner,
       obj_description(c.oid,'pg_class') AS comment
FROM pg_catalog.pg_class c WHERE c.oid='public.downloads'::regclass;

SELECT ordinal_position,column_name,data_type,udt_name,is_nullable,column_default
FROM information_schema.columns WHERE table_schema='public' AND table_name='downloads'
ORDER BY ordinal_position;

SELECT conname,contype,pg_get_constraintdef(oid,true) AS definition
FROM pg_catalog.pg_constraint WHERE conrelid='public.downloads'::regclass ORDER BY conname;

SELECT indexname,indexdef FROM pg_catalog.pg_indexes
WHERE schemaname='public' AND tablename='downloads' ORDER BY indexname;

SELECT tgname,pg_get_triggerdef(oid,true) AS definition FROM pg_catalog.pg_trigger
WHERE tgrelid='public.downloads'::regclass AND NOT tgisinternal ORDER BY tgname;

SELECT policyname,permissive,roles,cmd,qual,with_check FROM pg_catalog.pg_policies
WHERE schemaname='public' AND tablename='downloads' ORDER BY policyname;

SELECT grantee,privilege_type FROM information_schema.role_table_grants
WHERE table_schema='public' AND table_name='downloads'
  AND grantee IN('anon','authenticated','service_role') ORDER BY grantee,privilege_type;

SELECT grantee,column_name,array_agg(privilege_type ORDER BY privilege_type) AS privileges
FROM information_schema.column_privileges WHERE table_schema='public' AND table_name='downloads'
  AND grantee IN('anon','authenticated','service_role')
GROUP BY grantee,column_name ORDER BY grantee,column_name;

SELECT role_name,
       has_table_privilege(role_name,'public.downloads','INSERT') AS can_insert,
       has_table_privilege(role_name,'public.downloads','UPDATE') AS can_update,
       has_table_privilege(role_name,'public.downloads','DELETE') AS can_delete,
       has_table_privilege(role_name,'public.downloads','TRUNCATE') AS can_truncate
FROM unnest(ARRAY['anon','authenticated','service_role']) role_name ORDER BY role_name;

WITH normal_routines AS MATERIALIZED (
  SELECT p.oid,p.proname,p.prosecdef,p.proconfig,pg_get_userbyid(p.proowner) AS owner
  FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.prokind IN('f','p')
    AND p.proname IN('synchronize_media_assignment','cleanup_download_media_usage','normalize_download_publication_state','enforce_download_publish_permission')
)
SELECT oid::regprocedure::text AS signature,prosecdef AS security_definer,proconfig,owner,
       pg_get_functiondef(oid) AS definition FROM normal_routines ORDER BY oid::regprocedure::text;

SELECT has_function_privilege('anon','public.synchronize_media_assignment(text,uuid,uuid,text)','EXECUTE') AS anon_must_be_false,
       has_function_privilege('authenticated','public.synchronize_media_assignment(text,uuid,uuid,text)','EXECUTE') AS authenticated_must_be_false,
       has_function_privilege('service_role','public.synchronize_media_assignment(text,uuid,uuid,text)','EXECUTE') AS service_role_must_be_true;

SELECT p.key,p.name,p.category,array_agg(r.key ORDER BY r.key) AS assigned_roles
FROM public.admin_permissions p
LEFT JOIN public.admin_role_permissions rp ON rp.permission_id=p.id
LEFT JOIN public.admin_roles r ON r.id=rp.role_id
WHERE p.key LIKE 'downloads.%' GROUP BY p.id,p.key,p.name,p.category ORDER BY p.key;

SELECT count(*) AS download_count FROM public.downloads;
SELECT is_active,count(*) AS category_count FROM public.download_categories GROUP BY is_active ORDER BY is_active DESC;
SELECT purpose,media_kind,visibility,storage_bucket,mime_type,is_archived,count(*) AS asset_count
FROM public.media_assets WHERE purpose='download' OR media_kind='document'
GROUP BY purpose,media_kind,visibility,storage_bucket,mime_type,is_archived
ORDER BY purpose,media_kind,visibility,storage_bucket,mime_type,is_archived;
SELECT entity_type,field_name,count(*) AS usage_count FROM public.media_asset_usages
GROUP BY entity_type,field_name ORDER BY entity_type,field_name;
SELECT id,name,public,file_size_limit,allowed_mime_types FROM storage.buckets
WHERE id IN('media','media-library-private','media-library-public') ORDER BY id;

-- Every query below must return zero rows.
SELECT d.id FROM public.downloads d LEFT JOIN public.download_categories c ON c.id=d.category_id
LEFT JOIN public.media_assets a ON a.id=d.media_asset_id
LEFT JOIN public.media_asset_usages u ON u.entity_type='download' AND u.entity_id=d.id AND u.field_name='file' AND u.media_asset_id=d.media_asset_id
WHERE c.id IS NULL OR a.id IS NULL OR u.id IS NULL OR a.is_archived OR a.media_kind<>'document'
   OR a.mime_type<>'application/pdf' OR a.storage_bucket<>'media-library-private'
   OR a.visibility NOT IN('admin','restricted') OR a.purpose<>'download';
SELECT u.entity_id FROM public.media_asset_usages u LEFT JOIN public.downloads d ON d.id=u.entity_id
WHERE u.entity_type='download' AND u.field_name='file' AND d.id IS NULL;
SELECT entity_id,count(*) FROM public.media_asset_usages WHERE entity_type='download' AND field_name='file'
GROUP BY entity_id HAVING count(*)>1;
