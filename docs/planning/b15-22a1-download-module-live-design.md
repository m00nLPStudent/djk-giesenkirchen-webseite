# B15.22A1 – Live-Auswertung und finales DB-/Security-Design

## Ergebnis

Der manuell ausgeführte B15.22A-Preflight bestätigte die Architektur mit einer Abweichung: Die zentrale Usage-Tabelle kannte `download`, die zentrale Funktion `synchronize_media_assignment` aber noch nicht `download/file`. B15.22B wurde inzwischen manuell installiert und per Read-only-Postcheck bestätigt; der zentrale Synchronisationsweg unterstützt nun `download/file`.

Verbindlich gilt: **Keine zweite Upload-/Dateiverwaltung.** `media_assets`, die vorhandenen Media-Buckets, die zentrale Uploadvalidierung, `media_asset_usages` und der Archivschutz bleiben die einzige Source of Truth für Dateien.

## Bestätigter Live-Zustand

- `download_categories`: vorhanden, sechs aktive und keine inaktive Kategorie; Schema, Index, Trigger und RLS entsprechen B15.22A.
- `downloads`: nicht vorhanden.
- `media_assets` und `media_asset_usages`: vorhanden, RLS aktiv; PDF, 20 MiB, Zweck `download`, Pfad `documents/download/<uuid>.pdf` und Usage-Entity `download` sind zulässig. `field_name=file` erfüllt das bestehende Regex-Constraint.
- Buckets: moderne `media-library-private`/`media-library-public` sowie Legacy-Bucket `media`. Downloads verwenden ausschließlich `media-library-private`.
- Drei relevante PDF-Bestandsassets belegen den Uploadpfad. Sie werden nicht verändert.
- Es gibt keine `download%`-Permission.

## Finales Schema

`public.downloads` enthält `id`, `category_id`, `media_asset_id`, `title`, optionale `description`, `is_published`, `sort_order`, `published_at`, nullable `created_by`/`updated_by` sowie Zeitstempel. Dateiname, Pfad, MIME und Größe bleiben ausschließlich in `media_assets`. Ein Slug, Soft Delete, Downloadzähler und Versionierung entfallen.

Die direkte Media-FK ist die fachliche Source-of-Truth der Zuordnung; die zusätzliche Usage ist der zentrale, modulübergreifende Beleg für Archivschutz und Mehrfachverwendung. Der RPC aktualisiert beide atomar. `published_at` bezeichnet den Zeitpunkt der aktuellen Veröffentlichung: beim Übergang auf veröffentlicht wird er gesetzt, beim Zurückziehen gelöscht.

FKs: Kategorie `ON DELETE RESTRICT`, Media Asset `ON DELETE RESTRICT`, Actor-FKs `ON DELETE SET NULL`. Der Delete-Cleanup entfernt nur `download/file`-Usages; Asset und Storageobjekt bleiben erhalten.

## Permissions und Rollen

Konventionsgleich zu News/Events werden `downloads.view`, `.create`, `.edit`, `.delete` und `.publish` angelegt. Initial erhalten sie:

- `superadmin`: alle Rechte (zusätzlich zum bestehenden Superadmin-Bypass explizit sichtbar),
- `vorstand`: alle Rechte für globale Vereinsdownloads,
- `webmaster`: alle Rechte, weil diese Rolle bereits globale Webinhalte und die zentrale Medienbibliothek pflegt.

Fußball-, Tischtennis-, Gymnastik- und Behindertensportvorstände erhalten Version 1 nicht automatisch. Ohne Department-Content-Scope wäre ihre Freigabe global. Trainer, Betreuer und Kassierer erhalten keine Downloadrechte.

## RLS, Grants und Zugriff

RLS wird aktiviert, FORCE RLS nicht. `anon` und `authenticated` erhalten nur SELECT auf den öffentlichen DTO-Spalten; RLS lässt dabei ausschließlich veröffentlichte Downloads aktiver Kategorien durch. Autorisierte Admins können RLS-seitig alle Zeilen sehen und fachlich passende Mutationen ausführen, erhalten aber bewusst keine direkten Tabellen-Mutationsgrants. Die spätere Server-Action prüft Session, aktives Adminprofil und Permission und verwendet anschließend den server-only Service-Role-Client. `service_role` behält alle erforderlichen Tabellenrechte.

Damit bestehen zwei Grenzen: RLS ist fail-closed, und ein normaler Browser kann auch mit Admin-JWT nicht direkt mutieren. Die öffentliche Datei wird später ausschließlich über `GET /downloads/[id]/file` nach erneuter Prüfung von Veröffentlichung, aktiver Kategorie, Usage, nicht archiviertem PDF und privatem Bucket per kurzlebiger Signed URL bereitgestellt.

Die breiten Bestandsgrants von `download_categories` werden in B15.22B nicht nebenbei verändert: Sie gehören zum gemeinsamen B15.16H-Kategorienmodell und sind durch dessen RLS begrenzt. Eine kategorienübergreifende Grant-Härtung braucht einen separaten Regressionblock.

## Nicht im Scope

Legacy-Policies/Buckets für `media`, `news-documents` und `events-documents` werden nicht verändert. Ihre breite historische Storage-Security ist ein separater Cleanup-Punkt. Ebenso offen bleiben Department-Scope, weitere Dateitypen, Virenscan/Quarantäne, Zähler und Versionierung.

## SQL-Verfahren

Vorbereitet sind Proposal, defensiver Rollback und Read-only-Postcheck. Keine Datei wurde ausgeführt. Vor manueller Freigabe muss insbesondere die im Proposal enthaltene Funktions-Vorbedingung gegen die Live-Definition von `synchronize_media_assignment` geprüft werden; sie bricht bei einem unerwarteten Funktionsstand fail-closed ab.
