# Changelog

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
