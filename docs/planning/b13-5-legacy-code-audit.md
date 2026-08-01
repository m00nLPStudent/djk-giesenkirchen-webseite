# B13.5 Legacy Code Audit

## Scope

- Gepruefter Runtime-Code: `src/`
- Gepruefte Dateien: `585`
- Audit-Ziel: ausschliesslich verbleibende Runtime-Verwendungen der Legacy-Felder
  - `players.team_id`
  - `players.photo_url`
  - `coaches.team_id`
  - `coaches.team_name`
  - `coaches.photo_url`
- Nicht als Legacy-Fundstellen gezaehlt:
  - `events.team_id`
  - `team_seasons.team_id`
  - andere `team_id`-Verwendungen ausserhalb von `players` und `coaches`

## Zusammenfassung

### Spieler

| Legacy-Feld | Anzahl Fundstellen |
|-------------|--------------------|
| `players.team_id` | 15 |
| `players.photo_url` | 9 |

### Trainer

| Legacy-Feld | Anzahl Fundstellen |
|-------------|--------------------|
| `coaches.team_id` | 12 |
| `coaches.team_name` | 7 |
| `coaches.photo_url` | 2 |

### Kurzfazit

- Die meisten produktiven Abhaengigkeiten liegen noch in Admin-Formularen, Scope-/Fallback-Logik und den oeffentlichen Teamseiten.
- `players.team_id` und `coaches.team_id` werden weiterhin aktiv fuer Filter, Fallback-Queries, Deleteschutz und Scope-Aufloesung genutzt.
- `players.photo_url` ist weiterhin im Player-Rendering und im kompletten Admin-Bildfluss verankert.
- `coaches.team_name` lebt vor allem als Anzeige- und Such-Fallback weiter.
- Fuer `coaches.photo_url` wurden keine expliziten Select-/Write-Pfade gefunden; verbleibend sind nur generische Fallback-Reads.

## Detailfundstellen

### `players.team_id`

| Datei | Zeile | Legacy-Feld | Art der Nutzung | Risiko | Beschreibung | Empfohlene Abloesung |
|-------|------:|-------------|-----------------|--------|--------------|----------------------|
| `src/app/admin/teams/new/page.js` | 72 | `players.team_id` | Filter | Kritisch | Die Team-Neuanlage filtert verfuegbare Spieler ueber das Legacy-Feld `team_id.is.null` bzw. `team_id.in(...)`. | `player_team_seasons` + aktive `team_seasons` |
| `src/app/admin/teams/edit/[id]/page.js` | 67 | `players.team_id` | Filter | Kritisch | Die Team-Bearbeitung laedt verfuegbare Spieler weiterhin ueber `team_id.is.null,team_id.eq.<teamId>`. | `player_team_seasons` + aktive `team_seasons` |
| `src/app/admin/players/page.js` | 37 | `players.team_id` | Lesen, DTO | Kritisch | Die Admin-Spielerliste selektiert `team_id` direkt aus `players` und schleust es in den Runtime-Datensatz durch. | `player_team_seasons` + `team_seasons` |
| `src/components/admin/utils/entity.js` | 13 | `players.team_id` | Mapping | Mittel | Die gemeinsame Admin-Helferfunktion bildet Team-Badges mit Fallback auf `entity.team_id`, falls keine neue Team-Relation vorhanden ist. | `player_team_seasons` + `teams` ueber aktuelle Saisonrelation |
| `src/components/admin/players/forms/playerForm.helpers.js` | 7 | `players.team_id` | Formular, DTO | Kritisch | Das Admin-Player-Formular haelt `team_id` weiterhin im Formularzustand und traegt es in den Submit-Payload mit. | `player_team_seasons` + dedizierte Saisonzuordnung |
| `src/components/admin/players/forms/playerForm.config.js` | 25 | `players.team_id` | Validierung | Gering | Die Pflichtfeld-Konfiguration behandelt `team_id` weiterhin als erforderliches Legacy-Formularfeld. | Validierung gegen `player_team_seasons` / Ziel-`team_season_id` |
| `src/app/admin/players/actions.js` | 20 | `players.team_id` | Server Action, Scope | Kritisch | Die Server Action normalisiert Zielteams direkt aus `payload.team_id` fuer Berechtigungspruefungen. | Ziel-Team aus `team_season_id` bzw. Saisonzuordnung ableiten |
| `src/components/admin/players/services/players.service.js` | 36 | `players.team_id` | Schreiben | Kritisch | Der Player-Speicherpfad schreibt `team_id` weiterhin beim Insert/Update in `players`. | `player_team_seasons` schreiben, `players.team_id` nicht mehr persistieren |
| `src/components/admin/players/list/playerList.helpers.js` | 47 | `players.team_id` | Filter, Sortierung | Mittel | Team-Filteroptionen und aktive Filterlogik nutzen `player.team_id` statt der Saisonrelation. | Teamfilter aus `teams`/`player_team_seasons` erzeugen |
| `src/components/admin/players/forms/fields/PlayerBasicFields.js` | 28 | `players.team_id` | Formular | Kritisch | Das Player-Basisformular bietet weiterhin ein direktes Select fuer `team_id`. | Auswahl einer `team_season_id` oder eigener Saisonzuordnungs-UI |
| `src/components/admin/players/forms/AdminPlayersForm.js` | 59 | `players.team_id` | Formular, Mapping | Kritisch | Das Formular leitet das aktuell gewaehlte Team weiterhin aus `form.team_id` ab und koppelt daran Folgeoptionen. | Aktives Team aus der Saisonzuordnung ableiten |
| `src/components/admin/topbar/adminSearch.service.js` | 23 | `players.team_id` | API, Select | Gering | Die Admin-Suche selektiert `team_id` bei Spielern mit, nutzt den Wert aber aktuell nicht weiter. | Feld aus dem Select entfernen oder aus Saisonrelation ableiten |
| `src/app/(website)/fussball/[slug]/page.js` | 221 | `players.team_id` | API, Fallback-Query | Kritisch | Die oeffentliche Teamseite faellt bei fehlenden Saisonzuordnungen auf `players.eq("team_id", team.id)` zurueck. | `player_team_seasons` + aktuelle `team_season` |
| `src/components/admin/teams/services/teamDelete.service.js` | 95 | `players.team_id` | Delete-Guard | Kritisch | Vor Team-Loeschung/-Archivierung wird weiterhin direkt auf abhaengige `players.team_id` gezaehlt. | Abhaengigkeiten ueber `player_team_seasons` aufloesen |
| `src/components/admin/persons/personTeamRepository.js` | 122 | `players.team_id` | Repository, Fallback | Kritisch | Die Personen-Repository-Logik fuellt fehlende Teamzuordnungen weiterhin aus `players.team_id` nach. | Ausschliesslich `player_team_seasons` + aktive Saison verwenden |

### `players.photo_url`

| Datei | Zeile | Legacy-Feld | Art der Nutzung | Risiko | Beschreibung | Empfohlene Abloesung |
|-------|------:|-------------|-----------------|--------|--------------|----------------------|
| `src/components/website/player-profile/PlayerProfileImageCard.js` | 16 | `players.photo_url` | Anzeige | Kritisch | Die oeffentliche Spielerprofilseite rendert das Bild weiterhin aus `player.photo_url`. | `players.image_url` |
| `src/components/website/team/TeamPlayerCard.js` | 8 | `players.photo_url` | Anzeige | Kritisch | Spielerkarten auf Teamseiten nutzen weiterhin `photo_url` als Bildquelle. | `players.image_url` |
| `src/components/admin/utils/entity.js` | 19 | `players.photo_url` | Mapping, Anzeige | Mittel | Die gemeinsame Admin-Bildhilfe faellt standardmaessig auf `photo_url` zurueck. | `players.image_url` |
| `src/components/admin/hooks/useImageUpload.js` | 15 | `players.photo_url` | Formular, Upload-Kontext | Mittel | Der gemeinsame Upload-Hook uebergibt `photo_url` weiterhin im Action-Kontext; der Player-Flow haengt daran. | Nur noch `image_url` durchreichen |
| `src/app/admin/players/page.js` | 37 | `players.photo_url` | Lesen | Kritisch | Die Admin-Spielerliste selektiert `photo_url` weiterhin direkt aus `players`. | `players.image_url` |
| `src/components/admin/players/forms/playerForm.helpers.js` | 13 | `players.photo_url` | Formular, Schreiben | Kritisch | Initialzustand und Submit-Payload des Player-Formulars arbeiten weiterhin mit `photo_url`. | `players.image_url` |
| `src/components/admin/players/services/players.service.js` | 43 | `players.photo_url` | Schreiben, Repository, Upload | Kritisch | Der Player-Service nutzt `photo_url` in Repository-Konfiguration, beim Upload-Replace und beim finalen Insert/Update-Payload. | `players.image_url` |
| `src/components/admin/players/forms/AdminPlayersForm.js` | 83 | `players.photo_url` | Formular, Upload, Anzeige | Kritisch | Der komplette Medien-Tab des Player-Formulars bindet Bild-Preview, Upload und State noch an `form.photo_url`. | `players.image_url` |
| `src/components/admin/players/components/PlayerCard.js` | 34 | `players.photo_url` | Anzeige | Kritisch | Admin-Spielerkarten priorisieren `photo_url` vor `image_url` fuer die Bildausgabe. | `players.image_url` |

### `coaches.team_id`

| Datei | Zeile | Legacy-Feld | Art der Nutzung | Risiko | Beschreibung | Empfohlene Abloesung |
|-------|------:|-------------|-----------------|--------|--------------|----------------------|
| `src/components/admin/coaches/utils/coachStats.js` | 38 | `coaches.team_id` | Mapping, Filter | Mittel | Statistik- und Uebersichtslogik bildet Teams und Filter weiterhin aus `coach.team_id`. | `coach_team_seasons` + aktive `team_seasons` |
| `src/components/admin/coaches/services/coaches.service.js` | 39 | `coaches.team_id` | Schreiben | Kritisch | Der Coach-Speicherpfad schreibt `team_id` weiterhin in die Tabelle `coaches`. | `coach_team_seasons` schreiben, `coaches.team_id` entkoppeln |
| `src/components/admin/utils/entity.js` | 13 | `coaches.team_id` | Mapping | Mittel | Die Admin-Helferfunktion setzt Team-ID-Fallbacks fuer Coach-Karten weiterhin aus `entity.team_id`. | `coach_team_seasons` + `teams` ueber aktuelle Saison |
| `src/app/admin/teams/new/page.js` | 75 | `coaches.team_id` | Filter | Kritisch | Die Team-Neuanlage filtert verfuegbare Trainer weiterhin ueber `team_id.is.null` bzw. `team_id.in(...)`. | `coach_team_seasons` + aktive `team_seasons` |
| `src/app/admin/teams/edit/[id]/page.js` | 74 | `coaches.team_id` | Filter | Kritisch | Die Team-Bearbeitung laedt verfuegbare Trainer weiter ueber das Legacy-Feld `team_id`. | `coach_team_seasons` + aktive `team_seasons` |
| `src/components/admin/coaches/forms/coachForm.helpers.js` | 29 | `coaches.team_id` | Formular, DTO | Kritisch | Das Coach-Formular liest und schreibt die Mannschaftszuordnung weiterhin ueber `team_id`. | Saisonzuordnung ueber `coach_team_seasons` |
| `src/components/admin/coaches/forms/fields/CoachRoleFields.js` | 23 | `coaches.team_id` | Formular | Kritisch | Die Coach-UI bindet die Mannschaftsauswahl weiterhin direkt an `form.team_id`. | Auswahl einer `team_season_id` bzw. separater Zuordnungseditor |
| `src/app/admin/coaches/page.js` | 35 | `coaches.team_id` | Lesen, DTO | Kritisch | Die Admin-Trainerliste selektiert `team_id` direkt aus `coaches` und reicht es in den Runtime-Datensatz weiter. | `coach_team_seasons` + `team_seasons` |
| `src/app/admin/coaches/actions.js` | 46 | `coaches.team_id` | Server Action, Scope | Kritisch | Die Server Action prueft erlaubte Zielteams weiterhin aus `coachPayload.team_id`. | Zielteam aus saisonaler Coach-Zuordnung ableiten |
| `src/app/(website)/fussball/[slug]/page.js` | 210 | `coaches.team_id` | API, Fallback-Query | Kritisch | Die oeffentliche Teamseite faellt bei fehlenden Saisonzuordnungen auf `coaches.eq("team_id", team.id)` zurueck. | `coach_team_seasons` + aktuelle `team_season` |
| `src/components/admin/teams/services/teamDelete.service.js` | 94 | `coaches.team_id` | Delete-Guard | Kritisch | Vor Team-Loeschung/-Archivierung werden abhaengige Trainer noch direkt ueber `coaches.team_id` gezaehlt. | Abhaengigkeiten ueber `coach_team_seasons` aufloesen |
| `src/components/admin/persons/personTeamRepository.js` | 122 | `coaches.team_id` | Repository, Fallback | Kritisch | Die Personen-Repository-Logik fuellt fehlende Coach-Teamzuordnungen weiterhin aus `coaches.team_id` nach. | Ausschliesslich `coach_team_seasons` + aktive Saison verwenden |

### `coaches.team_name`

| Datei | Zeile | Legacy-Feld | Art der Nutzung | Risiko | Beschreibung | Empfohlene Abloesung |
|-------|------:|-------------|-----------------|--------|--------------|----------------------|
| `src/components/admin/coaches/utils/coachStats.js` | 39 | `coaches.team_name` | Mapping, Anzeige | Mittel | Die Trainerstatistik baut Teamnamen weiter mit Fallback auf `coach.team_name`. | Teamname aus `teams`/`team_seasons` ableiten |
| `src/components/admin/coaches/services/coaches.service.js` | 40 | `coaches.team_name` | Schreiben | Kritisch | Der Coach-Speicherpfad schreibt `team_name` weiterhin als redundantes Legacy-Anzeigefeld. | Teamname nicht mehr persistieren, nur relational aufloesen |
| `src/components/website/department/department.helpers.js` | 3 | `coaches.team_name` | Anzeige | Mittel | Die oeffentliche Trainer-Abteilungsseite zeigt Teamnamen weiter ueber den `coach.team_name`-Fallback an. | Teamname aus `teams` oder `team_seasons` |
| `src/components/admin/utils/entity.js` | 14 | `coaches.team_name` | Mapping, Anzeige | Mittel | Die gemeinsame Admin-Helferfunktion liefert den Coach-Teamnamen weiterhin aus `entity.team_name`, wenn keine Relation vorhanden ist. | Teamname aus `teams`/`team_seasons` |
| `src/app/admin/coaches/page.js` | 35 | `coaches.team_name` | Lesen, DTO | Kritisch | Die Admin-Trainerliste selektiert `team_name` direkt und fuehrt es im Runtime-Datensatz weiter. | Teamname aus `teams`/`coach_team_seasons` berechnen |
| `src/app/(website)/trainer/[slug]/page.js` | 31 | `coaches.team_name` | Anzeige | Mittel | Das oeffentliche Trainerprofil verwendet `coach.team_name` weiterhin als Anzeige-Fallback. | Teamname aus `teams` oder aktueller Saisonrelation |
| `src/components/admin/topbar/adminSearch.service.js` | 24 | `coaches.team_name` | API, Suche, Anzeige | Mittel | Die Admin-Suche selektiert, durchsucht und rendert `team_name` weiterhin im Trainer-Suchergebnis. | Teamname beim Such-DTO relational aufbauen |

### `coaches.photo_url`

| Datei | Zeile | Legacy-Feld | Art der Nutzung | Risiko | Beschreibung | Empfohlene Abloesung |
|-------|------:|-------------|-----------------|--------|--------------|----------------------|
| `src/components/website/department/DepartmentPersonCard.js` | 23 | `coaches.photo_url` | Anzeige | Mittel | Die gemeinsame Personenkarte faellt bei Trainerdaten weiterhin auf `person.photo_url` zurueck. | `coaches.image_url` |
| `src/components/admin/utils/entity.js` | 19 | `coaches.photo_url` | Mapping, Anzeige | Mittel | Die gemeinsame Admin-Bildhilfe liest `photo_url` weiterhin als generischen Fallback fuer Coach-Karten. | `coaches.image_url` |

## Risikobewertung

### Kritisch

- Legacy-Felder sind noch direkt in produktiven Admin-Speicherpfaden, Fallback-Queries der oeffentlichen Teamseiten, Delete-Guards und Scope-/Repository-Aufloesung verankert.
- Ein unmittelbares Entfernen ohne vorgelagerte Runtime-Anpassungen wuerde Datenfluss, Sichtbarkeit oder Berechtigungslogik brechen.

### Mittel

- Legacy-Felder dienen noch als Anzeige-, Such- oder Mapping-Fallback.
- Eine Ablosung ist moeglich, erfordert aber koordinierte DTO-/UI-Anpassungen, damit keine leeren Team- oder Bildinformationen entstehen.

### Gering

- Vereinzelte Stellen halten Legacy-Felder nur noch in Konfiguration oder ungenutzten Selects mit.
- Diese Stellen sind nach erfolgreicher fachlicher Umstellung unkompliziert entfernbar.

## Abschlussbewertung

### Statistik

- Anzahl gepruefter Dateien: `585`
- Anzahl Fundstellen: `45`
- Anzahl kritischer Fundstellen: `30`
- Anzahl mittlerer Fundstellen: `13`
- Anzahl geringer Fundstellen: `2`

### Empfehlung

`B13.6 - Legacy Removal Planning` kann begonnen werden.

Begruendung: Die Audit-Ergebnisse sind vollstaendig genug fuer die Planungsphase, aber die Planung muss explizit beruecksichtigen, dass vor einer echten Legacy-Entfernung noch mehrere kritische Runtime-Pfade auf `player_team_seasons`, `coach_team_seasons`, `team_seasons`, `players.image_url` und `coaches.image_url` umgestellt werden muessen.
