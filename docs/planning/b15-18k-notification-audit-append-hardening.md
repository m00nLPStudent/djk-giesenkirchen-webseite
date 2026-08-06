# B15.18K – Notification-Audit-Insert-Härtung

## Bestandsanalyse

Die Analyse basiert auf dem versionierten Stand B15.18G bis B15.18J1. Es wurde keine SQL-Datei ausgeführt.

- `notification_audit` besitzt die Felder `id`, `created_at`, Typ, Status, Actor-/Empfänger-ID, fünf Zustellzähler, Laufzeit, Zielroute, Resolver, Fehlerklasse, Idempotenzschlüssel, Metadaten und die deaktivierten Retryfelder.
- Der Status-Check erlaubt `success`, `warning`, `failed`, `duplicate`, `skipped` und `actor_removed`. Produktiv erzeugt der Anwendungscode alle außer `actor_removed`; entfernte Actors werden als Metadatenzähler geführt.
- B15.18G gewährt `authenticated` `INSERT` und `SELECT`. Die Policy `notification_audit_insert_active_admin` erlaubt jedem aktiven Adminprofil einen Insert. `notification_audit_select_superadmin` begrenzt die Anzeige auf aktive Superadmins. Es gibt keine UPDATE- oder DELETE-Policy.
- Der zentrale Logger enthielt den einzigen direkten Schreibzugriff auf die Tabelle. Aufrufer sind `notifications.service.js` (Einzel-, Batch-, Preference-Skip-, Idempotenz-, Duplicate- und Fehleraudit) und `contributionReminderDispatcher.service.js` (Scheduler-Laufzeile). Weitere `.insert()`/`.upsert()`-Schreibzugriffe auf `notification_audit` existieren nicht.
- Das Monitoring lädt ausschließlich über `load_notification_audit_monitoring`, eine `SECURITY INVOKER`-Funktion. Es bleibt read-only und unterliegt der Superadmin-SELECT-Policy.
- Logger, Notification-Service und Dispatcher tragen `server-only`. Kein Clientmodul importiert sie. Browseraktionen für das Notification Center importieren nur lesende bzw. persönliche Mutationen aus dem zentralen Service.
- Produktiv ausgewertet werden die fünf Zustellzähler, Laufzeit, Route, Resolver, Fehlerklasse sowie `recipientAnalysis` (`resolverInput`, `foundTrainers`, `activeTrainers`, `adminProfiles`, `validAuthUsers`, `afterActorFilter`, `afterDedupe`, `storedNotifications`, `actorRemoved`) und `preferenceAnalysis` (`inputCount`, `skippedCount`, `outputCount`, `mandatoryType`). Der Scheduler benötigt zusätzlich `dispatcherAnalysis` mit Run-ID, Geschäftstag, Zeitzone, Scan-/Eligible-Zähler sowie `excludedCounts` und `stageCounts`.
- Produktive feste Fehlerklassen sind `notification_insert_failed`, `notification_preference_lookup_failed`, `idempotency_lookup_failed` und `idempotency_duplicate`. Der Dispatcher erzeugt außerdem `admin_client_unavailable`, `finance_recipient_resolution_failed`, `contribution_batch_load_failed`, `trainer_recipient_resolution_failed` oder als Fallback `dispatcher_failed`.

Das B15.18I-Proposal ist nicht mehr kompatibel: Es gewährt den RPC weiterhin `authenticated` und verhindert damit keine gefälschten, wenn auch formal sanitisierten Auditzeilen. Es setzt den Actor auf `auth.uid()`, wodurch der Service-Role-Scheduler keinen Actor-Kontext besitzt und nicht appendieren könnte. Außerdem verwirft es die inzwischen benötigten `dispatcherAnalysis`-Laufdaten.

## Bedrohungsmodell und technische Grenzen

Ein aktiver Admin konnte zuvor über REST gefälschte Success-, Failed- oder andere zulässige Statuszeilen einfügen, Zähler verändern, eine fremde Actor- oder Empfänger-ID setzen, Routen und Fehlerklassen erfinden, beliebige oder sensible Metadaten samt großer Payloads speichern und dadurch Monitoring, Top-Fehler, Resolverstatistiken und eine spätere Retryauswahl verfälschen.

B15.18K entzieht `authenticated` den Tabellen-Insert und auch UPDATE, DELETE und TRUNCATE. Der Append-RPC ist ausschließlich für `service_role` ausführbar und prüft diese Rolle zusätzlich im Funktionskörper. Damit kann ein normales Browser-JWT weder direkt noch über RPC Auditzeilen erzeugen. Die Funktion begrenzt Zahlen und Textlängen, normalisiert Status, Resolver, Route und Fehlerklasse, validiert Actor und Empfänger gegen aktive Adminprofile, verwirft unbekannte Metadatenschlüssel und setzt Retryfelder unveränderlich auf `0`, `NULL`, `false`.

Ein an `authenticated` gewährter RPC könnte nicht zwischen einem legitimen serverseitigen Aufruf mit Benutzer-JWT und einem direkten REST-Aufruf desselben Benutzers unterscheiden. Deshalb ist die bevorzugte Ableitung des Actors aus `auth.uid()` mit dem stärkeren Ziel „kein direkter Client-Append“ nicht vereinbar. Der Service-Role-only Weg übernimmt die Actor-ID aus dem bereits serverseitig erzeugten Notification-Kontext und validiert sie in der Datenbank. Scheduler-Laufzeilen besitzen erwartungsgemäß keinen Actor.

Die Service Role bleibt eine privilegierte Vertrauensgrenze und könnte technisch weiterhin Tabellen-RLS umgehen. Ihr Schlüssel ist ausschließlich im `server-only` Admin-Client verfügbar und darf nicht an Browsercode oder Drittclients gelangen.

## Rollout

1. Read-only Preflight ausführen und Resultate prüfen.
2. Anwendung mit RPC-basiertem Logger und B15.18K-SQL koordiniert deployen; keine Zwischenphase mit entzogenem Insert und altem Logger zulassen.
3. Read-only Postcheck ausführen. Erwartet werden `false` für alle `authenticated`-Schreib-/Append-Rechte, `true` nur für den Service-Role-Append und null INSERT-/UPDATE-/DELETE-Policies.
4. Einen echten Notification-Pfad und einen Scheduler-Lauf prüfen. Monitoring muss weiterhin ausschließlich für Superadmins lesbar sein.

Rollback stellt bewusst die schwächere B15.18G-Insert-Policy wieder her und ist daher nur für einen kontrollierten Notfall vorgesehen.
