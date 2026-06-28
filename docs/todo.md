# Todo

Diese Datei sammelt offene Aufgaben und technische Baustellen.

## Erledigt

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
