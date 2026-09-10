-- B15.24K2 - click-TT configuration postcheck
-- READ-ONLY. Run manually only after an approved proposal execution.

-- K2C.01 Relation owner and RLS.
SELECT 'K2C.01_RELATION' AS section,
       c.relname,
       pg_catalog.pg_get_userbyid(c.relowner) AS owner_name,
       c.relrowsecurity AS rls_enabled,
       c.relforcerowsecurity AS force_rls
FROM pg_catalog.pg_class AS c
JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname = 'team_season_external_competitions';

-- K2C.02 Exact columns.
SELECT 'K2C.02_COLUMNS' AS section,
       a.attnum, a.attname,
       pg_catalog.format_type(a.atttypid, a.atttypmod) AS data_type,
       a.attnotnull,
       pg_catalog.pg_get_expr(d.adbin, d.adrelid) AS column_default
FROM pg_catalog.pg_attribute AS a
JOIN pg_catalog.pg_class AS c ON c.oid = a.attrelid
JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
LEFT JOIN pg_catalog.pg_attrdef AS d
  ON d.adrelid = a.attrelid AND d.adnum = a.attnum
WHERE n.nspname = 'public'
  AND c.relname = 'team_season_external_competitions'
  AND a.attnum > 0
  AND NOT a.attisdropped
ORDER BY a.attnum;

-- K2C.03 Constraints.
SELECT 'K2C.03_CONSTRAINTS' AS section,
       con.conname, con.contype,
       pg_catalog.pg_get_constraintdef(con.oid, true) AS definition
FROM pg_catalog.pg_constraint AS con
WHERE con.conrelid = 'public.team_season_external_competitions'::regclass
ORDER BY con.conname;

-- K2C.04 Indexes.
SELECT 'K2C.04_INDEXES' AS section, indexname, indexdef
FROM pg_catalog.pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'team_season_external_competitions'
ORDER BY indexname;

-- K2C.05 No policies: only the trusted server role may access this relation.
SELECT 'K2C.05_POLICIES' AS section,
       policyname, roles, cmd, qual, with_check
FROM pg_catalog.pg_policies
WHERE schemaname = 'public'
  AND tablename = 'team_season_external_competitions'
ORDER BY cmd, policyname;

-- K2C.05A Department-scope trigger and function contract.
WITH function_row AS MATERIALIZED (
  SELECT p.oid, p.prosecdef, p.proconfig,
         pg_catalog.pg_get_userbyid(p.proowner) AS owner_name,
         pg_catalog.pg_get_functiondef(p.oid) AS function_definition
  FROM pg_catalog.pg_proc AS p
  JOIN pg_catalog.pg_namespace AS n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.prokind = 'f'
    AND p.oid = to_regprocedure(
      'public.enforce_team_season_external_competition_scope()'
    )::oid
)
SELECT 'K2C.05A_SCOPE_GUARD' AS section,
       trigger_row.tgname AS trigger_name,
       trigger_row.tgenabled AS trigger_enabled,
       function_row.oid::regprocedure::text AS function_signature,
       function_row.owner_name,
       function_row.prosecdef AS security_definer,
       function_row.proconfig,
       function_row.function_definition
FROM pg_catalog.pg_trigger AS trigger_row
JOIN function_row ON function_row.oid = trigger_row.tgfoid
WHERE trigger_row.tgrelid =
        'public.team_season_external_competitions'::regclass
  AND trigger_row.tgname = 'team_season_external_competitions_scope_guard'
  AND NOT trigger_row.tgisinternal;

-- K2C.05B The trigger-only helper is not directly executable by app roles.
SELECT 'K2C.05B_SCOPE_GUARD_EXECUTE' AS section,
       role_name,
       has_function_privilege(
         role_name,
         'public.enforce_team_season_external_competition_scope()',
         'EXECUTE'
       ) AS can_execute
FROM (VALUES ('anon'), ('authenticated'), ('service_role')) AS roles(role_name)
ORDER BY role_name;

-- K2C.06 Effective privileges.
SELECT 'K2C.06_EFFECTIVE_PRIVILEGES' AS section,
       role_name,
       has_table_privilege(role_name, 'public.team_season_external_competitions', 'SELECT') AS can_select,
       has_table_privilege(role_name, 'public.team_season_external_competitions', 'INSERT') AS can_insert,
       has_table_privilege(role_name, 'public.team_season_external_competitions', 'UPDATE') AS can_update,
       has_table_privilege(role_name, 'public.team_season_external_competitions', 'DELETE') AS can_delete,
       has_table_privilege(role_name, 'public.team_season_external_competitions', 'TRUNCATE') AS can_truncate,
       has_table_privilege(role_name, 'public.team_season_external_competitions', 'REFERENCES') AS can_reference,
       has_table_privilege(role_name, 'public.team_season_external_competitions', 'TRIGGER') AS can_trigger
FROM (VALUES ('anon'), ('authenticated'), ('service_role')) AS roles(role_name)
ORDER BY role_name;

-- K2C.07 No invalid or cross-department configuration rows.
SELECT 'K2C.07_DATA_INTEGRITY' AS section,
       count(*) AS total_configuration_count,
       count(*) FILTER (WHERE ts.id IS NULL) AS missing_team_season_count,
       count(*) FILTER (WHERE t.id IS NULL) AS missing_team_count,
       count(*) FILTER (WHERE d.slug IS DISTINCT FROM 'tischtennis') AS non_tt_configuration_count,
       count(*) FILTER (
         WHERE cfg.is_active
           AND (ts.is_active IS NOT TRUE OR t.is_active IS NOT TRUE)
       ) AS active_config_on_inactive_scope_count
FROM public.team_season_external_competitions AS cfg
LEFT JOIN public.team_seasons AS ts ON ts.id = cfg.team_season_id
LEFT JOIN public.teams AS t ON t.id = ts.team_id
LEFT JOIN public.departments AS d ON d.id = t.department_id;

-- K2C.07A Existing team-season baseline remains unchanged by this additive DDL.
SELECT 'K2C.07A_TEAM_SEASON_BASELINE' AS section,
       count(DISTINCT team.id) FILTER (
         WHERE department.slug = 'tischtennis'
       ) AS tt_team_count,
       count(team_season.id) FILTER (
         WHERE department.slug = 'tischtennis'
       ) AS tt_team_season_count,
       count(team_season.id) FILTER (
         WHERE department.slug = 'tischtennis'
           AND team.is_active = true
           AND team_season.is_active = true
       ) AS active_tt_team_season_count,
       count(team_season.id) FILTER (
         WHERE department.slug <> 'tischtennis'
            OR department.slug IS NULL
       ) AS non_tt_team_season_count
FROM public.teams AS team
LEFT JOIN public.departments AS department
  ON department.id = team.department_id
LEFT JOIN public.team_seasons AS team_season
  ON team_season.team_id = team.id;

-- K2C.07B Football/FuPa columns remain on their original relations unchanged.
SELECT 'K2C.07B_EXISTING_PROVIDER_COLUMNS' AS section,
       table_name, ordinal_position, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('teams', 'team_seasons')
  AND (
    column_name ILIKE '%fussball_de%'
    OR column_name ILIKE '%fupa%'
  )
ORDER BY table_name, ordinal_position;

-- K2C.08 Aggregate PASS contract.
SELECT 'K2C.08_FINAL_ASSERTIONS' AS section,
       to_regclass('public.team_season_external_competitions') IS NOT NULL AS relation_exists,
       (
         SELECT c.relrowsecurity AND NOT c.relforcerowsecurity
         FROM pg_catalog.pg_class AS c
         WHERE c.oid = 'public.team_season_external_competitions'::regclass
       ) AS rls_contract_ok,
       NOT EXISTS (
         SELECT 1 FROM pg_catalog.pg_policies
         WHERE schemaname = 'public'
           AND tablename = 'team_season_external_competitions'
       ) AS no_policies,
       NOT has_table_privilege('anon', 'public.team_season_external_competitions', 'SELECT')
         AND NOT has_table_privilege('anon', 'public.team_season_external_competitions', 'INSERT')
         AND NOT has_table_privilege('anon', 'public.team_season_external_competitions', 'UPDATE')
         AND NOT has_table_privilege('anon', 'public.team_season_external_competitions', 'DELETE') AS anon_denied,
       NOT has_table_privilege('authenticated', 'public.team_season_external_competitions', 'SELECT')
         AND NOT has_table_privilege('authenticated', 'public.team_season_external_competitions', 'INSERT')
         AND NOT has_table_privilege('authenticated', 'public.team_season_external_competitions', 'UPDATE')
         AND NOT has_table_privilege('authenticated', 'public.team_season_external_competitions', 'DELETE') AS authenticated_denied,
       has_table_privilege('service_role', 'public.team_season_external_competitions', 'SELECT')
         AND has_table_privilege('service_role', 'public.team_season_external_competitions', 'INSERT')
         AND has_table_privilege('service_role', 'public.team_season_external_competitions', 'UPDATE')
         AND has_table_privilege('service_role', 'public.team_season_external_competitions', 'DELETE') AS service_role_crud_ok,
       EXISTS (
         SELECT 1
         FROM pg_catalog.pg_trigger AS trigger_row
         WHERE trigger_row.tgrelid =
                 'public.team_season_external_competitions'::regclass
           AND trigger_row.tgname =
                 'team_season_external_competitions_scope_guard'
           AND NOT trigger_row.tgisinternal
           AND trigger_row.tgenabled = 'O'
           AND trigger_row.tgfoid = to_regprocedure(
                 'public.enforce_team_season_external_competition_scope()'
               )::oid
       ) AS tt_scope_trigger_ok,
       NOT has_function_privilege(
         'anon',
         'public.enforce_team_season_external_competition_scope()',
         'EXECUTE'
       )
         AND NOT has_function_privilege(
           'authenticated',
           'public.enforce_team_season_external_competition_scope()',
           'EXECUTE'
         )
         AND NOT has_function_privilege(
           'service_role',
           'public.enforce_team_season_external_competition_scope()',
           'EXECUTE'
         ) AS scope_helper_execute_denied,
       NOT EXISTS (
         SELECT 1
         FROM public.team_season_external_competitions AS cfg
         JOIN public.team_seasons AS ts ON ts.id = cfg.team_season_id
         JOIN public.teams AS t ON t.id = ts.team_id
         LEFT JOIN public.departments AS d ON d.id = t.department_id
         WHERE d.slug IS DISTINCT FROM 'tischtennis'
       ) AS tt_scope_only;
