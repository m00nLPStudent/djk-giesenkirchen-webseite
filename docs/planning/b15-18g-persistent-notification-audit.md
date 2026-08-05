# B15.18G – Persistentes Notification-Audit

## Architektur

Der bisherige prozesslokale Ringpuffer wird durch die append-only Tabelle `notification_audit` ersetzt. Der zentrale Notification-Service wartet nach jedem Zustellversuch auf den Audit-Insert. Ein fehlgeschlagener Audit-Insert verändert die fachliche Notification nicht, wird aber als Loggerfehler zurückgegeben. Das Monitoring liest ausschließlich den SQL-Snapshot `load_notification_audit_monitoring`.

## Datenmodell und Datenschutz

Gespeichert werden Typ, Status, technische Benutzer-IDs, aggregierte Zustellzähler, Dauer, Zielroute, Resolverquelle, Fehlerklasse, Idempotenzschlüssel, technische Metadaten und Retryvorbereitung. Nachrichtentexte, Namen, E-Mail-Adressen, Zahlungsdaten und Notizen werden nicht gespeichert. Empfänger-Zwischenstufen liegen ausschließlich als numerische Werte in `metadata.recipientAnalysis`.

## RLS

Die Policies verwenden das etablierte G3-Modell aus `admin_profiles`, `admin_user_roles` und `admin_roles`; weder `app_metadata` noch eine neue Permissionfunktion werden verwendet. Aktive, authentifizierte Admin-Akteure dürfen serverseitig append-only schreiben. Nur aktive Superadmins dürfen lesen. Update und Delete besitzen keine Policy. Der Monitoring-RPC ist `SECURITY INVOKER`, sodass dieselbe RLS gilt.

## Logger und Monitoring

Erfolg, Fehler, Duplikat, Skip, Actorfilter sowie Resolver- und Routingfehler werden als strukturierte Auditzeile geschrieben. Heute, 7, 30, 90 Tage und Alle sowie Health, Topfehler, aktive Typen und Empfängeranalyse werden im SQL-RPC aggregiert. Der flüchtige Laufzeitpuffer und das Lesen der persönlichen `notifications`-Tabelle entfallen.

## Retryvorbereitung

`retry_allowed`, `retry_count` und `last_retry_at` sind vorhanden. `retry_allowed` startet mit `false`; UI-Buttons bleiben deaktiviert. B15.18G implementiert keine erneute Zustellung.

## Aufbewahrung und Zukunft

Es gibt keine automatische Bereinigung; Auditdaten bleiben unbegrenzt erhalten. Eine spätere Stufe kann eine explizite Retention Policy, Retry-Worker und weitergehende Resolvermetriken ergänzen, ohne das Tabellenmodell zu ersetzen.

## Ausführung

SQL wird nicht automatisch ausgeführt. Reihenfolge: Schema, RLS, Read-only-Postcheck, danach Browser- und Regressionstest. Der Rollback entfernt ausschließlich Funktion und Tabelle aus B15.18G und löscht damit bewusst alle Auditdaten.
