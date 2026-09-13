-- PRIORITY 7 - DATABASE / TESTDATA CLEANUP
-- PROPOSAL ONLY - DO NOT EXECUTE
-- Live baseline: P7.01-P7.22, captured 2026-09-13.
-- This proposal performs DATA cleanup only. It does not alter schema or auth.users.
-- Final operator contract: audit and seasons stay; media/storage and auth-user
-- cleanup remain separate. Released editorial/content rows are included here.

-- Dry-run inventory. Review this resultset separately before any later execution approval.
WITH operator AS MATERIALIZED (
  SELECT DISTINCT ap.id
  FROM public.admin_profiles ap JOIN auth.users au ON au.id=ap.id
  JOIN public.admin_user_roles aur ON aur.user_id=ap.id
  JOIN public.admin_roles ar ON ar.id=aur.role_id
  WHERE ap.is_active IS TRUE AND ar.key='superadmin' AND ar.is_active IS TRUE
)
SELECT 'P7CLEAN.00_DRY_RUN' AS section,
  (SELECT count(*) FROM operator)::bigint AS keep_user_count,
  ((SELECT count(*) FROM auth.users)-(SELECT count(*) FROM operator))::bigint AS later_admin_api_candidate_count,
  (SELECT count(*) FROM public.teams)::bigint AS teams,
  (SELECT count(*) FROM public.team_seasons)::bigint AS team_seasons,
  (SELECT count(*) FROM public.players)::bigint AS players,
  (SELECT count(*) FROM public.coaches)::bigint AS coaches,
  (SELECT count(*) FROM public.coach_team_seasons)::bigint AS coach_team_seasons,
  (SELECT count(*) FROM public.board_members)::bigint AS board_members,
  (SELECT count(*) FROM public.club_contacts)::bigint AS club_contacts,
  (SELECT count(*) FROM public.news)::bigint AS news,
  (SELECT count(*) FROM public.events)::bigint AS events,
  (SELECT count(*) FROM public.team_training_times)::bigint AS team_training_times,
  (SELECT count(*) FROM public.department_training_times)::bigint AS department_training_times,
  (SELECT count(*) FROM public.department_sections)::bigint AS department_sections,
  (SELECT count(*) FROM public.club_history_pages)::bigint AS club_history_pages,
  (SELECT count(*) FROM public.club_history_milestones)::bigint AS club_history_milestones,
  (SELECT count(*) FROM public.club_history_images)::bigint AS club_history_images,
  (SELECT count(*) FROM public.pages)::bigint AS pages,
  (SELECT count(*) FROM public.membership_requests)::bigint AS membership_requests,
  (SELECT count(*) FROM public.player_contributions)::bigint AS contributions,
  (SELECT count(*) FROM public.player_contribution_payments)::bigint AS payments,
  (SELECT count(*) FROM public.notifications)::bigint AS notifications,
  (SELECT count(*) FROM public.notification_deliveries)::bigint AS notification_deliveries,
  (SELECT count(*) FROM public.notification_audit)::bigint AS notification_audit_keep,
  (SELECT count(*) FROM public.seasons)::bigint AS seasons_keep,
  (SELECT count(*) FROM public.media_assets)::bigint AS media_assets_deferred,
  (SELECT count(*) FROM public.media_asset_usages)::bigint AS media_usages_deferred,
  (SELECT count(*) FROM public.downloads)::bigint AS downloads;

BEGIN;

-- Phase 0: fail-closed foundation, operator and exact-live-baseline guards.
DO $guard$
DECLARE
  keep_user_id uuid;
  keep_user_count bigint;
BEGIN
  SELECT count(DISTINCT ap.id)
    INTO keep_user_count
  FROM public.admin_profiles ap
  JOIN auth.users au ON au.id = ap.id
  JOIN public.admin_user_roles aur ON aur.user_id = ap.id
  JOIN public.admin_roles ar ON ar.id = aur.role_id
  WHERE ap.is_active IS TRUE AND ar.key = 'superadmin' AND ar.is_active IS TRUE;

  IF keep_user_count <> 1 THEN
    RAISE EXCEPTION 'Priority 7 guard: expected exactly one active Superadmin operator';
  END IF;

  SELECT DISTINCT ap.id INTO keep_user_id
  FROM public.admin_profiles ap
  JOIN auth.users au ON au.id = ap.id
  JOIN public.admin_user_roles aur ON aur.user_id = ap.id
  JOIN public.admin_roles ar ON ar.id = aur.role_id
  WHERE ap.is_active IS TRUE AND ar.key = 'superadmin' AND ar.is_active IS TRUE;

  IF keep_user_id IS NULL THEN
    RAISE EXCEPTION 'Priority 7 guard: expected exactly one active Superadmin operator';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = keep_user_id)
     OR NOT EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = keep_user_id)
     OR NOT EXISTS (
       SELECT 1 FROM public.admin_user_roles aur
       JOIN public.admin_roles ar ON ar.id=aur.role_id
       WHERE aur.user_id=keep_user_id AND ar.key='superadmin' AND ar.is_active IS TRUE
     ) THEN
    RAISE EXCEPTION 'Priority 7 guard: operator Auth/Profile/Role contract incomplete';
  END IF;

  IF (SELECT count(*) FROM public.admin_roles) <> 13
     OR (SELECT count(*) FROM public.admin_permissions) <> 64
     OR (SELECT count(*) FROM public.admin_role_permissions) <> 249
     OR (SELECT count(*) FROM public.departments) <> 4
     OR (SELECT count(*) FROM public.admin_profiles) <> 6
     OR (SELECT count(*) FROM auth.users) <> 6
     OR (SELECT count(*) FROM public.admin_user_roles) <> 10
     OR (SELECT count(*) FROM public.notification_email_global_settings) <> 1
     OR (SELECT count(*) FROM public.notification_email_settings) <> 27
     OR NOT EXISTS (SELECT 1 FROM public.seasons)
     OR to_regclass('public.membership_request_recipients') IS NULL
     OR to_regclass('public.club_settings') IS NULL THEN
    RAISE EXCEPTION 'Priority 7 guard: identity or authorization foundation drift';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.departments WHERE slug='fussball' AND is_active IS TRUE)
     OR NOT EXISTS (SELECT 1 FROM public.departments WHERE slug='tischtennis' AND is_active IS TRUE)
     OR NOT EXISTS (SELECT 1 FROM public.departments WHERE slug='behindertensport' AND is_active IS TRUE)
     OR NOT EXISTS (SELECT 1 FROM public.departments WHERE slug='damen-gymnastik' AND is_active IS TRUE) THEN
    RAISE EXCEPTION 'Priority 7 guard: department foundation drift';
  END IF;

  -- Exact P7 baselines. Never use pg_stat estimated_rows here.
  IF (SELECT count(*) FROM public.teams) <> 11
     OR (SELECT count(*) FROM public.team_seasons) <> 16
     OR (SELECT count(*) FROM public.players) <> 22
     OR (SELECT count(*) FROM public.coaches) <> 8
     OR (SELECT count(*) FROM public.coach_team_seasons) <> 15
     OR (SELECT count(*) FROM public.player_team_seasons) <> 25
     OR (SELECT count(*) FROM public.board_members) <> 9
     OR (SELECT count(*) FROM public.news) <> 2
     OR (SELECT count(*) FROM public.events) <> 6
     OR (SELECT count(*) FROM public.team_training_times) <> 7
     OR (SELECT count(*) FROM public.team_training_exceptions) <> 0
     OR (SELECT count(*) FROM public.membership_requests) <> 13
     OR (SELECT count(*) FROM public.player_contributions) <> 5
     OR (SELECT count(*) FROM public.player_contribution_payments) <> 8
     OR (SELECT count(*) FROM public.notifications) <> 11
     OR (SELECT count(*) FROM public.notification_deliveries) <> 8
     OR (SELECT count(*) FROM public.notification_preferences) <> 0
     OR (SELECT count(*) FROM public.admin_email_change_requests) <> 5
     OR (SELECT count(*) FROM public.media_assets) <> 33
     OR (SELECT count(*) FROM public.media_asset_usages) <> 19
     OR (SELECT count(*) FROM public.downloads) <> 1
     OR (SELECT count(*) FROM public.news_documents) <> 0
     OR (SELECT count(*) FROM public.event_documents) <> 1
     OR (SELECT count(*) FROM public.sponsors) <> 2
     OR (SELECT count(*) FROM public.team_season_external_competitions) <> 2
     OR (SELECT count(*) FROM public.team_season_year_groups) <> 3 THEN
    RAISE EXCEPTION 'Priority 7 guard: cleanup data baseline drift; rerun read-only preflight';
  END IF;

  IF (SELECT count(*) FROM public.club_contacts) <> 5
     OR (SELECT count(*) FROM public.department_sections) <> 2
     OR (SELECT count(*) FROM public.department_training_times) <> 2
     OR (SELECT count(*) FROM public.club_history_pages) <> 1
     OR (SELECT count(*) FROM public.club_history_milestones) <> 14
     OR (SELECT count(*) FROM public.club_history_images) <> 0
     OR (SELECT count(*) FROM public.pages) <> 2
     OR (SELECT count(*) FROM public.notification_audit) <> 25
     OR (SELECT count(*) FROM public.seasons) <> 2
     OR NOT EXISTS (SELECT 1 FROM public.seasons WHERE name='2026/2027')
     OR NOT EXISTS (SELECT 1 FROM public.seasons WHERE name='2027/2028') THEN
    RAISE EXCEPTION 'Priority 7 guard: final decision or retained-data baseline drift';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_constraint
    WHERE contype='f'
      AND conrelid='public.notification_audit'::regclass
      AND confrelid IN ('public.notifications'::regclass, 'public.notification_deliveries'::regclass)
  ) THEN
    RAISE EXCEPTION 'Priority 7 guard: notification audit unexpectedly references cleanup rows';
  END IF;

  -- Any new closure row invalidates the approved zero-row execution baseline.
  IF (SELECT count(*) FROM public.club_closure_periods) <> 0 THEN
    RAISE EXCEPTION 'Priority 7 guard: closure period baseline drift; reclassify before cleanup';
  END IF;

  IF (SELECT count(*) FROM public.admin_email_change_requests WHERE status IN ('pending','processing','compensating')) <> 0 THEN
    RAISE EXCEPTION 'Priority 7 guard: active email-change workflow exists';
  END IF;
END
$guard$;

-- Phase 1: communication and workflow test data.
DELETE FROM public.notification_deliveries;
DELETE FROM public.notifications;
DELETE FROM public.notification_preferences;
DELETE FROM public.admin_email_change_requests;

-- Phase 2: contribution and membership children before their parents.
DELETE FROM public.player_contribution_payments;
DELETE FROM public.player_contributions;
DELETE FROM public.membership_requests;

-- Phase 3: documents/content explicitly released by the operator.
DELETE FROM public.news_documents;
DELETE FROM public.event_documents;
DELETE FROM public.downloads;
DELETE FROM public.news;
DELETE FROM public.events;
DELETE FROM public.sponsors;
DELETE FROM public.department_training_times;
DELETE FROM public.department_sections;
DELETE FROM public.club_history_images;
DELETE FROM public.club_history_milestones;
DELETE FROM public.club_history_pages;
DELETE FROM public.pages;

-- Phase 4: seasonal children and assignment data.
DELETE FROM public.team_training_exceptions;
DELETE FROM public.team_training_times;
DELETE FROM public.team_season_external_competitions;
DELETE FROM public.team_season_year_groups;
DELETE FROM public.coach_team_seasons;
DELETE FROM public.player_team_seasons;

-- Phase 5: seasonal parents and person/team master data.
DELETE FROM public.team_seasons;
DELETE FROM public.board_members;
DELETE FROM public.club_contacts;
DELETE FROM public.players;
DELETE FROM public.coaches;
DELETE FROM public.teams;

-- Deliberately retained or handled in later controlled stages:
-- notification_audit and seasons stay. media_asset_usages, media_assets and
-- all storage.objects are a separate manifest-backed stage.
-- Non-Superadmin Auth users and their profiles/role links are removed later
-- through the Supabase Admin API, never by direct SQL against auth.users.

-- Transaction-local invariants before commit.
DO $post_guard$
BEGIN
  IF EXISTS (SELECT 1 FROM public.teams)
     OR EXISTS (SELECT 1 FROM public.team_seasons)
     OR EXISTS (SELECT 1 FROM public.players)
     OR EXISTS (SELECT 1 FROM public.coaches)
     OR EXISTS (SELECT 1 FROM public.board_members)
     OR EXISTS (SELECT 1 FROM public.player_team_seasons)
     OR EXISTS (SELECT 1 FROM public.coach_team_seasons)
     OR EXISTS (SELECT 1 FROM public.team_season_year_groups)
     OR EXISTS (SELECT 1 FROM public.team_season_external_competitions)
     OR EXISTS (SELECT 1 FROM public.news)
     OR EXISTS (SELECT 1 FROM public.news_documents)
     OR EXISTS (SELECT 1 FROM public.events)
     OR EXISTS (SELECT 1 FROM public.event_documents)
     OR EXISTS (SELECT 1 FROM public.sponsors)
     OR EXISTS (SELECT 1 FROM public.downloads)
     OR EXISTS (SELECT 1 FROM public.club_contacts)
     OR EXISTS (SELECT 1 FROM public.department_sections)
     OR EXISTS (SELECT 1 FROM public.department_training_times)
     OR EXISTS (SELECT 1 FROM public.club_history_pages)
     OR EXISTS (SELECT 1 FROM public.club_history_images)
     OR EXISTS (SELECT 1 FROM public.club_history_milestones)
     OR EXISTS (SELECT 1 FROM public.pages)
     OR EXISTS (SELECT 1 FROM public.membership_requests)
     OR EXISTS (SELECT 1 FROM public.player_contributions)
     OR EXISTS (SELECT 1 FROM public.player_contribution_payments)
     OR EXISTS (SELECT 1 FROM public.team_training_times)
     OR EXISTS (SELECT 1 FROM public.team_training_exceptions)
     OR EXISTS (SELECT 1 FROM public.notifications)
     OR EXISTS (SELECT 1 FROM public.notification_deliveries)
     OR EXISTS (SELECT 1 FROM public.notification_preferences)
     OR EXISTS (SELECT 1 FROM public.admin_email_change_requests) THEN
    RAISE EXCEPTION 'Priority 7 post-guard: released core cleanup is incomplete';
  END IF;
  IF (SELECT count(*) FROM public.admin_roles) <> 13
     OR (SELECT count(*) FROM public.admin_permissions) <> 64
     OR (SELECT count(*) FROM public.admin_role_permissions) <> 249
     OR (SELECT count(*) FROM public.departments) <> 4
     OR (SELECT count(*) FROM public.notification_email_global_settings) <> 1
     OR (SELECT count(*) FROM public.notification_email_settings) <> 27
     OR (SELECT count(*) FROM public.seasons) <> 2
     OR (SELECT count(*) FROM public.notification_audit) <> 25
     OR (SELECT count(*) FROM public.club_closure_periods) <> 0
     OR to_regclass('public.membership_request_recipients') IS NULL
     OR to_regclass('public.club_settings') IS NULL THEN
    RAISE EXCEPTION 'Priority 7 post-guard: protected foundation changed';
  END IF;
END
$post_guard$;

COMMIT;
