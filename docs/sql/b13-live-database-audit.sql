-- B13.2 Live-Datenbankinventur (Read-Only)
-- Nur SELECT-Abfragen. Keine mutierenden Statements.

-- ============================================================================
-- 01) Tabelleninventur (public, auth, storage)
-- ============================================================================
WITH base_tables AS (
  SELECT
    n.nspname AS schema_name,
    c.relname AS table_name,
    CASE c.relkind
      WHEN 'r' THEN 'BASE TABLE'
      WHEN 'p' THEN 'PARTITIONED TABLE'
      WHEN 'f' THEN 'FOREIGN TABLE'
      ELSE c.relkind::text
    END AS table_type,
    c.oid AS table_oid,
    c.reltuples AS estimated_rows,
    c.relrowsecurity AS rls_enabled,
    c.relforcerowsecurity AS rls_forced
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname IN ('public', 'auth', 'storage')
    AND c.relkind IN ('r', 'p', 'f')
)
SELECT
  bt.schema_name,
  bt.table_name,
  bt.table_type,
  CASE WHEN bt.rls_enabled THEN 'yes' ELSE 'no' END AS rls_enabled,
  CASE WHEN bt.rls_forced THEN 'yes' ELSE 'no' END AS rls_forced,
  COALESCE(bt.estimated_rows, 0)::bigint AS estimated_rows,
  pg_size_pretty(pg_table_size(bt.table_oid)) AS table_size,
  pg_size_pretty(pg_indexes_size(bt.table_oid)) AS index_size,
  pg_size_pretty(pg_total_relation_size(bt.table_oid)) AS total_size
FROM base_tables bt
ORDER BY bt.schema_name, bt.table_name;

-- ============================================================================
-- 02) Spalteninventur (nur public)
-- ============================================================================
SELECT
  c.table_name,
  c.ordinal_position,
  c.column_name,
  c.data_type,
  c.udt_name,
  c.is_nullable,
  c.column_default AS default_value,
  c.is_identity AS identity,
  c.is_generated AS generated,
  c.character_maximum_length,
  c.numeric_precision,
  c.numeric_scale
FROM information_schema.columns c
WHERE c.table_schema = 'public'
ORDER BY c.table_name, c.ordinal_position;

-- ============================================================================
-- 03) Constraints (nur public)
-- ============================================================================
SELECT
  n.nspname AS schema_name,
  cls.relname AS table_name,
  con.conname AS constraint_name,
  CASE con.contype
    WHEN 'p' THEN 'PRIMARY KEY'
    WHEN 'f' THEN 'FOREIGN KEY'
    WHEN 'u' THEN 'UNIQUE'
    WHEN 'c' THEN 'CHECK'
    WHEN 'x' THEN 'EXCLUDE'
    ELSE con.contype::text
  END AS constraint_type,
  pg_get_constraintdef(con.oid, true) AS constraint_definition
FROM pg_constraint con
JOIN pg_class cls ON cls.oid = con.conrelid
JOIN pg_namespace n ON n.oid = cls.relnamespace
WHERE n.nspname = 'public'
  AND con.contype IN ('p', 'f', 'u', 'c', 'x')
ORDER BY cls.relname, con.conname;

-- ============================================================================
-- 04) Foreign Keys (mehrspaltig korrekt aufgeloest, nur public)
-- ============================================================================
SELECT
  src_ns.nspname AS source_schema,
  src_tbl.relname AS source_table,
  src_col.attname AS source_column,
  con.conname AS constraint_name,
  tgt_ns.nspname AS target_schema,
  tgt_tbl.relname AS target_table,
  tgt_col.attname AS target_column,
  CASE con.confupdtype
    WHEN 'a' THEN 'NO ACTION'
    WHEN 'r' THEN 'RESTRICT'
    WHEN 'c' THEN 'CASCADE'
    WHEN 'n' THEN 'SET NULL'
    WHEN 'd' THEN 'SET DEFAULT'
    ELSE con.confupdtype::text
  END AS on_update,
  CASE con.confdeltype
    WHEN 'a' THEN 'NO ACTION'
    WHEN 'r' THEN 'RESTRICT'
    WHEN 'c' THEN 'CASCADE'
    WHEN 'n' THEN 'SET NULL'
    WHEN 'd' THEN 'SET DEFAULT'
    ELSE con.confdeltype::text
  END AS on_delete,
  fk_map.position_in_key
FROM pg_constraint con
JOIN pg_class src_tbl ON src_tbl.oid = con.conrelid
JOIN pg_namespace src_ns ON src_ns.oid = src_tbl.relnamespace
JOIN pg_class tgt_tbl ON tgt_tbl.oid = con.confrelid
JOIN pg_namespace tgt_ns ON tgt_ns.oid = tgt_tbl.relnamespace
JOIN LATERAL (
  SELECT
    src_pos.attnum AS source_attnum,
    tgt_pos.attnum AS target_attnum,
    src_pos.ord AS position_in_key
  FROM unnest(con.conkey) WITH ORDINALITY AS src_pos(attnum, ord)
  JOIN unnest(con.confkey) WITH ORDINALITY AS tgt_pos(attnum, ord)
    ON src_pos.ord = tgt_pos.ord
) fk_map ON true
JOIN pg_attribute src_col
  ON src_col.attrelid = con.conrelid
 AND src_col.attnum = fk_map.source_attnum
 AND NOT src_col.attisdropped
JOIN pg_attribute tgt_col
  ON tgt_col.attrelid = con.confrelid
 AND tgt_col.attnum = fk_map.target_attnum
 AND NOT tgt_col.attisdropped
WHERE con.contype = 'f'
  AND src_ns.nspname = 'public'
ORDER BY src_tbl.relname, con.conname, fk_map.position_in_key;

-- ============================================================================
-- 05) Indizes (nur public)
-- ============================================================================
SELECT
  schemaname AS schema_name,
  tablename AS table_name,
  indexname AS index_name,
  CASE WHEN ix.indisunique THEN 'yes' ELSE 'no' END AS is_unique,
  CASE WHEN ix.indisprimary THEN 'yes' ELSE 'no' END AS is_primary,
  pg_get_indexdef(ix.indexrelid) AS index_definition,
  ARRAY(
    SELECT pg_get_indexdef(ix.indexrelid, key_pos.n, true)
    FROM generate_subscripts(ix.indkey, 1) AS key_pos(n)
    ORDER BY key_pos.n
  ) AS index_columns,
  pg_get_expr(ix.indpred, ix.indrelid) AS partial_index_condition
FROM pg_indexes i
JOIN pg_class idx ON idx.relname = i.indexname
JOIN pg_namespace idx_ns ON idx_ns.oid = idx.relnamespace AND idx_ns.nspname = i.schemaname
JOIN pg_index ix ON ix.indexrelid = idx.oid
WHERE i.schemaname = 'public'
ORDER BY i.tablename, i.indexname;

-- ============================================================================
-- 06) Trigger (fachlich, interne Constraint-Trigger ausblenden, nur public)
-- ============================================================================
SELECT
  n.nspname AS schema_name,
  c.relname AS table_name,
  t.tgname AS trigger_name,
  CASE WHEN (t.tgtype & 2) <> 0 THEN 'BEFORE' ELSE 'AFTER' END AS timing,
  array_to_string(
    array_remove(
      ARRAY[
        CASE WHEN (t.tgtype & 4) <> 0 THEN 'INSERT' END,
        CASE WHEN (t.tgtype & 8) <> 0 THEN 'DELETE' END,
        CASE WHEN (t.tgtype & 16) <> 0 THEN 'UPDATE' END,
        CASE WHEN (t.tgtype & 32) <> 0 THEN 'TRUNCATE' END
      ],
      NULL
    ),
    ', '
  ) AS events,
  CASE t.tgenabled
    WHEN 'O' THEN 'ENABLED'
    WHEN 'D' THEN 'DISABLED'
    WHEN 'R' THEN 'REPLICA'
    WHEN 'A' THEN 'ALWAYS'
    ELSE t.tgenabled::text
  END AS enabled_state,
  pg_get_triggerdef(t.oid, true) AS trigger_definition,
  p.proname AS executed_function
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_proc p ON p.oid = t.tgfoid
WHERE n.nspname = 'public'
  AND NOT t.tgisinternal
ORDER BY c.relname, t.tgname;

-- ============================================================================
-- 07) Funktionen und RPCs (nur public)
-- ============================================================================
SELECT
  n.nspname AS schema_name,
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS identity_arguments,
  pg_get_function_result(p.oid) AS return_type,
  l.lanname AS language,
  CASE WHEN p.prosecdef THEN 'yes' ELSE 'no' END AS security_definer,
  CASE p.provolatile
    WHEN 'i' THEN 'IMMUTABLE'
    WHEN 's' THEN 'STABLE'
    WHEN 'v' THEN 'VOLATILE'
    ELSE p.provolatile::text
  END AS volatility,
  pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
JOIN pg_language l ON l.oid = p.prolang
WHERE n.nspname = 'public'
ORDER BY p.proname, pg_get_function_identity_arguments(p.oid);

-- ============================================================================
-- 08) Views und Materialized Views (public, auth, storage)
-- ============================================================================
SELECT
  v.schemaname AS schema_name,
  v.viewname AS view_name,
  'VIEW' AS view_type,
  v.definition AS view_definition
FROM pg_views v
WHERE v.schemaname IN ('public', 'auth', 'storage')

UNION ALL

SELECT
  m.schemaname AS schema_name,
  m.matviewname AS view_name,
  'MATERIALIZED VIEW' AS view_type,
  m.definition AS view_definition
FROM pg_matviews m
WHERE m.schemaname IN ('public', 'auth', 'storage')
ORDER BY schema_name, view_name;

-- ============================================================================
-- 09) RLS-Policies (public, storage)
-- ============================================================================
SELECT
  p.schemaname,
  p.tablename,
  p.policyname,
  p.permissive,
  p.roles,
  p.cmd AS command,
  p.qual AS using_expression,
  p.with_check AS with_check_expression
FROM pg_policies p
WHERE p.schemaname IN ('public', 'storage')
ORDER BY p.schemaname, p.tablename, p.policyname;

-- ============================================================================
-- 10) RLS-Status je Tabelle (public, storage)
-- ============================================================================
WITH target_tables AS (
  SELECT
    n.nspname AS schema_name,
    c.relname AS table_name,
    c.oid AS table_oid,
    c.relrowsecurity AS rls_enabled,
    c.relforcerowsecurity AS rls_forced
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname IN ('public', 'storage')
    AND c.relkind IN ('r', 'p', 'f')
)
SELECT
  t.schema_name,
  t.table_name,
  CASE WHEN t.rls_enabled THEN 'yes' ELSE 'no' END AS rls_enabled,
  CASE WHEN t.rls_forced THEN 'yes' ELSE 'no' END AS rls_forced,
  COALESCE(pol.policy_count, 0) AS policy_count
FROM target_tables t
LEFT JOIN (
  SELECT
    p.schemaname,
    p.tablename,
    COUNT(*)::int AS policy_count
  FROM pg_policies p
  WHERE p.schemaname IN ('public', 'storage')
  GROUP BY p.schemaname, p.tablename
) pol
  ON pol.schemaname = t.schema_name
 AND pol.tablename = t.table_name
ORDER BY t.schema_name, t.table_name;

-- ============================================================================
-- 11) Storage Buckets (soweit SQL-lesbar)
-- ============================================================================
SELECT
  b.id,
  b.name,
  b.public,
  b.file_size_limit,
  b.allowed_mime_types,
  b.created_at,
  b.updated_at
FROM storage.buckets b
ORDER BY b.id;

-- ============================================================================
-- 12) Storage-Objekt-Summary (nur aggregiert, keine Dateinamen)
-- ============================================================================
SELECT
  o.bucket_id,
  COUNT(*)::bigint AS object_count,
  COALESCE(SUM(o.metadata ->> 'size')::bigint, 0) AS total_size_bytes,
  MIN(o.created_at) AS oldest_object,
  MAX(o.created_at) AS newest_object
FROM storage.objects o
GROUP BY o.bucket_id
ORDER BY o.bucket_id;
