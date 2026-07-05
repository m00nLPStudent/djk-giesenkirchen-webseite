# Modul: Fußball

## Status

Mannschaftsmodul, Abteilungsmodul und Sponsorenmodul abgeschlossen. Fußball-Übersichtsseiten und Mannschaftsgruppen sind umgesetzt.

## Öffentliche Funktionen

- Fußballbereich auf der öffentlichen Website
- Fußball-Übersichtsseite `/fussball`
- Mannschaftsübersicht `/fussball/mannschaften`
- Mannschaftsgruppen `/fussball/mannschaften/junioren`, `/senioren`, `/damen`
- Mannschaftsdetailseiten
- Saisonfähige Mannschaftsdaten
- Spieler pro Saison zuordnen
- Trainer pro Saison zuordnen
- Trainingsinformationen
- Kontaktbereich
- Spielbetrieb-Reiter
- fussball.de Spielplan und Tabelle technisch vorbereitet
- Abteilungsübersicht
- separate Vorstandsseite
- separate Trainer- und Betreuerseite
- Sponsorenbereich mit Mannschaftssponsoren, Bannersponsoren und allgemeinen Sponsoren
- Vereinsgeschichte im Fußballbereich (`/fussball/vereinsgeschichte`)

## Admin-Funktionen

- Mannschaften erstellen und bearbeiten
- Spieler und Trainer saisonabhängig zuordnen
- Vorstandsmitglieder erstellen, bearbeiten und löschen
- Vorstandsfunktionen über Datenbank-Dropdown auswählen
- englische Funktionsbezeichnung automatisch übernehmen
- Sponsoren erstellen, bearbeiten und löschen
- Sponsor-Kategorie auswählen
- Sponsor-Banner hochladen
- Sponsor-Webseite und Social-Media-Links pflegen
- zentrales Löschmodul für Vorstandsmitglieder und Sponsoren

## Datenbank

- `teams`
- `team_templates`
- `seasons`
- `team_seasons`
- `player_team_seasons`
- `coach_team_seasons`
- `board_members`
- `board_roles`
- `sponsor_categories`
- `sponsors`

## Wiederverwendbare Komponenten

Abteilung:

- `DepartmentPageLayout`
- `DepartmentPersonCard`
- `DepartmentPersonGrid`
- `department.helpers.js`

Sponsoren:

- `SponsorCard`
- `SponsorBanner`
- `SponsorActions`
- `SponsorGrid`
- `SponsorSection`
- `SponsorTabs`
- `SocialLinks`

## Offene Punkte

- Finale fussball.de Darstellungsabstimmung auf Live-Domain.
