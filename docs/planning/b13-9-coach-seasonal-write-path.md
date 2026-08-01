# B13.9 - Coach Seasonal Write Path

## 1. Ziel

Der Admin-Create-/Edit-/Save-Pfad fuer Trainer und Betreuer verwendet jetzt `assignments[]`, `team_season_id` und `coach_team_seasons` als kanonische Zuordnungsquelle. Legacy-Fallbacks ausserhalb dieses Coach-Pfads bleiben unberuehrt.

## 2. Geaenderte Dateien

- `src/app/admin/coaches/new/page.js`
- `src/app/admin/coaches/edit/[id]/page.js`
- `src/app/admin/coaches/actions.js`
- `src/components/admin/coaches/forms/AdminCoachesForm.js`
- `src/components/admin/coaches/forms/coachForm.config.js`
- `src/components/admin/coaches/forms/coachForm.helpers.js`
- `src/components/admin/coaches/forms/fields/CoachRoleFields.js`
- `src/components/admin/coaches/forms/fields/CoachSettingsFields.js`
- `src/components/admin/coaches/services/coaches.service.js`
- `src/components/admin/coaches/services/coachTeamSeasonOptions.repository.js`
- `src/components/admin/coaches/services/coachSeasonalWriteCore.mjs`
- `src/components/admin/coaches/services/coachSeasonalWriteCore.test.mjs`
- `src/components/admin/coaches/services/coachWrite.repository.js`
- `src/components/admin/coaches/services/coachWrite.service.js`

## 3. Neues Formularmodell

- kanonisches Zuordnungsmodell: `assignments[]`
- Assignment-Felder:
  - `coach_team_season_id`
  - `team_season_id`
  - `role_de`
  - `role_en`
  - `assignment_sort_order`
  - `is_active`
- kanonisches Bildfeld: `image_url`
- `form.role` und `form.sort_order` bleiben nur als Fallback-Snapshots fuer teamlose Coaches oder Legacy-Consumer erhalten.

## 4. Create-Pfad

1. Scope und alle Ziel-`team_season_id` serverseitig aufloesen
2. Coach-Stammdaten in `coaches` speichern
3. danach alle aktuellen `coach_team_seasons`-Zeilen anlegen
4. bei Fehlern der Relationserstellung den neu angelegten `coaches`-Datensatz kompensierend loeschen

## 5. Edit-Pfad

1. bestehendes Trainerprofil laden
2. aktuelles saisonales Read-Model mit allen aktiven aktuellen Zuordnungen laden
3. Coach-Stammdaten aktualisieren
4. bestehende Zuordnungen gleicher `team_season_id` aktualisieren
5. neue Zuordnungen hinzufuegen
6. entfernte aktuelle Zuordnungen kontrolliert auf `is_active = false` setzen
7. bei Teamwechsel einer bestehenden Zeile die alte Relation deaktivieren und eine neue Relation anlegen
8. bei Fehlern Stammdaten und aktuelle Saisonzuordnungen kompensierend wiederherstellen

## 6. Mehrfachzuordnungen

- Mehrere aktive aktuelle Zuordnungen bleiben vollstaendig im Formular erhalten.
- Das Formular reduziert nicht mehr still auf `primaryAssignment`.
- Doppelte aktive Kombinationen aus `team_season_id` und Rolle werden in Formular und Service blockiert.
- Entfernen einer Zeile deaktiviert nur genau diese aktuelle Relation und aendert keine andere Zuordnung.

## 7. Rollenmodell

- Rollen werden relationell in `coach_team_seasons.role_de` und `coach_team_seasons.role_en` gespeichert.
- Mehrere Rollen je Coach in derselben Saison sind moeglich, solange die Kombination aus Mannschaft und Rolle eindeutig bleibt.
- `coaches.role`, `coaches.role_de` und `coaches.role_en` bleiben temporaere Legacy-Snapshots und werden deterministisch aus der primaeren aktiven Assignment-Zeile abgeleitet.

## 8. Scope-Pruefung

- `coaches.create` bzw. `coaches.edit` bleiben Pflicht.
- Bestehende Bearbeitungsrechte fuer das Profil bleiben ueber `canEditCoachOnServer` aktiv.
- Alle Zielteams werden serverseitig aus `team_season_id -> team_seasons.team_id -> teams` aufgeloest.
- Jede Assignment-Zielmannschaft muss innerhalb der serverseitig geladenen aktiven Scope-Teams liegen.
- Clientwerte fuer Mannschaft oder Rolle werden nicht blind vertraut.

## 9. Bildfeld-Umstellung

- Formular, Preview und Upload-Kontext verwenden primaer `image_url`.
- `photo_url` bleibt nur als Legacy-Fallback fuer Bestandsdaten und wird im Master-Save temporaer synchron gehalten.
- Neue Uploads verwenden `previousUrl` aus `image_url || photo_url`, um vorhandene Referenzen nicht blind zu verlieren.

## 10. Legacy-Sync

- `coaches.team_id` wird weiterhin temporaer aus der primaeren aktiven Coach-Assignment-Zeile synchronisiert.
- `coaches.team_name` wird weiterhin temporaer aus derselben primaeren aktiven Coach-Assignment-Zeile synchronisiert.
- `coaches.role`, `coaches.role_de`, `coaches.role_en` und `coaches.sort_order` bleiben temporaere Snapshot-Syncs aus der primaeren Assignment-Zeile.
- Teamlose Coaches behalten die Formular-Fallbacks `role` und `sort_order`, solange spaetere Runtime-Consumer noch Master-Snapshots lesen.

## 11. Fehlerbehandlung

- fehlende aktuelle Saison blockiert aktive Teamzuordnungen, aber nicht teamlose Stammdatensaetze
- mehrere aktuelle Saisons blockieren aktive Teamzuordnungen
- ungueltige `team_season_id` wird serverseitig abgelehnt
- Team ausserhalb Scope wird serverseitig abgelehnt
- unbekannte bestehende Assignment-ID wird serverseitig abgelehnt
- doppelte aktive Assignment-Kombinationen werden blockiert
- Fehler nach Stammdaten-Save fuehren zu kompensierenden Rollbacks

## 12. Tests

- neue reine Tests fuer:
  - Master-Payload und Legacy-Sync
  - Bild-Fallback `image_url` / `photo_url`
  - Assignment-Normalisierung und Sortierung
  - Create mit neuen Assignments
  - Update bestehender Assignments
  - Teamwechsel mit Historienerhalt
  - Duplicate-Blocker
  - unbekannte manipulierte Assignment-ID

## 13. Offene Risiken

- Admin-Liste, Suchfunktionen und oeffentliche Coach-Seiten lesen weiterhin Snapshots aus `coaches`.
- Daher bleiben `team_id`, `team_name`, `role`, `role_de`, `role_en`, `sort_order` und `photo_url` vorerst als Legacy-Sync erforderlich.
- Es gibt weiterhin keine echte Datenbanktransaktion; der Schritt arbeitet mit kompensierenden Rollbacks.
- Teamlose Coaches koennen weiterhin ohne aktuelle Saison gespeichert werden; nur aktive Saisonzuordnungen werden bei fehlender oder mehrdeutiger Saison blockiert.

## 14. Noch bestehende coaches.team_id-Verwendungen

- temporaerer Legacy-Sync im Coach-Schreibpfad
- Admin-Coachliste und Coach-Statistiken
- Delete-Guard fuer Teams
- generische Entity- und Search-Helper
- Person-Team-Fallback-Repositories laut B13.5/B13.6

## 15. Noch bestehende coaches.team_name-Verwendungen

- temporaerer Legacy-Sync im Coach-Schreibpfad
- Admin-Coachliste, Coach-Card und Suche
- oeffentliche Trainerprofilseite
- generische Entity-Helper und B13.5/B13.6-Legacy-Consumer

## 16. Noch bestehende coaches.photo_url-Verwendungen

- temporaerer Legacy-Sync im Coach-Schreibpfad
- Formular-Initialisierung und Upload-Fallback fuer Bestandsdaten
- weitere spaetere Legacy-Reads ausserhalb dieses Scopes koennen bestehen bleiben

## 17. Empfohlener naechster Schritt

Als naechster Implementierungsschritt sollte die Admin-/oeffentliche Coach-Leseseite von den Snapshot-Feldern `coaches.team_id`, `coaches.team_name` und `coaches.role*` auf die saisonalen Read-Modelle umgestellt werden, bevor die Legacy-Snapshots entfernt werden.
