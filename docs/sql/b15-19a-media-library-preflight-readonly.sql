-- Read-only. Run before either B15.19A proposal.
SELECT to_regclass('public.media_assets') media_assets, to_regclass('public.media_asset_usages') media_asset_usages, to_regprocedure('public.set_updated_at()') updated_at_function;
SELECT id, name, public, file_size_limit, allowed_mime_types FROM storage.buckets ORDER BY id;
SELECT bucket_id, count(*) object_count, coalesce(sum((metadata->>'size')::bigint),0) bytes FROM storage.objects GROUP BY bucket_id ORDER BY bucket_id;
SELECT policyname, cmd, roles, qual, with_check FROM pg_policies WHERE schemaname='storage' AND tablename='objects' ORDER BY policyname;
SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND (column_name ~ '(image|photo|file|document|logo).*(url|path|name|size|type)' OR table_name IN ('news_documents','event_documents','club_history_images','download_categories')) ORDER BY table_name, ordinal_position;
