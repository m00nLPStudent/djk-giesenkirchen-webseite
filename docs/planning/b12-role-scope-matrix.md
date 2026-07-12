# B12.2 Rollen-Scopes und Beitragsverwaltung: Fachmatrix und Zielarchitektur

## Rahmenbedingungen

- Analysephase ohne SQL-Ausfuehrung und ohne Enforcement-Aktivierung
- AUTH_REQUIRED_FOR_ADMIN bleibt true
- AUTH_ENFORCEMENT_ENABLED bleibt false
- keine Aenderung an Login, Logout, Proxy, Public-Website

## Scope-Katalog (einheitlich)

- global
- youth_all
- assigned_teams
- own_profile
- own_board_card
- own_staff_card
- own_content
- read_only
- none

## Fachliche Rollen-/Rechte-/Scope-Matrix

Legende: yes | no | draft_only

| Rolle             | Modul              | view | create     | edit       | delete     | publish | Scope          |
| ----------------- | ------------------ | ---- | ---------- | ---------- | ---------- | ------- | -------------- |
| Superadmin        | Dashboard          | yes  | yes        | yes        | yes        | yes     | global         |
| Superadmin        | News               | yes  | yes        | yes        | yes        | yes     | global         |
| Superadmin        | Termine            | yes  | yes        | yes        | yes        | yes     | global         |
| Superadmin        | Mannschaften       | yes  | yes        | yes        | yes        | yes     | global         |
| Superadmin        | Trainer            | yes  | yes        | yes        | yes        | yes     | global         |
| Superadmin        | Spieler            | yes  | yes        | yes        | yes        | yes     | global         |
| Superadmin        | Sponsoren          | yes  | yes        | yes        | yes        | yes     | global         |
| Superadmin        | Abteilung/Vorstand | yes  | yes        | yes        | yes        | yes     | global         |
| Superadmin        | Vereinsgeschichte  | yes  | yes        | yes        | yes        | yes     | global         |
| Superadmin        | Einstellungen      | yes  | yes        | yes        | yes        | yes     | global         |
| Superadmin        | Benutzer           | yes  | yes        | yes        | yes        | yes     | global         |
| Superadmin        | Rollen             | yes  | yes        | yes        | yes        | yes     | global         |
| Superadmin        | Permissions        | yes  | yes        | yes        | yes        | yes     | global         |
| Superadmin        | Beitraege          | yes  | yes        | yes        | yes        | yes     | global         |
| Superadmin        | eigenes Profil     | yes  | yes        | yes        | no         | no      | own_profile    |
| Vorstand          | Dashboard          | yes  | no         | no         | no         | no      | read_only      |
| Vorstand          | News               | yes  | yes        | yes        | yes        | yes     | global         |
| Vorstand          | Termine            | yes  | yes        | yes        | yes        | yes     | global         |
| Vorstand          | Mannschaften       | yes  | no         | no         | no         | no      | read_only      |
| Vorstand          | Trainer            | yes  | no         | no         | no         | no      | read_only      |
| Vorstand          | Spieler            | yes  | no         | no         | no         | no      | read_only      |
| Vorstand          | Sponsoren          | yes  | yes        | yes        | yes        | yes     | global         |
| Vorstand          | Abteilung/Vorstand | yes  | no         | yes        | no         | no      | own_board_card |
| Vorstand          | Vereinsgeschichte  | yes  | yes        | yes        | yes        | yes     | global         |
| Vorstand          | Einstellungen      | no   | no         | no         | no         | no      | none           |
| Vorstand          | Benutzer           | no   | no         | no         | no         | no      | none           |
| Vorstand          | Rollen             | no   | no         | no         | no         | no      | none           |
| Vorstand          | Permissions        | no   | no         | no         | no         | no      | none           |
| Vorstand          | Beitraege          | no   | no         | no         | no         | no      | none           |
| Vorstand          | eigenes Profil     | yes  | yes        | yes        | no         | no      | own_profile    |
| Fussballvorstand  | Dashboard          | yes  | no         | no         | no         | no      | read_only      |
| Fussballvorstand  | News               | yes  | yes        | yes        | yes        | yes     | global         |
| Fussballvorstand  | Termine            | yes  | yes        | yes        | yes        | yes     | global         |
| Fussballvorstand  | Mannschaften       | yes  | no         | no         | no         | no      | read_only      |
| Fussballvorstand  | Trainer            | yes  | no         | no         | no         | no      | read_only      |
| Fussballvorstand  | Spieler            | yes  | no         | no         | no         | no      | read_only      |
| Fussballvorstand  | Sponsoren          | yes  | yes        | yes        | yes        | yes     | global         |
| Fussballvorstand  | Abteilung/Vorstand | yes  | no         | yes        | no         | no      | own_board_card |
| Fussballvorstand  | Vereinsgeschichte  | yes  | yes        | yes        | yes        | yes     | global         |
| Fussballvorstand  | Einstellungen      | no   | no         | no         | no         | no      | none           |
| Fussballvorstand  | Benutzer           | no   | no         | no         | no         | no      | none           |
| Fussballvorstand  | Rollen             | no   | no         | no         | no         | no      | none           |
| Fussballvorstand  | Permissions        | no   | no         | no         | no         | no      | none           |
| Fussballvorstand  | Beitraege          | no   | no         | no         | no         | no      | none           |
| Fussballvorstand  | eigenes Profil     | yes  | yes        | yes        | no         | no      | own_profile    |
| Jugendkoordinator | Dashboard          | yes  | no         | no         | no         | no      | read_only      |
| Jugendkoordinator | News               | yes  | yes        | yes        | yes        | yes     | global         |
| Jugendkoordinator | Termine            | yes  | yes        | yes        | yes        | yes     | global         |
| Jugendkoordinator | Mannschaften       | yes  | yes        | yes        | no         | no      | youth_all      |
| Jugendkoordinator | Trainer            | yes  | no         | yes        | no         | no      | youth_all      |
| Jugendkoordinator | Spieler            | yes  | yes        | yes        | no         | no      | youth_all      |
| Jugendkoordinator | Sponsoren          | no   | no         | no         | no         | no      | none           |
| Jugendkoordinator | Abteilung/Vorstand | yes  | no         | yes        | no         | no      | own_board_card |
| Jugendkoordinator | Vereinsgeschichte  | no   | no         | no         | no         | no      | none           |
| Jugendkoordinator | Einstellungen      | no   | no         | no         | no         | no      | none           |
| Jugendkoordinator | Benutzer           | no   | no         | no         | no         | no      | none           |
| Jugendkoordinator | Rollen             | no   | no         | no         | no         | no      | none           |
| Jugendkoordinator | Permissions        | no   | no         | no         | no         | no      | none           |
| Jugendkoordinator | Beitraege          | yes  | no         | no         | no         | no      | youth_all      |
| Jugendkoordinator | eigenes Profil     | yes  | yes        | yes        | no         | no      | own_profile    |
| Trainer           | Dashboard          | yes  | no         | no         | no         | no      | read_only      |
| Trainer           | News               | yes  | draft_only | draft_only | draft_only | no      | own_content    |
| Trainer           | Termine            | yes  | draft_only | draft_only | draft_only | no      | own_content    |
| Trainer           | Mannschaften       | yes  | no         | yes        | no         | no      | assigned_teams |
| Trainer           | Trainer            | yes  | no         | yes        | no         | no      | own_staff_card |
| Trainer           | Spieler            | yes  | no         | yes        | no         | no      | assigned_teams |
| Trainer           | Sponsoren          | no   | no         | no         | no         | no      | none           |
| Trainer           | Abteilung/Vorstand | no   | no         | no         | no         | no      | none           |
| Trainer           | Vereinsgeschichte  | no   | no         | no         | no         | no      | none           |
| Trainer           | Einstellungen      | no   | no         | no         | no         | no      | none           |
| Trainer           | Benutzer           | no   | no         | no         | no         | no      | none           |
| Trainer           | Rollen             | no   | no         | no         | no         | no      | none           |
| Trainer           | Permissions        | no   | no         | no         | no         | no      | none           |
| Trainer           | Beitraege          | yes  | no         | no         | no         | no      | assigned_teams |
| Trainer           | eigenes Profil     | yes  | yes        | yes        | no         | no      | own_profile    |
| Betreuer          | Dashboard          | yes  | no         | no         | no         | no      | read_only      |
| Betreuer          | News               | yes  | draft_only | draft_only | draft_only | no      | own_content    |
| Betreuer          | Termine            | yes  | draft_only | draft_only | draft_only | no      | own_content    |
| Betreuer          | Mannschaften       | yes  | no         | yes        | no         | no      | assigned_teams |
| Betreuer          | Trainer            | yes  | no         | yes        | no         | no      | own_staff_card |
| Betreuer          | Spieler            | no   | no         | no         | no         | no      | none           |
| Betreuer          | Sponsoren          | no   | no         | no         | no         | no      | none           |
| Betreuer          | Abteilung/Vorstand | no   | no         | no         | no         | no      | none           |
| Betreuer          | Vereinsgeschichte  | no   | no         | no         | no         | no      | none           |
| Betreuer          | Einstellungen      | no   | no         | no         | no         | no      | none           |
| Betreuer          | Benutzer           | no   | no         | no         | no         | no      | none           |
| Betreuer          | Rollen             | no   | no         | no         | no         | no      | none           |
| Betreuer          | Permissions        | no   | no         | no         | no         | no      | none           |
| Betreuer          | Beitraege          | no   | no         | no         | no         | no      | none           |
| Betreuer          | eigenes Profil     | yes  | yes        | yes        | no         | no      | own_profile    |
| Redakteur         | Dashboard          | yes  | no         | no         | no         | no      | read_only      |
| Redakteur         | News               | yes  | yes        | yes        | yes        | yes     | global         |
| Redakteur         | Termine            | yes  | yes        | yes        | yes        | yes     | global         |
| Redakteur         | Mannschaften       | no   | no         | no         | no         | no      | none           |
| Redakteur         | Trainer            | no   | no         | no         | no         | no      | none           |
| Redakteur         | Spieler            | no   | no         | no         | no         | no      | none           |
| Redakteur         | Sponsoren          | no   | no         | no         | no         | no      | none           |
| Redakteur         | Abteilung/Vorstand | no   | no         | no         | no         | no      | none           |
| Redakteur         | Vereinsgeschichte  | no   | no         | no         | no         | no      | none           |
| Redakteur         | Einstellungen      | no   | no         | no         | no         | no      | none           |
| Redakteur         | Benutzer           | no   | no         | no         | no         | no      | none           |
| Redakteur         | Rollen             | no   | no         | no         | no         | no      | none           |
| Redakteur         | Permissions        | no   | no         | no         | no         | no      | none           |
| Redakteur         | Beitraege          | no   | no         | no         | no         | no      | none           |
| Redakteur         | eigenes Profil     | yes  | yes        | yes        | no         | no      | own_profile    |
| Kassenwart        | Dashboard          | yes  | no         | no         | no         | no      | read_only      |
| Kassenwart        | News               | yes  | draft_only | draft_only | no         | no      | own_content    |
| Kassenwart        | Termine            | yes  | draft_only | draft_only | no         | no      | own_content    |
| Kassenwart        | Mannschaften       | no   | no         | no         | no         | no      | none           |
| Kassenwart        | Trainer            | yes  | no         | no         | no         | no      | read_only      |
| Kassenwart        | Spieler            | yes  | no         | no         | no         | no      | read_only      |
| Kassenwart        | Sponsoren          | no   | no         | no         | no         | no      | none           |
| Kassenwart        | Abteilung/Vorstand | yes  | no         | yes        | no         | no      | own_board_card |
| Kassenwart        | Vereinsgeschichte  | no   | no         | no         | no         | no      | none           |
| Kassenwart        | Einstellungen      | no   | no         | no         | no         | no      | none           |
| Kassenwart        | Benutzer           | no   | no         | no         | no         | no      | none           |
| Kassenwart        | Rollen             | no   | no         | no         | no         | no      | none           |
| Kassenwart        | Permissions        | no   | no         | no         | no         | no      | none           |
| Kassenwart        | Beitraege          | yes  | yes        | yes        | no         | no      | global         |
| Kassenwart        | eigenes Profil     | yes  | yes        | yes        | no         | no      | own_profile    |
| Webmaster         | Dashboard          | yes  | no         | no         | no         | no      | read_only      |
| Webmaster         | News               | yes  | yes        | yes        | yes        | yes     | global         |
| Webmaster         | Termine            | yes  | yes        | yes        | yes        | yes     | global         |
| Webmaster         | Mannschaften       | no   | no         | no         | no         | no      | none           |
| Webmaster         | Trainer            | no   | no         | no         | no         | no      | none           |
| Webmaster         | Spieler            | no   | no         | no         | no         | no      | none           |
| Webmaster         | Sponsoren          | no   | no         | no         | no         | no      | none           |
| Webmaster         | Abteilung/Vorstand | no   | no         | no         | no         | no      | none           |
| Webmaster         | Vereinsgeschichte  | yes  | yes        | yes        | yes        | yes     | global         |
| Webmaster         | Einstellungen      | yes  | yes        | yes        | yes        | yes     | global         |
| Webmaster         | Benutzer           | no   | no         | no         | no         | no      | none           |
| Webmaster         | Rollen             | no   | no         | no         | no         | no      | none           |
| Webmaster         | Permissions        | no   | no         | no         | no         | no      | none           |
| Webmaster         | Beitraege          | no   | no         | no         | no         | no      | none           |
| Webmaster         | eigenes Profil     | yes  | yes        | yes        | no         | no      | own_profile    |
| Gast              | Dashboard          | yes  | no         | no         | no         | no      | read_only      |
| Gast              | News               | no   | no         | no         | no         | no      | none           |
| Gast              | Termine            | no   | no         | no         | no         | no      | none           |
| Gast              | Mannschaften       | no   | no         | no         | no         | no      | none           |
| Gast              | Trainer            | no   | no         | no         | no         | no      | none           |
| Gast              | Spieler            | no   | no         | no         | no         | no      | none           |
| Gast              | Sponsoren          | no   | no         | no         | no         | no      | none           |
| Gast              | Abteilung/Vorstand | no   | no         | no         | no         | no      | none           |
| Gast              | Vereinsgeschichte  | no   | no         | no         | no         | no      | none           |
| Gast              | Einstellungen      | no   | no         | no         | no         | no      | none           |
| Gast              | Benutzer           | no   | no         | no         | no         | no      | none           |
| Gast              | Rollen             | no   | no         | no         | no         | no      | none           |
| Gast              | Permissions        | no   | no         | no         | no         | no      | none           |
| Gast              | Beitraege          | no   | no         | no         | no         | no      | none           |
| Gast              | eigenes Profil     | yes  | yes        | yes        | no         | no      | own_profile    |

## Scope-Ableitung und Teamzuordnungen

- global und youth_all werden aus Rolle und Permission abgeleitet
- global und youth_all werden nicht als kuenstliche Teamzeilen gespeichert
- assigned_teams wird aus echten Relationen abgeleitet

Priorisierte Datenquelle fuer Teamzuordnung:

1. admin_profiles -> coaches.admin_profile_id -> coach_team_seasons -> teams
2. nur falls kein Coach-/Staff-Datensatz vorhanden ist: admin_profile_team_assignments

## Beitrags-Scopes (fachlich festgelegt)

- Superadmin: contributions.edit mit scope global
- Kassenwart: contributions.edit mit scope global
- Jugendkoordinator: contributions.view mit scope youth_all
- Trainer: contributions.view mit scope assigned_teams
- alle uebrigen Rollen: none

## Zielbild SQL-/Skeleton-Artefakte

- Profil-Links: docs/sql/b12-profile-links-proposal.sql
- Teamassignments: docs/sql/b12-team-scopes-proposal.sql
- Contributions: docs/sql/b12-membership-contributions-proposal.sql
- Contribution-Payments: docs/sql/b12-membership-contribution-payments-proposal.sql
- Scope-Skeleton: src/lib/admin-auth/scopes/

## B12.2a Zusatz: feste Kachelverknuepfung

- Vorstands- und Trainer-/Betreuerkacheln werden dauerhaft ueber `admin_profile_id` verknuepft.
- E-Mail/Name dienen nur als einmalige Match-Hilfe fuer Superadmin-UI.
- Autorisierung fuer own-card-Faelle basiert spaeter ausschliesslich auf `admin_profile_id`.
- Kein vollstaendiges Scope-Enforcement in dieser Teilphase.
- Keine automatische E-Mail-Synchronisierung zwischen Auth-User, `admin_profiles` und oeffentlichen Kacheln.

## Nicht-Ziele dieser Phase

- keine Migration ausfuehren
- keine Daten aendern
- keine RLS aktivieren
- keine Runtime-Guards aktivieren
