-- STATUS:
-- STILL REQUIRED
-- MANUAL EXECUTION AFTER REVIEW
-- Reason: closes remaining role-permission gaps for the agreed B12 final role model.

-- B12.2c Abschlusskorrektur
-- Idempotenter SQL-Entwurf fuer fehlende Rollen-Permission-Verknuepfungen.
-- Nicht automatisch ausfuehren.

WITH missing_links(role_key, permission_key) AS (
  VALUES
    ('vorstand', 'teams.delete'),
    ('vorstand', 'players.delete'),
    ('vorstand', 'coaches.delete'),
    ('fussball-vorstand', 'teams.delete'),
    ('fussball-vorstand', 'players.delete'),
    ('fussball-vorstand', 'coaches.delete'),
    ('fussball-vorstand', 'sponsors.create'),
    ('fussball-vorstand', 'settings.view'),
    ('jugendleiter', 'teams.delete'),
    ('jugendleiter', 'players.delete'),
    ('jugendleiter', 'coaches.delete'),
    ('jugendleiter', 'settings.view')
)
INSERT INTO public.admin_role_permissions (role_id, permission_id)
SELECT roles.id, permissions.id
FROM missing_links
JOIN public.admin_roles AS roles
  ON roles.key = missing_links.role_key
JOIN public.admin_permissions AS permissions
  ON permissions.key = missing_links.permission_key
ON CONFLICT (role_id, permission_id) DO NOTHING;
