SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema='public' AND table_name IN ('media_assets','media_asset_usages') ORDER BY table_name, ordinal_position;
SELECT policyname, cmd, roles FROM pg_policies WHERE schemaname='public' AND tablename IN ('media_assets','media_asset_usages') ORDER BY tablename, policyname;
SELECT grantee, table_name, privilege_type FROM information_schema.role_table_grants WHERE table_schema='public' AND table_name IN ('media_assets','media_asset_usages') ORDER BY table_name, grantee, privilege_type;
SELECT id, public, file_size_limit, allowed_mime_types FROM storage.buckets WHERE id IN ('media-library-public','media-library-private') ORDER BY id;
SELECT has_table_privilege('authenticated','public.media_assets','INSERT') authenticated_asset_insert, has_table_privilege('authenticated','public.media_assets','UPDATE') authenticated_asset_update, has_table_privilege('authenticated','public.media_assets','DELETE') authenticated_asset_delete;
SELECT count(*) invalid_public_bucket_rows FROM public.media_assets WHERE (visibility='public') IS DISTINCT FROM (storage_bucket='media-library-public');
SELECT count(*) dangling_usages FROM public.media_asset_usages u LEFT JOIN public.media_assets a ON a.id=u.media_asset_id WHERE a.id IS NULL;
