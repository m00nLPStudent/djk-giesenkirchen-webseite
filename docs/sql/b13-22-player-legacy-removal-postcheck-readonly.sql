-- B13.22 player legacy removal postcheck
-- Read only. Run only after a later approved drop step.

-- 1) Verify the legacy columns are gone.
SELECT
  c.column_name
FROM information_schema.columns AS c
WHERE c.table_schema = 'public'
  AND c.table_name = 'players'
  AND c.column_name IN (
    'team_id',
    'shirt_number',
    'jersey_number',
    'position',
    'position_de',
    'position_en',
    'is_captain',
    'sort_order'
  )
ORDER BY c.column_name;

-- 2) Search for lingering function or RPC text references.
WITH target_patterns AS (
  SELECT unnest(ARRAY[
    'players.team_id',
    'players.shirt_number',
    'players.jersey_number',
    'players.position',
    'players.position_de',
    'players.position_en',
    'players.is_captain',
    'players.sort_order'
  ]) AS pattern
)
SELECT
  n.nspname AS function_schema,
  p.proname AS function_name,
  tp.pattern AS matched_pattern
FROM pg_proc AS p
JOIN pg_namespace AS n
  ON n.oid = p.pronamespace
JOIN target_patterns AS tp
  ON pg_get_functiondef(p.oid) ILIKE '%' || tp.pattern || '%'
ORDER BY function_schema, function_name, matched_pattern;

-- 3) Search for lingering view or materialized-view text references.
WITH target_patterns AS (
  SELECT unnest(ARRAY[
    'players.team_id',
    'players.shirt_number',
    'players.jersey_number',
    'players.position',
    'players.position_de',
    'players.position_en',
    'players.is_captain',
    'players.sort_order'
  ]) AS pattern
)
SELECT
  n.nspname AS object_schema,
  c.relname AS object_name,
  CASE c.relkind WHEN 'm' THEN 'MATERIALIZED_VIEW' ELSE 'VIEW' END AS object_type,
  tp.pattern AS matched_pattern
FROM pg_class AS c
JOIN pg_namespace AS n
  ON n.oid = c.relnamespace
JOIN target_patterns AS tp
  ON pg_get_viewdef(c.oid, true) ILIKE '%' || tp.pattern || '%'
WHERE c.relkind IN ('v', 'm')
ORDER BY object_schema, object_name, matched_pattern;

-- 4) Player master table remains technically readable.
SELECT id, first_name, last_name, image_url, is_active
FROM public.players
ORDER BY id
LIMIT 20;

-- 5) player_team_seasons remains intact and readable.
SELECT
  COUNT(*) AS player_team_season_row_count,
  COUNT(*) FILTER (WHERE is_active = true) AS player_team_season_active_row_count,
  COUNT(*) FILTER (WHERE is_active = false) AS player_team_season_historical_row_count
FROM public.player_team_seasons;

-- 6) No orphaned player_team_seasons rows.
SELECT
  pts.id AS player_team_season_id,
  pts.player_id
FROM public.player_team_seasons AS pts
LEFT JOIN public.players AS p
  ON p.id = pts.player_id
WHERE p.id IS NULL
ORDER BY pts.id;

-- 7) No orphaned team-season relations.
SELECT
  pts.id AS player_team_season_id,
  pts.team_season_id
FROM public.player_team_seasons AS pts
LEFT JOIN public.team_seasons AS ts
  ON ts.id = pts.team_season_id
WHERE ts.id IS NULL
ORDER BY pts.id;

-- 8) No duplicate active current-season assignments per player.
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
HAVING COUNT(*) > 1
ORDER BY active_current_assignment_count DESC, pts.player_id;

-- 9) Team page technical source data remains available.
SELECT
  ts.team_id,
  COUNT(pts.id) FILTER (WHERE pts.is_active = true) AS active_player_count
FROM public.team_seasons AS ts
LEFT JOIN public.player_team_seasons AS pts
  ON pts.team_season_id = ts.id
GROUP BY ts.team_id
ORDER BY ts.team_id;
