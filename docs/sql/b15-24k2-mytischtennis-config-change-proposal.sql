-- B15.24K2 - server-only click-TT configuration per team season
-- MANUAL EXECUTION ONLY after the read-only preflight has been reviewed.

BEGIN;

DO $precheck$
DECLARE
  id_type text;
BEGIN
  IF to_regclass('public.team_seasons') IS NULL
     OR to_regclass('public.teams') IS NULL
     OR to_regclass('public.departments') IS NULL THEN
    RAISE EXCEPTION 'Required team/department relations are missing.';
  END IF;

  IF to_regclass('public.team_season_external_competitions') IS NOT NULL THEN
    RAISE EXCEPTION 'Target relation already exists; manual collision review required.';
  END IF;

  IF to_regprocedure(
    'public.enforce_team_season_external_competition_scope()'
  ) IS NOT NULL THEN
    RAISE EXCEPTION 'Target scope function already exists; manual collision review required.';
  END IF;

  SELECT pg_catalog.format_type(a.atttypid, a.atttypmod)
    INTO id_type
  FROM pg_catalog.pg_attribute AS a
  WHERE a.attrelid = 'public.team_seasons'::regclass
    AND a.attname = 'id'
    AND a.attnum > 0
    AND NOT a.attisdropped;

  IF id_type IS DISTINCT FROM 'uuid' THEN
    RAISE EXCEPTION 'Unexpected team_seasons.id type: %', COALESCE(id_type, '<missing>');
  END IF;

  IF to_regrole('anon') IS NULL
     OR to_regrole('authenticated') IS NULL
     OR to_regrole('service_role') IS NULL
     OR to_regprocedure('gen_random_uuid()') IS NULL THEN
    RAISE EXCEPTION 'Required application roles or gen_random_uuid() are missing.';
  END IF;
END
$precheck$;

CREATE TABLE public.team_season_external_competitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_season_id uuid NOT NULL,
  provider text NOT NULL,
  association text NOT NULL,
  external_season_key text NOT NULL,
  external_group_id text NOT NULL,
  league_slug text NOT NULL,
  external_team_id text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT team_season_external_competitions_team_season_fk
    FOREIGN KEY (team_season_id) REFERENCES public.team_seasons(id) ON DELETE CASCADE,
  CONSTRAINT team_season_external_competitions_team_season_unique
    UNIQUE (team_season_id),
  CONSTRAINT team_season_external_competitions_external_team_unique
    UNIQUE (
      provider, association, external_season_key,
      external_group_id, external_team_id
    ),
  CONSTRAINT team_season_external_competitions_provider_check
    CHECK (provider = 'click_tt'),
  CONSTRAINT team_season_external_competitions_association_check
    CHECK (association ~ '^[A-Z0-9_-]{2,16}$'),
  CONSTRAINT team_season_external_competitions_season_key_check
    CHECK (external_season_key ~ '^[0-9]{2}--[0-9]{2}$'),
  CONSTRAINT team_season_external_competitions_group_id_check
    CHECK (external_group_id ~ '^[0-9]{1,20}$'),
  CONSTRAINT team_season_external_competitions_team_id_check
    CHECK (external_team_id ~ '^[0-9]{1,20}$'),
  CONSTRAINT team_season_external_competitions_league_slug_check
    CHECK (
      char_length(league_slug) BETWEEN 1 AND 160
      AND league_slug !~ '[/?#[:cntrl:][:space:]]'
      AND strpos(league_slug, E'\\') = 0
    )
);

ALTER TABLE public.team_season_external_competitions OWNER TO postgres;
ALTER TABLE public.team_season_external_competitions ENABLE ROW LEVEL SECURITY;

-- Defense in depth: even the trusted server path cannot associate click-TT
-- configuration with Football, an unassigned team or another department.
CREATE FUNCTION public.enforce_team_season_external_competition_scope()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.team_seasons AS team_season
    JOIN public.teams AS team ON team.id = team_season.team_id
    JOIN public.departments AS department ON department.id = team.department_id
    WHERE team_season.id = NEW.team_season_id
      AND department.slug = 'tischtennis'
  ) THEN
    RAISE EXCEPTION 'External competition configuration requires a Tischtennis team season.'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END
$function$;

ALTER FUNCTION public.enforce_team_season_external_competition_scope()
  OWNER TO postgres;
REVOKE ALL ON FUNCTION
  public.enforce_team_season_external_competition_scope() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION
  public.enforce_team_season_external_competition_scope()
  FROM anon, authenticated, service_role;

CREATE TRIGGER team_season_external_competitions_scope_guard
BEFORE INSERT OR UPDATE OF team_season_id
ON public.team_season_external_competitions
FOR EACH ROW
EXECUTE FUNCTION public.enforce_team_season_external_competition_scope();

-- Server-only by design: no browser policy and no browser grant.
REVOKE ALL ON TABLE public.team_season_external_competitions FROM PUBLIC;
REVOKE ALL ON TABLE public.team_season_external_competitions FROM anon;
REVOKE ALL ON TABLE public.team_season_external_competitions FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.team_season_external_competitions TO service_role;

CREATE INDEX team_season_external_competitions_active_idx
  ON public.team_season_external_competitions(team_season_id)
  WHERE is_active = true;

DO $self_check$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_class AS c
    JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'team_season_external_competitions'
      AND c.relkind = 'r'
      AND c.relrowsecurity = true
      AND c.relforcerowsecurity = false
  ) THEN
    RAISE EXCEPTION 'Target relation/RLS contract was not created.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'team_season_external_competitions'
  ) THEN
    RAISE EXCEPTION 'Unexpected policy exists on server-only target relation.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_trigger AS trigger_row
    WHERE trigger_row.tgrelid =
            'public.team_season_external_competitions'::regclass
      AND trigger_row.tgname =
            'team_season_external_competitions_scope_guard'
      AND NOT trigger_row.tgisinternal
      AND trigger_row.tgenabled = 'O'
      AND trigger_row.tgfoid = to_regprocedure(
            'public.enforce_team_season_external_competition_scope()'
          )::oid
  ) THEN
    RAISE EXCEPTION 'Tischtennis scope guard is missing or inactive.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_proc AS function_row
    WHERE function_row.oid = to_regprocedure(
            'public.enforce_team_season_external_competition_scope()'
          )::oid
      AND function_row.prosecdef = false
      AND function_row.proconfig @> ARRAY['search_path=pg_catalog']::text[]
  ) THEN
    RAISE EXCEPTION 'Tischtennis scope helper security contract is invalid.';
  END IF;

  IF has_function_privilege(
       'anon',
       'public.enforce_team_season_external_competition_scope()',
       'EXECUTE'
     )
     OR has_function_privilege(
       'authenticated',
       'public.enforce_team_season_external_competition_scope()',
       'EXECUTE'
     )
     OR has_function_privilege(
       'service_role',
       'public.enforce_team_season_external_competition_scope()',
       'EXECUTE'
     ) THEN
    RAISE EXCEPTION 'Scope helper is directly executable by an app role.';
  END IF;

  IF has_table_privilege('anon', 'public.team_season_external_competitions', 'SELECT')
     OR has_table_privilege('anon', 'public.team_season_external_competitions', 'INSERT')
     OR has_table_privilege('anon', 'public.team_season_external_competitions', 'UPDATE')
     OR has_table_privilege('anon', 'public.team_season_external_competitions', 'DELETE')
     OR has_table_privilege('authenticated', 'public.team_season_external_competitions', 'SELECT')
     OR has_table_privilege('authenticated', 'public.team_season_external_competitions', 'INSERT')
     OR has_table_privilege('authenticated', 'public.team_season_external_competitions', 'UPDATE')
     OR has_table_privilege('authenticated', 'public.team_season_external_competitions', 'DELETE') THEN
    RAISE EXCEPTION 'A browser role has effective privileges on the target relation.';
  END IF;

  IF NOT has_table_privilege('service_role', 'public.team_season_external_competitions', 'SELECT')
     OR NOT has_table_privilege('service_role', 'public.team_season_external_competitions', 'INSERT')
     OR NOT has_table_privilege('service_role', 'public.team_season_external_competitions', 'UPDATE')
     OR NOT has_table_privilege('service_role', 'public.team_season_external_competitions', 'DELETE') THEN
    RAISE EXCEPTION 'service_role lacks required target privileges.';
  END IF;
END
$self_check$;

COMMIT;
