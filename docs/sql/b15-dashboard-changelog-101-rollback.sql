-- Dashboard-Changelog 1.0.1: rollback of feature-owned database structures.
-- MANUAL EXECUTION ONLY. This removes stored changelog acknowledgements.

BEGIN;

DROP FUNCTION IF EXISTS public.acknowledge_own_dashboard_changelog(text);

ALTER TABLE public.admin_profiles
  DROP CONSTRAINT IF EXISTS admin_profiles_dashboard_changelog_version_check;

ALTER TABLE public.admin_profiles
  DROP COLUMN IF EXISTS last_acknowledged_dashboard_changelog_version;

COMMIT;
