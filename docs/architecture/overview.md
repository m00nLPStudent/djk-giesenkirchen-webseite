# Architecture Overview

Dieser Bereich beschreibt die Gesamtarchitektur der Plattform.

## Primäre Quellen

- [Architecture (Legacy)](../architecture.md)
- [Architecture Overview (Legacy)](../architecture-overview.md)
- [Frontend Architecture (Legacy)](../frontend-architecture.md)
- [Backend Architecture (Legacy)](../backend-architecture.md)
- [Admin Architecture (Legacy)](../admin-architecture.md)

## Kurzüberblick

- Next.js App Router mit klarer Trennung zwischen Website und Admin.
- UI in modulare Komponenten unter src/components gegliedert.
- Datenzugriff und Storage über Supabase.
- Feature-nahe Services in den jeweiligen Modulen, gemeinsame Hilfen in src/lib.
