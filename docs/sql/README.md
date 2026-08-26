# SQL-Register und Aufbewahrung

> B15.21A und B15.21B0 sind produktiv abgeschlossen. Die B15.21B0-Dateifamilie bleibt als Rolloutnachweis erhalten; der Rollback ist nur ein destruktives Notfallartefakt.

Stand: 26. August 2026. Inventar: 147 SQL-Dateien. Dieses Register führt keine SQL-Ausführung durch und behauptet keinen Live-Ausführungsstatus, der nicht repositoryseitig belegt ist.

## Vollständige Klassifikationsregeln

Die erste passende Regel gewinnt und erfasst damit jede SQL-Datei:

1. `*rollback*.sql` → **D: Rollback/Notfall**. 35 Dateien; immer behalten.
2. `*postcheck*`, `*preflight*`, `*diagnostic*`, `*inventory*`, `*dry-run*`, `*audit*` → **C: Postcheck/Diagnose**, sofern der Inhalt read-only ist. 54 namensbasierte Diagnoseartefakte; behalten.
3. `b15-18*` und `b15-19*`, die nicht unter 1 oder 2 fallen → **B/G: historisches Implementierungs-/Rolloutartefakt; Ausführung im Zweifel manuell verifizieren**. Anwendung und Tests sind versioniert, Git beweist aber keine Ausführung gegen eine konkrete Datenbank.
4. `b13-22*` sowie noch nicht abschließend entfernte B13-Legacy-Proposals → **A/G: für späteren Datenbank-/Saison-Cleanup aufbewahren; vor Ausführung Live-Audit erforderlich**.
5. Dateien mit Präfix `noch-nicht-ausführen-` oder `nach-Prüfung-ausführbar-` → **A/G: offen beziehungsweise manuell zu verifizieren**. Der Dateiname ist keine Ausführungsfreigabe.
6. `aktuell-nicht-erforderlich–b12-team-scopes-proposal.sql` → **E: durch den späteren Scope-Stand überholt/deferred**, als Entscheidungsnachweis behalten.
7. `bereits-umgesetzt-b12-profile-links-proposal.sql` → **B/G: historischer Vorschlag; Live-Ausführung repositoryseitig nicht beweisbar**, behalten.
8. übrige unversionierte oder ältere Seed-/Schema-/RLS-Dateien → **G: Status manuell verifizieren**, bis ein Live-Inventar sie eindeutig zuordnet.

## B15.18

- Schema-, RLS-, Idempotenz- und Audit-Append-Dateien bleiben historische Security-/Rolloutnachweise.
- Preflight und Postcheck bleiben Diagnosewerkzeuge; Rollbacks bleiben Notfallartefakte.
- `b15-18i-notification-audit-insert-hardening-proposal.sql` ist durch B15.18K fachlich ersetzt (**E**), bleibt wegen Audit- und Bedrohungsmodellrelevanz erhalten und darf nicht als aktueller Rolloutpfad verwendet werden.
- Contribution-Reminder-Cron-Dateien bleiben erhalten. Offen ist die operative Go-live-Aktivierung, nicht eine automatische erneute SQL-Ausführung.

## B15.19

Alle Proposal-/Postcheck-/Rollback-Familien von A bis I bleiben als nachvollziehbare Schema-, RLS-, Grant-, RPC- und Rollbackhistorie erhalten. Commit-Historie und Anwendungscode belegen die Implementierung; ob jede einzelne Proposal-Datei gegen die betrachtete Datenbank ausgeführt wurde, muss bei Bedarf mit ihrem Postcheck manuell bestätigt werden.

## Noch offen oder manuell zu verifizieren

- Department-Zuordnungen erst nach manueller fachlicher Bestätigung; das B15.21B0-Template enthält bewusst keine geratenen Zuordnungen.

- B12-Dateien mit `noch-nicht-ausführen-` beziehungsweise `nach-Prüfung-ausführbar-`.
- B13-Legacy-Removal und saisonale Cleanup-Dateien vor dem späteren Datenbank-/Saison-Cleanup.
- unversionierte Dateien wie `club-history-add-english-fields.sql` und `membership-requests-add-processing-fields.sql`, sofern kein Live-Postcheck ihren Status belegt.
- ältere Admin-Auth-/RLS-Dateien vor jeder Wiederverwendung.

## Aufbewahrungsregel

In B15.20 wird keine SQL-Datei gelöscht, verschoben oder ausgeführt. Vor einer späteren Ausführung sind Dateikopf, Abhängigkeiten, aktuelles Schema, Grants/RLS und passender Preflight zu prüfen. Proposal, Postcheck und Rollback einer Familie bleiben zusammen.
