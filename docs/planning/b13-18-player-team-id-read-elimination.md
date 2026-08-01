# B13.18 - Player team_id Read Elimination

## 1. Ziel

Die produktiven Player-Lesepfade lesen die aktuelle Teamzuordnung jetzt aus dem saisonalen Modell `player_team_seasons -> team_seasons -> teams`. `players.team_id` bleibt nur noch als kontrollierter Legacy-Fallback fuer Admin-Form-Kompatibilitaet und Write-nahe Rollback-/Snapshot-Logik erhalten.

## 2. Geaenderte Dateien

- `src/app/admin/players/page.js`
- `src/app/admin/players/edit/[id]/page.js`
- `src/app/admin/teams/new/page.js`
- `src/app/admin/teams/edit/[id]/page.js`
- `src/app/(website)/fussball/[slug]/page.js`
- `src/app/(website)/fussball/[slug]/spieler/[playerId]/page.js`
- `src/components/admin/persons/playerReadDto.js`
- `src/components/admin/persons/playerSeasonalReadModelRepository.js`
- `src/components/admin/persons/personTeamRepository.js`
- `src/components/admin/persons/serverPersonScope.js`
- `src/components/admin/players/list/playerList.helpers.js`
- `src/components/admin/topbar/adminSearch.service.js`
- `src/components/admin/teams/teamEditPlayer.repository.js`
- `src/components/admin/teams/services/teamDelete.core.mjs`
- `src/components/admin/utils/entity.js`
- `src/components/website/player-profile/playerProfile.helpers.js`
- `src/components/website/player-profile/PlayerProfileHeader.js`
- `src/components/website/player-profile/PlayerProfileStatsGrid.js`

## 3. Admin-Player-Read-Pfad

Die Admin-Spielerliste erzeugt jetzt serverseitig ein saisonales Player-DTO aus `players` plus batchgeladenen Player-Read-Models. `players.team_id` wird weder selektiert noch fuer Scope, Anzeige oder Karten-Mapping genutzt.

- Team-Scope wird aus aktuellen Assignments abgeleitet.
- Mehrfachzuordnungen bleiben im DTO voll erhalten.
- `primaryAssignment` dient nur noch als Anzeigehilfe.

## 4. Oeffentliche Player-Read-Pfade

Es bleiben keine oeffentlichen produktiven Reads mehr auf `players.team_id`.

- Teamseite: der Legacy-Fallback auf `players.team_id` wurde entfernt.
- Spielerprofil: Team, Saison, Rueckennummer, Position und Kapitaensstatus kommen aus dem saisonalen Player-Read-Model.

## 5. Teamseite

`src/app/(website)/fussball/[slug]/page.js` laedt Spieler nur noch ueber die angezeigte `team_season`.

- kein Fallback mehr auf `players.eq("team_id", team.id)`
- keine Dubletten bei mehrfachen Assignment-Zeilen
- Relationale Felder `shirt_number`, `position_*` und `is_captain` bleiben fuehrend
- leere Teams bleiben sauber darstellbar

## 6. Spielerprofil

`src/app/(website)/fussball/[slug]/spieler/[playerId]/page.js` nutzt jetzt `createPlayerReadDto(...)` plus `getPlayerSeasonalReadModel(..., { includeLegacyFallback: false })`.

- Slug-Pruefung erfolgt nur noch gegen aktuelle Assignment-Slugs.
- Fehlende aktuelle Saison oder fehlende aktuelle Zuordnung fuehren nicht zum Crash.
- Mehrfachzuordnungen werden als kombinierte Team-/Positions-/Nummern-Anzeige zusammengefasst.
- `image_url` bleibt die kanonische Bildquelle.

## 7. Filter und Statistiken

Die Player-Listenhelper lesen Teams und Positionen jetzt aus Assignments.

- Teamfilter nutzt aktuelle `assignment.teamId`
- Teamoptionen enthalten alle aktuellen Teams einer Mehrfachzuordnung
- Positionsfilter nutzt relationale Positionswerte
- Teamnamensuche nutzt `teamNames`
- keine Doppelzaehlung durch Teamoptionen pro Player

Die vorhandenen Gesamt-/Inaktiv-/Nationalitaetsstatistiken zaehlen weiterhin pro Spieler und nicht pro Assignment.

## 8. Suche

`src/components/admin/topbar/adminSearch.service.js` erzeugt Player-Suchergebnisse jetzt relational.

- Spielersuche nach Name bleibt unveraendert
- Teamnamensuche beruecksichtigt aktuelle Assignments
- Ergebnisuntertitel zeigt primaeres Team oder Mehrfachzuordnung
- keine N+1-Abfragen, nur Batch-Reads

## 9. Scope

Die kanonische Player-Scope-Aufloesung laeuft jetzt ueber `personTeamRepository.js` und saisonale Player-Read-Models.

- `serverPersonScope.getPlayerTeamIdsMap(...)` nutzt standardmaessig keinen Legacy-Fallback mehr
- `players.team_id` erweitert keine Teamrechte mehr
- Trainer ohne saisonale Teamrelation sehen dadurch keine Legacy-Only-Player mehr

## 10. Delete-/Archivierungs-Reads

Der Team-Delete-Guard liest Player-Abhaengigkeiten nicht mehr aus `players.team_id`.

- `summary.players` basiert jetzt auf eindeutigen `player_team_seasons.player_id`
- historische Team-Saisons bleiben beruecksichtigt
- `summary.playerTeamSeasons` bleibt die Zeilenanzahl der Relationstabelle

## 11. Entfernte players.team_id-Reads

- Admin-Spielerliste in `src/app/admin/players/page.js`
- Team-/Positionsfilter in `src/components/admin/players/list/playerList.helpers.js`
- Player-Scope-Aufloesung in `src/components/admin/persons/personTeamRepository.js`
- Admin-Suche in `src/components/admin/topbar/adminSearch.service.js`
- Team-Delete-Guard in `src/components/admin/teams/services/teamDelete.core.mjs`
- Team-Create-Playerpicker in `src/app/admin/teams/new/page.js`
- Team-Edit-Playerpicker in `src/app/admin/teams/edit/[id]/page.js`
- Oeffentliche Teamseite in `src/app/(website)/fussball/[slug]/page.js`
- Oeffentliches Spielerprofil in `src/app/(website)/fussball/[slug]/spieler/[playerId]/page.js`

## 12. Verbleibende players.team_id-Reads

Es verbleiben nur noch kontrollierte Admin-/Interne Fallbacks:

- `src/components/admin/persons/playerSeasonalReadModelRepository.js`
  - liest `players.team_id` nur noch, wenn `includeLegacyFallback: true` gesetzt wird
- `src/components/admin/persons/seasonalReadModelCore.mjs`
  - haelt `legacyTeamId` und `legacyFallbackUsed` fuer diesen kontrollierten Fallback
- `src/app/admin/players/edit/[id]/page.js`
  - aktiviert den Fallback bewusst fuer Formular-Vorauswahl/Warnhinweis
- `src/components/admin/players/services/playerWrite.service.js`
  - nutzt den Fallback bewusst fuer Write-nahe Bestands-/Rollback-Kompatibilitaet
- `src/components/admin/utils/entity.js`
  - behaelt einen generischen Legacy-Fallback, der fuer Player-Karten jetzt explizit deaktiviert wird
- `src/components/admin/persons/personTeamLegacyRepository.js`
  - enthaelt noch den alten Player-Fallback, hat nach B13.18 aber keinen aktiven Player-Consumer mehr

## 13. Legacy-Fallback

Der verbleibende Player-Legacy-Fallback ist jetzt zentral gekapselt.

- Aktivierung nur ueber `includeLegacyFallback: true`
- sichtbares Statussignal ueber `legacyFallbackUsed`
- keine Nutzung mehr in Public-Routen, Listen, Suche, Scope oder Delete-Guard

## 14. Query-Anzahl

- Admin-Spielerliste: 5 feste Queries
  - `players`
  - `seasons`
  - `player_team_seasons`
  - `team_seasons`
  - `teams`
- Public-Teamseite: 1 saisonale Player-Roster-Query, der alte Legacy-Fallback-Query entfaellt
- Public-Spielerprofil: 5 feste Player-Queries
  - `players`
  - `seasons`
  - `player_team_seasons`
  - `team_seasons`
  - `teams`
- Admin-Suche: keine N+1-Queries, nur Batch-Anreicherungen fuer Player und Coaches

## 15. Tests

Gezielt ausgefuehrt:

- `node --test src/components/admin/persons/playerReadDto.test.mjs src/components/admin/persons/seasonalReadModelCore.test.mjs src/components/admin/players/list/playerList.helpers.test.mjs src/components/admin/utils/entity.test.mjs src/components/admin/teams/services/teamDelete.service.test.mjs`
- `npm.cmd exec eslint -- <gezielte B13.18-Dateien>`

Ergebnis:

- gezielte Tests: erfolgreich
- gezieltes ESLint: erfolgreich

## 16. Offene Risiken

- Legacy-Only-Player ohne aktuelle saisonale Zuordnung fallen jetzt bewusst aus teambasierten Player-Scopes heraus.
- Das Admin-Player-Edit-Formular nutzt weiterhin den kontrollierten Fallback fuer Bestandsdaten ohne aktuelle Assignment-Zeile.
- `personTeamLegacyRepository.js` enthaelt weiterhin toten Player-Legacy-Code und sollte in einem Folgeschritt entfernt werden, sobald keine kontrollierten Fallbacks mehr benoetigt werden.

## 17. Readiness fuer Write-Abschaltung

`players.team_id` ist nach B13.18 nicht mehr die primaere Runtime-Lesequelle fuer Player-Listen, Teamseiten, Spielerprofile, Suche, Scope oder Delete-Guards.

Fuer eine spaetere Abschaltung der Snapshot-Writes fehlen noch:

- Entfernung des kontrollierten Admin-Form-Fallbacks
- Entfernung des Write-nahen Rollback-/Kompatibilitaetsreads
- Bestaetigung, dass keine Legacy-Only-Bestandsplayer mehr von der Formular-Vorauswahl abhaengen

## 18. Empfohlener naechster Schritt

B13.19 sollte die verbliebenen Admin-Fallbacks in `playerSeasonalReadModelRepository.js`, `playerWrite.service.js` und dem Player-Edit-Formular entfernen. Erst danach ist `players.team_id` auch als Write-Snapshot realistisch abschaltbar.
