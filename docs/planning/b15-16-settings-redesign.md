# B15.16 – Einstellungen & Systemseiten

## Umfang

Die bestehende Route `/admin/settings` wurde auf die gemeinsamen Admin-Oberflächenbausteine migriert. Erfasst sind Vereinsdaten, Kontakte, Mitgliedschaftsempfänger, Mitgliedsanfragen und statische CMS-Seiten.

## UI-Konzept

- Gemeinsamer Seitenrahmen und Header mit der vorgegebenen Beschreibung
- Bestehende Haupt- und Untertabs als semantische, mindestens 44 Pixel hohe Admin-Buttons
- Gemeinsame Empty States für leere Auswahllisten
- Bestehende Formsektionen und Eingabefelder bleiben in ihren fachlichen Gruppen
- Speichern und weitere bestehende Aktionen verwenden die gemeinsamen Action- und Button-Bausteine
- Vorhandene Löschaktionen werden ausschließlich als Gefahrenbereich gekennzeichnet
- Zweispaltige Liste-/Editor-Ansichten bleiben ab `xl`, darunter stapeln sie ohne horizontales Scrollen

## Fachlich unverändert

Queries, DTOs, Actions, Uploads, Validierung, Permissions, Scope-Auflösung, Routing und sämtliche Handler wurden nicht verändert. Insbesondere bleiben die Query-Gates und Sichtbarkeiten der Mitgliedsanfragen aus B15.5A erhalten.

## Verifikation

Die Migration wird durch einen quellennahen UI-Regressionstest abgesichert. Zusätzlich werden gezieltes ESLint, der bestehende Testlauf und der Produktions-Build ausgeführt.
