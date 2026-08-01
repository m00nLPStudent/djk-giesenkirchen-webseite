-- B13.4B safe postcheck (read only)
-- Run after b13-4b-safe-backfill.sql to validate transfer quality and skipped records.

-- 1) Current-season guard status.
WITH current_season AS (
  SELECT id AS season_id
  FROM public.seasons
  WHERE is_current = true
)
SELECT
  COUNT(*) AS current_season_count
FROM current_season;

-- 2) Teams still missing a team_seasons row for current season.
WITH current_season AS (
  SELECT id AS season_id
  FROM public.seasons
  WHERE is_current = true
  ORDER BY created_at DESC, id
  LIMIT 1
)
SELECT
  t.id AS team_id,
  t.slug,
  t.name_de,
  cs.season_id
FROM public.teams AS t
CROSS JOIN current_season AS cs
LEFT JOIN public.team_seasons AS ts
  ON ts.team_id = t.id
 AND ts.season_id = cs.season_id
WHERE ts.id IS NULL
ORDER BY t.sort_order, t.id;

-- 3) Duplicate team-season pairs.
SELECT
  team_id,
  season_id,
  COUNT(*) AS row_count,
  ARRAY_AGG(id ORDER BY id) AS team_season_ids
FROM public.team_seasons
GROUP BY team_id, season_id
HAVING COUNT(*) > 1
ORDER BY row_count DESC, team_id, season_id;

-- 4) Players still without active relation.
SELECT
  p.id AS player_id,
  p.team_id
FROM public.players AS p
WHERE NOT EXISTS (
  SELECT 1
  FROM public.player_team_seasons AS pts
  WHERE pts.player_id = p.id
    AND pts.is_active = true
)
ORDER BY p.id;

-- 5) Coaches still without active relation.
SELECT
  c.id AS coach_id,
  c.team_id
FROM public.coaches AS c
WHERE NOT EXISTS (
  SELECT 1
  FROM public.coach_team_seasons AS cts
  WHERE cts.coach_id = c.id
    AND cts.is_active = true
)
ORDER BY c.id;

-- 6) Legacy vs relation team mismatch for players.
SELECT
  p.id AS player_id,
  p.team_id AS legacy_team_id,
  ts.team_id AS seasonal_team_id,
  pts.team_season_id
FROM public.players AS p
JOIN public.player_team_seasons AS pts
  ON pts.player_id = p.id
JOIN public.team_seasons AS ts
  ON ts.id = pts.team_season_id
WHERE p.team_id IS NOT NULL
  AND p.team_id <> ts.team_id
ORDER BY p.id, pts.team_season_id;

-- 7) Legacy vs relation team mismatch for coaches.
SELECT
  c.id AS coach_id,
  c.team_id AS legacy_team_id,
  ts.team_id AS seasonal_team_id,
  cts.team_season_id
FROM public.coaches AS c
JOIN public.coach_team_seasons AS cts
  ON cts.coach_id = c.id
JOIN public.team_seasons AS ts
  ON ts.id = cts.team_season_id
WHERE c.team_id IS NOT NULL
  AND c.team_id <> ts.team_id
ORDER BY c.id, cts.team_season_id;

-- 8) Duplicate active relations.
SELECT
  player_id,
  COUNT(*) FILTER (WHERE is_active = true) AS active_count
FROM public.player_team_seasons
GROUP BY player_id
HAVING COUNT(*) FILTER (WHERE is_active = true) > 1
ORDER BY active_count DESC, player_id;

SELECT
  coach_id,
  COUNT(*) FILTER (WHERE is_active = true) AS active_count
FROM public.coach_team_seasons
GROUP BY coach_id
HAVING COUNT(*) FILTER (WHERE is_active = true) > 1
ORDER BY active_count DESC, coach_id;

-- 9) Image carry-over residuals.
SELECT
  COUNT(*) AS players_still_missing_image_url
FROM public.players
WHERE image_url IS NULL
  AND photo_url IS NOT NULL;

SELECT
  COUNT(*) AS coaches_still_missing_image_url
FROM public.coaches
WHERE image_url IS NULL
  AND photo_url IS NOT NULL;

-- 10) Final transferability summary for skipped records.
WITH current_season AS (
  SELECT id AS season_id
  FROM public.seasons
  WHERE is_current = true
), current_guard AS (
  SELECT COUNT(*) AS cnt FROM current_season
), player_candidates AS (
  SELECT
    p.id AS player_id,
    COUNT(ts.id) AS team_season_match_count,
    COUNT(pts.id) FILTER (WHERE pts.is_active = true) AS active_rel_count
  FROM public.players AS p
  LEFT JOIN current_season AS cs ON TRUE
  LEFT JOIN public.team_seasons AS ts
    ON ts.team_id = p.team_id
   AND ts.season_id = cs.season_id
  LEFT JOIN public.player_team_seasons AS pts
    ON pts.player_id = p.id
  GROUP BY p.id
), coach_candidates AS (
  SELECT
    c.id AS coach_id,
    COUNT(ts.id) AS team_season_match_count,
    COUNT(cts.id) FILTER (WHERE cts.is_active = true) AS active_rel_count
  FROM public.coaches AS c
  LEFT JOIN current_season AS cs ON TRUE
  LEFT JOIN public.team_seasons AS ts
    ON ts.team_id = c.team_id
   AND ts.season_id = cs.season_id
  LEFT JOIN public.coach_team_seasons AS cts
    ON cts.coach_id = c.id
  GROUP BY c.id
)
SELECT
  (SELECT cnt FROM current_guard) AS current_season_count,
  (SELECT COUNT(*) FROM player_candidates WHERE team_season_match_count = 1 AND active_rel_count = 0) AS players_clean_candidates,
  (SELECT COUNT(*) FROM player_candidates WHERE team_season_match_count = 0) AS players_skipped_no_match,
  (SELECT COUNT(*) FROM player_candidates WHERE team_season_match_count > 1) AS players_skipped_ambiguous,
  (SELECT COUNT(*) FROM player_candidates WHERE active_rel_count > 0) AS players_skipped_existing_active,
  (SELECT COUNT(*) FROM coach_candidates WHERE team_season_match_count = 1 AND active_rel_count = 0) AS coaches_clean_candidates,
  (SELECT COUNT(*) FROM coach_candidates WHERE team_season_match_count = 0) AS coaches_skipped_no_match,
  (SELECT COUNT(*) FROM coach_candidates WHERE team_season_match_count > 1) AS coaches_skipped_ambiguous,
  (SELECT COUNT(*) FROM coach_candidates WHERE active_rel_count > 0) AS coaches_skipped_existing_active;
