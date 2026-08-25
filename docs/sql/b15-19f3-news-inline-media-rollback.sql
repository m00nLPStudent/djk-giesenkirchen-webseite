-- B15.19F3 rollback only. Restores the exact F2 cleanup behavior.
BEGIN;
DROP FUNCTION IF EXISTS public.synchronize_news_content_media_usages(uuid,uuid[]);
DELETE FROM public.media_asset_usages WHERE entity_type='news' AND field_name='content';
CREATE OR REPLACE FUNCTION public.cleanup_news_media_usage() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $cleanup$
BEGIN
  DELETE FROM public.media_asset_usages WHERE entity_type='news' AND entity_id=OLD.id AND field_name='image';
  RETURN OLD;
END;
$cleanup$;
REVOKE ALL ON FUNCTION public.cleanup_news_media_usage() FROM PUBLIC,anon,authenticated;
COMMIT;
