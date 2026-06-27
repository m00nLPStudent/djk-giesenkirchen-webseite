# Roadmap

Diese Roadmap beschreibt die geplante Entwicklung der Vereinsplattform der DJK/VfL Giesenkirchen 05/09 e.V.

## Ziel

Aufbau einer modernen Vereinswebseite mit öffentlichem Websitebereich und einem modularen Admin-CMS.

## Grundprinzip

Jedes Modul besteht aus drei Ebenen:

1. Datenbank
2. Service-Logik
3. UI / Komponenten

Es wird immer erst geprüft, welche Datenbankstruktur vorhanden ist. Danach werden Services und anschließend die UI angepasst.

## Aktuelle Hauptmodule

- Dashboard
- News
- Mannschaften
- Spieler
- Trainer
- Medien
- Termine
- Turniere
- Einstellungen

## Nächste Schritte

### Phase 1: Projektbasis stabilisieren

- [x] Projektstruktur dokumentieren
- [x] Datenbankstandard festlegen
- [x] Coding-Regeln festlegen
- [x] offene technische Baustellen sammeln

### Phase 2: Spielermodul fertigstellen

- [x] Datenbankstruktur finalisieren
- [x] Admin-Übersicht bereinigen
- [x] Spieler anlegen
- [x] Spieler bearbeiten
- [x] Spieler deaktivieren
- [x] Bild-Upload stabilisieren
- [x] Mannschaftszuordnung stabilisieren
- [x] Spielerprofilseite erstellen
- [x] Mannschafts-Kaderansicht erstellen
- [x] Dashboard-Statistiken erstellen
- [x] Filter- und Sortiersystem erstellen
- [x] Code modularisieren

### Phase 3: Mannschaftsseiten erweitern

- [x] Spieler pro Mannschaft anzeigen
- [ ] Trainer pro Mannschaft anzeigen
- [ ] öffentliche Mannschaftsdetailseiten weiter ausbauen

### Phase 4: Weitere Adminmodule

- [ ] Trainer
- [ ] Vorstand
- [ ] Sponsoren
- [ ] Termine
- [ ] Turniere
- [ ] Medienverwaltung

### Phase 5: Öffentliche Webseite ausbauen

- Fußballbereich
- Tischtennis
- Damen-Gymnastik
- Kontakt
- Termine
- Newsdetailseiten

## Aktueller nächster Fokus

Trainerverwaltung nach dem Muster des abgeschlossenen Spielermoduls aufbauen.

## Regel

Keine größere Änderung ohne Abgleich zwischen Datenbank, Service und UI.
