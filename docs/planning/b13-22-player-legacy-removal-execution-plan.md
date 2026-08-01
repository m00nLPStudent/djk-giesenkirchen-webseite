# B13.22 - Player Legacy Removal Execution Plan

## 1. Ziel

Dieses Paket bereitet die spaetere Entfernung der entkoppelten Player-Legacy-Spalten aus `public.players` vor, ohne in diesem Schritt Datenbank oder Runtime-Code zu veraendern.

## 2. Betroffene Spalten

- `team_id`
- `shirt_number`
- `jersey_number`
- `position`
- `position_de`
- `position_en`
- `is_captain`
- `sort_order`

## 3. Runtime-Sweep-Ergebnis

Finaler Sweep ueber `src/`:

- echte Runtime-Reads auf `players.*`: keine
- echte Runtime-Writes auf `players.*`: keine
- explizite `players.*`-Treffer im Code: nur Test-/Dokumentationsreste

Wesentliche Verifikation:

- Admin-Liste und Team-Picker lesen `sort_order` nicht mehr aus `players`
- Rollback liest keine Player-Master-Snapshotfelder mehr
- Team-, Profil-, Suche-, Filter- und Scope-Pfade lesen Playerdaten saisonal aus `player_team_seasons`

## 4. Preflight

Die Live-DB-Pruefung ist vorbereitet in:

- `docs/sql/b13-22-player-legacy-removal-preflight-readonly.sql`

Sie prueft:

- Spaltenmetadaten
- Constraints, Indizes und Abhaengigkeiten
- nicht-leere Legacy-Bestaende
- Datenkonsistenz gegen aktuelle saisonale Assignments
- potenzielle Datenverlustfaelle

## 5. Datenkonsistenz

Die Konsistenzpruefung ist Teil des Preflight-Skripts und klassifiziert je Feld:

- `MATCH`
- `LEGACY_ONLY`
- `ASSIGNMENT_ONLY`
- `CONFLICT`
- `MULTI_ASSIGNMENT_NOT_COMPARABLE`
- `NO_CURRENT_ASSIGNMENT`

Wichtig:

- bei mehreren aktiven aktuellen Assignments darf kein einzelner Masterwert als sicher rekonstruierbar gelten
- `jersey_number` wird gegen `player_team_seasons.shirt_number` verglichen
- `position` wird gegen die aktuelle saisonale Positionsdarstellung verglichen

## 6. Abhaengigkeiten

Runtime-seitig wurden keine aktiven Blocker mehr gefunden.

Offen bleibt nur die Live-DB-Bestaetigung fuer:

- Views
- Materialized Views
- Funktionen / RPCs
- Trigger
- Policies
- generated columns
- Constraints / Indizes

## 7. Freigegebene Spalten

Runtime-seitig freigegeben:

- `team_id`
- `shirt_number`
- `jersey_number`
- `position`
- `position_de`
- `position_en`
- `is_captain`
- `sort_order`

## 8. Blockierte Spalten

Aktuell keine runtime-blockierten Spalten.

Formaler Freigabeblocker fuer den echten Drop bleibt:

- ausstehende Ausfuehrung und Auswertung des Read-only-Preflights gegen die Ziel-Datenbank

## 9. Backup-Anforderung

Pflicht vor jedem echten Drop:

- vollstaendiges Schema-Backup
- Daten-Backup der Tabelle `public.players`
- Nachweis, dass Restore vor dem Eingriff getestet oder betrieblich abgesichert ist

Ohne Backup keine Ausfuehrung.

## 10. Ausfuehrungsreihenfolge

1. Read-only-Preflight ausfuehren.
2. Ergebnisse auf Abhaengigkeiten und Konflikte bewerten.
3. Go-/No-Go offiziell entscheiden.
4. Nur bei Go das Drop-SQL separat freigeben oder erzeugen.
5. Vor Ausfuehrung Backup bestaetigen.
6. Drop in Wartungsfenster ausfuehren.
7. Read-only-Postcheck ausfuehren.
8. Manuellen Funktionstest abarbeiten.

## 11. Rollback

Vorbereitet in:

- `docs/sql/b13-22-player-legacy-removal-rollback-proposal.sql`

Rollback-Grundsaetze:

- Schema-Rollback und Daten-Rollback getrennt behandeln
- keine Daten aus `primaryAssignment` oder anderen Heuristiken rekonstruieren
- Daten-Rollback nur ueber Backup
- additive leere Wiederanlage der Spalten hoechstens als Notstruktur, nicht als Datenwiederherstellung

## 12. Postcheck

Vorbereitet in:

- `docs/sql/b13-22-player-legacy-removal-postcheck-readonly.sql`

Geprueft werden:

- Spalten wirklich entfernt
- keine offensichtlichen Abhaengigkeitsreste
- Player-/Assignment-Tabellen technisch weiter lesbar
- aktuelle und historische Relationen unveraendert
- keine verwaisten oder doppelt aktiven Relationen

## 13. Manueller Funktionstest

Nach einer spaeteren Migration mindestens pruefen:

- Admin Player Liste
- Player Create/Edit
- Teamwechsel / Reaktivierung
- Team-Playerpicker
- oeffentliche Teamseite
- oeffentliches Spielerprofil
- Suche / Filter / Scopes
- Regression gegen Coaches, Vorstand, News, Termine, Einstellungen und Login

## 14. Go-/No-Go-Kriterien

Go nur wenn:

- Preflight keine relevanten DB-Abhaengigkeiten zeigt
- keine Datenverlustfaelle ohne bewusst akzeptierten Backup-/Migrationsplan bestehen
- keine Konfliktfaelle fuer laufende Betriebsprozesse offen sind

Aktueller Status:

- Runtime: `GO`
- Datenbankfreigabe: `NO-GO PENDING PREFLIGHT`

## 15. Risiken

- unbekannte Live-DB-Abhaengigkeiten ausserhalb des Repos
- Legacy-Restdaten koennen fuer manuelle Reports oder externe Queries noch relevant sein
- Drop ohne vorheriges Backup waere irreversibel

## 16. Empfohlener Ausfuehrungszeitpunkt

Ein kleines Wartungsfenster nach erfolgreicher Preflight-Auswertung und bestaetigtem Backup. Kein gleichzeitiger Deployment-Schritt mit groesseren fachlichen Aenderungen.
