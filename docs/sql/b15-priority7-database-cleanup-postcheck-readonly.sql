-- PRIORITY 7 cleanup postcheck - READ ONLY
-- Run after the separately reviewed core cleanup. Auth-user cleanup is a later,
-- independent Admin-API stage and is reported here without being a core gate.

-- P7C.01_OPERATOR_AND_FOUNDATION
WITH operator AS MATERIALIZED (
  SELECT DISTINCT ap.id
  FROM public.admin_profiles ap JOIN auth.users au ON au.id=ap.id
  JOIN public.admin_user_roles aur ON aur.user_id=ap.id
  JOIN public.admin_roles ar ON ar.id=aur.role_id
  WHERE ap.is_active IS TRUE AND ar.key='superadmin' AND ar.is_active IS TRUE
)
SELECT 'P7C.01_OPERATOR_AND_FOUNDATION' AS section,
  (SELECT count(*) FROM operator)=1 AS exactly_one_operator,
  EXISTS (SELECT 1 FROM auth.users au JOIN operator o ON o.id=au.id) AS operator_auth_user_present,
  EXISTS (SELECT 1 FROM public.admin_profiles ap JOIN operator o ON o.id=ap.id) AS operator_profile_present,
  EXISTS (
    SELECT 1 FROM public.admin_user_roles aur
    JOIN public.admin_roles ar ON ar.id=aur.role_id
    JOIN operator o ON o.id=aur.user_id
    WHERE ar.key='superadmin' AND ar.is_active IS TRUE
  ) AS operator_superadmin_binding_present,
  ((SELECT count(*) FROM auth.users)-(SELECT count(*) FROM operator))::bigint AS remaining_non_operator_auth_users,
  ((SELECT count(*) FROM public.admin_profiles)-(SELECT count(*) FROM operator))::bigint AS remaining_non_operator_profiles,
  (SELECT count(*) FROM public.admin_roles)=13 AS roles_unchanged,
  (SELECT count(*) FROM public.admin_permissions)=64 AS permissions_unchanged,
  (SELECT count(*) FROM public.admin_role_permissions)=249 AS role_permissions_unchanged,
  (SELECT count(*) FROM public.departments)=4 AS departments_unchanged,
  (SELECT count(*) FROM public.seasons)=2 AS seasons_unchanged,
  EXISTS (SELECT 1 FROM public.seasons WHERE name='2026/2027') AS season_2026_2027_present,
  EXISTS (SELECT 1 FROM public.seasons WHERE name='2027/2028') AS season_2027_2028_present,
  (SELECT count(*) FROM public.notification_email_global_settings)=1 AS notification_email_global_settings_unchanged,
  (SELECT count(*) FROM public.notification_email_settings)=27 AS notification_email_type_settings_unchanged,
  to_regclass('public.club_settings') IS NOT NULL AS club_settings_relation_present,
  (SELECT count(*) FROM public.club_settings)::bigint AS club_settings_rows,
  to_regclass('public.membership_request_recipients') IS NOT NULL AS membership_routing_relation_present;

-- P7C.02_RELEASED_CORE_COUNTS
SELECT 'P7C.02_RELEASED_CORE_COUNTS' AS section, metric, row_count FROM (VALUES
 ('teams',(SELECT count(*)::bigint FROM public.teams)),
 ('team_seasons',(SELECT count(*)::bigint FROM public.team_seasons)),
 ('team_season_year_groups',(SELECT count(*)::bigint FROM public.team_season_year_groups)),
 ('team_season_external_competitions',(SELECT count(*)::bigint FROM public.team_season_external_competitions)),
 ('players',(SELECT count(*)::bigint FROM public.players)),
 ('player_team_seasons',(SELECT count(*)::bigint FROM public.player_team_seasons)),
 ('coaches',(SELECT count(*)::bigint FROM public.coaches)),
 ('coach_team_seasons',(SELECT count(*)::bigint FROM public.coach_team_seasons)),
 ('board_members',(SELECT count(*)::bigint FROM public.board_members)),
 ('club_contacts',(SELECT count(*)::bigint FROM public.club_contacts)),
 ('news',(SELECT count(*)::bigint FROM public.news)),
 ('news_documents',(SELECT count(*)::bigint FROM public.news_documents)),
 ('events',(SELECT count(*)::bigint FROM public.events)),
 ('event_documents',(SELECT count(*)::bigint FROM public.event_documents)),
 ('sponsors',(SELECT count(*)::bigint FROM public.sponsors)),
 ('downloads',(SELECT count(*)::bigint FROM public.downloads)),
 ('department_sections',(SELECT count(*)::bigint FROM public.department_sections)),
 ('department_training_times',(SELECT count(*)::bigint FROM public.department_training_times)),
 ('club_history_pages',(SELECT count(*)::bigint FROM public.club_history_pages)),
 ('club_history_images',(SELECT count(*)::bigint FROM public.club_history_images)),
 ('club_history_milestones',(SELECT count(*)::bigint FROM public.club_history_milestones)),
 ('pages',(SELECT count(*)::bigint FROM public.pages)),
 ('team_training_times',(SELECT count(*)::bigint FROM public.team_training_times)),
 ('team_training_exceptions',(SELECT count(*)::bigint FROM public.team_training_exceptions)),
 ('membership_requests',(SELECT count(*)::bigint FROM public.membership_requests)),
 ('player_contributions',(SELECT count(*)::bigint FROM public.player_contributions)),
 ('player_contribution_payments',(SELECT count(*)::bigint FROM public.player_contribution_payments)),
 ('notifications',(SELECT count(*)::bigint FROM public.notifications)),
 ('notification_deliveries',(SELECT count(*)::bigint FROM public.notification_deliveries)),
 ('notification_preferences',(SELECT count(*)::bigint FROM public.notification_preferences)),
 ('admin_email_change_requests',(SELECT count(*)::bigint FROM public.admin_email_change_requests))
) x(metric,row_count) ORDER BY metric;

-- P7C.03_RELATIONAL_INTEGRITY
SELECT 'P7C.03_RELATIONAL_INTEGRITY' AS section,
  NOT EXISTS (SELECT 1 FROM public.team_seasons ts LEFT JOIN public.teams t ON t.id=ts.team_id WHERE t.id IS NULL) AS no_orphan_team_seasons,
  NOT EXISTS (SELECT 1 FROM public.coach_team_seasons cts LEFT JOIN public.coaches c ON c.id=cts.coach_id LEFT JOIN public.team_seasons ts ON ts.id=cts.team_season_id WHERE c.id IS NULL OR ts.id IS NULL) AS no_orphan_coach_assignments,
  NOT EXISTS (SELECT 1 FROM public.player_team_seasons pts LEFT JOIN public.players p ON p.id=pts.player_id LEFT JOIN public.team_seasons ts ON ts.id=pts.team_season_id WHERE p.id IS NULL OR ts.id IS NULL) AS no_orphan_player_assignments,
  NOT EXISTS (SELECT 1 FROM public.media_asset_usages u LEFT JOIN public.media_assets a ON a.id=u.media_asset_id WHERE a.id IS NULL) AS no_orphan_media_usages,
  NOT EXISTS (SELECT 1 FROM public.downloads d LEFT JOIN public.media_assets a ON a.id=d.media_asset_id WHERE a.id IS NULL) AS no_orphan_downloads,
  NOT EXISTS (SELECT 1 FROM public.notification_deliveries d LEFT JOIN public.notifications n ON n.id=d.notification_id WHERE n.id IS NULL) AS no_orphan_deliveries,
  NOT EXISTS (SELECT 1 FROM public.admin_user_roles aur LEFT JOIN auth.users au ON au.id=aur.user_id LEFT JOIN public.admin_roles ar ON ar.id=aur.role_id WHERE au.id IS NULL OR ar.id IS NULL) AS no_orphan_user_roles;

-- P7C.04_RETAINED_AND_DEFERRED_DATA
SELECT 'P7C.04_RETAINED_AND_DEFERRED_DATA' AS section, metric, row_count FROM (VALUES
 ('notification_audit',(SELECT count(*)::bigint FROM public.notification_audit)),
 ('club_closure_periods',(SELECT count(*)::bigint FROM public.club_closure_periods)),
 ('seasons',(SELECT count(*)::bigint FROM public.seasons)),
 ('membership_request_recipients',(SELECT count(*)::bigint FROM public.membership_request_recipients)),
 ('media_assets',(SELECT count(*)::bigint FROM public.media_assets)),
 ('media_asset_usages',(SELECT count(*)::bigint FROM public.media_asset_usages))
) x(metric,row_count) ORDER BY metric;

-- P7C.05_OPTIONAL_POST_ADMIN_API_AUTH_CHECK
-- This becomes an acceptance gate only after the separate, explicitly approved
-- Admin-API deletion of the five non-operator users.
WITH operator AS MATERIALIZED (
  SELECT DISTINCT ap.id
  FROM public.admin_profiles ap JOIN auth.users au ON au.id=ap.id
  JOIN public.admin_user_roles aur ON aur.user_id=ap.id
  JOIN public.admin_roles ar ON ar.id=aur.role_id
  WHERE ap.is_active IS TRUE AND ar.key='superadmin' AND ar.is_active IS TRUE
)
SELECT 'P7C.05_OPTIONAL_POST_ADMIN_API_AUTH_CHECK' AS section,
  (SELECT count(*) FROM operator)=1 AS exactly_one_operator,
  (SELECT count(*) FROM auth.users)=1 AS exactly_one_auth_user_after_admin_api_stage,
  (SELECT count(*) FROM public.admin_profiles)=1 AS exactly_one_admin_profile_after_admin_api_stage;

-- Expected resultsets: exactly 5.
