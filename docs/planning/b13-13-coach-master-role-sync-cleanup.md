# B13.13 - Coach Master Role Sync Cleanup

## 1. Ziel

Die verbleibenden Runtime-Abhaengigkeiten von `coaches.role`, `coaches.role_de` und `coaches.role_en` wurden in Formular-, Settings-, Write- und Rollback-Pfaden weiter reduziert. Saisonale Rollen aus `coach_team_seasons` sind jetzt die alleinige fachliche Quelle fuer aktuelle Teamrollen.

## 2. Geaenderte Dateien

- Runtime:
  - `src/components/admin/coaches/forms/coachForm.helpers.js`
  - `src/components/admin/coaches/forms/coachForm.config.js`
  - `src/components/admin/coaches/forms/fields/CoachRoleFields.js`
  - `src/components/admin/coaches/forms/AdminCoachesForm.js`
  - `src/components/admin/coaches/forms/coachForm.core.mjs`
  - `src/components/admin/coaches/services/coachSeasonalWriteCore.mjs`
  - `src/components/admin/coaches/services/coachWrite.service.js`
  - `src/components/admin/coaches/services/coachWriteRollbackCore.mjs`
  - `src/components/admin/persons/coachRoleSummary.mjs`
  - `src/components/admin/settings/helpers/settingsInitialState.js`
  - `src/app/admin/settings/page.js`
  - `src/components/website/department/DepartmentPersonCard.js`
- Tests:
  - `src/components/admin/coaches/forms/coachForm.helpers.test.mjs`
  - `src/components/admin/coaches/services/coachSeasonalWriteCore.test.mjs`
  - `src/components/admin/coaches/services/coachWriteRollbackCore.test.mjs`
  - `src/components/admin/persons/coachReadDto.test.mjs`
  - `src/components/admin/persons/coachRoleSummary.test.mjs`
  - `src/components/admin/settings/helpers/settingsInitialState.test.mjs`
- Doku:
  - `docs/planning/b13-13-coach-master-role-sync-cleanup.md`
  - `docs/planning/b13-13-coach-master-role-status.csv`

## 3. Formular-Initialisierung

- Das Formular laedt aktuelle Rollen weiter ausschliesslich aus `assignments[]`.
- Neue Assignment-Zeilen starten leer und kopieren keine Masterrolle mehr.
- `form.role` bleibt als explizite Fallback-Funktion fuer teamlose Coaches erhalten, beeinflusst aber keine Assignment-Rollen mehr.
- Die Pflichtvalidierung fuer `role` greift nur noch, wenn keine aktuelle Zuordnung vorhanden ist.

## 4. Settings-/Initial-State-Pfade

- Die Settings-Seite baut Coach-Forwarding-Ziele jetzt aus `createCoachReadDto()` plus saisonalen Read-Modellen.
- `settingsInitialState.js` nutzt `roleLabels` und `primaryRoleLabel` zuerst.
- Masterrollen bleiben dort nur letzter Fallback fuer teamlose oder nicht-saisonal aufgeloeste Coach-Daten.

## 5. Write-Pfad

- `coach_team_seasons.role_de` und `role_en` bleiben die einzige fachliche Quelle fuer aktuelle Teamrollen.
- `createCoachPayload()` und `normalizeCoachAssignments()` verwenden fuer Assignment-Writes keine `coaches.role*`-Fallbacks mehr.
- `buildCoachMasterPayload()` synchronisiert `coaches.role*` nicht mehr aus `primaryAssignment`.
- Verbleibende Masterrollen-Writes kommen nur noch aus der expliziten Fallback-Funktion des Coach-Formulars.

## 6. Rollback-Strategie

- Der Rollback trennt jetzt Masterdatensatz und Assignment-Zeilen sauber.
- `coachWriteRollbackCore.mjs` erstellt einen expliziten Rollback-Plan nur fuer tatsaechlich geaenderte Assignment-Zeilen.
- `buildCoachMasterRollbackPayload()` stellt den vorherigen Master-Snapshot exakt wieder her, ohne Rollen aus Assignment-Daten zu rekonstruieren.
- Andere Assignments bleiben im Rollback unberuehrt.

## 7. Role-Summary

- `createCoachRoleSummary()` bleibt assignments-first.
- Legacy-Fallbacks werden nicht mehr als mehrere scheinbar unterschiedliche Rollen aus `role_de`, `role` und `role_en` doppelt ausgegeben.
- Fuer Legacy-Fallback wird jetzt eine einzige priorisierte Masterrolle verwendet.

## 8. Teamlose Coaches

- Teamlose Coaches behalten weiter eine defensive Fallback-Funktion im Masterdatensatz.
- Coaches mit aktuellen Assignments nutzen diese Fallback-Funktion nicht als Teamrolle.
- Historisierte oder saisonal nicht eindeutig aufloesbare Coaches koennen weiter ueber die Fallback-Funktion lesbar bleiben.

## 9. Verbleibende Masterrollen-Reads

- `src/components/admin/coaches/forms/coachForm.core.mjs`
- `src/components/admin/coaches/services/coachSeasonalWriteCore.mjs`
- `src/components/admin/persons/coachRoleSummary.mjs`
- `src/components/admin/settings/helpers/settingsInitialState.js`
- `src/components/website/department/DepartmentPersonCard.js`

## 10. Verbleibende Masterrollen-Writes

- `src/components/admin/coaches/services/coachSeasonalWriteCore.mjs`

## 11. Deaktivierte Writes

- Deaktiviert wurde der bisherige fachliche Rollen-Sync aus `primaryAssignment` nach `coaches.role*`.
- Nicht deaktiviert wurde der explizite Fallback-Write fuer teamlose Coaches.

## 12. Tests

- Gezielte Tests:
  - `node --test src/components/admin/persons/coachReadDto.test.mjs src/components/admin/persons/coachRoleSummary.test.mjs src/components/admin/coaches/forms/coachForm.helpers.test.mjs src/components/admin/coaches/services/coachSeasonalWriteCore.test.mjs src/components/admin/coaches/services/coachWriteRollbackCore.test.mjs src/components/admin/settings/helpers/settingsInitialState.test.mjs src/lib/admin-auth/profileCardLinks.core.test.mjs src/lib/admin-auth/profileCardLinks.coachCore.test.mjs`
  - Ergebnis: `36/36` Tests bestanden
- Gezieltes ESLint:
  - `npm.cmd exec -- eslint src/components/admin/coaches/forms/coachForm.config.js src/components/admin/coaches/forms/coachForm.helpers.js src/components/admin/coaches/forms/coachForm.core.mjs src/components/admin/coaches/forms/fields/CoachRoleFields.js src/components/admin/coaches/forms/AdminCoachesForm.js src/components/admin/coaches/services/coachSeasonalWriteCore.mjs src/components/admin/coaches/services/coachWrite.service.js src/components/admin/coaches/services/coachWriteRollbackCore.mjs src/components/admin/persons/coachRoleSummary.mjs src/components/admin/settings/helpers/settingsInitialState.js src/app/admin/settings/page.js src/components/website/department/DepartmentPersonCard.js`
- Projektweit:
  - `npm.cmd run lint`
  - `npm.cmd run build`

## 13. Offene Risiken

- Teamlose Coaches benoetigen weiterhin einen gespeicherten Fallback-Rollenwert im Masterdatensatz.
- `DepartmentPersonCard.js` bleibt absichtlich generisch und behaelt Legacy-Rollen nur als allerletzten Display-Fallback.
- Eine komplette Abschaltung der Masterrollen-Writes wuerde ohne Ersatzstrategie den teamlosen Legacy-Fallback verlieren.

## 14. Readiness fuer spaetere Spaltenentfernung

- Die fachliche Abhaengigkeit aktueller Teamrollen von `coaches.role*` ist entfernt.
- Fuer produktive Teamrollen ist der Read praktisch `FALLBACK_ONLY`.
- Fuer die Spaltenentfernung fehlt noch eine Strategie fuer teamlose Coach-Rollen und generische Legacy-Anzeige.

## 15. Empfohlener naechster Schritt

Naechster Schritt ist die explizite Entscheidung, wie teamlose Coach-Rollen kuenftig ohne `coaches.role*` gespeichert oder angezeigt werden sollen. Erst danach ist ein realistischer Plan fuer `WRITE_DISABLE_READY` oder Migration moeglich.
