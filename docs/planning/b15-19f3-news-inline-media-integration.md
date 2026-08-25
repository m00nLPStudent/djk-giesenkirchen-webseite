# B15.19F3 – News-Inline-Medien

## Bestand

News bearbeiten `news.content_de` als HTML mit dem zentralen `AdminRichTextEditor` und TinyMCE 8. Aktiv sind unter anderem `image`, `link`, Listen, Tabellen, Code und Autoresize. Zuvor gab es weder `images_upload_handler`, `images_upload_url` noch `file_picker_callback`; TinyMCE lud daher keine Dateien in Supabase. Das Image-Plugin konnte HTTP(S)-URLs einbetten. Es gab keinen Datei-Picker, keinen Inline-Storage-Bucket und keine physische Ersetzungs-/Löschlogik. `paste_data_images` war nicht explizit aktiviert. Gespeichert wurden HTML und darin enthaltene URLs, keine Asset-IDs.

Öffentlich rendert `RichTextContent` das HTML nach `sanitizeRichTextHtml`. Der eigene Allowlist-Sanitizer entfernt unbekannte Tags/Attribute, Eventhandler, `javascript:`, `data:` und `blob:`; bei Bildern blieben bisher HTTP(S)-`src`, `alt` und `title`. Legacy- und externe HTTP(S)-Bilder bleiben unverändert lesbar. Admin und Public verwenden denselben gespeicherten Content, der Public-Pfad sanitisiert ihn nochmals.

## F3-Architektur

Nur der News-Editor aktiviert den TinyMCE-Toolbar-Button „Bild einfügen“. Er öffnet den bestehenden `AdminMediaPickerDialog` mit `media_kind=image`, Public-only, Default-Purpose `news`, wechselbarem Purpose und Cross-Purpose-Auswahl. Direktuploads verwenden unverändert `uploadMediaAsset`, Purpose `news`, Public-Visibility, JPEG/PNG/WebP, Signaturprüfung und 10-MiB-Limit. Kein zweiter Uploadpfad entsteht.

Eine zentrale Einbettung wird gespeichert als `<img src="<stabile-public-url>" data-media-asset-id="<uuid>" alt="...">`. TinyMCE und Sanitizer erlauben ausschließlich dieses konkrete Data-Attribut; beliebige `data-*` bleiben verboten. Beim Speichern extrahiert der Server UUIDs, verwirft ungültige Referenzen, lädt ausschließlich aktive Public-Bilder und ersetzt den Browser-`src` durch die kanonische Public-URL. Signed-, Admin- und Restricted-Assets können nicht persistiert werden. Inline-Alttext startet mit dem Asset-Alttext und kann im HTML geändert werden, ohne Asset-Metadaten zu verändern.

Neue Paste-/Drag-and-drop-Bilder werden im Editor mit verständlicher Meldung abgewiesen; serverseitig werden neu eingeführte `data:image`- und `blob:`-Quellen zusätzlich blockiert. Bereits vorhandene identische Legacy-Quellen dürfen bei einem späteren Save erhalten bleiben. Externe Legacy-URLs bleiben lesbar; die News-spezifische Toolbar bietet keine neue externe Bild-URL-Eingabe und es gibt keinen serverseitigen URL-Download/SSRF-Pfad. Dokumentlinks bleiben ausschließlich F2-Scope.

## Usages, Create, Update und Delete

Der vorhandene Unique-Key enthält `media_asset_id`; deshalb kann `news/<news-id>/content` mehrere Assets eindeutig führen, während alle Single-Assignment-Slots unverändert bleiben. Die vorhandene Assignment-RPC wird nicht verwendet. Die neue service-role-only Funktion `synchronize_news_content_media_usages(uuid,uuid[])` validiert News sowie alle Assets und synchronisiert die 1:n-Menge atomar. Beim Create kann ein Asset zunächst ungenutzt bleiben; nach dem News-Insert werden Usages synchronisiert. Ein abgebrochener Entwurf lässt ein reguläres ungenutztes Asset in der Bibliothek zurück. Beim Update werden entfernte Content-Usages gelöscht, Assets und fremde Usages bleiben erhalten. Die bestehende News-Delete-Triggerfunktion wird eng um `content` ergänzt; F1 `image` bleibt erhalten, F2 arbeitet weiter über `news_document`.

## SQL und Betrieb

- `docs/sql/b15-19f3-news-inline-media-proposal.sql`
- `docs/sql/b15-19f3-news-inline-media-postcheck-readonly.sql`
- `docs/sql/b15-19f3-news-inline-media-rollback.sql`

Kein Backfill, keine Content-Umschreibung und keine Storage-Löschung. Das Read-only-Inventar zählt News/Content/Bilder sowie `data:image`, `blob:`, HTTP-URLs, Mehrfachbilder und Usage-Integrität. HTML-RegEx liefert nur eine Bestandsindikation, keinen vollständigen DOM-Parser.

## Manueller Browsertest

Proposal und Postcheck manuell ausführen, Dev-Server neu starten. Danach News ohne Bild, Direktupload, Bibliotheks- und Cross-Purpose-Bild, Save/Reload, Public Desktop/Mobile, mehrere Bilder A/B/C zu A/C/D, Alttext, Entfernen/Ersetzen, Usage/Archivschutz, Admin-/Restricted-No-Leak, Übergröße/falschen Typ sowie Paste/Drag-and-drop prüfen. Abschließend eine News mit F1-Titelbild, F2-Dokument und F3-Inline-Bildern löschen und Asset-/Storage-Erhalt kontrollieren.
