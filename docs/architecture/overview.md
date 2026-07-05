# Architecture Overview

## Systemaufbau

- Next.js App Router mit Trennung in öffentlichen Bereich (`src/app/(website)`) und Adminbereich (`src/app/admin`).
- Komponenten nach Domäne in `src/components/website`, `src/components/admin` und `src/components/common`.
- Datenzugriffe über Supabase (Tabellen, Storage, RPC), modulnahe Services und gemeinsame Helper in `src/lib`.

## Fachliche Bereiche

- Öffentliche Website: Startseite, News, Termine, Fußball, Abteilung, Sponsoren, Kontakt, Impressum, Datenschutz, Mitglied werden.
- Admin: Dashboard, News, Teams, Spieler, Trainer, Events, Department/Vorstand, Sponsoren, Club-History, Settings.
- Settings/CMS: zentrale Pflege von `club_settings`, `club_contacts`, `pages` und Mitgliedsanfragen-Konfiguration.

## Architekturprinzipien

- Feature-Logik bleibt in Modulen gekapselt.
- Gemeinsame Infrastruktur wird zentral gehalten (z. B. Slug-, Storage-, Phone-, Event- und RichText-Helfer).
- Datenbankstruktur und UI werden synchron entwickelt; keine UI-Logik ohne abgesicherte Datenbasis.

## Aktueller Reifegrad

- Öffentliche Website weitgehend abgeschlossen.
- Adminbereich weitgehend funktionsfähig.
- Offene Themen sind überwiegend Betriebs- und Erweiterungsthemen (Mailversand, Rollen/Rechte, Performance/Deployment/Backups).
