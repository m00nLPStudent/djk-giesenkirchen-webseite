-- Proposal only. Refuses to delete non-empty buckets; storage objects are never removed automatically.
BEGIN;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id IN ('media-library-public','media-library-private')) THEN
    RAISE EXCEPTION 'Media library buckets are not empty; archive/export objects before rollback.';
  END IF;
END $$;
DROP TABLE IF EXISTS public.media_asset_usages;
DROP TABLE IF EXISTS public.media_assets;
DELETE FROM storage.buckets WHERE id IN ('media-library-public','media-library-private');
COMMIT;
