-- PRIORITY 7 auth cleanup postcheck - READ ONLY
-- Run only after the separately approved sequential Admin API deletion.

-- P7AP.01_FINAL_AUTH_IDENTITY
WITH keep_operator AS MATERIALIZED (
  SELECT DISTINCT ap.id
  FROM public.admin_profiles ap JOIN auth.users au ON au.id = ap.id
  JOIN public.admin_user_roles aur ON aur.user_id = ap.id
  JOIN public.admin_roles ar ON ar.id = aur.role_id
  WHERE ap.is_active IS TRUE AND ar.key = 'superadmin' AND ar.is_active IS TRUE
)
SELECT 'P7AP.01_FINAL_AUTH_IDENTITY' AS section,
  (SELECT count(*) FROM auth.users) = 1 AS exactly_one_auth_user,
  (SELECT count(*) FROM keep_operator) = 1 AS exactly_one_keep_operator,
  (SELECT count(*) FROM public.admin_profiles) = 1 AS exactly_one_admin_profile,
  (SELECT count(*) FROM auth.users au WHERE NOT EXISTS (SELECT 1 FROM keep_operator keep WHERE keep.id = au.id)) = 0 AS no_non_operator_auth_users,
  EXISTS (
    SELECT 1 FROM public.admin_user_roles aur
    JOIN public.admin_roles ar ON ar.id = aur.role_id
    JOIN keep_operator keep ON keep.id = aur.user_id
    WHERE ar.key = 'superadmin' AND ar.is_active IS TRUE
  ) AS keep_superadmin_binding_present;

-- P7AP.02_FOUNDATION
SELECT 'P7AP.02_FOUNDATION' AS section,
  (SELECT count(*) FROM public.admin_roles) = 13 AS roles_ok,
  (SELECT count(*) FROM public.admin_permissions) = 64 AS permissions_ok,
  (SELECT count(*) FROM public.admin_role_permissions) = 249 AS role_permissions_ok,
  (SELECT count(*) FROM public.departments) = 4 AS departments_ok,
  (SELECT count(*) FROM public.seasons) = 2 AS seasons_ok,
  (SELECT count(*) FROM public.notification_audit) = 25 AS notification_audit_ok,
  (SELECT count(*) FROM public.notification_email_global_settings) = 1 AS notification_global_settings_ok,
  (SELECT count(*) FROM public.notification_email_settings) = 27 AS notification_type_settings_ok,
  to_regclass('public.membership_request_recipients') IS NOT NULL AS membership_routing_present,
  to_regclass('public.club_settings') IS NOT NULL AS club_settings_present;

-- P7AP.03_NO_ORPHANS
SELECT 'P7AP.03_NO_ORPHANS' AS section,
  NOT EXISTS (SELECT 1 FROM public.admin_profiles ap LEFT JOIN auth.users au ON au.id = ap.id WHERE au.id IS NULL) AS no_profiles_without_auth_user,
  NOT EXISTS (SELECT 1 FROM auth.users au LEFT JOIN public.admin_profiles ap ON ap.id = au.id WHERE ap.id IS NULL) AS no_auth_users_without_profile,
  NOT EXISTS (
    SELECT 1 FROM public.admin_user_roles aur
    LEFT JOIN auth.users au ON au.id = aur.user_id
    LEFT JOIN public.admin_roles ar ON ar.id = aur.role_id
    WHERE au.id IS NULL OR ar.id IS NULL
  ) AS no_orphan_role_bindings;

-- P7AP.04_DEFERRED_MEDIA_STORAGE
SELECT 'P7AP.04_DEFERRED_MEDIA_STORAGE' AS section,
  (SELECT count(*) FROM public.media_assets)::bigint AS media_assets_after_auth_stage,
  (SELECT count(*) FROM public.media_assets) = 33 AS media_assets_unchanged,
  (SELECT count(*) FROM public.media_asset_usages)::bigint AS media_usages_after_profile_cleanup,
  (SELECT count(*) FROM public.media_asset_usages) = 11 AS expected_media_usages_after_profile_cleanup,
  (SELECT count(*) FROM public.media_asset_usages WHERE entity_type='admin_profile' AND field_name='avatar') = 1 AS only_keep_avatar_usage_remains,
  (SELECT count(*) FROM public.media_assets WHERE uploaded_by_user_id IS NULL)::bigint AS media_owner_null_count,
  (SELECT count(*) FROM storage.objects)::bigint AS storage_objects_after_auth_stage,
  (SELECT count(*) FROM storage.buckets)::bigint AS storage_buckets_after_auth_stage;

-- Expected resultsets: exactly 4. All booleans must be true. Compare the
-- P7AP.04 storage counts with the accepted auth-preflight baseline. The drop
-- from 19 to 11 usages is the verified admin_profile_cleanup_media_usage trigger
-- removing deleted-profile avatar links; assets and storage remain deferred.
