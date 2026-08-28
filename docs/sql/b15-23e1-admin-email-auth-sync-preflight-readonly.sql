-- B15.23E1 – Admin email/auth synchronization live preflight
-- READ ONLY. Run manually in the Supabase SQL editor. Do not modify this file
-- into a migration and do not publish result rows containing personal data.

BEGIN TRANSACTION READ ONLY;

-- 1. Relevant relations and RLS state.
SELECT
  n.nspname AS schema_name,
  c.relname AS relation_name,
  c.relkind,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS force_rls
FROM pg_catalog.pg_class c
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname IN ('auth', 'public')
  AND c.relname IN (
    'users',
    'admin_profiles',
    'admin_user_roles',
    'admin_roles',
    'admin_role_permissions',
    'admin_permissions',
    'coaches',
    'board_members',
    'club_contacts',
    'notifications',
    'notification_deliveries',
    'membership_request_recipients',
    'membership_requests'
  )
ORDER BY n.nspname, c.relname;

-- 2. Relevant columns. No row values are returned.
SELECT
  table_schema,
  table_name,
  ordinal_position,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema IN ('auth', 'public')
  AND table_name IN (
    'users',
    'admin_profiles',
    'admin_user_roles',
    'admin_roles',
    'admin_role_permissions',
    'admin_permissions',
    'coaches',
    'board_members',
    'club_contacts',
    'notifications',
    'notification_deliveries',
    'membership_request_recipients',
    'membership_requests'
  )
ORDER BY table_schema, table_name, ordinal_position;

-- 3. Inventory every email-like column in auth/public without exposing values.
SELECT
  table_schema,
  table_name,
  ordinal_position,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema IN ('auth', 'public')
  AND column_name ILIKE '%email%'
ORDER BY table_schema, table_name, ordinal_position;

-- 4. Datensparse Auth/profile consistency counts.
SELECT
  (SELECT count(*) FROM auth.users) AS auth_users,
  (SELECT count(*) FROM public.admin_profiles) AS admin_profiles,
  (
    SELECT count(*)
    FROM auth.users u
    JOIN public.admin_profiles p ON p.id = u.id
  ) AS id_matches,
  (
    SELECT count(*)
    FROM public.admin_profiles p
    LEFT JOIN auth.users u ON u.id = p.id
    WHERE u.id IS NULL
  ) AS profiles_without_auth_user,
  (
    SELECT count(*)
    FROM auth.users u
    LEFT JOIN public.admin_profiles p ON p.id = u.id
    WHERE p.id IS NULL
  ) AS auth_users_without_profile,
  (
    SELECT count(*)
    FROM auth.users u
    JOIN public.admin_profiles p ON p.id = u.id
    WHERE lower(btrim(coalesce(u.email, '')))
      IS DISTINCT FROM lower(btrim(coalesce(p.email, '')))
  ) AS id_matched_email_mismatches,
  (
    SELECT count(*)
    FROM auth.users u
    JOIN public.admin_profiles p
      ON lower(btrim(coalesce(u.email, ''))) = lower(btrim(coalesce(p.email, '')))
    WHERE u.id <> p.id
      AND nullif(btrim(coalesce(u.email, '')), '') IS NOT NULL
  ) AS same_email_different_id;

-- 5. Case-insensitive duplicate/conflict counts only.
SELECT
  (
    SELECT count(*)
    FROM (
      SELECT lower(btrim(email))
      FROM auth.users
      WHERE nullif(btrim(coalesce(email, '')), '') IS NOT NULL
      GROUP BY lower(btrim(email))
      HAVING count(*) > 1
    ) duplicate_auth_email
  ) AS duplicate_auth_emails_case_insensitive,
  (
    SELECT count(*)
    FROM (
      SELECT lower(btrim(email))
      FROM public.admin_profiles
      WHERE nullif(btrim(coalesce(email, '')), '') IS NOT NULL
      GROUP BY lower(btrim(email))
      HAVING count(*) > 1
    ) duplicate_profile_email
  ) AS duplicate_profile_emails_case_insensitive,
  (
    SELECT count(*)
    FROM public.admin_profiles p1
    JOIN public.admin_profiles p2
      ON p1.id < p2.id
     AND lower(btrim(coalesce(p1.email, ''))) = lower(btrim(coalesce(p2.email, '')))
    WHERE nullif(btrim(coalesce(p1.email, '')), '') IS NOT NULL
  ) AS conflicting_profile_pairs_case_insensitive;

-- 6. Constraints and indexes governing IDs and email addresses.
SELECT
  n.nspname AS schema_name,
  c.relname AS table_name,
  con.conname AS constraint_name,
  con.contype,
  pg_get_constraintdef(con.oid, true) AS definition
FROM pg_catalog.pg_constraint con
JOIN pg_catalog.pg_class c ON c.oid = con.conrelid
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname IN ('auth', 'public')
  AND c.relname IN ('users', 'admin_profiles', 'admin_user_roles', 'coaches', 'board_members')
  AND (
    pg_get_constraintdef(con.oid, true) ILIKE '%email%'
    OR pg_get_constraintdef(con.oid, true) ILIKE '%id%'
  )
ORDER BY n.nspname, c.relname, con.conname;

SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_catalog.pg_indexes
WHERE schemaname IN ('auth', 'public')
  AND tablename IN ('users', 'admin_profiles', 'admin_user_roles', 'coaches', 'board_members')
  AND (indexdef ILIKE '%email%' OR indexdef ILIKE '%id%')
ORDER BY schemaname, tablename, indexname;

-- 7. Stable UUID/FK contracts for roles and person links.
SELECT
  n.nspname AS schema_name,
  c.relname AS table_name,
  con.conname AS constraint_name,
  pg_get_constraintdef(con.oid, true) AS definition
FROM pg_catalog.pg_constraint con
JOIN pg_catalog.pg_class c ON c.oid = con.conrelid
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN (
    'admin_profiles',
    'admin_user_roles',
    'coaches',
    'board_members',
    'notifications',
    'notification_deliveries'
  )
  AND con.contype IN ('p', 'f', 'u')
ORDER BY c.relname, con.conname;

-- 8. Table and column grants for browser and service roles.
SELECT
  grantee,
  table_schema,
  table_name,
  privilege_type,
  is_grantable
FROM information_schema.role_table_grants
WHERE grantee IN ('anon', 'authenticated', 'service_role')
  AND table_schema IN ('auth', 'public')
  AND table_name IN (
    'users',
    'admin_profiles',
    'admin_user_roles',
    'admin_roles',
    'admin_role_permissions',
    'admin_permissions',
    'coaches',
    'board_members',
    'club_contacts',
    'notifications',
    'notification_deliveries',
    'membership_request_recipients',
    'membership_requests'
  )
ORDER BY grantee, table_schema, table_name, privilege_type;

SELECT
  grantee,
  table_schema,
  table_name,
  column_name,
  privilege_type
FROM information_schema.role_column_grants
WHERE grantee IN ('anon', 'authenticated', 'service_role')
  AND table_schema = 'public'
  AND table_name IN (
    'admin_profiles',
    'admin_user_roles',
    'coaches',
    'board_members',
    'club_contacts',
    'notifications',
    'notification_deliveries',
    'membership_request_recipients',
    'membership_requests'
  )
  AND (column_name ILIKE '%email%' OR table_name = 'admin_profiles')
ORDER BY grantee, table_name, column_name, privilege_type;

WITH inspected_roles(role_name) AS (
  VALUES ('anon'), ('authenticated'), ('service_role')
), inspected_relations(relation_name) AS (
  VALUES
    ('public.admin_profiles'),
    ('public.admin_user_roles'),
    ('public.coaches'),
    ('public.board_members'),
    ('public.club_contacts'),
    ('public.notifications'),
    ('public.notification_deliveries'),
    ('public.membership_request_recipients'),
    ('public.membership_requests')
), inspected_privileges(privilege_name) AS (
  VALUES ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE'), ('TRUNCATE'), ('REFERENCES'), ('TRIGGER')
)
SELECT
  role_name,
  relation_name,
  privilege_name,
  CASE
    WHEN to_regclass(relation_name) IS NULL THEN NULL
    ELSE has_table_privilege(role_name, relation_name, privilege_name)
  END AS effective_privilege
FROM inspected_roles
CROSS JOIN inspected_relations
CROSS JOIN inspected_privileges
ORDER BY role_name, relation_name, privilege_name;

-- 9. Every live policy containing email/JWT fallback logic.
WITH email_policies AS MATERIALIZED (
  SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
  FROM pg_catalog.pg_policies
  WHERE coalesce(qual, '') ILIKE ANY (ARRAY[
      '%email%',
      '%auth.jwt%'
    ])
     OR coalesce(with_check, '') ILIKE ANY (ARRAY[
      '%email%',
      '%auth.jwt%'
    ])
)
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check,
  CASE
    WHEN coalesce(qual, '') ILIKE '%auth.jwt%email%'
      OR coalesce(with_check, '') ILIKE '%auth.jwt%email%'
      THEN true
    ELSE false
  END AS jwt_email_dependent
FROM email_policies
ORDER BY schemaname, tablename, policyname;

SELECT
  count(*) AS email_or_jwt_policy_count,
  count(*) FILTER (
    WHERE coalesce(qual, '') ILIKE '%auth.jwt%email%'
       OR coalesce(with_check, '') ILIKE '%auth.jwt%email%'
  ) AS jwt_email_policy_count
FROM pg_catalog.pg_policies
WHERE coalesce(qual, '') ILIKE ANY (ARRAY['%email%', '%auth.jwt%'])
   OR coalesce(with_check, '') ILIKE ANY (ARRAY['%email%', '%auth.jwt%']);

-- 10. Functions/procedures containing email, JWT or recipient resolution.
-- MATERIALIZED eligibility prevents pg_get_functiondef from ever receiving
-- aggregates, window functions or other unsuitable pg_proc entries.
WITH eligible_routines AS MATERIALIZED (
  SELECT
    p.oid,
    n.nspname AS schema_name,
    p.proname,
    p.prosecdef,
    p.proowner,
    p.proacl,
    p.proconfig,
    p.prokind
  FROM pg_catalog.pg_proc p
  JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
  WHERE p.prokind IN ('f', 'p')
    AND n.nspname NOT IN ('pg_catalog', 'information_schema')
), routine_definitions AS MATERIALIZED (
  SELECT
    e.*,
    e.oid::regprocedure::text AS signature,
    pg_get_functiondef(e.oid) AS definition
  FROM eligible_routines e
), matching_routines AS MATERIALIZED (
  SELECT *
  FROM routine_definitions
  WHERE definition ILIKE ANY (ARRAY[
    '%auth.jwt%',
    '%admin_profiles%email%',
    '%auth.users%email%',
    '%recipient%email%',
    '% email%'
  ])
)
SELECT
  r.signature,
  r.schema_name,
  r.prosecdef AS security_definer,
  owner_role.rolname AS owner,
  r.proconfig,
  r.definition
FROM matching_routines r
JOIN pg_catalog.pg_roles owner_role ON owner_role.oid = r.proowner
ORDER BY r.signature;

WITH eligible_routines AS MATERIALIZED (
  SELECT p.oid, p.proowner
  FROM pg_catalog.pg_proc p
  JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
  WHERE p.prokind IN ('f', 'p')
    AND n.nspname NOT IN ('pg_catalog', 'information_schema')
), routine_definitions AS MATERIALIZED (
  SELECT
    e.oid,
    e.oid::regprocedure::text AS signature,
    pg_get_functiondef(e.oid) AS definition
  FROM eligible_routines e
), matching_routines AS MATERIALIZED (
  SELECT *
  FROM routine_definitions
  WHERE definition ILIKE ANY (ARRAY[
    '%auth.jwt%',
    '%admin_profiles%email%',
    '%auth.users%email%',
    '%recipient%email%',
    '% email%'
  ])
), inspected_roles AS MATERIALIZED (
  SELECT oid, rolname
  FROM pg_catalog.pg_roles
  WHERE rolname IN ('anon', 'authenticated', 'service_role')
)
SELECT
  r.signature,
  role.rolname,
  has_function_privilege(role.oid, r.oid, 'EXECUTE') AS effective_execute
FROM matching_routines r
CROSS JOIN inspected_roles role
ORDER BY r.signature, role.rolname;

-- 11. Trigger inventory and email-dependent trigger functions.
WITH trigger_inventory AS MATERIALIZED (
  SELECT
    t.oid,
    n.nspname AS table_schema,
    c.relname AS table_name,
    t.tgname AS trigger_name,
    t.tgfoid,
    pg_get_triggerdef(t.oid, true) AS trigger_definition
  FROM pg_catalog.pg_trigger t
  JOIN pg_catalog.pg_class c ON c.oid = t.tgrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE NOT t.tgisinternal
    AND n.nspname IN ('auth', 'public')
), eligible_trigger_functions AS MATERIALIZED (
  SELECT p.oid
  FROM pg_catalog.pg_proc p
  WHERE p.prokind = 'f'
), trigger_function_definitions AS MATERIALIZED (
  SELECT e.oid, pg_get_functiondef(e.oid) AS function_definition
  FROM eligible_trigger_functions e
)
SELECT
  t.table_schema,
  t.table_name,
  t.trigger_name,
  t.trigger_definition,
  f.function_definition
FROM trigger_inventory t
JOIN trigger_function_definitions f ON f.oid = t.tgfoid
WHERE t.table_name IN ('users', 'admin_profiles')
   OR t.trigger_definition ILIKE '%email%'
   OR f.function_definition ILIKE '%email%'
ORDER BY t.table_schema, t.table_name, t.trigger_name;

-- 12. Views, materialized views and rules with email dependencies.
SELECT
  schemaname,
  viewname,
  viewowner,
  definition
FROM pg_catalog.pg_views
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
  AND definition ILIKE '%email%'
ORDER BY schemaname, viewname;

SELECT
  schemaname,
  matviewname,
  matviewowner,
  definition
FROM pg_catalog.pg_matviews
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
  AND definition ILIKE '%email%'
ORDER BY schemaname, matviewname;

SELECT
  schemaname,
  tablename,
  rulename,
  definition
FROM pg_catalog.pg_rules
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
  AND definition ILIKE '%email%'
ORDER BY schemaname, tablename, rulename;

-- 13. Aggregate stability inventory. No UUIDs or personal values are emitted.
SELECT
  (SELECT count(*) FROM public.admin_user_roles) AS role_links,
  (SELECT count(*) FROM public.coaches WHERE admin_profile_id IS NOT NULL) AS linked_coaches,
  (SELECT count(*) FROM public.board_members WHERE admin_profile_id IS NOT NULL) AS linked_board_members,
  (SELECT count(*) FROM public.admin_profiles WHERE nickname IS NOT NULL) AS profiles_with_nickname,
  (SELECT count(*) FROM public.admin_profiles WHERE phone IS NOT NULL) AS profiles_with_phone,
  (
    SELECT count(*)
    FROM public.admin_profiles
    WHERE profile_image_media_asset_id IS NOT NULL
  ) AS profiles_with_avatar,
  (SELECT count(*) FROM public.notifications) AS notifications,
  (SELECT count(*) FROM public.notification_deliveries) AS notification_deliveries;

-- 14. Auth email settings such as Secure Email Change are managed outside the
-- SQL-visible application schema. Confirm manually in Supabase Dashboard:
-- Authentication -> Providers -> Email:
--   * whether users may update their own email,
--   * Secure Email Change / dual confirmation,
--   * confirmation requirements and redirect URLs.

ROLLBACK;
