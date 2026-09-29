-- B15.25 Support Tickets V1 - atomic server-only RPC preflight (READ ONLY)
-- Manual execution only: run exactly once in the Supabase SQL Editor with
-- "No limit" and export the single result set as one CSV file.
--
-- Privacy contract:
-- - technical catalog metadata and aggregate counts only
-- - no ticket subjects, messages, metadata payloads or identifiers
-- - no names, e-mail addresses, phone numbers, auth metadata or tokens
-- - no sequence advancement (nextval/setval are deliberately absent)

WITH
planned_rpc_names(function_name) AS (
  VALUES
    ('create_support_ticket_atomic'::text),
    ('append_support_ticket_reply_atomic'::text),
    ('mutate_support_ticket_admin_atomic'::text)
),
ticket_relations(relation_name) AS (
  VALUES
    ('support_tickets'::text),
    ('support_ticket_messages'::text),
    ('support_ticket_events'::text)
),
expected_relation_acl(relation_name, expected_privileges) AS (
  VALUES
    ('support_tickets'::text, ARRAY['INSERT', 'SELECT', 'UPDATE']::text[]),
    ('support_ticket_messages'::text, ARRAY['INSERT', 'SELECT']::text[]),
    ('support_ticket_events'::text, ARRAY['INSERT', 'SELECT']::text[])
),
all_blocks(result_block, result_order) AS (
  VALUES
    ('STRP.01_PLANNED_RPC_NAME_CONFLICTS'::text, 10),
    ('STRP.02_TICKET_TABLE_COLUMNS'::text, 20),
    ('STRP.03_TICKET_CONSTRAINTS'::text, 30),
    ('STRP.04_TICKET_TRIGGERS'::text, 40),
    ('STRP.05_TICKET_NUMBER_SEQUENCE'::text, 50),
    ('STRP.06_ADMIN_PROFILE_IDENTITY'::text, 60),
    ('STRP.07_DEPARTMENT_TEAM_SCOPE'::text, 70),
    ('STRP.08_EVENT_CONTRACT'::text, 80),
    ('STRP.09_REFERENCE_FUNCTION_PATTERNS'::text, 90),
    ('STRP.10_FUNCTION_EXECUTE_ACL'::text, 100),
    ('STRP.11_DEFAULT_FUNCTION_ACL'::text, 110),
    ('STRP.12_SERVICE_ROLE_RELATION_ACL'::text, 120),
    ('STRP.13_TICKET_DATA_COUNTS'::text, 130),
    ('STRP.14_RLS_AND_POLICIES'::text, 140),
    ('STRP.15_BROWSER_RELATION_ACCESS'::text, 150),
    ('STRP.16_SUPABASE_ROLES'::text, 160),
    ('STRP.17_STRUCTURAL_INTEGRITY'::text, 170),
    ('STRP.18_RPC_DESIGN_FACTS'::text, 180),
    ('STRP.19_SUMMARY'::text, 190)
),
relation_acl AS (
  SELECT
    c.relname AS relation_name,
    CASE WHEN acl.grantee = 0 THEN 'PUBLIC' ELSE grantee.rolname END AS grantee_name,
    acl.privilege_type,
    acl.is_grantable
  FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  CROSS JOIN LATERAL pg_catalog.aclexplode(
    coalesce(c.relacl, pg_catalog.acldefault(CASE WHEN c.relkind = 'S' THEN 'S'::"char" ELSE 'r'::"char" END, c.relowner))
  ) acl
  LEFT JOIN pg_catalog.pg_roles grantee ON grantee.oid = acl.grantee
  WHERE n.nspname = 'public'
    AND c.relname IN (
      'support_tickets', 'support_ticket_messages', 'support_ticket_events',
      'support_ticket_number_seq'
    )
),
service_role_acl_summary AS (
  SELECT e.relation_name,
    coalesce(
      array_agg(a.privilege_type ORDER BY a.privilege_type)
        FILTER (WHERE a.privilege_type IS NOT NULL),
      ARRAY[]::text[]
    ) AS actual_privileges,
    e.expected_privileges,
    count(*) FILTER (WHERE a.is_grantable)::bigint AS grantable_privilege_count
  FROM expected_relation_acl e
  LEFT JOIN relation_acl a
    ON a.relation_name = e.relation_name
   AND a.grantee_name = 'service_role'
  GROUP BY e.relation_name, e.expected_privileges
),
sequence_service_role_acl AS (
  SELECT
    coalesce(
      array_agg(privilege_type ORDER BY privilege_type)
        FILTER (WHERE privilege_type IS NOT NULL),
      ARRAY[]::text[]
    ) AS actual_privileges,
    count(*) FILTER (WHERE is_grantable)::bigint AS grantable_privilege_count
  FROM relation_acl
  WHERE relation_name = 'support_ticket_number_seq'
    AND grantee_name = 'service_role'
),
support_relation_state AS (
  SELECT c.relname AS relation_name, c.relkind,
    c.relrowsecurity, c.relforcerowsecurity,
    owner_role.rolname AS owner_name
  FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_catalog.pg_roles owner_role ON owner_role.oid = c.relowner
  WHERE n.nspname = 'public'
    AND c.relname IN (
      'support_tickets', 'support_ticket_messages', 'support_ticket_events',
      'support_ticket_number_seq'
    )
),
planned_conflicts AS (
  SELECT n.nspname AS schema_name, p.proname AS function_name,
    pg_catalog.pg_get_function_identity_arguments(p.oid) AS identity_arguments,
    pg_catalog.pg_get_function_result(p.oid) AS return_type,
    owner_role.rolname AS owner_name,
    p.prosecdef AS security_definer,
    p.proacl
  FROM pg_catalog.pg_proc p
  JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
  JOIN pg_catalog.pg_roles owner_role ON owner_role.oid = p.proowner
  WHERE p.proname IN (SELECT function_name FROM planned_rpc_names)
),
actual_rows AS (
  -- STRP.01: potential overload/name conflicts for the three provisional RPC names.
  SELECT 'STRP.01_PLANNED_RPC_NAME_CONFLICTS'::text AS result_block, 10 AS result_order,
    row_number() OVER (ORDER BY schema_name, function_name, identity_arguments)::bigint AS row_order,
    'function'::text AS row_type,
    jsonb_build_object(
      'schema_name', schema_name,
      'function_name', function_name,
      'identity_arguments', identity_arguments,
      'return_type', return_type,
      'owner', owner_name,
      'security_definer', security_definer,
      'acl_is_explicit', proacl IS NOT NULL
    ) AS data
  FROM planned_conflicts

  UNION ALL

  -- STRP.02: complete live column contract of all three support tables.
  SELECT 'STRP.02_TICKET_TABLE_COLUMNS', 20,
    row_number() OVER (ORDER BY table_name, ordinal_position)::bigint,
    'column',
    jsonb_build_object(
      'table_schema', table_schema,
      'table_name', table_name,
      'ordinal_position', ordinal_position,
      'column_name', column_name,
      'data_type', data_type,
      'udt_name', udt_name,
      'is_nullable', is_nullable,
      'column_default', column_default,
      'is_identity', is_identity,
      'identity_generation', identity_generation,
      'is_generated', is_generated,
      'generation_expression', generation_expression
    )
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name IN (SELECT relation_name FROM ticket_relations)

  UNION ALL

  -- STRP.03: PK, FK, CHECK and UNIQUE constraints including update/delete actions.
  SELECT 'STRP.03_TICKET_CONSTRAINTS', 30,
    row_number() OVER (ORDER BY c.relname, con.contype, con.conname)::bigint,
    'constraint',
    jsonb_build_object(
      'table_schema', n.nspname,
      'table_name', c.relname,
      'constraint_name', con.conname,
      'constraint_type', CASE con.contype
        WHEN 'p' THEN 'PRIMARY KEY' WHEN 'f' THEN 'FOREIGN KEY'
        WHEN 'u' THEN 'UNIQUE' WHEN 'c' THEN 'CHECK'
        WHEN 'x' THEN 'EXCLUDE' ELSE con.contype::text END,
      'definition', pg_catalog.pg_get_constraintdef(con.oid, true),
      'referenced_schema', target_n.nspname,
      'referenced_table', target_c.relname,
      'on_update', CASE con.confupdtype
        WHEN 'a' THEN 'NO ACTION' WHEN 'r' THEN 'RESTRICT'
        WHEN 'c' THEN 'CASCADE' WHEN 'n' THEN 'SET NULL'
        WHEN 'd' THEN 'SET DEFAULT' ELSE NULL END,
      'on_delete', CASE con.confdeltype
        WHEN 'a' THEN 'NO ACTION' WHEN 'r' THEN 'RESTRICT'
        WHEN 'c' THEN 'CASCADE' WHEN 'n' THEN 'SET NULL'
        WHEN 'd' THEN 'SET DEFAULT' ELSE NULL END,
      'validated', con.convalidated,
      'deferrable', con.condeferrable,
      'initially_deferred', con.condeferred
    )
  FROM pg_catalog.pg_constraint con
  JOIN pg_catalog.pg_class c ON c.oid = con.conrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  LEFT JOIN pg_catalog.pg_class target_c ON target_c.oid = con.confrelid
  LEFT JOIN pg_catalog.pg_namespace target_n ON target_n.oid = target_c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname IN (SELECT relation_name FROM ticket_relations)

  UNION ALL

  -- STRP.04: trigger side effects and called-function security metadata.
  SELECT 'STRP.04_TICKET_TRIGGERS', 40,
    row_number() OVER (ORDER BY c.relname, t.tgname)::bigint,
    'trigger',
    jsonb_build_object(
      'table_schema', n.nspname,
      'table_name', c.relname,
      'trigger_name', t.tgname,
      'enabled', t.tgenabled::text,
      'definition', pg_catalog.pg_get_triggerdef(t.oid, true),
      'function_schema', fn_n.nspname,
      'function_name', p.proname,
      'function_identity_arguments', pg_catalog.pg_get_function_identity_arguments(p.oid),
      'function_owner', owner_role.rolname,
      'function_security_definer', p.prosecdef,
      'function_config', coalesce(to_jsonb(p.proconfig), '[]'::jsonb)
    )
  FROM pg_catalog.pg_trigger t
  JOIN pg_catalog.pg_class c ON c.oid = t.tgrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_catalog.pg_proc p ON p.oid = t.tgfoid
  JOIN pg_catalog.pg_namespace fn_n ON fn_n.oid = p.pronamespace
  JOIN pg_catalog.pg_roles owner_role ON owner_role.oid = p.proowner
  WHERE NOT t.tgisinternal
    AND n.nspname = 'public'
    AND c.relname IN (SELECT relation_name FROM ticket_relations)

  UNION ALL

  -- STRP.05: sequence contract and ticket_number default without advancing it.
  SELECT 'STRP.05_TICKET_NUMBER_SEQUENCE', 50, 1, 'sequence',
    jsonb_build_object(
      'sequence_schema', n.nspname,
      'sequence_name', c.relname,
      'exists', true,
      'owner', owner_role.rolname,
      'data_type', s.data_type::text,
      'start_value', s.start_value,
      'minimum_value', s.min_value,
      'maximum_value', s.max_value,
      'increment', s.increment_by,
      'cycle_option', s.cycle,
      'cache_size', s.cache_size,
      'acl_is_explicit', c.relacl IS NOT NULL
    )
  FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_catalog.pg_roles owner_role ON owner_role.oid = c.relowner
  JOIN pg_catalog.pg_sequences s
    ON s.schemaname = n.nspname AND s.sequencename = c.relname
  WHERE n.nspname = 'public'
    AND c.relname = 'support_ticket_number_seq'
    AND c.relkind = 'S'

  UNION ALL

  SELECT 'STRP.05_TICKET_NUMBER_SEQUENCE', 50, 2, 'ticket_number_default',
    jsonb_build_object(
      'table_schema', table_schema,
      'table_name', table_name,
      'column_name', column_name,
      'column_default', column_default,
      'uses_support_ticket_number_sequence',
        coalesce(column_default, '') LIKE '%support_ticket_number_seq%'
    )
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'support_tickets'
    AND column_name = 'ticket_number'

  UNION ALL

  SELECT 'STRP.05_TICKET_NUMBER_SEQUENCE', 50,
    (100 + row_number() OVER (ORDER BY grantee_name, privilege_type))::bigint,
    'sequence_acl',
    jsonb_build_object(
      'grantee', grantee_name,
      'privilege_type', privilege_type,
      'is_grantable', is_grantable
    )
  FROM relation_acl
  WHERE relation_name = 'support_ticket_number_seq'
    AND grantee_name IN ('PUBLIC', 'anon', 'authenticated', 'service_role')

  UNION ALL

  -- STRP.06: profile/auth identity shape, FKs and privacy-safe integrity counts.
  SELECT 'STRP.06_ADMIN_PROFILE_IDENTITY', 60,
    row_number() OVER (ORDER BY table_schema, table_name, ordinal_position)::bigint,
    'identity_column',
    jsonb_build_object(
      'table_schema', table_schema,
      'table_name', table_name,
      'column_name', column_name,
      'data_type', data_type,
      'udt_name', udt_name,
      'is_nullable', is_nullable,
      'column_default', column_default
    )
  FROM information_schema.columns
  WHERE (table_schema = 'public' AND table_name = 'admin_profiles'
         AND column_name IN ('id', 'is_active'))
     OR (table_schema = 'auth' AND table_name = 'users' AND column_name = 'id')

  UNION ALL

  SELECT 'STRP.06_ADMIN_PROFILE_IDENTITY', 60,
    (100 + row_number() OVER (ORDER BY c.relname, con.conname))::bigint,
    'profile_foreign_key',
    jsonb_build_object(
      'source_table', c.relname,
      'constraint_name', con.conname,
      'definition', pg_catalog.pg_get_constraintdef(con.oid, true)
    )
  FROM pg_catalog.pg_constraint con
  JOIN pg_catalog.pg_class c ON c.oid = con.conrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_catalog.pg_class target_c ON target_c.oid = con.confrelid
  JOIN pg_catalog.pg_namespace target_n ON target_n.oid = target_c.relnamespace
  WHERE con.contype = 'f'
    AND n.nspname = 'public'
    AND c.relname IN (SELECT relation_name FROM ticket_relations)
    AND target_n.nspname = 'public'
    AND target_c.relname = 'admin_profiles'

  UNION ALL

  SELECT 'STRP.06_ADMIN_PROFILE_IDENTITY', 60, 9001, 'aggregate',
    jsonb_build_object(
      'admin_profile_count', (SELECT count(*) FROM public.admin_profiles),
      'active_admin_profile_count',
        (SELECT count(*) FROM public.admin_profiles WHERE is_active IS TRUE),
      'auth_user_count', (SELECT count(*) FROM auth.users),
      'profiles_without_matching_auth_user', (
        SELECT count(*) FROM public.admin_profiles p
        LEFT JOIN auth.users u ON u.id = p.id
        WHERE u.id IS NULL
      ),
      'auth_users_without_matching_profile', (
        SELECT count(*) FROM auth.users u
        LEFT JOIN public.admin_profiles p ON p.id = u.id
        WHERE p.id IS NULL
      )
    )

  UNION ALL

  -- STRP.07: department/team schema and FK paths usable for scope consistency.
  SELECT 'STRP.07_DEPARTMENT_TEAM_SCOPE', 70,
    row_number() OVER (ORDER BY table_name, ordinal_position)::bigint,
    'scope_column',
    jsonb_build_object(
      'table_name', table_name,
      'column_name', column_name,
      'data_type', data_type,
      'udt_name', udt_name,
      'is_nullable', is_nullable,
      'column_default', column_default
    )
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name IN ('departments', 'teams', 'support_tickets')
    AND column_name IN (
      'id', 'department_id', 'team_id', 'is_active', 'slug', 'area_key'
    )

  UNION ALL

  SELECT 'STRP.07_DEPARTMENT_TEAM_SCOPE', 70,
    (100 + row_number() OVER (ORDER BY c.relname, con.conname))::bigint,
    'scope_foreign_key',
    jsonb_build_object(
      'source_table', c.relname,
      'constraint_name', con.conname,
      'target_schema', target_n.nspname,
      'target_table', target_c.relname,
      'definition', pg_catalog.pg_get_constraintdef(con.oid, true)
    )
  FROM pg_catalog.pg_constraint con
  JOIN pg_catalog.pg_class c ON c.oid = con.conrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_catalog.pg_class target_c ON target_c.oid = con.confrelid
  JOIN pg_catalog.pg_namespace target_n ON target_n.oid = target_c.relnamespace
  WHERE con.contype = 'f'
    AND n.nspname = 'public'
    AND c.relname IN ('teams', 'support_tickets')
    AND target_n.nspname = 'public'
    AND target_c.relname IN ('departments', 'teams')

  UNION ALL

  SELECT 'STRP.07_DEPARTMENT_TEAM_SCOPE', 70, 9001, 'aggregate',
    jsonb_build_object(
      'department_count', (SELECT count(*) FROM public.departments),
      'team_count', (SELECT count(*) FROM public.teams),
      'active_department_count',
        (SELECT count(*) FROM public.departments WHERE is_active IS TRUE),
      'active_team_count',
        (SELECT count(*) FROM public.teams WHERE is_active IS TRUE)
    )

  UNION ALL

  -- STRP.08: event columns and checks define valid event/metadata inputs.
  SELECT 'STRP.08_EVENT_CONTRACT', 80,
    row_number() OVER (ORDER BY ordinal_position)::bigint,
    'event_column',
    jsonb_build_object(
      'column_name', column_name,
      'data_type', data_type,
      'udt_name', udt_name,
      'is_nullable', is_nullable,
      'column_default', column_default
    )
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'support_ticket_events'

  UNION ALL

  SELECT 'STRP.08_EVENT_CONTRACT', 80,
    (100 + row_number() OVER (ORDER BY con.conname))::bigint,
    'event_constraint',
    jsonb_build_object(
      'constraint_name', con.conname,
      'constraint_type', con.contype::text,
      'definition', pg_catalog.pg_get_constraintdef(con.oid, true)
    )
  FROM pg_catalog.pg_constraint con
  JOIN pg_catalog.pg_class c ON c.oid = con.conrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname = 'support_ticket_events'

  UNION ALL

  -- STRP.09: compact metadata for existing writing/security-definer RPC patterns.
  SELECT 'STRP.09_REFERENCE_FUNCTION_PATTERNS', 90,
    row_number() OVER (
      ORDER BY n.nspname, p.proname,
        pg_catalog.pg_get_function_identity_arguments(p.oid)
    )::bigint,
    'function_pattern',
    jsonb_build_object(
      'schema_name', n.nspname,
      'function_name', p.proname,
      'identity_arguments', pg_catalog.pg_get_function_identity_arguments(p.oid),
      'return_type', pg_catalog.pg_get_function_result(p.oid),
      'language', lang.lanname,
      'owner', owner_role.rolname,
      'security_definer', p.prosecdef,
      'volatility', p.provolatile::text,
      'parallel_safety', p.proparallel::text,
      'function_config', coalesce(to_jsonb(p.proconfig), '[]'::jsonb),
      'acl_is_explicit', p.proacl IS NOT NULL
    )
  FROM pg_catalog.pg_proc p
  JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
  JOIN pg_catalog.pg_language lang ON lang.oid = p.prolang
  JOIN pg_catalog.pg_roles owner_role ON owner_role.oid = p.proowner
  WHERE n.nspname = 'public'
    AND p.prokind = 'f'
    AND (
      p.prosecdef
      OR p.proname ~* '(append|create|insert|replace|synchron|mutat|update|claim)'
      OR p.proname = 'touch_support_ticket_from_message'
    )

  UNION ALL

  -- STRP.10: effective EXECUTE ACL for relevant functions and planned conflicts.
  SELECT 'STRP.10_FUNCTION_EXECUTE_ACL', 100,
    row_number() OVER (
      ORDER BY n.nspname, p.proname,
        pg_catalog.pg_get_function_identity_arguments(p.oid),
        CASE WHEN acl.grantee = 0 THEN 'PUBLIC' ELSE grantee.rolname END
    )::bigint,
    'execute_acl',
    jsonb_build_object(
      'schema_name', n.nspname,
      'function_name', p.proname,
      'identity_arguments', pg_catalog.pg_get_function_identity_arguments(p.oid),
      'grantee', CASE WHEN acl.grantee = 0 THEN 'PUBLIC' ELSE grantee.rolname END,
      'privilege_type', acl.privilege_type,
      'is_grantable', acl.is_grantable,
      'acl_source', CASE WHEN p.proacl IS NULL THEN 'owner_default' ELSE 'explicit' END
    )
  FROM pg_catalog.pg_proc p
  JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
  CROSS JOIN LATERAL pg_catalog.aclexplode(
    coalesce(p.proacl, pg_catalog.acldefault('f', p.proowner))
  ) acl
  LEFT JOIN pg_catalog.pg_roles grantee ON grantee.oid = acl.grantee
  WHERE n.nspname = 'public'
    AND acl.privilege_type = 'EXECUTE'
    AND (acl.grantee = 0 OR grantee.rolname IN ('anon', 'authenticated', 'service_role'))
    AND (
      p.prosecdef
      OR p.proname = 'touch_support_ticket_from_message'
      OR p.proname IN (SELECT function_name FROM planned_rpc_names)
    )

  UNION ALL

  -- STRP.11: postgres function default privileges, especially implicit PUBLIC EXECUTE.
  SELECT 'STRP.11_DEFAULT_FUNCTION_ACL', 110,
    row_number() OVER (
      ORDER BY owner_role.rolname, coalesce(n.nspname, ''),
        CASE WHEN acl.grantee = 0 THEN 'PUBLIC' ELSE grantee.rolname END
    )::bigint,
    'default_function_acl',
    jsonb_build_object(
      'owner', owner_role.rolname,
      'schema_name', n.nspname,
      'grantee', CASE WHEN acl.grantee = 0 THEN 'PUBLIC' ELSE grantee.rolname END,
      'privilege_type', acl.privilege_type,
      'is_grantable', acl.is_grantable
    )
  FROM pg_catalog.pg_default_acl d
  JOIN pg_catalog.pg_roles owner_role ON owner_role.oid = d.defaclrole
  LEFT JOIN pg_catalog.pg_namespace n ON n.oid = d.defaclnamespace
  CROSS JOIN LATERAL pg_catalog.aclexplode(d.defaclacl) acl
  LEFT JOIN pg_catalog.pg_roles grantee ON grantee.oid = acl.grantee
  WHERE d.defaclobjtype = 'f'
    AND owner_role.rolname = 'postgres'
    AND (acl.grantee = 0 OR grantee.rolname IN ('anon', 'authenticated', 'service_role'))

  UNION ALL

  SELECT 'STRP.11_DEFAULT_FUNCTION_ACL', 110, 9001, 'built_in_function_default',
    jsonb_build_object(
      'owner', 'postgres',
      'grantee', 'PUBLIC',
      'privilege_type', 'EXECUTE',
      'built_in_default_applies_when_not_overridden', true,
      'explicit_post_create_acl_hardening_required', true
    )

  UNION ALL

  -- STRP.12: current hardened table and sequence privileges for service_role.
  SELECT 'STRP.12_SERVICE_ROLE_RELATION_ACL', 120,
    row_number() OVER (ORDER BY relation_name, privilege_type)::bigint,
    'relation_acl',
    jsonb_build_object(
      'relation_name', relation_name,
      'grantee', grantee_name,
      'privilege_type', privilege_type,
      'is_grantable', is_grantable
    )
  FROM relation_acl
  WHERE grantee_name = 'service_role'

  UNION ALL

  -- STRP.13: counts only; no ticket content or identifiers.
  SELECT 'STRP.13_TICKET_DATA_COUNTS', 130, 1, 'aggregate',
    jsonb_build_object(
      'ticket_count', (SELECT count(*) FROM public.support_tickets),
      'message_count', (SELECT count(*) FROM public.support_ticket_messages),
      'event_count', (SELECT count(*) FROM public.support_ticket_events)
    )

  UNION ALL

  -- STRP.14: RLS state and any policies on the ticket tables.
  SELECT 'STRP.14_RLS_AND_POLICIES', 140,
    row_number() OVER (ORDER BY relation_name)::bigint,
    'rls_state',
    jsonb_build_object(
      'table_name', relation_name,
      'owner', owner_name,
      'rls_enabled', relrowsecurity,
      'rls_forced', relforcerowsecurity
    )
  FROM support_relation_state
  WHERE relkind IN ('r', 'p')

  UNION ALL

  SELECT 'STRP.14_RLS_AND_POLICIES', 140,
    (100 + row_number() OVER (ORDER BY tablename, policyname))::bigint,
    'policy',
    jsonb_build_object(
      'table_schema', schemaname,
      'table_name', tablename,
      'policy_name', policyname,
      'permissive', permissive,
      'roles', to_jsonb(roles),
      'command', cmd,
      'using_expression', qual,
      'with_check_expression', with_check
    )
  FROM pg_catalog.pg_policies
  WHERE schemaname = 'public'
    AND tablename IN (SELECT relation_name FROM ticket_relations)

  UNION ALL

  -- STRP.15: direct browser-role ACL rows; an empty block is the desired state.
  SELECT 'STRP.15_BROWSER_RELATION_ACCESS', 150,
    row_number() OVER (ORDER BY relation_name, grantee_name, privilege_type)::bigint,
    'browser_acl',
    jsonb_build_object(
      'relation_name', relation_name,
      'grantee', grantee_name,
      'privilege_type', privilege_type,
      'is_grantable', is_grantable
    )
  FROM relation_acl
  WHERE grantee_name IN ('PUBLIC', 'anon', 'authenticated')

  UNION ALL

  -- STRP.16: required Supabase roles and BYPASSRLS capability.
  SELECT 'STRP.16_SUPABASE_ROLES', 160,
    row_number() OVER (ORDER BY requested_role)::bigint,
    'role',
    jsonb_build_object(
      'role_name', requested_role,
      'exists', r.oid IS NOT NULL,
      'can_login', coalesce(r.rolcanlogin, false),
      'is_superuser', coalesce(r.rolsuper, false),
      'bypass_rls', coalesce(r.rolbypassrls, false)
    )
  FROM (VALUES
    ('anon'::text), ('authenticated'::text), ('service_role'::text)
  ) expected(requested_role)
  LEFT JOIN pg_catalog.pg_roles r ON r.rolname = expected.requested_role

  UNION ALL

  -- STRP.17: privacy-safe FK integrity counts for current rows.
  SELECT 'STRP.17_STRUCTURAL_INTEGRITY', 170, 1, 'aggregate',
    jsonb_build_object(
      'tickets_without_creator_profile', (
        SELECT count(*) FROM public.support_tickets t
        LEFT JOIN public.admin_profiles p ON p.id = t.created_by_profile_id
        WHERE p.id IS NULL
      ),
      'tickets_with_missing_department', (
        SELECT count(*) FROM public.support_tickets t
        LEFT JOIN public.departments d ON d.id = t.department_id
        WHERE t.department_id IS NOT NULL AND d.id IS NULL
      ),
      'tickets_with_missing_team', (
        SELECT count(*) FROM public.support_tickets t
        LEFT JOIN public.teams team_row ON team_row.id = t.team_id
        WHERE t.team_id IS NOT NULL AND team_row.id IS NULL
      ),
      'messages_without_ticket', (
        SELECT count(*) FROM public.support_ticket_messages m
        LEFT JOIN public.support_tickets t ON t.id = m.ticket_id
        WHERE t.id IS NULL
      ),
      'events_without_ticket', (
        SELECT count(*) FROM public.support_ticket_events e
        LEFT JOIN public.support_tickets t ON t.id = e.ticket_id
        WHERE t.id IS NULL
      )
    )

  UNION ALL

  -- STRP.18: derived proposal-design facts, never mutations.
  SELECT 'STRP.18_RPC_DESIGN_FACTS', 180, 1, 'derived_facts',
    jsonb_build_object(
      'ticket_create_rpc_possible',
        (SELECT count(*) = 3 FROM support_relation_state
         WHERE relation_name IN (SELECT relation_name FROM ticket_relations)
           AND relkind = 'r'),
      'reply_rpc_possible',
        to_regclass('public.support_ticket_messages') IS NOT NULL
        AND to_regclass('public.support_ticket_events') IS NOT NULL,
      'admin_mutation_rpc_possible',
        to_regclass('public.support_tickets') IS NOT NULL
        AND to_regclass('public.support_ticket_events') IS NOT NULL,
      'ticket_number_default_available', EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'support_tickets'
          AND column_name = 'ticket_number'
          AND coalesce(column_default, '') LIKE '%support_ticket_number_seq%'
      ),
      'message_touch_trigger_available', EXISTS (
        SELECT 1 FROM pg_catalog.pg_trigger t
        JOIN pg_catalog.pg_class c ON c.oid = t.tgrelid
        JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relname = 'support_ticket_messages'
          AND t.tgname = 'support_ticket_messages_touch_parent'
          AND NOT t.tgisinternal AND t.tgenabled <> 'D'
      ),
      'actor_fk_contract_available', EXISTS (
        SELECT 1 FROM pg_catalog.pg_constraint con
        JOIN pg_catalog.pg_class c ON c.oid = con.conrelid
        JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
        JOIN pg_catalog.pg_class target_c ON target_c.oid = con.confrelid
        JOIN pg_catalog.pg_namespace target_n ON target_n.oid = target_c.relnamespace
        WHERE con.contype = 'f' AND n.nspname = 'public'
          AND c.relname = 'support_ticket_events'
          AND target_n.nspname = 'public' AND target_c.relname = 'admin_profiles'
      ),
      'department_fk_available', EXISTS (
        SELECT 1 FROM pg_catalog.pg_constraint con
        JOIN pg_catalog.pg_class c ON c.oid = con.conrelid
        JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
        JOIN pg_catalog.pg_class target_c ON target_c.oid = con.confrelid
        WHERE con.contype = 'f' AND n.nspname = 'public'
          AND c.relname = 'support_tickets' AND target_c.relname = 'departments'
      ),
      'team_fk_available', EXISTS (
        SELECT 1 FROM pg_catalog.pg_constraint con
        JOIN pg_catalog.pg_class c ON c.oid = con.conrelid
        JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
        JOIN pg_catalog.pg_class target_c ON target_c.oid = con.confrelid
        WHERE con.contype = 'f' AND n.nspname = 'public'
          AND c.relname = 'support_tickets' AND target_c.relname = 'teams'
      ),
      'event_contract_available', EXISTS (
        SELECT 1 FROM pg_catalog.pg_constraint con
        JOIN pg_catalog.pg_class c ON c.oid = con.conrelid
        JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
        WHERE con.contype = 'c' AND n.nspname = 'public'
          AND c.relname = 'support_ticket_events'
          AND con.conname = 'support_ticket_events_type_check'
      ),
      'service_role_required_table_privileges_present',
        (SELECT bool_and(actual_privileges = expected_privileges
                         AND grantable_privilege_count = 0)
         FROM service_role_acl_summary)
        AND (SELECT actual_privileges = ARRAY['SELECT', 'USAGE']::text[]
                    AND grantable_privilege_count = 0
             FROM sequence_service_role_acl),
      'safe_function_acl_hardening_required', true,
      'naming_conflict_detected', EXISTS (SELECT 1 FROM planned_conflicts)
    )

  UNION ALL

  -- STRP.19: concise release decision summary.
  SELECT 'STRP.19_SUMMARY', 190, 1, 'summary',
    jsonb_build_object(
      'all_support_relations_exist',
        (SELECT count(*) = 3 FROM support_relation_state
         WHERE relation_name IN (SELECT relation_name FROM ticket_relations)
           AND relkind = 'r'),
      'ticket_contract_available', to_regclass('public.support_tickets') IS NOT NULL,
      'message_contract_available', to_regclass('public.support_ticket_messages') IS NOT NULL,
      'event_contract_available', to_regclass('public.support_ticket_events') IS NOT NULL,
      'ticket_number_sequence_available',
        to_regclass('public.support_ticket_number_seq') IS NOT NULL,
      'ticket_number_default_available', EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'support_tickets'
          AND column_name = 'ticket_number'
          AND coalesce(column_default, '') LIKE '%support_ticket_number_seq%'
      ),
      'touch_parent_trigger_available', EXISTS (
        SELECT 1 FROM pg_catalog.pg_trigger t
        JOIN pg_catalog.pg_class c ON c.oid = t.tgrelid
        JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relname = 'support_ticket_messages'
          AND t.tgname = 'support_ticket_messages_touch_parent'
          AND NOT t.tgisinternal AND t.tgenabled <> 'D'
      ),
      'admin_profile_identity_contract_available',
        to_regclass('public.admin_profiles') IS NOT NULL
        AND to_regclass('auth.users') IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'admin_profiles'
            AND column_name = 'id' AND udt_name = 'uuid'
        ),
      'scope_contract_available',
        to_regclass('public.departments') IS NOT NULL
        AND to_regclass('public.teams') IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM pg_catalog.pg_constraint con
          JOIN pg_catalog.pg_class c ON c.oid = con.conrelid
          JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
          WHERE con.contype = 'f' AND n.nspname = 'public'
            AND c.relname = 'support_tickets'
            AND con.conname IN ('support_tickets_department_fkey', 'support_tickets_team_fkey')
          GROUP BY c.oid HAVING count(*) = 2
        ),
      'service_role_acl_matches_hardened_contract',
        (SELECT bool_and(actual_privileges = expected_privileges
                         AND grantable_privilege_count = 0)
         FROM service_role_acl_summary)
        AND (SELECT actual_privileges = ARRAY['SELECT', 'USAGE']::text[]
                    AND grantable_privilege_count = 0
             FROM sequence_service_role_acl),
      'rls_enabled',
        (SELECT count(*) = 3 AND bool_and(relrowsecurity)
         FROM support_relation_state
         WHERE relation_name IN (SELECT relation_name FROM ticket_relations)
           AND relkind = 'r'),
      'browser_table_access_absent', NOT EXISTS (
        SELECT 1 FROM relation_acl
        WHERE grantee_name IN ('PUBLIC', 'anon', 'authenticated')
      ),
      'function_default_acl_requires_explicit_hardening',
        EXISTS (
          SELECT 1
          FROM pg_catalog.pg_proc p
          CROSS JOIN LATERAL pg_catalog.aclexplode(
            pg_catalog.acldefault('f', p.proowner)
          ) acl
          JOIN pg_catalog.pg_roles owner_role ON owner_role.oid = p.proowner
          WHERE owner_role.rolname = 'postgres'
            AND acl.grantee = 0 AND acl.privilege_type = 'EXECUTE'
        ),
      'planned_rpc_name_conflict_count', (SELECT count(*) FROM planned_conflicts),
      'ticket_count', (SELECT count(*) FROM public.support_tickets),
      'message_count', (SELECT count(*) FROM public.support_ticket_messages),
      'event_count', (SELECT count(*) FROM public.support_ticket_events),
      'rpc_extension_preflight_ok',
        (SELECT count(*) = 3 AND bool_and(relrowsecurity)
         FROM support_relation_state
         WHERE relation_name IN (SELECT relation_name FROM ticket_relations)
           AND relkind = 'r')
        AND to_regclass('public.support_ticket_number_seq') IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'support_tickets'
            AND column_name = 'ticket_number'
            AND coalesce(column_default, '') LIKE '%support_ticket_number_seq%'
        )
        AND (SELECT bool_and(actual_privileges = expected_privileges
                             AND grantable_privilege_count = 0)
             FROM service_role_acl_summary)
        AND (SELECT actual_privileges = ARRAY['SELECT', 'USAGE']::text[]
                    AND grantable_privilege_count = 0
             FROM sequence_service_role_acl)
        AND NOT EXISTS (SELECT 1 FROM planned_conflicts)
        AND EXISTS (
          SELECT 1 FROM pg_catalog.pg_trigger t
          JOIN pg_catalog.pg_class c ON c.oid = t.tgrelid
          JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
          WHERE n.nspname = 'public'
            AND c.relname = 'support_ticket_messages'
            AND t.tgname = 'support_ticket_messages_touch_parent'
            AND NOT t.tgisinternal AND t.tgenabled <> 'D'
        )
        AND EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'admin_profiles'
            AND column_name = 'id' AND udt_name = 'uuid'
        )
        AND EXISTS (
          SELECT 1 FROM pg_catalog.pg_constraint con
          JOIN pg_catalog.pg_class c ON c.oid = con.conrelid
          JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
          WHERE con.contype = 'f' AND n.nspname = 'public'
            AND c.relname = 'support_tickets'
            AND con.conname IN ('support_tickets_department_fkey', 'support_tickets_team_fkey')
          GROUP BY c.oid HAVING count(*) = 2
        )
        AND EXISTS (
          SELECT 1 FROM pg_catalog.pg_constraint con
          JOIN pg_catalog.pg_class c ON c.oid = con.conrelid
          JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
          WHERE con.contype = 'c' AND n.nspname = 'public'
            AND c.relname = 'support_ticket_events'
            AND con.conname IN (
              'support_ticket_events_type_check',
              'support_ticket_events_metadata_object_check',
              'support_ticket_events_metadata_size_check',
              'support_ticket_events_no_message_content_check'
            )
          GROUP BY c.oid HAVING count(*) = 4
        )
        AND NOT EXISTS (
          SELECT 1 FROM relation_acl
          WHERE grantee_name IN ('PUBLIC', 'anon', 'authenticated')
        )
    )
),
final_rows AS (
  SELECT result_block, result_order, row_order, row_type, data
  FROM actual_rows

  UNION ALL

  SELECT b.result_block, b.result_order, 1::bigint AS row_order,
    'empty'::text AS row_type,
    jsonb_build_object('empty', true, 'message', 'No matching rows found') AS data
  FROM all_blocks b
  WHERE NOT EXISTS (
    SELECT 1 FROM actual_rows r WHERE r.result_block = b.result_block
  )
)
SELECT result_block, result_order, row_order, row_type, data
FROM final_rows
ORDER BY result_order, row_order;
