# B15.9D – Sichere Trainerarchivierung

## Ziel

Der bisherige Trainer-Hard-Delete wurde durch die gemeinsame Admin-Archivierungsarchitektur ersetzt. Es werden keine Coach- oder Assignment-Datensätze gelöscht.

## Ablauf

1. Coach und aktuelle Saison werden eindeutig geladen.
2. Alle aktiven `coach_team_seasons` der aktuellen Saison werden gebündelt ermittelt.
3. Diese Zuordnungen werden gesammelt deaktiviert.
4. Der Coach wird deaktiviert.
5. Ein Postcheck bestätigt, dass Coach und aktuelle Zuordnungen inaktiv sind.

Historische Zuordnungen anderer Saisons bleiben unverändert. Eine spätere Reaktivierung des Coach-Masters stellt keine Zuordnung wieder her.

## Rollback

Schlägt ein Mutationsschritt oder der Postcheck fehl, werden die zuvor aktiven aktuellen Zuordnungen gesammelt reaktiviert und der ursprüngliche Aktivstatus des Coach-Masters wiederhergestellt. Schlägt auch der Rollback fehl, liefert die bestehende Architektur `ARCHIVE_CONFLICT`.

## Permission und Scope

Die Action verwendet unverändert `coaches.delete`, `loadServerPersonScopeContext`, `getCoachTeamIdsMap` und `canDeleteCoachOnServer`. Es wurden weder Permission-Keys noch Rollen- oder Scope-Regeln geändert. Damit gelten weiterhin die vorhandenen globalen Verwaltungs- und Jugend-Scope-Regeln.

## Oberfläche

Im Header bleibt ausschließlich Bearbeiten. `Trainer archivieren` befindet sich nur im Gefahrenbereich und verwendet den gemeinsamen `ArchiveButton`. Der Dialog erklärt Deaktivierung, Ende aktueller Zuordnungen, Historienerhalt, Entfernung aus öffentlichen Bereichen und ausbleibende automatische Wiederzuordnung.

## Revalidation

Nach Erfolg werden Admin-Dashboard, Trainerliste, Trainer-Arbeitsseite und Mannschaftsliste aktualisiert. Die vorhandenen öffentlichen Revalidation-Gruppen `coaches`, `teams` und `contacts` decken Trainerprofile, Mannschaftsseiten und Ansprechpartnerflächen ab.

## Tests

Abgedeckt sind Erfolg, aktuelle und historische Zuordnungen, Reaktivierung ohne Wiederzuordnung, Rollback, Permission-/Scope-Anker, Entfernung der Hard-Delete-RPC, Gefahrenbereich, Revalidation sowie Spieler- und Mannschaftsregression.

## Risiken

Die Archivierung besteht wie bei Spielern und Mannschaften aus mehreren Datenbankoperationen mit kompensierendem Rollback, nicht aus einer einzelnen Datenbanktransaktion. Ein gleichzeitiger externer Schreibzugriff zwischen Snapshot und Postcheck bleibt ein allgemeines Konkurrenzrisiko; `ARCHIVE_CONFLICT` macht einen fehlgeschlagenen Rollback sichtbar.
