-- Dashboard-Changelog 1.0.1: schema and controlled self-service acknowledgement.
-- MANUAL EXECUTION ONLY after review of the corresponding live preflight.

BEGIN;

DO $guard$
DECLARE
  profile_policy_count integer;
BEGIN
  IF to_regclass('public.admin_profiles') IS NULL THEN
    RAISE EXCEPTION 'Dashboard changelog aborted: public.admin_profiles is missing';
  END IF;

  IF (SELECT count(*) FROM public.admin_profiles) <> 2 THEN
    RAISE EXCEPTION 'Dashboard changelog aborted: admin profile count drifted since preflight';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'admin_profiles'
      AND c.relrowsecurity = true
      AND c.relforcerowsecurity = false
  ) THEN
    RAISE EXCEPTION 'Dashboard changelog aborted: unexpected admin_profiles RLS baseline';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'admin_profiles'
      AND column_name = 'updated_at'
      AND data_type = 'timestamp with time zone'
  ) THEN
    RAISE EXCEPTION 'Dashboard changelog aborted: expected updated_at column is missing';
  END IF;

  SELECT count(*)
  INTO profile_policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'admin_profiles';

  IF profile_policy_count <> 4
     OR EXISTS (
       SELECT required.policy_name
       FROM (VALUES
         ('admin_profiles_select_authenticated', 'SELECT'),
         ('admin_profiles_insert_superadmin', 'INSERT'),
         ('admin_profiles_update_superadmin', 'UPDATE'),
         ('admin_profiles_delete_superadmin', 'DELETE')
       ) AS required(policy_name, command)
       WHERE NOT EXISTS (
         SELECT 1
         FROM pg_policies p
         WHERE p.schemaname = 'public'
           AND p.tablename = 'admin_profiles'
           AND p.policyname = required.policy_name
           AND p.cmd = required.command
       )
     ) THEN
    RAISE EXCEPTION 'Dashboard changelog aborted: unexpected admin_profiles policy baseline';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'admin_profiles'
      AND column_name = 'last_acknowledged_dashboard_changelog_version'
  ) THEN
    RAISE EXCEPTION 'Dashboard changelog aborted: target column already exists';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.admin_profiles'::regclass
      AND conname = 'admin_profiles_dashboard_changelog_version_check'
  ) THEN
    RAISE EXCEPTION 'Dashboard changelog aborted: target constraint already exists';
  END IF;

  IF to_regprocedure('public.acknowledge_own_dashboard_changelog(text)') IS NOT NULL THEN
    RAISE EXCEPTION 'Dashboard changelog aborted: target function already exists';
  END IF;
END
$guard$;

ALTER TABLE public.admin_profiles
  ADD COLUMN last_acknowledged_dashboard_changelog_version text NULL;

ALTER TABLE public.admin_profiles
  ADD CONSTRAINT admin_profiles_dashboard_changelog_version_check
  CHECK (
    last_acknowledged_dashboard_changelog_version IS NULL
    OR (
      last_acknowledged_dashboard_changelog_version = btrim(last_acknowledged_dashboard_changelog_version)
      AND char_length(last_acknowledged_dashboard_changelog_version) BETWEEN 1 AND 64
      AND last_acknowledged_dashboard_changelog_version ~ '^[0-9A-Za-z][0-9A-Za-z._+-]{0,63}$'
    )
  );

CREATE FUNCTION public.acknowledge_own_dashboard_changelog(p_version text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  safe_version text := btrim(p_version);
  acknowledged_version text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_version IS NULL
     OR p_version IS DISTINCT FROM safe_version
     OR char_length(safe_version) NOT BETWEEN 1 AND 64
     OR safe_version !~ '^[0-9A-Za-z][0-9A-Za-z._+-]{0,63}$' THEN
    RAISE EXCEPTION 'Invalid dashboard changelog version';
  END IF;

  UPDATE public.admin_profiles
  SET
    last_acknowledged_dashboard_changelog_version = safe_version,
    updated_at = now()
  WHERE id = auth.uid()
    AND is_active = true
  RETURNING last_acknowledged_dashboard_changelog_version
  INTO acknowledged_version;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Active own admin profile not found';
  END IF;

  RETURN acknowledged_version;
END
$function$;

REVOKE ALL ON FUNCTION public.acknowledge_own_dashboard_changelog(text)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.acknowledge_own_dashboard_changelog(text)
  TO authenticated;

COMMIT;
