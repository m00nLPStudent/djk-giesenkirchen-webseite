-- B15 youth-coordinator permission correction rollback.
-- MANUAL EXECUTION ONLY if the corresponding proposal must be reverted.
-- Restores the confirmed preflight baseline for `jugendleiter` exactly.

BEGIN;

DO $guard$
DECLARE
  v_role_id uuid;
  v_settings_view_count integer;
  v_results_count integer;
BEGIN
  SELECT id INTO v_role_id
  FROM public.admin_roles
  WHERE key = 'jugendleiter' AND is_active IS TRUE;

  IF v_role_id IS NULL OR (
    SELECT count(*) FROM public.admin_roles WHERE key = 'jugendleiter'
  ) <> 1 THEN
    RAISE EXCEPTION 'Expected exactly one active canonical jugendleiter role';
  END IF;

  IF (
    SELECT count(*) FROM public.admin_permissions
    WHERE key IN (
      'settings.view', 'settings.edit',
      'results.view', 'results.create', 'results.edit',
      'results.delete', 'results.publish',
      'teams.view', 'teams.create', 'teams.edit', 'teams.delete'
    )
  ) <> 11 THEN
    RAISE EXCEPTION 'Required permission catalogue baseline is incomplete';
  END IF;

  SELECT count(*) INTO v_settings_view_count
  FROM public.admin_role_permissions AS link
  JOIN public.admin_permissions AS permission_row ON permission_row.id = link.permission_id
  WHERE link.role_id = v_role_id AND permission_row.key = 'settings.view';

  SELECT count(*) INTO v_results_count
  FROM public.admin_role_permissions AS link
  JOIN public.admin_permissions AS permission_row ON permission_row.id = link.permission_id
  WHERE link.role_id = v_role_id AND permission_row.key LIKE 'results.%';

  IF NOT (
    (v_settings_view_count = 0 AND v_results_count = 5)
    OR (v_settings_view_count = 1 AND v_results_count = 0)
  ) THEN
    RAISE EXCEPTION 'Unexpected partial jugendleiter permission state';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.admin_role_permissions AS link
    JOIN public.admin_permissions AS permission_row ON permission_row.id = link.permission_id
    WHERE link.role_id = v_role_id
      AND permission_row.key IN ('settings.edit', 'teams.create')
  ) THEN
    RAISE EXCEPTION 'Forbidden jugendleiter permission prevents safe rollback';
  END IF;
END
$guard$;

DELETE FROM public.admin_role_permissions AS link
USING public.admin_roles AS role_row, public.admin_permissions AS permission_row
WHERE link.role_id = role_row.id
  AND link.permission_id = permission_row.id
  AND role_row.key = 'jugendleiter'
  AND permission_row.key IN (
    'results.view', 'results.create', 'results.edit',
    'results.delete', 'results.publish'
  );

INSERT INTO public.admin_role_permissions (role_id, permission_id)
SELECT role_row.id, permission_row.id
FROM public.admin_roles AS role_row
JOIN public.admin_permissions AS permission_row ON permission_row.key = 'settings.view'
WHERE role_row.key = 'jugendleiter'
  AND role_row.is_active IS TRUE
ON CONFLICT (role_id, permission_id) DO NOTHING;

DO $verify$
DECLARE
  v_role_id uuid;
BEGIN
  SELECT id INTO v_role_id
  FROM public.admin_roles
  WHERE key = 'jugendleiter' AND is_active IS TRUE;

  IF (
    SELECT count(*)
    FROM public.admin_role_permissions AS link
    JOIN public.admin_permissions AS permission_row ON permission_row.id = link.permission_id
    WHERE link.role_id = v_role_id AND permission_row.key = 'settings.view'
  ) <> 1 THEN
    RAISE EXCEPTION 'Rollback did not restore settings.view';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.admin_role_permissions AS link
    JOIN public.admin_permissions AS permission_row ON permission_row.id = link.permission_id
    WHERE link.role_id = v_role_id
      AND permission_row.key LIKE 'results.%'
  ) THEN
    RAISE EXCEPTION 'Rollback did not remove all proposal results permissions';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.admin_role_permissions AS link
    JOIN public.admin_permissions AS permission_row ON permission_row.id = link.permission_id
    WHERE link.role_id = v_role_id
      AND permission_row.key IN ('settings.edit', 'teams.create')
  ) THEN
    RAISE EXCEPTION 'Rollback introduced a forbidden jugendleiter permission';
  END IF;
END
$verify$;

COMMIT;
