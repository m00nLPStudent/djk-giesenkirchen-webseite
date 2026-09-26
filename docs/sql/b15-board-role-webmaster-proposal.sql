-- B15 / Version 1.0.8: add the organization-wide board role "Webmaster".
-- MANUAL EXECUTION ONLY after review of the completed live preflight.

BEGIN;

DO $$
DECLARE
  existing_webmaster public.board_roles%ROWTYPE;
  other_roles_fingerprint_before text;
  other_roles_fingerprint_after text;
  board_members_fingerprint_before text;
  board_members_fingerprint_after text;
  responsibilities_fingerprint_before text;
  responsibilities_fingerprint_after text;
BEGIN
  IF to_regclass('public.board_roles') IS NULL
     OR to_regclass('public.board_members') IS NULL
     OR to_regclass('public.board_role_responsibilities') IS NULL
     OR to_regclass('public.admin_roles') IS NULL THEN
    RAISE EXCEPTION 'Required board-role relations are missing; aborting.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_attrdef AS ad
    JOIN pg_catalog.pg_attribute AS a
      ON a.attrelid = ad.adrelid AND a.attnum = ad.adnum
    WHERE ad.adrelid = 'public.board_roles'::regclass
      AND a.attname = 'id'
      AND pg_catalog.pg_get_expr(ad.adbin, ad.adrelid) = 'gen_random_uuid()'
  ) THEN
    RAISE EXCEPTION 'board_roles.id UUID default differs from the verified baseline; aborting.';
  END IF;

  IF (SELECT count(*) FROM public.admin_roles WHERE key = 'webmaster') <> 1 THEN
    RAISE EXCEPTION 'Expected exactly one separate technical webmaster admin role; aborting.';
  END IF;

  SELECT *
  INTO existing_webmaster
  FROM public.board_roles
  WHERE slug = 'webmaster';

  IF FOUND AND (
    existing_webmaster.name_de IS DISTINCT FROM 'Webmaster'
    OR existing_webmaster.name_en IS DISTINCT FROM 'Webmaster'
    OR existing_webmaster.is_active IS DISTINCT FROM true
    OR existing_webmaster.sort_order IS DISTINCT FROM 150
    OR existing_webmaster.department_id IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'A conflicting board_roles webmaster row already exists; aborting without changes.';
  END IF;

  IF existing_webmaster.id IS NULL THEN
    IF (SELECT count(*) FROM public.board_roles) <> 19
       OR (SELECT count(*) FROM public.board_roles WHERE department_id IS NULL) <> 12
       OR (SELECT count(*) FROM public.board_roles WHERE department_id IS NOT NULL) <> 7
       OR (SELECT count(*) FROM public.board_roles WHERE is_active IS DISTINCT FROM true) <> 0
       OR (SELECT count(DISTINCT slug) FROM public.board_roles) <> 19 THEN
      RAISE EXCEPTION 'board_roles no longer matches the verified 19-row baseline; aborting.';
    END IF;
  ELSE
    IF (SELECT count(*) FROM public.board_roles) <> 20
       OR (SELECT count(*) FROM public.board_roles WHERE department_id IS NULL) <> 13
       OR (SELECT count(*) FROM public.board_roles WHERE department_id IS NOT NULL) <> 7
       OR (SELECT count(DISTINCT slug) FROM public.board_roles) <> 20 THEN
      RAISE EXCEPTION 'Existing exact webmaster row is accompanied by unexpected board-role drift; aborting.';
    END IF;
  END IF;

  SELECT count(*)::text || ':' || md5(coalesce(
    string_agg(md5(to_jsonb(br)::text), ',' ORDER BY br.id::text),
    ''
  ))
  INTO other_roles_fingerprint_before
  FROM public.board_roles AS br
  WHERE br.slug <> 'webmaster';

  SELECT count(*)::text || ':' || md5(coalesce(
    string_agg(md5(to_jsonb(bm)::text), ',' ORDER BY bm.id::text),
    ''
  ))
  INTO board_members_fingerprint_before
  FROM public.board_members AS bm;

  SELECT count(*)::text || ':' || md5(coalesce(
    string_agg(md5(to_jsonb(brr)::text), ',' ORDER BY brr.id::text),
    ''
  ))
  INTO responsibilities_fingerprint_before
  FROM public.board_role_responsibilities AS brr;

  IF existing_webmaster.id IS NULL THEN
    INSERT INTO public.board_roles (
      name_de,
      name_en,
      slug,
      is_active,
      sort_order,
      department_id
    )
    VALUES (
      'Webmaster',
      'Webmaster',
      'webmaster',
      true,
      150,
      NULL
    );
  END IF;

  SELECT count(*)::text || ':' || md5(coalesce(
    string_agg(md5(to_jsonb(br)::text), ',' ORDER BY br.id::text),
    ''
  ))
  INTO other_roles_fingerprint_after
  FROM public.board_roles AS br
  WHERE br.slug <> 'webmaster';

  SELECT count(*)::text || ':' || md5(coalesce(
    string_agg(md5(to_jsonb(bm)::text), ',' ORDER BY bm.id::text),
    ''
  ))
  INTO board_members_fingerprint_after
  FROM public.board_members AS bm;

  SELECT count(*)::text || ':' || md5(coalesce(
    string_agg(md5(to_jsonb(brr)::text), ',' ORDER BY brr.id::text),
    ''
  ))
  INTO responsibilities_fingerprint_after
  FROM public.board_role_responsibilities AS brr;

  IF other_roles_fingerprint_after IS DISTINCT FROM other_roles_fingerprint_before
     OR board_members_fingerprint_after IS DISTINCT FROM board_members_fingerprint_before
     OR responsibilities_fingerprint_after IS DISTINCT FROM responsibilities_fingerprint_before THEN
    RAISE EXCEPTION 'Unrelated board data changed unexpectedly; aborting.';
  END IF;

  IF (SELECT count(*) FROM public.board_roles WHERE slug = 'webmaster') <> 1
     OR NOT EXISTS (
       SELECT 1
       FROM public.board_roles
       WHERE slug = 'webmaster'
         AND name_de = 'Webmaster'
         AND name_en = 'Webmaster'
         AND is_active = true
         AND sort_order = 150
         AND department_id IS NULL
     )
     OR (SELECT count(*) FROM public.board_roles) <> 20
     OR (SELECT count(*) FROM public.board_roles WHERE department_id IS NULL) <> 13
     OR (SELECT count(*) FROM public.board_roles WHERE department_id IS NOT NULL) <> 7
     OR (SELECT count(DISTINCT slug) FROM public.board_roles) <> 20 THEN
    RAISE EXCEPTION 'Webmaster board-role target state was not reached; aborting.';
  END IF;
END
$$;

COMMIT;
