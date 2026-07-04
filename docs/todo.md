# Todo

Diese Datei sammelt offene Aufgaben und technische Baustellen.

## Erledigt

### Struktur-Review und Event-Phase 1

- [x] To-do 1: Projektstruktur analysiert
- [x] To-do 2: Duplikate identifiziert
- [x] To-do 3: Datei-Helfer zentralisiert (`src/lib/files.js`)
- [x] To-do 4: Storage-Helfer modularisiert (`src/lib/storage.js`)
- [x] To-do 5: Docs-Struktur neu aufgebaut
- [x] To-do 6: Abschlussdokumentation erstellt (`docs/development/project-health.md`)
- [x] Termine SQL-Entwurf erstellt (`public.events`)
- [x] Admin Events Phase 1 abgeschlossen (Liste, Neu, Bearbeiten, Service, Bild-Upload)

### Spielermodul

- [x] Datenbankfelder final mit Code abgeglichen
- [x] Service auf bestehende Spalten angepasst
- [x] Formular auf bestehende Spalten angepasst
- [x] Spielerkarte auf bestehende Spalten angepasst
- [x] Übersicht auf Mannschaftszuordnung erweitert
- [x] Bild-Upload auf `photo_url` vereinheitlicht
- [x] Platzhalterbild für Spieler eingebaut
- [x] Alte Spielerbilder werden beim Wechseln/Entfernen gelöscht
- [x] Spieler vollständig inklusive eigenem Bild löschbar
- [x] Speichern getestet
- [x] Bearbeiten getestet
- [x] Aktiv/Inaktiv getestet
- [x] Spielerprofilseite erstellt
- [x] Mannschafts-Kaderansicht mit Spielerprofilen erstellt
- [x] Dashboard-Statistiken für Spieler erstellt
- [x] Nationalitätenübersicht erstellt
- [x] Filter- und Sortierlogik ausgelagert
- [x] Spielerformular modularisiert
- [x] Spielerprofil modularisiert
- [x] Gemeinsame Admin-Komponenten angebunden

### Trainermodul

- [x] Datenbankfelder mit Code abgeglichen
- [x] Service auf bestehende Spalten angepasst
- [x] Formular auf bestehende Spalten angepasst
- [x] Trainerkarte auf bestehende Spalten angepasst
- [x] Übersicht auf Mannschaftszuordnung erweitert
- [x] Bild-Upload mit Platzhalterbild eingebaut
- [x] Alte Trainerbilder werden beim Wechseln/Entfernen gelöscht
- [x] Trainer vollständig inklusive eigenem Bild löschbar
- [x] Speichern getestet
- [x] Bearbeiten getestet
- [x] Aktiv/Inaktiv getestet
- [x] öffentliche Trainerprofilseite erstellt
- [x] Trainerstatistiken erstellt
- [x] Filterung nach Trainer, Co-Trainer, Betreuer und Mannschaften erstellt
- [x] Trainerformular modularisiert
- [x] Trainerprofil modularisiert
- [x] Gemeinsame Admin-Komponenten angebunden

### Gemeinsame Admin-Grundlage

- [x] `AdminImageUpload`
- [x] `useImageUpload`
- [x] `useEntityForm`
- [x] `useDeleteEntity`
- [x] `EntityBadge` / `EntityStatusBadge`
- [x] `EntityCard`
- [x] `StatisticGrid`
- [x] `ProfileDetailsCard`
- [x] `entity.repository`
- [x] gemeinsame Listen- und Suchhelfer
- [x] gemeinsame Validierungshelfer
- [x] gemeinsame Länder-/Flaggenhelfer
- [x] gemeinsame Settings-Felder

## Aktuell offen

### Datenbank

- `teams` prüfen und final dokumentieren
- später Migrationen unter `supabase/migrations` anlegen
- Rollen-/Rechtesystem später ergänzen
- Beitragsstatus später ergänzen

### Adminbereich

- QuickActions prüfen
- Sidebar prüfen
- fehlende Adminseiten als Platzhalter anlegen
- einheitliche EmptyStates weiter ausbauen

### Website

- fehlende Hauptseiten wurden als Platzhalter angelegt
- Fußball-Unterseiten weiter ausbauen
- Newsdetailseite prüfen
- Mannschaftsdetailseite weiter ausbauen
- Trainer-/Betreuerbereich auf Mannschaftsseiten integrieren

## Nächster konkreter Arbeitsschritt

Mannschaftsseiten weiter ausbauen.

Ziel: Spieler, Trainer und Betreuer auf den öffentlichen Mannschaftsseiten sauber zusammenführen und die Mannschaftsverwaltung als nächstes Admin-Modul nach dem neuen gemeinsamen Muster aufbauen.

## Struktur-Review To-do 2: Duplikate identifiziert

### Bestätigte Duplikate

- `formatFileSize` ist doppelt vorhanden:
  - `src/app/(website)/news/[slug]/page.js`
  - `src/components/admin/news/components/NewsDocumentsManager.js`
- `getFileExtension` ist doppelt vorhanden:
  - `src/components/admin/news/services/news.service.js`
  - `src/lib/storage.js`
- Ableitung des Anzeigenamens aus Dateinamen (`deriveDisplayName`) liegt aktuell nur im News-Service und sollte als gemeinsamer File-Helper zentralisiert werden.
- Public-URL-Ermittlung für Storage ist mehrfach in ähnlicher Form vorhanden (`media` und `news-documents`) und sollte in gemeinsame Bucket-Helfer überführt werden.

### Priorisierte Refactor-Ziele (nächste To-dos)

- Gemeinsame Datei-Helfer in `src/lib/files.js` anlegen:
  - erlaubte Dokumenttypen
  - Dateiendung ermitteln
  - Anzeigenamen aus Dateinamen ableiten
  - Dateigröße formatieren
- News-Dokumente-Komponente und News-Detailseite auf gemeinsame Formatter umstellen.
- News-Service und Storage-Helfer auf gemeinsame Bucket-/Upload-Utilities ausrichten, ohne Feature-Verhalten zu ändern.

### Abgrenzung

- Dieser Schritt ist reine Analyse/Bestandsaufnahme.
- Es wurden in diesem To-do keine Runtime-Funktionen geändert.
