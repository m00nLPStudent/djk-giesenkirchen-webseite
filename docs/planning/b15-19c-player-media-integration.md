# B15.19C – Player-Medienintegration

## Architektur und Root Cause

Die bisherige Trainerintegration schrieb `coaches.image_media_asset_id` beim Stammdatensatz-Update und synchronisierte `media_asset_usages` danach in einem zweiten Datenbankaufruf. Bei einem Fehler zwischen beiden Operationen blieb eine inkonsistente Referenz zurück. Das Upsert war zwar durch den eindeutigen Entity-/Feld-Index gegen Doppelzeilen geschützt, Referenzwechsel und Usage-Wechsel waren aber nicht atomar.

B15.19C führt deshalb den gemeinsamen Service `synchronizeMediaAssignment` ein. Er ruft die ausschließlich für `service_role` freigegebene Funktion `synchronize_media_assignment` auf. Diese validiert Ziel, Feld, Mediumtyp, Verwendungszweck und Archivstatus und aktualisiert Referenz, Entfernen der alten Usage sowie Einfügen der neuen Usage in einer Transaktion. Gleichzeitige Updates werden über das Entity-Update serialisiert. Trainer und Spieler verwenden denselben Weg.

## Spielerintegration

`players.image_media_asset_id` ist eine nullable FK auf `media_assets.id`; bestehende Daten werden nicht migriert. Das Formular verwendet den zentralen Picker und Upload-Service. Zulässig sind aktive Bilder mit `purpose = player`; reguläre Player-Bearbeiter sehen `public`, bestehende Medienmanager zusätzlich `admin`. `restricted` bleibt ausgeschlossen. Picker-Laden, Upload und Speichern prüfen bestehende Player-Permissions und beim Bearbeiten den vorhandenen Team-Scope serverseitig.

Beim Ersetzen entfernt der RPC die bisherige Entity-/Feld-Usage und legt genau eine neue an. Beim Entfernen werden Referenz und Usage gelöscht, das Asset und seine Storage-Datei bleiben bestehen. Damit bleibt die bestehende Archivierung unverändert: Assets mit Usage sind nicht archivierbar, nach Entfernen der letzten Usage wieder archivierbar.

## Resolver und Legacy

Die Bildpriorität lautet: aufgelöstes Media Asset, `image_url`, `photo_url`, Platzhalter. `photo_url` bleibt lesbarer Legacy-Fallback, wird aber von neuen Player-Schreibvorgängen nicht mehr beschrieben. Die öffentlichen Karten behalten dadurch ihre Legacy-Kompatibilität.

## SQL

- `b15-19c-player-media-reference-proposal.sql`: Player-FK, Index und atomarer RPC
- `b15-19c-player-media-reference-postcheck-readonly.sql`: Struktur-, Grant-, Duplikat- und Konsistenzprüfung
- `b15-19c-player-media-reference-rollback.sql`: Rückbau ohne Datei- oder Bestandsmigration

Keine SQL-Datei wird durch die Anwendung oder während der Implementierung automatisch ausgeführt.

## Risiken und Regressionen

Der RPC schützt die Konsistenz von Media-Referenz und Usage, ist aber nicht Teil derselben Transaktion wie die übrigen Player-/Coach-Stammdaten und Saisonzuordnungen. Bei einem RPC-Fehler bleiben diese Fachänderungen gespeichert, während die bisherige Medienzuordnung konsistent erhalten bleibt. Eine fachübergreifende Gesamttransaktion wäre eine spätere Architekturänderung und ist nicht Bestandteil dieses Pakets.

Zu prüfen sind Player Create/Edit, Direktupload, Picker-Suche und -Filter, Replace/Remove, Archivierungsblockade, Legacy-Fallback, Player-Scope sowie Trainer-, Media-Library- und Upload-Regressionen.

## Manueller Browsertest

1. Spieler ohne Bild erstellen.
2. Spieler mit Direktupload erstellen.
3. Spieler mit Bibliotheksbild erstellen.
4. Spieler bearbeiten und bestehendes Bild prüfen.
5. Bild ersetzen; alte und neue Usage prüfen.
6. Bild entfernen; Usage verschwindet, Asset bleibt erhalten.
7. Archivierung vor und nach Entfernen prüfen.
8. Picker auf aktive Player-Bilder und erlaubte Sichtbarkeiten prüfen.
9. Suche einschließlich Enter prüfen; Formularzustand muss erhalten bleiben.
10. Öffentliche Spielerkarte und Profil prüfen.
