# B15.19E1 – Allgemeines Mannschaftsbild

## 1. Ziel

Ausschließlich das allgemeine Bild `teams.team_image_url` erhält eine zentrale Media-Referenz. Saison- und Kontaktbilder bleiben außerhalb von E1.

## 2. Bestandsanalyse

Teams besitzen UUID-IDs. Create und Edit laufen über `saveTeamWithScopeAction` und `saveTeamWithSeason`; dieselbe Mutation schreibt Teamstamm, ausgewählte Saison sowie Spieler-/Trainerzuordnungen. Vor jeder Mutation werden Permission und Team-Scope serverseitig geprüft.

## 3. Vorhandene Team-Bildlogik

Der Browser rief bisher `uploadTeamImage` auf. Dieser verwendete `uploadMediaFile` mit Bucket `media`, Pfad `teams/<slug-name>.<ext>` und `upsert`. Bei geändertem Pfad wurde die vorherige Legacydatei vor dem Upload physisch gelöscht. `TeamLogoUpload` entfernte nur den Formularwert; beim Hard Delete löschte `teamDelete.service` die Legacydateien nach erfolgreicher Teamlöschung.

## 4. Team-/Saisonabgrenzung

`createInitialTeamForm` bevorzugt im gewählten Saisonkontext `team_seasons.team_image_url` vor `teams.team_image_url`. `createTeamSeasonPayload` schreibt diesen Legacywert weiterhin in die gewählte Saison. E1 ergänzt keine Saison-Media-ID und ändert diese bestehende Legacylogik nicht.

## 5. Datenmodell

Das Proposal ergänzt nur `teams.team_image_media_asset_id uuid NULL` mit FK auf `media_assets(id)`, `ON DELETE SET NULL` und Index. Altteams bleiben gültig.

## 6. Media-ID

Die Team-Media-ID liegt ausschließlich am Teamstamm. Bei gesetzter und zulässiger Referenz gewinnt die aufgelöste Media-URL. Ohne Referenz bleiben die bisherigen Saison-/Team-Legacywerte wirksam.

## 7. Usage

Allgemeine Mannschaftsbilder verwenden `entity_type = team` und `field_name = image`. Der vorhandene eindeutige Entity-/Feld-Index verhindert doppelte aktive Usages. Der B15.19A/D3-Constraint erlaubt `team` bereits.

## 8. Picker

Das Teamformular verwendet den zentralen `AdminMediaPicker`. Start-Purpose ist `team`; Suche, Pagination, wechselbare Purpose-Filter und „Alle Verwendungen“ stammen unverändert aus der zentralen Pickerarchitektur.

## 9. Direktupload

Direktuploads laufen serverseitig über `uploadMediaAsset`, werden zentral validiert und erhalten `media_kind = image`, `purpose = team`, `visibility = public` sowie einen UUID-basierten zentralen Storagepfad. Der allgemeine Browserupload in den Legacy-Bucket entfällt. Der Contact-Upload bleibt unverändert legacybasiert.

## 10. Sichtbarkeit

Superadmin/Webmaster dürfen im Adminpicker `public` und `admin` lesen. Andere Team-Bearbeiter erhalten nur `public`. `restricted`, archivierte Assets, Dokumente und nicht lesbare IDs werden serverseitig ausgeschlossen. Neue Teamuploads bleiben wie die erwartete öffentliche Teamdarstellung `public`.

## 11. Team Create

Create erlaubt kein Bild, zentralen Direktupload oder Bibliotheksauswahl. Erst wird das Team samt Saison gespeichert, dann synchronisiert die RPC mit der erzeugten Team-ID Referenz und Usage. Die serverseitige Create-Scope-Prüfung bleibt maßgeblich.

## 12. Team Edit

Der Edit-Loader lädt das aktuelle Asset serverseitig für den Picker. Unveränderte Zuordnung, Ersatz und Cross-Purpose-Auswahl werden vor dem Speichern erneut auf Bildtyp, Archivstatus und Sichtbarkeit geprüft.

## 13. Bild entfernen

Explizites Entfernen setzt die Media-ID auf `null`, entfernt nur die Team-/Image-Usage und markiert den Teamstamm-Legacywert zur Löschung. Das Asset und andere Usages bleiben erhalten. Der saisonale Legacywert wird durch dieses E1-Merkmal nicht automatisch bereinigt.

## 14. Legacy-Fallback

Altteams ohne Media-ID bleiben sichtbar. Die Resolverreihenfolge ist zentrale Media-URL, bestehender effektiver Legacywert, danach die vorhandene leere/komponenteneigene Platzhalterdarstellung. Es gibt keinen Backfill.

## 15. Admin-Liste

Die Liste sammelt alle Team-Media-IDs und ruft `loadMediaUrlMap` einmal auf. Der angereicherte Wert wird in Desktopzeile und Mobile Card verwendet; es gibt keine N+1-Abfrage.

## 16. Admin-Detail

Die Detailroute löst die einzelne Team-Media-ID serverseitig mit rollenabhängiger Sichtbarkeit auf und reicht den finalen Wert an den bestehenden Detailheader weiter.

## 17. Öffentliche Darstellung

Übersichtslisten und Detailseite verwenden ausschließlich `loadPublicMediaUrlMap`. Admin-Assets gelangen nicht in öffentliche DTOs. Karten und Hero lesen weiterhin `team_image_url`, das zuvor serverseitig mit der zulässigen zentralen URL angereichert wird.

## 18. Team-/Saisonverhältnis

Adminliste und Public-Detail mergen bisher die aktuelle `team_seasons`-Zeile über den Teamstamm. Bis E2 behält ein tatsächlich gesetztes saisonales Legacybild seine bisherige Priorität. Ist der saisonale Wert dagegen `null`, leer oder nicht vorhanden, gewinnt die auflösbare Team-Media-ID vor dem allgemeinen Team-Legacywert. Eine saisonale Media-ID und die endgültige Team-/Saisonregel gehören zu E2.

## 19. Scopes

Picker, Upload, Save und Synchronisation prüfen `teams.create` oder `teams.edit` sowie `canReachTeamCreateOnServer`, `canCreateTeamInScope` beziehungsweise `canAccessTeamOnServer`. Aus Media-Library-Rechten entsteht kein Teamrecht.

## 20. Cross-Purpose

Ein aktives, sichtbares Bild eines anderen Purpose darf zusätzlich als Team verwendet werden. Der Asset-Purpose bleibt unverändert; nur die Team-Usage wird ergänzt.

## 21. Archivierung

Die zentrale Archivprüfung bleibt unverändert: Jede Usage blockiert Archivierung. Entfernen der Teamzuordnung entfernt nur diese Usage. Bei verbleibenden Fremdusages bleibt das Asset geschützt; bei Usage null kann es archiviert werden. Keine zentrale Storage-Datei wird gelöscht.

## 22. SQL

Proposal, Read-only-Postcheck und enger Rollback liegen unter `docs/sql`. Der Rollback entfernt nur E1-Team-Usages, Index und Spalte und stellt die D2/D3-RPC-Allowlist wieder her. Keine SQL-Datei wurde ausgeführt.

## 23. Tests

Tests decken Create/Edit, explizites Entfernen, Legacy, zentrale Upload-/Pickerpfade, Scope, Cross-Purpose, RPC/Usage, SQL/Postcheck/Rollback, Admin-Batchauflösung, Detail, Public-Abgrenzung und Regression der bestehenden Module ab.

## 24. Risiken

Team-/Saison-Speicherung ist bereits vor E1 mehrstufig; ein später RPC-Fehler kann Team-/Saisondaten gespeichert lassen, während die atomare Media-RPC Referenz und Usage gemeinsam zurückrollt. Wiederholtes Speichern ist idempotent. Admin-Signed-URLs laufen nach fünf Minuten ab und werden bei neuer Servernavigation erneuert.

## 25. Empfehlung B15.19E2

Vor E2 die drei E1-SQL-Dateien manuell anwenden/prüfen und den dokumentierten Browsertest durchführen. E2 sollte danach das saisonale Bild separat modellieren und erst dann die endgültige Priorität zwischen Teamstamm- und Saison-Media-ID festlegen, ohne Contact-Felder einzubeziehen.

## B15.19E1.1 – Uploadhärtung

Der Team-Direktupload und `/admin/media` verwenden denselben zentralen `uploadMediaAsset`-Pfad. Picker-File-Input, Buttontypen, Uploadcallback und die Erfolgsübergabe `response.item -> onChange -> selectedMedia/team_image_media_asset_id` sind korrekt; es existiert kein verschachteltes Formular. Bleibt der zentrale Upload erfolglos, erreicht folglich kein Item den Teamformularzustand.

## E1.2 – Public-Auflösung und Größenfehler

Die öffentliche Team- und Juniorenliste lädt `teams.team_image_media_asset_id` und löst alle IDs in einer einzigen `loadPublicMediaUrlMap`-Abfrage auf. Die Detailseite verwendet denselben Public-Resolver, aber eine eigene Team-/Season-Abfrage. Für E1 gilt dort explizit: Ein nichtleeres `team_seasons.team_image_url` behält seine bisherige saisonale Priorität; andernfalls gewinnt ein gültiges öffentliches zentrales Team-Asset vor dem allgemeinen Legacywert. `null`, Leerstrings und fehlende Season-Werte verdrängen das zentrale Asset nicht. Admin- und Restricted-Assets fehlen bewusst in der Public-Map und fallen sicher auf Legacy beziehungsweise den vorhandenen UI-Platzhalter zurück.

Der im Testbestand verknüpfte Datensatz `d2-jugend` verwies bei der Analyse auf ein aktives Team-Asset mit `purpose = team`, aber `visibility = admin` im privaten Bucket. Dass dieses Bild nur im Admin erscheint, ist deshalb korrekt; der Verwendungszweck ersetzt keine öffentliche Sichtbarkeit.

Die bestehenden zentralen Grenzen bleiben 10 MiB für Bilder und 20 MiB für PDF-Dokumente. Next.js akzeptiert in diesem Projekt Server-Action-Bodies bis 21 MB; die Standardgrenze von 1 MB greift daher nicht. Eine clientseitige Prüfung aus derselben zentralen Validierung stoppt übergroße Dateien jetzt vor dem Server-Action-Transport in `/admin/media` und in allen zentralen Picker-Uploads. Die obligatorische serverseitige Prüfung verwendet dieselbe Fehlermeldung und verhindert Storage-Upload sowie Asset-Insert.

Resolver-Tests decken öffentliche zentrale Assets, leere und echte saisonale Werte, Team-Legacy, sichere Admin-Fallbacks und Bildwechsel ab. Die bestehenden Integrationsprüfungen sichern Batchauflösung ohne N+1, Listen/Junioren/Detail, Cross-Purpose, Usage sowie Trainer-, Spieler-, Vorstands- und Kontaktpfade. Größenprüfungen decken den exakten Randwert und die identische Client-/Servermeldung ab. Offenes Betriebsrisiko: Ein bereits als `admin` gespeichertes Team-Asset bleibt absichtlich nicht öffentlich; für eine öffentliche Darstellung muss ein Asset mit `visibility = public` ausgewählt werden. Requests, die die Next-Transportgrenze überschreiten und die Clientprüfung gezielt umgehen, werden von Next abgewiesen, bevor Anwendungscode läuft.

Der gemeinsame Service validiert zuerst, lädt danach nach `images/team/<uuid>.<ext>` in den Public- beziehungsweise Private-Bucket und registriert anschließend `purpose = team` in `media_assets`. Scheitert dieser Insert, entfernt der bestehende Rollback die zuvor geladene Storage-Datei. Das erklärt das beobachtete Fehlen nach Reload in beiden Oberflächen. Der Service kennzeichnet nun die Stufen `validation`, `storage_upload`, `media_assets_insert`, `complete` und `unexpected`; beide Actions protokollieren Stufe, Fehlercode und Rollbackstatus ohne Datei- oder Formulardaten. Unerwartete Exceptions erreichen nicht mehr ungefangen die Next.js-Action.

Repository-Konfiguration und B15.19A-Sollschema enthalten `team` bereits. Für abweichende ältere Produktiv-Constraints liegt deshalb ein enges E1.1-Proposal vor, das ausschließlich den `media_assets.purpose`-CHECK auf die bestehende zentrale Allowlist ausrichtet. Der Read-only-Postcheck zeigt die tatsächlich installierte Definition und vorhandene Purpose-Zähler. SQL wurde nicht ausgeführt. Erst dieser Postcheck kann die bisher von der Action nicht protokollierte konkrete PostgreSQL-Constraintmeldung abschließend gegen den Produktivstand bestätigen.

E1.1 verändert weder Assignment/Usage noch Scopes, Sichtbarkeit, saisonale Bilder oder Kontaktbilder. Regressionstests sichern `team + public`, `team + admin`, zentrale Pfade, Preview-/Media-ID-Übergabe, Nicht-Submit des äußeren Formulars sowie die bestehenden Coach-, Player-, Board- und Contact-Pfade.
