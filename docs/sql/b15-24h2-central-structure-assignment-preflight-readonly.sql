-- B15.24H2 - Central structure and assignment model
-- READ-ONLY live preflight. Run manually in the Supabase SQL editor.
-- This script returns schema metadata and anonymized aggregate counts only.

-- H2CS.01 Relevant relations and RLS state.
SELECT
  n.nspname AS schema_name,
  c.relname AS relation_name,
  c.relkind AS relation_kind,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS force_rls_enabled,
  pg_get_userbyid(c.relowner) AS owner_name
FROM pg_catalog.pg_class AS c
JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN (
    'departments',
    'players',
    'coaches',
    'teams',
    'board_members',
    'board_roles',
    'seasons',
    'team_seasons',
    'player_team_seasons',
    'coach_team_seasons'
  )
ORDER BY c.relname;

-- H2CS.02 Exact relevant columns, including every department/scope/state-like field.
SELECT
  cols.table_name,
  cols.ordinal_position,
  cols.column_name,
  cols.data_type,
  cols.udt_name,
  cols.is_nullable,
  cols.column_default,
  cols.is_identity,
  cols.is_generated
FROM information_schema.columns AS cols
WHERE cols.table_schema = 'public'
  AND cols.table_name IN (
    'departments',
    'players',
    'coaches',
    'teams',
    'board_members',
    'board_roles',
    'seasons',
    'team_seasons',
    'player_team_seasons',
    'coach_team_seasons'
  )
ORDER BY cols.table_name, cols.ordinal_position;

-- H2CS.03 Constraints and referenced relations.
SELECT
  n.nspname AS schema_name,
  tbl.relname AS table_name,
  con.conname AS constraint_name,
  con.contype AS constraint_type,
  ref_ns.nspname AS referenced_schema,
  ref_tbl.relname AS referenced_table,
  pg_get_constraintdef(con.oid, true) AS constraint_definition
FROM pg_catalog.pg_constraint AS con
JOIN pg_catalog.pg_class AS tbl ON tbl.oid = con.conrelid
JOIN pg_catalog.pg_namespace AS n ON n.oid = tbl.relnamespace
LEFT JOIN pg_catalog.pg_class AS ref_tbl ON ref_tbl.oid = con.confrelid
LEFT JOIN pg_catalog.pg_namespace AS ref_ns ON ref_ns.oid = ref_tbl.relnamespace
WHERE n.nspname = 'public'
  AND tbl.relname IN (
    'departments', 'players', 'coaches', 'teams', 'board_members',
    'board_roles', 'team_seasons', 'player_team_seasons',
    'coach_team_seasons'
  )
ORDER BY tbl.relname, con.conname;

-- H2CS.04 Existing indexes and indexed expressions/columns.
SELECT
  schemaname AS schema_name,
  tablename AS table_name,
  indexname AS index_name,
  indexdef AS index_definition
FROM pg_catalog.pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'players', 'coaches', 'teams', 'board_members', 'board_roles',
    'team_seasons', 'player_team_seasons', 'coach_team_seasons'
  )
ORDER BY tablename, indexname;

-- H2CS.05 RLS policies. Expressions are metadata only.
SELECT
  schemaname AS schema_name,
  tablename AS table_name,
  policyname AS policy_name,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_catalog.pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'players', 'coaches', 'teams', 'board_members', 'board_roles',
    'team_seasons', 'player_team_seasons', 'coach_team_seasons'
  )
ORDER BY tablename, policyname;

-- H2CS.06 Effective table privileges for browser roles and service_role.
SELECT
  table_name,
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN (
    'players', 'coaches', 'teams', 'board_members', 'board_roles',
    'team_seasons', 'player_team_seasons', 'coach_team_seasons'
  )
  AND grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY table_name, grantee, privilege_type;

-- H2CS.07 Active departments. No person data is returned.
SELECT
  id,
  slug,
  name_de,
  is_active
FROM public.departments
ORDER BY slug, id;

-- H2CS.08 Current-season resolution used by the application.
SELECT
  COUNT(*) FILTER (WHERE is_active = true) AS active_season_count,
  COUNT(*) FILTER (WHERE is_active = true AND is_current = true) AS active_current_season_count,
  (array_agg(id ORDER BY id) FILTER (WHERE is_active = true AND is_current = true))[1] AS first_current_season_id
FROM public.seasons;

-- H2CS.09 Player organizational-state inventory derived from active current-season relations.
WITH current_seasons AS MATERIALIZED (
  SELECT id
  FROM public.seasons
  WHERE is_active = true
    AND is_current = true
),
player_departments AS MATERIALIZED (
  SELECT
    p.id AS player_id,
    COUNT(DISTINCT t.department_id) FILTER (WHERE t.department_id IS NOT NULL) AS department_count,
    COUNT(DISTINCT pts.id) FILTER (
      WHERE pts.is_active = true
        AND ts.is_active = true
        AND t.is_active = true
    ) AS active_assignment_count,
    COUNT(DISTINCT t.department_id) FILTER (
      WHERE pts.is_active = true
        AND ts.is_active = true
        AND t.is_active = true
        AND t.department_id IS NOT NULL
    ) AS active_department_count
  FROM public.players AS p
  LEFT JOIN public.player_team_seasons AS pts
    ON pts.player_id = p.id
   AND pts.is_active = true
  LEFT JOIN public.team_seasons AS ts
    ON ts.id = pts.team_season_id
   AND ts.is_active = true
   AND ts.season_id IN (SELECT id FROM current_seasons)
  LEFT JOIN public.teams AS t
    ON t.id = ts.team_id
   AND t.is_active = true
  GROUP BY p.id
)
SELECT
  COUNT(*) AS player_count,
  COUNT(*) FILTER (WHERE active_department_count = 0) AS unassigned_player_count,
  COUNT(*) FILTER (WHERE active_department_count = 1) AS single_department_player_count,
  COUNT(*) FILTER (WHERE active_department_count > 1) AS multi_department_player_count,
  COUNT(*) FILTER (WHERE active_assignment_count > 1) AS multi_team_player_count
FROM player_departments;

-- H2CS.10 Player department distribution, anonymized.
WITH current_seasons AS MATERIALIZED (
  SELECT id FROM public.seasons WHERE is_active = true AND is_current = true
),
derived AS MATERIALIZED (
  SELECT DISTINCT p.id AS player_id, d.slug AS department_slug
  FROM public.players AS p
  LEFT JOIN public.player_team_seasons AS pts
    ON pts.player_id = p.id
   AND pts.is_active = true
  LEFT JOIN public.team_seasons AS ts
    ON ts.id = pts.team_season_id
   AND ts.is_active = true
   AND ts.season_id IN (SELECT id FROM current_seasons)
  LEFT JOIN public.teams AS t
    ON t.id = ts.team_id
   AND t.is_active = true
  LEFT JOIN public.departments AS d ON d.id = t.department_id
),
classified AS MATERIALIZED (
  SELECT
    player_id,
    COUNT(department_slug) AS department_count,
    array_agg(department_slug ORDER BY department_slug) FILTER (WHERE department_slug IS NOT NULL) AS department_slugs
  FROM derived
  GROUP BY player_id
)
SELECT
  COALESCE(department_slug, 'unassigned') AS derived_department,
  COUNT(*) AS player_count
FROM classified
LEFT JOIN LATERAL unnest(classified.department_slugs) AS expanded(department_slug) ON true
GROUP BY COALESCE(department_slug, 'unassigned')
ORDER BY derived_department;

-- H2CS.11 Coach organizational-state inventory derived from active current-season relations.
WITH current_seasons AS MATERIALIZED (
  SELECT id
  FROM public.seasons
  WHERE is_active = true
    AND is_current = true
),
coach_departments AS MATERIALIZED (
  SELECT
    c.id AS coach_id,
    COUNT(DISTINCT cts.id) FILTER (
      WHERE cts.is_active = true
        AND ts.is_active = true
        AND t.is_active = true
    ) AS active_assignment_count,
    COUNT(DISTINCT t.department_id) FILTER (
      WHERE cts.is_active = true
        AND ts.is_active = true
        AND t.is_active = true
        AND t.department_id IS NOT NULL
    ) AS active_department_count
  FROM public.coaches AS c
  LEFT JOIN public.coach_team_seasons AS cts
    ON cts.coach_id = c.id
   AND cts.is_active = true
  LEFT JOIN public.team_seasons AS ts
    ON ts.id = cts.team_season_id
   AND ts.is_active = true
   AND ts.season_id IN (SELECT id FROM current_seasons)
  LEFT JOIN public.teams AS t
    ON t.id = ts.team_id
   AND t.is_active = true
  GROUP BY c.id
)
SELECT
  COUNT(*) AS coach_count,
  COUNT(*) FILTER (WHERE active_department_count = 0) AS unassigned_coach_count,
  COUNT(*) FILTER (WHERE active_department_count = 1) AS single_department_coach_count,
  COUNT(*) FILTER (WHERE active_department_count > 1) AS multi_department_coach_count,
  COUNT(*) FILTER (WHERE active_assignment_count > 1) AS multi_team_coach_count
FROM coach_departments;

-- H2CS.12 Coach department distribution, anonymized.
WITH current_seasons AS MATERIALIZED (
  SELECT id FROM public.seasons WHERE is_active = true AND is_current = true
),
derived AS MATERIALIZED (
  SELECT DISTINCT c.id AS coach_id, d.slug AS department_slug
  FROM public.coaches AS c
  LEFT JOIN public.coach_team_seasons AS cts
    ON cts.coach_id = c.id
   AND cts.is_active = true
  LEFT JOIN public.team_seasons AS ts
    ON ts.id = cts.team_season_id
   AND ts.is_active = true
   AND ts.season_id IN (SELECT id FROM current_seasons)
  LEFT JOIN public.teams AS t
    ON t.id = ts.team_id
   AND t.is_active = true
  LEFT JOIN public.departments AS d ON d.id = t.department_id
),
classified AS MATERIALIZED (
  SELECT
    coach_id,
    COUNT(department_slug) AS department_count,
    array_agg(department_slug ORDER BY department_slug) FILTER (WHERE department_slug IS NOT NULL) AS department_slugs
  FROM derived
  GROUP BY coach_id
)
SELECT
  COALESCE(department_slug, 'unassigned') AS derived_department,
  COUNT(*) AS coach_count
FROM classified
LEFT JOIN LATERAL unnest(classified.department_slugs) AS expanded(department_slug) ON true
GROUP BY COALESCE(department_slug, 'unassigned')
ORDER BY derived_department;

-- H2CS.13 Team direct-department state.
SELECT
  COALESCE(d.slug, 'unassigned') AS department_state,
  COUNT(*) AS team_count,
  COUNT(*) FILTER (WHERE t.is_active = true) AS active_team_count,
  COUNT(*) FILTER (WHERE t.is_active = false) AS inactive_team_count
FROM public.teams AS t
LEFT JOIN public.departments AS d ON d.id = t.department_id
GROUP BY COALESCE(d.slug, 'unassigned')
ORDER BY department_state;

-- H2CS.14 Board direct-department state. NULL is reported as the existing club state.
SELECT
  CASE WHEN bm.department_id IS NULL THEN 'club' ELSE COALESCE(d.slug, 'unknown_department') END AS board_scope_state,
  COUNT(*) AS board_member_count,
  COUNT(*) FILTER (WHERE bm.is_active = true) AS active_board_member_count,
  COUNT(*) FILTER (WHERE bm.is_active = false) AS inactive_board_member_count
FROM public.board_members AS bm
LEFT JOIN public.departments AS d ON d.id = bm.department_id
GROUP BY CASE WHEN bm.department_id IS NULL THEN 'club' ELSE COALESCE(d.slug, 'unknown_department') END
ORDER BY board_scope_state;

-- H2CS.15 Board-role classification. Role slugs are structural metadata, not person data.
SELECT
  CASE WHEN br.department_id IS NULL THEN 'shared_or_club' ELSE COALESCE(d.slug, 'unknown_department') END AS role_scope_state,
  br.is_active,
  COUNT(*) AS role_count,
  array_agg(br.slug ORDER BY br.sort_order NULLS LAST, br.slug) AS role_slugs
FROM public.board_roles AS br
LEFT JOIN public.departments AS d ON d.id = br.department_id
GROUP BY
  CASE WHEN br.department_id IS NULL THEN 'shared_or_club' ELSE COALESCE(d.slug, 'unknown_department') END,
  br.is_active
ORDER BY role_scope_state, br.is_active DESC;

-- H2CS.16 Assignment integrity and cross-department facts available before direct person departments exist.
SELECT
  'player_team_seasons' AS relation_name,
  COUNT(*) AS total_rows,
  COUNT(*) FILTER (WHERE rel.is_active = true) AS active_rows,
  COUNT(*) FILTER (WHERE ts.id IS NULL) AS missing_team_season_rows,
  COUNT(*) FILTER (WHERE t.id IS NULL) AS missing_team_rows,
  COUNT(*) FILTER (WHERE rel.is_active = true AND t.department_id IS NULL) AS active_rows_to_unassigned_team
FROM public.player_team_seasons AS rel
LEFT JOIN public.team_seasons AS ts ON ts.id = rel.team_season_id
LEFT JOIN public.teams AS t ON t.id = ts.team_id
UNION ALL
SELECT
  'coach_team_seasons' AS relation_name,
  COUNT(*) AS total_rows,
  COUNT(*) FILTER (WHERE rel.is_active = true) AS active_rows,
  COUNT(*) FILTER (WHERE ts.id IS NULL) AS missing_team_season_rows,
  COUNT(*) FILTER (WHERE t.id IS NULL) AS missing_team_rows,
  COUNT(*) FILTER (WHERE rel.is_active = true AND t.department_id IS NULL) AS active_rows_to_unassigned_team
FROM public.coach_team_seasons AS rel
LEFT JOIN public.team_seasons AS ts ON ts.id = rel.team_season_id
LEFT JOIN public.teams AS t ON t.id = ts.team_id
ORDER BY relation_name;

-- H2CS.17 Existing triggers on the affected master and relation tables.
SELECT
  event_object_table AS table_name,
  trigger_name,
  event_manipulation,
  action_timing,
  action_orientation,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table IN (
    'players', 'coaches', 'teams', 'board_members', 'board_roles',
    'team_seasons', 'player_team_seasons', 'coach_team_seasons'
  )
ORDER BY event_object_table, trigger_name, event_manipulation;
