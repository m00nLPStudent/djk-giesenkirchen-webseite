# Modul: Fußball

## Status

Mannschaftsmodul und Abteilungsmodul abgeschlossen. fussball.de Integration ist technisch vorbereitet und wird final auf der Live-Domain geprüft.

## Öffentliche Funktionen

- Fußballbereich auf der öffentlichen Website
- Mannschaftsdetailseiten
- Saisonfähige Mannschaftsdaten
- Spieler pro Saison zuordnen
- Trainer pro Saison zuordnen
- Trainingsinformationen
- Kontaktbereich
- Spielbetrieb-Reiter
- fussball.de Spielplan und Tabelle als aufklappbare Kacheln
- Abteilungsübersicht
- separate Vorstandsseite
- separate Trainer- und Betreuerseite

## Admin-Funktionen

- Mannschaften erstellen und bearbeiten
- Spieler und Trainer saisonabhängig zuordnen
- Vorstandsmitglieder erstellen, bearbeiten und löschen
- Vorstandsfunktionen über Datenbank-Dropdown auswählen
- englische Funktionsbezeichnung automatisch übernehmen
- zentrales Löschmodul für Vorstandsmitglieder

## Datenbank

- `teams`
- `team_templates`
- `seasons`
- `team_seasons`
- `player_team_seasons`
- `coach_team_seasons`
- `board_members`
- `board_roles`

## Wiederverwendbare Komponenten

- `DepartmentPageLayout`
- `DepartmentPersonCard`
- `DepartmentPersonGrid`
- `department.helpers.js`

## Pausiert

Die finale fussball.de Darstellung wird erst auf der Live-Domain getestet.
