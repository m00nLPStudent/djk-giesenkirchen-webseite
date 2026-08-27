# B15.21D4 – Analyse und Architektur für E-Mail als Notification-Ausgabekanal

Stand: 26. August 2026. D4 ist ein Analyse- und Architekturblock. Es wurde keine Notification-Mail implementiert, keine Mail versendet und kein SQL ausgeführt.

## Ergebnis in Kürze

Das bestehende Notification-System eignet sich als fachlicher Ausgangspunkt, aber `notifications` ist heute zugleich persistierte Empfängerzeile und Dashboard-Inbox. Die E-Mail-Ausleitung darf deshalb nicht blind im Fachservice und nicht durch Wiederverwendung von `title`, `message`, `target_url` oder `metadata` erfolgen. Empfohlen wird eine zentrale, server-only Delivery-Schicht unmittelbar nach erfolgreicher Notification-Persistenz. Sie erhält ausschließlich die tatsächlich neu angelegten Notification-Zeilen, prüft eine explizite E-Mail-Allowlist je Typ, löst die aktuelle Empfängeradresse erneut aus `admin_profiles` auf, rendert ein datensparsames typspezifisches Mailmodell und nutzt danach unverändert `mail.service.js` samt Provider-Abstraktion.

Für providerneutrale Idempotenz, atomare Konkurrenzkontrolle und einen späteren kontrollierten Retry fehlt ein persistierter Delivery-Zustand. Die bestehende Notification-ID ist ein geeigneter Schlüssel, `notification_audit` jedoch absichtlich append-only und kein Zustands- oder Lockmodell. Daher ist ein schmales server-only Ledger `notification_deliveries` sinnvoll. Der manuelle D4.1-Live-Preflight bestätigte die erwarteten drei Bestandstabellen, deren RLS-/Grant-Modell, drei vorhandene Notifications mit vollständigen Idempotenzschlüsseln ohne Duplikatgruppe, vollständige E-Mail-Adressen für drei aktive Adminprofile sowie das Nichtvorhandensein eines Delivery-Ledgers. Das Proposal verändert keine Bestandstabelle.

## Untersuchte Bestandteile

- Kern: `notifications.service.js`, `notifications.repository.js`, `notifications.core.mjs`, `notification.dto.js`
- Darstellung und Inbox: `NotificationBell.js`, `NotificationItem.js`, `NotificationDetailCard.js`, `NotificationsModule.js`, Notification Server Actions und Seiten
- Erzeuger: Assignment-, Workflow-, Editorial- und Training-Service samt ihren Core-Buildern
- Empfänger: `teamNotificationRecipients.repository.js`, `workflowNotificationRecipients.repository.js`, Membership-Responsibility-Core und Team-Scope-Auflösung
- Preferences: Policy, Repository, Service, Settings-Actions und UI
- Monitoring: Audit-Logger, Loader, Core, Monitoring-UI und B15.18G/K-SQL
- Scheduler: Contribution-Reminder-Dispatcher, Repository, Builder, Scheduler-Core und interne API-Route
- Fachaktionen: Membership-Submit/-Weiterleitung/-Status, Beiträge/Zahlungen, Spieler, Trainer, Mannschaften, Events und Trainingszeiten/-ausnahmen
- Datenbankgrundlage: Notifications-, Preferences-, Audit- und Idempotenz-SQL aus B15.18A–K/J1
- Tests und Planung aus B15.18A–K/J1 sowie B15.21C/D0–D3

## Aktuelle Architektur

1. Eine autorisierte Fachaktion speichert zuerst ihre fachliche Änderung.
2. Ein domänenspezifischer Builder erzeugt `type`, `title`, `message`, Entity-Bezug, Zielroute und Metadaten.
3. Ein server-only Resolver ermittelt aktive, berechtigte Empfänger und entfernt den Actor.
4. `createNotificationsOnce` prüft vorhandene Notification-Zeilen und In-App-Preferences, dedupliziert und schreibt mit dem Service-Role-Client.
5. Die Datenbank erzwingt zusätzlich Eindeutigkeit auf Empfänger, Typ und `metadata.idempotencyKey`.
6. Der zentrale Service schreibt ein sanitisiertes, append-only Audit über die gehärtete Service-Role-RPC.
7. Glocke und Notification Center laden nur eigene Zeilen. Empfänger dürfen ihre Zeilen lesen, `is_read`/`read_at` ändern und löschen, aber keine Notification anlegen.

Read/Unread und Delete sind reine Inbox-Funktionen. Das Löschen einer Dashboard-Zeile ist derzeit endgültig; das Audit bleibt getrennt bestehen. Es gibt kein Realtime-Abonnement: Die Glocke lädt initial, beim Öffnen und bei Window-Fokus. Es gibt keine allgemeine Notification-Mail-Ausleitung.

## Tatsächlich vorhandene Typen

„Aktiv“ bedeutet, dass ein aktueller Anwendungspfad den Typ erzeugt. „Vorbereitet“ bedeutet, dass Renderer/Preference-Definition vorhanden sind, aber kein aktueller Erzeuger gefunden wurde.

| Typ | Ereignis und Erzeuger | Empfänger | Dashboard-Inhalt / Daten | Status | E-Mail-Empfehlung |
| --- | --- | --- | --- | --- | --- |
| `player_assigned` | Spielerzuordnung; Player-/Team-Actions → Assignment-Service | aktive Trainer der Mannschaftssaison, ohne Actor | Spielername, Team, Saison; IDs/Labels in Metadata | aktiv | optional, Mail generisch ohne Spielername |
| `player_removed` | Spieler aus Kader entfernt | bisherige aktive Trainer | Spielername, Team, Saison; Access-lost-Flag | aktiv | optional, generisch |
| `player_updated` | saisonale Spielerzuordnung geändert | aktive Trainer | Spielername, Team, Saison | aktiv | nur Dashboard wegen Änderungsfrequenz |
| `trainer_assigned` | Trainer einer Mannschaft zugeordnet | direkt verknüpftes aktives Adminprofil | Team, Saison, Rolle | aktiv, mandatory | standardmäßig sinnvoll |
| `trainer_removed` | Trainerzuordnung beendet | direkt verknüpftes aktives Adminprofil | Team, Saison, Rolle, Zugriffsverlust | aktiv, mandatory | standardmäßig sinnvoll |
| `trainer_changed` | Trainerfunktion geändert | direkt verknüpftes aktives Adminprofil | Team und Rollenwechsel | aktiv, mandatory | standardmäßig sinnvoll |
| `team_changed` | Mannschaft archiviert | aktive verknüpfte Trainer | Team, Saison, Zugriffsverlust | aktiv | optional |
| `membership_created` | erfolgreicher Public-Submit | zuständige aktive Rollen mit View-Permission; Superadmin einmal | Antragstellername und Anfrageart; Request-ID/-Typ in Metadata | aktiv | standardmäßig sinnvoll, aber Mail ohne Antragstellername |
| `membership_assigned` | erste Weiterleitung/Zuweisung | Zielprofil über Coach-Link oder Profil-E-Mail | Antragstellername; geschützte Detailroute | aktiv, mandatory | standardmäßig sinnvoll, datensparsam |
| `membership_forwarded` | erneute Weiterleitung | Zielprofil über Coach-Link oder Profil-E-Mail | Antragstellername; geschützte Detailroute | aktiv, mandatory | standardmäßig sinnvoll, datensparsam |
| `membership_processing` | Status wird `in_progress` | aktuelles Weiterleitungsziel | Antragstellername, Status | aktiv | nur Dashboard |
| `membership_completed` | Status wird `done` | Ziel oder zuständige Policy-Empfänger | Antragsteller- und gegebenenfalls Bearbeitername | aktiv, mandatory | standardmäßig sinnvoll, generisch |
| `membership_accepted` | vorbereiteter Membership-Renderer | – | Renderer und Preference vorhanden | vorbereitet | erst bei echtem Workflow neu bewerten |
| `membership_rejected` | vorbereiteter Membership-Renderer | – | Renderer und Preference vorhanden | vorbereitet | erst bei echtem Workflow neu bewerten |
| `membership_archived` | vorbereiteter Membership-Renderer | – | Renderer und Preference vorhanden | vorbereitet | erst bei echtem Workflow neu bewerten |
| `membership_payment_created` | Beitrag angelegt | Finanzrollen, bei Spielerbezug zusätzlich Teamtrainer | Spielername, Beitrags-ID | aktiv | nur Dashboard |
| `membership_payment_updated` | Beitrag/Stundung/Freistellung/Status geändert | Finanzrollen und gegebenenfalls Trainer | Spielername, Beitrags-ID | aktiv | nur Dashboard |
| `membership_payment_received` | Zahlung erfasst | Finanzrollen und gegebenenfalls Trainer | Spielername, Beitrags-ID | aktiv | nur Dashboard |
| `membership_payment_deleted` | Zahlung storniert | Finanzrollen und gegebenenfalls Trainer | Spielername, Beitrags-ID | aktiv | nur Dashboard |
| `membership_payment_confirmed` | Renderer/Preference vorhanden | – | kein aktueller Aufrufer gefunden | vorbereitet | erst bei echtem Workflow neu bewerten |
| `membership_payment_due_soon` | Scheduler 14/7 Tage vor Fälligkeit | Finanzrollen und betroffene Teamtrainer | Spielername, Fälligkeitsdatum; Stage/Jahr in Metadata | aktiv | optional |
| `membership_payment_due_today` | Scheduler am Fälligkeitstag | Finanzrollen und Teamtrainer | Spielername, Fälligkeitsdatum | aktiv | optional |
| `membership_payment_overdue` | Mutation-Renderer und Scheduler | Finanzrollen und Teamtrainer | Spielername, Fälligkeit | aktiv über Scheduler | optional, restriktiv und generisch |
| `membership_payment_partial_open` | Scheduler | Finanzrollen und Teamtrainer | Spielername und offener Status | aktiv | optional |
| `membership_payment_deferral_ending` | Scheduler | Finanzrollen und Teamtrainer | Spielername, Stundungsende | aktiv | optional |
| `member_activated` | Spielerstatus aktiviert | aktive Trainer der Mannschaftssaison | Mitgliedsname | aktiv | nur Dashboard |
| `member_deactivated` | Spielerstatus deaktiviert | aktive Trainer der Mannschaftssaison | Mitgliedsname | aktiv | nur Dashboard |
| `member_archived` | Spieler archiviert | aktive Trainer der bisherigen Mannschaftssaison | Mitgliedsname, Zugriffsverlust | aktiv | optional, generisch |
| `event_created` | Mannschaftstermin oder Trainingszeit angelegt | aktive Trainer der Mannschaftssaison | Termin-/Teamname, Datum oder Trainingszeit | aktiv | optional |
| `event_updated` | Mannschaftstermin, Trainingszeit oder Ausnahme geändert | aktive Trainer der Mannschaftssaison | Termin-/Teamname beziehungsweise Zeit/Ort | aktiv | optional |
| `event_cancelled` | Trainingszeit entfernt oder Training abgesagt | aktive Trainer der Mannschaftssaison | Team, Datum/Zeit | aktiv | standardmäßig sinnvoll für echte Absagen; Typ muss vor Umsetzung zwischen Absage und routinemäßigem Entfernen differenzierbar gerendert werden |
| `system_information` | nur Preference-Definition | – | kein aktueller Erzeuger gefunden | vorbereitet, mandatory | erst mit konkretem sicheren Ereignis aktivieren |

`contribution_reminder_dispatch` ist ausschließlich ein Audit-/Scheduler-Lauftyp und keine persönliche Dashboard-Notification. Für News wurden keine aktiven Notification-Erzeuger gefunden.

## Empfänger und E-Mail-Adressen

Allgemeine Workflow-Empfänger werden aus aktiven `admin_profiles`, aktiven Rollen und deren Permissions aufgebaut. Teamempfänger beginnen bei aktiven `coach_team_seasons`, folgen zu aktiven `coaches.admin_profile_id` und aktiven `admin_profiles` und lösen anschließend Permissions auf. Membership nutzt zusätzlich die fachliche Responsibility-Matrix. Der Actor wird entfernt und Empfänger werden nach Profil-/User-ID dedupliziert.

Die Anwendung hält die Dashboard-E-Mail-Adresse in `admin_profiles.email`. Der allgemeine Workflow-Resolver liest sie bereits. Der Teamresolver liest sie bewusst noch nicht. Die spätere zentrale Delivery-Schicht soll deshalb nach erfolgreicher Notification-Persistenz alle `recipient_user_id` gesammelt gegen aktive `admin_profiles` auflösen. Sie darf weder eine Browseradresse noch `forwarded_to_email` als Versandziel übernehmen. Leere Adressen führen zu `skipped`; deaktivierte oder fehlende Profile erhalten keine Mail. Wird ein Auth-Benutzer gelöscht, werden dessen Notifications durch den bestehenden FK gelöscht. Supabase Auth ist nicht als primäre Adressquelle nötig; vor Go-live ist jedoch die bestehende Synchronität zwischen Auth-E-Mail und `admin_profiles.email` fachlich zu bestätigen.

## Membership-Weiterleitung an Trainer

`forwardMembershipRequestAction` autorisiert zuerst den gespeicherten Request und den Request-Scope. `resolveForwardTarget` akzeptiert nur `coach` oder `board` und eine UUID, lädt das aktive Ziel serverseitig und persistiert dessen Snapshotfelder. Nach erfolgreicher Weiterleitung erzeugt der Workflow-Service beim ersten Ziel `membership_assigned`, bei einem bereits vorhandenen Ziel `membership_forwarded`. Für Coaches wird `coaches.admin_profile_id` geladen; zusätzlich kann die normalisierte, serverseitig geladene Zieladresse einem aktiven Adminprofil zugeordnet werden. Der Trainer erhält heute eine Dashboard-Notification mit dem Namen des Antragstellers und einer geschützten Route. Die spätere Mail soll dagegen nur mitteilen, dass eine Mitgliedsanfrage im Dashboard zur Bearbeitung vorliegt, und auf den Login beziehungsweise eine sichere Dashboard-Basis-URL verweisen.

## Empfohlene Multi-Channel-Struktur

```text
autorisierte Fachaktion
  → domänenspezifischer Notification-Builder
  → zentrale Empfängerauflösung
  → persistierte Notification (kanonische Empfänger-/Ereignis-ID)
  → zentraler Notification-Delivery-Coordinator
      → explizite Channel-Policy/Allowlist je Notification-Typ
      → aktive Empfängeradresse serverseitig laden
      → typspezifisches, datensparsames Mail-View-Model rendern
      → Delivery im Ledger reservieren
      → zentraler Mail-Service
      → Provider-Abstraktion (heute Resend, später SMTP möglich)
      → Delivery-Zustand und sanitisiertes Audit aktualisieren
```

Die Fachservices behalten ihren einen Notification-Aufruf. Der Coordinator verarbeitet ausschließlich `result.data`, also neu persistierte Zeilen, und darf seine Fehler nicht hochwerfen. Fachaktion und Dashboard-Notification bleiben erfolgreich, wenn Adresse, Renderer, Provider oder Ledger fehlschlagen. Direkte Resend-Aufrufe außerhalb des bestehenden Adapters bleiben verboten.

### Channel-Policy und Renderer

Eine zentrale Registry soll pro Typ mindestens `email.mode` (`default`, `optional`, `disabled`), Template-Key und erlaubte Maildaten definieren. Unbekannte Typen sind immer `disabled`. Der Mail-Renderer erhält kein ungefiltertes `metadata` und übernimmt weder Dashboard-Message noch `target_url` automatisch. Er erzeugt ein providerneutrales Mailmodell aus Typ und einer kleinen serverseitigen Allowlist. Links werden aus einer vertrauenswürdigen serverseitigen Basis-URL und einer freigegebenen Route erzeugt; technische IDs erscheinen weder im sichtbaren Text noch im Querystring einer Mail, sofern nicht zwingend erforderlich.

### Preferences

Heute wird `in_app_enabled` vor dem Insert ausgewertet. Dadurch existiert bei deaktivierter Dashboard-Preference keine Notification-ID, an die eine unabhängige Mailpräferenz gebunden werden könnte. Für wirklich unabhängige Kanäle sollte die spätere Implementierung die berechtigte Empfänger-Notification als kanonische Zeile persistieren und `in_app_enabled` bei der Inbox-Ausgabe beziehungsweise In-App-Delivery berücksichtigen. Eine spätere additive Preference `email_enabled` kann der Coordinator getrennt auswerten. Mandatory-Typen und sichere Defaults bleiben zentral definiert. Diese Umstellung benötigt besondere Regressionstests, darf aber keine neuen Clientrechte erzeugen.

## Datenschutzgrenze

Aktuelle Dashboard-Texte enthalten je nach Typ Personenname, Team/Saison, Rolle, Terminname/-datum, Trainingszeit/-ort oder Beitragskontext. Metadata enthält außerdem interne Entity-, Team-, Saison-, Beitrags- und Request-IDs, Zustandsflags, Zeitpunkte und Idempotenzschlüssel. Diese Daten bleiben im geschützten Dashboard.

Eine Notification-Mail darf typischerweise nur enthalten: neutralen Betreff, generische Ereigniskategorie, Handlungsaufforderung, sicheren Dashboard-/Login-Link sowie später das zentrale Vereinslayout. Nicht enthalten sein sollen Antragsteller-, Spieler- oder Mitgliedsname, Geburtsdatum, Telefon, Anschrift, Freitext, Zahlungsbetrag/-status im Detail, interne Notizen, Entity-/Responsibility-/Profil-IDs, rohe Metadata, interner Idempotenzschlüssel oder ungeprüfte Zielroute.

Resend erhält bei einer Mail zusätzlich mindestens Empfängeradresse, Absender, Betreff, Text/HTML, technischen Provider-Idempotenzwert sowie transportbedingte Metadaten und Zustellstatus. Durch generische Templates erhält Resend keine fachlichen Personendetails aus der Notification. Tracking bleibt deaktiviert beziehungsweise wird nicht ergänzt.

## Idempotenz und Fehlerbehandlung

- Der stabile Provider-Schlüssel wird kanalbezogen als `notification-email/<notification-id>` aus den kanonischen Spalten abgeleitet und nicht redundant gespeichert.
- `UNIQUE (notification_id, channel)` verhindert mehr als eine Delivery-Identität.
- Ein atomarer Claim wechselt `pending`/retryfähiges `failed` nach `sending`; parallele Worker dürfen denselben Datensatz nicht beanspruchen.
- `attempt_count`, `locked_at`, `next_attempt_at`, `sent_at` und eine sanitiserte Fehlerklasse ermöglichen kontrollierte Zustände, ohne Providerantwort oder Mailinhalt zu speichern.
- Der bestehende Mail-Service erhält denselben stabilen Schlüssel. Resend kann ihn als Provider-Idempotenz nutzen; das Ledger macht die Garantie vom Provider unabhängig.
- `notification_audit` bleibt das append-only Monitoring. Es darf nicht als veränderlicher Zustandsautomat missbraucht werden.
- D4 implementiert keinen Retry. Ein späterer Dispatcher benötigt Begrenzung, Backoff, stale-lock-Regel, maximale Versuche und explizite Freigabe.

## Datenbankentscheidung und SQL-Sicherheitsverfahren

Für einen einmaligen synchronen Best-Effort-Versuch wäre technisch keine neue Tabelle nötig. Dieser Minimalweg erfüllt jedoch weder providerneutrale Konkurrenzkontrolle noch einen sauberen späteren Retry. Für das ausdrücklich gewünschte zentrale, erweiterbare Zielbild ist `notification_deliveries` deshalb sinnvoll und vor dem Implementierungsblock erforderlich.

In D4 vorbereitet und vor D5 manuell ausgeführt beziehungsweise geprüft:

1. `b15-21d4-notification-email-delivery-preflight-readonly.sql`
2. `b15-21d4-notification-email-delivery-proposal.sql`
3. `b15-21d4-notification-email-delivery-rollback.sql`
4. `b15-21d4-notification-email-delivery-postcheck-readonly.sql`

Das Proposal aktiviert RLS, erzeugt keine Browserpolicy, entzieht `PUBLIC`, `anon` und `authenticated` alle Tabellenrechte und belässt ausschließlich `service_role` mit Zugriff. Es erzeugt keine zweite Notification- oder Auditarchitektur; das Ledger speichert nur kanalbezogenen Betriebszustand. `recipient_user_id` und ein separater Idempotenztext werden bewusst nicht dupliziert: Empfänger und Provider-Schlüssel werden aus der referenzierten Notification beziehungsweise aus `notification_id + channel` abgeleitet. Das vermeidet widersprüchliche Wahrheiten. Der D4.1-Live-Preflight wurde manuell erfolgreich geprüft; anschließend wurden Proposal und Postcheck vor Beginn von D5 manuell erfolgreich ausgeführt.

## Historischer Implementierungsplan (durch D5 umgesetzt)

- neue server-only Delivery-Policy/Registry und reine Tests
- neue typspezifische, datensparsame Notification-Mail-Renderer und Tests
- server-only Empfänger-Repository für aktive `admin_profiles.email`
- Delivery-Repository/Service mit atomarem Claim und Zustandsübergängen
- zentraler Coordinator, aufgerufen nur vom Notification-Service nach erfolgreichem Insert
- Erweiterung des Audit-Loggers um streng allowlistete E-Mail-Delivery-Fehlerklassen
- Beibehaltung der getrennten In-App-Preference-Auswertung
- keine Änderung der Fachservices außer gegebenenfalls unvermeidbaren Rückgabe-/Fehlerprotokollierungsanpassungen am zentralen Notification-Aufruf

Erforderliche Tests: vollständiges Typinventar, Default-deny unbekannter Typen, Renderer-Datensparsamkeit, keine rohe Metadata/Route/ID im Mailmodell, serverseitige Adressauflösung, inaktive/fehlende Profile, kein Browserempfänger, erfolgreiche Dashboard-Persistenz vor Mail, Mailfehler ohne Fachrollback, genau ein Claim bei Parallelität, stabiler Schlüssel, Retry ohne Doppelmail, Providerwechsel, Preference-Trennung, Audit-Sanitisierung, keine Clientimports/Secrets sowie Regression aller bestehenden Notification-Erzeuger, Scheduler und Membership-D1-Mail.

## B15.21D5 – Implementierter Stand

Das D4-Proposal und der Postcheck wurden vor D5 manuell erfolgreich ausgeführt. D5 implementiert die zentrale Ausleitung in allen drei Notification-Persistenzpfaden. Der Hook läuft ausschließlich für neu gespeicherte Rohzeilen und bleibt über `Promise.allSettled` sowie sanitisiertes Fehlerlogging Best-Effort.

Initial freigegeben sind exakt `membership_created`, `membership_assigned`, `membership_forwarded`, `membership_completed`, `trainer_assigned`, `trainer_removed` und `trainer_changed`. Unbekannte und alle übrigen Typen sind Default-deny und werden im Ledger `skipped`. Trainingsabsagen bleiben deaktiviert, weil `event_cancelled` im Bestand nicht eindeutig zwischen Absage und gewöhnlichem Entfernen unterscheidet.

Der Ledger-Claim verwendet ein einzelnes konditionales `UPDATE … RETURNING`: `id`, Ausgangsstatus, `attempt_count`, leeres `locked_at` und `next_attempt_at` werden gemeinsam geprüft, während `sending`, Lock und erhöhter Versuchszähler gesetzt werden. Dieses Compare-and-Swap verhindert parallele Gewinner ohne weitere Datenbankfunktion. Ein Fehler wird sanitisiert, entsperrt und mit exponentieller nächster Fälligkeit gespeichert; ein automatischer Retry-Worker ist nicht Bestandteil von D5.

Der Renderer übernimmt keine gespeicherten Dashboardtexte oder Metadata. Die Adresse stammt nur aus dem aktiven `admin_profiles`-Datensatz der `recipient_user_id`; der optionale Link wird aus `NEXT_PUBLIC_SITE_URL` ausschließlich auf die allgemeine Route `/admin` normalisiert. Die bestehende Mail-Service-/Provider-Grenze bleibt unverändert. Vor dem ersten realen Notification-Mail-Test wurde gestoppt.

## B15.21D6 – Reale Verifikation

Der erste kontrollierte reale Test über den aktuellen D5-Dev-Server war erfolgreich. Eine echte Membership-Weiterleitung durch einen vom Ziel verschiedenen Admin erzeugte genau eine `membership_forwarded`-Notification und genau eine Ledgerzeile für den Kanal `email`. Read-only bestätigt wurden `sent`, `attempt_count = 1`, ein gesetztes `sent_at`, ein leeres `locked_at`, `provider_key = resend`, eine vorhandene Provider-Message-ID und `last_error_class = NULL`. Es existierten weder eine zweite Delivery noch offene `pending`-, `sending`- oder `failed`-Zustände; auch die Notification-Idempotenz zeigte keine Duplikatgruppe. Resend-Dashboard und Postfacheingang wurden durch den Benutzer bestätigt.

Der technische Providername in `provider_key` ist vom stabilen Provider-Idempotency-Key zu unterscheiden. Letzterer wird aus der Notification-ID als `notification-email/<notification-id>` erzeugt und vom zentralen Mailpfad als `Idempotency-Key` an Resend übergeben, aber nicht als redundante Ledgerwahrheit gespeichert.

Der Linktest bleibt eine Go-live-Aufgabe: Die lokale Basis-/Tunnel-URL zeigte während D6 auf Port 3000, der kontrollierte Workflow lief auf Port 3001. Das beeinträchtigte weder Versand noch Zustellung. Vor Produktion muss `NEXT_PUBLIC_SITE_URL` auf die finale Vereinsdomain gesetzt und der daraus normalisierte `/admin`-Link in der Deploymentumgebung geprüft werden. In D6 wurde keine Konfiguration geändert und kein Retry ausgelöst.

## B15.21D8 – Historisch geplante, durch D9 umgesetzte globale Policy-Schicht

D8 plant oberhalb der bestehenden D5-Registry eine service-role-only, global durch Superadmins steuerbare Policy. `notification_email_settings` hält explizite Freigaben pro produktivem Typ; ein getrenntes Singleton `notification_email_global_settings` stellt einen zunächst deaktivierten Import-/Go-live-/Not-Aus-Schalter bereit. Fehlende Zeilen und Lookupfehler bleiben default-deny. Die sichere Renderer-Registry bleibt ein unabhängiger zweiter Gurt: Datenbankfreigabe ohne expliziten datensparsamen Renderer darf keinen Versand ermöglichen.

Die Prüfung bleibt im zentralen Coordinator. Deaktivierte Entscheidungen erzeugen weiterhin terminale `skipped`-Ledgerzeilen und werden nie rückwirkend versendet. `notification_preferences.in_app_enabled` wird nicht zweckentfremdet. Persönliche E-Mail-Schalter pro Benutzer sind nach Abschluss von D10 bewusst nicht vorgesehen; die globale Type-Entscheidung verbleibt beim Superadmin. Architektur, initiale 16/11-Auswahl und SQL-Artefakte sind in [`b15-21d8-global-notification-email-settings-architecture.md`](b15-21d8-global-notification-email-settings-architecture.md) dokumentiert.

D9 hat diese Policy-Schicht implementiert. Der Coordinator lädt die globale und typbezogene Policy gesammelt vor Empfängerauflösung und Provideraufruf; Lookupfehler, Master AUS, Type AUS und fehlender Renderer sind getrennte sanitiserte `skipped`-Gründe. Die Renderer-Registry umfasst nun die 16 empfohlen aktiven Typen. Der globale Master blieb bei der Implementierung AUS, es wurde keine Mail versendet und kein bestehender Ledgerzustand reaktiviert.
