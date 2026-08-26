-- B15.21B3.1: MANUAL TEST-DATA proposal. DO NOT RUN automatically.
-- Assigns only the explicitly confirmed D2 test team to the confirmed football department.
BEGIN;

DO $block$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.teams
    WHERE id = '43e93830-1f0e-48a0-83d2-1ee5cebd3099'::uuid
      AND name_de = 'D2-Jugend'
      AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Expected active D2 test team was not found; aborting.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.departments
    WHERE id = '7c3bcc82-c219-48be-89d5-4f9232f69c84'::uuid
      AND slug = 'fussball'
      AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Expected active football department was not found; aborting.';
  END IF;
END
$block$;

UPDATE public.teams
SET department_id = '7c3bcc82-c219-48be-89d5-4f9232f69c84'::uuid
WHERE id = '43e93830-1f0e-48a0-83d2-1ee5cebd3099'::uuid
  AND department_id IS NULL;

DO $block$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.teams
    WHERE id = '43e93830-1f0e-48a0-83d2-1ee5cebd3099'::uuid
      AND department_id = '7c3bcc82-c219-48be-89d5-4f9232f69c84'::uuid
  ) THEN
    RAISE EXCEPTION 'D2 test-team assignment postcondition failed; rolling back.';
  END IF;
END
$block$;

COMMIT;
