-- B15.19D2 proposal only. Do not execute automatically. No data migration.
-- Purpose remains the immutable upload/organization context; usages model actual assignments.
BEGIN;
CREATE OR REPLACE FUNCTION public.synchronize_media_assignment(
  p_entity_type text, p_entity_id uuid, p_media_asset_id uuid, p_field_name text DEFAULT 'image'
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $function$
DECLARE v_asset public.media_assets%ROWTYPE;
BEGIN
  IF p_entity_type NOT IN ('coach', 'player', 'board_member', 'club_contact') OR p_field_name <> 'image' THEN
    RAISE EXCEPTION 'Unsupported media assignment target';
  END IF;
  IF p_media_asset_id IS NOT NULL THEN
    SELECT * INTO v_asset FROM public.media_assets WHERE id = p_media_asset_id;
    IF NOT FOUND OR v_asset.is_archived OR v_asset.media_kind <> 'image' THEN
      RAISE EXCEPTION 'Media asset is not assignable to %', p_entity_type;
    END IF;
  END IF;
  IF p_entity_type = 'coach' THEN
    UPDATE public.coaches SET image_media_asset_id = p_media_asset_id WHERE id = p_entity_id;
  ELSIF p_entity_type = 'player' THEN
    UPDATE public.players SET image_media_asset_id = p_media_asset_id WHERE id = p_entity_id;
  ELSIF p_entity_type = 'board_member' THEN
    UPDATE public.board_members SET image_media_asset_id = p_media_asset_id WHERE id = p_entity_id;
  ELSE
    UPDATE public.club_contacts SET image_media_asset_id = p_media_asset_id WHERE id = p_entity_id;
  END IF;
  IF NOT FOUND THEN RAISE EXCEPTION 'Media assignment entity not found'; END IF;
  DELETE FROM public.media_asset_usages WHERE entity_type = p_entity_type AND entity_id = p_entity_id AND field_name = p_field_name;
  IF p_media_asset_id IS NOT NULL THEN
    INSERT INTO public.media_asset_usages(media_asset_id, entity_type, entity_id, field_name)
    VALUES (p_media_asset_id, p_entity_type, p_entity_id, p_field_name);
  END IF;
  RETURN p_media_asset_id;
END;
$function$;
REVOKE ALL ON FUNCTION public.synchronize_media_assignment(text, uuid, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.synchronize_media_assignment(text, uuid, uuid, text) TO service_role;
COMMIT;
