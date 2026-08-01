-- B13.4A core additive schema proposal
-- Proposal only. Do not run without an approved maintenance window and preflight verification.

BEGIN;

ALTER TABLE public.team_seasons
  ADD COLUMN IF NOT EXISTS fussball_de_matches_widget_url text,
  ADD COLUMN IF NOT EXISTS fussball_de_matches_url text,
  ADD COLUMN IF NOT EXISTS dfb_matches_widget_url text,
  ADD COLUMN IF NOT EXISTS fussball_de_table_widget_url text,
  ADD COLUMN IF NOT EXISTS fussball_de_table_url text,
  ADD COLUMN IF NOT EXISTS dfb_table_widget_url text,
  ADD COLUMN IF NOT EXISTS fussball_de_team_id text,
  ADD COLUMN IF NOT EXISTS fussball_de_competition_id text,
  ADD COLUMN IF NOT EXISTS fussball_de_club_id text,
  ADD COLUMN IF NOT EXISTS fupa_matches_widget_id text,
  ADD COLUMN IF NOT EXISTS fupa_table_widget_id text,
  ADD COLUMN IF NOT EXISTS fupa_club_url text;

-- No destructive changes, no datatype changes, no NOT NULL changes, no policy changes.
-- No new unique constraints are proposed here because the additive target fields are not collision-verified in this step.

COMMIT;
