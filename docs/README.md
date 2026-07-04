# Projektdokumentation

Diese Dokumentation beschreibt Architektur, Module, Entwicklungsabläufe und den aktuellen Projektstand der Plattform der DJK/VfL Giesenkirchen 05/09 e.V.

## Zielstruktur

- `architecture/` – Gesamtarchitektur, Routen, Komponenten, Datenbank und Supabase-Storage
- `modules/` – fachliche Modulbeschreibungen (News, Teams, Spieler, Trainer, Sponsoren, Vorstand, Events)
- `decisions/` – zentrale Architekturentscheidungen
- `development/` – Coding-Regeln, Workflow und Deployment-Hinweise
- `roadmap.md` – mittel- und langfristige Planung
- `changelog.md` – wesentliche Änderungen
- `todo.md` – aktuelle Arbeitspunkte

## Legacy-Dokumente

Vorhandene Root-Dokumente (z. B. `architecture-overview.md`, `database.md`, `coding-guidelines.md`) bleiben erhalten und werden schrittweise in die Zielstruktur überführt.

## Grundregel

Keine größere Änderung ohne Abgleich zwischen Datenbank, Service-Logik und UI.
