# Modul: Saisons

## Status

Technisch aktiv.

## Funktionen

- Saison anlegen
- Aktuelle öffentliche Saison bestimmen
- Mannschaftsdaten pro Saison verwalten
- Spieler pro Saison zuordnen
- Trainer pro Saison zuordnen

## Datenbank

- `seasons`
- `team_seasons`
- `player_team_seasons`
- `coach_team_seasons`

## Regel

Die öffentliche Website zeigt die Saison, die im Adminbereich als öffentlich ausgewählt wurde.

## Trainer-Mannschaftsbearbeitung

Die reine Trainerrolle darf ausschließlich zugeordnete Mannschaften bearbeiten. Freigegeben sind Beschreibung, Training, Kader und Kontakt; Kaderänderungen erfordern zusätzlich `players.edit`. Stammdaten, Saison-/Jahrgangsstruktur, Wettbewerb, Providerkonfiguration, Medien sowie Mannschaften anlegen oder löschen bleiben gesperrt. Alle freigegebenen Mutationen prüfen Permission, Mannschafts- und Mannschaftssaison-Scope serverseitig vor dem Einsatz des serverseitigen Clients.
