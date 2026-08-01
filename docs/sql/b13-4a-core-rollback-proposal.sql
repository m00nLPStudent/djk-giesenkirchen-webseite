-- B13.4A core rollback proposal
-- Proposal only. No destructive SQL is emitted here because no safe automatic rollback can be proven without provenance markers.

BEGIN;

-- Manual rollback outline:
-- 1) Restore the database backup taken immediately before B13.4A.
-- 2) If the additive schema proposal was applied but the backfill was not committed, restore the backup instead of trying to reverse individual rows.
-- 3) If the backfill was committed, reconcile the newly added team_seasons fields from the backup or from the original source export before any schema reversal is considered.
-- 4) Do not remove any pre-existing team_seasons, player_team_seasons, or coach_team_seasons rows.
-- 5) Do not delete any player, coach, or team records during rollback.
-- 6) Re-run the read-only preflight and postcheck scripts after the restore to confirm the baseline.

SELECT
  'manual_rollback_required' AS rollback_mode,
  'no safe automatic DELETE/DROP is proposed' AS statement_policy;

SELECT
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'team_seasons'
  AND column_name IN (
    'fussball_de_matches_widget_url',
    'fussball_de_matches_url',
    'dfb_matches_widget_url',
    'fussball_de_table_widget_url',
    'fussball_de_table_url',
    'dfb_table_widget_url',
    'fussball_de_team_id',
    'fussball_de_competition_id',
    'fussball_de_club_id',
    'fupa_matches_widget_id',
    'fupa_table_widget_id',
    'fupa_club_url'
  )
ORDER BY column_name;

ROLLBACK;
