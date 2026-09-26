-- B15 results module rollback. MANUAL EXECUTION ONLY and only before productive use.
BEGIN;

DO $guard$
BEGIN
  IF to_regclass('public.club_results') IS NULL THEN RAISE EXCEPTION 'public.club_results is missing'; END IF;
  IF (SELECT count(*) FROM public.club_results) <> 0 THEN RAISE EXCEPTION 'Rollback refused: club_results contains data'; END IF;
  IF EXISTS(SELECT 1 FROM public.media_assets WHERE purpose='result')
     OR EXISTS(SELECT 1 FROM public.media_asset_usages WHERE entity_type='result' OR field_name='opponent_logo') THEN
    RAISE EXCEPTION 'Rollback refused: result media data exists';
  END IF;
  IF (SELECT count(*) FROM public.admin_permissions WHERE key LIKE 'results.%') <> 5
     OR EXISTS(SELECT 1 FROM public.admin_permissions WHERE key LIKE 'results.%'
       AND key NOT IN('results.view','results.create','results.edit','results.delete','results.publish')) THEN
    RAISE EXCEPTION 'Rollback refused: results permission registry differs from proposal';
  END IF;
  IF EXISTS(
    SELECT 1 FROM public.admin_role_permissions link
    JOIN public.admin_permissions permission_row ON permission_row.id=link.permission_id
    JOIN public.admin_roles role_row ON role_row.id=link.role_id
    WHERE permission_row.key LIKE 'results.%'
      AND role_row.key NOT IN('superadmin','webmaster','fussball-vorstand','tischtennis-vorstand')
  ) THEN RAISE EXCEPTION 'Rollback refused: results permissions are used by another role'; END IF;
  IF (SELECT count(*) FROM public.admin_role_permissions link JOIN public.admin_permissions permission_row ON permission_row.id=link.permission_id
      WHERE permission_row.key LIKE 'results.%') <> 20 THEN
    RAISE EXCEPTION 'Rollback refused: expected results role mappings are incomplete or changed';
  END IF;
  IF pg_get_functiondef('public.synchronize_media_assignment(text,uuid,uuid,text)'::regprocedure) NOT ILIKE ALL(ARRAY['%club_results%','%opponent_logo%']) THEN
    RAISE EXCEPTION 'Rollback refused: media synchronization contract differs from proposal';
  END IF;
END;
$guard$;

DELETE FROM public.admin_role_permissions link USING public.admin_permissions permission_row
WHERE link.permission_id=permission_row.id AND permission_row.key IN('results.view','results.create','results.edit','results.delete','results.publish');
DELETE FROM public.admin_permissions WHERE key IN('results.view','results.create','results.edit','results.delete','results.publish');

-- Restore the immediately preceding B15.24I media synchronization contract.
CREATE OR REPLACE FUNCTION public.synchronize_media_assignment(p_entity_type text,p_entity_id uuid,p_media_asset_id uuid,p_field_name text DEFAULT 'image')
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $fn$
DECLARE v_asset public.media_assets%ROWTYPE; v_expected_media_kind text;
BEGIN
  IF NOT ((p_field_name='image' AND p_entity_type IN('coach','player','board_member','club_contact','team','team_season','news','event','sponsor','club_history','department_section')) OR
    (p_field_name='contact_image' AND p_entity_type IN('team','team_season')) OR (p_field_name='file' AND p_entity_type IN('news_document','event_document','download')) OR
    (p_field_name='avatar' AND p_entity_type='admin_profile')) THEN RAISE EXCEPTION 'Unsupported media assignment target'; END IF;
  v_expected_media_kind:=CASE WHEN p_field_name='file' THEN 'document' ELSE 'image' END;
  IF p_media_asset_id IS NOT NULL THEN SELECT * INTO v_asset FROM public.media_assets WHERE id=p_media_asset_id FOR SHARE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Media asset was not found'; END IF;
    IF v_asset.is_archived OR v_asset.media_kind<>v_expected_media_kind THEN RAISE EXCEPTION 'Media asset is not assignable'; END IF;
    IF p_entity_type='download' AND (v_asset.mime_type<>'application/pdf' OR v_asset.storage_bucket<>'media-library-private' OR v_asset.visibility NOT IN('admin','restricted') OR v_asset.purpose<>'download') THEN RAISE EXCEPTION 'Invalid download asset'; END IF;
    IF p_entity_type='admin_profile' AND (v_asset.storage_bucket<>'media-library-private' OR v_asset.visibility<>'admin' OR v_asset.purpose<>'profile') THEN RAISE EXCEPTION 'Invalid profile asset'; END IF;
    IF p_entity_type='department_section' AND v_asset.visibility<>'public' THEN RAISE EXCEPTION 'Department section images must be public'; END IF;
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
  ELSIF p_entity_type='admin_profile' AND p_field_name='avatar' THEN UPDATE public.admin_profiles SET profile_image_media_asset_id=p_media_asset_id,updated_at=now() WHERE id=p_entity_id;
  ELSIF p_entity_type='department_section' AND p_field_name='image' THEN UPDATE public.department_sections SET image_media_asset_id=p_media_asset_id WHERE id=p_entity_id;
  END IF;
  IF NOT FOUND THEN RAISE EXCEPTION 'Media assignment entity not found'; END IF;
  DELETE FROM public.media_asset_usages WHERE entity_type=p_entity_type AND entity_id=p_entity_id AND field_name=p_field_name;
  IF p_media_asset_id IS NOT NULL THEN INSERT INTO public.media_asset_usages(media_asset_id,entity_type,entity_id,field_name) VALUES(p_media_asset_id,p_entity_type,p_entity_id,p_field_name); END IF;
  RETURN p_media_asset_id;
END;
$fn$;
REVOKE ALL ON FUNCTION public.synchronize_media_assignment(text,uuid,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.synchronize_media_assignment(text,uuid,uuid,text) TO service_role;

DROP TABLE public.club_results;
DROP FUNCTION public.cleanup_club_result_media_usage();
DROP FUNCTION public.normalize_club_result();

ALTER TABLE public.media_assets DROP CONSTRAINT media_assets_purpose_check;
ALTER TABLE public.media_assets ADD CONSTRAINT media_assets_purpose_check CHECK(purpose IN('player','coach','board','team','news','cms','club_history','sponsor','event','document','download','system','profile'));
ALTER TABLE public.media_assets DROP CONSTRAINT media_assets_storage_path_check;
ALTER TABLE public.media_assets ADD CONSTRAINT media_assets_storage_path_check CHECK(storage_path ~ '^((images|documents)/(player|coach|board|team|news|cms|club_history|sponsor|event|document|download|system)/[0-9a-f-]+\.(jpg|png|webp|pdf)|images/profile/[0-9a-f-]+\.(jpg|png|webp))$');
ALTER TABLE public.media_asset_usages DROP CONSTRAINT media_asset_usages_entity_type_check;
ALTER TABLE public.media_asset_usages ADD CONSTRAINT media_asset_usages_entity_type_check CHECK(entity_type IN('player','coach','board_member','club_contact','team','team_season','news','news_document','event','event_document','page','club_history','sponsor','document','download','system','admin_profile','department_section'));

COMMIT;
