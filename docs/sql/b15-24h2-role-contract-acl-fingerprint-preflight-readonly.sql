-- B15.24H2 - Role contract ACL and board fingerprint preflight (READ ONLY)
--
-- Purpose:
--   1. capture the complete current table/column ACL baseline for board_members;
--   2. capture effective per-column API-role privileges; and
--   3. capture a deterministic full-row fingerprint without exporting PII.
--
-- Execute manually in the Supabase SQL Editor before correcting or running the
-- role-contract proposal. Export every result set. This file performs no writes.

-- RESULTSET 01 - COMPLETE BOARD COLUMN INVENTORY
SELECT
  '01_COMPLETE_BOARD_COLUMN_INVENTORY' AS section,
  column_row.ordinal_position,
  column_row.column_name,
  column_row.data_type,
  column_row.udt_name,
  column_row.is_nullable,
  column_row.column_default,
  column_row.is_identity,
  column_row.is_generated
FROM information_schema.columns AS column_row
WHERE column_row.table_schema = 'public'
  AND column_row.table_name = 'board_members'
ORDER BY column_row.ordinal_position;

-- RESULTSET 02 - EXPLICIT TABLE ACL BASELINE
SELECT
  '02_EXPLICIT_TABLE_ACL_BASELINE' AS section,
  pg_catalog.pg_get_userbyid(acl_row.grantor) AS grantor,
  CASE WHEN acl_row.grantee = 0 THEN 'PUBLIC'
       ELSE pg_catalog.pg_get_userbyid(acl_row.grantee) END AS grantee,
  acl_row.privilege_type,
  acl_row.is_grantable
FROM pg_catalog.pg_class AS class_row
JOIN pg_catalog.pg_namespace AS namespace_row ON namespace_row.oid = class_row.relnamespace
CROSS JOIN LATERAL pg_catalog.aclexplode(
  COALESCE(class_row.relacl, pg_catalog.acldefault('r', class_row.relowner))
) AS acl_row
WHERE namespace_row.nspname = 'public'
  AND class_row.relname = 'board_members'
  AND (acl_row.grantee = 0 OR pg_catalog.pg_get_userbyid(acl_row.grantee) IN ('anon', 'authenticated', 'service_role'))
ORDER BY grantee, acl_row.privilege_type, grantor;

-- RESULTSET 03 - COMPLETE EXPLICIT COLUMN ACL BASELINE
SELECT
  '03_EXPLICIT_COLUMN_ACL_BASELINE' AS section,
  pg_catalog.pg_get_userbyid(acl_row.grantor) AS grantor,
  CASE WHEN acl_row.grantee = 0 THEN 'PUBLIC'
       ELSE pg_catalog.pg_get_userbyid(acl_row.grantee) END AS grantee,
  attribute_row.attnum AS ordinal_position,
  attribute_row.attname AS column_name,
  acl_row.privilege_type,
  acl_row.is_grantable
FROM pg_catalog.pg_class AS class_row
JOIN pg_catalog.pg_namespace AS namespace_row ON namespace_row.oid = class_row.relnamespace
JOIN pg_catalog.pg_attribute AS attribute_row ON attribute_row.attrelid = class_row.oid
CROSS JOIN LATERAL pg_catalog.aclexplode(attribute_row.attacl) AS acl_row
WHERE namespace_row.nspname = 'public'
  AND class_row.relname = 'board_members'
  AND attribute_row.attnum > 0
  AND NOT attribute_row.attisdropped
  AND (acl_row.grantee = 0 OR pg_catalog.pg_get_userbyid(acl_row.grantee) IN ('anon', 'authenticated', 'service_role'))
ORDER BY grantee, attribute_row.attnum, acl_row.privilege_type, grantor;

-- RESULTSET 04 - EFFECTIVE PRIVILEGES FOR EVERY BOARD COLUMN
WITH api_roles(role_name) AS MATERIALIZED (
  VALUES ('anon'), ('authenticated'), ('service_role')
), board_columns(column_name, ordinal_position) AS MATERIALIZED (
  SELECT column_row.column_name, column_row.ordinal_position
  FROM information_schema.columns AS column_row
  WHERE column_row.table_schema = 'public'
    AND column_row.table_name = 'board_members'
), privilege_names(privilege_name) AS MATERIALIZED (
  VALUES ('SELECT'), ('INSERT'), ('UPDATE'), ('REFERENCES')
)
SELECT
  '04_EFFECTIVE_PRIVILEGES_EVERY_COLUMN' AS section,
  api.role_name,
  board_column.ordinal_position,
  board_column.column_name,
  privilege.privilege_name,
  has_column_privilege(
    api.role_name,
    'public.board_members',
    board_column.column_name,
    privilege.privilege_name
  ) AS effective_privilege
FROM api_roles AS api
CROSS JOIN board_columns AS board_column
CROSS JOIN privilege_names AS privilege
ORDER BY api.role_name, board_column.ordinal_position, privilege.privilege_name;

-- RESULTSET 05 - EFFECTIVE TABLE PRIVILEGES
WITH api_roles(role_name) AS MATERIALIZED (
  VALUES ('anon'), ('authenticated'), ('service_role')
), privilege_names(privilege_name) AS MATERIALIZED (
  VALUES ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE'),
    ('TRUNCATE'), ('REFERENCES'), ('TRIGGER')
)
SELECT
  '05_EFFECTIVE_TABLE_PRIVILEGES' AS section,
  api.role_name,
  privilege.privilege_name,
  has_table_privilege(
    api.role_name,
    'public.board_members',
    privilege.privilege_name
  ) AS effective_privilege
FROM api_roles AS api
CROSS JOIN privilege_names AS privilege
ORDER BY api.role_name, privilege.privilege_name;

-- RESULTSET 06 - DETERMINISTIC FULL BOARD DATA FINGERPRINT
-- jsonb has canonical key ordering. The aggregate is ordered by the stable row
-- id and exports only counts/hashes, never names, email addresses or phone data.
SELECT
  '06_DETERMINISTIC_FULL_BOARD_DATA_FINGERPRINT' AS section,
  count(*) AS board_member_count,
  md5(
    COALESCE(
      string_agg(md5(to_jsonb(member_row)::text), '' ORDER BY member_row.id::text),
      ''
    )
  ) AS full_row_fingerprint,
  md5(
    COALESCE(
      string_agg(member_row.id::text, '' ORDER BY member_row.id::text),
      ''
    )
  ) AS ordered_id_set_fingerprint,
  count(*) FILTER (WHERE member_row.admin_profile_id IS NOT NULL) AS linked_admin_profile_count,
  count(*) FILTER (WHERE member_row.organization_scope = 'club') AS club_count,
  count(*) FILTER (WHERE member_row.organization_scope = 'department') AS department_count,
  count(*) FILTER (WHERE member_row.organization_scope = 'unassigned') AS unassigned_count
FROM public.board_members AS member_row;

-- RESULTSET 07 - COMPACT COMPLETENESS SUMMARY
SELECT
  '07_COMPACT_COMPLETENESS_SUMMARY' AS section,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'board_members'
  ) AS board_columns_found,
  (SELECT count(*) FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'board_members') AS board_column_count,
  EXISTS (
    SELECT 1 FROM pg_catalog.pg_class class_row
    CROSS JOIN LATERAL pg_catalog.aclexplode(class_row.relacl) acl_row
    WHERE class_row.oid = 'public.board_members'::regclass
      AND pg_catalog.pg_get_userbyid(acl_row.grantee) = 'authenticated'
  ) AS authenticated_explicit_table_acl_rows_found,
  EXISTS (
    SELECT 1 FROM pg_catalog.pg_attribute attribute_row
    CROSS JOIN LATERAL pg_catalog.aclexplode(attribute_row.attacl) acl_row
    WHERE attribute_row.attrelid = 'public.board_members'::regclass
      AND attribute_row.attnum > 0 AND NOT attribute_row.attisdropped
      AND pg_catalog.pg_get_userbyid(acl_row.grantee) = 'authenticated'
  ) AS authenticated_explicit_column_acl_rows_found,
  (SELECT count(*) FROM public.board_members) AS board_member_count,
  md5(
    COALESCE(
      (SELECT string_agg(md5(to_jsonb(member_row)::text), '' ORDER BY member_row.id::text)
       FROM public.board_members AS member_row),
      ''
    )
  ) AS full_row_fingerprint_present;
