-- B15.19G2 proposal only. Do not execute automatically. No backfill or storage mutation.
BEGIN;

ALTER TABLE public.event_documents ADD COLUMN IF NOT EXISTS media_asset_id uuid NULL;
ALTER TABLE public.event_documents ALTER COLUMN file_path DROP NOT NULL;
ALTER TABLE public.event_documents ALTER COLUMN file_url DROP NOT NULL;

DO $fk$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.event_documents'::regclass AND conname='event_documents_media_asset_id_fkey') THEN
    ALTER TABLE public.event_documents ADD CONSTRAINT event_documents_media_asset_id_fkey FOREIGN KEY(media_asset_id) REFERENCES public.media_assets(id) ON DELETE SET NULL;
  END IF;
END;
$fk$;
CREATE INDEX IF NOT EXISTS event_documents_media_asset_idx ON public.event_documents(media_asset_id) WHERE media_asset_id IS NOT NULL;

DO $usage_check$
DECLARE v_constraint_name text;
BEGIN
  SELECT conname INTO v_constraint_name FROM pg_constraint
  WHERE conrelid='public.media_asset_usages'::regclass AND contype='c' AND pg_get_constraintdef(oid) ILIKE '%entity_type%' LIMIT 1;
  IF v_constraint_name IS NOT NULL THEN EXECUTE format('ALTER TABLE public.media_asset_usages DROP CONSTRAINT %I',v_constraint_name); END IF;
  ALTER TABLE public.media_asset_usages ADD CONSTRAINT media_asset_usages_entity_type_check CHECK(entity_type IN(
    'player','coach','board_member','club_contact','team','team_season','news','news_document','event','event_document','page','club_history','sponsor','document','download','system'
  ));
END;
$usage_check$;

CREATE OR REPLACE FUNCTION public.synchronize_media_assignment(p_entity_type text,p_entity_id uuid,p_media_asset_id uuid,p_field_name text DEFAULT 'image')
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $fn$
DECLARE v_asset public.media_assets%ROWTYPE; v_expected_media_kind text;
BEGIN
  IF NOT (
    (p_field_name='image' AND p_entity_type IN('coach','player','board_member','club_contact','team','team_season','news','event')) OR
    (p_field_name='contact_image' AND p_entity_type IN('team','team_season')) OR
    (p_field_name='file' AND p_entity_type IN('news_document','event_document'))
  ) THEN RAISE EXCEPTION 'Unsupported media assignment target'; END IF;
  v_expected_media_kind:=CASE WHEN p_field_name='file' THEN 'document' ELSE 'image' END;
  IF p_media_asset_id IS NOT NULL THEN
    SELECT * INTO v_asset FROM public.media_assets WHERE id=p_media_asset_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Media asset was not found'; END IF;
    IF v_asset.is_archived THEN RAISE EXCEPTION 'Archived media asset is not assignable'; END IF;
    IF v_asset.media_kind<>v_expected_media_kind THEN RAISE EXCEPTION 'Media asset is not assignable to %/%',p_entity_type,p_field_name; END IF;
  END IF;
  IF p_entity_type='coach' THEN UPDATE public.coaches SET image_media_asset_id=p_media_asset_id WHERE id=p_entity_id;
  ELSIF p_entity_type='player' THEN UPDATE public.players SET image_media_asset_id=p_media_asset_id WHERE id=p_entity_id;
  ELSIF p_entity_type='board_member' THEN UPDATE public.board_members SET image_media_asset_id=p_media_asset_id WHERE id=p_entity_id;
  ELSIF p_entity_type='club_contact' THEN UPDATE public.club_contacts SET image_media_asset_id=p_media_asset_id WHERE id=p_entity_id;
  ELSIF p_entity_type='team' AND p_field_name='image' THEN UPDATE public.teams SET team_image_media_asset_id=p_media_asset_id WHERE id=p_entity_id;
  ELSIF p_entity_type='team_season' AND p_field_name='image' THEN UPDATE public.team_seasons SET team_image_media_asset_id=p_media_asset_id WHERE id=p_entity_id;
  ELSIF p_entity_type='team' AND p_field_name='contact_image' THEN UPDATE public.teams SET contact_image_media_asset_id=p_media_asset_id WHERE id=p_entity_id;
  ELSIF p_entity_type='team_season' AND p_field_name='contact_image' THEN UPDATE public.team_seasons SET contact_image_media_asset_id=p_media_asset_id WHERE id=p_entity_id;
  ELSIF p_entity_type='news' AND p_field_name='image' THEN UPDATE public.news SET image_media_asset_id=p_media_asset_id WHERE id=p_entity_id;
  ELSIF p_entity_type='news_document' AND p_field_name='file' THEN UPDATE public.news_documents SET media_asset_id=p_media_asset_id WHERE id=p_entity_id;
  ELSIF p_entity_type='event' AND p_field_name='image' THEN UPDATE public.events SET image_media_asset_id=p_media_asset_id WHERE id=p_entity_id;
  ELSIF p_entity_type='event_document' AND p_field_name='file' THEN UPDATE public.event_documents SET media_asset_id=p_media_asset_id WHERE id=p_entity_id;
  END IF;
  IF NOT FOUND THEN RAISE EXCEPTION 'Media assignment entity not found'; END IF;
  DELETE FROM public.media_asset_usages WHERE entity_type=p_entity_type AND entity_id=p_entity_id AND field_name=p_field_name;
  IF p_media_asset_id IS NOT NULL THEN INSERT INTO public.media_asset_usages(media_asset_id,entity_type,entity_id,field_name) VALUES(p_media_asset_id,p_entity_type,p_entity_id,p_field_name); END IF;
  RETURN p_media_asset_id;
END;
$fn$;
REVOKE ALL ON FUNCTION public.synchronize_media_assignment(text,uuid,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.synchronize_media_assignment(text,uuid,uuid,text) TO service_role;

CREATE OR REPLACE FUNCTION public.cleanup_event_document_media_usage() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $cleanup$
BEGIN DELETE FROM public.media_asset_usages WHERE entity_type='event_document' AND entity_id=OLD.id AND field_name='file'; RETURN OLD; END;
$cleanup$;
REVOKE ALL ON FUNCTION public.cleanup_event_document_media_usage() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS event_document_cleanup_media_usage ON public.event_documents;
CREATE TRIGGER event_document_cleanup_media_usage AFTER DELETE ON public.event_documents FOR EACH ROW EXECUTE FUNCTION public.cleanup_event_document_media_usage();
COMMIT;
