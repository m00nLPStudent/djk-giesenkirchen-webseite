# B15.19I1 – Vereinschronik-Bilder

## Bestand

- `club_history_pages` ist die Singleton-Seite (`page_key=fussball-vereinsgeschichte`).
- `club_history_milestones` enthält zeitlich sortierte Textelemente und besitzt keine Bildreferenz.
- `club_history_images` ist die Galeriezuordnung. Beliebig viele Zeilen gehören über `club_history_page_id` zu einer Seite; Reihenfolge: `sort_order`, danach `created_at`.
- Legacybilder verwenden `image_url` (NOT NULL im Snapshot) und optional `image_path`. Upload und physisches Delete liefen bisher im Browser gegen Bucket `media`, Pfad `club-history/club-history-<timestamp>.<ext>`.
- Alttext und Bildunterschrift werden in DE/EN gespeichert; die Oberfläche pflegt DE und erhält bestehende EN-Werte.

## I1-Vertrag

- `club_history_images.media_asset_id uuid NULL` verweist mit `ON DELETE SET NULL` auf `media_assets(id)`.
- Usage: `entity_type=club_history`, `entity_id=club_history_images.id`, `field_name=image`.
- Der vorhandene Purpose `club_history` wird wiederverwendet; kein neuer Purpose ist nötig.
- Uploads laufen serverseitig über `uploadMediaAsset`, immer `media_kind=image`, `visibility=public`, `purpose=club_history`.
- Picker-Auswahl darf Cross-Purpose verwenden. Reguläre Chronik-Bearbeiter sehen nur `public`; Superadmin/Webmaster zusätzlich `admin`. `restricted` wird nicht angeboten.
- Öffentlich gilt pro Galeriezeile: aktives Public-Asset aus `media-library-public`, danach Legacy-`image_url`, andernfalls keine Bildausgabe. Alle Asset-IDs werden in einer Batchabfrage aufgelöst.
- Neue zentrale Zeilen erhalten keine künstlichen Legacywerte. Deshalb wird nur `image_url` nullable; `image_path` ist bereits nullable.
- Löschen entfernt die Galeriezeile und über den Cleanup-Trigger ihre Usage. Asset und Storageobjekt bleiben bestehen. Auch Legacyobjekte werden in I1 nicht physisch gelöscht.
- Keine Bestandsmigration und kein Backfill.

## Autorisierung und Security-Grenze

- Alle neuen Bildmutationen prüfen serverseitig `club_history.edit` und verwenden danach ausschließlich den server-only Service-Role-Client.
- Seiten- und Meilensteinlogik bleibt außerhalb der I1-Medienmigration unverändert.
- Die Snapshot-Policies mit Browser-`ALL true` werden in I1 nicht verändert. `b15-19i1-club-history-image-media-reference-postcheck-readonly.sql` inventarisiert Live-RLS, Grants und Definer-Bypässe. Erst ihr manuelles Ergebnis entscheidet über B15.19I1.1.
