# DJK/VfL Giesenkirchen Website

Öffentliche Vereinswebsite und Admin-CMS auf Basis von Next.js App Router und Supabase.

## Projektstatus

- Öffentliche Website: abgeschlossen (Responsive Release)
- Admin-CMS: produktiv nutzbar und modularisiert
- Fokus: Stabilität, Betrieb, Dokumentation

## Tech Stack

- Next.js 16 (App Router)
- React
- Tailwind CSS
- Supabase (DB + Storage)

## Lokale Entwicklung

```bash
npm install
npm run dev
```

App startet lokal auf `http://localhost:3000`.

## Build

```bash
npm run build
```

## Öffentliche Hauptseiten

- `/`
- `/verein`
- `/fussball`
- `/news`
- `/termine`
- `/mitglied-werden`
- `/kontakt`
- `/impressum`
- `/datenschutz`

## Dokumentation

Die vollständige Projektdokumentation liegt in [docs/README.md](docs/README.md).

Wichtige Einstiege:

- Architektur: [docs/architecture/overview.md](docs/architecture/overview.md)
- Routing: [docs/architecture/routes.md](docs/architecture/routes.md)
- Responsive Design: [docs/architecture/responsive.md](docs/architecture/responsive.md)
- Komponenten: [docs/architecture/components.md](docs/architecture/components.md)
- Datenmodell: [docs/architecture/database.md](docs/architecture/database.md)

## Hinweis

Diese Dokumentation entspricht dem aktuellen Code-Stand. Veraltete und doppelte Alt-Dokumente wurden bereinigt.
