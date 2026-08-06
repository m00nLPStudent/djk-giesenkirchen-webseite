# B15.19B – Zentraler Media Picker und Pilot Trainerbild

## Bestand und Entscheidung

Der B15.19A-Picker war eine rein clientseitige Filterliste bereits vollständig geladener Assets. Repository und Medienroute hatten keine echte Pagination; private Vorschauen wurden einzeln signiert. Upload und Archivierung waren nur für Superadmin/Webmaster vorgesehen.

Trainerformulare lasen `image_url || photo_url || Platzhalter`, schrieben ausschließlich `image_url` und luden direkt aus dem Browser in `media/coaches/<name-id>.<ext>`. Beim Ersetzen oder Entfernen wurde die alte Legacydatei sofort physisch gelöscht, noch bevor das Trainerformular gespeichert war. Adminlisten und öffentliche Trainerseiten verwenden weiterhin die aufgelöste URL. `photo_url` ist nur Legacy-Fallback.

Eine Media-ID kann ohne Trainer-Spalte nicht über Neustarts erhalten bleiben und Usage nicht belastbar dem Datensatz zugeordnet werden. B15.19B schlägt deshalb nullable `coaches.image_media_asset_id` mit FK vor. Es gibt keinen Backfill. Priorität bleibt: ausgewählte Media-ID (deren öffentliche URL serverseitig nachgeschlagen und nach `image_url` gespiegelt wird), sonst bestehendes `image_url`, sonst `photo_url`, sonst Platzhalter.

## Picker und Upload

`AdminMediaPicker`, `AdminMediaPickerDialog` und `AdminMediaPickerTrigger` enthalten keine Fach- oder Supabase-Logik. Aktionen werden injiziert. Der Dialog lädt erst beim Öffnen, lädt maximal zwölf Ergebnisse pro Seite und sucht serverseitig über Anzeigename, Originalname, Alttext, Beschreibung, MIME und Verwendung. Art, Sichtbarkeit, Verwendung und Archivstatus werden repositoryseitig gefiltert. Auswahl ist einzeln; Abbrechen verändert nichts.

Der Trainerkontext erzwingt serverseitig `image`, `public`, `active`. PDFs und andere MIME-Typen werden vor dem zentralen Upload abgelehnt. Der Upload verwendet unverändert `uploadMediaAsset`, Zweck `coach`, UUID-Pfad und den öffentlichen B15.19A-Bucket. Erfolgreiche Uploads werden sofort ausgewählt. Andere Module können dieselben Komponenten später mit eigenen autorisierten Aktionen verwenden.

Private Medien werden im allgemeinen Loader weiterhin ausschließlich über fünf Minuten gültige Signed URLs aufgelöst, nun gebündelt statt N+1. Sie sind im Trainerpicker nicht auswählbar, weil öffentliche Trainerseiten keine kurzlebige URL speichern dürfen. Archivierte Assets sind nicht auswählbar; eine bereits gespeicherte Zuordnung kann weiterhin angezeigt werden.

## Trainerintegration, Legacy und Usage

Create und Edit unterstützen kein Bild, Direktupload und Bibliotheksauswahl. Beim Speichern validiert die Server Action die Media-ID erneut und akzeptiert ausschließlich ein vorhandenes, nicht archiviertes, öffentliches Bild. Clientseitig gelieferte Media-URLs werden bei gesetzter ID ignoriert. Trainerrechte sowie Create-/Edit-Team- und Saison-Scopes werden sowohl beim Pickerladen/Upload als auch beim Speichern erneut geprüft.

Ersetzen aktualisiert nur FK, abgeleitete URL und Usage. Entfernen setzt FK/Usage zurück und den dargestellten Wert auf den bestehenden Platzhalter. Weder Legacydateien noch Medienbibliotheksobjekte werden physisch gelöscht. Die Usage lautet `entity_type=coach`, `field_name=image` und ist über einen eindeutigen Index pro Entity/Feld einzeln. Die Synchronisation nutzt serverseitig die Service Role, nachdem der Trainer-Scope autorisiert wurde.

## SQL-Reihenfolge

1. `b15-19b-coach-media-reference-proposal.sql` manuell prüfen und ausführen. Das Proposal stoppt bei bestehenden doppelten Usage-Zielen.
2. Anwendung deployen.
3. `b15-19b-coach-media-reference-postcheck-readonly.sql` ausführen.
4. Rollback nur bei Bedarf; es entfernt Coach-Usages und die neue Referenz, aber niemals Medien oder Storageobjekte.

Keine SQL-Datei wurde automatisch ausgeführt. Es wurden keine bestehenden Trainerbilder migriert, kopiert oder gelöscht.

## Risiken und B15.19C

Trainerstammdaten und Usage werden in zwei aufeinanderfolgenden Datenbankoperationen gespeichert, weil der bestehende komplexe Trainer-/Saison-Speicherpfad nicht transaktional ist. Der FK und `image_url` bleiben im Fehlerfall kanonisch; eine fehlgeschlagene Usage-Synchronisation wird als Fehler gemeldet und kann wiederholt werden. B15.19C sollte eine kontrollierte transaktionale Media-Link-RPC beziehungsweise einen DB-Trigger evaluieren und anschließend genau ein weiteres Fachmodul migrieren. Eine allgemeine private Personenbildauslieferung benötigt ein eigenes autorisiertes Delivery-Konzept.
