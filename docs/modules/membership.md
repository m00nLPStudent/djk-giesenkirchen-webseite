# Modul: Mitgliedschaft

## Status

Umgesetzt.

## Öffentliche Funktionen

- Seite `/mitglied-werden`
- Formular für Mitgliedsanfragen (u. a. aktives Mitglied Fußball, passives Mitglied)
- Teambezug bei aktiven Fußball-Anfragen

## Admin-Funktionen

- Empfängerregeln für Anfragetypen (`membership_request_recipients`)
- Liste eingegangener Mitgliedsanfragen (`membership_requests`)
- Statusverwaltung von Anfragen
- Weiterleitung von Mitgliedsanfragen mit Zieltyp und Notiz

## Datenfluss

1. Anfrage wird öffentlich erfasst.
2. Anfrage wird in `membership_requests` gespeichert.
3. Optionaler Mailversand/Weiterleitung erfolgt über Service-Logik.
4. Bearbeitung und Statuspflege erfolgen im Adminbereich.

## Offener Ausbau (Phase 2)

- finaler Mailversand-Flow
- Historie/Protokollierung von Weiterleitungen
