-- B15.24I I.5F3 - NOTFALL-ROLLBACK
-- Stellt den vorherigen Media-gekoppelten Vertrag und damit auch den bestaetigten
-- 42501-Fehlerpfad wieder her. Nur nach ausdruecklicher manueller Entscheidung.
BEGIN;

DO $preflight$
DECLARE
  v_section_qual text;
  v_public_fn text;
BEGIN
  SELECT qual INTO v_section_qual
  FROM pg_catalog.pg_policies
  WHERE schemaname = 'public' AND tablename = 'department_sections'
    AND policyname = 'department_sections_public_read' AND cmd = 'SELECT'
    AND roles @> ARRAY['anon','authenticated']::name[] AND cardinality(roles) = 2;
  -- pg_get_expr/pg_policies may remove qualification from columns belonging to
  -- the protected row; verify the relationship instead of rendered formatting.
  IF v_section_qual IS NULL
     OR NOT (v_section_qual ILIKE ALL (ARRAY[
       '%department_sections.department_id%', '%departments%',
       '%is_active%', '%is_published%'
     ]))
     OR v_section_qual !~* '[[:alnum:]_]+\.id[[:space:]]*=[[:space:]]*department_sections\.department_id'
     OR v_section_qual ILIKE '%media_assets%'
     OR v_section_qual ILIKE '%image_media_asset_id%' THEN
    RAISE EXCEPTION 'Expected decoupled section policy is not present; rollback refused';
  END IF;

  SELECT pg_catalog.pg_get_functiondef(p.oid) INTO v_public_fn
  FROM pg_catalog.pg_proc p
  WHERE p.oid = to_regprocedure('public.get_public_department_section(text)')
    AND p.prokind = 'f' AND p.prosecdef IS TRUE
    AND p.proconfig = ARRAY['search_path=pg_catalog'];
  IF v_public_fn IS NULL
     OR NOT (v_public_fn ILIKE ALL (ARRAY['%contact_is_public%', '%CASE WHEN%']))
     OR v_public_fn ILIKE '%media_assets%' THEN
    RAISE EXCEPTION 'Expected decoupled public function is not present; rollback refused';
  END IF;

  IF pg_catalog.has_table_privilege('anon', 'public.media_assets', 'SELECT') THEN
    RAISE EXCEPTION 'Unexpected anon media_assets grant; rollback refused';
  END IF;
END;
$preflight$;

DROP POLICY department_sections_public_read ON public.department_sections;

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

CREATE OR REPLACE FUNCTION public.get_public_department_section(p_department_slug text)
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
    d.slug, s.title_de, s.description_de, s.image_media_asset_id,
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
        a.id IS NOT NULL AND a.media_kind = 'image'
        AND a.visibility = 'public' AND a.is_archived IS FALSE
      )
    );
$fn$;

REVOKE ALL ON FUNCTION public.get_public_department_section(text)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_public_department_section(text)
  TO anon, authenticated, service_role;

COMMIT;
