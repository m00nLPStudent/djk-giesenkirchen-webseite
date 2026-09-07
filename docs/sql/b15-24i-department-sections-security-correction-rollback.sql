-- B15.24I I.3C rollback only. MANUAL EXECUTION ONLY.
-- Restores the exact post-I.3/pre-I.3C public-read state.
BEGIN;

DO $guard$
DECLARE
  v_training_qual text;
  v_public_definition text;
BEGIN
  IF to_regprocedure('public.get_public_department_section(text)') IS NULL THEN
    RAISE EXCEPTION 'I.3C public-read function is missing';
  END IF;
  SELECT pg_catalog.pg_get_functiondef(
    'public.get_public_department_section(text)'::regprocedure
  ) INTO v_public_definition;
  IF v_public_definition NOT ILIKE ALL (ARRAY[
       '%SECURITY DEFINER%', '%contact_is_public%', '%CASE WHEN%',
       '%department_sections%', '%departments%'
     ]) THEN
    RAISE EXCEPTION 'Public-read function no longer matches I.3C';
  END IF;
  SELECT qual INTO v_training_qual
  FROM pg_catalog.pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'department_training_times'
    AND policyname = 'department_training_times_public_read';
  IF v_training_qual IS NULL
     OR v_training_qual NOT ILIKE '%department_training_times.department_id%' THEN
    RAISE EXCEPTION 'Correlated I.3C training policy is missing';
  END IF;
END;
$guard$;

REVOKE ALL ON FUNCTION public.get_public_department_section(text)
  FROM PUBLIC, anon, authenticated, service_role;
DROP FUNCTION public.get_public_department_section(text);

DROP POLICY department_training_times_public_read
  ON public.department_training_times;

-- Exact pre-I.3C policy, retained only so this rollback is mechanically complete.
-- This state is security-weaker and must not be used as the normal target state.
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

COMMIT;
