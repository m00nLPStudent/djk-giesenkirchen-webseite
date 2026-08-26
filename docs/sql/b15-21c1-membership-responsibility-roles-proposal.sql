-- B15.21C1 controlled role and permission integration. Execute manually only.
BEGIN;

INSERT INTO public.admin_roles (key, name, description, sort_order, is_active)
VALUES
  ('tischtennis-vorstand', 'Vorstand Tischtennis', 'Fachliche Zuständigkeit für die Tischtennisabteilung.', 35, true),
  ('damen-gymnastik-vorstand', 'Vorstand Damen-Gymnastik', 'Fachliche Zuständigkeit für die Damen-Gymnastik.', 36, true),
  ('behindertensport-vorstand', 'Vorstand Behindertensport', 'Fachliche Zuständigkeit für den Behindertensport.', 37, true)
ON CONFLICT (key) DO NOTHING;

DO $block$
BEGIN
  IF (SELECT count(*) FROM public.admin_permissions WHERE key IN ('membership_requests.view','membership_requests.edit','membership_requests.forward')) <> 3 THEN
    RAISE EXCEPTION 'Required membership request permissions are incomplete; aborting.';
  END IF;
END
$block$;

WITH role_permission_map(role_key, permission_key) AS (
  VALUES
    ('vorstand', 'membership_requests.view'),
    ('vorstand', 'membership_requests.edit'),
    ('vorstand', 'membership_requests.forward'),
    ('fussball-vorstand', 'membership_requests.view'),
    ('fussball-vorstand', 'membership_requests.edit'),
    ('fussball-vorstand', 'membership_requests.forward'),
    ('jugendleiter', 'membership_requests.view'),
    ('jugendleiter', 'membership_requests.edit'),
    ('jugendleiter', 'membership_requests.forward'),
    ('jugendkoordinator', 'membership_requests.view'),
    ('jugendkoordinator', 'membership_requests.edit'),
    ('jugendkoordinator', 'membership_requests.forward'),
    ('tischtennis-vorstand', 'membership_requests.view'),
    ('tischtennis-vorstand', 'membership_requests.edit'),
    ('tischtennis-vorstand', 'membership_requests.forward'),
    ('damen-gymnastik-vorstand', 'membership_requests.view'),
    ('damen-gymnastik-vorstand', 'membership_requests.edit'),
    ('damen-gymnastik-vorstand', 'membership_requests.forward'),
    ('behindertensport-vorstand', 'membership_requests.view'),
    ('behindertensport-vorstand', 'membership_requests.edit'),
    ('behindertensport-vorstand', 'membership_requests.forward')
)
INSERT INTO public.admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM role_permission_map map
JOIN public.admin_roles r ON r.key = map.role_key AND r.is_active = true
JOIN public.admin_permissions p ON p.key = map.permission_key
ON CONFLICT (role_id, permission_id) DO NOTHING;

COMMIT;
