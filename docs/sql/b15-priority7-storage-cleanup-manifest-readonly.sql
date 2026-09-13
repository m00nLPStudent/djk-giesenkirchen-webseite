-- PRIORITY 7 storage cleanup manifest - READ ONLY
-- Contains object paths by design. Keep export private and unversioned.
-- No signed URLs, binary data, owner identities or credentials are returned.

-- P7S.01_DB_ASSET_MANIFEST
SELECT 'P7S.01_DB_ASSET_MANIFEST' AS section,
       a.id AS media_asset_id, a.storage_bucket, a.storage_path,
       a.media_kind, a.visibility, a.purpose, a.is_archived,
       count(DISTINCT u.id)::bigint AS usage_count,
       count(DISTINCT d.id)::bigint AS download_count,
       array_remove(array_agg(DISTINCT u.entity_type), NULL) AS reference_types,
       EXISTS (
         SELECT 1 FROM storage.objects o
         WHERE o.bucket_id=a.storage_bucket AND o.name=a.storage_path
       ) AS storage_object_exists
FROM public.media_assets a
LEFT JOIN public.media_asset_usages u ON u.media_asset_id=a.id
LEFT JOIN public.downloads d ON d.media_asset_id=a.id
GROUP BY a.id,a.storage_bucket,a.storage_path,a.media_kind,a.visibility,a.purpose,a.is_archived
ORDER BY a.storage_bucket,a.storage_path;

-- P7S.02_STORAGE_ORPHANS_AGGREGATED
SELECT 'P7S.02_STORAGE_ORPHANS_AGGREGATED' AS section, o.bucket_id,
       count(*)::bigint AS object_count_without_media_asset,
       COALESCE(sum((o.metadata->>'size')::bigint),0)::bigint AS recorded_bytes
FROM storage.objects o
LEFT JOIN public.media_assets a ON a.storage_bucket=o.bucket_id AND a.storage_path=o.name
WHERE a.id IS NULL
GROUP BY o.bucket_id ORDER BY o.bucket_id;

-- P7S.03_DB_ASSETS_WITHOUT_STORAGE_OBJECT
SELECT 'P7S.03_DB_ASSETS_WITHOUT_STORAGE_OBJECT' AS section,
       a.id AS media_asset_id,a.storage_bucket,a.storage_path,a.purpose,a.is_archived
FROM public.media_assets a
LEFT JOIN storage.objects o ON o.bucket_id=a.storage_bucket AND o.name=a.storage_path
WHERE o.id IS NULL
ORDER BY a.storage_bucket,a.storage_path;

-- P7S.04_STORAGE_ORPHAN_RETAINED_REFERENCE_CHECK
-- Object names are intentionally returned for the private operator manifest.
-- Text matching is conservative: any match blocks automatic classification.
SELECT 'P7S.04_STORAGE_ORPHAN_RETAINED_REFERENCE_CHECK' AS section,
       o.bucket_id, o.name AS storage_path,
       EXISTS (SELECT 1 FROM public.club_settings x WHERE to_jsonb(x)::text LIKE '%' || o.name || '%') AS referenced_by_club_settings,
       EXISTS (SELECT 1 FROM public.membership_request_recipients x WHERE to_jsonb(x)::text LIKE '%' || o.name || '%') AS referenced_by_membership_routing,
       EXISTS (SELECT 1 FROM public.notification_email_global_settings x WHERE to_jsonb(x)::text LIKE '%' || o.name || '%') AS referenced_by_global_mail_settings,
       EXISTS (SELECT 1 FROM public.notification_email_settings x WHERE to_jsonb(x)::text LIKE '%' || o.name || '%') AS referenced_by_type_mail_settings,
       EXISTS (SELECT 1 FROM public.admin_profiles x WHERE to_jsonb(x)::text LIKE '%' || o.name || '%') AS referenced_by_admin_profile,
       CASE WHEN
         EXISTS (SELECT 1 FROM public.club_settings x WHERE to_jsonb(x)::text LIKE '%' || o.name || '%') OR
         EXISTS (SELECT 1 FROM public.membership_request_recipients x WHERE to_jsonb(x)::text LIKE '%' || o.name || '%') OR
         EXISTS (SELECT 1 FROM public.notification_email_global_settings x WHERE to_jsonb(x)::text LIKE '%' || o.name || '%') OR
         EXISTS (SELECT 1 FROM public.notification_email_settings x WHERE to_jsonb(x)::text LIKE '%' || o.name || '%')
       THEN 'KEEP_OR_REVIEW_RETAINED_REFERENCE'
       ELSE 'STORAGE_DELETE_CANDIDATE'
       END AS manifest_class
FROM storage.objects o
LEFT JOIN public.media_assets a
  ON a.storage_bucket=o.bucket_id AND a.storage_path=o.name
WHERE a.id IS NULL
ORDER BY o.bucket_id,o.name;

-- Expected resultsets: exactly 4.
