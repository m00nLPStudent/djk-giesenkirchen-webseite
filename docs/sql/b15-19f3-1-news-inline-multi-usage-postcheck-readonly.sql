-- B15.19F3.1 read-only postcheck.
SELECT conname,contype,pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid='public.media_asset_usages'::regclass ORDER BY conname;
SELECT indexname,indexdef FROM pg_indexes WHERE schemaname='public' AND tablename='media_asset_usages' ORDER BY indexname;
SELECT pg_get_functiondef('public.synchronize_news_content_media_usages(uuid,uuid[])'::regprocedure);
SELECT has_function_privilege('anon','public.synchronize_news_content_media_usages(uuid,uuid[])','EXECUTE') anon_must_be_false,has_function_privilege('authenticated','public.synchronize_news_content_media_usages(uuid,uuid[])','EXECUTE') authenticated_must_be_false,has_function_privilege('service_role','public.synchronize_news_content_media_usages(uuid,uuid[])','EXECUTE') service_role_must_be_true;
SELECT entity_id AS news_id,count(*) AS inline_assets,count(DISTINCT media_asset_id) AS distinct_assets FROM public.media_asset_usages WHERE entity_type='news' AND field_name='content' GROUP BY entity_id ORDER BY inline_assets DESC,entity_id;
SELECT entity_type,entity_id,field_name,count(*) AS must_be_zero FROM public.media_asset_usages WHERE NOT(entity_type='news' AND field_name='content') GROUP BY entity_type,entity_id,field_name HAVING count(*)>1;
SELECT entity_type,entity_id,field_name,media_asset_id,count(*) AS must_be_zero FROM public.media_asset_usages GROUP BY entity_type,entity_id,field_name,media_asset_id HAVING count(*)>1;
SELECT usage.* FROM public.media_asset_usages usage LEFT JOIN public.media_assets asset ON asset.id=usage.media_asset_id WHERE asset.id IS NULL;
SELECT usage.* FROM public.media_asset_usages usage LEFT JOIN public.news news ON news.id=usage.entity_id LEFT JOIN public.media_assets asset ON asset.id=usage.media_asset_id WHERE usage.entity_type='news' AND usage.field_name='content' AND (news.id IS NULL OR asset.id IS NULL OR asset.is_archived OR asset.media_kind<>'image' OR asset.visibility<>'public');
