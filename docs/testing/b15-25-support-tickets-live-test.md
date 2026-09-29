# B15.25 Support-Tickets V1 – manueller Live-Testplan

Zielumgebung: `djkvfl-test.de`

Dieser Plan wird erst nach Deployment und dem vertraglich erforderlichen manuellen Node.js-Neustart abgearbeitet. Es werden ausschließlich eigens angelegte Testtickets verwendet. Personenbezogene Daten, Secrets und produktive Inhalte gehören nicht in Testtickets oder Nachweise.

## Voraussetzungen und Testrollen

- [ ] Aktiver berechtigter Nicht-Superadmin steht als Testrolle bereit.
- [ ] Superadmin mit `support_tickets.manage` steht als Testrolle bereit.
- [ ] Optional: aktiver Benutzer ohne Supportberechtigung steht sicher als Negativtestrolle bereit.
- [ ] Die drei Ticket-Mailtypen sind vor Phase A weiterhin deaktiviert.
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

## E. E-Mail-Phase A – Ticket-Mailtypen deaktiviert

Keine Mail-Einstellung verändern.

- [ ] Dashboard-Notification für `ticket_created` funktioniert.
- [ ] Dashboard-Notification für `ticket_reply_created` funktioniert.
- [ ] Dashboard-Notification für `ticket_status_changed` funktioniert.
- [ ] Für die drei deaktivierten Tickettypen wird keine Ticket-E-Mail versendet.
- [ ] Es erfolgt kein unerwarteter Provideraufruf für die deaktivierten Typen.

## F. E-Mail-Phase B – nur nach ausdrücklicher Freigabe

Diese Phase erst nach kontrollierter Aktivierung der Ticket-Mailtypen durchführen. Die Aktivierung ist nicht Teil dieses Testplanschritts.

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

## Release-Gate

B15.25 darf erst freigegeben werden, wenn:

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

- Testdatum:
- Getesteter Commit:
- Umgebung:
- Rollen (nur Rollenbezeichnungen):
- Mail-Phase A Ergebnis:
- Mail-Phase B Ergebnis beziehungsweise „noch nicht freigegeben“:
- Offene Abweichungen:
- Freigabeentscheidung:
