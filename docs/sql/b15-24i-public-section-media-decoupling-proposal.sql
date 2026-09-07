-- B15.24I I.5F3 - Public Section / Media entkoppeln
-- MANUAL EXECUTION ONLY. Policy-/Funktionskorrektur ohne Fachdatenaenderung.
BEGIN;

DO $preflight$
DECLARE
  v_section_qual text;
  v_training_qual text;
  v_public_fn text;
BEGIN
  IF to_regclass('public.department_sections') IS NULL
     OR to_regclass('public.department_training_times') IS NULL
     OR to_regclass('public.departments') IS NULL
     OR to_regclass('public.media_assets') IS NULL THEN
    RAISE EXCEPTION 'B15.24I I.5F3 prerequisite tables are missing';
  END IF;

  IF NOT (SELECT relrowsecurity FROM pg_catalog.pg_class WHERE oid = 'public.department_sections'::regclass)
     OR NOT (SELECT relrowsecurity FROM pg_catalog.pg_class WHERE oid = 'public.department_training_times'::regclass)
     OR NOT (SELECT relrowsecurity FROM pg_catalog.pg_class WHERE oid = 'public.media_assets'::regclass) THEN
    RAISE EXCEPTION 'Expected RLS baseline is missing';
  END IF;

  SELECT qual INTO v_section_qual
  FROM pg_catalog.pg_policies
  WHERE schemaname = 'public' AND tablename = 'department_sections'
    AND policyname = 'department_sections_public_read' AND cmd = 'SELECT'
    AND roles @> ARRAY['anon','authenticated']::name[] AND cardinality(roles) = 2;
  IF v_section_qual IS NULL
     OR NOT (v_section_qual ILIKE ALL (ARRAY[
       '%is_active%', '%is_published%', '%departments%', '%media_assets%',
       '%image_media_asset_id%', '%media_kind%', '%visibility%', '%is_archived%'
     ])) THEN
    RAISE EXCEPTION 'Unexpected department_sections public policy baseline';
  END IF;

  SELECT qual INTO v_training_qual
  FROM pg_catalog.pg_policies
  WHERE schemaname = 'public' AND tablename = 'department_training_times'
    AND policyname = 'department_training_times_public_read' AND cmd = 'SELECT'
    AND roles @> ARRAY['anon','authenticated']::name[] AND cardinality(roles) = 2;
  -- pg_get_expr/pg_policies normalizes columns of the protected row to
  -- unqualified names. Only the correlated outer-row references remain qualified.
  IF v_training_qual IS NULL
     OR NOT (v_training_qual ILIKE ALL (ARRAY[
       '%department_training_times.department_id%',
       '%department_sections%', '%departments%',
       '%effective_from%', '%effective_until%',
       '%is_active%', '%is_published%'
     ]))
     OR (
       length(lower(v_training_qual))
       - length(replace(lower(v_training_qual), 'department_training_times.department_id', ''))
     ) / length('department_training_times.department_id') < 2
     OR v_training_qual !~* '[[:alnum:]_]+\.id[[:space:]]*=[[:space:]]*department_training_times\.department_id'
     OR v_training_qual !~* '[[:alnum:]_]+\.department_id[[:space:]]*=[[:space:]]*department_training_times\.department_id'
     OR v_training_qual ILIKE '%media_assets%' THEN
    RAISE EXCEPTION 'Unexpected correlated training policy baseline';
  END IF;

  IF pg_catalog.has_table_privilege('anon', 'public.media_assets', 'SELECT')
     OR NOT pg_catalog.has_table_privilege('authenticated', 'public.media_assets', 'SELECT')
     OR NOT pg_catalog.has_table_privilege('service_role', 'public.media_assets', 'SELECT') THEN
    RAISE EXCEPTION 'Unexpected media_assets privilege baseline';
  END IF;

  IF to_regprocedure('public.get_public_department_section(text)') IS NULL THEN
    RAISE EXCEPTION 'Public department section function is missing';
  END IF;
  SELECT pg_catalog.pg_get_functiondef(p.oid) INTO v_public_fn
  FROM pg_catalog.pg_proc p
  WHERE p.oid = 'public.get_public_department_section(text)'::regprocedure
    AND p.prokind = 'f' AND p.prosecdef IS TRUE
    AND p.proconfig = ARRAY['search_path=pg_catalog'];
  IF v_public_fn IS NULL
     OR NOT (v_public_fn ILIKE ALL (ARRAY[
       '%contact_is_public%', '%CASE WHEN%', '%media_assets%',
       '%media_kind%', '%visibility%', '%is_archived%'
     ])) THEN
    RAISE EXCEPTION 'Unexpected public department section function baseline';
  END IF;

  IF EXISTS (
       SELECT 1
       FROM pg_catalog.pg_proc p
       CROSS JOIN LATERAL pg_catalog.aclexplode(
         COALESCE(p.proacl, pg_catalog.acldefault('f', p.proowner))
       ) acl
       WHERE p.oid = 'public.get_public_department_section(text)'::regprocedure
         AND acl.grantee = 0 AND acl.privilege_type = 'EXECUTE'
     )
     OR NOT pg_catalog.has_function_privilege('anon', 'public.get_public_department_section(text)', 'EXECUTE')
     OR NOT pg_catalog.has_function_privilege('authenticated', 'public.get_public_department_section(text)', 'EXECUTE')
     OR NOT pg_catalog.has_function_privilege('service_role', 'public.get_public_department_section(text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Unexpected public department section execute baseline';
  END IF;
END;
$preflight$;

DROP POLICY department_sections_public_read ON public.department_sections;

CREATE POLICY department_sections_public_read
  ON public.department_sections FOR SELECT TO anon, authenticated
  USING (
    department_sections.is_active IS TRUE
    AND department_sections.is_published IS TRUE
    AND EXISTS (
      SELECT 1
      FROM public.departments d
      WHERE d.id = department_sections.department_id
        AND d.is_active IS TRUE
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
  WHERE d.slug = btrim(p_department_slug)
    AND p_department_slug = btrim(p_department_slug)
    AND char_length(p_department_slug) BETWEEN 1 AND 120
    AND d.is_active IS TRUE
    AND s.is_active IS TRUE
    AND s.is_published IS TRUE;
$fn$;

REVOKE ALL ON FUNCTION public.get_public_department_section(text)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_public_department_section(text)
  TO anon, authenticated, service_role;

COMMIT;
