# B14.6B – Mannschaften und Spieler sicher archivieren

## 1. Ziel

Mannschaften und Spieler werden ohne Hard Delete aus dem aktiven Spielbetrieb genommen. Personen, historische Saisonzuordnungen, Beiträge und Zahlungen bleiben erhalten.

## 2. Begriffe

Die UI verwendet ausschließlich „Mannschaft archivieren“ und „Spieler archivieren“. Archivierung bedeutet Deaktivierung, nicht Löschung.

## 3. Berechtigungen

Verwendet werden die bestehenden Keys `teams.delete` und `players.delete`. Laut bestehender Permission-Zuordnung besitzen Superadmin, Vorstand/Fußball-Vorstand und Jugendleiter diese Keys. Der Server prüft zusätzlich den vorhandenen Team-/Jugend-Scope. Trainer, Betreuer, Kassierer und Gast erhalten keine neuen Rechte. Eine neue Permission und SQL sind nicht erforderlich.

## 4. Bestehende Architektur

Die Actions verwenden `assertAdminActionPermission`, `loadServerTeamScopeContext` beziehungsweise `loadServerPersonScopeContext` und die bestehenden Scope-Prädikate. Saisonale Quellen sind `team_seasons`, `player_team_seasons` und `coach_team_seasons`; Legacy-Felder sind keine Archivierungsquelle.

## 5. Mannschaftsarchivierung

Die aktuelle Saison muss genau einmal auflösbar sein. Für das Team muss genau eine aktuelle Team-Saison existieren. Zuerst werden deren aktive Zuordnungen deaktiviert, danach `team_seasons.is_active` und `teams.is_active`. Historische Team-Saisons werden nicht verändert. Der Team-Master wird ebenfalls deaktiviert, damit das Team nicht mehr aktiv angeboten wird.

## 6. Spielerzuordnungen

Nur aktive `player_team_seasons` der aktuellen Team-Saison werden auf `false` gesetzt. Spieler-Master und andere Team-Zuordnungen bleiben beim Teamarchiv unverändert.

## 7. Trainerzuordnungen

Nur aktive `coach_team_seasons` der aktuellen Team-Saison werden auf `false` gesetzt. Trainer-Master und andere Mannschaftszuordnungen bleiben unverändert.

## 8. Spätere Reaktivierung

Archivierte Relationszeilen werden nicht reaktiviert. Eine spätere Aktivierung von Master oder Team-Saison erzeugt keine Zuordnung; Spieler und Trainer müssen bewusst neu zugewiesen werden.

## 9. Spielerarchivierung

`players.is_active` wird auf `false` gesetzt. Aktive `player_team_seasons` des Spielers, deren Team-Saison zur aktuellen Saison gehört, werden beendet. Stammdaten, Bilder und historische Zuordnungen bleiben erhalten.

## 10. Offene Beiträge

Serverseitig gelten `open`, `partially_paid` und `deferred` bei `amount_outstanding > 0` als offen. `paid`, `exempt` und `canceled` gelten nicht als offen. Offene Positionen blockieren nicht, sondern aktivieren den erweiterten Dialog. Es werden weder Status noch Beträge verändert.

## 11. Contributions-Sichtbarkeit

Das Contributions-Repository lädt zuerst Contributions und anschließend Spieler ohne `players.is_active`-Filter. Name, Detail, Export/Statistik und Zahlungsbearbeitung bleiben deshalb für archivierte Spieler verfügbar, solange Contribution-Zeilen existieren. Contribution-Permissions bleiben unverändert.

## 12. Rollback

Da keine vorhandene Archivierungs-RPC verfügbar ist und keine Datenbankänderung erlaubt ist, werden exakte Snapshots aller veränderten `id`-/`is_active`-Werte geladen. Bei einem Teilschrittfehler werden Relations-, Saison- und Masterstatus kompensierend wiederhergestellt. Ein Rollbackfehler wird als `ARCHIVE_CONFLICT` gemeldet. Der Postcheck verlangt null aktive Zielzuordnungen beziehungsweise einen inaktiven Player-Master.

## 13. Revalidation

Teams: Admin, Teamliste, Teamdetail, Spielerliste und bestehender öffentlicher Team-Scope. Spieler: Spielerliste/-detail, Teamliste, Contributions und öffentlicher Team-Scope. Dynamische öffentliche Team-, Trainings- und Mannschaftsseiten werden durch das bestehende Revalidation-Modul abgedeckt.

## 14. Datenschutz

Dialoge nennen keine personenbezogenen Zuordnungs- oder Zahlungsdetails. Rohfehler der Datenbank werden nicht an die UI gegeben. Es gibt keine Client-Supabase-Abfrage.

## 15. Tests

Core-Tests decken offene Status/Betrag, Summierung und kompensierenden Rollback ab. Gezieltes ESLint deckt alle neuen und angepassten Archivierungsdateien ab. Rollen-, Scope- und Live-Datenbanktests benötigen die konfigurierte Test-/Staging-Umgebung.

## 16. Offene Risiken

Kompensierender Rollback ist keine echte Datenbanktransaktion; gleichzeitige Fremdänderungen zwischen Snapshot und Rollback können einen Konflikt verursachen. Die Operation meldet diesen Zustand ausdrücklich. Eine atomare RPC wäre fachlich robuster, ist wegen des Verbots von SQL-/Schemaänderungen hier nicht umgesetzt.

## 17. Empfohlener nächster Schritt

In einer Staging-Datenbank die Rollen-/Scope-Matrix und beide Dialogvarianten ausführen. Danach kann separat eine idempotente transaktionale RPC als eigenes freizugebendes Proposal geplant werden.
