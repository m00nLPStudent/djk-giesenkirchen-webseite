# B14.4G Contribution Detail Reference Redesign

## 1. Ausgangslage

Die Detailseite unter `/admin/contributions/[id]` war funktional bereits
vorhanden, wich aber im Layout sichtbar vom Referenzbild ab. Vor allem die
Zahlungshistorie war zu schmal, Aktionsbereiche waren verteilt und einzelne
Status- oder Aktionsinhalte gerieten an engen Breakpoints an ihre Grenzen.

## 2. Referenzlayout

Die Seite wurde innerhalb des bestehenden Admin-Contentbereichs auf das
verbindliche Zielbild ausgerichtet:

- kompakter Kopf mit Ruecklink, Spielername, Statusbadge und Metazeile
- Bearbeiten und Zahlung erfassen oben rechts
- gemeinsame Betragsleiste direkt unter dem Kopf
- linke Informationsspalte, breite rechte Arbeitsspalte
- Zahlungshistorie ueber Aktionen und Status

## 3. Lokaler Seitencontainer

Der globale Admin-Shell bleibt unveraendert. Fuer diese Detailseite wird lokal
`max-w-screen-2xl` genutzt, damit die verfuegbare Breite fuer das 35/65-Layout
besser ausgenutzt wird.

## 4. Detailkopf

Der Kopfbereich enthaelt jetzt:

- `Zurueck zu Vereinsbeitraegen`
- Spielername
- voll ausgeschriebenes Statusbadge direkt daneben
- Metazeile `Beitragstitel · Saison · Mannschaft`
- rechte Buttongruppe mit `Bearbeiten` und `Zahlung erfassen`

Die Button-Sichtbarkeit bleibt komplett an den bestehenden Permission-Checks
gebunden.

## 5. Betragsleiste

Die Betragswerte `Soll`, `Gezahlt`, `Erlassen` und `Offen` laufen in einem
gemeinsamen Container mit Trennlinien. `Offen` bleibt leicht hervorgehoben.
Auf kleineren Breiten bricht die Leiste in eine kompakte Mehrspaltenansicht um.

## 6. Hauptgrid

Ab `xl` nutzt die Detailseite lokal:

- links `minmax(18rem, 0.8fr)`
- rechts `minmax(0, 1.5fr)`

Damit bleibt die rechte Spalte deutlich breiter und die Zahlungshistorie bekommt
genug Platz. Unterhalb davon faellt die Seite auf eine einspaltige Anordnung
zurueck.

## 7. Beitragsinformationen

Die Beitragsinformationen stehen jetzt in einer gemeinsamen kompakten
Definitionsliste statt in vielen Einzelkarten. Labels und Werte sind pro Zeile
gegliedert, lange Inhalte brechen sauber um und fehlende Werte bleiben als `-`
sichtbar.

## 8. Zahlungshistorie

Die Desktopdarstellung wechselt auf sechs echte Spalten:

- Datum
- Betrag
- Zahlungsmethode
- Referenz
- Status
- Aktion

Die Umschaltung zur Kartenansicht erfolgt bereits unter `xl`, damit die Tabelle
nicht gequetscht wird. Referenzen werden separat angezeigt und bei Bedarf mit
`title` abgesichert.

## 9. Zahlungsstorno

Gebuchte Zahlungen zeigen weiterhin die bestehende Stornoaktion. Stornierte
Zahlungen erhalten stattdessen nur noch die klare Statusausgabe
`Bereits storniert`. Der vorhandene `CancelPaymentDialog` bleibt unveraendert.

## 10. Aktionen und Status

Unterhalb der Zahlungshistorie gibt es jetzt einen gemeinsamen Container
`Aktionen und Status`.

Bei bearbeitbaren Beitraegen werden dort die drei Referenzbereiche gezeigt:

- Stundung
- Befreiung
- Gefahrenbereich

Read-only Nutzer sehen keine leeren Aktionsbereiche. Wenn nur Sonderstatus
vorliegen, werden ausschliesslich die relevanten Statussektionen angezeigt.
Stornierte Beitraege zeigen nur noch ihren Stornozustand.

## 11. Permissions

Nicht veraendert wurden:

- Server-Guards
- Rollenpruefungen
- Permission-Keys
- bestehende Dialoge und Server Actions

Vorstand mit reinem View-Recht bleibt read-only und sieht keine
Mutationsbuttons.

## 12. Responsive

- `xl` und groesser: 2-Spalten-Detailseite mit Desktop-Paymentgrid
- unter `xl`: einspaltige Detailseite mit Payment-Karten
- Money-Bar bricht auf 2er- oder 1er-Raster um
- Aktionsbereiche stapeln sich vertikal, wenn keine Desktopbreite verfuegbar ist

## 13. Tests

Erweitert wurden vor allem die Helper-Tests fuer:

- Payment-Method-Labels
- neue Metazeile
- neue Detailfeld-Labels
- Sonderstatus mit Erlassbetrag und Stornohinweis

Zusatzlich wurden gezielte Lint- und Build-Pruefungen fuer die geaenderten
Dateien vorgesehen.

## 14. Offene Risiken

- Ein echter visueller Browser-Test mit Admin-Session kann in dieser Umgebung
  weiterhin nur eingeschraenkt nachvollzogen werden.
- Projektweite Lintfehler ausserhalb des Contributions-Bereichs bleiben
  bestehen.
- Ein produktiver Build kann weiterhin am externen Google-Font-Fetch scheitern.

## 15. Empfohlener naechster Schritt

Die neue Detailseite mit realen Beitragsdaten und mindestens einem read-only
Vorstandskonto visuell pruefen, besonders fuer lange Referenzen, stornierte
Zahlungen und aktive Sonderstatus.
