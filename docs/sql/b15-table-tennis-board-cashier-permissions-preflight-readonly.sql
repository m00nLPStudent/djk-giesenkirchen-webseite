-- B15: Vorstand Tischtennis / Kassierer permission preflight (READ ONLY)
-- Run manually in the Supabase SQL Editor and export the single result set as CSV.
-- This statement does not call application functions and does not expose profile data.

WITH
target_roles(role_key, repository_scope) AS MATERIALIZED (
  VALUES
    ('superadmin', 'global'),
    ('vorstand', 'club/read_only'),
    ('fussball-vorstand', 'department_manager:fussball'),
    ('tischtennis-vorstand', 'department_manager:tischtennis'),
    ('damen-gymnastik-vorstand', 'own_board_card/read_only'),
    ('behindertensport-vorstand', 'own_board_card/read_only'),
    ('jugendleiter', 'youth_all:fussball-results'),
    ('trainer', 'assigned_teams/targeted_mutations'),
    ('betreuer', 'assigned_teams/own_content'),
    ('redakteur', 'own_content/read_only'),
    ('kassierer', 'own_profile/read_only'),
    ('webmaster', 'read_only/global-by-explicit-permission'),
    ('gast', 'read_only')
),
permission_families(permission_family, permission_prefix) AS MATERIALIZED (
  VALUES
    ('news', 'news.'),
    ('events', 'events.'),
    ('settings', 'settings.'),
    ('contributions', 'contributions.')
),
catalog_permissions AS MATERIALIZED (
  SELECT
    p.id,
    p.key AS permission_key,
    pf.permission_family
  FROM public.admin_permissions AS p
  JOIN permission_families AS pf
    ON p.key LIKE pf.permission_prefix || '%'
),
active_roles AS MATERIALIZED (
  SELECT r.id, r.key AS role_key, r.name, r.description, r.is_active
  FROM public.admin_roles AS r
  WHERE r.is_active = true
),
role_permission_matrix AS MATERIALIZED (
  SELECT
    r.role_key,
    r.name AS role_name,
    COALESCE(tr.repository_scope, 'repository-scope-not-explicitly-mapped') AS repository_scope,
    p.permission_family,
    p.permission_key,
    EXISTS (
      SELECT 1
      FROM public.admin_role_permissions AS arp
      WHERE arp.role_id = r.id
        AND arp.permission_id = p.id
    ) AS assigned
  FROM active_roles AS r
  CROSS JOIN catalog_permissions AS p
  LEFT JOIN target_roles AS tr ON tr.role_key = r.role_key
),
contribution_permissions AS MATERIALIZED (
  SELECT *
  FROM catalog_permissions
  WHERE permission_family = 'contributions'
),
eligible_routines AS MATERIALIZED (
  SELECT
    p.oid,
    p.proname,
    p.prosecdef,
    p.proowner,
    p.proacl,
    p.proconfig,
    n.nspname,
    p.oid::regprocedure::text AS routine_signature
  FROM pg_catalog.pg_proc AS p
  JOIN pg_catalog.pg_namespace AS n ON n.oid = p.pronamespace
  WHERE p.prokind IN ('f', 'p')
    AND n.nspname IN ('public', 'auth')
),
routine_definitions AS MATERIALIZED (
  SELECT
    r.*,
    pg_catalog.pg_get_functiondef(r.oid) AS definition
  FROM eligible_routines AS r
),
relevant_routines AS MATERIALIZED (
  SELECT *
  FROM routine_definitions
  WHERE lower(proname) LIKE ANY (ARRAY[
      '%permission%', '%contribution%', '%payment%', '%news%', '%event%', '%admin%'
    ])
     OR lower(definition) LIKE ANY (ARRAY[
      '%player_contributions%', '%player_contribution_payments%',
      '%admin_role_permissions%', '%news%', '%events%'
    ])
),
blocks(result_block, result_order) AS MATERIALIZED (
  VALUES
    ('P1_TARGET_ROLE_DISCOVERY', 1),
    ('P2_PERMISSION_CATALOG', 2),
    ('P3_TABLE_TENNIS_BOARD_ASSIGNMENTS', 3),
    ('P4_CASHIER_ASSIGNMENTS', 4),
    ('P5_NEWS_ROLE_MATRIX', 5),
    ('P6_EVENT_ROLE_MATRIX', 6),
    ('P7_SETTINGS_ROLE_MATRIX', 7),
    ('P8_CONTRIBUTION_ROLE_MATRIX', 8),
    ('P9_ACTIVE_ROLE_ASSIGNMENT_COUNTS', 9),
    ('P10_REPOSITORY_SCOPE_EXPECTATIONS', 10),
    ('P11_DEPARTMENT_FOUNDATION', 11),
    ('P12_RESOURCE_SCOPE_COLUMNS', 12),
    ('P13_RELATION_RLS', 13),
    ('P14_RELEVANT_POLICIES', 14),
    ('P15_TABLE_GRANTS', 15),
    ('P16_COLUMN_GRANTS', 16),
    ('P17_RELEVANT_HELPER_FUNCTIONS', 17),
    ('P18_FUNCTION_EXECUTE_ACL', 18),
    ('P19_RELEVANT_TRIGGERS', 19),
    ('P20_CONSTRAINTS_AND_INDEXES', 20),
    ('P21_DUPLICATE_ROLE_PERMISSION_LINKS', 21),
    ('P22_FULL_CONTRIBUTION_MANAGERS', 22),
    ('P23_PARTIAL_CONTRIBUTION_ROLES', 23),
    ('P24_EXPECTED_PERMISSION_KEYS', 24),
    ('P25_INTEGRITY_SUMMARY', 25)
),
rows(result_block, result_order, sort_key, data) AS MATERIALIZED (
  SELECT
    'P1_TARGET_ROLE_DISCOVERY', 1, tr.role_key,
    jsonb_build_object(
      'role_key', tr.role_key,
      'repository_scope', tr.repository_scope,
      'exists', r.id IS NOT NULL,
      'is_active', r.is_active,
      'role_name', r.name
    )
  FROM target_roles AS tr
  LEFT JOIN public.admin_roles AS r ON r.key = tr.role_key

  UNION ALL
  SELECT
    'P2_PERMISSION_CATALOG', 2, cp.permission_key,
    jsonb_build_object(
      'permission_family', cp.permission_family,
      'permission_key', cp.permission_key,
      'catalog_row', to_jsonb(p) - 'id'
    )
  FROM catalog_permissions AS cp
  JOIN public.admin_permissions AS p ON p.id = cp.id

  UNION ALL
  SELECT
    'P3_TABLE_TENNIS_BOARD_ASSIGNMENTS', 3, p.key,
    jsonb_build_object('role_key', r.key, 'permission_key', p.key)
  FROM public.admin_roles AS r
  JOIN public.admin_role_permissions AS arp ON arp.role_id = r.id
  JOIN public.admin_permissions AS p ON p.id = arp.permission_id
  WHERE r.key = 'tischtennis-vorstand'

  UNION ALL
  SELECT
    'P4_CASHIER_ASSIGNMENTS', 4, p.key,
    jsonb_build_object('role_key', r.key, 'permission_key', p.key)
  FROM public.admin_roles AS r
  JOIN public.admin_role_permissions AS arp ON arp.role_id = r.id
  JOIN public.admin_permissions AS p ON p.id = arp.permission_id
  WHERE r.key = 'kassierer'

  UNION ALL
  SELECT
    'P5_NEWS_ROLE_MATRIX', 5, role_key || ':' || permission_key,
    jsonb_build_object(
      'role_key', role_key,
      'role_name', role_name,
      'repository_scope', repository_scope,
      'permission_key', permission_key,
      'assigned', assigned,
      'repository_scope_warning', 'News rows have no server-side department filter in the current repository contract. Assigned news permissions are global.'
    )
  FROM role_permission_matrix
  WHERE permission_family = 'news'

  UNION ALL
  SELECT
    'P6_EVENT_ROLE_MATRIX', 6, role_key || ':' || permission_key,
    jsonb_build_object(
      'role_key', role_key,
      'role_name', role_name,
      'repository_scope', repository_scope,
      'permission_key', permission_key,
      'assigned', assigned,
      'repository_scope_warning', 'General event rows are permission-global. Only virtual team training occurrences are filtered by team scope in the current repository contract.'
    )
  FROM role_permission_matrix
  WHERE permission_family = 'events'

  UNION ALL
  SELECT
    'P7_SETTINGS_ROLE_MATRIX', 7, role_key || ':' || permission_key,
    jsonb_build_object(
      'role_key', role_key,
      'role_name', role_name,
      'repository_scope', repository_scope,
      'permission_key', permission_key,
      'assigned', assigned,
      'route_contract', 'settings.view controls navigation and /admin/settings. settings.edit controls mutations.'
    )
  FROM role_permission_matrix
  WHERE permission_family = 'settings'

  UNION ALL
  SELECT
    'P8_CONTRIBUTION_ROLE_MATRIX', 8, role_key || ':' || permission_key,
    jsonb_build_object(
      'role_key', role_key,
      'role_name', role_name,
      'repository_scope', repository_scope,
      'permission_key', permission_key,
      'assigned', assigned,
      'repository_scope_warning', 'Contribution routes and actions are permission-only and use a server-side service client after authorization. No department predicate exists.'
    )
  FROM role_permission_matrix
  WHERE permission_family = 'contributions'

  UNION ALL
  SELECT
    'P9_ACTIVE_ROLE_ASSIGNMENT_COUNTS', 9, r.key,
    jsonb_build_object(
      'role_key', r.key,
      'active_role', r.is_active,
      'assignment_count', count(aur.role_id),
      'active_profile_assignment_count', count(aur.role_id) FILTER (WHERE ap.is_active = true)
    )
  FROM public.admin_roles AS r
  LEFT JOIN public.admin_user_roles AS aur ON aur.role_id = r.id
  LEFT JOIN public.admin_profiles AS ap ON ap.id = aur.user_id
  WHERE r.key IN (SELECT role_key FROM target_roles)
  GROUP BY r.key, r.is_active

  UNION ALL
  SELECT
    'P10_REPOSITORY_SCOPE_EXPECTATIONS', 10, role_key,
    jsonb_build_object('role_key', role_key, 'repository_scope', repository_scope)
  FROM target_roles

  UNION ALL
  SELECT
    'P11_DEPARTMENT_FOUNDATION', 11, d.slug,
    jsonb_build_object(
      'slug', d.slug,
      'name_de', d.name_de,
      'is_active', d.is_active,
      'team_count', (SELECT count(*) FROM public.teams AS t WHERE t.department_id = d.id)
    )
  FROM public.departments AS d
  WHERE d.slug IN ('fussball', 'tischtennis')

  UNION ALL
  SELECT
    'P12_RESOURCE_SCOPE_COLUMNS', 12, c.table_name || ':' || lpad(c.ordinal_position::text, 4, '0'),
    jsonb_build_object(
      'table_name', c.table_name,
      'column_name', c.column_name,
      'data_type', c.data_type,
      'is_nullable', c.is_nullable,
      'scope_relevant', c.column_name IN ('department_id', 'team_id', 'football_team_id', 'organization_scope', 'created_by')
    )
  FROM information_schema.columns AS c
  WHERE c.table_schema = 'public'
    AND c.table_name IN ('news', 'news_documents', 'events', 'event_documents', 'player_contributions', 'player_contribution_payments')

  UNION ALL
  SELECT
    'P13_RELATION_RLS', 13, c.relname,
    jsonb_build_object(
      'relation', format('%I.%I', n.nspname, c.relname),
      'relkind', c.relkind,
      'owner', pg_catalog.pg_get_userbyid(c.relowner),
      'rls_enabled', c.relrowsecurity,
      'force_rls', c.relforcerowsecurity
    )
  FROM pg_catalog.pg_class AS c
  JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname IN ('news', 'news_documents', 'events', 'event_documents', 'player_contributions', 'player_contribution_payments')
    AND c.relkind IN ('r', 'p', 'v', 'm')

  UNION ALL
  SELECT
    'P14_RELEVANT_POLICIES', 14, p.tablename || ':' || p.policyname,
    jsonb_build_object(
      'table_name', p.tablename,
      'policy_name', p.policyname,
      'permissive', p.permissive,
      'roles', p.roles,
      'command', p.cmd,
      'using', p.qual,
      'with_check', p.with_check
    )
  FROM pg_catalog.pg_policies AS p
  WHERE p.schemaname = 'public'
    AND p.tablename IN ('news', 'news_documents', 'events', 'event_documents', 'player_contributions', 'player_contribution_payments')

  UNION ALL
  SELECT
    'P15_TABLE_GRANTS', 15, g.table_name || ':' || g.grantee || ':' || g.privilege_type,
    jsonb_build_object(
      'table_name', g.table_name,
      'grantee', g.grantee,
      'privilege_type', g.privilege_type,
      'is_grantable', g.is_grantable
    )
  FROM information_schema.role_table_grants AS g
  WHERE g.table_schema = 'public'
    AND g.table_name IN ('news', 'news_documents', 'events', 'event_documents', 'player_contributions', 'player_contribution_payments')
    AND g.grantee IN ('anon', 'authenticated', 'service_role', 'postgres')

  UNION ALL
  SELECT
    'P16_COLUMN_GRANTS', 16, g.table_name || ':' || g.grantee || ':' || g.column_name || ':' || g.privilege_type,
    jsonb_build_object(
      'table_name', g.table_name,
      'grantee', g.grantee,
      'column_name', g.column_name,
      'privilege_type', g.privilege_type,
      'is_grantable', g.is_grantable
    )
  FROM information_schema.role_column_grants AS g
  WHERE g.table_schema = 'public'
    AND g.table_name IN ('news', 'news_documents', 'events', 'event_documents', 'player_contributions', 'player_contribution_payments')
    AND g.grantee IN ('anon', 'authenticated', 'service_role')

  UNION ALL
  SELECT
    'P17_RELEVANT_HELPER_FUNCTIONS', 17, routine_signature,
    jsonb_build_object(
      'signature', routine_signature,
      'owner', pg_catalog.pg_get_userbyid(proowner),
      'security_definer', prosecdef,
      'proconfig', proconfig,
      'definition', definition
    )
  FROM relevant_routines

  UNION ALL
  SELECT
    'P18_FUNCTION_EXECUTE_ACL', 18,
    rr.routine_signature || ':' || role_name.role_name,
    jsonb_build_object(
      'signature', rr.routine_signature,
      'role', role_name.role_name,
      'effective_execute', CASE
        WHEN role_name.role_name = 'PUBLIC' THEN EXISTS (
          SELECT 1
          FROM pg_catalog.aclexplode(COALESCE(rr.proacl, pg_catalog.acldefault('f', rr.proowner))) AS acl
          WHERE acl.grantee = 0 AND acl.privilege_type = 'EXECUTE'
        )
        ELSE pg_catalog.has_function_privilege(role_name.role_name, rr.oid, 'EXECUTE')
      END
    )
  FROM relevant_routines AS rr
  CROSS JOIN (VALUES ('PUBLIC'), ('anon'), ('authenticated'), ('service_role')) AS role_name(role_name)

  UNION ALL
  SELECT
    'P19_RELEVANT_TRIGGERS', 19, c.relname || ':' || t.tgname,
    jsonb_build_object(
      'table_name', c.relname,
      'trigger_name', t.tgname,
      'enabled', t.tgenabled,
      'definition', pg_catalog.pg_get_triggerdef(t.oid, true)
    )
  FROM pg_catalog.pg_trigger AS t
  JOIN pg_catalog.pg_class AS c ON c.oid = t.tgrelid
  JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname IN ('news', 'news_documents', 'events', 'event_documents', 'player_contributions', 'player_contribution_payments')
    AND NOT t.tgisinternal

  UNION ALL
  SELECT
    'P20_CONSTRAINTS_AND_INDEXES', 20, source_type || ':' || table_name || ':' || object_name,
    jsonb_build_object(
      'source_type', source_type,
      'table_name', table_name,
      'object_name', object_name,
      'definition', definition
    )
  FROM (
    SELECT
      'constraint'::text AS source_type,
      c.relname AS table_name,
      con.conname AS object_name,
      pg_catalog.pg_get_constraintdef(con.oid, true) AS definition
    FROM pg_catalog.pg_constraint AS con
    JOIN pg_catalog.pg_class AS c ON c.oid = con.conrelid
    JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname IN ('news', 'events', 'player_contributions', 'player_contribution_payments')
    UNION ALL
    SELECT
      'index', tablename, indexname, indexdef
    FROM pg_catalog.pg_indexes
    WHERE schemaname = 'public'
      AND tablename IN ('news', 'events', 'player_contributions', 'player_contribution_payments')
  ) AS objects

  UNION ALL
  SELECT
    'P21_DUPLICATE_ROLE_PERMISSION_LINKS', 21, r.key || ':' || p.key,
    jsonb_build_object('role_key', r.key, 'permission_key', p.key, 'link_count', count(*))
  FROM public.admin_role_permissions AS arp
  JOIN public.admin_roles AS r ON r.id = arp.role_id
  JOIN public.admin_permissions AS p ON p.id = arp.permission_id
  GROUP BY r.key, p.key
  HAVING count(*) > 1

  UNION ALL
  SELECT
    'P22_FULL_CONTRIBUTION_MANAGERS', 22, rpm.role_key,
    jsonb_build_object(
      'role_key', rpm.role_key,
      'role_name', max(rpm.role_name),
      'repository_scope', max(rpm.repository_scope),
      'assigned_permission_count', count(*) FILTER (WHERE rpm.assigned),
      'catalog_permission_count', count(*),
      'has_full_catalog_set', bool_and(rpm.assigned),
      'superadmin', rpm.role_key = 'superadmin'
    )
  FROM role_permission_matrix AS rpm
  WHERE rpm.permission_family = 'contributions'
  GROUP BY rpm.role_key
  HAVING bool_and(rpm.assigned)

  UNION ALL
  SELECT
    'P23_PARTIAL_CONTRIBUTION_ROLES', 23, rpm.role_key,
    jsonb_build_object(
      'role_key', rpm.role_key,
      'role_name', max(rpm.role_name),
      'repository_scope', max(rpm.repository_scope),
      'assigned_permissions', jsonb_agg(rpm.permission_key ORDER BY rpm.permission_key) FILTER (WHERE rpm.assigned),
      'assigned_permission_count', count(*) FILTER (WHERE rpm.assigned),
      'catalog_permission_count', count(*)
    )
  FROM role_permission_matrix AS rpm
  WHERE rpm.permission_family = 'contributions'
  GROUP BY rpm.role_key
  HAVING count(*) FILTER (WHERE rpm.assigned) > 0
     AND NOT bool_and(rpm.assigned)

  UNION ALL
  SELECT
    'P24_EXPECTED_PERMISSION_KEYS', 24, expected.permission_key,
    jsonb_build_object(
      'permission_key', expected.permission_key,
      'exists', p.id IS NOT NULL,
      'permission_family', split_part(expected.permission_key, '.', 1)
    )
  FROM unnest(ARRAY[
    'news.view', 'news.create', 'news.edit', 'news.delete', 'news.publish',
    'events.view', 'events.create', 'events.edit', 'events.delete', 'events.publish',
    'settings.view', 'settings.edit',
    'contributions.view', 'contributions.create', 'contributions.edit',
    'contributions.record_payment', 'contributions.cancel_payment',
    'contributions.defer', 'contributions.exempt', 'contributions.cancel',
    'contributions.export'
  ]::text[]) AS expected(permission_key)
  LEFT JOIN public.admin_permissions AS p ON p.key = expected.permission_key

  UNION ALL
  SELECT
    'P25_INTEGRITY_SUMMARY', 25, 'overall',
    jsonb_build_object(
      'tischtennis_vorstand_active_count', (SELECT count(*) FROM active_roles WHERE role_key = 'tischtennis-vorstand'),
      'kassierer_active_count', (SELECT count(*) FROM active_roles WHERE role_key = 'kassierer'),
      'expected_permission_key_count', 21,
      'existing_expected_permission_key_count', (
        SELECT count(*) FROM public.admin_permissions
        WHERE key = ANY (ARRAY[
          'news.view', 'news.create', 'news.edit', 'news.delete', 'news.publish',
          'events.view', 'events.create', 'events.edit', 'events.delete', 'events.publish',
          'settings.view', 'settings.edit',
          'contributions.view', 'contributions.create', 'contributions.edit',
          'contributions.record_payment', 'contributions.cancel_payment',
          'contributions.defer', 'contributions.exempt', 'contributions.cancel',
          'contributions.export'
        ]::text[])
      ),
      'duplicate_role_permission_link_count', (
        SELECT count(*)
        FROM (
          SELECT role_id, permission_id
          FROM public.admin_role_permissions
          GROUP BY role_id, permission_id
          HAVING count(*) > 1
        ) AS duplicates
      ),
      'football_department_count', (SELECT count(*) FROM public.departments WHERE slug = 'fussball' AND is_active = true),
      'table_tennis_department_count', (SELECT count(*) FROM public.departments WHERE slug = 'tischtennis' AND is_active = true),
      'contribution_relation_count', (
        SELECT count(*) FROM pg_catalog.pg_class AS c
        JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relname IN ('player_contributions', 'player_contribution_payments')
          AND c.relkind IN ('r', 'p')
      ),
      'preflight_read_only', true
    )
),
numbered AS MATERIALIZED (
  SELECT
    r.result_block,
    r.result_order,
    row_number() OVER (PARTITION BY r.result_block ORDER BY r.sort_key)::bigint AS row_order,
    'data'::text AS row_type,
    r.data
  FROM rows AS r
),
with_markers AS MATERIALIZED (
  SELECT result_block, result_order, row_order, row_type, data
  FROM numbered
  UNION ALL
  SELECT
    b.result_block,
    b.result_order,
    1::bigint AS row_order,
    'empty'::text AS row_type,
    jsonb_build_object('empty', true, 'message', 'No rows returned for this diagnostic block') AS data
  FROM blocks AS b
  WHERE NOT EXISTS (
    SELECT 1 FROM numbered AS n WHERE n.result_block = b.result_block
  )
)
SELECT result_block, result_order, row_order, row_type, data
FROM with_markers
ORDER BY result_order, row_order;
