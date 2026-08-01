# B13.12 - Coach Role Fallback Cleanup

## 1. Ziel

Die verbleibenden produktiven Reads und fachlichen Entscheidungen fuer `coaches.role`, `coaches.role_de` und `coaches.role_en` wurden weiter von Masterrollen auf saisonale Rollen aus `coach_team_seasons` verschoben. Masterrollen bleiben nur noch als klar markierter Fallback fuer Coaches ohne aktuelle saisonale Zuordnung aktiv.

## 2. Geaenderte Dateien

- Runtime:
  - `src/components/admin/coaches/components/CoachTeamsOverview.js`
  - `src/components/website/department/DepartmentPersonCard.js`
  - `src/lib/admin-auth/profileCardLinks.repository.js`
  - `src/lib/admin-auth/profileCardLinks.coachCore.mjs`
- Tests:
  - `src/lib/admin-auth/profileCardLinks.coachCore.test.mjs`
- Doku:
  - `docs/planning/b13-12-coach-role-fallback-cleanup.md`
  - `docs/planning/b13-12-coach-role-status.csv`

## 3. Kanonische Rollenquelle

- Fachlich fuehrend bleiben `coach_team_seasons.role_de` und `coach_team_seasons.role_en`.
- `createCoachReadDto()` und das Profile-Linking-Readmodell nutzen relationale Assignment-Rollen, sobald fuer den Coach aktuelle Saisonzuordnungen vorhanden sind.
- `coaches.role*` bleibt nur noch Fallback fuer Coaches ohne aktuelle Assignment-Zeile oder ohne aufloesbare aktuelle Saison.

## 4. Team-Edit

- `src/components/admin/teams/teamCoachAssignments.core.mjs` blieb auf dem bereits eingefuehrten assignments-first-Verhalten.
- `src/components/admin/coaches/components/CoachTeamsOverview.js` zeigt pro Team jetzt ausschliesslich `teamRoleDisplayLabel` aus der zugehoerigen Assignment-Sicht.
- Es gibt dort keinen Fallback mehr auf `coach.primaryRoleLabel`, der eine fremde oder generische Masterrolle als Teamrolle erscheinen lassen koennte.

## 5. Profile-Linking

- `src/lib/admin-auth/profileCardLinks.repository.js` erzeugt Coach-Kartenlabels jetzt ueber saisonale Read-Modelle statt direkt ueber `coaches.role*`.
- Bei vorhandenen aktuellen Assignments werden mehrere Rollen deterministisch in Sortierreihenfolge der Assignments ausgegeben.
- `admin_profile_id`-Verknuepfung, Linking-Write und Scope-Verhalten bleiben unveraendert.
- `fetchCoachById()` und `linkCoachToProfile()` lesen fuer ihre Write-/Existenzpruefungen keine Masterrollen mehr.

## 6. Coach-DTO

- `src/components/admin/persons/coachReadDto.js` blieb assignments-first.
- `roleLabels` kommen bei vorhandenen Assignments ausschliesslich aus relationalen Rollen.
- `legacyRoleFallbackUsed` markiert weiterhin explizit, wenn `coaches.role*` noch als Fallback genutzt werden muss.
- Doppelte Rollendarstellung zwischen Teamsicht und Gesamtrolle bleibt vermieden.

## 7. Formular-Initialisierung

- `src/components/admin/coaches/forms/coachForm.helpers.js` blieb unveraendert zum B13.12-Zwischenstand.
- Assignment-Zeilen werden weiter aus `coach_team_seasons` geladen, wenn relationale Daten vorhanden sind.
- `coaches.role*` bleibt nur fuer teamlose oder historisierte Fallback-Zustaende sowie fuer die temporaere Legacy-Synchronisierung relevant.

## 8. Teamlose Coaches

- Coach ohne aktuelle Assignment-Zeile: Masterrolle darf weiter als Fallback angezeigt werden.
- Coach mit nur historischen Zuordnungen: faellt auf klaren Legacy-Fallback zurueck, ohne eine falsche aktuelle Teamrolle zu erzeugen.
- Coach mit mehreren aktuellen Assignments: alle relationalen Rollen bleiben erhalten.
- Fehlende oder mehrdeutige aktuelle Saison: Profile-Linking und DTO fallen defensiv auf Masterrollen zurueck, statt beliebige Teamrollen zu erfinden.

## 9. Verbleibende Reads

- `coaches.role`:
  - `src/components/admin/coaches/forms/coachForm.helpers.js`
  - `src/components/admin/coaches/services/coachWrite.service.js`
  - `src/components/admin/coaches/services/coachSeasonalWriteCore.mjs`
  - `src/components/admin/persons/coachRoleSummary.mjs`
  - `src/components/admin/settings/helpers/settingsInitialState.js`
  - `src/components/website/department/DepartmentPersonCard.js`
- `coaches.role_de`:
  - `src/components/admin/coaches/forms/coachForm.helpers.js`
  - `src/components/admin/coaches/services/coachWrite.service.js`
  - `src/components/admin/coaches/services/coachWrite.repository.js`
  - `src/components/admin/coaches/services/coachSeasonalWriteCore.mjs`
  - `src/components/admin/persons/coachRoleSummary.mjs`
  - `src/components/admin/settings/helpers/settingsInitialState.js`
  - `src/components/website/department/DepartmentPersonCard.js`
  - `src/lib/admin-auth/profileCardLinks.repository.js`
- `coaches.role_en`:
  - `src/components/admin/coaches/forms/coachForm.helpers.js`
  - `src/components/admin/coaches/services/coachWrite.service.js`
  - `src/components/admin/coaches/services/coachWrite.repository.js`
  - `src/components/admin/coaches/services/coachSeasonalWriteCore.mjs`
  - `src/components/admin/persons/coachRoleSummary.mjs`
  - `src/lib/admin-auth/profileCardLinks.repository.js`

## 10. Verbleibende Writes

- `src/components/admin/coaches/services/coachSeasonalWriteCore.mjs` schreibt `coaches.role*` weiterhin als temporaeren Master-Snapshot.
- `src/components/admin/coaches/services/coachWrite.service.js` nutzt Masterrollen weiter fuer Rollback-Wiederherstellung.

## 11. Deaktivierte Writes

- In B13.12 wurden keine zusaetzlichen `coaches.role*`-Writes deaktiviert.
- Der aktuelle Stand bleibt `TEMPORARY_SYNC`, weil Formular-Fallbacks und Rollback-Szenarien noch Masterrollen lesen.

## 12. Tests

- Gezielte Tests:
  - `node --test src/components/admin/persons/coachReadDto.test.mjs src/components/admin/persons/coachRoleSummary.test.mjs src/components/admin/teams/teamCoachAssignments.core.test.mjs src/lib/admin-auth/profileCardLinks.core.test.mjs src/lib/admin-auth/profileCardLinks.coachCore.test.mjs src/components/admin/coaches/services/coachSeasonalWriteCore.test.mjs`
  - Ergebnis: alle direkt betroffenen B13.12-Tests ohne Alias-Randfall bestanden; `src/components/admin/teams/teamCoachAssignments.core.test.mjs` laeuft unter nacktem `node --test` derzeit nicht wegen bestehender `@/`-Alias-Aufloesung im Testmodul.
- Gezieltes ESLint:
  - `npm.cmd exec -- eslint src/components/admin/coaches/components/CoachTeamsOverview.js src/components/website/department/DepartmentPersonCard.js src/lib/admin-auth/profileCardLinks.repository.js src/lib/admin-auth/profileCardLinks.coachCore.mjs src/lib/admin-auth/profileCardLinks.coachCore.test.mjs`
  - Ergebnis: keine Errors, eine bestehende Next-Warnung fuer `<img>` in `DepartmentPersonCard.js`.
- Projektweit:
  - `npm.cmd run lint`
  - `npm.cmd run build`

## 13. Offene Risiken

- Formular- und Settings-Fallbacks lesen `coaches.role*` weiter fuer teamlose bzw. historisierte Coaches.
- Rollback-Wiederherstellung im Coach-Schreibpfad benoetigt noch Masterrollen-Snapshots.
- `DepartmentPersonCard` bleibt generisch und kann fuer nicht-seasonale Personen weiterhin auf `role_de` oder `role` zurueckfallen.

## 14. Readiness fuer spaetere Spaltenentfernung

- `coaches.role*` ist noch nicht `READY_FOR_MIGRATION`.
- Die Reads in Team-Edit, Coach-DTO bei vorhandenen Assignments und Profile-Linking sind jetzt seasonal-first.
- Blockierend bleiben vor allem Write-Rollback, Formular-Fallbacks, Settings-Initialisierung und teamlose Bestandsprofile.

## 15. Empfohlener naechster Schritt

Naechster sinnvoller Schritt ist die gezielte Reduktion der verbleibenden Masterrollen-Reads in Formular-, Settings- und Rollback-Pfaden. Erst danach sollte das Deaktivieren der `coaches.role*`-Sync-Writes geplant werden.
