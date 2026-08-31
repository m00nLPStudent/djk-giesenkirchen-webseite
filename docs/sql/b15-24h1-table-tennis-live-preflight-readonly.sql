-- B15.24H1 – Tischtennis Live-Datenbank Read-only Preflight
-- Manuell im Supabase SQL Editor ausführen. Dieses Skript verändert nichts.
-- Personenbezogene Ausgaben sind auf technische IDs, Status und Counts begrenzt.

-- H1.00_RELEVANT_RELATIONS
SELECT 'H1.00_RELEVANT_RELATIONS' AS section, expected.table_name,
       c.oid IS NOT NULL AS relation_exists, n.nspname AS actual_schema,
       c.relname AS actual_relation, c.relkind
FROM (VALUES
  ('departments'), ('teams'), ('seasons'), ('team_seasons'), ('players'),
  ('player_team_seasons'), ('coaches'), ('coach_team_seasons'),
  ('team_training_times'), ('team_training_exceptions'),
  ('club_closure_periods'), ('board_members'), ('board_roles'),
  ('media_assets'), ('media_asset_usages'), ('admin_roles'),
  ('admin_permissions'), ('admin_role_permissions'), ('roles'),
  ('permissions'), ('role_permissions')
) AS expected(table_name)
LEFT JOIN pg_catalog.pg_namespace n ON n.nspname = 'public'
LEFT JOIN pg_catalog.pg_class c
  ON c.relnamespace = n.oid AND c.relname = expected.table_name
 AND c.relkind IN ('r', 'p', 'v', 'm', 'f')
ORDER BY expected.table_name;

-- H1.01_DEPARTMENTS
SELECT 'H1.01_DEPARTMENTS' AS section, d.id,
       to_jsonb(d)->>'slug' AS slug,
       COALESCE(to_jsonb(d)->>'name_de', to_jsonb(d)->>'name', to_jsonb(d)->>'title') AS display_name,
       to_jsonb(d)->>'is_active' AS is_active,
       COALESCE(to_jsonb(d)->>'sort_order', to_jsonb(d)->>'position') AS sort_order,
       CASE
         WHEN lower(COALESCE(to_jsonb(d)->>'slug', '')) IN ('fussball', 'fußball', 'football')
           OR lower(COALESCE(to_jsonb(d)->>'name_de', to_jsonb(d)->>'name', '')) LIKE ANY (ARRAY['%fußball%', '%fussball%'])
           THEN 'football_candidate'
         WHEN lower(COALESCE(to_jsonb(d)->>'slug', '')) LIKE ANY (ARRAY['%tischtennis%', '%table-tennis%'])
           OR lower(COALESCE(to_jsonb(d)->>'name_de', to_jsonb(d)->>'name', '')) LIKE '%tischtennis%'
           THEN 'table_tennis_candidate'
         ELSE 'other'
       END AS detected_department_type
FROM public.departments d
ORDER BY COALESCE(NULLIF(to_jsonb(d)->>'sort_order', '')::integer, 2147483647),
         COALESCE(to_jsonb(d)->>'slug', ''), d.id::text;

-- H1.02_TEAMS
SELECT 'H1.02_TEAMS' AS section, t.id AS team_id, t.department_id,
       to_jsonb(d)->>'slug' AS department_slug,
       COALESCE(to_jsonb(d)->>'name_de', to_jsonb(d)->>'name') AS department_name,
       COALESCE(to_jsonb(t)->>'name_de', to_jsonb(t)->>'name') AS team_name,
       to_jsonb(t)->>'slug' AS team_slug, to_jsonb(t)->>'is_active' AS is_active,
       to_jsonb(t)->>'age_group' AS age_group, to_jsonb(t)->>'season' AS legacy_season,
       COALESCE(to_jsonb(t)->>'sort_order', to_jsonb(t)->>'position') AS sort_order,
       NULLIF(to_jsonb(t)->>'team_image_media_asset_id', '') IS NOT NULL AS has_team_image_media_reference,
       lower(COALESCE(to_jsonb(d)->>'slug', '')) LIKE ANY (ARRAY['%tischtennis%', '%table-tennis%'])
         OR lower(COALESCE(to_jsonb(d)->>'name_de', to_jsonb(d)->>'name', '')) LIKE '%tischtennis%'
         AS is_table_tennis_candidate
FROM public.teams t
LEFT JOIN public.departments d ON d.id = t.department_id
ORDER BY COALESCE(to_jsonb(d)->>'slug', ''),
         COALESCE(NULLIF(to_jsonb(t)->>'sort_order', '')::integer, 2147483647),
         COALESCE(to_jsonb(t)->>'slug', ''), t.id::text;

-- H1.03_TEAM_SEASONS
WITH table_tennis_departments AS MATERIALIZED (
  SELECT d.id FROM public.departments d
  WHERE lower(COALESCE(to_jsonb(d)->>'slug', '')) LIKE ANY (ARRAY['%tischtennis%', '%table-tennis%'])
     OR lower(COALESCE(to_jsonb(d)->>'name_de', to_jsonb(d)->>'name', '')) LIKE '%tischtennis%'
), table_tennis_teams AS MATERIALIZED (
  SELECT t.id FROM public.teams t JOIN table_tennis_departments d ON d.id = t.department_id
)
SELECT 'H1.03_TEAM_SEASONS' AS section, ts.id AS team_season_id, ts.team_id,
       ts.season_id, COALESCE(to_jsonb(t)->>'name_de', to_jsonb(t)->>'name') AS team_name,
       COALESCE(to_jsonb(ts)->>'name_de', to_jsonb(ts)->>'name') AS seasonal_team_name,
       COALESCE(to_jsonb(s)->>'name', to_jsonb(s)->>'name_de', to_jsonb(s)->>'label') AS season_name,
       to_jsonb(ts)->>'slug' AS seasonal_slug, to_jsonb(ts)->>'is_active' AS team_season_active,
       COALESCE(to_jsonb(ts)->>'is_published', to_jsonb(ts)->>'published',
                to_jsonb(ts)->>'publication_status') AS publication_state,
       COALESCE(to_jsonb(ts)->>'sort_order', to_jsonb(ts)->>'position') AS sort_order,
       NULLIF(to_jsonb(ts)->>'team_image_media_asset_id', '') IS NOT NULL AS has_season_image_media_reference
FROM public.team_seasons ts
JOIN table_tennis_teams tt ON tt.id = ts.team_id
JOIN public.teams t ON t.id = ts.team_id
LEFT JOIN public.seasons s ON s.id = ts.season_id
ORDER BY COALESCE(to_jsonb(s)->>'name', to_jsonb(s)->>'name_de', ''),
         COALESCE(NULLIF(to_jsonb(ts)->>'sort_order', '')::integer, 2147483647), ts.id::text;

-- H1.04_PLAYER_COUNTS
WITH table_tennis_departments AS MATERIALIZED (
  SELECT d.id FROM public.departments d
  WHERE lower(COALESCE(to_jsonb(d)->>'slug', '')) LIKE ANY (ARRAY['%tischtennis%', '%table-tennis%'])
     OR lower(COALESCE(to_jsonb(d)->>'name_de', to_jsonb(d)->>'name', '')) LIKE '%tischtennis%'
), table_tennis_team_seasons AS MATERIALIZED (
  SELECT ts.id FROM public.team_seasons ts
  JOIN public.teams t ON t.id = ts.team_id
  JOIN table_tennis_departments d ON d.id = t.department_id
)
SELECT 'H1.04_PLAYER_COUNTS' AS section,
       (SELECT count(*) FROM public.players) AS total_players,
       (SELECT count(*) FROM public.players p WHERE COALESCE((to_jsonb(p)->>'is_active')::boolean, true)) AS active_players,
       (SELECT count(*) FROM public.player_team_seasons) AS total_assignments,
       (SELECT count(*) FROM public.player_team_seasons pts JOIN table_tennis_team_seasons tts ON tts.id = pts.team_season_id) AS table_tennis_assignments,
       (SELECT count(DISTINCT pts.player_id) FROM public.player_team_seasons pts JOIN table_tennis_team_seasons tts ON tts.id = pts.team_season_id) AS distinct_table_tennis_players,
       (SELECT count(*) FROM public.player_team_seasons pts JOIN table_tennis_team_seasons tts ON tts.id = pts.team_season_id
        WHERE COALESCE((to_jsonb(pts)->>'is_active')::boolean, true)) AS active_table_tennis_assignments;

-- H1.05_PLAYER_ASSIGNMENTS (keine Namen/Kontaktdaten)
WITH table_tennis_departments AS MATERIALIZED (
  SELECT d.id FROM public.departments d
  WHERE lower(COALESCE(to_jsonb(d)->>'slug', '')) LIKE ANY (ARRAY['%tischtennis%', '%table-tennis%'])
     OR lower(COALESCE(to_jsonb(d)->>'name_de', to_jsonb(d)->>'name', '')) LIKE '%tischtennis%'
)
SELECT 'H1.05_PLAYER_ASSIGNMENTS' AS section, pts.id AS assignment_id,
       pts.player_id, pts.team_season_id, ts.team_id, ts.season_id,
       COALESCE(to_jsonb(t)->>'name_de', to_jsonb(t)->>'name') AS team_name,
       to_jsonb(pts)->>'is_active' AS assignment_active,
       to_jsonb(pts)->>'shirt_number' AS shirt_number,
       COALESCE(to_jsonb(pts)->>'position_de', to_jsonb(pts)->>'position') AS playing_position,
       to_jsonb(pts)->>'is_captain' AS is_captain, to_jsonb(pts)->>'sort_order' AS sort_order
FROM public.player_team_seasons pts
JOIN public.team_seasons ts ON ts.id = pts.team_season_id
JOIN public.teams t ON t.id = ts.team_id
JOIN table_tennis_departments d ON d.id = t.department_id
ORDER BY ts.team_id::text, pts.team_season_id::text, pts.id::text;

-- H1.06_COACH_COUNTS
WITH table_tennis_departments AS MATERIALIZED (
  SELECT d.id FROM public.departments d
  WHERE lower(COALESCE(to_jsonb(d)->>'slug', '')) LIKE ANY (ARRAY['%tischtennis%', '%table-tennis%'])
     OR lower(COALESCE(to_jsonb(d)->>'name_de', to_jsonb(d)->>'name', '')) LIKE '%tischtennis%'
), table_tennis_team_seasons AS MATERIALIZED (
  SELECT ts.id FROM public.team_seasons ts
  JOIN public.teams t ON t.id = ts.team_id
  JOIN table_tennis_departments d ON d.id = t.department_id
)
SELECT 'H1.06_COACH_COUNTS' AS section,
       (SELECT count(*) FROM public.coaches) AS total_coaches,
       (SELECT count(*) FROM public.coaches c WHERE COALESCE((to_jsonb(c)->>'is_active')::boolean, true)) AS active_coaches,
       (SELECT count(*) FROM public.coaches c WHERE NULLIF(to_jsonb(c)->>'admin_profile_id', '') IS NOT NULL) AS coaches_with_admin_profile_link,
       (SELECT count(*) FROM public.coach_team_seasons) AS total_assignments,
       (SELECT count(*) FROM public.coach_team_seasons cts JOIN table_tennis_team_seasons tts ON tts.id = cts.team_season_id) AS table_tennis_assignments,
       (SELECT count(DISTINCT cts.coach_id) FROM public.coach_team_seasons cts JOIN table_tennis_team_seasons tts ON tts.id = cts.team_season_id) AS distinct_table_tennis_coaches,
       (SELECT count(*) FROM public.coach_team_seasons cts JOIN table_tennis_team_seasons tts ON tts.id = cts.team_season_id
        WHERE COALESCE((to_jsonb(cts)->>'is_active')::boolean, true)) AS active_table_tennis_assignments;

-- H1.07_COACH_ASSIGNMENTS (keine Namen/Kontaktdaten)
WITH table_tennis_departments AS MATERIALIZED (
  SELECT d.id FROM public.departments d
  WHERE lower(COALESCE(to_jsonb(d)->>'slug', '')) LIKE ANY (ARRAY['%tischtennis%', '%table-tennis%'])
     OR lower(COALESCE(to_jsonb(d)->>'name_de', to_jsonb(d)->>'name', '')) LIKE '%tischtennis%'
)
SELECT 'H1.07_COACH_ASSIGNMENTS' AS section, cts.id AS assignment_id,
       cts.coach_id, cts.team_season_id, ts.team_id, ts.season_id,
       COALESCE(to_jsonb(t)->>'name_de', to_jsonb(t)->>'name') AS team_name,
       COALESCE(to_jsonb(cts)->>'role_de', to_jsonb(cts)->>'role') AS team_role,
       to_jsonb(cts)->>'is_active' AS assignment_active,
       to_jsonb(cts)->>'sort_order' AS sort_order,
       NULLIF(to_jsonb(c)->>'admin_profile_id', '') IS NOT NULL AS has_admin_profile_link
FROM public.coach_team_seasons cts
JOIN public.coaches c ON c.id = cts.coach_id
JOIN public.team_seasons ts ON ts.id = cts.team_season_id
JOIN public.teams t ON t.id = ts.team_id
JOIN table_tennis_departments d ON d.id = t.department_id
ORDER BY ts.team_id::text, cts.team_season_id::text, cts.id::text;

-- H1.08_TRAINING_TIMES
WITH table_tennis_departments AS MATERIALIZED (
  SELECT d.id FROM public.departments d
  WHERE lower(COALESCE(to_jsonb(d)->>'slug', '')) LIKE ANY (ARRAY['%tischtennis%', '%table-tennis%'])
     OR lower(COALESCE(to_jsonb(d)->>'name_de', to_jsonb(d)->>'name', '')) LIKE '%tischtennis%'
)
SELECT 'H1.08_TRAINING_TIMES' AS section, ttt.id AS training_time_id,
       ttt.team_season_id, ts.team_id,
       COALESCE(to_jsonb(t)->>'name_de', to_jsonb(t)->>'name') AS team_name,
       to_jsonb(ttt)->>'weekday' AS weekday, to_jsonb(ttt)->>'start_time' AS start_time,
       to_jsonb(ttt)->>'end_time' AS end_time, to_jsonb(ttt)->>'training_type' AS training_type,
       to_jsonb(ttt)->>'location_name' AS location_name,
       to_jsonb(ttt)->>'location_city' AS location_city,
       to_jsonb(ttt)->>'effective_from' AS effective_from,
       to_jsonb(ttt)->>'effective_until' AS effective_until,
       to_jsonb(ttt)->>'is_active' AS is_active
FROM public.team_training_times ttt
JOIN public.team_seasons ts ON ts.id = ttt.team_season_id
JOIN public.teams t ON t.id = ts.team_id
JOIN table_tennis_departments d ON d.id = t.department_id
ORDER BY ts.team_id::text, NULLIF(to_jsonb(ttt)->>'weekday', '')::integer,
         to_jsonb(ttt)->>'start_time', ttt.id::text;

-- H1.09_TRAINING_SUPPORT_COUNTS
WITH table_tennis_departments AS MATERIALIZED (
  SELECT d.id FROM public.departments d
  WHERE lower(COALESCE(to_jsonb(d)->>'slug', '')) LIKE ANY (ARRAY['%tischtennis%', '%table-tennis%'])
     OR lower(COALESCE(to_jsonb(d)->>'name_de', to_jsonb(d)->>'name', '')) LIKE '%tischtennis%'
), table_tennis_training_times AS MATERIALIZED (
  SELECT ttt.id FROM public.team_training_times ttt
  JOIN public.team_seasons ts ON ts.id = ttt.team_season_id
  JOIN public.teams t ON t.id = ts.team_id
  JOIN table_tennis_departments d ON d.id = t.department_id
)
SELECT 'H1.09_TRAINING_SUPPORT_COUNTS' AS section,
       (SELECT count(*) FROM public.team_training_exceptions) AS total_training_exceptions,
       (SELECT count(*) FROM public.team_training_exceptions tte JOIN table_tennis_training_times ttt ON ttt.id = tte.team_training_time_id) AS table_tennis_training_exceptions,
       (SELECT count(*) FROM public.team_training_exceptions tte JOIN table_tennis_training_times ttt ON ttt.id = tte.team_training_time_id
        WHERE COALESCE((to_jsonb(tte)->>'is_active')::boolean, true)) AS active_table_tennis_training_exceptions,
       (SELECT count(*) FROM public.club_closure_periods) AS total_club_closure_periods,
       (SELECT count(*) FROM public.club_closure_periods ccp
        WHERE COALESCE((to_jsonb(ccp)->>'is_active')::boolean, true)) AS active_club_closure_periods;

-- H1.10_BOARD_MEMBERS_COLUMNS
SELECT 'H1.10_BOARD_MEMBERS_COLUMNS' AS section, c.ordinal_position,
       c.column_name, c.data_type, c.udt_schema, c.udt_name,
       c.is_nullable, c.column_default
FROM information_schema.columns c
WHERE c.table_schema = 'public' AND c.table_name = 'board_members'
ORDER BY c.ordinal_position;

-- H1.11_BOARD_MEMBER_COUNTS
SELECT 'H1.11_BOARD_MEMBER_COUNTS' AS section, count(*) AS total_board_members,
       count(*) FILTER (WHERE COALESCE((to_jsonb(bm)->>'is_active')::boolean, true)) AS active_board_members,
       count(*) FILTER (WHERE NULLIF(to_jsonb(bm)->>'department_id', '') IS NOT NULL) AS members_with_department_id,
       count(*) FILTER (WHERE NULLIF(to_jsonb(bm)->>'admin_profile_id', '') IS NOT NULL) AS members_with_admin_profile_link,
       count(DISTINCT NULLIF(to_jsonb(bm)->>'department_id', '')) AS distinct_department_links
FROM public.board_members bm;

-- H1.12_BOARD_MEMBER_TECHNICAL_ROWS (keine Namen/Kontaktdaten)
SELECT 'H1.12_BOARD_MEMBER_TECHNICAL_ROWS' AS section,
       bm.id AS board_member_id, to_jsonb(bm)->>'role_id' AS role_id,
       to_jsonb(bm)->>'department_id' AS department_id,
       to_jsonb(bm)->>'is_active' AS is_active,
       to_jsonb(bm)->>'sort_order' AS sort_order,
       NULLIF(to_jsonb(bm)->>'image_media_asset_id', '') IS NOT NULL AS has_media_reference,
       NULLIF(to_jsonb(bm)->>'admin_profile_id', '') IS NOT NULL AS has_admin_profile_link
FROM public.board_members bm
ORDER BY COALESCE(NULLIF(to_jsonb(bm)->>'sort_order', '')::integer, 2147483647), bm.id::text;

-- H1.13_BOARD_ROLES
SELECT 'H1.13_BOARD_ROLES' AS section, br.id AS board_role_id,
       COALESCE(to_jsonb(br)->>'key', to_jsonb(br)->>'slug') AS role_key,
       COALESCE(to_jsonb(br)->>'name_de', to_jsonb(br)->>'name', to_jsonb(br)->>'title_de') AS role_name,
       to_jsonb(br)->>'department_id' AS department_id,
       to_jsonb(br)->>'is_active' AS is_active,
       to_jsonb(br)->>'sort_order' AS sort_order
FROM public.board_roles br
ORDER BY COALESCE(NULLIF(to_jsonb(br)->>'sort_order', '')::integer, 2147483647), br.id::text;

-- H1.14_TISCHTENNIS_ROLE
SELECT 'H1.14_TISCHTENNIS_ROLE' AS section, r.id AS role_id,
       r.key AS role_key, r.name AS role_name, r.is_active,
       p.key AS permission_key
FROM public.admin_roles r
LEFT JOIN public.admin_role_permissions rp ON rp.role_id = r.id
LEFT JOIN public.admin_permissions p ON p.id = rp.permission_id
WHERE r.key = 'tischtennis-vorstand'
ORDER BY p.key NULLS FIRST;

-- H1.15_REQUIRED_PERMISSION_AVAILABILITY
WITH required_permissions(permission_key, permission_group) AS MATERIALIZED (
  VALUES
    ('membership_requests.view', 'membership'), ('membership_requests.edit', 'membership'),
    ('membership_requests.forward', 'membership'), ('teams.view', 'teams'),
    ('teams.create', 'teams'), ('teams.edit', 'teams'), ('teams.delete', 'teams'),
    ('players.view', 'players'), ('players.create', 'players'),
    ('players.edit', 'players'), ('players.delete', 'players'),
    ('coaches.view', 'coaches'), ('coaches.create', 'coaches'),
    ('coaches.edit', 'coaches'), ('coaches.delete', 'coaches')
)
SELECT 'H1.15_REQUIRED_PERMISSION_AVAILABILITY' AS section,
       required.permission_group, required.permission_key,
       p.id AS permission_id, p.id IS NOT NULL AS permission_exists,
       EXISTS (
         SELECT 1 FROM public.admin_roles r
         JOIN public.admin_role_permissions rp ON rp.role_id = r.id
         WHERE r.key = 'tischtennis-vorstand' AND rp.permission_id = p.id
       ) AS assigned_to_tischtennis_vorstand
FROM required_permissions required
LEFT JOIN public.admin_permissions p ON p.key = required.permission_key
ORDER BY required.permission_group, required.permission_key;

-- H1.16_BOARD_AND_TRAINING_PERMISSION_CANDIDATES
SELECT 'H1.16_BOARD_AND_TRAINING_PERMISSION_CANDIDATES' AS section,
       p.id AS permission_id, p.key AS permission_key,
       COALESCE(to_jsonb(p)->>'name', to_jsonb(p)->>'description') AS permission_label,
       EXISTS (
         SELECT 1 FROM public.admin_roles r
         JOIN public.admin_role_permissions rp ON rp.role_id = r.id
         WHERE r.key = 'tischtennis-vorstand' AND rp.permission_id = p.id
       ) AS assigned_to_tischtennis_vorstand
FROM public.admin_permissions p
WHERE p.key ILIKE ANY (ARRAY['%board%', '%vorstand%', '%department%', '%training%', 'settings.%'])
ORDER BY p.key;

-- H1.17_RLS
WITH relevant_tables(table_name) AS MATERIALIZED (
  VALUES ('departments'), ('teams'), ('seasons'), ('team_seasons'), ('players'),
    ('player_team_seasons'), ('coaches'), ('coach_team_seasons'),
    ('team_training_times'), ('team_training_exceptions'), ('club_closure_periods'),
    ('board_members'), ('board_roles'), ('media_assets'), ('media_asset_usages'),
    ('admin_roles'), ('admin_permissions'), ('admin_role_permissions'),
    ('roles'), ('permissions'), ('role_permissions')
)
SELECT 'H1.17_RLS' AS section, rt.table_name, c.oid IS NOT NULL AS table_exists,
       c.relrowsecurity AS rls_enabled, c.relforcerowsecurity AS force_rls,
       pg_catalog.pg_get_userbyid(c.relowner) AS owner
FROM relevant_tables rt
LEFT JOIN pg_catalog.pg_namespace n ON n.nspname = 'public'
LEFT JOIN pg_catalog.pg_class c
  ON c.relnamespace = n.oid AND c.relname = rt.table_name AND c.relkind IN ('r', 'p')
ORDER BY rt.table_name;

-- H1.18_POLICIES
WITH relevant_tables(table_name) AS MATERIALIZED (
  VALUES ('departments'), ('teams'), ('seasons'), ('team_seasons'), ('players'),
    ('player_team_seasons'), ('coaches'), ('coach_team_seasons'),
    ('team_training_times'), ('team_training_exceptions'), ('club_closure_periods'),
    ('board_members'), ('board_roles'), ('media_assets'), ('media_asset_usages'),
    ('admin_roles'), ('admin_permissions'), ('admin_role_permissions'),
    ('roles'), ('permissions'), ('role_permissions')
)
SELECT 'H1.18_POLICIES' AS section, p.schemaname, p.tablename,
       p.policyname, p.permissive, p.roles, p.cmd,
       p.qual AS using_expression, p.with_check AS with_check_expression
FROM pg_catalog.pg_policies p
JOIN relevant_tables rt ON rt.table_name = p.tablename
WHERE p.schemaname = 'public'
ORDER BY p.tablename, p.cmd, p.policyname;

-- H1.19_TABLE_GRANTS
WITH relevant_tables(table_name) AS MATERIALIZED (
  VALUES ('departments'), ('teams'), ('seasons'), ('team_seasons'), ('players'),
    ('player_team_seasons'), ('coaches'), ('coach_team_seasons'),
    ('team_training_times'), ('team_training_exceptions'), ('club_closure_periods'),
    ('board_members'), ('board_roles'), ('media_assets'), ('media_asset_usages'),
    ('admin_roles'), ('admin_permissions'), ('admin_role_permissions'),
    ('roles'), ('permissions'), ('role_permissions')
), api_roles(role_name) AS MATERIALIZED (
  VALUES ('anon'), ('authenticated'), ('service_role')
), privileges(privilege_type) AS MATERIALIZED (
  VALUES ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE')
)
SELECT 'H1.19_TABLE_GRANTS' AS section, rt.table_name, ar.role_name AS grantee,
       privilege.privilege_type,
       has_table_privilege(ar.role_name, format('%I.%I', 'public', rt.table_name), privilege.privilege_type) AS effective_privilege
FROM relevant_tables rt
JOIN pg_catalog.pg_namespace n ON n.nspname = 'public'
JOIN pg_catalog.pg_class c
  ON c.relnamespace = n.oid AND c.relname = rt.table_name AND c.relkind IN ('r', 'p', 'v', 'm', 'f')
CROSS JOIN api_roles ar
CROSS JOIN privileges privilege
ORDER BY rt.table_name, ar.role_name, privilege.privilege_type;

-- H1.20_COLUMN_GRANTS
WITH relevant_tables(table_name) AS MATERIALIZED (
  VALUES ('departments'), ('teams'), ('seasons'), ('team_seasons'), ('players'),
    ('player_team_seasons'), ('coaches'), ('coach_team_seasons'),
    ('team_training_times'), ('team_training_exceptions'), ('club_closure_periods'),
    ('board_members'), ('board_roles'), ('media_assets'), ('media_asset_usages'),
    ('admin_roles'), ('admin_permissions'), ('admin_role_permissions'),
    ('roles'), ('permissions'), ('role_permissions')
)
SELECT 'H1.20_COLUMN_GRANTS' AS section, cp.table_name, cp.column_name,
       cp.grantee, cp.privilege_type, cp.is_grantable
FROM information_schema.column_privileges cp
JOIN relevant_tables rt ON rt.table_name = cp.table_name
WHERE cp.table_schema = 'public'
  AND cp.grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY cp.table_name, cp.grantee, cp.column_name, cp.privilege_type;

-- H1.21_RELEVANT_COLUMNS
WITH relevant_tables(table_name) AS MATERIALIZED (
  VALUES ('departments'), ('teams'), ('team_seasons'), ('board_members'),
    ('board_roles'), ('admin_roles'), ('admin_permissions'), ('admin_role_permissions')
)
SELECT 'H1.21_RELEVANT_COLUMNS' AS section, c.table_name,
       c.ordinal_position, c.column_name, c.data_type, c.udt_schema,
       c.udt_name, c.is_nullable, c.column_default
FROM information_schema.columns c
JOIN relevant_tables rt ON rt.table_name = c.table_name
WHERE c.table_schema = 'public'
ORDER BY c.table_name, c.ordinal_position;

-- H1.22_CONSTRAINTS
WITH relevant_tables(table_name) AS MATERIALIZED (
  VALUES ('departments'), ('teams'), ('team_seasons'), ('board_members'),
    ('board_roles'), ('admin_role_permissions'), ('role_permissions')
)
SELECT 'H1.22_CONSTRAINTS' AS section, rel.relname AS table_name,
       con.conname AS constraint_name,
       CASE con.contype WHEN 'p' THEN 'PRIMARY KEY' WHEN 'f' THEN 'FOREIGN KEY'
         WHEN 'u' THEN 'UNIQUE' WHEN 'c' THEN 'CHECK' WHEN 'x' THEN 'EXCLUSION'
         ELSE con.contype::text END AS constraint_type,
       pg_catalog.pg_get_constraintdef(con.oid, true) AS constraint_definition,
       ref_ns.nspname AS referenced_schema, ref_rel.relname AS referenced_table,
       con.condeferrable, con.condeferred, con.convalidated
FROM pg_catalog.pg_constraint con
JOIN pg_catalog.pg_class rel ON rel.oid = con.conrelid
JOIN pg_catalog.pg_namespace rel_ns ON rel_ns.oid = rel.relnamespace
JOIN relevant_tables rt ON rt.table_name = rel.relname
LEFT JOIN pg_catalog.pg_class ref_rel ON ref_rel.oid = con.confrelid
LEFT JOIN pg_catalog.pg_namespace ref_ns ON ref_ns.oid = ref_rel.relnamespace
WHERE rel_ns.nspname = 'public'
ORDER BY rel.relname, constraint_type, con.conname;

-- H1.23_INDEXES
WITH relevant_tables(table_name) AS MATERIALIZED (
  VALUES ('departments'), ('teams'), ('team_seasons'), ('board_members'),
    ('board_roles'), ('admin_role_permissions'), ('role_permissions')
)
SELECT 'H1.23_INDEXES' AS section, i.schemaname, i.tablename,
       i.indexname, i.tablespace, i.indexdef
FROM pg_catalog.pg_indexes i
JOIN relevant_tables rt ON rt.table_name = i.tablename
WHERE i.schemaname = 'public'
ORDER BY i.tablename, i.indexname;

-- H1.24_MEDIA_REFERENCE_COUNTS
SELECT 'H1.24_MEDIA_REFERENCE_COUNTS' AS section,
       (SELECT count(*) FROM public.media_assets) AS total_media_assets,
       (SELECT count(*) FROM public.media_assets ma
        WHERE COALESCE((to_jsonb(ma)->>'is_archived')::boolean, false) = false) AS active_media_assets,
       (SELECT count(*) FROM public.media_asset_usages) AS total_media_usages,
       (SELECT count(*) FROM public.media_asset_usages mau
        WHERE lower(COALESCE(to_jsonb(mau)->>'usage_context',
                             to_jsonb(mau)->>'entity_type',
                             to_jsonb(mau)->>'module', ''))
              SIMILAR TO '%(team|player|coach|board)%') AS relevant_person_team_board_usages;

-- H1.25_RELEVANT_SECURITY_FUNCTIONS
-- MATERIALIZED-Vorfilterung verhindert pg_get_functiondef-Aufrufe für
-- Aggregate, Window-Funktionen und sonstige ungeeignete pg_proc-Einträge.
WITH eligible_routines AS MATERIALIZED (
  SELECT p.oid, n.nspname AS routine_schema, p.proname AS routine_name,
         p.prokind, p.prosecdef, p.proconfig, p.proowner
  FROM pg_catalog.pg_proc p
  JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
  WHERE p.prokind IN ('f', 'p')
    AND n.nspname NOT IN ('pg_catalog', 'information_schema')
), routine_definitions AS MATERIALIZED (
  SELECT er.*, pg_catalog.pg_get_functiondef(er.oid) AS routine_definition
  FROM eligible_routines er
)
SELECT 'H1.25_RELEVANT_SECURITY_FUNCTIONS' AS section,
       rd.oid::regprocedure::text AS exact_signature,
       rd.routine_schema, rd.routine_name,
       CASE rd.prokind WHEN 'f' THEN 'function' WHEN 'p' THEN 'procedure' END AS routine_kind,
       rd.prosecdef AS security_definer, rd.proconfig,
       pg_catalog.pg_get_userbyid(rd.proowner) AS owner,
       rd.routine_definition
FROM routine_definitions rd
WHERE rd.routine_definition ILIKE ANY (ARRAY[
  '%departments%', '%teams%', '%team_seasons%', '%players%',
  '%player_team_seasons%', '%coaches%', '%coach_team_seasons%',
  '%team_training_times%', '%team_training_exceptions%', '%board_members%',
  '%board_roles%', '%media_assets%', '%media_asset_usages%',
  '%admin_roles%', '%admin_permissions%', '%admin_role_permissions%',
  '%has_permission%', '%permission%'
])
ORDER BY rd.oid::regprocedure::text;

-- H1.26_RELEVANT_FUNCTION_EXECUTE_RIGHTS
WITH eligible_routines AS MATERIALIZED (
  SELECT p.oid, n.nspname AS routine_schema, p.proname AS routine_name,
         p.prokind, p.prosecdef, p.proconfig, p.proowner
  FROM pg_catalog.pg_proc p
  JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
  WHERE p.prokind IN ('f', 'p')
    AND n.nspname NOT IN ('pg_catalog', 'information_schema')
), routine_definitions AS MATERIALIZED (
  SELECT er.*, pg_catalog.pg_get_functiondef(er.oid) AS routine_definition
  FROM eligible_routines er
), relevant_routines AS MATERIALIZED (
  SELECT * FROM routine_definitions rd
  WHERE rd.routine_definition ILIKE ANY (ARRAY[
    '%departments%', '%teams%', '%team_seasons%', '%players%',
    '%player_team_seasons%', '%coaches%', '%coach_team_seasons%',
    '%team_training_times%', '%team_training_exceptions%', '%board_members%',
    '%board_roles%', '%media_assets%', '%media_asset_usages%',
    '%admin_roles%', '%admin_permissions%', '%admin_role_permissions%',
    '%has_permission%', '%permission%'
  ])
), api_roles(role_name) AS MATERIALIZED (
  VALUES ('anon'), ('authenticated'), ('service_role')
)
SELECT 'H1.26_RELEVANT_FUNCTION_EXECUTE_RIGHTS' AS section,
       rr.oid::regprocedure::text AS exact_signature,
       rr.routine_schema, rr.routine_name,
       rr.prosecdef AS security_definer, rr.proconfig,
       pg_catalog.pg_get_userbyid(rr.proowner) AS owner,
       ar.role_name,
       pg_catalog.has_function_privilege(ar.role_name, rr.oid, 'EXECUTE') AS effective_execute
FROM relevant_routines rr
CROSS JOIN api_roles ar
ORDER BY rr.oid::regprocedure::text, ar.role_name;

-- H1.27_SUMMARY_COUNTS
WITH table_tennis_departments AS MATERIALIZED (
  SELECT d.id FROM public.departments d
  WHERE lower(COALESCE(to_jsonb(d)->>'slug', '')) LIKE ANY (ARRAY['%tischtennis%', '%table-tennis%'])
     OR lower(COALESCE(to_jsonb(d)->>'name_de', to_jsonb(d)->>'name', '')) LIKE '%tischtennis%'
), table_tennis_teams AS MATERIALIZED (
  SELECT t.id FROM public.teams t JOIN table_tennis_departments d ON d.id = t.department_id
), table_tennis_team_seasons AS MATERIALIZED (
  SELECT ts.id FROM public.team_seasons ts JOIN table_tennis_teams t ON t.id = ts.team_id
)
SELECT 'H1.27_SUMMARY_COUNTS' AS section,
       (SELECT count(*) FROM public.departments) AS total_departments,
       (SELECT count(*) FROM table_tennis_departments) AS table_tennis_department_candidates,
       (SELECT count(*) FROM public.teams) AS total_teams,
       (SELECT count(*) FROM table_tennis_teams) AS table_tennis_teams,
       (SELECT count(*) FROM table_tennis_team_seasons) AS table_tennis_team_seasons,
       (SELECT count(*) FROM public.player_team_seasons pts JOIN table_tennis_team_seasons tts ON tts.id = pts.team_season_id) AS table_tennis_player_assignments,
       (SELECT count(*) FROM public.coach_team_seasons cts JOIN table_tennis_team_seasons tts ON tts.id = cts.team_season_id) AS table_tennis_coach_assignments,
       (SELECT count(*) FROM public.team_training_times ttt JOIN table_tennis_team_seasons tts ON tts.id = ttt.team_season_id) AS table_tennis_training_times,
       (SELECT count(*) FROM public.admin_roles r WHERE r.key = 'tischtennis-vorstand') AS matching_admin_roles,
       (SELECT count(*) FROM public.admin_roles r
        JOIN public.admin_role_permissions rp ON rp.role_id = r.id
        WHERE r.key = 'tischtennis-vorstand') AS assigned_permissions;
