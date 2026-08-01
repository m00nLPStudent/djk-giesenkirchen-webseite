# B13.1 - Datenbankinventar Analyse

Status: Analyse auf Basis der CSV-Exporte in `docs/datenbank_docu`

## Datenbasis

Verwendet wurden ausschließlich:

- [b13-01-tables.csv](b13-01-tables.csv)
- [b13-02-columns.csv](b13-02-columns.csv)
- [b13-03-constraints.csv](b13-03-constraints.csv)
- [b13-04-foreign-keys.csv](b13-04-foreign-keys.csv)
- [b13-05-indexes.csv](b13-05-indexes.csv)
- [b13-06-triggers.csv](b13-06-triggers.csv)
- [b13-07-functions.csv](b13-07-functions.csv)
- [b13-09-rls-policies.csv](b13-09-rls-policies.csv)
- [b13-10-storage-buckets.csv](b13-10-storage-buckets.csv)
- [b13-11-storage-summary.csv](b13-11-storage-summary.csv)

Hinweis: [b13-11-storage-summary.csv](b13-11-storage-summary.csv) enthält in der vorliegenden Fassung keine Datenzeilen, nur den Header.

## 1. Übersicht aller Tabellen

Die Exporte enthalten 64 Basistabellen:

- `public`: 33 Tabellen
- `auth`: 23 Tabellen
- `storage`: 8 Tabellen

### Public

`admin_permissions`, `admin_profiles`, `admin_role_permissions`, `admin_roles`, `admin_user_roles`, `board_members`, `board_roles`, `club_closure_periods`, `club_contacts`, `club_history_images`, `club_history_milestones`, `club_history_pages`, `club_settings`, `coach_team_seasons`, `coaches`, `departments`, `event_documents`, `events`, `membership_request_recipients`, `membership_requests`, `news`, `news_documents`, `pages`, `player_team_seasons`, `players`, `seasons`, `sponsor_categories`, `sponsors`, `team_seasons`, `team_templates`, `team_training_exceptions`, `team_training_times`, `teams`.

### Auth

`audit_log_entries`, `custom_oauth_providers`, `flow_state`, `identities`, `instances`, `mfa_amr_claims`, `mfa_challenges`, `mfa_factors`, `oauth_authorizations`, `oauth_client_states`, `oauth_clients`, `oauth_consents`, `one_time_tokens`, `refresh_tokens`, `saml_providers`, `saml_relay_states`, `schema_migrations`, `sessions`, `sso_domains`, `sso_providers`, `users`, `webauthn_challenges`, `webauthn_credentials`.

### Storage

`buckets`, `buckets_analytics`, `buckets_vectors`, `migrations`, `objects`, `s3_multipart_uploads`, `s3_multipart_uploads_parts`, `vector_indexes`.

## 2. Gruppierung nach Modul

### Admin / Auth

- `admin_permissions`
- `admin_profiles`
- `admin_role_permissions`
- `admin_roles`
- `admin_user_roles`
- `board_members`
- `board_roles`
- `auth.*` Systemtabellen

### Teams / Saison / Training

- `teams`
- `team_seasons`
- `team_templates`
- `player_team_seasons`
- `coach_team_seasons`
- `team_training_times`
- `team_training_exceptions`
- `club_closure_periods`
- `departments`

### Spieler / Trainer / Personen

- `players`
- `coaches`
- `board_members`
- `board_roles`

### News / Events / Medien

- `news`
- `news_documents`
- `events`
- `event_documents`
- `club_history_pages`
- `club_history_images`
- `club_history_milestones`

### Mitgliedschaft

- `membership_requests`
- `membership_request_recipients`

### Sponsoren

- `sponsor_categories`
- `sponsors`

### CMS / Inhalt / Konfiguration

- `pages`
- `club_settings`
- `club_contacts`

### Storage

- `storage.buckets`
- `storage.objects`
- interne Storage-Systemtabellen

## 3. Tabellen, die offensichtlich Altbestand sind

Mit den CSVs allein ist kein Business-Table sicher als Altbestand beweisbar.

Was klar als Plattform- oder Systembestand erscheint:

- alle `auth.*`-Tabellen
- alle internen `storage.*`-Tabellen außer `buckets` und `objects`

Bewertung: Diese Tabellen sind kein Fachbestand des Vereins, sondern Plattformstruktur. Sie dürfen nicht als Löschkandidaten behandelt werden.

## 4. Tabellen mit doppelten Informationen

Folgende Dopplungen sind im Export klar sichtbar:

- `players.team_id` plus `player_team_seasons.player_id/team_season_id`
- `coaches.team_id` plus `coach_team_seasons.coach_id/team_season_id`
- `team_seasons` enthält viele teambezogene Kopien pro Saison: Name, Beschreibung, Kontakt, Trainingszeiten, Bild, externe Widgets
- `news` enthält sowohl kategoriale Felder (`category`, `category_key`) als auch teambezogene Zuordnungen (`football_team_id`)
- `membership_requests` speichert Workflow-Snapshots wie `forwarded_to_name`, `forwarded_to_email`, `forwarded_to_id`
- `coaches` enthält neben Teambezug auch viele Profil-/Snapshot-Felder wie `team_slug`, `team_name`, `role`, `first_name`, `last_name`, `photo_url`

Ein Teil dieser Dopplungen ist vermutlich absichtlich denormalisiert [vermutlich], ein Teil wirkt wie Legacy-Fallback [vermutlich].

## 5. Tabellen ohne erkennbare Verwendung

Aus den CSVs allein ist keine öffentliche Tabelle belastbar als „ungenutzt“ nachweisbar.

Nur als niedrige Konfidenz-Kandidaten für spätere Prüfung fallen auf:

- `team_templates` [vermutlich], weil sie nur wenig gekoppelt ist
- `membership_request_recipients` [vermutlich], weil sie nur Konfigurationscharakter hat

Keine dieser Tabellen sollte allein auf Basis der CSVs als löschbar bewertet werden.

## 6. Spalten, die wahrscheinlich veraltet sind

Die wahrscheinlichsten Legacy- oder Snapshot-Spalten sind:

- `players.team_id` [vermutlich]
- `coaches.team_id` [vermutlich]
- `coaches.team_slug` [vermutlich]
- `coaches.team_name` [vermutlich]
- `coaches.role` [vermutlich]
- `coaches.first_name` [vermutlich]
- `coaches.last_name` [vermutlich]
- `coaches.photo_url` [vermutlich]
- `news.author` [vermutlich]
- `news.category` [vermutlich]
- `news.category_key` [vermutlich]
- `news.scheduled_at` [vermutlich]
- `membership_requests.processed_by` [vermutlich]
- `membership_requests.forwarded_to_*` [vermutlich, als Workflow-Snapshot bewusst möglich]

Weniger wahrscheinlich veraltet, aber dennoch prüfenswert:

- `teams.season` [vermutlich], weil daneben ein eigenes Saisonmodell existiert

## 7. Doppelte Foreign Keys

Es wurden keine doppelten Foreign-Key-Constraints gefunden.

Was mehrfach vorkommt, sind keine FKs, sondern doppelte Unique-Index-Definitionen auf denselben Spaltenpaaren. Das fällt in Punkt 9.

## 8. Fehlende Foreign Keys

Keine offensichtlichen fehlenden Foreign Keys auf Kernbeziehungen springen aus den CSVs sofort hervor.

Potenzielle, aber vermutlich bewusst nicht normalisierte Felder sind:

- `membership_requests.processed_by` [vermutlich bewusst Text statt FK]
- `membership_requests.forwarded_to_type` / `forwarded_to_id` / `forwarded_to_name` / `forwarded_to_email` [vermutlich polymorpher Workflow-Snapshot]
- `news.author` [vermutlich bewusst freier Text]
- `news.category` / `news.category_key` [vermutlich bewusst Freitext bzw. Key]
- `club_contacts.category` / `role_key` [vermutlich Konfigurationskeys]

Fazit: Eher kein harter FK-Fehler, sondern bewusst offene Workflow- und Konfigurationsfelder.

## 9. Fehlende Indizes

Die offensichtlichsten fehlenden oder zumindest nicht sichtbaren Indizes sind:

- `coaches.team_id` [vermutlich wichtig, aber kein eigener Index im Export sichtbar]
- `teams.department_id` [vermutlich wichtig, aber kein eigener Index im Export sichtbar]
- `admin_role_permissions.permission_id` [vermutlich sinnvoll für Permission-zentrierte Abfragen, im Export kein eigener Index sichtbar]

Fast alle anderen relevanten FK-/Filterspalten sind bereits durch einen Index oder einen zusammengesetzten Unique-Key abgedeckt.

## 10. Triggerübersicht

Gefunden wurden 11 fachliche Trigger, alle `BEFORE UPDATE` und alle `ENABLED`:

- `club_closure_periods.trg_ccp_set_updated_at` -> `tg_set_updated_at_team_training_schedules`
- `club_contacts.trg_club_contacts_set_updated_at` -> `set_updated_at`
- `club_history_images.trg_set_updated_at_club_history_images` -> `set_updated_at`
- `club_history_milestones.trg_set_updated_at_club_history_milestones` -> `set_updated_at`
- `club_history_pages.trg_set_updated_at_club_history_pages` -> `set_updated_at`
- `club_settings.trg_club_settings_set_updated_at` -> `set_updated_at`
- `events.trg_events_set_updated_at` -> `set_updated_at`
- `membership_request_recipients.trg_membership_request_recipients_set_updated_at` -> `set_updated_at`
- `pages.trg_pages_set_updated_at` -> `set_updated_at`
- `team_training_exceptions.trg_tte_set_updated_at` -> `tg_set_updated_at_team_training_schedules`
- `team_training_times.trg_ttt_set_updated_at` -> `tg_set_updated_at_team_training_schedules`

Beobachtung: Zwei Hilfsfunktionen werden genutzt, aber das Muster ist nicht komplett einheitlich benannt. Inhaltlich geht es überall um `updated_at`.

## 11. Funktionsübersicht

Gefunden wurden vier Funktionen:

- `is_superadmin_actor()`
  - Rückgabetyp: `boolean`
  - Sprache: `sql`
  - Security Definer: ja
  - Volatilität: `STABLE`

- `remove_entity(entity_type text, entity_uuid uuid)`
  - Rückgabetyp: `void`
  - Sprache: `plpgsql`
  - Security Definer: ja
  - Volatilität: `VOLATILE`

- `set_updated_at()`
  - Rückgabetyp: `trigger`
  - Sprache: `plpgsql`
  - Security Definer: nein
  - Volatilität: `VOLATILE`

- `tg_set_updated_at_team_training_schedules()`
  - Rückgabetyp: `trigger`
  - Sprache: `plpgsql`
  - Security Definer: nein
  - Volatilität: `VOLATILE`

Bewertung: `remove_entity` ist die zentrale fachliche Löschfunktion. `is_superadmin_actor` ist der zentrale Berechtigungshaken.

## 12. Storageübersicht

### Buckets

Gefunden wurden drei Buckets:

- `events-documents`
- `media`
- `news-documents`

Alle drei sind `public = true`. `file_size_limit` und `allowed_mime_types` sind in den CSVs leer.

### Storage-Objekte

- `storage.objects` enthält laut Tabelleninventur 31 Zeilen [aus dem Export]
- es existieren 13 Policies auf `storage.objects`
- [b13-11-storage-summary.csv](b13-11-storage-summary.csv) ist in der vorliegenden Fassung leer außer Header

Bewertung: Die Bucket-Struktur ist klar, die aggregierte Objekt-Sicht fehlt im Export jedoch vollständig.

## 13. RLS-Übersicht

### Tabellen mit RLS aktiviert, aber sehr breiten Policies

Besonders offen erscheinen:

- `board_members` (4 Policies, alle `public`, alle `true`)
- `events` (4 Policies, darunter `SELECT true`, `INSERT true`, `UPDATE true`, `DELETE true`)
- `news` (4 Policies, ebenfalls sehr offen)
- `sponsors` (4 Policies, offen)
- `team_seasons` (2 Policies, offen)
- `player_team_seasons` (2 Policies, offen)
- `coach_team_seasons` (2 Policies, offen)
- `teams` (4 Policies, offen)
- `club_history_*` (öffentliche/anonymous Schreib- und Lesezugriffe in den Policies)

### Tabellen mit RLS deaktiviert, aber trotzdem vorhandenen Policies

Hier sind die Policies im Zustand „inaktiv“, solange RLS aus ist:

- `club_contacts`
- `club_settings`
- `membership_request_recipients`
- `membership_requests`
- `pages`
- `players`

Das ist ein wichtiger Befund: Policies existieren, wirken aber nicht, wenn RLS deaktiviert bleibt.

### Storage-RLS

- `storage.objects` hat 13 Policies
- `storage.buckets` hat 0 Policies

## 14. Welche Tabellen vermutlich in B13 gelöscht werden können

Mit den CSVs allein kann keine öffentliche Tabelle belastbar zum Löschen empfohlen werden.

Nur als spätere Prüfkandidaten [vermutlich] bleiben:

- `team_templates`
- `membership_request_recipients`

Diese beiden sind niedrig gekoppelt, aber nicht sicher entbehrlich.

Nicht als Löschkandidaten behandeln:

- alle `auth.*`-Tabellen
- alle `storage.*`-Systemtabellen
- die Kernrelationen `teams`, `team_seasons`, `players`, `coaches`, `news`, `events`, `pages`, `admin_*`

## 15. Welche Tabellen zuerst geprüft werden müssen

Priorität für die nächste fachliche Prüfung:

1. `teams` und `team_seasons`
2. `players` und `coaches`
3. `player_team_seasons` und `coach_team_seasons`
4. `events` und `news`
5. `admin_profiles`, `admin_roles`, `admin_permissions`, `admin_user_roles`, `admin_role_permissions`
6. `storage.objects` und `storage.buckets`

Begründung: Hier treffen starke Beziehungen, doppelte Informationen, RLS-Risiken oder fehlende Indizes zusammen.

## 16. Welche Tabellen auf keinen Fall angerührt werden dürfen

Ohne extra Migrations- und Berechtigungskonzept sollten nicht angerührt werden:

- alle `auth.*`-Tabellen
- alle `storage.*`-Systemtabellen
- `admin_profiles`
- `admin_roles`
- `admin_permissions`
- `admin_role_permissions`
- `admin_user_roles`
- `teams`
- `team_seasons`
- `players`
- `coaches`
- `events`
- `news`
- `pages`

Das sind Kern- oder Systemtabellen mit direkter oder indirekter Kopplung.

## 17. Prioritätenliste für die Bereinigung

### Priorität 1

- RLS-Sicherheitslage prüfen, besonders die breiten `public`-Policies und die Tabellen mit RLS aus, aber Policies vorhanden
- fehlende Indizes auf `coaches.team_id`, `teams.department_id`, `admin_role_permissions.permission_id` prüfen

### Priorität 2

- doppelte Unique-Index-Definitionen bereinigen:
  - `coach_team_seasons`
  - `player_team_seasons`
  - `team_seasons`

### Priorität 3

- denormalisierte Team-/Personendaten prüfen:
  - `players`
  - `coaches`
  - `team_seasons`
  - `news`
  - `membership_requests`

### Priorität 4

- low-coupling Konfigurationstabellen später bewerten:
  - `team_templates`
  - `membership_request_recipients`
  - `departments`

### Priorität 5

- Storage-Export vervollständigen und danach nur noch gezielt auf Bucket-/Objektbereinigung gehen

## Kurzfazit

Die CSVs zeigen kein Bild eines „kaputten“ Schemas, aber sie zeigen deutlich:

- doppelte relationale Modellierung bei Teams/Personen
- mehrere doppelte Unique-Index-Definitionen
- RLS-Policies, die teils inert sind, weil RLS deaktiviert ist
- offene Public-Policies auf mehreren Kern-Tabellen
- wenige, aber klare fehlende Indizes auf zentralen FK-Spalten

Für eine echte Bereinigung sind zuerst die Kernrelationen und die RLS-/Index-Situation zu prüfen.
