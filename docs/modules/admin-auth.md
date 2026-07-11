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

## B3 Rollenverwaltung (admin_roles)

Route:

- /admin/roles

Umfang:

- Rollenliste aus admin_roles mit Name, Key, Beschreibung, Status, Sortierung und erstellt am
- Zusatzwerte je Rolle: Anzahl Benutzerzuweisungen und Anzahl zugewiesener Permissions
- Statistik-Karten: Rollen gesamt, aktiv/inaktiv, zugewiesene Benutzerrollen, Permissions gesamt
- Suche, Statusfilter und Sortierung (sort_order, name, created_at)
- Detaildialog mit Read-Only-Ansicht fuer Benutzerliste und Permissionliste je Rolle
- Rolle erstellen und bearbeiten (Name, Key, Beschreibung, Sortierung, Aktiv)
- Aktivieren/Deaktivieren von Rollen

Besonderheit:

- superadmin kann in B3 nicht deaktiviert werden (vereinfachter Schutz)

Technische Struktur:

- src/app/admin/roles/page.js
- src/app/admin/roles/actions.js
- src/components/admin/roles/
  - components/
  - forms/
  - hooks/
  - helpers/
  - services/

Repository-Erweiterung:

- src/lib/admin-auth/adminRoles.repository.js
  - Rolle nach Key laden
  - Rolle erstellen
  - Rolle aktualisieren
  - Rollenstatus aktiv/inaktiv setzen

Weiterhin nicht umgesetzt:

- Permissions einer Rolle bearbeiten
- Benutzerzuweisung zu Rollen bearbeiten
- Sidebar-Rechtefilter nach Permissions
- Route-Guards
- Login-/Logout-Anpassung

## B4 Permission-Verwaltung und Matrix

Routen:

- /admin/permissions
- /admin/permissions/matrix

Umfang:

- Permissions-Liste aus admin_permissions mit Name, Key, Beschreibung, Kategorie, Rollenanzahl und erstellt am
- Statistik-Karten: Permissions gesamt, Kategorien gesamt, zugeordnete Rollen-Permissions, nicht zugeordnete Permissions
- Suche, Kategorie-Filter und Sortierung (category/name/created_at/key)
- Detaildialog fuer Permission mit Rollenliste (Read Only)
- Permission erstellen und bearbeiten (Name, Key, Beschreibung, Kategorie)

Matrix:

- Rollen-Permission-Matrix als eigene Route
- Permissions nach Kategorie gruppiert
- Rollen als Spalten (Desktop) bzw. bedienbare Kartenstruktur (Mobile)
- Checkboxen speichern Zuordnungen in admin_role_permissions (setzen/entfernen)

Ergaenzte B4-Datenzugriffsschicht:

- src/lib/admin-auth/adminPermissions.repository.js
  - Permission nach Key laden
  - Permission erstellen
  - Permission aktualisieren
  - Role-Permission-Links laden
  - Role-Permission-Link setzen/entfernen

Wichtige Abgrenzung (weiterhin offen):

- keine Sidebar-Filterung nach Permissions
- keine Route-Guards
- keine Permission-Enforcement-Logik in UI/Routes
- keine Login-/Logout-Anpassung

## B5 Permission-Engine (vorbereitet, nicht enforced)

Ziel von B5:

- Technische Permission-Engine vorbereiten
- Route-/Nav-/Action-Konfiguration zentralisieren
- Komponenten/Hooks fuer spaetere UI-Pruefungen bereitstellen
- Ohne aktive Sperrung von Adminseiten

Zentraler Schalter:

- AUTH_ENFORCEMENT_ENABLED = false
- Datei: src/lib/admin-auth/adminPermissionConfig.js

Solange false:

- alle Admin-Routen bleiben erreichbar
- Sidebar und Dashboard-Action-Buttons bleiben sichtbar
- Guard-Strukturen blockieren nicht

Neue B5-Dateien:

- src/lib/admin-auth/adminPermissionConfig.js
- src/lib/admin-auth/permissionConfig.js
- src/lib/admin-auth/permissionFallbacks.js
- src/lib/admin-auth/permissionEngine.js
- src/lib/admin-auth/permissionGuards.js
- src/components/admin/auth/Can.js
- src/components/admin/auth/usePermissions.js
- src/components/admin/auth/AdminRouteGuard.js
- src/app/admin/unauthorized/page.js

Vorbereitete Funktionalitaet:

- hasPermission / hasAnyPermission / hasAllPermissions
- canAccessAdminRoute
- canSeeAdminNavItem
- canSeeDashboardAction
- getUserPermissionKeys
- Route-Guard-Entscheidungsstruktur (Session/Permission)

Config-Inhalte:

- Admin-Routen und benoetigte Permissions
- Sidebar-Items mit Permission-Metadaten
- Dashboard-Quick-Actions mit Permission-Metadaten
- Fallback-Verhalten bei unbekannten Eintraegen

Weiterhin nicht umgesetzt:

- aktive Sidebar-Filterung nach Permissions (nur vorbereitet)
- aktive Route-Guards/Redirects
- aktive Permission-Enforcement-Logik im UI
- Login-/Logout-Enforcement

Naechste Schritte:

- B6: Auth-User-Erzeugung und Session-Datenfluss stabilisieren
- B7: Enforcement schrittweise aktivieren (zuerst soft, dann strikt)

## B6 Login/Logout/Auth-Flow vorbereitet (noch nicht verpflichtend)

Neuer Schalter:

- AUTH_REQUIRED_FOR_ADMIN = false
- Datei: src/lib/admin-auth/adminAuthConfig.js

Solange false:

- /admin und alle Admin-Unterseiten bleiben erreichbar
- keine automatische Login-Weiterleitung
- keine Sperrung bei fehlender Session/fehlendem Profil

Neue Auth-Services und Helpers:

- src/lib/admin-auth/adminSession.service.js
  - getCurrentSession
  - getCurrentUser
  - getCurrentAdminProfile
  - getCurrentAdminContext
  - updateLastLoginAt

Neue Auth-Routen:

- /admin/login

## B11.1 Login ist verpflichtend, Enforcement bleibt aus

Zentraler Status:

- `AUTH_REQUIRED_FOR_ADMIN = true`
- `AUTH_ENFORCEMENT_ENABLED = false`

Wirkung von B11.1:

- Der gesamte Adminbereich verlangt nun eine Login-Session.
- `/admin/login`, `/admin/forgot-password`, `/admin/set-password` und `/admin/unauthorized` bleiben ohne Session erreichbar.
- Fehlende Session wird nach `/admin/login?redirect=/admin/...` umgeleitet.
- Session vorhanden, aber kein `admin_profiles`-Datensatz: Weiterleitung nach `/admin/unauthorized?reason=missing-admin-profile`.
- Inaktive Admin-Profile: Weiterleitung nach `/admin/unauthorized?reason=inactive-user`.
- Rollenrechte werden noch nicht erzwungen; aktive Admins ohne Enforcement können weiterhin alle Adminseiten technisch öffnen.

## B11.1.1 Zentrale Schutzschicht fuer den gesamten Adminbereich

Umgesetzt ueber eine zentrale Proxy-Schicht:

- alle `/admin/:path*`-Routen werden vor dem Rendern geprueft
- fehlende Session fuehrt direkt zu `/admin/login?redirect=/admin/...`
- fehlendes Profil oder inaktiver Account fuehrt direkt zu `/admin/unauthorized`
- `AUTH_ENFORCEMENT_ENABLED = false` bleibt unveraendert und betrifft weiter nur Permissions, nicht die Login-Pflicht
- aktive Datei: [`src/proxy.js`](../../src/proxy.js)

Nächste Phase:

- B11.2: Permission-Enforcement aktivieren (Sidebar, Buttons, Route-Pruefungen)
- /admin/forgot-password (vorbereiteter Reset-Flow)
- /admin/unauthorized (bereits vorhanden)

## B11.2a Route-/Permission-Mapping und Audit abgesichert (ohne Enforcement)

Zentraler Status:

- `AUTH_REQUIRED_FOR_ADMIN = true`
- `AUTH_ENFORCEMENT_ENABLED = false`

Wirkung von B11.2a:

- Die zentrale Route-Permission-Map wurde auf reale Adminrouten erweitert und deterministisch priorisiert.
- Dynamische Segmente (`:id` und `[id]`) werden zentral aufgeloest.
- Spezifische Unterrouten (`new`, `edit`, `matrix`) matchen vor Elternrouten.
- Sidebar- und Dashboard-Metadaten wurden vorbereitet, ohne aktive Filterung.

Wichtig in B11.2a:

- Keine zusaetzlichen Redirects wegen fehlender Permission.
- Keine zusaetzliche Sperrung von Server Actions.
- Keine Sidebar-Filterung und keine Dashboard-Filterung.
- Keine Aenderung an SQL oder Datenbankstruktur.

Superadmin-Verhalten:

- Superadmin wird weiterhin zentral als globaler Bypass behandelt.
- Erkennung basiert auf `role.key === "superadmin"` und beruecksichtigt Mehrfachrollen.

Regression und Stabilisierung:

- Waehrend der Einfuehrung des Permission-Enforcements traten Regressionen im Adminbereich auf.
- Die Runtime ist anschliessend wieder stabilisiert worden, ohne Auth-Guard oder Login-Pflicht zurueckzunehmen.
- Die Stabilisierung erfolgte durch:
  - `AUTH_ENFORCEMENT_ENABLED = false`
  - vollstaendigen Clean-Rebuild mit geloeschtem `.next`-Verzeichnis
  - Neustart von Next.js
  - Neustart des Cloudflare Tunnels
  - Aktualisierung der Tunnel-URLs in Supabase
- Beobachtet wurden zwischenzeitlich `ChunkLoadError`-Meldungen und fehlgeschlagene `/_next/static`-Requests. Diese werden nur als Symptom der Regression dokumentiert, nicht als eindeutig bewiesene alleinige Hauptursache.

Status B11.2a:

- ✓ Auth Guard produktiv
- ✓ Login Redirect produktiv
- ✓ Middleware produktiv
- ✓ vollstaendiges Route Mapping
- ✓ vollstaendiges Permission Mapping
- ✓ Runtime stabil
- ✓ `AUTH_REQUIRED_FOR_ADMIN = true`
- ✓ `AUTH_ENFORCEMENT_ENABLED = false`

Audit-Helper:

- Script: `npm.cmd run audit:admin-routes`
- Quelle: `scripts/admin-route-permission-audit.js`
- Ausgabe zeigt:
  - gemappte reale Adminrouten mit Pattern, Permission, Match-Typ, Prioritaet
  - oeffentliche Auth-Routen
  - ungemappte Routen
  - konfigurierte Pattern ohne reale `page.*`-Datei
  - doppelte oder ueberlappende Patterns

Bekannte Routen ohne reale `page.*`-Datei (derzeit nur konfiguriert):

- `/admin/media`
- `/admin/tournaments`
- `/admin/settings/pages`
- `/admin/settings/pages/new`
- `/admin/settings/pages/[id]/edit`

UI-Integration:

- ProfileMenu nutzt vorbereitete Session-/Context-Ladung
- Logout ueber echte signOut-Struktur vorbereitet
- Bei fehlendem User neutraler Zustand im Menü

## Seed-Vorschlag

SQL-Vorschlag fuer Standardrollen, Standardpermissions und Role-Permission-Mapping:

- docs/sql/admin-auth-seed.sql

Hinweis: Die Datei wird nicht automatisch ausgefuehrt.

## Naechste Schritte

- B2: Benutzerverwaltung auf Basis von admin_profiles und admin_user_roles
- B3: Rollen- und Permission-Pflegeoberflaeche
- B4: Rechte in Sidebar und UI sichtbar machen
- B5: Route-Guards und serverseitiger Zugriffsschutz
