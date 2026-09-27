-- B15 trainer team edit permissions - proposal
-- DO NOT RUN before the matching application code is deployed.
-- Approved trainer mutations are server-only after permission and team scope.

BEGIN;

DO $guard$
DECLARE
  helper_definition text;
BEGIN
  SELECT pg_catalog.pg_get_functiondef(p.oid)
  INTO helper_definition
  FROM pg_catalog.pg_proc p
  JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'current_admin_has_non_table_tennis_permission'
    AND pg_catalog.pg_get_function_identity_arguments(p.oid) = 'requested_permission text'
    AND p.prokind = 'f';

  IF helper_definition IS NULL THEN
    RAISE EXCEPTION 'Required permission helper is missing';
  END IF;
  IF helper_definition NOT ILIKE '%role_row.key <> ''tischtennis-vorstand''%'
     OR helper_definition NOT ILIKE '%permission_row.key = requested_permission%'
     OR helper_definition NOT ILIKE '%profile.id = auth.uid()%'
     OR helper_definition ILIKE '%role_row.key <> ''trainer''%' THEN
    RAISE EXCEPTION 'Unexpected permission helper baseline';
  END IF;
END
$guard$;

CREATE OR REPLACE FUNCTION public.current_admin_has_non_table_tennis_permission(
  requested_permission text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_profiles profile
    JOIN public.admin_user_roles user_role ON user_role.user_id = profile.id
    JOIN public.admin_roles role_row ON role_row.id = user_role.role_id
    LEFT JOIN public.admin_role_permissions role_permission ON role_permission.role_id = role_row.id
    LEFT JOIN public.admin_permissions permission_row ON permission_row.id = role_permission.permission_id
    WHERE profile.is_active = true
      AND role_row.is_active = true
      AND (profile.id = auth.uid() OR lower(profile.email) = lower(auth.jwt()->>'email'))
      AND role_row.key <> 'tischtennis-vorstand'
      AND role_row.key <> 'trainer'
      AND (role_row.key = 'superadmin' OR permission_row.key = requested_permission)
  );
$function$;

REVOKE ALL ON FUNCTION public.current_admin_has_non_table_tennis_permission(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_admin_has_non_table_tennis_permission(text)
  TO authenticated, service_role;

COMMIT;
