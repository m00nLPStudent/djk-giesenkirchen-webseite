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

Aktueller Zielstandard für das Spielermodul:

- id
- team_id
- first_name
- last_name
- name_de
- name_en
- shirt_number
- position_de
- position_en
- photo_url
- description_de
- description_en
- birthdate
- year_group
- strong_foot
- nationality
- sort_order
- is_active
- is_captain
- created_at

Hinweis: Bestehende Spalten wie `shirt_number`, `position_de`, `position_en` und `photo_url` werden aktuell bevorzugt, damit vorhandene Abfragen nicht brechen.

## Beziehungen

### players.team_id

Verknüpft einen Spieler mit einer Mannschaft.

Ziel:

```sql
team_id uuid references public.teams(id) on delete set null
```

## Vorgehen bei Änderungen

1. Bestehende Tabelle prüfen.
2. Betroffene Abfragen im Code prüfen.
3. SQL schreiben.
4. Service-Datei anpassen.
5. UI-Komponenten anpassen.
6. Lokal testen.
7. Änderungen committen.
