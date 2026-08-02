-- B14.2 contributions postcheck
-- Read only. Run only after a later approved schema and permission step.

-- 1) Target tables exist.
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('player_contributions', 'player_contribution_payments')
ORDER BY table_name;

-- 2) Target column structure.
SELECT table_name, column_name, data_type, is_nullable, column_default, is_generated, generation_expression
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('player_contributions', 'player_contribution_payments')
ORDER BY table_name, ordinal_position;

-- 3) Constraints and foreign keys.
SELECT cls.relname AS table_name, con.conname AS constraint_name, con.contype, pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint AS con
JOIN pg_class AS cls ON cls.oid = con.conrelid
JOIN pg_namespace AS ns ON ns.oid = cls.relnamespace
WHERE ns.nspname = 'public'
  AND cls.relname IN ('player_contributions', 'player_contribution_payments')
ORDER BY table_name, constraint_name;

-- 4) Indexes.
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('player_contributions', 'player_contribution_payments')
ORDER BY tablename, indexname;

-- 5) Triggers.
SELECT c.relname AS table_name, t.tgname AS trigger_name, pg_get_triggerdef(t.oid, true) AS trigger_definition
FROM pg_trigger AS t
JOIN pg_class AS c ON c.oid = t.tgrelid
JOIN pg_namespace AS n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('player_contributions', 'player_contribution_payments')
  AND NOT t.tgisinternal
ORDER BY table_name, trigger_name;

-- 6) Permissions and role mappings.
SELECT p.key AS permission_key, r.key AS role_key
FROM public.admin_permissions AS p
LEFT JOIN public.admin_role_permissions AS rp ON rp.permission_id = p.id
LEFT JOIN public.admin_roles AS r ON r.id = rp.role_id
WHERE p.key ILIKE 'contributions.%'
ORDER BY p.key, r.key;

-- 7) Guard against unexpected coach or team foreign-key columns.
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('player_contributions', 'player_contribution_payments')
  AND column_name IN ('coach_id', 'team_id', 'team_season_id');

-- 8) Team snapshot decision check.
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'player_contributions'
  AND column_name = 'team_snapshot_name';

-- 9) Status values encoded in constraints.
SELECT con.conname, pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint AS con
JOIN pg_class AS cls ON cls.oid = con.conrelid
JOIN pg_namespace AS ns ON ns.oid = cls.relnamespace
WHERE ns.nspname = 'public'
  AND cls.relname IN ('player_contributions', 'player_contribution_payments')
  AND con.contype = 'c'
  AND (con.conname ILIKE '%status%' OR pg_get_constraintdef(con.oid) ILIKE '%status%')
ORDER BY cls.relname, con.conname;

-- 10) No unexpected seed or test rows after schema-only rollout.
SELECT 'player_contributions' AS table_name, COUNT(*) AS row_count FROM public.player_contributions
UNION ALL
SELECT 'player_contribution_payments', COUNT(*) FROM public.player_contribution_payments
ORDER BY table_name;
