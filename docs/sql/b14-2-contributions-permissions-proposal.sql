-- B14.2 contributions permissions proposal
-- Proposal only. Do not execute automatically.

BEGIN;

INSERT INTO public.admin_permissions (key, name, description, category)
VALUES
  ('contributions.view', 'Vereinsbeitraege ansehen', 'Vereinsbeitraege lesen', 'contributions'),
  ('contributions.create', 'Vereinsbeitraege erstellen', 'Beitragspositionen anlegen', 'contributions'),
  ('contributions.edit', 'Vereinsbeitraege bearbeiten', 'Beitragspositionen bearbeiten', 'contributions'),
  ('contributions.record_payment', 'Zahlungen buchen', 'Zahlungen zu Vereinsbeitraegen erfassen', 'contributions'),
  ('contributions.cancel_payment', 'Zahlungen stornieren', 'Gebuchte Zahlungen stornieren', 'contributions'),
  ('contributions.defer', 'Beitraege stunden', 'Beitragspositionen stunden', 'contributions'),
  ('contributions.exempt', 'Beitraege befreien', 'Beitragspositionen befreien', 'contributions'),
  ('contributions.cancel', 'Beitraege stornieren', 'Beitragspositionen fachlich stornieren', 'contributions'),
  ('contributions.export', 'Beitraege exportieren', 'CSV-Exporte fuer Vereinsbeitraege', 'contributions')
ON CONFLICT (key) DO NOTHING;

WITH role_permission_map(role_key, permission_key) AS (
  VALUES
    ('superadmin', 'contributions.view'),
    ('superadmin', 'contributions.create'),
    ('superadmin', 'contributions.edit'),
    ('superadmin', 'contributions.record_payment'),
    ('superadmin', 'contributions.cancel_payment'),
    ('superadmin', 'contributions.defer'),
    ('superadmin', 'contributions.exempt'),
    ('superadmin', 'contributions.cancel'),
    ('superadmin', 'contributions.export'),

    ('kassierer', 'contributions.view'),
    ('kassierer', 'contributions.create'),
    ('kassierer', 'contributions.edit'),
    ('kassierer', 'contributions.record_payment'),
    ('kassierer', 'contributions.cancel_payment'),
    ('kassierer', 'contributions.defer'),
    ('kassierer', 'contributions.exempt'),
    ('kassierer', 'contributions.cancel'),
    ('kassierer', 'contributions.export'),

    ('vorstand', 'contributions.view'),
    ('vorstand', 'contributions.export')
)
INSERT INTO public.admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM role_permission_map AS map
JOIN public.admin_roles AS r ON r.key = map.role_key
JOIN public.admin_permissions AS p ON p.key = map.permission_key
ON CONFLICT (role_id, permission_id) DO NOTHING;

COMMIT;
