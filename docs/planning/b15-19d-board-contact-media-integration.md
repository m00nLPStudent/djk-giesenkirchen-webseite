# B15.19D – Vorstand und Vereinskontakte in der Medienbibliothek

## Ist-Analyse vor der Umsetzung

`board_members` besitzt derzeit nur `image_url`. Das Adminformular verwendet
`BoardMemberImageUpload`; `board.service.js` lädt aus dem Browser über
`uploadMediaFile` nach `media/board/<name>` und löscht beim Ersetzen oder
Entfernen die bisherige Datei. Die öffentliche Vorstandsseite und die
Adminansichten lesen `image_url` direkt. Create/Edit werden mit den bestehenden
Settings- und Person-Scope-Prüfungen geschützt; es existiert weder eine
Media-ID noch eine Usage. Ein weiteres Bildfeld ist nicht vorhanden.

`club_contacts` besitzt ebenfalls nur `image_url`. Der Kontakteditor verwendet
`AdminImageUpload` und `useImageUpload`; der Browserpfad ist
`media/club-contacts/<name>`. Speichern und Löschen erfolgen derzeit über den
Browser-Supabase-Client. Adminliste, Footer und öffentliche Kontaktseite lesen
`image_url`. Es gibt kein weiteres Bildfeld, keine zentrale Auflösung und keine
Usage. Routen prüfen `settings.view`, während Schreibrechte bisher nur in der
UI über `settings.edit` ausgeblendet werden.

Die zentrale B15.19A–C-Architektur stellt `AdminMediaPicker`, Dialog und Trigger,
den ausschließlich serverseitigen `uploadMediaAsset`, Sichtbarkeitsfilter,
Archivschutz und `synchronize_media_assignment` bereit. Trainer und Spieler
verwenden nullable Media-FKs und `media_asset_usages`; die RPC aktualisiert
Referenz und Usage gemeinsam. Der öffentliche Bucket heißt
`media-library-public`, private Vorschauen werden nur kurzzeitig signiert.

## Zielarchitektur

Beide Tabellen erhalten optional `image_media_asset_id`. Picker und Upload
werden durch Server Actions mit den vorhandenen Create/Edit-Rechten geschützt.
Superadmin/Webmaster dürfen `public` und `admin` auswählen, reguläre Bearbeiter
nur `public`; `restricted` wird nie akzeptiert. Für die öffentliche Darstellung
gilt: gültiges aktives Media-Asset im Public Bucket, sonst Legacy-`image_url`,
sonst Platzhalter. Legacy-URLs werden nicht mehr geschrieben oder gelöscht.

Die Assignment-RPC wird um `board_member` und `club_contact` erweitert und
aktualisiert FK sowie die Usage mit `field_name = 'image'` in einer Transaktion.
Beim Entfernen wird nur die Referenz/Usage entfernt; das Asset bleibt bestehen
und kann anschließend archiviert werden. Es gibt keinen Backfill und keine
automatische Bestandsänderung.

## B15.19D2 – Purpose-Filter und Wiederverwendung

`media_assets.purpose` beschreibt den ursprünglichen Upload- und Organisationskontext. Fachliche Verknüpfungen stehen in `media_asset_usages`. Ein aktives Bild kann deshalb gleichzeitig etwa als Coach- und Board-Bild verwendet werden, ohne seinen Purpose zu ändern. Der D2-RPC-Vorschlag entfernt nur die Purpose-Gleichheitsprüfung; Zieltyp, Bildtyp, Archivstatus, atomarer Referenzwechsel und `service_role`-Beschränkung bleiben erhalten. Sichtbarkeit und Fachberechtigung werden vor dem RPC serverseitig geprüft.

Der zentrale Picker bezieht seine Filter aus `mediaPurpose.config.mjs`. Board startet mit `board`, Kontakt mit `cms`, Coach mit `coach` und Player mit `player`. Der Filter ist wechselbar und enthält „Alle Verwendungen“. Filterwechsel und Suche setzen die Seite auf 1 zurück. Direktuploads bleiben unabhängig vom Filter dem Fachkontext der aufrufenden Action zugeordnet.

Die administrative Vorstandsübersicht selektiert `image_media_asset_id` und löst alle IDs gemeinsam auf. Der Batchresolver lädt nur aktive Bilder in erlaubten Sichtbarkeiten, signiert private Adminbilder gesammelt und fällt auf `image_url` sowie den vorhandenen Platzhalter zurück. Desktop und Mobile verwenden denselben Avatar.

Risiko: Fachübergreifende Wiederverwendung funktioniert erst nach manueller Ausführung des D2-SQL-Proposals. `restricted` bleibt ausgeschlossen. Bestehende Purpose-Werte und Usages werden nicht umgeschrieben.
