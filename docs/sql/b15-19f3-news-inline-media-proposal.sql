-- B15.19F3 proposal only. Do not execute automatically. No backfill/content mutation.
BEGIN;

CREATE OR REPLACE FUNCTION public.synchronize_news_content_media_usages(
  p_news_id uuid,
  p_media_asset_ids uuid[] DEFAULT '{}'::uuid[]
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  v_ids uuid[];
  v_count integer;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.news WHERE id = p_news_id) THEN
    RAISE EXCEPTION 'News not found';
  END IF;

  SELECT COALESCE(array_agg(DISTINCT id), '{}'::uuid[]) INTO v_ids
  FROM unnest(COALESCE(p_media_asset_ids, '{}'::uuid[])) AS ids(id);

  IF EXISTS (
    SELECT 1 FROM unnest(v_ids) AS requested(id)
    LEFT JOIN public.media_assets asset ON asset.id = requested.id
    WHERE asset.id IS NULL OR asset.is_archived OR asset.media_kind <> 'image'
      OR asset.visibility <> 'public' OR asset.storage_bucket <> 'media-library-public'
  ) THEN
    RAISE EXCEPTION 'Inline media asset is not a public active image';
  END IF;

  DELETE FROM public.media_asset_usages usage
  WHERE usage.entity_type = 'news' AND usage.entity_id = p_news_id
    AND usage.field_name = 'content' AND NOT (usage.media_asset_id = ANY(v_ids));

  INSERT INTO public.media_asset_usages(media_asset_id,entity_type,entity_id,field_name)
  SELECT id,'news',p_news_id,'content' FROM unnest(v_ids) AS ids(id)
  ON CONFLICT (media_asset_id,entity_type,entity_id,field_name) DO NOTHING;

  SELECT count(*) INTO v_count FROM public.media_asset_usages
  WHERE entity_type='news' AND entity_id=p_news_id AND field_name='content';
  RETURN v_count;
END;
$fn$;

REVOKE ALL ON FUNCTION public.synchronize_news_content_media_usages(uuid,uuid[]) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.synchronize_news_content_media_usages(uuid,uuid[]) TO service_role;

CREATE OR REPLACE FUNCTION public.cleanup_news_media_usage() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $cleanup$
BEGIN
  DELETE FROM public.media_asset_usages
  WHERE entity_type='news' AND entity_id=OLD.id AND field_name IN ('image','content');
  RETURN OLD;
END;
$cleanup$;
REVOKE ALL ON FUNCTION public.cleanup_news_media_usage() FROM PUBLIC,anon,authenticated;

COMMIT;
