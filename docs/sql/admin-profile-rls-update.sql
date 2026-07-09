-- Optional RLS extension for Phase B8 (Profile self-service update)
-- Do not run automatically.
-- Run only if updating admin_profiles.full_name fails due to RLS.

-- This policy allows an authenticated user to update only their own profile row.
-- Existing SELECT policies remain unchanged.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'admin_profiles'
      AND policyname = 'admin_profiles_update_own_authenticated'
  ) THEN
    CREATE POLICY admin_profiles_update_own_authenticated
      ON public.admin_profiles
      FOR UPDATE
      TO authenticated
      USING (id = auth.uid())
      WITH CHECK (id = auth.uid());
  END IF;
END
$$;
