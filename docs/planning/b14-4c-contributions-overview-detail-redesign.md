# B14.4C - Contributions Uebersicht vereinfachen und Detailansicht als Hauptarbeitsbereich ausbauen

## 1. Ausgangslage

Das Contributions-Modul war fachlich funktionsfaehig, wirkte in der Administration aber noch zu dicht. Die Uebersicht zeigte zu viele Fachdetails gleichzeitig und mischte Navigation mit Mutationsaktionen.

## 2. UX-Probleme

- Die Desktop-Uebersicht war zu breit und erzeugte horizontales Scrollen.
- Das Actions-Dropdown war klein, fehleranfaellig und auf Mobilgeraeten unruhig.
- Filter und Kennzahlen verbrauchten zu viel Hoehe.
- Die Detailseite war funktional, aber noch nicht klar als Hauptarbeitsbereich priorisiert.

## 3. Neue Uebersicht

Die Route `/admin/contributions` zeigt jetzt eine kompakte Beitragsliste. Sichtbar bleiben nur die Felder, die fuer Orientierung und Priorisierung relevant sind:

- Spieler
- Status
- offen
- Faelligkeit
- Saison
- Mannschaft
- Details

Mutationsaktionen wurden vollstaendig aus der Uebersicht entfernt.

## 4. Kompakte Kennzahlen

Die Statuskennzahlen wurden von grossen Kacheln auf kompakte Schnellfilter reduziert. Jede Kennzahl bleibt klickbar und behaelt ihren aktiven Zustand anhand der bestehenden URL-Search-Params.

## 5. Geldsummen

Gesamtsoll, Gesamtgezahlt, Gesamterlassen und Gesamtoffen werden jetzt als schlanke Summary-Karten unter den Statusfiltern dargestellt. Die Summen wurden bewusst von den Statuskennzahlen getrennt.

## 6. Filter

Der Filterbereich startet auf Desktop und Mobil immer geschlossen. Im Kopf bleiben nur:

- Label `Filter`
- Titel `Beitragsliste eingrenzen`
- optionaler Badge fuer aktive Filter
- Chevron

Die frueheren Kleinttexte zur Eintragszahl und zu fehlenden Filtern wurden entfernt. Anwenden und Zuruecksetzen erscheinen nur im geoeffneten Zustand.

## 7. Beitragsliste

Die Desktop-Liste wurde so reduziert, dass sie auf ueblichen Breiten ohne fachliche Ueberladung lesbar bleibt. Mobile Karten wurden auf dieselben Orientierungsdaten verschlankt.

## 8. Klickbare Zeilen

Desktop-Zeilen und Mobile-Karten fuehren jetzt direkt auf `/admin/contributions/[id]`. Die Navigation erfolgt ueber echte `Link`-Elemente mit Hover- und Fokuszustand, nicht ueber `div onClick`.

## 9. Neue Detailseite

Die Detailseite ist jetzt der zentrale Arbeitsbereich und gliedert sich in:

- Kopfbereich mit Spieler, Titel, Typ, Mannschaft, Saison und Faelligkeit
- kompakte Betragsuebersicht
- Beitragsinformationen
- Zahlungshistorie
- Sonderstatus
- klar getrennten Aktionsbereich

## 10. Aktionen

Alle Mutationen bleiben ausschliesslich auf der Detailseite:

- Bearbeiten
- Zahlung erfassen
- Zahlung stornieren
- Stundung
- Stundung aufheben
- Befreien
- Beitrag stornieren

Die bestehende Server- und Permission-Logik bleibt unveraendert.

## 11. Permissions

- Superadmin und Kassierer behalten die freigegebenen Mutationen.
- Vorstand bleibt read-only und sieht keine Mutationsbuttons.
- Export verbleibt auf der Uebersichtsseite gemaess bestehender Berechtigungen.
- Trainer, Jugendleiter, Betreuer und Gast bleiben serverseitig ausgesperrt.

## 12. Responsive

- Desktop: kompakte tabellarische Listenanmutung ohne Actions-Spalte.
- Tablet: enge Grids fuer Kennzahlen und klare Zweispaltenbereiche.
- Mobil: klickbare Karten in der Uebersicht, gestapelte Detailbereiche und gut erreichbare Buttons.

## 13. Tests

Abgesichert wurden gezielt:

- kompakte Uebersichtsfelder und Detail-Links
- geschlossener Filter-Default und aktiver Filter-Badge
- kompakte Status- und Summenmodelle
- read-only-, exempt- und deferred-Zustaende der Detailaktionen

Zusatzlich bleiben die bestehenden Service- und Helper-Tests des Moduls Teil der gezielten Testausfuehrung.

## 14. Offene Risiken

- Ein echter manueller Admin-Session-Test war in der Terminal-Umgebung weiterhin nicht moeglich.
- Die projektweite Lint-Suite enthaelt bestehende, nicht von B14.4C verursachte Fehler.
- Der Produktionsbuild scheitert weiterhin extern am bekannten Google-Fonts-Fetch in `src/app/layout.js`.

## 15. Empfohlener naechster Schritt

Die neue Uebersicht und Detailseite mit einer echten Admin-Session im Browser gegen reale Datensaetze pruefen, insbesondere fuer Mobilbreiten, sehr lange Mannschaftsnamen und Sonderstatus-Kombinationen.

