-- B15.25 Support Tickets V1 - live schema preflight (READ ONLY)
-- Manual execution only: run exactly once in the Supabase SQL Editor with
-- "No limit" and export the single result set as one CSV file.
--
-- Privacy contract:
-- - no names, e-mail addresses, phone numbers, addresses or user metadata
-- - no auth.users row contents or identifiers
-- - no notification titles, messages, payloads, recipients or target URLs
-- - profile/auth and assignment checks return technical metadata or counts only

WITH
planned_names(object_name) AS (
  VALUES
    ('support_tickets'::text),
    ('support_ticket_messages'::text),
    ('support_ticket_events'::text),
    ('support_ticket_number_seq'::text),
    ('support_tickets_set_updated_at'::text),
    ('support_tickets_created_by_idx'::text),
    ('support_tickets_status_idx'::text),
    ('support_tickets_last_activity_idx'::text),
    ('support_ticket_messages_ticket_id_idx'::text),
    ('support_ticket_events_ticket_id_idx'::text),
    ('support_tickets_server_only'::text),
    ('support_ticket_messages_server_only'::text),
    ('support_ticket_events_server_only'::text)
),
relevant_relations(relation_name) AS (
  VALUES
    ('admin_profiles'::text), ('admin_roles'::text),
    ('admin_permissions'::text), ('admin_role_permissions'::text),
    ('admin_user_roles'::text), ('departments'::text),
    ('teams'::text), ('coaches'::text),
    ('coach_team_seasons'::text), ('admin_profile_team_assignments'::text),
    ('notifications'::text), ('notification_preferences'::text),
    ('notification_audit'::text), ('notification_deliveries'::text),
    ('notification_email_settings'::text),
    ('notification_email_global_settings'::text)
),
server_only_samples(relation_name) AS (
  VALUES
    ('notification_deliveries'::text),
    ('notification_email_settings'::text),
    ('notification_email_global_settings'::text),
    ('admin_email_change_requests'::text)
),
all_blocks(result_block, result_order) AS (
  VALUES
    ('STP.01_NAME_CONFLICTS'::text, 10),
    ('STP.02_PROFILE_AUTH_SCHEMA'::text, 20),
    ('STP.03_PROFILE_AUTH_COUNTS'::text, 30),
    ('STP.04_ROLE_PERMISSION_SCHEMA'::text, 40),
    ('STP.05_ROLE_PERMISSION_CONTRACT'::text, 50),
    ('STP.06_SCOPE_STRUCTURES'::text, 60),
    ('STP.07_UUID_TIMESTAMP_HELPERS'::text, 70),
    ('STP.08_FOREIGN_KEYS'::text, 80),
    ('STP.09_RLS_POLICIES'::text, 90),
    ('STP.10_TABLE_GRANTS'::text, 100),
    ('STP.11_SUPABASE_ROLES'::text, 110),
    ('STP.12_NOTIFICATION_SCHEMA'::text, 120),
    ('STP.13_NOTIFICATION_TYPE_CONTRACT'::text, 130),
    ('STP.14_RELEVANT_FUNCTIONS'::text, 140),
    ('STP.15_FUNCTION_EXECUTE_ACL'::text, 150),
    ('STP.16_AUDIT_LOG_PATTERNS'::text, 160),
    ('STP.17_COMPARABLE_TABLES'::text, 170),
    ('STP.18_EXISTING_SUPPORT_OBJECTS'::text, 180),
    ('STP.19_TRIGGER_INDEX_POLICY_CONFLICTS'::text, 190),
    ('STP.20_AGGREGATE_COUNTS'::text, 200)
),
rows AS (
  -- STP.01: planned object names across relation, function, constraint and policy namespaces.
  SELECT 'STP.01_NAME_CONFLICTS'::text AS result_block, 10 AS result_order,
    row_number() OVER (ORDER BY object_type, schema_name, object_name)::bigint AS row_order,
    'object'::text AS row_type,
    jsonb_build_object(
      'object_type', object_type, 'schema_name', schema_name,
      'object_name', object_name, 'details', details
    ) AS data
  FROM (
    SELECT CASE c.relkind
        WHEN 'r' THEN 'table' WHEN 'p' THEN 'partitioned_table'
        WHEN 'v' THEN 'view' WHEN 'm' THEN 'materialized_view'
        WHEN 'S' THEN 'sequence' WHEN 'i' THEN 'index'
        ELSE 'relation_' || c.relkind::text END AS object_type,
      n.nspname AS schema_name, c.relname AS object_name,
      jsonb_build_object('relation_kind', c.relkind::text) AS details
    FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname IN (SELECT object_name FROM planned_names)
    UNION ALL
    SELECT 'function', n.nspname, p.proname,
      jsonb_build_object('identity_arguments', pg_catalog.pg_get_function_identity_arguments(p.oid))
    FROM pg_catalog.pg_proc p
    JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname IN (SELECT object_name FROM planned_names)
    UNION ALL
    SELECT 'constraint', n.nspname, con.conname,
      jsonb_build_object('table_name', c.relname, 'definition', pg_catalog.pg_get_constraintdef(con.oid, true))
    FROM pg_catalog.pg_constraint con
    JOIN pg_catalog.pg_class c ON c.oid = con.conrelid
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname IN (SELECT object_name FROM planned_names)
    UNION ALL
    SELECT 'policy', schemaname, policyname,
      jsonb_build_object('table_name', tablename, 'command', cmd)
    FROM pg_catalog.pg_policies
    WHERE policyname IN (SELECT object_name FROM planned_names)
  ) conflicts

  UNION ALL

  -- STP.02: technical admin_profiles/auth.users shape; never returns row contents.
  SELECT 'STP.02_PROFILE_AUTH_SCHEMA', 20,
    row_number() OVER (ORDER BY table_schema, table_name, ordinal_position)::bigint,
    'column',
    jsonb_build_object(
      'table_schema', table_schema, 'table_name', table_name,
      'column_name', column_name, 'ordinal_position', ordinal_position,
      'data_type', data_type, 'udt_name', udt_name,
      'is_nullable', is_nullable, 'column_default', column_default,
      'is_identity', is_identity, 'is_generated', is_generated
    )
  FROM information_schema.columns
  WHERE (table_schema = 'public' AND table_name = 'admin_profiles')
     OR (table_schema = 'auth' AND table_name = 'users' AND column_name = 'id')

  UNION ALL

  SELECT 'STP.02_PROFILE_AUTH_SCHEMA', 20,
    (1000 + row_number() OVER (ORDER BY n.nspname, c.relname, con.conname))::bigint,
    'constraint',
    jsonb_build_object(
      'table_schema', n.nspname, 'table_name', c.relname,
      'constraint_name', con.conname, 'constraint_type', con.contype::text,
      'definition', pg_catalog.pg_get_constraintdef(con.oid, true)
    )
  FROM pg_catalog.pg_constraint con
  JOIN pg_catalog.pg_class c ON c.oid = con.conrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE (n.nspname = 'public' AND c.relname = 'admin_profiles')
     OR (n.nspname = 'auth' AND c.relname = 'users' AND con.contype IN ('p', 'u'))

  UNION ALL

  -- STP.03: privacy-safe identity-contract counts only.
  SELECT 'STP.03_PROFILE_AUTH_COUNTS', 30, 1, 'aggregate',
    jsonb_build_object(
      'admin_profile_count', (SELECT count(*) FROM public.admin_profiles),
      'auth_user_count', (SELECT count(*) FROM auth.users),
      'profiles_without_matching_auth_id', (
        SELECT count(*) FROM public.admin_profiles p
        LEFT JOIN auth.users u ON u.id = p.id WHERE u.id IS NULL
      ),
      'auth_users_without_matching_profile_id', (
        SELECT count(*) FROM auth.users u
        LEFT JOIN public.admin_profiles p ON p.id = u.id WHERE p.id IS NULL
      ),
      'active_admin_profile_count', (
        SELECT count(*) FROM public.admin_profiles WHERE is_active IS TRUE
      )
    )

  UNION ALL

  -- STP.04: role and permission table columns and constraints.
  SELECT 'STP.04_ROLE_PERMISSION_SCHEMA', 40,
    row_number() OVER (ORDER BY table_name, ordinal_position)::bigint,
    'column',
    jsonb_build_object(
      'table_name', table_name, 'column_name', column_name,
      'ordinal_position', ordinal_position, 'data_type', data_type,
      'udt_name', udt_name, 'is_nullable', is_nullable,
      'column_default', column_default
    )
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name IN ('admin_roles', 'admin_permissions', 'admin_role_permissions', 'admin_user_roles')

  UNION ALL

  SELECT 'STP.04_ROLE_PERMISSION_SCHEMA', 40,
    (1000 + row_number() OVER (ORDER BY c.relname, con.conname))::bigint,
    'constraint',
    jsonb_build_object(
      'table_name', c.relname, 'constraint_name', con.conname,
      'constraint_type', con.contype::text,
      'definition', pg_catalog.pg_get_constraintdef(con.oid, true)
    )
  FROM pg_catalog.pg_constraint con
  JOIN pg_catalog.pg_class c ON c.oid = con.conrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname IN ('admin_roles', 'admin_permissions', 'admin_role_permissions', 'admin_user_roles')

  UNION ALL

  -- STP.05: technical keys/slugs and aggregate assignment patterns, never user assignments.
  SELECT 'STP.05_ROLE_PERMISSION_CONTRACT', 50,
    row_number() OVER (ORDER BY row_group, technical_key)::bigint,
    row_group,
    jsonb_build_object('key', technical_key, 'is_active', is_active, 'link_count', link_count)
  FROM (
    SELECT 'role'::text AS row_group, r.key::text AS technical_key,
      r.is_active, count(ur.role_id)::bigint AS link_count
    FROM public.admin_roles r
    LEFT JOIN public.admin_user_roles ur ON ur.role_id = r.id
    GROUP BY r.id, r.key, r.is_active
    UNION ALL
    SELECT 'permission', p.key, NULL::boolean,
      count(rp.permission_id)::bigint
    FROM public.admin_permissions p
    LEFT JOIN public.admin_role_permissions rp ON rp.permission_id = p.id
    GROUP BY p.id, p.key
  ) contract

  UNION ALL

  -- STP.06: scope-related table/view/function metadata and aggregate relation counts.
  SELECT 'STP.06_SCOPE_STRUCTURES', 60,
    row_number() OVER (ORDER BY object_type, schema_name, object_name, detail_key)::bigint,
    object_type,
    jsonb_build_object(
      'schema_name', schema_name, 'object_name', object_name,
      'detail_key', detail_key, 'detail_value', detail_value
    )
  FROM (
    SELECT 'relation'::text AS object_type, n.nspname AS schema_name,
      c.relname AS object_name, 'relation_kind'::text AS detail_key,
      c.relkind::text AS detail_value
    FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND (
        c.relname IN ('departments', 'teams', 'coaches', 'coach_team_seasons', 'admin_profile_team_assignments')
        OR c.relname ~* '(scope|department.*manager|team.*assignment)'
      )
      AND c.relkind IN ('r', 'p', 'v', 'm')
    UNION ALL
    SELECT 'column', table_schema, table_name, column_name,
      concat_ws(' / ', data_type, udt_name, 'nullable=' || is_nullable)
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name IN ('departments', 'teams', 'coaches', 'coach_team_seasons', 'admin_profile_team_assignments')
      AND (
        column_name IN ('id', 'slug', 'is_active', 'department_id', 'team_id', 'team_season_id', 'coach_id', 'admin_profile_id', 'assignment_type')
        OR column_name ~* '(scope|department|team|profile)'
      )
    UNION ALL
    SELECT 'function', n.nspname, p.proname,
      pg_catalog.pg_get_function_identity_arguments(p.oid),
      pg_catalog.pg_get_function_result(p.oid)
    FROM pg_catalog.pg_proc p
    JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname ~* '(scope|department|team|permission|admin.*allows)'
  ) scope_objects

  UNION ALL

  SELECT 'STP.06_SCOPE_STRUCTURES', 60, 9001, 'aggregate',
    jsonb_build_object(
      'departments', (SELECT count(*) FROM public.departments),
      'teams', (SELECT count(*) FROM public.teams),
      'active_departments', (SELECT count(*) FROM public.departments WHERE is_active IS TRUE),
      'active_teams', (SELECT count(*) FROM public.teams WHERE is_active IS TRUE)
    )

  UNION ALL

  -- STP.07: UUID extension/function and timestamp helper/trigger conventions.
  SELECT 'STP.07_UUID_TIMESTAMP_HELPERS', 70,
    row_number() OVER (ORDER BY object_type, schema_name, object_name)::bigint,
    object_type,
    jsonb_build_object(
      'schema_name', schema_name, 'object_name', object_name,
      'details', details
    )
  FROM (
    SELECT 'extension'::text AS object_type, n.nspname AS schema_name,
      e.extname AS object_name,
      jsonb_build_object('version', e.extversion) AS details
    FROM pg_catalog.pg_extension e
    JOIN pg_catalog.pg_namespace n ON n.oid = e.extnamespace
    WHERE e.extname IN ('pgcrypto', 'uuid-ossp')
    UNION ALL
    SELECT 'function', n.nspname, p.proname,
      jsonb_build_object(
        'identity_arguments', pg_catalog.pg_get_function_identity_arguments(p.oid),
        'result_type', pg_catalog.pg_get_function_result(p.oid),
        'volatility', p.provolatile::text,
        'security_definer', p.prosecdef
      )
    FROM pg_catalog.pg_proc p
    JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname IN ('gen_random_uuid', 'set_updated_at')
    UNION ALL
    SELECT 'trigger', n.nspname, t.tgname,
      jsonb_build_object(
        'table_name', c.relname,
        'function_name', pn.nspname || '.' || p.proname,
        'definition', pg_catalog.pg_get_triggerdef(t.oid, true)
      )
    FROM pg_catalog.pg_trigger t
    JOIN pg_catalog.pg_class c ON c.oid = t.tgrelid
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_catalog.pg_proc p ON p.oid = t.tgfoid
    JOIN pg_catalog.pg_namespace pn ON pn.oid = p.pronamespace
    WHERE NOT t.tgisinternal
      AND (p.proname = 'set_updated_at' OR t.tgname ~* 'updated_at')
  ) helper_objects

  UNION ALL

  -- STP.08: representative foreign keys and actual ON UPDATE/ON DELETE actions.
  SELECT 'STP.08_FOREIGN_KEYS', 80,
    row_number() OVER (ORDER BY source_schema, source_table, constraint_name)::bigint,
    'foreign_key',
    jsonb_build_object(
      'constraint_name', constraint_name,
      'source_schema', source_schema, 'source_table', source_table,
      'source_columns', source_columns,
      'target_schema', target_schema, 'target_table', target_table,
      'target_columns', target_columns,
      'on_update', on_update, 'on_delete', on_delete,
      'definition', definition
    )
  FROM (
    SELECT con.conname AS constraint_name,
      sn.nspname AS source_schema, sc.relname AS source_table,
      (SELECT jsonb_agg(sa.attname ORDER BY k.ord)
       FROM unnest(con.conkey) WITH ORDINALITY AS k(attnum, ord)
       JOIN pg_catalog.pg_attribute sa ON sa.attrelid = con.conrelid AND sa.attnum = k.attnum) AS source_columns,
      tn.nspname AS target_schema, tc.relname AS target_table,
      (SELECT jsonb_agg(ta.attname ORDER BY k.ord)
       FROM unnest(con.confkey) WITH ORDINALITY AS k(attnum, ord)
       JOIN pg_catalog.pg_attribute ta ON ta.attrelid = con.confrelid AND ta.attnum = k.attnum) AS target_columns,
      CASE con.confupdtype WHEN 'a' THEN 'NO ACTION' WHEN 'r' THEN 'RESTRICT' WHEN 'c' THEN 'CASCADE' WHEN 'n' THEN 'SET NULL' WHEN 'd' THEN 'SET DEFAULT' END AS on_update,
      CASE con.confdeltype WHEN 'a' THEN 'NO ACTION' WHEN 'r' THEN 'RESTRICT' WHEN 'c' THEN 'CASCADE' WHEN 'n' THEN 'SET NULL' WHEN 'd' THEN 'SET DEFAULT' END AS on_delete,
      pg_catalog.pg_get_constraintdef(con.oid, true) AS definition
    FROM pg_catalog.pg_constraint con
    JOIN pg_catalog.pg_class sc ON sc.oid = con.conrelid
    JOIN pg_catalog.pg_namespace sn ON sn.oid = sc.relnamespace
    JOIN pg_catalog.pg_class tc ON tc.oid = con.confrelid
    JOIN pg_catalog.pg_namespace tn ON tn.oid = tc.relnamespace
    WHERE con.contype = 'f'
      AND sn.nspname = 'public'
      AND (
        sc.relname IN (SELECT relation_name FROM relevant_relations)
        OR tc.relname IN ('admin_profiles', 'departments', 'teams', 'notifications')
      )
  ) foreign_keys

  UNION ALL

  -- STP.09: RLS state and policy definitions for relevant/admin/server-only relations.
  SELECT 'STP.09_RLS_POLICIES', 90,
    row_number() OVER (ORDER BY row_kind, schema_name, table_name, object_name)::bigint,
    row_kind,
    jsonb_build_object(
      'schema_name', schema_name, 'table_name', table_name,
      'object_name', object_name, 'details', details
    )
  FROM (
    SELECT 'rls_state'::text AS row_kind, n.nspname AS schema_name,
      c.relname AS table_name, c.relname AS object_name,
      jsonb_build_object('rls_enabled', c.relrowsecurity, 'rls_forced', c.relforcerowsecurity) AS details
    FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind IN ('r', 'p')
      AND (c.relname IN (SELECT relation_name FROM relevant_relations)
        OR c.relname IN (SELECT relation_name FROM server_only_samples))
    UNION ALL
    SELECT 'policy', schemaname, tablename, policyname,
      jsonb_build_object(
        'command', cmd, 'permissive', permissive, 'roles', to_jsonb(roles),
        'using_expression', qual, 'with_check_expression', with_check
      )
    FROM pg_catalog.pg_policies
    WHERE schemaname = 'public'
      AND (tablename IN (SELECT relation_name FROM relevant_relations)
        OR tablename IN (SELECT relation_name FROM server_only_samples))
  ) rls_rows

  UNION ALL

  -- STP.10: effective relation ACLs, including PUBLIC via grantee oid 0.
  SELECT 'STP.10_TABLE_GRANTS', 100,
    row_number() OVER (ORDER BY n.nspname, c.relname, grantee_name, acl.privilege_type)::bigint,
    'grant',
    jsonb_build_object(
      'schema_name', n.nspname, 'table_name', c.relname,
      'grantee', grantee_name, 'privilege_type', acl.privilege_type,
      'is_grantable', acl.is_grantable
    )
  FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  CROSS JOIN LATERAL pg_catalog.aclexplode(
    coalesce(c.relacl, pg_catalog.acldefault('r', c.relowner))
  ) acl
  LEFT JOIN pg_catalog.pg_roles grantee ON grantee.oid = acl.grantee
  CROSS JOIN LATERAL (
    SELECT CASE WHEN acl.grantee = 0 THEN 'PUBLIC' ELSE grantee.rolname END AS grantee_name
  ) resolved_grantee
  WHERE n.nspname = 'public'
    AND c.relkind IN ('r', 'p', 'v', 'm')
    AND (c.relname IN (SELECT relation_name FROM relevant_relations)
      OR c.relname IN (SELECT relation_name FROM server_only_samples))
    AND (acl.grantee = 0 OR grantee.rolname IN ('anon', 'authenticated', 'service_role'))

  UNION ALL

  -- STP.11: required Supabase roles, technical existence only.
  SELECT 'STP.11_SUPABASE_ROLES', 110,
    row_number() OVER (ORDER BY requested_role)::bigint,
    'role',
    jsonb_build_object(
      'role_name', requested_role,
      'exists', r.oid IS NOT NULL,
      'can_login', coalesce(r.rolcanlogin, false),
      'is_superuser', coalesce(r.rolsuper, false),
      'bypass_rls', coalesce(r.rolbypassrls, false)
    )
  FROM (VALUES ('anon'::text), ('authenticated'::text), ('service_role'::text)) expected(requested_role)
  LEFT JOIN pg_catalog.pg_roles r ON r.rolname = expected.requested_role

  UNION ALL

  -- STP.12: notification table shape and constraints only; no notification data.
  SELECT 'STP.12_NOTIFICATION_SCHEMA', 120,
    row_number() OVER (ORDER BY row_kind, table_name, sort_key)::bigint,
    row_kind,
    details
  FROM (
    SELECT 'column'::text AS row_kind, table_name,
      lpad(ordinal_position::text, 5, '0') AS sort_key,
      jsonb_build_object(
        'table_name', table_name, 'column_name', column_name,
        'ordinal_position', ordinal_position, 'data_type', data_type,
        'udt_name', udt_name, 'is_nullable', is_nullable,
        'column_default', column_default
      ) AS details
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name IN (
        'notifications', 'notification_preferences', 'notification_audit',
        'notification_deliveries', 'notification_email_settings',
        'notification_email_global_settings'
      )
    UNION ALL
    SELECT 'constraint', c.relname, con.conname,
      jsonb_build_object(
        'table_name', c.relname, 'constraint_name', con.conname,
        'constraint_type', con.contype::text,
        'definition', pg_catalog.pg_get_constraintdef(con.oid, true)
      )
    FROM pg_catalog.pg_constraint con
    JOIN pg_catalog.pg_class c ON c.oid = con.conrelid
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname IN (
        'notifications', 'notification_preferences', 'notification_audit',
        'notification_deliveries', 'notification_email_settings',
        'notification_email_global_settings'
      )
  ) notification_schema

  UNION ALL

  -- STP.13: technical type-setting contract and compatibility of planned types.
  SELECT 'STP.13_NOTIFICATION_TYPE_CONTRACT', 130,
    row_number() OVER (ORDER BY row_group, technical_key)::bigint,
    row_group,
    details
  FROM (
    SELECT 'existing_email_type_setting'::text AS row_group,
      s.notification_type AS technical_key,
      jsonb_build_object(
        'notification_type', s.notification_type,
        'email_enabled', s.email_enabled
      ) AS details
    FROM public.notification_email_settings s
    UNION ALL
    SELECT 'planned_ticket_type', planned_type,
      jsonb_build_object(
        'notification_type', planned_type,
        'email_setting_exists', EXISTS (
          SELECT 1 FROM public.notification_email_settings s
          WHERE s.notification_type = planned_type
        ),
        'required_for_v1', planned_type <> 'ticket_assigned'
      )
    FROM (VALUES
      ('ticket_created'::text), ('ticket_reply_created'::text),
      ('ticket_status_changed'::text), ('ticket_assigned'::text)
    ) planned(planned_type)
    UNION ALL
    SELECT 'global_email_setting', g.setting_key,
      jsonb_build_object(
        'setting_key', g.setting_key,
        'email_delivery_enabled', g.email_delivery_enabled
      )
    FROM public.notification_email_global_settings g
  ) type_contract

  UNION ALL

  -- STP.14: relevant function metadata only; functions are never executed.
  SELECT 'STP.14_RELEVANT_FUNCTIONS', 140,
    row_number() OVER (ORDER BY n.nspname, p.proname, pg_catalog.pg_get_function_identity_arguments(p.oid))::bigint,
    'function',
    jsonb_build_object(
      'schema_name', n.nspname, 'function_name', p.proname,
      'identity_arguments', pg_catalog.pg_get_function_identity_arguments(p.oid),
      'result_type', pg_catalog.pg_get_function_result(p.oid),
      'owner', owner_role.rolname,
      'language', lang.lanname,
      'security_definer', p.prosecdef,
      'volatility', p.provolatile::text,
      'proconfig', coalesce(to_jsonb(p.proconfig), '[]'::jsonb),
      'search_path_settings', coalesce(
        (SELECT jsonb_agg(setting ORDER BY setting)
         FROM unnest(coalesce(p.proconfig, ARRAY[]::text[])) setting
         WHERE setting LIKE 'search_path=%'),
        '[]'::jsonb
      )
    )
  FROM pg_catalog.pg_proc p
  JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
  JOIN pg_catalog.pg_roles owner_role ON owner_role.oid = p.proowner
  JOIN pg_catalog.pg_language lang ON lang.oid = p.prolang
  WHERE n.nspname IN ('public', 'auth')
    AND (
      p.proname IN ('set_updated_at', 'is_superadmin_actor', 'touch_own_admin_profile_last_login', 'load_notification_audit_monitoring')
      OR p.proname ~* '(notification|permission|scope|department.*allow|admin.*profile)'
    )

  UNION ALL

  -- STP.15: effective EXECUTE ACLs for the same relevant functions.
  SELECT 'STP.15_FUNCTION_EXECUTE_ACL', 150,
    row_number() OVER (ORDER BY n.nspname, p.proname, identity_arguments, grantee_name)::bigint,
    'execute_grant',
    jsonb_build_object(
      'schema_name', n.nspname, 'function_name', p.proname,
      'identity_arguments', identity_arguments,
      'grantee', grantee_name, 'privilege_type', acl.privilege_type,
      'is_grantable', acl.is_grantable
    )
  FROM pg_catalog.pg_proc p
  JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
  CROSS JOIN LATERAL (
    SELECT pg_catalog.pg_get_function_identity_arguments(p.oid) AS identity_arguments
  ) identity
  CROSS JOIN LATERAL pg_catalog.aclexplode(
    coalesce(p.proacl, pg_catalog.acldefault('f', p.proowner))
  ) acl
  LEFT JOIN pg_catalog.pg_roles grantee ON grantee.oid = acl.grantee
  CROSS JOIN LATERAL (
    SELECT CASE WHEN acl.grantee = 0 THEN 'PUBLIC' ELSE grantee.rolname END AS grantee_name
  ) resolved_grantee
  WHERE n.nspname IN ('public', 'auth')
    AND (
      p.proname IN ('set_updated_at', 'is_superadmin_actor', 'touch_own_admin_profile_last_login', 'load_notification_audit_monitoring')
      OR p.proname ~* '(notification|permission|scope|department.*allow|admin.*profile)'
    )
    AND acl.privilege_type = 'EXECUTE'
    AND (acl.grantee = 0 OR grantee.rolname IN ('anon', 'authenticated', 'service_role'))

  UNION ALL

  -- STP.16: audit/log/event relation structures and privacy-safe row estimates/counts.
  SELECT 'STP.16_AUDIT_LOG_PATTERNS', 160,
    row_number() OVER (ORDER BY n.nspname, c.relname)::bigint,
    'relation',
    jsonb_build_object(
      'schema_name', n.nspname, 'relation_name', c.relname,
      'relation_kind', c.relkind::text,
      'estimated_rows', greatest(c.reltuples::bigint, 0),
      'rls_enabled', c.relrowsecurity, 'rls_forced', c.relforcerowsecurity,
      'columns', coalesce((
        SELECT jsonb_agg(jsonb_build_object(
          'column_name', cols.column_name, 'data_type', cols.data_type,
          'udt_name', cols.udt_name, 'is_nullable', cols.is_nullable,
          'column_default', cols.column_default
        ) ORDER BY cols.ordinal_position)
        FROM information_schema.columns cols
        WHERE cols.table_schema = n.nspname AND cols.table_name = c.relname
      ), '[]'::jsonb),
      'constraints', coalesce((
        SELECT jsonb_agg(jsonb_build_object(
          'constraint_name', con.conname,
          'constraint_type', con.contype::text,
          'definition', pg_catalog.pg_get_constraintdef(con.oid, true)
        ) ORDER BY con.conname)
        FROM pg_catalog.pg_constraint con WHERE con.conrelid = c.oid
      ), '[]'::jsonb)
    )
  FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind IN ('r', 'p')
    AND c.relname ~* '(audit|log|event|history)'

  UNION ALL

  -- STP.17: technical candidates with creator/status/timestamp/parent-child patterns.
  SELECT 'STP.17_COMPARABLE_TABLES', 170,
    row_number() OVER (ORDER BY table_name)::bigint,
    'relation_pattern',
    jsonb_build_object(
      'table_name', table_name,
      'has_creator_profile_reference', bool_or(column_name IN ('created_by', 'created_by_profile_id', 'actor_profile_id')),
      'has_status', bool_or(column_name = 'status'),
      'has_created_at', bool_or(column_name = 'created_at'),
      'has_updated_at', bool_or(column_name = 'updated_at'),
      'has_last_activity_at', bool_or(column_name = 'last_activity_at'),
      'has_parent_reference', bool_or(column_name ~* '(_id)$' AND column_name NOT IN ('id', 'created_by', 'updated_by')),
      'matching_columns', jsonb_agg(column_name ORDER BY ordinal_position)
    )
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND column_name IN (
      'created_by', 'updated_by', 'created_by_profile_id', 'actor_profile_id',
      'status', 'created_at', 'updated_at', 'last_activity_at',
      'notification_id', 'request_id', 'team_id', 'department_id', 'user_id'
    )
  GROUP BY table_name

  UNION ALL

  -- STP.18: all live object names matching ticket/support/issue/helpdesk; metadata only.
  SELECT 'STP.18_EXISTING_SUPPORT_OBJECTS', 180,
    row_number() OVER (ORDER BY object_type, schema_name, object_name)::bigint,
    object_type,
    jsonb_build_object(
      'schema_name', schema_name, 'object_name', object_name,
      'details', details
    )
  FROM (
    SELECT CASE c.relkind
        WHEN 'r' THEN 'table' WHEN 'p' THEN 'partitioned_table'
        WHEN 'v' THEN 'view' WHEN 'm' THEN 'materialized_view'
        WHEN 'S' THEN 'sequence' WHEN 'i' THEN 'index'
        ELSE 'relation_' || c.relkind::text END AS object_type,
      n.nspname AS schema_name, c.relname AS object_name,
      jsonb_build_object('relation_kind', c.relkind::text) AS details
    FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
      AND c.relname ~* '(ticket|support|issue|helpdesk)'
    UNION ALL
    SELECT 'function', n.nspname, p.proname,
      jsonb_build_object(
        'identity_arguments', pg_catalog.pg_get_function_identity_arguments(p.oid),
        'result_type', pg_catalog.pg_get_function_result(p.oid)
      )
    FROM pg_catalog.pg_proc p
    JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
      AND p.proname ~* '(ticket|support|issue|helpdesk)'
  ) support_objects

  UNION ALL

  -- STP.19: existing trigger/index/policy names that could collide with ticket naming.
  SELECT 'STP.19_TRIGGER_INDEX_POLICY_CONFLICTS', 190,
    row_number() OVER (ORDER BY object_type, schema_name, object_name, parent_name)::bigint,
    object_type,
    jsonb_build_object(
      'schema_name', schema_name, 'object_name', object_name,
      'parent_name', parent_name, 'definition', definition
    )
  FROM (
    SELECT 'trigger'::text AS object_type, n.nspname AS schema_name,
      t.tgname AS object_name, c.relname AS parent_name,
      pg_catalog.pg_get_triggerdef(t.oid, true) AS definition
    FROM pg_catalog.pg_trigger t
    JOIN pg_catalog.pg_class c ON c.oid = t.tgrelid
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE NOT t.tgisinternal AND t.tgname ~* '(ticket|support|issue|helpdesk)'
    UNION ALL
    SELECT 'index', schemaname, indexname, tablename, indexdef
    FROM pg_catalog.pg_indexes
    WHERE indexname ~* '(ticket|support|issue|helpdesk)'
    UNION ALL
    SELECT 'policy', schemaname, policyname, tablename,
      concat_ws(' ', 'COMMAND=' || cmd, 'USING=' || coalesce(qual, ''), 'WITH_CHECK=' || coalesce(with_check, ''))
    FROM pg_catalog.pg_policies
    WHERE policyname ~* '(ticket|support|issue|helpdesk)'
  ) named_objects

  UNION ALL

  -- STP.20: privacy-safe aggregate baseline counts.
  SELECT 'STP.20_AGGREGATE_COUNTS', 200, 1, 'aggregate',
    jsonb_build_object(
      'admin_profiles', (SELECT count(*) FROM public.admin_profiles),
      'auth_users', (SELECT count(*) FROM auth.users),
      'admin_roles', (SELECT count(*) FROM public.admin_roles),
      'admin_permissions', (SELECT count(*) FROM public.admin_permissions),
      'admin_role_permission_links', (SELECT count(*) FROM public.admin_role_permissions),
      'admin_user_role_links', (SELECT count(*) FROM public.admin_user_roles),
      'departments', (SELECT count(*) FROM public.departments),
      'teams', (SELECT count(*) FROM public.teams),
      'notifications', (SELECT count(*) FROM public.notifications),
      'notification_preferences', (SELECT count(*) FROM public.notification_preferences),
      'notification_audit', (SELECT count(*) FROM public.notification_audit),
      'notification_deliveries', (SELECT count(*) FROM public.notification_deliveries),
      'notification_email_type_settings', (SELECT count(*) FROM public.notification_email_settings),
      'notification_email_global_settings', (SELECT count(*) FROM public.notification_email_global_settings)
    )
),
rows_with_markers AS (
  SELECT result_block, result_order, row_order, row_type, data FROM rows
  UNION ALL
  SELECT b.result_block, b.result_order, 1::bigint AS row_order,
    'empty'::text AS row_type,
    jsonb_build_object(
      'checked', true,
      'result', 'no_rows',
      'message', 'Pruefung ausgefuehrt, keine passenden Objekte oder Zeilen gefunden.'
    ) AS data
  FROM all_blocks b
  WHERE NOT EXISTS (
    SELECT 1 FROM rows r WHERE r.result_block = b.result_block
  )
)
SELECT result_block, result_order, row_order, row_type, data
FROM rows_with_markers
ORDER BY result_order, row_order;
