-- B15.24H1 – Tischtennis DB change and security hardening proposal
-- MANUAL EXECUTION ONLY. Review before running in Supabase SQL Editor.
-- Current business rows are test data. This proposal performs no business-data cleanup or backfill.

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Defensive preconditions
-- -----------------------------------------------------------------------------

DO $preflight$
BEGIN
  IF to_regclass('public.departments') IS NULL
     OR to_regclass('public.teams') IS NULL
     OR to_regclass('public.team_seasons') IS NULL
     OR to_regclass('public.players') IS NULL
     OR to_regclass('public.player_team_seasons') IS NULL
     OR to_regclass('public.coaches') IS NULL
     OR to_regclass('public.coach_team_seasons') IS NULL
     OR to_regclass('public.team_training_times') IS NULL
     OR to_regclass('public.team_training_exceptions') IS NULL
     OR to_regclass('public.board_members') IS NULL
     OR to_regclass('public.admin_roles') IS NULL
     OR to_regclass('public.admin_permissions') IS NULL
     OR to_regclass('public.admin_role_permissions') IS NULL
     OR to_regclass('public.admin_profiles') IS NULL
     OR to_regclass('public.admin_user_roles') IS NULL THEN
    RAISE EXCEPTION 'Required B15.24H1 relations are incomplete; aborting.';
  END IF;

  IF (SELECT count(*) FROM public.departments WHERE slug = 'tischtennis' AND is_active = true) <> 1 THEN
    RAISE EXCEPTION 'Expected exactly one active tischtennis department; aborting.';
  END IF;

  IF (SELECT count(*) FROM public.admin_roles WHERE key = 'tischtennis-vorstand' AND is_active = true) <> 1 THEN
    RAISE EXCEPTION 'Expected exactly one active tischtennis-vorstand role; aborting.';
  END IF;

  IF (
    SELECT count(*)
    FROM public.admin_permissions
    WHERE key IN (
      'dashboard.view',
      'teams.view', 'teams.create', 'teams.edit', 'teams.delete',
      'players.view', 'players.create', 'players.edit', 'players.delete',
      'coaches.view', 'coaches.create', 'coaches.edit', 'coaches.delete'
    )
  ) <> 13 THEN
    RAISE EXCEPTION 'Required existing dashboard/team/player/coach permissions are incomplete; aborting.';
  END IF;
END
$preflight$;

-- -----------------------------------------------------------------------------
-- 2. Department ownership for board members
-- Nullable by design: NULL continues to represent a non-department/global row.
-- No existing test row is backfilled.
-- -----------------------------------------------------------------------------

ALTER TABLE public.board_members
  ADD COLUMN IF NOT EXISTS department_id uuid;

DO $board_fk$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_constraint c
    JOIN pg_catalog.pg_class t ON t.oid = c.conrelid
    JOIN pg_catalog.pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'board_members'
      AND c.conname = 'board_members_department_id_fkey'
  ) THEN
    ALTER TABLE public.board_members
      ADD CONSTRAINT board_members_department_id_fkey
      FOREIGN KEY (department_id)
      REFERENCES public.departments(id)
      ON DELETE RESTRICT;
  END IF;
END
$board_fk$;

CREATE INDEX IF NOT EXISTS board_members_department_id_idx
  ON public.board_members(department_id)
  WHERE department_id IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 3. Granular board permissions
-- Existing roles retain their effective board reach by deriving the initial
-- mapping from their current settings permissions. The Tischtennis role receives
-- only board permissions, never settings.edit.
-- -----------------------------------------------------------------------------

INSERT INTO public.admin_permissions (key, name, description, category)
VALUES
  ('board.view', 'Vorstand ansehen', 'Vorstandsdatensätze im erlaubten Scope ansehen', 'board'),
  ('board.create', 'Vorstand anlegen', 'Vorstandsdatensätze im erlaubten Scope anlegen', 'board'),
  ('board.edit', 'Vorstand bearbeiten', 'Vorstandsdatensätze im erlaubten Scope bearbeiten', 'board'),
  ('board.delete', 'Vorstand löschen', 'Vorstandsdatensätze im erlaubten Scope löschen', 'board')
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category;

WITH mapping(role_id, permission_id) AS (
  SELECT DISTINCT rp.role_id, board_permission.id
  FROM public.admin_role_permissions rp
  JOIN public.admin_permissions existing_permission
    ON existing_permission.id = rp.permission_id
  JOIN public.admin_permissions board_permission
    ON board_permission.key = CASE
      WHEN existing_permission.key = 'settings.view' THEN 'board.view'
      WHEN existing_permission.key = 'settings.edit' THEN 'board.edit'
    END
  WHERE existing_permission.key IN ('settings.view', 'settings.edit')

  UNION

  SELECT role_row.id, permission_row.id
  FROM public.admin_roles role_row
  CROSS JOIN public.admin_permissions permission_row
  WHERE role_row.key = 'superadmin'
    AND role_row.is_active = true
    AND permission_row.key IN ('board.view', 'board.create', 'board.edit', 'board.delete')

  UNION

  SELECT role_row.id, permission_row.id
  FROM public.admin_roles role_row
  CROSS JOIN public.admin_permissions permission_row
  WHERE role_row.key = 'tischtennis-vorstand'
    AND role_row.is_active = true
    AND permission_row.key IN ('board.view', 'board.create', 'board.edit', 'board.delete')
)
INSERT INTO public.admin_role_permissions (role_id, permission_id)
SELECT role_id, permission_id
FROM mapping
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 4. Tischtennis role permissions
-- dashboard.view is required by the current dashboard/navigation loaders.
-- Generic content permissions do not grant a cross-department scope by themselves.
-- -----------------------------------------------------------------------------

WITH required_permissions(permission_key) AS (
  VALUES
    ('dashboard.view'),
    ('teams.view'), ('teams.create'), ('teams.edit'), ('teams.delete'),
    ('players.view'), ('players.create'), ('players.edit'), ('players.delete'),
    ('coaches.view'), ('coaches.create'), ('coaches.edit'), ('coaches.delete')
)
INSERT INTO public.admin_role_permissions (role_id, permission_id)
SELECT role_row.id, permission_row.id
FROM public.admin_roles role_row
JOIN required_permissions required ON true
JOIN public.admin_permissions permission_row ON permission_row.key = required.permission_key
WHERE role_row.key = 'tischtennis-vorstand'
  AND role_row.is_active = true
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 5. RLS helper functions
-- These helpers expose booleans only. They are SECURITY DEFINER with a fixed
-- search_path so policy evaluation does not depend on client SELECT access to
-- the admin authorization tables.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.current_admin_has_permission(requested_permission text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_profiles profile
    JOIN public.admin_user_roles user_role ON user_role.user_id = profile.id
    JOIN public.admin_roles role_row ON role_row.id = user_role.role_id
    LEFT JOIN public.admin_role_permissions role_permission ON role_permission.role_id = role_row.id
    LEFT JOIN public.admin_permissions permission_row ON permission_row.id = role_permission.permission_id
    WHERE profile.is_active = true
      AND role_row.is_active = true
      AND (profile.id = auth.uid() OR lower(profile.email) = lower(auth.jwt()->>'email'))
      AND (role_row.key = 'superadmin' OR permission_row.key = requested_permission)
  );
$function$;

CREATE OR REPLACE FUNCTION public.current_admin_has_non_table_tennis_permission(requested_permission text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_profiles profile
    JOIN public.admin_user_roles user_role ON user_role.user_id = profile.id
    JOIN public.admin_roles role_row ON role_row.id = user_role.role_id
    LEFT JOIN public.admin_role_permissions role_permission ON role_permission.role_id = role_row.id
    LEFT JOIN public.admin_permissions permission_row ON permission_row.id = role_permission.permission_id
    WHERE profile.is_active = true
      AND role_row.is_active = true
      AND (profile.id = auth.uid() OR lower(profile.email) = lower(auth.jwt()->>'email'))
      AND role_row.key <> 'tischtennis-vorstand'
      AND (role_row.key = 'superadmin' OR permission_row.key = requested_permission)
  );
$function$;

CREATE OR REPLACE FUNCTION public.current_admin_permission_allows_department(
  requested_permission text,
  requested_department_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
  SELECT
    public.current_admin_has_non_table_tennis_permission(requested_permission)
    OR (
      public.current_admin_has_permission(requested_permission)
      AND requested_department_id = (
        SELECT department.id
        FROM public.departments department
        WHERE department.slug = 'tischtennis'
          AND department.is_active = true
        LIMIT 1
      )
    );
$function$;

CREATE OR REPLACE FUNCTION public.current_admin_can_create_or_delete_board_member(
  requested_permission text,
  requested_department_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_profiles profile
    JOIN public.admin_user_roles user_role ON user_role.user_id = profile.id
    JOIN public.admin_roles role_row ON role_row.id = user_role.role_id
    LEFT JOIN public.admin_role_permissions role_permission ON role_permission.role_id = role_row.id
    LEFT JOIN public.admin_permissions permission_row ON permission_row.id = role_permission.permission_id
    WHERE profile.is_active = true
      AND role_row.is_active = true
      AND (profile.id = auth.uid() OR lower(profile.email) = lower(auth.jwt()->>'email'))
      AND (
        role_row.key = 'superadmin'
        OR (
          role_row.key = 'tischtennis-vorstand'
          AND permission_row.key = requested_permission
          AND requested_department_id = (
            SELECT department.id
            FROM public.departments department
            WHERE department.slug = 'tischtennis' AND department.is_active = true
            LIMIT 1
          )
        )
      )
  );
$function$;

CREATE OR REPLACE FUNCTION public.current_admin_can_edit_board_member(
  requested_department_id uuid,
  owner_admin_profile_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
  SELECT
    public.current_admin_can_create_or_delete_board_member('board.edit', requested_department_id)
    OR EXISTS (
      SELECT 1
      FROM public.admin_profiles profile
      JOIN public.admin_user_roles user_role ON user_role.user_id = profile.id
      JOIN public.admin_roles role_row ON role_row.id = user_role.role_id
      JOIN public.admin_role_permissions role_permission ON role_permission.role_id = role_row.id
      JOIN public.admin_permissions permission_row ON permission_row.id = role_permission.permission_id
      WHERE profile.is_active = true
        AND role_row.is_active = true
        AND role_row.key <> 'tischtennis-vorstand'
        AND (profile.id = auth.uid() OR lower(profile.email) = lower(auth.jwt()->>'email'))
        AND permission_row.key = 'board.edit'
        AND owner_admin_profile_id = profile.id
    );
$function$;

REVOKE ALL ON FUNCTION public.current_admin_has_permission(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_admin_has_non_table_tennis_permission(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_admin_permission_allows_department(text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_admin_can_create_or_delete_board_member(text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_admin_can_edit_board_member(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_admin_has_permission(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_admin_has_non_table_tennis_permission(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_admin_permission_allows_department(text, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_admin_can_create_or_delete_board_member(text, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_admin_can_edit_board_member(uuid, uuid) TO authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 6. Enable RLS and remove only write-capable policies from the confirmed
-- vulnerable tables. Existing SELECT-only policies remain untouched.
-- Every removed write policy is replaced below with an explicit permission rule.
-- -----------------------------------------------------------------------------

ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_team_seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_team_seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_training_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_training_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_members ENABLE ROW LEVEL SECURITY;

DO $drop_write_policies$
DECLARE
  policy_row record;
BEGIN
  FOR policy_row IN
    SELECT schemaname, tablename, policyname
    FROM pg_catalog.pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'seasons', 'teams', 'team_seasons', 'players', 'player_team_seasons',
        'coaches', 'coach_team_seasons', 'team_training_times',
        'team_training_exceptions', 'board_members'
      )
      AND cmd IN ('ALL', 'INSERT', 'UPDATE', 'DELETE')
  LOOP
    EXECUTE format('DROP POLICY %I ON %I.%I', policy_row.policyname, policy_row.schemaname, policy_row.tablename);
  END LOOP;
END
$drop_write_policies$;

-- Anonymous users never receive direct business-data mutation privileges.
REVOKE INSERT, UPDATE, DELETE ON TABLE
  public.seasons,
  public.teams,
  public.team_seasons,
  public.players,
  public.player_team_seasons,
  public.coaches,
  public.coach_team_seasons,
  public.team_training_times,
  public.team_training_exceptions,
  public.board_members
FROM anon;

-- Authenticated writes remain available only where the following RLS policies
-- approve them. This preserves the session-bound server-action architecture.
GRANT INSERT, UPDATE, DELETE ON TABLE
  public.seasons,
  public.teams,
  public.team_seasons,
  public.players,
  public.player_team_seasons,
  public.coaches,
  public.coach_team_seasons,
  public.team_training_times,
  public.team_training_exceptions,
  public.board_members
TO authenticated;

GRANT ALL PRIVILEGES ON TABLE
  public.seasons,
  public.teams,
  public.team_seasons,
  public.players,
  public.player_team_seasons,
  public.coaches,
  public.coach_team_seasons,
  public.team_training_times,
  public.team_training_exceptions,
  public.board_members
TO service_role;

-- Some legacy ALL policies also supplied public reads. Replace that part
-- explicitly with active-only SELECT policies so hardening does not break the
-- public team pages. Existing compatible SELECT policies may coexist.
DROP POLICY IF EXISTS h1_seasons_public_read_active ON public.seasons;
CREATE POLICY h1_seasons_public_read_active
  ON public.seasons FOR SELECT TO anon, authenticated
  USING (COALESCE((to_jsonb(seasons)->>'is_active')::boolean, true));

DROP POLICY IF EXISTS h1_teams_public_read_active ON public.teams;
CREATE POLICY h1_teams_public_read_active
  ON public.teams FOR SELECT TO anon, authenticated
  USING (COALESCE((to_jsonb(teams)->>'is_active')::boolean, true));

DROP POLICY IF EXISTS h1_team_seasons_public_read_active ON public.team_seasons;
CREATE POLICY h1_team_seasons_public_read_active
  ON public.team_seasons FOR SELECT TO anon, authenticated
  USING (
    COALESCE((to_jsonb(team_seasons)->>'is_active')::boolean, true)
    AND EXISTS (
      SELECT 1 FROM public.teams team
      WHERE team.id = team_id
        AND COALESCE((to_jsonb(team)->>'is_active')::boolean, true)
    )
  );

DROP POLICY IF EXISTS h1_player_team_seasons_public_read_active ON public.player_team_seasons;
CREATE POLICY h1_player_team_seasons_public_read_active
  ON public.player_team_seasons FOR SELECT TO anon, authenticated
  USING (
    COALESCE((to_jsonb(player_team_seasons)->>'is_active')::boolean, true)
    AND EXISTS (
      SELECT 1 FROM public.team_seasons team_season
      JOIN public.teams team ON team.id = team_season.team_id
      WHERE team_season.id = team_season_id
        AND COALESCE((to_jsonb(team_season)->>'is_active')::boolean, true)
        AND COALESCE((to_jsonb(team)->>'is_active')::boolean, true)
    )
  );

DROP POLICY IF EXISTS h1_players_public_read_active ON public.players;
CREATE POLICY h1_players_public_read_active
  ON public.players FOR SELECT TO anon, authenticated
  USING (COALESCE((to_jsonb(players)->>'is_active')::boolean, true));

DROP POLICY IF EXISTS h1_coach_team_seasons_public_read_active ON public.coach_team_seasons;
CREATE POLICY h1_coach_team_seasons_public_read_active
  ON public.coach_team_seasons FOR SELECT TO anon, authenticated
  USING (
    COALESCE((to_jsonb(coach_team_seasons)->>'is_active')::boolean, true)
    AND EXISTS (
      SELECT 1 FROM public.team_seasons team_season
      JOIN public.teams team ON team.id = team_season.team_id
      WHERE team_season.id = team_season_id
        AND COALESCE((to_jsonb(team_season)->>'is_active')::boolean, true)
        AND COALESCE((to_jsonb(team)->>'is_active')::boolean, true)
    )
  );

DROP POLICY IF EXISTS h1_team_training_times_public_read_active ON public.team_training_times;
CREATE POLICY h1_team_training_times_public_read_active
  ON public.team_training_times FOR SELECT TO anon, authenticated
  USING (
    COALESCE((to_jsonb(team_training_times)->>'is_active')::boolean, true)
    AND EXISTS (
      SELECT 1 FROM public.team_seasons team_season
      JOIN public.teams team ON team.id = team_season.team_id
      WHERE team_season.id = team_season_id
        AND COALESCE((to_jsonb(team_season)->>'is_active')::boolean, true)
        AND COALESCE((to_jsonb(team)->>'is_active')::boolean, true)
    )
  );

DROP POLICY IF EXISTS h1_team_training_exceptions_public_read_active ON public.team_training_exceptions;
CREATE POLICY h1_team_training_exceptions_public_read_active
  ON public.team_training_exceptions FOR SELECT TO anon, authenticated
  USING (
    COALESCE((to_jsonb(team_training_exceptions)->>'is_active')::boolean, true)
    AND EXISTS (
      SELECT 1 FROM public.team_training_times training_time
      JOIN public.team_seasons team_season ON team_season.id = training_time.team_season_id
      JOIN public.teams team ON team.id = team_season.team_id
      WHERE training_time.id = team_training_time_id
        AND COALESCE((to_jsonb(training_time)->>'is_active')::boolean, true)
        AND COALESCE((to_jsonb(team_season)->>'is_active')::boolean, true)
        AND COALESCE((to_jsonb(team)->>'is_active')::boolean, true)
    )
  );

-- Explicit authenticated admin reads preserve inactive/draft management after
-- removal of legacy ALL policies. Department-owned rows use the same scope
-- boundary as mutations; the shared season catalogue only requires teams.view.
DROP POLICY IF EXISTS h1_seasons_admin_read ON public.seasons;
CREATE POLICY h1_seasons_admin_read
  ON public.seasons FOR SELECT TO authenticated
  USING (public.current_admin_has_permission('teams.view'));

DROP POLICY IF EXISTS h1_teams_admin_read_department ON public.teams;
CREATE POLICY h1_teams_admin_read_department
  ON public.teams FOR SELECT TO authenticated
  USING (public.current_admin_permission_allows_department('teams.view', department_id));

DROP POLICY IF EXISTS h1_team_seasons_admin_read_department ON public.team_seasons;
CREATE POLICY h1_team_seasons_admin_read_department
  ON public.team_seasons FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.teams team
    WHERE team.id = team_id
      AND public.current_admin_permission_allows_department('teams.view', team.department_id)
  ));

DROP POLICY IF EXISTS h1_player_team_seasons_admin_read_department ON public.player_team_seasons;
CREATE POLICY h1_player_team_seasons_admin_read_department
  ON public.player_team_seasons FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.team_seasons team_season
    JOIN public.teams team ON team.id = team_season.team_id
    WHERE team_season.id = team_season_id
      AND public.current_admin_permission_allows_department('players.view', team.department_id)
  ));

DROP POLICY IF EXISTS h1_coach_team_seasons_admin_read_department ON public.coach_team_seasons;
CREATE POLICY h1_coach_team_seasons_admin_read_department
  ON public.coach_team_seasons FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.team_seasons team_season
    JOIN public.teams team ON team.id = team_season.team_id
    WHERE team_season.id = team_season_id
      AND public.current_admin_permission_allows_department('coaches.view', team.department_id)
  ));

DROP POLICY IF EXISTS h1_team_training_times_admin_read_department ON public.team_training_times;
CREATE POLICY h1_team_training_times_admin_read_department
  ON public.team_training_times FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.team_seasons team_season
    JOIN public.teams team ON team.id = team_season.team_id
    WHERE team_season.id = team_season_id
      AND public.current_admin_permission_allows_department('teams.view', team.department_id)
  ));

DROP POLICY IF EXISTS h1_team_training_exceptions_admin_read_department ON public.team_training_exceptions;
CREATE POLICY h1_team_training_exceptions_admin_read_department
  ON public.team_training_exceptions FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.team_training_times training_time
    JOIN public.team_seasons team_season ON team_season.id = training_time.team_season_id
    JOIN public.teams team ON team.id = team_season.team_id
    WHERE training_time.id = team_training_time_id
      AND public.current_admin_permission_allows_department('teams.view', team.department_id)
  ));

-- Shared seasons are not department-owned. The Tischtennis-only role may read
-- existing seasons but cannot mutate the global season catalogue directly.
CREATE POLICY seasons_insert_permission
  ON public.seasons FOR INSERT TO authenticated
  WITH CHECK (public.current_admin_has_non_table_tennis_permission('teams.create'));
CREATE POLICY seasons_update_permission
  ON public.seasons FOR UPDATE TO authenticated
  USING (public.current_admin_has_non_table_tennis_permission('teams.edit'))
  WITH CHECK (public.current_admin_has_non_table_tennis_permission('teams.edit'));
CREATE POLICY seasons_delete_permission
  ON public.seasons FOR DELETE TO authenticated
  USING (public.current_admin_has_non_table_tennis_permission('teams.delete'));

CREATE POLICY teams_insert_department_permission
  ON public.teams FOR INSERT TO authenticated
  WITH CHECK (public.current_admin_permission_allows_department('teams.create', department_id));
CREATE POLICY teams_update_department_permission
  ON public.teams FOR UPDATE TO authenticated
  USING (public.current_admin_permission_allows_department('teams.edit', department_id))
  WITH CHECK (public.current_admin_permission_allows_department('teams.edit', department_id));
CREATE POLICY teams_delete_department_permission
  ON public.teams FOR DELETE TO authenticated
  USING (public.current_admin_permission_allows_department('teams.delete', department_id));

CREATE POLICY team_seasons_insert_department_permission
  ON public.team_seasons FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.teams team
    WHERE team.id = team_id
      AND public.current_admin_permission_allows_department('teams.create', team.department_id)
  ));
CREATE POLICY team_seasons_update_department_permission
  ON public.team_seasons FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.teams team
    WHERE team.id = team_id
      AND public.current_admin_permission_allows_department('teams.edit', team.department_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.teams team
    WHERE team.id = team_id
      AND public.current_admin_permission_allows_department('teams.edit', team.department_id)
  ));
CREATE POLICY team_seasons_delete_department_permission
  ON public.team_seasons FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.teams team
    WHERE team.id = team_id
      AND public.current_admin_permission_allows_department('teams.delete', team.department_id)
  ));

-- Person master rows have no department_id. A Tischtennis-only role therefore
-- cannot safely mutate them directly through REST. Existing non-Tischtennis
-- administrators retain their permission-based path. H2 must perform TT person
-- master writes server-only after validating the target Tischtennis assignment.
CREATE POLICY players_insert_permission
  ON public.players FOR INSERT TO authenticated
  WITH CHECK (public.current_admin_has_non_table_tennis_permission('players.create'));
CREATE POLICY players_update_permission
  ON public.players FOR UPDATE TO authenticated
  USING (public.current_admin_has_non_table_tennis_permission('players.edit'))
  WITH CHECK (public.current_admin_has_non_table_tennis_permission('players.edit'));
CREATE POLICY players_delete_permission
  ON public.players FOR DELETE TO authenticated
  USING (public.current_admin_has_non_table_tennis_permission('players.delete'));

CREATE POLICY coaches_insert_permission
  ON public.coaches FOR INSERT TO authenticated
  WITH CHECK (public.current_admin_has_non_table_tennis_permission('coaches.create'));
CREATE POLICY coaches_update_permission
  ON public.coaches FOR UPDATE TO authenticated
  USING (public.current_admin_has_non_table_tennis_permission('coaches.edit'))
  WITH CHECK (public.current_admin_has_non_table_tennis_permission('coaches.edit'));
CREATE POLICY coaches_delete_permission
  ON public.coaches FOR DELETE TO authenticated
  USING (public.current_admin_has_non_table_tennis_permission('coaches.delete'));

CREATE POLICY player_team_seasons_insert_department_permission
  ON public.player_team_seasons FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.team_seasons team_season
    JOIN public.teams team ON team.id = team_season.team_id
    WHERE team_season.id = team_season_id
      AND (
        public.current_admin_permission_allows_department('players.create', team.department_id)
        OR public.current_admin_permission_allows_department('teams.edit', team.department_id)
      )
  ));
CREATE POLICY player_team_seasons_update_department_permission
  ON public.player_team_seasons FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.team_seasons team_season
    JOIN public.teams team ON team.id = team_season.team_id
    WHERE team_season.id = team_season_id
      AND (
        public.current_admin_permission_allows_department('players.edit', team.department_id)
        OR public.current_admin_permission_allows_department('teams.edit', team.department_id)
      )
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.team_seasons team_season
    JOIN public.teams team ON team.id = team_season.team_id
    WHERE team_season.id = team_season_id
      AND (
        public.current_admin_permission_allows_department('players.edit', team.department_id)
        OR public.current_admin_permission_allows_department('teams.edit', team.department_id)
      )
  ));
CREATE POLICY player_team_seasons_delete_department_permission
  ON public.player_team_seasons FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.team_seasons team_season
    JOIN public.teams team ON team.id = team_season.team_id
    WHERE team_season.id = team_season_id
      AND (
        public.current_admin_permission_allows_department('players.delete', team.department_id)
        OR public.current_admin_permission_allows_department('teams.edit', team.department_id)
      )
  ));

CREATE POLICY coach_team_seasons_insert_department_permission
  ON public.coach_team_seasons FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.team_seasons team_season
    JOIN public.teams team ON team.id = team_season.team_id
    WHERE team_season.id = team_season_id
      AND (
        public.current_admin_permission_allows_department('coaches.create', team.department_id)
        OR public.current_admin_permission_allows_department('teams.edit', team.department_id)
      )
  ));
CREATE POLICY coach_team_seasons_update_department_permission
  ON public.coach_team_seasons FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.team_seasons team_season
    JOIN public.teams team ON team.id = team_season.team_id
    WHERE team_season.id = team_season_id
      AND (
        public.current_admin_permission_allows_department('coaches.edit', team.department_id)
        OR public.current_admin_permission_allows_department('teams.edit', team.department_id)
      )
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.team_seasons team_season
    JOIN public.teams team ON team.id = team_season.team_id
    WHERE team_season.id = team_season_id
      AND (
        public.current_admin_permission_allows_department('coaches.edit', team.department_id)
        OR public.current_admin_permission_allows_department('teams.edit', team.department_id)
      )
  ));
CREATE POLICY coach_team_seasons_delete_department_permission
  ON public.coach_team_seasons FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.team_seasons team_season
    JOIN public.teams team ON team.id = team_season.team_id
    WHERE team_season.id = team_season_id
      AND (
        public.current_admin_permission_allows_department('coaches.delete', team.department_id)
        OR public.current_admin_permission_allows_department('teams.edit', team.department_id)
      )
  ));

CREATE POLICY team_training_times_insert_department_permission
  ON public.team_training_times FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.team_seasons team_season
    JOIN public.teams team ON team.id = team_season.team_id
    WHERE team_season.id = team_season_id
      AND public.current_admin_permission_allows_department('teams.edit', team.department_id)
  ));
CREATE POLICY team_training_times_update_department_permission
  ON public.team_training_times FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.team_seasons team_season
    JOIN public.teams team ON team.id = team_season.team_id
    WHERE team_season.id = team_season_id
      AND public.current_admin_permission_allows_department('teams.edit', team.department_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.team_seasons team_season
    JOIN public.teams team ON team.id = team_season.team_id
    WHERE team_season.id = team_season_id
      AND public.current_admin_permission_allows_department('teams.edit', team.department_id)
  ));
CREATE POLICY team_training_times_delete_department_permission
  ON public.team_training_times FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.team_seasons team_season
    JOIN public.teams team ON team.id = team_season.team_id
    WHERE team_season.id = team_season_id
      AND public.current_admin_permission_allows_department('teams.edit', team.department_id)
  ));

CREATE POLICY team_training_exceptions_insert_department_permission
  ON public.team_training_exceptions FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.team_training_times training_time
    JOIN public.team_seasons team_season ON team_season.id = training_time.team_season_id
    JOIN public.teams team ON team.id = team_season.team_id
    WHERE training_time.id = team_training_time_id
      AND public.current_admin_permission_allows_department('teams.edit', team.department_id)
  ));
CREATE POLICY team_training_exceptions_update_department_permission
  ON public.team_training_exceptions FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.team_training_times training_time
    JOIN public.team_seasons team_season ON team_season.id = training_time.team_season_id
    JOIN public.teams team ON team.id = team_season.team_id
    WHERE training_time.id = team_training_time_id
      AND public.current_admin_permission_allows_department('teams.edit', team.department_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.team_training_times training_time
    JOIN public.team_seasons team_season ON team_season.id = training_time.team_season_id
    JOIN public.teams team ON team.id = team_season.team_id
    WHERE training_time.id = team_training_time_id
      AND public.current_admin_permission_allows_department('teams.edit', team.department_id)
  ));
CREATE POLICY team_training_exceptions_delete_department_permission
  ON public.team_training_exceptions FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.team_training_times training_time
    JOIN public.team_seasons team_season ON team_season.id = training_time.team_season_id
    JOIN public.teams team ON team.id = team_season.team_id
    WHERE training_time.id = team_training_time_id
      AND public.current_admin_permission_allows_department('teams.edit', team.department_id)
  ));

CREATE POLICY board_members_insert_department_permission
  ON public.board_members FOR INSERT TO authenticated
  WITH CHECK (public.current_admin_can_create_or_delete_board_member('board.create', department_id));
CREATE POLICY board_members_update_department_permission
  ON public.board_members FOR UPDATE TO authenticated
  USING (public.current_admin_can_edit_board_member(department_id, admin_profile_id))
  WITH CHECK (public.current_admin_can_edit_board_member(department_id, admin_profile_id));
CREATE POLICY board_members_delete_department_permission
  ON public.board_members FOR DELETE TO authenticated
  USING (public.current_admin_can_create_or_delete_board_member('board.delete', department_id));

-- Add an authenticated admin-read policy without changing the existing public
-- active-only SELECT policy. Global/non-TT board viewers may read all rows;
-- a TT-only board viewer may read only its department.
DROP POLICY IF EXISTS board_members_admin_read ON public.board_members;
CREATE POLICY board_members_admin_read
  ON public.board_members FOR SELECT TO authenticated
  USING (public.current_admin_permission_allows_department('board.view', department_id));

-- -----------------------------------------------------------------------------
-- 7. Transaction-local self-checks
-- -----------------------------------------------------------------------------

DO $self_check$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'board_members'
      AND column_name = 'department_id' AND data_type = 'uuid' AND is_nullable = 'YES'
  ) THEN
    RAISE EXCEPTION 'board_members.department_id contract missing; aborting.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_constraint c
    JOIN pg_catalog.pg_class t ON t.oid = c.conrelid
    JOIN pg_catalog.pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_catalog.pg_class referenced_table ON referenced_table.oid = c.confrelid
    WHERE n.nspname = 'public'
      AND t.relname = 'board_members'
      AND c.conname = 'board_members_department_id_fkey'
      AND c.contype = 'f'
      AND referenced_table.relname = 'departments'
      AND pg_catalog.pg_get_constraintdef(c.oid, true) LIKE '%ON DELETE RESTRICT%'
  ) THEN
    RAISE EXCEPTION 'board_members department FK contract missing; aborting.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_index i
    JOIN pg_catalog.pg_class index_relation ON index_relation.oid = i.indexrelid
    JOIN pg_catalog.pg_class table_relation ON table_relation.oid = i.indrelid
    JOIN pg_catalog.pg_namespace n ON n.oid = table_relation.relnamespace
    WHERE n.nspname = 'public'
      AND table_relation.relname = 'board_members'
      AND index_relation.relname = 'board_members_department_id_idx'
      AND pg_catalog.pg_get_indexdef(i.indexrelid) LIKE '%(department_id)%'
      AND pg_catalog.pg_get_expr(i.indpred, i.indrelid) LIKE '%department_id IS NOT NULL%'
  ) THEN
    RAISE EXCEPTION 'board_members department index contract missing; aborting.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'seasons', 'teams', 'team_seasons', 'players', 'player_team_seasons',
        'coaches', 'coach_team_seasons', 'team_training_times',
        'team_training_exceptions', 'board_members'
      )
      AND cmd IN ('ALL', 'INSERT', 'UPDATE', 'DELETE')
      AND ('anon' = ANY(roles) OR 'public' = ANY(roles))
  ) THEN
    RAISE EXCEPTION 'Anonymous/public write policy remains; aborting.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM unnest(ARRAY[
      'seasons', 'teams', 'team_seasons', 'players', 'player_team_seasons',
      'coaches', 'coach_team_seasons', 'team_training_times',
      'team_training_exceptions', 'board_members'
    ]) AS target(table_name)
    WHERE has_table_privilege('anon', format('public.%I', target.table_name), 'INSERT')
       OR has_table_privilege('anon', format('public.%I', target.table_name), 'UPDATE')
       OR has_table_privilege('anon', format('public.%I', target.table_name), 'DELETE')
  ) THEN
    RAISE EXCEPTION 'Anonymous table mutation privilege remains; aborting.';
  END IF;

  IF (
    SELECT count(*)
    FROM public.admin_roles role_row
    JOIN public.admin_role_permissions role_permission ON role_permission.role_id = role_row.id
    JOIN public.admin_permissions permission_row ON permission_row.id = role_permission.permission_id
    WHERE role_row.key = 'tischtennis-vorstand'
      AND permission_row.key IN (
        'dashboard.view',
        'teams.view', 'teams.create', 'teams.edit', 'teams.delete',
        'players.view', 'players.create', 'players.edit', 'players.delete',
        'coaches.view', 'coaches.create', 'coaches.edit', 'coaches.delete',
        'board.view', 'board.create', 'board.edit', 'board.delete'
      )
  ) <> 17 THEN
    RAISE EXCEPTION 'Tischtennis role permission mapping incomplete; aborting.';
  END IF;
END
$self_check$;

COMMIT;
