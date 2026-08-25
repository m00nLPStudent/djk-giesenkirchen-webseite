# B15.19E3 – Team-Kontaktbilder

## Ist-Zustand und Fachsemantik

`teams.contact_image_url` und `team_seasons.contact_image_url` sind Fotos der in denselben Datensätzen gepflegten Mannschafts-Ansprechperson (`contact_name`, E-Mail, Telefon). Das saisonale Feld ist ein saisonaler Snapshot; die öffentliche Teamdetailseite zeigt das zusammengeführte Kontaktbild in `TeamContact`. Andere öffentliche Listen und Admin-Listen verwendeten das Feld nicht.

Vor E3 las das Teamformular `team_seasons.contact_image_url` mit Fallback auf `teams.contact_image_url`, hielt aber nur einen gemeinsamen Formularwert und schrieb diesen beim Speichern sowohl in `teams` als auch in `team_seasons`. Der Browserupload im Kontakt-Reiter rief `uploadTeamImage` auf: Bucket `media`, Pfad `teams/<name-id>.<ext>`, Upsert über den Legacy-Storage-Helper und physische Löschung des vorherigen URL-Objekts. Ein ungenutzter Helper sah `media/team-contacts/...` vor. Beim Hard Delete eines Teams wird das allgemeine Legacy-Kontaktbild nach erfolgreichem Datensatzlöschen weiterhin physisch entfernt; der normale UI-Pfad archiviert Teams und löscht es nicht. Zentrale Assets werden von diesem Legacy-Cleanup nicht berührt.

Die Bearbeitung wird serverseitig durch `teams.create`/`teams.edit` plus Team-Scope geschützt. Der Picker wiederverwendet dieselbe Autorisierung. Superadmin/Webmaster dürfen `public` und `admin` sehen und wählen, andere berechtigte Team-Bearbeiter nur `public`; `restricted` ist ausgeschlossen.

## E3-Zielbild

- `teams.contact_image_media_asset_id`: nullable UUID, FK auf `media_assets(id)`, `ON DELETE SET NULL`, partieller Index.
- `team_seasons.contact_image_media_asset_id`: identische Absicherung.
- Usages: `team/<id>/contact_image` und `team_season/<id>/contact_image`; vorhandene `.../image`-Usages bleiben unabhängig.
- Direktuploads laufen ausschließlich über `uploadTeamMediaAction`/`uploadMediaAsset`, bleiben Bilder mit maximal 10 MiB, `purpose=team`, `visibility=public` und verwenden den zentralen Bucket/Pfadgenerator. Es gibt keinen Browser-Direktzugriff auf Storage mehr.
- Cross-Purpose bleibt erlaubt. Ein Coach-, Player-, Board- oder Vereinskontakt-Asset wird nicht kopiert und behält seinen Purpose.
- `synchronize_media_assignment` erhält nur die festen zusätzlichen Kombinationen `team/contact_image` und `team_season/contact_image`. Die RPC validiert aktives Bildasset und Ziel, aktualisiert FK und Usage atomar, hat festen `search_path` und bleibt ausschließlich für `service_role` ausführbar.

## Formular, Legacy und Resolver

Der Medien-Reiter gruppiert Mannschaftsbilder und Kontaktperson. Beide Gruppen enthalten einen saisonalen und einen allgemeinen zentralen Picker. Kontaktfelder und Mannschaftsbildfelder bleiben strikt getrennt. Bei Saisonwechsel bleiben allgemeine Auswahlen erhalten, saisonale Auswahlen werden passend zur Saison geladen.

Ein explizites Entfernen setzt nur die entsprechende Media-ID auf `NULL`, entfernt über die RPC nur die Usage dieses Feldes und leert beim Speichern das zugehörige Legacy-Kontaktfeld. Asset und Storageobjekt bleiben bestehen. Es findet kein Backfill und keine automatische Legacyänderung statt.

Die öffentliche Priorität lautet:

1. saisonales öffentliches zentrales Kontaktasset
2. saisonales Legacy-Kontaktbild
3. allgemeines öffentliches zentrales Kontaktasset
4. allgemeines Legacy-Kontaktbild
5. vorhandener Personenplatzhalter (`COACH_PLACEHOLDER_IMAGE`)

Alle Media-IDs der Detailseite werden gemeinsam über `loadPublicMediaUrlMap` geladen. Dadurch entstehen keine N+1-Abfragen und weder Admin-Assets noch Signed URLs gelangen in die öffentliche Ausgabe. Im Adminformular werden vorhandene allgemeine Medien einzeln und saisonale Medien in einem Batch aufgelöst; private Vorschauen sind kurzlebige serverseitige Signed URLs und werden nicht persistiert.

## Bestand (read-only, 25.08.2026)

Die konfigurierte Entwicklungsinstanz wurde ausschließlich lesend geprüft:

- nichtleere `teams.contact_image_url`: 1
- nichtleere `team_seasons.contact_image_url`: 2
- saisonale Zeilen mit identischer allgemeiner URL: 2 (eine eindeutige URL)
- exakte URL-Übereinstimmungen mit bekannten Trainer-, Spieler- oder Vorstandsbildern: 0

Diese Werte werden nicht migriert oder verändert. Der Postcheck enthält zusätzliche manuelle Bestandsabfragen.

## SQL, Rollback und Risiken

Das Proposal, der read-only Postcheck und der ausschließlich E3 zurücknehmende Rollback liegen unter `docs/sql/b15-19e3-*`. Keine SQL-Datei wurde ausgeführt. Der Rollback entfernt nur Kontakt-Usages, Kontakt-Indizes und Kontaktspalten und stellt die RPC auf den E2-Stand zurück.

Ein verbleibendes systemisches Risiko des vorhandenen Speichervorgangs bleibt: Stammdaten-/Legacyupdates und die anschließenden einzelnen Assignment-RPC-Aufrufe bilden zusammen keine einzige übergreifende Transaktion. Jede einzelne Referenz/Usage-Synchronisation ist atomar; ein später RPC-Fehler kann jedoch nach bereits gespeichertem Stammdatensatz auftreten. Eine Architekturänderung dieses E2-Verhaltens liegt außerhalb E3.

## Tests und manueller Browsertest

Automatisiert werden Allowlist, vier unabhängige Formularslots, Legacy-Entfernung, zentrale Upload-/Pickerpfade, Sichtbarkeit, Batchauflösung, Public-Fallback, SQL-Grants/Rollback sowie E1/E2/E2.1 regressiv geprüft.

Manuell: Proposal ausführen, Postcheck ausführen, Dev-Server neu starten; allgemeines und saisonales Kontaktbild testen; Saison wechseln; Direktupload und Bibliotheksauswahl durchführen; Coach- und Player-Bild cross-purpose wählen; A nach B ersetzen; beide Ebenen getrennt entfernen; Legacy und Personenplatzhalter prüfen; Public-Asset öffentlich prüfen; Admin-Asset zuweisen und Public-No-Leak prüfen; Usages und Archivschutz prüfen; Upload über 10 MiB ablehnen lassen; E1/E2-Mannschaftsbilder regressiv prüfen.
