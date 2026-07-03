# Modul: Sponsoren

## Status

Abgeschlossen.

## Ziel

Sponsoren der Fußballabteilung sind öffentlich sichtbar und im Adminbereich vollständig pflegbar.

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
- Banner/Logo optional als Link zur Webseite
- zusätzlicher Button „Webseite besuchen“
- Social-Media-Icons für Facebook, Instagram und TikTok
- keine verschachtelten Links, damit kein Hydration-Fehler entsteht

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

## Wiederverwendbare Komponenten

Öffentliche Website:

- `SponsorCard`
- `SponsorBanner`
- `SponsorActions`
- `SponsorGrid`
- `SponsorSection`
- `SponsorTabs`
- `SocialLinks`

Adminbereich:

- `AdminSponsorForm`
- `AdminSponsorList`
- `SponsorCard`
- `SponsorImageUpload`
- `sponsors.service.js`

## Social Media

Social-Media-Ausgaben laufen über das gemeinsame Modul:

```text
src/components/common/SocialLinks
```

Aktuell unterstützt:

- Facebook
- Instagram
- TikTok

## Löschlogik

Sponsoren werden über das zentrale Löschmodul gelöscht:

```text
AdminRemoveButton
→ removeActions.js
→ remove_entity('sponsor')
```

Es wird nur der Sponsor gelöscht. Andere Inhalte bleiben erhalten.
