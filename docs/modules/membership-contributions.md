# Modul: Membership Contributions (B12.2 Vorbereitung)

## Status

Analyse und technisches Zielbild dokumentiert. Nicht produktiv aktiv.

## Ziel

Einheitliche Beitragsverwaltung fuer Spieler und Trainer vorbereiten:

- Forderungen je Saison transparent abbilden
- Teambezug fuer Scope-basierte Sichtbarkeit vorbereiten
- Zahlungshistorie optional nachziehen
- ohne harte Kopplung an bestehende Membership-Anfragen

## Ist-Stand im Code

- `membership_requests` und `membership_request_recipients` sind produktiv fuer Anfrageprozesse.
- Es existiert noch keine eigene Tabelle fuer wiederkehrende oder gebuchte Mitgliedsbeitraege.
- Dashboard-Statistiken verwenden Membership nur fuer offene Anfragen (`new`, `in_progress`).
- In Spielerstats ist `openContributions` derzeit ein Platzhalterwert.

## Geplantes Datenmodell (Vorschlag)

Kernobjekt:

- `membership_contributions`
  - `season_key`
  - `contribution_key` (technisch stabiler Schlüssel)
  - `player_id` oder `coach_id` (XOR)
  - `team_id` (optional)
  - `amount_due`, `amount_paid`, `amount_outstanding`, `status`
  - `due_date`, `paid_at`
  - `installment_agreement`, `exemption_reason`, `deferral_until`
  - `internal_notes`
  - Auditfelder (`created_by`, `updated_by`)

Optionales Nebenobjekt:

- `membership_contribution_payments`
  - 1:n Zahlungen pro Beitrag
  - Betrag, Zeitpunkt, Zahlungsart, Referenz, interne Notiz

## Zahlungslogik (Source of Truth)

- `membership_contribution_payments` ist die fachliche Quelle der Wahrheit fuer Zahlungen.
- `amount_paid` bleibt als serverseitig synchronisierter Cachewert in `membership_contributions`.
- Aktualisierung von `amount_paid` erfolgt nur serverseitig und atomar bei Payment-Insert/Delete.
- Kein direkter Browser-Write auf `amount_paid`.

Begruendung der gewaehlten Variante:

- Reporting/Listen bleiben performant ohne dauerhafte Aggregation ueber Payment-Historie.
- Historie bleibt revisionsfest in der Payment-Tabelle.
- Konsistenz wird ueber serverseitigen Write-Pfad gesichert.

## Offener Betrag und Statuskonsistenz

- `amount_outstanding` wird berechnet (`amount_due - amount_paid`) und nicht manuell gepflegt.
- `amount_paid <= amount_due` ist im SQL-Entwurf als Constraint vorgesehen.
- `paid_at` wird nur gesetzt, wenn Status `paid` ist.
- `deferred` erfordert `deferral_until`.
- `exempt` kann `exemption_reason` verwenden.
- `currency` bleibt standardmaessig `EUR`.

## Scope-Relevanz

Fuer spaetere Zugriffsregeln soll das Modell teambezogene Filter ermoeglichen:

- global (alle Beitraege)
- Jugendbereich (`youth_all`, aus Teamklassifikation abgeleitet)
- zugewiesene Teams (`assigned_teams`)
- optional nur eigene Inhalte

Beitrags-Scope-Regeln (fachlich):

- Superadmin: global edit
- Kassenwart: global edit
- Jugendkoordinator: youth_all read
- Trainer: assigned_teams read
- uebrige Rollen: none

Jugendstatus wird nicht als `is_youth_team` im Beitrag gespeichert, sondern aus Teambezug/Teamklassifikation abgeleitet.

## Datenschutz und Schreibpfad

- keine sensiblen Zahlungsdaten in oeffentlichen Bereichen
- keine direkten Browser-Writes fuer Zahlungs- und Cachefelder
- Mutation nur ueber serverseitige Actions/Services

## Artefakte in B12.2

- `docs/sql/b12-membership-contributions-proposal.sql`
- `docs/sql/b12-membership-contribution-payments-proposal.sql`
- `docs/planning/b12-role-scope-matrix.md`

## Abgrenzung

In dieser Phase nicht enthalten:

- keine produktiven Tabellenmigrationen
- keine RLS-Policies
- keine UI-Route `/admin/contributions`
- keine aktivierten Permissions/Guards fuer Contributions
