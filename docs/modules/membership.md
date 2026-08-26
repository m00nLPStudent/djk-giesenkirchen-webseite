# Modul: Mitgliedschaft

## Status

B15.21A und die Datenmodellgrundlage B15.21B0 sind produktiv ausgerollt und geprüft. B15.21B1 ergänzt die serverseitig autorisierte Pflege unter `Einstellungen → Saisons & Mannschaften`.

## Öffentliche Funktionen

- Seite `/mitglied-werden`
- Formular für die vier bestehenden Anfragearten
- Teambezug bei aktiven Fußball-Anfragen
- serverseitige Allowlist und Normalisierung aller öffentlichen Eingaben
- verpflichtende Telefonnummer und ausdrücklicher Datenschutz-Consent
- serverseitig aus dem Geburtsdatum berechneter Jahrgang
- serverseitige Prüfung ausgewählter aktiver Fußballmannschaften
- Honeypot als sofortiger Spam-Basisschutz

## Admin-Funktionen

- Empfängerregeln für Anfragetypen (`membership_request_recipients`)
- Liste, Statusverwaltung und Weiterleitung eingegangener Anfragen

## Datenfluss

1. Anfrage wird öffentlich erfasst.
2. Die Server Action verwirft unbekannte Felder, validiert Pflichtfelder, Consent und Team und berechnet den Jahrgang.
3. Der serverseitige Service-Role-Pfad speichert ausschließlich den normalisierten Payload in `membership_requests`.
4. Nach erfolgreichem Insert wird die bestehende Membership-Notification ausgelöst.
5. Weiterleitung und Statuspflege erfolgen im bestehenden Adminworkflow.

## Tabellen

- `membership_requests`
- `membership_request_recipients`

Geplante Consent-Nachweisfelder aus B15.21A: `privacy_consent`, `privacy_consent_at`, `privacy_policy_version`. Das finale Proposal aktiviert RLS, entfernt historische App-Metadata-Policies und entzieht `PUBLIC`, `anon` und `authenticated` sämtliche direkten Tabellen- und Spaltenrechte. Öffentlicher Submit und autorisierte Adminpfade laufen danach ausschließlich serverseitig über Service Role. Das Proposal wird ausschließlich manuell ausgeführt.

## Offene Weiterentwicklung

`team_season_year_groups` ordnet einer Mannschaftssaison null bis mehrere Geburtsjahre zu; derselbe Jahrgang darf mehreren Mannschaftssaisons zugeordnet sein. `membership_requests.desired_team_season_id` ist nullable vorbereitet. Browserrollen erhalten keinen direkten Tabellenzugriff. Die Adminpflege verwendet `teams.edit`, den bestehenden Team-Scope und erst nach Autorisierung den serverseitigen Admin-Client. Das öffentliche Formular wird erst in B15.21B2 angebunden.

Vollständige Mitgliedschaftsarten, automatische Jugend-/Mannschaftsfilterung, Eligibility und Saisonwechsel folgen in B15.21B ff. Persistentes verteiltes Rate Limiting benötigt eine gesonderte Infrastrukturentscheidung; ein Prozessspeicher-Limiter wird bewusst nicht eingesetzt.
