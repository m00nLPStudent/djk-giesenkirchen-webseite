-- B15.22A: Download module live-schema preflight.
-- READ ONLY. Run manually in Supabase SQL Editor. Do not add DDL/DML.

-- 1. Candidate relations and RLS state.
SELECT n.nspname AS schema_name, c.relname, c.relkind,
       c.relrowsecurity AS rls_enabled, c.relforcerowsecurity AS force_rls,
       pg_get_userbyid(c.relowner) AS owner
FROM pg_catalog.pg_class c
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname IN ('public', 'storage')
  AND (c.relname IN ('downloads', 'download_categories', 'media_assets', 'media_asset_usages', 'buckets', 'objects')
       OR c.relname ILIKE '%download%')
ORDER BY n.nspname, c.relname;

-- 2. Exact columns, defaults and nullability.
SELECT table_schema, table_name, ordinal_position, column_name, data_type,
       udt_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema IN ('public', 'storage')
  AND table_name IN ('downloads', 'download_categories', 'media_assets', 'media_asset_usages', 'buckets', 'objects')
ORDER BY table_schema, table_name, ordinal_position;

-- 3. Constraints and their definitions.
SELECT n.nspname AS schema_name, c.relname AS table_name, con.conname,
       con.contype, pg_get_constraintdef(con.oid, true) AS definition
FROM pg_catalog.pg_constraint con
JOIN pg_catalog.pg_class c ON c.oid = con.conrelid
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('downloads', 'download_categories', 'media_assets', 'media_asset_usages')
ORDER BY c.relname, con.conname;

-- 4. Index definitions.
SELECT schemaname, tablename, indexname, indexdef
FROM pg_catalog.pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('downloads', 'download_categories', 'media_assets', 'media_asset_usages')
ORDER BY tablename, indexname;

-- 5. RLS policies.
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_catalog.pg_policies
WHERE schemaname IN ('public', 'storage')
  AND tablename IN ('downloads', 'download_categories', 'media_assets', 'media_asset_usages', 'objects')
ORDER BY schemaname, tablename, policyname;

-- 6. Effective table privileges for browser and service roles.
SELECT table_schema, table_name, grantee,
       bool_or(privilege_type = 'SELECT') AS can_select,
       bool_or(privilege_type = 'INSERT') AS can_insert,
       bool_or(privilege_type = 'UPDATE') AS can_update,
       bool_or(privilege_type = 'DELETE') AS can_delete,
       bool_or(privilege_type = 'TRUNCATE') AS can_truncate,
       bool_or(privilege_type = 'REFERENCES') AS can_references,
       bool_or(privilege_type = 'TRIGGER') AS can_trigger
FROM information_schema.role_table_grants
WHERE table_schema IN ('public', 'storage')
  AND table_name IN ('downloads', 'download_categories', 'media_assets', 'media_asset_usages', 'buckets', 'objects')
  AND grantee IN ('anon', 'authenticated', 'service_role')
GROUP BY table_schema, table_name, grantee
ORDER BY table_schema, table_name, grantee;

-- 7. Column grants (important even when table grants were revoked).
SELECT table_schema, table_name, grantee, column_name,
       array_agg(DISTINCT privilege_type ORDER BY privilege_type) AS privileges
FROM information_schema.column_privileges
WHERE table_schema = 'public'
  AND table_name IN ('downloads', 'download_categories', 'media_assets', 'media_asset_usages')
  AND grantee IN ('anon', 'authenticated', 'service_role')
GROUP BY table_schema, table_name, grantee, column_name
ORDER BY table_name, grantee, column_name;

-- 8. Relevant ordinary functions/procedures only. MATERIALIZED prevents unsafe
-- pg_get_functiondef evaluation on aggregates/window functions.
WITH relevant_routines AS MATERIALIZED (
  SELECT p.oid, n.nspname, p.proname, p.prosecdef, p.proconfig,
         pg_get_userbyid(p.proowner) AS owner
  FROM pg_catalog.pg_proc p
  JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.prokind IN ('f', 'p')
    AND (p.proname ILIKE '%download%' OR p.proname ILIKE '%media%')
)
SELECT r.oid::regprocedure::text AS signature, r.prosecdef AS security_definer,
       r.proconfig, r.owner, pg_get_functiondef(r.oid) AS definition
FROM relevant_routines r
ORDER BY r.oid::regprocedure::text;

-- 9. Triggers on candidate tables.
SELECT n.nspname AS schema_name, c.relname AS table_name, t.tgname,
       pg_get_triggerdef(t.oid, true) AS definition
FROM pg_catalog.pg_trigger t
JOIN pg_catalog.pg_class c ON c.oid = t.tgrelid
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE NOT t.tgisinternal AND n.nspname = 'public'
  AND c.relname IN ('downloads', 'download_categories', 'media_assets', 'media_asset_usages')
ORDER BY c.relname, t.tgname;

-- 10. Relevant Storage buckets; no object names or user data.
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id ILIKE '%media%' OR id ILIKE '%download%'
ORDER BY id;

-- 11. Aggregated category inventory (zero rows if relation is absent cannot be
-- expressed safely in static SQL; run only after section 1 confirms the table).
SELECT is_active, count(*) AS category_count
FROM public.download_categories
GROUP BY is_active
ORDER BY is_active DESC;

-- 12. Aggregated media inventory; exposes no filenames, paths or uploader IDs.
SELECT purpose, media_kind, visibility, storage_bucket, mime_type, is_archived,
       count(*) AS asset_count, coalesce(sum(file_size_bytes), 0) AS total_bytes
FROM public.media_assets
WHERE purpose = 'download' OR media_kind = 'document'
GROUP BY purpose, media_kind, visibility, storage_bucket, mime_type, is_archived
ORDER BY purpose, media_kind, visibility, storage_bucket, mime_type, is_archived;

-- 13. Aggregated existing download usages; no entity IDs.
SELECT entity_type, field_name, count(*) AS usage_count
FROM public.media_asset_usages
WHERE entity_type ILIKE '%download%' OR field_name ILIKE '%download%'
GROUP BY entity_type, field_name
ORDER BY entity_type, field_name;

-- 14. Existing permission keys and role assignments relevant to downloads.
SELECT p.key AS permission_key, count(DISTINCT rp.role_id) AS assigned_role_count
FROM public.admin_permissions p
LEFT JOIN public.admin_role_permissions rp ON rp.permission_id = p.id
WHERE p.key ILIKE 'download%'
GROUP BY p.key
ORDER BY p.key;

SELECT r.key AS role_key, p.key AS permission_key
FROM public.admin_roles r
JOIN public.admin_role_permissions rp ON rp.role_id = r.id
JOIN public.admin_permissions p ON p.id = rp.permission_id
WHERE p.key ILIKE 'download%'
ORDER BY r.key, p.key;
