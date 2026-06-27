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

## Nächster konkreter Arbeitsschritt

Trainerverwaltung als nächstes Modul umsetzen.

Ziel: Aufbau nach dem gleichen Muster wie das Spielermodul:

- Datenbankstruktur prüfen
- Admin-Übersicht erstellen
- Trainer anlegen
- Trainer bearbeiten
- Trainer aktiv/inaktiv setzen
- Bildverwaltung mit Platzhalter und Storage-Cleanup
- Mannschaftszuordnung vorbereiten
- öffentliche Traineranzeige vorbereiten
- modulare Komponentenstruktur einhalten
