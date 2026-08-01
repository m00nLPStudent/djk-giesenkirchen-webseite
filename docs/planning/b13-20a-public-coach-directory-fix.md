# B13.20A - Public Coach Directory Fix

## 1. Fehlerbild

Auf `/fussball/abteilung/trainer` wurden Coach-Karten mit dem falschen Namen `Kontaktperson` gerendert. Zudem blieben deaktivierte oder archivierte Coaches auf oeffentlichen Coach-Seiten sichtbar, obwohl sie aus Teamansichten bereits verschwanden.

## 2. Root Cause Name

Der oeffentliche Coach-Read-Pfad liefert DTOs mit `displayName`, `firstName` und `lastName`. Die generische Kartenkomponente `DepartmentPersonCard` hat aber nur `first_name`, `last_name` und `name` ausgewertet. Dadurch griff sie bei Coach-DTOs auf ein Legacy-/Fallback-Feld zurueck und konnte `Kontaktperson` als Personenname rendern.

Zusatzschutz:

- `createCoachReadDto(...)` behandelt `coaches.name = "Kontaktperson"` nicht mehr als gueltigen Personenname.
- Bei fehlenden Namen wird jetzt neutral `Name nicht hinterlegt` angezeigt.

## 3. Root Cause Archivfilter

Der Listenpfad fuer `/fussball/abteilung/trainer` filterte bereits auf `coaches.is_active = true`, aber:

- `loadPublicCoachBySlug(...)` filterte den oeffentlichen Profilpfad nicht auf aktive Coaches.
- `loadPublicCoachDtosByIds(...)` filterte Team-Coach-Loads nicht zusaetzlich auf aktive Coach-Masterdatensaetze.
- Nach Coach-Save/Delete wurde nur `/admin/coaches` revalidiert, nicht aber die oeffentlichen Coach- und Teamseiten.

Dadurch konnten deaktivierte Coaches ueber gecachte oeffentliche Seiten sichtbar bleiben. Eine aktive Assignment-Zeile allein reicht jetzt nicht mehr, um einen inaktiven Coach oeffentlich sichtbar zu machen.

## 4. Geaenderte Dateien

- `src/components/website/department/DepartmentPersonCard.js`
- `src/components/website/department/department.helpers.js`
- `src/components/website/department/department.helpers.test.mjs`
- `src/components/website/coach/coachPublic.repository.js`
- `src/components/admin/persons/coachReadDto.js`
- `src/components/admin/persons/coachReadDto.test.mjs`
- `src/app/admin/coaches/actions.js`

## 5. Datenpfad vorher

`page.js` -> `loadActivePublicCoachDtos(...)` -> `createCoachReadDto(...)` -> `DepartmentPersonCard`

Vorherige Schwaechen:

- DTO lieferte camelCase-Namensfelder.
- Karte las nur snake_case-/Legacy-Felder.
- Slug- und Team-Loads hatten keinen konsequenten Master-`is_active`-Filter.
- Oeffentliche Routen wurden nach Admin-Aenderungen nicht revalidiert.

## 6. Datenpfad nachher

`page.js` -> `loadActivePublicCoachDtos(...)` -> `createCoachReadDto(...)` -> `getDepartmentPersonDisplayName(...)` -> `DepartmentPersonCard`

Zusatzregeln:

- `loadPublicCoachBySlug(...)` liest nur aktive Coaches.
- `loadPublicCoachDtosByIds(...)` liest nur aktive Coaches.
- Admin-Save/Delete revalidiert:
  - `/fussball/abteilung/trainer`
  - `/trainer/[slug]`
  - `/fussball/[slug]`

## 7. DTO-Struktur

Oeffentlich relevant bleibt:

- `coachId`
- `firstName`
- `lastName`
- `displayName`
- `slug`
- `imageUrl`
- `license`
- `assignments`
- `primaryAssignment`
- `roleLabels`
- `isActive`

Namensregel:

- zuerst `displayName`
- sonst `firstName + lastName`
- sonst `name`
- niemals `Kontaktperson`
- sonst `Name nicht hinterlegt`

## 8. Aktivfilter

Kanonische Regel:

- `coaches.is_active = true`

Fuer Teamdarstellungen bleibt zusaetzlich bestehen:

- `coach_team_seasons.is_active = true`
- nur aktuelle saisonale Assignments

Ein inaktiver Coach wird damit weder ueber Profilroute noch ueber Team-Coach-Loads sichtbar.

## 9. Mehrfachzuordnungen

Die saisonale Aggregation bleibt unveraendert:

- ein Coach erscheint pro Karte nur einmal
- mehrere Teams und Rollen bleiben in `assignments` erhalten
- Team-Coach-Karten filtern weiter teambezogen ueber `mapCoachDtosForTeam(...)`

## 10. Cache/Revalidation

Geaendert wurde nur die gezielte Revalidation nach Coach-Save/Delete. Es wurde keine globale Cache-Deaktivierung eingefuehrt.

## 11. Tests

Gezielt abgedeckt:

- Name aus `displayName`
- Name aus camelCase-Feldern
- neutraler Leerzustand statt `Kontaktperson`
- `getCoachDisplayName(...)` ignoriert `Kontaktperson` als Legacy-Namensfallback
- oeffentliche Repository-Filter wurden code-seitig auf konsequentes Master-`is_active` erweitert

## 12. Offene Risiken

- Bestehende projektweite Lint-Fehler ausserhalb dieses Fixes bleiben unveraendert.
- Route-Revalidation deckt die oeffentlichen Coach- und Teamseiten jetzt gezielt ab; falls spaeter weitere coachabhaengige Landingpages dazukommen, muessen sie in dieselbe Revalidation aufgenommen werden.

## 13. Empfohlener naechster Schritt

Nach diesem Fix kann B13.21 beziehungsweise der naechste Legacy-/Snapshot-Schritt weitergefuehrt werden. Fuer oeffentliche Coach-Reads waere als spaetere Härtung noch sinnvoll, eine kleine gemeinsame Public-Person-View-Testabdeckung fuer Department-Karten zu behalten, falls weitere DTO-Formen hinzukommen.
