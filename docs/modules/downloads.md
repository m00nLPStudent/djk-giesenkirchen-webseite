# Modul: Downloads

## Status

B15.22A/A1, B15.22B und B15.22C sind abgeschlossen. B15.22B ist live installiert und per Read-only-Postcheck bestätigt. Das Adminmodul unter `/admin/downloads`, Navigation, Rollen, CRUD, Publish/Unpublish, zentraler Upload, Picker, Usage-Synchronisation und Löschsemantik wurden manuell erfolgreich geprüft. Öffentliche Liste und kontrollierter Dateiabruf sind ausdrücklich nicht Bestandteil von C.

## Datenmodell und Datei-Source-of-Truth

`downloads` speichert ausschließlich fachliche Metadaten und `media_asset_id`. Datei, Pfad, MIME-Type und Größe bleiben in `media_assets`. Es gibt keinen zweiten Uploadpfad, Bucket oder Dokumentbestand. Download-PDFs verwenden `purpose=download`, `media_kind=document`, `application/pdf`, `media-library-private`, eine private Sichtbarkeit und maximal 20 MiB.

`download_categories` ist die einzige Kategorienquelle. Neue Zuordnungen benötigen eine aktive Kategorie. Die zentrale Funktion `synchronize_media_assignment('download', id, mediaId, 'file')` aktualisiert Referenz und `media_asset_usages`. Genau eine primäre Datei ist vorgesehen.

## Berechtigungen

- Liste: `downloads.view`
- Anlegen: `downloads.create`
- Bearbeiten: `downloads.edit`
- Löschen: `downloads.delete`
- Veröffentlichen oder zurückziehen: `downloads.publish`

Page Loader und jede Server Action prüfen Session, aktives Adminprofil und Permission erneut. Die Service Role wird ausschließlich serverseitig erzeugt. Initial besitzen Superadmin, Vorstand und Webmaster die Rechte; ein Department-Scope existiert nicht.

## Adminabläufe

Die kompakte Desktop-Tabelle und Mobile-Liste zeigen Titel, Kategorie, Datei, PDF-Größe, Status, Sortierung und Aktualisierungsdatum. Create/Edit validieren deutsche Metadaten, Kategorie, Sortierung und das ausgewählte Asset serverseitig.

Der Picker zeigt nicht archivierte PDFs aus der gesamten zentralen Medienbibliothek und kennzeichnet Sichtbarkeit, Purpose und vorhandene Verwendungen. Direkt auswählbar sind ausschließlich bereits B15.22B-konforme private `purpose=download`-Assets. Öffentliche PDFs bleiben sichtbar, werden aber mit dem Hinweis auf einen erneuten privaten Upload deaktiviert; ihre Bucket-/Visibility-Metadaten werden niemals lediglich umgeschrieben. Bereits verwendete fachfremde Assets werden ebenfalls nicht umklassifiziert.

Optionaler späterer Komfortpunkt, kein V1-Blocker: „Bestehendes privates, unbenutztes `purpose=document`-PDF atomar in `purpose=download` übernehmen.“ Das Live-Schema besitzt dafür noch keine atomare Operation „Usage-Freiheit prüfen und Purpose ändern“. Ein getrenntes SELECT/UPDATE wäre race-anfällig und wird bewusst nicht gebaut. Bis zu einem separat freigegebenen zentralen RPC muss das Dokument über den bestehenden Upload erneut als Download-PDF angelegt werden. Öffentliche PDFs werden weiterhin niemals direkt umklassifiziert. Es entsteht keine zweite Upload-Infrastruktur.

Beim Dateiwechsel synchronisiert der zentrale RPC die Usage. Reine Metadatenänderungen lösen keine unnötige Synchronisation aus. Schlägt die Synchronisation nach einem Create fehl, wird die Downloadzeile kompensierend entfernt; bei Edit werden die vorherigen Metadaten wiederhergestellt.

Der Anwendungscode führt `download/file` in derselben zentralen Assignment-Allowlist wie News- und Event-Dokumente. Neue Download-Uploads werden bereits mit `purpose=download`, `visibility=admin` und damit im privaten Media-Bucket angelegt; erst danach werden Downloadzeile und Usage synchronisiert. Ein vor der B15.22C-Korrektur hochgeladenes, aber wegen der fehlenden Anwendungs-Allowlist nicht zugeordnetes Asset bleibt bewusst als unbenutztes Media Asset erhalten.

Publish/Unpublish setzt `published_at` über die bestehende DB-Logik. Beim Löschen entfernt der DB-Trigger nur die Download-Usage. Media Asset und Storageobjekt bleiben erhalten und unterliegen weiter dem zentralen Archivschutz.

## Spätere öffentliche Ausgabe

B15.22D/E ergänzt `/downloads` und `GET /downloads/[id]/file`. Erst der serverseitige Dateiabruf darf nach Prüfung von Veröffentlichung, aktiver Kategorie, Asset und Usage eine kurzlebige Signed URL erzeugen. Es gibt derzeit weder öffentlichen Download-Link noch Footerintegration.
