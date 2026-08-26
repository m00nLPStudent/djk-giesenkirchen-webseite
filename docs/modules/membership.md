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

`team_season_year_groups` ordnet einer Mannschaftssaison null bis mehrere Geburtsjahre zu; derselbe Jahrgang darf mehreren Mannschaftssaisons zugeordnet sein. `membership_requests.desired_team_season_id` ist nullable vorbereitet. Browserrollen erhalten keinen direkten Tabellenzugriff. Die Adminpflege verwendet `teams.edit`, den bestehenden Team-Scope und erst nach Autorisierung den serverseitigen Admin-Client. B15.21B2 stellt zunächst nur die serverseitige Auflösungsschicht bereit; die vollständige Formularanbindung folgt separat.

## Serverseitige Mannschaftsauflösung B15.21B2

Der read-only Resolver bestimmt aus einem strikt validierten `YYYY-MM-DD`-Geburtsdatum das Geburtsjahr, löst `seasons.is_current` serverseitig auf und liest ausschließlich gepflegte Zuordnungen aus `team_season_year_groups`. Berücksichtigt werden aktive `team_seasons`, aktive Master-Teams und deren strukturelle `department_id`-Relation zur aktiven Fußballabteilung. Namen, Slugs von Mannschaften, Jugendklassen, Alter und feste Saisonregeln werden nicht interpretiert. Der Resolver unterscheidet keine, eine und mehrere passende Mannschaften und wählt bei mehreren Treffern niemals selbstständig aus.

Der öffentliche technische Zugriff erfolgt per `POST /api/membership/team-options`. Das Geburtsdatum wird weder persistiert noch geloggt oder in einer URL übertragen. Die Antwort enthält nur Status sowie je Treffer `teamSeasonId`, Name und Altersbereich. Mapping-Rohdaten, Master-Team-ID und Department-Metadaten bleiben serverseitig. Die vollständige Formular- und Submit-Anbindung folgt im nächsten Teilblock; bestehende Anfragen bleiben unverändert.

## Formular- und Submit-Integration B15.21B3

Das öffentliche Formular zeigt den serverseitig weiterhin unverbindlichen Jahrgang unmittelbar an. Nur für aktive Fußballanfragen wird der B2-Resolver debounced und abbrechbar aufgerufen. Ein einzelner Treffer wird transparent vorausgewählt, mehrere Treffer erfordern eine Auswahl, und ohne Treffer beziehungsweise bei technischer Nichtverfügbarkeit bleibt der Antrag ohne Mannschaft möglich. Beim Wechsel der Anfrageart werden saisonale Auswahlwerte verworfen. Traineranfragen erhalten einen Qualifikationshinweis; die Nachricht bleibt optional.

Der Browser sendet ausschließlich `desired_team_season_id`. Der Submit validiert diese erneut gegen Geburtsjahr, aktuelle Saison, aktive Mannschaftssaison, aktive Fußballabteilung und `team_season_year_groups`; erst danach wird `desired_team_id` serverseitig abgeleitet. Nicht-Fußballanfragen erzwingen beide Referenzen auf `null`. Die sechs neuen öffentlichen Anfragearten benötigen vor Produktivnutzung den manuellen B15.21B3-Constraint-Rollout; `sonstiges` bleibt nur als DB-Legacywert erhalten.

Der Membership-Resolver klassifiziert Mannschaften ausschließlich über `teams.department_id`. Eine korrekte Abteilungszuordnung ist Voraussetzung für die automatische Mitgliedsanfrage-Zuordnung. Teams ohne Abteilung werden bewusst nicht anhand von Namen, Slugs oder Altersgruppen als Fußballmannschaft interpretiert.

B15.21C1 trennt das globale Permission-Recht von der fachlichen Zuständigkeit je gespeichertem `request_type`. Listen, Detailzugriff, Statusmutation und Weiterleitung verwenden denselben serverseitigen Resolver. Gesamtvorstand und Superadmin behalten ihre übergeordnete Sicht; Abteilungsvorstände sehen ausschließlich ihren Bereich. Interne Notifications folgen derselben Matrix, wobei das bestehende globale Superadmin-Notification-Verhalten erhalten bleibt. Legacy-`sonstiges` wird sicher dem Gesamtvorstand zugeordnet.

B15.21C2 verwendet diesen Responsibility-Core auch unmittelbar für die Empfängerauflösung neuer Mitgliedsanfragen. Aus dem gespeicherten `request_type` werden die zuständigen Rollen bestimmt; anschließend werden nur aktive Adminprofile mit aktiver Rolle, passender View-Permission und tatsächlichem Request-Scope berücksichtigt. Die Empfängerliste wird nach User-ID dedupliziert, Superadmin wird immer einmal berücksichtigt. Der Gesamtvorstand behält seinen C1-Gesamtzugriff, erhält fachgebundene Neu-Anfragen aber nur dort automatisch, wo die fachliche Matrix `vorstand` nennt (`trainer-werden`, `passives-mitglied` und Legacy-`sonstiges`). Neue Notifications enthalten im Text Name und Anfrageart; technische Metadaten bleiben auf Anfrage-ID, Anfrageart, sichere Routingflags und den stabilen Idempotenzschlüssel beschränkt. Kontakt-, Adress-, Geburts-, Formular-, Mannschafts- und Jahrgangsdaten werden nicht in diese Metadaten kopiert. Ein Notification-Fehler wird erst nach dem erfolgreichen Insert kontrolliert protokolliert und ändert den erfolgreichen Public-Submit nicht.

Vollständige Mitgliedschaftsarten, automatische Jugend-/Mannschaftsfilterung, Eligibility und Saisonwechsel folgen in B15.21B ff. Persistentes verteiltes Rate Limiting benötigt eine gesonderte Infrastrukturentscheidung; ein Prozessspeicher-Limiter wird bewusst nicht eingesetzt.
