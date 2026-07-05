# Modul: News

## Status

Umgesetzt und produktiv genutzt.

## Funktionen

- News erstellen
- News bearbeiten
- News veröffentlichen oder planen
- Kategorie auswählen
- Fußball-News optional einer Mannschaft zuordnen
- Öffentliche News-Karten auf Startseite und Übersicht
- Einzelne News-Detailseite
- Dokumente/Downloads pro News
- Suche und Pagination in der News-Übersicht

## Datenbank

Aktuelle Tabellen: `news`, `news_documents`

Wichtige Felder:

- `title_de`
- `teaser_de`
- `content_de`
- `image_url`
- `category`
- `category_key`
- `football_team_id`
- `author`
- `is_published`
- `published_at`

## Hinweise

- News-Dokumente werden im Admin gepflegt und öffentlich auf der Detailseite angezeigt.
- Offene Weiterentwicklungen (z. B. zusätzliche Taxonomien) sind kein Blocker für den aktuellen Live-Stand.
