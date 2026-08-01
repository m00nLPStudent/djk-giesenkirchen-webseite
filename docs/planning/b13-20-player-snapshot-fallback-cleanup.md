# B13.20 - Player Snapshot Fallback Cleanup

## 1. Ziel

Die letzten produktiven Player-Legacy-Fallbacks und Player-Master-Snapshot-Reads wurden aus den Runtime-Lesepfaden entfernt. Aktuelle Team-, Rueckennummer-, Positions- und Captain-Daten kommen jetzt nur noch aus `player_team_seasons`.

## 2. Geaenderte Dateien

- `src/components/admin/persons/seasonalReadModelCore.mjs`
- `src/components/admin/persons/seasonalReadModelCore.test.mjs`
- `src/components/admin/persons/playerSeasonalReadModelRepository.js`
- `src/components/admin/persons/personTeamLegacyRepository.js`
- `src/components/admin/persons/personTeamRepository.js`
- `src/components/admin/persons/serverPersonScope.js`
- `src/components/admin/persons/playerReadDto.js`
- `src/components/admin/persons/playerReadDto.test.mjs`
- `src/components/admin/players/list/playerList.helpers.js`
- `src/components/admin/players/list/playerList.helpers.test.mjs`
- `src/components/admin/players/forms/playerForm.helpers.test.mjs`
- `src/app/admin/players/page.js`
- `src/app/admin/players/actions.js`
- `src/app/admin/players/edit/[id]/page.js`
- `src/app/(website)/fussball/[slug]/page.js`
- `src/app/(website)/fussball/[slug]/spieler/[playerId]/page.js`
- `src/components/admin/topbar/adminSearch.service.js`
- `src/components/admin/teams/teamEditPlayer.repository.js`
- `src/components/website/team/teamRoster.core.mjs`
- `src/components/website/team/teamRoster.core.test.mjs`

## 3. `players.team_id`-Fallbacks

Die letzten Player-Fallbacks auf `players.team_id` sind entfernt.

- `playerSeasonalReadModelRepository.js` laedt fuer Player keine Legacy-Teamdaten mehr.
- `createPlayerSeasonalReadModel(...)` und `createPlayerSeasonalReadModelMap(...)` tragen fuer Player kein `legacyTeamId` und kein `legacyFallbackUsed` mehr.
- `personTeamRepository.js` und `serverPersonScope.js` haben keinen Player-`includeLegacyFallback`-Pfad mehr.
- `personTeamLegacyRepository.js` exportiert keinen Player-Zweig mehr und enthaelt jetzt nur noch Coach-Fallback-Logik.

Ergebnis:

- aktive Player-Runtime-Reads auf `players.team_id`: keine
- Shared-Player-Fallbacks: entfernt
- `players.team_id` Read-Status: vollstaendig deaktiviert

## 4. Trikotnummer

Aktuelle Rueckennummern kommen nur noch aus `player_team_seasons.shirt_number`.

- `playerReadDto.js` synthesisiert keine aktuelle Nummer mehr aus `players.shirt_number`.
- Admin-Liste, Suche, Player-Karten, Teamseite und Spielerprofil erhalten ihre Anzeige ueber DTOs oder assignmentbasierte Roster-Daten.
- Teamseite mappt `shirt_number` nur noch aus der aktuellen Assignment-Zeile.

Wenn keine aktuelle Zuordnung existiert, bleibt die Rueckennummer leer.

## 5. Position

Aktuelle Positionen kommen nur noch aus `player_team_seasons.position_de / position_en`.

- `playerReadDto.js` merged `players.position_de` und `players.position_en` nicht mehr als aktuelle Saisondaten ein.
- `playerList.helpers.js` nutzt nur noch Assignment-Positionen fuer Filter und Sortierung.
- `teamEditPlayer.repository.js` liest keine Position mehr aus `players`, sondern mappt sie aus dem saisonalen Player-DTO.
- Teamseite und Spielerprofil zeigen keine historische Master-Position mehr als aktuelle Saisonposition.

`players.position` und `players.jersey_number` haben keine verbleibenden Runtime-Reads mehr.

## 6. Kapitaen

Der aktuelle Captain-Status kommt nur noch aus `player_team_seasons.is_captain`.

- `playerReadDto.js` faellt nicht mehr auf `players.is_captain` zurueck.
- Listenfilter und Kartenlogik pruefen nur noch aktuelle Assignments.
- Die Teamseite zeigt Captain-Badges teambezogen aus der geladenen Roster-Relation.

Damit gibt es keine globale Player-Captain-Eigenschaft mehr im Runtime-Read-Modell.

## 7. Sortierung

`players.sort_order` bleibt nur noch als globale Player-Sortierung aktiv.

Verbleibende legitime Reads:

- `src/app/admin/players/page.js`
  - globale Admin-Listensortierung
- `src/components/admin/teams/teamEditPlayer.repository.js`
  - globale Sortierung des Team-Player-Pickers

Nicht mehr genutzt fuer Teamreihenfolge:

- Teamseite nutzt `player_team_seasons.sort_order`
- saisonale Player-Daten nutzen keine Master-Sortierung fuer aktuelle Assignment-Anzeigen

Einordnung:

- `players.sort_order` = `GLOBAL_PLAYER_SORT`
- keine verbleibende Nutzung als `TEAM_ASSIGNMENT_SORT`

## 8. Shared Legacy Repository

`src/components/admin/persons/personTeamLegacyRepository.js` ist nach B13.20 nur noch fuer Coach-Fallbacks relevant.

- der Player-Export wurde entfernt
- keine Player-Importe verbleiben
- Coach-Pfade bleiben unveraendert

Eine Umbenennung des Dateinamens wurde bewusst nicht in diesem Schritt vorgenommen, um den Scope klein zu halten.

## 9. Entfernte Reads

- `players.team_id` als Player-Read-Model-Fallback
- `players.team_id` als Person-Team-Fallback fuer Player-Scope
- `players.shirt_number` als DTO-/Anzeige-Fallback
- `players.position_de`
- `players.position_en`
- `players.is_captain`
- `players.team_id` und Snapshot-Felder aus `select("*")` in Player-Edit und Player-Profil
- Snapshot-Fallbacks auf der oeffentlichen Teamseite
- Master-Positionsread im Team-Edit-Player-Picker
- Snapshot-Reads in der Admin-Suche

## 10. Verbleibende Reads

Es bleiben keine aktiven produktiven Player-Legacy-Reads mehr fuer:

- `players.team_id`
- `players.shirt_number`
- `players.jersey_number`
- `players.position`
- `players.position_de`
- `players.position_en`
- `players.is_captain`

Verbleibender Player-Master-Read:

- `players.sort_order`
  - nur noch als globale Sortierung in Admin-Liste und Team-Player-Picker

Interner Write-Pfad-Read zur Snapshot-Erhaltung:

- `src/components/admin/players/services/playerWrite.repository.js`
  - laedt `shirt_number`, `position_de`, `position_en`, `is_captain` und `sort_order` nur noch fuer Master-Rollback, solange die temporaeren Sync-Writes aktiv bleiben

## 11. Verbleibende Writes

Temporäre Snapshot-Writes bleiben aktiv in `src/components/admin/players/services/playerSeasonalWriteCore.mjs`:

- `players.shirt_number`
- `players.position_de`
- `players.position_en`
- `players.is_captain`
- `players.sort_order`

Sie werden nicht mehr gelesen, bleiben aber vorerst als `TEMPORARY_SYNC`, bis ein separater Schritt die Write-Abschaltung final bestaetigt.

## 12. Deaktivierte Writes

Bereits deaktiviert:

- `players.team_id`
- `players.jersey_number`
- `players.position`

In diesem Schritt wurden keine weiteren Snapshot-Writes abgeschaltet.

## 13. Tests

Gezielt ausgefuehrt:

- `node --test src/components/admin/persons/seasonalReadModelCore.test.mjs src/components/admin/persons/playerReadDto.test.mjs src/components/admin/players/list/playerList.helpers.test.mjs src/components/admin/players/forms/playerForm.helpers.test.mjs src/components/admin/players/services/playerSeasonalWriteCore.test.mjs src/components/admin/players/services/playerWriteRollbackCore.test.mjs src/components/admin/teams/services/teamDelete.service.test.mjs src/components/website/team/teamRoster.core.test.mjs`
- `npm.cmd exec eslint -- <B13.20-Dateien>`

Ergebnis:

- gezielte Tests: erfolgreich
- gezieltes ESLint: erfolgreich
- `npm.cmd run lint`: projektweit weiterhin fehlerhaft ausserhalb von B13.20
- `npm.cmd run build`: scheitert weiterhin nur am bekannten Google-Fonts-Netzwerkfehler

## 14. Offene Risiken

- `players.sort_order` bleibt aktiv, solange die Admin-Spielerliste und der Team-Player-Picker eine globale Master-Sortierung nutzen.
- `playerWrite.repository.js` liest die Snapshot-Felder weiterhin fuer den kompensierenden Master-Rollback.
- Die Snapshot-Writes selbst bleiben noch aktiv und sollten erst in einem Folgeschritt deaktiviert werden.

## 15. Readiness fuer Migration

Read-seitig sind folgende Felder migrationsreif:

- `players.team_id`
- `players.shirt_number`
- `players.jersey_number`
- `players.position`
- `players.position_de`
- `players.position_en`
- `players.is_captain`

Noch nicht migrationsreif:

- `players.sort_order`
  - weil globale Admin-/Picker-Sortierung weiterhin direkt aus dem Masterdatensatz kommt

Write-seitig brauchen vor einer echten Spaltenentfernung noch einen separaten Abschalt-Schritt:

- `players.shirt_number`
- `players.position_de`
- `players.position_en`
- `players.is_captain`
- `players.sort_order`

## 16. Empfohlener naechster Schritt

B13.21 sollte die verbliebenen Player-Snapshot-Writes systematisch abschalten. Zuerst sollte entschieden werden, ob `players.sort_order` als globale Player-Sortierung fachlich bestehen bleibt oder ebenfalls in ein separates nicht-legacy Modell ueberfuehrt wird.
