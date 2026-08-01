# B13.15 - Coach Staff Role Migration Manifest

## 1. Scope

Dieses Manifest beschreibt nur die additive Vorbereitung fuer allgemeine Coach-Staff-Funktionen ausserhalb von Team-Saisons. Im Fokus stehen `coach_staff_roles`, die Legacy-Inventur von `coaches.role*`, die Klassifikation sicherer Kandidaten und die spaetere Read-/Write-Umstellung.

## 2. Nicht enthaltene Module

- keine produktiven Aenderungen in `src/`
- keine RLS- oder Policy-Aenderung
- keine Entfernung von `coaches.role*`
- keine Aenderung an `coach_team_seasons`
- keine Permission- oder Login-Modell-Aenderung

## 3. Vorbedingungen

- B13.14 Zielentscheidung fuer separates Staff-Rollenmodell ist freigegeben.
- Read-only-Inventur fuer Legacy-Rollen wurde ausgefuehrt und ausgewertet.
- Ein initiales `role_key`-Vokabular ist fachlich freigegeben.
- Unklare Freitextrollen sind explizit markiert und nicht fuer automatische Uebernahme vorgesehen.

## 4. Additive Aenderungen

- neue Tabelle `public.coach_staff_roles`
- FK auf `coaches`
- optionale Audit-FKs auf `admin_profiles`
- Sortier-, Aktiv- und Suchindizes
- keine Modifikation bestehender `coaches.role*`-Spalten

## 5. Klassifikationsregeln

- `TEAM_ROLE_RECONSTRUCTABLE`: Legacy-Rolle ist aus Assignment-Historie ableitbar.
- `GENERAL_STAFF_CANDIDATE`: Legacy-Rolle ist klar allgemeine Vereinsfunktion und konfliktfrei.
- `EMPTY_OR_NULL`: keine nutzbare Legacy-Rolle vorhanden.
- `AMBIGUOUS`: Bedeutung unklar.
- `CONFLICTING`: Masterrolle widerspricht anderen Masterwerten oder aktiven Assignments.
- `MANUAL_REVIEW_REQUIRED`: keine sichere technische Uebernahme verantwortbar.

## 6. Sichere Backfill-Kandidaten

Nur Kandidaten mit allen folgenden Eigenschaften:

- genau ein konsistenter normalisierter Legacy-Wert
- kein aktives Team-Assignment mit passender Teamrolle
- keine historische Assignment-Rolle mit derselben fachlichen Bedeutung
- Rollenwert gehoert zu einer explizit freigegebenen allgemeinen Staff-Funktion
- noch keine passende aktive `coach_staff_roles`-Zeile vorhanden

## 7. Manuelle Prueffaelle

- freie Rollenbegriffe ohne Vokabular-Treffer
- abweichende Werte zwischen `role`, `role_de` und `role_en`
- Coaches mit aktiven Assignments und abweichender Legacy-Masterrolle
- historische Coaches mit mehreren moeglichen Interpretationen
- moegliche Mischfaelle wie "Trainerpool" plus saisonale Teamrolle

## 8. Ausfuehrungsreihenfolge

1. Schema vorbereiten
2. Legacy-Inventur ausfuehren
3. Kandidaten fachlich klassifizieren
4. sichere Vorschau pruefen
5. spaeter freigegebenen Backfill ausfuehren
6. Staff-Rollen-Read-Model einfuehren
7. DTOs und Admin-Formular erweitern
8. Staff-Rollen-Write ergaenzen
9. oeffentliche Anzeige ergaenzen
10. Legacy-Masterrollen-Write deaktivieren
11. Legacy-Masterrollen-Read deaktivieren
12. spaetere Spaltenentfernung vorbereiten

## 9. Kontrollabfragen

- Inventur der `coaches.role*`-Belegung
- Kandidatenliste nach Klassifikation
- Dublettencheck in `coach_staff_roles`
- Zeitraumpruefung
- Orphan-Check auf `coach_id`
- Legacy-Bestand vor und nach Backfill vergleichen
- `coach_team_seasons` unveraendert kontrollieren

## 10. Rollback

- Fuer den aktuell vorgeschlagenen Preview-only-Backfill gibt es keine Datenmutation und damit keinen technischen Rollbackbedarf.
- Fuer einen spaeter manuell freigegebenen Insert-Schritt wird nur ein manueller Rollbackprozess empfohlen, solange die Herkunft eingefuegter Staff-Rollen nicht eindeutig protokolliert ist.
- `coaches.role*` bleibt unangetastet und dient bis zur finalen Umstellung als Rueckfallebene.

## 11. Risiken

- nicht rekonstruierbare Freitextwerte
- fachlich unsaubere Gleichsetzung von Teamrolle und allgemeiner Vereinsfunktion
- zu fruehe Abschaltung der Masterrollen-Fallbacks
- uneinheitliche Mehrsprachigkeit ohne kontrolliertes Key-Vokabular

## 12. Testplan

Zu pruefen sind spaeter mindestens:

- Coach nur mit Teamrolle
- Coach nur mit allgemeiner Staff-Funktion
- Coach mit beiden Arten
- Coach mit mehreren allgemeinen Funktionen
- Coach ohne Rolle
- historische und abgelaufene Staff-Funktion
- Admin- und Website-Anzeige
- keine Scope-Ableitung aus Staff-Rollen
- keine Permission-Ableitung aus Staff-Rollen

## 13. Go-/No-Go-Kriterien

Go nur wenn:

- sichere Kandidatenlisten vorliegen
- Staff-Funktionen fachlich freigegeben sind
- Scope- und Permission-Regeln unveraendert bleiben
- Read-/Write-Reihenfolge kontrolliert planbar ist

No-Go wenn:

- unklare Legacy-Freitexte automatisch uebernommen werden sollen
- Staff-Rollen als Sicherheitsmerkmal verwendet werden sollen
- Produktivcode noch ausschliesslich auf `coaches.role*` fuer teamlose Anzeige angewiesen ist
