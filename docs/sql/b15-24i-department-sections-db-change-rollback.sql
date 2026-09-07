-- B15.24I I.3 rollback. MANUAL EXECUTION ONLY.
-- Fail-safe: das Department bleibt bestehen, da seine Herkunft spaeter nicht
-- zweifelsfrei von fachlicher Nutzung unterschieden werden kann.
BEGIN;

DO $guard$
BEGIN
  IF to_regclass('public.department_sections') IS NULL
     OR to_regclass('public.department_training_times') IS NULL THEN
    RAISE EXCEPTION 'B15.24I tables are not both present; manual rollback review required';
  END IF;
  IF EXISTS (SELECT 1 FROM public.department_sections)
     OR EXISTS (SELECT 1 FROM public.department_training_times) THEN
    RAISE EXCEPTION 'B15.24I data exists; rollback refuses destructive data loss';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.media_asset_usages
    WHERE entity_type = 'department_section'
  ) THEN
    RAISE EXCEPTION 'Department section media usages still exist';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM public.admin_role_permissions rp
    JOIN public.admin_permissions p ON p.id = rp.permission_id
    JOIN public.admin_roles r ON r.id = rp.role_id
    WHERE p.key IN ('department_sections.view', 'department_sections.edit')
      AND r.key NOT IN ('superadmin', 'vorstand')
  ) THEN
    RAISE EXCEPTION 'B15.24I permissions have additional role assignments';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_constraint
    WHERE conrelid = 'public.media_asset_usages'::regclass
      AND conname = 'media_asset_usages_entity_type_check'
      AND pg_catalog.pg_get_constraintdef(oid) ILIKE '%department_section%'
  ) OR (
    SELECT pg_catalog.regexp_count(
      pg_catalog.pg_get_constraintdef(oid),
      '''[^'']+''::text'
    )
    FROM pg_catalog.pg_constraint
    WHERE conrelid = 'public.media_asset_usages'::regclass
      AND conname = 'media_asset_usages_entity_type_check'
  ) <> 18 THEN
    RAISE EXCEPTION 'Unexpected B15.24I media usage constraint state';
  END IF;
END;
$guard$;

DROP POLICY IF EXISTS department_training_times_public_read
  ON public.department_training_times;
DROP POLICY IF EXISTS department_sections_public_read
  ON public.department_sections;
REVOKE ALL ON TABLE public.department_training_times FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.department_sections FROM PUBLIC, anon, authenticated, service_role;

DROP TRIGGER IF EXISTS department_section_cleanup_media_usage ON public.department_sections;
DROP FUNCTION IF EXISTS public.cleanup_department_section_media_usage();
DROP TABLE public.department_training_times;
DROP TABLE public.department_sections;

DELETE FROM public.admin_role_permissions rp
USING public.admin_permissions p
WHERE rp.permission_id = p.id
  AND p.key IN ('department_sections.view', 'department_sections.edit');
DELETE FROM public.admin_permissions
WHERE key IN ('department_sections.view', 'department_sections.edit');

ALTER TABLE public.media_asset_usages
  DROP CONSTRAINT media_asset_usages_entity_type_check;
ALTER TABLE public.media_asset_usages
  ADD CONSTRAINT media_asset_usages_entity_type_check CHECK (
    entity_type = ANY (ARRAY[
      'player','coach','board_member','club_contact','team','team_season',
      'news','news_document','event','event_document','page','club_history',
      'sponsor','document','download','system','admin_profile'
    ]::text[])
  );

CREATE OR REPLACE FUNCTION public.synchronize_media_assignment(
  p_entity_type text,
  p_entity_id uuid,
  p_media_asset_id uuid,
  p_field_name text DEFAULT 'image'
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $fn$
DECLARE v_asset public.media_assets%ROWTYPE; v_expected_media_kind text;
BEGIN
  IF NOT (
    (p_field_name='image' AND p_entity_type IN('coach','player','board_member','club_contact','team','team_season','news','event','sponsor','club_history')) OR
    (p_field_name='contact_image' AND p_entity_type IN('team','team_season')) OR
    (p_field_name='file' AND p_entity_type IN('news_document','event_document','download')) OR
    (p_field_name='avatar' AND p_entity_type='admin_profile')
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
    IF p_entity_type='admin_profile' AND (v_asset.storage_bucket<>'media-library-private' OR v_asset.visibility<>'admin' OR v_asset.purpose<>'profile') THEN
      RAISE EXCEPTION 'Dashboard avatars must be private admin image assets with purpose profile';
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
  ELSIF p_entity_type='admin_profile' AND p_field_name='avatar' THEN UPDATE public.admin_profiles SET profile_image_media_asset_id=p_media_asset_id,updated_at=now() WHERE id=p_entity_id;
  END IF;
  IF NOT FOUND THEN RAISE EXCEPTION 'Media assignment entity not found'; END IF;
  DELETE FROM public.media_asset_usages WHERE entity_type=p_entity_type AND entity_id=p_entity_id AND field_name=p_field_name;
  IF p_media_asset_id IS NOT NULL THEN INSERT INTO public.media_asset_usages(media_asset_id,entity_type,entity_id,field_name) VALUES(p_media_asset_id,p_entity_type,p_entity_id,p_field_name); END IF;
  RETURN p_media_asset_id;
END;
$fn$;
REVOKE ALL ON FUNCTION public.synchronize_media_assignment(text,uuid,uuid,text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.synchronize_media_assignment(text,uuid,uuid,text)
  TO service_role;

-- Absichtlich kein DELETE auf public.departments: fail-safe Erhalt.
COMMIT;
