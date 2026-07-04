# Events Modul

Dokumentation für Termine und Veranstaltungen.

## Quellen

- [Football Modul (Legacy)](football.md)
- [Department Modul (Legacy)](department.md)

## Status

- Termine sind als Website-Bereich verfügbar.
- Weitere Spezialisierung für Event-Workflows bleibt möglich.

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
- Die Terminübersicht erzeugt zukünftige und vergangene Vorkommen zur Laufzeit.
- Wiederholte Vorkommen werden **nicht** als eigene Datensätze gespeichert.

### Architektur

Die gesamte Wiederholungslogik ist zentral in `src/lib/events.js` gekapselt, insbesondere:

- `getNextOccurrence()`
- `expandRecurringEvents()`
- `formatRecurrenceText()`
