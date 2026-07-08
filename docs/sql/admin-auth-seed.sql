-- Phase B1 seed proposal for admin roles and permissions.
-- Do not run automatically.

-- 1) Roles
insert into admin_roles (key, name, description, sort_order, is_active)
values
  ('superadmin', 'Superadmin', 'Voller Zugriff auf alle Bereiche und Einstellungen.', 10, true),
  ('vorstand', 'Vorstand', 'Breiter redaktioneller und organisatorischer Zugriff.', 20, true),
  ('fussball-vorstand', 'Fussball-Vorstand', 'Verwaltung der Fussballbereiche.', 30, true),
  ('jugendleiter', 'Jugendleiter', 'Verantwortlich fuer Jugendinhalte und Teams.', 40, true),
  ('trainer', 'Trainer', 'Pflege teamnaher Inhalte.', 50, true),
  ('betreuer', 'Betreuer', 'Unterstuetzende Teamverwaltung mit eingeschraenkten Rechten.', 60, true),
  ('redakteur', 'Redakteur', 'Pflege und Veroeffentlichung redaktioneller Inhalte.', 70, true),
  ('kassierer', 'Kassierer', 'Verwaltung von mitgliedsnahen Verwaltungsdaten.', 80, true),
  ('webmaster', 'Webmaster', 'Technische und strukturelle Pflege des CMS.', 90, true),
  ('gast', 'Gast', 'Lesender Zugriff auf freigegebene Admin-Uebersichten.', 100, true)
on conflict (key) do update
set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  updated_at = now();

-- 2) Permissions
insert into admin_permissions (key, name, description, category)
values
  ('dashboard.view', 'Dashboard ansehen', 'Dashboard lesen', 'dashboard'),

  ('news.view', 'News ansehen', 'News lesen', 'news'),
  ('news.create', 'News erstellen', 'News anlegen', 'news'),
  ('news.edit', 'News bearbeiten', 'News bearbeiten', 'news'),
  ('news.delete', 'News loeschen', 'News loeschen', 'news'),
  ('news.publish', 'News veroeffentlichen', 'News veroeffentlichen', 'news'),

  ('events.view', 'Termine ansehen', 'Termine lesen', 'events'),
  ('events.create', 'Termine erstellen', 'Termine anlegen', 'events'),
  ('events.edit', 'Termine bearbeiten', 'Termine bearbeiten', 'events'),
  ('events.delete', 'Termine loeschen', 'Termine loeschen', 'events'),
  ('events.publish', 'Termine veroeffentlichen', 'Termine veroeffentlichen', 'events'),

  ('teams.view', 'Teams ansehen', 'Teams lesen', 'teams'),
  ('teams.create', 'Teams erstellen', 'Teams anlegen', 'teams'),
  ('teams.edit', 'Teams bearbeiten', 'Teams bearbeiten', 'teams'),
  ('teams.delete', 'Teams loeschen', 'Teams loeschen', 'teams'),

  ('players.view', 'Spieler ansehen', 'Spieler lesen', 'players'),
  ('players.create', 'Spieler erstellen', 'Spieler anlegen', 'players'),
  ('players.edit', 'Spieler bearbeiten', 'Spieler bearbeiten', 'players'),
  ('players.delete', 'Spieler loeschen', 'Spieler loeschen', 'players'),

  ('coaches.view', 'Trainer ansehen', 'Trainer lesen', 'coaches'),
  ('coaches.create', 'Trainer erstellen', 'Trainer anlegen', 'coaches'),
  ('coaches.edit', 'Trainer bearbeiten', 'Trainer bearbeiten', 'coaches'),
  ('coaches.delete', 'Trainer loeschen', 'Trainer loeschen', 'coaches'),

  ('sponsors.view', 'Sponsoren ansehen', 'Sponsoren lesen', 'sponsors'),
  ('sponsors.create', 'Sponsoren erstellen', 'Sponsoren anlegen', 'sponsors'),
  ('sponsors.edit', 'Sponsoren bearbeiten', 'Sponsoren bearbeiten', 'sponsors'),
  ('sponsors.delete', 'Sponsoren loeschen', 'Sponsoren loeschen', 'sponsors'),

  ('club_history.view', 'Vereinsgeschichte ansehen', 'Vereinsgeschichte lesen', 'club_history'),
  ('club_history.edit', 'Vereinsgeschichte bearbeiten', 'Vereinsgeschichte bearbeiten', 'club_history'),
  ('club_history.publish', 'Vereinsgeschichte veroeffentlichen', 'Vereinsgeschichte veroeffentlichen', 'club_history'),

  ('settings.view', 'Einstellungen ansehen', 'Einstellungen lesen', 'settings'),
  ('settings.edit', 'Einstellungen bearbeiten', 'Einstellungen bearbeiten', 'settings'),

  ('membership_requests.view', 'Mitgliedsanfragen ansehen', 'Mitgliedsanfragen lesen', 'membership_requests'),
  ('membership_requests.edit', 'Mitgliedsanfragen bearbeiten', 'Mitgliedsanfragen bearbeiten', 'membership_requests'),
  ('membership_requests.forward', 'Mitgliedsanfragen weiterleiten', 'Mitgliedsanfragen weiterleiten', 'membership_requests'),

  ('users.view', 'Benutzer ansehen', 'Benutzer lesen', 'users'),
  ('users.create', 'Benutzer erstellen', 'Benutzer anlegen', 'users'),
  ('users.edit', 'Benutzer bearbeiten', 'Benutzer bearbeiten', 'users'),
  ('users.delete', 'Benutzer loeschen', 'Benutzer loeschen', 'users'),

  ('roles.view', 'Rollen ansehen', 'Rollen lesen', 'roles'),
  ('roles.edit', 'Rollen bearbeiten', 'Rollen bearbeiten', 'roles'),

  ('permissions.view', 'Permissions ansehen', 'Permissions lesen', 'permissions'),
  ('permissions.edit', 'Permissions bearbeiten', 'Permissions bearbeiten', 'permissions'),

  ('system.view', 'Systembereich ansehen', 'Systeminformationen lesen', 'system')
on conflict (key) do update
set
  name = excluded.name,
  description = excluded.description,
  category = excluded.category,
  updated_at = now();

-- 3) Role -> Permission mapping
with role_permission_map(role_key, permission_key) as (
  values
    -- superadmin: full access
    ('superadmin', 'dashboard.view'),
    ('superadmin', 'news.view'), ('superadmin', 'news.create'), ('superadmin', 'news.edit'), ('superadmin', 'news.delete'), ('superadmin', 'news.publish'),
    ('superadmin', 'events.view'), ('superadmin', 'events.create'), ('superadmin', 'events.edit'), ('superadmin', 'events.delete'), ('superadmin', 'events.publish'),
    ('superadmin', 'teams.view'), ('superadmin', 'teams.create'), ('superadmin', 'teams.edit'), ('superadmin', 'teams.delete'),
    ('superadmin', 'players.view'), ('superadmin', 'players.create'), ('superadmin', 'players.edit'), ('superadmin', 'players.delete'),
    ('superadmin', 'coaches.view'), ('superadmin', 'coaches.create'), ('superadmin', 'coaches.edit'), ('superadmin', 'coaches.delete'),
    ('superadmin', 'sponsors.view'), ('superadmin', 'sponsors.create'), ('superadmin', 'sponsors.edit'), ('superadmin', 'sponsors.delete'),
    ('superadmin', 'club_history.view'), ('superadmin', 'club_history.edit'), ('superadmin', 'club_history.publish'),
    ('superadmin', 'settings.view'), ('superadmin', 'settings.edit'),
    ('superadmin', 'membership_requests.view'), ('superadmin', 'membership_requests.edit'), ('superadmin', 'membership_requests.forward'),
    ('superadmin', 'users.view'), ('superadmin', 'users.create'), ('superadmin', 'users.edit'), ('superadmin', 'users.delete'),
    ('superadmin', 'roles.view'), ('superadmin', 'roles.edit'),
    ('superadmin', 'permissions.view'), ('superadmin', 'permissions.edit'),
    ('superadmin', 'system.view'),

    -- vorstand
    ('vorstand', 'dashboard.view'),
    ('vorstand', 'news.view'), ('vorstand', 'news.create'), ('vorstand', 'news.edit'), ('vorstand', 'news.publish'),
    ('vorstand', 'events.view'), ('vorstand', 'events.create'), ('vorstand', 'events.edit'), ('vorstand', 'events.publish'),
    ('vorstand', 'teams.view'), ('vorstand', 'teams.create'), ('vorstand', 'teams.edit'),
    ('vorstand', 'players.view'), ('vorstand', 'players.create'), ('vorstand', 'players.edit'),
    ('vorstand', 'coaches.view'), ('vorstand', 'coaches.create'), ('vorstand', 'coaches.edit'),
    ('vorstand', 'sponsors.view'), ('vorstand', 'sponsors.create'), ('vorstand', 'sponsors.edit'),
    ('vorstand', 'club_history.view'), ('vorstand', 'club_history.edit'), ('vorstand', 'club_history.publish'),
    ('vorstand', 'settings.view'), ('vorstand', 'membership_requests.view'), ('vorstand', 'membership_requests.forward'),

    -- fussball-vorstand
    ('fussball-vorstand', 'dashboard.view'),
    ('fussball-vorstand', 'news.view'), ('fussball-vorstand', 'news.create'), ('fussball-vorstand', 'news.edit'), ('fussball-vorstand', 'news.publish'),
    ('fussball-vorstand', 'events.view'), ('fussball-vorstand', 'events.create'), ('fussball-vorstand', 'events.edit'), ('fussball-vorstand', 'events.publish'),
    ('fussball-vorstand', 'teams.view'), ('fussball-vorstand', 'teams.create'), ('fussball-vorstand', 'teams.edit'),
    ('fussball-vorstand', 'players.view'), ('fussball-vorstand', 'players.create'), ('fussball-vorstand', 'players.edit'),
    ('fussball-vorstand', 'coaches.view'), ('fussball-vorstand', 'coaches.create'), ('fussball-vorstand', 'coaches.edit'),
    ('fussball-vorstand', 'sponsors.view'), ('fussball-vorstand', 'sponsors.edit'),
    ('fussball-vorstand', 'club_history.view'), ('fussball-vorstand', 'club_history.edit'),

    -- jugendleiter
    ('jugendleiter', 'dashboard.view'),
    ('jugendleiter', 'news.view'), ('jugendleiter', 'news.create'), ('jugendleiter', 'news.edit'),
    ('jugendleiter', 'events.view'), ('jugendleiter', 'events.create'), ('jugendleiter', 'events.edit'),
    ('jugendleiter', 'teams.view'), ('jugendleiter', 'teams.edit'),
    ('jugendleiter', 'players.view'), ('jugendleiter', 'players.create'), ('jugendleiter', 'players.edit'),
    ('jugendleiter', 'coaches.view'), ('jugendleiter', 'coaches.create'), ('jugendleiter', 'coaches.edit'),

    -- trainer
    ('trainer', 'dashboard.view'),
    ('trainer', 'teams.view'), ('trainer', 'teams.edit'),
    ('trainer', 'players.view'), ('trainer', 'players.edit'),
    ('trainer', 'events.view'), ('trainer', 'events.create'), ('trainer', 'events.edit'),

    -- betreuer
    ('betreuer', 'dashboard.view'),
    ('betreuer', 'teams.view'),
    ('betreuer', 'players.view'), ('betreuer', 'players.edit'),
    ('betreuer', 'events.view'),

    -- redakteur
    ('redakteur', 'dashboard.view'),
    ('redakteur', 'news.view'), ('redakteur', 'news.create'), ('redakteur', 'news.edit'), ('redakteur', 'news.publish'),
    ('redakteur', 'events.view'), ('redakteur', 'events.create'), ('redakteur', 'events.edit'), ('redakteur', 'events.publish'),
    ('redakteur', 'club_history.view'), ('redakteur', 'club_history.edit'), ('redakteur', 'club_history.publish'),
    ('redakteur', 'sponsors.view'),

    -- kassierer
    ('kassierer', 'dashboard.view'),
    ('kassierer', 'settings.view'), ('kassierer', 'settings.edit'),
    ('kassierer', 'membership_requests.view'), ('kassierer', 'membership_requests.edit'), ('kassierer', 'membership_requests.forward'),

    -- webmaster
    ('webmaster', 'dashboard.view'),
    ('webmaster', 'news.view'), ('webmaster', 'news.edit'),
    ('webmaster', 'events.view'), ('webmaster', 'events.edit'),
    ('webmaster', 'teams.view'), ('webmaster', 'players.view'), ('webmaster', 'coaches.view'),
    ('webmaster', 'sponsors.view'), ('webmaster', 'club_history.view'),
    ('webmaster', 'settings.view'), ('webmaster', 'settings.edit'),
    ('webmaster', 'users.view'), ('webmaster', 'users.edit'),
    ('webmaster', 'roles.view'),
    ('webmaster', 'permissions.view'),
    ('webmaster', 'system.view'),

    -- gast
    ('gast', 'dashboard.view'),
    ('gast', 'news.view'),
    ('gast', 'events.view'),
    ('gast', 'club_history.view')
)
insert into admin_role_permissions (role_id, permission_id)
select r.id, p.id
from role_permission_map map
join admin_roles r on r.key = map.role_key
join admin_permissions p on p.key = map.permission_key
on conflict (role_id, permission_id) do nothing;
