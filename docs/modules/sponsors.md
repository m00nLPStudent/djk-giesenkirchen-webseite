# Modul: Sponsoren

## Status

In Arbeit.

## Ziel

Sponsoren der Fußballabteilung sollen öffentlich sichtbar und im Adminbereich pflegbar sein.

## Öffentliche Seite

Pfad: `/fussball/sponsoren`

Kategorien:

- Mannschaftssponsoren
- Bannersponsoren
- Allgemeine Sponsoren

## Öffentliche Darstellung

Jeder Sponsor wird als einheitliche Karte dargestellt:

- Banner/Logo in einheitlicher Größe
- Name
- Beschreibung
- Link zur Webseite über die Karte
- Social-Media-Icons für Facebook, Instagram und TikTok

## Adminbereich

Pfad: `/admin/sponsors`

Funktionen:

- Sponsor anlegen
- Sponsor bearbeiten
- Sponsor löschen
- Kategorie auswählen
- Banner hochladen
- Beschreibung pflegen
- Webseite hinterlegen
- Social-Media-Links hinterlegen
- Aktiv/Inaktiv steuern
- Sortierung pflegen

## Datenbank

### sponsor_categories

Speichert die Sponsor-Kategorien.

### sponsors

Speichert die Sponsoren.

Wichtige Felder:

- `category_id`
- `name`
- `description_de`
- `description_en`
- `image_url`
- `website_url`
- `facebook_url`
- `instagram_url`
- `tiktok_url`
- `is_active`
- `sort_order`

## Löschlogik

Sponsoren werden über das zentrale Löschmodul gelöscht:

```text
AdminRemoveButton
→ removeActions.js
→ remove_entity('sponsor')
```

Es wird nur der Sponsor gelöscht. Andere Inhalte bleiben erhalten.
