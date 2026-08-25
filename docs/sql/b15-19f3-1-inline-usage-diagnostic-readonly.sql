-- B15.19F3.1 live-schema diagnostic. Read-only only.
SELECT conname,contype,pg_get_constraintdef(oid) AS definition
FROM pg_constraint WHERE conrelid='public.media_asset_usages'::regclass ORDER BY conname;
SELECT indexname,indexdef FROM pg_indexes WHERE schemaname='public' AND tablename='media_asset_usages' ORDER BY indexname;
SELECT pg_get_functiondef('public.synchronize_news_content_media_usages(uuid,uuid[])'::regprocedure) AS f3_rpc;
SELECT entity_id AS news_id,media_asset_id,field_name,created_at FROM public.media_asset_usages WHERE entity_type='news' AND field_name='content' ORDER BY entity_id,created_at,media_asset_id;
SELECT entity_id AS news_id,count(*) AS inline_usage_count,count(DISTINCT media_asset_id) AS distinct_asset_count FROM public.media_asset_usages WHERE entity_type='news' AND field_name='content' GROUP BY entity_id HAVING count(*)>1 ORDER BY inline_usage_count DESC,entity_id;
SELECT entity_type,entity_id,field_name,media_asset_id,count(*) FROM public.media_asset_usages GROUP BY entity_type,entity_id,field_name,media_asset_id HAVING count(*)>1;
SELECT tgname,pg_get_triggerdef(oid) FROM pg_trigger WHERE tgrelid IN ('public.media_asset_usages'::regclass,'public.news'::regclass) AND NOT tgisinternal ORDER BY tgrelid::regclass::text,tgname;
