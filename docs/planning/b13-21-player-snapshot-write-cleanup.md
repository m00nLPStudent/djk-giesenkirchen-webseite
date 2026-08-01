# B13.21 - Player Snapshot Write Cleanup

## 1. Ziel

Die letzten Player-Master-Snapshot-Writes wurden abgeschaltet. Team- und saisonbezogene Playerdaten werden jetzt ausschliesslich in `player_team_seasons` geschrieben. `players.sort_order` wurde nicht als separates Zielmodell beibehalten, sondern komplett durch eine stabile natuerliche globale Sortierung ersetzt.

## 2. Geaenderte Dateien

- `src/components/admin/players/services/playerSeasonalWriteCore.mjs`
- `src/components/admin/players/services/playerSeasonalWriteCore.test.mjs`
- `src/components/admin/players/services/playerWrite.repository.js`
- `src/components/admin/players/list/playerList.helpers.js`
- `src/components/admin/players/list/playerList.helpers.test.mjs`
- `src/app/admin/players/page.js`
- `src/components/admin/teams/teamEditPlayer.repository.js`

## 3. Snapshot-Writes vorher

Vor B13.21 spiegelte `buildPlayerMasterPayload(...)` weiterhin folgende Assignment-Werte in den Masterdatensatz:

- `players.shirt_number`
- `players.position_de`
- `players.position_en`
- `players.is_captain`
- `players.sort_order`

Zusatzabhaengigkeiten:

- `loadPlayerMasterRecord(...)` las dieselben Felder fuer den Master-Rollback.
- die Admin-Spielerliste und der Team-Player-Picker nutzten `players.sort_order` als globale Master-Sortierung.

## 4. Trikotnummer

Entscheidung:

- `players.shirt_number` wird nicht mehr geschrieben
- `players.shirt_number` wird nicht mehr fuer Rollback gelesen
- fachliche Quelle ist ausschliesslich `player_team_seasons.shirt_number`

Auswirkung:

- Create, Edit, Teamwechsel und Reaktivierung schreiben Rueckennummern nur noch in Assignment-Payloads.

## 5. Position

Entscheidung:

- `players.position_de` und `players.position_en` werden nicht mehr geschrieben
- diese Felder werden auch nicht mehr fuer den Master-Rollback gelesen
- `players.position` bleibt deaktiviert

Fachliche Quelle:

- `player_team_seasons.position_de`
- `player_team_seasons.position_en`

## 6. Kapitaen

Entscheidung:

- `players.is_captain` wird nicht mehr geschrieben
- `players.is_captain` wird nicht mehr fuer Master-Rollback gelesen

Fachliche Quelle:

- `player_team_seasons.is_captain`

Der Kapitaensstatus bleibt damit strikt team- und saisonbezogen.

## 7. `players.sort_order`-Entscheidung

Gewaehlte Variante: Variante 2.

`players.sort_order` wird weder als globale Admin-Sortierung noch als Snapshot weitergefuehrt. Die verbleibende teambezogene Reihenfolge liegt bereits korrekt in `player_team_seasons.sort_order`.

Begruendung:

- es gibt keinen nachweisbaren fachlichen Bedarf fuer eine separate globale manuelle Spielerreihenfolge im Master
- die bisherigen Runtime-Reads waren rein administrative Listen-/Picker-Sortierung
- eine stabile natuerliche Sortierung nach Name ist die einfachste fachlich korrekte Loesung

## 8. Admin-Sortierung

Die Admin-Spielerliste nutzt jetzt eine stabile globale Sortierung nach:

- `last_name`
- `first_name`
- `id`

`players.sort_order` wird dort nicht mehr gelesen und nicht mehr angefordert.

## 9. Team-Playerpicker

Der Team-Player-Picker nutzt fuer die verfuegbare globale Spielerauswahl ebenfalls dieselbe natuerliche Sortierung:

- `last_name`
- `first_name`
- `id`

Teamreihenfolgen innerhalb einer Mannschaft bleiben weiterhin assignmentbasiert ueber `player_team_seasons.sort_order`.

## 10. Master-Payload

Aus `buildPlayerMasterPayload(...)` entfernt:

- `shirt_number`
- `position_de`
- `position_en`
- `is_captain`
- `sort_order`

Der Masterdatensatz enthaelt damit wieder nur echte Player-Stammdaten.

## 11. Rollback

Rollback-Verhalten nach B13.21:

- Assignment-Rollback bleibt unveraendert ueber exakte `player_team_seasons`-Snapshots
- Master-Rollback stellt nur noch echte Player-Stammdaten wieder her
- keine teambezogenen Snapshotfelder werden mehr aus dem Player-Master restauriert

## 12. Deaktivierte Writes

In diesem Schritt deaktiviert:

- `players.shirt_number`
- `players.position_de`
- `players.position_en`
- `players.is_captain`
- `players.sort_order`

## 13. Verbleibende Writes

Keine verbleibenden Player-Master-Snapshot-Writes.

Assignment-Writes bleiben fachlich aktiv in `player_team_seasons` fuer:

- `shirt_number`
- `position_de`
- `position_en`
- `is_captain`
- `sort_order`

## 14. Tests

Gezielt abgedeckt:

- Master-Payload enthaelt keine Assignment-Snapshotfelder mehr
- Master-Rollback enthaelt keine Assignment-Snapshotfelder mehr
- Assignment-Payload schreibt weiterhin Rueckennummer, Position, Kapitaensstatus und Sortierung
- natuerliche globale Sortierung ist stabil ohne `players.sort_order`
- bestehende Assignment-/Rollback-Regressionstests bleiben gruen

## 15. Offene Risiken

- Es gibt keine verbliebenen produktiven Player-Master-Reads/Writes fuer diese Snapshot-Felder mehr.
- Projektweite Lint-Fehler ausserhalb von B13.21 bleiben weiterhin bestehen.
- Ein spaeteres DB-Removal sollte trotzdem koordiniert mit historischen Altwerten und eventuell externen Reports erfolgen, auch wenn der Runtime-Code diese Felder nicht mehr nutzt.

## 16. Readiness fuer Datenbankmigration

Player-seitig sind jetzt read- und write-seitig migrationsreif:

- `players.shirt_number`
- `players.position_de`
- `players.position_en`
- `players.is_captain`
- `players.sort_order`

Bereits zuvor migrationsreif:

- `players.team_id`
- `players.jersey_number`
- `players.position`

## 17. Empfohlener naechster Schritt

Naechster sinnvoller Schritt ist die uebergeordnete Legacy-Removal- bzw. Datenbank-Migrationsplanung fuer die nun vollständig entkoppelten Player-Master-Felder. Wenn vor dem eigentlichen DB-Schritt noch ein technischer Sicherheitsdurchgang gewuenscht ist, sollte er sich auf einen finalen Runtime-Sweep ueber `src/` und eventuell externe Reports konzentrieren, nicht mehr auf Player-Write-Pfade.
