# B13.8 - Player Seasonal Write Path

## 1. Ziel

Der Admin-Create-/Edit-/Save-Pfad fuer Spieler verwendet jetzt `team_season_id` und `player_team_seasons` als kanonische Zuordnungsquelle. Legacy-Fallbacks ausserhalb dieses Player-Pfads bleiben unberuehrt.

## 2. Geaenderte Dateien

- `src/app/admin/players/new/page.js`
- `src/app/admin/players/edit/[id]/page.js`
- `src/app/admin/players/actions.js`
- `src/components/admin/players/forms/AdminPlayersForm.js`
- `src/components/admin/players/forms/playerForm.helpers.js`
- `src/components/admin/players/forms/playerForm.config.js`
- `src/components/admin/players/forms/fields/PlayerBasicFields.js`
- `src/components/admin/players/forms/fields/PlayerSettingsFields.js`
- `src/components/admin/players/services/playerTeamSeasonOptions.repository.js`
- `src/components/admin/players/services/playerSeasonalWriteCore.mjs`
- `src/components/admin/players/services/playerWrite.service.js`
- `src/components/admin/players/services/playerSeasonalWriteCore.test.mjs`
- `src/components/admin/players/services/players.service.js`

## 3. Neues Formularmodell

- kanonisches Mannschaftsfeld: `team_season_id`
- kanonische Zuordnungsfelder:
  - `shirt_number`
  - `position_de`
  - `position_en`
  - `is_captain`
  - `assignment_sort_order`
- kanonisches Bildfeld: `image_url`
- Teamoptionen kommen nur aus aktiven `team_seasons` der eindeutig aktuellen Saison und sind bereits serverseitig auf den Scope gefiltert.

## 4. Create-Pfad

1. Scope und Ziel-`team_season_id` serverseitig aufloesen
2. Player-Stammdaten in `players` speichern
3. aktuelle `player_team_seasons`-Zeile anlegen
4. bei Fehler der Relationserstellung den neu angelegten `players`-Datensatz kompensierend loeschen

## 5. Edit-Pfad

1. bestehenden Player laden
2. aktuelles saisonales Read-Model laden
3. Konflikte wie mehrere aktive aktuelle Zuordnungen vor dem Speichern blockieren
4. Player-Stammdaten aktualisieren
5. aktuelle Relation je nach Fall aktualisieren oder neue Relation anlegen
6. bei Fehlern die vorherigen Stammdaten kompensierend wiederherstellen

## 6. Teamwechsel

- Wenn dasselbe `team_season_id` erhalten bleibt, wird die bestehende aktive Zuordnung aktualisiert.
- Bei einem Teamwechsel wird die bisherige aktuelle Zuordnung auf `is_active = false` gesetzt und anschliessend eine neue aktive Relation angelegt.
- Historische Relationen werden nicht geloescht.
- Falls das Anlegen der neuen Relation scheitert, wird die alte aktive Relation wieder reaktiviert.

## 7. Scope-Pruefung

- `players.create` bzw. `players.edit` bleiben Pflicht.
- Das Zielteam wird serverseitig aus `team_season_id -> team_seasons.team_id -> teams` aufgeloest.
- Der Clientwert `team_season_id` wird nicht blind vertraut.
- Die bestehende Scope-Logik fuer Superadmin, Jugendscope und Teamtrainer bleibt erhalten.

## 8. Bildfeld-Umstellung

- Das Formular arbeitet intern mit `image_url`.
- Upload-Preview und Upload-Context verwenden primaer `image_url`.
- `photo_url` bleibt nur als Legacy-Sync und Fallback beim Initialisieren bestehender Datensaetze erhalten.

## 9. Legacy-Sync

- `players.team_id` wird weiterhin temporaer aus `team_seasons.team_id` synchronisiert.
- `players.photo_url` wird weiterhin temporaer auf denselben Wert wie `players.image_url` synchronisiert.
- Auch `players.shirt_number`, `players.position_de`, `players.position_en`, `players.is_captain` und `players.sort_order` bleiben temporaere Snapshot-Syncs, bis spaetere Runtime-Consumer umgestellt sind.

## 10. Fehlerbehandlung

- fehlende aktuelle Saison: Formular blockiert, Save-Action lehnt ab
- mehrere aktuelle Saisons: Formular blockiert, Save-Action lehnt ab
- ungueltige `team_season_id`: Save-Action lehnt ab
- Team ausserhalb Scope: Save-Action lehnt ab
- Spieler nicht gefunden: Save-Action lehnt ab
- mehrere aktive aktuelle Zuordnungen: Edit-Formular blockiert und Service lehnt ab
- Relation-Fehler nach Stammdaten-Save: kompensierender Rollback

## 11. Tests

- neue reine Tests fuer Write-Entscheidungen und Legacy-/Bild-Sync:
  - Master-Payload
  - Assignment-Payload
  - Create
  - Update ohne Teamwechsel
  - Teamwechsel
  - Konflikt mit mehreren aktiven Zuordnungen
  - ungueltige `team_season_id`

## 12. Offene Risiken

- Projektweite Player-Listen und oeffentliche Player-Seiten lesen weiterhin Snapshot-Felder aus `players`.
- Daher bleibt der temporaere Legacy-Sync fuer Team-, Positions-, Captain-, Sortierungs- und Bildfelder noch erforderlich.
- Es gibt weiterhin keine echte Datenbanktransaktion; der Schritt arbeitet mit kompensierenden Rollbacks.

## 13. Noch bestehende players.team_id-Verwendungen

- temporaerer Legacy-Sync im Player-Schreibpfad
- Admin-Spielerliste
- Team-Create/Edit-Auswahllisten
- Delete-Guard
- oeffentliche Teamseite
- generische Helper und Person-Repository-Fallbacks laut B13.5/B13.6

## 14. Noch bestehende players.photo_url-Verwendungen

- temporaerer Legacy-Sync im Player-Schreibpfad
- Admin-PlayerCard und Admin-Spielerliste
- Player-Bildfluss ausserhalb spaeterer B13.10-Umstellung
- oeffentliche Spielerprofil- und Teamkarten laut B13.5/B13.6

## 15. Empfohlener naechster Schritt

Als naechster Implementierungsschritt sollte B13.9 die Coach-Form und den Coach-Schreibpfad auf dieselbe saisonale Architektur umstellen, bevor Admin-Listen und oeffentliche Seiten von den Snapshot-Feldern entkoppelt werden.
