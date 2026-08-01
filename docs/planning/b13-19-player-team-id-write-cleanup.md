# B13.19 - Player team_id Write Cleanup

## 1. Ziel

Der Player-Admin-Formular-, Create-, Edit-, Snapshot- und Rollback-Pfad liest und schreibt `players.team_id` nicht mehr als fachliche Quelle. Die kanonische Teamzuordnung bleibt `player_team_seasons -> team_seasons -> teams`.

## 2. Geaenderte Dateien

- `src/app/admin/players/edit/[id]/page.js`
- `src/components/admin/players/forms/AdminPlayersForm.js`
- `src/components/admin/players/forms/playerForm.core.mjs`
- `src/components/admin/players/forms/playerForm.helpers.js`
- `src/components/admin/players/forms/playerForm.helpers.test.mjs`
- `src/components/admin/players/services/playerSeasonalWriteCore.mjs`
- `src/components/admin/players/services/playerSeasonalWriteCore.test.mjs`
- `src/components/admin/players/services/playerWrite.repository.js`
- `src/components/admin/players/services/playerWrite.service.js`
- `src/components/admin/players/services/playerWriteRollbackCore.mjs`
- `src/components/admin/players/services/playerWriteRollbackCore.test.mjs`

## 3. Formularinitialisierung

Das Edit-Formular nutzt jetzt nur noch das saisonale Player-Read-Model ohne Legacy-Fallback.

- `team_season_id`, `shirt_number`, `position_de`, `position_en`, `is_captain` und `assignment_sort_order` kommen nur noch aus genau einer aktiven aktuellen Assignment-Zeile.
- Ohne aktive aktuelle Zuordnung bleibt das Formular bewusst leer.
- Bei mehreren aktiven aktuellen Zuordnungen wird nichts mehr still vorbelegt; das Formular zeigt einen Blocker.
- Der bisherige Warnhinweis zu `players.team_id` wurde entfernt und durch einen neutralen Leerzustands-Hinweis ersetzt.

## 4. Create-Pfad

`savePlayer(...)` akzeptiert keine fachliche Teaminformation mehr aus `players.team_id`.

- Das Zielteam wird weiter serverseitig aus `team_season_id` aufgeloest.
- Nach dem Master-Insert wird genau eine `player_team_seasons`-Zeile erstellt.
- Scheitert die Assignment-Erstellung, wird nur der neu angelegte Player-Masterdatensatz kompensierend geloescht.

## 5. Edit-Pfad

Der Edit-Pfad laedt aktuelle Saisonzuordnungen jetzt direkt aus `player_team_seasons` fuer die aktuelle Saison und trifft alle Entscheidungen relational.

- Gleiches `team_season_id` mit geaenderten Feldern: `UPDATE`
- Gleiches `team_season_id` ohne Feldabweichung: `UNCHANGED`
- Teamwechsel ohne vorhandene Zielzeile: bisherige aktive Relation deaktivieren, neue Relation anlegen
- Teamwechsel mit vorhandener inaktiver Zielzeile: bisherige aktive Relation deaktivieren, vorhandene Relation reaktivieren

Ein Team-Entfernen ist weiterhin nicht freigeschaltet, weil `team_season_id` im Formular verpflichtend bleibt.

## 6. Reaktivierung

Der Player-Write-Core erkennt jetzt vorhandene inaktive `player_team_seasons`-Zeilen fuer dieselbe `team_season_id`.

- Kein blindes `INSERT` mehr bei vorhandenem inaktivem Datensatz
- Stattdessen `REACTIVATE` ueber `UPDATE` mit
  - `is_active = true`
  - aktualisierter Rueckennummer
  - aktualisierten Positionsfeldern
  - aktualisiertem `is_captain`
  - aktualisiertem `sort_order`

Damit wird der bestehende Unique-Constraint respektiert.

## 7. Master-Payload

`buildPlayerMasterPayload(...)` schreibt `players.team_id` nicht mehr.

- Read-Status `players.team_id`: deaktiviert im Player-Write-Pfad
- Write-Status `players.team_id`: deaktiviert

Verbleibende temporaere Legacy-Snapshots im Master-Payload:

- `players.shirt_number`
- `players.position_de`
- `players.position_en`
- `players.is_captain`
- `players.sort_order`
- `players.photo_url`

Diese Felder sind jetzt zentral in `buildPlayerLegacySnapshotPayload(...)` gekapselt und werden nicht mehr fuer Teamentscheidungen oder Rollbacks verwendet.

## 8. Rollback-Strategie

Es gibt weiterhin keine echte DB-Transaktion; der Pfad arbeitet mit kompensierenden Rollbacks.

- Assignment-Rollback:
  - basiert ausschliesslich auf expliziten Snapshots der aktuellen `player_team_seasons`-Zeilen
  - stellt deaktivierte, aktualisierte und reaktivierte Zeilen gezielt wieder her
  - schaltet neu eingefuegte Zeilen bei Rollback auf `is_active = false`
- Master-Rollback:
  - basiert ausschliesslich auf dem zuvor geladenen `players`-Masterdatensatz
  - synthetisiert keine Teamzuordnung mehr aus `players.team_id`

## 9. Scope

Die Scope-Logik bleibt unveraendert fachlich serverseitig erzwungen.

- `players.create` und `players.edit` bleiben Pflicht
- Zielteam kommt aus `team_season_id -> team_seasons.team_id`
- `players.team_id` erweitert keine Rechte und dient nicht als Fallback

## 10. Entfernte `players.team_id`-Reads

- `src/app/admin/players/edit/[id]/page.js`
  - kein `includeLegacyFallback: true` mehr beim saisonalen Edit-Read-Model
- `src/components/admin/players/forms/playerForm.helpers.js`
  - kein Formular-Fallback mehr von `players.team_id` auf `team_season_id`
- `src/components/admin/players/services/playerWrite.service.js`
  - keine Assignment-Entscheidung, keine Snapshot-Wiederherstellung und kein Rollback mehr ueber `players.team_id`

## 11. Verbleibende `players.team_id`-Reads

Es bleiben nur noch geteilte, nicht mehr vom Player-Form-/Write-Pfad angeforderte Legacy-Fallbacks:

- `src/components/admin/persons/playerSeasonalReadModelRepository.js`
  - kann `players.team_id` weiterhin lesen, falls andere Module explizit `includeLegacyFallback: true` setzen
- `src/components/admin/persons/personTeamLegacyRepository.js`
  - enthaelt weiterhin den alten generischen Player-Fallback, hat in diesem Slice aber keinen aktiven Player-Consumer

## 12. `players.team_id`-Write-Status

`players.team_id` wird in diesem Schritt nicht mehr geschrieben.

- Kein Write im Create-Pfad
- Kein Write im Edit-Pfad
- Kein Write im Rollback-Pfad
- Kein Write-Snapshot im Master-Payload

## 13. Andere Legacy-Snapshots

`players.photo_url` und die assignmentnahen Snapshot-Felder bleiben bewusst temporaer erhalten.

Konkrete noch aktive Consumer:

- `src/components/admin/persons/playerReadDto.js`
  - Fallback fuer `shirt_number`, `position_*`, `is_captain` und `sort_order`
- `src/app/admin/players/page.js`
  - Admin-Liste selektiert die Snapshot-Felder weiterhin im Master-Query
- `src/app/(website)/fussball/[slug]/page.js`
  - Teamseiten-Fallback, falls relationale Assignment-Felder in einzelnen Zeilen leer sind

## 14. Tests

Gezielt ausgefuehrt:

- `node --test src/components/admin/players/forms/playerForm.helpers.test.mjs src/components/admin/players/services/playerSeasonalWriteCore.test.mjs src/components/admin/players/services/playerWriteRollbackCore.test.mjs`
- `npm.cmd exec eslint -- <B13.19-Player-Dateien>`

Ergebnis:

- gezielte Tests: erfolgreich
- gezieltes ESLint: erfolgreich
- `npm.cmd run lint`: fehlgeschlagen wegen bestehender projektweiter React-Hook-/`<img>`-Lintfehler ausserhalb von B13.19
- `npm.cmd run build`: fehlgeschlagen nur wegen des bekannten Google-Fonts-Netzwerkfehlers (`Geist`, `Geist Mono`)

## 15. Offene Risiken

- `playerSeasonalReadModelRepository.js` und `personTeamLegacyRepository.js` enthalten weiterhin generische Player-Legacy-Fallbacks fuer andere oder spaetere Consumer.
- `players.shirt_number`, `players.position_*`, `players.is_captain` und `players.sort_order` bleiben noch temporaere Snapshot-Writes.
- Team-Entfernen ist weiterhin nicht unterstuetzt, weil das Formular eine aktuelle `team_season_id` verlangt.

## 16. Readiness fuer Datenbankmigration

Fuer den Player-Form-/Write-Pfad ist `players.team_id` jetzt migrationsreif.

Vor einer echten Spaltenentfernung sollten noch erledigt werden:

1. alle verbliebenen Shared-Fallback-Pfade (`playerSeasonalReadModelRepository.js`, `personTeamLegacyRepository.js`) abschalten oder loeschen
2. bestaetigen, dass kein anderes Modul mehr `includeLegacyFallback: true` fuer Player aktiviert
3. die verbleibenden Snapshot-Fallbacks fuer `shirt_number`, `position_*`, `is_captain` und `sort_order` separat abloesen

## 17. Empfohlener naechster Schritt

B13.20 sollte die letzten geteilten Player-Legacy-Fallback-Repositories entfernen und danach die verbleibenden Player-Snapshot-Fallbacks (`shirt_number`, `position_*`, `is_captain`, `sort_order`) systematisch abbauen.
