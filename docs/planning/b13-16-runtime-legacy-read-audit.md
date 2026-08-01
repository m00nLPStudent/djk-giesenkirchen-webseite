# B13.16 - Runtime Legacy Read Audit

## Ziel

Dieses Audit prueft ausschliesslich den Runtime-Code unter `src/` auf verbliebene produktive Legacy-Reads nach den saisonalen B13-Schritten. Es wurden keine SQL-Dateien ausgefuehrt, keine Migrationen geschrieben und keine produktiven Dateien veraendert.

## Scope

Geprueft wurden insbesondere:

- `players.team_id`
- `players.photo_url`
- `coaches.team_id`
- `coaches.team_name`
- `coaches.role`
- `coaches.role_de`
- `coaches.role_en`
- `coaches.photo_url`
- direkte saisonale Informationsreads aus `teams.*`

Die vollstaendige Einzelinventur steht in [docs/planning/b13-16-runtime-legacy-read-status.csv](/C:/Users/swen7/Desktop/Website_GK/djk-giesenkirchen-webseite/docs/planning/b13-16-runtime-legacy-read-status.csv).

## Statistik

- Anzahl Legacy Reads: `65`
- Anzahl Runtime Reads: `65`
- Anzahl Admin Reads: `47`
- Anzahl Public Reads: `18`
- Anzahl echter Blocker: `21`
- Anzahl sofort entfernbarer Reads: `11`

## Feldstatus

| Legacy-Feld | Bewertung |
| --- | --- |
| `players.team_id` | `BLOCKED` |
| `players.photo_url` | `BLOCKED` auf Feldebene, aber mehrere Display-Quick-Wins sind `READY` |
| `coaches.team_id` | `BLOCKED` |
| `coaches.team_name` | `BLOCKED` |
| `coaches.role*` | `BLOCKED` |
| `coaches.photo_url` | `BLOCKED` auf Feldebene, aber mehrere Display-Quick-Wins sind `READY` |
| `teams.season` | nicht vollstaendig entfernt, mehrere reine Display-Fallbacks sind `READY` |
| `teams.training_times_de` | `BLOCKED` |
| `teams.description_de` | `BLOCKED` |
| `teams.description_en` | `BLOCKED` |
| `teams.training_times_en` | `BLOCKED` |

## Direkt beantwortete Zusatzpruefungen

- Oeffentliche Seiten mit `players.team_id`: ja, noch in [src/app/(website)/fussball/[slug]/page.js](/C:/Users/swen7/Desktop/Website_GK/djk-giesenkirchen-webseite/src/app/(website)/fussball/[slug]/page.js:221).
- Oeffentliche Seiten mit `coaches.team_id`: im aktuellen Runtime-Code keine direkte produktive Public-Nutzung mehr gefunden.
- Admin-Listen mit Legacy-Reads: ja, insbesondere [src/app/admin/players/page.js](/C:/Users/swen7/Desktop/Website_GK/djk-giesenkirchen-webseite/src/app/admin/players/page.js:34), [src/components/admin/players/list/playerList.helpers.js](/C:/Users/swen7/Desktop/Website_GK/djk-giesenkirchen-webseite/src/components/admin/players/list/playerList.helpers.js:47), [src/app/admin/coaches/page.js](/C:/Users/swen7/Desktop/Website_GK/djk-giesenkirchen-webseite/src/app/admin/coaches/page.js:34), [src/app/admin/teams/page.js](/C:/Users/swen7/Desktop/Website_GK/djk-giesenkirchen-webseite/src/app/admin/teams/page.js:15), [src/components/admin/teams/AdminTeamsList.js](/C:/Users/swen7/Desktop/Website_GK/djk-giesenkirchen-webseite/src/components/admin/teams/AdminTeamsList.js:42).
- Legacy in Suche, Filter, Scopes, Delete-Guards, Widgets, Profile, Teamseiten, Trainerseiten, Departmentseiten, Topbar oder Helpern: ja, vor allem in Player-Filtern, Team-Create/Edit-Selektoren, Team-Delete-Guard, saisonalen Read-Model-Fallbacks, DTOs, generic entity helpers und Coach-Profile-Linking.
- Versteckte Helper oder Repositorys mit Legacy als Primaerquelle: ja, u. a. `playerSeasonalReadModelRepository`, `coachSeasonalReadModelRepository`, `seasonalReadModelCore`, `personTeamLegacyRepository`, `coachRoleSummary`, `entity`, `teamFormInitialState`, `profileCardLinks.repository`.

## Blocker

- `players.team_id` blockiert weiterhin Player-Listenfilter, Team-Create/Edit-Selektoren, das Player-Seasonal-Read-Model, den Team-Delete-Guard und einen Public-Fallback auf der Teamseite.
- `coaches.role*` blockiert weiterhin teamlose Coaches, Team-Edit-Fallbacks, Settings-Forwarding, Profile-Linking, generische Department-Karten und interne Rollback-/Write-Pfade.
- `coaches.team_id` und `coaches.team_name` blockieren weiterhin Coach-Seasonal-Read-Model-Fallbacks und den generischen Team-ID-Fallback in Personen-Repositories.
- `teams.training_times_de` ist weiterhin eine echte produktive Quelle fuer oeffentliche Teamkarten, Teamdetails und das oeffentliche Spielerprofil.
- `teams.description_de` und `teams.training_times_*` bleiben im Team-Formular als Fallback aktiv, solange fuer ausgewaehlte Saisons nicht ausschliesslich `team_seasons` verwendet wird.
- `players.team_id` im Team-Delete-Guard ist weiterhin kritisch, weil er Archivierungsentscheidungen beeinflusst.

## Quick Wins

- `players.photo_url` in [TeamPlayerCard.js](/C:/Users/swen7/Desktop/Website_GK/djk-giesenkirchen-webseite/src/components/website/team/TeamPlayerCard.js:8), [PlayerProfileImageCard.js](/C:/Users/swen7/Desktop/Website_GK/djk-giesenkirchen-webseite/src/components/website/player-profile/PlayerProfileImageCard.js:16) und [PlayerCard.js](/C:/Users/swen7/Desktop/Website_GK/djk-giesenkirchen-webseite/src/components/admin/players/components/PlayerCard.js:34) ist display-only und mit geringem Risiko auf `image_url` oder DTO-`imageUrl` umstellbar.
- `coaches.photo_url` in [CoachProfileImageCard.js](/C:/Users/swen7/Desktop/Website_GK/djk-giesenkirchen-webseite/src/components/website/coach-profile/CoachProfileImageCard.js:16) und [TeamCoachCard.js](/C:/Users/swen7/Desktop/Website_GK/djk-giesenkirchen-webseite/src/components/website/team/TeamCoachCard.js:4) ist display-only und schnell eliminierbar.
- `teams.season` in reinen Anzeige-Fallbacks wie [app/admin/teams/page.js](/C:/Users/swen7/Desktop/Website_GK/djk-giesenkirchen-webseite/src/app/admin/teams/page.js:15), [TeamTrainingInfo.js](/C:/Users/swen7/Desktop/Website_GK/djk-giesenkirchen-webseite/src/components/website/team/TeamTrainingInfo.js:30), [TeamIntroCard.js](/C:/Users/swen7/Desktop/Website_GK/djk-giesenkirchen-webseite/src/components/website/team/TeamIntroCard.js:23), [TeamHero.js](/C:/Users/swen7/Desktop/Website_GK/djk-giesenkirchen-webseite/src/components/website/team/TeamHero.js:16) und [TeamCard.js](/C:/Users/swen7/Desktop/Website_GK/djk-giesenkirchen-webseite/src/components/admin/teams/components/TeamCard.js:61) ist weitgehend ersetzbar, sobald dort nur noch saisonal gemergte Daten ankommen.

## Empfohlene Reihenfolge der Entfernung

1. Reine Bild-Fallbacks auf `players.photo_url` und `coaches.photo_url` in Display-Komponenten entfernen.
2. Reine Anzeige-Fallbacks auf `teams.season` entfernen.
3. Admin-Playerliste von `players.team_id` in Query, Filter und Teamoptionen auf Assignment-/DTO-Daten umstellen.
4. Public-Team- und Playerseiten von `players.team_id` und `teams.training_times_de` auf saisonale Quellen umstellen.
5. `coaches.team_id` und `coaches.team_name` aus Seasonal-Read-Model-Fallbacks und Personen-Repositories entfernen.
6. `coaches.role*` zuletzt bereinigen, zusammen mit dem teamlosen/general-staff Zielmodell aus B13.14/B13.15.
7. Interne Write-/Rollback-Lesestellen erst ganz am Ende entfernen, nachdem alle Runtime-Reads davor entfallen sind.

## Auffaelligste Restmuster

| Bereich | Restmuster | Bewertung |
| --- | --- | --- |
| Player-Admin | `players.team_id` bleibt Filter- und Query-Input in Liste, Team-Edit und Delete-Guard | Kritischer Blocker |
| Coach-Admin | `coaches.role*` bleibt in Form, Settings, Team-Edit und Profile-Linking aktiv | Kritischer Blocker |
| Coach-Fallback-Modelle | `coaches.team_id` und `coaches.team_name` speisen weiter Seasonal-Fallbacks | Kritischer Blocker |
| Public Team/Player | `players.team_id` und `teams.training_times_de` bleiben in Public-Pfaden aktiv | Kritischer Blocker |
| Generic UI | `DepartmentPersonCard` und `entity.js` behalten breite Legacy-Fallbacks | Mittlerer Blocker |

## Fazit

Die saisonale Kernarchitektur ist vorhanden, aber die Runtime ist noch nicht legacy-read-frei. Es gibt keine verbleibende direkte Public-Nutzung von `coaches.team_id`, aber weiterhin einen Public-Fallback auf `players.team_id`, mehrere Admin-Filter auf `players.team_id`, eine breite `coaches.role*`-Fallback-Kette und weiterhin direkte saisonale Teaminhalte aus `teams.*`.

Fuer B13.17 sollte der Schwerpunkt zuerst auf den risikoarmen Display-Quick-Wins und danach auf den strukturellen Blockern `players.team_id`, `teams.training_times_de` sowie `coaches.team_id/team_name/role*` liegen.
