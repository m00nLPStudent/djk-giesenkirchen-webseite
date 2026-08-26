-- B15.21C1 rollback. Execute manually only after reviewing current assignments.
BEGIN;

DO $block$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.admin_user_roles ur
    JOIN public.admin_roles r ON r.id = ur.role_id
    WHERE r.key IN ('tischtennis-vorstand','damen-gymnastik-vorstand','behindertensport-vorstand')
  ) THEN
    RAISE EXCEPTION 'C1 roles are assigned to users; rollback aborted.';
  END IF;
END
$block$;

DELETE FROM public.admin_role_permissions rp
USING public.admin_roles r, public.admin_permissions p
WHERE rp.role_id = r.id AND rp.permission_id = p.id
  AND p.key IN ('membership_requests.view','membership_requests.edit','membership_requests.forward')
  AND r.key IN ('fussball-vorstand','jugendleiter','jugendkoordinator','tischtennis-vorstand','damen-gymnastik-vorstand','behindertensport-vorstand');

-- Vorstand already had view/forward before C1; only the C1 edit grant is removed.
DELETE FROM public.admin_role_permissions rp
USING public.admin_roles r, public.admin_permissions p
WHERE rp.role_id = r.id AND rp.permission_id = p.id
  AND r.key = 'vorstand' AND p.key = 'membership_requests.edit';

DELETE FROM public.admin_roles
WHERE key IN ('tischtennis-vorstand','damen-gymnastik-vorstand','behindertensport-vorstand');

COMMIT;
