-- PRIORITY 7 final aggregate postcheck.
-- MANUAL EXECUTION ONLY. STRICTLY READ-ONLY: SELECT/WITH/catalog reads only.

-- P7FINAL.01_AUTH
WITH keep_operator AS MATERIALIZED (
  SELECT DISTINCT ap.id,ap.profile_image_media_asset_id
  FROM public.admin_profiles ap
  JOIN auth.users au ON au.id=ap.id
  JOIN public.admin_user_roles aur ON aur.user_id=ap.id
  JOIN public.admin_roles ar ON ar.id=aur.role_id
  WHERE ap.is_active IS TRUE AND ar.key='superadmin' AND ar.is_active IS TRUE
)
SELECT 'P7FINAL.01_AUTH' AS section,
  (SELECT count(*) FROM auth.users) AS auth_users,
  (SELECT count(*) FROM public.admin_profiles) AS admin_profiles,
  (SELECT count(*) FROM keep_operator) AS valid_keep_superadmins,
  (SELECT count(*) FROM auth.users au WHERE NOT EXISTS(SELECT 1 FROM keep_operator k WHERE k.id=au.id)) AS non_superadmin_auth_users,
  EXISTS(SELECT 1 FROM keep_operator) AS active_profile_and_binding_present,
  NOT EXISTS(SELECT 1 FROM keep_operator WHERE profile_image_media_asset_id IS NOT NULL) AS keep_avatar_reference_cleared;

-- P7FINAL.02_FOUNDATION
SELECT 'P7FINAL.02_FOUNDATION' AS section,
  (SELECT count(*) FROM public.admin_roles) AS admin_roles,
  (SELECT count(*) FROM public.admin_permissions) AS admin_permissions,
  (SELECT count(*) FROM public.admin_role_permissions) AS admin_role_permissions,
  (SELECT count(*) FROM public.departments) AS departments,
  (SELECT count(*) FROM public.admin_roles)=13 AS roles_ok,
  (SELECT count(*) FROM public.admin_permissions)=64 AS permissions_ok,
  (SELECT count(*) FROM public.admin_role_permissions)=249 AS role_permissions_ok,
  (SELECT count(*) FROM public.departments)=4 AS departments_ok;

-- P7FINAL.03_SETTINGS_SEASONS
SELECT 'P7FINAL.03_SETTINGS_SEASONS' AS section,
  (SELECT count(*) FROM public.seasons) AS seasons,
  EXISTS(SELECT 1 FROM public.seasons WHERE name='2026/2027') AS season_2026_2027_present,
  EXISTS(SELECT 1 FROM public.seasons WHERE name='2027/2028') AS season_2027_2028_present,
  to_regclass('public.club_settings') IS NOT NULL AS club_settings_relation_present,
  (SELECT count(*) FROM public.club_settings) AS club_settings_rows,
  to_regclass('public.membership_request_recipients') IS NOT NULL AS membership_routing_relation_present,
  (SELECT count(*) FROM public.membership_request_recipients) AS membership_routing_rows,
  (SELECT count(*) FROM public.notification_email_global_settings) AS notification_email_global_settings,
  (SELECT count(*) FROM public.notification_email_settings) AS notification_email_type_settings;

-- P7FINAL.04_AUDIT
SELECT 'P7FINAL.04_AUDIT' AS section,
  count(*) AS notification_audit_rows,
  count(DISTINCT id) AS distinct_notification_audit_ids,
  count(*)=25 AS expected_audit_count,
  count(DISTINCT id)=25 AS audit_identity_count_intact
FROM public.notification_audit;

-- P7FINAL.05_CORE_EMPTY
SELECT 'P7FINAL.05_CORE_EMPTY' AS section,relation_name,row_count,(row_count=0) AS empty
FROM (VALUES
  ('public.notification_deliveries',(SELECT count(*)::bigint FROM public.notification_deliveries)),
  ('public.notifications',(SELECT count(*)::bigint FROM public.notifications)),
  ('public.notification_preferences',(SELECT count(*)::bigint FROM public.notification_preferences)),
  ('public.admin_email_change_requests',(SELECT count(*)::bigint FROM public.admin_email_change_requests)),
  ('public.player_contribution_payments',(SELECT count(*)::bigint FROM public.player_contribution_payments)),
  ('public.player_contributions',(SELECT count(*)::bigint FROM public.player_contributions)),
  ('public.membership_requests',(SELECT count(*)::bigint FROM public.membership_requests)),
  ('public.news_documents',(SELECT count(*)::bigint FROM public.news_documents)),
  ('public.event_documents',(SELECT count(*)::bigint FROM public.event_documents)),
  ('public.downloads',(SELECT count(*)::bigint FROM public.downloads)),
  ('public.news',(SELECT count(*)::bigint FROM public.news)),
  ('public.events',(SELECT count(*)::bigint FROM public.events)),
  ('public.sponsors',(SELECT count(*)::bigint FROM public.sponsors)),
  ('public.department_training_times',(SELECT count(*)::bigint FROM public.department_training_times)),
  ('public.department_sections',(SELECT count(*)::bigint FROM public.department_sections)),
  ('public.club_history_images',(SELECT count(*)::bigint FROM public.club_history_images)),
  ('public.club_history_milestones',(SELECT count(*)::bigint FROM public.club_history_milestones)),
  ('public.club_history_pages',(SELECT count(*)::bigint FROM public.club_history_pages)),
  ('public.pages',(SELECT count(*)::bigint FROM public.pages)),
  ('public.team_training_exceptions',(SELECT count(*)::bigint FROM public.team_training_exceptions)),
  ('public.team_training_times',(SELECT count(*)::bigint FROM public.team_training_times)),
  ('public.team_season_external_competitions',(SELECT count(*)::bigint FROM public.team_season_external_competitions)),
  ('public.team_season_year_groups',(SELECT count(*)::bigint FROM public.team_season_year_groups)),
  ('public.coach_team_seasons',(SELECT count(*)::bigint FROM public.coach_team_seasons)),
  ('public.player_team_seasons',(SELECT count(*)::bigint FROM public.player_team_seasons)),
  ('public.team_seasons',(SELECT count(*)::bigint FROM public.team_seasons)),
  ('public.board_members',(SELECT count(*)::bigint FROM public.board_members)),
  ('public.club_contacts',(SELECT count(*)::bigint FROM public.club_contacts)),
  ('public.players',(SELECT count(*)::bigint FROM public.players)),
  ('public.coaches',(SELECT count(*)::bigint FROM public.coaches)),
  ('public.teams',(SELECT count(*)::bigint FROM public.teams))
) AS core(relation_name,row_count)
ORDER BY relation_name;

-- P7FINAL.06_MEDIA_STORAGE
SELECT 'P7FINAL.06_MEDIA_STORAGE' AS section,
  (SELECT count(*) FROM public.media_assets) AS media_assets,
  (SELECT count(*) FROM public.media_asset_usages) AS media_asset_usages,
  (SELECT count(*) FROM public.admin_profiles WHERE profile_image_media_asset_id IS NOT NULL) AS admin_profile_media_references,
  (SELECT count(*) FROM storage.objects) AS storage_objects,
  (SELECT count(*) FROM storage.buckets) AS storage_buckets,
  (SELECT array_agg(id ORDER BY id) FROM storage.buckets)=ARRAY['events-documents','media','media-library-private','media-library-public','news-documents']::text[] AS exact_bucket_foundation_present;

-- P7FINAL.07_REFERENTIAL_INTEGRITY
SELECT 'P7FINAL.07_REFERENTIAL_INTEGRITY' AS section,
  NOT EXISTS(SELECT 1 FROM public.admin_profiles ap LEFT JOIN auth.users au ON au.id=ap.id WHERE au.id IS NULL) AS no_profiles_without_auth_user,
  NOT EXISTS(SELECT 1 FROM auth.users au LEFT JOIN public.admin_profiles ap ON ap.id=au.id WHERE ap.id IS NULL) AS no_auth_users_without_profile,
  NOT EXISTS(
    SELECT 1 FROM public.admin_user_roles aur
    LEFT JOIN auth.users au ON au.id=aur.user_id
    LEFT JOIN public.admin_profiles ap ON ap.id=aur.user_id
    LEFT JOIN public.admin_roles ar ON ar.id=aur.role_id
    WHERE au.id IS NULL OR ap.id IS NULL OR ar.id IS NULL
  ) AS no_orphan_role_bindings,
  NOT EXISTS(SELECT 1 FROM public.media_asset_usages u LEFT JOIN public.media_assets a ON a.id=u.media_asset_id WHERE a.id IS NULL) AS no_orphan_media_usages,
  NOT EXISTS(SELECT 1 FROM public.admin_profiles WHERE profile_image_media_asset_id IS NOT NULL) AS no_profile_media_references,
  NOT EXISTS(SELECT 1 FROM public.media_assets a LEFT JOIN storage.objects o ON o.bucket_id=a.storage_bucket AND o.name=a.storage_path WHERE o.id IS NULL) AS no_assets_without_storage_object,
  NOT EXISTS(SELECT 1 FROM storage.objects o LEFT JOIN public.media_assets a ON a.storage_bucket=o.bucket_id AND a.storage_path=o.name WHERE a.id IS NULL) AS no_storage_objects_without_asset,
  NOT EXISTS(
    SELECT 1 FROM pg_constraint c
    JOIN pg_class r ON r.oid=c.conrelid
    JOIN pg_namespace n ON n.oid=r.relnamespace
    WHERE c.contype='f' AND n.nspname IN('public','auth','storage') AND c.convalidated IS NOT TRUE
  ) AS all_relevant_foreign_keys_validated,
  (SELECT count(*) FROM public.club_closure_periods)=0 AS closure_periods_empty;

-- P7FINAL.08_FINAL_SUMMARY
WITH keep_operator AS MATERIALIZED (
  SELECT DISTINCT ap.id
  FROM public.admin_profiles ap
  JOIN auth.users au ON au.id=ap.id
  JOIN public.admin_user_roles aur ON aur.user_id=ap.id
  JOIN public.admin_roles ar ON ar.id=aur.role_id
  WHERE ap.is_active IS TRUE AND ar.key='superadmin' AND ar.is_active IS TRUE
), core_counts AS MATERIALIZED (
  SELECT row_count FROM (VALUES
    ((SELECT count(*)::bigint FROM public.notification_deliveries)),((SELECT count(*)::bigint FROM public.notifications)),
    ((SELECT count(*)::bigint FROM public.notification_preferences)),((SELECT count(*)::bigint FROM public.admin_email_change_requests)),
    ((SELECT count(*)::bigint FROM public.player_contribution_payments)),((SELECT count(*)::bigint FROM public.player_contributions)),
    ((SELECT count(*)::bigint FROM public.membership_requests)),((SELECT count(*)::bigint FROM public.news_documents)),
    ((SELECT count(*)::bigint FROM public.event_documents)),((SELECT count(*)::bigint FROM public.downloads)),
    ((SELECT count(*)::bigint FROM public.news)),((SELECT count(*)::bigint FROM public.events)),
    ((SELECT count(*)::bigint FROM public.sponsors)),((SELECT count(*)::bigint FROM public.department_training_times)),
    ((SELECT count(*)::bigint FROM public.department_sections)),((SELECT count(*)::bigint FROM public.club_history_images)),
    ((SELECT count(*)::bigint FROM public.club_history_milestones)),((SELECT count(*)::bigint FROM public.club_history_pages)),
    ((SELECT count(*)::bigint FROM public.pages)),((SELECT count(*)::bigint FROM public.team_training_exceptions)),
    ((SELECT count(*)::bigint FROM public.team_training_times)),((SELECT count(*)::bigint FROM public.team_season_external_competitions)),
    ((SELECT count(*)::bigint FROM public.team_season_year_groups)),((SELECT count(*)::bigint FROM public.coach_team_seasons)),
    ((SELECT count(*)::bigint FROM public.player_team_seasons)),((SELECT count(*)::bigint FROM public.team_seasons)),
    ((SELECT count(*)::bigint FROM public.board_members)),((SELECT count(*)::bigint FROM public.club_contacts)),
    ((SELECT count(*)::bigint FROM public.players)),((SELECT count(*)::bigint FROM public.coaches)),
    ((SELECT count(*)::bigint FROM public.teams))
  ) x(row_count)
), checks AS MATERIALIZED (
  SELECT
    ((SELECT count(*) FROM auth.users)=1 AND (SELECT count(*) FROM public.admin_profiles)=1 AND (SELECT count(*) FROM keep_operator)=1
      AND NOT EXISTS(SELECT 1 FROM public.admin_profiles WHERE profile_image_media_asset_id IS NOT NULL)) AS auth_pass,
    ((SELECT count(*) FROM public.admin_roles)=13 AND (SELECT count(*) FROM public.admin_permissions)=64
      AND (SELECT count(*) FROM public.admin_role_permissions)=249 AND (SELECT count(*) FROM public.departments)=4) AS foundation_pass,
    ((SELECT count(*) FROM public.seasons)=2 AND EXISTS(SELECT 1 FROM public.seasons WHERE name='2026/2027')
      AND EXISTS(SELECT 1 FROM public.seasons WHERE name='2027/2028') AND (SELECT count(*) FROM public.club_settings)>0
      AND to_regclass('public.membership_request_recipients') IS NOT NULL
      AND (SELECT count(*) FROM public.notification_email_global_settings)=1
      AND (SELECT count(*) FROM public.notification_email_settings)=27) AS settings_seasons_pass,
    ((SELECT count(*) FROM public.notification_audit)=25) AS audit_pass,
    ((SELECT count(*) FROM core_counts)=31 AND NOT EXISTS(SELECT 1 FROM core_counts WHERE row_count<>0)) AS core_empty_pass,
    ((SELECT count(*) FROM public.media_assets)=0 AND (SELECT count(*) FROM public.media_asset_usages)=0
      AND (SELECT count(*) FROM storage.objects)=0
      AND (SELECT array_agg(id ORDER BY id) FROM storage.buckets)=ARRAY['events-documents','media','media-library-private','media-library-public','news-documents']::text[]) AS media_storage_pass,
    (NOT EXISTS(SELECT 1 FROM public.admin_user_roles aur LEFT JOIN auth.users au ON au.id=aur.user_id LEFT JOIN public.admin_profiles ap ON ap.id=aur.user_id LEFT JOIN public.admin_roles ar ON ar.id=aur.role_id WHERE au.id IS NULL OR ap.id IS NULL OR ar.id IS NULL)
      AND NOT EXISTS(SELECT 1 FROM pg_constraint c JOIN pg_class r ON r.oid=c.conrelid JOIN pg_namespace n ON n.oid=r.relnamespace WHERE c.contype='f' AND n.nspname IN('public','auth','storage') AND c.convalidated IS NOT TRUE)) AS referential_integrity_pass,
    ((SELECT count(*) FROM public.club_closure_periods)=0) AS closure_pass
)
SELECT 'P7FINAL.08_FINAL_SUMMARY' AS section,c.*,
  (auth_pass AND foundation_pass AND settings_seasons_pass AND audit_pass AND core_empty_pass AND media_storage_pass AND referential_integrity_pass AND closure_pass) AS final_sql_pass,
  'MANUAL CHECKS STILL REQUIRED: normal Superadmin login, /admin/profile without avatar, and public route smoke.' AS manual_gate
FROM checks c;

-- Expected resultsets: exactly 8. P7FINAL.08.final_sql_pass must be true.
-- Manual checks A-C remain mandatory and cannot be proven by SQL.
