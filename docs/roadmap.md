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
- [x] Spieler vollständig löschen
- [x] Bild-Upload stabilisieren
- [x] Platzhalterbild einbauen
- [x] Storage-Cleanup beim Bildwechsel/Löschen einbauen
- [x] Mannschaftszuordnung stabilisieren
- [x] Spielerprofilseite erstellen
- [x] Mannschafts-Kaderansicht erstellen
- [x] Dashboard-Statistiken erstellen
- [x] Nationalitätenübersicht erstellen
- [x] Filter- und Sortiersystem erstellen
- [x] Code modularisieren
- [x] Gemeinsame Admin-Bausteine nutzen

### Phase 3: Trainermodul fertigstellen

- [x] Datenbankstruktur mit Code abgleichen
- [x] Admin-Übersicht erstellen
- [x] Trainer anlegen
- [x] Trainer bearbeiten
- [x] Trainer aktiv/inaktiv setzen
- [x] Trainer vollständig löschen
- [x] Bildverwaltung mit Platzhalter und Storage-Cleanup einbauen
- [x] Mannschaftszuordnung stabilisieren
- [x] öffentliche Trainerprofilseite erstellen
- [x] Trainer-Statistiken erstellen
- [x] Trainer nach Funktion filtern
- [x] Mannschaftsübersicht in Trainerverwaltung erstellen
- [x] Code modularisieren
- [x] Gemeinsame Admin-Bausteine nutzen

### Phase 4: Gemeinsame Admin-Grundlage

- [x] Gemeinsame FormFields
- [x] Gemeinsame Spezialfelder für E-Mail, Telefon und Nationalität
- [x] Gemeinsame Settings-Felder
- [x] Gemeinsame Badge- und Status-Komponenten
- [x] Gemeinsame Card-Komponenten
- [x] Gemeinsame Statistik-Komponenten
- [x] Gemeinsame Upload-Komponente
- [x] Gemeinsame Hooks für Formulare und Bilder
- [x] Gemeinsame Löschlogik
- [x] Gemeinsames Repository-Grundgerüst
- [x] Gemeinsame Listen-, Such- und Filterhelfer
- [x] Gemeinsame Profil-Detail-Komponente

### Phase 5: Mannschaftsseiten erweitern

- [x] Spieler pro Mannschaft anzeigen
- [ ] Trainer pro Mannschaft anzeigen
- [ ] öffentliche Mannschaftsdetailseiten weiter ausbauen
- [ ] Trainer- und Betreuerbereich auf Mannschaftsseiten integrieren

### Phase 6: Weitere Adminmodule

- [ ] Vorstand
- [ ] Sponsoren
- [ ] Termine
- [ ] Turniere
- [ ] Medienverwaltung
- [ ] Rollen- und Rechtesystem
- [ ] Beitragsstatus

### Phase 7: Öffentliche Webseite ausbauen

- Fußballbereich
- Tischtennis
- Damen-Gymnastik
- Kontakt
- Termine
- Newsdetailseiten

## Aktueller nächster Fokus

Mannschaftsseiten weiter ausbauen und dort Spieler, Trainer und Betreuer sauber zusammenführen.

## Regel

Keine größere Änderung ohne Abgleich zwischen Datenbank, Service und UI.
