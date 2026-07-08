-- Admin Auth RLS Policies (Phase B7.5)
-- Purpose:
--   - Allow authenticated users to read admin auth tables.
--   - Keep write operations locked (no INSERT/UPDATE/DELETE policies yet).
-- Notes:
--   - Idempotent: safe to run multiple times.
--   - No data changes, only RLS configuration.

-- -----------------------------------------------------------------------------
-- 1) Ensure RLS is enabled on all admin auth tables
-- -----------------------------------------------------------------------------

alter table if exists admin_profiles enable row level security;
alter table if exists admin_roles enable row level security;
alter table if exists admin_permissions enable row level security;
alter table if exists admin_role_permissions enable row level security;
alter table if exists admin_user_roles enable row level security;

-- -----------------------------------------------------------------------------
-- 2) SELECT policies for authenticated users
-- -----------------------------------------------------------------------------
-- Pattern:
--   - Create policy only when missing (idempotent).
--   - Read-only for role "authenticated".

-- admin_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'admin_profiles'
      AND policyname = 'admin_profiles_select_authenticated'
  ) THEN
    CREATE POLICY admin_profiles_select_authenticated
      ON public.admin_profiles
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END
$$;

-- admin_roles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'admin_roles'
      AND policyname = 'admin_roles_select_authenticated'
  ) THEN
    CREATE POLICY admin_roles_select_authenticated
      ON public.admin_roles
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END
$$;

-- admin_permissions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'admin_permissions'
      AND policyname = 'admin_permissions_select_authenticated'
  ) THEN
    CREATE POLICY admin_permissions_select_authenticated
      ON public.admin_permissions
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END
$$;

-- admin_role_permissions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'admin_role_permissions'
      AND policyname = 'admin_role_permissions_select_authenticated'
  ) THEN
    CREATE POLICY admin_role_permissions_select_authenticated
      ON public.admin_role_permissions
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END
$$;

-- admin_user_roles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'admin_user_roles'
      AND policyname = 'admin_user_roles_select_authenticated'
  ) THEN
    CREATE POLICY admin_user_roles_select_authenticated
      ON public.admin_user_roles
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END
$$;
