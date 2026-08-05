# B15.18I – Notification-System-Härtung

## 1–3. Ziel, Bestand und Ende-zu-Ende-Kette
B15.18I ergänzt keine Fachfunktion. Geprüft wurde die Kette Fachmutation → Resolver → Actorfilter → Auth-User-Deduplizierung → Preference-Batchfilter → Fünf-Minuten-Idempotenzlookup → Notification-Insert → persistentes Audit → Glocke/Center → Read/Delete. Inventar, Gruppen und verpflichtende Typen entsprechen der B15.18H-Matrix.

## 4–5. Rollen, Mehrkonten und Mehrfachrollen
Synthetische Fixtures bilden vier Teamempfänger, Außenstehende, Actor, mehrere Rollen je Auth-User und unterschiedliche Preferences ab. Empfänger werden ausschließlich über ihre Auth-UUID dedupliziert; zusätzliche Rollen erzeugen keine zweite Meldung. Live-Rollentests bleiben der manuellen Matrix vorbehalten.

## 6–7. Parallelität und Idempotenz
Unterschiedliche Idempotenzschlüssel vermischen weder Ereignisse noch Empfänger. Der bestehende Ablauf `SELECT` und anschließendes `INSERT` ist jedoch nicht atomar: Zwei zeitgleiche Requests können beide vor dem ersten Insert keinen Treffer sehen. Deshalb wird keine Nebenläufigkeitsgarantie behauptet. Das separate Unique-Index-Proposal schließt die Race-Condition, benötigt aber einen koordinierten Repository-Deploy zur Behandlung von `unique_violation` als Duplikat.

## 8. Preference-Last und Konsistenz
Preferences werden einmal pro Batch geladen. Fehlende und unbekannte Typen sind aktiviert, Pflichttypen ignorieren gespeichertes `false`. Die beim Lookup gelesene Einstellung gilt für den laufenden Zustellversuch; parallele Änderungen wirken erst auf folgende Zustellungen. Unique `(user_id, notification_type)` verhindert doppelte Zeilen. Gleichzeitige Sammelaktionen haben Last-write-wins-Semantik.

## 9. Audit-Konsistenz
Getestete Gleichungen: `preferenceInput = preferenceSkipped + preferenceOutput` und nach erfolgreicher Preference-Phase `preferenceOutput = successful + failed`. Duplikate werden vor dem Preference-Filter ermittelt und deshalb nicht künstlich in `preferenceOutput` gezählt.

## 10–12. Monitoring, Pagination und Center
In-memory Mapping wurde mit 100, 1.000 und 10.000 synthetischen Auditzeilen gemessen. Der RPC begrenzt auf maximal 5.000, der Loader standardmäßig auf 1.000. Das verhindert unbegrenzte Clientdaten, ist aber noch keine echte seitengenaue Auditnavigation. Das Center lädt höchstens 250 Einträge, die Glocke 8 und der Badge bleibt eine Count-Query. Echte Pagination ist PARTIAL und sollte erst nach gemessener Live-SQL-Last separat umgesetzt werden.

## 13. Glocke und mehrere Tabs
Es gibt kein Intervallpolling, Realtime oder BroadcastChannel. Die Glocke lädt beim Öffnen. Eine garantierte Fokus-Synchronisierung zwischen bereits offenen Tabs existiert nicht; Browserabnahme ist erforderlich. Keine neue Cross-Tab-Architektur wurde eingeführt.

## 14. RLS-Abnahme
Statisch bestätigt: Notifications und Preferences sind Own-Row; Audit-Read und Monitoring-RPC sind Superadmin-begrenzt; Audit Update/Delete fehlen. Reale Mehrkonten-RLS-Tests benötigen Live-Sessions und sind in der Matrix BLOCKED.

## 15. Audit-Insert-Sicherheit
Es existiert keine Client-Action und kein Clientimport des Loggers. Der Logger baut eine feste Allowlist. Dennoch erlaubt die bestehende INSERT-Policy aktiven Admins direkten REST-Insert. Das separate RPC-Proposal entzieht Tabellen-INSERT, erzwingt Actor, Status, Zählergrenzen, sichere Route und Metadaten-Allowlist. Es wird nicht ausgeführt und muss koordiniert mit einer Logger-RPC-Umstellung deployt werden.

## 16–18. Fehler, Datenschutz und Retry
Preferencefehler sind fail-open. Auditfehler lösen keinen rekursiven Auditversuch aus und beschädigen die Fachmutation nicht. Loader zeigen sichere Fehlerzustände. Audit-Allowlist enthält keine Texte, Namen, E-Mails, Zahlungen, Tokens oder Stacktraces. Retry bleibt vollständig deaktiviert.

## 19–20. Tests und Messwerte
Service-nahe Fixtures prüfen Mehrkonten, Mehrfachrollen, Actorfilter, Deduplizierung, Preferences, Pflicht-/unbekannte Typen, Konsistenz und Grenzwerte. Gemessen wird ausschließlich lokales JS-Mapping auf Windows/Node; keine SQL-/Netzwerkwerte werden erfunden. Live-RPC-Dauer bleibt BLOCKED bis eine freigegebene Datenbank-Testumgebung verfügbar ist.

## 21. Manuelle Abnahmematrix
Die CSV enthält Rollen-, Routen-, Mehrtab-, Doppelsubmit-, Persistenz- und Monitoringfälle. Automatisierte statische/Core-Fälle sind PASSED; echte Browser-/RLS-/SQL-Fälle sind klar als BLOCKED markiert.

## 22. Offene Risiken
Idempotenzrace und direkter Audit-Insert bleiben bis koordiniertem SQL-/App-Deploy offen. Audit und Center besitzen Limits, aber keine vollständige Pagination. Fokuswechsel aktualisiert offene Tabs nicht garantiert. SQL-Proposals wurden nicht ausgeführt.

## 23. Empfehlung für B15.18J
Eine freigegebene Staging-Umgebung mit synthetischen Konten verwenden, beide Proposals einzeln preflighten, Repository/Logger atomar mit SQL deployen und danach Mehrkonten-RLS, echte RPC-Laufzeiten sowie Cross-Tab-Verhalten messen.
