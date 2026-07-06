# Modul: Admin Auth und Rollenmodell

## Ziel

Phase B1 bereitet das technische Fundament fuer Benutzer- und Rollenverwaltung vor, ohne bereits UI-Schutz oder Login-Flows umzubauen.

## Tabellen (bereits in Supabase vorhanden)

- admin_profiles
- admin_roles
- admin_permissions
- admin_role_permissions
- admin_user_roles

## Modell

- Rollen geben den fachlichen Rahmen vor (z. B. Vorstand, Trainer, Redakteur).
- Permissions steuern konkrete Aktionen (z. B. news.publish, users.edit).
- Ein Benutzer kann mehrere Rollen haben.
- Permissions eines Benutzers werden aus allen zugewiesenen Rollen abgeleitet.

## B1-Service-Schicht

- src/lib/admin-auth/adminRoles.repository.js
- src/lib/admin-auth/adminAuth.service.js
- src/lib/admin-auth/adminAuth.helpers.js
- src/lib/admin-auth/adminPermissions.js

Vorbereitete Funktionen:

- admin_profiles laden
- admin_roles laden
- admin_permissions laden
- Rollen eines Users laden
- Permissions eines Users ableiten
- Aktivstatus eines Users pruefen

## B2 Benutzerverwaltung (Admin-Profile)

Route:

- /admin/users

Umfang:

- Liste aller vorhandenen Admin-Profile aus admin_profiles
- Anzeige von Name, E-Mail, Status, primaerer Rolle, weiteren Rollen, letzter Login, erstellt am
- Detailansicht je Benutzer inklusive Rollen und Permissions (Read Only)
- Aktivieren/Deaktivieren von Admin-Profilen ueber admin_profiles.is_active
- Dialog "Neuer Benutzer" als vorbereitete Oberflaeche ohne Auth-User-Erzeugung

Filter und Sortierung:

- Suche (Name, E-Mail, Rollen)
- Statusfilter (aktiv/inaktiv)
- Rollenfilter
- Sortierung (Name, erstellt, letzter Login)

Stat-Karten:

- Benutzer gesamt
- Aktive Benutzer
- Inaktive Benutzer
- Rollen gesamt

Technische Struktur:

- src/app/admin/users/page.js
- src/app/admin/users/actions.js
- src/components/admin/users/
	- components/
	- forms/
	- dialogs/
	- hooks/
	- helpers/
	- services/

Ergaenzte Datenzugriffsschicht:

- src/lib/admin-auth/adminProfiles.repository.js
- src/lib/admin-auth/userRoles.repository.js

Wichtige Abgrenzung (weiterhin offen):

- keine Login-/Logout-Anpassung
- keine Sidebar-Filterung nach Rollen
- keine Route-Guards
- keine Permission-Pruefungen im UI
- keine neuen Datenbanktabellen

## Seed-Vorschlag

SQL-Vorschlag fuer Standardrollen, Standardpermissions und Role-Permission-Mapping:

- docs/sql/admin-auth-seed.sql

Hinweis: Die Datei wird nicht automatisch ausgefuehrt.

## Naechste Schritte

- B2: Benutzerverwaltung auf Basis von admin_profiles und admin_user_roles
- B3: Rollen- und Permission-Pflegeoberflaeche
- B4: Rechte in Sidebar und UI sichtbar machen
- B5: Route-Guards und serverseitiger Zugriffsschutz
