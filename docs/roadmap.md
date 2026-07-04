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

### In Bearbeitung / nächster Fokus

- Navigation und Footer sauber finalisieren
- News-Modul finalisieren
- News-Downloads / Dokumentanhänge für öffentliche News und Adminbereich ergänzen

### Offen

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

### Phase 7: Navigation und Footer finalisieren

- [ ] Hauptnavigation vollständig mit echten Zielseiten verlinken
- [ ] Footer-Platzhalter (`#`) durch echte Routen ersetzen
- [ ] fehlende öffentliche Seiten als Grundseiten anlegen
- [ ] Kontakt, Impressum und Datenschutz erreichbar machen
- [ ] Mobile Navigation prüfen und bei Bedarf ergänzen
- [ ] Hover-, Fokus- und aktive Zustände einheitlich im Vereinsrot umsetzen
- [ ] Responsive Verhalten von Header, Logo, Navigation und Footer testen

### Phase 8: News-Modul finalisieren

- [x] News auf Startseite anzeigen
- [x] News-Übersicht mit Suche und Pagination anzeigen
- [x] News-Detailseite anzeigen
- [ ] News-Datenstruktur final prüfen
- [ ] Admin-Newsformular final prüfen und bereinigen
- [ ] News-Kategorien finalisieren
- [ ] Veröffentlichungsdatum, Entwurf und Sichtbarkeit final testen
- [ ] Newsdetailseite optisch finalisieren
- [ ] SEO-Metadaten für News ergänzen
- [ ] News-Downloads / Dokumentanhänge ergänzen

#### News-Downloads / Dokumentanhänge

Ziel: Einer News sollen ein oder mehrere Dokumente angehangen werden können. Beispiel: Eine News zur Jahreshauptversammlung enthält unten einen Downloadbereich mit dem Linktext „Offizielle Einladung herunterladen“.

Geplante Umsetzung:

- [ ] Datenbanktabelle für News-Dokumente anlegen, z. B. `news_documents`
- [ ] Felder vorsehen: `id`, `news_id`, `file_url`, `file_path`, `file_name`, `display_name_de`, `description_de`, `mime_type`, `file_size`, `sort_order`, `is_public`, `created_at`, `updated_at`
- [ ] Supabase-Storage-Bucket oder vorhandenen Medien-Bucket für News-Dokumente festlegen
- [ ] Adminbereich News erstellen/bearbeiten um Reiter „Dokumente“ erweitern
- [ ] PDF/Dokument hochladen können
- [ ] automatisch erkannten Dateinamen anzeigen
- [ ] frei wählbaren Anzeigenamen pro Datei pflegen können, z. B. „Jahreshauptversammlung 2026“ statt technischem Dateinamen
- [ ] optionale Kurzbeschreibung pro Dokument pflegen können
- [ ] Reihenfolge der Dokumente pflegen können
- [ ] Dokument löschen und dabei Storage-Cleanup berücksichtigen
- [ ] öffentliche News-Detailseite um Downloadbereich erweitern
- [ ] Downloadbereich nur anzeigen, wenn öffentliche Dokumente vorhanden sind
- [ ] Downloadlink gut sichtbar gestalten, z. B. „Hier die offizielle Einladung downloaden“

### Phase 9: Weitere Adminmodule

- [ ] Vorstand
- [ ] Sponsoren
- [x] Termine
- [x] Wiederkehrende Events
- [x] Event-Dokumente
- [x] Kalenderexport für echte Events
- [x] Virtuelle Trainingszeiten über eigene Runtime-Logik
- [x] Admin-Verwaltung für `team_training_times`
- [x] Admin-Verwaltung für `team_training_exceptions`
- [ ] Admin-Verwaltung für `club_closure_periods`
- [ ] Turniere
- [ ] Medienverwaltung
- [ ] Rollen- und Rechtesystem
- [ ] Beitragsstatus

### Phase 10: Öffentliche Webseite ausbauen

- [x] Fußballbereich Grundstruktur
- [x] Mannschaftsdetailseiten
- [x] Trainerprofilseiten
- [x] Termine-Landingpage
- [x] Trainingstermine als eigene Route
- [x] Allgemeine Termine als eigene Route
- [x] Event-Detailseiten mit Wiederholung, Maps und Dokumenten
- [x] Virtuelle Trainings-Detailseite
- [ ] Kontakt
- [ ] Tischtennis
- [ ] Damen-Gymnastik
- [ ] Sponsorenbereich

### Phase 11: Abschluss / Deployment

- [ ] Responsive Design gesamter Website prüfen
- [ ] SEO-Grundlagen prüfen
- [ ] Performance prüfen
- [ ] Deployment vorbereiten
- [ ] Server / Domain einrichten
- [ ] Live-Test mit Supabase und Storage
- [ ] football.de Live-Test durchführen

## Aktueller nächster Fokus

Als nächstes werden Navigation/Footer-Feinschliff, restliche Doku-Aktualisierung und weitere interne Struktur-Refactors fortgeführt. Offene fachliche Punkte im Termine-Bereich sind vor allem `club_closure_periods`-Admin, virtuelle Trainings-Exports und spätere Bereinigung der Legacy-Trainingsfelder.

## Regel

Keine größere Änderung ohne Abgleich zwischen Datenbank, Service und UI.
