# Database

## Grundsatz

Dokumentiert ist der aktuell genutzte Datenstand. Datenbankanpassungen werden immer gegen Service- und UI-Logik geprüft.

## Website/CMS-nahe Tabellen

- `club_settings` – zentrale Vereins- und Website-Grundeinstellungen
- `club_contacts` – Kontaktblöcke und Ansprechpartner
- `pages` – CMS-Seiten (u. a. Rechtstexte und Footer-Seiten)
- `club_history_pages` – Vereinsgeschichte mit RichText-Inhalten

## News

- `news` – Beiträge
- `news_documents` – Dokumente/Downloads zu News

## Events

- `events` – echte Vereinstermine inkl. Wiederholungsfeldern
- `event_documents` – Dokumente für echte Events
- Wiederholung in `events` über Felder wie `recurrence_type`, `recurrence_interval`, `recurrence_until`, `recurrence_count`

## Trainings-Runtime

- `team_training_times` – regelmäßige Trainingszeiten
- `team_training_exceptions` – Ausfälle/Verlegungen
- `club_closure_periods` – Sperrzeiten

Virtuelle Trainings werden aus diesen Tabellen zur Laufzeit berechnet und nicht als eigene Event-Datensätze gespeichert.

## Fußball/Abteilung

- `departments`, `teams`, `team_seasons`, `seasons`
- `players`, `player_team_seasons`
- `coaches`, `coach_team_seasons`
- `board_members`, `board_roles`
- `sponsors`, `sponsor_categories`

## Mitgliedschaft

- `membership_requests` – öffentliche Mitgliedsanfragen
- `membership_request_recipients` – Empfängerregeln für Weiterleitung

## Hinweise

- Keine Feature-Änderung ohne Datenbankabgleich.
- Legacy-/Fallback-Felder bleiben bis zu gezielter Bereinigung bestehen.
