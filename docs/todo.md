# Todo

Diese Datei sammelt offene Aufgaben und technische Baustellen.

## Aktuell offen

### Spielermodul

- Datenbankfelder final mit Code abgleichen
- Service auf bestehende Spalten anpassen
- Formular auf bestehende Spalten anpassen
- Spielerkarte auf bestehende Spalten anpassen
- Übersicht auf Mannschaftszuordnung erweitern
- Bild-Upload auf `photo_url` vereinheitlichen
- Speichern testen
- Bearbeiten testen
- Aktiv/Inaktiv testen

### Datenbank

- `players` prüfen und final dokumentieren
- `teams` prüfen und final dokumentieren
- später Migrationen unter `supabase/migrations` anlegen

### Adminbereich

- QuickActions prüfen
- Sidebar prüfen
- fehlende Adminseiten als Platzhalter anlegen
- einheitliche EmptyStates erstellen

### Website

- fehlende Hauptseiten wurden als Platzhalter angelegt
- Fußball-Unterseiten fehlen noch
- Newsdetailseite prüfen
- Mannschaftsdetailseite prüfen

## Nächster konkreter Arbeitsschritt

Spielermodul vollständig auf vorhandene Datenbankspalten umstellen:

- `shirt_number` statt `jersey_number`
- `position_de` statt `position`
- `position_en` ergänzen
- `photo_url` statt `image_url`

Danach lokal testen.
