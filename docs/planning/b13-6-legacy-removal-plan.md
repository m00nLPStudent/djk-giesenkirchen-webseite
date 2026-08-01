# B13.6 - Legacy Removal Planning

## 1. Ziel

Dieses Dokument beschreibt die kontrollierte Abloesung aller in B13.5 gefundenen Runtime-Abhaengigkeiten von `players.team_id`, `players.photo_url`, `coaches.team_id`, `coaches.team_name` und `coaches.photo_url`. Es ist ein reiner Planungsstand ohne Produktivcode, SQL, Migrationen, Build, Lint, Commit oder Push.

## 2. Ausgangslage

- Gepruefter Runtime-Code in B13.5: `src/`
- Gepruefte Dateien: `585`
- Legacy-Fundstellen insgesamt: `45`
- Risikoverteilung: `30` kritisch, `13` mittel, `2` gering
- Zielmodell laut B13.2/B13.3:
  - Spielerzuordnung: `player_team_seasons`
  - Trainerzuordnung: `coach_team_seasons`
  - saisonale Teamquelle: `team_seasons`
  - Player-Bildquelle: `players.image_url`
  - Coach-Bildquelle: `coaches.image_url`
- Harte Sofortentfernung ist ausgeschlossen. Zuerst muessen neue Lesepfade, neue Schreibpfade und spaeter die Fallback-Abschaltung validiert werden.

## 3. Betroffene Legacy-Felder

| Tabelle | Legacy-Feld | B13.5-Fundstellen | Zielquelle | Aktueller Status |
|---|---|---:|---|---|
| `players` | `team_id` | 15 | `player_team_seasons` + `team_seasons` | `CURRENTLY_REQUIRED` |
| `players` | `photo_url` | 9 | `players.image_url` | `DUAL_READ_REQUIRED` |
| `coaches` | `team_id` | 12 | `coach_team_seasons` + `team_seasons` | `CURRENTLY_REQUIRED` |
| `coaches` | `team_name` | 7 | `teams` + `team_seasons` via `coach_team_seasons` | `CURRENTLY_REQUIRED` |
| `coaches` | `photo_url` | 2 | `coaches.image_url` | `DUAL_READ_REQUIRED` |

## 4. Kritische Runtime-Abhaengigkeiten

### A. Schreibpfade

- Fundstellen: `4`
- Dateien: `src/components/admin/players/services/players.service.js`, `src/components/admin/coaches/services/coaches.service.js`
- Felder: `players.team_id`, `players.photo_url`, `coaches.team_id`, `coaches.team_name`
- Risiko: kritisch
- Technische Abhaengigkeiten: `player_team_seasons`, `coach_team_seasons`, Upload-/Replace-Logik, Transaktionsreihenfolge
- Empfohlene Zielstruktur: Stammdaten in `players` und `coaches`, aktuelle Zuordnungen nur in den Saisonrelationen, Bilder nur ueber `image_url`
- Notwendige Tests: Player create/edit/team switch, Coach create/edit/multi-team, Medien-Replace
- Rueckfallstrategie: Legacy-Write kurzfristig wieder aktivieren, wenn neue relationale Writes inkonsistent sind

### B. Lesepfade

- Fundstellen: `4`
- Dateien: `src/app/admin/players/page.js`, `src/app/admin/coaches/page.js`
- Felder: `players.team_id`, `players.photo_url`, `coaches.team_id`, `coaches.team_name`
- Risiko: kritisch
- Technische Abhaengigkeiten: gemeinsames saisonales Read-Model, DTO-Normalisierung
- Empfohlene Zielstruktur: zentrale Player-/Coach-DTOs mit aufgeloester aktueller Saisonzuordnung
- Notwendige Tests: Admin-Listen, Karten, Leerzustaende, Scope-Sichtbarkeit
- Rueckfallstrategie: Legacy-Selects voruebergehend wieder zuschalten

### C. Scope- und Permission-Pfade

- Fundstellen: `4`
- Dateien: `src/app/admin/players/actions.js`, `src/app/admin/coaches/actions.js`, `src/components/admin/persons/personTeamRepository.js`
- Felder: `players.team_id`, `coaches.team_id`
- Risiko: kritisch
- Technische Abhaengigkeiten: Scope-Resolver, aktuelle Saison, Personen-Repository
- Empfohlene Zielstruktur: Scope-Ziele immer aus `team_season_id` oder aufgeloester aktiver Zuordnung ableiten
- Notwendige Tests: Superadmin, Vorstand, Jugendkoordinator, Trainer mit Team, Trainer ohne Team
- Rueckfallstrategie: alte Scope-Ableitung nur intern und zeitlich begrenzt wieder zuschalten

### D. Formulare und Validierung

- Fundstellen: `6`
- Dateien: `src/components/admin/players/forms/playerForm.helpers.js`, `src/components/admin/players/forms/playerForm.config.js`, `src/components/admin/players/forms/fields/PlayerBasicFields.js`, `src/components/admin/players/forms/AdminPlayersForm.js`, `src/components/admin/coaches/forms/coachForm.helpers.js`, `src/components/admin/coaches/forms/fields/CoachRoleFields.js`
- Felder: `players.team_id`, `coaches.team_id`
- Risiko: ueberwiegend kritisch
- Technische Abhaengigkeiten: Assignment-UI, `team_season_id`, saisonale Rollen
- Empfohlene Zielstruktur: getrennte Stammdaten- und Zuordnungsbereiche, kein direktes `team_id`-Formularfeld
- Notwendige Tests: Anlegen, Bearbeiten, Teamwechsel, teamlose Personen, Mehrfachzuordnungen bei Coaches
- Rueckfallstrategie: altes Formularmodell pro Modul gezielt wieder aktivieren

### E. Oeffentliche Website

- Fundstellen: `7`
- Dateien: `src/app/(website)/fussball/[slug]/page.js`, `src/components/website/player-profile/PlayerProfileImageCard.js`, `src/components/website/team/TeamPlayerCard.js`, `src/components/website/department/department.helpers.js`, `src/app/(website)/trainer/[slug]/page.js`, `src/components/website/department/DepartmentPersonCard.js`
- Felder: `players.team_id`, `players.photo_url`, `coaches.team_id`, `coaches.team_name`, `coaches.photo_url`
- Risiko: kritisch bis hoch
- Technische Abhaengigkeiten: aktuelle Saisonauflosung, oeffentliche DTOs, Bildnormalisierung
- Empfohlene Zielstruktur: Website liest nur aus aufgeloesten saisonalen Player-/Coach-Views
- Notwendige Tests: Mannschaftsseite, Spielerkarten, Trainerkarten, Spielerprofil, Trainerprofil, Bilder, Teamnamen
- Rueckfallstrategie: alte Fallback-Reads sofort wieder aktivieren, falls oeffentliche Seiten unvollstaendig werden

### F. Admin-Listen und Karten

- Fundstellen: `3`
- Dateien: `src/components/admin/players/components/PlayerCard.js`, `src/components/admin/coaches/utils/coachStats.js`
- Felder: `players.photo_url`, `coaches.team_id`, `coaches.team_name`
- Risiko: kritisch bis hoch
- Technische Abhaengigkeiten: Admin-DTOs, Label-Formatter, Bildnormalisierung
- Empfohlene Zielstruktur: List- und Card-Komponenten erhalten bereits normalisierte Anzeigeobjekte
- Notwendige Tests: Admin-Karten, Statistik-Zahlen, Teamlabels, Bilder
- Rueckfallstrategie: Karten/Stats auf altes DTO zurueckstellen

### G. Suche und Filter

- Fundstellen: `7`
- Dateien: `src/app/admin/teams/new/page.js`, `src/app/admin/teams/edit/[id]/page.js`, `src/components/admin/players/list/playerList.helpers.js`, `src/components/admin/topbar/adminSearch.service.js`
- Felder: `players.team_id`, `coaches.team_id`, `coaches.team_name`
- Risiko: kritisch bis gering
- Technische Abhaengigkeiten: aktuelle Saison, Such-DTO, Auswahlregeln fuer teamlose oder mehrfach zugeordnete Personen
- Empfohlene Zielstruktur: Filter und Suche arbeiten gegen saisonale DTOs und relationale Teamlabels
- Notwendige Tests: Team-Create/Edit-Auswahllisten, Admin-Suche, Listenfilter
- Rueckfallstrategie: Legacy-Filter oder Snapshot-Suche kurzzeitig wieder freigeben

### H. Delete- und Archivierungs-Guards

- Fundstellen: `2`
- Dateien: `src/components/admin/teams/services/teamDelete.service.js`
- Felder: `players.team_id`, `coaches.team_id`
- Risiko: kritisch
- Technische Abhaengigkeiten: Regel fuer aktive versus historische Zuordnungen
- Empfohlene Zielstruktur: Guards pruefen ausschliesslich saisonale aktive Abhaengigkeiten
- Notwendige Tests: Archivierung, Reaktivierung, Delete-Blocker, Historienfaelle
- Rueckfallstrategie: alte Guard-Queries wieder aktivieren, wenn Zaehllogik nicht belastbar ist

### I. Generische Helper und Fallbacks

- Fundstellen: `5`
- Dateien: `src/components/admin/utils/entity.js`
- Felder: `players.team_id`, `players.photo_url`, `coaches.team_id`, `coaches.team_name`, `coaches.photo_url`
- Risiko: hoch
- Technische Abhaengigkeiten: zentrale DTO-Umstellung, Bild- und Labelformatter
- Empfohlene Zielstruktur: Helper bekommen nur noch normalisierte Anzeigeobjekte, keine Legacy-Rohfelder
- Notwendige Tests: Admin-Badges, Karten, Bild-Placeholder, Teamlabels
- Rueckfallstrategie: generische Legacy-Fallbacks begrenzt wieder einschalten

### J. Bild-Upload und Medienfluss

- Fundstellen: `3`
- Dateien: `src/components/admin/hooks/useImageUpload.js`, `src/components/admin/players/forms/playerForm.helpers.js`, `src/components/admin/players/forms/AdminPlayersForm.js`
- Felder: `players.photo_url`
- Risiko: kritisch bis hoch
- Technische Abhaengigkeiten: Upload-Kontext, Preview-State, Storage-Pfade, Delete/Replace
- Empfohlene Zielstruktur: alle Bildfluesse arbeiten nur noch mit `image_url`; Legacy-Fallback sitzt ausschliesslich im Read-Model
- Notwendige Tests: Upload, Replace, Remove, Preview, Save, Reopen
- Rueckfallstrategie: Legacy-Bildfeld im Form-State und Hook befristet wieder einschalten

## 5. Zielarchitektur

- `players` und `coaches` bleiben Stammdatentabellen.
- `player_team_seasons` wird die einzige kanonische Quelle fuer aktuelle und historische Spielerzuordnungen.
- `coach_team_seasons` wird die einzige kanonische Quelle fuer aktuelle und historische Coach-Zuordnungen und Rollen.
- `team_seasons` liefert die saisonale Teamwahrheit fuer Labels, Scope-Ziele und oeffentliche Teamseiten.
- Bilder werden in Runtime-DTOs nur noch als `image_url` nach aussen gegeben.
- Empfohlene gemeinsame Read-Model-Schicht:
  - bestehender Anker: `src/components/admin/persons/personTeamRepository.js`
  - Aufgabe: aktuelle saisonale Zuordnung, Teamlabel, Bildquelle und minimalen Anzeigezustand normieren
- Empfohlenes Player-DTO:
  - Stammdaten: `id`, Name, `slug`, `is_active`, `image_url`
  - aktuelle Zuordnung: `team_season_id`, `team_id`, `team_name`, `season_id`, `jersey_number`, `position`, `is_captain`
  - Zusatz: `has_active_assignment`, optional `has_legacy_fallback`
- Empfohlenes Coach-DTO:
  - Stammdaten: `id`, Name, `slug`, `admin_profile_id`, `image_url`
  - Zuordnungen: Liste aus `team_season_id`, `team_id`, `team_name`, `role_key` oder `role_label`, `season_id`, `is_active`
  - Zusatz: `primary_assignment_label`, optional `has_legacy_fallback`
- Historische Saisons sollen spaeter ueber dedizierte Repository-Funktionen nachgeladen werden und nicht standardmaessig an Client-Komponenten gehen.

## 6. Phasenuebersicht

| Phase | Schwerpunkt | Primaere Dateien |
|---|---|---|
| 1 | gemeinsame saisonale Read-Modelle und Repository-Helfer | `src/components/admin/persons/personTeamRepository.js` |
| 2 | Player-Formular und Player-Schreibpfad | Player-Formulare, `players.service.js`, `players.actions.js` |
| 3 | Coach-Formular und Coach-Schreibpfad | Coach-Formulare, `coaches.service.js`, `coaches.actions.js` |
| 4 | Admin-Listen, Karten, Filter und Statistiken | Admin-Listen, `coachStats.js`, `playerList.helpers.js` |
| 5 | oeffentliche Team- und Profilseiten | `src/app/(website)/fussball/[slug]/page.js`, Profil- und Kartenkomponenten |
| 6 | Scope-, Permission- und konsumierende Action-Pfade | `players/actions.js`, `coaches/actions.js` |
| 7 | Team-Create/Edit-Auswahllisten | `src/app/admin/teams/new/page.js`, `src/app/admin/teams/edit/[id]/page.js` |
| 8 | Delete- und Archivierungs-Guards | `teamDelete.service.js` |
| 9 | Admin-Suche und generische Helper | `adminSearch.service.js`, `entity.js` |
| 10 | Bildpfade `photo_url` zu `image_url` | Website- und Admin-Bildkomponenten, Upload-Hook |
| 11 | Legacy-Fallbacks vollstaendig deaktivieren | Querpruefung aller noch verbliebenen Fallback-Reads |
| 12 | Legacy-Spaltenentfernung separat vorbereiten | nur Planung der spaeteren DB-Bereinigung |

### Phase 1 - Gemeinsame saisonale Read-Modelle und Repository-Helfer

- Ziel: gemeinsame Player-/Coach-Read-Modelle definieren und im Umfeld von `src/components/admin/persons/personTeamRepository.js` verankern.
- Konkrete Dateien: `src/components/admin/persons/personTeamRepository.js`; spaetere Konsumenten `src/app/admin/players/page.js`, `src/app/admin/coaches/page.js`, `src/app/(website)/fussball/[slug]/page.js`
- Vorbedingungen: bestaetigte Zielquellen aus B13.3; keine Aenderung an Scope-Regeln
- Spaeter notwendige Aenderungen: DTO-Adaption in Listen, Website, Suche, Helpern und Formularen
- Abhaengigkeiten: `player_team_seasons`, `coach_team_seasons`, `team_seasons`, aktueller Saisonresolver
- Risiken: falsche Aufloesung aktiver Saison, uneinheitliche Mehrfachzuordnungsdarstellung
- Testfaelle: Player-/Coach-Datensatz mit Team, ohne Team, mit historischer Saison, Coach mit mehreren Teams
- Rollback: Repository gibt wieder Legacy-Fallbacks aus, ohne Konsumenten sofort umzubauen
- Go-/No-Go: Go nur, wenn das Read-Model keine Scope-Aufweichung erzeugt und beide Personenarten korrekt normalisiert

### Phase 2 - Player-Formular und Player-Schreibpfad

- Ziel: `players.team_id` aus Formular und Service entfernen und in `player_team_seasons` ueberfuehren.
- Konkrete Dateien: `src/components/admin/players/forms/playerForm.helpers.js`, `src/components/admin/players/forms/playerForm.config.js`, `src/components/admin/players/forms/fields/PlayerBasicFields.js`, `src/components/admin/players/forms/AdminPlayersForm.js`, `src/components/admin/players/services/players.service.js`, `src/app/admin/players/actions.js`
- Vorbedingungen: Phase 1 Read-Model und Zielvertrag fuer `team_season_id`
- Spaeter notwendige Aenderungen: Filter, Delete-Guard, oeffentliche Teamseite
- Abhaengigkeiten: Scope-Pruefung, Teamauswahldaten, Medienfluss
- Risiken: Player ohne Team, Teamwechsel, Historienerhalt, doppelte aktive Zuordnung
- Testfaelle: anlegen, bearbeiten, Team zuweisen, Team wechseln, Team entfernen, Scope-Verletzung blockieren
- Rollback: Legacy-Write in `players.team_id` und altes Formmodell gezielt wieder aktivieren
- Go-/No-Go: Go nur, wenn Player create/edit inklusive teamloser Person reproduzierbar funktioniert

### Phase 3 - Coach-Formular und Coach-Schreibpfad

- Ziel: `coaches.team_id` und `coaches.team_name` nicht mehr schreiben und Coach-Zuordnungen ueber `coach_team_seasons` fuehren.
- Konkrete Dateien: `src/components/admin/coaches/forms/coachForm.helpers.js`, `src/components/admin/coaches/forms/fields/CoachRoleFields.js`, `src/components/admin/coaches/services/coaches.service.js`, `src/app/admin/coaches/actions.js`
- Vorbedingungen: Phase 1 Read-Model; fachliche Entscheidung fuer mehrere Teams und mehrere Rollen
- Spaeter notwendige Aenderungen: oeffentliche Labels, Suche, Team-Edit-Auswahl, Delete-Guard
- Abhaengigkeiten: `admin_profile_id`, Rollenmodell, Scope-Resolver, Label-Formatter
- Risiken: mehrere aktive Teams, Rollen pro Team, Trainer ohne Team, Historisierung
- Testfaelle: anlegen, bearbeiten, mehreren Teams zuweisen, Zuordnung entfernen, Scope-Grenzen pruefen
- Rollback: Snapshot-Write und altes Formularmodell befristet wieder zuschalten
- Go-/No-Go: No-Go, solange Mehrfachzuordnungs-UX und Historienregel ungeklärt sind

### Phase 4 - Admin-Listen, Karten, Filter und Statistiken

- Ziel: Admin-Lesepfade auf die neuen DTOs umstellen.
- Konkrete Dateien: `src/app/admin/players/page.js`, `src/app/admin/coaches/page.js`, `src/components/admin/players/list/playerList.helpers.js`, `src/components/admin/players/components/PlayerCard.js`, `src/components/admin/coaches/utils/coachStats.js`
- Vorbedingungen: Phase 1; fuer Bildkarten zusaetzlich Phase 10 vorbereitet
- Spaeter notwendige Aenderungen: Helper- und Suchbereinigung
- Abhaengigkeiten: DTO-Form, Label-Formatter, Bildnormalisierung
- Risiken: falsche Teamlabels, falsche Filterergebnisse, leere Kartenbilder
- Testfaelle: Listen, Karten, Stats, Filter, Leerzustaende, Scope-Sichtbarkeit
- Rollback: Listenseiten und Karten auf alte Selects oder DTOs zurueckstellen
- Go-/No-Go: Go nur, wenn Admin-Listen fuer alle Rollen unveraendert oder besser funktionieren

### Phase 5 - Oeffentliche Team- und Profilseiten

- Ziel: oeffentliche Team-, Trainer- und Spieleransichten ohne Legacy-Team- oder Snapshot-Fallbacks betreiben.
- Konkrete Dateien: `src/app/(website)/fussball/[slug]/page.js`, `src/components/website/player-profile/PlayerProfileImageCard.js`, `src/components/website/team/TeamPlayerCard.js`, `src/components/website/department/department.helpers.js`, `src/app/(website)/trainer/[slug]/page.js`, `src/components/website/department/DepartmentPersonCard.js`
- Vorbedingungen: Phase 1, Phase 4 fuer stabile DTOs, Phase 10 fuer Bilder
- Spaeter notwendige Aenderungen: finale Fallback-Deaktivierung in Phase 11
- Abhaengigkeiten: aktuelle Saisonauflosung, Teamlabels, Bildnormalisierung
- Risiken: leere Roster, fehlende Bilder, falsche Teamnamen
- Testfaelle: Mannschaftsseite, Spielerkarten, Trainerkarten, Spielerprofil, Trainerprofil, responsive Darstellung
- Rollback: alte Fallback-Queries oder Snapshot-Reads unmittelbar reaktivieren
- Go-/No-Go: Go nur, wenn die oeffentliche Website keinen Inhaltsverlust zeigt

### Phase 6 - Scope-, Permission- und konsumierende Action-Pfade

- Ziel: Server Actions und Scopes auf die neuen Assignment-Ziele ausrichten.
- Konkrete Dateien: `src/app/admin/players/actions.js`, `src/app/admin/coaches/actions.js`
- Vorbedingungen: Phase 1 sowie Phase 2 fuer Player und Phase 3 fuer Coaches
- Spaeter notwendige Aenderungen: Guard- und Search-Pfade koennen danach den gleichen Resolver nutzen
- Abhaengigkeiten: Rollenmodell, Team-Season-Ziele, Admin-Scopes
- Risiken: ungewollte Scope-Erweiterung oder zu strikte Blockaden
- Testfaelle: Superadmin, Vorstand, Jugendkoordinator, Trainer mit Team, Trainer ohne Team
- Rollback: Scope-Ableitung auf Legacy-Payload zuruecksetzen, ohne Read-Model zu verwerfen
- Go-/No-Go: Go nur, wenn kein Testfall mehr ausserhalb des bisherigen Rechteprofils liegt

### Phase 7 - Team-Create/Edit-Auswahllisten

- Ziel: verfuegbare Player- und Coach-Auswahllisten relationell statt ueber Legacy-`team_id` erzeugen.
- Konkrete Dateien: `src/app/admin/teams/new/page.js`, `src/app/admin/teams/edit/[id]/page.js`
- Vorbedingungen: Phase 1, Phase 2 und Phase 3
- Spaeter notwendige Aenderungen: Delete-Guards und Search koennen dieselben Verfuegbarkeitsregeln uebernehmen
- Abhaengigkeiten: aktive Saison, teamlose Personen, Mehrfachzuordnungsregeln bei Coaches
- Risiken: falsche Auswahlmengen, Doppelzuordnungen, ungewollte Ausblendung teamloser Personen
- Testfaelle: Team anlegen, Team bearbeiten, eigene Zuordnungen behalten, fremde Zuordnungen blockieren
- Rollback: alte `team_id.is.null`-/`team_id.eq(...)`-Filter reaktivieren
- Go-/No-Go: No-Go, solange die fachliche Regel fuer Coach-Mehrfachzuordnung offen ist

### Phase 8 - Delete- und Archivierungs-Guards

- Ziel: Team-Loeschung und Archivierung nur noch gegen saisonale aktive Abhaengigkeiten absichern.
- Konkrete Dateien: `src/components/admin/teams/services/teamDelete.service.js`
- Vorbedingungen: Phase 2, Phase 3 und geklaerte Historienregel
- Spaeter notwendige Aenderungen: Phase 11 kann erst nach validierten Guards Legacy-Reads abschalten
- Abhaengigkeiten: aktive versus historische Zuordnung, Archivierungslogik
- Risiken: falsches Freigeben oder falsches Blockieren von Archivierung/Loeschung
- Testfaelle: Team mit aktiven Spielern, Team mit aktiven Coaches, nur historische Zuordnungen, Reaktivierung
- Rollback: alte Legacy-Zaehler sofort wieder aktivieren
- Go-/No-Go: No-Go, solange aktive und historische Zuordnungen nicht eindeutig unterschieden werden

### Phase 9 - Admin-Suche und generische Helper

- Ziel: Snapshot- und Legacy-Fallbacks in Suche und generischen Anzeigen entfernen.
- Konkrete Dateien: `src/components/admin/topbar/adminSearch.service.js`, `src/components/admin/utils/entity.js`
- Vorbedingungen: Phase 1 und Phase 4
- Spaeter notwendige Aenderungen: Phase 11 kann dann die letzten Helper-Fallbacks global abschalten
- Abhaengigkeiten: Such-DTO, Teamlabel-Formatter, Bildnormalisierung
- Risiken: schlechtere Suchtreffer, fehlende Badge- oder Card-Labels
- Testfaelle: Admin-Suche, Suchergebnis-Rendering, Karten/Badges
- Rollback: alte Snapshot-Suchfelder oder generische Helper-Fallbacks kurzzeitig wieder aktivieren
- Go-/No-Go: Go nur, wenn Suchverhalten und Admin-Karten sichtbar unveraendert bleiben

### Phase 10 - Bildpfade `photo_url` zu `image_url`

- Ziel: `photo_url` nur noch als Uebergangsleseweg behandeln und alle produktiven Bildpfade auf `image_url` umstellen.
- Konkrete Dateien: `src/components/admin/hooks/useImageUpload.js`, `src/components/admin/players/forms/playerForm.helpers.js`, `src/components/admin/players/forms/AdminPlayersForm.js`, `src/components/admin/players/components/PlayerCard.js`, `src/components/website/player-profile/PlayerProfileImageCard.js`, `src/components/website/team/TeamPlayerCard.js`, `src/components/website/department/DepartmentPersonCard.js`, `src/components/admin/utils/entity.js`, `src/components/admin/players/services/players.service.js`, `src/app/admin/players/page.js`
- Vorbedingungen: Phase 1 DTO-Normalisierung, stabile `image_url`-Befuellung
- Spaeter notwendige Aenderungen: Phase 11 schaltet verbleibende Bild-Fallbacks aus
- Abhaengigkeiten: Storage-Replace, Preview-State, Placeholder-Strategie
- Risiken: kaputte Bilder, inkonsistente Upload-States, verwaiste Storage-Referenzen
- Testfaelle: Upload, Replace, Remove, Preview, Player-/Coach-Karten, oeffentliche Profile
- Rollback: `photo_url`-Fallback in DTO und Upload-Kontext wieder aktivieren
- Go-/No-Go: Go nur, wenn `image_url` auf allen betroffenen Oberflaechen stabil erscheint

### Phase 11 - Legacy-Fallbacks vollstaendig deaktivieren

- Ziel: verbleibende Legacy-Reads und Snapshot-Fallbacks kontrolliert abschalten.
- Konkrete Dateien: kein einzelner Erstumbau; betrifft die in Phasen 1 bis 10 umgestellten Konsumenten erneut
- Vorbedingungen: erfolgreiche Validierung aller Lesepfade, Schreibpfade, Bilder, Scopes und Guards
- Spaeter notwendige Aenderungen: Phase 12 kann erst danach eine Datenbankbereinigung vorbereiten
- Abhaengigkeiten: Release-Freigabe, Regressionstests, Rollback-Bereitschaft
- Risiken: versteckte Restleser, leere Teamlabels, Scope-Reibungen
- Testfaelle: volle Regression ueber Admin, Website, Login lokal, Login Cloudflare, News, Events, Sponsoren
- Rollback: gezielte Reaktivierung einzelner Fallbacks pro Modul, keine globale Hauruck-Aktion
- Go-/No-Go: No-Go, wenn noch irgendein produktiver Pfad auf Legacy-Felder angewiesen ist

### Phase 12 - Legacy-Spaltenentfernung separat vorbereiten

- Ziel: erst nach erfolgreicher Runtime-Entkopplung eine spaetere DB-Bereinigung planen.
- Konkrete Dateien: keine Runtime-Dateien; nur spaetere Planungs-/Migrationsunterlagen ausserhalb von B13.6
- Vorbedingungen: Phase 11 bestanden, keine produktiven Legacy-Reads oder Writes mehr
- Spaeter notwendige Aenderungen: separate Migrationsplanung, Datenpruefung, Abnahme
- Abhaengigkeiten: Datenbankinventur, Validierungsberichte, Backout-Szenario
- Risiken: zu fruehe Spaltenentfernung ohne Vollstaendigkeit
- Testfaelle: Datenvergleich alt/neu, Null-Rueckmeldung in Runtime-Suche nach Legacy-Feldern
- Rollback: Entfernung noch nicht ausfuehren; nur Planung fortsetzen
- Go-/No-Go: Go nur, wenn jede B13.5-Fundstelle technisch ersetzt und validiert ist

## 7. Player-Umstellung

- Create-Pfad: zuerst Stammdaten in `players`, danach aktuelle Zuordnung in `player_team_seasons`
- Edit-Pfad: Stammdaten aendern, vorhandene aktive Saisonzuordnung aktualisieren statt `players.team_id`
- Teamwechsel: aktive Zuordnung beenden oder historisieren und neue Zuordnung fuer Ziel-`team_season_id` anlegen
- Spieler ohne Team: `players` bleibt gueltig ohne aktive `player_team_seasons`-Zeile
- Spieler mit mehreren historischen Saisons: Historie bleibt in `player_team_seasons`; Default-DTO liefert nur aktive Zuordnung
- Scope-Pruefung: Zielteam immer aus `team_season_id` oder aufgeloester aktiver Zuordnung ableiten
- Listenfilter: Filter lesen `team_id`, `team_name` und Saisonkontext aus dem Read-Model
- Oeffentliche Anzeige: Teamseite und Profile lesen keine `players.team_id`-Fallbacks mehr
- Delete-Guard: Teamabhaengigkeit nur ueber aktive saisonale Player-Zuordnungen zaehlen

## 8. Coach-Umstellung

- Create-Pfad: zuerst Stammdaten in `coaches`, danach eine oder mehrere `coach_team_seasons`-Zeilen
- Edit-Pfad: Rollen und Teamzuordnungen je Saisonrelation pflegen, nicht im Masterdatensatz
- Mehrere Teams: Read-Model muss Mehrfachzuordnungen als Liste abbilden; UI braucht eindeutige Bearbeitungsregeln
- Mehrere Rollen: Rolle pro Zuordnung speichern; Anzeige benoetigt Label-Formatter
- Trainer ohne Team: `coaches` bleibt gueltig ohne aktive Zuordnung
- Profilverknuepfung: `admin_profile_id` bleibt am Coach-Stammdatensatz und wird unveraendert weitergefuehrt
- Scope-Pruefung: erlaubte Ziele aus angeforderten `coach_team_seasons`-Zuordnungen ableiten
- Oeffentliche Anzeige: Teamname nicht mehr aus `coaches.team_name`, sondern relational
- Suche: Suchlabel aus relationalen Teamnamen erzeugen
- Delete-Guard: Team-Loeschschutz nur gegen aktive Coach-Zuordnungen, nicht gegen blosse Historie

## 9. Bildpfad-Umstellung

- Zielquelle ist durchgaengig `players.image_url` und `coaches.image_url`.
- `players.photo_url` und `coaches.photo_url` bleiben waehrend der Uebergangsphase nur Read-Fallbacks.
- Upload- und Preview-Logik darf keine gemischten Schreibvertraege haben.
- Empfohlenes Muster:
  - Read-Model normalisiert `image_url`
  - Form-State und Karten lesen nur `image_url`
  - Legacy-`photo_url` wird ausschliesslich im Read-Model voruebergehend aufgeloest
- Oeffentliche und Admin-Bilder muessen denselben Placeholder- und Replace-Pfad nutzen.

## 10. Scope- und Permission-Umstellung

- `src/app/admin/players/actions.js` und `src/app/admin/coaches/actions.js` duerfen Zielteams nicht mehr aus rohen `team_id`-Payloads ableiten.
- Zielpruefung soll immer an `team_season_id` oder an eine serverseitig aufgeloeste aktuelle Assignment-Struktur gebunden sein.
- `src/components/admin/persons/personTeamRepository.js` ist der wichtigste gemeinsame Einstiegspunkt, damit Scope- und Anzeige-Pfade dieselbe Teamwahrheit nutzen.
- Es darf keine Scope-Lockerung geben:
  - Trainer mit Team sehen nur eigenes Team und eigene Personen
  - Trainer ohne Team sehen keine Mannschaften und haben keine Erstelloptionen
  - Jugendkoordinatoren behalten die Jugendgrenze
  - Vorstand und Superadmin behalten bestehende Sichtbarkeit

## 11. Oeffentliche Website

- Die oeffentliche Teamseite `src/app/(website)/fussball/[slug]/page.js` ist derzeit der kritischste Legacy-Fallback-Pfad fuer `players.team_id` und `coaches.team_id`.
- Spielerprofil, Teamkarten, Trainerprofil, Abteilungsdarstellung und Personenkarten muessen auf normalisierte DTOs wechseln.
- Oeffentliche Teamnamen fuer Coaches sollen relational erzeugt werden und nicht aus Snapshot-Feldern stammen.
- B13.6 plant explizit keine oeffentliche Fallback-Entfernung vor Phase 5 plus erfolgreicher Regression.

## 12. Admin-UI

- Admin-Formulare werden zuerst in Player- und Coach-Stammdaten plus saisonale Zuordnungen getrennt.
- Admin-Listen und Karten sollen nur noch normalisierte Anzeigeobjekte konsumieren.
- `coachStats.js`, `PlayerCard.js` und `entity.js` sind besonders sensibel, weil sie zentrale Anzeigehilfen fuer mehrere Oberflaechen liefern.
- Die Admin-UI darf teamlose Personen und Mehrfachzuordnungen sichtbar, aber eindeutig darstellen.

## 13. Suche und Filter

- `playerList.helpers.js` darf nicht mehr an `player.team_id` haengen.
- `adminSearch.service.js` muss Teamlabels fuer Coaches relational aufbauen und den ungenutzten Player-`team_id`-Select entfernen.
- Team-Create/Edit-Auswahllisten brauchen klare Regeln fuer:
  - teamlose Player
  - teamlose Coaches
  - Coach-Mehrfachzuordnung
  - bestehende eigene Zuordnungen im Edit-Modus

## 14. Delete-/Archivierungslogik

- `teamDelete.service.js` darf aktive Abhaengigkeiten kuenftig nur noch ueber `player_team_seasons` und `coach_team_seasons` bestimmen.
- Historische Zuordnungen muessen fuer Guard-Zwecke anders behandelt werden als aktive Zuordnungen.
- Archivierung und Reaktivierung sind Pflicht-Testfaelle, weil Legacy-`team_id` heute als einfache Blockade dient.

## 15. Dual-Read-Phase

- Player:
  - `players.team_id`: kein dauerhafter Dual-Read in UI/Services, aber voruebergehende Repository-Fallbacks bis Phase 11
  - `players.photo_url`: Dual-Read erforderlich, bis `image_url` auf allen Flaechen stabil ist
- Coach:
  - `coaches.team_id`: voruebergehender Repository- oder Page-Fallback bis Phase 11
  - `coaches.team_name`: voruebergehender Label-Fallback bis relationale Labels stabil sind
  - `coaches.photo_url`: Dual-Read fuer Restkarten bis Phase 11
- Regel: Dual-Read sitzt zentral im Read-Model, nicht verteilt in Formularen, Services und Komponenten.

## 16. Legacy-Write-Abschaltung

| Feld | Abschaltphase | Vorbedingung |
|---|---:|---|
| `players.team_id` | 2 | Player write-model ueber `player_team_seasons` stabil |
| `players.photo_url` | 10 | `image_url`-Write und Bildfluss stabil |
| `coaches.team_id` | 3 | Coach write-model fuer ein oder mehrere Assignments stabil |
| `coaches.team_name` | 3 | relationale Teamlabel-Flaechen vorbereitet |
| `coaches.photo_url` | 10 | keine aktive Write-Abhaengigkeit nachweisbar, nur Read-Fallbacks verbleiben |

## 17. Legacy-Read-Abschaltung

- Geplante gemeinsame Abschaltphase fuer produktive Restleser: Phase `11`
- Vorher muss gelten:
  - alle Admin-Listen lesen relationale DTOs
  - alle Formulare schreiben relationale Zielstrukturen
  - oeffentliche Seiten haben keine Legacy-Roster-Fallbacks mehr
  - Delete-Guards arbeiten ohne Legacy-Zaehler
  - Suche und Helper nutzen keine Snapshot-Labels mehr
  - Bilder funktionieren mit `image_url` auf Website und Admin

## 18. Teststrategie

- Superadmin:
  - Spieler anlegen, bearbeiten, Team zuweisen, Team wechseln
  - Trainer anlegen, bearbeiten, mehreren Teams zuweisen
- Vorstand:
  - alle erlaubten Spieler und Trainer sehen
  - Bearbeitungsrechte bleiben gleich
  - Vorstandskachel bleibt unveraendert
- Jugendkoordinator:
  - Jugendspieler und Jugendtrainer sehen
  - keine Seniorenteams ausserhalb des Scope
- Trainer mit Team:
  - nur eigenes Team und eigene Spieler
  - eigene Trainerkarte sichtbar
  - keine fremden Zuordnungen
- Trainer ohne Team:
  - keine Mannschaften, keine Spieler, keine Erstelloptionen
- Oeffentliche Website:
  - Mannschaftsseite, Spielerkarten, Trainerkarten, Spielerprofil, Trainerprofil, Bilder, Teamnamen
- Regression:
  - Dashboard-Zahlen, Suche, Filter, Archivierung, Reaktivierung, Sponsor-Modul, News, Events, Login lokal, Login Cloudflare

## 19. Rollback-Strategie

- Rollback erfolgt phasenweise, nicht global.
- Read-Model-Rollback: Legacy-Fallbacks zentral im Repository wieder freigeben.
- Write-Rollback: Legacy-Writes temporär parallel oder wieder exklusiv aktivieren, bis relationale Writes stabil sind.
- UI-Rollback: einzelne Formulare, Listen oder Karten auf vorherige DTOs/Fallbacks zurueckstellen.
- Public-Rollback: oeffentliche Roster- und Bild-Fallbacks sofort reaktivieren, wenn Inhalte fehlen.
- Guard-Rollback: alte `team_id`-Zaehler erneut einschalten, wenn Archivierungsregeln noch unklar sind.

## 20. Abnahmekriterien

- Alle `45` B13.5-Fundstellen sind einer Phase zugeordnet.
- Kein produktiver Read- oder Write-Pfad benoetigt die Legacy-Felder nach Phase 11 noch.
- Scope bleibt unveraendert streng.
- Oeffentliche Team-, Profil- und Kartenansichten zeigen dieselben Personen und Bilder wie vor der Umstellung.
- Teamlose Personen und historische Zuordnungen sind fachlich sauber behandelt.
- Multi-Team-Coaches sind entweder implementiert oder bewusst serverseitig begrenzt, ohne falsche Daten zu schreiben.

## 21. Voraussetzungen fuer Datenbankbereinigung

- Phase 11 ist abgeschlossen und regressionsfrei abgenommen.
- Es gibt keinen bekannten Runtime-Leser und keinen bekannten Runtime-Schreiber mehr fuer die fuenf Legacy-Felder.
- Such-, Scope-, Guard- und Bildpfade wurden gegen echte Rollen und echte Website-Pfade verifiziert.
- Eine separate, additive Migrationsplanung fuer Phase 12 liegt vor.
- B13.6 markiert ausdruecklich keine Legacy-Spalte als sofort entfernbar.

## 22. empfohlene erste Implementierungsphase

Empfohlen fuer B13.7 ist Phase 1: eine zentrale saisonale Read-Model-/Repository-Schicht auf Basis von `src/components/admin/persons/personTeamRepository.js`.

Begruendung:

- geringster initialer Dateiblastradius
- schafft eine gemeinsame DTO-Wahrheit fuer Player und Coaches
- bricht keine oeffentliche Seite, solange Legacy-Fallbacks dort noch aktiv bleiben
- lockert keine Scope-Regel, sondern zentralisiert ihre Datenbasis
- entfernt noch keinen Fallback, bereitet aber alle spaeteren Phasen vor

Offene Punkte vor Start von Phase 3, 7 und 8:

- fachliche Regel fuer mehrere aktive Coach-Teams und mehrere Rollen
- Definition der aktiven Saison fuer Auswahl- und Scope-Pfade
- genaue Guard-Regel fuer aktive versus historische Zuordnungen bei Archivierung und Delete
