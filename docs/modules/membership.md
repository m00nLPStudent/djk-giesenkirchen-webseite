# Modul: Mitgliedschaft

## Status

Abgeschlossen und produktiv nutzbar.

## Öffentliche Funktionen

- Seite `/mitglied-werden`
- Formular für Mitgliedsanfragen (u. a. aktives Mitglied Fußball, passives Mitglied, Trainer werden)
- Teambezug bei aktiven Fußball-Anfragen
- mobile-first Formularlayout

## Admin-Funktionen

- Empfängerregeln für Anfragetypen (`membership_request_recipients`)
- Liste eingegangener Mitgliedsanfragen (`membership_requests`)
- Statusverwaltung von Anfragen
- Weiterleitung von Mitgliedsanfragen mit Zieltyp und Notiz

## Datenfluss

1. Anfrage wird öffentlich erfasst.
2. Anfrage wird in `membership_requests` gespeichert.
3. Weiterleitung erfolgt über Admin-Flow und Empfängerregeln.
4. Bearbeitung und Statuspflege erfolgen im Adminbereich.

## Tabellen

- `membership_requests`
- `membership_request_recipients`

## Release-Hinweis

Öffentliche Website enthält keine offenen Membership-Feature-Baustellen im Responsive-Release.
