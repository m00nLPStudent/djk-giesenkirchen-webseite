-- B15.19B proposal only. Do not execute automatically. No data migration or file deletion.
BEGIN;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM public.media_asset_usages GROUP BY entity_type, entity_id, field_name HAVING count(*) > 1) THEN
    RAISE EXCEPTION 'Duplicate media usages exist; stop and review before B15.19B.';
  END IF;
END $$;
ALTER TABLE public.coaches
  ADD COLUMN image_media_asset_id uuid NULL REFERENCES public.media_assets(id) ON DELETE SET NULL;
CREATE INDEX coaches_image_media_asset_idx ON public.coaches (image_media_asset_id) WHERE image_media_asset_id IS NOT NULL;
CREATE UNIQUE INDEX media_asset_usages_one_field_per_entity
  ON public.media_asset_usages (entity_type, entity_id, field_name);
COMMIT;
