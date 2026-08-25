# B15.19F1 – News-Titelbilder

## Ist-Zustand

`news.image_url` ist das öffentliche Titelbild einer News. Es wird auf der Website-Startseite, `/news`, der paginierten Newsübersicht und der Newsdetailseite gelesen. Die Karten verwenden feste responsive Höhen mit `object-cover`; die Detailseite verwendet eine begrenzte Höhe mit `object-contain`. Ein News-Platzhalter existiert nicht: Ohne Bild wird kein Bildbereich gerendert. Die Darstellung erfolgt mit nativen, responsiv dimensionierten `<img>`-Elementen; Next Image und explizites Lazy Loading werden nicht verwendet.

Adminliste, mobile Admin-Karte und Dashboard zeigen kein Newsbild. Die Admin-Detailzusammenfassung meldet lediglich, ob ein Bild hinterlegt ist. Repositoryweit gibt es für News keine `generateMetadata`-, OpenGraph-, Twitter-Card- oder JSON-LD-Verwendung des Bildes.

Der bisherige Clienthelper `uploadNewsImage` lud direkt aus dem Browser in den öffentlichen Legacy-Bucket `media`, Pfad `news/<timestamp>-<originalname>`. Er verwendete den gemeinsamen Storagehelper ohne Upsert-Option. Beim Ersetzen wurde die alte Datei nicht gelöscht. `removeNewsRecord` ruft die bestehende `remove_entity('news', id)`-RPC auf; auch beim Löschen wurde keine Legacy-Bilddatei physisch entfernt. Dokumentuploads und `news_documents` sind ein unabhängiger Pfad und bleiben unverändert.

Create/Edit werden serverseitig durch `news.create` beziehungsweise `news.edit` geschützt; Delete verwendet die bestehende Delete-Berechtigung über `remove_entity`. F1 erweitert diese fachlichen Rechte nicht.

## Zentrale Integration

- Neue nullable UUID `news.image_media_asset_id`, FK auf `media_assets(id)`, `ON DELETE SET NULL` und partieller Index.
- Usage `news/<news.id>/image`. Der vorhandene Entity-Constraint enthält `news` bereits; die Assignment-Allowlist wird kontrolliert um `news/image` erweitert.
- Der bestehende `AdminMediaPicker` ersetzt den Legacy-Browserupload. Standard-Purpose ist `news`, der Purpose-Filter einschließlich „Alle Verwendungen“ bleibt aktiv und Cross-Purpose verändert den ursprünglichen Asset-Purpose nicht.
- Direktuploads laufen über `uploadMediaAsset`, sind JPEG/PNG/WebP, `purpose=news`, `visibility=public` und verwenden die zentrale 10-MiB-Validierung sowie die zentralen Public-Bucket-/Pfadregeln.
- Superadmin/Webmaster dürfen `public` und `admin` auswählen; andere News-Bearbeiter nur `public`. `restricted` ist ausgeschlossen. Auswahl und Speicherung werden in Server Actions erneut autorisiert und validiert.
- Create speichert zuerst die News und synchronisiert danach `news/image` über die service-role-only Assignment-RPC. Edit verhält sich identisch. Ersetzen entfernt nur die alte News-Usage; Assets und fremde Usages bleiben erhalten.
- Explizites Entfernen setzt Media-ID und Usage auf leer und leert kontrolliert `news.image_url`, damit kein entferntes Legacybild zurückfällt. Ohne explizites Entfernen bleibt das Legacyfeld unverändert.

## Resolver und Löschung

Public-Priorität: aktives öffentliches Media-Asset, danach `news.image_url`, danach kein Bild. Die Startseite, News-Landingpage und Übersicht sammeln alle Media-IDs und lösen sie je Liste in einem Batch über `loadPublicMediaUrlMap` auf. Die Detailseite verwendet denselben Resolver für einen Datensatz. Admin-/Restricted-Assets und Signed URLs werden niemals öffentlich ausgegeben. Das Editformular löst ein vorhandenes Asset serverseitig auf und reicht Admin-Assets nur an berechtigte Rollen weiter; Signed URLs werden nicht persistiert.

Ein F1-spezifischer `AFTER DELETE`-Trigger entfernt atomar nur `news/<id>/image` aus `media_asset_usages`, unabhängig davon, dass der bestehende Deletepfad weiterhin `remove_entity` verwendet. Das zentrale Asset und jede andere Usage bleiben bestehen; keine zentrale oder Legacy-Storage-Datei wird gelöscht.

## Bestand, SQL und Risiken

Read-only am 25.08.2026: 3 News insgesamt, 2 mit nichtleerer `image_url`, 2 eindeutige URLs, keine Duplikatgruppen und keine Pfadübereinstimmung mit vorhandenen `media_assets`. Es erfolgt kein Backfill und keine Daten- oder Dateimigration.

Proposal, read-only Postcheck und F1-spezifischer Rollback liegen unter `docs/sql/b15-19f1-*`. Der Rollback entfernt Trigger, News-Usages, Index und Spalte und stellt die RPC exakt auf E3 zurück. SQL wurde nicht ausgeführt.

Wie bei den bisherigen B15.19-Modulen bilden News-Stammdatensatzspeicherung und anschließender Assignment-RPC-Aufruf keine gemeinsame übergreifende Transaktion. Die Referenz-/Usage-Operation selbst ist atomar. Ein Assignmentfehler nach erfolgreichem Create kann daher eine News ohne zentrale Zuordnung hinterlassen; es entsteht jedoch keine verwaiste Usage. Eine transaktionale Neustrukturierung aller Fachspeicherpfade liegt außerhalb F1.

## Tests und manueller Ablauf

Automatisiert werden Create/Edit, Picker, Upload, Cross-Purpose, Allowlist, Sichtbarkeit, Legacy-Entfernung, Public-Batchresolver, Delete-Trigger, Grants, Postcheck/Rollback sowie Media-/News-Regression geprüft.

Manuell: Proposal und Postcheck ausführen, Dev-Server neu starten; News ohne Bild, mit Direktupload und mit Bibliotheksbild erstellen; Cross-Purpose testen; A durch B ersetzen; Bild entfernen; Admin-Asset im Adminbereich und Public-No-Leak prüfen; Startseite, `/news`, Übersicht, Detail und Mobile prüfen; Usage und Archivschutz kontrollieren; Datei über 10 MiB ablehnen; News löschen und Asset-/Fremd-Usage-Erhalt prüfen.
