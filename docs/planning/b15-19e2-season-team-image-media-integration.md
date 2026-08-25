# B15.19E2 – Saisonales Mannschaftsbild

## Ist-Zustand

Das ausgewählte `team_seasons.team_image_url` wurde vor E2 in `createInitialTeamForm` mit dem allgemeinen `teams.team_image_url` zu einem gemeinsamen Formularfeld verschmolzen. `saveTeamWithSeason` schrieb denselben Wert anschließend sowohl in den Teamstamm als auch in die ausgewählte Saison. Das frühere Browserupload-Hilfsmodul `uploadTeamImage` speichert in den öffentlichen Legacy-Bucket `media` unter `teams/<normalisierter-name-id>.<end`; bei einem Pfadwechsel entfernt es die vorherige Datei vor dem neuen Upload und verwendet ansonsten `upsert`. Nach E1 wurde dieser Pfad für das allgemeine Mannschaftsbild nicht mehr verwendet, blieb aber indirekt als historischer saisonaler Formularpfad bestehen. Kontaktbilder bleiben ausdrücklich auf ihrem separaten Legacypfad.

Öffentliche Listen luden bisher nur Teamstammdaten und lösten das allgemeine zentrale Asset batchweise auf. Die Detailseite lud eine `team_seasons`-Zeile und verwendete deren Legacybild vor dem allgemeinen zentralen Bild. Adminliste und Detail hatten jeweils eigene Team-/Season-Merges. Der Read-only-Bestandscheck am 25.08.2026 ergab zwei nichtleere saisonale Legacy-URLs; `team_seasons.team_image_media_asset_id` war mit PostgreSQL-Code `42703` noch nicht vorhanden.

## Datenmodell und Assignment

Das E2-Proposal ergänzt `team_seasons.team_image_media_asset_id uuid NULL`, eine FK auf `media_assets(id)` mit `ON DELETE SET NULL` und einen partiellen Index. Es gibt keinen Backfill und keine Änderung an `team_seasons.team_image_url`. Der bereits aus B15.19A/D3 bekannte Usage-Typ `team_season` bleibt bestehen. Falls ein abweichender älterer `entity_type`-Constraint ihn noch nicht erlaubt, stellt das Proposal kontrolliert die bekannte vollständige Allowlist einschließlich `club_contact`, `team` und `team_season` her.

Die vorhandene `synchronize_media_assignment` wird um das feste Ziel `team_season` erweitert. Für `team_season / <team_season.id> / image` validiert sie Existenz, Archivstatus und Bildtyp, aktualisiert Referenz und Usage atomar und bleibt ausschließlich für `service_role` ausführbar. Alle bisherigen Ziele bleiben unverändert. Cross-Purpose ist erlaubt; der Purpose des Assets wird nicht verändert.

## Formular und Upload

Das Medien-Tab unterscheidet sichtbar zwischen „Saisonales Mannschaftsbild“ und „Allgemeines Mannschaftsbild“. Jede Saison hält eine eigene Auswahl. Beim Saisonwechsel wird das zugehörige Asset aus einer einmalig batchgeladenen Map übernommen. Beide Bereiche verwenden den vorhandenen `AdminMediaPicker`, Default-Purpose `team`, dieselben serverseitigen Scopes sowie denselben Direktupload mit `purpose = team` und `visibility = public`. Superadmin/Webmaster dürfen im Picker Public- und Adminbilder sehen; reguläre Teambearbeiter nur Public. Restricted bleibt ausgeschlossen.

Die in E1.2 zentralisierte Dateiprüfung greift automatisch: Bilder maximal 10 MiB, frühe Clientmeldung und zwingende Servervalidierung vor Storage und Datenbank. Browser erhalten keine rohen Storage-, PostgreSQL- oder Supabase-Fehler.

## Priorität und Sichtbarkeit

Der gemeinsame Resolver `resolveTeamImage` verwendet für Public und Admin dieselbe fachliche Reihenfolge, aber ausschließlich die vom jeweiligen serverseitigen Loader freigegebene URL-Map:

1. saisonales zentrales Asset
2. saisonales Legacybild
3. allgemeines zentrales Team-Asset
4. allgemeines Team-Legacybild
5. neutraler Mannschafts-Platzhalter

Public lädt nur aktive, nicht archivierte Bilder mit `visibility = public` aus `media-library-public`. Ein Admin-Saisonasset fehlt daher in der Public-Map und fällt auf saisonales Legacy, allgemeines Public-Asset, allgemeines Legacy oder Platzhalter zurück. Admin löst abhängig von der Rolle zusätzlich `admin` über kurzlebige, ausschließlich serverseitig erzeugte Signed URLs auf. Listen sammeln saisonale und allgemeine IDs gemeinsam; es gibt keine Media-N+1-Abfrage. Junioren-, Senioren- und Gesamtlisten teilen den Public-Loader, die Detailseite denselben Resolver.

## Ersetzen, Entfernen und Archivschutz

Beim Ersatz A → B aktualisiert die RPC die Saisonreferenz, entfernt die Saisonusage von A und erzeugt die Saisonusage für B. A und seine übrigen Usages bleiben bestehen. Beim expliziten Entfernen werden Media-ID, saisonale Usage und das eigene saisonale Legacyfeld geleert, damit das alte Bild nicht sofort wieder erscheint. Asset und Storagedatei bleiben bestehen; anschließend greift das allgemeine Bild beziehungsweise der Platzhalter. Der zentrale Usage-Schutz blockiert Archivierung, solange irgendeine Usage vorhanden ist.

## Platzhalter

Zum Abschluss von E2 existierte noch kein fertiges Mannschafts-Placeholderbild; E2 vereinheitlichte deshalb zunächst die neutralen UI-Fallbacks über `TeamImagePlaceholder`. Mit E2.1 liegt die finale Grafik an der vorbereiteten Zielreferenz `/images/placeholders/team-placeholder.webp` und wird durch diese Komponente dargestellt, weiterhin ohne Media Asset oder Usage.

## SQL, Rollback und Migration

Proposal, Read-only-Postcheck und enger Rollback liegen unter `docs/sql`. Der Postcheck prüft Spalte, Typ, Nullable, FK-Löschregel, Index, Usage-Constraint, Funktionsdefinition, Grants, unsichere Referenzen, Duplikate, dangling Usages sowie beide Richtungen der Referenz-/Usage-Konsistenz. Der Rollback entfernt nur saisonale Team-Usages, E2-Spalte/Index/FK und stellt die E1-RPC-Allowlist wieder her. Er verändert weder allgemeine Teammedien noch Assets, Storage oder Legacybilder. Keine SQL-Datei und keine Bestandsmigration wurden ausgeführt.

Ein späterer Backfill der zwei vorhandenen Legacy-Saisonbilder kann sinnvoll sein, muss aber kontrolliert je URL prüfen: erreichbare Storagequelle, tatsächlicher MIME-Inhalt, Duplikate, gewünschte Sichtbarkeit, Upload/Registrierung und atomare `team_season`-Zuordnung. Erst nach fachlicher Abnahme darf das Legacyfeld separat bereinigt werden.

## Tests und Risiken

Resolvertests decken die vollständige Priorität, leere Werte sowie nicht aufgelöste Admin-/Restricted-IDs ab. Integrationsprüfungen sichern getrennte Formularfelder, Direktupload, Saisonwechsel, Scope, Cross-Purpose, zentrale Batchloader, Listen, Detail, Entfernen und Placeholder. SQL-Tests sichern Proposal/Postcheck/Rollback und den Ausschluss von Backfill oder Assetlöschung.

Offene Risiken: Die Anwendung benötigt das manuelle E2-Proposal, bevor saisonale Media-IDs gespeichert werden können. Die bestehende Team-/Saison-Gesamtspeicherung ist mehrstufig; Referenz und Usage sind innerhalb jeder Assignment-RPC atomar, aber Teamstamm-, Saison-, Kader- und beide Media-RPCs bilden keine gemeinsame Datenbanktransaktion. Die zwei Legacy-Saisonbilder bleiben bewusst erhalten. Signed Admin-URLs laufen nach fünf Minuten ab.

## B15.19E2.1 – Finales Mannschafts-Platzhalterbild

Die finale lokale Datei liegt unter `public/images/placeholders/team-placeholder.webp` und ist im Browser unter `/images/placeholders/team-placeholder.webp` erreichbar. `TeamImagePlaceholder` rendert sie zentral mit `next/image`, reserviert über bestehende Containerhöhen den Layoutplatz, verwendet `fill`, kontextspezifische `sizes`, `object-cover`, Lazy Loading ohne unnötiges Preload und den Alt-Text „Mannschaftsbild nicht verfügbar“.

Die zentrale Komponente deckt saisonale und allgemeine Vorschau im Teamformular, Desktop-/Mobile-Thumbnail der Adminliste, Admin-Detailkopf, öffentliche Mannschaftskarten für Junioren/Senioren/Gesamtübersicht sowie den Public-Teamhero ab. Die E2-Priorität bleibt unverändert; nur die letzte visuelle Fallbackstufe wurde ersetzt. Der Picker kennzeichnet weiterhin „Kein eigenes Bild“, sodass das statische Bild nie als Auswahl erscheint.

Die Datei ist kein Media Asset, besitzt keine Usage, wird nicht in Supabase Storage geladen und wird weder in `teams` noch `team_seasons` gespeichert. Es gibt keine zusätzliche Datenbankabfrage und keine SQL-Änderung. Tests prüfen Dateiexistenz, korrekten Public-Pfad, Next-Image-Einbindung, alle Teamflächen und die Abwesenheit von Media-/Usage-Schreibwegen.
