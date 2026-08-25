-- B15.19E2 read-only postcheck. Run manually after the proposal.
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'team_seasons' AND column_name = 'team_image_media_asset_id';

SELECT constraint_name, delete_rule
FROM information_schema.referential_constraints
WHERE constraint_schema = 'public' AND constraint_name IN (
  SELECT constraint_name FROM information_schema.key_column_usage
  WHERE table_schema = 'public' AND table_name = 'team_seasons' AND column_name = 'team_image_media_asset_id'
);

SELECT indexname, indexdef FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'team_seasons'
  AND indexname = 'team_seasons_team_image_media_asset_idx';

SELECT conname, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.media_asset_usages'::regclass AND contype = 'c'
  AND pg_get_constraintdef(oid) LIKE '%entity_type%';

SELECT pg_get_functiondef('public.synchronize_media_assignment(text,uuid,uuid,text)'::regprocedure) AS function_definition;
SELECT grantee, privilege_type FROM information_schema.routine_privileges
WHERE specific_schema = 'public' AND routine_name = 'synchronize_media_assignment'
ORDER BY grantee, privilege_type;

SELECT count(*) AS invalid_or_unsafe_season_media_references
FROM public.team_seasons season_row
LEFT JOIN public.media_assets asset ON asset.id = season_row.team_image_media_asset_id
WHERE season_row.team_image_media_asset_id IS NOT NULL
  AND (asset.id IS NULL OR asset.is_archived OR asset.media_kind <> 'image');

SELECT entity_id, field_name, count(*) AS usage_count
FROM public.media_asset_usages
WHERE entity_type = 'team_season' AND field_name = 'image'
GROUP BY entity_id, field_name HAVING count(*) > 1;

SELECT count(*) AS dangling_team_season_usages
FROM public.media_asset_usages usage_row
LEFT JOIN public.team_seasons season_row ON season_row.id = usage_row.entity_id
LEFT JOIN public.media_assets asset ON asset.id = usage_row.media_asset_id
WHERE usage_row.entity_type = 'team_season' AND usage_row.field_name = 'image'
  AND (season_row.id IS NULL OR asset.id IS NULL);

SELECT count(*) AS references_without_matching_usage
FROM public.team_seasons season_row
LEFT JOIN public.media_asset_usages usage_row
  ON usage_row.entity_type = 'team_season' AND usage_row.entity_id = season_row.id
 AND usage_row.field_name = 'image' AND usage_row.media_asset_id = season_row.team_image_media_asset_id
WHERE season_row.team_image_media_asset_id IS NOT NULL AND usage_row.id IS NULL;

SELECT count(*) AS usages_without_matching_reference
FROM public.media_asset_usages usage_row
JOIN public.team_seasons season_row ON season_row.id = usage_row.entity_id
WHERE usage_row.entity_type = 'team_season' AND usage_row.field_name = 'image'
  AND season_row.team_image_media_asset_id IS DISTINCT FROM usage_row.media_asset_id;
