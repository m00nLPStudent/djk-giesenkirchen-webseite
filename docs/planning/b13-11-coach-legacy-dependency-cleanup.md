# B13.11 - Coach Legacy Dependency Cleanup

## 1. Ziel

Die verbliebenen Runtime-Abhaengigkeiten von `coaches.team_id`, `coaches.team_name`, `coaches.role*` und `coaches.photo_url` wurden fuer Scope-, Delete-Guard-, generische Helper- und Snapshot-Pfade bereinigt oder als bewusst temporaer verbleibend eingeordnet.

## 2. Geaenderte Dateien

- Runtime:
  - `src/components/admin/persons/personTeamRepository.js`
  - `src/components/admin/persons/personTeamLegacyRepository.js`
  - `src/components/admin/teams/services/teamDelete.service.js`
  - `src/components/admin/teams/services/teamDelete.core.mjs`
  - `src/components/admin/utils/entity.js`
  - `src/components/website/department/department.helpers.js`
  - `src/components/admin/coaches/services/coachSeasonalWriteCore.mjs`
- Tests:
  - `src/components/admin/coaches/services/coachSeasonalWriteCore.test.mjs`
  - `src/components/admin/teams/services/teamDelete.service.test.mjs`
  - `src/components/admin/utils/entity.test.mjs`
  - `src/components/website/department/department.helpers.test.mjs`
- Doku:
  - `docs/planning/b13-11-coach-legacy-dependency-cleanup.md`
  - `docs/planning/b13-11-coach-legacy-status.csv`

## 3. Scope-Umstellung

- `src/lib/admin-auth/scopes/scopeRepository.js` blieb saisonal-first: regulaere Coach-Scopes werden weiterhin aus `coach_team_seasons -> team_seasons -> team_id` geladen.
- `src/components/admin/persons/personTeamLegacyRepository.js` nutzt fuer Coaches jetzt standardmaessig keinen Legacy-Fallback mehr.
- `src/components/admin/persons/personTeamRepository.js` kapselt den verbleibenden `coaches.team_id`-Fallback explizit als temporaeren Admin-Kompatibilitaetspfad fuer noch nicht relational migrierte Coach-Profile.
- Ergebnis: `coaches.team_id` ist keine kanonische Scope-Quelle mehr. Der Fallback bleibt nur fuer konsumierende Coach-Admin-Pfade erhalten.

## 4. Delete-/Archivierungs-Guard

- Die Team-Abhaengigkeitspruefung liest Coach-Beziehungen nicht mehr ueber `coaches.team_id`.
- `src/components/admin/teams/services/teamDelete.core.mjs` zaehlt Coach-Abhaengigkeiten ausschliesslich ueber `team_seasons -> coach_team_seasons`.
- Aktive und historische Coach-Zuordnungen blockieren weiterhin den Hard-Delete und fuehren bevorzugt zur Archivierung.
- Es gibt keine N+1-Abfrage; die Zaehllogik arbeitet weiter mit Sammelabfragen.

## 5. Verbleibende Legacy-Writes

Diese Master-Snapshot-Writes bleiben vorerst aktiv in `src/components/admin/coaches/services/coachSeasonalWriteCore.mjs`:

- `coaches.team_id`
- `coaches.team_name`
- `coaches.role`
- `coaches.role_de`
- `coaches.role_en`
- `coaches.sort_order`

Begruendung:

- `team_id` und `team_name` werden noch fuer Legacy-Fallbacks in Read-Model und Rollback benoetigt.
- `role*` wird noch in Formular-Fallbacks, Team-Edit-Fallbacks, Profil-Linking und DTO-Restpfaden gelesen.
- `sort_order` bleibt Bestandteil des Coach-Masterdatensatzes.

## 6. Verbleibende Legacy-Reads

- `coaches.team_id`:
  - `src/components/admin/persons/coachSeasonalReadModelRepository.js`
  - `src/components/admin/persons/personTeamLegacyRepository.js`
  - `src/components/admin/coaches/forms/coachForm.helpers.js`
  - `src/components/admin/coaches/services/coachWrite.service.js`
  - `src/components/admin/coaches/services/coachWrite.repository.js`
- `coaches.team_name`:
  - `src/components/admin/persons/coachSeasonalReadModelRepository.js`
  - `src/components/admin/coaches/services/coachWrite.service.js`
  - `src/components/admin/coaches/services/coachWrite.repository.js`
- `coaches.role*`:
  - `src/components/admin/persons/coachReadDto.js`
  - `src/components/admin/coaches/forms/coachForm.helpers.js`
  - `src/components/admin/coaches/utils/coachStats.js`
  - `src/components/admin/teams/teamCoachAssignments.core.mjs`
  - `src/components/admin/teams/forms/tabs/TeamStaffTab.js`
  - `src/lib/admin-auth/profileCardLinks.repository.js`
  - `src/components/admin/coaches/services/coachWrite.service.js`
  - `src/components/admin/coaches/services/coachWrite.repository.js`
- `coaches.photo_url`:
  - `src/components/admin/persons/coachReadDto.js`
  - `src/components/admin/coaches/forms/coachForm.helpers.js`
  - `src/components/admin/coaches/services/coaches.service.js`
  - `src/components/admin/coaches/services/coachWrite.service.js`
  - `src/components/admin/coaches/services/coachWrite.repository.js`
  - `src/components/website/coach/coachPublic.repository.js`
  - `src/components/website/coach-profile/CoachProfileImageCard.js`
  - `src/components/website/team/TeamCoachCard.js`
  - `src/components/website/department/DepartmentPersonCard.js`
  - `src/app/admin/coaches/page.js`

## 7. Rollen-Fallbacks

- Relationale Rollen aus `coach_team_seasons` bleiben primaer.
- Masterrollen bleiben als Fallback fuer Coaches ohne aktuelle Assignment-Zeile aktiv.
- `buildCoachMasterPayload()` priorisiert jetzt `role_de` vor `role`, wenn keine relationale Primaerzuordnung vorhanden ist.
- Noch blockierend sind vor allem Team-Edit, Profil-Linking und DTO-/Form-Fallbacks.

## 8. Bild-Fallback

- `image_url` bleibt kanonisch.
- Der Master-Write auf `coaches.photo_url` wurde deaktiviert.
- `photo_url` bleibt nur noch als Read-Fallback aktiv, damit Altbilder in Admin und Website sichtbar bleiben.

## 9. Deaktivierte Writes

- Deaktiviert: `coaches.photo_url`

## 10. Noch blockierte Felder

- `coaches.team_id`
- `coaches.team_name`
- `coaches.role`
- `coaches.role_de`
- `coaches.role_en`

Hauptblocker:

- Legacy-Fallback fuer noch nicht relational aufgeloeste Coach-Profile
- Rollback-Wiederherstellung im Coach-Schreibpfad
- Team-Edit-Fallbackrollen
- Profil-Linking und einzelne Anzeige-Fallbacks

## 11. Tests

- Gezielte Tests:
  - `node --test src/components/admin/coaches/services/coachSeasonalWriteCore.test.mjs src/components/admin/teams/services/teamDelete.service.test.mjs src/components/admin/utils/entity.test.mjs src/components/website/department/department.helpers.test.mjs`
  - Ergebnis: erfolgreich (`20/20` Tests)
- `npm.cmd run lint`
  - Ergebnis: fehlgeschlagen wegen bestehender projektweiter Altfehler (`13` Errors, `41` Warnings), kein B13.11-spezifischer Treffer in den geaenderten Dateien
- `npm.cmd run build`
  - Ergebnis: erfolgreich nach Freigabe ausserhalb der Sandbox; initialer Sandbox-Fehler betraf ausschliesslich den Google-Font-Fetch fuer `Geist` und `Geist Mono`

## 12. Offene Risiken

- Admin-Coach-Fallbacks ueber `team_id/team_name` bleiben fuer nicht vollstaendig saisonal migrierte Datensaetze aktiv.
- Team-Edit und Profil-Linking lesen weiterhin Masterrollen als Uebergangspfad.
- `photo_url` ist als Read-Fallback noch auf mehreren Website- und Admin-Komponenten vorhanden.

## 13. Readiness fuer Spaltenentfernung

- `coaches.photo_url`: naechster Kandidat, aber erst nach Validierung der verbleibenden Fallback-Reader.
- `coaches.team_id` und `coaches.team_name`: noch nicht bereit, weil Read-Fallback und temporaere Sync-Writes aktiv bleiben.
- `coaches.role*`: noch nicht bereit, weil mehrere Runtime-Konsumenten noch auf Masterrollen zurueckfallen.
- Gesamtbewertung: keine weitere Coach-Legacy-Spalte ist bereits `READY_FOR_MIGRATION`.

## 14. Empfohlener naechster Schritt

Empfohlen fuer B13.12+ ist die gezielte Ablosung der verbleibenden Masterrollen-Fallbacks in:

- `src/components/admin/teams/teamCoachAssignments.core.mjs`
- `src/lib/admin-auth/profileCardLinks.repository.js`
- `src/components/admin/persons/coachReadDto.js`

Danach sollte der `team_id/team_name`-Fallback nur noch fuer echte Bestandsdaten-Validierung uebrig bleiben, bevor eine spaetere Spaltenentfernungsplanung startet.
