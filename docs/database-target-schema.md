# Datenbank Zielstruktur

## Status

Diese Datei beschreibt die geplante Zielstruktur für die spätere Live-Datenbank.

Die aktuelle Supabase-Datenbank bleibt Entwicklungsdatenbank. Altlasten müssen dort nicht zwingend gelöscht werden. Beim späteren Umzug werden nur die sauberen Zieltabellen und Zielfelder übernommen.

## Grundprinzipien

- Keine doppelten Datenfelder
- Saisonfähige Mannschaftsdaten
- Relationale Zuordnungen statt Freitext, wo sinnvoll
- Admin- und Website-Daten sauber trennen
- Alte Test- oder Übergangsfelder nicht in die Live-Datenbank übernehmen

## Tabellen übernehmen

### departments

Abteilungen des Vereins.

### team_templates

Vorlagen für Mannschaften wie Bambinis, E1-Jugend, 1. Herren oder 1. Damen.

### teams

Stammdatensatz einer Mannschaft. Saisonabhängige Daten sollen langfristig nicht hier gepflegt werden.

### seasons

Saisonverwaltung inklusive öffentlich angezeigter Saison.

### team_seasons

Saisonabhängige Mannschaftsdaten wie Name, Beschreibung, Training, Kontakt, Bilder und Widget-IDs.

### players

Stammdatensatz eines Spielers.

### coaches

Stammdatensatz eines Trainers oder Betreuers.

### player_team_seasons

Saisonabhängige Spielerzuordnung.

### coach_team_seasons

Saisonabhängige Trainerzuordnung.

### news

News-Beiträge mit Kategorie und optionaler Mannschaftszuordnung.

## Felder, die später nicht übernommen werden sollen

### teams

- `season`
- alte FuPa-Felder, wenn nicht mehr genutzt
- alte DFB/Fußball.de URL-Felder, wenn nur Widget-IDs benötigt werden

### players

- `jersey_number`, wenn `shirt_number` genutzt wird
- `position`, wenn `position_de` genutzt wird
- `image_url`, wenn `photo_url` genutzt wird
- `name_de`
- `name_en`

### coaches

- `team_slug`
- `team_name`
- `photo_url`, wenn `image_url` genutzt wird
- `role`, wenn `role_de` genutzt wird

## Geplante Tabellen

- `users`
- `roles`
- `permissions`
- `settings`
- `media_library`
- `news_categories`
- `events`
- `sponsors`
- `sponsor_categories`
- `gallery`
- `gallery_images`
- `downloads`
- `documents`
- `social_links`
- `menu_items`

## Migrationsregel

Vor dem Livegang wird eine neue Zielstruktur erstellt. Danach werden nur geprüfte Daten aus der Entwicklungsdatenbank übernommen.
