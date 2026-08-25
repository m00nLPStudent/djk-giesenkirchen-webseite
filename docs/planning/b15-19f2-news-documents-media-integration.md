# B15.19F2 – News-Dokumente und zentrale Medienbibliothek

## Ist-Zustand

`news_documents` bleibt die fachliche Mehrfach-Dokumenttabelle mit DE/EN-Anzeigenamen und -Beschreibungen, `sort_order` und `is_public`. Der bisherige Client lud alle in `ALLOWED_DOCUMENT_TYPES` genannten Endungen (PDF, Office, ZIP und Bilder) direkt in den öffentlichen Bucket `news-documents` unter `<news-id>/<timestamp>-<dateiname>`. Es gab kein Größenlimit und keine Inhalts-/Signaturprüfung. `file_path` und die dauerhafte `file_url` wurden gespeichert. Beim Löschen eines Dokuments wurde zuerst die Legacy-Datei physisch entfernt, danach der Datensatz. Beim Löschen einer News löscht der FK `news_documents.news_id` die Zeilen per `ON DELETE CASCADE`. Öffentliche Newsdetails filterten nur `is_public` und verwendeten `file_url`; der Admin zeigte alle Zeilen. Upload, Metadatenänderung und Löschen liefen bislang über den Browser-Supabase-Client.

## F2-Modell und Ablauf

Das additive nullable Feld `news_documents.media_asset_id` referenziert `media_assets(id)` mit `ON DELETE SET NULL`; Legacyfelder bleiben unverändert und es gibt keinen Backfill. Jede Zeile besitzt die eindeutige Usage `news_document/<news_documents.id>/file`. Die vorhandene Assignment-RPC ist dafür geeignet, weil die Dokument-ID die Mehrfachzuordnung eindeutig macht. Ein Delete-Trigger entfernt die Usage auch bei einem News-Cascade-Delete; Assets und zentrale Storage-Dateien bleiben erhalten.

Neue Uploads verwenden ausschließlich `uploadMediaAsset`, `media_kind=document`, Purpose `news`, UUID-Pfade `documents/news/<uuid>.pdf` und die bestehende PDF-Validierung (MIME, `%PDF-`-Signatur, maximal 20 MiB). Die zentrale Validierung unterstützt sicher nur PDF; deshalb werden neue Office-/ZIP-/Bild-Uploads nicht übernommen. Bestehende Nicht-PDF-Legacydokumente funktionieren weiterhin unverändert.

Der generische `AdminMediaPickerDialog` unterstützt Dokumente, Suche, Public/Admin-Filter, Purpose-Filter und Cross-Purpose-Wiederverwendung. Ein neues Dokument erzeugt zuerst das Asset, dann die Fachzeile, dann atomar Referenz und Usage; bei Usage-Fehler wird die neue Fachzeile zurückgenommen. Dateiwechsel entfernt nur die alte Usage, setzt die neue Referenz und erhält beide Assets. Komplettes Löschen bleibt die bestehende Fachsemantik; nur Legacy-Dateien ohne Media-ID werden weiterhin physisch aus `news-documents` entfernt.

## Sichtbarkeit und Resolver

`news_documents.is_public` und Asset-Visibility bleiben getrennt. Öffentlich erscheinen nur fachlich öffentliche Zeilen mit einem aktiven Public-Dokumentasset. Eine vorhandene Media-ID ohne öffentliche Auflösung fällt absichtlich nicht auf `file_url` zurück und kann daher kein Admin-Asset leaken. Nur Zeilen ohne Media-ID nutzen den Legacy-Fallback. Alle IDs werden je Seite batchweise aufgelöst. Im Admin dürfen Superadmin/Webmaster Public und Admin sehen; private URLs werden serverseitig kurz signiert und nie persistiert.

## SQL, Bestand und Risiken

- Proposal: `docs/sql/b15-19f2-news-documents-media-reference-proposal.sql`
- Read-only Postcheck samt Bestandsinventar: `docs/sql/b15-19f2-news-documents-media-reference-postcheck-readonly.sql`
- F2-only Rollback auf F1-RPC: `docs/sql/b15-19f2-news-documents-media-reference-rollback.sql`

SQL wurde nicht ausgeführt und Daten wurden nicht migriert. Der Postcheck ermittelt Anzahl public/intern, Legacypfade, MIME-/Größenverteilung, Duplikate und mögliche Assettreffer. Das verbleibende Übergangsrisiko sind öffentlich gespeicherte Legacy-URLs; deren Migration ist ausdrücklich ein späterer Auftrag.

## Manueller Browsertest

1. Proposal und danach Postcheck manuell ausführen; Dev-Server neu starten.
2. News ohne, mit einem und mit mehreren PDFs prüfen.
3. Direktupload, Bibliotheksauswahl, Suche, Filter und Cross-Purpose testen.
4. Datei A durch B ersetzen; DE/EN-Metadaten, Sortierung und Public-Status ändern.
5. Public-Asset/public, Public-Asset/intern und Admin-Asset/public auf der öffentlichen Detailseite prüfen; es darf keine Signed URL erscheinen.
6. PDF über 20 MiB, falschen MIME und falsche Signatur ablehnen lassen.
7. Usage und Archivschutz prüfen; Dokument und danach komplette News löschen und Asset-Erhalt sowie fremde Usages kontrollieren.
