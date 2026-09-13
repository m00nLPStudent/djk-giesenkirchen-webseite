-- PRIORITY 7 - database/season cleanup live preflight (READ ONLY)
-- Execute manually in the Supabase SQL Editor. Export all 22 resultsets.
-- This script intentionally contains only SELECT/WITH catalog and count queries.
-- It does not reveal email addresses, names, auth metadata, tokens or credentials.

-- P7.01_RELATIONS
SELECT 'P7.01_RELATIONS' AS section,
       n.nspname AS schema_name,
       c.relname AS relation_name,
       CASE c.relkind WHEN 'r' THEN 'table' WHEN 'p' THEN 'partitioned_table'
         WHEN 'v' THEN 'view' WHEN 'm' THEN 'materialized_view' ELSE c.relkind::text END AS relation_kind,
       c.relrowsecurity AS rls_enabled,
       c.relforcerowsecurity AS force_rls,
       pg_get_userbyid(c.relowner) AS owner_name,
       COALESCE(s.n_live_tup, 0)::bigint AS estimated_rows
FROM pg_catalog.pg_class c
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_catalog.pg_stat_all_tables s ON s.relid = c.oid
WHERE n.nspname IN ('public', 'auth', 'storage')
  AND c.relkind IN ('r', 'p', 'v', 'm')
ORDER BY n.nspname, c.relname;

-- P7.02_KEEP_FOUNDATION
WITH keep_names(name) AS (VALUES
  ('admin_roles'), ('admin_permissions'), ('admin_role_permissions'), ('departments'),
  ('club_settings'), ('news_categories'), ('event_types'), ('download_categories'),
  ('sponsor_categories'), ('team_templates'), ('notification_email_settings'),
  ('notification_email_global_settings')
)
SELECT 'P7.02_KEEP_FOUNDATION' AS section, k.name AS expected_relation,
       to_regclass('public.' || k.name) IS NOT NULL AS exists_live
FROM keep_names k ORDER BY k.name;

-- P7.03_SUPERADMIN_IDENTITY
-- Technical IDs only. Exactly one distinct auth_user_id must be returned and all flags must be true.
WITH candidates AS MATERIALIZED (
  SELECT DISTINCT ap.id AS auth_user_id
  FROM public.admin_profiles ap
  JOIN auth.users au ON au.id = ap.id
  JOIN public.admin_user_roles aur ON aur.user_id = ap.id
  JOIN public.admin_roles ar ON ar.id = aur.role_id
  WHERE ar.key = 'superadmin' AND ar.is_active IS TRUE AND ap.is_active IS TRUE
), summary AS (
  SELECT count(*)::bigint AS candidate_count FROM candidates
)
SELECT 'P7.03_SUPERADMIN_IDENTITY' AS section, c.auth_user_id,
       s.candidate_count,
       s.candidate_count = 1 AS exactly_one_operator,
       EXISTS (SELECT 1 FROM public.admin_profiles ap WHERE ap.id = c.auth_user_id) AS profile_exists,
       EXISTS (SELECT 1 FROM auth.users au WHERE au.id = c.auth_user_id) AS auth_user_exists,
       EXISTS (
         SELECT 1 FROM public.admin_user_roles aur
         JOIN public.admin_roles ar ON ar.id = aur.role_id
         WHERE aur.user_id = c.auth_user_id AND ar.key = 'superadmin' AND ar.is_active IS TRUE
       ) AS active_superadmin_role_exists
FROM candidates c CROSS JOIN summary s
UNION ALL
SELECT 'P7.03_SUPERADMIN_IDENTITY', NULL::uuid, s.candidate_count,
       false, false, false, false
FROM summary s WHERE s.candidate_count = 0
ORDER BY auth_user_id NULLS LAST;

-- P7.04_USER_MODEL_COUNTS
SELECT 'P7.04_USER_MODEL_COUNTS' AS section, metric, row_count
FROM (VALUES
  ('auth.users', (SELECT count(*)::bigint FROM auth.users)),
  ('admin_profiles', (SELECT count(*)::bigint FROM public.admin_profiles)),
  ('admin_user_roles', (SELECT count(*)::bigint FROM public.admin_user_roles)),
  ('profiles_without_auth_user', (SELECT count(*)::bigint FROM public.admin_profiles ap LEFT JOIN auth.users au ON au.id=ap.id WHERE au.id IS NULL)),
  ('auth_users_without_profile', (SELECT count(*)::bigint FROM auth.users au LEFT JOIN public.admin_profiles ap ON ap.id=au.id WHERE ap.id IS NULL)),
  ('non_superadmin_auth_users', (SELECT count(*)::bigint FROM auth.users au WHERE NOT EXISTS (
    SELECT 1 FROM public.admin_user_roles aur JOIN public.admin_roles ar ON ar.id=aur.role_id
    WHERE aur.user_id=au.id AND ar.key='superadmin' AND ar.is_active IS TRUE)))
) AS x(metric, row_count) ORDER BY metric;

-- P7.05_USER_FOREIGN_KEYS
SELECT 'P7.05_USER_FOREIGN_KEYS' AS section,
       ns.nspname AS child_schema, child.relname AS child_table, con.conname,
       pg_get_constraintdef(con.oid, true) AS definition,
       CASE con.confdeltype WHEN 'a' THEN 'NO ACTION' WHEN 'r' THEN 'RESTRICT'
         WHEN 'c' THEN 'CASCADE' WHEN 'n' THEN 'SET NULL' WHEN 'd' THEN 'SET DEFAULT' END AS on_delete
FROM pg_catalog.pg_constraint con
JOIN pg_catalog.pg_class child ON child.oid=con.conrelid
JOIN pg_catalog.pg_namespace ns ON ns.oid=child.relnamespace
WHERE con.contype='f'
  AND con.confrelid IN ('auth.users'::regclass, 'public.admin_profiles'::regclass)
ORDER BY ns.nspname, child.relname, con.conname;

-- P7.06_ROLE_PERMISSION_BASELINE
SELECT 'P7.06_ROLE_PERMISSION_BASELINE' AS section,
       (SELECT count(*) FROM public.admin_roles)::bigint AS role_count,
       (SELECT count(*) FROM public.admin_permissions)::bigint AS permission_count,
       (SELECT count(*) FROM public.admin_role_permissions)::bigint AS role_permission_count,
       (SELECT count(*) FROM public.admin_user_roles)::bigint AS user_role_count,
       (SELECT count(*) FROM public.admin_roles WHERE key='superadmin' AND is_active IS TRUE)::bigint AS active_superadmin_role_count;

-- P7.07_DEPARTMENT_BASELINE
SELECT 'P7.07_DEPARTMENT_BASELINE' AS section, id, slug, is_active
FROM public.departments ORDER BY slug;

-- P7.08_TEAM_SEASON_COUNTS
SELECT 'P7.08_TEAM_SEASON_COUNTS' AS section, metric, row_count FROM (VALUES
  ('teams', (SELECT count(*)::bigint FROM public.teams)),
  ('team_seasons', (SELECT count(*)::bigint FROM public.team_seasons)),
  ('team_season_year_groups', (SELECT count(*)::bigint FROM public.team_season_year_groups)),
  ('player_team_seasons', (SELECT count(*)::bigint FROM public.player_team_seasons)),
  ('coach_team_seasons', (SELECT count(*)::bigint FROM public.coach_team_seasons)),
  ('team_season_external_competitions', (SELECT count(*)::bigint FROM public.team_season_external_competitions))
) x(metric,row_count) ORDER BY metric;

-- P7.09_PERSON_DATA_COUNTS
SELECT 'P7.09_PERSON_DATA_COUNTS' AS section, metric, row_count FROM (VALUES
  ('players', (SELECT count(*)::bigint FROM public.players)),
  ('coaches', (SELECT count(*)::bigint FROM public.coaches)),
  ('coach_team_seasons', (SELECT count(*)::bigint FROM public.coach_team_seasons)),
  ('board_members', (SELECT count(*)::bigint FROM public.board_members)),
  ('club_contacts', (SELECT count(*)::bigint FROM public.club_contacts))
) x(metric,row_count) ORDER BY metric;

-- P7.10_CONTENT_COUNTS
SELECT 'P7.10_CONTENT_COUNTS' AS section, metric, row_count FROM (VALUES
  ('news', (SELECT count(*)::bigint FROM public.news)),
  ('news_documents', (SELECT count(*)::bigint FROM public.news_documents)),
  ('events', (SELECT count(*)::bigint FROM public.events)),
  ('event_documents', (SELECT count(*)::bigint FROM public.event_documents)),
  ('sponsors', (SELECT count(*)::bigint FROM public.sponsors)),
  ('downloads', (SELECT count(*)::bigint FROM public.downloads)),
  ('club_history_pages', (SELECT count(*)::bigint FROM public.club_history_pages)),
  ('club_history_images', (SELECT count(*)::bigint FROM public.club_history_images)),
  ('club_history_milestones', (SELECT count(*)::bigint FROM public.club_history_milestones)),
  ('department_sections', (SELECT count(*)::bigint FROM public.department_sections)),
  ('pages', (SELECT count(*)::bigint FROM public.pages))
) x(metric,row_count) ORDER BY metric;

-- P7.11_TRAINING_COUNTS
SELECT 'P7.11_TRAINING_COUNTS' AS section, metric, row_count FROM (VALUES
  ('team_training_times', (SELECT count(*)::bigint FROM public.team_training_times)),
  ('team_training_exceptions', (SELECT count(*)::bigint FROM public.team_training_exceptions)),
  ('department_training_times', (SELECT count(*)::bigint FROM public.department_training_times))
) x(metric,row_count) ORDER BY metric;

-- P7.12_MEDIA_COUNTS
SELECT 'P7.12_MEDIA_COUNTS' AS section,
       (SELECT count(*) FROM public.media_assets)::bigint AS media_asset_count,
       (SELECT count(*) FROM public.media_assets WHERE is_archived IS TRUE)::bigint AS archived_asset_count,
       (SELECT count(*) FROM public.media_asset_usages)::bigint AS media_usage_count,
       (SELECT count(DISTINCT media_asset_id) FROM public.media_asset_usages)::bigint AS used_asset_count;

-- P7.13_MEMBERSHIP_CONTRIBUTION_COUNTS
SELECT 'P7.13_MEMBERSHIP_CONTRIBUTION_COUNTS' AS section, metric, row_count FROM (VALUES
  ('membership_requests', (SELECT count(*)::bigint FROM public.membership_requests)),
  ('player_contributions', (SELECT count(*)::bigint FROM public.player_contributions)),
  ('player_contribution_payments', (SELECT count(*)::bigint FROM public.player_contribution_payments))
) x(metric,row_count) ORDER BY metric;

-- P7.14_NOTIFICATION_COUNTS
SELECT 'P7.14_NOTIFICATION_COUNTS' AS section, metric, row_count FROM (VALUES
  ('notifications', (SELECT count(*)::bigint FROM public.notifications)),
  ('notification_deliveries', (SELECT count(*)::bigint FROM public.notification_deliveries)),
  ('notification_preferences', (SELECT count(*)::bigint FROM public.notification_preferences)),
  ('notification_audit', (SELECT count(*)::bigint FROM public.notification_audit)),
  ('notification_email_settings', (SELECT count(*)::bigint FROM public.notification_email_settings)),
  ('notification_email_global_settings', (SELECT count(*)::bigint FROM public.notification_email_global_settings))
) x(metric,row_count) ORDER BY metric;

-- P7.15_AUTH_WORKFLOW_COUNTS
SELECT 'P7.15_AUTH_WORKFLOW_COUNTS' AS section,
       (SELECT count(*) FROM public.admin_email_change_requests)::bigint AS email_change_request_count,
       (SELECT count(*) FROM public.admin_email_change_requests WHERE status IN ('pending','processing','compensating'))::bigint AS active_email_change_request_count;

-- P7.16_STORAGE_INVENTORY
-- Metadata only; object names and owners are deliberately omitted.
SELECT 'P7.16_STORAGE_INVENTORY' AS section, b.id AS bucket_id, b.public,
       count(o.id)::bigint AS object_count,
       COALESCE(sum((o.metadata ->> 'size')::bigint), 0)::bigint AS recorded_bytes
FROM storage.buckets b LEFT JOIN storage.objects o ON o.bucket_id=b.id
GROUP BY b.id, b.public ORDER BY b.id;

-- P7.17_FOREIGN_KEYS
SELECT 'P7.17_FOREIGN_KEYS' AS section,
       src_ns.nspname AS child_schema, src.relname AS child_table, con.conname,
       dst_ns.nspname AS parent_schema, dst.relname AS parent_table,
       pg_get_constraintdef(con.oid, true) AS definition,
       CASE con.confdeltype WHEN 'a' THEN 'NO ACTION' WHEN 'r' THEN 'RESTRICT'
         WHEN 'c' THEN 'CASCADE' WHEN 'n' THEN 'SET NULL' WHEN 'd' THEN 'SET DEFAULT' END AS on_delete
FROM pg_catalog.pg_constraint con
JOIN pg_catalog.pg_class src ON src.oid=con.conrelid
JOIN pg_catalog.pg_namespace src_ns ON src_ns.oid=src.relnamespace
JOIN pg_catalog.pg_class dst ON dst.oid=con.confrelid
JOIN pg_catalog.pg_namespace dst_ns ON dst_ns.oid=dst.relnamespace
WHERE con.contype='f' AND src_ns.nspname IN ('public','storage')
ORDER BY parent_schema, parent_table, child_schema, child_table, con.conname;

-- P7.18_DELETE_ORDER_CANDIDATES
-- Diagnostic graph only. depth_from_leaf=0 means no candidate child depends on that table.
WITH RECURSIVE candidates(relid) AS (
  SELECT c.oid FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relname = ANY (ARRAY[
    'notifications','notification_deliveries','notification_preferences','notification_audit',
    'membership_requests','player_contribution_payments','player_contributions',
    'media_asset_usages','media_assets','news_documents','news','event_documents','events',
    'downloads','sponsors','club_history_images','club_history_milestones','club_history_pages',
    'department_training_times','department_sections','team_training_exceptions','team_training_times',
    'player_team_seasons','coach_team_seasons','team_season_year_groups',
    'team_season_external_competitions','team_seasons','players','coaches','board_members','teams','club_contacts'
  ])
), edges AS (
  SELECT con.conrelid AS child, con.confrelid AS parent, con.confdeltype
  FROM pg_catalog.pg_constraint con
  WHERE con.contype='f' AND con.conrelid IN (SELECT relid FROM candidates)
    AND con.confrelid IN (SELECT relid FROM candidates)
), walk(relid, depth, path) AS (
  SELECT c.relid, 0, ARRAY[c.relid] FROM candidates c
  WHERE NOT EXISTS (SELECT 1 FROM edges e WHERE e.parent=c.relid)
  UNION ALL
  SELECT e.parent, w.depth+1, w.path || e.parent
  FROM walk w JOIN edges e ON e.child=w.relid
  WHERE NOT e.parent = ANY(w.path)
)
SELECT 'P7.18_DELETE_ORDER_CANDIDATES' AS section, c.relid::regclass::text AS relation_name,
       COALESCE(max(w.depth),0) AS suggested_parent_depth,
       count(*) FILTER (WHERE e.parent=c.relid) AS candidate_child_fk_count,
       count(*) FILTER (WHERE e.parent=c.relid AND e.confdeltype IN ('a','r')) AS blocking_child_fk_count
FROM candidates c LEFT JOIN walk w ON w.relid=c.relid LEFT JOIN edges e ON e.parent=c.relid
GROUP BY c.relid ORDER BY suggested_parent_depth, relation_name;

-- P7.19_AUDIT_DATA
SELECT 'P7.19_AUDIT_DATA' AS section, c.relname AS relation_name,
       COALESCE(s.n_live_tup,0)::bigint AS estimated_rows,
       CASE WHEN c.relname='notification_audit' THEN 'MANUAL DECISION REQUIRED' ELSE 'REVIEW' END AS cleanup_class
FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
LEFT JOIN pg_catalog.pg_stat_all_tables s ON s.relid=c.oid
WHERE n.nspname='public' AND (c.relname ILIKE '%audit%' OR c.relname ILIKE '%log%')
ORDER BY c.relname;

-- P7.20_POLICIES_TRIGGERS
SELECT 'P7.20_POLICIES_TRIGGERS' AS section, object_type, schema_name, relation_name, object_name, definition
FROM (
  SELECT 'policy'::text, schemaname, tablename, policyname,
         concat_ws(' ', cmd, array_to_string(roles, ','), qual, with_check) FROM pg_catalog.pg_policies
  WHERE schemaname IN ('public','storage')
  UNION ALL
  SELECT 'trigger', event_object_schema, event_object_table, trigger_name, action_statement
  FROM information_schema.triggers WHERE event_object_schema IN ('public','auth','storage')
) x(object_type,schema_name,relation_name,object_name,definition)
ORDER BY object_type,schema_name,relation_name,object_name;

-- P7.21_RELEVANT_FUNCTIONS
WITH funcs AS MATERIALIZED (
  SELECT p.oid, n.nspname, p.proname, p.prosecdef, p.proconfig, pg_get_userbyid(p.proowner) AS owner_name
  FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname IN ('public','auth','storage') AND p.prokind IN ('f','p')
)
SELECT 'P7.21_RELEVANT_FUNCTIONS' AS section, f.oid::regprocedure::text AS signature,
       f.nspname AS schema_name, f.prosecdef AS security_definer, f.proconfig, f.owner_name
FROM funcs f
WHERE f.proname ILIKE ANY (ARRAY['%admin%','%permission%','%notification%','%media%','%team%','%department%'])
ORDER BY f.oid::regprocedure::text;

-- P7.22_CLASSIFICATION_COVERAGE
WITH classified(name, cleanup_class) AS (VALUES
  ('admin_roles','MUST KEEP'),('admin_permissions','MUST KEEP'),('admin_role_permissions','MUST KEEP'),
  ('departments','MUST KEEP'),('club_settings','MUST KEEP'),('news_categories','MUST KEEP'),
  ('event_types','MUST KEEP'),('download_categories','MUST KEEP'),('sponsor_categories','MUST KEEP'),
  ('team_templates','MUST KEEP'),('notification_email_settings','MUST KEEP'),
  ('notification_email_global_settings','MUST KEEP'),('admin_profiles','MIXED / OPERATOR KEEP'),
  ('admin_user_roles','MIXED / OPERATOR KEEP'),('notification_audit','MANUAL DECISION REQUIRED'),
  ('department_sections','MANUAL DECISION REQUIRED'),('team_training_exceptions','SAFE DELETE CANDIDATE'),
  ('team_training_times','SAFE DELETE CANDIDATE'),('department_training_times','SAFE DELETE CANDIDATE'),
  ('teams','SAFE DELETE CANDIDATE'),('team_seasons','SAFE DELETE CANDIDATE'),
  ('players','SAFE DELETE CANDIDATE'),('coaches','SAFE DELETE CANDIDATE'),
  ('board_members','SAFE DELETE CANDIDATE'),('news','SAFE DELETE CANDIDATE'),
  ('events','SAFE DELETE CANDIDATE'),('media_assets','SAFE DELETE CANDIDATE'),
  ('media_asset_usages','SAFE DELETE CANDIDATE'),('downloads','SAFE DELETE CANDIDATE'),
  ('membership_requests','SAFE DELETE CANDIDATE'),('player_contributions','SAFE DELETE CANDIDATE'),
  ('player_contribution_payments','SAFE DELETE CANDIDATE'),('notifications','SAFE DELETE CANDIDATE'),
  ('notification_deliveries','SAFE DELETE CANDIDATE'),
  ('team_season_external_competitions','SAFE DELETE CANDIDATE')
)
SELECT 'P7.22_CLASSIFICATION_COVERAGE' AS section, c.relname AS relation_name,
       COALESCE(k.cleanup_class,'MANUAL DECISION REQUIRED') AS cleanup_class,
       COALESCE(s.n_live_tup,0)::bigint AS estimated_rows
FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
LEFT JOIN classified k ON k.name=c.relname LEFT JOIN pg_catalog.pg_stat_all_tables s ON s.relid=c.oid
WHERE n.nspname='public' AND c.relkind IN ('r','p')
ORDER BY cleanup_class, relation_name;

-- Expected resultsets: exactly 22 (P7.01 through P7.22).
