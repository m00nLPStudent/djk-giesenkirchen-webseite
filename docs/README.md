# Projektdokumentation

Diese Dokumentation beschreibt den finalen Stand der öffentlichen Website (Responsive Release) und den aktuellen Stand des Admin-CMS.

## Leitlinien

- Dokumentation folgt strikt dem Ist-Stand im Code.
- Keine Legacy-/Duplikat-Dokumente als zweite Wahrheit.
- Bei Änderungen gilt immer: Datenmodell -> Service/Lib -> UI -> Doku.

## Struktur

- `architecture/`
  - [architecture/overview.md](architecture/overview.md)
  - [architecture/routes.md](architecture/routes.md)
  - [architecture/components.md](architecture/components.md)
  - [architecture/database.md](architecture/database.md)
  - [architecture/navigation.md](architecture/navigation.md)
  - [architecture/responsive.md](architecture/responsive.md)
  - [architecture/supabase-storage.md](architecture/supabase-storage.md)
- `modules/`
  - [modules/website.md](modules/website.md)
  - [modules/membership.md](modules/membership.md)
  - [modules/admin-auth.md](modules/admin-auth.md)
  - [modules/news.md](modules/news.md)
  - [modules/events.md](modules/events.md)
  - [modules/teams.md](modules/teams.md)
  - [modules/settings.md](modules/settings.md)
  - [modules/department.md](modules/department.md)
  - [modules/club-history.md](modules/club-history.md)
  - [modules/shared-components.md](modules/shared-components.md)
  - [modules/admin-framework.md](modules/admin-framework.md)
- `development/`
  - [development/coding-rules.md](development/coding-rules.md)
  - [development/workflow.md](development/workflow.md)
  - [development/deployment.md](development/deployment.md)
  - [development/project-health.md](development/project-health.md)
- `decisions/`
  - [decisions/architecture-decisions.md](decisions/architecture-decisions.md)
- Historie
  - [changelog.md](changelog.md)

## Abdeckung

Vollständig dokumentiert sind:

- Architektur und finale Routing-Struktur
- Mobile-first Responsive-Verhalten je Zielbreite
- Navigation/Header/Burger-Menü
- Komponentenlandschaft (Website + Admin Shared)
- Datenmodell
- Membership, News, Teams, Events, Settings
- Admin-Auth und Benutzerverwaltung im Adminbereich (/admin/users)
- Rollenverwaltung im Adminbereich (/admin/roles)
- Permission-Verwaltung inkl. Matrix im Adminbereich (/admin/permissions)
- Permission-Engine/Guard-Struktur vorbereitet (Enforcement aktuell deaktiviert)
- Login/Logout/Auth-Flow im Adminbereich vorbereitet (AUTH_REQUIRED_FOR_ADMIN = false)
- Durchgeführte Modularisierungs- und Refactoring-Schritte
