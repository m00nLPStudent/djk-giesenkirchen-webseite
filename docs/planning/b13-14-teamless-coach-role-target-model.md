# B13.14 - Zielmodell fuer teamlose Coaches und allgemeine Staff-Rollen

## 1. Ziel

Dieser Schritt trifft eine fachliche und technische Zielentscheidung fuer Coach-Rollen ausserhalb aktiver Mannschaftszuordnungen. Es werden keine produktiven Codeaenderungen, keine SQL-Dateien und keine Migrationen erstellt. Ergebnis ist ein verbindliches Zielbild fuer die spaetere Ablosung von `coaches.role`, `coaches.role_de` und `coaches.role_en`.

## 2. Ausgangslage

- Aktuelle Mannschaftsrollen werden fachlich bereits ueber `coach_team_seasons.role_de` und `coach_team_seasons.role_en` gefuehrt.
- Die B13.9 bis B13.13 Schritte haben aktuelle Team-Reads und Team-Writes weitgehend auf saisonale Assignments umgestellt.
- `coaches.role*` bleibt laut `docs/planning/b13-13-coach-master-role-status.csv` nur noch als Fallback- und Kompatibilitaetspfad aktiv.
- Teamlose Coaches verwenden im Runtime-Code weiterhin Masterrollen-Fallbacks, unter anderem in:
  - `src/components/admin/coaches/forms/coachForm.core.mjs`
  - `src/components/admin/coaches/services/coachSeasonalWriteCore.mjs`
  - `src/components/admin/persons/coachRoleSummary.mjs`
  - `src/components/admin/settings/helpers/settingsInitialState.js`
  - `src/components/website/department/DepartmentPersonCard.js`
- Eine komplette Abschaltung der `coaches.role*`-Writes ist deshalb noch blockiert.

## 3. Rollenklassen

Es sind fachlich drei verschiedene Klassen zu trennen:

### A. Mannschaftsbezogene Rollen

Beispiele:

- Trainer
- Co-Trainer
- Betreuer
- Torwarttrainer
- Cheftrainer

Kanonische Quelle: `coach_team_seasons`

### B. Vereinsweite Staff-Funktionen

Beispiele:

- Jugend-Torwarttrainer
- Trainerkoordinator
- Athletiktrainer des Vereins
- Trainerpool
- Scout
- Sportlicher Berater

Diese Funktionen gehoeren nicht automatisch zu genau einer Team-Saison.

### C. Technische oder historische Fallback-Werte

Beispiele:

- alte `coaches.role*`-Werte
- Coaches ohne aktuelle Saisonzuordnung
- Coaches mit nur historischen Assignments
- unvollstaendig migrierte Datensaetze

Diese Klasse ist kein gewuenschtes Zielmodell, sondern ein Uebergangszustand.

## 4. Varianten

### Variante A - Keine Rolle ohne Team

- Ein Coach ohne aktives Assignment hat keine fachliche Rolle.
- UI zeigt nur einen Leerzustand wie "Keine aktuelle Mannschaftszuordnung".
- `coaches.role*` koennte nach Bereinigung entfallen.

### Variante B - Allgemeine Stammdatenrolle im Coach

- Ein neues kanonisches Feld oder Feldpaar im Coach-Master speichert eine allgemeine Vereinsfunktion.
- Teamrollen bleiben weiter ausschliesslich in `coach_team_seasons`.
- Die alten `coaches.role*`-Felder werden nicht direkt weiterverwendet, sondern durch neue General-Role-Felder ersetzt.

### Variante C - Separate Staff-Rollen-Tabelle

- Additive, eigene Struktur fuer vereinsweite Rollen ausserhalb von Mannschaftsassignments.
- Empfohlene Arbeitsbezeichnung: `coach_staff_roles`.
- Mehrere Rollen, Historie und Aktivstatus koennen separat modelliert werden.

### Variante D - Sonder-Team oder kuenstliche Team-Saison

- Allgemeine Rollen wuerden ueber kuenstliche Teams oder Team-Saisons gespeichert.
- Beispiel: "Verein", "Trainerpool" oder "Jugend" als Pseudo-Team.

## 5. Variantenbewertung

| Variante | Fachliche Klarheit | Datenkonsistenz | Mehrere Rollen | Historie | Scope-Klarheit | Migrationsaufwand | Risiko | Urteil |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A | MITTEL | GUT | SCHLECHT | SCHLECHT | SEHR_GUT | GUT | MITTEL | Verwerfen als alleiniges Zielmodell |
| B | GUT | GUT | MITTEL | MITTEL | GUT | GUT | MITTEL | Nur als einfachere Zwischenoption |
| C | SEHR_GUT | SEHR_GUT | SEHR_GUT | SEHR_GUT | SEHR_GUT | MITTEL | GUT | Empfohlene Zielvariante |
| D | SCHLECHT | SCHLECHT | MITTEL | MITTEL | NICHT_EMPFOHLEN | SCHLECHT | SCHLECHT | Verwerfen |

Begruendung:

- Variante A ist nur dann tragfaehig, wenn es fachlich garantiert keine echten vereinsweiten Staff-Funktionen gibt. Das ist aktuell nicht belegt.
- Variante B trennt Teamrolle und allgemeine Funktion bereits sauberer als heute, bleibt aber fuer Mehrfachrollen und Historie zu flach.
- Variante C bildet den bereits sichtbaren Fachschnitt am saubersten ab: Teamrolle saisonal, allgemeine Funktion separat.
- Variante D verfaelscht das Saisonmodell und wuerde spaetere Scope- und Reporting-Logik unnoetig verkomplizieren.

## 6. Bestandsabhaengigkeiten

### Beobachtungen aus Runtime-Code und vorhandener Doku

- `coachForm.core.mjs` nutzt `coach.role_de || coach.role` weiterhin als Formular-Fallback fuer teamlose Coaches.
- `coachSeasonalWriteCore.mjs` schreibt `coaches.role*` noch als expliziten Fallback-Snapshot fuer den Masterdatensatz.
- `coachRoleSummary.mjs` faellt nur dann auf `coaches.role*` zurueck, wenn keine Assignment-Rollen vorhanden sind.
- `settingsInitialState.js` verwendet zunaechst `roleLabels` und `primaryRoleLabel`, danach erst `coaches.role*`.
- `DepartmentPersonCard.js` verwendet `roleLabels`, `primaryRoleLabel` und erst ganz zuletzt `coaches.role*`.

### Was ist ueber Bestandswerte belegbar

- Bekannte Rollenbegriffe im Code sind mindestens `Trainer`, `Co-Trainer`, `Betreuer`, `Torwarttrainer` und `Cheftrainer`.
- `role_en` wird im aktuellen Write-Pfad aus deutschen Bezeichnungen abgeleitet.
- Bestandswerte in produktiven `coaches.role*`-Spalten koennen ohne Live-SQL nicht vollstaendig inventarisiert werden.

### UNRESOLVED

- Ob produktive Daten echte vereinsweite Staff-Funktionen in `coaches.role*` enthalten, ist aus dem Repository allein nicht beweisbar.
- Ob "teamlose Coaches" fachlich gewollt sind oder teilweise nur Migrationsartefakte darstellen, ist nicht abschliessend belegt.
- Ob historische Masterrollenwerte immer aus alten Assignments rekonstruierbar sind, ist nicht gesichert.

### Rekonstruierbarkeit

- Aus aktuellen oder historischen `coach_team_seasons`-Zeilen rekonstruierbar sind nur teambezogene Rollen.
- Nicht sicher rekonstruierbar sind allgemeine, vereinsweite oder frei gepflegte Legacy-Rollen ohne passende Assignment-Historie.

## 7. Empfohlenes Zielmodell

Verbindliche Empfehlung: **Variante C als Zielmodell**.

Festlegung:

- Mannschaftsrollen werden ausschliesslich in `coach_team_seasons` gespeichert.
- Allgemeine vereinsweite Staff-Funktionen werden kuenftig in einer separaten additiven Struktur gespeichert, bevorzugt `coach_staff_roles`.
- Teamlose Coaches haben ohne aktives Team-Assignment keine Mannschaftsrolle.
- Ein teamloser Coach kann trotzdem eine oder mehrere allgemeine Vereinsfunktionen besitzen.
- Hat ein Coach weder aktives Assignment noch aktive Staff-Funktion, zeigt die UI einen klaren Leerzustand statt eine erfundene Rolle.
- `coaches.role`, `coaches.role_de` und `coaches.role_en` bleiben nur temporaere Legacy-Felder bis Migration, UI-Umstellung und Validierung abgeschlossen sind.

Verworfene Alternativen:

- Variante A wird verworfen, weil sie echte allgemeine Staff-Funktionen nicht modelliert.
- Variante D wird verworfen, weil kuenstliche Teams fachlich falsche Daten erzeugen wuerden.
- Variante B bleibt hoechstens als vereinfachende Zwischenloesung denkbar, wird aber nicht als Zielmodell empfohlen.

## 8. Datenmodell

Empfohlenes additive Zielmodell:

### `coach_team_seasons`

Bleibt unveraendert die kanonische Quelle fuer:

- Teambezug
- saisonale Rolle
- teambezogene Sortierung
- Aktivstatus einer Teamzuordnung

### `coach_staff_roles`

Empfohlene Felder:

| Feld | Zweck |
| --- | --- |
| `id` | Primaerschluessel |
| `coach_id` | Referenz auf Coach |
| `role_key` | optionaler stabiler Schluessel fuer bekannte Staff-Funktionen |
| `role_de` | deutsche Anzeige |
| `role_en` | englische Anzeige |
| `valid_from` | Beginn der Gueltigkeit |
| `valid_until` | Ende der Gueltigkeit |
| `is_active` | aktive oder inaktive Funktion |
| `sort_order` | Darstellungsreihenfolge |

Modellregeln:

- `coach_team_seasons` und `coach_staff_roles` duerfen parallel existieren.
- Eine Staff-Funktion erzeugt keinen impliziten Teambezug.
- Mehrere allgemeine Funktionen pro Coach sind erlaubt.
- Historie wird ueber Gueltigkeitszeitraum und Aktivstatus abgebildet.
- Mehrsprachigkeit wird direkt in den Staff-Rollen gespeichert.

## 9. UI-Zielbild

### Admin-Formular

Abschnitt `Mannschaftszuordnungen`:

- Mannschaft
- Rolle pro Mannschaft
- Reihenfolge
- Aktivstatus

Optionaler Abschnitt `Allgemeine Vereinsfunktionen`:

- Funktion oder `role_key`
- `role_de`
- `role_en`
- `valid_from`
- `valid_until`
- `is_active`
- `sort_order`

Verhalten:

- Neue Team-Assignment-Zeilen starten leer.
- Allgemeine Funktionen werden getrennt von Teamrollen gepflegt.
- Ein teamloser Coach ohne allgemeine Funktion sieht einen verstaendlichen Leerzustand.
- Es wird keine technische Ersatz-Teamrolle vorgeschlagen.

## 10. Oeffentliche Darstellung

- Oeffentliche Trainerkarten zeigen aktive Teamrollen aus `coach_team_seasons`.
- Hat ein Coach keine aktive Teamrolle, duerfen aktive allgemeine Vereinsfunktionen aus `coach_staff_roles` angezeigt werden.
- Hat ein Coach weder aktive Teamrolle noch aktive Staff-Funktion, zeigt die Website keine erfundene Rolle; moegliche Ausgabe ist leer oder neutral.
- Mehrere aktive allgemeine Funktionen werden in definierter Sortierung angezeigt.
- Historische Funktionen werden oeffentlich standardmaessig nicht als aktuelle Rollen dargestellt.

## 11. Scope und Permissions

Verbindliche Regel:

- Mannschaftsscope wird ausschliesslich aus `coach_team_seasons` abgeleitet.
- Allgemeine Staff-Funktionen gewaehrleisten keinen automatischen Teamzugriff.
- Es werden keine Berechtigungen allein aus Rollenbezeichnungen abgeleitet.
- Manuelle Overrides bleiben getrennt.
- Bestehende Sonderregeln fuer Superadmin, Vorstand oder Jugendkoordinator bleiben unveraendert.
- Ein teamloser Coach ohne expliziten Scope erhaelt keinen Mannschaftszugriff.

## 12. Migrationsstrategie

Nur Plan, kein SQL.

| Schritt | Vorbedingungen | Risiko | Rollback | Go-/No-Go-Kriterium |
| --- | --- | --- | --- | --- |
| 1. Bestandswerte inventarisieren | B13.14 Entscheidung verabschiedet | Legacy-Werte werden unvollstaendig klassifiziert | Inventarliste unveraendert lassen | Go nur, wenn alle bekannten Legacy-Quellen dokumentiert sind |
| 2. Werte aus aktuellen Assignments identifizieren | saisonale Read-Modelle stabil | Teamrollen werden mit allgemeinen Rollen vermischt | Assignment-zu-Legacy-Mapping verwerfen | Go nur, wenn teambezogene Rollen getrennt ausweisbar sind |
| 3. Echte allgemeine Staff-Funktionen identifizieren | Inventar aus Schritt 1 vorhanden | freie Legacy-Texte bleiben mehrdeutig | Klassifizierung zurueck auf UNRESOLVED | Go nur, wenn unklare Faelle explizit markiert sind |
| 4. Zielstruktur additiv vorbereiten | Produktentscheidung fuer Variante C bestaetigt | Modell wird zu frueh als produktiv behandelt | keine Runtime-Umschaltung | Go nur, wenn Zielmodell Scope-neutral bleibt |
| 5. Allgemeine Rollen migrieren | Mapping-Regeln fachlich freigegeben | Verlust nicht rekonstruierbarer Legacy-Daten | Rueckkehr zu Legacy-Reads | Go nur, wenn alle nicht rekonstruierbaren Faelle aufgefangen sind |
| 6. UI und Read-Pfade umstellen | neue Staff-Rollenquelle vorhanden | gemischte Anzeige aus alten und neuen Quellen | Feature-Rueckschaltung auf Legacy-Fallback | Go nur, wenn teamlose Coaches korrekt darstellbar bleiben |
| 7. Write-Pfade umstellen | Admin-Formular kann Staff-Rollen pflegen | neue Daten landen doppelt oder inkonsistent | Legacy-Write weiter aktiv lassen | Go nur, wenn Teamrollen und Staff-Funktionen getrennt gespeichert werden |
| 8. Legacy-Write deaktivieren | keine produktiven Writes mehr auf `coaches.role*` noetig | Rollback oder Altformulare verlieren Fallback | temporaer Legacy-Write reaktivieren | Go nur, wenn kein produktiver Save mehr auf `coaches.role*` angewiesen ist |
| 9. Legacy-Read deaktivieren | alle UI-Pfade lesen neue Quellen | teamlose Altprofile verlieren Rollenanzeige | Read-Fallback gezielt wieder einschalten | Go nur, wenn keine relevante Anzeige mehr `coaches.role*` benoetigt |
| 10. Validierung | Writes und Reads umgestellt | stille Restabhaengigkeiten bleiben unentdeckt | kontrollierte Rueckkehr zu Legacy-Reads | Go nur, wenn Stichproben fuer teamgebundene, teamlose und historische Coaches sauber sind |
| 11. Spaetere Entfernung von `coaches.role*` | Null produktive Reads/Writes bestaetigt | verfruehte Spaltenentfernung | Spalten nicht entfernen | Go nur, wenn Status `REMOVE_READY` erreicht ist |

## 13. Rollback-Strategie

- Bis zur finalen Umschaltung bleiben `coaches.role*` als Sicherheitsnetz erhalten.
- Jede Read-Umstellung muss getrennt von der Write-Deaktivierung erfolgen.
- Jede Write-Deaktivierung muss getrennt von einer spaeteren Spaltenentfernung erfolgen.
- Fuer unklare Legacy-Datensaetze bleibt ein dokumentierter Rueckweg auf Legacy-Reads erforderlich.
- Rollenklassifizierung mit `UNRESOLVED` darf nie stillschweigend automatisch in Mannschaftsrollen oder Staff-Rollen umgedeutet werden.

## 14. Risiken

- Produktivdaten koennen allgemeine Rollen enthalten, die aus Assignments nicht rekonstruierbar sind.
- Historische Legacy-Werte koennen mehrere Bedeutungen mischen: Teamrolle, allgemeine Funktion oder technischer Altwert.
- Eine zu fruehe Abschaltung von `coaches.role*` wuerde teamlose Coaches oder generische Karten entwerten.
- Wenn Staff-Funktionen spaeter doch Scope ausloesen sollen, muesste das bewusst als separates Berechtigungsmodell eingefuehrt werden.
- Freitextrollen ohne Katalog koennen langfristig zu Dubletten fuehren.

## 15. Offene fachliche Entscheidungen

- UNRESOLVED: Gibt es im Produkt fachlich gewollte teamlose Coaches ohne allgemeine Funktion, die trotzdem oeffentlich sichtbar bleiben sollen?
- UNRESOLVED: Soll es fuer allgemeine Staff-Funktionen nur freie Texte geben oder einen kontrollierten `role_key`-Katalog?
- UNRESOLVED: Sollen historische allgemeine Staff-Funktionen oeffentlich sichtbar sein oder nur im Admin?
- UNRESOLVED: Sollen mehrere aktive allgemeine Funktionen gleichzeitig oeffentlich angezeigt werden oder nur die primaeren Eintraege?

## 16. Go-/No-Go-Kriterien

Go fuer die spaetere Implementierung nur wenn:

- Variante C fachlich bestaetigt ist.
- Es eine Inventarliste fuer vorhandene Legacy-Rollenwerte gibt.
- Unklare Legacy-Faelle explizit als `UNRESOLVED` markiert bleiben.
- Scope-Regeln unveraendert strikt an `coach_team_seasons` gebunden bleiben.

No-Go fuer Legacy-Entfernung wenn:

- teamlose Coaches noch ausschliesslich ueber `coaches.role*` darstellbar sind.
- allgemeine Staff-Funktionen noch kein Zielmodell haben.
- generische Admin- oder Website-Komponenten noch direkt auf Masterrollen zurueckfallen.

## 17. Auswirkungen auf `coaches.role*`

### `coaches.role`

- aktueller Status: `MIGRATION_REQUIRED`
- Rolle im Zielbild: rein legacy, spaeter entfernbar
- Ersatzquelle: `coach_team_seasons` fuer Teamrollen, `coach_staff_roles` fuer allgemeine Funktionen

### `coaches.role_de`

- aktueller Status: `MIGRATION_REQUIRED`
- Rolle im Zielbild: rein legacy, spaeter entfernbar
- Ersatzquelle: `coach_team_seasons.role_de` oder `coach_staff_roles.role_de`

### `coaches.role_en`

- aktueller Status: `MIGRATION_REQUIRED`
- Rolle im Zielbild: rein legacy, spaeter entfernbar
- Ersatzquelle: `coach_team_seasons.role_en` oder `coach_staff_roles.role_en`

Bewertung:

- Keine der drei Spalten ist sofort `WRITE_DISABLE_READY`, `READ_DISABLE_READY` oder `REMOVE_READY`.
- Zuerst muss die teamlose und vereinsweite Rollenhaltung ersetzt werden.

## 18. Empfohlener naechster Implementierungsschritt

Naechster sinnvoller Schritt ist ein additiver Implementierungsplan fuer Variante C:

1. Zielstruktur fuer `coach_staff_roles` fachlich festziehen.
2. Legacy-Rolleninventar gegen bestehende Coaches klassifizieren.
3. Admin-Formular und DTOs fuer getrennte Teamrollen und allgemeine Staff-Funktionen planen.
4. Erst danach Read-/Write-Umschaltung fuer teamlose Coaches umsetzen.

Bis dahin sollen `coaches.role*` nicht entfernt und nicht vorschnell deaktiviert werden.
