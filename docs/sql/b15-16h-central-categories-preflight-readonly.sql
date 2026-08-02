-- B15.16H read-only live verification. No schema or data changes.
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'news_categories', 'event_types', 'event_categories',
    'download_categories', 'downloads'
  )
ORDER BY table_name;

SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'news', 'events', 'news_categories', 'event_types',
    'event_categories', 'download_categories', 'downloads'
  )
ORDER BY table_name, ordinal_position;

SELECT conrelid::regclass AS table_name, conname, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE connamespace = 'public'::regnamespace
  AND conrelid IN ('public.news'::regclass, 'public.events'::regclass)
ORDER BY conrelid::regclass::text, conname;

SELECT category_key, category, count(*) AS usage_count
FROM public.news
GROUP BY category_key, category
ORDER BY category_key NULLS LAST, category NULLS LAST;

SELECT event_type, count(*) AS usage_count
FROM public.events
GROUP BY event_type
ORDER BY event_type;

SELECT n.nspname AS schema_name, p.proname, pg_get_function_identity_arguments(p.oid) AS arguments
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND (p.proname ILIKE '%updated_at%' OR p.proname ILIKE '%permission%')
ORDER BY p.proname;

SELECT event_object_table, trigger_name, event_manipulation, action_statement
FROM information_schema.triggers WHERE event_object_schema = 'public'
ORDER BY event_object_table, trigger_name, event_manipulation;

SELECT tablename, indexname, indexdef FROM pg_indexes
WHERE schemaname = 'public' AND (tablename IN ('news', 'events') OR tablename ILIKE '%categor%' OR tablename ILIKE '%type%')
ORDER BY tablename, indexname;

SELECT table_name, column_name FROM information_schema.columns
WHERE table_schema = 'public' AND (table_name ILIKE '%download%' OR column_name ILIKE '%download%')
ORDER BY table_name, ordinal_position;
