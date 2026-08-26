# Modul: Events

## Status

Abgeschlossen, modularisiert und aktiv genutzt.

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
- mobile responsive Karten- und Detaillayouts

## Datenbasis

- `events`
- `event_documents`
- `team_training_times`
- `team_training_exceptions`
- `club_closure_periods`

## Architekturhinweis

Wiederholungen und virtuelle Trainings werden zur Laufzeit berechnet. Es werden keine zusätzlichen Event-Zeilen für jedes Vorkommen gespeichert.

Die autorisierte Adminübersicht lädt auch unveröffentlichte Entwürfe über einen serverseitigen Admin-Read. Öffentliche Eventabfragen bleiben ausdrücklich auf `is_published = true` begrenzt. Create/Edit und Publish sind getrennt autorisiert: Ein Statuswechsel verlangt zusätzlich `events.publish`.
