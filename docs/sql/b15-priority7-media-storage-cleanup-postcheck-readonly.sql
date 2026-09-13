-- PRIORITY 7 media/storage cleanup postcheck.
-- READ-ONLY: run manually only after a separately approved cleanup execution.

SELECT 'P7MP.01_MEDIA_EMPTY' AS section,
  (SELECT count(*) FROM public.media_assets) AS media_assets,
  (SELECT count(*) FROM public.media_asset_usages) AS media_asset_usages;

SELECT 'P7MP.02_SUPERADMIN' AS section,
  (SELECT count(*) FROM auth.users) AS auth_users,
  (SELECT count(*) FROM public.admin_profiles) AS admin_profiles,
  (SELECT count(*) FROM public.admin_profiles WHERE profile_image_media_asset_id IS NOT NULL) AS profiles_with_avatar,
  (SELECT count(*) FROM public.admin_user_roles ur JOIN public.admin_roles r ON r.id=ur.role_id JOIN public.admin_profiles p ON p.id=ur.user_id WHERE p.is_active AND r.key='superadmin') AS active_superadmin_bindings;

SELECT 'P7MP.03_FOUNDATION' AS section,
  (SELECT count(*) FROM public.admin_roles) AS roles,
  (SELECT count(*) FROM public.admin_permissions) AS permissions,
  (SELECT count(*) FROM public.admin_role_permissions) AS role_permissions,
  (SELECT count(*) FROM public.departments) AS departments,
  (SELECT count(*) FROM public.seasons) AS seasons,
  (SELECT count(*) FROM public.notification_audit) AS notification_audit;

SELECT 'P7MP.04_STORAGE' AS section,b.id AS bucket_id,count(o.id) AS object_count,b.public
FROM storage.buckets b LEFT JOIN storage.objects o ON o.bucket_id=b.id GROUP BY b.id,b.public ORDER BY b.id;

SELECT 'P7MP.05_FINAL_GATE' AS section,
  (SELECT count(*) FROM public.media_assets)=0 AS media_assets_empty,
  (SELECT count(*) FROM public.media_asset_usages)=0 AS usages_empty,
  (SELECT count(*) FROM auth.users)=1 AS auth_ok,
  (SELECT count(*) FROM public.admin_profiles)=1 AS profile_ok,
  (SELECT count(*) FROM public.admin_profiles WHERE profile_image_media_asset_id IS NOT NULL)=0 AS avatar_cleared,
  (SELECT count(*) FROM public.admin_roles)=13 AS roles_ok,
  (SELECT count(*) FROM public.admin_permissions)=64 AS permissions_ok,
  (SELECT count(*) FROM public.admin_role_permissions)=249 AS role_permissions_ok,
  (SELECT count(*) FROM public.departments)=4 AS departments_ok,
  (SELECT count(*) FROM public.seasons)=2 AS seasons_ok,
  (SELECT count(*) FROM public.notification_audit)=25 AS notification_audit_ok,
  (SELECT count(*) FROM storage.buckets)=5 AS buckets_ok,
  (SELECT count(*) FROM storage.objects)=0 AS storage_objects_empty;
