-- B15.23C read-only live preflight. Execute manually before the proposal.

SELECT c.relname,c.relrowsecurity,c.relforcerowsecurity,pg_get_userbyid(c.relowner) AS owner
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relname IN ('admin_profiles','media_assets','media_asset_usages')
ORDER BY c.relname;

SELECT table_name,ordinal_position,column_name,data_type,udt_name,is_nullable,column_default
FROM information_schema.columns
WHERE table_schema='public' AND table_name IN ('admin_profiles','media_assets','media_asset_usages')
ORDER BY table_name,ordinal_position;

SELECT c.relname AS table_name,con.conname,con.contype,pg_get_constraintdef(con.oid,true) AS definition
FROM pg_constraint con JOIN pg_class c ON c.oid=con.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relname IN ('admin_profiles','media_assets','media_asset_usages')
ORDER BY c.relname,con.conname;

SELECT schemaname,tablename,indexname,indexdef FROM pg_indexes
WHERE schemaname='public' AND tablename IN ('admin_profiles','media_assets','media_asset_usages')
ORDER BY tablename,indexname;

SELECT schemaname,tablename,policyname,roles,cmd,qual,with_check FROM pg_policies
WHERE schemaname='public' AND tablename IN ('admin_profiles','media_assets','media_asset_usages')
ORDER BY tablename,policyname;

SELECT grantee,table_name,privilege_type,is_grantable FROM information_schema.role_table_grants
WHERE table_schema='public' AND table_name IN ('admin_profiles','media_assets','media_asset_usages')
  AND grantee IN ('PUBLIC','anon','authenticated','service_role')
ORDER BY table_name,grantee,privilege_type;

SELECT grantee,table_name,column_name,privilege_type,is_grantable FROM information_schema.role_column_grants
WHERE table_schema='public' AND table_name='admin_profiles'
  AND grantee IN ('PUBLIC','anon','authenticated','service_role')
ORDER BY grantee,column_name,privilege_type;

WITH roles(role_name) AS (VALUES ('anon'::text),('authenticated'::text),('service_role'::text)),
privileges(privilege_name) AS (VALUES ('SELECT'::text),('INSERT'::text),('UPDATE'::text),('DELETE'::text),('TRUNCATE'::text),('REFERENCES'::text),('TRIGGER'::text))
SELECT roles.role_name,privileges.privilege_name,
 has_table_privilege(roles.role_name,'public.admin_profiles',privileges.privilege_name) AS granted
FROM roles CROSS JOIN privileges ORDER BY roles.role_name,privileges.privilege_name;

SELECT event_object_table,trigger_name,action_timing,event_manipulation,action_statement
FROM information_schema.triggers
WHERE event_object_schema='public' AND event_object_table IN ('admin_profiles','media_assets','media_asset_usages')
ORDER BY event_object_table,trigger_name,event_manipulation;

SELECT p.oid::regprocedure::text AS signature,p.prosecdef,p.proconfig,pg_get_userbyid(p.proowner) AS owner,
       p.proacl,pg_get_functiondef(p.oid) AS definition
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND p.prokind IN ('f','p')
  AND p.oid IN (
    to_regprocedure('public.synchronize_media_assignment(text,uuid,uuid,text)'),
    to_regprocedure('public.set_updated_at()')
  )
ORDER BY p.oid::regprocedure::text;

SELECT
 has_function_privilege('anon','public.synchronize_media_assignment(text,uuid,uuid,text)','EXECUTE') AS anon_media_sync,
 has_function_privilege('authenticated','public.synchronize_media_assignment(text,uuid,uuid,text)','EXECUTE') AS authenticated_media_sync,
 has_function_privilege('service_role','public.synchronize_media_assignment(text,uuid,uuid,text)','EXECUTE') AS service_media_sync;

SELECT
 count(*) AS profile_rows,
 count(*) FILTER (WHERE id IS NULL) AS invalid_profile_ids
FROM public.admin_profiles;

SELECT
 count(*) FILTER (WHERE purpose='profile') AS existing_profile_assets,
 count(*) FILTER (WHERE purpose='profile' AND (media_kind<>'image' OR storage_bucket<>'media-library-private' OR visibility<>'admin')) AS invalid_profile_assets
FROM public.media_assets;

SELECT count(*) AS existing_admin_profile_avatar_usages
FROM public.media_asset_usages
WHERE entity_type='admin_profile' OR field_name='avatar';
