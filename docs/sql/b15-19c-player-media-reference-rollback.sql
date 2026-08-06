-- B15.19C rollback proposal only. Do not execute automatically. Does not delete media files.
BEGIN;
DROP FUNCTION IF EXISTS public.synchronize_media_assignment(text, uuid, uuid, text);
DROP INDEX IF EXISTS public.players_image_media_asset_idx;
ALTER TABLE public.players DROP COLUMN IF EXISTS image_media_asset_id;
COMMIT;
