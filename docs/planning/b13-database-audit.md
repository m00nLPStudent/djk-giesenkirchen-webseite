# B13.1 - Vollstaendiges Datenbank-Audit (Read-Only)

Status: erstellt (Read-Only Analyse)

## Scope und Methodik

Dieses Audit wurde ohne SQL-Ausfuehrung, ohne Migration und ohne Datenbankmutation erstellt.

Datenbasis:

- Quellcode-Analyse aller Supabase-Zugriffe in `src` (`.from(...)`, `.rpc(...)`, Storage-Helper-Nutzung)
- Architektur-Dokumentation in `docs/architecture/database.md`
- SQL-Dokumente unter `docs/sql/*.sql`
- Migrationsdateien unter `supabase/migrations/*.sql`

Wichtige Einschraenkung:

- Ein direkter Katalog-Read ueber `information_schema` via Supabase-REST war nicht moeglich (`Invalid schema: information_schema`).
- Daher basiert die Tabellen-/Spalten-/Index-/Trigger-/Funktionssicht auf Code, Migrationen und SQL-Dokumentation.

## Tabellenuebersicht

### A) Im Code aktiv referenzierte Tabellen

- `admin_permissions`
- `admin_profile_team_assignments`
- `admin_profiles`
- `admin_role_permissions`
- `admin_roles`
- `admin_user_roles`
- `board_members`
- `board_roles`
- `club_closure_periods`
- `club_contacts`
- `club_history_images`
- `club_history_milestones`
- `club_history_pages`
- `club_settings`
- `coach_team_seasons`
- `coaches`
- `event_documents`
- `events`
- `membership_request_recipients`
- `membership_requests`
- `news`
- `news_documents`
- `pages`
- `player_team_seasons`
- `players`
- `seasons`
- `sponsor_categories`
- `sponsors`
- `team_seasons`
- `team_templates`
- `team_training_exceptions`
- `team_training_times`
- `teams`

### B) In SQL-Dokumenten/Migrationen vorhanden (teils proposal-only)

- `membership_contributions` (proposal, optional)
- `membership_contribution_payments` (proposal, optional)

### C) Potenzielle Luecken zwischen Code und produktivem DB-Stand

- `admin_profile_team_assignments` wird im Code gelesen, die zugehoerige SQL-Datei ist jedoch als "SUPERSEDED / DO NOT EXECUTE" markiert.
- Risiko: Laufzeitfehler oder inaktive Scope-Pfade, falls Tabelle in produktiver DB nicht existiert.

Prioritaet: Hoch

## Spaltenanalyse

### Verifizierbar aus Migrationen

- `events.slug` (NOT NULL, unique index)
- `events.recurrence_type` (default/not null, check)
- `events.recurrence_interval` (default, check >= 1)
- `events.recurrence_until`
- `events.recurrence_count` (check >= 1/null)
- Vorbereitung in Migration: `board_members.admin_profile_id`, `coaches.admin_profile_id`

### Verifizierbar aus SQL-Proposals (nicht zwingend produktiv)

- Workflow-Felder proposal-only in `news`/`events`:
  `workflow_status`, `submitted_at`, `reviewed_at`, `reviewed_by`, `published_by`
- Beitrags-Tabellen proposal-only mit umfangreichen Betrags-/Statusfeldern

### Beobachtete Redundanz auf Spaltenebene

- `players.team_id` und `coaches.team_id` werden parallel zu `player_team_seasons`/`coach_team_seasons` genutzt (Legacy-Fallback im Code vorhanden).
- Risiko: inkonsistente Teamzuordnung je nach Querypfad und Saisonkontext.

Prioritaet: Hoch

## Beziehungen

### Klar aus Code und Doku erkennbar

- `team_seasons.team_id -> teams.id`
- `team_seasons.season_id -> seasons.id`
- `player_team_seasons.player_id -> players.id`
- `player_team_seasons.team_season_id -> team_seasons.id`
- `coach_team_seasons.coach_id -> coaches.id`
- `coach_team_seasons.team_season_id -> team_seasons.id`
- `membership_requests.team_id -> teams.id` (indirekt bestaetigt durch relationale Selects)
- `news_documents.news_id -> news.id` (fachlich/konsistent mit Servicezugriffen)
- `event_documents.event_id -> events.id` (fachlich/konsistent mit Servicezugriffen)

### Admin/Auth-Beziehungen

- `admin_user_roles.user_id -> auth.users.id` (fachliche Annahme; in SQL-Doku nicht vollstaendig ausmodelliert)
- `admin_user_roles.role_id -> admin_roles.id`
- `admin_role_permissions.role_id -> admin_roles.id`
- `admin_role_permissions.permission_id -> admin_permissions.id`

### Proposal-/Migrations-Beziehungen

- `board_members.admin_profile_id -> admin_profiles.id` (vorbereitete Migration)
- `coaches.admin_profile_id -> admin_profiles.id` (vorbereitete Migration)
- `membership_contribution_payments.contribution_id -> membership_contributions.id` (proposal-only)

Prioritaet: Mittel

## Storage

### Aktiv genutzte Buckets

- `media`
- `news-documents`
- `events-documents`

### Nutzungsmuster

- Zentraler Zugriff ueber `src/lib/storage.js`
- News-Dokumente werden in `news-documents` gespeichert/entfernt
- Event-Dokumente werden in `events-documents` gespeichert/entfernt
- Bilder/Uploads allgemein in `media`

### Risiken

- Keine zentrale Bucket-Inventur aus DB/Storage-Metadaten vorhanden (nur codebasiert).
- Potenzielle Altlasten in Buckets (verwaiste Dateien) koennen read-only nicht verifiziert werden.

Prioritaet: Mittel

## RLS

### Dokumentierter Stand

- `docs/sql/admin-auth-rls.sql` setzt RLS auf:
  - `admin_profiles`
  - `admin_roles`
  - `admin_permissions`
  - `admin_role_permissions`
  - `admin_user_roles`
- SELECT-Policies fuer `authenticated` jeweils mit `USING (true)`.

### Risikobewertung

- `USING (true)` fuer authentifizierte Nutzer erlaubt Voll-Lesezugriff auf die genannten Admin-Auth-Tabellen.
- Das kann fachlich gewollt sein, ist aber sicherheitlich breit.
- Write-Policies sind separat als optional dokumentiert (`admin-users-rls-write.sql`) mit `is_superadmin_actor()`.

Prioritaet: Hoch

## Trigger

### In aktiven Migrationen

- Keine neuen Trigger in den drei vorliegenden `supabase/migrations/*`-Dateien.

### In SQL-Proposals

- `set_admin_profile_team_assignments_updated_at()` + Trigger (SUPERSEDED proposal)
- `set_membership_contributions_updated_at()` + Trigger (OPTIONAL proposal)
- `set_membership_contribution_payments_updated_at()` + Trigger (OPTIONAL proposal)

Bewertung:

- Trigger-Strategie fuer `updated_at` ist inkonsistent verteilt (proposal-basiert, kein ersichtlicher globaler Standard in den vorliegenden Dateien).

Prioritaet: Mittel

## Funktionen

### Gefundene DB-Funktionen in SQL-Dokumenten

- `public.is_superadmin_actor()` (optional RLS-write helper)
- proposal-only trigger helper Funktionen fuer `updated_at`

### Gefundene RPC-Aufrufe im Code

- `remove_entity` (mehrfach genutzt)

Risiko:

- Definition von `remove_entity` ist in den geprueften SQL-Dateien nicht enthalten.
- Ohne explizite Funktionsdokumentation besteht Betriebsrisiko bei Reproduzierbarkeit/Onboarding.

Prioritaet: Hoch

## Indizes

### Verifiziert in Migrationen

- `idx_events_slug_unique` auf `events(slug)`
- `idx_board_members_admin_profile_id` (vorbereitete Migration)
- `idx_coaches_admin_profile_id` (vorbereitete Migration)
- partielle Unique-Indizes auf `admin_profile_id` fuer `board_members` und `coaches` (vorbereitete Migration)

### In SQL-Proposals

- Team-Assignments: Unique + Lookup-Indizes
- Membership-Contributions: mehrere fachliche Indizes (Status, Saison, Person)
- Membership-Payments: contribution + paid_at
- Content-Workflow: status-Indizes auf `news`/`events`

Bewertung:

- Fuer produktive Tabellen ist ohne DB-Katalogabfrage kein vollstaendiger Ist-Abgleich moeglich (z. B. doppelte/fehlende Altindizes).

Prioritaet: Mittel

## Redundanzen

### Identifiziert

- Personen-Team-Zuordnung doppelt modelliert:
  - direkt: `players.team_id` / `coaches.team_id`
  - saisonal: `player_team_seasons` / `coach_team_seasons`
- Scope-Modell kombiniert rollenbasierte globale Reichweite und potenziell explizite Team-Assignments.

Auswirkung:

- Hoehere Komplexitaet in Berechtigungs- und Filterlogik
- Erhoehtes Risiko fuer divergierende Datenpfade

Prioritaet: Hoch

## Altlasten

### Wahrscheinliche Altlasten/Inkonsistenzen

- Proposal-SQLs mit Status `SUPERSEDED`/`OPTIONAL` liegen parallel zu produktivem Code vor und koennen den realen Zielzustand unklar machen.
- `admin_profile_team_assignments`: im Code referenziert, proposal aber als nicht erforderlich markiert.
- Rollen-/Permission-Anpassung weiterhin als manuell auszufuehrender SQL-Entwurf dokumentiert.

Prioritaet: Hoch

## Empfehlungen

### Hoch

1. Verbindlichen DB-Ist-Export erstellen (Tabellen, Spalten, Constraints, FK, Indizes, Trigger, Funktionen, Policies) und gegen Code-Matrix spiegeln.
2. Entscheidung zur Personen-Team-Quelle treffen: Legacy `team_id` final abschaffen oder als kanonisch definieren; Mischbetrieb beenden.
3. RLS fuer Admin-Auth-Tabellen haerten: statt pauschalem `USING (true)` auf minimal erforderliche Sichtbarkeit umstellen.
4. RPC `remove_entity` offiziell dokumentieren (Signatur, Rechte, Seiteneffekte, Fehlerverhalten).

### Mittel

1. Storage-Bucket-Inventur mit Dateireferenz-Check gegen DB-Referenzen (verwaiste Dateien, tote URLs).
2. Trigger-Strategie fuer `updated_at` standardisieren (einheitliche Funktion/Benennung).
3. Proposal-Dateien archivieren oder klar in aktive vs. historische DDL-Pfade trennen.

### Niedrig

1. SQL-Dokumentationsstil vereinheitlichen (Statusheader, Ausfuehrbarkeit, Abhaengigkeiten).
2. Zusatzindex-Review fuer seltene Admin-Listen/Filter nach realen Query-Patterns.

## Prioritaetsmatrix (Kompakt)

- Hoch:
  - Konsistenter Ist-Zustand DB vs. Code
  - RLS-Haertung im Admin-Auth-Bereich
  - Redundanzabbau bei Team-Zuordnungen
  - RPC-Dokumentation `remove_entity`
- Mittel:
  - Storage-Bereinigung und Trigger-Standard
  - DDL-Artefaktstruktur (aktive vs. historische SQL)
- Niedrig:
  - Dokumentationsharmonisierung
  - Feintuning einzelner Indizes

## Abschluss

Dieses Dokument ist ein read-only Architektur-Audit mit Fokus auf Konsistenz, Sicherheit und Wartbarkeit.
Es wurden keine Datenbankaenderungen, keine SQL-Ausfuehrungen und keine Migrationen durchgefuehrt.
