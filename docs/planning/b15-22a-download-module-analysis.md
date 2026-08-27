# B15.22A – Download-Modul: Bestandsanalyse, Architektur und Live-Preflight

## Status und Abgrenzung

**Analyse abgeschlossen; der Read-only-Preflight wurde anschließend in B15.22A1 manuell ausgeführt. Keine Implementierung und keine Datenbankänderung durch Codex.** Die Live-Auswertung und das finale Design stehen in `b15-22a1-download-module-live-design.md`.

## 1. Repository-Bestand

- Es gibt weder eine öffentliche Downloadroute noch `/admin/downloads`, Download-Actions, ein Repository oder UI-Komponenten.
- Die konsistente Zielroute ist öffentlich `/downloads` und administrativ `/admin/downloads`. Sie passt zu `/news`, `/termine` sowie `/admin/news`, `/admin/events` und `/admin/media`. Footer und Navigation werden erst im Umsetzungsblock ergänzt.
- `download_categories` wurde in B15.16H2 als Stammdatentabelle mit `id`, `name_de`, optionalem Legacyfeld `name_en`, `slug`, `is_active`, `sort_order`, Zeitstempeln, Index und `set_updated_at`-Trigger vorbereitet. Die zugehörige RLS-Datei erlaubt öffentliche Reads aktiver Kategorien und authentifizierte Verwaltung über den historischen `settings.edit`-Ausdruck. Ob Schema, RLS und Grants live exakt so vorliegen, ist unbestätigt.
- Eine fachliche Tabelle `downloads` ist weder im Anwendungscode noch in den versionierten Datenbankinventaren belegt. Erwähnungen von „downloads“ bei `news_documents` und `event_documents` bezeichnen deren öffentliche Anlagen, kein zentrales Download-Modul.

## 2. Zentrale Medienbibliothek

Die vorhandene Architektur ist wiederzuverwenden, nicht zu duplizieren:

- `media_assets` hält Storage-Bucket/-Pfad, Dateimetadaten, Sichtbarkeit, Zweck, Archivstatus und Uploader.
- `media_asset_usages` ist der zentrale Beleg für eine fachliche Verwendung. `synchronize_media_assignment` ersetzt eine Zuordnung atomar; belegte Assets können nicht archiviert werden.
- Der Zweck `download` ist bereits registriert und pickerfähig; `media_kind=document` ist vorgesehen.
- Upload und Picker sind serverseitig. Storage-Upload und Asset-Insert verwenden den Adminclient; bei fehlgeschlagenem Insert wird das gerade hochgeladene Objekt entfernt.
- Aktuell zulässige Dokumente sind ausschließlich PDF (`application/pdf`, `.pdf`) bis 20 MiB. Dateigröße, MIME, Erweiterung und PDF-Signatur werden serverseitig geprüft. Bilder sind JPEG/PNG/WebP bis 10 MiB, für dieses Modul aber nicht als Downloaddatei geeignet.
- Öffentliche Assets liegen in `media-library-public` und erhalten dauerhafte öffentliche URLs. `admin`/`restricted` liegen in `media-library-private` und werden über kurzlebige Signed URLs aufgelöst.

Empfehlung für Version 1: ausschließlich PDF, maximal 20 MiB, mit unveränderter zentraler Signaturprüfung. DOCX/XLSX/ZIP oder weitere Formate erst in einem eigenen Sicherheitsblock ergänzen, weil dafür MIME-/Magic-Byte-Prüfung, Vorschauverhalten und Download-Header neu bewertet werden müssen.

## 3. Sicherheitsrelevante Folgerung für öffentliche Downloads

`is_published=false` schützt keine Datei, die bereits in einem öffentlichen Bucket unter einer bekannten URL liegt. Deshalb sollen zentrale Downloads trotz öffentlicher Listung im privaten Media-Bucket gespeichert werden. Die öffentliche Seite liest nur veröffentlichte Datensätze serverseitig. Ein dedizierter Route Handler, beispielsweise `/downloads/[id]/file`, prüft bei jedem Abruf `is_published`, Kategorie, Archivstatus und Medienbezug und erzeugt erst danach eine kurzlebige Signed URL beziehungsweise einen kontrollierten Redirect.

Damit gelten diese Regeln:

- Browser erhalten keine Service-Role und keinen direkten Tabellen-Schreibweg.
- Unveröffentlichte oder gelöschte Zuordnungen liefern keinen neuen Signed Link.
- Bereits ausgestellte Signed URLs bleiben bis zu ihrem kurzen Ablauf gültig; dies ist transparent zu dokumentieren.
- Ein Asset aus dem öffentlichen Bucket darf nicht für einen widerrufbaren Download ausgewählt werden. Bestehende öffentliche Assets müssten für diesen Zweck kontrolliert in den privaten Uploadpfad übernommen werden; kein stilles Kopieren im Picker.
- Dateinamen in Response-Headern werden normalisiert; aktive Inhalte werden nicht inline gerendert. Für PDF ist `Content-Disposition: attachment` die sichere Voreinstellung.

## 4. Empfohlenes Datenmodell

Keine zweite Datei- oder Medientabelle. Empfohlen wird genau eine fachliche Zuordnungstabelle:

`downloads`

| Feld | Zweck |
| --- | --- |
| `id uuid` | Primärschlüssel |
| `category_id uuid not null` | FK auf `download_categories`; Löschen einer verwendeten Kategorie blockieren |
| `media_asset_id uuid not null` | FK auf `media_assets`; Löschen blockieren, Austausch über zentrale Synchronisation |
| `title_de text not null` | öffentlicher Titel |
| `description_de text null` | optionale kurze Beschreibung |
| `is_published boolean not null default false` | Veröffentlichungszustand |
| `sort_order integer not null default 0` | Reihenfolge innerhalb einer Kategorie |
| `published_at timestamptz null` | nachvollziehbarer Veröffentlichungszeitpunkt |
| `created_by_user_id uuid null`, `updated_by_user_id uuid null` | serverseitig gesetzte Actor-Referenzen, sofern Live-FKs dies erlauben |
| `created_at`, `updated_at` | technische Zeitstempel |

Constraints: nichtleerer begrenzter Titel, begrenzte Beschreibung, nichtnegative oder bewusst frei definierte Sortierung, Konsistenz von `is_published/published_at`. Die fachliche Service-Schicht muss zusätzlich erzwingen: nicht archiviertes Asset, `media_kind=document`, PDF, privater Bucket, zulässige Sichtbarkeit und Zweck `download` (eine spätere explizite Cross-Purpose-Regel bleibt möglich).

`department_id` wird **nicht** in den ersten Schemaentwurf aufgenommen. Die vorhandene Scope-Engine kennt global, Jugend, zugewiesene Teams und eigene Profil-/Kartenobjekte, aber keinen belastbaren Department-Content-Scope. Ein ungenutztes nullable Feld würde Sicherheit nur vortäuschen. Abteilungsbezogene Downloads sind ein Folgeblock nach einem allgemeinen Department-Scope.

## 5. Kategorien

`download_categories` bleibt die einzige Kategorienquelle. Keine hardcodierte Parallelregistrierung. Die öffentliche Seite zeigt nur aktive Kategorien mit mindestens einem veröffentlichten Download. Admins sehen auch inaktive Kategorien und deren Verwendungen. Eine verwendete Kategorie darf nicht gelöscht werden; deaktivieren bleibt möglich. Englische Metadaten werden im Downloadformular nicht benötigt; ein vorhandenes `name_en` bleibt als Kompatibilitätsfeld unangetastet.

## 6. Rollen, Permissions und Scopes

Bestehende Permission-Keys enthalten keinen Downloadbereich. `settings.edit` wäre zu breit und die heutige Media-Verwaltung ist rollenbasiert auf Superadmin/Webmaster begrenzt. Für das Modul werden deshalb explizite Rechte empfohlen:

- `downloads.view`
- `downloads.create`
- `downloads.edit`
- `downloads.delete`
- `downloads.publish`

Superadmin erhält sie über den bestehenden Bypass beziehungsweise explizit. Gesamtvereinsvorstände erhalten die fachlich freigegebenen Rechte. Fußball-/andere Abteilungsvorstände erhalten sie erst mit nachgewiesenem Department-Scope; Trainer, Betreuer und reine Kassenrollen erhalten keine Rechte. Webmaster-Zugriff ist eine fachliche Entscheidung: technisch naheliegend, aber nicht aus der Forderung „Vorstand“ abzuleiten.

Route, Loader, Actions und Service prüfen dieselben Permission-Keys serverseitig. Navigation allein ist keine Sicherheitsgrenze. `publish` bleibt getrennt von `edit`. Der öffentliche Read-/Downloadpfad erhält niemals Adminrechte.

## 7. RLS- und Grant-Zielbild

- `downloads`: RLS aktiviert, kein FORCE RLS erforderlich. `anon` und normale `authenticated` Clients erhalten keine Tabellen-Schreibrechte. Bevorzugt erfolgt auch das Lesen über serverseitige, DTO-begrenzte Loader; `service_role` behält die nötigen Rechte.
- Wenn ein direkter öffentlicher SELECT fachlich gewählt wird, muss eine eng begrenzte Policy ausschließlich veröffentlichte Zeilen zulassen. Die serverseitige Variante ist konsistenter mit dem kontrollierten Dateizugriff.
- `download_categories`: Live-Policies und Tabellen-/Spaltengrants zuerst inventarisieren. Historische eingebettete Rollenlogik nicht ungeprüft fortschreiben; die aktuelle Permission-Architektur muss maßgeblich sein.
- Storage: keine neue Browser-Uploadpolicy. Upload, Signed-URL-Erzeugung und Usage-Synchronisation bleiben server-only.

## 8. Anwendungsarchitektur

Schichten wie bei News-/Event-Dokumenten:

1. `/admin/downloads` lädt autorisierte, sanitiserte DTOs und eine kompakte Tabelle.
2. `/admin/downloads/new` und `/admin/downloads/[id]/edit` verwenden Server Actions.
3. Ein Download-Service validiert Payload, Berechtigung, Kategorie und Asset.
4. Media Picker filtert `mediaKind=document`, `usageContext=download`, nicht archiviert und serverseitig zulässige private Sichtbarkeit.
5. Direktupload nutzt denselben Media-Service mit Zweck `download`; kein zweiter Storagepfad.
6. Persistenz und `media_asset_usages` (`entity_type=download`, `field_name=file`) werden in einer kontrollierten Transaktion/RPC synchronisiert.
7. `/downloads` lädt nur veröffentlichte DTOs, gruppiert nach aktiver Kategorie.
8. Der Datei-Route-Handler autorisiert den konkreten Abruf und erzeugt eine kurze Signed URL.

Eine Datei ersetzen heißt: neue Asset-Zuordnung atomar setzen, alte Usage entfernen, alte Datei nicht automatisch physisch löschen. Download-Datensatz löschen heißt: fachliche Zeile und ihre Usage kontrolliert entfernen; das Media Asset bleibt in der Bibliothek und kann anschließend separat archiviert werden. Das erhält den bestehenden Archivschutz und vermeidet Datenverlust bei Mehrfachverwendung.

## 9. UI/UX-Zielbild

Admin Desktop: kompakte Tabelle mit Titel, Kategorie, Datei, Größe, Status, Sortierung und Aktionen. Mobil: kompakte Zeilen/Karten ohne horizontales Scrollchaos. Create/Edit enthält deutsche Metadaten, Kategorie, Sortierung, Veröffentlichungsstatus sowie Upload/Picker. Deaktivierte Kategorien bleiben bei bestehenden Datensätzen sichtbar, sind für neue Auswahl aber nicht standardmäßig wählbar.

Öffentlich: ruhige Liste nach Kategorien, je Eintrag Titel, Beschreibung, Dateityp/-größe und eindeutiger Downloadbutton. Leere Kategorien werden ausgeblendet; leerer Gesamtzustand, Ladefehler und nicht mehr verfügbarer Abruf werden explizit behandelt. Download ist kein Inline-PDF-Viewer.

## 10. Audit, Datenschutz und Betrieb

`notification_audit` ist fachlich ausschließlich Notification-Audit und darf nicht als allgemeines Admin-Audit zweckentfremdet werden. Für Version 1 reichen serverseitig gesetzte Actor-/Zeitfelder plus strukturierte, datensparsame Serverlogs für Fehler. Ein revisionssicheres generisches Änderungsjournal wäre ein separater Architekturblock. Logs enthalten keine Dateiinhalte, Signed URLs, Tokens oder vollständige personenbezogene Metadaten.

Versionierung ist nicht Teil von Version 1. Die Media-ID kann ersetzt werden, ohne alte Versionen dauerhaft an der Downloadzeile zu halten. Virenscan, Upload-Quarantäne, DOCX/XLSX/ZIP, Downloadzähler, interne/member-only Downloads, Department-Scope, Ablaufdaten und revisionssichere Historie sind getrennte Folgeblöcke.

## 11. Offene Live-Fakten und Preflight

Das Repository kann den aktuellen Supabase-Stand nicht beweisen. Der strikt lesende Preflight `docs/sql/b15-22a-download-module-preflight-readonly.sql` klärt:

- Existenz, Spalten, Constraints, Indizes, RLS, Policies und Grants von `download_categories`, möglichen Downloadtabellen und zentralen Medientabellen;
- vorhandene Kategorien und ausschließlich aggregierte Bestandszahlen;
- Storage-Buckets/-Policies und Download-Medien nach Bucket, Sichtbarkeit, Typ, Zweck und Archivstatus;
- Functions/Trigger und bestehende `media_asset_usages` für Download-Entitäten;
- Permission-/Rollenbestand für mögliche Download-Keys.

Er ist vor jedem Proposal manuell im Supabase SQL Editor auszuführen und vollständig auszuwerten. Erst danach dürfen Schema-, RLS-, Grant-, Rollback- und Postcheck-Artefakte entstehen.

## 12. Empfohlene Umsetzungsreihenfolge

1. B15.22A1: abgeschlossen; Read-only-Preflight wurde manuell ausgewertet.
2. B15.22B: abgeschlossen; Schema/RLS/Grants/Permissions wurden manuell installiert und nachgeprüft.
3. B15.22C: Admin-CRUD, serverseitiges Repository/Service/Actions und Media-Usage sind implementiert; manueller Browsertest offen.
4. B15.22D: öffentliche Liste und kontrollierter Datei-Route-Handler.
5. B15.22E: Navigation/Footer, Rollenregression, Browser- und Security-Negativtests.

Keine dieser Stufen wurde in B15.22A implementiert.
