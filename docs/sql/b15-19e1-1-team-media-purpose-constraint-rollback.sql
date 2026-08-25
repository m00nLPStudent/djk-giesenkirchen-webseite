-- B15.19E1.1 rollback proposal only. Do not execute automatically.
-- Refuses rollback once team-purpose assets exist.
BEGIN;

DO $b15_19e1_1_rollback$
BEGIN
  IF EXISTS (SELECT 1 FROM public.media_assets WHERE purpose = 'team') THEN
    RAISE EXCEPTION 'Rollback refused: team-purpose media assets exist';
  END IF;

  ALTER TABLE public.media_assets DROP CONSTRAINT IF EXISTS media_assets_purpose_check;
  ALTER TABLE public.media_assets
    ADD CONSTRAINT media_assets_purpose_check
    CHECK (purpose IN (
      'player', 'coach', 'board', 'news', 'cms', 'club_history',
      'sponsor', 'event', 'document', 'download', 'system'
    ));
END;
$b15_19e1_1_rollback$;

COMMIT;
