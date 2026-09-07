-- B15.24I I.3 - neutraler Department-Section-/Training-Vertrag
-- MANUAL EXECUTION ONLY. Vorher vollstaendig pruefen. Keine Test-/Personendaten.
BEGIN;

DO $preflight$
DECLARE
  v_sync_definition text;
BEGIN
  IF to_regclass('public.departments') IS NULL
     OR to_regclass('public.admin_profiles') IS NULL
     OR to_regclass('public.admin_roles') IS NULL
     OR to_regclass('public.admin_permissions') IS NULL
     OR to_regclass('public.admin_role_permissions') IS NULL
     OR to_regclass('public.media_assets') IS NULL
     OR to_regclass('public.media_asset_usages') IS NULL
     OR to_regprocedure('public.set_updated_at()') IS NULL
     OR to_regprocedure('public.synchronize_media_assignment(text,uuid,uuid,text)') IS NULL THEN
    RAISE EXCEPTION 'B15.24I prerequisites are missing';
  END IF;

  IF to_regclass('public.department_sections') IS NOT NULL
     OR to_regclass('public.department_training_times') IS NOT NULL THEN
    RAISE EXCEPTION 'B15.24I target tables already exist; manual compatibility review required';
  END IF;

  IF (SELECT count(*) FROM public.departments WHERE slug = 'damen-gymnastik') <> 1
     OR NOT EXISTS (
       SELECT 1 FROM public.departments
       WHERE slug = 'damen-gymnastik' AND is_active IS TRUE
     ) THEN
    RAISE EXCEPTION 'Expected unique active damen-gymnastik department is missing';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.departments
    WHERE slug = 'behindertensport'
      AND (name_de <> 'Behindertensport' OR is_active IS NOT TRUE)
  ) OR (SELECT count(*) FROM public.departments WHERE slug = 'behindertensport') > 1 THEN
    RAISE EXCEPTION 'Conflicting behindertensport department exists';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.admin_permissions
    WHERE key IN ('department_sections.view', 'department_sections.edit')
  ) THEN
    RAISE EXCEPTION 'B15.24I permissions already exist; ownership review required';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM (VALUES ('superadmin'), ('vorstand')) AS required(role_key)
    LEFT JOIN public.admin_roles r
      ON r.key = required.role_key AND r.is_active IS TRUE
    WHERE r.id IS NULL
  ) THEN
    RAISE EXCEPTION 'Required active B15.24I roles are missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_constraint
    WHERE conrelid = 'public.media_asset_usages'::regclass
      AND conname = 'media_asset_usages_entity_type_check'
      AND contype = 'c'
      AND pg_catalog.pg_get_constraintdef(oid) ILIKE ALL (ARRAY[
        '%player%', '%coach%', '%board_member%', '%club_contact%', '%team%',
        '%team_season%', '%news%', '%news_document%', '%event%',
        '%event_document%', '%page%', '%club_history%', '%sponsor%',
        '%document%', '%download%', '%system%', '%admin_profile%'
      ])
      AND pg_catalog.pg_get_constraintdef(oid) NOT ILIKE '%department_section%'
  ) THEN
    RAISE EXCEPTION 'Unexpected media usage entity constraint baseline';
  END IF;
  IF (
    SELECT pg_catalog.regexp_count(
      pg_catalog.pg_get_constraintdef(oid),
      '''[^'']+''::text'
    )
    FROM pg_catalog.pg_constraint
    WHERE conrelid = 'public.media_asset_usages'::regclass
      AND conname = 'media_asset_usages_entity_type_check'
  ) <> 17 THEN
    RAISE EXCEPTION 'Media usage allowlist contains unexpected entries';
  END IF;

  SELECT pg_catalog.pg_get_functiondef(
    'public.synchronize_media_assignment(text,uuid,uuid,text)'::regprocedure
  ) INTO v_sync_definition;
  IF v_sync_definition NOT ILIKE ALL (ARRAY[
       '%admin_profile%', '%download%', '%club_history%', '%event_document%',
       '%news_document%', '%contact_image%'
     ])
     OR v_sync_definition ILIKE '%department_section%'
     OR has_function_privilege('anon', 'public.synchronize_media_assignment(text,uuid,uuid,text)', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.synchronize_media_assignment(text,uuid,uuid,text)', 'EXECUTE')
     OR NOT has_function_privilege('service_role', 'public.synchronize_media_assignment(text,uuid,uuid,text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Unexpected media synchronization baseline or grants';
  END IF;
END;
$preflight$;

INSERT INTO public.departments (name_de, slug, is_active, sort_order)
SELECT 'Behindertensport', 'behindertensport', true,
       COALESCE((SELECT max(sort_order) + 1 FROM public.departments), 0)
WHERE NOT EXISTS (SELECT 1 FROM public.departments WHERE slug = 'behindertensport');

CREATE TABLE public.department_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid NOT NULL,
  title_de text NOT NULL CHECK (
    title_de = btrim(title_de) AND char_length(title_de) BETWEEN 1 AND 200
  ),
  description_de text NOT NULL DEFAULT '' CHECK (
    description_de = btrim(description_de) AND char_length(description_de) <= 20000
  ),
  image_media_asset_id uuid NULL,
  contact_name text NULL CHECK (
    contact_name IS NULL OR (contact_name = btrim(contact_name) AND char_length(contact_name) BETWEEN 1 AND 200)
  ),
  contact_email text NULL CHECK (
    contact_email IS NULL OR (contact_email = btrim(contact_email) AND char_length(contact_email) BETWEEN 3 AND 320)
  ),
  contact_phone text NULL CHECK (
    contact_phone IS NULL OR (contact_phone = btrim(contact_phone) AND char_length(contact_phone) BETWEEN 3 AND 80)
  ),
  contact_is_public boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  is_published boolean NOT NULL DEFAULT false,
  created_by uuid NULL,
  updated_by uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT department_sections_department_unique UNIQUE (department_id),
  CONSTRAINT department_sections_department_fkey FOREIGN KEY (department_id)
    REFERENCES public.departments(id) ON DELETE RESTRICT,
  CONSTRAINT department_sections_image_media_asset_fkey FOREIGN KEY (image_media_asset_id)
    REFERENCES public.media_assets(id) ON DELETE SET NULL,
  CONSTRAINT department_sections_created_by_fkey FOREIGN KEY (created_by)
    REFERENCES public.admin_profiles(id) ON DELETE SET NULL,
  CONSTRAINT department_sections_updated_by_fkey FOREIGN KEY (updated_by)
    REFERENCES public.admin_profiles(id) ON DELETE SET NULL,
  CONSTRAINT department_sections_contact_public_check CHECK (
    NOT contact_is_public OR contact_name IS NOT NULL
  )
);

CREATE TABLE public.department_training_times (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid NOT NULL,
  weekday smallint NOT NULL CHECK (weekday BETWEEN 1 AND 7),
  start_time time NOT NULL,
  end_time time NOT NULL,
  location_name text NULL CHECK (
    location_name IS NULL OR (location_name = btrim(location_name) AND char_length(location_name) BETWEEN 1 AND 200)
  ),
  location_address text NULL CHECK (
    location_address IS NULL OR (location_address = btrim(location_address) AND char_length(location_address) BETWEEN 1 AND 300)
  ),
  location_city text NULL CHECK (
    location_city IS NULL OR (location_city = btrim(location_city) AND char_length(location_city) BETWEEN 1 AND 160)
  ),
  location_note text NULL CHECK (
    location_note IS NULL OR (location_note = btrim(location_note) AND char_length(location_note) BETWEEN 1 AND 1000)
  ),
  effective_from date NULL,
  effective_until date NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0 CHECK (sort_order BETWEEN 0 AND 1000000),
  created_by uuid NULL,
  updated_by uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT department_training_times_department_fkey FOREIGN KEY (department_id)
    REFERENCES public.departments(id) ON DELETE RESTRICT,
  CONSTRAINT department_training_times_created_by_fkey FOREIGN KEY (created_by)
    REFERENCES public.admin_profiles(id) ON DELETE SET NULL,
  CONSTRAINT department_training_times_updated_by_fkey FOREIGN KEY (updated_by)
    REFERENCES public.admin_profiles(id) ON DELETE SET NULL,
  CONSTRAINT department_training_times_time_range_check CHECK (start_time < end_time),
  CONSTRAINT department_training_times_effective_range_check CHECK (
    effective_until IS NULL OR effective_from IS NULL OR effective_until >= effective_from
  )
);

COMMENT ON TABLE public.department_sections IS
  'Neutraler oeffentlicher Section-Vertrag pro Department; server-only gepflegt.';
COMMENT ON TABLE public.department_training_times IS
  'Teamunabhaengige Department-Trainingszeiten; server-only gepflegt.';

CREATE INDEX department_sections_public_idx
  ON public.department_sections (department_id)
  WHERE is_active IS TRUE AND is_published IS TRUE;
CREATE INDEX department_training_times_department_active_weekday_idx
  ON public.department_training_times (department_id, weekday, start_time, sort_order)
  WHERE is_active IS TRUE;
CREATE INDEX department_training_times_effective_range_idx
  ON public.department_training_times (effective_from, effective_until)
  WHERE is_active IS TRUE;

CREATE TRIGGER department_sections_set_updated_at
  BEFORE UPDATE ON public.department_sections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER department_training_times_set_updated_at
  BEFORE UPDATE ON public.department_training_times
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.media_asset_usages
  DROP CONSTRAINT media_asset_usages_entity_type_check;
ALTER TABLE public.media_asset_usages
  ADD CONSTRAINT media_asset_usages_entity_type_check CHECK (
    entity_type = ANY (ARRAY[
      'player','coach','board_member','club_contact','team','team_season',
      'news','news_document','event','event_document','page','club_history',
      'sponsor','document','download','system','admin_profile','department_section'
    ]::text[])
  );

CREATE OR REPLACE FUNCTION public.synchronize_media_assignment(
  p_entity_type text,
  p_entity_id uuid,
  p_media_asset_id uuid,
  p_field_name text DEFAULT 'image'
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $fn$
DECLARE
  v_asset public.media_assets%ROWTYPE;
  v_expected_media_kind text;
BEGIN
  IF NOT (
    (p_field_name = 'image' AND p_entity_type IN (
      'coach','player','board_member','club_contact','team','team_season',
      'news','event','sponsor','club_history','department_section'
    )) OR
    (p_field_name = 'contact_image' AND p_entity_type IN ('team','team_season')) OR
    (p_field_name = 'file' AND p_entity_type IN ('news_document','event_document','download')) OR
    (p_field_name = 'avatar' AND p_entity_type = 'admin_profile')
  ) THEN
    RAISE EXCEPTION 'Unsupported media assignment target';
  END IF;

  v_expected_media_kind := CASE WHEN p_field_name = 'file' THEN 'document' ELSE 'image' END;
  IF p_media_asset_id IS NOT NULL THEN
    SELECT * INTO v_asset FROM public.media_assets
    WHERE id = p_media_asset_id FOR SHARE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Media asset was not found'; END IF;
    IF v_asset.is_archived THEN RAISE EXCEPTION 'Archived media asset is not assignable'; END IF;
    IF v_asset.media_kind <> v_expected_media_kind THEN
      RAISE EXCEPTION 'Media asset is not assignable to %/%', p_entity_type, p_field_name;
    END IF;
    IF p_entity_type = 'download' AND (
      v_asset.mime_type <> 'application/pdf' OR
      v_asset.storage_bucket <> 'media-library-private' OR
      v_asset.visibility NOT IN ('admin','restricted') OR v_asset.purpose <> 'download'
    ) THEN RAISE EXCEPTION 'Download files must be private PDF assets with purpose download'; END IF;
    IF p_entity_type = 'admin_profile' AND (
      v_asset.storage_bucket <> 'media-library-private' OR
      v_asset.visibility <> 'admin' OR v_asset.purpose <> 'profile'
    ) THEN RAISE EXCEPTION 'Dashboard avatars must be private admin image assets with purpose profile'; END IF;
    IF p_entity_type = 'department_section' AND v_asset.visibility <> 'public' THEN
      RAISE EXCEPTION 'Department section images must be public media assets';
    END IF;
  END IF;

  IF p_entity_type = 'coach' THEN UPDATE public.coaches SET image_media_asset_id = p_media_asset_id WHERE id = p_entity_id;
  ELSIF p_entity_type = 'player' THEN UPDATE public.players SET image_media_asset_id = p_media_asset_id WHERE id = p_entity_id;
  ELSIF p_entity_type = 'board_member' THEN UPDATE public.board_members SET image_media_asset_id = p_media_asset_id WHERE id = p_entity_id;
  ELSIF p_entity_type = 'club_contact' THEN UPDATE public.club_contacts SET image_media_asset_id = p_media_asset_id WHERE id = p_entity_id;
  ELSIF p_entity_type = 'team' AND p_field_name = 'image' THEN UPDATE public.teams SET team_image_media_asset_id = p_media_asset_id WHERE id = p_entity_id;
  ELSIF p_entity_type = 'team_season' AND p_field_name = 'image' THEN UPDATE public.team_seasons SET team_image_media_asset_id = p_media_asset_id WHERE id = p_entity_id;
  ELSIF p_entity_type = 'team' AND p_field_name = 'contact_image' THEN UPDATE public.teams SET contact_image_media_asset_id = p_media_asset_id WHERE id = p_entity_id;
  ELSIF p_entity_type = 'team_season' AND p_field_name = 'contact_image' THEN UPDATE public.team_seasons SET contact_image_media_asset_id = p_media_asset_id WHERE id = p_entity_id;
  ELSIF p_entity_type = 'news' THEN UPDATE public.news SET image_media_asset_id = p_media_asset_id WHERE id = p_entity_id;
  ELSIF p_entity_type = 'news_document' THEN UPDATE public.news_documents SET media_asset_id = p_media_asset_id WHERE id = p_entity_id;
  ELSIF p_entity_type = 'event' THEN UPDATE public.events SET image_media_asset_id = p_media_asset_id WHERE id = p_entity_id;
  ELSIF p_entity_type = 'event_document' THEN UPDATE public.event_documents SET media_asset_id = p_media_asset_id WHERE id = p_entity_id;
  ELSIF p_entity_type = 'sponsor' THEN UPDATE public.sponsors SET image_media_asset_id = p_media_asset_id WHERE id = p_entity_id;
  ELSIF p_entity_type = 'club_history' THEN UPDATE public.club_history_images SET media_asset_id = p_media_asset_id WHERE id = p_entity_id;
  ELSIF p_entity_type = 'download' THEN UPDATE public.downloads SET media_asset_id = p_media_asset_id WHERE id = p_entity_id;
  ELSIF p_entity_type = 'admin_profile' AND p_field_name = 'avatar' THEN UPDATE public.admin_profiles SET profile_image_media_asset_id = p_media_asset_id, updated_at = now() WHERE id = p_entity_id;
  ELSIF p_entity_type = 'department_section' AND p_field_name = 'image' THEN UPDATE public.department_sections SET image_media_asset_id = p_media_asset_id WHERE id = p_entity_id;
  END IF;
  IF NOT FOUND THEN RAISE EXCEPTION 'Media assignment entity not found'; END IF;

  DELETE FROM public.media_asset_usages
  WHERE entity_type = p_entity_type AND entity_id = p_entity_id AND field_name = p_field_name;
  IF p_media_asset_id IS NOT NULL THEN
    INSERT INTO public.media_asset_usages (media_asset_id, entity_type, entity_id, field_name)
    VALUES (p_media_asset_id, p_entity_type, p_entity_id, p_field_name);
  END IF;
  RETURN p_media_asset_id;
END;
$fn$;
REVOKE ALL ON FUNCTION public.synchronize_media_assignment(text,uuid,uuid,text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.synchronize_media_assignment(text,uuid,uuid,text)
  TO service_role;

CREATE OR REPLACE FUNCTION public.cleanup_department_section_media_usage()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $fn$
BEGIN
  DELETE FROM public.media_asset_usages
  WHERE entity_type = 'department_section' AND entity_id = OLD.id AND field_name = 'image';
  RETURN OLD;
END;
$fn$;
REVOKE ALL ON FUNCTION public.cleanup_department_section_media_usage()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_department_section_media_usage()
  TO service_role;
CREATE TRIGGER department_section_cleanup_media_usage
  AFTER DELETE ON public.department_sections
  FOR EACH ROW EXECUTE FUNCTION public.cleanup_department_section_media_usage();

INSERT INTO public.admin_permissions (key, name, description, category) VALUES
  ('department_sections.view', 'Abteilungsseiten ansehen', 'Neutrale Abteilungsseiten und Trainingszeiten ansehen', 'department_sections'),
  ('department_sections.edit', 'Abteilungsseiten bearbeiten', 'Neutrale Abteilungsseiten und Trainingszeiten bearbeiten', 'department_sections');

WITH mapping(role_key, permission_key) AS (
  SELECT role_key, permission_key
  FROM unnest(ARRAY['superadmin','vorstand']) AS role_key
  CROSS JOIN unnest(ARRAY['department_sections.view','department_sections.edit']) AS permission_key
)
INSERT INTO public.admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM mapping m
JOIN public.admin_roles r ON r.key = m.role_key AND r.is_active IS TRUE
JOIN public.admin_permissions p ON p.key = m.permission_key;

ALTER TABLE public.department_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.department_training_times ENABLE ROW LEVEL SECURITY;

CREATE POLICY department_sections_public_read
  ON public.department_sections FOR SELECT TO anon, authenticated
  USING (
    is_active IS TRUE AND is_published IS TRUE
    AND EXISTS (
      SELECT 1 FROM public.departments d
      WHERE d.id = department_id AND d.is_active IS TRUE
    )
    AND (
      image_media_asset_id IS NULL OR EXISTS (
        SELECT 1 FROM public.media_assets a
        WHERE a.id = image_media_asset_id
          AND a.media_kind = 'image'
          AND a.visibility = 'public'
          AND a.is_archived IS FALSE
      )
    )
  );

CREATE POLICY department_training_times_public_read
  ON public.department_training_times FOR SELECT TO anon, authenticated
  USING (
    is_active IS TRUE
    AND (effective_from IS NULL OR effective_from <= CURRENT_DATE)
    AND (effective_until IS NULL OR effective_until >= CURRENT_DATE)
    AND EXISTS (
      SELECT 1 FROM public.departments d
      JOIN public.department_sections s ON s.department_id = d.id
      WHERE d.id = department_id AND d.is_active IS TRUE
        AND s.is_active IS TRUE AND s.is_published IS TRUE
    )
  );

REVOKE ALL ON TABLE public.department_sections FROM PUBLIC, anon, authenticated;
GRANT SELECT (
  id, department_id, title_de, description_de, image_media_asset_id,
  contact_is_public, is_active, is_published, updated_at
) ON public.department_sections TO anon, authenticated;
GRANT ALL ON TABLE public.department_sections TO service_role;

REVOKE ALL ON TABLE public.department_training_times FROM PUBLIC, anon, authenticated;
GRANT SELECT (
  id, department_id, weekday, start_time, end_time, location_name,
  location_address, location_city, location_note, effective_from,
  effective_until, is_active, sort_order, updated_at
) ON public.department_training_times TO anon, authenticated;
GRANT ALL ON TABLE public.department_training_times TO service_role;

COMMIT;
