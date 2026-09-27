-- B15 youth-coordinator permission correction proposal.
-- MANUAL EXECUTION ONLY after explicit approval.
-- Changes only role-permission links for the canonical role `jugendleiter`.

BEGIN;

DO $guard$
DECLARE
  v_role_id uuid;
  v_settings_view_count integer;
  v_settings_edit_count integer;
  v_results_count integer;
  v_teams_create_count integer;
  v_required_team_count integer;
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
    SELECT count(*)
    FROM public.admin_permissions
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

  SELECT count(*) INTO v_settings_edit_count
  FROM public.admin_role_permissions AS link
  JOIN public.admin_permissions AS permission_row ON permission_row.id = link.permission_id
  WHERE link.role_id = v_role_id AND permission_row.key = 'settings.edit';

  SELECT count(*) INTO v_results_count
  FROM public.admin_role_permissions AS link
  JOIN public.admin_permissions AS permission_row ON permission_row.id = link.permission_id
  WHERE link.role_id = v_role_id AND permission_row.key LIKE 'results.%';

  SELECT count(*) INTO v_teams_create_count
  FROM public.admin_role_permissions AS link
  JOIN public.admin_permissions AS permission_row ON permission_row.id = link.permission_id
  WHERE link.role_id = v_role_id AND permission_row.key = 'teams.create';

  SELECT count(*) INTO v_required_team_count
  FROM public.admin_role_permissions AS link
  JOIN public.admin_permissions AS permission_row ON permission_row.id = link.permission_id
  WHERE link.role_id = v_role_id
    AND permission_row.key IN ('teams.view', 'teams.edit', 'teams.delete');

  IF v_settings_edit_count <> 0 OR v_teams_create_count <> 0 OR v_required_team_count <> 3 THEN
    RAISE EXCEPTION 'Unexpected jugendleiter settings/team permission baseline';
  END IF;

  IF NOT (
    (v_settings_view_count = 1 AND v_results_count = 0)
    OR (v_settings_view_count = 0 AND v_results_count = 5)
  ) THEN
    RAISE EXCEPTION 'Unexpected partial jugendleiter permission state';
  END IF;
END
$guard$;

DELETE FROM public.admin_role_permissions AS link
USING public.admin_roles AS role_row, public.admin_permissions AS permission_row
WHERE link.role_id = role_row.id
  AND link.permission_id = permission_row.id
  AND role_row.key = 'jugendleiter'
  AND permission_row.key = 'settings.view';

WITH required_permissions(permission_key) AS (
  VALUES
    ('results.view'),
    ('results.create'),
    ('results.edit'),
    ('results.delete'),
    ('results.publish')
)
INSERT INTO public.admin_role_permissions (role_id, permission_id)
SELECT role_row.id, permission_row.id
FROM public.admin_roles AS role_row
CROSS JOIN required_permissions AS required
JOIN public.admin_permissions AS permission_row
  ON permission_row.key = required.permission_key
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

  IF EXISTS (
    SELECT 1
    FROM public.admin_role_permissions AS link
    JOIN public.admin_permissions AS permission_row ON permission_row.id = link.permission_id
    WHERE link.role_id = v_role_id
      AND permission_row.key IN ('settings.view', 'settings.edit', 'teams.create')
  ) THEN
    RAISE EXCEPTION 'Forbidden jugendleiter permission remains after proposal';
  END IF;

  IF (
    SELECT count(*)
    FROM public.admin_role_permissions AS link
    JOIN public.admin_permissions AS permission_row ON permission_row.id = link.permission_id
    WHERE link.role_id = v_role_id
      AND permission_row.key IN (
        'results.view', 'results.create', 'results.edit',
        'results.delete', 'results.publish'
      )
  ) <> 5 THEN
    RAISE EXCEPTION 'Jugendleiter results permission target is incomplete';
  END IF;

  IF (
    SELECT count(*)
    FROM public.admin_role_permissions AS link
    JOIN public.admin_permissions AS permission_row ON permission_row.id = link.permission_id
    WHERE link.role_id = v_role_id
      AND permission_row.key IN ('teams.view', 'teams.edit', 'teams.delete')
  ) <> 3 THEN
    RAISE EXCEPTION 'Jugendleiter team permission contract changed unexpectedly';
  END IF;
END
$verify$;

COMMIT;
