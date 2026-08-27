-- B15.23B1 read-only postcheck. Execute manually after the proposal.

SELECT c.relname AS table_name,c.relrowsecurity AS rls_enabled,c.relforcerowsecurity AS force_rls
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relname IN ('coaches','board_members','club_contacts')
ORDER BY c.relname;

SELECT schemaname,tablename,policyname,roles,cmd,qual,with_check
FROM pg_policies
WHERE schemaname='public' AND tablename IN ('coaches','board_members','club_contacts')
ORDER BY tablename,policyname;

WITH roles(role_name) AS (VALUES ('anon'::text),('authenticated'::text),('service_role'::text)),
tables(table_name) AS (VALUES ('coaches'::text),('board_members'::text),('club_contacts'::text)),
privileges(privilege_name) AS (VALUES ('SELECT'::text),('INSERT'::text),('UPDATE'::text),('DELETE'::text),('TRUNCATE'::text),('REFERENCES'::text),('TRIGGER'::text))
SELECT tables.table_name,roles.role_name,privileges.privilege_name,
       has_table_privilege(roles.role_name,format('public.%I',tables.table_name),privileges.privilege_name) AS granted
FROM tables CROSS JOIN roles CROSS JOIN privileges
ORDER BY tables.table_name,roles.role_name,privileges.privilege_name;

SELECT grantee,table_name,column_name,privilege_type
FROM information_schema.role_column_grants
WHERE table_schema='public' AND table_name IN ('coaches','board_members','club_contacts')
  AND grantee IN ('PUBLIC','anon','authenticated','service_role')
ORDER BY table_name,grantee,column_name,privilege_type;

SELECT
  has_function_privilege('anon','public.remove_entity(text,uuid)','EXECUTE') AS anon_remove_entity,
  has_function_privilege('authenticated','public.remove_entity(text,uuid)','EXECUTE') AS authenticated_remove_entity,
  has_function_privilege('service_role','public.remove_entity(text,uuid)','EXECUTE') AS service_remove_entity,
  has_function_privilege('anon','public.synchronize_media_assignment(text,uuid,uuid,text)','EXECUTE') AS anon_media_sync,
  has_function_privilege('authenticated','public.synchronize_media_assignment(text,uuid,uuid,text)','EXECUTE') AS authenticated_media_sync,
  has_function_privilege('service_role','public.synchronize_media_assignment(text,uuid,uuid,text)','EXECUTE') AS service_media_sync;

SELECT
  count(*) FILTER (WHERE roles @> ARRAY['public']::name[] AND cmd IN ('INSERT','UPDATE','DELETE','ALL')) AS public_write_policies,
  count(*) FILTER (WHERE policyname IN ('Allow public insert coaches','Allow public update coaches','Allow public delete coaches','board_members_insert_all','board_members_update_all','board_members_delete_all')) AS legacy_open_write_policies,
  count(*) FILTER (WHERE coalesce(qual,'') ILIKE '%app_metadata%' OR coalesce(with_check,'') ILIKE '%app_metadata%') AS legacy_app_metadata_policies
FROM pg_policies
WHERE schemaname='public' AND tablename IN ('coaches','board_members','club_contacts');

SELECT
  (SELECT count(*) FROM public.coaches) AS coaches_rows,
  (SELECT count(*) FROM public.board_members) AS board_members_rows,
  (SELECT count(*) FROM public.club_contacts) AS club_contacts_rows;
