-- B13.4A core preflight, read only
-- Purpose: check actual schema gaps and data risks before any additive migration is drafted or run.

-- 1) Current tables and columns for the core scope.
WITH relevant_tables AS (
  SELECT unnest(ARRAY[
    'departments',
    'teams',
    'seasons',
    'team_seasons',
    'team_templates',
    'players',
    'player_team_seasons',
    'coaches',
    'coach_team_seasons'
  ]) AS table_name
)
SELECT
  c.table_schema,
  c.table_name,
  c.ordinal_position,
  c.column_name,
  c.data_type,
  c.udt_name,
  c.is_nullable,
  c.column_default
FROM information_schema.columns AS c
JOIN relevant_tables AS r
  ON r.table_name = c.table_name
WHERE c.table_schema = 'public'
ORDER BY c.table_name, c.ordinal_position;

-- 2) Missing target columns in team_seasons versus the B13.3 target model.
WITH expected_columns AS (
  SELECT * FROM (VALUES
    ('id', 'uuid'),
    ('team_id', 'uuid'),
    ('season_id', 'uuid'),
    ('name_de', 'text'),
    ('name_en', 'text'),
    ('slug', 'text'),
    ('age_group', 'text'),
    ('description_de', 'text'),
    ('description_en', 'text'),
    ('training_times_de', 'text'),
    ('training_times_en', 'text'),
    ('team_image_url', 'text'),
    ('contact_name', 'text'),
    ('contact_email', 'text'),
    ('contact_phone', 'text'),
    ('contact_image_url', 'text'),
    ('fussball_de_matches_widget_id', 'text'),
    ('fussball_de_matches_widget_url', 'text'),
    ('fussball_de_matches_url', 'text'),
    ('dfb_matches_widget_url', 'text'),
    ('fussball_de_table_widget_id', 'text'),
    ('fussball_de_table_widget_url', 'text'),
    ('fussball_de_table_url', 'text'),
    ('dfb_table_widget_url', 'text'),
    ('fussball_de_team_id', 'text'),
    ('fussball_de_competition_id', 'text'),
    ('fussball_de_club_id', 'text'),
    ('fussball_de_team_url', 'text'),
    ('fupa_matches_widget_id', 'text'),
    ('fupa_table_widget_id', 'text'),
    ('fupa_club_url', 'text'),
    ('is_active', 'boolean'),
    ('sort_order', 'integer'),
    ('created_at', 'timestamp with time zone')
  ) AS t(column_name, expected_data_type)
), actual_columns AS (
  SELECT column_name, data_type, udt_name
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'team_seasons'
)
SELECT
  e.column_name,
  e.expected_data_type,
  a.data_type AS actual_data_type,
  a.udt_name AS actual_udt_name,
  CASE
    WHEN a.column_name IS NULL THEN 'MISSING'
    WHEN a.data_type <> e.expected_data_type THEN 'TYPE_MISMATCH'
    ELSE 'PRESENT'
  END AS status
FROM expected_columns AS e
LEFT JOIN actual_columns AS a
  ON a.column_name = e.column_name
ORDER BY e.column_name;

-- 3) Column name and data type comparison between teams and team_seasons.
WITH team_columns AS (
  SELECT column_name, data_type, is_nullable
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'teams'
), season_columns AS (
  SELECT column_name, data_type, is_nullable
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'team_seasons'
)
SELECT
  COALESCE(t.column_name, s.column_name) AS column_name,
  t.data_type AS teams_data_type,
  s.data_type AS team_seasons_data_type,
  t.is_nullable AS teams_nullable,
  s.is_nullable AS team_seasons_nullable,
  CASE
    WHEN t.column_name IS NULL THEN 'ONLY_IN_TEAM_SEASONS'
    WHEN s.column_name IS NULL THEN 'ONLY_IN_TEAMS'
    WHEN t.data_type <> s.data_type THEN 'TYPE_DIFFERENT'
    WHEN t.is_nullable <> s.is_nullable THEN 'NULLABILITY_DIFFERENT'
    ELSE 'MATCH'
  END AS comparison_status
FROM team_columns AS t
FULL OUTER JOIN season_columns AS s
  ON s.column_name = t.column_name
WHERE COALESCE(t.column_name, s.column_name) IN (
  'age_group', 'description_de', 'description_en', 'training_times_de', 'training_times_en',
  'team_image_url', 'contact_name', 'contact_email', 'contact_phone', 'contact_image_url',
  'fussball_de_matches_widget_url', 'fussball_de_matches_url', 'dfb_matches_widget_url',
  'fussball_de_table_widget_url', 'fussball_de_table_url', 'dfb_table_widget_url',
  'fussball_de_team_id', 'fussball_de_competition_id', 'fussball_de_club_id',
  'fussball_de_team_url', 'fupa_matches_widget_id', 'fupa_table_widget_id', 'fupa_club_url'
)
ORDER BY column_name;

-- 4) Constraint comparison for the core tables.
SELECT
  ns.nspname AS table_schema,
  cls.relname AS table_name,
  con.conname AS constraint_name,
  CASE con.contype
    WHEN 'p' THEN 'PRIMARY KEY'
    WHEN 'u' THEN 'UNIQUE'
    WHEN 'f' THEN 'FOREIGN KEY'
    WHEN 'c' THEN 'CHECK'
    ELSE con.contype::text
  END AS constraint_type,
  pg_get_constraintdef(con.oid, true) AS constraint_definition,
  ARRAY_REMOVE(ARRAY_AGG(att.attname ORDER BY key_cols.ord), NULL) AS constraint_columns
FROM pg_constraint AS con
JOIN pg_class AS cls
  ON cls.oid = con.conrelid
JOIN pg_namespace AS ns
  ON ns.oid = cls.relnamespace
LEFT JOIN LATERAL unnest(con.conkey) WITH ORDINALITY AS key_cols(attnum, ord)
  ON TRUE
LEFT JOIN pg_attribute AS att
  ON att.attrelid = cls.oid
 AND att.attnum = key_cols.attnum
WHERE ns.nspname = 'public'
  AND cls.relname IN (
    'departments', 'teams', 'seasons', 'team_seasons', 'team_templates',
    'players', 'player_team_seasons', 'coaches', 'coach_team_seasons'
  )
GROUP BY ns.nspname, cls.relname, con.conname, con.contype, con.oid
ORDER BY cls.relname, constraint_type, con.conname;

-- 5) Index comparison for the core tables.
SELECT
  i.schemaname AS schema_name,
  i.tablename AS table_name,
  i.indexname AS index_name,
  CASE
    WHEN i.indexdef ILIKE 'CREATE UNIQUE INDEX%' THEN 'yes'
    ELSE 'no'
  END AS is_unique,
  CASE
    WHEN i.indexname LIKE '%_pkey' THEN 'yes'
    ELSE 'no'
  END AS is_primary,
  i.indexdef AS index_definition,
  CASE
    WHEN POSITION(' WHERE ' IN UPPER(i.indexdef)) > 0
      THEN SUBSTRING(i.indexdef FROM POSITION(' WHERE ' IN UPPER(i.indexdef)) + 7)
    ELSE NULL
  END AS partial_index_condition
FROM pg_indexes AS i
WHERE i.schemaname = 'public'
  AND i.tablename IN (
    'departments', 'teams', 'seasons', 'team_seasons', 'team_templates',
    'players', 'player_team_seasons', 'coaches', 'coach_team_seasons'
  )
ORDER BY i.tablename, i.indexname;

-- 6) Duplicate team_id + season_id combinations in team_seasons.
SELECT
  team_id,
  season_id,
  COUNT(*) AS row_count,
  ARRAY_AGG(id ORDER BY id) AS team_season_ids
FROM public.team_seasons
GROUP BY team_id, season_id
HAVING COUNT(*) > 1
ORDER BY row_count DESC, team_id, season_id;

-- 7) Players with a legacy team_id but no seasonal assignment row.
WITH active_season AS (
  SELECT id AS season_id
  FROM public.seasons
  WHERE is_current = true
  ORDER BY created_at DESC, id
  LIMIT 1
)
SELECT
  p.id AS player_id,
  p.team_id,
  COUNT(pts.id) AS seasonal_assignment_count,
  COUNT(pts.id) FILTER (WHERE pts.is_active = true) AS active_assignment_count
FROM public.players AS p
LEFT JOIN public.team_seasons AS ts
  ON ts.team_id = p.team_id
LEFT JOIN public.player_team_seasons AS pts
  ON pts.player_id = p.id
 AND pts.team_season_id = ts.id
LEFT JOIN active_season AS a
  ON TRUE
WHERE p.team_id IS NOT NULL
GROUP BY p.id, p.team_id
HAVING COUNT(pts.id) = 0
ORDER BY p.id;

-- 8) Coaches with a legacy team_id but no seasonal assignment row.
WITH active_season AS (
  SELECT id AS season_id
  FROM public.seasons
  WHERE is_current = true
  ORDER BY created_at DESC, id
  LIMIT 1
)
SELECT
  c.id AS coach_id,
  c.team_id,
  COUNT(cts.id) AS seasonal_assignment_count,
  COUNT(cts.id) FILTER (WHERE cts.is_active = true) AS active_assignment_count
FROM public.coaches AS c
LEFT JOIN public.team_seasons AS ts
  ON ts.team_id = c.team_id
LEFT JOIN public.coach_team_seasons AS cts
  ON cts.coach_id = c.id
 AND cts.team_season_id = ts.id
LEFT JOIN active_season AS a
  ON TRUE
WHERE c.team_id IS NOT NULL
GROUP BY c.id, c.team_id
HAVING COUNT(cts.id) = 0
ORDER BY c.id;

-- 9) Widerspruch: legacy team_id versus existing seasonal assignment team.
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

-- 10) Missing current season or teams without a team_season for the current season.
WITH current_season AS (
  SELECT id AS season_id
  FROM public.seasons
  WHERE is_current = true
  ORDER BY created_at DESC, id
  LIMIT 1
)
SELECT
  COUNT(*) AS current_season_count,
  (
    SELECT season_id
    FROM current_season
    LIMIT 1
  ) AS current_season_id
FROM current_season;

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

-- 11) Relation entries without a valid parent row.
SELECT
  pts.id AS player_team_season_id,
  pts.player_id,
  pts.team_season_id
FROM public.player_team_seasons AS pts
LEFT JOIN public.players AS p
  ON p.id = pts.player_id
LEFT JOIN public.team_seasons AS ts
  ON ts.id = pts.team_season_id
WHERE p.id IS NULL OR ts.id IS NULL
ORDER BY pts.id;

SELECT
  cts.id AS coach_team_season_id,
  cts.coach_id,
  cts.team_season_id
FROM public.coach_team_seasons AS cts
LEFT JOIN public.coaches AS c
  ON c.id = cts.coach_id
LEFT JOIN public.team_seasons AS ts
  ON ts.id = cts.team_season_id
WHERE c.id IS NULL OR ts.id IS NULL
ORDER BY cts.id;

-- 12) Null or empty values for later required fields.
SELECT
  COUNT(*) AS team_seasons_missing_name_de
FROM public.team_seasons
WHERE name_de IS NULL OR btrim(name_de) = '';

SELECT
  COUNT(*) AS players_missing_first_name,
  COUNT(*) FILTER (WHERE team_id IS NULL) AS players_missing_team_id,
  COUNT(*) FILTER (WHERE image_url IS NULL OR btrim(image_url) = '') AS players_missing_image_url,
  COUNT(*) FILTER (WHERE photo_url IS NOT NULL AND btrim(photo_url) <> '' AND (image_url IS NULL OR btrim(image_url) = '')) AS players_photo_url_fallback_candidates
FROM public.players;

SELECT
  COUNT(*) AS coaches_missing_first_name,
  COUNT(*) FILTER (WHERE team_id IS NULL) AS coaches_missing_team_id,
  COUNT(*) FILTER (WHERE image_url IS NULL OR btrim(image_url) = '') AS coaches_missing_image_url,
  COUNT(*) FILTER (WHERE photo_url IS NOT NULL AND btrim(photo_url) <> '' AND (image_url IS NULL OR btrim(image_url) = '')) AS coaches_photo_url_fallback_candidates
FROM public.coaches;

-- 13) Backfill preview with counts and conflict markers.
WITH current_season AS (
  SELECT id AS season_id
  FROM public.seasons
  WHERE is_current = true
  ORDER BY created_at DESC, id
  LIMIT 1
), team_candidates AS (
  SELECT
    t.id AS team_id,
    cs.season_id,
    COUNT(ts.id) AS existing_rows
  FROM public.teams AS t
  CROSS JOIN current_season AS cs
  LEFT JOIN public.team_seasons AS ts
    ON ts.team_id = t.id
   AND ts.season_id = cs.season_id
  GROUP BY t.id, cs.season_id
), player_candidates AS (
  SELECT
    p.id AS player_id,
    COUNT(pts.id) FILTER (WHERE pts.is_active = true) AS active_assignments,
    COUNT(ts.id) FILTER (WHERE ts.id IS NOT NULL) AS matched_team_seasons
  FROM public.players AS p
  LEFT JOIN public.team_seasons AS ts
    ON ts.team_id = p.team_id
  LEFT JOIN public.player_team_seasons AS pts
    ON pts.player_id = p.id
   AND pts.team_season_id = ts.id
  GROUP BY p.id
), coach_candidates AS (
  SELECT
    c.id AS coach_id,
    COUNT(cts.id) FILTER (WHERE cts.is_active = true) AS active_assignments,
    COUNT(ts.id) FILTER (WHERE ts.id IS NOT NULL) AS matched_team_seasons
  FROM public.coaches AS c
  LEFT JOIN public.team_seasons AS ts
    ON ts.team_id = c.team_id
  LEFT JOIN public.coach_team_seasons AS cts
    ON cts.coach_id = c.id
   AND cts.team_season_id = ts.id
  GROUP BY c.id
)
SELECT
  (SELECT COUNT(*) FROM team_candidates WHERE existing_rows = 0) AS teams_insertable,
  (SELECT COUNT(*) FROM team_candidates WHERE existing_rows > 1) AS teams_conflicted,
  (SELECT COUNT(*) FROM player_candidates WHERE active_assignments = 0 AND matched_team_seasons > 0) AS players_insertable,
  (SELECT COUNT(*) FROM player_candidates WHERE active_assignments > 1) AS players_conflicted,
  (SELECT COUNT(*) FROM coach_candidates WHERE active_assignments = 0 AND matched_team_seasons > 0) AS coaches_insertable,
  (SELECT COUNT(*) FROM coach_candidates WHERE active_assignments > 1) AS coaches_conflicted;
