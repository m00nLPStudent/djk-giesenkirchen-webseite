-- B15.21B0 rollback. DO NOT RUN AUTOMATICALLY.
-- DESTRUCTIVE MODEL ROLLBACK: drops all maintained seasonal birth-year mappings.
BEGIN;
DROP FUNCTION IF EXISTS public.replace_team_season_year_groups(uuid, smallint[]);
DROP INDEX IF EXISTS public.idx_membership_requests_desired_team_season_id;
ALTER TABLE public.membership_requests DROP CONSTRAINT IF EXISTS membership_requests_desired_team_season_id_fkey;
ALTER TABLE public.membership_requests DROP COLUMN IF EXISTS desired_team_season_id;
DROP TABLE IF EXISTS public.team_season_year_groups;
COMMIT;
