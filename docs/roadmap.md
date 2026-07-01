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
- Trainer / Betreuer
- Medien
- Termine
- Turniere
- Einstellungen

## Modulstatus

### Abgeschlossen

- Projektbasis
- Gemeinsame Admin-Grundlage
- Spielermodul
- Trainermodul
- Mannschaftsmodul inkl. Saisonlogik

### Technisch vorbereitet, aber pausiert

- fussball.de Widgets für Spielplan und Tabelle

Grund: Die finale Darstellung und Domain-Freigabe können erst sauber getestet werden, wenn die Website auf dem Server beziehungsweise auf der finalen Domain läuft.

### Offen

- News-Modul finalisieren
- Termine / Kalender
- Sponsoren
- Vorstand
- Medienverwaltung
- Rollen- und Rechtesystem
- Responsive Feinschliff für die komplette Website
- Deployment / Server / Domain

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
- [x] Spielerformular in Reiterstruktur überführen
- [x] Gemeinsame Tab-Navigation nutzen

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
- [x] Trainerformular in Reiterstruktur überführen
- [x] Gemeinsame Tab-Navigation nutzen
- [x] Telefonnummern zentral lesbar formatieren

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
- [x] Gemeinsame Tab-Navigation für Adminformulare
- [x] Gemeinsame Telefonnummer-Helfer

### Phase 5: Mannschaftsmodul fertigstellen

- [x] Mannschaften anlegen und bearbeiten
- [x] Mannschaftsübersicht im Adminbereich
- [x] Öffentliche Mannschaftsdetailseite
- [x] Mannschaftsbild / Hero-Bereich
- [x] Beschreibung unter Mannschaftsbild anzeigen
- [x] Trainingsinformationen als Standard-Reiter anzeigen
- [x] Spieler pro Mannschaft anzeigen
- [x] Trainer und Betreuer pro Mannschaft anzeigen
- [x] Kontaktbereich pro Mannschaft anzeigen
- [x] Spielbetrieb als eigener Reiter
- [x] fussball.de Spielplan als aufklappbare Kachel
- [x] fussball.de Tabelle als aufklappbare Kachel
- [x] responsive Anordnung der Spielbetrieb-Kacheln
- [x] Saison-Tabelle `seasons` eingeführt
- [x] Saison-Versionen über `team_seasons` eingeführt
- [x] Spieler saisonabhängig über `player_team_seasons` zuordnen
- [x] Trainer saisonabhängig über `coach_team_seasons` zuordnen
- [x] Adminformular mit Reitern aufbauen
- [x] Im Admin auswählen, welche Saison bearbeitet wird
- [x] Im Admin auswählen, welche Saison öffentlich angezeigt wird
- [x] Öffentliche Mannschaftsseite zeigt nur aktuelle Admin-Saison
- [x] Admin-Mannschaftsübersicht zeigt aktuelle öffentliche Saison
- [x] Code modularisieren und gemeinsame Komponenten nutzen

### Phase 6: fussball.de Integration finalisieren

- [x] Widget-IDs im Admin speichern
- [x] Spielplan-Widget technisch einbinden
- [x] Tabellen-Widget technisch einbinden
- [x] Widgets in aufklappbaren Kacheln anzeigen
- [ ] Website auf Server / finale Domain bringen
- [ ] Domain in fussball.de Widget-Konfiguration prüfen
- [ ] Widget-Farben im fussball.de Generator final einstellen
- [ ] Darstellung auf echter Domain testen
- [ ] Responsive Feinschliff der Widgets

### Phase 7: Weitere Adminmodule

- [ ] Vorstand
- [ ] Sponsoren
- [ ] Termine
- [ ] Turniere
- [ ] Medienverwaltung
- [ ] Rollen- und Rechtesystem
- [ ] Beitragsstatus

### Phase 8: Öffentliche Webseite ausbauen

- [x] Fußballbereich Grundstruktur
- [x] Mannschaftsdetailseiten
- [x] Trainerprofilseiten
- [ ] Newsdetailseiten
- [ ] Termine
- [ ] Kontakt
- [ ] Tischtennis
- [ ] Damen-Gymnastik
- [ ] Sponsorenbereich

### Phase 9: Abschluss / Deployment

- [ ] Responsive Design gesamter Website prüfen
- [ ] SEO-Grundlagen prüfen
- [ ] Performance prüfen
- [ ] Deployment vorbereiten
- [ ] Server / Domain einrichten
- [ ] Live-Test mit Supabase und Storage
- [ ] football.de Live-Test durchführen

## Aktueller nächster Fokus

Das Mannschaftsmodul ist abgeschlossen. Als nächstes sollte mit einem neuen Hauptmodul weitergemacht werden, sinnvollerweise News, Termine oder Sponsoren.

## Regel

Keine größere Änderung ohne Abgleich zwischen Datenbank, Service und UI.
