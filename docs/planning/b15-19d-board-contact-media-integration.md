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

## B15.19D3 – Contact-Synchronisation und Entfernen

Das Setzen und Ersetzen eines Kontaktbilds erreichte die zentrale RPC korrekt mit `entity_type = club_contact`, `field_name = image`, Contact-ID und Media-ID. Die RPC aktualisierte damit zunächst `club_contacts.image_media_asset_id`; der anschließende Usage-Insert scheiterte jedoch am ursprünglichen B15.19A-Check-Constraint, dessen Entity-Allowlist `club_contact` nicht enthielt. Board war nicht betroffen, weil `board_member` bereits seit B15.19A erlaubt war. Das D3-Proposal ergänzt ausschließlich diesen fehlenden Entity-Typ; D2-Cross-Purpose, Bild-/Archivprüfung und RPC-Grants bleiben unverändert.

Der Contact-Save-Pfad speichert zuerst den existierenden oder neuen Kontakt und synchronisiert danach Referenz und Usage. Setzen erzeugt die Contact-Usage, Ersetzen entfernt nur die bisherige Contact-/Image-Usage und legt die neue an. Andere Usages und beide Assets bleiben bestehen. Wiederholtes Speichern bleibt durch den eindeutigen Entity-/Feld-Index und den atomaren RPC-Wechsel sicher.

Beim Entfernen wurde die Media-ID bereits als `null` übergeben. Danach erschien aber `club_contacts.image_url` erneut als Legacy-Fallback. Der Contact-Editor kennzeichnet deshalb jetzt ausschließlich einen expliziten Klick auf „Bild entfernen“ mit `remove_legacy_image`. Nur in diesem Fall schreibt die Contact-Action das eigene Legacyfeld auf `null`; keine Datei und kein Asset werden gelöscht. Ein normaler Kontakt ohne zentrale Zuordnung behält seinen Legacy-Fallback unverändert. Die Action gibt den gespeicherten Media- und Legacyzustand zurück, aus dem der Editor seinen Formularzustand neu aufbaut.

Bei Sync-Fehlern wird nur Fehlercode und -meldung strukturiert serverseitig protokolliert. Der Client erhält weiterhin eine verständliche Meldung und keinen Erfolg. Da Stammdaten vor dem RPC gespeichert werden, können sie bei einem Sync-Fehler bereits geändert sein; erneutes Speichern ist sicher. Eine gemeinsame Gesamttransaktion wäre eine größere Architekturänderung.

## B15.19D4 – Einheitliche Contact-Bildauflösung im Adminbereich

Der Detailkopf verwendete unmittelbar `form.image_url`, während die darunterliegende Vorschau bereits `selectedMedia.previewUrl` vor dem Legacyfeld bevorzugte. Die Kontaktübersicht selektierte durch `select(*)` zwar `image_media_asset_id`, reichte die Datensätze aber ohne Media-Auflösung an den gemeinsamen Desktop-/Mobile-Avatar weiter; auch dieser las direkt `image_url`. Das war kein Cacheproblem.

Detailkopf und Bildvorschau verwenden nun denselben zentralen geladenen Resolver mit der Reihenfolge Media-URL, Legacy-`image_url`, Platzhalter. Der Edit-Loader erzeugt zulässige Public- beziehungsweise kurzlebige Admin-Signed-URLs weiterhin serverseitig und gibt sie als Picker-Medium weiter. Nach Auswahl oder Entfernung aktualisiert derselbe Clientzustand beide Darstellungen sofort.

Die Admin-Übersicht sammelt alle `image_media_asset_id` und ruft den vorhandenen `loadMediaUrlMap` genau einmal auf. Berechtigte Superadmins/Webmaster erhalten `public` und `admin`, andere Settings-Leser nur `public`; `restricted`, archivierte Datensätze und Nicht-Bilder bleiben ausgeschlossen. Der angereicherte DTO-Wert wird vom gemeinsamen Avatar in Desktopliste und Mobile Cards verwendet. Es gibt keine N+1-Abfrage und keine persistierte Signed URL.

Die öffentliche Kontaktseite bleibt beim separaten `loadPublicMediaUrlMap` und kann deshalb keine Admin-Medien ausgeben. Die bestehende Revalidation von `/admin/settings` und `/kontakt` ist ausreichend; Editrouten sind dynamisch und der Editor aktualisiert seinen lokalen Mediazustand. Tests decken Resolverreihenfolge, Detailkopf, beide Listenvarianten, Batchauflösung, rollenabhängige Sichtbarkeit, Public-Abgrenzung, Wechsel und Entfernung ab. Offenes Betriebsrisiko bleibt nur das reguläre Ablaufen einer bereits gerenderten Admin-Signed-URL nach fünf Minuten; eine erneute Servernavigation erzeugt eine neue URL.
