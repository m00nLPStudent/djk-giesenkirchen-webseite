-- B15.23E5.3.1: fail-closed rollback of only the project email guard.
-- MANUAL EXECUTION ONLY. Changes no auth or request data.

BEGIN;

DO $rollback_preconditions$
DECLARE
  v_function_oid oid;
  v_function_definition text;
  v_trigger_definition text;
BEGIN
  SELECT p.oid, pg_catalog.pg_get_functiondef(p.oid)
  INTO v_function_oid, v_function_definition
  FROM pg_catalog.pg_proc AS p
  JOIN pg_catalog.pg_namespace AS n ON n.oid = p.pronamespace
  JOIN pg_catalog.pg_roles AS r ON r.oid = p.proowner
  WHERE n.nspname = 'public'
    AND p.proname = 'guard_admin_controlled_auth_email_change'
    AND p.prokind = 'f'
    AND pg_catalog.pg_get_function_identity_arguments(p.oid) = ''
    AND p.prorettype = 'trigger'::pg_catalog.regtype
    AND p.prosecdef
    AND p.proconfig = ARRAY['search_path=pg_catalog']
    AND r.rolname = 'postgres';
  IF v_function_oid IS NULL
     OR v_function_definition NOT LIKE '%controlled_email_change_required%'
     OR v_function_definition NOT LIKE '%public.admin_email_change_requests%'
     OR v_function_definition NOT LIKE '%status = ''confirming''%'
     OR v_function_definition NOT LIKE '%status = ''compensating''%' THEN
    RAISE EXCEPTION 'unexpected_guard_function_contract';
  END IF;

  SELECT pg_catalog.pg_get_triggerdef(t.oid, true)
  INTO v_trigger_definition
  FROM pg_catalog.pg_trigger AS t
  WHERE t.tgrelid = pg_catalog.to_regclass('auth.users')
    AND t.tgname = 'guard_admin_controlled_email_change'
    AND NOT t.tgisinternal
    AND t.tgfoid = v_function_oid;
  IF v_trigger_definition IS NULL
     OR v_trigger_definition NOT ILIKE '%BEFORE UPDATE ON auth.users%'
     OR v_trigger_definition NOT ILIKE '%guard_admin_controlled_auth_email_change()%'
     OR v_trigger_definition ILIKE '%INSERT%' THEN
    RAISE EXCEPTION 'unexpected_guard_trigger_contract';
  END IF;
END
$rollback_preconditions$;

DROP TRIGGER guard_admin_controlled_email_change ON auth.users;
DROP FUNCTION public.guard_admin_controlled_auth_email_change();

DO $rollback_self_check$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_trigger AS t
    WHERE t.tgrelid = pg_catalog.to_regclass('auth.users')
      AND t.tgname = 'guard_admin_controlled_email_change'
  ) OR EXISTS (
    SELECT 1 FROM pg_catalog.pg_proc AS p
    JOIN pg_catalog.pg_namespace AS n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'guard_admin_controlled_auth_email_change'
  ) THEN
    RAISE EXCEPTION 'guard_rollback_self_check_failed';
  END IF;
END
$rollback_self_check$;

COMMIT;
