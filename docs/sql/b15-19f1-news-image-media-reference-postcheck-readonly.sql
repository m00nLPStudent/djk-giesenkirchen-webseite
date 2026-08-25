-- B15.19F1 read-only postcheck. No writes.
SELECT table_name,column_name,data_type,is_nullable FROM information_schema.columns WHERE table_schema='public' AND table_name='news' AND column_name='image_media_asset_id';
SELECT conname,pg_get_constraintdef(oid) AS definition FROM pg_constraint WHERE conrelid='public.news'::regclass AND conname='news_image_media_asset_id_fkey';
SELECT indexname,indexdef FROM pg_indexes WHERE schemaname='public' AND tablename='news' AND indexname='news_image_media_asset_idx';
SELECT conname,pg_get_constraintdef(oid) AS definition FROM pg_constraint WHERE conrelid='public.media_asset_usages'::regclass AND contype='c';
SELECT pg_get_functiondef('public.synchronize_media_assignment(text,uuid,uuid,text)'::regprocedure) AS assignment_rpc;
SELECT trigger_name,event_manipulation,action_timing,action_statement FROM information_schema.triggers WHERE event_object_schema='public' AND event_object_table='news' AND trigger_name='news_cleanup_media_usage';
SELECT has_function_privilege('anon','public.synchronize_media_assignment(text,uuid,uuid,text)','EXECUTE') AS anon_must_be_false,
       has_function_privilege('authenticated','public.synchronize_media_assignment(text,uuid,uuid,text)','EXECUTE') AS authenticated_must_be_false,
       has_function_privilege('service_role','public.synchronize_media_assignment(text,uuid,uuid,text)','EXECUTE') AS service_role_must_be_true;

SELECT 'invalid_news_media_references' AS check_name,count(*) FROM public.news n LEFT JOIN public.media_assets a ON a.id=n.image_media_asset_id WHERE n.image_media_asset_id IS NOT NULL AND a.id IS NULL
UNION ALL SELECT 'archived_or_non_image_news_references',count(*) FROM public.news n JOIN public.media_assets a ON a.id=n.image_media_asset_id WHERE a.is_archived OR a.media_kind<>'image'
UNION ALL SELECT 'dangling_news_usages',count(*) FROM public.media_asset_usages u LEFT JOIN public.news n ON n.id=u.entity_id WHERE u.entity_type='news' AND u.field_name='image' AND n.id IS NULL;

SELECT entity_id,field_name,count(*) AS duplicate_count FROM public.media_asset_usages WHERE entity_type='news' AND field_name='image' GROUP BY entity_id,field_name HAVING count(*)>1;
SELECT n.id AS news_reference_without_usage FROM public.news n LEFT JOIN public.media_asset_usages u ON u.entity_type='news' AND u.entity_id=n.id AND u.field_name='image' AND u.media_asset_id=n.image_media_asset_id WHERE n.image_media_asset_id IS NOT NULL AND u.id IS NULL;
SELECT u.entity_id AS news_usage_without_reference FROM public.media_asset_usages u LEFT JOIN public.news n ON n.id=u.entity_id AND n.image_media_asset_id=u.media_asset_id WHERE u.entity_type='news' AND u.field_name='image' AND n.id IS NULL;

SELECT count(*) AS news_with_legacy_image_url FROM public.news WHERE NULLIF(btrim(image_url),'') IS NOT NULL;
SELECT image_url,count(*) AS duplicate_legacy_url_count FROM public.news WHERE NULLIF(btrim(image_url),'') IS NOT NULL GROUP BY image_url HAVING count(*)>1;
SELECT n.id,n.image_url,a.id AS matching_media_asset_id FROM public.news n JOIN public.media_assets a ON n.image_url LIKE '%'||a.storage_path WHERE NULLIF(btrim(n.image_url),'') IS NOT NULL;
