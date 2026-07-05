# Modul: Teams

## Status

Abgeschlossen, modularisiert und in Website sowie Admin integriert.

## Öffentliche Funktionen

- Mannschaftsübersicht (`/fussball/mannschaften`)
- Gruppenansichten (Junioren, Senioren, Damen)
- Team-Detailseiten (`/fussball/[slug]`)
- Teambereiche:
  - Hero und Intro
  - Trainingsinformationen
  - Kontakt
  - Kader
  - Spielbetrieb inklusive Tabelle/Widgets

## Responsive Verhalten

- mobile-first einspaltige Team-Informationsblöcke
- Tabs als horizontal scrollbare Leiste ohne Seiten-Overflow
- Tabellen mit lokalem `overflow-x-auto`

## Admin-Funktionen

- Mannschaften pflegen
- Saisonzuordnung (`team_seasons`)
- Spieler- und Trainerzuordnungen pro Saison
- Trainingszeiten und Ausnahmen pflegen

## Tabellen

- `teams`
- `team_seasons`
- `seasons`
- `players`
- `player_team_seasons`
- `coaches`
- `coach_team_seasons`
- `team_training_times`
- `team_training_exceptions`
- `club_closure_periods`

## Hinweis

Legacy-Trainingsfelder bleiben aus Kompatibilitätsgründen vorhanden, die Laufzeitlogik nutzt strukturierte Trainingsdaten.
