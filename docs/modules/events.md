# Modul: Events

## Status

Umgesetzt und aktiv genutzt.

## Öffentliche Funktionen

- `/termine` als Landingpage
- `/termine/training` für virtuelle Trainings
- `/termine/allgemein` für allgemeine Events
- `/termine/[slug]` für echte Event-Detailseiten
- `/termine/training/[occurrenceId]` für virtuelle Trainings-Details
- `/termine/[slug]/ics` als ICS-Export für echte Events

## Umgesetzte Funktionen

- Event-Dokumente
- wiederkehrende Termine
- Kalenderexport (ICS/Google/Outlook) für echte Events
- Google-Maps-Links
- virtuelle Trainings aus strukturierten Trainingszeiten
- Zusammenführung von echten Events und virtuellen Trainings in Übersichten

## Datenbasis

- `events`
- `event_documents`
- `team_training_times`
- `team_training_exceptions`
- `club_closure_periods`

## Architekturhinweis

Wiederholungen und virtuelle Trainings werden zur Laufzeit berechnet. Es werden keine zusätzlichen Event-Zeilen für jedes Vorkommen gespeichert.

## Offene Punkte (später)

- keine Dokumente für virtuelle Trainings
- kein Kalenderexport für virtuelle Trainings
- keine eigene Admin-Oberfläche für `club_closure_periods`
