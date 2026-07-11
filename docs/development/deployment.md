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
NEXT_PUBLIC_SITE_URL=https://setting-hosted-anaheim-receives.trycloudflare.com
```

Hinweise:

- `SUPABASE_SERVICE_ROLE_KEY` niemals als `NEXT_PUBLIC_` definieren.
- `SUPABASE_SERVICE_ROLE_KEY` nur serverseitig verwenden.
- Bei neuem Quick Tunnel ändert sich die URL. Danach müssen aktualisiert werden:
  - `NEXT_PUBLIC_SITE_URL`
  - Supabase Redirect URL Allowlist
  - laufender Dev-Server (neu starten)
