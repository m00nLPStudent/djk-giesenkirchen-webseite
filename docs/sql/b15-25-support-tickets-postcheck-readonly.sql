-- B15.25 Support Tickets V1 - post-check (READ-ONLY)
-- Execute once in the Supabase SQL Editor with "No limit" and export the
-- single result set as CSV. This statement never advances the ticket sequence.

WITH
expected_relations(object_name, expected_kind) AS (
  VALUES
    ('support_tickets'::text, 'r'::text),
    ('support_ticket_messages'::text, 'r'::text),
    ('support_ticket_events'::text, 'r'::text),
    ('support_ticket_number_seq'::text, 'S'::text)
),
ticket_tables(table_name) AS (
  VALUES
    ('support_tickets'::text),
    ('support_ticket_messages'::text),
    ('support_ticket_events'::text)
),
expected_columns(table_name, ordinal_position, column_name, udt_name, is_nullable, default_pattern) AS (
  VALUES
    ('support_tickets', 1, 'id', 'uuid', 'NO', 'gen_random_uuid'),
    ('support_tickets', 2, 'ticket_number', 'text', 'NO', 'support_ticket_number_seq'),
    ('support_tickets', 3, 'created_by_profile_id', 'uuid', 'NO', NULL),
    ('support_tickets', 4, 'category', 'text', 'NO', NULL),
    ('support_tickets', 5, 'area_key', 'text', 'NO', NULL),
    ('support_tickets', 6, 'department_id', 'uuid', 'YES', NULL),
    ('support_tickets', 7, 'team_id', 'uuid', 'YES', NULL),
    ('support_tickets', 8, 'subject', 'text', 'NO', NULL),
    ('support_tickets', 9, 'status', 'text', 'NO', '''open'''),
    ('support_tickets', 10, 'priority', 'text', 'NO', '''normal'''),
    ('support_tickets', 11, 'assigned_to_profile_id', 'uuid', 'YES', NULL),
    ('support_tickets', 12, 'created_at', 'timestamptz', 'NO', 'now()'),
    ('support_tickets', 13, 'updated_at', 'timestamptz', 'NO', 'now()'),
    ('support_tickets', 14, 'last_activity_at', 'timestamptz', 'NO', 'now()'),
    ('support_tickets', 15, 'closed_at', 'timestamptz', 'YES', NULL),
    ('support_tickets', 16, 'closed_by_profile_id', 'uuid', 'YES', NULL),
    ('support_ticket_messages', 1, 'id', 'uuid', 'NO', 'gen_random_uuid'),
    ('support_ticket_messages', 2, 'ticket_id', 'uuid', 'NO', NULL),
    ('support_ticket_messages', 3, 'author_profile_id', 'uuid', 'YES', NULL),
    ('support_ticket_messages', 4, 'body', 'text', 'NO', NULL),
    ('support_ticket_messages', 5, 'created_at', 'timestamptz', 'NO', 'now()'),
    ('support_ticket_events', 1, 'id', 'uuid', 'NO', 'gen_random_uuid'),
    ('support_ticket_events', 2, 'ticket_id', 'uuid', 'NO', NULL),
    ('support_ticket_events', 3, 'event_type', 'text', 'NO', NULL),
    ('support_ticket_events', 4, 'actor_profile_id', 'uuid', 'YES', NULL),
    ('support_ticket_events', 5, 'metadata', 'jsonb', 'NO', '''{}''::jsonb'),
    ('support_ticket_events', 6, 'created_at', 'timestamptz', 'NO', 'now()')
),
expected_constraints(table_name, constraint_name) AS (
  VALUES
    ('support_tickets', 'support_tickets_pkey'),
    ('support_tickets', 'support_tickets_ticket_number_key'),
    ('support_tickets', 'support_tickets_created_by_profile_fkey'),
    ('support_tickets', 'support_tickets_department_fkey'),
    ('support_tickets', 'support_tickets_team_fkey'),
    ('support_tickets', 'support_tickets_assigned_to_profile_fkey'),
    ('support_tickets', 'support_tickets_closed_by_profile_fkey'),
    ('support_tickets', 'support_tickets_ticket_number_check'),
    ('support_tickets', 'support_tickets_category_check'),
    ('support_tickets', 'support_tickets_area_key_check'),
    ('support_tickets', 'support_tickets_subject_check'),
    ('support_tickets', 'support_tickets_status_check'),
    ('support_tickets', 'support_tickets_priority_check'),
    ('support_tickets', 'support_tickets_activity_time_check'),
    ('support_tickets', 'support_tickets_closed_state_check'),
    ('support_tickets', 'support_tickets_closed_time_check'),
    ('support_ticket_messages', 'support_ticket_messages_pkey'),
    ('support_ticket_messages', 'support_ticket_messages_ticket_fkey'),
    ('support_ticket_messages', 'support_ticket_messages_author_profile_fkey'),
    ('support_ticket_messages', 'support_ticket_messages_body_check'),
    ('support_ticket_events', 'support_ticket_events_pkey'),
    ('support_ticket_events', 'support_ticket_events_ticket_fkey'),
    ('support_ticket_events', 'support_ticket_events_actor_profile_fkey'),
    ('support_ticket_events', 'support_ticket_events_type_check'),
    ('support_ticket_events', 'support_ticket_events_metadata_object_check'),
    ('support_ticket_events', 'support_ticket_events_metadata_size_check'),
    ('support_ticket_events', 'support_ticket_events_no_message_content_check')
),
expected_indexes(index_name) AS (
  VALUES
    ('support_tickets_created_by_idx'::text),
    ('support_tickets_status_idx'::text),
    ('support_tickets_last_activity_idx'::text),
    ('support_tickets_department_idx'::text),
    ('support_tickets_team_idx'::text),
    ('support_tickets_assigned_to_idx'::text),
    ('support_ticket_messages_ticket_id_idx'::text),
    ('support_ticket_events_ticket_id_idx'::text)
),
expected_triggers(table_name, trigger_name) AS (
  VALUES
    ('support_tickets'::text, 'support_tickets_set_updated_at'::text),
    ('support_ticket_messages'::text, 'support_ticket_messages_touch_parent'::text)
),
expected_permissions(permission_key, permission_name, permission_description, category) AS (
  VALUES
    ('support_tickets.view_own', 'Eigene Support-Tickets ansehen', 'Ausschliesslich eigene Support-Tickets und deren Verlauf ansehen', 'support_tickets'),
    ('support_tickets.create', 'Support-Tickets erstellen', 'Eigene Support-Tickets im erlaubten fachlichen Bereich erstellen', 'support_tickets'),
    ('support_tickets.reply_own', 'Auf eigene Support-Tickets antworten', 'Auf eigene, fachlich antwortbare Support-Tickets antworten', 'support_tickets'),
    ('support_tickets.manage', 'Support-Tickets verwalten', 'Alle Support-Tickets beantworten und administrativ verwalten', 'support_tickets')
),
expected_email_types(notification_type) AS (
  VALUES
    ('ticket_created'::text),
    ('ticket_reply_created'::text),
    ('ticket_status_changed'::text)
),
all_blocks(result_block, result_order) AS (
  VALUES
    ('STPC.01_RELATIONS'::text, 10),
    ('STPC.02_COLUMNS'::text, 20),
    ('STPC.03_TABLE_SHAPE'::text, 30),
    ('STPC.04_CONSTRAINTS'::text, 40),
    ('STPC.05_INDEXES'::text, 50),
    ('STPC.06_TRIGGERS'::text, 60),
    ('STPC.07_FUNCTION'::text, 70),
    ('STPC.08_FUNCTION_ACL'::text, 80),
    ('STPC.09_RLS_POLICIES'::text, 90),
    ('STPC.10_PRIVILEGES'::text, 100),
    ('STPC.11_SUPPORT_PERMISSIONS'::text, 110),
    ('STPC.12_ROLE_MAPPINGS'::text, 120),
    ('STPC.13_EMAIL_SETTINGS'::text, 130),
    ('STPC.14_COUNTS_SEQUENCE'::text, 140),
    ('STPC.15_ROLE_PERMISSION_ARBITER'::text, 150),
    ('STPC.16_SUMMARY'::text, 160)
),
relation_inventory AS MATERIALIZED (
  SELECT expected.object_name, expected.expected_kind,
    relation_row.relkind::text AS actual_kind,
    relation_row.oid IS NOT NULL AS object_exists
  FROM expected_relations expected
  LEFT JOIN pg_catalog.pg_namespace namespace_row
    ON namespace_row.nspname = 'public'
  LEFT JOIN pg_catalog.pg_class relation_row
    ON relation_row.relnamespace = namespace_row.oid
   AND relation_row.relname = expected.object_name
),
column_inventory AS MATERIALIZED (
  SELECT columns.table_name, columns.ordinal_position, columns.column_name,
    columns.data_type, columns.udt_name, columns.is_nullable,
    columns.column_default, columns.is_identity, columns.identity_generation,
    columns.is_generated, columns.generation_expression
  FROM information_schema.columns columns
  WHERE columns.table_schema = 'public'
    AND columns.table_name IN (SELECT table_name FROM ticket_tables)
),
column_contract AS MATERIALIZED (
  SELECT expected.*,
    actual.column_name IS NOT NULL AS column_exists,
    actual.ordinal_position AS actual_ordinal_position,
    actual.udt_name AS actual_udt_name,
    actual.is_nullable AS actual_is_nullable,
    actual.column_default AS actual_default,
    (
      actual.column_name IS NOT NULL
      AND actual.ordinal_position = expected.ordinal_position
      AND actual.udt_name = expected.udt_name
      AND actual.is_nullable = expected.is_nullable
      AND (
        (expected.default_pattern IS NULL AND actual.column_default IS NULL)
        OR
        (expected.default_pattern IS NOT NULL AND actual.column_default LIKE '%' || expected.default_pattern || '%')
      )
    ) AS matches
  FROM expected_columns expected
  LEFT JOIN column_inventory actual
    ON actual.table_name = expected.table_name
   AND actual.column_name = expected.column_name
),
constraint_inventory AS MATERIALIZED (
  SELECT table_row.relname AS table_name, constraint_row.conname AS constraint_name,
    constraint_row.contype::text AS constraint_type,
    pg_catalog.pg_get_constraintdef(constraint_row.oid, true) AS definition,
    constraint_row.convalidated AS validated,
    CASE constraint_row.confupdtype WHEN 'a' THEN 'NO ACTION' WHEN 'r' THEN 'RESTRICT' WHEN 'c' THEN 'CASCADE' WHEN 'n' THEN 'SET NULL' WHEN 'd' THEN 'SET DEFAULT' ELSE NULL END AS on_update,
    CASE constraint_row.confdeltype WHEN 'a' THEN 'NO ACTION' WHEN 'r' THEN 'RESTRICT' WHEN 'c' THEN 'CASCADE' WHEN 'n' THEN 'SET NULL' WHEN 'd' THEN 'SET DEFAULT' ELSE NULL END AS on_delete,
    target_namespace.nspname AS target_schema,
    target_table.relname AS target_table
  FROM pg_catalog.pg_constraint constraint_row
  JOIN pg_catalog.pg_class table_row ON table_row.oid = constraint_row.conrelid
  JOIN pg_catalog.pg_namespace namespace_row ON namespace_row.oid = table_row.relnamespace
  LEFT JOIN pg_catalog.pg_class target_table ON target_table.oid = constraint_row.confrelid
  LEFT JOIN pg_catalog.pg_namespace target_namespace ON target_namespace.oid = target_table.relnamespace
  WHERE namespace_row.nspname = 'public'
    AND table_row.relname IN (SELECT table_name FROM ticket_tables)
),
index_inventory AS MATERIALIZED (
  SELECT table_row.relname AS table_name, index_row.relname AS index_name,
    pg_catalog.pg_get_indexdef(index_row.oid) AS definition,
    index_meta.indisunique AS is_unique, index_meta.indisprimary AS is_primary,
    index_meta.indisvalid AS is_valid, index_meta.indisready AS is_ready,
    index_meta.indpred IS NOT NULL AS is_partial,
    index_meta.indexprs IS NOT NULL AS has_expressions
  FROM pg_catalog.pg_index index_meta
  JOIN pg_catalog.pg_class table_row ON table_row.oid = index_meta.indrelid
  JOIN pg_catalog.pg_namespace namespace_row ON namespace_row.oid = table_row.relnamespace
  JOIN pg_catalog.pg_class index_row ON index_row.oid = index_meta.indexrelid
  WHERE namespace_row.nspname = 'public'
    AND table_row.relname IN (SELECT table_name FROM ticket_tables)
),
trigger_inventory AS MATERIALIZED (
  SELECT table_row.relname AS table_name, trigger_row.tgname AS trigger_name,
    trigger_row.tgenabled::text AS enabled,
    pg_catalog.pg_get_triggerdef(trigger_row.oid, true) AS definition
  FROM pg_catalog.pg_trigger trigger_row
  JOIN pg_catalog.pg_class table_row ON table_row.oid = trigger_row.tgrelid
  JOIN pg_catalog.pg_namespace namespace_row ON namespace_row.oid = table_row.relnamespace
  WHERE namespace_row.nspname = 'public'
    AND table_row.relname IN (SELECT table_name FROM ticket_tables)
    AND NOT trigger_row.tgisinternal
),
function_inventory AS MATERIALIZED (
  SELECT procedure_row.oid, procedure_row.proname AS function_name,
    pg_catalog.pg_get_function_identity_arguments(procedure_row.oid) AS identity_arguments,
    pg_catalog.pg_get_function_result(procedure_row.oid) AS result_type,
    language_row.lanname AS language, procedure_row.prosecdef AS security_definer,
    owner_row.rolname AS owner,
    coalesce(to_jsonb(procedure_row.proconfig), '[]'::jsonb) AS configuration,
    pg_catalog.pg_get_functiondef(procedure_row.oid) AS definition,
    procedure_row.proacl, procedure_row.proowner
  FROM pg_catalog.pg_proc procedure_row
  JOIN pg_catalog.pg_namespace namespace_row ON namespace_row.oid = procedure_row.pronamespace
  JOIN pg_catalog.pg_language language_row ON language_row.oid = procedure_row.prolang
  JOIN pg_catalog.pg_roles owner_row ON owner_row.oid = procedure_row.proowner
  WHERE namespace_row.nspname = 'public'
    AND procedure_row.proname = 'touch_support_ticket_from_message'
    AND pg_catalog.pg_get_function_identity_arguments(procedure_row.oid) = ''
),
function_acl AS MATERIALIZED (
  SELECT CASE WHEN acl.grantee = 0 THEN 'PUBLIC' ELSE grantee.rolname END AS grantee,
    acl.privilege_type, acl.is_grantable
  FROM function_inventory function_row
  CROSS JOIN LATERAL pg_catalog.aclexplode(
    coalesce(function_row.proacl, pg_catalog.acldefault('f', function_row.proowner))
  ) acl
  LEFT JOIN pg_catalog.pg_roles grantee ON grantee.oid = acl.grantee
  WHERE acl.grantee = 0 OR grantee.rolname IN ('anon', 'authenticated', 'service_role')
),
rls_inventory AS MATERIALIZED (
  SELECT table_row.relname AS table_name, table_row.relrowsecurity AS rls_enabled,
    table_row.relforcerowsecurity AS rls_forced
  FROM pg_catalog.pg_class table_row
  JOIN pg_catalog.pg_namespace namespace_row ON namespace_row.oid = table_row.relnamespace
  WHERE namespace_row.nspname = 'public'
    AND table_row.relname IN (SELECT table_name FROM ticket_tables)
),
policy_inventory AS MATERIALIZED (
  SELECT policies.tablename AS table_name, policies.policyname,
    policies.cmd, policies.permissive, policies.roles,
    policies.qual, policies.with_check
  FROM pg_catalog.pg_policies policies
  WHERE policies.schemaname = 'public'
    AND policies.tablename IN (SELECT table_name FROM ticket_tables)
),
relation_acl AS MATERIALIZED (
  SELECT relation_row.relname AS object_name,
    CASE relation_row.relkind WHEN 'S' THEN 'sequence' ELSE 'table' END AS object_type,
    CASE WHEN acl.grantee = 0 THEN 'PUBLIC' ELSE grantee.rolname END AS grantee,
    acl.privilege_type, acl.is_grantable
  FROM pg_catalog.pg_class relation_row
  JOIN pg_catalog.pg_namespace namespace_row ON namespace_row.oid = relation_row.relnamespace
  CROSS JOIN LATERAL pg_catalog.aclexplode(
    coalesce(
      relation_row.relacl,
      pg_catalog.acldefault(
        CASE WHEN relation_row.relkind = 'S' THEN 'S'::"char" ELSE 'r'::"char" END,
        relation_row.relowner
      )
    )
  ) acl
  LEFT JOIN pg_catalog.pg_roles grantee ON grantee.oid = acl.grantee
  WHERE namespace_row.nspname = 'public'
    AND relation_row.relname IN (SELECT object_name FROM expected_relations)
    AND (acl.grantee = 0 OR grantee.rolname IN ('anon', 'authenticated', 'service_role'))
),
permission_inventory AS MATERIALIZED (
  SELECT permission_row.key, permission_row.name, permission_row.description,
    permission_row.category
  FROM public.admin_permissions permission_row
  WHERE permission_row.key LIKE 'support_tickets.%'
     OR permission_row.category = 'support_tickets'
),
missing_role_links AS MATERIALIZED (
  SELECT role_row.key AS role_key, expected.permission_key
  FROM public.admin_roles role_row
  CROSS JOIN (VALUES
    ('support_tickets.view_own'::text),
    ('support_tickets.create'::text),
    ('support_tickets.reply_own'::text)
  ) expected(permission_key)
  LEFT JOIN public.admin_permissions permission_row ON permission_row.key = expected.permission_key
  LEFT JOIN public.admin_role_permissions link
    ON link.role_id = role_row.id AND link.permission_id = permission_row.id
  WHERE role_row.is_active IS TRUE
    AND role_row.key <> 'superadmin'
    AND link.role_id IS NULL
  UNION ALL
  SELECT role_row.key, 'support_tickets.manage'
  FROM public.admin_roles role_row
  LEFT JOIN public.admin_permissions permission_row ON permission_row.key = 'support_tickets.manage'
  LEFT JOIN public.admin_role_permissions link
    ON link.role_id = role_row.id AND link.permission_id = permission_row.id
  WHERE role_row.is_active IS TRUE
    AND role_row.key = 'superadmin'
    AND link.role_id IS NULL
),
unexpected_role_links AS MATERIALIZED (
  SELECT role_row.key AS role_key, permission_row.key AS permission_key
  FROM public.admin_role_permissions link
  JOIN public.admin_roles role_row ON role_row.id = link.role_id
  JOIN public.admin_permissions permission_row ON permission_row.id = link.permission_id
  WHERE permission_row.key LIKE 'support_tickets.%'
    AND NOT (
      (role_row.is_active IS TRUE AND role_row.key <> 'superadmin'
       AND permission_row.key IN ('support_tickets.view_own', 'support_tickets.create', 'support_tickets.reply_own'))
      OR
      (role_row.is_active IS TRUE AND role_row.key = 'superadmin'
       AND permission_row.key = 'support_tickets.manage')
    )
),
role_link_duplicates AS MATERIALIZED (
  SELECT count(*)::bigint AS duplicate_combination_count
  FROM (
    SELECT 1
    FROM public.admin_role_permissions
    GROUP BY role_id, permission_id
    HAVING count(*) > 1
  ) duplicates
),
email_inventory AS MATERIALIZED (
  SELECT setting.notification_type, setting.email_enabled
  FROM public.notification_email_settings setting
  WHERE setting.notification_type LIKE 'ticket_%'
),
data_counts AS MATERIALIZED (
  SELECT
    (SELECT count(*) FROM public.support_tickets)::bigint AS support_ticket_count,
    (SELECT count(*) FROM public.support_ticket_messages)::bigint AS support_ticket_message_count,
    (SELECT count(*) FROM public.support_ticket_events)::bigint AS support_ticket_event_count
),
sequence_inventory AS MATERIALIZED (
  SELECT sequence_row.data_type, sequence_row.start_value,
    sequence_row.min_value AS minimum_value,
    sequence_row.max_value AS maximum_value,
    sequence_row.increment_by AS increment,
    sequence_row.cycle AS cycle_option,
    sequence_row.cache_size
  FROM pg_catalog.pg_sequences sequence_row
  WHERE sequence_row.schemaname = 'public'
    AND sequence_row.sequencename = 'support_ticket_number_seq'
),
arbiter_indexes AS MATERIALIZED (
  SELECT index_row.relname AS index_name,
    index_meta.indisunique AS is_unique,
    index_meta.indisprimary AS is_primary,
    index_meta.indisexclusion AS is_exclusion,
    index_meta.indisvalid AS is_valid,
    index_meta.indisready AS is_ready,
    index_meta.indpred IS NOT NULL AS is_partial,
    index_meta.indexprs IS NOT NULL AS has_expressions,
    ARRAY(
      SELECT attribute_row.attname::text
      FROM pg_catalog.unnest(index_meta.indkey::smallint[]) WITH ORDINALITY key_column(attribute_number, key_order)
      JOIN pg_catalog.pg_attribute attribute_row
        ON attribute_row.attrelid = index_meta.indrelid
       AND attribute_row.attnum = key_column.attribute_number
      WHERE key_column.key_order <= index_meta.indnkeyatts
      ORDER BY key_column.key_order
    ) AS key_columns,
    (
      index_meta.indisunique IS TRUE
      AND index_meta.indisexclusion IS FALSE
      AND index_meta.indisvalid IS TRUE
      AND index_meta.indisready IS TRUE
      AND index_meta.indpred IS NULL
      AND index_meta.indexprs IS NULL
      AND index_meta.indnkeyatts = 2
      AND (
        SELECT pg_catalog.array_agg(attribute_row.attname::text ORDER BY attribute_row.attname::text)
        FROM pg_catalog.unnest(index_meta.indkey::smallint[]) WITH ORDINALITY key_column(attribute_number, key_order)
        JOIN pg_catalog.pg_attribute attribute_row
          ON attribute_row.attrelid = index_meta.indrelid
         AND attribute_row.attnum = key_column.attribute_number
        WHERE key_column.key_order <= index_meta.indnkeyatts
      ) = ARRAY['permission_id', 'role_id']::text[]
    ) AS supports_conflict_inference
  FROM pg_catalog.pg_index index_meta
  JOIN pg_catalog.pg_class table_row ON table_row.oid = index_meta.indrelid
  JOIN pg_catalog.pg_namespace namespace_row ON namespace_row.oid = table_row.relnamespace
  JOIN pg_catalog.pg_class index_row ON index_row.oid = index_meta.indexrelid
  WHERE namespace_row.nspname = 'public'
    AND table_row.relname = 'admin_role_permissions'
),
contract_summary AS MATERIALIZED (
  SELECT
    (SELECT bool_and(object_exists AND actual_kind = expected_kind) FROM relation_inventory) AS all_expected_relations_exist,
    (
      (SELECT bool_and(matches) FROM column_contract)
      AND (SELECT count(*) FROM column_inventory) = (SELECT count(*) FROM expected_columns)
    ) AS table_shapes_match,
    (
      NOT EXISTS (
        SELECT 1 FROM expected_constraints expected
        LEFT JOIN constraint_inventory actual
          ON actual.table_name = expected.table_name AND actual.constraint_name = expected.constraint_name
        WHERE actual.constraint_name IS NULL OR actual.validated IS NOT TRUE
      )
      AND (SELECT count(*) FROM constraint_inventory) = (SELECT count(*) FROM expected_constraints)
    ) AS constraints_present,
    NOT EXISTS (
      SELECT 1 FROM expected_indexes expected
      LEFT JOIN index_inventory actual ON actual.index_name = expected.index_name
      WHERE actual.index_name IS NULL OR actual.is_valid IS NOT TRUE OR actual.is_ready IS NOT TRUE
    ) AS indexes_present,
    NOT EXISTS (
      SELECT 1 FROM expected_triggers expected
      LEFT JOIN trigger_inventory actual
        ON actual.table_name = expected.table_name AND actual.trigger_name = expected.trigger_name
      WHERE actual.trigger_name IS NULL OR actual.enabled <> 'O'
    ) AS triggers_present,
    (
      (SELECT count(*) FROM function_inventory) = 1
      AND EXISTS (
        SELECT 1 FROM function_inventory
        WHERE language = 'plpgsql' AND security_definer IS TRUE
          AND result_type = 'trigger'
          AND configuration @> '["search_path=pg_catalog"]'::jsonb
      )
    ) AS function_present,
    ((SELECT count(*) FROM rls_inventory) = 3 AND (SELECT bool_and(rls_enabled) FROM rls_inventory)) AS rls_enabled,
    (SELECT count(*) FROM policy_inventory)::bigint AS unexpected_policies_count,
    NOT EXISTS (
      SELECT 1 FROM relation_acl
      WHERE grantee IN ('PUBLIC', 'anon', 'authenticated')
    ) AND NOT EXISTS (
      SELECT 1 FROM function_acl
      WHERE grantee IN ('PUBLIC', 'anon', 'authenticated') AND privilege_type = 'EXECUTE'
    ) AS browser_access_absent,
    (
      (SELECT coalesce(array_agg(privilege_type ORDER BY privilege_type), ARRAY[]::text[])
       FROM relation_acl WHERE object_name = 'support_tickets' AND grantee = 'service_role') = ARRAY['INSERT', 'SELECT', 'UPDATE']::text[]
      AND
      (SELECT coalesce(array_agg(privilege_type ORDER BY privilege_type), ARRAY[]::text[])
       FROM relation_acl WHERE object_name = 'support_ticket_messages' AND grantee = 'service_role') = ARRAY['INSERT', 'SELECT']::text[]
      AND
      (SELECT coalesce(array_agg(privilege_type ORDER BY privilege_type), ARRAY[]::text[])
       FROM relation_acl WHERE object_name = 'support_ticket_events' AND grantee = 'service_role') = ARRAY['INSERT', 'SELECT']::text[]
      AND
      (SELECT coalesce(array_agg(privilege_type ORDER BY privilege_type), ARRAY[]::text[])
       FROM relation_acl WHERE object_name = 'support_ticket_number_seq' AND grantee = 'service_role') = ARRAY['SELECT', 'USAGE']::text[]
      AND
      (SELECT coalesce(array_agg(privilege_type ORDER BY privilege_type), ARRAY[]::text[])
       FROM function_acl WHERE grantee = 'service_role') = ARRAY['EXECUTE']::text[]
    ) AS service_role_grants_match,
    (SELECT count(*) FROM permission_inventory)::bigint AS support_permission_count,
    (
      (SELECT count(*) FROM permission_inventory) = 4
      AND NOT EXISTS (
        SELECT 1 FROM expected_permissions expected
        LEFT JOIN permission_inventory actual ON actual.key = expected.permission_key
        WHERE actual.key IS NULL OR actual.name <> expected.permission_name
          OR actual.description <> expected.permission_description
          OR actual.category <> expected.category
      )
    ) AS support_permissions_match,
    (SELECT count(*) FROM missing_role_links)::bigint AS missing_role_permission_links,
    (SELECT count(*) FROM unexpected_role_links)::bigint AS unexpected_role_permission_links,
    (SELECT duplicate_combination_count FROM role_link_duplicates) AS duplicate_role_permission_links,
    (SELECT count(*) FROM email_inventory)::bigint AS ticket_email_setting_count,
    (
      (SELECT count(*) FROM email_inventory) = 3
      AND NOT EXISTS (
        SELECT 1 FROM expected_email_types expected
        LEFT JOIN email_inventory actual ON actual.notification_type = expected.notification_type
        WHERE actual.notification_type IS NULL OR actual.email_enabled IS DISTINCT FROM FALSE
      )
    ) AS ticket_email_all_disabled,
    counts.support_ticket_count,
    counts.support_ticket_message_count,
    counts.support_ticket_event_count,
    EXISTS (SELECT 1 FROM arbiter_indexes WHERE supports_conflict_inference) AS role_permission_conflict_arbiter_valid,
    (SELECT duplicate_combination_count FROM role_link_duplicates) AS role_permission_duplicate_combination_count,
    ((SELECT count(*) FROM sequence_inventory) = 1) AS sequence_present
  FROM data_counts counts
),
rows AS (
  SELECT 'STPC.01_RELATIONS'::text AS result_block, 10 AS result_order,
    row_number() OVER (ORDER BY object_name)::bigint AS row_order,
    'relation'::text AS row_type,
    jsonb_build_object('schema', 'public', 'object_name', object_name,
      'expected_kind', expected_kind, 'actual_kind', actual_kind,
      'exists', object_exists) AS data
  FROM relation_inventory

  UNION ALL
  SELECT 'STPC.02_COLUMNS', 20,
    row_number() OVER (ORDER BY table_name, ordinal_position)::bigint,
    'column',
    jsonb_build_object('table_name', table_name, 'ordinal_position', ordinal_position,
      'column_name', column_name, 'data_type', data_type, 'udt_name', udt_name,
      'is_nullable', is_nullable, 'column_default', column_default,
      'is_identity', is_identity, 'identity_generation', identity_generation,
      'is_generated', is_generated, 'generation_expression', generation_expression)
  FROM column_inventory

  UNION ALL
  SELECT 'STPC.03_TABLE_SHAPE', 30,
    row_number() OVER (ORDER BY table_name, ordinal_position)::bigint,
    CASE WHEN matches THEN 'expected_column_ok' ELSE 'column_mismatch' END,
    jsonb_build_object('table_name', table_name, 'column_name', column_name,
      'expected_ordinal_position', ordinal_position, 'actual_ordinal_position', actual_ordinal_position,
      'expected_udt_name', udt_name, 'actual_udt_name', actual_udt_name,
      'expected_nullable', is_nullable, 'actual_nullable', actual_is_nullable,
      'expected_default_pattern', default_pattern, 'actual_default', actual_default,
      'matches', matches)
  FROM column_contract

  UNION ALL
  SELECT 'STPC.04_CONSTRAINTS', 40,
    row_number() OVER (ORDER BY table_name, constraint_name)::bigint,
    'constraint',
    jsonb_build_object('table_name', table_name, 'constraint_name', constraint_name,
      'constraint_type', constraint_type, 'definition', definition,
      'validated', validated, 'target_schema', target_schema,
      'target_table', target_table, 'on_update', on_update, 'on_delete', on_delete)
  FROM constraint_inventory

  UNION ALL
  SELECT 'STPC.05_INDEXES', 50,
    row_number() OVER (ORDER BY table_name, index_name)::bigint,
    'index',
    jsonb_build_object('table_name', table_name, 'index_name', index_name,
      'definition', definition, 'unique', is_unique, 'primary', is_primary,
      'valid', is_valid, 'ready', is_ready, 'partial', is_partial,
      'expressions', has_expressions)
  FROM index_inventory

  UNION ALL
  SELECT 'STPC.06_TRIGGERS', 60,
    row_number() OVER (ORDER BY table_name, trigger_name)::bigint,
    'trigger',
    jsonb_build_object('table_name', table_name, 'trigger_name', trigger_name,
      'enabled', enabled, 'definition', definition)
  FROM trigger_inventory

  UNION ALL
  SELECT 'STPC.07_FUNCTION', 70, 1::bigint, 'function',
    jsonb_build_object('schema', 'public', 'function_name', function_name,
      'identity_arguments', identity_arguments, 'result_type', result_type,
      'language', language, 'security_definer', security_definer,
      'owner', owner, 'configuration', configuration, 'definition', definition)
  FROM function_inventory

  UNION ALL
  SELECT 'STPC.08_FUNCTION_ACL', 80,
    row_number() OVER (ORDER BY grantee, privilege_type)::bigint,
    'function_grant',
    jsonb_build_object('function_name', 'touch_support_ticket_from_message',
      'grantee', grantee, 'privilege_type', privilege_type,
      'is_grantable', is_grantable)
  FROM function_acl

  UNION ALL
  SELECT 'STPC.09_RLS_POLICIES', 90,
    row_number() OVER (ORDER BY row_type, table_name, object_name)::bigint,
    row_type,
    details
  FROM (
    SELECT 'rls_state'::text AS row_type, table_name, table_name AS object_name,
      jsonb_build_object('table_name', table_name, 'rls_enabled', rls_enabled,
        'rls_forced', rls_forced) AS details
    FROM rls_inventory
    UNION ALL
    SELECT 'unexpected_policy', table_name, policyname,
      jsonb_build_object('table_name', table_name, 'policy_name', policyname,
        'command', cmd, 'permissive', permissive, 'roles', to_jsonb(roles),
        'using_expression', qual, 'with_check_expression', with_check)
    FROM policy_inventory
  ) rls_rows

  UNION ALL
  SELECT 'STPC.10_PRIVILEGES', 100,
    row_number() OVER (ORDER BY object_type, object_name, grantee, privilege_type)::bigint,
    'grant',
    jsonb_build_object('object_type', object_type, 'object_name', object_name,
      'grantee', grantee, 'privilege_type', privilege_type,
      'is_grantable', is_grantable)
  FROM relation_acl

  UNION ALL
  SELECT 'STPC.11_SUPPORT_PERMISSIONS', 110,
    row_number() OVER (ORDER BY key)::bigint,
    'permission',
    jsonb_build_object('key', key, 'name', name, 'description', description,
      'category', category)
  FROM permission_inventory

  UNION ALL
  SELECT 'STPC.12_ROLE_MAPPINGS', 120,
    row_number() OVER (ORDER BY issue_type, role_key, permission_key)::bigint,
    issue_type,
    jsonb_build_object('role_key', role_key, 'permission_key', permission_key)
  FROM (
    SELECT 'missing_expected_link'::text AS issue_type, role_key, permission_key FROM missing_role_links
    UNION ALL
    SELECT 'unexpected_link', role_key, permission_key FROM unexpected_role_links
  ) mapping_issues

  UNION ALL
  SELECT 'STPC.13_EMAIL_SETTINGS', 130,
    row_number() OVER (ORDER BY notification_type)::bigint,
    'email_setting',
    jsonb_build_object('notification_type', notification_type,
      'email_enabled', email_enabled)
  FROM email_inventory

  UNION ALL
  SELECT 'STPC.14_COUNTS_SEQUENCE', 140, 1::bigint, 'ticket_counts',
    jsonb_build_object('support_tickets', support_ticket_count,
      'support_ticket_messages', support_ticket_message_count,
      'support_ticket_events', support_ticket_event_count)
  FROM data_counts
  UNION ALL
  SELECT 'STPC.14_COUNTS_SEQUENCE', 140, 2::bigint, 'sequence_configuration',
    jsonb_build_object('sequence_name', 'support_ticket_number_seq',
      'data_type', data_type, 'start_value', start_value,
      'minimum_value', minimum_value, 'maximum_value', maximum_value,
      'increment', increment, 'cycle_option', cycle_option,
      'cache_size', cache_size)
  FROM sequence_inventory

  UNION ALL
  SELECT 'STPC.15_ROLE_PERMISSION_ARBITER', 150,
    row_number() OVER (ORDER BY index_name)::bigint,
    'index',
    jsonb_build_object('index_name', index_name, 'key_columns', key_columns,
      'unique', is_unique, 'primary', is_primary, 'exclusion', is_exclusion,
      'valid', is_valid, 'ready', is_ready, 'partial', is_partial,
      'expressions', has_expressions,
      'supports_conflict_inference', supports_conflict_inference,
      'duplicate_combination_count', (SELECT duplicate_combination_count FROM role_link_duplicates))
  FROM arbiter_indexes

  UNION ALL
  SELECT 'STPC.16_SUMMARY', 160, 1::bigint, 'summary',
    to_jsonb(summary) || jsonb_build_object(
      'overall_contract_ok',
      summary.all_expected_relations_exist
      AND summary.table_shapes_match
      AND summary.constraints_present
      AND summary.indexes_present
      AND summary.triggers_present
      AND summary.function_present
      AND summary.rls_enabled
      AND summary.unexpected_policies_count = 0
      AND summary.browser_access_absent
      AND summary.service_role_grants_match
      AND summary.support_permission_count = 4
      AND summary.support_permissions_match
      AND summary.missing_role_permission_links = 0
      AND summary.unexpected_role_permission_links = 0
      AND summary.duplicate_role_permission_links = 0
      AND summary.ticket_email_setting_count = 3
      AND summary.ticket_email_all_disabled
      AND summary.support_ticket_count = 0
      AND summary.support_ticket_message_count = 0
      AND summary.support_ticket_event_count = 0
      AND summary.role_permission_conflict_arbiter_valid
      AND summary.role_permission_duplicate_combination_count = 0
      AND summary.sequence_present
    )
  FROM contract_summary summary
),
rows_with_markers AS (
  SELECT result_block, result_order, row_order, row_type, data FROM rows
  UNION ALL
  SELECT block.result_block, block.result_order, 1::bigint,
    'empty'::text,
    jsonb_build_object('checked', true, 'result', 'no_rows',
      'message', 'Pruefung ausgefuehrt, keine passenden Zeilen gefunden.')
  FROM all_blocks block
  WHERE NOT EXISTS (
    SELECT 1 FROM rows existing WHERE existing.result_block = block.result_block
  )
)
SELECT result_block, result_order, row_order, row_type, data
FROM rows_with_markers
ORDER BY result_order, row_order;
