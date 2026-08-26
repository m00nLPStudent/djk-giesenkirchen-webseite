-- B15.21B0 proposal. DO NOT RUN AUTOMATICALLY. Run only after reviewing the preflight.
BEGIN;

CREATE TABLE public.team_season_year_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_season_id uuid NOT NULL REFERENCES public.team_seasons(id) ON DELETE CASCADE,
  birth_year smallint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT team_season_year_groups_birth_year_check CHECK (birth_year BETWEEN 1900 AND 2100),
  CONSTRAINT team_season_year_groups_team_season_birth_year_key UNIQUE (team_season_id, birth_year)
);
CREATE INDEX team_season_year_groups_birth_year_idx ON public.team_season_year_groups (birth_year, team_season_id);

ALTER TABLE public.team_season_year_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_season_year_groups NO FORCE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.team_season_year_groups FROM PUBLIC, anon, authenticated;
GRANT ALL PRIVILEGES ON TABLE public.team_season_year_groups TO service_role;

CREATE FUNCTION public.replace_team_season_year_groups(target_team_season_id uuid, target_birth_years smallint[])
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $function$
BEGIN
  IF target_team_season_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.team_seasons WHERE id = target_team_season_id) THEN
    RAISE EXCEPTION 'Unknown team season' USING ERRCODE = '23503';
  END IF;
  IF EXISTS (SELECT 1 FROM unnest(COALESCE(target_birth_years, ARRAY[]::smallint[])) year_value WHERE year_value NOT BETWEEN 1900 AND 2100) THEN
    RAISE EXCEPTION 'Invalid birth year' USING ERRCODE = '23514';
  END IF;
  DELETE FROM public.team_season_year_groups WHERE team_season_id = target_team_season_id;
  INSERT INTO public.team_season_year_groups (team_season_id, birth_year)
  SELECT target_team_season_id, year_value
  FROM (SELECT DISTINCT unnest(COALESCE(target_birth_years, ARRAY[]::smallint[])) AS year_value) normalized
  ORDER BY year_value;
END
$function$;
REVOKE ALL ON FUNCTION public.replace_team_season_year_groups(uuid, smallint[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.replace_team_season_year_groups(uuid, smallint[]) TO service_role;

ALTER TABLE public.membership_requests ADD COLUMN desired_team_season_id uuid NULL;
ALTER TABLE public.membership_requests ADD CONSTRAINT membership_requests_desired_team_season_id_fkey
  FOREIGN KEY (desired_team_season_id) REFERENCES public.team_seasons(id) ON DELETE SET NULL;
CREATE INDEX idx_membership_requests_desired_team_season_id ON public.membership_requests (desired_team_season_id) WHERE desired_team_season_id IS NOT NULL;

-- Preserve B15.21A: the additive column receives no browser column grants.
REVOKE SELECT (desired_team_season_id), INSERT (desired_team_season_id), UPDATE (desired_team_season_id), REFERENCES (desired_team_season_id)
  ON public.membership_requests FROM PUBLIC, anon, authenticated;
GRANT ALL PRIVILEGES ON TABLE public.membership_requests TO service_role;

COMMIT;
