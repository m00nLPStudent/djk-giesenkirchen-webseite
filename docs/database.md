# Datenbank

Dieses Dokument beschreibt die Datenbankregeln und die aktuell relevante Tabellenstruktur.

## Grundregeln

- Die Datenbank ist die Basis jedes Moduls.
- Vor Codeänderungen wird geprüft, welche Spalten wirklich existieren.
- Spaltennamen werden nicht ohne Prüfung geändert.
- Bestehende Abfragen dürfen nicht unkontrolliert brechen.
- Neue Datenbankänderungen sollen später als Migration dokumentiert werden.
- Alte Spalten werden erst gelöscht, wenn der Code vollständig umgestellt und getestet ist.

## Standardfelder

Jede Haupttabelle soll langfristig folgende Felder besitzen:

- id
- created_at
- updated_at
- sort_order
- is_active

## Aktuelle wichtige Tabellen

### departments

Abteilungen des Vereins.

Wichtige Felder:

- id
- name_de
- name_en
- slug
- is_active
- sort_order
- created_at

### teams

Grund-Mannschaften des Vereins. Diese Tabelle bleibt die dauerhafte Mannschafts-Identität.

Wichtige Felder:

- id
- department_id
- name_de
- name_en
- slug
- age_group
- season
- description_de
- description_en
- training_times_de
- training_times_en
- team_image_url
- contact_name
- contact_email
- contact_phone
- contact_image_url
- fussball_de_matches_widget_id
- fussball_de_table_widget_id
- fussball_de_team_url
- sort_order
- is_active
- created_at

Hinweise:

- `teams` enthält aktuell noch ältere und fallbackrelevante Felder.
- Saisonabhängige Mannschaftsdaten werden neu über `team_seasons` geführt.
- Alte Felder in `teams` werden vorerst weiter befüllt, damit bestehende Abfragen nicht brechen.

### seasons

Zentrale Saisontabelle.

Wichtige Felder:

- id
- name
- slug
- is_current
- is_active
- sort_order
- created_at

Regeln:

- `is_current = true` bestimmt, welche Saison öffentlich angezeigt wird.
- Es soll öffentlich immer nur eine aktuelle Saison geben.
- Die Auswahl der aktuellen Saison erfolgt im Adminbereich über Mannschaft bearbeiten > Einstellungen.

Aktuelle Startwerte:

- 2026/2027
- 2027/2028

### team_seasons

Saison-Version einer Mannschaft.

Wichtige Felder:

- id
- team_id
- season_id
- name_de
- name_en
- slug
- age_group
- description_de
- description_en
- training_times_de
- training_times_en
- team_image_url
- contact_name
- contact_email
- contact_phone
- contact_image_url
- fussball_de_matches_widget_id
- fussball_de_table_widget_id
- fussball_de_team_url
- is_active
- sort_order
- created_at

Regeln:

- Pro `team_id` und `season_id` gibt es maximal einen Eintrag.
- Pro Saison darf ein Slug nur einmal vorkommen.
- Diese Tabelle ist die Hauptquelle für öffentliche Mannschaftsseiten.

### team_training_times

Strukturierte regelmäßige Trainingszeiten pro Mannschafts-Saison.

Wichtige Felder:

- id
- team_season_id
- weekday
- start_time
- end_time
- training_type
- location_name
- location_address
- location_city
- effective_from
- effective_until
- note
- is_active
- created_at

Regeln:

- ein Datensatz beschreibt genau einen Trainingstag
- Mehrfachauswahl im Admin erzeugt mehrere Datensätze, verändert aber nicht die Datenbankstruktur
- diese Tabelle ist die Basis für virtuelle Trainingstermine

### team_training_exceptions

Ausnahmen zu regulären Trainingszeiten.

Wichtige Felder:

- id
- team_training_time_id
- exception_date
- exception_type
- override_start_time
- override_end_time
- override_training_type
- override_location_name
- override_location_address
- override_location_city
- note
- is_active
- created_at

Regeln:

- `cancelled` entfernt das virtuelle Training an diesem Datum
- `moved` überschreibt Uhrzeit, Ort oder Trainingsart für genau dieses Vorkommen

### club_closure_periods

Vereinssperrzeiten für Trainings.

Wichtige Felder:

- id
- team_season_id
- starts_on
- ends_on
- applies_to_all
- is_active

Regeln:

- kann für einzelne Team-Saisons oder global gelten
- wird nur in der Laufzeitberechnung virtueller Trainings verwendet

### events

Allgemeine Vereinstermine und klassische Events.

Zusätzliche wichtige Felder im aktuellen Stand:

- slug
- event_type
- starts_at
- ends_at
- is_all_day
- location_name
- location_address
- location_city
- image_url
- external_url
- recurrence_type
- recurrence_interval
- recurrence_until
- recurrence_count
- is_published
- is_featured

Regeln:

- virtuelle Trainings werden **nicht** in dieser Tabelle gespeichert
- Wiederholungen werden zur Laufzeit expandiert, nicht als eigene Zeilen angelegt

### event_documents

Dateien für echte Events.

Wichtige Felder:

- id
- event_id
- file_name
- file_path
- display_name_de
- description_de
- file_url
- mime_type
- file_size
- is_public
- sort_order
- created_at

Regeln:

- nur echte Events nutzen diese Tabelle
- virtuelle Trainings haben aktuell keine Dokumente

### players

Zentrale Spieler des Vereins.

Aktueller Zielstandard für das abgeschlossene Spielermodul:

- id
- team_id
- first_name
- last_name
- name_de
- name_en
- shirt_number
- position_de
- position_en
- image_url
- photo_url
- description_de
- description_en
- birthdate
- joined_at
- year_group
- strong_foot
- nationality
- gender
- sort_order
- is_active
- is_captain
- created_at

Hinweise:

- `photo_url` ist das Hauptfeld für Spielerbilder.
- `image_url` wird weiterhin mitgeführt, damit bestehende alte Abfragen nicht brechen.
- `year_group` wird aus `birthdate` berechnet und gespeichert.
- `gender`, `nationality`, `birthdate`, `first_name`, `last_name`, `team_id` und `position_de` sind im Formular Pflichtfelder.
- `joined_at` wird für die Profil-Kachel „Im Verein seit“ verwendet.
- Spieler ohne eigenes Bild nutzen das Platzhalterbild `players/Blanko.png` im Storage-Bucket `media`.
- Die direkte Spalte `team_id` bleibt vorerst als Fallback bestehen.
- Die saisonabhängige Zuordnung läuft zusätzlich über `player_team_seasons`.

### player_team_seasons

Saisonabhängige Zuordnung von Spielern zu Mannschaften.

Wichtige Felder:

- id
- player_id
- team_season_id
- shirt_number
- position_de
- position_en
- is_captain
- is_active
- sort_order
- created_at

Regeln:

- Ein Spieler kann pro Saison einer Mannschaftsversion zugeordnet werden.
- Die öffentliche Mannschaftsseite lädt den Kader bevorzugt über diese Tabelle.
- Falls keine Zuordnung vorhanden ist, gibt es aktuell noch einen Fallback über `players.team_id`.

### coaches

Zentrale Trainer und Betreuer des Vereins.

Wichtige Felder:

- id
- team_id
- name
- first_name
- last_name
- slug
- role
- role_de
- role_en
- email
- phone
- whatsapp
- license
- nationality
- image_url
- photo_url
- team_name
- team_slug
- is_active
- sort_order
- created_at

Hinweise:

- `image_url` ist das aktuelle Hauptfeld für Trainerbilder.
- `phone` und `whatsapp` werden normalisiert gespeichert.
- Die öffentliche Anzeige nutzt zentrale Telefonnummer-Helfer aus `src/lib/phone.js`.
- Die direkte Spalte `team_id` bleibt vorerst als Fallback bestehen.
- Die saisonabhängige Zuordnung läuft zusätzlich über `coach_team_seasons`.

### coach_team_seasons

Saisonabhängige Zuordnung von Trainern und Betreuern zu Mannschaften.

Wichtige Felder:

- id
- coach_id
- team_season_id
- role_de
- role_en
- is_active
- sort_order
- created_at

Regeln:

- Trainer und Betreuer werden zentral angelegt.
- Die Zuordnung zur Mannschaft erfolgt saisonabhängig im Mannschaftsformular.
- Die öffentliche Mannschaftsseite lädt Trainer bevorzugt über diese Tabelle.
- Falls keine Zuordnung vorhanden ist, gibt es aktuell noch einen Fallback über `coaches.team_id`.

### news

Newsbeiträge des Vereins.

Wichtige Felder:

- id
- title_de
- title_en
- slug
- teaser_de
- teaser_en
- content_de
- content_en
- image_url
- is_published
- published_at
- scheduled_at
- author
- category
- created_at

## Beziehungen

### departments.id -> teams.department_id

Eine Mannschaft gehört optional zu einer Abteilung.

### teams.id -> team_seasons.team_id

Eine Mannschaft kann mehrere Saison-Versionen besitzen.

### seasons.id -> team_seasons.season_id

Eine Saison kann mehrere Mannschafts-Versionen enthalten.

### team_seasons.id -> player_team_seasons.team_season_id

Eine Mannschafts-Saison kann mehrere Spielerzuordnungen enthalten.

### players.id -> player_team_seasons.player_id

Ein Spieler kann saisonabhängig Mannschaften zugeordnet werden.

### team_seasons.id -> coach_team_seasons.team_season_id

Eine Mannschafts-Saison kann mehrere Trainer-/Betreuerzuordnungen enthalten.

### coaches.id -> coach_team_seasons.coach_id

Ein Trainer oder Betreuer kann saisonabhängig Mannschaften zugeordnet werden.

## Storage

### Bucket `media`

Aktuell genutzt für:

- Spielerbilder unter `players/`
- Trainerbilder
- Mannschaftsbilder
- Kontaktbilder
- Platzhalterbild `players/Blanko.png`

Regeln:

- Platzhalterbilder dürfen nicht automatisch gelöscht werden.
- Eigene Bilder werden beim Wechseln oder Entfernen aus Storage gelöscht, sofern sie nicht als Platzhalter markiert sind.
- Für Löschen aus dem Browser-Client wird eine passende Storage-Policy benötigt.

## Zuletzt benötigte SQL-Ergänzungen für Saisonlogik

```sql
create table public.seasons (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  is_current boolean default false,
  is_active boolean default true,
  sort_order integer default 0,
  created_at timestamp with time zone default now()
);

insert into public.seasons (name, slug, is_current, sort_order)
values
('2026/2027', '2026-2027', true, 1),
('2027/2028', '2027-2028', false, 2);
```

```sql
create table public.team_seasons (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  season_id uuid not null references public.seasons(id) on delete cascade,
  name_de text not null,
  name_en text,
  slug text not null,
  age_group text,
  description_de text,
  description_en text,
  training_times_de text,
  training_times_en text,
  team_image_url text,
  contact_name text,
  contact_email text,
  contact_phone text,
  contact_image_url text,
  fussball_de_matches_widget_id text,
  fussball_de_table_widget_id text,
  fussball_de_team_url text,
  is_active boolean default true,
  sort_order integer default 0,
  created_at timestamp with time zone default now(),
  unique (team_id, season_id),
  unique (season_id, slug)
);
```

```sql
create table public.player_team_seasons (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  team_season_id uuid not null references public.team_seasons(id) on delete cascade,
  shirt_number integer,
  position_de text,
  position_en text,
  is_captain boolean default false,
  is_active boolean default true,
  sort_order integer default 0,
  created_at timestamp with time zone default now(),
  unique (player_id, team_season_id)
);
```

```sql
create table public.coach_team_seasons (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.coaches(id) on delete cascade,
  team_season_id uuid not null references public.team_seasons(id) on delete cascade,
  role_de text default 'Trainer',
  role_en text default 'Coach',
  is_active boolean default true,
  sort_order integer default 0,
  created_at timestamp with time zone default now(),
  unique (coach_id, team_season_id)
);
```

## RLS / Policies für neue Saison-Tabellen

Für die neue Saisonlogik wurden Lese- und Schreibrechte benötigt:

```sql
alter table public.seasons enable row level security;
alter table public.team_seasons enable row level security;
alter table public.player_team_seasons enable row level security;
alter table public.coach_team_seasons enable row level security;

create policy "Allow read seasons"
on public.seasons
for select
using (true);

create policy "Allow read team seasons"
on public.team_seasons
for select
using (true);

create policy "Allow read player team seasons"
on public.player_team_seasons
for select
using (true);

create policy "Allow read coach team seasons"
on public.coach_team_seasons
for select
using (true);

create policy "Allow write seasons"
on public.seasons
for all
using (true)
with check (true);

create policy "Allow write team seasons"
on public.team_seasons
for all
using (true)
with check (true);

create policy "Allow write player team seasons"
on public.player_team_seasons
for all
using (true)
with check (true);

create policy "Allow write coach team seasons"
on public.coach_team_seasons
for all
using (true)
with check (true);
```

## Spätere Bereinigung

Noch nicht löschen, aber später prüfen:

### teams

- season
- age_group
- description_de / description_en
- training_times_de / training_times_en
- team_image_url
- contact\_\*
- fussball*de*\*
- fupa\_\*
- dfb\_\*

Diese Felder liegen langfristig saisonabhängig in `team_seasons`.

### players

- jersey_number, falls `shirt_number` final genutzt wird
- position, falls `position_de` / `position_en` final genutzt werden
- name_de / name_en, falls `first_name` / `last_name` final reichen
- team_id, sobald alle Kader vollständig über `player_team_seasons` laufen

### coaches

- team_id, sobald alle Zuordnungen vollständig über `coach_team_seasons` laufen
- team_slug
- team_name
- role, falls `role_de` / `role_en` final reichen
- photo_url oder image_url, sobald ein Bildfeld final definiert ist
- name, falls `first_name` / `last_name` final reichen

## Vorgehen bei Änderungen

1. Bestehende Tabelle prüfen.
2. Betroffene Abfragen im Code prüfen.
3. SQL schreiben.
4. Service-Datei anpassen.
5. UI-Komponenten anpassen.
6. Lokal testen.
7. Änderungen committen.
