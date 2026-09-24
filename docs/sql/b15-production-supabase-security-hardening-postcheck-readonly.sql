-- B15 - Productive Supabase security hardening
-- Phase 4: READ-ONLY postcheck after a later manual proposal execution.
-- This file does not mutate schema or data.

-- H.01 Focus-table RLS and policy counts.
SELECT
  'H.01_TARGET_RLS' AS result_set,
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS force_rls,
  (SELECT count(*) FROM pg_catalog.pg_policy pol WHERE pol.polrelid = c.oid) AS policy_count
FROM pg_catalog.pg_class c
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN (
    'club_settings', 'membership_request_recipients', 'pages',
    'events', 'news', 'news_documents'
  )
  AND c.relkind IN ('r', 'p')
ORDER BY c.relname;

-- H.02 Exact policy inventory.
SELECT
  'H.02_TARGET_POLICIES' AS result_set,
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
    'club_settings', 'membership_request_recipients', 'pages',
    'events', 'news', 'news_documents'
  )
ORDER BY tablename, policyname;

-- H.03 Explicit table grants, including PUBLIC if present.
SELECT
  'H.03_TARGET_TABLE_GRANTS' AS result_set,
  table_name,
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN (
    'club_settings', 'membership_request_recipients', 'pages',
    'events', 'news', 'news_documents'
  )
  AND grantee IN ('PUBLIC', 'anon', 'authenticated', 'service_role')
ORDER BY table_name, grantee, privilege_type;

-- H.03A Explicit column grants, aggregated to avoid client export row limits.
SELECT
  'H.03A_TARGET_COLUMN_GRANTS' AS result_set,
  table_name,
  grantee,
  privilege_type,
  count(*) AS granted_column_count
FROM information_schema.role_column_grants
WHERE table_schema = 'public'
  AND table_name IN (
    'club_settings', 'membership_request_recipients', 'pages',
    'events', 'news', 'news_documents'
  )
  AND grantee IN ('PUBLIC', 'anon', 'authenticated', 'service_role')
GROUP BY table_name, grantee, privilege_type
ORDER BY table_name, grantee, privilege_type;

-- H.04 Effective Data-API privileges.
WITH targets(table_name) AS (
  VALUES
    ('club_settings'), ('membership_request_recipients'), ('pages'),
    ('events'), ('news'), ('news_documents')
),
roles(role_name) AS (
  SELECT rolname FROM pg_catalog.pg_roles
  WHERE rolname IN ('anon', 'authenticated', 'service_role')
)
SELECT
  'H.04_EFFECTIVE_PRIVILEGES' AS result_set,
  target.table_name,
  role.role_name,
  pg_catalog.has_table_privilege(role.role_name, 'public.' || target.table_name, 'SELECT') AS can_select,
  pg_catalog.has_table_privilege(role.role_name, 'public.' || target.table_name, 'INSERT') AS can_insert,
  pg_catalog.has_table_privilege(role.role_name, 'public.' || target.table_name, 'UPDATE') AS can_update,
  pg_catalog.has_table_privilege(role.role_name, 'public.' || target.table_name, 'DELETE') AS can_delete,
  pg_catalog.has_table_privilege(role.role_name, 'public.' || target.table_name, 'TRUNCATE') AS can_truncate,
  pg_catalog.has_table_privilege(role.role_name, 'public.' || target.table_name, 'REFERENCES') AS can_reference,
  pg_catalog.has_table_privilege(role.role_name, 'public.' || target.table_name, 'TRIGGER') AS can_trigger
FROM targets target
CROSS JOIN roles role
ORDER BY target.table_name, role.role_name;

-- H.05 SECURITY-DEFINER helper contract and ACL without treating PUBLIC as a role.
WITH eligible AS MATERIALIZED (
  SELECT p.oid, p.prokind, p.prosecdef, p.proconfig, p.proowner, p.proacl
  FROM pg_catalog.pg_proc p
  JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.prokind IN ('f', 'p')
    AND p.proname IN (
      'is_superadmin_actor',
      'current_admin_has_permission',
      'enforce_news_publication_transition',
      'cleanup_event_media_usage',
      'cleanup_news_media_usage',
      'cleanup_news_document_media_usage',
      'remove_entity',
      'synchronize_media_assignment',
      'synchronize_news_content_media_usages'
    )
),
definitions AS MATERIALIZED (
  SELECT e.*, pg_catalog.pg_get_functiondef(e.oid) AS function_definition
  FROM eligible e
)
SELECT
  'H.05_RELEVANT_ROUTINES' AS result_set,
  routine.oid::regprocedure::text AS signature,
  routine.prosecdef AS security_definer,
  pg_catalog.pg_get_userbyid(routine.proowner) AS owner,
  routine.proconfig,
  COALESCE((
    SELECT bool_or(acl.grantee = 0 AND acl.privilege_type = 'EXECUTE')
    FROM pg_catalog.aclexplode(COALESCE(
      routine.proacl,
      pg_catalog.acldefault('f', routine.proowner)
    )) acl
  ), false) AS public_execute,
  pg_catalog.has_function_privilege('anon', routine.oid, 'EXECUTE') AS anon_execute,
  pg_catalog.has_function_privilege('authenticated', routine.oid, 'EXECUTE') AS authenticated_execute,
  pg_catalog.has_function_privilege('service_role', routine.oid, 'EXECUTE') AS service_role_execute,
  routine.function_definition
FROM definitions routine
ORDER BY routine.oid::regprocedure::text;

-- H.05A News publication transition trigger and function linkage.
SELECT
  'H.05A_NEWS_PUBLICATION_TRIGGER' AS result_set,
  trigger_row.tgname AS trigger_name,
  trigger_row.tgenabled AS trigger_enabled,
  pg_catalog.pg_get_triggerdef(trigger_row.oid, true) AS trigger_definition,
  function_row.oid::regprocedure::text AS function_signature,
  function_row.prosecdef AS security_definer,
  pg_catalog.pg_get_userbyid(function_row.proowner) AS owner,
  function_row.proconfig,
  COALESCE((
    SELECT bool_or(acl.grantee = 0 AND acl.privilege_type = 'EXECUTE')
    FROM pg_catalog.aclexplode(COALESCE(
      function_row.proacl,
      pg_catalog.acldefault('f', function_row.proowner)
    )) acl
  ), false) AS public_execute,
  pg_catalog.has_function_privilege('anon', function_row.oid, 'EXECUTE') AS anon_execute,
  pg_catalog.has_function_privilege('authenticated', function_row.oid, 'EXECUTE') AS authenticated_execute,
  pg_catalog.has_function_privilege('service_role', function_row.oid, 'EXECUTE') AS service_role_execute
FROM pg_catalog.pg_trigger trigger_row
JOIN pg_catalog.pg_proc function_row ON function_row.oid = trigger_row.tgfoid
WHERE trigger_row.tgrelid = 'public.news'::regclass
  AND trigger_row.tgname = 'news_enforce_publication_transition'
  AND NOT trigger_row.tgisinternal;

-- H.06 Remaining public tables without RLS.
SELECT
  'H.06_REMAINING_RLS_DISABLED' AS result_set,
  c.relname AS table_name,
  pg_catalog.pg_get_userbyid(c.relowner) AS owner,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS force_rls
FROM pg_catalog.pg_class c
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind IN ('r', 'p')
  AND c.relrowsecurity IS FALSE
ORDER BY c.relname;

-- H.07 RLS-enabled tables without policies (expected server-only inventory).
SELECT
  'H.07_RLS_WITHOUT_POLICIES' AS result_set,
  c.relname AS table_name,
  pg_catalog.pg_get_userbyid(c.relowner) AS owner,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS force_rls
FROM pg_catalog.pg_class c
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind IN ('r', 'p')
  AND c.relrowsecurity IS TRUE
  AND NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_policy pol WHERE pol.polrelid = c.oid
  )
ORDER BY c.relname;

-- H.08 Aggregate closure. Expected: every boolean true.
SELECT
  NOT EXISTS (
    SELECT 1
    FROM (VALUES
      ('club_settings'), ('membership_request_recipients'), ('pages'),
      ('events'), ('news'), ('news_documents')
    ) target(table_name)
    JOIN pg_catalog.pg_class c ON c.relname = target.table_name
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'public'
    WHERE c.relrowsecurity IS FALSE OR c.relforcerowsecurity IS TRUE
  ) AS all_target_rls_enabled,
  NOT pg_catalog.has_table_privilege('anon', 'public.membership_request_recipients', 'SELECT')
    AND NOT pg_catalog.has_table_privilege('anon', 'public.membership_request_recipients', 'INSERT')
    AND NOT pg_catalog.has_table_privilege('anon', 'public.membership_request_recipients', 'UPDATE')
    AND NOT pg_catalog.has_table_privilege('anon', 'public.membership_request_recipients', 'DELETE')
    AS membership_routing_anon_denied,
  pg_catalog.has_table_privilege('anon', 'public.club_settings', 'SELECT')
    AND NOT pg_catalog.has_table_privilege('anon', 'public.club_settings', 'INSERT')
    AND NOT pg_catalog.has_table_privilege('anon', 'public.club_settings', 'UPDATE')
    AND NOT pg_catalog.has_table_privilege('anon', 'public.club_settings', 'DELETE')
    AS club_settings_anon_read_only,
  pg_catalog.has_table_privilege('anon', 'public.pages', 'SELECT')
    AND NOT pg_catalog.has_table_privilege('anon', 'public.pages', 'INSERT')
    AND NOT pg_catalog.has_table_privilege('anon', 'public.pages', 'UPDATE')
    AND NOT pg_catalog.has_table_privilege('anon', 'public.pages', 'DELETE')
    AS pages_anon_read_only,
  NOT pg_catalog.has_table_privilege('anon', 'public.events', 'INSERT')
    AND NOT pg_catalog.has_table_privilege('authenticated', 'public.events', 'INSERT')
    AND NOT pg_catalog.has_table_privilege('anon', 'public.news', 'INSERT')
    AND NOT pg_catalog.has_table_privilege('anon', 'public.news_documents', 'INSERT')
    AS unsafe_mutation_grants_removed,
  NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_proc p
    CROSS JOIN LATERAL pg_catalog.aclexplode(COALESCE(
      p.proacl, pg_catalog.acldefault('f', p.proowner)
    )) acl
    WHERE p.oid = 'public.is_superadmin_actor()'::regprocedure
      AND acl.grantee = 0
      AND acl.privilege_type = 'EXECUTE'
  ) AS superadmin_helper_public_execute_denied,
  (
    SELECT p.proconfig @> ARRAY['search_path=pg_catalog, public']::text[]
    FROM pg_catalog.pg_proc p
    WHERE p.oid = 'public.is_superadmin_actor()'::regprocedure
  ) AS superadmin_helper_search_path_hardened,
  EXISTS (
    SELECT 1
    FROM pg_catalog.pg_trigger trigger_row
    JOIN pg_catalog.pg_proc function_row ON function_row.oid = trigger_row.tgfoid
    WHERE trigger_row.tgrelid = 'public.news'::regclass
      AND trigger_row.tgname = 'news_enforce_publication_transition'
      AND trigger_row.tgenabled <> 'D'
      AND NOT trigger_row.tgisinternal
      AND function_row.oid = 'public.enforce_news_publication_transition()'::regprocedure
      AND function_row.prosecdef
      AND function_row.proconfig @> ARRAY['search_path=pg_catalog, public']::text[]
  ) AS news_publication_transition_guard_ok;
