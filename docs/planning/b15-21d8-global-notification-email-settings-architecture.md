# B15.21D8 – Globale Superadmin-Steuerung der Notification-E-Mail-Typen

Stand: 27. August 2026. D8 ist ausschließlich Analyse und Architektur. Es wurde keine UI implementiert, keine Allowlist geändert, kein SQL ausgeführt und keine Mail versendet.

## Bestandsentscheidung

D5 prüft aktuell synchron eine feste Registry mit sieben freigegebenen Typen in `notificationEmailDelivery.core.mjs`. Nur neu persistierte Rohzeilen aus den drei zentralen Notification-Pfaden erreichen den Best-Effort-Delivery-Coordinator. Nicht erlaubte Typen werden als terminale `skipped`-Delivery mit der sanitisierten Klasse `notification_email_type_denied` erfasst. Fachservices kennen weder Mailkonfiguration noch Provider.

`notification_preferences` ist keine geeignete Ablage für die globale Steuerung. Jede Zeile gehört über `user_id` einem Benutzer, wird durch Own-row-RLS geschützt und steuert ausschließlich `in_app_enabled` vor der Notification-Persistenz. Eine vereinsweite Mailentscheidung ohne Benutzerbezug würde Schlüssel, RLS, Service und Semantik dieser Tabelle vermischen. Sie bleibt unverändert.

## Empfohlenes Datenmodell

Zwei kleine server-only Tabellen trennen Typentscheidung und betriebliche Notabschaltung:

### `notification_email_settings`

| Spalte | Zweck |
| --- | --- |
| `notification_type text primary key` | normalisierter produktiver Type-Key; 1–100 Zeichen, nur Kleinbuchstaben, Ziffern und Unterstrich |
| `email_enabled boolean not null default false` | explizite globale Freigabe |
| `updated_by uuid null` | zuletzt handelndes Adminprofil, bei Profilentfernung `SET NULL` |
| `created_at`, `updated_at` | technische Zeitpunkte; `updated_at` über vorhandenen Triggerhelper |

### `notification_email_global_settings`

Eine durch `setting_key = 'global'` erzwungene Singletonzeile enthält `email_delivery_enabled`, `updated_by`, `created_at` und `updated_at`. Der Master-Schalter startet bewusst mit `false`. Die per Typ gespeicherten Empfehlungen können dadurch vor Datenimport vorbereitet werden, ohne dass die spätere Codeumschaltung eine Mailflut erzeugt.

Beide Tabellen erhalten RLS ohne Browserpolicy. `PUBLIC`, `anon` und `authenticated` erhalten keinerlei Tabellenrechte; nur `service_role` erhält `SELECT`, `INSERT`, `UPDATE` und `DELETE`. `FORCE RLS` ist nicht erforderlich: Browserrollen bleiben durch RLS und Grants doppelt ausgeschlossen, während der bewusst serverseitige Service-Role-Pfad funktionieren muss. Es gibt keine RPC und keine Client-Subscriptions.

## Default-Deny

Die spätere zentrale Entscheidung lautet:

```text
master.email_delivery_enabled === true
AND settings[type].email_enabled === true
AND type besitzt einen expliziten sicheren Renderer
→ E-Mail-Delivery zulässig
sonst
→ skipped, kein Provideraufruf
```

Eine fehlende Singletonzeile, ein Lookupfehler, eine fehlende Typzeile, ein unbekannter Typ oder ein fehlender Renderer ist immer deny. Der DB-Default `false` schützt neue Zeilen; die entscheidende Missing-row-Semantik muss zusätzlich im Delivery-Service mit `false` umgesetzt werden. Zukünftige Typen werden nicht durch bloßes Auftauchen in einem Fachservice mailfähig.

Der bestehende Renderer-Sicherheitsgurt bleibt unabhängig bestehen. Eine DB-Freigabe allein darf nie einen Typ ohne datensparsamen, getesteten Renderer versenden. D8 erweitert deshalb weder die sieben Code-Typen noch deren Renderer.

## Initiale Konfiguration

Das Proposal speichert die 27 in D7 bestätigten produktiven Typen. Der globale Master bleibt zunächst aus.

Initial `email_enabled = true`:

- `membership_created`, `membership_assigned`, `membership_forwarded`, `membership_completed`
- `trainer_assigned`, `trainer_removed`, `trainer_changed`
- `player_assigned`, `team_changed`, `membership_processing`
- `membership_payment_overdue`, `membership_payment_partial_open`
- `member_activated`, `member_deactivated`, `member_archived`
- `event_updated`

Initial `email_enabled = false`:

- `player_removed`, `player_updated`
- `membership_payment_created`, `membership_payment_updated`, `membership_payment_received`, `membership_payment_deleted`
- `membership_payment_due_soon`, `membership_payment_due_today`, `membership_payment_deferral_ending`
- `event_created`, `event_cancelled`

Diese Werte sind Konfiguration, keine Erweiterung der produktiven D5-Allowlist. Vor Aktivierung eines heute noch nicht gerenderten Typs muss ein eigener Implementierungsblock einen generischen datensparsamen Renderer und Tests ergänzen.

## Delivery-Coordinator und Ledger

Die globale Prüfung gehört ausschließlich in den zentralen Delivery-Coordinator, vor Empfängerauflösung, Rendering, Claim und Provideraufruf. `createNotification` lädt Master und einen Typ; die Batchpfade laden den Master einmal und alle unterschiedlichen Type-Keys mit einer `.in(...)`-Abfrage. Fachservices greifen nie auf Settings zu.

Bei deaktiviertem Master oder Typ wird weiterhin genau eine `skipped`-Ledgerzeile erzeugt. Das entspricht D5 und ist gegenüber „kein Ledger“ vorzuziehen:

- nachvollziehbar, warum eine persistierte Notification keine Mail erhielt;
- eindeutige `(notification_id, channel)`-Identität bleibt erhalten;
- keine spätere Aktivierung versendet alte Import- oder Bestandsnotifications rückwirkend;
- Debugging kann Disabled-, Missing-setting- und Missing-renderer-Gründe sanitisiert unterscheiden;
- `skipped` bleibt versuchs- und providerfrei und verursacht nur eine schmale Zeile.

Eine spätere Aktivierung wirkt ausschließlich auf danach neu persistierte Notifications. Ein `skipped`-Datensatz wird weder Retry noch Backfill. Falls jemals ein bewusster Backfill benötigt wird, ist er ein eigener, ausdrücklich freizugebender Prozess.

## Performance

Die Tabellen sind winzig und über Primärschlüssel indiziert. Für den ersten Implementierungsblock ist kein Cache nötig. Direkte serverseitige Reads sind korrekt, sofort konsistent und vermeiden Cache-Invalidierung nach einem Superadmin-Toggle. Batchpfade müssen Typen gesammelt laden; N+1-Abfragen pro Notification sind nicht zulässig. Erst reale Messwerte dürfen später einen kurzlebigen serverseitigen Cache begründen. Fehler beim Settings-Lookup sind fail-closed für E-Mail und dürfen Fachaktion oder Dashboard-Notification nicht zurückrollen.

## Geplante Superadmin-Seite

Geplante Route: `/admin/system/notification-email-settings`, Navigation unter `System → E-Mail-Benachrichtigungen`.

Die Seite zeigt den Master-Schalter und alle produktiven Typen gruppiert mit deutscher Bezeichnung, optionaler Beschreibung, kleinem technischem Type-Key und einem E-Mail-Toggle. Speichern erfolgt serverseitig mit klarer Erfolg-/Fehlermeldung. Die Dashboard-Glocke und `in_app_enabled` werden nicht verändert.

Sichtbarkeit, Page Loader und Server Action müssen wie das Monitoring die etablierte Rolle `superadmin` explizit prüfen: `assertAdminActionPermission({})`, danach aktives `roles[].key === 'superadmin'`. Ein allgemeines `system.view` oder eine normale Edit-Permission reicht nicht. Erst nach dieser Prüfung darf ein server-only Repository einen Service-Role-Client verwenden. Browserclients erhalten keine Tabellenrechte. „Alle E-Mails deaktivieren“ wird sicher durch den Master-Schalter abgedeckt; „Empfohlene Einstellungen wiederherstellen“ ist optional, bestätigungspflichtig und später atomar serverseitig umzusetzen.

## Datenimport und Go-live

Vor Import bleibt der Master `AUS`. Benutzer, Trainer, Betreuer, Spieler, Beiträge und weitere Echtdaten können angelegt werden, während Dashboard-Notifications weiterhin funktionieren und Maildeliveries nachvollziehbar `skipped` bleiben. Nach Import werden Typwerte geprüft, Renderer und Testempfänger validiert, Domain und `NEXT_PUBLIC_SITE_URL` kontrolliert und erst dann der Master bewusst eingeschaltet.

Der Master ist zusätzlich zu Typ-Toggles sinnvoll: ein atomarer Not-Aus ist schneller und sicherer als 27 Einzelupdates und bewahrt die gewünschte Konfiguration für die spätere Wiederaktivierung. Nachteil ist eine zweite Entscheidungsebene; dieser wird durch eine eindeutige UI-Anzeige „Global AUS – Typauswahl derzeit ohne Versandwirkung“ begrenzt.

## Spätere individuelle Mailpräferenzen

Die Architektur bleibt additiv erweiterbar:

```text
globaler Master an?
→ globaler Typ explizit an?
→ sicherer Renderer vorhanden?
→ spätere individuelle E-Mail-Präferenz erlaubt?
→ zustellen
```

Die spätere Benutzerpräferenz darf `in_app_enabled` nicht umdeuten. Ob sie als additive Spalte oder getrennte Kanaltabelle umgesetzt wird, benötigt einen eigenen Security- und Persistenzblock, insbesondere weil In-App-Präferenzen heute bereits vor der kanonischen Notification-Persistenz filtern.

## SQL-Sicherheitsverfahren

D8 bereitet ausschließlich diese nicht ausgeführten Artefakte vor:

1. `b15-21d8-notification-email-settings-preflight-readonly.sql`
2. `b15-21d8-notification-email-settings-proposal.sql`
3. `b15-21d8-notification-email-settings-rollback.sql`
4. `b15-21d8-notification-email-settings-postcheck-readonly.sql`

Der Preflight inventarisiert Namenskonflikte, Bestandsschema, RLS, Policies, Grants, Constraints, Indizes, Trigger, relevante normale Funktionen sowie ausschließlich aggregierte Typ-/Statusdaten. Proposal und Rollback sind transaktional und brechen bei unerwarteten Relationen beziehungsweise Kommentaren ab. Der Postcheck beweist Schema, RLS, fehlende Policies und Browserrechte, Service-Role-Zugriff, Master-OFF, 27 Typzeilen sowie die Verteilung 16/11. Keine Datei wurde ausgeführt.

### Ergebnis des manuellen Live-Preflights

Der D8-Preflight wurde am 27. August 2026 manuell vollständig ausgeführt. Die beiden geplanten Tabellen existieren nicht und ihre Namen sind konfliktfrei. Bestätigt wurden `notifications`, `notification_preferences`, `notification_audit`, `notification_deliveries`, `admin_profiles`, RLS auf den relevanten Notification-Tabellen, das service-role-only Delivery-Ledger, `set_updated_at()` sowie die vorhandenen Updated-at-Trigger. Keine Funktion referenziert die geplanten D8-Tabellen. `notification_preferences` enthält keine Zeilen und bleibt unverändert benutzerbezogen.

Die datensparsame Bestandsbaseline lautet: drei `membership_created`-, zwei `membership_forwarded`-Notifications und genau eine `sent/email`-Delivery; weitere Delivery-Zustände wurden nicht gefunden. Daraufhin wurde das Proposal nur defensiv ergänzt: Es prüft nun die Supabase-Rollen und den UUID-Typ von `admin_profiles.id` vor der Schemaanlage. Der Postcheck vergleicht zusätzlich die vollständige 27er-Key-/Wertematrix, die bestätigten Notification-/Delivery-Zähler, fehlende Empfänger-/Idempotenzwerte und doppelte Notification-Idempotenzgruppen. Das marker-geschützte Rollback benötigte keine Änderung.

Wichtig: Die Schemaanlage allein ändert D5 nicht. Solange der spätere Implementierungsblock den Coordinator noch nicht auf Master und Typsettings umgestellt hat, arbeitet die bestehende feste Siebener-Registry weiter. `master = false` garantiert, dass die **neue globale Steuerung** bei ihrer späteren Integration fail-closed startet; es ist noch kein allgemeiner Not-Aus für den heutigen D5-Code.

## Empfohlener Folgeblock

Zuerst den D8-Preflight manuell gegen die Live-Datenbank ausführen und die Ausgabe prüfen. Erst nach gesonderter Freigabe Proposal und Postcheck manuell ausführen. Danach kann ein Implementierungsblock Repository, zentrale Policy-Auswertung, Renderer für zusätzlich aktivierbare Typen, Superadmin-Route/UI und vollständige Default-Deny-/Batch-/Security-Regressionen umsetzen. Der globale Master darf erst nach kontrolliertem Go-live-Test eingeschaltet werden.

## B15.21D9 – Implementierter Stand

Nach erfolgreicher manueller Ausführung von D8-Proposal und Postcheck implementiert D9 die globale Steuerung. Die neue Route `/admin/system/notification-email-settings` erscheint ausschließlich für Superadmins im Systembereich. Page Loader und jede einzelne Server Action authentifizieren erneut, prüfen die aktive Rolle `superadmin` und erzeugen erst danach den server-only Service-Role-Client. Clientcode erhält weder Secrets noch Tabellenzugriff.

Core, Repository und Service trennen die feste 27er-Typdefinition, minimale Datenbankzugriffe und Autorisierung/DTOs. Die UI zeigt den unverändert aus der Datenbank geladenen Master und die 27 Type-Werte gruppiert und responsive an. Einzeländerungen wirken ohne Cache sofort. „Alle Typen deaktivieren“ und „Empfohlene Einstellungen“ verlangen eine Bestätigung, schalten zuerst den Master aus und überschreiben anschließend die Type-Matrix; Restore lässt den Master bewusst aus. `updated_by` erhält das tatsächlich autorisierte Superadmin-Profil.

Der zentrale Delivery-Hook lädt pro Persistenzbatch den Master einmal und alle vorkommenden Type-Keys in einer Abfrage. Versand ist nur erlaubt, wenn Master und Type explizit aktiv sind und ein sicherer Renderer existiert. Lookupfehler sind fail-closed. Die neun zusätzlichen Renderer für `player_assigned`, `team_changed`, `membership_processing`, `membership_payment_overdue`, `membership_payment_partial_open`, `member_activated`, `member_deactivated`, `member_archived` und `event_updated` sind neutral und übernehmen keine Dashboardtexte, Metadaten, Namen, Beträge oder IDs.

Disabled-, Missing- und Renderer-Fälle erzeugen weiterhin genau eine terminale `skipped`-Delivery. Dadurch bleiben bestehende Skips terminal und eine spätere Aktivierung kann keine alte Notification nachversenden. Dashboard-Glocke, In-App-Preferences, Fachservices, Ledger-Claim, Membership-Eingangsbestätigung, Mailservice und Providergrenze bleiben unverändert. Der Master wurde durch D9 nicht eingeschaltet; ein echter Versandtest ist ein separater manueller Folgeschritt.
