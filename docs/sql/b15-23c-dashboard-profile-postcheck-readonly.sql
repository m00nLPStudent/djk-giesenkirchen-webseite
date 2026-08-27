-- B15.23C read-only postcheck. Execute manually after the proposal.

SELECT column_name,data_type,is_nullable,column_default FROM information_schema.columns
WHERE table_schema='public' AND table_name='admin_profiles'
  AND column_name IN ('nickname','phone','profile_image_media_asset_id') ORDER BY column_name;

SELECT con.conname,con.contype,pg_get_constraintdef(con.oid,true) AS definition
FROM pg_constraint con WHERE con.conrelid='public.admin_profiles'::regclass
  AND con.conname IN ('admin_profiles_nickname_check','admin_profiles_phone_check','admin_profiles_profile_image_media_asset_id_fkey')
ORDER BY con.conname;

SELECT indexname,indexdef FROM pg_indexes WHERE schemaname='public' AND tablename='admin_profiles'
  AND indexname='admin_profiles_profile_image_media_asset_idx';

SELECT tablename,policyname,roles,cmd,qual,with_check FROM pg_policies
WHERE schemaname='public' AND tablename='admin_profiles' ORDER BY policyname;

SELECT p.oid::regprocedure::text AS signature,p.prosecdef,p.proconfig,pg_get_userbyid(p.proowner) AS owner,p.proacl,
       pg_get_functiondef(p.oid) AS definition
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND p.prokind IN ('f','p') AND p.oid IN (
  to_regprocedure('public.update_own_dashboard_profile(text,text)'),
  to_regprocedure('public.touch_own_admin_profile_last_login()'),
  to_regprocedure('public.synchronize_media_assignment(text,uuid,uuid,text)'),
  to_regprocedure('public.cleanup_admin_profile_media_usage()')
) ORDER BY p.oid::regprocedure::text;

SELECT
 has_function_privilege('anon','public.update_own_dashboard_profile(text,text)','EXECUTE') AS anon_profile_update,
 has_function_privilege('authenticated','public.update_own_dashboard_profile(text,text)','EXECUTE') AS authenticated_profile_update,
 has_function_privilege('anon','public.touch_own_admin_profile_last_login()','EXECUTE') AS anon_last_login,
 has_function_privilege('authenticated','public.touch_own_admin_profile_last_login()','EXECUTE') AS authenticated_last_login,
 has_function_privilege('anon','public.synchronize_media_assignment(text,uuid,uuid,text)','EXECUTE') AS anon_media_sync,
 has_function_privilege('authenticated','public.synchronize_media_assignment(text,uuid,uuid,text)','EXECUTE') AS authenticated_media_sync,
 has_function_privilege('service_role','public.synchronize_media_assignment(text,uuid,uuid,text)','EXECUTE') AS service_media_sync;

SELECT c.relname AS table_name,con.conname,pg_get_constraintdef(con.oid,true) AS definition
FROM pg_constraint con JOIN pg_class c ON c.oid=con.conrelid
WHERE con.contype='c' AND ((con.conrelid='public.media_assets'::regclass AND pg_get_constraintdef(con.oid) ILIKE '%purpose%')
 OR (con.conrelid='public.media_asset_usages'::regclass AND pg_get_constraintdef(con.oid) ILIKE '%entity_type%'))
ORDER BY c.relname,con.conname;

SELECT conname,pg_get_constraintdef(oid,true) AS definition
FROM pg_constraint
WHERE conrelid='public.media_assets'::regclass
  AND conname='media_assets_storage_path_check';

SELECT event_object_table,trigger_name,action_timing,event_manipulation,action_statement
FROM information_schema.triggers WHERE event_object_schema='public' AND event_object_table='admin_profiles'
ORDER BY trigger_name,event_manipulation;

SELECT tablename,policyname,roles,cmd,qual,with_check
FROM pg_policies
WHERE schemaname='public' AND tablename IN ('media_assets','media_asset_usages')
ORDER BY tablename,policyname;

SELECT
 count(*) FILTER (WHERE nickname IS NOT NULL) AS nicknames_set,
 count(*) FILTER (WHERE phone IS NOT NULL) AS phones_set,
 count(*) FILTER (WHERE profile_image_media_asset_id IS NOT NULL) AS avatars_set
FROM public.admin_profiles;

SELECT count(*) AS profile_rows FROM public.admin_profiles;

SELECT
 (SELECT count(*) FROM public.media_assets WHERE purpose='profile') AS profile_assets,
 (SELECT count(*) FROM public.media_asset_usages WHERE entity_type='admin_profile' AND field_name='avatar') AS profile_avatar_usages,
 (SELECT count(*) FROM public.admin_profiles p LEFT JOIN public.media_asset_usages u
   ON u.entity_type='admin_profile' AND u.entity_id=p.id AND u.field_name='avatar' AND u.media_asset_id=p.profile_image_media_asset_id
   WHERE p.profile_image_media_asset_id IS NOT NULL AND u.id IS NULL) AS profile_references_without_usage;
