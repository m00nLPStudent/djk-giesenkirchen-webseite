-- B15.23A read-only live inventory. Execute manually in Supabase SQL Editor.
-- Outputs structural metadata and aggregate counts only; no personal values.

SELECT n.nspname AS schema_name, c.relname AS table_name, c.relrowsecurity, c.relforcerowsecurity,
       pg_get_userbyid(c.relowner) AS owner
FROM pg_catalog.pg_class c
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'r'
  AND ((n.nspname = 'public' AND c.relname IN ('admin_profiles','admin_roles','admin_user_roles','admin_permissions','admin_role_permissions','coaches','board_members','club_contacts','media_assets','media_asset_usages','notifications','notification_deliveries','membership_request_recipients'))
    OR (n.nspname = 'auth' AND c.relname = 'users'))
ORDER BY n.nspname, c.relname;

SELECT table_schema, table_name, ordinal_position, column_name, data_type, udt_name, is_nullable, column_default
FROM information_schema.columns
WHERE (table_schema = 'public' AND table_name IN ('admin_profiles','admin_roles','admin_user_roles','coaches','board_members','club_contacts','media_assets','media_asset_usages','notifications','notification_deliveries','membership_request_recipients'))
   OR (table_schema = 'auth' AND table_name = 'users')
ORDER BY table_schema, table_name, ordinal_position;

SELECT n.nspname AS schema_name, c.relname AS table_name, con.conname, con.contype,
       pg_catalog.pg_get_constraintdef(con.oid, true) AS definition
FROM pg_catalog.pg_constraint con
JOIN pg_catalog.pg_class c ON c.oid = con.conrelid
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE (n.nspname = 'public' AND c.relname IN ('admin_profiles','admin_user_roles','coaches','board_members','club_contacts','media_assets','media_asset_usages','notifications','notification_deliveries'))
   OR (n.nspname = 'auth' AND c.relname = 'users')
ORDER BY n.nspname, c.relname, con.conname;

SELECT schemaname, tablename, indexname, indexdef
FROM pg_catalog.pg_indexes
WHERE (schemaname = 'public' AND tablename IN ('admin_profiles','admin_user_roles','coaches','board_members','club_contacts','media_assets','media_asset_usages','notifications','notification_deliveries'))
   OR (schemaname = 'auth' AND tablename = 'users')
ORDER BY schemaname, tablename, indexname;

SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_catalog.pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('admin_profiles','admin_user_roles','coaches','board_members','club_contacts','media_assets','media_asset_usages','notifications','notification_deliveries')
ORDER BY tablename, policyname;

SELECT grantee, table_schema, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN ('admin_profiles','admin_user_roles','coaches','board_members','club_contacts','media_assets','media_asset_usages','notifications','notification_deliveries')
  AND grantee IN ('anon','authenticated','service_role')
ORDER BY table_name, grantee, privilege_type;

SELECT grantee, table_schema, table_name, column_name, privilege_type
FROM information_schema.role_column_grants
WHERE table_schema = 'public'
  AND table_name IN ('admin_profiles','admin_user_roles','coaches','board_members','club_contacts','media_assets','media_asset_usages','notifications','notification_deliveries')
  AND grantee IN ('anon','authenticated','service_role')
ORDER BY table_name, grantee, column_name, privilege_type;

SELECT event_object_schema, event_object_table, trigger_name, action_timing, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table IN ('admin_profiles','admin_user_roles','coaches','board_members','club_contacts','media_assets','media_asset_usages','notifications','notification_deliveries')
ORDER BY event_object_table, trigger_name, event_manipulation;

SELECT
  (SELECT count(*) FROM auth.users) AS auth_users,
  (SELECT count(*) FROM public.admin_profiles) AS admin_profiles,
  (SELECT count(*) FROM public.admin_profiles p JOIN auth.users u ON u.id = p.id) AS profile_auth_id_matches,
  (SELECT count(*) FROM public.admin_profiles p LEFT JOIN auth.users u ON u.id = p.id WHERE u.id IS NULL) AS profiles_without_auth_id,
  (SELECT count(*) FROM auth.users u LEFT JOIN public.admin_profiles p ON p.id = u.id WHERE p.id IS NULL) AS auth_users_without_profile_id,
  (SELECT count(*) FROM public.admin_profiles p JOIN auth.users u ON u.id = p.id WHERE lower(btrim(coalesce(p.email,''))) IS DISTINCT FROM lower(btrim(coalesce(u.email,'')))) AS id_matched_email_mismatches,
  (SELECT count(*) FROM public.admin_profiles p JOIN auth.users u ON lower(btrim(p.email)) = lower(btrim(u.email)) WHERE p.id <> u.id) AS email_matches_with_different_ids;

SELECT
  (SELECT count(*) FROM (SELECT lower(btrim(email)) FROM auth.users WHERE email IS NOT NULL GROUP BY 1 HAVING count(*) > 1) d) AS duplicate_auth_emails,
  (SELECT count(*) FROM (SELECT lower(btrim(email)) FROM public.admin_profiles WHERE email IS NOT NULL GROUP BY 1 HAVING count(*) > 1) d) AS duplicate_admin_profile_emails,
  (SELECT count(*) FROM (SELECT lower(btrim(email)) FROM public.coaches WHERE email IS NOT NULL GROUP BY 1 HAVING count(*) > 1) d) AS duplicate_coach_emails,
  (SELECT count(*) FROM (SELECT lower(btrim(email)) FROM public.board_members WHERE email IS NOT NULL GROUP BY 1 HAVING count(*) > 1) d) AS duplicate_board_emails,
  (SELECT count(*) FROM (SELECT lower(btrim(email)) FROM public.club_contacts WHERE email IS NOT NULL GROUP BY 1 HAVING count(*) > 1) d) AS duplicate_contact_emails;

SELECT
  (SELECT count(*) FROM public.coaches) AS coaches_total,
  (SELECT count(*) FROM public.coaches WHERE admin_profile_id IS NOT NULL) AS coaches_linked,
  (SELECT count(*) FROM public.coaches c LEFT JOIN public.admin_profiles p ON p.id = c.admin_profile_id WHERE c.admin_profile_id IS NOT NULL AND p.id IS NULL) AS coach_orphan_links,
  (SELECT count(*) FROM public.board_members) AS board_total,
  (SELECT count(*) FROM public.board_members WHERE admin_profile_id IS NOT NULL) AS board_linked,
  (SELECT count(*) FROM public.board_members b LEFT JOIN public.admin_profiles p ON p.id = b.admin_profile_id WHERE b.admin_profile_id IS NOT NULL AND p.id IS NULL) AS board_orphan_links,
  (SELECT count(*) FROM (SELECT admin_profile_id FROM public.coaches WHERE admin_profile_id IS NOT NULL GROUP BY admin_profile_id HAVING count(*) > 1) d) AS profiles_with_multiple_coach_rows,
  (SELECT count(*) FROM (SELECT admin_profile_id FROM public.board_members WHERE admin_profile_id IS NOT NULL GROUP BY admin_profile_id HAVING count(*) > 1) d) AS profiles_with_multiple_board_rows;

SELECT
  (SELECT count(*) FROM public.coaches c JOIN public.admin_profiles p ON p.id = c.admin_profile_id WHERE c.email IS NOT NULL AND p.email IS NOT NULL AND lower(btrim(c.email)) <> lower(btrim(p.email))) AS linked_coach_profile_email_differences,
  (SELECT count(*) FROM public.board_members b JOIN public.admin_profiles p ON p.id = b.admin_profile_id WHERE b.email IS NOT NULL AND p.email IS NOT NULL AND lower(btrim(b.email)) <> lower(btrim(p.email))) AS linked_board_profile_email_differences,
  (SELECT count(*) FROM public.coaches c JOIN public.admin_profiles p ON p.id = c.admin_profile_id WHERE concat_ws(' ',c.first_name,c.last_name) <> coalesce(p.full_name,'')) AS linked_coach_profile_name_differences,
  (SELECT count(*) FROM public.board_members b JOIN public.admin_profiles p ON p.id = b.admin_profile_id WHERE concat_ws(' ',b.first_name,b.last_name) <> coalesce(p.full_name,'')) AS linked_board_profile_name_differences;

SELECT
  (SELECT count(*) FROM public.coaches WHERE image_media_asset_id IS NOT NULL) AS coach_media_references,
  (SELECT count(*) FROM public.board_members WHERE image_media_asset_id IS NOT NULL) AS board_media_references,
  (SELECT count(*) FROM public.media_asset_usages WHERE entity_type = 'coach' AND field_name = 'image') AS coach_image_usages,
  (SELECT count(*) FROM public.media_asset_usages WHERE entity_type = 'board_member' AND field_name = 'image') AS board_image_usages,
  (SELECT count(*) FROM public.coaches c LEFT JOIN public.media_asset_usages u ON u.entity_type='coach' AND u.entity_id=c.id AND u.field_name='image' AND u.media_asset_id=c.image_media_asset_id WHERE c.image_media_asset_id IS NOT NULL AND u.id IS NULL) AS coach_missing_usages,
  (SELECT count(*) FROM public.board_members b LEFT JOIN public.media_asset_usages u ON u.entity_type='board_member' AND u.entity_id=b.id AND u.field_name='image' AND u.media_asset_id=b.image_media_asset_id WHERE b.image_media_asset_id IS NOT NULL AND u.id IS NULL) AS board_missing_usages;

SELECT r.key AS role_key, r.is_active, count(ur.user_id) AS assigned_profiles
FROM public.admin_roles r
LEFT JOIN public.admin_user_roles ur ON ur.role_id = r.id
GROUP BY r.id, r.key, r.is_active
ORDER BY r.key;
