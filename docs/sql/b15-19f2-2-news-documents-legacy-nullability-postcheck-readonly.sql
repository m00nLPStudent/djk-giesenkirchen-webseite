-- B15.19F2.2 read-only postcheck. No mutations.
SELECT column_name,data_type,is_nullable,column_default
FROM information_schema.columns
WHERE table_schema='public' AND table_name='news_documents'
  AND column_name IN ('file_name','file_path','file_url','mime_type','file_size','media_asset_id')
ORDER BY ordinal_position;

SELECT conname,contype,pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid='public.news_documents'::regclass
ORDER BY conname;

SELECT
  count(*) AS total,
  count(*) FILTER (WHERE media_asset_id IS NOT NULL) AS central_documents,
  count(*) FILTER (WHERE media_asset_id IS NULL) AS legacy_documents,
  count(*) FILTER (WHERE media_asset_id IS NULL AND NULLIF(btrim(file_path),'') IS NULL AND NULLIF(btrim(file_url),'') IS NULL) AS without_file_source,
  count(*) FILTER (WHERE media_asset_id IS NOT NULL AND file_path IS NULL AND file_url IS NULL) AS central_without_legacy_source,
  count(*) FILTER (WHERE media_asset_id IS NOT NULL AND (file_path IN ('central','media_asset') OR file_url IN ('central','media_asset'))) AS suspicious_fake_legacy_values
FROM public.news_documents;

SELECT id,news_id,media_asset_id,file_name,file_path,file_url,mime_type,file_size
FROM public.news_documents
WHERE media_asset_id IS NULL
  AND NULLIF(btrim(file_path),'') IS NULL
  AND NULLIF(btrim(file_url),'') IS NULL;

SELECT nd.id,nd.media_asset_id,ma.media_kind,ma.is_archived
FROM public.news_documents nd
LEFT JOIN public.media_assets ma ON ma.id=nd.media_asset_id
WHERE nd.media_asset_id IS NOT NULL
  AND (ma.id IS NULL OR ma.media_kind<>'document' OR ma.is_archived);

SELECT nd.id,nd.media_asset_id,u.media_asset_id AS usage_media_asset_id
FROM public.news_documents nd
LEFT JOIN public.media_asset_usages u
  ON u.entity_type='news_document' AND u.entity_id=nd.id AND u.field_name='file'
WHERE (nd.media_asset_id IS NOT NULL AND u.media_asset_id IS DISTINCT FROM nd.media_asset_id)
   OR (nd.media_asset_id IS NULL AND u.id IS NOT NULL);
