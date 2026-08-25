-- B15.19H1 read-only postcheck. No writes.
SELECT column_name,data_type,is_nullable FROM information_schema.columns WHERE table_schema='public' AND table_name='sponsors' ORDER BY ordinal_position;
SELECT conname,contype,pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid IN('public.sponsors'::regclass,'public.media_asset_usages'::regclass) ORDER BY conrelid::regclass::text,conname;
SELECT indexname,indexdef FROM pg_indexes WHERE schemaname='public' AND tablename='sponsors';
SELECT pg_get_functiondef('public.synchronize_media_assignment(text,uuid,uuid,text)'::regprocedure);
SELECT tgname,pg_get_triggerdef(oid) FROM pg_trigger WHERE tgrelid='public.sponsors'::regclass AND NOT tgisinternal;
SELECT has_function_privilege('anon','public.synchronize_media_assignment(text,uuid,uuid,text)','EXECUTE') anon_must_be_false,has_function_privilege('authenticated','public.synchronize_media_assignment(text,uuid,uuid,text)','EXECUTE') authenticated_must_be_false,has_function_privilege('service_role','public.synchronize_media_assignment(text,uuid,uuid,text)','EXECUTE') service_role_must_be_true;

SELECT count(*) total,
  count(*) FILTER(WHERE image_url IS NOT NULL AND btrim(image_url)<>'') legacy_logos,
  count(*) FILTER(WHERE image_media_asset_id IS NOT NULL) central_logos,
  count(*) FILTER(WHERE image_media_asset_id IS NOT NULL AND image_url IS NOT NULL AND btrim(image_url)<>'') dual_references,
  count(*) FILTER(WHERE image_media_asset_id IS NULL AND (image_url IS NULL OR btrim(image_url)='')) without_source
FROM public.sponsors;
SELECT count(DISTINCT image_url) distinct_legacy_urls FROM public.sponsors WHERE image_url IS NOT NULL AND btrim(image_url)<>'';
SELECT image_url,count(*) reference_count FROM public.sponsors WHERE image_url IS NOT NULL AND btrim(image_url)<>'' GROUP BY image_url HAVING count(*)>1 ORDER BY reference_count DESC,image_url;
SELECT s.id,s.image_url,ma.id possible_asset_id FROM public.sponsors s JOIN public.media_assets ma ON s.image_media_asset_id IS NULL AND s.image_url LIKE '%'||ma.storage_path||'%' ORDER BY s.id;
SELECT s.id,s.image_media_asset_id,ma.media_kind,ma.visibility,ma.is_archived FROM public.sponsors s LEFT JOIN public.media_assets ma ON ma.id=s.image_media_asset_id WHERE s.image_media_asset_id IS NOT NULL AND (ma.id IS NULL OR ma.media_kind<>'image' OR ma.is_archived OR (s.is_active AND ma.visibility<>'public'));
SELECT s.id FROM public.sponsors s LEFT JOIN public.media_asset_usages u ON u.entity_type='sponsor' AND u.entity_id=s.id AND u.field_name='image' AND u.media_asset_id=s.image_media_asset_id WHERE s.image_media_asset_id IS NOT NULL AND u.id IS NULL;
SELECT u.* FROM public.media_asset_usages u LEFT JOIN public.sponsors s ON s.id=u.entity_id WHERE u.entity_type='sponsor' AND (s.id IS NULL OR s.image_media_asset_id IS DISTINCT FROM u.media_asset_id OR u.field_name<>'image');

SELECT grantee,privilege_type FROM information_schema.role_table_grants WHERE table_schema='public' AND table_name='sponsors' ORDER BY grantee,privilege_type;
SELECT policyname,roles,cmd,qual,with_check FROM pg_policies WHERE schemaname='public' AND tablename='sponsors' ORDER BY policyname;
