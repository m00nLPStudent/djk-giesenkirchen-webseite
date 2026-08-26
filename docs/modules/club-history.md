# Modul: Vereinsgeschichte

## Status

Umgesetzt und nach B15.19I/I1.1 sicherheitsgehärtet.

## Funktionen

- Chronik-Grunddaten mit RichText, Publish-/Aktivstatus und Sortierung.
- mehrere Meilensteine und mehrere Chronikbilder.
- zentrale Medienbibliothek mit Alttexten, Bildunterschriften, Sortierung und Aktivstatus.
- Public Resolver mit Legacy-Fallback sowie Media-Usage und Archivschutz.
- öffentliche Darstellung unter `/fussball/vereinsgeschichte`.

## Sicherheit

- Schreiboperationen laufen über serverseitige Actions mit `club_history.edit`.
- Publish-/Unpublish- und öffentlich wirksame Terminänderungen verlangen zusätzlich `club_history.publish`.
- Browserrollen besitzen auf `club_history_pages`, `club_history_images` und `club_history_milestones` nach der Härtung nur SELECT; Public-Read-Policies bleiben maßgeblich.
- zentrale Media-Assignments laufen über den gehärteten serverseitigen Pfad.

## Datenbasis

- `club_history_pages`
- `club_history_milestones`
- `club_history_images`
- `media_assets` und `media_asset_usages`
