# B15.19A – Medienbibliothek: Bestandsanalyse und Grundlage

## Nachweisgrenze

Analysiert wurden der vollständige Quellcode, die versionierten SQL-Dateien und `/public`. Die Live-Datenbank und Storage-Metadaten wurden nicht verändert oder abgefragt. Tatsächliche Bucket-Flags, Objektzahlen, Policies und verwaiste Dateien müssen deshalb mit `b15-19a-media-library-preflight-readonly.sql` bestätigt werden.

## Bestehende Uploadpfade

Alle bestehenden Uploads verwenden `src/lib/storage.js` und damit den Browserclient aus `src/lib/supabase.js`. Es existiert derzeit kein Signed-URL-Pfad. `media` wird über öffentliche URLs gelesen; auch `news-documents` und `events-documents` werden im Code als öffentliche Buckets vorausgesetzt.

| Fachmodul | Tabelle/Feld | Bucket/Pfad | Upload/Löschen | Validierung und Grenze | Schutz/Risiko |
|---|---|---|---|---|---|
| Spieler | `players.image_url`, Legacy `photo_url` | `media/players/<name-id>.<ext>` | Browser, Upsert; vorherige Datei beim Ersetzen vorab gelöscht | `accept=image/*`; keine serverseitige MIME-, Magic-Byte- oder Größenprüfung | öffentlich; keine Wiederverwendung; Verlust bei fehlgeschlagenem Ersatz möglich |
| Trainer/Betreuer | `coaches.image_url`, Legacy `photo_url` | `media/coaches/<name-id>.<ext>` | Browser, Upsert und direkte Löschung | wie Spieler | Personenbild global öffentlich auffindbar; hohes Datenschutz-/Migrationsrisiko |
| Vorstand | `board_members.image_url` | `media/board/<name-id>.<ext>` | Browser, Upsert und direkte Löschung | wie Spieler | personenbezogen, keine Referenzzählung |
| Ansprechpartner | `club_contacts.image_url` | `media/club-contacts/<role-id>.<ext>` | Browser, Upsert und direkte Löschung | wie Spieler | kann öffentlich oder intern verwendet werden, Storage bleibt stets öffentlich |
| Mannschaft | `teams.team_image_url`, `team_seasons.team_image_url` | `media/teams/<name-id>.<ext>` | Browser, Upsert und direkte Löschung | wie Spieler | gleiche URL kann in Team und Saison stehen; Löschung kann aktive Referenz brechen |
| Mannschaftskontakt | `teams.contact_image_url`, `team_seasons.contact_image_url` | `media/team-contacts/<name-id>.<ext>` | Browser, Upsert und direkte Löschung | wie Spieler | Personenbild; doppelte Tabellenreferenzen ohne Löschschutz |
| News-Titelbild | `news.image_url` | `media/news/<timestamp>-<Originalname>` | Browser; kein zentraler Ersatz-/Löschschutz | keine Prüfung im Service | Originalname im Pfad, beliebige Typen möglich, verwaiste Dateien wahrscheinlich |
| News-Dokumente | `news_documents.file_url/file_path/file_name/mime_type/file_size` | `news-documents/<news-id>/<timestamp>-<name>` | Browserupload, anschließend Tabelleninsert; Löschen Storage zuerst | Endungsallowlist erlaubt PDF, Office, ZIP und Bilder; keine Magic Bytes/Größenprüfung | bei DB-Insertfehler verwaist; bei DB-Deletefehler fehlt Datei; öffentlich |
| Termine-Titelbild | `events.image_url` | `media/events/<title-id>.<ext>` | Browser, Upsert; alte Datei vorab gelöscht | keine zentrale MIME-/Größenprüfung | öffentlich, nicht wiederverwendbar |
| Termin-Dokumente | `event_documents.file_url/file_path/file_name/mime_type/file_size` | `events-documents/<event-id>/<timestamp>-<name>` | wie News-Dokumente | gleiche Endungsallowlist | gleiche Orphan-/Konsistenzrisiken |
| Vereinsgeschichte | `club_history_images.image_url/image_path` | `media/club-history/club-history-<timestamp>.<ext>` | Browserupload, Tabelleninsert; Storage vor DB beim Löschen | Bildinput, aber keine Inhalts-/Größenprüfung | Alttexte vorhanden; bei Insert/Delete-Teilfehler inkonsistent |
| Sponsoren | `sponsors.image_url` | `media/sponsors/<name-id>.<ext>` | Browser, Upsert und direkte Löschung | Bildinput ohne serverseitige Prüfung | öffentlich; Wiederverwendung nicht modelliert |
| CMS-Seiten | `pages.content_de` | keine eigene Dateiablage; Rich Text | TinyMCE-Inhalt, kein im Repository gefundener eigener Bild-Uploadadapter | HTML-Sanitizing ist vom Medienmodell getrennt zu prüfen | eingebettete externe URLs möglich; spätere Migration separat |
| Vereinslogo/System | keine verwaltete Uploadstrecke gefunden | versionskontrollierte Assets bzw. externe URLs | kein Medienservice | n/a | bewusst nicht automatisch übernehmen |
| Mitgliedsanfragen | kein Datei-/Bildfeld oder Uploadpfad gefunden | – | – | – | keine Migration in B15.19A |

Die Löschservices für Teamdatensätze löschen Team- und Kontaktbilder physisch, ohne andere Tabellenreferenzen oder Wiederverwendung zu prüfen. Platzhalter aus den Konstanten werden lediglich über URL-Vergleich von der Löschung ausgenommen. Pfade werden teilweise aus Namen gebildet, `upsert: true` überschreibt vorhandene Objekte. URLs tragen teilweise einen Cache-Buster; dadurch ist URL-Gleichheit kein stabiler Medienbezeichner.

## Einordnung vorhandener Assets

- Später zentral registrieren/migrieren: alle fachlichen Uploads aus `media`, `news-documents` und `events-documents`, nachdem Bucket-Inventar, Referenzen und Hash-/Pfadkonflikte read-only ermittelt wurden.
- Weiter versionskontrollieren: bewusst gestaltete Logos, Favicons, Platzhalter, UI-Grafiken und die fünf Next-Beispiel-SVGs unter `/public`.
- Nicht aufnehmen: Buildartefakte, Fonts, Icons und Paketinhalte aus `node_modules`, TinyMCE-Runtime, JavaScript/CSS, Secrets, Logs und temporäre Uploadteile.
- Externe URLs und TinyMCE-Inhalte werden nicht blind importiert. Sie benötigen Herkunftsprüfung, Downloadvalidierung und explizite redaktionelle Entscheidung.

## Zielarchitektur

B15.19A verwendet zwei Buckets, weil öffentliche und geschützte Auslieferung eine echte Sicherheitsgrenze ist:

- `media-library-public`: öffentliche redaktionelle Bilder und freigegebene PDFs.
- `media-library-private`: `admin` und `restricted`; Zugriff nur über kurzlebige, serverseitig erzeugte Signed URLs.

Optische Kategorien rechtfertigen keine weiteren Buckets. Struktur entsteht über `images|documents/<purpose>/<uuid>.<ext>`. Originalnamen werden nur als Metadatum gespeichert, nie als Storage-Pfad.

`media_assets` enthält nur produktiv benötigte technische, redaktionelle und Datenschutzfelder. Unterstützt werden zunächst JPEG, PNG, WebP und PDF. Office-, ZIP-, HTML-, SVG-, Audio-, Video- und ausführbare Inhalte bleiben gesperrt. Die zentrale Validierung prüft MIME-Typ, Größe und Dateisignatur sowohl vor dem Storage-Upload als auch über Bucketgrenzen.

`media_asset_usages` modelliert Wiederverwendung und Löschschutz. `media_asset_id` ist referenziell abgesichert; `entity_type/entity_id` kann wegen polymorpher Ziele keinen ehrlichen Fremdschlüssel besitzen. Jede spätere Fachintegration muss Usage und Fachreferenz in einer serverseitigen Operation koordinieren und vor dem Löschen zusätzlich die konkrete Fachtabelle prüfen. Die Usage-Tabelle allein ist kein Beweis, dass eine Fachreferenz noch existiert.

## Rollen, Scope und Datenschutz

Die Grundroute ist nur für aktive Rollen `superadmin` und `webmaster` sichtbar und serverseitig autorisiert. Direkte Browsermutationen auf Tabellen oder `storage.objects` werden für die neuen Buckets nicht freigegeben. Upload, Registrierung und Signed-URL-Erzeugung laufen nach erneuter Autorisierung über die server-only Service-Schicht.

In B15.19A dürfen diese beiden zentralen Medienrollen alle drei Sichtbarkeiten verwalten. `restricted` ist ausdrücklich noch keine allgemeine Freigabe an andere Adminrollen. Bei späteren Fachintegrationen muss der konkrete Modul-/Team-/Personenscope zusätzlich geprüft werden; Purpose oder UI-Filter sind niemals eine Berechtigungsgrundlage.

Physisches Löschen ist absichtlich noch nicht implementiert. Verwendete Assets werden nicht archiviert; unbenutzte können nur logisch archiviert werden. Ein späterer Purge muss erneut Verwendungen und bekannte Legacy-Referenzen prüfen, dann Storage löschen und erst nach erfolgreichem Postcheck den Datensatz entfernen. Fehlschläge müssen wiederholbar bleiben.

## Rollout und Migration

1. Read-only Preflight ausführen und insbesondere vorhandene Bucketnamen, Public-Flags, Limits, Policies, Objektzahlen und Tabellenfelder prüfen.
2. Schema- und RLS-Proposals manuell prüfen und gemeinsam ausführen.
3. Postcheck ausführen; normale `authenticated`-Clients dürfen keine neuen Tabellen oder Buckets mutieren.
4. Anwendung deployen und je einen öffentlichen und privaten Testupload prüfen.
5. Bestehende Fachmodule unverändert lassen. Pro Modul folgt später: Inventar-Abgleich, sichere Registrierung bestehender Objekte, Usage-Backfill, dual-read/controlled-write, Postcheck und erst danach Entfernung des Legacy-Pfads.

Es wurde keine Storage-Migration und keine SQL-Datei automatisch ausgeführt.
