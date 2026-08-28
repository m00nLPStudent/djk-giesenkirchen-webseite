-- B15.23E5.3.1: controlled auth.users email mutation guard.
-- MANUAL EXECUTION ONLY. Review the live preflight before running this file.

BEGIN;

DO $preconditions$
DECLARE
  v_status_definition text;
  v_index_definition text;
BEGIN
  IF pg_catalog.to_regclass('auth.users') IS NULL THEN
    RAISE EXCEPTION 'auth_users_missing';
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_class AS c
    JOIN pg_catalog.pg_roles AS r ON r.oid = c.relowner
    WHERE c.oid = pg_catalog.to_regclass('auth.users')
      AND c.relkind = 'r'
      AND r.rolname = 'supabase_auth_admin'
      AND c.relrowsecurity
      AND NOT c.relforcerowsecurity
  ) THEN
    RAISE EXCEPTION 'unexpected_auth_users_contract';
  END IF;
  IF (
    SELECT count(*)
    FROM (VALUES
      ('id','uuid'),
      ('email','varchar'),
      ('email_change','varchar'),
      ('email_change_token_new','varchar'),
      ('email_change_token_current','varchar'),
      ('email_change_confirm_status','int2'),
      ('email_change_sent_at','timestamptz')
    ) AS expected(column_name, udt_name)
    JOIN information_schema.columns AS actual
      ON actual.table_schema = 'auth'
     AND actual.table_name = 'users'
     AND actual.column_name = expected.column_name
     AND actual.udt_name = expected.udt_name
  ) <> 7 THEN
    RAISE EXCEPTION 'unexpected_auth_email_column_contract';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'auth' AND table_name = 'users'
      AND column_name = 'id' AND udt_name = 'uuid' AND is_nullable = 'NO'
  ) THEN
    RAISE EXCEPTION 'unexpected_auth_user_id_contract';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_trigger AS t
    WHERE t.tgrelid = pg_catalog.to_regclass('auth.users')
      AND NOT t.tgisinternal
  ) THEN
    RAISE EXCEPTION 'unexpected_noninternal_auth_users_trigger';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_proc AS p
    JOIN pg_catalog.pg_namespace AS n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'guard_admin_controlled_auth_email_change'
  ) THEN
    RAISE EXCEPTION 'guard_function_name_collision';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_trigger AS t
    WHERE t.tgrelid = pg_catalog.to_regclass('auth.users')
      AND t.tgname = 'guard_admin_controlled_email_change'
  ) THEN
    RAISE EXCEPTION 'guard_trigger_name_collision';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM auth.users AS u
    WHERE NULLIF(pg_catalog.to_jsonb(u)->>'email_change', '') IS NOT NULL
       OR NULLIF(pg_catalog.to_jsonb(u)->>'email_change_token_new', '') IS NOT NULL
       OR NULLIF(pg_catalog.to_jsonb(u)->>'email_change_token_current', '') IS NOT NULL
       OR NULLIF(pg_catalog.to_jsonb(u)->>'email_change_sent_at', '') IS NOT NULL
       OR COALESCE(pg_catalog.to_jsonb(u)->>'email_change_confirm_status', '0') <> '0'
  ) THEN
    RAISE EXCEPTION 'native_pending_email_state_exists';
  END IF;

  IF pg_catalog.to_regclass('public.admin_email_change_requests') IS NULL THEN
    RAISE EXCEPTION 'request_table_missing';
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_class AS c
    JOIN pg_catalog.pg_roles AS r ON r.oid = c.relowner
    WHERE c.oid = pg_catalog.to_regclass('public.admin_email_change_requests')
      AND c.relkind = 'r'
      AND r.rolname = 'postgres'
      AND c.relrowsecurity
      AND NOT c.relforcerowsecurity
  ) THEN
    RAISE EXCEPTION 'unexpected_request_table_contract';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_policies
    WHERE schemaname = 'public' AND tablename = 'admin_email_change_requests'
  ) THEN
    RAISE EXCEPTION 'unexpected_request_policy';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'admin_email_change_requests'
      AND column_name = 'compensation_started_at'
      AND data_type = 'timestamp with time zone'
      AND is_nullable = 'YES'
  ) THEN
    RAISE EXCEPTION 'compensation_state_missing';
  END IF;
  SELECT pg_catalog.lower(pg_catalog.regexp_replace(
    pg_catalog.pg_get_constraintdef(c.oid, true), '\s+', ' ', 'g'
  ))
  INTO v_status_definition
  FROM pg_catalog.pg_constraint AS c
  WHERE c.conrelid = pg_catalog.to_regclass('public.admin_email_change_requests')
    AND c.conname = 'admin_email_change_requests_status_check'
    AND c.contype = 'c'
    AND c.convalidated;
  IF v_status_definition IS NULL
     OR v_status_definition NOT LIKE '%pending%confirming%compensating%completed%cancelled%expired%failed%' THEN
    RAISE EXCEPTION 'unexpected_request_status_constraint';
  END IF;
  SELECT pg_catalog.lower(pg_catalog.regexp_replace(
    pg_catalog.pg_get_indexdef(i.indexrelid), '\s+', ' ', 'g'
  ))
  INTO v_index_definition
  FROM pg_catalog.pg_index AS i
  JOIN pg_catalog.pg_class AS x ON x.oid = i.indexrelid
  WHERE i.indrelid = pg_catalog.to_regclass('public.admin_email_change_requests')
    AND x.relname = 'admin_email_change_requests_one_active_user_idx'
    AND i.indisunique AND i.indisvalid;
  IF v_index_definition IS NULL
     OR v_index_definition NOT LIKE '%unique index admin_email_change_requests_one_active_user_idx%using btree (user_id)%pending%confirming%compensating%' THEN
    RAISE EXCEPTION 'unexpected_active_request_index';
  END IF;
  IF pg_catalog.has_table_privilege(
    'supabase_auth_admin', 'public.admin_email_change_requests', 'SELECT'
  ) THEN
    RAISE EXCEPTION 'unexpected_auth_admin_request_select';
  END IF;
  IF NOT pg_catalog.has_table_privilege(
    'postgres', 'public.admin_email_change_requests', 'SELECT'
  ) THEN
    RAISE EXCEPTION 'guard_owner_cannot_read_requests';
  END IF;
END
$preconditions$;

CREATE FUNCTION public.guard_admin_controlled_auth_email_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $guard$
DECLARE
  v_email_changed boolean;
  v_pending_changed boolean;
  v_forward_matches bigint;
  v_reverse_matches bigint;
BEGIN
  v_email_changed := OLD.email IS DISTINCT FROM NEW.email;
  v_pending_changed :=
    OLD.email_change IS DISTINCT FROM NEW.email_change
    OR OLD.email_change_token_new IS DISTINCT FROM NEW.email_change_token_new
    OR OLD.email_change_token_current IS DISTINCT FROM NEW.email_change_token_current
    OR OLD.email_change_confirm_status IS DISTINCT FROM NEW.email_change_confirm_status
    OR OLD.email_change_sent_at IS DISTINCT FROM NEW.email_change_sent_at;

  IF NOT v_email_changed AND NOT v_pending_changed THEN
    RETURN NEW;
  END IF;
  IF NOT v_email_changed OR v_pending_changed THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'controlled_email_change_required';
  END IF;

  SELECT
    count(*) FILTER (
      WHERE r.status = 'confirming'
        AND pg_catalog.lower(pg_catalog.btrim(r.old_email))
          = pg_catalog.lower(pg_catalog.btrim(OLD.email))
        AND pg_catalog.lower(pg_catalog.btrim(r.new_email))
          = pg_catalog.lower(pg_catalog.btrim(NEW.email))
        AND r.confirmed_at IS NOT NULL
        AND r.confirmed_at <= r.expires_at
        AND r.locked_at IS NOT NULL
        AND r.compensation_started_at IS NULL
        AND r.completed_at IS NULL
        AND r.cancelled_at IS NULL
        AND r.expired_at IS NULL
        AND r.failure_code IS NULL
    ),
    count(*) FILTER (
      WHERE r.status = 'compensating'
        AND pg_catalog.lower(pg_catalog.btrim(r.new_email))
          = pg_catalog.lower(pg_catalog.btrim(OLD.email))
        AND pg_catalog.lower(pg_catalog.btrim(r.old_email))
          = pg_catalog.lower(pg_catalog.btrim(NEW.email))
        AND r.confirmed_at IS NOT NULL
        AND r.locked_at IS NOT NULL
        AND r.compensation_started_at IS NOT NULL
        AND r.cancelled_at IS NULL
        AND r.expired_at IS NULL
        AND r.failure_code IS NULL
    )
  INTO v_forward_matches, v_reverse_matches
  FROM public.admin_email_change_requests AS r
  WHERE r.user_id = NEW.id
    AND r.status IN ('confirming', 'compensating');

  IF v_forward_matches + v_reverse_matches <> 1 THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'controlled_email_change_required';
  END IF;

  RETURN NEW;
END
$guard$;

ALTER FUNCTION public.guard_admin_controlled_auth_email_change() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.guard_admin_controlled_auth_email_change() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.guard_admin_controlled_auth_email_change() FROM anon;
REVOKE ALL ON FUNCTION public.guard_admin_controlled_auth_email_change() FROM authenticated;
REVOKE ALL ON FUNCTION public.guard_admin_controlled_auth_email_change() FROM service_role;

CREATE TRIGGER guard_admin_controlled_email_change
BEFORE UPDATE ON auth.users
FOR EACH ROW
WHEN (
  OLD.email IS DISTINCT FROM NEW.email
  OR OLD.email_change IS DISTINCT FROM NEW.email_change
  OR OLD.email_change_token_new IS DISTINCT FROM NEW.email_change_token_new
  OR OLD.email_change_token_current IS DISTINCT FROM NEW.email_change_token_current
  OR OLD.email_change_confirm_status IS DISTINCT FROM NEW.email_change_confirm_status
  OR OLD.email_change_sent_at IS DISTINCT FROM NEW.email_change_sent_at
)
EXECUTE FUNCTION public.guard_admin_controlled_auth_email_change();

DO $self_check$
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
     OR v_function_definition NOT LIKE '%public.admin_email_change_requests%'
     OR v_function_definition LIKE '%EXECUTE %' THEN
    RAISE EXCEPTION 'guard_function_self_check_failed';
  END IF;

  SELECT pg_catalog.pg_get_triggerdef(t.oid, true)
  INTO v_trigger_definition
  FROM pg_catalog.pg_trigger AS t
  WHERE t.tgrelid = pg_catalog.to_regclass('auth.users')
    AND t.tgname = 'guard_admin_controlled_email_change'
    AND NOT t.tgisinternal
    AND t.tgenabled = 'O'
    AND t.tgfoid = v_function_oid;
  IF v_trigger_definition IS NULL
     OR v_trigger_definition NOT ILIKE '%BEFORE UPDATE ON auth.users%'
     OR v_trigger_definition ILIKE '%INSERT%' THEN
    RAISE EXCEPTION 'guard_trigger_self_check_failed';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_proc AS p,
         LATERAL pg_catalog.aclexplode(
           COALESCE(p.proacl, pg_catalog.acldefault('f', p.proowner))
         ) AS acl
    WHERE p.oid = v_function_oid
      AND acl.grantee = 0
      AND acl.privilege_type = 'EXECUTE'
  )
  OR pg_catalog.has_function_privilege('anon', v_function_oid, 'EXECUTE')
  OR pg_catalog.has_function_privilege('authenticated', v_function_oid, 'EXECUTE')
  OR pg_catalog.has_function_privilege('service_role', v_function_oid, 'EXECUTE') THEN
    RAISE EXCEPTION 'guard_function_execute_scope_failed';
  END IF;
  IF pg_catalog.has_table_privilege(
    'supabase_auth_admin', 'public.admin_email_change_requests', 'SELECT'
  ) THEN
    RAISE EXCEPTION 'request_privilege_regression';
  END IF;
END
$self_check$;

COMMIT;
