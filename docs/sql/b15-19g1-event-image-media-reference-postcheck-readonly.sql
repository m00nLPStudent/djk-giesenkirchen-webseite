-- B15.19G1 read-only postcheck. No writes.
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema='public' AND table_name='events' AND column_name IN ('image_url','image_media_asset_id');

SELECT conname, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid='public.events'::regclass AND conname='events_image_media_asset_id_fkey';

SELECT COUNT(*) AS events_total,
       COUNT(*) FILTER (WHERE image_url IS NOT NULL AND btrim(image_url)<>'') AS legacy_image_rows,
       COUNT(*) FILTER (WHERE image_media_asset_id IS NOT NULL) AS central_image_rows,
       COUNT(*) FILTER (WHERE image_media_asset_id IS NOT NULL AND image_url IS NOT NULL AND btrim(image_url)<>'') AS dual_reference_rows
FROM public.events;

SELECT COUNT(DISTINCT image_url) AS distinct_legacy_image_urls
FROM public.events WHERE image_url IS NOT NULL AND btrim(image_url)<>'';

SELECT image_url,COUNT(*) AS reference_count
FROM public.events WHERE image_url IS NOT NULL AND btrim(image_url)<>''
GROUP BY image_url HAVING COUNT(*)>1 ORDER BY reference_count DESC,image_url;

SELECT e.id,e.image_url,ma.id AS matching_asset_id,ma.storage_bucket,ma.storage_path
FROM public.events e JOIN public.media_assets ma
  ON e.image_url LIKE '%' || ma.storage_path || '%'
WHERE e.image_url IS NOT NULL AND btrim(e.image_url)<>'';

SELECT e.id,e.slug,e.image_media_asset_id,ma.media_kind,ma.visibility,ma.purpose,ma.is_archived
FROM public.events e LEFT JOIN public.media_assets ma ON ma.id=e.image_media_asset_id
WHERE e.image_media_asset_id IS NOT NULL
  AND (ma.id IS NULL OR ma.media_kind<>'image' OR ma.visibility<>'public' OR ma.is_archived);

SELECT e.id,e.image_media_asset_id,u.id AS usage_id
FROM public.events e LEFT JOIN public.media_asset_usages u
  ON u.media_asset_id=e.image_media_asset_id AND u.entity_type='event' AND u.entity_id=e.id AND u.field_name='image'
WHERE e.image_media_asset_id IS NOT NULL AND u.id IS NULL;

SELECT u.id,u.entity_id,u.media_asset_id
FROM public.media_asset_usages u LEFT JOIN public.events e ON e.id=u.entity_id
WHERE u.entity_type='event' AND u.field_name='image'
  AND (e.id IS NULL OR e.image_media_asset_id IS DISTINCT FROM u.media_asset_id);

SELECT COUNT(*) AS events_without_any_image_source
FROM public.events WHERE image_media_asset_id IS NULL AND (image_url IS NULL OR btrim(image_url)='');

SELECT routine_name,security_type FROM information_schema.routines
WHERE routine_schema='public' AND routine_name IN ('synchronize_media_assignment','cleanup_event_media_usage');

SELECT grantee,privilege_type FROM information_schema.routine_privileges
WHERE routine_schema='public' AND routine_name='synchronize_media_assignment' ORDER BY grantee;
