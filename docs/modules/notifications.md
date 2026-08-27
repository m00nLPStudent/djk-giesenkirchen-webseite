# Modul: Benachrichtigungen

## Zentrale Zustellung

Dashboard-Notifications werden nach erfolgreicher Fachmutation serverseitig persistiert. B15.21D5 ergänzt direkt danach einen zentralen Best-Effort-E-Mail-Kanal. Fachservices erzeugen weiterhin ausschließlich Notifications und kennen weder Mailprovider noch Empfängeradresse.

Der zentrale Hook verarbeitet nur tatsächlich neu persistierte Rohzeilen aus `createNotification`, `createNotifications` und `createNotificationsOnce`. Eine explizite Default-deny-Registry erlaubt zunächst ausschließlich `membership_created`, `membership_assigned`, `membership_forwarded`, `membership_completed`, `trainer_assigned`, `trainer_removed` und `trainer_changed`. Alle anderen Typen erhalten einen `skipped`-Ledgerzustand und lösen keinen Mailaufruf aus. `event_cancelled` bleibt deaktiviert, weil der Typ echte Trainingsabsagen und das Entfernen normaler Trainingszeiten noch nicht eindeutig trennt.

## Datenschutz und Empfänger

Die Empfängeradresse wird ausschließlich über `notification.recipient_user_id` aus einem aktiven `admin_profiles`-Datensatz geladen und syntaktisch geprüft. Browserwerte, Notification-Metadata, Membership-Adressen und `forwarded_to_email` sind keine Versandquelle. Die typspezifischen Renderer verwenden weder Dashboard-Titel noch Dashboard-Message, Zielroute oder Metadata. Mails enthalten nur eine neutrale Ereignisbeschreibung, den Hinweis auf das geschützte Dashboard und – bei gültiger `NEXT_PUBLIC_SITE_URL` – einen serverseitig auf `/admin` normalisierten Link.

## Delivery-Ledger

`notification_deliveries` ist server-only und pro `(notification_id, channel)` eindeutig. Nicht erlaubte Typen oder fehlende aktive Empfänger werden `skipped`. Erlaubte Zustellungen wechseln per konditionalem Compare-and-Swap-Update von fälligem `pending`/`failed` nach `sending`; Status, bisheriger Versuchszähler, leeres Lock und Fälligkeit sind Teil des Updates. Dadurch erhält bei parallelen Aufrufen nur ein Aufrufer eine Claim-Zeile. `provider_key` bezeichnet den verwendeten Provider, aktuell `resend`. Der davon getrennte, bei jedem Versuch stabile Provider-Idempotency-Key lautet `notification-email/<notification-id>` und wird als `Idempotency-Key` an den Provider übergeben.

Providererfolg setzt `sent`, `sent_at`, Provider-Key und optional nur die Provider-Message-ID. Fehler werden auf eine kleine technische Fehlerklasse reduziert, lösen das Lock, setzen `failed` und berechnen ein exponentielles `next_attempt_at` ab 15 Minuten, begrenzt auf 24 Stunden. Es gibt in D5 keinen Cron und keinen automatischen Retry. `sent` und `skipped` sind terminal. Ein Ledger- oder Mailfehler verändert weder Fachaktion noch Dashboard-Notification.

Die vorhandenen In-App-Preferences bleiben unverändert; `in_app_enabled` wird nicht als Mailpreference verwendet. Eine spätere unabhängige `email_enabled`-Preference benötigt einen eigenen Datenbank-Sicherheitsblock. `notification_audit` bleibt unverändert und ist nicht der Delivery-State.

## B15.21D8/D9 – Globale E-Mail-Steuerung

Die feste D5-Registry wurde durch eine globale, ausschließlich vom Superadmin änderbare Datenbankpolicy ergänzt. `notification_preferences` bleibt unverändert benutzerbezogen und steuert weiterhin nur In-App-Notifications. `notification_email_settings` enthält die explizite Freigabe der 27 produktiven Type-Keys; `notification_email_global_settings` stellt den atomaren Master-Schalter für Import, Go-live und Not-Aus bereit.

Die Semantik ist strikt default-deny: Master aus, fehlende Masterzeile, fehlende Typzeile, deaktivierter Typ, Lookupfehler oder fehlender sicherer Renderer bedeuten keine Mail. Dashboard-Notifications bleiben davon unberührt. Der Coordinator legt auch in diesen Fällen eine terminale `skipped`-Delivery mit sanitisiertem Grund an. Eine spätere Aktivierung versendet daher niemals alte Notifications rückwirkend. Batchpfade laden Master einmal und alle benötigten Typen gesammelt; ein Cache ist nicht vorgesehen.

Die Seite `System → E-Mail-Benachrichtigungen` unter `/admin/system/notification-email-settings` ist ausschließlich für die aktive Rolle `superadmin` sichtbar und änderbar. Sie bietet Master, einzelne Type-Toggles, „Alle Typen deaktivieren“ und die bestätigte 16/11-Empfehlungsmatrix. Bulk-Aktionen schalten zuerst den Master aus; Restore aktiviert ihn nie automatisch. Normale Browserrollen erhalten keine Rechte auf den server-only Tabellen. Spätere individuelle E-Mail-Präferenzen werden nach globalem Master und globaler Typfreigabe additiv geprüft und nicht mit `in_app_enabled` vermischt. Details stehen in [`b15-21d8-global-notification-email-settings-architecture.md`](../planning/b15-21d8-global-notification-email-settings-architecture.md).

## B15.21D6 – Erster realer Notification-Mail-Test

Der kontrollierte Test über den aktuellen D5-Dev-Server erzeugte genau eine `membership_forwarded`-Notification und genau eine zugehörige E-Mail-Delivery. Das Ledger bestätigte `status = sent`, `attempt_count = 1`, gesetztes `sent_at`, `provider_key = resend`, eine vorhandene Provider-Message-ID, ein entferntes Lock und keine Fehlerklasse. Es gab keine zweite Delivery, keine doppelte Notification-Idempotenzgruppe und keine offenen `pending`-, `sending`- oder `failed`-Zustände. Der Benutzer bestätigte sowohl den einzelnen Versand im Resend-Dashboard als auch den Eingang im Testpostfach. Betreff und Inhalt entsprachen dem datensparsamen Renderer.

Die im lokalen Test enthaltene Dashboard-URL zeigte auf die für Port 3000 konfigurierte Basis-/Tunnel-URL, während D6 bewusst über Port 3001 ausgeführt wurde. Diese lokale Nichterreichbarkeit ist kein Versand- oder Delivery-Fehler. Vor dem produktiven Deployment muss `NEXT_PUBLIC_SITE_URL` kontrolliert auf die finale Vereinsdomain zeigen und der daraus erzeugte allgemeine `/admin`-Link in der Zielumgebung geprüft werden. D6 hat keine Environment-, Tunnel-, Resend- oder DNS-Konfiguration verändert.
