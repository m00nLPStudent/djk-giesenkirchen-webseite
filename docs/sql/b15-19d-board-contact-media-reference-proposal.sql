-- B15.19D proposal only. Do not execute automatically. No backfill.
BEGIN;

ALTER TABLE public.board_members
  ADD COLUMN IF NOT EXISTS image_media_asset_id uuid NULL;

ALTER TABLE public.club_contacts
  ADD COLUMN IF NOT EXISTS image_media_asset_id uuid NULL;

DO $b15_19d_fk$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint constraint_row
    WHERE constraint_row.conrelid = 'public.board_members'::regclass
      AND constraint_row.confrelid = 'public.media_assets'::regclass
      AND constraint_row.contype = 'f'
      AND constraint_row.conkey = ARRAY[(
        SELECT attribute_row.attnum
        FROM pg_attribute attribute_row
        WHERE attribute_row.attrelid = 'public.board_members'::regclass
          AND attribute_row.attname = 'image_media_asset_id'
      )]
      AND constraint_row.confkey = ARRAY[(
        SELECT attribute_row.attnum
        FROM pg_attribute attribute_row
        WHERE attribute_row.attrelid = 'public.media_assets'::regclass
          AND attribute_row.attname = 'id'
      )]
  ) THEN
    ALTER TABLE public.board_members
      ADD CONSTRAINT board_members_image_media_asset_id_fkey
      FOREIGN KEY (image_media_asset_id)
      REFERENCES public.media_assets(id)
      ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint constraint_row
    WHERE constraint_row.conrelid = 'public.club_contacts'::regclass
      AND constraint_row.confrelid = 'public.media_assets'::regclass
      AND constraint_row.contype = 'f'
      AND constraint_row.conkey = ARRAY[(
        SELECT attribute_row.attnum
        FROM pg_attribute attribute_row
        WHERE attribute_row.attrelid = 'public.club_contacts'::regclass
          AND attribute_row.attname = 'image_media_asset_id'
      )]
      AND constraint_row.confkey = ARRAY[(
        SELECT attribute_row.attnum
        FROM pg_attribute attribute_row
        WHERE attribute_row.attrelid = 'public.media_assets'::regclass
          AND attribute_row.attname = 'id'
      )]
  ) THEN
    ALTER TABLE public.club_contacts
      ADD CONSTRAINT club_contacts_image_media_asset_id_fkey
      FOREIGN KEY (image_media_asset_id)
      REFERENCES public.media_assets(id)
      ON DELETE SET NULL;
  END IF;
END;
$b15_19d_fk$;

CREATE INDEX IF NOT EXISTS board_members_image_media_asset_idx
  ON public.board_members (image_media_asset_id)
  WHERE image_media_asset_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS club_contacts_image_media_asset_idx
  ON public.club_contacts (image_media_asset_id)
  WHERE image_media_asset_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.synchronize_media_assignment(
  p_entity_type text,
  p_entity_id uuid,
  p_media_asset_id uuid,
  p_field_name text DEFAULT 'image'
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_asset public.media_assets%ROWTYPE;
  v_expected_purpose text;
BEGIN
  IF p_entity_type NOT IN ('coach', 'player', 'board_member', 'club_contact')
     OR p_field_name <> 'image' THEN
    RAISE EXCEPTION 'Unsupported media assignment target';
  END IF;

  v_expected_purpose := CASE p_entity_type
    WHEN 'coach' THEN 'coach'
    WHEN 'player' THEN 'player'
    WHEN 'board_member' THEN 'board'
    WHEN 'club_contact' THEN 'cms'
    ELSE NULL
  END;

  IF v_expected_purpose IS NULL THEN
    RAISE EXCEPTION 'Unsupported media assignment target';
  END IF;

  IF p_media_asset_id IS NOT NULL THEN
    SELECT *
      INTO v_asset
      FROM public.media_assets
     WHERE id = p_media_asset_id;

    IF NOT FOUND
       OR v_asset.is_archived
       OR v_asset.media_kind <> 'image'
       OR v_asset.purpose <> v_expected_purpose THEN
      RAISE EXCEPTION 'Media asset is not assignable to %', p_entity_type;
    END IF;
  END IF;

  IF p_entity_type = 'coach' THEN
    UPDATE public.coaches
       SET image_media_asset_id = p_media_asset_id
     WHERE id = p_entity_id;
  ELSIF p_entity_type = 'player' THEN
    UPDATE public.players
       SET image_media_asset_id = p_media_asset_id
     WHERE id = p_entity_id;
  ELSIF p_entity_type = 'board_member' THEN
    UPDATE public.board_members
       SET image_media_asset_id = p_media_asset_id
     WHERE id = p_entity_id;
  ELSE
    UPDATE public.club_contacts
       SET image_media_asset_id = p_media_asset_id
     WHERE id = p_entity_id;
  END IF;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Media assignment entity not found';
  END IF;

  DELETE FROM public.media_asset_usages
   WHERE entity_type = p_entity_type
     AND entity_id = p_entity_id
     AND field_name = p_field_name;

  IF p_media_asset_id IS NOT NULL THEN
    INSERT INTO public.media_asset_usages(
      media_asset_id,
      entity_type,
      entity_id,
      field_name
    ) VALUES (
      p_media_asset_id,
      p_entity_type,
      p_entity_id,
      p_field_name
    );
  END IF;

  RETURN p_media_asset_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.synchronize_media_assignment(text, uuid, uuid, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.synchronize_media_assignment(text, uuid, uuid, text)
  TO service_role;

COMMIT;
