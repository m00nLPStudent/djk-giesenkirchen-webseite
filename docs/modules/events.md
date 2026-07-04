# Events Modul

Dokumentation für Termine und Veranstaltungen.

## Quellen

- [Football Modul (Legacy)](football.md)
- [Department Modul (Legacy)](department.md)

## Status

- Termine sind als eigener Website-Bereich verfügbar.
- Öffentliche Termine sind getrennt in:
  - Übersicht `/termine`
  - Trainingstermine `/termine/training`
  - Allgemeine Termine `/termine/allgemein`
- Detailseiten existieren für:
  - echte Events über `/termine/[slug]`
  - virtuelle Trainings über `/termine/training/[occurrenceId]`
- Event-Dokumente, Wiederholungen, Karten-Links und Kalenderexporte sind integriert.

## Enthaltene Funktionen

- klassische Events aus `public.events`
- wiederkehrende Termine ohne eigene Recurrence-Tabelle
- Event-Dokumente über `event_documents`
- Kalenderexport / Kalender-Links für echte Events
- Google-Maps-Link auf Event- und Trainingsdetailseiten
- virtuelle Trainings aus Team-Trainingszeiten
- Zusammenführung von echten Events und virtuellen Trainings für ausgewählte Übersichten

## Wiederkehrende Termine

Das Events-Modul unterstützt wiederkehrende Termine direkt in der Tabelle `events`.

### Felder

- `recurrence_type` (`none`, `daily`, `weekly`, `monthly`, `yearly`)
- `recurrence_interval` (Intervall, mindestens `1`)
- `recurrence_until` (optionales Enddatum der Serie)
- `recurrence_count` (optionale maximale Anzahl Wiederholungen)

### Admin

- Im Event-Editor gibt es im Bereich `Datum & Zeit` den Abschnitt `Wiederholung`.
- Wiederholungsfelder sind nur sichtbar, wenn der Typ nicht `Keine Wiederholung` ist.

### Website

- Die Termin-Detailseite zeigt einen Wiederholungshinweis, wenn Wiederholung aktiv ist.
- Die Seite `/termine/allgemein` erzeugt zukünftige und vergangene Vorkommen zur Laufzeit.
- Wiederholte Vorkommen werden **nicht** als eigene Datensätze gespeichert.

### Architektur

Die Wiederholungslogik ist zentral in `src/lib/events.js` gekapselt, insbesondere:

- `getNextOccurrence()`
- `expandRecurringEvents()`
- `formatRecurrenceText()`

## Event-Dokumente

- Echte Events können beliebig viele Dokumente über `event_documents` erhalten.
- Im Admin erfolgt die Verwaltung direkt im Event-Editor über den Dokumente-Reiter.
- Die öffentliche Event-Detailseite zeigt nur öffentliche Dokumente.

## Kalenderexport

- Echte Events unterstützen:
  - ICS-Download
  - Google-Kalender-Link
  - Outlook-Kalender-Link
- Virtuelle Trainings unterstützen diese Exporte aktuell **nicht**.

## Google Maps

- Echte Events und virtuelle Trainings verwenden den gemeinsamen Maps-Helper.
- Der Link wird nur angezeigt, wenn ausreichend Ortsdaten vorhanden sind.

## Virtuelle Trainings

Virtuelle Trainings werden **nicht** in `events` gespeichert.

Stattdessen werden sie zur Laufzeit aus folgenden Tabellen berechnet:

- `team_training_times`
- `team_training_exceptions`
- `club_closure_periods`

Relevante Runtime-Funktionen in `src/lib/events.js`:

- `getTrainingOccurrences()`
- `applyTrainingExceptions()`
- `applyClubClosurePeriods()`
- `getVirtualTrainingEvents()`
- `mergeEventsWithVirtualTrainings()`

Eigenschaften virtueller Trainings:

- `is_virtual = true`
- `source_type = team_training`
- besitzen `occurrence_id` statt Event-Slug als Detailanker
- können Mannschaftsmetadaten wie `team_id`, `team_slug`, `team_season_id` enthalten

## Öffentliche Routen

- `/termine`: Landingpage mit Auswahl zwischen Trainings- und allgemeinen Terminen
- `/termine/training`: virtuelle Trainings mit Zeitraumfilter
- `/termine/allgemein`: echte Events mit kommend / vergangen
- `/termine/[slug]`: echte Event-Detailseite
- `/termine/training/[occurrenceId]`: virtuelle Trainings-Detailseite
- `/termine/[slug]/ics`: ICS-Export für echte Events

## Dashboard-Anbindung

- Das Admin-Dashboard kombiniert echte zukünftige Events mit virtuellen Trainings.
- Virtuelle Trainings erhalten dort **keinen** Event-Edit-Link.
- Wenn möglich, wird stattdessen auf die zugehörige Mannschaft verlinkt.

## Bekannte offene Punkte

- keine Dokumente für virtuelle Trainings
- kein ICS-/Google-/Outlook-Kalenderexport für virtuelle Trainings
- keine eigenständige Admin-Verwaltung für `club_closure_periods` im aktuellen Stand
- Runtime-Logik liegt weiterhin konzentriert in `src/lib/events.js` und sollte später intern weiter aufgeteilt werden
