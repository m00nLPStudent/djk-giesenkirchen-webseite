# B15.18F – Notification Monitoring

## Architektur

Das neue, ausschließlich für Superadmins erreichbare Modul liegt unter `/admin/system/notifications`. Es verändert keine Notification und erzeugt keine neue Notification. Erfolgreiche Zustellungen werden read-only aus der vorhandenen `notifications`-Tabelle geladen. Neue Fehlversuche, Duplikate und Skips werden von der zentralen Notification-Service-Schicht in einen auf 500 Einträge begrenzten Prozesspuffer geschrieben.

Ohne zusätzliche Datenbanktabelle ist dieser Laufzeitpuffer bewusst nicht dauerhaft, nicht instanzübergreifend und nach Neustarts leer. Das Dashboard kennzeichnet diese Grenze und erfindet keine historischen Fehler- oder Resolverdaten.

## Logger

`notificationMonitoring.logger.js` ist der einzige neue Monitoring-Logger. `createNotification()`, `createNotifications()` und `createNotificationsOnce()` melden strukturierte Ergebnisse. Erfasst werden Typ, Status, Actor-/Empfänger-ID, Empfängerzahlen, Erfolg, Fehler, Duplikate, Skips, Dauer, Route, Resolver und technische Fehlerklasse. Nachrichten, Namen, E-Mails, Notizen, Zahlungsdaten und Tokens werden nicht übernommen.

Der Logger schreibt weder `console.log` noch Datenbankzeilen. Bestehende fachliche Best-effort-Fehlerbehandlung bleibt unverändert.

## Audit

Persistierte Auditzeilen entstehen als reine DTO-Abbildung vorhandener Notifications. Laufzeitaudits zeigen Zustellversuche. Desktop verwendet `AdminModuleList`, Mobile `AdminModuleCards`. Suche umfasst Typ, Actor, Empfänger, Route und Fehlerklasse. Filter unterstützen Status sowie Heute, 7 Tage, 30 Tage und Alle.

Ein Audit enthält – soweit technisch vorhanden – Zeitpunkt, Eventtyp, Actor, Empfänger, Empfängeranzahl, Erfolg, Fehler, Duplikate, Dauer, Route und Fehlerklasse.

## Health

Die Health-Zusammenfassung zeigt erfolgreiche persistierte Notifications, Laufzeitfehler, Duplikate, Skips, Actor-Skips sowie letzte erfolgreiche und fehlgeschlagene Zustellung. Fehlende Adminprofile, fehlende Berechtigung und unbekannte Empfänger sind rückwirkend nicht aus dem bestehenden Schema ableitbar und werden deshalb als „nicht erfassbar“ ausgewiesen.

Top-Fehler gruppieren vorhandene technische Fehlerklassen. Die aktivsten 20 Typen zeigen Anzahl, letzte Zustellung und die aus vorhandenen Daten berechenbare Fehlerquote.

## Empfängeranalyse

Der zentrale Service kann Resolver-Eingang, Actorfilter, Deduplizierung und tatsächlich gespeicherte Notifications überwachen. Die vorgelagerten Stufen „gefundene Trainer“, „aktive Trainer“, „Adminprofile“ und „AuthUser“ sind im bisherigen Notification-Schema nicht gespeichert. Sie werden sichtbar als nicht erfassbar markiert, statt aus Namen oder aktuellen Zuordnungen rekonstruiert zu werden.

## Retryvorbereitung

Retry-Schaltflächen sind vorhanden, aber deaktiviert. Es existiert keine Action und kein Handler zur erneuten Zustellung. Aktivierung ist ausschließlich für B15.18G vorgesehen.

## Sicherheit

Route und Navigation prüfen die bestehende Rolle `superadmin`. `system.monitor` wird nicht angelegt. Der Loader verwendet den bestehenden Admin-Client ausschließlich lesend, nachdem der Seitenzugriff serverseitig geprüft wurde. Es gibt keine SQL-, Schema-, RLS-, Rollen- oder Permissionänderung.

## Offene Punkte für B15.18G

Für dauerhaftes, instanzübergreifendes Audit wäre ein separat freizugebendes Datenmodell erforderlich. Erst danach können zuverlässige Resolverstufen, langfristige Fehlerquoten und kontrollierte Retry-Zustände gespeichert werden. Ein Retry muss unveränderliche ursprüngliche Payloads, aktuelle Berechtigungen, Idempotenz und eine explizite Superadmin-Aktion berücksichtigen; F führt nichts davon aus.
