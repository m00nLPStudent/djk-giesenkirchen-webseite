-- B15.19C read-only postcheck.
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'players' AND column_name = 'image_media_asset_id';

SELECT indexname, indexdef FROM pg_indexes
WHERE schemaname = 'public' AND indexname = 'players_image_media_asset_idx';

SELECT p.proname, p.prosecdef, pg_get_function_identity_arguments(p.oid), p.proacl
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'synchronize_media_assignment';

SELECT entity_type, entity_id, field_name, count(*)
FROM public.media_asset_usages
WHERE entity_type IN ('coach', 'player') AND field_name = 'image'
GROUP BY entity_type, entity_id, field_name HAVING count(*) > 1;

SELECT p.id, p.image_media_asset_id, u.media_asset_id AS usage_asset_id
FROM public.players p
FULL JOIN public.media_asset_usages u ON u.entity_type = 'player' AND u.entity_id = p.id AND u.field_name = 'image'
WHERE p.image_media_asset_id IS DISTINCT FROM u.media_asset_id;
