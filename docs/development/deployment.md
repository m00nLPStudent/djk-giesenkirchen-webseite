# Deployment

Deployment-bezogene Hinweise.

## Grundsatz

- Deployments nur auf konsistentem Schema-, Service- und UI-Stand.
- Keine geheimen Tokens oder Zugangsdaten in Dokumente übernehmen.
- Vor Deployment immer `npm.cmd run build` erfolgreich ausführen.

## Admin-Einladung und Passwort-Setup

Benötigte Variablen in `.env.local`:

```env
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SITE_URL=https://<current-tunnel-or-production-domain>
```

Hinweise:

- `SUPABASE_SERVICE_ROLE_KEY` niemals als `NEXT_PUBLIC_` definieren.
- `SUPABASE_SERVICE_ROLE_KEY` nur serverseitig verwenden.
- Bei neuem Quick Tunnel ändert sich die URL. Danach müssen aktualisiert werden:
  - `NEXT_PUBLIC_SITE_URL`
  - Supabase Redirect URL Allowlist
  - laufender Dev-Server (neu starten)

## Supabase Auth Redirects

Browsergestützte Passwort-Recovery verwendet die tatsächlich aufgerufene,
streng validierte Origin. In Supabase muss diese Origin trotzdem ausdrücklich
zugelassen sein:

- **Authentication → URL Configuration → Site URL**: kontrolliert auf die
  primäre aktuelle Deployment- beziehungsweise spätere Produktivdomain setzen.
- **Authentication → URL Configuration → Redirect URLs**: die exakt erzeugte
  Recovery-URL
  `https://<current-tunnel-or-production-domain>/admin/auth/callback?next=%2Fadmin%2Fset-password`
  erlauben.
- Für lokale Tests zusätzlich
  `http://localhost:3000/admin/auth/callback?next=%2Fadmin%2Fset-password`
  als Redirect URL erlauben.

Vorhandene Werte zuerst inventarisieren; keine produktive Site URL oder andere
Redirects ungeprüft überschreiben. Quick-Tunnel-Domains ändern sich und gehören
nicht hartcodiert in den Produktcode.

Falls eine Recovery-Mail trotz korrekt übergebenem und erlaubtem `redirectTo`
weiterhin direkt die `Site URL` verwendet, im bestehenden Recovery-Mailtemplate
zusätzlich prüfen, ob dessen Link `{{ .RedirectTo }}` statt einer hartcodierten
URL beziehungsweise `{{ .SiteURL }}` verwendet. Das Template nicht ungeprüft
überschreiben, da Invite- und andere Auth-Mailtemplates getrennte Verträge haben.
