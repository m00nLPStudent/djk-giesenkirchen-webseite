# B13.2 - Code ↔ Datenbank-Abgleich

Status: Abgleich auf Basis der CSV-Exporte in `docs/datenbank_docu` und der aktuell geladenen Runtime-Implementierung in `src`

## Methodik

Für diesen Abgleich wurden nur zwei Quellen verwendet:

- die CSV-Exporte unter `docs/datenbank_docu`
- der aktuell im Projekt ausgeführte Code in `src`

Es wurden keine SQL-Abfragen gegen die Datenbank ausgeführt und keine Schemaänderungen vorgenommen. Tabellen und Spalten wurden nur dann als aktiv eingestuft, wenn sie im Runtime-Code direkt gelesen, geschrieben, gefiltert, über Joins referenziert oder über ein RPC / Storage-Helper-Pattern erreicht werden.

## Inventur in Zahlen

- 64 Tabellen insgesamt
- 33 Tabellen im Schema `public`
- 23 Tabellen im Schema `auth`
- 8 Tabellen im Schema `storage`
- 439 öffentliche Spalten in `b13-02-columns.csv`
- 105 Constraints
- 28 Foreign Keys
- 107 Indizes
- 11 fachliche Trigger
- 86 Funktionen
- 139 RLS-Policies
- 3 Storage-Buckets

Hinweis: Die Storage-Zusammenfassung in `b13-11-storage-summary.csv` enthält in der vorliegenden Fassung nur den Header.

## Tabellen-Mapping

### Klar aktive Runtime-Strukturen

Diese Tabellen sind im aktuellen Code eindeutig aktiv und sollten als Teil des laufenden Modells behandelt werden:

- `teams`, `seasons`, `team_seasons`
- `player_team_seasons`, `coach_team_seasons`
- `team_training_times`, `team_training_exceptions`
- `players`, `coaches`, `board_members`
- `news`, `news_documents`, `events`, `event_documents`
- `club_settings`, `club_contacts`, `pages`
- `membership_requests`, `membership_request_recipients`
- `admin_profiles`, `admin_roles`, `admin_permissions`, `admin_user_roles`, `admin_role_permissions`
- `club_history_pages`, `club_history_images`, `club_history_milestones`
- `sponsors`

### Aktive Lesepfade ohne klaren Schreibpfad im inspizierten Code

Diese Tabellen sind runtime-relevant, aber im inspizierten Slice nur lesend sichtbar:

- `board_roles`
- `sponsor_categories`
- `team_templates`
- `club_closure_periods`

### Unklare Tabellen

Für `departments` habe ich im inspizierten Runtime-Slice keinen belastbaren direkten Tabellenzugriff gesehen. Das ist daher noch kein Löschkandidat, aber ein echter Klärungspunkt für B13.3.

## Spalten-Mapping

### Teams / Saisons / Zuordnungen

Der zentrale Schreibpfad ist [src/components/admin/teams/services/teams.service.js](../src/components/admin/teams/services/teams.service.js), ergänzt durch [src/app/admin/teams/actions.js](../src/app/admin/teams/actions.js), [src/app/admin/teams/page.js](../src/app/admin/teams/page.js) und [src/lib/admin-auth/scopes/scopeRepository.js](../src/lib/admin-auth/scopes/scopeRepository.js).

- `teams` wird aktiv geschrieben und gelesen.
- `seasons` wird für die aktuelle Saison und die Team-Saison-Zuordnung gelesen.
- `team_seasons` ist das operative Saisonmodell für Mannschaften.
- `player_team_seasons` und `coach_team_seasons` sind aktive Relationstabellen; sie werden für Scope, Zuordnung und Trainingstransformation verwendet.
- `team_id` in `players` und `coaches` ist ein Legacy-Fallback und bleibt nur als Kompatibilitätsanker erhalten.

### Spieler / Trainer / Vorstand

Die Personenmodule sind klar aktiv:

- [src/components/admin/players/services/players.service.js](../src/components/admin/players/services/players.service.js)
- [src/app/admin/players/actions.js](../src/app/admin/players/actions.js)
- [src/components/admin/coaches/services/coaches.service.js](../src/components/admin/coaches/services/coaches.service.js)
- [src/app/admin/coaches/actions.js](../src/app/admin/coaches/actions.js)
- [src/components/admin/board/services/board.service.js](../src/components/admin/board/services/board.service.js)
- [src/app/admin/department/board/actions.js](../src/app/admin/department/board/actions.js)

Wichtigste Legacy-Felder:

- `players.team_id` ist ein direkter Legacy-Fallback neben `player_team_seasons`.
- `players.photo_url` wird als Kompatibilitätsfeld gemeinsam mit `players.image_url` gepflegt.
- `coaches.team_id` und `coaches.team_name` sind Legacy-/Snapshot-Felder neben der relationellen Zuordnung.

### News / Events / Dokumente

Die Content-Module sind aktiv und werden sowohl im Admin als auch öffentlich verwendet:

- [src/components/admin/news/services/news.service.js](../src/components/admin/news/services/news.service.js)
- [src/app/admin/news/page.js](../src/app/admin/news/page.js)
- [src/app/(website)/news/page.js](<../src/app/(website)/news/page.js>)
- [src/app/(website)/news/[slug]/page.js](<../src/app/(website)/news/[slug]/page.js>)
- [src/components/admin/events/services/events.service.js](../src/components/admin/events/services/events.service.js)
- [src/app/admin/events/page.js](../src/app/admin/events/page.js)
- [src/app/(website)/termine/[slug]/page.js](<../src/app/(website)/termine/[slug]/page.js>)

Die wichtigsten Runtime-Spalten sind:

- `slug`, `is_published`, `published_at`, `starts_at`, `ends_at`
- `news_documents.file_path`, `news_documents.file_url`, `event_documents.file_path`, `event_documents.file_url`
- `team_id` bzw. `football_team_id` als relationelle Verknüpfung

### Storage

Storage ist klar produktiv angebunden:

- [src/lib/storage.js](../src/lib/storage.js)
- `media`
- `news-documents`
- `events-documents`

Die Dokument-Buckets werden in den News- und Event-Services direkt beschrieben und ausgelesen.

### Admin / Auth / Rollenmodell

Das Berechtigungsmodell ist aktiv und zentral:

- [src/lib/admin-auth/adminActionPermissions.js](../src/lib/admin-auth/adminActionPermissions.js)
- [src/lib/admin-auth/scopes/scopeRepository.js](../src/lib/admin-auth/scopes/scopeRepository.js)
- [src/lib/admin-auth/adminDiagnostics.js](../src/lib/admin-auth/adminDiagnostics.js)
- [src/lib/admin-auth/adminRoles.repository.js](../src/lib/admin-auth/adminRoles.repository.js)
- [src/lib/admin-auth/adminPermissions.repository.js](../src/lib/admin-auth/adminPermissions.repository.js)
- [src/lib/admin-auth/userRoles.repository.js](../src/lib/admin-auth/userRoles.repository.js)
- [src/lib/admin-auth/adminProfiles.repository.js](../src/lib/admin-auth/adminProfiles.repository.js)

Wichtige Tabellen:

- `admin_profiles`
- `admin_roles`
- `admin_permissions`
- `admin_user_roles`
- `admin_role_permissions`

Die Server-Action-Checks sind zusätzlich über RPC-/Policy-Fehlererkennung abgesichert. Das heißt: RLS muss immer zusammen mit den Server-Guards gelesen werden, nicht isoliert.

## Legacy-Fallbacks und Duplikate

Diese Muster sind im Runtime-Code sichtbar:

- `players.team_id` wird als direktes Fallback zur relationellen Zuordnung weiter genutzt.
- `coaches.team_id` und `coaches.team_name` sind Snapshots neben der aktuellen Zuordnung.
- `players.photo_url` und `players.image_url` werden gemeinsam gepflegt.
- `news` und `events` arbeiten mit relationellen Feldern plus Dokument-Tabellen und Storage-URLs.
- `membership_requests` speichert Workflow-Snapshots; die Fachlogik scheint bewusst denormalisiert.

## Eindeutig aktive Strukturen

Diese Strukturen sollten für B13.3 als sicher aktiv gelten:

- Teamdaten, Saisonmodell und Trainingslogik
- Personenmodule für Spieler, Trainer und Vorstand
- News, Events und zugehörige Dokumente
- Admin-Rollen, -Rechte und Profilzuordnungen
- Vereinskonfiguration, Kontakte und CMS-Seiten
- Sponsorendaten und Sponsoren-Ansichten

## Kandidaten ohne belastbare Runtime-Referenz

Mit der derzeitigen Evidenz sind diese Tabellen / Bereiche noch offen:

- `departments`
- einzelne Snapshot-/Workflow-Spalten in `membership_requests`, sofern sie nicht in noch nicht inspizierten UI-Teilen verwendet werden
- einzelne alte Content-Felder in `news`, sofern sie nur noch historisch vorhanden sind

## Unklare Fälle

Diese Fragen sollten vor einer Modellbereinigung beantwortet werden:

1. Ist `players.team_id` dauerhaft nur noch Fallback, oder bleibt das ein bewusst unterstützter Schreibpfad?
2. Soll `coaches.team_name` als Snapshot bestehen bleiben oder mittelfristig entfernt werden?
3. Sind `news.category`, `news.category_key` und `news.scheduled_at` noch fachlich aktiv oder nur Altbestand?
4. Werden die Snapshot-Felder in `membership_requests` noch im Live-Workflow ausgewertet?
5. Hat `departments` noch einen produktiven Datenpfad, der im aktuellen Code nur nicht sichtbar war?

## Priorität für B13.3

Für den nächsten Schritt sollte zuerst die Schnittmenge aus folgenden Bereichen bereinigt oder bestätigt werden:

1. Teams / Saison / Zuordnung
2. Personenmodule mit Legacy-Fallbacks
3. News / Events / Dokumente
4. Admin-/Rollenmodell und RLS-Bezug
5. Unklare Resttabellen wie `departments`
