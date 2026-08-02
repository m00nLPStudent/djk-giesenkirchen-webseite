-- B15.16A: ausschliesslich lesender Struktur- und Werte-Preflight.

SELECT table_schema, table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'club_settings', 'club_contacts', 'pages',
    'membership_requests', 'membership_request_recipients',
    'teams', 'team_seasons', 'team_templates', 'departments',
    'news', 'events', 'news_categories', 'event_categories',
    'download_categories', 'downloads',
    'admin_roles', 'admin_permissions', 'admin_role_permissions'
  )
ORDER BY table_name;

SELECT table_name, ordinal_position, column_name, data_type,
       is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'club_settings', 'club_contacts', 'pages',
    'membership_requests', 'membership_request_recipients',
    'teams', 'team_seasons', 'team_templates', 'departments',
    'news', 'events', 'news_categories', 'event_categories',
    'download_categories', 'downloads',
    'admin_roles', 'admin_permissions', 'admin_role_permissions'
  )
ORDER BY table_name, ordinal_position;

SELECT n.nspname AS schema_name, c.relname AS table_name,
       con.conname AS constraint_name, con.contype,
       pg_get_constraintdef(con.oid) AS definition
FROM pg_constraint con
JOIN pg_class c ON c.oid = con.conrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN (
    'membership_requests', 'membership_request_recipients',
    'teams', 'team_seasons', 'team_templates', 'departments',
    'news', 'events', 'news_categories', 'event_categories',
    'download_categories', 'downloads', 'admin_roles',
    'admin_permissions', 'admin_role_permissions'
  )
ORDER BY c.relname, con.conname;

SELECT ns.nspname AS schema_name, t.typname AS enum_name,
       e.enumsortorder, e.enumlabel
FROM pg_type t
JOIN pg_enum e ON e.enumtypid = t.oid
JOIN pg_namespace ns ON ns.oid = t.typnamespace
WHERE ns.nspname = 'public'
ORDER BY t.typname, e.enumsortorder;

SELECT tc.table_name, kcu.column_name, tc.constraint_name,
       ccu.table_name AS referenced_table,
       ccu.column_name AS referenced_column,
       rc.update_rule, rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_schema = kcu.constraint_schema
 AND tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_schema = ccu.constraint_schema
 AND tc.constraint_name = ccu.constraint_name
JOIN information_schema.referential_constraints rc
  ON tc.constraint_schema = rc.constraint_schema
 AND tc.constraint_name = rc.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('teams', 'team_seasons', 'news', 'events')
ORDER BY tc.table_name, tc.constraint_name;

SELECT schemaname, tablename, policyname, permissive, roles, cmd,
       qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'team_templates', 'teams', 'team_seasons', 'news', 'events',
    'membership_requests', 'membership_request_recipients',
    'news_categories', 'event_categories', 'download_categories'
  )
ORDER BY tablename, policyname;

SELECT event_object_table AS table_name, trigger_name,
       event_manipulation, action_timing, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table IN (
    'team_templates', 'teams', 'team_seasons', 'news', 'events',
    'membership_requests', 'membership_request_recipients'
  )
ORDER BY event_object_table, trigger_name, event_manipulation;

SELECT n.nspname AS schema_name, p.proname AS function_name,
       pg_get_function_identity_arguments(p.oid) AS arguments,
       p.prokind, p.prosecdef AS security_definer
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND (
    p.proname ILIKE '%team%' OR p.proname ILIKE '%news%'
    OR p.proname ILIKE '%event%' OR p.proname ILIKE '%membership%'
    OR p.proname ILIKE '%permission%' OR p.proname ILIKE '%role%'
  )
ORDER BY p.proname;

SELECT id, name_de, slug, age_group, is_active, sort_order
FROM public.team_templates
ORDER BY sort_order, name_de;

SELECT age_group, count(*) AS usage_count
FROM public.team_seasons
GROUP BY age_group
ORDER BY age_group;

SELECT name_de, slug, age_group, count(*) OVER (PARTITION BY lower(name_de)) AS same_name_count
FROM public.teams
ORDER BY name_de;

SELECT coalesce(category_key, '') AS category_key,
       coalesce(category, '') AS category_label,
       count(*) AS usage_count
FROM public.news
GROUP BY category_key, category
ORDER BY category_key, category;

SELECT event_type, count(*) AS usage_count
FROM public.events
GROUP BY event_type
ORDER BY event_type;

SELECT key, name, is_active, sort_order
FROM public.admin_roles
ORDER BY sort_order, key;

SELECT p.key AS permission_key, r.key AS role_key
FROM public.admin_role_permissions rp
JOIN public.admin_permissions p ON p.id = rp.permission_id
JOIN public.admin_roles r ON r.id = rp.role_id
WHERE p.key IN (
  'settings.view', 'settings.edit',
  'membership_requests.view', 'membership_requests.edit',
  'membership_requests.forward'
)
ORDER BY p.key, r.key;
