# B15.23E5.2.3 – Compensation-State Preflight und DB-Design

## Entscheidung und Stoppgrenze

Die Klassifizierung bleibt **B – kleine kontrollierte Vorarbeit nötig**. Der neue [Read-only Preflight](../sql/b15-23e5-compensation-state-preflight-readonly.sql) ist vorbereitet, wurde aber nicht ausgeführt. Die bisherigen E3-/E5-Nachweise bestätigen nicht zweifelsfrei alle aktuell wirksamen Constraint-, Index-, Grant-, Policy-, View-, Function- und Triggerdefinitionen. Deshalb greift die Stoppregel: Noch kein Proposal, Rollback oder Postcheck.

## Bekannter Ausgangsvertrag

Aus dem ausgeführten E3-Postcheck und dem Repository-Proposal sind derzeit bekannt:

- Statusliste: `pending`, `confirming`, `completed`, `cancelled`, `expired`, `failed`.
- Status- und State-Constraints heißen `admin_email_change_requests_status_check` und `admin_email_change_requests_state_check`.
- Der partielle Unique-Index `admin_email_change_requests_one_active_user_idx` umfasst `pending|confirming`.
- Ein `set_updated_at`-Trigger existiert.
- RLS ist aktiv, FORCE RLS aus, keine Clientpolicies.
- `anon` und `authenticated` besitzen keine direkten oder effektiven Rechte; `service_role` besitzt den serverseitig erforderlichen Tabellenzugriff.
- `compensation_started_at` und `compensating` waren im ursprünglichen Vertrag nicht vorhanden.

Diese Angaben sind keine Freigabe für eine neue Migration. Der vorbereitete Preflight muss den heutigen Livezustand erneut liefern.

## Sanitisiertes Preflight-Inventar

Der Preflight gibt ausschließlich Schema-/Katalogdefinitionen und aggregierte Status-/Konsistenzzahlen aus. Er inventarisiert Relation, Owner, RLS/FORCE RLS, Spalten, Defaults, Compensation-Spalten, alle Constraints und Indizes, Trigger, Policies, direkte und effektive Grants, Statusverteilung, unbekannte Statuswerte sowie invalide Zustandszählungen. Views und normale Funktionen werden auf harte Relation-/Statusreferenzen geprüft; Funktionen werden vor `pg_get_functiondef` in einer `MATERIALIZED` CTE auf `prokind='f'` begrenzt. UUIDs, E-Mail-Adressen und Tokenwerte werden nicht selektiert.

## Repository-Statusverwendungen

Später anzupassende produktive Verträge:

- `src/lib/admin-auth/adminEmailChange.service.js`: `loadActiveRequest` muss `compensating` als aktiv berücksichtigen; `failRequest` muss den terminalen Übergang aus `compensating` unterstützen; ein atomarer `claimCompensation` mit Read-after-write-Verifikation kommt hinzu.
- `src/lib/admin-auth/adminEmailChange.core.mjs`: Ein vorhandener `compensating`-Request muss neue Anforderungen blockieren. Vor jedem Reverse muss der Claim erfolgreich sein; ohne verifizierten Claim kein Admin-API-Reverse.
- `src/lib/admin-auth/adminEmailChange.core.test.mjs`: Claim-, Parallelitäts-, Ambiguitäts-, Success-/Failure- und Reihenfolgetests ergänzen.
- `src/lib/admin-auth/adminEmailChangeE3.sql.test.mjs`: Zielstatusliste, State-Constraint und aktiven Unique-Index auf den neuen Vertrag umstellen.
- `src/lib/admin-auth/adminEmailChangeE5.sql.test.mjs`: Preflight-/Stopp-/spätere Guardverträge weiter absichern.
- `src/components/admin/users/adminEmailChangeE3.integration.test.mjs`: server-only Servicegrenze und expliziten Claim verifizieren.

Später anzupassende SQL-/Diagnoseverträge:

- E3-Ursprungsproposal und E3-Postcheck bleiben historische Nachweise und werden nicht rückwirkend umgeschrieben.
- Der neue Migration-/Rollback-/Postcheck-Block muss Statusconstraint, State-Constraint und partiellen Unique-Index kontrolliert ersetzen.
- Mutation-Diff und Cleanup-Diagnose sollten `compensating` als aktiven Zustand mitzählen beziehungsweise bei aktivem Cleanup-Blocker berücksichtigen.
- Planungsdokumente mit der alten Statusliste müssen den neuen Zielvertrag referenzieren, ohne historische Liveaussagen umzudeuten.

UI-Statuswerte auf der Confirmation-Seite sind HTTP-Ergebniszustände und keine direkte DB-Statusliste; dort ist keine neue Benutzeranzeige für den kurzlebigen internen Zustand erforderlich.

## Zielsemantik

Zielstatusliste: `pending`, `confirming`, `compensating`, `completed`, `cancelled`, `expired`, `failed`.

`compensation_started_at timestamptz NULL` soll als Auditzeitpunkt erhalten bleiben:

- `compensating`: Zeitwert, `confirmed_at` und `locked_at` gesetzt; kein terminaler `failure_code`.
- `failed` nach Compensation: Zeitwert und `failure_code` gesetzt; `locked_at` null.
- alle anderen Statuswerte: `compensation_started_at` null.

Das Beibehalten nach `failed` beweist datensparsam, dass ein Reverse versucht wurde. Vorgesehene nicht personenbezogene Codes sind `email_sync_failed_compensated`, `completion_state_failed_compensated` und `compensation_failed`.

Beim Claim bleibt ein vorhandenes `locked_at` aus `confirming` erhalten. Beim Ambiguitätsübergang aus `completed` ist es zuvor null und wird auf den Claim-Zeitpunkt gesetzt. Dadurch bleibt der ursprüngliche Lock-Auditwert erhalten, während `compensating` in beiden zulässigen Ausgangsvarianten eindeutig als aktiv gesperrt ist.

## Enger atomarer Claim

Der spätere Claim bindet Request-ID, `user_id`, normalisierte alte/neue Adresse, Ausgangsstatus, `confirmed_at` und erwartete Adressrichtung. Für `completed → compensating` reicht „kürzlich abgeschlossen“ nicht. Der Core besitzt bereits den Workflow-Zeitstempel, der beim Claim als `confirmed_at` und beim Completion-Schritt als `completed_at` verwendet wird. Deshalb verlangt der Completed-Zweig exakt:

```text
completed_at = EXPECTED_WORKFLOW_TIMESTAMP
confirmed_at = EXPECTED_WORKFLOW_TIMESTAMP
```

Der Confirming-Zweig verlangt `confirmed_at = EXPECTED_WORKFLOW_TIMESTAMP`, `completed_at IS NULL` und `confirmed_at <= expires_at`. Damit kann ein alter abgeschlossener Request nicht allein aufgrund eines Zeitfensters zurückgerollt werden. Die DB kennt den lokalen Fehler nicht; server-only Zugriff, konkrete Request-ID, exakter Workflow-Zeitstempel, UUID und beide Adressrichtungen binden den Claim an die aktuelle Ausführung.

Der Update-Claim liefert die Requestfelder zurück. Danach wird unabhängig erneut gelesen. Nur eindeutig verifiziertes `compensating` erlaubt Reverse. Bei fehlendem oder mehrdeutigem Claim erfolgt kein Reverse und manueller Review.

## Race und Locking

Der Claim ist ein einzelnes bedingtes UPDATE; parallele Claims können nicht beide dieselbe Ausgangszeile treffen. Der erweiterte Unique-Index auf `pending|confirming|compensating` verhindert einen neuen aktiven Request während Compensation. Claim und Verifikation committen vor dem Auth-HTTP-Aufruf. Kein Datenbanklock wird über HTTP gehalten und kein `CONCURRENTLY` innerhalb der Migration benötigt. Das Deadlockrisiko bleibt gering.

## Geplante Migration und Rollback

Nach erfolgreicher Liveauswertung soll ein transaktionales, fail-closed Proposal die exakten Ausgangsdefinitionen und Statusdaten prüfen, die nullable Spalte ergänzen, Status-/State-Constraint unter stabilen Namen ersetzen und den partiellen Unique-Index kontrolliert erweitern. Es fügt keine Policy, Grants, Funktion oder Trigger hinzu.

Der Rollback stoppt bei `compensating`-Zeilen sowie bei `failed`-Zeilen mit Compensation-Auditzeitpunkt, solange dieser Auditwert nicht ausdrücklich behandelt wurde. Danach stellt er Constraint und Index auf den nachgewiesenen Ausgangsvertrag zurück und entfernt die Spalte. Bestehende Daten werden nicht stillschweigend umgeschrieben.

## Nächster Produktcode- und Testvertrag

Vor Reverse gilt zwingend: `claimCompensation`, Read-after-write-Verifikation, erst dann Auth-Reverse und Auth-Verifikation, anschließend `failed` mit deterministischem Code. Tests müssen beide Ausgangsstatus, falsche ID/UUID/Adressrichtung, terminale Ausgangsstatus, Parallelclaim, Verify-Ambiguität, Reihenfolge, Success/Failure und Auditzeitpunkt abdecken.

## Nächster Schritt

## E5.2.4 – Liveauswertung

Der manuell ausgeführte Preflight ist **PASS**. Live bestätigt wurden Owner `postgres`, RLS aktiv, FORCE RLS aus, keine Policies, exakt 16 erwartete Spalten ohne Compensation-Feld, neun erwartete Constraints, fünf erwartete Indizes, der aktive Unique-Index auf `pending|confirming`, ein projektdefinierter `set_updated_at`-Trigger plus zwei interne FK-Trigger und ausschließlich serverseitige Rechte. `service_role` besitzt CRUD, aber keine REFERENCES-/TRIGGER-/TRUNCATE-Rechte; Clients besitzen keine direkten oder effektiven Rechte.

Die vier Bestandszeilen verteilen sich auf zwei `completed` und zwei `failed`. Es gibt weder unbekannte noch inkonsistente Zustände und kein `compensating`. Views, Funktionen, Policies und fachliche externe DB-Abhängigkeiten mit harter Statusliste wurden nicht gefunden.

Damit sind [Proposal](../sql/b15-23e5-compensation-state-proposal.sql), [Rollback](../sql/b15-23e5-compensation-state-rollback.sql) und [Postcheck](../sql/b15-23e5-compensation-state-postcheck-readonly.sql) nun fail-closed vorbereitet. Die Migration wurde **nicht ausgeführt**.

## Nächster Schritt

Das Proposal zunächst statisch prüfen und anschließend nur nach ausdrücklicher Freigabe manuell im Supabase SQL Editor ausführen. Direkt danach den Read-only Postcheck vollständig ausführen und auswerten. Erst bei bestandenem Postcheck folgt **B15.23E5.2.5 – Compensation Claim Implementation**. Produktcode und Auth-Guard bleiben bis dahin unverändert.
