-- B15.24H2 – Review data contract READ-ONLY postcheck
-- Run manually only after the corresponding proposal was approved and executed.

SELECT 'H2RP.01_COLUMNS' AS section, table_name, column_name, data_type, udt_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (table_name, column_name) IN (('players', 'strong_hand'), ('team_training_times', 'training_location_type'))
ORDER BY table_name, column_name;

SELECT 'H2RP.02_CONSTRAINTS' AS section, cls.relname AS table_name, c.conname AS constraint_name,
       c.convalidated, pg_get_constraintdef(c.oid, true) AS constraint_definition
FROM pg_catalog.pg_constraint AS c
JOIN pg_catalog.pg_class AS cls ON cls.oid = c.conrelid
JOIN pg_catalog.pg_namespace AS n ON n.oid = cls.relnamespace
WHERE n.nspname = 'public'
  AND c.conname IN ('players_strong_hand_check', 'team_training_times_training_location_type_check')
ORDER BY cls.relname, c.conname;

SELECT 'H2RP.03_STRONG_HAND_VALUES' AS section,
       count(*) AS total_players,
       count(*) FILTER (WHERE strong_hand IS NULL) AS null_count,
       count(*) FILTER (WHERE strong_hand = 'Rechts') AS rechts_count,
       count(*) FILTER (WHERE strong_hand = 'Links') AS links_count,
       count(*) FILTER (WHERE strong_hand IS NOT NULL AND strong_hand NOT IN ('Rechts', 'Links')) AS invalid_count
FROM public.players;

SELECT 'H2RP.04_TRAINING_LOCATION_VALUES' AS section,
       count(*) AS total_training_times,
       count(*) FILTER (WHERE training_location_type IS NULL) AS null_count,
       count(*) FILTER (WHERE training_location_type = 'kleinfeld') AS kleinfeld_count,
       count(*) FILTER (WHERE training_location_type = 'rasenplatz') AS rasenplatz_count,
       count(*) FILTER (WHERE training_location_type = 'kunstrasen') AS kunstrasen_count,
       count(*) FILTER (WHERE training_location_type = 'halle') AS halle_count,
       count(*) FILTER (WHERE training_location_type IS NOT NULL AND training_location_type NOT IN ('kleinfeld', 'rasenplatz', 'kunstrasen', 'halle')) AS invalid_count
FROM public.team_training_times;

SELECT 'H2RP.05_INDEXES' AS section, tbl.relname AS table_name, idx.relname AS index_name,
       i.indisvalid, i.indisready, pg_get_indexdef(i.indexrelid) AS index_definition,
       pg_get_expr(i.indpred, i.indrelid) AS predicate
FROM pg_catalog.pg_index AS i
JOIN pg_catalog.pg_class AS idx ON idx.oid = i.indexrelid
JOIN pg_catalog.pg_class AS tbl ON tbl.oid = i.indrelid
JOIN pg_catalog.pg_namespace AS n ON n.oid = idx.relnamespace
WHERE n.nspname = 'public'
  AND idx.relname IN ('teams_department_id_scope_idx', 'player_team_seasons_team_season_active_idx', 'coach_team_seasons_team_season_active_idx')
ORDER BY tbl.relname, idx.relname;

SELECT 'H2RP.06_RLS' AS section, n.nspname AS schema_name, c.relname AS table_name,
       c.relrowsecurity AS rls_enabled, c.relforcerowsecurity AS force_rls
FROM pg_catalog.pg_class AS c
JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('players', 'team_training_times', 'teams', 'player_team_seasons', 'coach_team_seasons')
ORDER BY c.relname;

SELECT 'H2RP.07_POLICIES' AS section, schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_catalog.pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('players', 'team_training_times', 'teams', 'player_team_seasons', 'coach_team_seasons')
ORDER BY tablename, cmd, policyname;

SELECT 'H2RP.08_TABLE_GRANTS' AS section, table_name, grantee, privilege_type, is_grantable
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN ('players', 'team_training_times', 'teams', 'player_team_seasons', 'coach_team_seasons')
  AND grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY table_name, grantee, privilege_type;

SELECT 'H2RP.08A_NEW_COLUMN_GRANTS' AS section, table_name, column_name, grantee, privilege_type, is_grantable
FROM information_schema.role_column_grants
WHERE table_schema = 'public'
  AND (table_name, column_name) IN (('players', 'strong_hand'), ('team_training_times', 'training_location_type'))
  AND grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY table_name, column_name, grantee, privilege_type;

WITH player_departments AS MATERIALIZED (
  SELECT pts.player_id, t.department_id
  FROM public.player_team_seasons AS pts
  JOIN public.team_seasons AS ts ON ts.id = pts.team_season_id
  JOIN public.teams AS t ON t.id = ts.team_id
  WHERE pts.is_active = true AND ts.is_active = true
), coach_departments AS MATERIALIZED (
  SELECT cts.coach_id, t.department_id
  FROM public.coach_team_seasons AS cts
  JOIN public.team_seasons AS ts ON ts.id = cts.team_season_id
  JOIN public.teams AS t ON t.id = ts.team_id
  WHERE cts.is_active = true AND ts.is_active = true
)
SELECT 'H2RP.09_DEPARTMENT_MODEL' AS section,
       (SELECT count(*) FROM public.players) AS total_players,
       (SELECT count(DISTINCT player_id) FROM player_departments WHERE department_id IS NOT NULL) AS players_with_department,
       (SELECT count(*) FROM public.coaches) AS total_coaches,
       (SELECT count(DISTINCT coach_id) FROM coach_departments WHERE department_id IS NOT NULL) AS coaches_with_department,
       EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'players' AND column_name = 'department_id') AS players_have_direct_department_id,
       EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coaches' AND column_name = 'department_id') AS coaches_have_direct_department_id;

SELECT 'H2RP.10_FINAL_ASSERTIONS' AS section,
       EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'players' AND column_name = 'strong_hand' AND data_type = 'text' AND is_nullable = 'YES') AS strong_hand_column_ok,
       EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'team_training_times' AND column_name = 'training_location_type' AND data_type = 'text' AND is_nullable = 'YES') AS training_location_type_column_ok,
       EXISTS (SELECT 1 FROM pg_catalog.pg_constraint WHERE conrelid = 'public.players'::regclass AND conname = 'players_strong_hand_check' AND contype = 'c' AND convalidated) AS strong_hand_constraint_ok,
       EXISTS (SELECT 1 FROM pg_catalog.pg_constraint WHERE conrelid = 'public.team_training_times'::regclass AND conname = 'team_training_times_training_location_type_check' AND contype = 'c' AND convalidated) AS training_location_type_constraint_ok,
       NOT EXISTS (SELECT 1 FROM public.players WHERE strong_hand IS NOT NULL AND strong_hand NOT IN ('Rechts', 'Links')) AS strong_hand_values_ok,
       NOT EXISTS (SELECT 1 FROM public.team_training_times WHERE training_location_type IS NOT NULL AND training_location_type NOT IN ('kleinfeld', 'rasenplatz', 'kunstrasen', 'halle')) AS training_location_values_ok,
       (SELECT count(*) FROM public.players) = 19 AS preflight_player_count_unchanged,
       (SELECT count(*) FROM public.team_training_times) = 7 AS preflight_training_time_count_unchanged,
       NOT EXISTS (SELECT 1 FROM public.players WHERE strong_hand IS NOT NULL) AS no_strong_hand_backfill,
       NOT EXISTS (SELECT 1 FROM public.team_training_times WHERE training_location_type IS NOT NULL) AS no_training_location_backfill,
       NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name IN ('players', 'coaches') AND column_name = 'department_id') AS no_direct_person_department_columns;
