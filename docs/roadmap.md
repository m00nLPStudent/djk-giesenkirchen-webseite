# Roadmap

## Zielbild

Die Plattform besteht aus einer weitgehend abgeschlossenen öffentlichen Vereinswebsite und einem weitgehend funktionsfähigen Admin-CMS. Der nächste Fokus liegt auf Betriebsreife und Erweiterungen ohne Bruch der bestehenden Funktionen.

## Status nach Bereichen

### Website öffentlich

Weitgehend abgeschlossen:

- dynamischer Footer
- Kontaktseite
- Impressum
- Datenschutz
- Mitglied-werden-Seite
- News (Übersicht, Detail, Dokumente)
- Termine (allgemein, Training, Detail, ICS)
- wiederkehrende Termine
- virtuelle Trainings
- Fußball-Übersichtsseiten
- Mannschaftsseiten
- Vorstand
- Trainer
- Sponsoren
- Vereinsgeschichte

### Admin

Weitgehend funktionsfähig:

- Dashboard
- News-Verwaltung
- Teams/Spieler/Trainer
- Events mit Wiederholung und Dokumenten
- Department/Vorstand
- Sponsoren
- Club-History
- zentrale Einstellungen (`club_settings`, `club_contacts`, `pages`, Mitgliedsanfragen)

## Phase 2 (später)

- Mailversand
- Mitgliedsanfragen-Historie
- Dashboard-Erinnerungen
- Cookie-Einstellungen
- Rollen/Rechte
- Performance/Deployment/Backups

## Arbeitsprinzip

- Keine größere Änderung ohne Abgleich zwischen Datenbank, Service und UI.
- Bestehende Features bleiben während Refactors unverändert.
