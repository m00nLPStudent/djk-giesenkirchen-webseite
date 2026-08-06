-- Proposal only. Removes links, never media rows or storage objects.
BEGIN;
DELETE FROM public.media_asset_usages WHERE entity_type='coach' AND field_name='image';
DROP INDEX IF EXISTS public.media_asset_usages_one_field_per_entity;
DROP INDEX IF EXISTS public.coaches_image_media_asset_idx;
ALTER TABLE public.coaches DROP COLUMN IF EXISTS image_media_asset_id;
COMMIT;
