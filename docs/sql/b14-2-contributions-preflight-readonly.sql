-- B14.2 contributions preflight
-- Read only. Only SELECT and WITH ... SELECT.

-- 1) Existing tables with similar purpose.
SELECT schemaname, tablename
FROM pg_tables
WHERE schemaname IN ('public', 'storage')
  AND (
    tablename ILIKE '%contribution%'
    OR tablename ILIKE '%payment%'
    OR tablename ILIKE '%finance%'
    OR tablename ILIKE '%member%fee%'
  )
ORDER BY schemaname, tablename;

-- 2) Explicit table existence check.
SELECT target.table_name, (to_regclass('public.' || target.table_name) IS NOT NULL) AS exists_in_public
FROM (
  VALUES
    ('player_contributions'),
    ('player_contribution_payments'),
    ('membership_contributions'),
    ('membership_contribution_payments')
) AS target(table_name)
ORDER BY target.table_name;

-- 3) Existing columns from old or similar contribution models.
SELECT c.table_schema, c.table_name, c.column_name, c.data_type, c.is_nullable, c.column_default
FROM information_schema.columns AS c
WHERE c.table_schema = 'public'
  AND (
    c.table_name IN ('player_contributions', 'player_contribution_payments', 'membership_contributions', 'membership_contribution_payments')
    OR c.column_name IN ('coach_id', 'team_id', 'season_key', 'contribution_key', 'amount_due', 'amount_paid')
  )
ORDER BY c.table_name, c.ordinal_position;

-- 4) Current structure of players.
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'players'
ORDER BY ordinal_position;

-- 5) Current structure of seasons.
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'seasons'
ORDER BY ordinal_position;

-- 6) Current structure of admin_profiles.
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'admin_profiles'
ORDER BY ordinal_position;

-- 7) Current structure of admin_roles.
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'admin_roles'
ORDER BY ordinal_position;

-- 8) Current structure of admin_permissions.
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'admin_permissions'
ORDER BY ordinal_position;

-- 9) Current structure of admin_role_permissions.
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'admin_role_permissions'
ORDER BY ordinal_position;

-- 10) Existing contribution/payment permissions.
SELECT p.key, p.name, p.category
FROM public.admin_permissions AS p
WHERE p.key ILIKE 'contributions.%'
   OR p.key ILIKE '%payment%'
   OR p.key ILIKE 'finance.%'
ORDER BY p.key;

-- 11) Existing treasurer-like roles.
SELECT r.key, r.name, r.is_active
FROM public.admin_roles AS r
WHERE r.key IN ('kassierer', 'kassenwart', 'treasurer')
   OR r.name ILIKE '%Kass%'
   OR r.name ILIKE '%Treasur%'
ORDER BY r.sort_order, r.key;

-- 12) Existing updated_at trigger helpers and table triggers.
SELECT
  'FUNCTION' AS object_type,
  p.proname AS object_name,
  pg_get_function_identity_arguments(p.oid) AS details
FROM pg_proc AS p
JOIN pg_namespace AS n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.prokind IN ('f', 'p')
  AND p.proname ILIKE '%updated_at%'
UNION ALL
SELECT
  'TRIGGER',
  t.tgname,
  c.relname
FROM pg_trigger AS t
JOIN pg_class AS c ON c.oid = t.tgrelid
JOIN pg_namespace AS n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND NOT t.tgisinternal
  AND t.tgname ILIKE '%updated_at%'
ORDER BY object_type, object_name;

-- 13) Audit-column convention snapshot on similar admin/runtime tables.
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('players', 'seasons', 'admin_profiles', 'admin_roles', 'admin_permissions', 'membership_requests', 'membership_request_recipients')
  AND column_name IN ('created_at', 'updated_at', 'created_by', 'updated_by', 'processed_at', 'processed_by')
ORDER BY table_name, column_name;

-- 14) Status and check-constraint conventions.
SELECT con.conname, cls.relname AS table_name, pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint AS con
JOIN pg_class AS cls ON cls.oid = con.conrelid
JOIN pg_namespace AS ns ON ns.oid = cls.relnamespace
WHERE ns.nspname = 'public'
  AND con.contype = 'c'
  AND (
    con.conname ILIKE '%status%'
    OR pg_get_constraintdef(con.oid) ILIKE '%status%'
    OR pg_get_constraintdef(con.oid) ILIKE '%amount_%'
  )
ORDER BY table_name, con.conname;

-- 15) RLS status of similar sensitive admin tables.
SELECT schemaname, tablename, policyname, command, roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('admin_profiles', 'admin_roles', 'admin_permissions', 'admin_role_permissions', 'admin_user_roles', 'membership_requests', 'membership_request_recipients')
ORDER BY tablename, policyname;

-- 16) Views and routines with contribution/payment references.
WITH target_patterns AS (
  SELECT unnest(ARRAY['player_contributions', 'player_contribution_payments', 'membership_contributions', 'membership_contribution_payments', 'contributions.view', 'contributions.edit']) AS pattern
), eligible_routines AS MATERIALIZED (
  SELECT p.oid, n.nspname AS schema_name, p.proname AS routine_name
  FROM pg_proc AS p
  JOIN pg_namespace AS n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.prokind IN ('f', 'p')
), routine_definitions AS (
  SELECT er.oid, er.schema_name, er.routine_name, pg_get_functiondef(er.oid) AS routine_definition
  FROM eligible_routines AS er
)
SELECT 'VIEW' AS object_type, v.schemaname AS object_schema, v.viewname AS object_name, tp.pattern AS matched_pattern
FROM pg_views AS v
JOIN target_patterns AS tp ON v.definition ILIKE '%' || tp.pattern || '%'
WHERE v.schemaname = 'public'
UNION ALL
SELECT 'ROUTINE', rd.schema_name, rd.routine_name, tp.pattern
FROM routine_definitions AS rd
JOIN target_patterns AS tp ON rd.routine_definition ILIKE '%' || tp.pattern || '%'
ORDER BY object_type, object_schema, object_name, matched_pattern;

-- 17) Name conflicts for proposed tables, constraints, indexes, triggers and functions.
WITH proposed_names AS (
  SELECT unnest(ARRAY[
    'player_contributions', 'player_contribution_payments', 'player_contributions_regular_unique',
    'idx_player_contributions_player_season', 'idx_player_contributions_status_due_date', 'idx_player_contributions_contribution_key',
    'idx_player_contribution_payments_contribution_id', 'idx_player_contribution_payments_paid_at',
    'idx_player_contribution_payments_status_contribution',
    'trg_player_contributions_set_updated_at', 'trg_player_contribution_payments_set_updated_at',
    'trg_player_contribution_payments_sync_parent', 'sync_player_contribution_payment_cache'
  ]) AS object_name
)
SELECT 'RELATION_OR_INDEX' AS conflict_type, pn.object_name
FROM proposed_names AS pn
JOIN pg_class AS c ON c.relname = pn.object_name
UNION ALL
SELECT 'CONSTRAINT', pn.object_name
FROM proposed_names AS pn
JOIN pg_constraint AS con ON con.conname = pn.object_name
UNION ALL
SELECT 'TRIGGER', pn.object_name
FROM proposed_names AS pn
JOIN pg_trigger AS t ON t.tgname = pn.object_name
UNION ALL
SELECT 'FUNCTION', pn.object_name
FROM proposed_names AS pn
JOIN pg_proc AS p ON p.proname = pn.object_name
ORDER BY conflict_type, object_name;

-- 18) Season count and current-season summary.
SELECT
  COUNT(*) AS season_count,
  COUNT(*) FILTER (WHERE is_current = true) AS current_season_count,
  COUNT(*) FILTER (WHERE is_active = true) AS active_season_count
FROM public.seasons;

-- 19) Player count.
SELECT
  COUNT(*) AS player_count,
  COUNT(*) FILTER (WHERE is_active = true) AS active_player_count,
  COUNT(*) FILTER (WHERE is_active = false) AS inactive_player_count
FROM public.players;

-- 20) Players without an active current-season assignment.
WITH current_team_seasons AS (
  SELECT ts.id
  FROM public.team_seasons AS ts
  JOIN public.seasons AS s ON s.id = ts.season_id
  WHERE s.is_current = true
    AND ts.is_active = true
)
SELECT COUNT(*) AS players_without_active_current_assignment
FROM public.players AS p
WHERE NOT EXISTS (
  SELECT 1
  FROM public.player_team_seasons AS pts
  JOIN current_team_seasons AS cts ON cts.id = pts.team_season_id
  WHERE pts.player_id = p.id
    AND pts.is_active = true
);

-- 21) Players with multiple active current-season assignments.
WITH current_team_seasons AS (
  SELECT ts.id
  FROM public.team_seasons AS ts
  JOIN public.seasons AS s ON s.id = ts.season_id
  WHERE s.is_current = true
    AND ts.is_active = true
)
SELECT COUNT(*) AS players_with_multiple_active_current_assignments
FROM (
  SELECT pts.player_id
  FROM public.player_team_seasons AS pts
  JOIN current_team_seasons AS cts ON cts.id = pts.team_season_id
  WHERE pts.is_active = true
  GROUP BY pts.player_id
  HAVING COUNT(*) > 1
) AS duplicates;

-- 22) Possible existing contribution test data by estimated rows.
SELECT c.relname AS table_name, c.reltuples::bigint AS estimated_rows
FROM pg_class AS c
JOIN pg_namespace AS n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('player_contributions', 'player_contribution_payments', 'membership_contributions', 'membership_contribution_payments')
ORDER BY c.relname;

-- 23) Storage buckets with contribution-like naming.
SELECT id, name, public
FROM storage.buckets
WHERE name ILIKE '%contribution%'
   OR name ILIKE '%payment%'
   OR name ILIKE '%finance%'
ORDER BY name;

-- 24) Companion runtime check marker for CSV/export helpers in code.
SELECT
  'CODE_REVIEW_REQUIRED' AS check_type,
  'Inspect src for CSV/export helpers; not derivable from live SQL catalog alone.' AS note;
