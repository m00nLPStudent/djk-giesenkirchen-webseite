-- B15.24H1 - Tischtennis security correction after the live postcheck
--
-- MANUAL EXECUTION ONLY. Do not run the original H1 proposal again.
-- This correction is intentionally limited to:
--   1. removing five legacy unrestricted public SELECT policies; and
--   2. removing PUBLIC/anon EXECUTE from the five H1 helper functions.

BEGIN;

-- The H1 proposal already installed named replacements. Require those known
-- objects before replacing their nullable COALESCE(..., true) predicates with
-- fail-closed active-only predicates.
DO $precheck$
DECLARE
  expected_policy record;
BEGIN
  FOR expected_policy IN
    SELECT *
    FROM (VALUES
      ('coach_team_seasons',  'h1_coach_team_seasons_public_read_active'),
      ('player_team_seasons', 'h1_player_team_seasons_public_read_active'),
      ('seasons',              'h1_seasons_public_read_active'),
      ('team_seasons',         'h1_team_seasons_public_read_active'),
      ('teams',                'h1_teams_public_read_active')
    ) AS required(table_name, policy_name)
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_catalog.pg_policies policy_row
      WHERE policy_row.schemaname = 'public'
        AND policy_row.tablename = expected_policy.table_name
        AND policy_row.policyname = expected_policy.policy_name
        AND policy_row.cmd = 'SELECT'
        AND 'anon' = ANY(policy_row.roles)
        AND 'authenticated' = ANY(policy_row.roles)
        AND policy_row.qual IS NOT NULL
    ) THEN
      RAISE EXCEPTION 'Required safe public read policy %.% is missing or unsafe; aborting.',
        expected_policy.table_name, expected_policy.policy_name;
    END IF;
  END LOOP;

  IF to_regprocedure('public.current_admin_has_permission(text)') IS NULL
     OR to_regprocedure('public.current_admin_has_non_table_tennis_permission(text)') IS NULL
     OR to_regprocedure('public.current_admin_permission_allows_department(text,uuid)') IS NULL
     OR to_regprocedure('public.current_admin_can_create_or_delete_board_member(text,uuid)') IS NULL
     OR to_regprocedure('public.current_admin_can_edit_board_member(uuid,uuid)') IS NULL THEN
    RAISE EXCEPTION 'One or more expected H1 helper functions are missing; aborting.';
  END IF;
END
$precheck$;

DROP POLICY IF EXISTS "Allow read coach team seasons" ON public.coach_team_seasons;
DROP POLICY IF EXISTS "Allow read player team seasons" ON public.player_team_seasons;
DROP POLICY IF EXISTS "Allow read seasons" ON public.seasons;
DROP POLICY IF EXISTS "Allow read team seasons" ON public.team_seasons;
DROP POLICY IF EXISTS "Public can read teams" ON public.teams;

-- All five is_active columns are nullable in the live schema. NULL is not an
-- active state and must therefore be denied rather than treated as true.
DROP POLICY IF EXISTS h1_seasons_public_read_active ON public.seasons;
CREATE POLICY h1_seasons_public_read_active
  ON public.seasons FOR SELECT TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS h1_teams_public_read_active ON public.teams;
CREATE POLICY h1_teams_public_read_active
  ON public.teams FOR SELECT TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS h1_team_seasons_public_read_active ON public.team_seasons;
CREATE POLICY h1_team_seasons_public_read_active
  ON public.team_seasons FOR SELECT TO anon, authenticated
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1
      FROM public.teams team
      WHERE team.id = team_id
        AND team.is_active = true
    )
  );

DROP POLICY IF EXISTS h1_player_team_seasons_public_read_active ON public.player_team_seasons;
CREATE POLICY h1_player_team_seasons_public_read_active
  ON public.player_team_seasons FOR SELECT TO anon, authenticated
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1
      FROM public.team_seasons team_season
      JOIN public.teams team ON team.id = team_season.team_id
      WHERE team_season.id = team_season_id
        AND team_season.is_active = true
        AND team.is_active = true
    )
  );

DROP POLICY IF EXISTS h1_coach_team_seasons_public_read_active ON public.coach_team_seasons;
CREATE POLICY h1_coach_team_seasons_public_read_active
  ON public.coach_team_seasons FOR SELECT TO anon, authenticated
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1
      FROM public.team_seasons team_season
      JOIN public.teams team ON team.id = team_season.team_id
      WHERE team_season.id = team_season_id
        AND team_season.is_active = true
        AND team.is_active = true
    )
  );

REVOKE EXECUTE ON FUNCTION public.current_admin_has_permission(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.current_admin_has_non_table_tennis_permission(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.current_admin_permission_allows_department(text, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.current_admin_can_create_or_delete_board_member(text, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.current_admin_can_edit_board_member(uuid, uuid) FROM PUBLIC, anon;

-- Preserve only the execution paths required by authenticated policy evaluation
-- and trusted service-role operations.
GRANT EXECUTE ON FUNCTION public.current_admin_has_permission(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_admin_has_non_table_tennis_permission(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_admin_permission_allows_department(text, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_admin_can_create_or_delete_board_member(text, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_admin_can_edit_board_member(uuid, uuid) TO authenticated, service_role;

DO $self_check$
DECLARE
  expected_policy record;
  helper_oid oid;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_policies policy_row
    WHERE policy_row.schemaname = 'public'
      AND (policy_row.tablename, policy_row.policyname) IN (
        ('coach_team_seasons',  'Allow read coach team seasons'),
        ('player_team_seasons', 'Allow read player team seasons'),
        ('seasons',              'Allow read seasons'),
        ('team_seasons',         'Allow read team seasons'),
        ('teams',                'Public can read teams')
      )
  ) THEN
    RAISE EXCEPTION 'One or more unrestricted legacy public read policies still exist.';
  END IF;

  FOR expected_policy IN
    SELECT *
    FROM (VALUES
      ('coach_team_seasons',  'h1_coach_team_seasons_public_read_active'),
      ('player_team_seasons', 'h1_player_team_seasons_public_read_active'),
      ('seasons',              'h1_seasons_public_read_active'),
      ('team_seasons',         'h1_team_seasons_public_read_active'),
      ('teams',                'h1_teams_public_read_active')
    ) AS required(table_name, policy_name)
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_catalog.pg_policies policy_row
      WHERE policy_row.schemaname = 'public'
        AND policy_row.tablename = expected_policy.table_name
        AND policy_row.policyname = expected_policy.policy_name
        AND policy_row.cmd = 'SELECT'
        AND 'anon' = ANY(policy_row.roles)
        AND 'authenticated' = ANY(policy_row.roles)
        AND policy_row.qual IS NOT NULL
        AND lower(regexp_replace(policy_row.qual, '[[:space:]()]', '', 'g')) <> 'true'
        AND lower(policy_row.qual) NOT LIKE '%coalesce%'
        AND lower(policy_row.qual) LIKE '%is_active%true%'
    ) THEN
      RAISE EXCEPTION 'Safe public read policy %.% is missing or unsafe.',
        expected_policy.table_name, expected_policy.policy_name;
    END IF;
  END LOOP;

  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_policies policy_row
    WHERE policy_row.schemaname = 'public'
      AND policy_row.tablename IN (
        'coach_team_seasons', 'player_team_seasons', 'seasons',
        'team_seasons', 'teams'
      )
      AND policy_row.cmd = 'SELECT'
      AND ('public' = ANY(policy_row.roles) OR 'anon' = ANY(policy_row.roles))
      AND lower(regexp_replace(COALESCE(policy_row.qual, ''), '[[:space:]()]', '', 'g')) = 'true'
  ) THEN
    RAISE EXCEPTION 'An unrestricted public/anon SELECT policy remains on a corrected table.';
  END IF;

  FOR helper_oid IN
    SELECT helper.signature::oid
    FROM (VALUES
      ('public.current_admin_has_permission(text)'::regprocedure),
      ('public.current_admin_has_non_table_tennis_permission(text)'::regprocedure),
      ('public.current_admin_permission_allows_department(text,uuid)'::regprocedure),
      ('public.current_admin_can_create_or_delete_board_member(text,uuid)'::regprocedure),
      ('public.current_admin_can_edit_board_member(uuid,uuid)'::regprocedure)
    ) AS helper(signature)
  LOOP
    IF EXISTS (
      SELECT 1
      FROM pg_catalog.pg_proc function_row
      CROSS JOIN LATERAL pg_catalog.aclexplode(
        COALESCE(function_row.proacl, pg_catalog.acldefault('f', function_row.proowner))
      ) function_acl
      WHERE function_row.oid = helper_oid
        AND function_acl.grantee = 0
        AND function_acl.privilege_type = 'EXECUTE'
    ) THEN
      RAISE EXCEPTION 'PUBLIC still has EXECUTE on helper %.', helper_oid::regprocedure;
    END IF;

    IF has_function_privilege('anon', helper_oid, 'EXECUTE') THEN
      RAISE EXCEPTION 'anon still has EXECUTE on helper %.', helper_oid::regprocedure;
    END IF;
    IF NOT has_function_privilege('authenticated', helper_oid, 'EXECUTE') THEN
      RAISE EXCEPTION 'authenticated lacks EXECUTE on helper %.', helper_oid::regprocedure;
    END IF;
    IF NOT has_function_privilege('service_role', helper_oid, 'EXECUTE') THEN
      RAISE EXCEPTION 'service_role lacks EXECUTE on helper %.', helper_oid::regprocedure;
    END IF;
  END LOOP;
END
$self_check$;

COMMIT;
