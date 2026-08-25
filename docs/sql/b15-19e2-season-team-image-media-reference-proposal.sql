-- B15.19E2 proposal only. Do not execute automatically. No backfill or legacy mutation.
BEGIN;

ALTER TABLE public.team_seasons
  ADD COLUMN IF NOT EXISTS team_image_media_asset_id uuid NULL;

DO $b15_19e2_fk$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint constraint_row
    WHERE constraint_row.conrelid = 'public.team_seasons'::regclass
      AND constraint_row.confrelid = 'public.media_assets'::regclass
      AND constraint_row.contype = 'f'
      AND constraint_row.conkey = ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid = 'public.team_seasons'::regclass AND attname = 'team_image_media_asset_id')]
  ) THEN
    ALTER TABLE public.team_seasons
      ADD CONSTRAINT team_seasons_team_image_media_asset_id_fkey
      FOREIGN KEY (team_image_media_asset_id)
      REFERENCES public.media_assets(id)
      ON DELETE SET NULL;
  END IF;
END;
$b15_19e2_fk$;

CREATE INDEX IF NOT EXISTS team_seasons_team_image_media_asset_idx
  ON public.team_seasons(team_image_media_asset_id)
  WHERE team_image_media_asset_id IS NOT NULL;

DO $b15_19e2_usage_constraint$
DECLARE v_constraint_name text;
BEGIN
  SELECT constraint_row.conname INTO v_constraint_name
  FROM pg_constraint constraint_row
  JOIN pg_attribute attribute_row
    ON attribute_row.attrelid = constraint_row.conrelid
   AND attribute_row.attnum = ANY (constraint_row.conkey)
  WHERE constraint_row.conrelid = 'public.media_asset_usages'::regclass
    AND constraint_row.contype = 'c'
    AND attribute_row.attname = 'entity_type'
  LIMIT 1;
  IF v_constraint_name IS NULL OR pg_get_constraintdef((SELECT oid FROM pg_constraint WHERE conrelid = 'public.media_asset_usages'::regclass AND conname = v_constraint_name)) NOT LIKE '%team_season%' THEN
    IF v_constraint_name IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.media_asset_usages DROP CONSTRAINT %I', v_constraint_name);
    END IF;
    ALTER TABLE public.media_asset_usages
      ADD CONSTRAINT media_asset_usages_entity_type_check
      CHECK (entity_type IN (
        'player', 'coach', 'board_member', 'club_contact', 'team', 'team_season',
        'news', 'page', 'club_history', 'sponsor', 'event', 'document', 'download', 'system'
      ));
  END IF;
END;
$b15_19e2_usage_constraint$;

CREATE OR REPLACE FUNCTION public.synchronize_media_assignment(
  p_entity_type text, p_entity_id uuid, p_media_asset_id uuid, p_field_name text DEFAULT 'image'
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $function$
DECLARE v_asset public.media_assets%ROWTYPE;
BEGIN
  IF p_entity_type NOT IN ('coach', 'player', 'board_member', 'club_contact', 'team', 'team_season')
     OR p_field_name <> 'image' THEN
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
  ELSIF p_entity_type = 'club_contact' THEN
    UPDATE public.club_contacts SET image_media_asset_id = p_media_asset_id WHERE id = p_entity_id;
  ELSIF p_entity_type = 'team' THEN
    UPDATE public.teams SET team_image_media_asset_id = p_media_asset_id WHERE id = p_entity_id;
  ELSE
    UPDATE public.team_seasons SET team_image_media_asset_id = p_media_asset_id WHERE id = p_entity_id;
  END IF;
  IF NOT FOUND THEN RAISE EXCEPTION 'Media assignment entity not found'; END IF;
  DELETE FROM public.media_asset_usages
   WHERE entity_type = p_entity_type AND entity_id = p_entity_id AND field_name = p_field_name;
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
