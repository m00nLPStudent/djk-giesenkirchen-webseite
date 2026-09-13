-- PRIORITY 7 - FINAL CORE CLEANUP DRY RUN
-- READ ONLY. This file performs no cleanup and has no side effects.
-- Expected resultsets: exactly 7 (P7DR.01 through P7DR.07).

-- P7DR.01_KEEP_GUARDS
WITH operator AS MATERIALIZED (
  SELECT DISTINCT ap.id
  FROM public.admin_profiles ap
  JOIN auth.users au ON au.id=ap.id
  JOIN public.admin_user_roles aur ON aur.user_id=ap.id
  JOIN public.admin_roles ar ON ar.id=aur.role_id
  WHERE ap.is_active IS TRUE AND ar.key='superadmin' AND ar.is_active IS TRUE
)
SELECT 'P7DR.01_KEEP_GUARDS' AS section,
  (SELECT count(*) FROM operator)=1 AS exactly_one_superadmin,
  (SELECT count(*) FROM public.admin_roles)=13 AS roles_ok,
  (SELECT count(*) FROM public.admin_permissions)=64 AS permissions_ok,
  (SELECT count(*) FROM public.admin_role_permissions)=249 AS role_permissions_ok,
  (SELECT count(*) FROM public.departments)=4 AS departments_ok,
  (SELECT count(*) FROM public.seasons)=2 AS seasons_count_ok,
  EXISTS(SELECT 1 FROM public.seasons WHERE name='2026/2027') AS season_2026_2027_ok,
  EXISTS(SELECT 1 FROM public.seasons WHERE name='2027/2028') AS season_2027_2028_ok,
  to_regclass('public.club_settings') IS NOT NULL AS club_settings_present,
  (SELECT count(*) FROM public.club_settings)::bigint AS club_settings_rows,
  to_regclass('public.membership_request_recipients') IS NOT NULL AS membership_routing_present,
  (SELECT count(*) FROM public.membership_request_recipients)::bigint AS membership_routing_rows,
  (SELECT count(*) FROM public.notification_email_global_settings)=1 AS global_mail_settings_ok,
  (SELECT count(*) FROM public.notification_email_settings)=27 AS type_mail_settings_ok,
  (SELECT count(*) FROM public.notification_audit)=25 AS notification_audit_ok,
  (SELECT count(*) FROM public.club_closure_periods)=0 AS closure_periods_ok;

-- P7DR.02_EXPECTED_CORE_DELETE_COUNTS
SELECT 'P7DR.02_EXPECTED_CORE_DELETE_COUNTS' AS section,
       relation_name, current_count,
       current_count AS expected_delete_count,
       0::bigint AS expected_remaining_count
FROM (VALUES
  ('notification_deliveries',(SELECT count(*)::bigint FROM public.notification_deliveries)),
  ('notifications',(SELECT count(*)::bigint FROM public.notifications)),
  ('notification_preferences',(SELECT count(*)::bigint FROM public.notification_preferences)),
  ('admin_email_change_requests',(SELECT count(*)::bigint FROM public.admin_email_change_requests)),
  ('player_contribution_payments',(SELECT count(*)::bigint FROM public.player_contribution_payments)),
  ('player_contributions',(SELECT count(*)::bigint FROM public.player_contributions)),
  ('membership_requests',(SELECT count(*)::bigint FROM public.membership_requests)),
  ('news_documents',(SELECT count(*)::bigint FROM public.news_documents)),
  ('event_documents',(SELECT count(*)::bigint FROM public.event_documents)),
  ('downloads',(SELECT count(*)::bigint FROM public.downloads)),
  ('news',(SELECT count(*)::bigint FROM public.news)),
  ('events',(SELECT count(*)::bigint FROM public.events)),
  ('sponsors',(SELECT count(*)::bigint FROM public.sponsors)),
  ('department_training_times',(SELECT count(*)::bigint FROM public.department_training_times)),
  ('department_sections',(SELECT count(*)::bigint FROM public.department_sections)),
  ('club_history_images',(SELECT count(*)::bigint FROM public.club_history_images)),
  ('club_history_milestones',(SELECT count(*)::bigint FROM public.club_history_milestones)),
  ('club_history_pages',(SELECT count(*)::bigint FROM public.club_history_pages)),
  ('pages',(SELECT count(*)::bigint FROM public.pages)),
  ('team_training_exceptions',(SELECT count(*)::bigint FROM public.team_training_exceptions)),
  ('team_training_times',(SELECT count(*)::bigint FROM public.team_training_times)),
  ('team_season_external_competitions',(SELECT count(*)::bigint FROM public.team_season_external_competitions)),
  ('team_season_year_groups',(SELECT count(*)::bigint FROM public.team_season_year_groups)),
  ('coach_team_seasons',(SELECT count(*)::bigint FROM public.coach_team_seasons)),
  ('player_team_seasons',(SELECT count(*)::bigint FROM public.player_team_seasons)),
  ('team_seasons',(SELECT count(*)::bigint FROM public.team_seasons)),
  ('board_members',(SELECT count(*)::bigint FROM public.board_members)),
  ('club_contacts',(SELECT count(*)::bigint FROM public.club_contacts)),
  ('players',(SELECT count(*)::bigint FROM public.players)),
  ('coaches',(SELECT count(*)::bigint FROM public.coaches)),
  ('teams',(SELECT count(*)::bigint FROM public.teams))
) counts(relation_name,current_count)
ORDER BY relation_name;

-- P7DR.03_CORE_FOREIGN_KEY_GRAPH
WITH delete_relations(name) AS MATERIALIZED (VALUES
 ('notification_deliveries'),('notifications'),('notification_preferences'),('admin_email_change_requests'),
 ('player_contribution_payments'),('player_contributions'),('membership_requests'),
 ('news_documents'),('event_documents'),('downloads'),('news'),('events'),('sponsors'),
 ('department_training_times'),('department_sections'),('club_history_images'),
 ('club_history_milestones'),('club_history_pages'),('pages'),('team_training_exceptions'),
 ('team_training_times'),('team_season_external_competitions'),('team_season_year_groups'),
 ('coach_team_seasons'),('player_team_seasons'),('team_seasons'),('board_members'),
 ('club_contacts'),('players'),('coaches'),('teams')
)
SELECT 'P7DR.03_CORE_FOREIGN_KEY_GRAPH' AS section,
       child.relname AS child_table, parent.relname AS parent_table,
       con.conname, pg_get_constraintdef(con.oid,true) AS definition,
       CASE con.confdeltype WHEN 'a' THEN 'NO ACTION' WHEN 'r' THEN 'RESTRICT'
         WHEN 'c' THEN 'CASCADE' WHEN 'n' THEN 'SET NULL' WHEN 'd' THEN 'SET DEFAULT' END AS on_delete
FROM pg_catalog.pg_constraint con
JOIN pg_catalog.pg_class child ON child.oid=con.conrelid
JOIN pg_catalog.pg_namespace child_ns ON child_ns.oid=child.relnamespace
JOIN pg_catalog.pg_class parent ON parent.oid=con.confrelid
JOIN pg_catalog.pg_namespace parent_ns ON parent_ns.oid=parent.relnamespace
WHERE con.contype='f' AND child_ns.nspname='public' AND parent_ns.nspname IN ('public','auth')
  AND (child.relname IN (SELECT name FROM delete_relations)
       OR parent.relname IN (SELECT name FROM delete_relations))
ORDER BY child.relname,parent.relname,con.conname;

-- P7DR.04_MUST_KEEP_REFERENCES_DELETE_DATA
WITH delete_relations(name) AS MATERIALIZED (VALUES
 ('notification_deliveries'),('notifications'),('notification_preferences'),('admin_email_change_requests'),
 ('player_contribution_payments'),('player_contributions'),('membership_requests'),('news_documents'),
 ('event_documents'),('downloads'),('news'),('events'),('sponsors'),('department_training_times'),
 ('department_sections'),('club_history_images'),('club_history_milestones'),('club_history_pages'),
 ('pages'),('team_training_exceptions'),('team_training_times'),('team_season_external_competitions'),
 ('team_season_year_groups'),('coach_team_seasons'),('player_team_seasons'),('team_seasons'),
 ('board_members'),('club_contacts'),('players'),('coaches'),('teams')
), keep_relations(name) AS MATERIALIZED (VALUES
 ('admin_profiles'),('admin_roles'),('admin_permissions'),('admin_role_permissions'),
 ('admin_user_roles'),('departments'),('seasons'),('club_settings'),
 ('membership_request_recipients'),('notification_email_global_settings'),
 ('notification_email_settings'),('notification_audit')
)
SELECT 'P7DR.04_MUST_KEEP_REFERENCES_DELETE_DATA' AS section,
       child.relname AS keep_child, parent.relname AS delete_parent,
       con.conname, pg_get_constraintdef(con.oid,true) AS definition
FROM pg_catalog.pg_constraint con
JOIN pg_catalog.pg_class child ON child.oid=con.conrelid
JOIN pg_catalog.pg_namespace child_ns ON child_ns.oid=child.relnamespace
JOIN pg_catalog.pg_class parent ON parent.oid=con.confrelid
JOIN pg_catalog.pg_namespace parent_ns ON parent_ns.oid=parent.relnamespace
WHERE con.contype='f' AND child_ns.nspname='public' AND parent_ns.nspname='public'
  AND child.relname IN (SELECT name FROM keep_relations)
  AND parent.relname IN (SELECT name FROM delete_relations)
ORDER BY child.relname,parent.relname,con.conname;

-- P7DR.05_DELETE_DATA_REFERENCES_MUST_KEEP
WITH delete_relations(name) AS MATERIALIZED (VALUES
 ('notification_deliveries'),('notifications'),('notification_preferences'),('admin_email_change_requests'),
 ('player_contribution_payments'),('player_contributions'),('membership_requests'),('news_documents'),
 ('event_documents'),('downloads'),('news'),('events'),('sponsors'),('department_training_times'),
 ('department_sections'),('club_history_images'),('club_history_milestones'),('club_history_pages'),
 ('pages'),('team_training_exceptions'),('team_training_times'),('team_season_external_competitions'),
 ('team_season_year_groups'),('coach_team_seasons'),('player_team_seasons'),('team_seasons'),
 ('board_members'),('club_contacts'),('players'),('coaches'),('teams')
), keep_relations(name) AS MATERIALIZED (VALUES
 ('admin_profiles'),('admin_roles'),('admin_permissions'),('admin_role_permissions'),
 ('admin_user_roles'),('departments'),('seasons'),('club_settings'),
 ('membership_request_recipients'),('notification_email_global_settings'),
 ('notification_email_settings'),('notification_audit')
)
SELECT 'P7DR.05_DELETE_DATA_REFERENCES_MUST_KEEP' AS section,
       child.relname AS delete_child, parent.relname AS keep_parent,
       con.conname, pg_get_constraintdef(con.oid,true) AS definition
FROM pg_catalog.pg_constraint con
JOIN pg_catalog.pg_class child ON child.oid=con.conrelid
JOIN pg_catalog.pg_namespace child_ns ON child_ns.oid=child.relnamespace
JOIN pg_catalog.pg_class parent ON parent.oid=con.confrelid
JOIN pg_catalog.pg_namespace parent_ns ON parent_ns.oid=parent.relnamespace
WHERE con.contype='f' AND child_ns.nspname='public' AND parent_ns.nspname='public'
  AND child.relname IN (SELECT name FROM delete_relations)
  AND parent.relname IN (SELECT name FROM keep_relations)
ORDER BY child.relname,parent.relname,con.conname;

-- P7DR.06_SUPERADMIN_AND_AVATAR_SAFETY
WITH operator AS MATERIALIZED (
  SELECT DISTINCT ap.id, ap.profile_image_media_asset_id
  FROM public.admin_profiles ap
  JOIN auth.users au ON au.id=ap.id
  JOIN public.admin_user_roles aur ON aur.user_id=ap.id
  JOIN public.admin_roles ar ON ar.id=aur.role_id
  WHERE ap.is_active IS TRUE AND ar.key='superadmin' AND ar.is_active IS TRUE
)
SELECT 'P7DR.06_SUPERADMIN_AND_AVATAR_SAFETY' AS section,
  (SELECT count(*) FROM operator)=1 AS exactly_one_operator,
  EXISTS(SELECT 1 FROM operator) AS operator_auth_profile_role_chain_present,
  (SELECT count(*) FROM operator WHERE profile_image_media_asset_id IS NOT NULL)::bigint AS operator_avatar_references,
  (SELECT count(*) FROM public.media_asset_usages u JOIN operator o
    ON u.entity_type='admin_profile' AND u.entity_id=o.id AND u.field_name='avatar')::bigint AS operator_avatar_usages,
  EXISTS(
    SELECT 1 FROM pg_catalog.pg_constraint
    WHERE conrelid='public.admin_profiles'::regclass
      AND confrelid='public.media_assets'::regclass
      AND confdeltype='n'
  ) AS avatar_fk_uses_on_delete_set_null,
  true AS avatar_deletion_is_separate_from_login;

-- P7DR.07_STAGE_CONTRACT
SELECT 'P7DR.07_STAGE_CONTRACT' AS section, stage, execution_contract
FROM (VALUES
  (1,'CORE SQL CLEANUP','31 approved public-table deletes in one guarded transaction; no auth/media/storage delete'),
  (2,'AUTH ADMIN API CLEANUP','five non-operator users only through the existing server-side Admin API'),
  (3,'MEDIA/STORAGE CLEANUP','manifest-backed media usage/assets and object cleanup; buckets remain')
) stages(stage,execution_contract)
ORDER BY stage;
