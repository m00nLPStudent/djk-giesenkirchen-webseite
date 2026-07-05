# Modul: Admin

## Status

Weitgehend funktionsfähig.

## Umgesetzte Bereiche

- Dashboard
- News
- Teams
- Spieler
- Trainer/Betreuer
- Termine/Events
- Department/Vorstand
- Sponsoren
- Club-History
- Einstellungen

## Einstellungen als zentrale Schnittstelle

Der Bereich `/admin/settings` steuert:

- `club_settings`
- `club_contacts`
- `pages` (Seiten-CMS)
- `membership_request_recipients`
- Bearbeitung/Weiterleitung von `membership_requests`

## Architekturhinweise

- Gemeinsame Admin-Bausteine sind breit im Einsatz (FormFields, Tab-Navigation, UI-Karten, Delete-Flow).
- Einzelne große Komponenten sind funktional stabil, aber als spätere interne Refactor-Kandidaten markiert.
