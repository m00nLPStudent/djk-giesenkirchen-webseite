# Datenbank

Dieses Dokument beschreibt die Datenbankregeln und die geplante Tabellenstruktur.

## Grundregeln

- Die Datenbank ist die Basis jedes Moduls.
- Vor Codeänderungen wird geprüft, welche Spalten wirklich existieren.
- Spaltennamen werden nicht ohne Prüfung geändert.
- Bestehende Abfragen dürfen nicht unkontrolliert brechen.
- Neue Datenbankänderungen sollen später als Migration dokumentiert werden.

## Standardfelder

Jede Haupttabelle soll langfristig folgende Felder besitzen:

- id
- created_at
- updated_at
- sort_order
- is_active

## Aktuelle wichtige Tabellen

### teams

Mannschaften des Vereins.

Wichtige Felder:

- id
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
- sort_order
- is_active

### players

Spieler des Vereins.

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

## Beziehungen

### players.team_id

Verknüpft einen Spieler mit einer Mannschaft.

Ziel:

```sql
team_id uuid references public.teams(id) on delete set null
```

## Storage

### Bucket `media`

Aktuell genutzt für:

- Spielerbilder unter `players/`
- Platzhalterbild `players/Blanko.png`

Regeln:

- Platzhalterbilder dürfen nicht automatisch gelöscht werden.
- Eigene Spielerbilder werden beim Wechseln oder Entfernen aus Storage gelöscht.
- Für Löschen aus dem Browser-Client wird eine passende Storage-Policy benötigt.

## Zuletzt benötigte SQL-Ergänzungen für Spieler

```sql
ALTER TABLE public.players
ADD COLUMN IF NOT EXISTS gender text,
ADD COLUMN IF NOT EXISTS joined_at date;

NOTIFY pgrst, 'reload schema';
```

Falls `gender` bereits vorhanden ist, reicht:

```sql
ALTER TABLE public.players
ADD COLUMN IF NOT EXISTS joined_at date;

NOTIFY pgrst, 'reload schema';
```

## Vorgehen bei Änderungen

1. Bestehende Tabelle prüfen.
2. Betroffene Abfragen im Code prüfen.
3. SQL schreiben.
4. Service-Datei anpassen.
5. UI-Komponenten anpassen.
6. Lokal testen.
7. Änderungen committen.
