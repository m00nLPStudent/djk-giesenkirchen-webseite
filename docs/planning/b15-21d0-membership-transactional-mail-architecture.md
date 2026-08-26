# B15.21D0 – Transaktionale Membership-Mails

Stand: 26. August 2026. D0 war ausschließlich Analyse und Architekturplanung. B15.21D1 hat die geplante Architektur anschließend im Anwendungscode umgesetzt; Providerkonto, Secrets, Versanddomain und erster Versand bleiben weiterhin manuelle Folgeschritte.

## Nachgewiesener Bestand

Admin-Einladungen laufen vom Benutzereditor über `saveAdminUserAction`, `createAdminUserWithInvite` und `inviteAdminAuthUser` zur server-only Supabase-Admin-API `auth.admin.inviteUserByEmail`. Der Service-Role-Client übergibt die mit `ADMIN_AUTH_REDIRECT_URL` beziehungsweise `NEXT_PUBLIC_SITE_URL` gebildete Route `/admin/set-password`. Erzeugung, Template und Zustellung der Auth-Mail liegen danach bei Supabase Auth und dessen im Projekt konfiguriertem Mailtransport. Das Repository kann nicht nachweisen, ob im Supabase-Dashboard Custom SMTP aktiviert ist.

Passwort-Reset-Mails werden an zwei Stellen mit dem normalen Browser-Client direkt über `auth.resetPasswordForEmail` angestoßen: auf `/admin/forgot-password` mit der eingegebenen Adresse und im eigenen Profil mit der Adresse aus der Auth-/Profil-Session. `generateLink` und `signInWithOtp` werden nicht verwendet. Die Zielseite tauscht den Code gegen eine Session beziehungsweise verarbeitet Legacy-Hash-Tokens und setzt anschließend das Passwort über `auth.updateUser`.

Normale Vereinsmails sind nicht implementiert. `src/lib/membership/membership.mail.js` ist ein erfolgreicher No-op mit TODO für Resend oder SMTP. `submitMembershipRequest` ruft ihn zwar nach dem Datenbank-Insert auf, doch aktuell verlässt keine Mail das System. Es existieren weder Mailprovider-SDK noch SMTP-Client, Mailtemplate-System oder Provider-Abstraktion.

Vorhandene Supabase-Clients sind der browserfähige Anon-Client, der cookiegebundene Server-Action-Client und der mit `server-only` geschützte Service-Role-Client. Unter `supabase/` liegen nur drei SQL-Migrationen; es gibt kein `supabase/functions`-Verzeichnis und damit keine Edge Function im Repository. Auth Hooks und Webhooks sind ebenfalls nicht im Repository konfiguriert. `pg_cron`, `pg_net` und Vault werden nur durch die getrennte Contribution-Reminder-SQL-Planung referenziert; sie sind kein Mailpfad.

Im Repository nachgewiesene relevante Variablennamen sind `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`, `ADMIN_AUTH_REDIRECT_URL` und `CONTRIBUTION_REMINDER_CRON_SECRET`. Es existiert noch keine Mailprovider-Variable. Werte wurden nicht inventarisiert oder dokumentiert.

## Trennung der Mailarten

Auth-Mails bleiben Aufgabe von Supabase Auth: Admin-Einladung, Passwort setzen/zurücksetzen und mögliche spätere Magic Links. Für den produktiven Betrieb muss Supabase Auth einen geeigneten Custom-SMTP-Transport erhalten; der eingebaute Transport ist laut Supabase nur für eingeschränkte Tests gedacht.

Vereinsmails sind eigenständige transaktionale Fachmails: Eingangsbestätigungen, spätere Statusmails und Beitragsinformationen. Sie dürfen weder Auth-Benutzer erzeugen noch Auth-Mailtemplates oder Auth-Endpunkte zweckentfremden.

## Variantenbewertung

| Variante | Bewertung für dieses Projekt |
| --- | --- |
| A – Supabase Auth Built-in | Nur für Auth-Mailtests. Keine passende Fachmail-API und nicht als produktiver allgemeiner Mailtransport vorgesehen. |
| B – Supabase Auth + Custom SMTP | Richtige Produktivlösung für bestehende Auth-Mails, aber keine Architektur für Membership-Fachmails. |
| C – Edge Function + Provider | Technisch möglich, erzeugt hier aber einen zweiten Runtime-, Deployment-, Secret- und Monitoringpfad ohne fachlichen Nutzen. |
| D – direkter Vereins-SMTP | Später als Provider-Adapter möglich. Aktuell fehlen nachweislich Serverdaten, Zugangsdaten, Zustellstatus und Betriebsverantwortung. |
| E – Next.js-Server + Provider | Empfohlen. Passt zum vorhandenen server-only Submit, hält Fachlogik providerunabhängig und benötigt keine Edge Function. |

## In D1 umgesetzte Zielarchitektur

```text
Public Server Action
  -> Membership-Validierung
  -> Service-Role-Insert
  -> interne Notification (best effort)
  -> Membership-Mail-Use-Case
       -> zentrales Mail-Template
       -> zentraler Mail-Service
       -> konfigurierter Provider-Adapter
  -> erfolgreicher Browser-Response unabhängig vom Mailergebnis
```

Die frühere No-op-Aufrufposition innerhalb von `membership.service.js` wurde entfernt. Die bestehende Server Action orchestriert die Eingangsbestätigung nach Insert und interner Notification. Der Empfänger stammt aus dem erfolgreichen `INSERT ... RETURNING`-Datensatz, niemals aus einem separaten Browserfeld oder einer Browser-Empfängerliste.

Umgesetzte Struktur:

- `src/lib/mail/mail.service.js`: server-only Schnittstelle, Validierung und datensparsames Fehlerlogging.
- `src/lib/mail/mail.provider.js`: providerneutrale Auswahl über `MAIL_PROVIDER`.
- `src/lib/mail/mail.core.mjs`: Normalisierung, HTML-Escaping, Headerhärtung und Idempotenzschlüssel.
- `src/lib/mail/providers/resend.provider.js`: einziger serverseitiger Zugriff auf Resend-Konfiguration.
- `src/lib/mail/providers/resend.provider.core.mjs`: testbarer HTTP-Adapter mit normalisierten Ergebnissen.
- `src/lib/mail/templates/membershipRequestReceived.mjs`: providerfreier Betreff sowie Text- und HTML-Version.
- `src/lib/membership/membership.mail.js`: server-only Membership-Adapter.
- `src/lib/membership/membershipMail.core.mjs`: Versand-, Retry- und `mail_sent_at`-Ablauf.

Der vorläufige Resend-Adapter verwendet `fetch`; es wurde keine neue Dependency aufgenommen. Membership und Template importieren weder Resend noch Providerkonfiguration. Ein späterer SMTP-Adapter kann denselben `sendMail`-Vertrag erfüllen.

## Inhalt und Datenschutz

Minimaler Mailinhalt: Begrüßung mit Vorname oder Name, Bestätigung des Eingangs, verständliche Anfrageart, neutraler Hinweis zur weiteren Bearbeitung und Vereins-Absender/Reply-To. Geburtsdatum, Telefon, Anschrift, Freitext, interne Notizen, Weiterleitungsdaten und technische IDs gehören nicht in den Nachrichtentext.

Ein externer Provider verarbeitet technisch mindestens Empfängeradresse, Absenderadresse/-name, Betreff, Text/HTML, Versandzeitpunkt, Provider-Message-ID und Zustell-/Fehlertelemetrie; bei personalisierter Anrede zusätzlich den Namen. Je nach Provider entstehen IP-/Request-Metadaten und zeitweise Inhalts-/Eventlogs. Vor Go-live sind AV-Vertrag/DPA, Unterauftragsverarbeiter, Verarbeitungsregion, Aufbewahrung, Löschung, Tracking und Domainkonfiguration datenschutzrechtlich zu prüfen. Open-/Click-Tracking sollte für diese Bestätigung deaktiviert bleiben.

Logs enthalten nur technische Klasse, Vorgangstyp und gegebenenfalls Request-ID beziehungsweise gehashte/gekürzte Korrelation; niemals Adresse, Name, Mailtext, Provider-Key oder vollständige Providerantwort. Browserantworten enthalten keine Providerdetails.

## Idempotenz und Fehlervertrag

`membership_requests.mail_sent_at` ist bereits vorhanden, nullable und aktuell unbenutzt. D1 benötigt deshalb keine neue Tabelle und voraussichtlich keine Migration.

Der stabile Schlüssel lautet beispielsweise `membership-request-received/<membership-request-id>`. Ablauf:

1. Bei gesetztem `mail_sent_at` nicht erneut senden.
2. Provider mit exakt demselben Idempotenzschlüssel und deterministischem Payload aufrufen.
3. Nur nach erfolgreicher beziehungsweise providerseitig als bereits erfolgreich deduplizierter Antwort `mail_sent_at` serverseitig setzen.
4. Timeout/temporären Fehler kontrolliert als Mailfehler behandeln; die gespeicherte Anfrage und der erfolgreiche Browserstatus bleiben bestehen.
5. Ein Retry verwendet denselben Schlüssel. Providerseitige Idempotenz schließt das Crashfenster zwischen Versand und `mail_sent_at`-Update innerhalb der Providerfrist.

Eine absolute Exactly-once-Garantie ist bei einem externen System ohne transaktionales Outbox-/Queue-Modell nicht möglich. Für D1 ist die Kombination aus bestehendem Erfolgszeitstempel und providerseitigem Idempotenzschlüssel minimal-invasiv. Falls später zeitlich unbegrenzte automatische Retries, Webhookzustände oder mehrere Mailtypen pro Anfrage erforderlich werden, ist dafür ein eigener, gesondert freizugebender Outbox-Block zu planen und nicht vorwegzunehmen.

## Provider- und Supabase-Schritte für D1

Vor dem ersten Versand sind Providerkonto und Datenschutzvertrag zu bestätigen. Danach Domain/DNS-Absender authentifizieren und `MAIL_PROVIDER`, `MAIL_FROM`, optional `MAIL_REPLY_TO` sowie für den vorbereiteten Adapter `RESEND_API_KEY` als Hosting-Secrets anlegen. Keine Variable darf `NEXT_PUBLIC_` tragen. Tracking bleibt deaktiviert; Sandbox/Testempfänger, Bounce-/Complaint-Verhalten und Limits sind vor Produktion zu prüfen. Solange Providername, Key oder Absender fehlen, liefert die zentrale Schicht kontrolliert `skipped`, setzt `mail_sent_at` nicht und verändert den erfolgreichen Membership-Submit nicht.

Unabhängig von D1 sollte vor Go-live für Supabase-Auth-Mails separat Custom SMTP eingerichtet und mit Einladung sowie beiden Resetpfaden getestet werden. D1 selbst benötigt keine RLS-, Grant-, Policy-, Cron-, Vault-, Hook- oder Edge-Function-Änderung.

## D2 – lokale Testvorbereitung

Die lokale, von Git ignorierte `.env.local` ist für den späteren ersten Test mit `MAIL_PROVIDER`, `MAIL_FROM` und einem manuell zu ersetzenden Platzhalter für `RESEND_API_KEY` vorbereitet. `MAIL_REPLY_TO` ist im Adapter optional und bleibt beim ersten Test ungesetzt. Der Testabsender verwendet vorübergehend Resends `onboarding@resend.dev`; ohne eigene verifizierte Domain darf damit nur an die E-Mail-Adresse des Resend-Kontos gesendet werden. Der echte API-Key wird ausschließlich vom Benutzer lokal eingetragen. D2 führt keinen Resend-Aufruf und keinen Mailversand aus.

## D1-Testvertrag

- Template und Anfrageart sind korrekt und enthalten keine ausgeschlossenen Daten.
- Empfänger stammt aus dem serverseitig normalisierten/persistierten Datensatz.
- Kein Provider-Key oder Providerimport erreicht einen Client-Bundle-Pfad.
- Reihenfolge ist Insert, interne Notification, Mailversuch.
- Insertfehler verhindert Mailversand; Notification- oder Mailfehler erzeugt keinen zweiten Insert.
- Erfolgreicher Versand setzt `mail_sent_at`; gesetzter Zeitstempel unterdrückt Wiederholung.
- Retry und paralleler identischer Aufruf verwenden denselben Idempotenzschlüssel und denselben Payload.
- Providerfehler und Timeout liefern weiterhin einen erfolgreichen Public-Submit ohne personenbezogene Logs.
- Fehlende Mailkonfiguration scheitert kontrolliert und best effort.
- B15.21A–C2, RLS/Grants, Responsibility und interne Notifications bleiben unverändert.

## Risiken

Fehlkonfigurierte Secrets oder Absenderdomain, unzureichende Zustellbarkeit, Provider-Lock-in außerhalb des Adapters, personenbezogene Providerlogs, versehentliches Tracking, Header-/HTML-Injection aus Formulardaten, Enumeration oder Providerfehler im Browser, doppelte Mails durch instabile Schlüssel, verlorene Bestätigung durch zu frühes Markieren sowie fälschliche Wiederholung des Membership-Submits. Diese Risiken sind durch server-only Adapter, feste Templates mit Escaping, minimales DTO, stabiles Idempotenzschema, Markierung erst nach Erfolg und best-effort Orchestrierung zu begrenzen.
