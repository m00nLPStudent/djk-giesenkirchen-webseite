# B13.10 - Coach Seasonal Read Paths

## 1. Ziel

Die verbleibenden produktiven Coach-/Trainer-Lesepfade lesen Team-, Rollen-
und Bildinformationen jetzt primär aus den saisonalen Read-Modellen
`coach_team_seasons -> team_seasons -> teams` und aus `coaches.image_url`.

## 2. Geaenderte Dateien

- `src/app/admin/coaches/page.js`
- `src/components/admin/persons/coachReadDto.js`
- `src/components/admin/persons/coachReadDto.test.mjs`
- `src/components/admin/coaches/utils/coachStats.js`
- `src/components/admin/coaches/utils/coachStats.test.mjs`
- `src/components/admin/coaches/AdminCoachesList.js`
- `src/components/admin/coaches/components/CoachCard.js`
- `src/components/admin/coaches/components/CoachTeamsOverview.js`
- `src/components/admin/topbar/adminSearch.service.js`
- `src/components/admin/utils/entity.js`
- `src/components/website/coach/coachPublic.repository.js`
- `src/components/website/department/department.helpers.js`
- `src/components/website/department/DepartmentPersonCard.js`
- `src/components/website/coach-profile/coachProfile.helpers.js`
- `src/components/website/coach-profile/CoachProfileHeader.js`
- `src/components/website/coach-profile/CoachProfileImageCard.js`
- `src/components/website/team/TeamCoachSection.js`
- `src/components/website/team/TeamCoachCard.js`
- `src/app/(website)/trainer/[slug]/page.js`
- `src/app/(website)/fussball/[slug]/page.js`
- `src/app/(website)/fussball/abteilung/trainer/page.js`

## 3. Admin-Read-Pfad

- Die Admin-Trainerliste laedt weiter einen expliziten Coach-Master-Select.
- Dazu kommt pro Batch das vorhandene saisonale Read-Model
  `getCoachSeasonalReadModelsMap(...)`.
- Ein gemeinsames DTO `createCoachReadDto(...)` normalisiert:
  - `displayName`
  - `imageUrl`
  - `assignments`
  - `primaryAssignment`
  - `roleLabels`
  - `teamNames`
  - `hasMultipleActiveAssignments`
- Stats, Karten, Suche und Team-Uebersicht arbeiten danach gegen dieselbe
  DTO-Struktur.

## 4. Oeffentliche Read-Pfade

- Das Trainerprofil laedt den Coach ueber `slug`, dazu das saisonale Read-Model,
  und zeigt Rollen/Teams aus `assignments`.
- Die Abteilungsseite fuer Trainer verwendet einen neuen serverseitigen
  Public-Repository-Loader fuer aktive Coach-DTOs.
- Die Mannschaftsseite laedt Trainer ausschliesslich ueber aktuelle
  `coach_team_seasons`; der produktive Fallback auf `coaches.team_id` wurde dort
  entfernt.
- Mehrere Rollen eines Trainers auf derselben Teamseite werden jetzt aggregiert,
  ohne den Coach doppelt zu rendern.

## 5. DTO-Struktur

- Stammdaten:
  - `coachId`
  - `firstName`
  - `lastName`
  - `displayName`
  - `slug`
  - `imageUrl`
  - `roleLabels`
  - `teamNames`
  - `primaryRoleLabel`
  - `primaryTeamName`
  - `hasMultipleActiveAssignments`
- Assignment:
  - `coachTeamSeasonId`
  - `teamSeasonId`
  - `teamId`
  - `teamNameDe`
  - `teamNameEn`
  - `teamSlug`
  - `roleDe`
  - `roleEn`
  - `sortOrder`
- Oeffentliche Komponenten erhalten keine `admin_profile_id`.
- `adminProfileLinked` wird nur im Admin-Datenpfad gesetzt.

## 6. Mehrfachzuordnungen

- Mehrere aktive Teams bleiben im DTO vollstaendig erhalten.
- Die Admin-Karte zeigt alle aktuellen Assignment-Badges.
- Die Admin-Stats zaehlen Teams ueber eindeutige `teamId`.
- Die Teamseite aggregiert mehrere Rollen pro Coach in einer Karte.
- Die Team-Uebersicht im Admin listet je Mannschaft den Coach nur einmal.

## 7. Suche und Filter

- Die Admin-Suche liest Teamnamen fuer Coaches relational aus dem saisonalen
  Modell und nicht mehr aus `coaches.team_name`.
- Die Suche beruecksichtigt alle aktuellen Teamzuordnungen eines Coaches.
- Das Ergebnis zeigt den primaeren Teamnamen oder `+n weitere`.
- Rollen- und Teamfilter der Admin-Liste arbeiten gegen `assignments[]` und
  `roleLabels`.
- Coaches ohne Assignment bleiben filterbar und crashen nicht.

## 8. Bildpfad

- `image_url` ist jetzt die primaere Bildquelle fuer Admin und Website.
- `photo_url` bleibt zentral im DTO als Uebergangs-Fallback fuer Bestandsdaten.
- Direkte komponentenweite Einzel-Fallbacks wurden reduziert und an den
  DTO-/Helper-Rand verschoben.

## 9. Entfernte Legacy-Reads

- Entfernt:
  - `src/app/admin/coaches/page.js`: fuehrende Reads auf `coaches.team_id`,
    `coaches.team_name`
  - `src/components/admin/coaches/utils/coachStats.js`: fuehrende Team-/Rollen-
    Auswertung ueber `coaches.team_id`, `coaches.team_name`, `coaches.role`
  - `src/components/admin/topbar/adminSearch.service.js`: Suche ueber
    `coaches.team_name`
  - `src/app/(website)/trainer/[slug]/page.js`: Anzeige-Fallback ueber
    `coaches.team_name`
  - `src/app/(website)/fussball/[slug]/page.js`: produktiver Teamseiten-Fallback
    ueber `coaches.team_id`
  - `src/components/website/department/DepartmentPersonCard.js`: verteilte
    Bildpriorisierung weg von direktem `photo_url`-First-Read

## 10. Verbleibende Legacy-Reads

- Zentralisierte Fallbacks im DTO:
  - `coaches.role`, `coaches.role_de`, `coaches.role_en`
  - Grund: teamlose Coaches und Bestandsdaten ohne aktuelle Assignment-Zeile
  - Status: `READ_DISABLE_READY = NO`
- Zentralisierter Bildfallback:
  - `coaches.photo_url`
  - Grund: Bestandsdaten ohne `image_url`
  - Status: `READ_DISABLE_READY = NO`
- Generische Helper-Fallbacks:
  - `src/components/admin/utils/entity.js` behaelt `team_id` / `team_name` als
    letzte Rueckfallebene fuer gemischte Alt-Consumer
  - `src/components/website/department/department.helpers.js` behaelt
    `team_name` als letzte Rueckfallebene
- Ausserhalb dieses Schritts bestehen weiterhin Legacy-Reads in:
  - Delete-Guards
  - Scope-/Repository-Fallbacks
  - Coach-Write-Snapshot-Sync

## 11. Query-Anzahl

- Admin-Coachliste:
  - `1` Coach-Master-Query
  - `5` Queries fuer das saisonale Read-Model
  - `4` bestehende Scope-Team-Queries plus optional `1` Legacy-Fallback-Query
- Admin-Suche:
  - `6` Basisqueries fuer Suchdomänen
  - `4` Coach-Seasonal-Enrichment-Queries
- Oeffentliche Trainerliste:
  - `1` Coach-Query
  - `5` Queries fuer das saisonale Read-Model
- Trainerprofil:
  - `1` Coach-by-slug-Query
  - `5` Queries fuer das saisonale Read-Model
- Mannschaftsseite Coach-Pfad:
  - `1` Current-Season-Query
  - `1` aktuelle `team_seasons`-Query
  - `1` `coach_team_seasons`-Membership-Query
  - `1` Coach-Base-Query
  - `5` Queries fuer das saisonale Read-Model
- Alle Pfade bleiben ohne N+1.

## 12. Tests

- Erfolgreich:
  - `node --test src/components/admin/persons/coachReadDto.test.mjs`
  - `node --test src/components/admin/coaches/utils/coachStats.test.mjs`
  - `node --test src/components/admin/persons/seasonalReadModelCore.test.mjs`
  - `node --test src/components/admin/teams/teamCoachAssignments.core.test.mjs`
- Gezieltes ESLint:
  - keine Fehler
  - verbleibende `<img>`-Warnings in bestehenden Website-Komponenten

## 13. Offene Risiken

- `role*`-Fallbacks bleiben fuer teamlose Coaches noch erforderlich.
- `photo_url` bleibt fuer Altbilder noch als Dual-Read aktiv.
- Die Mannschaftsseite dupliziert aktuell Saison-/Teamauflosung, weil der
  Player-Pfad in diesem Schritt bewusst unberuehrt blieb.
- Generische Helper enthalten weiterhin letzte Legacy-Rueckfallebenen fuer
  gemischte alte Consumer.

## 14. Empfohlener naechster Schritt

Als naechster Schritt sollte B13.11 die verbleibenden Coach-Legacy-Fallbacks
zentral pruefen und nur nach Regressionstest kontrolliert deaktivieren. Parallel
sollten die noch offenen Scope-/Delete-Guard-Pfade und der Write-Snapshot-Sync
fuer `team_id`, `team_name`, `role*` und `photo_url` separat abgearbeitet
werden.
