SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema='public' AND table_name='coaches' AND column_name='image_media_asset_id';
SELECT indexname, indexdef FROM pg_indexes WHERE schemaname='public' AND tablename='coaches' AND indexname='coaches_image_media_asset_idx';
SELECT count(*) invalid_references FROM public.coaches c LEFT JOIN public.media_assets a ON a.id=c.image_media_asset_id WHERE c.image_media_asset_id IS NOT NULL AND a.id IS NULL;
SELECT count(*) duplicate_coach_image_usages FROM (SELECT entity_id, field_name FROM public.media_asset_usages WHERE entity_type='coach' AND field_name='image' GROUP BY entity_id, field_name HAVING count(*)>1) x;
