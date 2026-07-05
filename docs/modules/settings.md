# Modul: Einstellungen

## Status

Abgeschlossen, modularisiert und produktiv genutzt.

## Ziel

Zentrale Verwaltung von Website-Basisdaten, Kontaktdaten, Seiteninhalten und Mitgliedschaftsabläufen.

## Umgesetzte Funktionen

- Vereins-/Website-Grundeinstellungen pflegen (`club_settings`)
- Kontaktdaten pflegen (`club_contacts`)
- Seiten-CMS pflegen (`pages`)
- Mitgliedsanfragen-Empfänger nach Anfragetyp pflegen (`membership_request_recipients`)
- Mitgliedsanfragen einsehen, Status setzen und weiterleiten (`membership_requests`)

## Architektur (modularisiert)

- Editor-Orchestrierung in `AdminSettingsEditor`
- Handler modularisiert (u. a. Club, Contact, Pages, Membership)
- gemeinsame Admin-Komponenten und Helper für konsistente Bedienung

## Relevante Tabellen

- `club_settings`
- `club_contacts`
- `pages`
- `membership_request_recipients`
- `membership_requests`

## Öffentliche Wirkung

- Footer und Website-Basisdaten sind dynamisch.
- Kontaktseite wird aus gepflegten Kontaktdaten gespeist.
- Impressum/Datenschutz und weitere CMS-Seiten werden über `pages` bereitgestellt.

## Tabellen

- `club_settings`
- `club_contacts`
- `pages`
- `membership_request_recipients`
- `membership_requests`
