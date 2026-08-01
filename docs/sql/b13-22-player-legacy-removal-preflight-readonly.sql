-- B13.22 player legacy removal preflight
-- Read only. Do not mutate schema or data.

-- 1) Target column metadata.
SELECT c.column_name, c.data_type, c.udt_name, c.is_nullable, c.column_default, c.is_generated, c.generation_expression
FROM information_schema.columns AS c
WHERE c.table_schema = 'public'
  AND c.table_name = 'players'
  AND c.column_name IN ('team_id', 'shirt_number', 'jersey_number', 'position', 'position_de', 'position_en', 'is_captain', 'sort_order')
ORDER BY c.ordinal_position;

-- 2) Index and constraint dependencies.
WITH target_columns AS (
  SELECT attrelid, attnum, attname
  FROM pg_attribute
  WHERE attrelid = 'public.players'::regclass
    AND attname IN ('team_id', 'shirt_number', 'jersey_number', 'position', 'position_de', 'position_en', 'is_captain', 'sort_order')
), index_dependencies AS (
  SELECT tc.attname AS column_name, i.relname AS dependency_name, 'INDEX' AS dependency_type, pg_get_indexdef(i.oid) AS dependency_definition
  FROM target_columns AS tc
  JOIN pg_index AS ix ON ix.indrelid = tc.attrelid AND tc.attnum = ANY(ix.indkey)
  JOIN pg_class AS i ON i.oid = ix.indexrelid
), constraint_dependencies AS (
  SELECT tc.attname AS column_name, con.conname AS dependency_name,
    CASE con.contype WHEN 'p' THEN 'PRIMARY_KEY' WHEN 'u' THEN 'UNIQUE' WHEN 'f' THEN 'FOREIGN_KEY' WHEN 'c' THEN 'CHECK' ELSE con.contype::text END AS dependency_type,
    pg_get_constraintdef(con.oid) AS dependency_definition
  FROM target_columns AS tc
  JOIN pg_constraint AS con ON con.conrelid = tc.attrelid AND tc.attnum = ANY(con.conkey)
)
SELECT * FROM index_dependencies
UNION ALL
SELECT * FROM constraint_dependencies
ORDER BY column_name, dependency_type, dependency_name;

-- 3) View and materialized-view dependencies.
WITH target_columns AS (
  SELECT attrelid, attnum, attname
  FROM pg_attribute
  WHERE attrelid = 'public.players'::regclass
    AND attname IN ('team_id', 'shirt_number', 'jersey_number', 'position', 'position_de', 'position_en', 'is_captain', 'sort_order')
)
SELECT tc.attname AS column_name, ns.nspname AS dependent_schema, cls.relname AS dependent_name,
  CASE cls.relkind WHEN 'm' THEN 'MATERIALIZED_VIEW' ELSE 'VIEW' END AS dependent_type
FROM target_columns AS tc
JOIN pg_depend AS dep ON dep.refobjid = tc.attrelid AND dep.refobjsubid = tc.attnum
JOIN pg_rewrite AS rw ON rw.oid = dep.objid
JOIN pg_class AS cls ON cls.oid = rw.ev_class
JOIN pg_namespace AS ns ON ns.oid = cls.relnamespace
WHERE cls.relkind IN ('v', 'm')
ORDER BY column_name, dependent_schema, dependent_name;

-- 4) Function, trigger, policy and generated-column dependency scan.
WITH target_patterns AS (
  SELECT unnest(ARRAY[
    'players.team_id', 'players.shirt_number', 'players.jersey_number', 'players.position',
    'players.position_de', 'players.position_en', 'players.is_captain', 'players.sort_order'
  ]) AS pattern
), eligible_routines AS MATERIALIZED (
  SELECT p.oid, n.nspname AS object_schema, p.proname AS object_name, p.prokind
  FROM pg_proc AS p
  JOIN pg_namespace AS n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.prokind IN ('f', 'p')
), routine_definitions AS (
  SELECT er.oid, er.object_schema, er.object_name, er.prokind, pg_get_functiondef(er.oid) AS routine_definition
  FROM eligible_routines AS er
), player_trigger_routines AS MATERIALIZED (
  SELECT DISTINCT rd.oid, rd.object_schema, rd.object_name, rd.prokind, rd.routine_definition
  FROM pg_trigger AS t
  JOIN routine_definitions AS rd ON rd.oid = t.tgfoid
  WHERE t.tgrelid = 'public.players'::regclass
    AND NOT t.tgisinternal
)
SELECT 'FUNCTION_OR_RPC' AS dependency_type, rd.object_schema, rd.object_name, rd.prokind::text AS object_kind, tp.pattern AS matched_pattern
FROM routine_definitions AS rd
JOIN target_patterns AS tp ON rd.routine_definition ILIKE '%' || tp.pattern || '%'
UNION ALL
SELECT 'TRIGGER_FUNCTION', ptr.object_schema, ptr.object_name, ptr.prokind::text, tp.pattern
FROM player_trigger_routines AS ptr
JOIN target_patterns AS tp ON ptr.routine_definition ILIKE '%' || tp.pattern || '%'
UNION ALL
SELECT 'POLICY', pol.schemaname, pol.policyname, NULL::text, tp.pattern
FROM pg_policies AS pol
JOIN target_patterns AS tp ON COALESCE(pol.qual, '') ILIKE '%' || tp.pattern || '%' OR COALESCE(pol.with_check, '') ILIKE '%' || tp.pattern || '%'
WHERE pol.schemaname = 'public'
UNION ALL
SELECT 'GENERATED_COLUMN', gc.table_schema, gc.table_name || '.' || gc.column_name, NULL::text, tp.pattern
FROM information_schema.columns AS gc
JOIN target_patterns AS tp ON COALESCE(gc.generation_expression, '') ILIKE '%' || tp.pattern || '%'
WHERE gc.is_generated <> 'NEVER'
  AND gc.table_schema = 'public'
ORDER BY dependency_type, object_schema, object_name, object_kind, matched_pattern;

-- 5) Current population snapshot.
SELECT
  COUNT(*) FILTER (WHERE team_id IS NOT NULL) AS team_id_populated,
  COUNT(*) FILTER (WHERE shirt_number IS NOT NULL) AS shirt_number_populated,
  COUNT(*) FILTER (WHERE jersey_number IS NOT NULL) AS jersey_number_populated,
  COUNT(*) FILTER (WHERE NULLIF(btrim(position), '') IS NOT NULL) AS position_populated,
  COUNT(*) FILTER (WHERE NULLIF(btrim(position_de), '') IS NOT NULL) AS position_de_populated,
  COUNT(*) FILTER (WHERE NULLIF(btrim(position_en), '') IS NOT NULL) AS position_en_populated,
  COUNT(*) FILTER (WHERE is_captain IS NOT NULL) AS is_captain_populated,
  COUNT(*) FILTER (WHERE sort_order IS NOT NULL) AS sort_order_populated
FROM public.players;

-- 6) Current-assignment integrity summary.
WITH current_seasons AS (
  SELECT id FROM public.seasons WHERE is_current = true
), current_team_seasons AS (
  SELECT ts.id, ts.team_id
  FROM public.team_seasons AS ts
  JOIN current_seasons AS cs ON cs.id = ts.season_id
  WHERE ts.is_active = true
), current_active_assignments AS (
  SELECT pts.player_id, pts.team_season_id, pts.shirt_number, pts.position_de, pts.position_en, pts.is_captain, pts.sort_order
  FROM public.player_team_seasons AS pts
  JOIN current_team_seasons AS cts ON cts.id = pts.team_season_id
  WHERE pts.is_active = true
)
SELECT
  (SELECT COUNT(*) FROM current_seasons) AS current_season_count,
  COUNT(*) FILTER (WHERE current_assignment_count = 0) AS players_without_current_assignment,
  COUNT(*) FILTER (WHERE current_assignment_count = 1) AS players_with_one_current_assignment,
  COUNT(*) FILTER (WHERE current_assignment_count > 1) AS players_with_multiple_current_assignments,
  (SELECT COUNT(*) FROM public.player_team_seasons WHERE is_active = false) AS historical_assignment_row_count
FROM (
  SELECT p.id, COUNT(caa.player_id) AS current_assignment_count
  FROM public.players AS p
  LEFT JOIN current_active_assignments AS caa ON caa.player_id = p.id
  GROUP BY p.id
) AS counts;

-- 7) Legacy-vs-current assignment comparison summary.
WITH current_seasons AS (
  SELECT id FROM public.seasons WHERE is_current = true
), current_team_seasons AS (
  SELECT ts.id, ts.team_id
  FROM public.team_seasons AS ts
  JOIN current_seasons AS cs ON cs.id = ts.season_id
  WHERE ts.is_active = true
), current_active_assignments AS (
  SELECT pts.player_id, cts.team_id, pts.shirt_number, pts.position_de, pts.position_en, pts.is_captain, pts.sort_order
  FROM public.player_team_seasons AS pts
  JOIN current_team_seasons AS cts ON cts.id = pts.team_season_id
  WHERE pts.is_active = true
), assignment_counts AS (
  SELECT player_id, COUNT(*) AS active_count FROM current_active_assignments GROUP BY player_id
), current_assignment AS (
  SELECT DISTINCT ON (caa.player_id)
    caa.player_id, caa.team_id, caa.shirt_number, caa.position_de, caa.position_en, caa.is_captain, caa.sort_order
  FROM current_active_assignments AS caa
  ORDER BY caa.player_id
), comparisons AS (
  SELECT
    p.id AS player_id, COALESCE(ac.active_count, 0) AS active_count, p.team_id, p.shirt_number, p.jersey_number,
    p.position, p.position_de, p.position_en, p.is_captain, p.sort_order,
    ca.team_id AS current_team_id, ca.shirt_number AS current_shirt_number, ca.position_de AS current_position_de,
    ca.position_en AS current_position_en, ca.is_captain AS current_is_captain, ca.sort_order AS current_sort_order
  FROM public.players AS p
  LEFT JOIN assignment_counts AS ac ON ac.player_id = p.id
  LEFT JOIN current_assignment AS ca ON ca.player_id = p.id
), classified AS (
  SELECT 'team_id' AS legacy_field, CASE
    WHEN active_count > 1 THEN 'MULTI_ASSIGNMENT_NOT_COMPARABLE'
    WHEN active_count = 0 THEN 'NO_CURRENT_ASSIGNMENT'
    WHEN team_id IS NULL AND current_team_id IS NOT NULL THEN 'ASSIGNMENT_ONLY'
    WHEN team_id IS NOT NULL AND current_team_id IS NULL THEN 'LEGACY_ONLY'
    WHEN team_id IS NOT DISTINCT FROM current_team_id THEN 'MATCH' ELSE 'CONFLICT' END AS comparison_status FROM comparisons
  UNION ALL
  SELECT 'shirt_number', CASE
    WHEN active_count > 1 THEN 'MULTI_ASSIGNMENT_NOT_COMPARABLE'
    WHEN active_count = 0 THEN 'NO_CURRENT_ASSIGNMENT'
    WHEN shirt_number IS NULL AND current_shirt_number IS NOT NULL THEN 'ASSIGNMENT_ONLY'
    WHEN shirt_number IS NOT NULL AND current_shirt_number IS NULL THEN 'LEGACY_ONLY'
    WHEN shirt_number IS NOT DISTINCT FROM current_shirt_number THEN 'MATCH' ELSE 'CONFLICT' END FROM comparisons
  UNION ALL
  SELECT 'jersey_number', CASE
    WHEN active_count > 1 THEN 'MULTI_ASSIGNMENT_NOT_COMPARABLE'
    WHEN active_count = 0 THEN 'NO_CURRENT_ASSIGNMENT'
    WHEN jersey_number IS NULL AND current_shirt_number IS NOT NULL THEN 'ASSIGNMENT_ONLY'
    WHEN jersey_number IS NOT NULL AND current_shirt_number IS NULL THEN 'LEGACY_ONLY'
    WHEN jersey_number IS NOT DISTINCT FROM current_shirt_number THEN 'MATCH' ELSE 'CONFLICT' END FROM comparisons
  UNION ALL
  SELECT 'position', CASE
    WHEN active_count > 1 THEN 'MULTI_ASSIGNMENT_NOT_COMPARABLE'
    WHEN active_count = 0 THEN 'NO_CURRENT_ASSIGNMENT'
    WHEN NULLIF(btrim(position), '') IS NULL AND COALESCE(NULLIF(btrim(current_position_de), ''), NULLIF(btrim(current_position_en), '')) IS NOT NULL THEN 'ASSIGNMENT_ONLY'
    WHEN NULLIF(btrim(position), '') IS NOT NULL AND COALESCE(NULLIF(btrim(current_position_de), ''), NULLIF(btrim(current_position_en), '')) IS NULL THEN 'LEGACY_ONLY'
    WHEN NULLIF(btrim(position), '') IS NOT DISTINCT FROM COALESCE(NULLIF(btrim(current_position_de), ''), NULLIF(btrim(current_position_en), '')) THEN 'MATCH'
    ELSE 'CONFLICT' END FROM comparisons
  UNION ALL
  SELECT 'position_de', CASE
    WHEN active_count > 1 THEN 'MULTI_ASSIGNMENT_NOT_COMPARABLE'
    WHEN active_count = 0 THEN 'NO_CURRENT_ASSIGNMENT'
    WHEN NULLIF(btrim(position_de), '') IS NULL AND NULLIF(btrim(current_position_de), '') IS NOT NULL THEN 'ASSIGNMENT_ONLY'
    WHEN NULLIF(btrim(position_de), '') IS NOT NULL AND NULLIF(btrim(current_position_de), '') IS NULL THEN 'LEGACY_ONLY'
    WHEN NULLIF(btrim(position_de), '') IS NOT DISTINCT FROM NULLIF(btrim(current_position_de), '') THEN 'MATCH' ELSE 'CONFLICT' END FROM comparisons
  UNION ALL
  SELECT 'position_en', CASE
    WHEN active_count > 1 THEN 'MULTI_ASSIGNMENT_NOT_COMPARABLE'
    WHEN active_count = 0 THEN 'NO_CURRENT_ASSIGNMENT'
    WHEN NULLIF(btrim(position_en), '') IS NULL AND NULLIF(btrim(current_position_en), '') IS NOT NULL THEN 'ASSIGNMENT_ONLY'
    WHEN NULLIF(btrim(position_en), '') IS NOT NULL AND NULLIF(btrim(current_position_en), '') IS NULL THEN 'LEGACY_ONLY'
    WHEN NULLIF(btrim(position_en), '') IS NOT DISTINCT FROM NULLIF(btrim(current_position_en), '') THEN 'MATCH' ELSE 'CONFLICT' END FROM comparisons
  UNION ALL
  SELECT 'is_captain', CASE
    WHEN active_count > 1 THEN 'MULTI_ASSIGNMENT_NOT_COMPARABLE'
    WHEN active_count = 0 THEN 'NO_CURRENT_ASSIGNMENT'
    WHEN is_captain IS NOT DISTINCT FROM current_is_captain THEN 'MATCH' ELSE 'CONFLICT' END FROM comparisons
  UNION ALL
  SELECT 'sort_order', CASE
    WHEN active_count > 1 THEN 'MULTI_ASSIGNMENT_NOT_COMPARABLE'
    WHEN active_count = 0 THEN 'NO_CURRENT_ASSIGNMENT'
    WHEN sort_order IS NULL AND current_sort_order IS NOT NULL THEN 'ASSIGNMENT_ONLY'
    WHEN sort_order IS NOT NULL AND current_sort_order IS NULL THEN 'LEGACY_ONLY'
    WHEN sort_order IS NOT DISTINCT FROM current_sort_order THEN 'MATCH' ELSE 'CONFLICT' END FROM comparisons
)
SELECT legacy_field, comparison_status, COUNT(*) AS row_count
FROM classified
GROUP BY legacy_field, comparison_status
ORDER BY legacy_field, comparison_status;

-- 8) Potential data-loss summary.
WITH current_seasons AS (
  SELECT id FROM public.seasons WHERE is_current = true
), current_team_seasons AS (
  SELECT ts.id
  FROM public.team_seasons AS ts
  JOIN current_seasons AS cs ON cs.id = ts.season_id
  WHERE ts.is_active = true
), current_assignment_counts AS (
  SELECT pts.player_id, COUNT(*) AS active_count
  FROM public.player_team_seasons AS pts
  JOIN current_team_seasons AS cts ON cts.id = pts.team_season_id
  WHERE pts.is_active = true
  GROUP BY pts.player_id
)
SELECT
  COUNT(*) FILTER (WHERE p.team_id IS NOT NULL AND COALESCE(cac.active_count, 0) <> 1) AS team_id_potential_loss_count,
  COUNT(*) FILTER (WHERE p.shirt_number IS NOT NULL AND COALESCE(cac.active_count, 0) <> 1) AS shirt_number_potential_loss_count,
  COUNT(*) FILTER (WHERE p.jersey_number IS NOT NULL AND COALESCE(cac.active_count, 0) <> 1) AS jersey_number_potential_loss_count,
  COUNT(*) FILTER (WHERE NULLIF(btrim(p.position), '') IS NOT NULL AND COALESCE(cac.active_count, 0) <> 1) AS position_potential_loss_count,
  COUNT(*) FILTER (WHERE NULLIF(btrim(p.position_de), '') IS NOT NULL AND COALESCE(cac.active_count, 0) <> 1) AS position_de_potential_loss_count,
  COUNT(*) FILTER (WHERE NULLIF(btrim(p.position_en), '') IS NOT NULL AND COALESCE(cac.active_count, 0) <> 1) AS position_en_potential_loss_count,
  COUNT(*) FILTER (WHERE p.is_captain IS NOT NULL AND COALESCE(cac.active_count, 0) <> 1) AS is_captain_potential_loss_count,
  COUNT(*) FILTER (WHERE p.sort_order IS NOT NULL AND COALESCE(cac.active_count, 0) <> 1) AS sort_order_potential_loss_count
FROM public.players AS p
LEFT JOIN current_assignment_counts AS cac ON cac.player_id = p.id;
