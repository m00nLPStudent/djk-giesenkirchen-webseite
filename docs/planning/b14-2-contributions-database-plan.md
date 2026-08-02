# B14.2 - Contributions Database Plan

## 1. Ziel

Dieses Paket bereitet die additive Datenbankgrundlage fuer das Spieler-only-Modul `Vereinsbeitraege` vor.

## 2. Live-Preflight

Vorbereitet in `docs/sql/b14-2-contributions-preflight-readonly.sql`.

Der Preflight prueft:

- bestehende oder alte Contributions-Tabellen
- relevante Admin-/Season-/Player-Strukturen
- Rollen und Permissions
- Trigger- und Audit-Konventionen
- RLS-Umfeld
- moegliche Namenskonflikte

## 3. Ist-Stand

- laut `docs/datenbank_docu/` existieren `membership_contributions` und `membership_contribution_payments` nicht produktiv
- `players`, `seasons`, `admin_profiles`, `admin_roles`, `admin_permissions` und die Role-Permission-Tabellen sind dokumentiert vorhanden
- `kassierer` ist der vorhandene technische Rollen-Key
- `contributions.*`-Permissions existieren produktiv noch nicht

## 4. Finales Datenmodell

Empfohlene Zieltabellen:

- `public.player_contributions`
- `public.player_contribution_payments`

Bewusste Abgrenzung:

- keine polymorphe Personenzuordnung
- kein `coach_id`
- kein `team_id`- oder `team_season_id`-FK
- optionaler Text-Snapshot `team_snapshot_name`

## 5. Beitragsstatus

Finale Statuswerte:

- `open`
- `partially_paid`
- `paid`
- `deferred`
- `exempt`
- `canceled`

## 6. Zahlungsstatus

Finale Payment-Statuswerte:

- `booked`
- `canceled`

Nur `booked`-Zahlungen zaehlen in `amount_paid`.

## 7. Betragsberechnung

Verbindliche Entscheidung:

- `amount_paid` bleibt ein synchronisierter Cache
- Zahlungen bleiben die Source of Truth
- `amount_outstanding` wird als generated column berechnet:
  `greatest(0, amount_due - amount_waived - amount_paid)`
- Synchronisation von `amount_paid`, `paid_at` und nicht-manuellen Statuspfaden ueber DB-Triggerfunktion

Begruendung:

- performant fuer Listen und Kennzahlen
- robust gegen mehrere Zahlungszeilen
- einheitliche Konsistenz auch ausserhalb einzelner Runtime-Pfade

## 8. Eindeutigkeit

Empfohlene Regel:

- partieller Unique-Index fuer `regular`
- genau ein nicht stornierter regulaerer Beitrag je `player_id + season_id`

Nicht global unique:

- `adjustment`
- `correction`
- `special_fee`

## 9. Contribution-Keys

Empfohlene Phase-1-Keys:

- `regular`
- `admission_fee`
- `adjustment`
- `correction`
- `special_fee`

Ausgeschlossen:

- `tournament_fee`
- `team_cash`
- `penalty`
- `donation`
- `sponsorship`
- `expense`

## 10. Team-Snapshot

Finale Entscheidung:

- `team_snapshot_name` aufnehmen
- reiner Text-Snapshot
- keine Berechtigungs- oder Scope-Wirkung
- keine automatische Nachpflege bei Teamwechseln

## 11. Audit

FK-Regeln:

- `player_id -> players.id` mit `ON DELETE NO ACTION`
- `season_id -> seasons.id` mit `ON DELETE NO ACTION`
- `contribution_id -> player_contributions.id` mit `ON DELETE NO ACTION`
- Admin-Akteure mit `ON DELETE SET NULL`

Begruendung:

- Audit-Erhalt ist wichtiger als automatische Kaskaden

## 12. Permissions

Empfohlen:

- `contributions.view`
- `contributions.create`
- `contributions.edit`
- `contributions.record_payment`
- `contributions.cancel_payment`
- `contributions.defer`
- `contributions.exempt`
- `contributions.cancel`
- `contributions.export`

Kein `contributions.delete`.

## 13. Rollen

Standardempfehlung:

- `superadmin`: alle Contributions-Permissions
- `kassierer`: alle Contributions-Permissions
- `vorstand`: `contributions.view` und `contributions.export`
- `jugendleiter`: kein Zugriff
- `trainer`: kein Zugriff
- `betreuer`: kein Zugriff
- `gast`: kein Zugriff

## 14. RLS

RLS wird in B14.2 nicht aktiviert. Stattdessen:

- serverseitige Datenpfade erzwingen
- spaeter gezielte Contributions-RLS als eigener Schritt
- keine allgemeinen `public`- oder `authenticated`-Policies uebernehmen

## 15. Schema-Proposal

Vorbereitet in `docs/sql/b14-2-contributions-additive-schema-proposal.sql`.

Enthaelt:

- neue Tabellen
- Checks
- FKs
- Indizes
- Trigger auf vorhandenes `set_updated_at()`
- neue Triggerfunktion fuer Payment-Cache-Synchronisation

## 16. Ausfuehrungsreihenfolge

1. Read-only Preflight gegen Live-DB ausfuehren.
2. Namens- und Rollenstatus pruefen.
3. Go-/No-Go fuer finales Schema bestaetigen.
4. Additives Schema-Proposal ausfuehren.
5. Permission-Proposal ausfuehren.
6. Postcheck ausfuehren.
7. Erst danach Runtime-Services und Admin-Routen bauen.

## 17. Postcheck

Vorbereitet in `docs/sql/b14-2-contributions-postcheck-readonly.sql`.

Geprueft werden:

- Tabellen
- Spalten
- Constraints
- FKs
- Indizes
- Trigger
- Permission-Mappings
- absence von `coach_id` und Team-FKs

## 18. Rollback

Vorbereitet in `docs/sql/b14-2-contributions-rollback-proposal.sql`.

Rollback-Grundsatz:

- nur solange beide Tabellen leer sind
- bei vorhandenen Daten kein Schema-Drop als Standardweg
- dann nur Backup oder Vorwaertsmigration

## 19. Risiken

- vorhandene Delete-Pfade fuer Spieler muessen spaeter auf Contributions vorbereitet werden
- bestehende Scope-Drafts fuer `contributions.*` sind fuer Finanzdaten zu offen
- `vorstand`-Rechte muessen fachlich bestaetigt werden
- Live-Preflight ist noch nicht ausgefuehrt

## 20. Go-/No-Go-Kriterien

Go nur wenn:

- keine gleichnamigen Tabellen oder Indexkonflikte bestehen
- `kassierer` und benoetigte Admin-Tabellen live vorhanden sind
- es keine alten B12-Testtabellen mit echten Daten gibt
- die Projektentscheidung fuer Vorstand nur `view + export` bestaetigt ist

No-Go wenn:

- bereits echte konkurrierende Contributions-Tabellen existieren
- Namenskonflikte mit Tabellen, Indizes, Triggern oder Funktionen bestehen
- das Projekt doch wieder Trainer-, Team- oder polymorphe Finance-Sicht verlangt

## 21. Empfohlener naechster Schritt

B14.3 sollte nach erfolgreichem Live-Preflight die erste Runtime-Implementierung vorbereiten:

- Admin-Routen
- serverseitige Repositories und Actions
- DTOs fuer Listen, Detail und Export
- keine Browser-Direct-Queries auf Finanztabellen
