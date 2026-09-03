-- B15.24H2 – Manual Review Round 1
-- READ-ONLY preflight for department-bound people, training-place type,
-- and the table-tennis dominant-hand data contract.
--
-- IMPORTANT:
-- - Run manually in the Supabase SQL Editor.
-- - This file contains metadata and aggregate SELECT statements only.
-- - It does not output names, e-mail addresses, free text, or other personal data.

-- H2R.01 – Relevant columns and their exact live types/defaults/nullability.
SELECT
  'H2R.01_RELEVANT_COLUMNS' AS section,
  c.table_name,
  c.ordinal_position,
  c.column_name,
  c.data_type,
  c.udt_name,
  c.is_nullable,
  c.column_default
FROM information_schema.columns AS c
WHERE c.table_schema = 'public'
  AND c.table_name IN (
    'players',
    'coaches',
    'player_team_seasons',
    'coach_team_seasons',
    'team_seasons',
    'teams',
    'team_training_times'
  )
ORDER BY c.table_name, c.ordinal_position;

-- H2R.02 – Search explicitly for an existing department/hand/foot/place/surface
-- contract instead of assuming that no suitable column exists.
SELECT
  'H2R.02_CANDIDATE_COLUMNS' AS section,
  c.table_name,
  c.column_name,
  c.data_type,
  c.udt_name,
  c.is_nullable,
  c.column_default
FROM information_schema.columns AS c
WHERE c.table_schema = 'public'
  AND c.table_name IN ('players', 'coaches', 'team_training_times', 'teams')
  AND (
    c.column_name ILIKE '%department%'
    OR c.column_name ILIKE '%hand%'
    OR c.column_name ILIKE '%foot%'
    OR c.column_name ILIKE '%place%'
    OR c.column_name ILIKE '%pitch%'
    OR c.column_name ILIKE '%surface%'
    OR c.column_name ILIKE '%venue%'
    OR c.column_name ILIKE '%location%'
  )
ORDER BY c.table_name, c.ordinal_position;

-- H2R.03 – Constraints affecting the relevant value contracts.
SELECT
  'H2R.03_RELEVANT_CONSTRAINTS' AS section,
  n.nspname AS schema_name,
  cls.relname AS table_name,
  con.conname AS constraint_name,
  con.contype AS constraint_type,
  pg_get_constraintdef(con.oid, true) AS constraint_definition
FROM pg_catalog.pg_constraint AS con
JOIN pg_catalog.pg_class AS cls ON cls.oid = con.conrelid
JOIN pg_catalog.pg_namespace AS n ON n.oid = cls.relnamespace
WHERE n.nspname = 'public'
  AND cls.relname IN (
    'players',
    'coaches',
    'player_team_seasons',
    'coach_team_seasons',
    'team_seasons',
    'teams',
    'team_training_times'
  )
ORDER BY cls.relname, con.conname;

-- H2R.04 – Existing strong_foot values, aggregate-only and without person data.
SELECT
  'H2R.04_STRONG_FOOT_VALUE_INVENTORY' AS section,
  COALESCE(NULLIF(btrim(p.strong_foot::text), ''), '<NULL_OR_EMPTY>') AS stored_value,
  count(*) AS row_count
FROM public.players AS p
GROUP BY COALESCE(NULLIF(btrim(p.strong_foot::text), ''), '<NULL_OR_EMPTY>')
ORDER BY stored_value;

-- H2R.05 – Existing training types and whether only address/location fields are
-- populated. Values are operational metadata; no note/free-text is selected.
SELECT
  'H2R.05_TRAINING_VALUE_INVENTORY' AS section,
  COALESCE(NULLIF(btrim(tt.training_type::text), ''), '<NULL_OR_EMPTY>') AS training_type,
  count(*) AS row_count,
  count(*) FILTER (WHERE NULLIF(btrim(tt.location_name::text), '') IS NOT NULL) AS with_location_name,
  count(*) FILTER (WHERE NULLIF(btrim(tt.location_address::text), '') IS NOT NULL) AS with_location_address,
  count(*) FILTER (WHERE NULLIF(btrim(tt.location_city::text), '') IS NOT NULL) AS with_location_city
FROM public.team_training_times AS tt
GROUP BY COALESCE(NULLIF(btrim(tt.training_type::text), ''), '<NULL_OR_EMPTY>')
ORDER BY training_type;

-- H2R.06 – Prove the existing player department model through active seasonal
-- assignments. No IDs or person data leave the database.
WITH player_departments AS MATERIALIZED (
  SELECT
    pts.player_id,
    t.department_id
  FROM public.player_team_seasons AS pts
  JOIN public.team_seasons AS ts ON ts.id = pts.team_season_id
  JOIN public.teams AS t ON t.id = ts.team_id
  WHERE pts.is_active = true
    AND ts.is_active = true
), player_summary AS MATERIALIZED (
  SELECT
    p.id,
    count(DISTINCT pd.department_id) FILTER (WHERE pd.department_id IS NOT NULL) AS department_count,
    count(*) FILTER (WHERE pd.department_id IS NULL) AS null_department_assignment_count
  FROM public.players AS p
  LEFT JOIN player_departments AS pd ON pd.player_id = p.id
  GROUP BY p.id
)
SELECT
  'H2R.06_PLAYER_DEPARTMENT_MODEL' AS section,
  count(*) AS total_players,
  count(*) FILTER (WHERE department_count = 0) AS without_explicit_department,
  count(*) FILTER (WHERE department_count = 1) AS with_one_department,
  count(*) FILTER (WHERE department_count > 1) AS with_multiple_departments,
  count(*) FILTER (WHERE null_department_assignment_count > 0) AS with_null_department_assignment
FROM player_summary;

-- H2R.07 – Equivalent aggregate proof for coaches.
WITH coach_departments AS MATERIALIZED (
  SELECT
    cts.coach_id,
    t.department_id
  FROM public.coach_team_seasons AS cts
  JOIN public.team_seasons AS ts ON ts.id = cts.team_season_id
  JOIN public.teams AS t ON t.id = ts.team_id
  WHERE cts.is_active = true
    AND ts.is_active = true
), coach_summary AS MATERIALIZED (
  SELECT
    c.id,
    count(DISTINCT cd.department_id) FILTER (WHERE cd.department_id IS NOT NULL) AS department_count,
    count(*) FILTER (WHERE cd.department_id IS NULL) AS null_department_assignment_count
  FROM public.coaches AS c
  LEFT JOIN coach_departments AS cd ON cd.coach_id = c.id
  GROUP BY c.id
)
SELECT
  'H2R.07_COACH_DEPARTMENT_MODEL' AS section,
  count(*) AS total_coaches,
  count(*) FILTER (WHERE department_count = 0) AS without_explicit_department,
  count(*) FILTER (WHERE department_count = 1) AS with_one_department,
  count(*) FILTER (WHERE department_count > 1) AS with_multiple_departments,
  count(*) FILTER (WHERE null_department_assignment_count > 0) AS with_null_department_assignment
FROM coach_summary;

-- H2R.08 – Index inventory for the relation-based scope path.
SELECT
  'H2R.08_SCOPE_PATH_INDEXES' AS section,
  i.schemaname,
  i.tablename,
  i.indexname,
  i.indexdef
FROM pg_catalog.pg_indexes AS i
WHERE i.schemaname = 'public'
  AND i.tablename IN (
    'player_team_seasons',
    'coach_team_seasons',
    'team_seasons',
    'teams',
    'team_training_times'
  )
ORDER BY i.tablename, i.indexname;

-- H2R.09 – Final read-only contract summary based on catalog evidence.
SELECT
  'H2R.09_CONTRACT_SUMMARY' AS section,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'players' AND column_name = 'department_id'
  ) AS players_have_direct_department_id,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'coaches' AND column_name = 'department_id'
  ) AS coaches_have_direct_department_id,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'players'
      AND column_name IN ('strong_hand', 'dominant_hand', 'preferred_hand')
  ) AS players_have_hand_specific_column,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'team_training_times'
      AND column_name IN ('place_type', 'pitch_type', 'surface_type', 'venue_type', 'training_location_type')
  ) AS training_times_have_place_type_column;
