# Modul: Benachrichtigungen

## Zentrale Zustellung

Dashboard-Notifications werden nach erfolgreicher Fachmutation serverseitig persistiert. B15.21D5 ergänzt direkt danach einen zentralen Best-Effort-E-Mail-Kanal. Fachservices erzeugen weiterhin ausschließlich Notifications und kennen weder Mailprovider noch Empfängeradresse.

Der zentrale Hook verarbeitet nur tatsächlich neu persistierte Rohzeilen aus `createNotification`, `createNotifications` und `createNotificationsOnce`. Versand ist ausschließlich zulässig, wenn der standardmäßig deaktivierte globale Master, die serverseitige Type-Einstellung und ein expliziter sicherer Renderer gemeinsam freigeben. Die 27er D8-Baseline wurde für B15.25 um `ticket_created`, `ticket_reply_created` und `ticket_status_changed` erweitert. Alle aktuell 30 organisationsweit konfigurierbaren E-Mail-Typen besitzen einen datensparsamen Renderer; ein Konsistenztest erzwingt die exakte Mengengleichheit von UI-Type- und Renderer-Registry. Die 16 bisherigen Empfehlungen bleiben erhalten, die drei Tickettypen sind zusätzlich deaktiviert. Unbekannte oder deaktivierte Typen erhalten einen terminalen `skipped`-Ledgerzustand und lösen keinen Provideraufruf aus.

## Datenschutz und Empfänger

Die Empfängeradresse wird ausschließlich über `notification.recipient_user_id` aus einem aktiven `admin_profiles`-Datensatz geladen und syntaktisch geprüft. Browserwerte, Notification-Metadata, Membership-Adressen und `forwarded_to_email` sind keine Versandquelle. Die bisherigen Renderer bleiben vollständig generisch. Die Ticketrenderer verwenden ausschließlich die allowlist-begrenzten Felder Ticketnummer, Betreff und gegebenenfalls Status; vollständige Nachrichten, Identitäten, Rollen- oder Scope-Daten werden nie in die Mail übernommen. Bei gültiger `NEXT_PUBLIC_SITE_URL` führt der HTML-CTA über dieselbe Origin zur geschützten Ticketroute, während der Text-Fallback keine interne Ticket-UUID ausgibt.

## Delivery-Ledger

`notification_deliveries` ist server-only und pro `(notification_id, channel)` eindeutig. Nicht erlaubte Typen oder fehlende aktive Empfänger werden `skipped`. Erlaubte Zustellungen wechseln per konditionalem Compare-and-Swap-Update von fälligem `pending`/`failed` nach `sending`; Status, bisheriger Versuchszähler, leeres Lock und Fälligkeit sind Teil des Updates. Dadurch erhält bei parallelen Aufrufen nur ein Aufrufer eine Claim-Zeile. `provider_key` bezeichnet den verwendeten Provider, aktuell `resend`. Der davon getrennte, bei jedem Versuch stabile Provider-Idempotency-Key lautet `notification-email/<notification-id>` und wird als `Idempotency-Key` an den Provider übergeben.

Providererfolg setzt `sent`, `sent_at`, Provider-Key und optional nur die Provider-Message-ID. Fehler werden auf eine kleine technische Fehlerklasse reduziert, lösen das Lock, setzen `failed` und berechnen ein exponentielles `next_attempt_at` ab 15 Minuten, begrenzt auf 24 Stunden. Es gibt in D5 keinen Cron und keinen automatischen Retry. `sent` und `skipped` sind terminal. Ein Ledger- oder Mailfehler verändert weder Fachaktion noch Dashboard-Notification.

Die vorhandenen In-App-Preferences bleiben unverändert; `in_app_enabled` wird nicht als Mailpreference verwendet. Persönliche E-Mail-Schalter pro Benutzer sind aktuell bewusst nicht vorgesehen. Die organisationsweite Entscheidung über E-Mail-Typen verbleibt beim Superadmin. `notification_audit` bleibt unverändert und ist nicht der Delivery-State.

## B15.21D8/D9 – Globale E-Mail-Steuerung

Die feste D5-Registry wurde durch eine globale, ausschließlich vom Superadmin änderbare Datenbankpolicy ergänzt. `notification_preferences` bleibt benutzerbezogen und steuert weiterhin nur In-App-Notifications. `notification_email_settings` enthält nach B15.25 30 produktive Type-Keys mit 16 empfohlenen Aktivierungen und 14 Deaktivierungen; `notification_email_global_settings` stellt den standardmäßig ausgeschalteten atomaren Master-Schalter für Import, Go-live und Not-Aus bereit.

Die Semantik ist strikt default-deny: Master aus, fehlende Masterzeile, fehlende Typzeile, deaktivierter Typ, Lookupfehler oder fehlender sicherer Renderer bedeuten keine Mail. Dashboard-Notifications bleiben davon unberührt. Der Coordinator legt auch in diesen Fällen eine terminale `skipped`-Delivery mit sanitisiertem Grund an. Eine spätere Aktivierung versendet daher niemals alte Notifications rückwirkend. Batchpfade laden Master einmal und alle benötigten Typen gesammelt; ein Cache ist nicht vorgesehen.

Die Seite `System → E-Mail-Benachrichtigungen` unter `/admin/system/notification-email-settings` ist ausschließlich für die aktive Rolle `superadmin` sichtbar und änderbar. Sie bietet Master, einzelne Type-Toggles, „Alle Typen deaktivieren“ und die um drei deaktivierte Tickettypen erweiterte Empfehlungsmatrix. Bulk-Aktionen schalten zuerst den Master aus; Restore aktiviert ihn nie automatisch. Normale Browserrollen erhalten keine Rechte auf den server-only Tabellen. Details der ursprünglichen D8-Baseline stehen in [`b15-21d8-global-notification-email-settings-architecture.md`](../planning/b15-21d8-global-notification-email-settings-architecture.md).

## B15.21D10 – Persönliche In-App-Preferences

Die persönliche Seite `/admin/notifications/settings` verwendet eine kompakte Desktop-Tabelle mit gemeinsamer Spaltengeometrie sowie kompakte Mobile-Listen. Erforderliche Typen bleiben als „Erforderlich“ gekennzeichnet und nicht abschaltbar. Optionale Einzeltoggles, „Alle optionalen aktivieren“, „Alle optionalen deaktivieren“ und „Standard wiederherstellen“ behalten unverändert die bestehende Own-user-Preference-Semantik.

## B15.21D11 – Notification-Center-Mehrfachauswahl

Das Notification Center ergänzt die serverseitig authentifizierten Einzel- und Gelesenen-Löschpfade um `deleteSelectedNotificationsAction(ids)`. Die Action ermittelt den Benutzer ausschließlich aus der Session, normalisiert höchstens 250 UUIDs, entfernt Duplikate und übergibt nur eine gültige, nichtleere Liste. Das Repository kombiniert `id IN (...)` zwingend mit dem serverseitigen `recipient_user_id`; die Own-row-RLS bleibt zusätzliche Schutzschicht. Fremde oder nicht vorhandene IDs werden nicht gesondert offengelegt, zurückgegeben wird nur die Löschanzahl.

Desktop und Mobile bieten Checkboxen, Auswahlzahl und eine bestätigte Sammellöschung. „Alle auswählen“ meint ausschließlich die aktuell geladenen und durch Suche, Status und Typ sichtbar gefilterten Zeilen. Filterwechsel leeren die Auswahl; Einzellöschung entfernt die betroffene ID ebenfalls aus dem Auswahlzustand. Die kompakte Listenleiste enthält zusätzlich „Alle als gelesen markieren“. Der redundante sichtbare Einstieg „Gelesene löschen“ wurde entfernt; Action, Service und Repository für `deleteAllRead` bleiben ohne Refactoring intern erhalten.

Der Typfilter enthält weiterhin nur Typen, die in den aktuell geladenen Notifications vorkommen. Seine sichtbaren deutschen Labels stammen aus der zentralen persönlichen Preference-Registry. Unbekannte zukünftige Typen erhalten den neutralen Fallback „Weitere Benachrichtigung“. In der Desktop-Tabelle steht das verständliche Label primär und der technische Type-Key klein darunter.

Beim Löschen einer Notification entfernt der bestehende FK `notification_deliveries.notification_id ... ON DELETE CASCADE` bewusst auch die zugehörige operative Delivery-Ledgerzeile. D11 behält damit exakt die bestehende Semantik von Einzel- und „Gelesene löschen“ bei. `notification_audit` besitzt keine Notification-FK und bleibt erhalten. Eine abweichende dauerhafte Delivery-Aufbewahrung wäre ein eigener SQL-/Datenmodellblock. D11 selbst benötigte keine SQL-Änderung. Analyse und Umsetzung stehen in [`b15-21d11-notification-center-bulk-delete-analysis.md`](../planning/b15-21d11-notification-center-bulk-delete-analysis.md).

## B15.21D6 – Erster realer Notification-Mail-Test

Der kontrollierte Test über den aktuellen D5-Dev-Server erzeugte genau eine `membership_forwarded`-Notification und genau eine zugehörige E-Mail-Delivery. Das Ledger bestätigte `status = sent`, `attempt_count = 1`, gesetztes `sent_at`, `provider_key = resend`, eine vorhandene Provider-Message-ID, ein entferntes Lock und keine Fehlerklasse. Es gab keine zweite Delivery, keine doppelte Notification-Idempotenzgruppe und keine offenen `pending`-, `sending`- oder `failed`-Zustände. Der Benutzer bestätigte sowohl den einzelnen Versand im Resend-Dashboard als auch den Eingang im Testpostfach. Betreff und Inhalt entsprachen dem datensparsamen Renderer.

Die im lokalen Test enthaltene Dashboard-URL zeigte auf die für Port 3000 konfigurierte Basis-/Tunnel-URL, während D6 bewusst über Port 3001 ausgeführt wurde. Diese lokale Nichterreichbarkeit ist kein Versand- oder Delivery-Fehler. Vor dem produktiven Deployment muss `NEXT_PUBLIC_SITE_URL` kontrolliert auf die finale Vereinsdomain zeigen und der daraus erzeugte allgemeine `/admin`-Link in der Zielumgebung geprüft werden. D6 hat keine Environment-, Tunnel-, Resend- oder DNS-Konfiguration verändert.

## Aktueller produktiver Mailstatus

Die Renderer-Abdeckung beträgt 30/30; es gibt keine aktivierbare Type-Einstellung ohne sicheren Renderer. Der produktive Versand verwendet die verifizierte Resend-Domain `mail.djkvfl-giesenkirchen.de` und den zentral formatierten Vereinsabsender. Eine reale Mannschafts-/Spieler-Notification wurde bereits zugestellt und von Resend als `Delivered` bestätigt. Die Tickettypen sind noch nicht live aktiviert oder versendet. Die abschließende Prüfung des Dashboard-Links mit der echten Hauptdomain bleibt Bestandteil der späteren Domainumschaltung.
