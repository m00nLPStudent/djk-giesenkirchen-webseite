# Support-/Ticketsystem B15.25

## Status

**Abgeschlossen.** Tabellen-, RLS-, ACL- und RPC-Unterbau sowie Core, Repository, Service, Server Actions, responsive Dashboard-Oberfläche und zentrale Notification-/Mail-Anbindung sind produktiv verifiziert. Der Rollen-Livetest mit Superadmin und berechtigtem Trainer, alle zentralen Ticketabläufe sowie Dashboard- und Mailzustellung wurden auf `djkvfl-test.de` erfolgreich geprüft. Release 1.0.13 ist freigegeben.

## Dashboard-Oberfläche

- `/admin/support` zeigt normalen Berechtigten ausschließlich das autorisierte Own-Read-Model und Superadmins die globale Verwaltungsansicht. Desktop nutzt die bestehende Tabellengeometrie, kleine Ansichten nutzen Karten ohne horizontale Tabellenüberbreite.
- `/admin/support/new` bietet ausschließlich Nicht-Superadmins mit Create-Permission Kategorie, einen serverseitig erlaubten Bereich, Betreff und Nachricht an. Priorität, Status, Assignment und Actor sind kein Browserinput.
- `/admin/support/[id]` lädt das Parent-Ticket vor Nachrichten und technischen Events autorisiert. Nachrichten werden als reiner Text ausgegeben; fremde Identitäten werden nicht clientseitig hergeleitet.
- Auf abgeschlossene Tickets kann nicht geantwortet werden. Superadmins müssen sie ausdrücklich wieder öffnen und verwalten Status, Priorität sowie eine optionale Zuweisung nur über die vorhandenen atomaren Actions.

## Serverseitiger Vertrag

- Aktive Nicht-Superadmins benötigen `support_tickets.view_own`, `support_tickets.create` beziehungsweise `support_tickets.reply_own` und sehen ausschließlich Tickets mit ihrer serverseitig ermittelten `admin_profiles.id` als Ersteller.
- Superadmins verwalten alle Tickets über `support_tickets.manage`, dürfen jedoch serverseitig kein eigenes Support-Ticket erstellen.
- Ticketbereiche werden aus dem bestehenden Scope-Kontext abgeleitet: allgemeiner Organisationsbereich, verwaltete Abteilung und tatsächlich zugewiesene Mannschaften. Vom Browser übergebene Bereichsschlüssel werden nur gegen diese serverseitig erzeugte Allowlist geprüft.
- Detaildaten, Nachrichten und Audit-Events werden erst nach autorisiertem Zugriff auf das Parent-Ticket geladen. Fremde UUIDs liefern dieselbe generische Nicht-gefunden-/Kein-Zugriff-Semantik.
- Abgeschlossene Tickets sind nicht beantwortbar. Ein Superadmin muss sie zuerst über die administrative Mutation wieder öffnen.

## Schreib- und Auditpfad

Business-Writes erfolgen ausschließlich über die drei produktiv verifizierten, nur für die Service Role ausführbaren RPCs:

- `create_support_ticket_atomic(uuid,text,text,text,text,uuid,uuid)`
- `append_support_ticket_reply_atomic(uuid,uuid,text)`
- `mutate_support_ticket_admin_atomic(uuid,uuid,text,text,uuid,boolean)`

Die Anwendung führt keine direkten Inserts oder Updates auf `support_tickets`, `support_ticket_messages` oder `support_ticket_events` aus. Ticket, Nachricht und Audit bleiben dadurch atomar. Der Actor stammt ausschließlich aus der authentifizierten Session; Priorität, Ownership und Assignment können nicht durch Create-/Reply-Browserinput gesetzt werden.

## Notifications und E-Mail

- `ticket_created` benachrichtigt aktive Superadmins mit `support_tickets.manage`; der Ersteller erhält keine redundante Selbstbenachrichtigung.
- `ticket_reply_created` benachrichtigt bei einer Benutzerantwort die Support-Verwaltung und bei einer Support-Antwort den Ticket-Ersteller. Der Actor wird ausgeschlossen.
- `ticket_status_changed` wird ausschließlich bei einer echten Statusänderung an den Ticket-Ersteller ausgeliefert. Reine Prioritäts- oder Zuweisungsänderungen bleiben RPC-Audit-Events.
- Erst nach erfolgreichem Business-RPC wird die zentrale idempotente Notification-Pipeline aufgerufen. Notification- oder Mailfehler ändern den Business-Erfolg nicht und wiederholen niemals den Ticket-RPC.
- Payload und Mail enthalten Ticketnummer, Betreff und gegebenenfalls den deutschen Status, aber keinen vollständigen Nachrichtentext. Die stabilen Dedupe-Quellen sind Ticket-ID, Reply-Message-ID und Status-Audit-Event-ID.
- Die drei Renderer verwenden das zentrale Vereinslayout. Globale und typebezogene Steuerung sowie Delivery-Ledger bleiben maßgeblich. `ticket_created`, `ticket_reply_created` und `ticket_status_changed` wurden kontrolliert über die bestehende Dashboard-Konfiguration aktiviert und live erfolgreich zugestellt; der Ticket-CTA führte zum autorisierten Ticket.

## Abschluss und nicht blockierende Follow-ups

- Der frühere Runtimefehler mit Digest `932740903` ist durch den expliziten Auth-Guard-Kontextvertrag behoben und nach Deployment sowie Node-Neustart live bestätigt.
- Die Testtickets `ST-00000001` und `ST-00000002` bleiben erhalten. Ein zusätzlicher Test mit einem dritten fremden Nicht-Superadmin wurde bewusst nicht durch Anlegen eines weiteren Accounts erzwungen und blockiert den Abschluss nicht.
- UX-Follow-up: „Support“ später als eigenen Hauptreiter statt unter „Übersicht“ prüfen.
- Getrennte technische Follow-ups bleiben `getActorContext is not defined` (Digest `1973645967`) und ältere Meldungen `Failed to find Server Action ...`; sie sind nicht B15.25 zugeordnet.
