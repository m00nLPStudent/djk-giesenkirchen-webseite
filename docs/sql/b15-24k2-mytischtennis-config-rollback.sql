-- B15.24K2 - rollback for the click-TT configuration relation
-- MANUAL EXECUTION ONLY. Refuses to discard configured business rows.

BEGIN;

DO $precheck$
DECLARE
  configured_count bigint;
BEGIN
  IF to_regclass('public.team_season_external_competitions') IS NULL THEN
    RAISE EXCEPTION 'Target relation does not exist; nothing to roll back.';
  END IF;

  SELECT count(*) INTO configured_count
  FROM public.team_season_external_competitions;

  IF configured_count <> 0 THEN
    RAISE EXCEPTION 'Rollback refused: % configuration row(s) would be lost.', configured_count;
  END IF;
END
$precheck$;

DROP TABLE public.team_season_external_competitions;
DROP FUNCTION public.enforce_team_season_external_competition_scope();

COMMIT;
