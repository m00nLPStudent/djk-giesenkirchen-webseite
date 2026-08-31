-- B15.24H1 – Tischtennis DB change postcheck (READ ONLY)
-- Manually execute only after the proposal has completed successfully.

-- H1P.01_BOARD_COLUMN_FK_INDEX
SELECT 'H1P.01_BOARD_COLUMN_FK_INDEX' AS section,
       EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'board_members'
           AND column_name = 'department_id' AND data_type = 'uuid' AND is_nullable = 'YES'
       ) AS nullable_department_uuid_exists,
       EXISTS (
         SELECT 1 FROM pg_catalog.pg_constraint c
         JOIN pg_catalog.pg_class t ON t.oid = c.conrelid
         JOIN pg_catalog.pg_namespace n ON n.oid = t.relnamespace
         JOIN pg_catalog.pg_class ref ON ref.oid = c.confrelid
         WHERE n.nspname = 'public' AND t.relname = 'board_members'
           AND c.conname = 'board_members_department_id_fkey'
           AND c.contype = 'f' AND ref.relname = 'departments'
           AND pg_catalog.pg_get_constraintdef(c.oid, true) LIKE '%ON DELETE RESTRICT%'
       ) AS department_fk_ok,
       EXISTS (
         SELECT 1 FROM pg_catalog.pg_indexes
         WHERE schemaname = 'public' AND tablename = 'board_members'
           AND indexname = 'board_members_department_id_idx'
       ) AS department_index_exists;

-- H1P.02_DEPARTMENT_AND_ROLE
SELECT 'H1P.02_DEPARTMENT_AND_ROLE' AS section,
       (SELECT count(*) FROM public.departments WHERE slug = 'tischtennis' AND is_active = true) AS active_tischtennis_departments,
       (SELECT count(*) FROM public.admin_roles WHERE key = 'tischtennis-vorstand' AND is_active = true) AS active_tischtennis_roles;

-- H1P.03_TISCHTENNIS_ROLE_PERMISSIONS
WITH expected(permission_key) AS (
  VALUES ('dashboard.view'),
    ('membership_requests.view'), ('membership_requests.edit'), ('membership_requests.forward'),
    ('teams.view'), ('teams.create'), ('teams.edit'), ('teams.delete'),
    ('players.view'), ('players.create'), ('players.edit'), ('players.delete'),
    ('coaches.view'), ('coaches.create'), ('coaches.edit'), ('coaches.delete'),
    ('board.view'), ('board.create'), ('board.edit'), ('board.delete')
)
SELECT 'H1P.03_TISCHTENNIS_ROLE_PERMISSIONS' AS section,
       expected.permission_key,
       permission_row.id IS NOT NULL AS permission_exists,
       role_permission.role_id IS NOT NULL AS assigned_to_tischtennis_vorstand
FROM expected
LEFT JOIN public.admin_permissions permission_row ON permission_row.key = expected.permission_key
LEFT JOIN public.admin_roles role_row ON role_row.key = 'tischtennis-vorstand'
LEFT JOIN public.admin_role_permissions role_permission
  ON role_permission.role_id = role_row.id AND role_permission.permission_id = permission_row.id
ORDER BY expected.permission_key;

-- H1P.04_BOARD_PERMISSION_COMPATIBILITY
SELECT 'H1P.04_BOARD_PERMISSION_COMPATIBILITY' AS section,
       role_row.key AS role_key,
       bool_or(permission_row.key = 'board.view') AS board_view,
       bool_or(permission_row.key = 'board.create') AS board_create,
       bool_or(permission_row.key = 'board.edit') AS board_edit,
       bool_or(permission_row.key = 'board.delete') AS board_delete,
       bool_or(permission_row.key = 'settings.edit') AS settings_edit
FROM public.admin_roles role_row
LEFT JOIN public.admin_role_permissions role_permission ON role_permission.role_id = role_row.id
LEFT JOIN public.admin_permissions permission_row ON permission_row.id = role_permission.permission_id
WHERE role_row.key = 'tischtennis-vorstand'
   OR EXISTS (
     SELECT 1 FROM public.admin_role_permissions old_mapping
     JOIN public.admin_permissions old_permission ON old_permission.id = old_mapping.permission_id
     WHERE old_mapping.role_id = role_row.id
       AND old_permission.key IN ('settings.view', 'settings.edit')
   )
GROUP BY role_row.key
ORDER BY role_row.key;

-- H1P.04A_NO_BOARD_CREATE_DELETE_ESCALATION
SELECT 'H1P.04A_NO_BOARD_CREATE_DELETE_ESCALATION' AS section,
       role_row.key AS role_key,
       permission_row.key AS permission_key
FROM public.admin_roles role_row
JOIN public.admin_role_permissions role_permission ON role_permission.role_id = role_row.id
JOIN public.admin_permissions permission_row ON permission_row.id = role_permission.permission_id
WHERE permission_row.key IN ('board.create', 'board.delete')
  AND role_row.key NOT IN ('superadmin', 'tischtennis-vorstand')
ORDER BY role_row.key, permission_row.key;

-- H1P.05_RLS
SELECT 'H1P.05_RLS' AS section, c.relname AS table_name,
       c.relrowsecurity AS rls_enabled, c.relforcerowsecurity AS force_rls
FROM pg_catalog.pg_class c
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN (
    'seasons', 'teams', 'team_seasons', 'players', 'player_team_seasons',
    'coaches', 'coach_team_seasons', 'team_training_times',
    'team_training_exceptions', 'board_members'
  )
ORDER BY c.relname;

-- H1P.06_WRITE_POLICIES
SELECT 'H1P.06_WRITE_POLICIES' AS section, tablename, policyname,
       permissive, roles, cmd, qual AS using_expression,
       with_check AS with_check_expression
FROM pg_catalog.pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'seasons', 'teams', 'team_seasons', 'players', 'player_team_seasons',
    'coaches', 'coach_team_seasons', 'team_training_times',
    'team_training_exceptions', 'board_members'
  )
  AND cmd IN ('ALL', 'INSERT', 'UPDATE', 'DELETE')
ORDER BY tablename, cmd, policyname;

-- H1P.06A_EXPECTED_WRITE_POLICIES
WITH expected(table_name, policy_name) AS (
  VALUES
    ('seasons', 'seasons_insert_permission'),
    ('seasons', 'seasons_update_permission'),
    ('seasons', 'seasons_delete_permission'),
    ('teams', 'teams_insert_department_permission'),
    ('teams', 'teams_update_department_permission'),
    ('teams', 'teams_delete_department_permission'),
    ('team_seasons', 'team_seasons_insert_department_permission'),
    ('team_seasons', 'team_seasons_update_department_permission'),
    ('team_seasons', 'team_seasons_delete_department_permission'),
    ('players', 'players_insert_permission'),
    ('players', 'players_update_permission'),
    ('players', 'players_delete_permission'),
    ('player_team_seasons', 'player_team_seasons_insert_department_permission'),
    ('player_team_seasons', 'player_team_seasons_update_department_permission'),
    ('player_team_seasons', 'player_team_seasons_delete_department_permission'),
    ('coaches', 'coaches_insert_permission'),
    ('coaches', 'coaches_update_permission'),
    ('coaches', 'coaches_delete_permission'),
    ('coach_team_seasons', 'coach_team_seasons_insert_department_permission'),
    ('coach_team_seasons', 'coach_team_seasons_update_department_permission'),
    ('coach_team_seasons', 'coach_team_seasons_delete_department_permission'),
    ('team_training_times', 'team_training_times_insert_department_permission'),
    ('team_training_times', 'team_training_times_update_department_permission'),
    ('team_training_times', 'team_training_times_delete_department_permission'),
    ('team_training_exceptions', 'team_training_exceptions_insert_department_permission'),
    ('team_training_exceptions', 'team_training_exceptions_update_department_permission'),
    ('team_training_exceptions', 'team_training_exceptions_delete_department_permission'),
    ('board_members', 'board_members_insert_department_permission'),
    ('board_members', 'board_members_update_department_permission'),
    ('board_members', 'board_members_delete_department_permission')
)
SELECT 'H1P.06A_EXPECTED_WRITE_POLICIES' AS section,
       expected.table_name, expected.policy_name,
       policy.policyname IS NOT NULL AS policy_exists
FROM expected
LEFT JOIN pg_catalog.pg_policies policy
  ON policy.schemaname = 'public'
 AND policy.tablename = expected.table_name
 AND policy.policyname = expected.policy_name
ORDER BY expected.table_name, expected.policy_name;

-- H1P.06B_NO_UNCONDITIONAL_AUTHENTICATED_WRITES
SELECT 'H1P.06B_NO_UNCONDITIONAL_AUTHENTICATED_WRITES' AS section,
       count(*) AS unconditional_authenticated_write_policy_count,
       count(*) = 0 AS pass
FROM pg_catalog.pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'seasons', 'teams', 'team_seasons', 'players', 'player_team_seasons',
    'coaches', 'coach_team_seasons', 'team_training_times',
    'team_training_exceptions', 'board_members'
  )
  AND cmd IN ('ALL', 'INSERT', 'UPDATE', 'DELETE')
  AND 'authenticated' = ANY(roles)
  AND (
    lower(trim(COALESCE(qual, ''))) IN ('true', '(true)')
    OR lower(trim(COALESCE(with_check, ''))) IN ('true', '(true)')
  );

-- H1P.07_NO_ANON_OR_PUBLIC_WRITE_POLICY
SELECT 'H1P.07_NO_ANON_OR_PUBLIC_WRITE_POLICY' AS section,
       count(*) AS unsafe_policy_count,
       count(*) = 0 AS pass
FROM pg_catalog.pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'seasons', 'teams', 'team_seasons', 'players', 'player_team_seasons',
    'coaches', 'coach_team_seasons', 'team_training_times',
    'team_training_exceptions', 'board_members'
  )
  AND cmd IN ('ALL', 'INSERT', 'UPDATE', 'DELETE')
  AND ('anon' = ANY(roles) OR 'public' = ANY(roles));

-- H1P.07A_PUBLIC_READ_POLICIES
SELECT 'H1P.07A_PUBLIC_READ_POLICIES' AS section, tablename, policyname,
       roles, qual AS using_expression
FROM pg_catalog.pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'seasons', 'teams', 'team_seasons', 'players', 'player_team_seasons',
    'coaches', 'coach_team_seasons', 'team_training_times',
    'team_training_exceptions', 'board_members'
  )
  AND cmd = 'SELECT'
ORDER BY tablename, policyname;

-- H1P.08_EFFECTIVE_TABLE_PRIVILEGES
WITH target_tables(table_name) AS (
  VALUES ('seasons'), ('teams'), ('team_seasons'), ('players'),
    ('player_team_seasons'), ('coaches'), ('coach_team_seasons'),
    ('team_training_times'), ('team_training_exceptions'), ('board_members')
), api_roles(role_name) AS (
  VALUES ('anon'), ('authenticated'), ('service_role')
), privileges(privilege_name) AS (
  VALUES ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE')
)
SELECT 'H1P.08_EFFECTIVE_TABLE_PRIVILEGES' AS section,
       target.table_name, api.role_name, privilege.privilege_name,
       has_table_privilege(api.role_name, format('public.%I', target.table_name), privilege.privilege_name) AS effective_privilege
FROM target_tables target
CROSS JOIN api_roles api
CROSS JOIN privileges privilege
ORDER BY target.table_name, api.role_name, privilege.privilege_name;

-- H1P.09_HELPER_FUNCTIONS
WITH expected(signature) AS (
  VALUES
    ('public.current_admin_has_permission(text)'::regprocedure),
    ('public.current_admin_has_non_table_tennis_permission(text)'::regprocedure),
    ('public.current_admin_permission_allows_department(text,uuid)'::regprocedure),
    ('public.current_admin_can_create_or_delete_board_member(text,uuid)'::regprocedure),
    ('public.current_admin_can_edit_board_member(uuid,uuid)'::regprocedure)
)
SELECT 'H1P.09_HELPER_FUNCTIONS' AS section,
       p.oid::regprocedure::text AS exact_signature,
       p.prosecdef AS security_definer,
       p.proconfig,
       pg_catalog.pg_get_userbyid(p.proowner) AS owner,
       EXISTS (
         SELECT 1
         FROM pg_catalog.aclexplode(
           COALESCE(
             p.proacl,
             pg_catalog.acldefault('f', p.proowner)
           )
         ) AS function_acl
         WHERE function_acl.grantee = 0
           AND function_acl.privilege_type = 'EXECUTE'
       ) AS public_execute,
       has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_execute,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_execute,
       has_function_privilege('service_role', p.oid, 'EXECUTE') AS service_role_execute
FROM expected
JOIN pg_catalog.pg_proc p ON p.oid = expected.signature::oid
ORDER BY p.oid::regprocedure::text;

-- H1P.10_DATA_UNCHANGED_COUNTS
SELECT 'H1P.10_DATA_UNCHANGED_COUNTS' AS section,
       (SELECT count(*) FROM public.teams) AS teams,
       (SELECT count(*) FROM public.team_seasons) AS team_seasons,
       (SELECT count(*) FROM public.players) AS players,
       (SELECT count(*) FROM public.player_team_seasons) AS player_assignments,
       (SELECT count(*) FROM public.coaches) AS coaches,
       (SELECT count(*) FROM public.coach_team_seasons) AS coach_assignments,
       (SELECT count(*) FROM public.team_training_times) AS training_times,
       (SELECT count(*) FROM public.team_training_exceptions) AS training_exceptions,
       (SELECT count(*) FROM public.board_members) AS board_members,
       (SELECT count(*) FROM public.board_members WHERE department_id IS NOT NULL) AS board_members_with_department;

-- H1P.11_AGGREGATE_RESULT
WITH permission_check AS (
  SELECT count(*) = 17 AS ok
  FROM public.admin_roles role_row
  JOIN public.admin_role_permissions role_permission ON role_permission.role_id = role_row.id
  JOIN public.admin_permissions permission_row ON permission_row.id = role_permission.permission_id
  WHERE role_row.key = 'tischtennis-vorstand'
    AND permission_row.key IN (
      'dashboard.view',
      'teams.view', 'teams.create', 'teams.edit', 'teams.delete',
      'players.view', 'players.create', 'players.edit', 'players.delete',
      'coaches.view', 'coaches.create', 'coaches.edit', 'coaches.delete',
      'board.view', 'board.create', 'board.edit', 'board.delete'
    )
), unsafe_policy_check AS (
  SELECT count(*) = 0 AS ok
  FROM pg_catalog.pg_policies
  WHERE schemaname = 'public'
    AND tablename IN (
      'seasons', 'teams', 'team_seasons', 'players', 'player_team_seasons',
      'coaches', 'coach_team_seasons', 'team_training_times',
      'team_training_exceptions', 'board_members'
    )
    AND cmd IN ('ALL', 'INSERT', 'UPDATE', 'DELETE')
    AND ('anon' = ANY(roles) OR 'public' = ANY(roles))
), anon_privilege_check AS (
  SELECT bool_and(
    NOT has_table_privilege('anon', format('public.%I', target.table_name), 'INSERT')
    AND NOT has_table_privilege('anon', format('public.%I', target.table_name), 'UPDATE')
    AND NOT has_table_privilege('anon', format('public.%I', target.table_name), 'DELETE')
  ) AS ok
  FROM unnest(ARRAY[
    'seasons', 'teams', 'team_seasons', 'players', 'player_team_seasons',
    'coaches', 'coach_team_seasons', 'team_training_times',
    'team_training_exceptions', 'board_members'
  ]) AS target(table_name)
), service_role_check AS (
  SELECT bool_and(
    has_table_privilege('service_role', format('public.%I', target.table_name), 'SELECT')
    AND has_table_privilege('service_role', format('public.%I', target.table_name), 'INSERT')
    AND has_table_privilege('service_role', format('public.%I', target.table_name), 'UPDATE')
    AND has_table_privilege('service_role', format('public.%I', target.table_name), 'DELETE')
  ) AS ok
  FROM unnest(ARRAY[
    'seasons', 'teams', 'team_seasons', 'players', 'player_team_seasons',
    'coaches', 'coach_team_seasons', 'team_training_times',
    'team_training_exceptions', 'board_members'
  ]) AS target(table_name)
), expected_write_policy_check AS (
  SELECT count(*) = 30 AS ok
  FROM pg_catalog.pg_policies
  WHERE schemaname = 'public'
    AND policyname IN (
      'seasons_insert_permission', 'seasons_update_permission', 'seasons_delete_permission',
      'teams_insert_department_permission', 'teams_update_department_permission', 'teams_delete_department_permission',
      'team_seasons_insert_department_permission', 'team_seasons_update_department_permission', 'team_seasons_delete_department_permission',
      'players_insert_permission', 'players_update_permission', 'players_delete_permission',
      'player_team_seasons_insert_department_permission', 'player_team_seasons_update_department_permission', 'player_team_seasons_delete_department_permission',
      'coaches_insert_permission', 'coaches_update_permission', 'coaches_delete_permission',
      'coach_team_seasons_insert_department_permission', 'coach_team_seasons_update_department_permission', 'coach_team_seasons_delete_department_permission',
      'team_training_times_insert_department_permission', 'team_training_times_update_department_permission', 'team_training_times_delete_department_permission',
      'team_training_exceptions_insert_department_permission', 'team_training_exceptions_update_department_permission', 'team_training_exceptions_delete_department_permission',
      'board_members_insert_department_permission', 'board_members_update_department_permission', 'board_members_delete_department_permission'
    )
)
SELECT 'H1P.11_AGGREGATE_RESULT' AS section,
       EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'board_members' AND column_name = 'department_id') AS board_department_column_ok,
       (SELECT count(*) = 1 FROM public.departments WHERE slug = 'tischtennis' AND is_active = true) AS tischtennis_department_ok,
       (SELECT ok FROM permission_check) AS role_permissions_ok,
       (SELECT ok FROM unsafe_policy_check) AS no_anon_public_write_policies,
       (SELECT ok FROM anon_privilege_check) AS no_anon_write_privileges,
       (SELECT ok FROM service_role_check) AS service_role_crud_ok,
       (SELECT ok FROM expected_write_policy_check) AS expected_write_policies_ok;
