# Projektdokumentation

Diese Dokumentation bildet den aktuellen Stand der Vereinswebsite und des Adminbereichs ab.

## Struktur

- `architecture/` – technische Gesamtarchitektur (Überblick, Routen, Datenbank, Komponenten, Storage)
- `modules/` – fachliche Moduldokumente für Website und Admin
- `development/` – Entwicklungsregeln, Workflow, Deployment und Projektzustand
- `decisions/` – Architekturentscheidungen
- `roadmap.md` – aktuelle Prioritäten und nächste Phasen
- `changelog.md` – größere Meilensteine

## Leitlinie

- Dokumentation folgt immer dem Ist-Stand in Code und Datenbank.
- Größere Änderungen immer entlang der Kette Datenbank -> Service -> UI prüfen.

## Aktuell vollständig dokumentiert

- Dynamischer Footer
- Kontaktseite, Impressum, Datenschutz
- Pages-CMS (`pages`), Vereinseinstellungen (`club_settings`), Kontaktverwaltung (`club_contacts`)
- Mitglied-werden-Formular, Mitgliedsanfragen und Weiterleitung
- Vereinsgeschichte mit RichText
- News, Termine, wiederkehrende Termine, virtuelle Trainings
- Fußball-Übersichtsseiten und Mannschaftsseiten
- Vorstand, Trainer, Sponsoren
- Admin-Einstellungen
