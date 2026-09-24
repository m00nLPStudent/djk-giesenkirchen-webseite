-- B15 - Produktive Supabase Security-Hardening-Inventur
-- Phase 1: READ-ONLY Live-Preflight
--
-- Zweck:
--   Metadateninventur fuer public-Tabellen, RLS, Policies, Grants und
--   Funktionen. Es werden keine fachlichen Tabelleninhalte ausgegeben.
--
-- Sicherheitsvertrag:
--   Dieses Skript enthaelt ausschliesslich SELECT-/WITH-Abfragen gegen
--   PostgreSQL-Metadaten. Es ruft keine Anwendungsfunktion auf und veraendert
--   weder Daten noch Schema, Policies, Grants oder Konfiguration.

-- S1.01 Alle Tabellen und partitionierten Tabellen im public-Schema.
SELECT
  'S1.01_PUBLIC_TABLE_RLS_INVENTORY' AS result_set,
  n.nspname AS table_schema,
  c.relname AS table_name,
  CASE c.relkind WHEN 'r' THEN 'table' WHEN 'p' THEN 'partitioned table' END AS relation_kind,
  pg_catalog.pg_get_userbyid(c.relowner) AS owner,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS force_rls,
  count(pol.oid) AS policy_count
FROM pg_catalog.pg_class AS c
JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
LEFT JOIN pg_catalog.pg_policy AS pol ON pol.polrelid = c.oid
WHERE n.nspname = 'public'
  AND c.relkind IN ('r', 'p')
GROUP BY n.nspname, c.relname, c.relkind, c.relowner, c.relrowsecurity, c.relforcerowsecurity
ORDER BY c.relname;

-- S1.02 Fokusobjekte: Existenz, Owner und RLS-Status.
WITH target_tables(table_name) AS (
  VALUES
    ('club_settings'),
    ('membership_request_recipients'),
    ('pages'),
    ('events'),
    ('news'),
    ('news_documents')
)
SELECT
  'S1.02_TARGET_TABLE_STATUS' AS result_set,
  target.table_name,
  c.oid IS NOT NULL AS relation_exists,
  CASE c.relkind WHEN 'r' THEN 'table' WHEN 'p' THEN 'partitioned table' ELSE c.relkind::text END AS relation_kind,
  pg_catalog.pg_get_userbyid(c.relowner) AS owner,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS force_rls,
  (SELECT count(*) FROM pg_catalog.pg_policy AS pol WHERE pol.polrelid = c.oid) AS policy_count
FROM target_tables AS target
LEFT JOIN pg_catalog.pg_namespace AS n ON n.nspname = 'public'
LEFT JOIN pg_catalog.pg_class AS c
  ON c.relnamespace = n.oid
 AND c.relname = target.table_name
 AND c.relkind IN ('r', 'p')
ORDER BY target.table_name;

-- S1.03 Saemtliche Policies der sechs Fokusobjekte.
SELECT
  'S1.03_TARGET_POLICIES' AS result_set,
  schemaname AS table_schema,
  tablename AS table_name,
  policyname AS policy_name,
  permissive,
  roles,
  cmd,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_catalog.pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'club_settings',
    'membership_request_recipients',
    'pages',
    'events',
    'news',
    'news_documents'
  )
ORDER BY tablename, policyname;

-- S1.04 Explizite Tabellen-GRANTs der Data-API-Rollen.
SELECT
  'S1.04_TARGET_EXPLICIT_TABLE_GRANTS' AS result_set,
  table_schema,
  table_name,
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN (
    'club_settings',
    'membership_request_recipients',
    'pages',
    'events',
    'news',
    'news_documents'
  )
  AND grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY table_name, grantee, privilege_type;

-- S1.05 Effektive Tabellenrechte (einschliesslich Rollenmitgliedschaften).
WITH target_tables(table_name) AS (
  VALUES
    ('club_settings'),
    ('membership_request_recipients'),
    ('pages'),
    ('events'),
    ('news'),
    ('news_documents')
),
data_api_roles(role_name) AS (
  SELECT rolname
  FROM pg_catalog.pg_roles
  WHERE rolname IN ('anon', 'authenticated', 'service_role')
),
privileges(privilege_name) AS (
  VALUES
    ('SELECT'),
    ('INSERT'),
    ('UPDATE'),
    ('DELETE'),
    ('TRUNCATE'),
    ('REFERENCES'),
    ('TRIGGER')
)
SELECT
  'S1.05_TARGET_EFFECTIVE_TABLE_PRIVILEGES' AS result_set,
  target.table_name,
  role.role_name,
  privilege.privilege_name,
  pg_catalog.has_table_privilege(
    role.role_name,
    format('%I.%I', 'public', target.table_name),
    privilege.privilege_name
  ) AS has_privilege
FROM target_tables AS target
CROSS JOIN data_api_roles AS role
CROSS JOIN privileges AS privilege
ORDER BY target.table_name, role.role_name, privilege.privilege_name;

-- S1.06 Explizite Spalten-GRANTs der Fokusobjekte.
SELECT
  'S1.06_TARGET_EXPLICIT_COLUMN_GRANTS' AS result_set,
  table_schema,
  table_name,
  column_name,
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.column_privileges
WHERE table_schema = 'public'
  AND table_name IN (
    'club_settings',
    'membership_request_recipients',
    'pages',
    'events',
    'news',
    'news_documents'
  )
  AND grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY table_name, column_name, grantee, privilege_type;

-- S1.07 Schema-USAGE und CREATE fuer Data-API-Rollen.
WITH data_api_roles(role_name) AS (
  SELECT rolname
  FROM pg_catalog.pg_roles
  WHERE rolname IN ('anon', 'authenticated', 'service_role')
)
SELECT
  'S1.07_PUBLIC_SCHEMA_EFFECTIVE_PRIVILEGES' AS result_set,
  role_name,
  pg_catalog.has_schema_privilege(role_name, 'public', 'USAGE') AS has_usage,
  pg_catalog.has_schema_privilege(role_name, 'public', 'CREATE') AS has_create
FROM data_api_roles
ORDER BY role_name;

-- S1.08 Public-Tabellen mit deaktiviertem RLS und effektiver Data-API-Erreichbarkeit.
WITH public_tables AS MATERIALIZED (
  SELECT c.oid, c.relname, c.relrowsecurity, c.relforcerowsecurity
  FROM pg_catalog.pg_class AS c
  JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind IN ('r', 'p')
    AND c.relrowsecurity IS FALSE
),
data_api_roles(role_name) AS (
  SELECT rolname
  FROM pg_catalog.pg_roles
  WHERE rolname IN ('anon', 'authenticated', 'service_role')
)
SELECT
  'S1.08_RLS_DISABLED_DATA_API_REACHABILITY' AS result_set,
  table_row.relname AS table_name,
  table_row.relrowsecurity AS rls_enabled,
  table_row.relforcerowsecurity AS force_rls,
  role.role_name,
  pg_catalog.has_table_privilege(role.role_name, table_row.oid, 'SELECT') AS can_select,
  pg_catalog.has_table_privilege(role.role_name, table_row.oid, 'INSERT') AS can_insert,
  pg_catalog.has_table_privilege(role.role_name, table_row.oid, 'UPDATE') AS can_update,
  pg_catalog.has_table_privilege(role.role_name, table_row.oid, 'DELETE') AS can_delete,
  pg_catalog.has_table_privilege(role.role_name, table_row.oid, 'TRUNCATE') AS can_truncate,
  pg_catalog.has_table_privilege(role.role_name, table_row.oid, 'REFERENCES') AS can_reference,
  pg_catalog.has_table_privilege(role.role_name, table_row.oid, 'TRIGGER') AS can_trigger
FROM public_tables AS table_row
CROSS JOIN data_api_roles AS role
ORDER BY table_row.relname, role.role_name;

-- S1.09 Public-Tabellen mit aktiviertem RLS, aber ohne Policy.
SELECT
  'S1.09_RLS_ENABLED_WITHOUT_POLICY' AS result_set,
  c.relname AS table_name,
  pg_catalog.pg_get_userbyid(c.relowner) AS owner,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS force_rls
FROM pg_catalog.pg_class AS c
JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind IN ('r', 'p')
  AND c.relrowsecurity IS TRUE
  AND NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_policy AS pol
    WHERE pol.polrelid = c.oid
  )
ORDER BY c.relname;

-- S1.10 Alle SECURITY-DEFINER-Funktionen/Prozeduren im public-Schema.
-- MATERIALIZED schliesst Aggregate und Window-Funktionen garantiert aus,
-- bevor pg_get_functiondef ausgewertet wird.
WITH eligible_routines AS MATERIALIZED (
  SELECT
    p.oid,
    p.prokind,
    p.prosecdef,
    p.proconfig,
    p.proowner,
    p.proacl
  FROM pg_catalog.pg_proc AS p
  JOIN pg_catalog.pg_namespace AS n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.prokind IN ('f', 'p')
    AND p.prosecdef IS TRUE
),
routine_definitions AS MATERIALIZED (
  SELECT
    routine.*,
    pg_catalog.pg_get_functiondef(routine.oid) AS function_definition
  FROM eligible_routines AS routine
)
SELECT
  'S1.10_PUBLIC_SECURITY_DEFINER_ROUTINES' AS result_set,
  routine.oid::regprocedure::text AS signature,
  CASE routine.prokind WHEN 'f' THEN 'function' WHEN 'p' THEN 'procedure' END AS routine_kind,
  routine.prosecdef AS security_definer,
  pg_catalog.pg_get_userbyid(routine.proowner) AS owner,
  routine.proconfig,
  COALESCE((
    SELECT bool_or(acl.grantee = 0 AND acl.privilege_type = 'EXECUTE')
    FROM pg_catalog.aclexplode(
      COALESCE(routine.proacl, pg_catalog.acldefault('f', routine.proowner))
    ) AS acl
  ), false) AS public_execute,
  CASE WHEN EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'anon')
    THEN pg_catalog.has_function_privilege('anon', routine.oid, 'EXECUTE') END AS anon_execute,
  CASE WHEN EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'authenticated')
    THEN pg_catalog.has_function_privilege('authenticated', routine.oid, 'EXECUTE') END AS authenticated_execute,
  CASE WHEN EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'service_role')
    THEN pg_catalog.has_function_privilege('service_role', routine.oid, 'EXECUTE') END AS service_role_execute,
  routine.function_definition
FROM routine_definitions AS routine
ORDER BY routine.oid::regprocedure::text;

-- S1.11 Funktionen/Prozeduren, deren Definition eines der Fokusobjekte nennt.
WITH eligible_routines AS MATERIALIZED (
  SELECT
    p.oid,
    p.prokind,
    p.prosecdef,
    p.proconfig,
    p.proowner,
    p.proacl
  FROM pg_catalog.pg_proc AS p
  JOIN pg_catalog.pg_namespace AS n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.prokind IN ('f', 'p')
),
routine_definitions AS MATERIALIZED (
  SELECT
    routine.*,
    pg_catalog.pg_get_functiondef(routine.oid) AS function_definition
  FROM eligible_routines AS routine
),
relevant_routines AS MATERIALIZED (
  SELECT routine.*
  FROM routine_definitions AS routine
  WHERE routine.function_definition ~* '\m(club_settings|membership_request_recipients|pages|events|news|news_documents)\M'
)
SELECT
  'S1.11_TARGET_RELEVANT_ROUTINES' AS result_set,
  routine.oid::regprocedure::text AS signature,
  CASE routine.prokind WHEN 'f' THEN 'function' WHEN 'p' THEN 'procedure' END AS routine_kind,
  routine.prosecdef AS security_definer,
  pg_catalog.pg_get_userbyid(routine.proowner) AS owner,
  routine.proconfig,
  COALESCE((
    SELECT bool_or(acl.grantee = 0 AND acl.privilege_type = 'EXECUTE')
    FROM pg_catalog.aclexplode(
      COALESCE(routine.proacl, pg_catalog.acldefault('f', routine.proowner))
    ) AS acl
  ), false) AS public_execute,
  CASE WHEN EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'anon')
    THEN pg_catalog.has_function_privilege('anon', routine.oid, 'EXECUTE') END AS anon_execute,
  CASE WHEN EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'authenticated')
    THEN pg_catalog.has_function_privilege('authenticated', routine.oid, 'EXECUTE') END AS authenticated_execute,
  CASE WHEN EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'service_role')
    THEN pg_catalog.has_function_privilege('service_role', routine.oid, 'EXECUTE') END AS service_role_execute,
  routine.function_definition
FROM relevant_routines AS routine
ORDER BY routine.oid::regprocedure::text;

-- S1.12 Trigger und zugehoerige Funktionen der Fokusobjekte.
SELECT
  'S1.12_TARGET_TRIGGERS' AS result_set,
  table_ns.nspname AS table_schema,
  table_row.relname AS table_name,
  trigger_row.tgname AS trigger_name,
  trigger_row.tgenabled AS trigger_enabled,
  function_ns.nspname AS function_schema,
  function_row.oid::regprocedure::text AS function_signature,
  function_row.prosecdef AS security_definer,
  function_row.proconfig,
  pg_catalog.pg_get_userbyid(function_row.proowner) AS function_owner
FROM pg_catalog.pg_trigger AS trigger_row
JOIN pg_catalog.pg_class AS table_row ON table_row.oid = trigger_row.tgrelid
JOIN pg_catalog.pg_namespace AS table_ns ON table_ns.oid = table_row.relnamespace
JOIN pg_catalog.pg_proc AS function_row ON function_row.oid = trigger_row.tgfoid
JOIN pg_catalog.pg_namespace AS function_ns ON function_ns.oid = function_row.pronamespace
WHERE trigger_row.tgisinternal IS FALSE
  AND table_ns.nspname = 'public'
  AND table_row.relname IN (
    'club_settings',
    'membership_request_recipients',
    'pages',
    'events',
    'news',
    'news_documents'
  )
ORDER BY table_row.relname, trigger_row.tgname;

-- S1.13 Explizite Standardrechte fuer kuenftige public-Objekte.
SELECT
  'S1.13_PUBLIC_DEFAULT_PRIVILEGES' AS result_set,
  pg_catalog.pg_get_userbyid(default_acl.defaclrole) AS owner,
  namespace_row.nspname AS schema_name,
  default_acl.defaclobjtype AS object_type,
  CASE WHEN acl.grantee = 0 THEN 'PUBLIC' ELSE grantee_role.rolname END AS grantee,
  acl.privilege_type,
  acl.is_grantable
FROM pg_catalog.pg_default_acl AS default_acl
LEFT JOIN pg_catalog.pg_namespace AS namespace_row ON namespace_row.oid = default_acl.defaclnamespace
CROSS JOIN LATERAL pg_catalog.aclexplode(default_acl.defaclacl) AS acl
LEFT JOIN pg_catalog.pg_roles AS grantee_role ON grantee_role.oid = acl.grantee
WHERE namespace_row.nspname = 'public'
  AND (acl.grantee = 0 OR grantee_role.rolname IN ('anon', 'authenticated', 'service_role'))
ORDER BY owner, object_type, grantee, privilege_type;

-- S1.14 Kompakte Fokusbewertung: Grants plus RLS/Policy-Anzahl.
WITH target_relations AS MATERIALIZED (
  SELECT
    c.oid,
    c.relname,
    c.relrowsecurity,
    c.relforcerowsecurity,
    (SELECT count(*) FROM pg_catalog.pg_policy AS pol WHERE pol.polrelid = c.oid) AS policy_count
  FROM pg_catalog.pg_class AS c
  JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind IN ('r', 'p')
    AND c.relname IN (
      'club_settings',
      'membership_request_recipients',
      'pages',
      'events',
      'news',
      'news_documents'
    )
),
data_api_roles(role_name) AS (
  SELECT rolname
  FROM pg_catalog.pg_roles
  WHERE rolname IN ('anon', 'authenticated', 'service_role')
)
SELECT
  'S1.14_TARGET_EFFECTIVE_ACCESS_SUMMARY' AS result_set,
  relation.relname AS table_name,
  relation.relrowsecurity AS rls_enabled,
  relation.relforcerowsecurity AS force_rls,
  relation.policy_count,
  role.role_name,
  pg_catalog.has_table_privilege(role.role_name, relation.oid, 'SELECT') AS table_select,
  pg_catalog.has_table_privilege(role.role_name, relation.oid, 'INSERT') AS table_insert,
  pg_catalog.has_table_privilege(role.role_name, relation.oid, 'UPDATE') AS table_update,
  pg_catalog.has_table_privilege(role.role_name, relation.oid, 'DELETE') AS table_delete
FROM target_relations AS relation
CROSS JOIN data_api_roles AS role
ORDER BY relation.relname, role.role_name;
