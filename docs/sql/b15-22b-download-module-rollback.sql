-- B15.22B guarded rollback. MANUAL EXECUTION ONLY.
-- Never deletes media assets, storage objects, categories or non-download usages.
BEGIN;

DO $guard$
BEGIN
  IF to_regclass('public.downloads') IS NOT NULL AND EXISTS(SELECT 1 FROM public.downloads) THEN
    RAISE EXCEPTION 'B15.22B rollback refused: download rows still exist';
  END IF;
  IF EXISTS(SELECT 1 FROM public.media_asset_usages WHERE entity_type='download' AND field_name='file') THEN
    RAISE EXCEPTION 'B15.22B rollback refused: download/file usages still exist';
  END IF;
END;
$guard$;

DROP TRIGGER IF EXISTS download_cleanup_media_usage ON public.downloads;
DROP TRIGGER IF EXISTS downloads_enforce_publish_permission ON public.downloads;
DROP TRIGGER IF EXISTS downloads_normalize_publication ON public.downloads;
DROP TRIGGER IF EXISTS downloads_set_updated_at ON public.downloads;
DROP FUNCTION IF EXISTS public.cleanup_download_media_usage();
DROP FUNCTION IF EXISTS public.enforce_download_publish_permission();
DROP FUNCTION IF EXISTS public.normalize_download_publication_state();
DROP TABLE IF EXISTS public.downloads;

CREATE OR REPLACE FUNCTION public.synchronize_media_assignment(p_entity_type text,p_entity_id uuid,p_media_asset_id uuid,p_field_name text DEFAULT 'image')
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $fn$
DECLARE v_asset public.media_assets%ROWTYPE; v_expected_media_kind text;
BEGIN
  IF NOT (
    (p_field_name='image' AND p_entity_type IN('coach','player','board_member','club_contact','team','team_season','news','event','sponsor','club_history')) OR
    (p_field_name='contact_image' AND p_entity_type IN('team','team_season')) OR
    (p_field_name='file' AND p_entity_type IN('news_document','event_document'))
  ) THEN RAISE EXCEPTION 'Unsupported media assignment target'; END IF;
  v_expected_media_kind:=CASE WHEN p_field_name='file' THEN 'document' ELSE 'image' END;
  IF p_media_asset_id IS NOT NULL THEN SELECT * INTO v_asset FROM public.media_assets WHERE id=p_media_asset_id; IF NOT FOUND THEN RAISE EXCEPTION 'Media asset was not found'; END IF; IF v_asset.is_archived THEN RAISE EXCEPTION 'Archived media asset is not assignable'; END IF; IF v_asset.media_kind<>v_expected_media_kind THEN RAISE EXCEPTION 'Media asset is not assignable to %/%',p_entity_type,p_field_name; END IF; END IF;
  IF p_entity_type='coach' THEN UPDATE public.coaches SET image_media_asset_id=p_media_asset_id WHERE id=p_entity_id;
  ELSIF p_entity_type='player' THEN UPDATE public.players SET image_media_asset_id=p_media_asset_id WHERE id=p_entity_id;
  ELSIF p_entity_type='board_member' THEN UPDATE public.board_members SET image_media_asset_id=p_media_asset_id WHERE id=p_entity_id;
  ELSIF p_entity_type='club_contact' THEN UPDATE public.club_contacts SET image_media_asset_id=p_media_asset_id WHERE id=p_entity_id;
  ELSIF p_entity_type='team' AND p_field_name='image' THEN UPDATE public.teams SET team_image_media_asset_id=p_media_asset_id WHERE id=p_entity_id;
  ELSIF p_entity_type='team_season' AND p_field_name='image' THEN UPDATE public.team_seasons SET team_image_media_asset_id=p_media_asset_id WHERE id=p_entity_id;
  ELSIF p_entity_type='team' AND p_field_name='contact_image' THEN UPDATE public.teams SET contact_image_media_asset_id=p_media_asset_id WHERE id=p_entity_id;
  ELSIF p_entity_type='team_season' AND p_field_name='contact_image' THEN UPDATE public.team_seasons SET contact_image_media_asset_id=p_media_asset_id WHERE id=p_entity_id;
  ELSIF p_entity_type='news' THEN UPDATE public.news SET image_media_asset_id=p_media_asset_id WHERE id=p_entity_id;
  ELSIF p_entity_type='news_document' THEN UPDATE public.news_documents SET media_asset_id=p_media_asset_id WHERE id=p_entity_id;
  ELSIF p_entity_type='event' THEN UPDATE public.events SET image_media_asset_id=p_media_asset_id WHERE id=p_entity_id;
  ELSIF p_entity_type='event_document' THEN UPDATE public.event_documents SET media_asset_id=p_media_asset_id WHERE id=p_entity_id;
  ELSIF p_entity_type='sponsor' THEN UPDATE public.sponsors SET image_media_asset_id=p_media_asset_id WHERE id=p_entity_id;
  ELSIF p_entity_type='club_history' THEN UPDATE public.club_history_images SET media_asset_id=p_media_asset_id WHERE id=p_entity_id;
  END IF;
  IF NOT FOUND THEN RAISE EXCEPTION 'Media assignment entity not found'; END IF;
  DELETE FROM public.media_asset_usages WHERE entity_type=p_entity_type AND entity_id=p_entity_id AND field_name=p_field_name;
  IF p_media_asset_id IS NOT NULL THEN INSERT INTO public.media_asset_usages(media_asset_id,entity_type,entity_id,field_name) VALUES(p_media_asset_id,p_entity_type,p_entity_id,p_field_name); END IF;
  RETURN p_media_asset_id;
END;
$fn$;
REVOKE ALL ON FUNCTION public.synchronize_media_assignment(text,uuid,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.synchronize_media_assignment(text,uuid,uuid,text) TO service_role;

DELETE FROM public.admin_role_permissions rp USING public.admin_permissions p
WHERE rp.permission_id=p.id AND p.key IN('downloads.view','downloads.create','downloads.edit','downloads.delete','downloads.publish');
DELETE FROM public.admin_permissions
WHERE key IN('downloads.view','downloads.create','downloads.edit','downloads.delete','downloads.publish');

COMMIT;
