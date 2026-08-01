-- B13.22 player legacy removal rollback proposal
-- Proposal only. Do not execute automatically.

-- Data rollback rule:
-- Dropped legacy player-column data is not safely reconstructable from seasonal assignments.
-- A real data rollback therefore requires a verified backup taken before the drop.

-- Schema rollback rule:
-- If a fast technical unbreak step is needed after a failed drop deployment,
-- the legacy columns may be re-added as empty structure only after consulting
-- the exact preflight metadata and the backup.

-- Manual rollback gate 1:
-- confirm the pre-drop backup exists and can be restored.

-- Manual rollback gate 2:
-- confirm whether only schema restoration is needed or whether original
-- legacy data must be recovered from backup as well.

-- Manual rollback gate 3:
-- do not repopulate legacy player columns from current assignments,
-- primaryAssignment or any synthesized runtime DTO.

-- Optional schema-only emergency template.
-- Fill exact data types, nullability and defaults from the preflight output
-- before any manual execution.
--
-- BEGIN;
-- ALTER TABLE public.players ADD COLUMN IF NOT EXISTS team_id <TYPE>;
-- ALTER TABLE public.players ADD COLUMN IF NOT EXISTS shirt_number <TYPE>;
-- ALTER TABLE public.players ADD COLUMN IF NOT EXISTS jersey_number <TYPE>;
-- ALTER TABLE public.players ADD COLUMN IF NOT EXISTS position <TYPE>;
-- ALTER TABLE public.players ADD COLUMN IF NOT EXISTS position_de <TYPE>;
-- ALTER TABLE public.players ADD COLUMN IF NOT EXISTS position_en <TYPE>;
-- ALTER TABLE public.players ADD COLUMN IF NOT EXISTS is_captain <TYPE>;
-- ALTER TABLE public.players ADD COLUMN IF NOT EXISTS sort_order <TYPE>;
-- COMMIT;

-- Read-only support query A:
-- capture surviving seasonal truth for operational diagnosis.
SELECT
  pts.player_id,
  pts.team_season_id,
  pts.shirt_number,
  pts.position_de,
  pts.position_en,
  pts.is_captain,
  pts.sort_order,
  pts.is_active
FROM public.player_team_seasons AS pts
ORDER BY pts.player_id, pts.team_season_id, pts.id;

-- Read-only support query B:
-- capture current-season multiplicity before any manual recovery.
WITH current_seasons AS (
  SELECT id
  FROM public.seasons
  WHERE is_current = true
)
SELECT
  pts.player_id,
  COUNT(*) AS active_current_assignment_count
FROM public.player_team_seasons AS pts
JOIN public.team_seasons AS ts
  ON ts.id = pts.team_season_id
JOIN current_seasons AS cs
  ON cs.id = ts.season_id
WHERE pts.is_active = true
GROUP BY pts.player_id
ORDER BY active_current_assignment_count DESC, pts.player_id;

-- Read-only support query C:
-- confirm player master rows still exist for backup-based reconciliation.
SELECT
  p.id,
  p.first_name,
  p.last_name,
  p.image_url,
  p.is_active
FROM public.players AS p
ORDER BY p.id;
