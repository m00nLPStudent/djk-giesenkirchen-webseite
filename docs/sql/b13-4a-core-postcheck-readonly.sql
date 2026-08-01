-- B13.4A core postcheck, read only
-- Run after the additive schema and controlled backfill have been reviewed or applied.

-- 1) Teams without a season row for the current active season.
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

-- 2) Duplicate team-season assignments.
SELECT
  team_id,
  season_id,
  COUNT(*) AS row_count,
  ARRAY_AGG(id ORDER BY id) AS team_season_ids
FROM public.team_seasons
GROUP BY team_id, season_id
HAVING COUNT(*) > 1
ORDER BY row_count DESC, team_id, season_id;

-- 3) Legacy team values without a corresponding target row in the current season.
WITH current_season AS (
  SELECT id AS season_id
  FROM public.seasons
  WHERE is_current = true
  ORDER BY created_at DESC, id
  LIMIT 1
)
SELECT
  t.id AS team_id,
  t.season AS legacy_season_text,
  ts.id AS team_season_id,
  ts.season_id
FROM public.teams AS t
CROSS JOIN current_season AS cs
LEFT JOIN public.team_seasons AS ts
  ON ts.team_id = t.id
 AND ts.season_id = cs.season_id
WHERE t.season IS NOT NULL
  AND btrim(t.season) <> ''
  AND ts.id IS NULL
ORDER BY t.id;

-- 4) Players without a seasonal assignment.
SELECT
  p.id AS player_id,
  p.team_id,
  COUNT(pts.id) FILTER (WHERE pts.is_active = true) AS active_assignment_count,
  COUNT(pts.id) AS total_assignment_count
FROM public.players AS p
LEFT JOIN public.player_team_seasons AS pts
  ON pts.player_id = p.id
GROUP BY p.id, p.team_id
HAVING COUNT(pts.id) = 0
ORDER BY p.id;

-- 5) Coaches without a seasonal assignment.
SELECT
  c.id AS coach_id,
  c.team_id,
  COUNT(cts.id) FILTER (WHERE cts.is_active = true) AS active_assignment_count,
  COUNT(cts.id) AS total_assignment_count
FROM public.coaches AS c
LEFT JOIN public.coach_team_seasons AS cts
  ON cts.coach_id = c.id
GROUP BY c.id, c.team_id
HAVING COUNT(cts.id) = 0
ORDER BY c.id;

-- 6) Conflicting relations: legacy team_id differs from the team behind the seasonal relation.
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

-- 7) Duplicate active player assignments.
SELECT
  player_id,
  COUNT(*) FILTER (WHERE is_active = true) AS active_assignment_count,
  ARRAY_AGG(team_season_id ORDER BY team_season_id) FILTER (WHERE is_active = true) AS active_team_season_ids
FROM public.player_team_seasons
GROUP BY player_id
HAVING COUNT(*) FILTER (WHERE is_active = true) > 1
ORDER BY active_assignment_count DESC, player_id;

-- 8) Duplicate active coach assignments.
SELECT
  coach_id,
  COUNT(*) FILTER (WHERE is_active = true) AS active_assignment_count,
  ARRAY_AGG(team_season_id ORDER BY team_season_id) FILTER (WHERE is_active = true) AS active_team_season_ids
FROM public.coach_team_seasons
GROUP BY coach_id
HAVING COUNT(*) FILTER (WHERE is_active = true) > 1
ORDER BY active_assignment_count DESC, coach_id;

-- 9) Different image fields.
SELECT
  id AS player_id,
  photo_url,
  image_url
FROM public.players
WHERE photo_url IS NOT NULL
  AND btrim(photo_url) <> ''
  AND image_url IS NOT NULL
  AND btrim(image_url) <> ''
  AND photo_url <> image_url
ORDER BY id;

SELECT
  id AS coach_id,
  photo_url,
  image_url
FROM public.coaches
WHERE photo_url IS NOT NULL
  AND btrim(photo_url) <> ''
  AND image_url IS NOT NULL
  AND btrim(image_url) <> ''
  AND photo_url <> image_url
ORDER BY id;

-- 10) Different shirt numbers between players and seasonal relations.
SELECT
  p.id AS player_id,
  p.shirt_number AS legacy_shirt_number,
  pts.shirt_number AS seasonal_shirt_number,
  pts.team_season_id
FROM public.players AS p
JOIN public.player_team_seasons AS pts
  ON pts.player_id = p.id
WHERE p.shirt_number IS NOT NULL
  AND pts.shirt_number IS NOT NULL
  AND p.shirt_number <> pts.shirt_number
ORDER BY p.id, pts.team_season_id;

-- 11) Different role values between coaches and seasonal relations.
SELECT
  c.id AS coach_id,
  c.role AS legacy_role,
  c.role_de AS legacy_role_de,
  c.role_en AS legacy_role_en,
  cts.role_de AS seasonal_role_de,
  cts.role_en AS seasonal_role_en,
  cts.team_season_id
FROM public.coaches AS c
JOIN public.coach_team_seasons AS cts
  ON cts.coach_id = c.id
WHERE (c.role IS NOT NULL AND btrim(c.role) <> '' AND (cts.role_de IS DISTINCT FROM c.role AND cts.role_en IS DISTINCT FROM c.role))
   OR (c.role_de IS NOT NULL AND btrim(c.role_de) <> '' AND cts.role_de IS DISTINCT FROM c.role_de)
   OR (c.role_en IS NOT NULL AND btrim(c.role_en) <> '' AND cts.role_en IS DISTINCT FROM c.role_en)
ORDER BY c.id, cts.team_season_id;

-- 12) Transferable and skipped counts after backfill.
WITH current_season AS (
  SELECT id AS season_id
  FROM public.seasons
  WHERE is_current = true
  ORDER BY created_at DESC, id
  LIMIT 1
), team_candidates AS (
  SELECT
    t.id AS team_id,
    COUNT(ts.id) AS matched_rows
  FROM public.teams AS t
  CROSS JOIN current_season AS cs
  LEFT JOIN public.team_seasons AS ts
    ON ts.team_id = t.id
   AND ts.season_id = cs.season_id
  GROUP BY t.id
), player_candidates AS (
  SELECT
    p.id AS player_id,
    COUNT(ts.id) AS matched_rows,
    COUNT(active_pts.id) FILTER (WHERE active_pts.is_active = true) AS active_rows
  FROM public.players AS p
  LEFT JOIN public.team_seasons AS ts
    ON ts.team_id = p.team_id
  LEFT JOIN public.player_team_seasons AS active_pts
    ON active_pts.player_id = p.id
   AND active_pts.is_active = true
  GROUP BY p.id
), coach_candidates AS (
  SELECT
    c.id AS coach_id,
    COUNT(ts.id) AS matched_rows,
    COUNT(active_cts.id) FILTER (WHERE active_cts.is_active = true) AS active_rows
  FROM public.coaches AS c
  LEFT JOIN public.team_seasons AS ts
    ON ts.team_id = c.team_id
  LEFT JOIN public.coach_team_seasons AS active_cts
    ON active_cts.coach_id = c.id
   AND active_cts.is_active = true
  GROUP BY c.id
)
SELECT
  (SELECT COUNT(*) FROM team_candidates WHERE matched_rows = 1) AS teams_transferable,
  (SELECT COUNT(*) FROM team_candidates WHERE matched_rows = 0) AS teams_skipped_missing_match,
  (SELECT COUNT(*) FROM player_candidates WHERE matched_rows = 1 AND active_rows = 0) AS players_transferable,
  (SELECT COUNT(*) FROM player_candidates WHERE matched_rows = 0) AS players_skipped_missing_match,
  (SELECT COUNT(*) FROM player_candidates WHERE active_rows > 1) AS players_skipped_conflicts,
  (SELECT COUNT(*) FROM coach_candidates WHERE matched_rows = 1 AND active_rows = 0) AS coaches_transferable,
  (SELECT COUNT(*) FROM coach_candidates WHERE matched_rows = 0) AS coaches_skipped_missing_match,
  (SELECT COUNT(*) FROM coach_candidates WHERE active_rows > 1) AS coaches_skipped_conflicts;
