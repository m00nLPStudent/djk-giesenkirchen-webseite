# B13.15 - Additiver Umsetzungsplan fuer allgemeine Coach-Staff-Rollen

## 1. Ziel

Dieser Schritt konkretisiert die in B13.14 beschlossene Zielrichtung fuer allgemeine vereinsweite Coach-Staff-Funktionen. Mannschaftsrollen bleiben in `coach_team_seasons`; allgemeine Staff-Funktionen sollen additiv in `coach_staff_roles` modelliert werden. Es werden keine produktiven Codeaenderungen und keine Datenbankaenderungen ausgefuehrt.

## 2. Ausgangslage

- B13.9 bis B13.13 haben aktuelle Teamrollen bereits weitgehend auf `coach_team_seasons` umgestellt.
- B13.14 hat Variante C als Zielmodell empfohlen: separate Staff-Rollen-Struktur fuer allgemeine Vereinsfunktionen.
- `coaches.role`, `coaches.role_de` und `coaches.role_en` sind weiterhin aktive Legacy-Fallbacks fuer teamlose, historische oder generische Anzeigezustaende.
- Die verbleibenden Runtime-Lesestellen liegen unter anderem in:
  - `src/components/admin/coaches/forms/coachForm.core.mjs`
  - `src/components/admin/coaches/services/coachSeasonalWriteCore.mjs`
  - `src/components/admin/persons/coachRoleSummary.mjs`
  - `src/components/admin/settings/helpers/settingsInitialState.js`
  - `src/components/website/department/DepartmentPersonCard.js`

## 3. Fachliche Abgrenzung

Verbindliche Trennung:

- Teamrolle:
  - gehoert zu genau einer Team-Saison
  - Quelle: `coach_team_seasons`
- Allgemeine Staff-Funktion:
  - gehoert nicht automatisch zu einer Team-Saison
  - kann mehrfach parallel vorkommen
  - kann befristet oder historisch sein
  - erzeugt keinen Team-Scope
- Legacy-Masterrolle:
  - nur Uebergangszustand fuer unklassifizierte Bestandswerte
  - darf nicht als Zielmodell fortgeschrieben werden

## 4. Legacy-Inventur

Die Legacy-Inventur wird ueber [docs/sql/b13-15-coach-legacy-role-inventory-readonly.sql](/C:/Users/swen7/Desktop/Website_GK/djk-giesenkirchen-webseite/docs/sql/b13-15-coach-legacy-role-inventory-readonly.sql) vorbereitet.

Zweck der Inventur:

- Anzahl belegter `coaches.role*`-Felder bestimmen
- eindeutige Legacy-Rollenwerte und Haeufigkeiten feststellen
- Coaches mit aktueller, historischer oder fehlender saisonaler Assignment-Lage trennen
- rekonstruierbare Teamrollen von nicht rekonstruierbaren Rollenwerten trennen
- konfliktbehaftete und manuell zu pruefende Datensaetze sichtbar machen

Wichtige Einschraenkung:

- Ohne Live-Ausfuehrung bleibt offen, welche konkreten freien Rollenwerte produktiv vorkommen.
- Fachlich unklare Werte bleiben `UNRESOLVED`, bis die Inventur tatsaechlich ausgewertet wurde.

## 5. Rollenklassifikation

Empfohlene Klassen:

- `TEAM_ROLE_RECONSTRUCTABLE`
  - Legacy-Wert ist nicht leer.
  - Der normalisierte Legacy-Wert stimmt eindeutig mit einer aktuellen oder historischen Assignment-Rolle ueberein.
  - Keine abweichenden konkurrierenden Masterrollenwerte vorhanden.
- `GENERAL_STAFF_CANDIDATE`
  - Legacy-Wert ist nicht leer.
  - Kein passender aktueller oder historischer Assignment-Rollenwert vorhanden.
  - Der Wert gehoert zu einer freigegebenen Liste allgemeiner Staff-Funktionen.
  - Keine Konflikte zwischen `role`, `role_de` und `role_en`.
- `EMPTY_OR_NULL`
  - Alle relevanten Masterrollenfelder sind `NULL`, leer oder nur Whitespace.
- `AMBIGUOUS`
  - Legacy-Wert ist belegt, aber weder klar teambezogen noch klar allgemeine Staff-Funktion.
  - Oder die Bezeichnung ist fachlich zu unscharf fuer eine sichere Uebernahme.
- `CONFLICTING`
  - Mehrere Masterrollenfelder widersprechen sich.
  - Oder aktive Assignment-Rollen und Legacy-Rolle weichen fachlich sichtbar voneinander ab.
- `MANUAL_REVIEW_REQUIRED`
  - Mehrsprachige Werte, Mischfaelle, Altbestandskonflikte oder unklare Historienlagen machen eine automatische Entscheidung unvertretbar.

Regel:

- Nur eindeutig freigegebene `GENERAL_STAFF_CANDIDATE`-Faelle sind fuer einen spaeteren technischen Backfill geeignet.
- `AMBIGUOUS`, `CONFLICTING` und `MANUAL_REVIEW_REQUIRED` sind explizit von jeder automatischen Uebernahme ausgeschlossen.

## 6. Datenmodellvarianten

Bewertet wurden vier Varianten:

- Variante 1: `coach_staff_roles` mit `role_key` plus Anzeige-Texten
- Variante 2: `coach_staff_role_types` plus `coach_staff_roles`
- Variante 3: nur freie Texte ohne Katalog
- Variante 4: allgemeine Rolle wieder direkt in `coaches`

Kurzbewertung:

- Variante 1 ist die beste additive Balance aus Datenkonsistenz, Mehrsprachigkeit, Migrationstauglichkeit und Laufzeitkomplexitaet.
- Variante 2 ist modelltheoretisch sauber, aber fuer den aktuellen Bedarf zu schwergewichtig.
- Variante 3 ist fuer schnelle Erfassung bequem, aber zu offen fuer Dubletten und uneinheitliche Mehrsprachigkeit.
- Variante 4 widerspricht der in B13.14 beschlossenen Trennung von Personstamm und Rollenmodell.

## 7. Empfohlenes Zielmodell

Empfohlenes Modell:

- `public.coach_staff_roles`
- eine Zeile pro allgemeiner Staff-Funktion und Gueltigkeitsintervall
- `coach_id` als Pflicht-FK auf `coaches`
- `role_key` im additiven Schritt zunaechst optional
- `role_de` als Pflichttext
- `role_en` optional, aber fachlich empfohlen
- `valid_from`, `valid_until`, `is_active`, `sort_order`
- `created_at`, `updated_at`, `created_by`, `updated_by`

Begruendung:

- Mehrere allgemeine Rollen pro Coach werden ohne Datenverdichtung moeglich.
- Historie bleibt getrennt von Mannschaftszuordnungen sichtbar.
- Der Team-Scope bleibt weiterhin sauber allein in `coach_team_seasons`.

## 8. Role-Key-Strategie

Empfehlung: **`role_key` plus uebersetzte Texte, ohne separate Katalogtabelle im ersten Schritt**.

Begruendung:

- besser als reine Freitexte fuer Konsistenz und kuenftige App-Nutzung
- deutlich einfacher als ein zusaetzliches Typenmodell mit eigener Tabelle
- kompatibel mit spaeterem Ausbau zu einem echten Katalog, falls der Verein das braucht

Konkrete Strategie:

- Additiver Start mit `role_key text null`
- bekannte Standardfunktionen erhalten bevorzugt einen stabilen Key
- freie oder noch ungeklaerte Altdaten werden nicht automatisch mit erfundenen Keys versehen
- Langfristig kann fuer produktive Neu-Erfassung ein kontrollierter Key-Satz in der Anwendung erzwungen werden

## 9. Additive Schemaaenderung

Die vorgeschlagene DDL steht in [docs/sql/b13-15-coach-staff-roles-additive-schema-proposal.sql](/C:/Users/swen7/Desktop/Website_GK/djk-giesenkirchen-webseite/docs/sql/b13-15-coach-staff-roles-additive-schema-proposal.sql).

Vorgeschlagene additive Elemente:

- neue Tabelle `public.coach_staff_roles`
- FK auf `coaches(id)` mit `ON DELETE CASCADE`
- FK auf `admin_profiles(id)` fuer `created_by` und `updated_by` mit `ON DELETE SET NULL`
- Check auf gueltigen Zeitraum
- Lookup- und Sortierindizes

Bewusste Zurueckhaltung:

- keine RLS-Aenderung in diesem Schritt
- keine Legacy-Felder in `coaches` anpassen
- kein harter `role_key`-Constraint im additiven Start

## 10. Backfill-Strategie

Die Backfill-Vorbereitung steht in [docs/sql/b13-15-coach-staff-roles-backfill-proposal.sql](/C:/Users/swen7/Desktop/Website_GK/djk-giesenkirchen-webseite/docs/sql/b13-15-coach-staff-roles-backfill-proposal.sql).

Empfehlung:

- kein blind automatischer Insert-Backfill
- stattdessen manuell freizugebende Insert-Vorschau fuer eindeutig klassifizierte `GENERAL_STAFF_CANDIDATE`-Faelle

Automatisch freigabefaehig nur wenn:

- genau ein konsistenter Masterrollenwert vorliegt
- keine aktuelle Assignment-Rolle existiert
- keine historische Assignment-Rolle denselben Wert bereits traegt
- der Wert in einem fachlich freigegebenen Staff-Rollenkatalog vorkommt
- noch keine passende aktive Staff-Rolle fuer denselben Coach vorhanden ist

Alle anderen Faelle bleiben manuell.

## 11. UI-Zielbild

Spaeteres Coach-Formular:

- Abschnitt `Mannschaftszuordnungen`
  - Team
  - Rolle
  - Reihenfolge
  - Aktivstatus
- Abschnitt `Allgemeine Vereinsfunktionen`
  - Funktion bzw. `role_key`
  - deutsche Bezeichnung
  - englische Bezeichnung
  - gueltig von
  - gueltig bis
  - Aktivstatus
  - Reihenfolge

Regeln:

- allgemeine Funktion ist optional
- mehrere allgemeine Funktionen sind erlaubt
- keine Funktion gibt automatisch Teamzugriff
- Coach ohne Team und ohne allgemeine Funktion bekommt einen klaren Leerzustand

## 12. Read-/Write-Umstellungsplan

1. Additive Tabelle vorbereiten.
   Risiko: gering.
   Rollback: neue Struktur ungenutzt lassen.
2. Legacy-Inventur ausfuehren und auswerten.
   Risiko: mittel.
   Rollback: keine Mutationen, daher nur Ergebnis verwerfen.
3. Allgemeine Staff-Funktionen fachlich klassifizieren.
   Risiko: hoch bei Freitext.
   Rollback: unklare Werte auf manuell setzen.
4. Nur sichere Kandidaten in Vorschau pruefen.
   Risiko: mittel.
   Rollback: Vorschau verwerfen.
5. Neues Staff-Rollen-Read-Model planen.
   Risiko: mittel.
   Rollback: weiter Legacy-Fallback lesen.
6. Coach-DTO erweitern.
   Risiko: mittel.
   Rollback: DTO-Felder hinter Feature-Schritt weglassen.
7. Admin-Formular erweitern.
   Risiko: hoch.
   Rollback: allgemeine Staff-Rollen vorerst read-only halten.
8. Write-Pfad fuer allgemeine Funktionen ergaenzen.
   Risiko: hoch.
   Rollback: Masterrollen-Write noch aktiv lassen.
9. Oeffentliche Anzeige ergaenzen.
   Risiko: mittel.
   Rollback: keine Anzeige ausser Teamrollen.
10. Masterrollen-Write deaktivieren.
    Risiko: hoch.
    Rollback: Legacy-Write temporaer reaktivieren.
11. Masterrollen-Read deaktivieren.
    Risiko: hoch.
    Rollback: Fallback-Read gezielt wiedereinschalten.
12. Validierung.
    Risiko: gering.
    Rollback: Findings blockieren den naechsten Schritt.
13. Spaetere `coaches.role*`-Entfernung vorbereiten.
    Risiko: hoch.
    Rollback: Spalten zunaechst behalten.

## 13. Scope und Permissions

Verbindliche Regeln:

- Team-Scope nur aus `coach_team_seasons`
- allgemeine Staff-Funktion gibt keinen Team-Scope
- allgemeine Staff-Funktion gibt keine Permission
- Permissions bleiben in `admin_roles`, `admin_permissions`, `admin_user_roles`, `admin_role_permissions`
- manuelle Team-Overrides bleiben getrennt
- Staff-Funktionen duerfen fuer Anzeige und Organisation genutzt werden, nicht fuer Sicherheitsentscheidungen

## 14. Postcheck

Die Kontrollabfragen stehen in [docs/sql/b13-15-coach-staff-roles-postcheck-readonly.sql](/C:/Users/swen7/Desktop/Website_GK/djk-giesenkirchen-webseite/docs/sql/b13-15-coach-staff-roles-postcheck-readonly.sql).

Sie pruefen spaeter:

- Anzahl neuer Staff-Rollen
- doppelte aktive Rollen
- ungueltige Zeitraeume
- verwaiste `coach_id`
- fehlende `role_de`
- verbleibende allgemeine Kandidaten ohne Staff-Rolle
- Legacy-Konfliktfaelle
- unveraenderte Legacy-Bestaende
- keine fachliche Auswirkung auf `coach_team_seasons`
- keine Scope-Ableitung aus Staff-Rollen

## 15. Rollback

Die Rollback-Vorbereitung steht in [docs/sql/b13-15-coach-staff-roles-rollback-proposal.sql](/C:/Users/swen7/Desktop/Website_GK/djk-giesenkirchen-webseite/docs/sql/b13-15-coach-staff-roles-rollback-proposal.sql).

Wichtige Entscheidung:

- Es wird derzeit **kein** automatischer Rollback mit Datenmutation vorgeschlagen.
- Grund: Ohne eindeutige Herkunftsmarkierung oder protokollierte Insert-ID-Liste ist nicht sicher belegbar, welche Staff-Rollen ausschliesslich aus dem Backfill stammen wuerden.
- Rollback bleibt deshalb ein manueller, explizit freizugebender Betriebsprozess.

## 16. Risiken

- Freitextrollen in `coaches.role*` koennen fachlich nicht eindeutig sein.
- Ein Teil der Bestandswerte koennte teambezogen und nicht allgemein sein.
- Mehrsprachige Werte koennen inkonsistent zwischen `role`, `role_de` und `role_en` belegt sein.
- Ohne disziplinierte Klassifikation entstehen sonst neue Dubletten im Zielmodell.
- Runtime-Reads auf `coaches.role*` bleiben bis zur spaeteren Umstellung produktiv relevant.

## 17. Manuelle Freigabepunkte

- Freigabe des initialen `role_key`-Sets
- Freigabe der Liste eindeutig allgemeiner Rollenbezeichnungen
- Freigabe aller `GENERAL_STAFF_CANDIDATE`-Zeilen vor spaeterem Insert
- Freigabe der UI-Regel fuer teamlose Coaches ohne allgemeine Funktion
- Freigabe, ob historische allgemeine Funktionen oeffentlich sichtbar sein duerfen

## 18. Go-/No-Go-Kriterien

Go nur wenn:

- B13.14 Zielmodell weiterhin gilt
- Inventurwerte tatsaechlich ausgewertet wurden
- klare Kandidatenlisten fuer automatische Uebernahme vorliegen
- Scope-Regeln unveraendert an `coach_team_seasons` gebunden bleiben

No-Go wenn:

- unklare Freitextrollen automatisch uebernommen werden sollen
- Staff-Rollen kuenftig Permissions oder Team-Scope ausloesen sollen
- Runtime weiterhin einzige teamlose Darstellung ueber `coaches.role*` benoetigt und kein Ersatzmodell bereitsteht

## 19. Auswirkung auf `coaches.role*`

- `coaches.role`: bleibt `MIGRATION_REQUIRED`
- `coaches.role_de`: bleibt `MIGRATION_REQUIRED`
- `coaches.role_en`: bleibt `MIGRATION_REQUIRED`

Begruendung:

- Die Felder sind noch produktiv als Fallback aktiv.
- Sie duerfen erst nach Schemaaufbau, Inventur, klassifiziertem Backfill, Read-/Write-Umstellung und Validierung deaktiviert werden.

## 20. Empfohlener naechster Schritt

Naechster sinnvoller Schritt ist die fachliche Freigabe des `role_key`-Vokabulars und die echte Auswertung der Read-only-Inventur. Erst wenn daraus eine belastbare Liste sicherer `GENERAL_STAFF_CANDIDATE`-Faelle vorliegt, sollte ein spaeterer technischer Insert-Schritt geplant oder freigegeben werden.
