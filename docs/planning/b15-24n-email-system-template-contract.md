# B15.24N – E-Mail-System und Template-Vertrag

Status: **COMPLETE**

## Zweck und Grenzen

B15.24N inventarisiert die vorhandenen E-Mail-Wege und vereinheitlicht ausschließlich die HTML-Darstellung der anwendungseigenen Transaktionsmails. Versandprovider, Trigger, Empfängerermittlung, Idempotenz, Notification-Policy, Auth-Flows, Datenbank und SQL bleiben unverändert. In diesem Block wurde keine E-Mail versendet und keine externe Konfiguration verändert.

## Vollständiges As-built-Inventar

| Familie | Auslöser | Transport/Eigentümer | Renderer/Quelle | Empfänger und Inhalt | Status |
| --- | --- | --- | --- | --- | --- |
| Admin-Einladung | Benutzerverwaltung | Supabase Auth `inviteUserByEmail`; Auth-Template im Supabase Dashboard; Custom SMTP ist extern konfiguriert | kein App-HTML-Template | eingeladene Adresse; Set-Password-Link über den zentralen Auth-Redirectvertrag | live verifiziert; Dashboard-Template derzeit englisch |
| Passwort-Recovery | Forgot-Password und Profilaktion | Supabase Auth `resetPasswordForEmail`; Auth-Template im Supabase Dashboard | kein App-HTML-Template | angeforderte Adresse; Callback und `/admin/set-password` über validierte Browser-/Site-Origin | live verifiziert |
| Signup-Bestätigung | kein produktiver Signup-Aufrufer vorhanden | Supabase Auth, falls künftig aktiviert | externes Dashboard-Template | derzeit kein aktiver App-Flow | nicht aktiv |
| Magic Link / OTP | kein produktiver Aufrufer vorhanden | Supabase Auth, falls künftig aktiviert | externes Dashboard-Template | derzeit kein aktiver App-Flow | nicht aktiv |
| Native Auth-E-Mail-Änderung | technisch durch B15.23E-Guard gesperrt | kein Versandweg | kein Template | bestätigter Admin-Workflow muss verwendet werden | fail-closed |
| Admin-E-Mail-Wechsel: Warnung | Anforderung in B15.23E | zentraler server-only Mail-Service → konfigurierter Provider | `adminEmailChange.mjs` | alte Adresse; Betreff „Änderung deiner Login-E-Mail-Adresse angefordert“; Text/HTML; kein Link | live Kernfluss verifiziert |
| Admin-E-Mail-Wechsel: Bestätigung | Anforderung in B15.23E | zentraler server-only Mail-Service → konfigurierter Provider | `adminEmailChange.mjs` | neue Adresse; Betreff „Neue Login-E-Mail-Adresse bestätigen“; Text/HTML; serverseitig erzeugter Bestätigungslink | live Kernfluss verifiziert |
| Admin-E-Mail-Wechsel: Abschluss alt | bestätigter Abschluss in B15.23E | zentraler server-only Mail-Service → konfigurierter Provider | `adminEmailChange.mjs` | alte Adresse; Betreff „Login-E-Mail-Adresse wurde geändert“; Text/HTML; kein Link | live Kernfluss verifiziert |
| Admin-E-Mail-Wechsel: Abschluss neu | bestätigter Abschluss in B15.23E | zentraler server-only Mail-Service → konfigurierter Provider | `adminEmailChange.mjs` | neue Adresse; Betreff „Login-E-Mail-Adresse erfolgreich geändert“; Text/HTML; kein Link | live Kernfluss verifiziert |
| Membership-Eingangsbestätigung | erfolgreicher öffentlicher Submit | zentraler server-only Mail-Service → konfigurierter Provider | `membershipRequestReceived.mjs` | anfragende Person; Betreff „Deine Mitgliedsanfrage beim DJK/VfL Giesenkirchen“; Text/HTML; kein Link; Name und Anfrageart, keine internen Workflowdaten | live verifiziert; `mail_sent_at` und Idempotenz bleiben erhalten |
| Dashboard-Notification-Mail | neu persistierte Notification, globale und typspezifische Freigabe | Notification-Delivery-Ledger → zentraler server-only Mail-Service | `notificationEmailDelivery.core.mjs` | aktive Profiladresse; Betreff „Neue Benachrichtigung im Vereinsdashboard“; Text/HTML; generischer datensparsamer Ereignishinweis und `/admin`-Link | 16 Renderer freigegeben; erster Realtest bestanden |
| Beitragsreminder | geschützter Scheduler-Endpunkt, nur im Geschäftsfenster | erzeugt Notifications; E-Mail danach ausschließlich über obigen Notification-Weg | kein separates Mailtemplate | Trainer-/Finanzempfänger nach bestehender Scope- und Preference-Logik | vorbereitet; Cron-Aktivierung bleibt Go-live-Aufgabe |

Der anwendungseigene Mail-Service ist providerneutral. Aktuell ist ausschließlich der Resend-Adapter implementiert. Er benötigt serverseitig `MAIL_PROVIDER`, `RESEND_API_KEY`, `MAIL_FROM` und optional `MAIL_REPLY_TO`. Fehlende oder unbekannte Providerkonfiguration läuft kontrolliert in `skipped`/Fehlerzustände; Secrets und Empfänger werden nicht protokolliert. Auth-Mails bleiben davon getrennt und gehören Supabase Auth beziehungsweise dessen externer SMTP-Konfiguration.

Damit existieren acht aktive Versandflüsse: zwei Supabase-Auth-Flüsse, vier Zustände des bestätigten Admin-E-Mail-Wechsels, eine Membership-Bestätigung und eine generische Notification-Mailfamilie. Der Beitragsreminder ist ein neunter vorbereiteter Triggerpfad, aber keine eigene Mailfamilie: Er erzeugt Notifications und kann nur über den bestehenden, global freigegebenen Delivery-Vertrag eine der unterstützten Beitrags-Notification-Mails auslösen. Kontaktformular-, Beitragsrechnungs-, Mahnungs-, Annahme-/Ablehnungs- oder sonstige frei stehende Systemmail-Renderer existieren nicht.

## Zentraler eigener Template-Vertrag

`src/lib/mail/templates/clubMailLayout.mjs` ist der kleine gemeinsame, providerneutrale HTML-Vertrag für alle eigenen Mails:

- tabellenbasiertes, maximal 640 Pixel breites und mobil skalierbares Layout mit Inline-Stilen;
- einheitlicher textlicher Vereinskopf in Anthrazit/Rot/Weiß;
- konsistente Überschrift, Inhaltsabsätze, optionale CTA und neutraler Systemfooter;
- konsequentes HTML-Escaping aller dynamischen Texte;
- CTA nur für HTTPS oder HTTP-Loopback ohne Credentials; ungültige URLs werden fail-closed nicht gerendert;
- jede Mail behält eine eigenständige Textversion;
- keine Trackingelemente, externen Schriften, Remote-Pixel oder neue Abhängigkeit.

Das auf der Website tatsächlich verwendete Vereinslogo wurde unverändert als `public/images/club-logo.png` übernommen. In Mails wird es nicht über den bisherigen Storage-Host, sondern ausschließlich als absolute URL `<validierte Site-Origin>/images/club-logo.png` referenziert. Die Site-Origin folgt dem bestehenden `normalizePublicSiteUrl`-Vertrag: HTTPS oder HTTP-Loopback, keine Credentials, Pfade, Query oder Fragmente. Fehlt sie, bleiben Logo, Impressum und Datenschutz ohne kaputte Platzhalter vollständig aus dem HTML entfernt. Das Logo besitzt den Alttext „Logo der DJK/VfL Giesenkirchen 05/09 e.V.“ sowie feste 88 × 88 Pixel für stabile Mailclient-Geometrie.

Membership-, Admin-E-Mail-Wechsel- und Notification-Renderer verwenden diesen Vertrag. Betreff, fachlicher Text, Empfänger, Trigger, Zustandsübergänge und Idempotenz wurden nicht verändert. Das tatsächlich verwendete Vereinslogo ist eingebunden. Anschrift, vertretungsberechtigte Angaben, endgültige Kontakt- und Social-Media-Daten wurden bewusst nicht erfunden und dürfen erst nach Betreiberfreigabe ergänzt werden.

## Links, Sicherheit und Datenschutz

- Auth-Redirects bleiben im bestehenden zentralen, allowlist-/origin-validierten Auth-Vertrag.
- Eigene Notification-Links entstehen aus einer validierten `NEXT_PUBLIC_SITE_URL` und führen normalisiert nach `/admin`.
- E-Mail-Wechsel-CTAs erhalten ausschließlich die serverseitig erzeugte Bestätigungs-URL; unsichere Schemes, Credentials und öffentliches HTTP werden nicht ausgegeben.
- Text und HTML enthalten keine Provider-IDs, API-Keys, Passwörter, Notification-Metadaten, internen IDs oder vollständigen Membership-Payloads.
- Providerfehler und Logs bleiben sanitisiert; der neue Renderer besitzt keinen Netzwerk- oder Datenbankzugriff.

## Externe Auth-Templates und manueller Review

Supabase-Auth-Templates liegen außerhalb des Repositorys und werden nicht aus diesem Repository deployed. Produktiv aufgerufen werden ausschließlich **Invite user** durch `inviteUserByEmail` und **Reset password** durch `resetPasswordForEmail`. Signup-Confirmation, Magic Link/OTP und native Change-Email sind keine aktiven Produktflows.

Die verwendeten Platzhalter sind laut offizieller Supabase-Template-Dokumentation unterstützt:

- `{{ .ConfirmationURL }}` ist die vollständige, von Supabase erzeugte Bestätigungs-URL einschließlich des zum jeweiligen Invite-/Recovery-Flow gehörenden Redirects. Nur sie darf für den Auth-CTA verwendet werden.
- `{{ .SiteURL }}` ist die im Supabase-Dashboard konfigurierte Site URL. Sie wird hier nur für Logo, Impressum und Datenschutz verwendet; vor dem Produktivreview muss sie auf die freigegebene HTTPS-Vereinsdomain zeigen.

Keine Token-, TokenHash-, E-Mail- oder Metadatenvariable wird im sichtbaren Text ausgegeben.

### Invite user – deutscher Vorschlag

Subject:

```text
Einladung zum Vereinsdashboard der DJK/VfL Giesenkirchen
```

HTML Body:

```html
<!doctype html>
<html lang="de">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;color:#18181b;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#f4f4f5;">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:640px;background:#ffffff;border:1px solid #e4e4e7;border-radius:16px;overflow:hidden;">
        <tr><td align="center" style="padding:22px 24px;background:#18181b;border-bottom:4px solid #dc2626;">
          <img src="{{ .SiteURL }}/images/club-logo.png" width="88" height="88" alt="Logo der DJK/VfL Giesenkirchen 05/09 e.V." style="display:block;width:88px;height:88px;margin:0 auto 14px;object-fit:contain;border:0;">
          <p style="margin:0;color:#ffffff;font-size:15px;font-weight:700;line-height:1.4;">DJK/VfL Giesenkirchen 05/09 e.V.</p>
        </td></tr>
        <tr><td style="padding:28px 24px;">
          <h1 style="margin:0 0 20px;color:#18181b;font-size:24px;line-height:1.25;">Einladung zum Vereinsdashboard</h1>
          <p style="margin:0 0 16px;color:#27272a;font-size:16px;line-height:1.6;">Du wurdest eingeladen, einen Zugang zum Vereinsdashboard der DJK/VfL Giesenkirchen einzurichten.</p>
          <p style="margin:0 0 16px;color:#27272a;font-size:16px;line-height:1.6;">Öffne den folgenden Link, um die Einladung anzunehmen und dein Passwort festzulegen.</p>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0;"><tr><td style="border-radius:10px;background:#dc2626;"><a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:13px 20px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;line-height:1.2;">Zugang einrichten</a></td></tr></table>
          <p style="margin:0;color:#52525b;font-size:14px;line-height:1.6;">Wenn du diese Einladung nicht erwartest, ignoriere diese Nachricht und gib den Link nicht weiter.</p>
          <p style="margin:24px 0 0;color:#27272a;font-size:16px;line-height:1.6;">Sportliche Grüße<br><strong>DJK/VfL Giesenkirchen 05/09 e.V.</strong></p>
        </td></tr>
        <tr><td style="padding:18px 24px;background:#18181b;color:#d4d4d8;font-size:12px;line-height:1.5;"><strong style="color:#ffffff;">DJK/VfL Giesenkirchen 05/09 e.V.</strong><br>Diese Nachricht wurde automatisch durch das Vereinssystem versendet.<p style="margin:10px 0 0;"><a href="{{ .SiteURL }}/impressum" style="color:#fca5a5;">Impressum</a> · <a href="{{ .SiteURL }}/datenschutz" style="color:#fca5a5;">Datenschutz</a></p></td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
```

### Reset password – deutscher Vorschlag

Subject:

```text
Passwort für dein Vereinsdashboard zurücksetzen
```

HTML Body:

```html
<!doctype html>
<html lang="de">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;color:#18181b;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#f4f4f5;">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:640px;background:#ffffff;border:1px solid #e4e4e7;border-radius:16px;overflow:hidden;">
        <tr><td align="center" style="padding:22px 24px;background:#18181b;border-bottom:4px solid #dc2626;">
          <img src="{{ .SiteURL }}/images/club-logo.png" width="88" height="88" alt="Logo der DJK/VfL Giesenkirchen 05/09 e.V." style="display:block;width:88px;height:88px;margin:0 auto 14px;object-fit:contain;border:0;">
          <p style="margin:0;color:#ffffff;font-size:15px;font-weight:700;line-height:1.4;">DJK/VfL Giesenkirchen 05/09 e.V.</p>
        </td></tr>
        <tr><td style="padding:28px 24px;">
          <h1 style="margin:0 0 20px;color:#18181b;font-size:24px;line-height:1.25;">Passwort zurücksetzen</h1>
          <p style="margin:0 0 16px;color:#27272a;font-size:16px;line-height:1.6;">Für dein Vereinsdashboard wurde eine Passwortzurücksetzung angefordert.</p>
          <p style="margin:0 0 16px;color:#27272a;font-size:16px;line-height:1.6;">Über den folgenden Link kannst du ein neues Passwort festlegen.</p>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0;"><tr><td style="border-radius:10px;background:#dc2626;"><a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:13px 20px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;line-height:1.2;">Passwort zurücksetzen</a></td></tr></table>
          <p style="margin:0;color:#52525b;font-size:14px;line-height:1.6;">Wenn du die Passwortzurücksetzung nicht selbst angefordert hast, kannst du diese Nachricht ignorieren. Gib den Link nicht weiter.</p>
          <p style="margin:24px 0 0;color:#27272a;font-size:16px;line-height:1.6;">Sportliche Grüße<br><strong>DJK/VfL Giesenkirchen 05/09 e.V.</strong></p>
        </td></tr>
        <tr><td style="padding:18px 24px;background:#18181b;color:#d4d4d8;font-size:12px;line-height:1.5;"><strong style="color:#ffffff;">DJK/VfL Giesenkirchen 05/09 e.V.</strong><br>Diese Nachricht wurde automatisch durch das Vereinssystem versendet.<p style="margin:10px 0 0;"><a href="{{ .SiteURL }}/impressum" style="color:#fca5a5;">Impressum</a> · <a href="{{ .SiteURL }}/datenschutz" style="color:#fca5a5;">Datenschutz</a></p></td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
```

### Exakter manueller Dashboard-Schritt

1. Supabase Dashboard öffnen und das betroffene Projekt auswählen.
2. `Authentication` → `Email Templates` öffnen.
3. `Invite user` auswählen, den oben angegebenen Invite-Subject und den vollständigen Invite-HTML-Body einsetzen und speichern.
4. `Reset password` auswählen, den oben angegebenen Recovery-Subject und den vollständigen Recovery-HTML-Body einsetzen und speichern.
5. Unter `Authentication` → `URL Configuration` nur prüfen, dass `Site URL` die für den jeweiligen Test gültige Origin enthält und die vom Anwendungscode erzeugten Invite-/Recovery-Callbacks in `Redirect URLs` zulässig sind. Vorhandene Werte nicht blind ersetzen.
6. Einmalig einen kontrollierten neuen Testbenutzer einladen. Zustellung, deutschen Betreff, Logo, CTA, Set-Password-Ziel, Impressum und Datenschutz prüfen. Keinen bestehenden Benutzer erneut einladen.
7. Für einen geeigneten Testaccount einmalig „Passwort vergessen“ auslösen. Zustellung, deutschen Betreff, Logo, CTA, Recovery-Callback, Passwortspeicherung und anschließenden Login prüfen. Das Auth-Mail-Rate-Limit beachten und keine unnötigen Wiederholungen auslösen.
8. In beiden Fällen Desktop und Mobilansicht sowie einen üblichen externen Mailclient prüfen. Keine ConfirmationURL, Token oder Empfängeradresse dokumentieren.

## Finaler Betreiberreview

- **Membership: PASSED.** Zustellung, Vereinsdesign und Inhalt wurden real bestätigt.
- **Notification: PASSED.** Zustellung, gemeinsames Vereinsdesign, CTA und Struktur wurden real bestätigt.
- **Supabase Recovery: PASSED / MANUALLY LIVE VERIFIED.** Das deutsche Template wurde im Supabase Dashboard hinterlegt. Zustellung, Subject, Text, Logo, Rot-/Anthrazit-/Weiß-Design, CTA, Footer, Impressum und Datenschutz wurden in einem externen Mailclient bestätigt.
- **Supabase Invite: CONFIGURED / NOT RE-LIVE-VERIFIED DURING FINAL REVIEW.** Subject und HTML sind im Supabase Dashboard gemäß diesem Vertrag eingerichtet. Mangels freier geeigneter Test-E-Mail-Adresse wurde kein unnötiger erneuter Versand ausgelöst. Der erste echte neu eingeladene Benutzer dient als operativer Smoke-Test; dies ist kein Closure-Blocker.
- **E-Mail-Wechsel: AUTOMATED CONTRACT/REGRESSION VERIFIED.** Alle vier Renderer verwenden das Masterlayout. Der Betreiber kennt den Workflow; ein künstlicher erneuter Live-Trigger war nicht erforderlich.

Das finale Maildesign wurde durch den Betreiber freigegeben. Keine Retrys oder Reminder-Crons wurden für den Review aktiviert.

## Verbleibende Go-live-Aufgaben

- finale Vereins-/Impressums-/Footerangaben rechtlich freigeben und danach den gemeinsamen Footer bei Bedarf erweitern;
- finale Vereinsdomain und `NEXT_PUBLIC_SITE_URL`, Auth Site URL sowie Redirect-Allowlist prüfen;
- finale Absenderdomain, SPF/DKIM/DMARC, Mailserver/SMTP, `MAIL_FROM` und `MAIL_REPLY_TO` freigeben;
- den ersten echten neu eingeladenen Benutzer als operativen Invite-Smoke-Test verwenden;
- Zustellbarkeit, Spamdarstellung, Barrierearmut und Textfallback mit finaler Domain und finalem SMTP erneut abnehmen;
- Contribution-Reminder-Cron erst im eigenen Go-live-Ablauf mit Secret, Idempotenzprüfung und Monitoring aktivieren.

B15.24N ist abgeschlossen. Die aufgeführten Legal-, Domain-, SMTP- und Produktiv-Smoke-Tests bleiben davon getrennte Pre-Go-live-Gates.
