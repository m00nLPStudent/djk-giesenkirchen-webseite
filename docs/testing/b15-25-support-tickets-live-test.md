# B15.25 Support-Tickets V1 – manueller Live-Testplan

Zielumgebung: `djkvfl-test.de`

## Aktueller Live-Teststatus

**BESTANDEN – B15.25 wurde nach Deployment des Hotfixes und manuellem Node-Neustart auf `djkvfl-test.de` erfolgreich live geprüft.**

- `/admin/support`, `/admin/support/new` und autorisierte `/admin/support/[id]`-Aufrufe funktionieren mit Superadmin beziehungsweise berechtigtem Trainer vertragsgemäß.
- Der frühere Fehler mit Digest `932740903` ist durch Commit `2992018c9c9515595cc8248130fe5a7b31805e56` behoben und live nachgetestet.
- Root Cause: Die Support-Liste und -Detailseite riefen den Auth-Guard ohne das von dessen Runtime-Vertrag erwartete Optionsobjekt auf; dadurch scheiterte die Destrukturierung von `requiredPermission`.
- Separat im Runtime-Log vorhanden und nicht Bestandteil dieses Hotfixes: `getActorContext is not defined` (Digest `1973645967`) sowie ältere Meldungen `Failed to find Server Action ...`.
- Die gewünschte spätere Einordnung von „Support“ als eigener Hauptnavigationsbereich ist ein separater UI-Folgepunkt und nicht Bestandteil dieses Abschlusses.
- Ticket-Erstellung, Antworten in beide Richtungen, Priorität, Status, Abschluss, Wiederöffnung, Listen/Zähler sowie Actor-Ausschluss wurden live bestätigt.
- `ticket_created`, `ticket_reply_created` und `ticket_status_changed` wurden kontrolliert über die bestehende Dashboard-Konfiguration aktiviert. Dashboard- und E-Mail-Zustellung sowie der geschützte Ticket-CTA wurden erfolgreich geprüft.
- Die Testtickets `ST-00000001` und `ST-00000002` bleiben als Live-Testnachweis erhalten.
- Ein zusätzlicher Fremdzugriffstest mit einem dritten Nicht-Superadmin wurde mangels bewusst nicht angelegtem Testaccount nicht durchgeführt. Der serverseitige Ownership-Vertrag und die automatisierten Regressionen bleiben maßgeblich; dies blockiert die Freigabe nicht.

Dieser Plan wird erst nach Deployment und dem vertraglich erforderlichen manuellen Node.js-Neustart abgearbeitet. Es werden ausschließlich eigens angelegte Testtickets verwendet. Personenbezogene Daten, Secrets und produktive Inhalte gehören nicht in Testtickets oder Nachweise.

## Voraussetzungen und Testrollen

- [ ] Aktiver berechtigter Nicht-Superadmin steht als Testrolle bereit.
- [ ] Superadmin mit `support_tickets.manage` steht als Testrolle bereit.
- [ ] Optional: aktiver Benutzer ohne Supportberechtigung steht sicher als Negativtestrolle bereit.
- [x] Die drei Ticket-Mailtypen waren vor Phase A deaktiviert.
- [ ] Testticket-Betreff und -Nachrichten enthalten ausschließlich neutrale Testdaten.

## A. Normaler berechtigter Benutzer

- [ ] Login erfolgreich.
- [ ] Navigationseintrag „Support“ sichtbar.
- [ ] Eigene Ticketliste erreichbar.
- [ ] „Neues Ticket“ sichtbar.
- [ ] Formular enthält ausschließlich Kategorie, Bereich, Betreff und Nachricht.
- [ ] Keine Prioritätsauswahl vorhanden.
- [ ] Keine Statusauswahl vorhanden.
- [ ] Keine Zuweisungsauswahl vorhanden.
- [ ] Bereichsauswahl entspricht den serverseitig erlaubten Organisations-, Abteilungs- und Mannschaftsbereichen.
- [ ] Ticket erfolgreich erstellen.
- [ ] Redirect auf das neue Ticketdetail erfolgt.
- [ ] Ticketnummer ist vorhanden.
- [ ] Erste Nachricht wird korrekt als Klartext dargestellt.
- [ ] Ticket erscheint in der eigenen Liste.
- [ ] Dashboard-Notification bei der Support-Verwaltung prüfen.
- [ ] Auf das eigene, nicht abgeschlossene Ticket antworten.
- [ ] Antwort erscheint im Verlauf.
- [ ] Dashboard-Notification bei der Support-Verwaltung prüfen.

## B. Superadmin

- [ ] Login erfolgreich.
- [ ] Navigationseintrag „Support“ sichtbar.
- [ ] Globale Ticketliste erreichbar.
- [ ] Das Testticket des normalen Benutzers ist sichtbar.
- [ ] Kein „Neues Ticket“-Button vorhanden.
- [ ] Direkter Aufruf von `/admin/support/new` wird serverseitig blockiert.
- [ ] Testticket lässt sich öffnen.
- [ ] Antwort lässt sich schreiben.
- [ ] Antwort ist beim Ersteller sichtbar.
- [ ] Ersteller erhält eine Dashboard-Notification.
- [ ] Status auf „In Bearbeitung“ ändern.
- [ ] Ersteller erhält die Statusnotification.
- [ ] Nur Priorität ändern.
- [ ] Wegen der reinen Prioritätsänderung entsteht keine Statusnotification.
- [ ] Nur Zuweisung ändern.
- [ ] Wegen der reinen Zuweisungsänderung entsteht keine Statusnotification.
- [ ] Status auf „Wartet auf Rückmeldung“ ändern.
- [ ] Ersteller erhält die Statusnotification.
- [ ] Status auf „Abgeschlossen“ ändern.
- [ ] Ersteller erhält die Statusnotification.
- [ ] Eine Antwort auf das abgeschlossene Ticket ist nicht möglich.
- [ ] Ticket über die Verwaltungsfunktion wieder öffnen.
- [ ] Ersteller erhält eine Notification für den Status „Offen“.
- [ ] Eine Antwort ist nach der Wiederöffnung wieder möglich.

## C. IDOR- und Berechtigungsprüfung

Nur nicht destruktive Prüfungen mit den vorgesehenen Testtickets durchführen.

- [ ] Normaler Benutzer kann die UUID eines fremden Tickets nicht öffnen.
- [ ] Über eine fremde Ticket-UUID werden keine fremden Nachrichten sichtbar.
- [ ] Über eine fremde Ticket-UUID werden keine fremden Events sichtbar.
- [ ] Eine manipulierte Detail-URL liefert eine generische, nicht informationspreisgebende Antwort.
- [ ] Normaler Benutzer sieht keine administrativen Controls.
- [ ] Direkter Aufruf einer administrativen Mutation durch einen normalen Benutzer wird abgewiesen.
- [ ] Manipulierte Status-, Prioritäts-, Assignment- oder Area-Werte werden serverseitig abgewiesen.
- [ ] Superadmin kann die Create-Funktion nicht über die UI auslösen.
- [ ] Optionaler Benutzer ohne Supportberechtigung erhält weder Navigation noch unzulässigen Direktzugriff.

## D. Desktop- und Mobile-Prüfung

### Desktop

- [ ] Ticketliste ist vollständig und ohne Überlagerungen nutzbar.
- [ ] Ticketdetail und Nachrichtenverlauf sind lesbar.
- [ ] Create-Formular ist vollständig beschriftet und per Tastatur bedienbar.
- [ ] Verwaltungsfelder und Buttons sind eindeutig und bedienbar.

### Mobile

- [ ] Support-Navigation ist erreichbar.
- [ ] Kartenliste ist lesbar und bedienbar.
- [ ] Create-Formular passt in den Viewport.
- [ ] Ticketdetail ist lesbar.
- [ ] Reply-Feld und Submit-Button sind erreichbar.
- [ ] Verwaltungscontrols sind erreichbar und verständlich.
- [ ] Es entsteht keine horizontale Seitenüberbreite.
- [ ] Status ist zusätzlich zur Farbe immer textlich erkennbar.

## E. E-Mail-Phase A – Ausgangszustand mit deaktivierten Ticket-Mailtypen

Keine Mail-Einstellung verändern.

- [ ] Dashboard-Notification für `ticket_created` funktioniert.
- [ ] Dashboard-Notification für `ticket_reply_created` funktioniert.
- [ ] Dashboard-Notification für `ticket_status_changed` funktioniert.
- [ ] Für die drei deaktivierten Tickettypen wird keine Ticket-E-Mail versendet.
- [ ] Es erfolgt kein unerwarteter Provideraufruf für die deaktivierten Typen.

## F. E-Mail-Phase B – kontrolliert freigegeben und durchgeführt

Die Aktivierung erfolgte kontrolliert über die vorhandene Superadmin-Dashboardkonfiguration, nicht per SQL oder direkte Datenmanipulation.

- [ ] `ticket_created`-E-Mail wird einmalig versendet.
- [ ] `ticket_reply_created`-E-Mail wird einmalig versendet.
- [ ] `ticket_status_changed`-E-Mail wird einmalig versendet.
- [ ] Vereinsabsender ist korrekt.
- [ ] Betreff ist deutsch und typgerecht.
- [ ] HTML-Darstellung ist korrekt.
- [ ] Text-Fallback ist korrekt.
- [ ] CTA führt auf die geschützte interne Ticketroute.
- [ ] CTA-Ziel bleibt serverseitig autorisiert; Kenntnis der URL gewährt keinen Zugriff.
- [ ] E-Mail enthält keine Ticket-Nachrichteninhalte.
- [ ] E-Mail zeigt keine interne Ticket-UUID.
- [ ] Mobile Maildarstellung ist plausibel.
- [ ] Resend-Delivery und genau ein Versandversuch werden kontrolliert geprüft.

## Release-Gate und Freigabe

B15.25 wurde nach erfolgreichem Live-Test freigegeben. Die automatisierten Checks besitzen ausschließlich die dokumentierten unabhängigen Baselines; der zusätzliche dritte Fremdnutzer-Test war optional und wurde nicht durchgeführt.

- [ ] Automatisierte Checks sind grün, ausgenommen bestätigte unabhängige Baselines.
- [ ] Test des normalen berechtigten Benutzers bestanden.
- [ ] Superadmin-Test bestanden.
- [ ] IDOR-/Berechtigungstest bestanden.
- [ ] Desktop-Test bestanden.
- [ ] Mobile-Test bestanden.
- [ ] Dashboard-Notifications bestanden.
- [ ] Verhalten bei deaktivierten Ticket-Mailtypen bestätigt.
- [ ] Kontrollierter Mailtest der später aktivierten Typen bestanden.
- [ ] Keine kritischen Fehler sind offen.

## Ergebnisprotokoll

- Testdatum: 29. September 2026
- Getesteter Hotfix-Commit: `2992018c9c9515595cc8248130fe5a7b31805e56`
- Umgebung: `djkvfl-test.de`
- Rollen: Superadmin und berechtigter Trainer
- Mail-Phase A Ergebnis: deaktivierter Ausgangszustand bestätigt
- Mail-Phase B Ergebnis: alle drei Tickettypen aktiviert und erfolgreich zugestellt
- Offene Abweichungen: kein zusätzlicher dritter Fremdnutzer-Testaccount; kein Abschlussblocker
- Freigabeentscheidung: **B15.25 COMPLETE – LIVE VALIDATION PASSED**
