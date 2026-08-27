-- B15.23C rollback. MANUAL EXECUTION ONLY before any profile data/media is used.
BEGIN;

DO $guard$
BEGIN
  IF to_regprocedure('public.update_own_dashboard_profile(text,text)') IS NULL
     OR to_regprocedure('public.touch_own_admin_profile_last_login()') IS NULL
     OR to_regprocedure('public.cleanup_admin_profile_media_usage()') IS NULL
     OR NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='admin_profiles' AND column_name='nickname')
     OR NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='admin_profiles' AND column_name='phone')
     OR NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='admin_profiles' AND column_name='profile_image_media_asset_id') THEN
    RAISE EXCEPTION 'B15.23C rollback aborted: expected proposal state missing';
  END IF;
  IF EXISTS (SELECT 1 FROM public.admin_profiles WHERE nickname IS NOT NULL OR phone IS NOT NULL OR profile_image_media_asset_id IS NOT NULL)
     OR EXISTS (SELECT 1 FROM public.media_assets WHERE purpose='profile')
     OR EXISTS (SELECT 1 FROM public.media_asset_usages WHERE entity_type='admin_profile' OR field_name='avatar') THEN
    RAISE EXCEPTION 'B15.23C rollback aborted: profile data/media exists; manual data-preserving plan required';
  END IF;
  IF has_function_privilege('anon','public.synchronize_media_assignment(text,uuid,uuid,text)','EXECUTE')
     OR has_function_privilege('authenticated','public.synchronize_media_assignment(text,uuid,uuid,text)','EXECUTE')
     OR NOT has_function_privilege('service_role','public.synchronize_media_assignment(text,uuid,uuid,text)','EXECUTE') THEN
    RAISE EXCEPTION 'B15.23C rollback aborted: media RPC grants changed';
  END IF;
END
$guard$;

DROP TRIGGER admin_profile_cleanup_media_usage ON public.admin_profiles;
DROP FUNCTION public.cleanup_admin_profile_media_usage();
DROP FUNCTION public.update_own_dashboard_profile(text,text);
DROP FUNCTION public.touch_own_admin_profile_last_login();

CREATE OR REPLACE FUNCTION public.synchronize_media_assignment(p_entity_type text,p_entity_id uuid,p_media_asset_id uuid,p_field_name text DEFAULT 'image')
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $fn$
DECLARE v_asset public.media_assets%ROWTYPE; v_expected_media_kind text;
BEGIN
  IF NOT (
    (p_field_name='image' AND p_entity_type IN('coach','player','board_member','club_contact','team','team_season','news','event','sponsor','club_history')) OR
    (p_field_name='contact_image' AND p_entity_type IN('team','team_season')) OR
    (p_field_name='file' AND p_entity_type IN('news_document','event_document','download'))
  ) THEN RAISE EXCEPTION 'Unsupported media assignment target'; END IF;
  v_expected_media_kind:=CASE WHEN p_field_name='file' THEN 'document' ELSE 'image' END;
  IF p_media_asset_id IS NOT NULL THEN
    SELECT * INTO v_asset FROM public.media_assets WHERE id=p_media_asset_id FOR SHARE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Media asset was not found'; END IF;
    IF v_asset.is_archived THEN RAISE EXCEPTION 'Archived media asset is not assignable'; END IF;
    IF v_asset.media_kind<>v_expected_media_kind THEN RAISE EXCEPTION 'Media asset is not assignable to %/%',p_entity_type,p_field_name; END IF;
    IF p_entity_type='download' AND (v_asset.mime_type<>'application/pdf' OR v_asset.storage_bucket<>'media-library-private' OR v_asset.visibility NOT IN('admin','restricted') OR v_asset.purpose<>'download') THEN
      RAISE EXCEPTION 'Download files must be private PDF assets with purpose download';
    END IF;
  END IF;
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
  ELSIF p_entity_type='download' THEN UPDATE public.downloads SET media_asset_id=p_media_asset_id WHERE id=p_entity_id;
  END IF;
  IF NOT FOUND THEN RAISE EXCEPTION 'Media assignment entity not found'; END IF;
  DELETE FROM public.media_asset_usages WHERE entity_type=p_entity_type AND entity_id=p_entity_id AND field_name=p_field_name;
  IF p_media_asset_id IS NOT NULL THEN INSERT INTO public.media_asset_usages(media_asset_id,entity_type,entity_id,field_name) VALUES(p_media_asset_id,p_entity_type,p_entity_id,p_field_name); END IF;
  RETURN p_media_asset_id;
END
$fn$;
REVOKE ALL ON FUNCTION public.synchronize_media_assignment(text,uuid,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.synchronize_media_assignment(text,uuid,uuid,text) TO service_role;

ALTER TABLE public.media_assets DROP CONSTRAINT media_assets_purpose_check;
ALTER TABLE public.media_assets ADD CONSTRAINT media_assets_purpose_check CHECK (purpose IN (
  'player','coach','board','team','news','cms','club_history','sponsor','event','document','download','system'
));
ALTER TABLE public.media_assets DROP CONSTRAINT media_assets_storage_path_check;
ALTER TABLE public.media_assets ADD CONSTRAINT media_assets_storage_path_check CHECK (
  storage_path ~ '^(images|documents)/(player|coach|board|team|news|cms|club_history|sponsor|event|document|download|system)/[0-9a-f-]+\.(jpg|png|webp|pdf)$'
);
ALTER TABLE public.media_asset_usages DROP CONSTRAINT media_asset_usages_entity_type_check;
ALTER TABLE public.media_asset_usages ADD CONSTRAINT media_asset_usages_entity_type_check CHECK (entity_type IN (
  'player','coach','board_member','club_contact','team','team_season','news','news_document','event','event_document',
  'page','club_history','sponsor','document','download','system'
));

DROP INDEX public.admin_profiles_profile_image_media_asset_idx;
ALTER TABLE public.admin_profiles
  DROP CONSTRAINT admin_profiles_profile_image_media_asset_id_fkey,
  DROP CONSTRAINT admin_profiles_phone_check,
  DROP CONSTRAINT admin_profiles_nickname_check,
  DROP COLUMN profile_image_media_asset_id,
  DROP COLUMN phone,
  DROP COLUMN nickname;

CREATE POLICY admin_profiles_update_own_authenticated ON public.admin_profiles
FOR UPDATE TO authenticated USING (id=auth.uid()) WITH CHECK (id=auth.uid());

COMMIT;
