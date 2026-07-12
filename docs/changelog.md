# Changelog

## 2026-07-11

### Phase B11.2b-1 UI-Sichtbarkeit nach Permissions aktiviert (Enforcement bleibt aus)

- `AUTH_REQUIRED_FOR_ADMIN = true` bleibt aktiv
- `AUTH_ENFORCEMENT_ENABLED = false` bleibt aktiv
- Sidebar-Eintraege werden nun rein UI-seitig nach vorhandenen View-Permissions gefiltert
- Dashboard-Quick-Actions werden nun rein UI-seitig nach `requiredPermission` gefiltert
- Dashboard-Statistikkarten mit `requiredPermission` werden nun rein UI-seitig gefiltert
- sichtbare Neu-/Bearbeiten-/Löschen-/Matrix-/Speichern-Aktionen in den Adminmodulen werden nun nach bestehenden Permissions ausgeblendet
- noch kein Route-Enforcement und keine neuen Redirects
- Proxy, Middleware, Server Actions, Datenservices, SQL und RLS bleiben in dieser Phase unverändert
- nächste Phase: B11.2b-2 mit kontrollierter Absicherung einzelner Routen

### Phase B11.2a Route-/Permission-Mapping vollstaendig und auditierbar (Enforcement aus)

- `AUTH_REQUIRED_FOR_ADMIN = true` bleibt aktiv
- `AUTH_ENFORCEMENT_ENABLED = false` bleibt aktiv
- zentrale Route-Permission-Map in `src/lib/admin-auth/adminPermissionConfig.js` auf reale Adminrouten erweitert
- deterministisches Matching eingefuehrt: `resolveAdminRoutePermission(pathname)`
- dynamische Segmente (`:id`, `[id]`), `new`/`edit`, verschachtelte Unterrouten, Query-Parameter und Trailing-Slash werden robust verarbeitet
- Match-Reihenfolge abgesichert (spezifische Routen vor Elternrouten)
- Development-Diagnostik im Proxy erweitert: Log von `pathname`, `routePattern`, `permission`, `matched`, `isSuperadmin`
- unbekannte Adminrouten werden in Development gewarnt, aber nicht blockiert (weil Enforcement aus)
- Audit-Script hinzugefuegt: `npm.cmd run audit:admin-routes`
- Dashboard-Metadaten fuer spaetere Filterung vorbereitet (`requiredPermission` bei Stat-Items), ohne aktuelle UI-Filterung
- keine SQL-Aenderungen, keine Datenbankmigrationen, keine Public-Website-Anpassungen
- Regression nach der Einfuehrung des Permission-Enforcements vollstaendig behoben
- Runtime-Endzustand wieder stabil mit `AUTH_ENFORCEMENT_ENABLED = false`
- Stabilisierung gegengeprueft ueber Clean-Rebuild, Next.js-Neustart, Cloudflare-Tunnel-Neustart und aktualisierte Tunnel-URLs in Supabase
- Beobachtete `ChunkLoadError`-Meldungen und fehlgeschlagene `/_next/static`-Requests nur als Symptom dokumentiert, nicht als abschliessend bewiesene Einzelursache
- Erfolgreich gegengepruefte Module:
  - Benutzer
  - Rollen
  - Rechte
  - Matrix
  - Profil
  - News
  - Termine
  - Mannschaften
  - Trainer
  - Spieler
  - Sponsoren
  - Vereinsgeschichte
  - Einstellungen

### Phase B11.2 Rollen und Permissions produktiv durchgesetzt

- `AUTH_ENFORCEMENT_ENABLED = true` aktiviert
- zentrale Routenpruefung in `src/proxy.js` erweitert: fehlende Permission blockiert jetzt vor dem Rendern
- fehlende Route-Permission wird nach `/admin/unauthorized?reason=missing-permission&permission=<key>` umgeleitet
- `ADMIN_ROUTE_PERMISSIONS` fuer konkrete Admin-Unterrouten vervollstaendigt (new/edit/matrix/profile)
- unscharfe Zuordnungen auf spezifische Keys korrigiert (`permissions.view` statt `system.view`)
- unbekannte Routen/Nav/Dashboard-Actions werden im Enforcement nicht mehr pauschal erlaubt
- serverseitige Permission-Assertion fuer mutierende Actions hinzugefuegt:
  - `roles.edit` fuer Rollen-Schreiboperationen
  - `permissions.edit` fuer Permission-/Matrix-Schreiboperationen
  - `users.create`/`users.edit` fuer Benutzer-Schreiboperationen
- Sidebar und Dashboard-Schnellzugriffe lesen jetzt den echten Admin-Kontext statt statischem Fallback

### Phase B11.1.1 Zentrale Auth-Pflicht fuer den Adminbereich

- zentrale Middleware schirmt nun den gesamten Adminbereich vor dem Rendern ab
- ausgeloggte Besucher werden sicher nach `/admin/login?redirect=/admin/...` umgeleitet
- Admin-Profile und Aktivstatus werden serverseitig vor dem Rendern geprueft
- `AUTH_REQUIRED_FOR_ADMIN = true` bleibt aktiv, `AUTH_ENFORCEMENT_ENABLED = false` bleibt unveraendert

### Phase B11.1 Admin-Login verpflichtend aktiviert

- `AUTH_REQUIRED_FOR_ADMIN = true` gesetzt
- `AUTH_ENFORCEMENT_ENABLED = false` beibehalten
- `/admin` und Unterseiten verlangen jetzt eine Login-Session
- Fehlende Session wird sicher nach `/admin/login?redirect=/admin/...` umgeleitet
- Inaktive oder profillose Admin-Accounts werden nach `/admin/unauthorized` geleitet
- `/admin/login`, `/admin/forgot-password`, `/admin/set-password` und `/admin/unauthorized` bleiben erreichbar
- Permission-Enforcement bleibt bewusst aus; B11.2 folgt separat

## 2026-07-06

### Phase B6 Login/Logout/Auth-Flow vorbereitet (nicht verpflichtend)

- Auth-Schalter `AUTH_REQUIRED_FOR_ADMIN = false` eingefuehrt
- Session- und Auth-Kontext-Service unter `src/lib/admin-auth/adminSession.service.js` ergänzt
- Route `/admin/login` mit vorbereitetem Supabase-Login-Flow hinzugefuegt
- Route `/admin/forgot-password` mit vorbereitetem Reset-Flow hinzugefuegt
- ProfileMenu mit echter Logout-Struktur (signOut) und neutralem Fallback-Zustand erweitert
- AdminRouteGuard fuer spaetere Session-/Profil-/Aktivstatus-Pruefung vorbereitet
- Weiterhin keine verpflichtende Sperrung des Adminbereichs

### Phase B5 Permission-Engine vorbereitet (Enforcement aus)

- Permission-Engine, Guard-Strukturen und Fallbacks unter `src/lib/admin-auth/` vorbereitet
- Zentrale Permission-Config mit Schalter `AUTH_ENFORCEMENT_ENABLED = false` eingefuehrt
- Komponenten/Hooks fuer spaetere UI-Pruefung vorbereitet: `Can`, `usePermissions`, `AdminRouteGuard`
- Sidebar-Items und Dashboard-Quick-Actions mit Permission-Metadaten erweitert (ohne aktive Filterung)
- Route `/admin/unauthorized` als statische Info-Seite vorbereitet
- Weiterhin keine aktive Sperrung: alle Admin-Seiten bleiben erreichbar

### Phase B4 Permission-Verwaltung und Matrix

- Neue Admin-Route `/admin/permissions` mit modularer Permission-Verwaltung hinzugefuegt
- Neue Admin-Route `/admin/permissions/matrix` fuer Rollen-Permission-Zuordnungen hinzugefuegt
- Permissions-Liste mit Suche, Kategorie-Filter und Sortierung umgesetzt
- Statistik-Karten fuer Permissions, Kategorien und Zuordnungsstatus integriert
- Detaildialog sowie Erstellen/Bearbeiten fuer Permissions implementiert
- Matrix speichert Zuordnungen in `admin_role_permissions` (setzen/entfernen)
- Sidebar und Dashboard-Schnellzugriffe um "Rechte" erweitert
- Weiterhin offen: Sidebar-Rechtefilter, Route-Guards, systemweite Permission-Enforcement-Logik, Login/Logout

### Phase B3 Rollenverwaltung (admin_roles)

- Neue Admin-Route `/admin/roles` mit modularer Rollenverwaltung hinzugefuegt
- Rollenliste mit Suche, Statusfilter und Sortierung umgesetzt
- Statistik-Karten fuer Rollen, aktive/inaktive Rollen, Benutzerzuweisungen und Permissions ergänzt
- Detaildialog mit Read-Only-Ansicht fuer Benutzer und Permissions je Rolle implementiert
- Rolle erstellen/bearbeiten (Name, Key, Beschreibung, Sortierung, Aktiv) implementiert
- Aktivieren/Deaktivieren von Rollen implementiert
- Schutz in B3: Rolle `superadmin` kann nicht deaktiviert werden
- Sidebar und Dashboard-Schnellzugriffe um "Rollen" erweitert
- Weiterhin offen: Permission-Zuordnung bearbeiten, Benutzerzuweisung bearbeiten, Sidebar-Rechte, Route-Guards, Login/Logout

### Phase B2 Benutzerverwaltung (Admin-Profile)

- Neue Admin-Route `/admin/users` mit modularer Benutzerverwaltung hinzugefuegt
- Liste mit Suche, Status-/Rollenfilter und Sortierung implementiert
- Stat-Karten fuer Benutzer gesamt, aktiv/inaktiv und Rollen gesamt integriert
- Detaildialog mit Rollen und abgeleiteten Permissions (Read Only) umgesetzt
- Aktivieren/Deaktivieren von Admin-Profilen vorbereitet und angebunden
- Dialog "Neuer Benutzer" als B6-Vorbereitung ohne Auth-User-Erzeugung angelegt
- Sidebar und Dashboard-Schnellzugriffe um "Benutzer" erweitert

### Phase B1 vorbereitende Auth-/Rollenstruktur

- Service-Schicht fuer Admin-Auth/Rollen unter `src/lib/admin-auth/` vorbereitet
- Rollen-/Permission-Konstanten und Helper fuer spaetere Guards angelegt
- SQL-Seed-Vorschlag fuer Standardrollen und Permissions dokumentiert (`docs/sql/admin-auth-seed.sql`)
- Modul-Dokumentation fuer Admin-Auth hinzugefuegt (`docs/modules/admin-auth.md`)

## 2026-07-05

### Public website and admin settings finalized

Großer Meilenstein:

- öffentliche Website fachlich weitgehend abgeschlossen
- dynamischer Footer, Kontaktseite, Impressum, Datenschutz umgesetzt
- Pages-CMS, `club_settings` und `club_contacts` aktiv integriert
- Mitglied-werden-Formular und Mitgliedsanfragen mit Weiterleitungslogik umgesetzt
- Vereinsgeschichte mit RichText in Website und Admin umgesetzt
- News, Termine, wiederkehrende Termine und virtuelle Trainings stabil integriert
- Fußball-Übersichtsseiten und Mannschaftsseiten final strukturiert
- Vorstand, Trainer und Sponsoren produktiv angebunden
- Admin-Einstellungen als zentrale Pflegeoberfläche abgeschlossen

## Frühere Meilensteine

- Projektbasis mit Next.js App Router und Supabase aufgebaut
- modulare Admin-Bausteine eingeführt
- saisonfähige Mannschaftsstruktur umgesetzt
- Events-Modul um Wiederholung, Dokumente und virtuelle Trainings erweitert
