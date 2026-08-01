# B13.17 - Risikoarme Legacy-Quick-Wins

## 1. Ziel

In diesem Schritt wurden ausschliesslich risikoarme Anzeige- und DTO-Fallbacks fuer `players.photo_url`, `coaches.photo_url` und `teams.season` bereinigt oder zentralisiert. Es wurden keine Datenbankaenderungen, keine Migrationen, keine Scope-/Permission-Aenderungen und keine grundlegenden Write-/Rollback-Umbauten vorgenommen.

## 2. Geaenderte Dateien

- `src/lib/people/imageUrl.js`
- `src/lib/people/imageUrl.test.mjs`
- `src/lib/football/seasonDisplay.js`
- `src/lib/football/seasonDisplay.test.mjs`
- `src/components/website/team/TeamPlayerCard.js`
- `src/components/website/player-profile/PlayerProfileImageCard.js`
- `src/components/admin/players/components/PlayerCard.js`
- `src/components/website/coach-profile/CoachProfileImageCard.js`
- `src/components/website/team/TeamCoachCard.js`
- `src/components/website/department/DepartmentPersonCard.js`
- `src/components/admin/teams/components/TeamCard.js`
- `src/components/admin/teams/AdminTeamsList.js`
- `src/components/website/team/TeamTrainingInfo.js`
- `src/components/website/team/TeamIntroCard.js`
- `src/components/website/team/TeamHero.js`
- `src/app/admin/teams/page.js`
- `src/app/(website)/fussball/[slug]/page.js`

## 3. Entfernte `players.photo_url`-Reads

- `src/components/website/team/TeamPlayerCard.js`
- `src/components/website/player-profile/PlayerProfileImageCard.js`
- `src/components/admin/players/components/PlayerCard.js`

Die UI-Komponenten lesen `photo_url` dort nicht mehr direkt. Oeffentliche Player-Bildpfade laufen jetzt ueber `resolvePlayerImageUrl`, die Admin-Karte wieder ueber den kanonisch priorisierten `getEntityImage`-Helper.

## 4. Verbleibende `players.photo_url`-Reads

- `src/lib/people/imageUrl.js`
- `src/components/admin/utils/entity.js`
- `src/components/admin/players/forms/playerForm.helpers.js`
- `src/app/admin/players/page.js`
- `src/components/admin/players/services/players.service.js`
- `src/components/admin/players/services/playerWrite.service.js`

Verbleibend ist `photo_url` nur noch in zentralen Resolvern, Admin-Form-Fallbacks sowie temporaeren Upload-/Rollback-Pfaden.

## 5. Entfernte `coaches.photo_url`-Reads

- `src/components/website/coach-profile/CoachProfileImageCard.js`
- `src/components/website/team/TeamCoachCard.js`

Direkte Anzeige-Fallbacks wurden dort entfernt und auf den zentralen Resolver umgestellt.

## 6. Verbleibende `coaches.photo_url`-Reads

- `src/lib/people/imageUrl.js`
- `src/components/admin/utils/entity.js`
- `src/components/website/department/DepartmentPersonCard.js`
- `src/components/website/coach/coachPublic.repository.js`
- `src/app/admin/coaches/page.js`
- `src/components/admin/persons/coachReadDto.js`
- `src/components/admin/coaches/forms/coachForm.core.mjs`
- `src/components/admin/coaches/services/coaches.service.js`
- `src/components/admin/coaches/services/coachSeasonalWriteCore.mjs`
- `src/components/admin/coaches/services/coachWrite.repository.js`
- `src/components/admin/teams/teamEditCoach.repository.js`

Der Restbestand liegt jetzt in zentralen DTO-/Resolver-Fallbacks, Admin-Formularen, Query-Dual-Reads und Write-/Rollback-Helfern.

## 7. Entfernte `teams.season`-Reads

- `src/app/admin/teams/page.js`
- `src/app/(website)/fussball/[slug]/page.js`
- `src/components/website/team/TeamTrainingInfo.js`
- `src/components/website/team/TeamIntroCard.js`
- `src/components/website/team/TeamHero.js`
- `src/components/admin/teams/components/TeamCard.js`
- `src/components/admin/teams/AdminTeamsList.js`

Die Anzeige und Teamlisten-Suche werden dort jetzt aus saisonalen Anzeigewerten gespeist, nicht mehr ueber `teams.season` als Legacy-Fallback.

## 8. Verbleibende `teams.season`-Reads

- `src/components/admin/teams/forms/helpers/teamFormInitialState.js`

Diese Stelle bleibt bewusst unangetastet, weil sie ein Admin-Form-Fallback fuer Team-Edit ohne geladenes `team_season` darstellt und nicht als reiner Display-Quick-Win behandelt wurde.

## 9. Zentrale Helper

- `resolvePlayerImageUrl` in `src/lib/people/imageUrl.js`
- `resolveCoachImageUrl` in `src/lib/people/imageUrl.js`
- `resolveSeasonDisplayName` in `src/lib/football/seasonDisplay.js`

## 10. Bestandsdaten-Kompatibilitaet

- Bestehende Spieler mit nur `photo_url` bleiben ueber `resolvePlayerImageUrl` sichtbar.
- Bestehende Trainer mit nur `photo_url` bleiben ueber `resolveCoachImageUrl` und `createCoachReadDto` sichtbar.
- Admin-Karten behalten zentrale Fallbacks in `getEntityImage`, statt die Legacy-Logik mehrfach in Komponenten zu duplizieren.
- Fehlende saisonale Teamanzeige liefert jetzt klare Leerwerte wie `Keine Saison` statt still auf `teams.season` zurueckzufallen.

## 11. Tests

- `node --test src/lib/people/imageUrl.test.mjs` : bestanden
- `node --test src/lib/football/seasonDisplay.test.mjs` : bestanden
- `node --test src/components/admin/utils/entity.test.mjs` : bestanden
- `node --test src/components/admin/persons/coachReadDto.test.mjs` : bestanden
- `node --test src/components/admin/players/services/playerSeasonalWriteCore.test.mjs` : bestanden
- `node --test src/components/admin/coaches/services/coachSeasonalWriteCore.test.mjs` : bestanden
- gezieltes ESLint auf die geaenderten Dateien : keine Fehler, nur bestehende `no-img-element`-Warnungen
- `npm.cmd run lint` : fehlgeschlagen wegen bestehender projektweiter React-Hook-Regelverstoesse ausserhalb dieses Schritts
- `npm.cmd run build` : fehlgeschlagen, weil `next/font` im Build `Geist` und `Geist Mono` von Google Fonts ohne Netzwerkzugriff nicht laden konnte

## 12. Offene Risiken

- `photo_url` ist noch nicht vollstaendig entfernbar, weil Bestandsdaten und Admin-Write-Helfer weiterhin zentrale Fallbacks brauchen.
- `coachWrite.repository.js` bleibt fuer `coaches.photo_url` blockiert, weil dort gleichzeitig strukturelle Legacy-Felder gelesen werden.
- `teamFormInitialState.js` nutzt `teams.season` weiterhin als Admin-Fallback.
- Der Voll-Lint ist aktuell projektweit nicht sauber und blockiert eine reine Gruenmeldung fuer diesen Schritt.
- Der Build ist in dieser Umgebung durch externes Font-Fetching blockiert.

## 13. Naechste strukturelle Blocker

- `players.team_id`
- `teams.training_times_de`
- `coaches.team_id`
- `coaches.team_name`
- `coaches.role`, `coaches.role_de`, `coaches.role_en`

## 14. Empfohlener naechster Schritt

Nach diesen Quick Wins sollte als naechstes der erste strukturelle Blocker `players.team_id` in Admin-Liste, Public-Teamseite und angrenzenden Seasonal-Read-Pfaden beseitigt werden. Danach folgen die oeffentlichen saisonalen Teaminhalte und anschliessend die Coach-Blocker `team_id`, `team_name` und `role*`.
