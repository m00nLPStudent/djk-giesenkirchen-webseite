# B13.9B - Coach Assignment Reactivation Fix

## 1. Fehlerbild

Beim Bearbeiten eines Trainers und Hinzufuegen einer weiteren Mannschaft kam es
zu einem DB-Fehler auf dem Unique-Constraint
`coach_team_seasons_coach_id_team_season_id_key`.

## 2. Root Cause

- Der bisherige Edit-Pfad hat fuer die Planung nur das saisonale Read-Model aus
  `getCoachSeasonalReadModel(...)` verwendet.
- Dieses Read-Model enthaelt ausschliesslich aktive aktuelle Zuordnungen.
- Bereits vorhandene inaktive `coach_team_seasons`-Zeilen derselben
  `team_season_id` wurden dadurch uebersehen.
- Neue Formularzeilen ohne `coach_team_season_id` wurden anschliessend blind als
  `INSERT` geplant.
- Die Datenbank erlaubt jedoch nur genau eine Zeile pro
  `coach_id + team_season_id`, unabhaengig vom Aktivstatus.

## 3. Unique-Constraint

- Der bestehende Unique-Constraint bleibt unveraendert bestehen.
- Die Anwendungslogik respektiert ihn jetzt aktiv, statt auf einen DB-Fehler zu
  laufen.

## 4. Bisheriger Schreibpfad

1. Formular-Assignments normalisieren
2. aktives saisonales Read-Model laden
3. nur bekannte aktive Zeilen matchen
4. unbekannte Formularzuordnung als `INSERT` planen
5. bei bereits vorhandener inaktiver Zeile kollidiert das `INSERT` mit dem
   Unique-Constraint

## 5. Neuer Schreibpfad

1. Formular-Assignments normalisieren
2. alle aktuellen `coach_team_seasons`-Zeilen des Coaches laden:
   - aktiv
   - inaktiv
3. pro Formularzeile zuerst nach gleicher `team_season_id` matchen
4. je nach Zustand `CREATE`, `UPDATE`, `REACTIVATE` oder `UNCHANGED` planen
5. nicht mehr referenzierte aktive aktuelle Zeilen als `DEACTIVATE` markieren
6. Masterdatensatz aktualisieren
7. danach Zuordnungen anwenden
8. bei Folgefehlern reaktivierte, aktualisierte und deaktivierte Zeilen auf den
   Ursprungszustand zuruecksetzen

## 6. CREATE-/UPDATE-/REACTIVATE-/DEACTIVATE-Regeln

- `CREATE`
  - nur wenn keine bestehende aktuelle Zeile mit derselben `team_season_id`
    existiert
- `UPDATE`
  - wenn die aktuelle aktive Zeile existiert und sich Rolle oder Sortierung
    geaendert hat
- `REACTIVATE`
  - wenn dieselbe `team_season_id` bereits als inaktive aktuelle Zeile
    existiert
  - dabei werden `role_de`, `role_en`, `sort_order` und `is_active = true`
    auf derselben Zeile aktualisiert
- `DEACTIVATE`
  - wenn eine zuvor aktive aktuelle Zeile im Formular entfernt wurde
- `UNCHANGED`
  - wenn eine bestehende aktive Zeile unveraendert erneut uebermittelt wird

## 7. Rollenregel

- Wegen des DB-Constraints darf dieselbe `team_season_id` im Payload nur einmal
  vorkommen.
- Mehrere Rollen fuer dieselbe Team-Saison werden clientseitig und serverseitig
  blockiert.
- Mehrere Rollen bleiben nur dann gueltig, wenn sie zu unterschiedlichen
  Team-Saisons bzw. Mannschaften gehoeren.

## 8. Fehlerbehandlung

- Die Repository-Schicht mappt bekannte Duplicate-Constraint-Fehler jetzt auf
  eine benutzerfreundliche Meldung:
  - `Diese Mannschaft ist dem Trainer bereits zugeordnet. Die bestehende Zuordnung wurde nicht doppelt angelegt.`
- Ohne echte DB-Transaktion werden bei Folgefehlern:
  - deaktivierte Zeilen wieder aktiviert
  - aktualisierte Zeilen auf den alten Inhalt zurueckgesetzt
  - reaktivierte Zeilen auf ihren vorherigen Aktivstatus und Inhalt
    zurueckgesetzt
  - neu eingefuegte Zeilen wieder deaktiviert
- Andere Saisonzuordnungen und historische Saisons bleiben unberuehrt.

## 9. Tests

- Erfolgreich getestet:
  - `CREATE` fuer neue Zuordnung
  - `UPDATE` fuer bestehende aktive Zuordnung
  - `REACTIVATE` fuer bestehende inaktive Zuordnung
  - `DEACTIVATE` fuer entfernte Zuordnung
  - erneutes Hinzufuegen nach Deaktivierung -> `REACTIVATE`
  - Rollenwechsel innerhalb derselben Team-Saison -> `UPDATE`
  - Sortierungsaenderung -> `UPDATE`
  - unveraenderte Zuordnung -> `UNCHANGED`
  - Teamwechsel ohne Zielzeile -> `DEACTIVATE + CREATE`
  - Teamwechsel mit vorhandener inaktiver Zielzeile -> `DEACTIVATE + REACTIVATE`
  - doppelte `team_season_id` im Payload -> kontrollierter Fehler

## 10. Offene Risiken

- Die reaktive Konfliktbehandlung deckt den erwarteten Duplicate-Fall ab; bei
  hochparallelen konkurrierenden Saves bleibt dennoch nur best-effort ohne echte
  Datenbanktransaktion moeglich.
- Die clientseitige Formularvalidierung ist angepasst, wird aber nicht separat
  ueber die Node-Testumgebung ausgefuehrt, weil die Formularhelfer weiterhin auf
  App-Aliase aufbauen.
