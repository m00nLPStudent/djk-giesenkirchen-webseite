-- PRIORITY 7 media/storage cleanup preflight.
-- READ-ONLY: run manually in Supabase SQL Editor. No cleanup is performed.

-- P7M.01_MEDIA_BASELINE
SELECT 'P7M.01_MEDIA_BASELINE' AS section,
  (SELECT count(*) FROM public.media_assets) AS media_assets,
  (SELECT count(*) FROM public.media_asset_usages) AS media_asset_usages,
  (SELECT count(*) FROM storage.objects) AS storage_objects,
  (SELECT count(*) FROM storage.buckets) AS storage_buckets;

-- P7M.02_MEDIA_ASSET_CLASSIFICATION
SELECT 'P7M.02_MEDIA_ASSET_CLASSIFICATION' AS section,
  md5(a.id::text) AS asset_ref,
  a.storage_bucket,
  a.storage_path,
  a.purpose,
  a.media_kind,
  a.mime_type,
  a.is_archived,
  (a.uploaded_by_user_id IS NULL) AS uploader_is_null,
  count(u.id) AS usage_count,
  EXISTS (SELECT 1 FROM storage.objects o WHERE o.bucket_id=a.storage_bucket AND o.name=a.storage_path) AS storage_object_exists,
  CASE WHEN count(u.id)>0 THEN 'DELETE BUSINESS ASSET' ELSE 'DELETE ORPHAN ASSET' END AS classification
FROM public.media_assets a
LEFT JOIN public.media_asset_usages u ON u.media_asset_id=a.id
GROUP BY a.id
ORDER BY classification,a.storage_bucket,a.storage_path;

-- P7M.03_MEDIA_USAGE_CLASSIFICATION
WITH classified AS MATERIALIZED (
  SELECT u.*,
    CASE u.entity_type
      WHEN 'admin_profile' THEN EXISTS(SELECT 1 FROM public.admin_profiles x WHERE x.id=u.entity_id)
      WHEN 'board_member' THEN EXISTS(SELECT 1 FROM public.board_members x WHERE x.id=u.entity_id)
      WHEN 'club_contact' THEN EXISTS(SELECT 1 FROM public.club_contacts x WHERE x.id=u.entity_id)
      WHEN 'club_history' THEN EXISTS(SELECT 1 FROM public.club_history_images x WHERE x.id=u.entity_id)
      WHEN 'coach' THEN EXISTS(SELECT 1 FROM public.coaches x WHERE x.id=u.entity_id)
      WHEN 'download' THEN EXISTS(SELECT 1 FROM public.downloads x WHERE x.id=u.entity_id)
      WHEN 'event' THEN EXISTS(SELECT 1 FROM public.events x WHERE x.id=u.entity_id)
      WHEN 'event_document' THEN EXISTS(SELECT 1 FROM public.event_documents x WHERE x.id=u.entity_id)
      WHEN 'news' THEN EXISTS(SELECT 1 FROM public.news x WHERE x.id=u.entity_id)
      WHEN 'news_document' THEN EXISTS(SELECT 1 FROM public.news_documents x WHERE x.id=u.entity_id)
      WHEN 'page' THEN EXISTS(SELECT 1 FROM public.pages x WHERE x.id=u.entity_id)
      WHEN 'player' THEN EXISTS(SELECT 1 FROM public.players x WHERE x.id=u.entity_id)
      WHEN 'sponsor' THEN EXISTS(SELECT 1 FROM public.sponsors x WHERE x.id=u.entity_id)
      WHEN 'team' THEN EXISTS(SELECT 1 FROM public.teams x WHERE x.id=u.entity_id)
      WHEN 'team_season' THEN EXISTS(SELECT 1 FROM public.team_seasons x WHERE x.id=u.entity_id)
      ELSE NULL
    END AS parent_exists
  FROM public.media_asset_usages u
)
SELECT 'P7M.03_MEDIA_USAGE_CLASSIFICATION' AS section,
  md5(media_asset_id::text) AS asset_ref, entity_type, field_name, parent_exists,
  CASE WHEN entity_type='admin_profile' AND field_name='avatar' AND parent_exists THEN 'DELETE BUSINESS USAGE'
       WHEN parent_exists=false THEN 'DELETE ORPHAN USAGE'
       WHEN parent_exists=true THEN 'DELETE BUSINESS USAGE'
       ELSE 'BLOCKED / MANUAL REVIEW' END AS classification
FROM classified ORDER BY classification,entity_type,field_name,asset_ref;

-- P7M.04_STORAGE_BUCKET_COUNTS
SELECT 'P7M.04_STORAGE_BUCKET_COUNTS' AS section,b.id AS bucket_id,
  count(o.id) AS object_count, b.public
FROM storage.buckets b LEFT JOIN storage.objects o ON o.bucket_id=b.id
GROUP BY b.id,b.public ORDER BY b.id;

-- P7M.05_DB_ASSET_STORAGE_MATCH
SELECT 'P7M.05_DB_ASSET_STORAGE_MATCH' AS section,
  count(*) AS media_assets,
  count(*) FILTER (WHERE o.id IS NOT NULL) AS db_assets_with_storage_object,
  count(*) FILTER (WHERE o.id IS NULL) AS db_assets_without_storage_object
FROM public.media_assets a
LEFT JOIN storage.objects o ON o.bucket_id=a.storage_bucket AND o.name=a.storage_path;

-- P7M.06_STORAGE_ORPHANS
SELECT 'P7M.06_STORAGE_ORPHANS' AS section,o.bucket_id,o.name,o.metadata->>'mimetype' AS mime_type,
  md5(o.bucket_id||'/'||o.name) AS object_ref,
  CASE WHEN a.id IS NULL THEN 'STORAGE ORPHAN – REVIEW LEGACY REFERENCES' ELSE 'DB ASSET + STORAGE OBJECT' END AS classification
FROM storage.objects o
LEFT JOIN public.media_assets a ON a.storage_bucket=o.bucket_id AND a.storage_path=o.name
ORDER BY classification,o.bucket_id,o.name;

-- P7M.07_LEGACY_REFERENCE_CHECK
-- Searches all values of the known media-bearing relations without assuming a specific legacy column.
WITH relation_rows AS MATERIALIZED (
  SELECT 'club_settings' AS relation_name,to_jsonb(x)::text AS payload FROM public.club_settings x UNION ALL
  SELECT 'admin_profiles',to_jsonb(x)::text FROM public.admin_profiles x UNION ALL
  SELECT 'board_members',to_jsonb(x)::text FROM public.board_members x UNION ALL
  SELECT 'club_contacts',to_jsonb(x)::text FROM public.club_contacts x UNION ALL
  SELECT 'club_history_images',to_jsonb(x)::text FROM public.club_history_images x UNION ALL
  SELECT 'coaches',to_jsonb(x)::text FROM public.coaches x UNION ALL
  SELECT 'department_sections',to_jsonb(x)::text FROM public.department_sections x UNION ALL
  SELECT 'downloads',to_jsonb(x)::text FROM public.downloads x UNION ALL
  SELECT 'event_documents',to_jsonb(x)::text FROM public.event_documents x UNION ALL
  SELECT 'events',to_jsonb(x)::text FROM public.events x UNION ALL
  SELECT 'news',to_jsonb(x)::text FROM public.news x UNION ALL
  SELECT 'news_documents',to_jsonb(x)::text FROM public.news_documents x UNION ALL
  SELECT 'pages',to_jsonb(x)::text FROM public.pages x UNION ALL
  SELECT 'players',to_jsonb(x)::text FROM public.players x UNION ALL
  SELECT 'sponsors',to_jsonb(x)::text FROM public.sponsors x UNION ALL
  SELECT 'team_seasons',to_jsonb(x)::text FROM public.team_seasons x UNION ALL
  SELECT 'teams',to_jsonb(x)::text FROM public.teams x
), orphan_objects AS MATERIALIZED (
  SELECT o.bucket_id,o.name FROM storage.objects o
  LEFT JOIN public.media_assets a ON a.storage_bucket=o.bucket_id AND a.storage_path=o.name WHERE a.id IS NULL
)
SELECT 'P7M.07_LEGACY_REFERENCE_CHECK' AS section,o.bucket_id,md5(o.bucket_id||'/'||o.name) AS object_ref,
  array_agg(DISTINCT r.relation_name ORDER BY r.relation_name) AS referencing_relations
FROM orphan_objects o JOIN relation_rows r ON strpos(r.payload,o.name)>0
GROUP BY o.bucket_id,o.name ORDER BY o.bucket_id,object_ref;

-- P7M.08_SUPERADMIN_AVATAR_CONTRACT
SELECT 'P7M.08_SUPERADMIN_AVATAR_CONTRACT' AS section,
  c.is_nullable,
  pg_get_constraintdef(k.oid) AS fk_definition,
  (SELECT count(*) FROM public.admin_profiles) AS admin_profiles,
  (SELECT count(*) FROM public.admin_profiles WHERE profile_image_media_asset_id IS NOT NULL) AS profiles_with_avatar,
  (SELECT count(*) FROM public.media_asset_usages WHERE entity_type='admin_profile' AND field_name='avatar') AS avatar_usages
FROM information_schema.columns c
JOIN pg_constraint k ON k.conrelid='public.admin_profiles'::regclass AND k.contype='f'
  AND pg_get_constraintdef(k.oid) ILIKE '%profile_image_media_asset_id%'
WHERE c.table_schema='public' AND c.table_name='admin_profiles' AND c.column_name='profile_image_media_asset_id';

-- P7M.09_FOUNDATION_GUARDS
SELECT 'P7M.09_FOUNDATION_GUARDS' AS section,
  (SELECT count(*) FROM auth.users) AS auth_users,
  (SELECT count(*) FROM public.admin_profiles) AS admin_profiles,
  (SELECT count(*) FROM public.admin_roles) AS roles,
  (SELECT count(*) FROM public.admin_permissions) AS permissions,
  (SELECT count(*) FROM public.admin_role_permissions) AS role_permissions,
  (SELECT count(*) FROM public.departments) AS departments,
  (SELECT count(*) FROM public.seasons) AS seasons,
  (SELECT count(*) FROM public.notification_audit) AS notification_audit,
  (SELECT count(*) FROM storage.buckets) AS storage_buckets;

-- P7M.10_RELEASE_GATE
WITH facts AS MATERIALIZED (
  SELECT
    (SELECT count(*) FROM auth.users)=1 AS keep_auth_ok,
    (SELECT count(*) FROM public.admin_profiles)=1 AS keep_profile_ok,
    (SELECT count(*) FROM public.admin_user_roles ur JOIN public.admin_roles r ON r.id=ur.role_id JOIN public.admin_profiles p ON p.id=ur.user_id WHERE p.is_active AND r.key='superadmin')=1 AS keep_superadmin_ok,
    (SELECT count(*) FROM public.admin_roles)=13 AS roles_ok,
    (SELECT count(*) FROM public.admin_permissions)=64 AS permissions_ok,
    (SELECT count(*) FROM public.admin_role_permissions)=249 AS role_permissions_ok,
    (SELECT count(*) FROM public.departments)=4 AS departments_ok,
    (SELECT count(*) FROM public.seasons)=2 AS seasons_ok,
    (SELECT count(*) FROM public.notification_audit)=25 AS notification_audit_ok,
    (SELECT array_agg(id ORDER BY id) FROM storage.buckets)=ARRAY['events-documents','media','media-library-private','media-library-public','news-documents']::text[] AS buckets_ok,
    (SELECT count(*) FROM public.media_assets)=33 AS assets_classified,
    (SELECT count(*) FROM public.media_asset_usages)=11 AS usages_classified,
    (SELECT count(*) FROM storage.objects)=109 AS storage_objects_classified,
    NOT EXISTS(SELECT 1 FROM public.media_assets a LEFT JOIN storage.objects o ON o.bucket_id=a.storage_bucket AND o.name=a.storage_path WHERE o.id IS NULL) AS every_asset_has_object,
    EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='public.admin_profiles'::regclass AND contype='f' AND pg_get_constraintdef(oid) ILIKE '%profile_image_media_asset_id%' AND pg_get_constraintdef(oid) ILIKE '%ON DELETE SET NULL%') AS avatar_set_null_ok
)
SELECT 'P7M.10_RELEASE_GATE' AS section,f.*,
  (keep_auth_ok AND keep_profile_ok AND keep_superadmin_ok AND roles_ok AND permissions_ok AND role_permissions_ok AND departments_ok AND seasons_ok
   AND notification_audit_ok AND buckets_ok AND assets_classified AND usages_classified AND storage_objects_classified AND every_asset_has_object AND avatar_set_null_ok) AS structural_release_gate,
  false AS final_release_gate,
  'Final gate remains false until P7M.07 is empty and the operator approves the private manifest and irreversible storage loss.' AS reason
FROM facts f;
