-- B15.24H2: department-aware team templates and board-role classification.
-- MANUAL EXECUTION ONLY after review. Do not substitute hard-coded department UUIDs.

BEGIN;

DO $$
DECLARE
  football_department_id uuid;
  template_count integer;
  board_role_count integer;
  board_member_fingerprint text;
BEGIN
  SELECT d.id INTO football_department_id
  FROM public.departments AS d
  WHERE d.slug = 'fussball' AND d.is_active = true;

  IF football_department_id IS NULL OR (
    SELECT count(*) FROM public.departments WHERE slug = 'fussball' AND is_active = true
  ) <> 1 THEN
    RAISE EXCEPTION 'Expected exactly one active fussball department; aborting.';
  END IF;

  IF (SELECT count(*) FROM public.departments WHERE slug = 'tischtennis' AND is_active = true) <> 1 THEN
    RAISE EXCEPTION 'Expected exactly one active tischtennis department; aborting.';
  END IF;

  SELECT count(*) INTO template_count FROM public.team_templates;
  IF template_count <> 14 OR EXISTS (
    SELECT 1
    FROM public.team_templates
    WHERE slug NOT IN (
      'bambinis', 'f2-jugend', 'f1-jugend', 'e2-jugend', 'e1-jugend',
      'd1-jugend', 'd2-jugend', 'c-jugend', 'b-jugend', 'a-jugend',
      'erste-herren', 'zweite-herren', 'dritte-herren', 'erste-damen'
    )
  ) THEN
    RAISE EXCEPTION 'team_templates no longer matches the verified 14-row football baseline; aborting.';
  END IF;

  SELECT count(*) INTO board_role_count FROM public.board_roles;
  IF board_role_count <> 19 THEN
    RAISE EXCEPTION 'board_roles no longer matches the verified 19-row baseline; aborting.';
  END IF;

  IF (SELECT count(*) FROM public.board_roles WHERE slug IN (
    'erster-vorsitzender', 'zweiter-vorsitzender', 'erster-geschaeftsfuehrer',
    'zweiter-geschaeftsfuehrer', 'kassenwart', 'stellvertretender-kassenwart',
    'abteilungsleiter-fussball', 'jugendleiter', 'jugendkoordinator',
    'sportlicher-leiter', 'stellvertretender-abteilungsleiter', 'materialwart',
    'schiedsrichterobmann', 'platzwart'
  )) <> 14 THEN
    RAISE EXCEPTION 'Required board-role baseline is incomplete; aborting.';
  END IF;

  SELECT count(*)::text || ':' || md5(COALESCE(
    string_agg(md5(to_jsonb(bm)::text), ',' ORDER BY bm.id::text),
    ''
  ))
  INTO board_member_fingerprint
  FROM public.board_members AS bm;

  PERFORM pg_catalog.set_config(
    'b15_24h2.board_members_fingerprint',
    board_member_fingerprint,
    true
  );
END
$$;

ALTER TABLE public.team_templates
  ADD COLUMN IF NOT EXISTS department_id uuid;

DO $$
DECLARE
  existing_constraint record;
BEGIN
  SELECT c.oid, c.conkey, c.confkey, c.confrelid, c.confdeltype, c.convalidated
  INTO existing_constraint
    FROM pg_catalog.pg_constraint AS c
    WHERE c.conrelid = 'public.team_templates'::regclass
      AND c.conname = 'team_templates_department_id_fkey'
      AND c.contype = 'f';

  IF NOT FOUND THEN
    ALTER TABLE public.team_templates
      ADD CONSTRAINT team_templates_department_id_fkey
      FOREIGN KEY (department_id)
      REFERENCES public.departments(id)
      ON DELETE RESTRICT;
  ELSIF existing_constraint.conkey <> ARRAY[(
      SELECT a.attnum
      FROM pg_catalog.pg_attribute AS a
      WHERE a.attrelid = 'public.team_templates'::regclass
        AND a.attname = 'department_id'
        AND NOT a.attisdropped
    )]::smallint[]
    OR existing_constraint.confrelid <> 'public.departments'::regclass
    OR existing_constraint.confkey <> ARRAY[(
      SELECT a.attnum
      FROM pg_catalog.pg_attribute AS a
      WHERE a.attrelid = 'public.departments'::regclass
        AND a.attname = 'id'
        AND NOT a.attisdropped
    )]::smallint[]
    OR existing_constraint.confdeltype <> 'r'
    OR NOT existing_constraint.convalidated THEN
    RAISE EXCEPTION 'Existing team_templates_department_id_fkey has an unexpected definition; aborting.';
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS team_templates_department_id_idx
  ON public.team_templates(department_id);

UPDATE public.team_templates
SET department_id = (
  SELECT d.id FROM public.departments AS d
  WHERE d.slug = 'fussball' AND d.is_active = true
)
WHERE department_id IS NULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.team_templates WHERE department_id IS NULL) THEN
    RAISE EXCEPTION 'team_templates backfill left NULL department IDs; aborting.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.team_templates AS tt
    JOIN public.departments AS d ON d.id = tt.department_id
    WHERE d.slug <> 'fussball'
  ) THEN
    RAISE EXCEPTION 'Verified baseline templates are not exclusively assigned to fussball; aborting.';
  END IF;
END
$$;

ALTER TABLE public.team_templates
  ALTER COLUMN department_id SET NOT NULL;

ALTER TABLE public.board_roles
  ADD COLUMN IF NOT EXISTS department_id uuid;

DO $$
DECLARE
  existing_constraint record;
BEGIN
  SELECT c.oid, c.conkey, c.confkey, c.confrelid, c.confdeltype, c.convalidated
  INTO existing_constraint
    FROM pg_catalog.pg_constraint AS c
    WHERE c.conrelid = 'public.board_roles'::regclass
      AND c.conname = 'board_roles_department_id_fkey'
      AND c.contype = 'f';

  IF NOT FOUND THEN
    ALTER TABLE public.board_roles
      ADD CONSTRAINT board_roles_department_id_fkey
      FOREIGN KEY (department_id)
      REFERENCES public.departments(id)
      ON DELETE RESTRICT;
  ELSIF existing_constraint.conkey <> ARRAY[(
      SELECT a.attnum
      FROM pg_catalog.pg_attribute AS a
      WHERE a.attrelid = 'public.board_roles'::regclass
        AND a.attname = 'department_id'
        AND NOT a.attisdropped
    )]::smallint[]
    OR existing_constraint.confrelid <> 'public.departments'::regclass
    OR existing_constraint.confkey <> ARRAY[(
      SELECT a.attnum
      FROM pg_catalog.pg_attribute AS a
      WHERE a.attrelid = 'public.departments'::regclass
        AND a.attname = 'id'
        AND NOT a.attisdropped
    )]::smallint[]
    OR existing_constraint.confdeltype <> 'r'
    OR NOT existing_constraint.convalidated THEN
    RAISE EXCEPTION 'Existing board_roles_department_id_fkey has an unexpected definition; aborting.';
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS board_roles_department_id_idx
  ON public.board_roles(department_id)
  WHERE department_id IS NOT NULL;

UPDATE public.board_roles
SET name_de = 'Geschäftsführer'
WHERE slug = 'erster-geschaeftsfuehrer'
  AND name_de IN ('1. Geschäftsführer', 'Geschäftsführer');

UPDATE public.board_roles
SET department_id = (
  SELECT d.id FROM public.departments AS d
  WHERE d.slug = 'fussball' AND d.is_active = true
)
WHERE slug IN (
  'abteilungsleiter-fussball',
  'jugendleiter',
  'jugendkoordinator',
  'sportlicher-leiter',
  'stellvertretender-abteilungsleiter',
  'materialwart',
  'schiedsrichterobmann'
);

UPDATE public.board_roles
SET department_id = NULL
WHERE slug NOT IN (
  'abteilungsleiter-fussball',
  'jugendleiter',
  'jugendkoordinator',
  'sportlicher-leiter',
  'stellvertretender-abteilungsleiter',
  'materialwart',
  'schiedsrichterobmann'
);

DO $$
DECLARE
  football_department_id uuid;
BEGIN
  SELECT id INTO football_department_id
  FROM public.departments
  WHERE slug = 'fussball' AND is_active = true;

  IF (SELECT count(*) FROM public.team_templates) <> 14
     OR (SELECT count(*) FROM public.board_roles) <> 19 THEN
    RAISE EXCEPTION 'Master-data row counts changed unexpectedly; aborting.';
  END IF;

  IF (SELECT count(*) FROM public.board_roles WHERE slug IN (
    'erster-vorsitzender', 'zweiter-vorsitzender', 'erster-geschaeftsfuehrer',
    'zweiter-geschaeftsfuehrer', 'kassenwart', 'stellvertretender-kassenwart'
  ) AND department_id IS NULL) <> 6 THEN
    RAISE EXCEPTION 'Shared board roles are not all organization-wide; aborting.';
  END IF;

  IF (SELECT count(*) FROM public.board_roles WHERE slug IN (
    'abteilungsleiter-fussball', 'jugendleiter', 'jugendkoordinator',
    'sportlicher-leiter', 'stellvertretender-abteilungsleiter', 'materialwart',
    'schiedsrichterobmann'
  ) AND department_id = football_department_id) <> 7 THEN
    RAISE EXCEPTION 'Football board-role classification is incomplete; aborting.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.board_roles
    WHERE slug = 'platzwart' AND department_id IS NULL
  ) THEN
    RAISE EXCEPTION 'Platzwart must remain organization-wide/unclassified; aborting.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.board_roles
    WHERE slug = 'erster-geschaeftsfuehrer' AND name_de = 'Geschäftsführer'
  ) THEN
    RAISE EXCEPTION 'Geschäftsführer rename was not applied safely; aborting.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.board_roles
    WHERE slug NOT IN (
      'abteilungsleiter-fussball', 'jugendleiter', 'jugendkoordinator',
      'sportlicher-leiter', 'stellvertretender-abteilungsleiter', 'materialwart',
      'schiedsrichterobmann'
    )
      AND department_id IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'An unclassified/shared board role has a department assignment; aborting.';
  END IF;

  IF pg_catalog.current_setting('b15_24h2.board_members_fingerprint', true)
     IS DISTINCT FROM (
       SELECT count(*)::text || ':' || md5(COALESCE(
         string_agg(md5(to_jsonb(bm)::text), ',' ORDER BY bm.id::text),
         ''
       ))
       FROM public.board_members AS bm
     ) THEN
    RAISE EXCEPTION 'board_members changed during the proposal; aborting.';
  END IF;
END
$$;

COMMIT;
