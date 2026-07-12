# Database

## Grundsatz

Alle Module sind auf den produktiv genutzten Tabellenstand dokumentiert.

## Content und Website-Basis

- `club_settings`: globale Vereins-/Website-Einstellungen
- `club_contacts`: öffentliche Kontaktpersonen
- `pages`: CMS-Seiten (z. B. Rechtstexte)
- `club_history_pages`: Vereinsgeschichte-Seiten
- `club_history_images`
- `club_history_milestones`

## News

- `news`
- `news_documents`

## Events und Termine

- `events`
- `event_documents`
- Wiederholungsfelder in `events` (u. a. Intervall/Ende/Anzahl)

## Trainings-Runtime (virtuelle Trainings)

- `team_training_times`
- `team_training_exceptions`
- `club_closure_periods`

Virtuelle Trainings werden zur Laufzeit erzeugt und nicht als persistente Event-Reihen abgelegt.

## Fußball, Abteilung, Personen

- `teams`
- `team_seasons`
- `seasons`
- `players`
- `player_team_seasons`
- `coaches`
- `coach_team_seasons`
- `board_members`
- `board_roles`

## Sponsoren

- `sponsor_categories`
- `sponsors`

## Membership

- `membership_requests`
- `membership_request_recipients`

## Modellregeln

- Keine UI- oder Service-Änderung ohne Schema-Abgleich
- Keine Doku-Aussage ohne tatsächliche Tabellennutzung im Code

## B12.2 Vorschlagsstand (noch nicht produktiv)

In Phase B12.2 wurden nur SQL-Vorschlaege dokumentiert. Es wurden keine Migrationen ausgefuehrt.

Geplante Erweiterungen:

- Profil-Links fuer Personenkarten:
  - `board_members.admin_profile_id -> admin_profiles.id`
  - `coaches.admin_profile_id -> admin_profiles.id`
- Teambezogene Admin-Scopes:
  - neue Tabelle `admin_user_team_scopes`
- Beitragsverwaltung:
  - neue Tabelle `membership_contributions`
- Optionale Zahlungshistorie:
  - neue Tabelle `membership_contribution_payments`
- Optionaler redaktioneller Workflow auf Content:
  - Zusatzfelder in `news` und `events` (z. B. `workflow_status`)

Referenzen:

- `docs/sql/b12-profile-links-proposal.sql`
- `docs/sql/b12-team-scopes-proposal.sql`
- `docs/sql/b12-membership-contributions-proposal.sql`
- `docs/sql/b12-membership-contribution-payments-proposal.sql`
- `docs/sql/b12-content-workflow-proposal.sql`
