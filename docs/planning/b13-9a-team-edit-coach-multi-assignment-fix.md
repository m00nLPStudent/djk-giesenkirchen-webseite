# B13.9A - Team Edit Coach Multi Assignment Fix

## 1. Fehlerbild

Im Team-Edit unter `/admin/teams/edit/[id]` erschien ein Coach mit mehreren aktiven `coach_team_seasons`-Zuordnungen nur bei genau einer Mannschaft als zugeordnet. In weiteren Team-Edit-Seiten derselben aktuellen Saison war derselbe Coach nicht als ausgewaehlt sichtbar.

## 2. Root Cause

- Der Team-Edit-Loader lud Coaches fuer den Staff-Tab ueber `coaches.team_id.is.null OR coaches.team_id = team.id`.
- Im Client wurde die Staff-Liste zusaetzlich ueber `belongsToTeam(coach, team.id)` erneut auf `coaches.team_id` reduziert.
- Dadurch war `coach_team_seasons` zwar fuer die Checkbox-Selektion im Formular vorhanden, aber Coaches mit zweiter oder dritter aktiver Saisonzuordnung verschwanden schon vorher aus der Liste.
- Der Staff-Tab zeigte Metadaten aus `coaches.role_de`, nicht aus der teambezogenen Assignment-Zeile.
- Der Team-Edit-Speicherpfad loeschte bisher alle `coach_team_seasons` einer Team-Saison und legte nackte Zeilen ohne `role_de` und `role_en` neu an. Das war zwar nicht die Ursache des Anzeige-Fehlers, haette aber teambezogene Rollen und Historie beschaedigt.

## 3. Geaenderte Dateien

- `src/app/admin/teams/edit/[id]/page.js`
- `src/components/admin/teams/forms/AdminTeamsForm.js`
- `src/components/admin/teams/forms/helpers/teamFormInitialState.js`
- `src/components/admin/teams/forms/helpers/teamFormOptions.js`
- `src/components/admin/teams/forms/helpers/teamFormPayload.js`
- `src/components/admin/teams/forms/tabs/TeamStaffTab.js`
- `src/components/admin/teams/services/teams.service.js`

## 4. Bisheriger Datenpfad

1. Team-Edit lud `team_seasons`, `coach_team_seasons` und `coaches`.
2. Die Coach-Auswahlliste wurde jedoch ueber `coaches.team_id` eingeschraenkt.
3. Die Staff-Checkboxen nutzten nur `selected_coach_ids`, ohne pro Coach teambezogene Assignment-Daten vorzuhalten.
4. Beim Speichern wurden alle Coach-Zuordnungen der Team-Saison geloescht und vereinfacht neu angelegt.

## 5. Neuer Datenpfad

1. Ein serverseitiger Loader loest die eindeutig aktuelle Saison ueber `seasons.is_current` auf.
2. Fuer das bearbeitete Team werden alle `team_seasons` geladen, plus die aktive aktuelle `team_seasons`-Zeile des Teams validiert.
3. Alle aktiven Coaches werden geladen.
4. Teambezogene `coach_team_seasons` fuer die Team-Seasons des bearbeiteten Teams werden gesammelt geladen.
5. Aktive aktuelle Saisonzuordnungen derselben Coaches zu anderen Teams werden in einer Batch-Abfrage geladen.
6. Daraus wird pro Coach ein Team-Edit-State mit `isAssignedToCurrentTeam`, `coach_team_season_id`, `role_de`, `role_en`, `sort_order` und weiterer Zuordnungsinfo aufgebaut.

## 6. Mehrfachzuordnungslogik

- Ein Coach gilt fuer Team-Edit als zugeordnet, wenn mindestens eine aktive `coach_team_seasons`-Zeile fuer genau die aktuelle `team_season_id` des bearbeiteten Teams existiert.
- Ein Coach kann gleichzeitig in mehreren Team-Edit-Seiten als zugeordnet erscheinen.
- Weitere aktive Zuordnungen zu anderen Teams bleiben sichtbar und werden im Staff-Tab kenntlich gemacht.
- Historische oder deaktivierte Zeilen zaehlen nicht als aktive aktuelle Zuordnung.

## 7. Formular-State

Der Team-Edit-Form-State enthaelt jetzt zusaetzlich `coach_team_state` pro Coach mit mindestens:

- `coach_id`
- `coach_team_season_id`
- `team_season_id`
- `role_de`
- `role_en`
- `sort_order`
- `is_active`
- `isAssignedToCurrentTeam`

Die Checkbox-Auswahl aktualisiert `selected_coach_ids` und `coach_team_state` gemeinsam, ohne auf eine globale einzelne `coach.team_id` angewiesen zu sein.

## 8. Speicherverhalten

- Der Team-Edit-Speicherpfad wurde geaendert.
- Entfernen eines Coaches aus dem aktuellen Team deaktiviert nur aktive `coach_team_seasons` fuer genau dieses `team_season_id`.
- Hinzufuegen eines Coaches legt nur dann eine neue Zeile an, wenn fuer dieses Team noch keine Relation existiert.
- Existiert nur eine inaktive Zeile, wird eine kanonische bestehende Relation reaktiviert.
- Andere Teamzuordnungen desselben Coaches bleiben unveraendert.
- Rollen und Sortierung vorhandener teambezogener Zuordnungen bleiben erhalten.

## 9. Scope- und Permission-Verhalten

- Team-Zugriff bleibt unveraendert ueber den bestehenden Team-Scope.
- Es wurde kein Coach-Permission-Bypass eingefuehrt.
- Superadmin, Vorstand, Jugendkoordinator und Trainer bleiben in ihrer bisherigen Team-Scope-Logik unveraendert.

## 10. Tests

- neuer reiner Core-Test fuer:
  - Coach mit zwei Teamzuordnungen erscheint in beiden Team-Edit-Kontexten
  - historische oder deaktivierte Zeilen erscheinen nicht als aktiv
  - Entfernen deaktiviert nur aktuelle Team-Zeilen
  - Hinzufuegen erstellt nur fehlende Relationen und erhaelt bestehende Rollen
- bestehende B13.7/B13.8/B13.9-Tests wurden zusammen mit dem neuen Team-Edit-Core-Test erneut ausgefuehrt

## 11. Offene Risiken

- Der Staff-Tab bleibt weiterhin eine Checkbox-Oberflaeche. Mehrere unterschiedliche Rollen desselben Coaches innerhalb derselben Team-Saison werden erhalten, aber nicht separat bearbeitet.
- Bei mehreren bereits inaktiven historischen Zeilen fuer denselben Coach und dieselbe Team-Saison wird beim erneuten Auswaehlen nur eine kanonische Zeile reaktiviert.

## 12. Verbleibende Legacy-Abhaengigkeiten

- `coaches.team_id` und `coaches.team_name` bleiben ausserhalb des Team-Edit-Pfads weiterhin in anderen Runtime-Bereichen vorhanden.
- Player-Tab und Player-Team-Edit-Pfad nutzen weiterhin ihre bestehenden Datenpfade und wurden hier bewusst nicht umgestellt.
