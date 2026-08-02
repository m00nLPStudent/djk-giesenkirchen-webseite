-- B15.16G3 read-only postcheck. Compare with the G1 preflight.
SELECT c.relname, c.relrowsecurity, c.relforcerowsecurity
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname = 'team_templates';

SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies WHERE schemaname = 'public' AND tablename = 'team_templates'
ORDER BY cmd, policyname;

SELECT count(*) FILTER (WHERE cmd = 'SELECT') AS select_policies,
 count(*) FILTER (WHERE cmd = 'INSERT' AND policyname = 'team_templates_insert_settings_edit') AS expected_insert_policies,
 count(*) FILTER (WHERE cmd = 'UPDATE' AND policyname = 'team_templates_update_settings_edit') AS expected_update_policies,
 count(*) FILTER (WHERE cmd = 'DELETE' AND policyname = 'team_templates_delete_settings_edit') AS expected_delete_policies
FROM pg_policies WHERE schemaname = 'public' AND tablename = 'team_templates';

SELECT policyname, cmd, roles, qual, with_check FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'team_templates' AND cmd <> 'SELECT'
AND (coalesce(qual, '') = 'true' OR coalesce(with_check, '') = 'true'
 OR coalesce(qual, '') ILIKE '%app_metadata%' OR coalesce(with_check, '') ILIKE '%app_metadata%');
