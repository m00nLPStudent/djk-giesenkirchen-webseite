# B15.9 – Migration des Mannschaftsmoduls

## Ziel
Das Admin-Mannschaftsmodul verwendet die B15.7-Primitives ohne Änderung von Datenzugriff, Fachlogik, Saisonmodell, Zuordnungen, Archivierung, Permissions oder Scopes.

## Ausgangslage und Komponenten
Eigene große Teamkarten und Detailflächen wurden durch `AdminModuleHeader`, `AdminModuleSearch`, `AdminModuleFilters`, das responsive Listenmuster, `AdminDetailLayout`, `AdminInformationSection`, kompakte Metrics, Empty States und `AdminDangerZone` ersetzt.

## Übersicht, Summary und Filter
Die bestehende serverseitige URL-Suche und der Aktivstatusfilter bleiben erhalten. Suche liegt im Header; der Statusfilter ist standardmäßig geschlossen. Es gab keine aktive Gesamt-Summary auf der Seite, daher wurde keine neue Berechnung eingeführt.

## Desktopliste und Mobile-Karten
Ab `xl` zeigt die Tabelle Name, Bereich, Saison, Status, Spieler-/Trainerzahl, Beitragskurzfassung und Chevron. Darunter sind vollständig klickbare Karten aktiv. Eine Pagination existierte nicht und wurde nicht ergänzt.

## Beitragszusammenfassung
Vorhandene Werte für offen, überfällig und Gesamtbetrag erscheinen inline. Die Detailseite zeigt alle bereits berechneten Teamwerte als kompakte Metrics; Statusberechnung und Queries bleiben unverändert.

## Detailseite
Der Header enthält Zurück, Name, Status, Bereich/Saison und ausschließlich Bearbeiten. Mannschaftsinformationen verwenden gemeinsame Zeilen. Der bestehende Spielerbereich ist als Desktopliste/Mobile-Karten mit Avatar, Position, Status, Beitrag und offenem Betrag umgesetzt.

## Trainerbereich und Trainingszeiten
Die vorhandene Detailquery liefert nur die Zahl aktiver Trainerzuordnungen; deshalb wird ausschließlich diese Zahl dargestellt. Es werden keine Trainerdetails erfunden. Saisonale Trainingszeiten werden von der Detailquery nicht geliefert und deshalb nicht dargestellt; Legacy-Fallbacks wurden nicht reaktiviert.

## Gefahrenbereich
Archivieren erscheint ausschließlich unten. Action und Berechtigungsprüfung bleiben unverändert. Der Hinweis beschreibt Inaktivsetzung, Ende aktiver Zuordnungen, Erhalt von Personen/Historie/Beiträgen/Zahlungen und fehlende automatische Wiederzuordnung.

## Formulare
Create und Edit verwenden gemeinsame Seiten-, Header- und Zurücklink-Hüllen. Felder, Picker, Upload, Validierung, Submit, Saison- und Assignmentlogik bleiben unverändert.

## Accessibility und Responsive
Semantische Links/Buttons, Fokuszustände, Disclosure-ARIA und 44-Pixel-Touchziele bleiben erhalten. Karten gelten unter `xl`; breite Tabellen erscheinen erst ab `xl`. Header und Informationszeilen stapeln mobil.

## Tests, Risiken und nächster Schritt
Struktur- und Regressionstests sichern Übersicht, Detail, Archivierung und Formhüllen. Ein visueller Real-Daten-Test benötigt eine authentifizierte Sitzung. Als nächstes empfiehlt sich gemäß Matrix die Migration des News-Moduls.
