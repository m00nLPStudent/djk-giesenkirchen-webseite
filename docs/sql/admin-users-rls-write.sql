-- Optional RLS extension for Phase B9 (admin user management writes)
-- Do not run automatically.
-- Run only if INSERT/UPDATE/DELETE on admin_profiles/admin_user_roles is blocked by RLS.

-- Assumption:
--   - superadmin role is represented by admin_roles.key = 'superadmin'

-- Helper function:
--   public.is_superadmin_actor() checks whether current auth.uid() has role key 'superadmin'.
--   SECURITY DEFINER avoids policy recursion/select-dependency issues inside admin_user_roles policies.

CREATE OR REPLACE FUNCTION public.is_superadmin_actor()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_user_roles aur
    JOIN public.admin_roles ar ON ar.id = aur.role_id
    WHERE aur.user_id = auth.uid()
      AND ar.key = 'superadmin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_superadmin_actor() TO authenticated;

-- admin_profiles: superadmin can insert and update profiles.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'admin_profiles'
      AND policyname = 'admin_profiles_insert_superadmin'
  ) THEN
    CREATE POLICY admin_profiles_insert_superadmin
      ON public.admin_profiles
      FOR INSERT
      TO authenticated
      WITH CHECK (public.is_superadmin_actor());
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'admin_profiles'
      AND policyname = 'admin_profiles_update_superadmin'
  ) THEN
    CREATE POLICY admin_profiles_update_superadmin
      ON public.admin_profiles
      FOR UPDATE
      TO authenticated
      USING (public.is_superadmin_actor())
      WITH CHECK (public.is_superadmin_actor());
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'admin_profiles'
      AND policyname = 'admin_profiles_delete_superadmin'
  ) THEN
    CREATE POLICY admin_profiles_delete_superadmin
      ON public.admin_profiles
      FOR DELETE
      TO authenticated
      USING (public.is_superadmin_actor());
  END IF;
END
$$;

-- admin_user_roles: superadmin can insert/update/delete role links.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'admin_user_roles'
      AND policyname = 'admin_user_roles_insert_superadmin'
  ) THEN
    CREATE POLICY admin_user_roles_insert_superadmin
      ON public.admin_user_roles
      FOR INSERT
      TO authenticated
      WITH CHECK (public.is_superadmin_actor());
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'admin_user_roles'
      AND policyname = 'admin_user_roles_update_superadmin'
  ) THEN
    CREATE POLICY admin_user_roles_update_superadmin
      ON public.admin_user_roles
      FOR UPDATE
      TO authenticated
      USING (public.is_superadmin_actor())
      WITH CHECK (public.is_superadmin_actor());
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'admin_user_roles'
      AND policyname = 'admin_user_roles_delete_superadmin'
  ) THEN
    CREATE POLICY admin_user_roles_delete_superadmin
      ON public.admin_user_roles
      FOR DELETE
      TO authenticated
      USING (public.is_superadmin_actor());
  END IF;
END
$$;
