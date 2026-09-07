-- B15.24I I.3C - Public-Read Security Correction
-- MANUAL EXECUTION ONLY. Keine Daten-/Schema-Inhalte oder Produktimplementierung.
BEGIN;

DO $preflight$
DECLARE
  v_training_qual text;
BEGIN
  IF to_regclass('public.department_sections') IS NULL
     OR to_regclass('public.department_training_times') IS NULL THEN
    RAISE EXCEPTION 'B15.24I base tables are missing';
  END IF;
  IF NOT (SELECT relrowsecurity FROM pg_catalog.pg_class
          WHERE oid = 'public.department_sections'::regclass)
     OR NOT (SELECT relrowsecurity FROM pg_catalog.pg_class
             WHERE oid = 'public.department_training_times'::regclass) THEN
    RAISE EXCEPTION 'Expected B15.24I RLS baseline is missing';
  END IF;
  IF to_regprocedure('public.get_public_department_section(text)') IS NOT NULL THEN
    RAISE EXCEPTION 'Public department section read function already exists';
  END IF;
  IF (SELECT count(*) FROM pg_catalog.pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'department_training_times'
        AND policyname = 'department_training_times_public_read'
        AND cmd = 'SELECT') <> 1 THEN
    RAISE EXCEPTION 'Expected training public-read policy is missing or duplicated';
  END IF;

  SELECT qual INTO v_training_qual
  FROM pg_catalog.pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'department_training_times'
    AND policyname = 'department_training_times_public_read';

  IF v_training_qual NOT ILIKE ALL (ARRAY[
       '%is_active%', '%effective_from%', '%effective_until%',
       '%department_sections%', '%departments%'
     ])
     OR v_training_qual ILIKE '%department_training_times.department_id%' THEN
    RAISE EXCEPTION 'Training policy is not the expected uncorrelated I.3 baseline';
  END IF;

  IF pg_catalog.has_column_privilege('anon', 'public.department_sections', 'contact_name', 'SELECT')
     OR pg_catalog.has_column_privilege('anon', 'public.department_sections', 'contact_email', 'SELECT')
     OR pg_catalog.has_column_privilege('anon', 'public.department_sections', 'contact_phone', 'SELECT')
     OR pg_catalog.has_column_privilege('authenticated', 'public.department_sections', 'contact_name', 'SELECT')
     OR pg_catalog.has_column_privilege('authenticated', 'public.department_sections', 'contact_email', 'SELECT')
     OR pg_catalog.has_column_privilege('authenticated', 'public.department_sections', 'contact_phone', 'SELECT') THEN
    RAISE EXCEPTION 'Private contact columns unexpectedly have browser SELECT grants';
  END IF;
END;
$preflight$;

DROP POLICY department_training_times_public_read
  ON public.department_training_times;

CREATE POLICY department_training_times_public_read
  ON public.department_training_times FOR SELECT TO anon, authenticated
  USING (
    department_training_times.is_active IS TRUE
    AND (
      department_training_times.effective_from IS NULL
      OR department_training_times.effective_from <= CURRENT_DATE
    )
    AND (
      department_training_times.effective_until IS NULL
      OR department_training_times.effective_until >= CURRENT_DATE
    )
    AND EXISTS (
      SELECT 1
      FROM public.departments d
      JOIN public.department_sections s
        ON s.department_id = d.id
      WHERE d.id = department_training_times.department_id
        AND s.department_id = department_training_times.department_id
        AND d.is_active IS TRUE
        AND s.is_active IS TRUE
        AND s.is_published IS TRUE
    )
  );

CREATE FUNCTION public.get_public_department_section(p_department_slug text)
RETURNS TABLE (
  department_slug text,
  title_de text,
  description_de text,
  image_media_asset_id uuid,
  contact_is_public boolean,
  contact_name text,
  contact_email text,
  contact_phone text,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $fn$
  SELECT
    d.slug,
    s.title_de,
    s.description_de,
    s.image_media_asset_id,
    s.contact_is_public,
    CASE WHEN s.contact_is_public IS TRUE THEN s.contact_name ELSE NULL END,
    CASE WHEN s.contact_is_public IS TRUE THEN s.contact_email ELSE NULL END,
    CASE WHEN s.contact_is_public IS TRUE THEN s.contact_phone ELSE NULL END,
    s.updated_at
  FROM public.department_sections s
  JOIN public.departments d ON d.id = s.department_id
  LEFT JOIN public.media_assets a ON a.id = s.image_media_asset_id
  WHERE d.slug = btrim(p_department_slug)
    AND p_department_slug = btrim(p_department_slug)
    AND char_length(p_department_slug) BETWEEN 1 AND 120
    AND d.is_active IS TRUE
    AND s.is_active IS TRUE
    AND s.is_published IS TRUE
    AND (
      s.image_media_asset_id IS NULL OR (
        a.id IS NOT NULL
        AND a.media_kind = 'image'
        AND a.visibility = 'public'
        AND a.is_archived IS FALSE
      )
    );
$fn$;

REVOKE ALL ON FUNCTION public.get_public_department_section(text)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_public_department_section(text)
  TO anon, authenticated, service_role;

COMMIT;
