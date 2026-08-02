# B14.4 - Contributions Admin UI

## 1. Ziel

Dieser Schritt liefert die komplette Admin-Oberflaeche fuer `Vereinsbeitraege` auf Basis des bereits vorhandenen B14.3-Serverunterbaus.

## 2. Routen

- `/admin/contributions`
- `/admin/contributions/new`
- `/admin/contributions/[id]`
- `/admin/contributions/[id]/edit`
- `/admin/contributions/export`

Alle Routen pruefen serverseitig die jeweilige Permission, bevor sensible Beitragsdaten geladen oder exportiert werden.

## 3. Sidebar

- neuer Navigationseintrag `Vereinsbeitraege`
- Route: `/admin/contributions`
- Sichtbarkeit nur mit `contributions.view`
- einsortiert im Bereich `Vereinsstruktur`

## 4. Uebersicht

- Server-Route unter `src/app/admin/contributions/page.js`
- `ContributionStats`, `ContributionFilters`, `ContributionsTable`, mobile Karten und Pagination
- leere Zustaende fuer leere Datenbank, fehlende Treffer und fehlende aktuelle Saison

## 5. Kennzahlen

- Gesamtzahl
- Offen
- Teilweise bezahlt
- Bezahlt
- Gestundet
- Befreit
- Storniert
- Ueberfaellig
- Gesamtsoll
- Gesamtgezahlt
- Gesamterlassen
- Gesamtoffen

Stornierte Beitraege werden bei den monetaren Gesamtsummen nicht mehr als offene Forderungen mitgerechnet.

## 6. Filter

- Saison
- Spieler
- Mannschaftssnapshot
- Status
- Beitragstyp
- Faelligkeitsdatum
- nur ueberfaellige Beitraege
- Suchtext
- Sortierung
- Page und PageSize

Die URL-Parameter bleiben sharebar und werden fuer Pagination sowie CSV-Export wiederverwendet.

## 7. Liste

- mobile Karten plus Desktop-Tabelle
- EUR-/Datumsformatierung ueber gemeinsame Formatter
- zusaetzlicher Ueberfaellig-Badge
- stornierte Zeilen visuell abgesetzt
- keine internen Notizen oder technischen IDs in der Listenansicht

## 8. Formulare

- `ContributionForm` fuer Create und Edit
- serverseitig bereitgestellte Spieler- und Saisonoptionen
- lokale Suchhilfe fuer die Spielerauswahl
- Edit sperrt nicht freigegebene Felder wie Spieler, Saison und Beitragstyp
- `canceled` und `exempt` bleiben klar gesperrt

## 9. Detailseite

- Kopf mit Spieler, Saison, Titel, Typ und Status
- Summenbereich fuer Soll, Gezahlt, Erlassen und Offen
- Faelligkeitsbereich mit Overdue-, Deferred- und Ratenzahlungsinfos
- Sonderstatus fuer Befreiung, Stundung und Storno
- interne Notiz nur fuer Admins mit Edit-Permission sichtbar

## 10. Zahlungen

- Dialog `Zahlung erfassen`
- Betrag, Datum, Zahlungsart, Referenz und interne Notiz
- Restbetrag wird direkt eingeblendet
- nach Erfolg Refresh mit Notice ueber Query-Param

## 11. Stundung

- Dialog fuer `defer`
- Dialog-Modus fuer `resume`
- keine freie Statuswahl im Client
- Server-Service bleibt alleinige Fachquelle

## 12. Befreiung

- Dialog mit Pflichtgrund
- keine Ruecknahme der Befreiung in dieser Phase
- bestehende Zahlungen blockieren weiterhin serverseitig

## 13. Storno

- eigener Dialog fuer Payment-Storno
- eigener Dialog fuer Contribution-Storno
- beide Pfade verwenden nur die vorhandenen Server Actions
- kein Hard-Delete-Wording

## 14. CSV

- Route Handler unter `/admin/contributions/export`
- exportiert die aktuell gefilterte Ergebnismenge
- keine internen Notizen, Gruende oder technischen IDs
- CSV-Injection wird fuer `=`, `+`, `-`, `@` neutralisiert

## 15. Dashboard

- neue Beitragskachel fuer Rollen mit `contributions.view`
- Werte: offen, ueberfaellig, offener Gesamtbetrag, teilweise bezahlt
- Daten standardmaessig fuer die aktuelle Saison

## 16. Permissions

- `contributions.view` fuer Sidebar, Dashboard-Kachel, Uebersicht und Detail
- `contributions.create` fuer Create-Route
- `contributions.edit` fuer Edit-Route und interne Notizen
- Mutationsbuttons nur bei jeweiliger Fach-Permission
- `vorstand` bleibt ueber die bestehende Rechtevergabe read-only plus Export

## 17. Datenschutz

- keine Client-Supabase-Queries fuer Beitragsdaten
- keine sensiblen Finanzdaten im globalen Client-State
- keine internen Notizen in Listen oder Exporten
- keine Actor-IDs im UI

## 18. Responsive

- Desktop: Tabelle
- Mobile: Karten mit Fokus auf Spieler, Status, offen, Faelligkeit, Aktionen
- Dialoge und Formulare bleiben auf kleinen Breiten bedienbar

## 19. Tests

- neue Zieltests fuer Overview-Datenservice
- neue Zieltests fuer CSV-Builder
- neue Zieltests fuer UI-Permission-State
- bestehende B14.3-Service- und Rollenmatrix-Tests bleiben relevant

## 20. Offene Risiken

- Der Uebersichtsservice filtert nach Repository-Restriktionen und sortiert/paginiert anschliessend im Node-Prozess. Das ist fuer den aktuellen Ausbaustand konsistent, kann bei sehr grossen Datenmengen aber spaeter weiter in die Query-Ebene verlagert werden.
- Die Dashboard-Kachel nutzt verdichtete Saisonkennzahlen, zeigt aber bewusst keine Detaildaten oder Drilldown-Listen.
- Erfolgs-Notices laufen ueber Query-Parameter; falls spaeter ein zentrales Flash-Message-System eingefuehrt wird, kann dieser Pfad vereinheitlicht werden.

## 21. Empfohlener naechster Schritt

Als naechsten Ausbau wuerde ich die serverseitige Listenfilterung fuer sehr grosse Datenmengen tiefer ins Repository ziehen und danach eine explizite Drilldown-Pagination fuer CSV-nahe Reporting-Faelle ergaenzen.
