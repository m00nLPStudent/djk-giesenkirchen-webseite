# B13.7 - Saisonale Read-Modelle

## 1. Ziel

Phase 1 aus B13.6 fuehrt eine zentrale Read-Model-Schicht fuer saisonale Player- und Coach-Zuordnungen ein, ohne Legacy-Fallbacks ausserhalb der Repository-Schicht zu entfernen.

## 2. Geaenderte Dateien

- `src/components/admin/persons/personTeamRepository.js`
- `src/components/admin/persons/personTeamLegacyRepository.js`
- `src/components/admin/persons/currentSeasonRepository.js`
- `src/components/admin/persons/playerSeasonalReadModelRepository.js`
- `src/components/admin/persons/coachSeasonalReadModelRepository.js`
- `src/components/admin/persons/seasonalReadModelCore.mjs`
- `src/components/admin/persons/seasonalReadModelCore.test.mjs`

## 3. Player-Read-Model

- Exportiert: `getPlayerSeasonalReadModel`, `getPlayerSeasonalReadModelsMap`
- Struktur:
  - `playerId`
  - `activeSeasonId`
  - `activeSeasonStatus`
  - `assignments`
  - `primaryAssignment`
  - `hasActiveAssignment`
  - `hasMultipleActiveAssignments`
  - `legacyTeamId`
  - `legacyFallbackUsed`
- `assignments` enthalten nur aktive Zuordnungen der eindeutig aktuellen Saison.

## 4. Coach-Read-Model

- Exportiert: `getCoachSeasonalReadModel`, `getCoachSeasonalReadModelsMap`
- Struktur:
  - `coachId`
  - `activeSeasonId`
  - `activeSeasonStatus`
  - `assignments`
  - `primaryAssignment`
  - `hasActiveAssignment`
  - `hasMultipleActiveAssignments`
  - `legacyTeamId`
  - `legacyTeamName`
  - `legacyFallbackUsed`
- Mehrfachzuordnungen bleiben als Array vollstaendig erhalten; `primaryAssignment` ist nur eine deterministische Anzeigehilfe.

## 5. Aktive Saisonaufloesung

- Neue kanonische Funktion: `loadCurrentSeasonResolution`
- Query-Regel:
  - es wird ausschliesslich nach `seasons.is_current = true` gesucht
- Statuswerte:
  - `CURRENT_SEASON_RESOLVED`
  - `CURRENT_SEASON_MISSING`
  - `CURRENT_SEASON_AMBIGUOUS`
- Bei fehlender oder mehrdeutiger aktueller Saison wird kein beliebiger Saison-Datensatz ausgewaehlt.

## 6. Mehrfachzuordnungen

- Player:
  - mehrere aktive aktuelle Zuordnungen bleiben sichtbar
  - `hasMultipleActiveAssignments` wird dann `true`
  - `primaryAssignment` sortiert nach `sort_order`, `created_at`, `id`
- Coach:
  - mehrere aktive Teams und Rollen sind explizit erlaubt
  - keine Zusammenfassung und kein stilles Ueberschreiben
  - dieselbe deterministische Sortierung fuer `primaryAssignment`

## 7. Legacy-Kompatibilitaet

- Die bisherigen Exporte `getPlayerTeamIdsMap` und `getCoachTeamIdsMap` bleiben unveraendert ueber `personTeamLegacyRepository.js` erhalten.
- Bestehende Runtime-Consumer bleiben dadurch funktionsgleich.
- Die neuen Read-Modelle liefern Legacy-Werte nur separat markiert als:
  - `legacyTeamId`
  - `legacyTeamName`
  - `legacyFallbackUsed`

## 8. Query-Anzahl

- Normaler Batch-Lauf mit eindeutig aktueller Saison:
  - `1` Query auf `seasons`
  - `1` Query auf `players` oder `coaches`
  - `1` Query auf `player_team_seasons` oder `coach_team_seasons`
  - `1` Query auf `team_seasons`
  - `1` Query auf `teams`
- Summe: `5` Queries pro Batch-Lauf ohne N+1.
- Bei fehlender oder mehrdeutiger aktueller Saison entfallen die Assignment-/Team-Queries; dann bleiben `2` Queries.

## 9. Fehlerbehandlung

- Datenbankfehler werfen weiterhin technische Fehler.
- Fehlende oder mehrdeutige aktuelle Saison fuehrt nicht zu einer Exception allein aus Fachgruenden.
- Stattdessen geben die Read-Modelle leere `assignments` und einen klaren Saisonstatus zurueck.

## 10. Noch nicht umgestellte Consumer

- Admin-Spielerliste
- Admin-Trainerliste
- Player- und Coach-Edit-Seiten
- Server-Action-Scope-Pfade
- oeffentliche Team- und Profilseiten
- Team-Create/Edit-Auswahllisten

## 11. Risiken

- Die neue kanonische Saisonlogik ist strenger als die bisherige Legacy-Helferlogik und macht Mehrdeutigkeiten jetzt explizit sichtbar.
- Solange bestehende Consumer noch nicht umgestellt sind, existieren alte und neue Read-Pfade parallel.
- Mehrfachzuordnungen bei Coaches sind technisch abbildbar, aber noch nicht in allen Admin-UIs konsumiert.

## 12. Empfohlener naechster Schritt

Als B13.8 sollte der Player-Schreib- und Formularpfad auf Basis dieser neuen Read-Modelle umgestellt werden. Das minimiert die Aenderungsbreite, haelt oeffentliche Seiten unberuehrt und bereitet danach gezielt Filter-, Scope- und Website-Pfade vor.
