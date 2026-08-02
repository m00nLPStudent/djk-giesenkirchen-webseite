# B14.4D Contributions Stats Redesign

## 1. Ausgangslage

Die Kennzahlen im Bereich `/admin/contributions` waren nach der Verkleinerung der
Kacheln zu eng geworden. Lange Labels wie `Teilweise bezahlt`,
`Ueberfaellig` und `Gesamterlassen` wurden in einer starren 8-Spalten-Reihe
zusammengedrueckt.

## 2. Root Cause der gequetschten Darstellung

Die Hauptursache war nicht der Seitencontainer, sondern die Kombination aus:

- fester `xl:grid-cols-8`-Anordnung fuer alle Statuskarten
- sehr kompakter Innenflaeche pro Karte
- starkem Uppercase-Tracking in den Labels
- Aktiv-Hinweis direkt neben dem Zahlenwert

Dadurch wurde horizontale Breite fuer Typografie und Badge verbraucht, obwohl
mehr vertikaler Raum die bessere Loesung war.

## 3. Neues Grid

Die Statuskarten verwenden jetzt ein responsives Grid mit sinnvoller
Mindestbreite und klaren Breakpoints:

- klein: `auto-fit` mit `minmax(min(100%, 10rem), 1fr)`
- Tablet: 2 Spalten
- Desktop: 4 Spalten

Die Geldkarten verwenden:

- klein: `auto-fit` mit `minmax(min(100%, 10rem), 1fr)`
- Tablet: 2 Spalten
- breiter Desktop: 4 Spalten

## 4. Statuskarten

Die Statuskarten wurden neu gegliedert:

- Icon oben links
- Label darunter mit sauberem Zeilenumbruch
- Wert deutlich groesser darunter
- Aktiv-Badge absolut oben rechts

Die Schnellfilter-Funktion und die bestehenden Hrefs bleiben unveraendert.

## 5. Geldkarten

Die Geldsummen folgen nun derselben Kartenlogik wie die Statuskarten:

- eigenes Icon
- lesbares Label ohne harte Einzeilen-Erzwingung
- Betrag getrennt vom Label
- gleichmaessige Kartenhoehe

## 6. Typografie

Die Labels wurden von stark getrackten Mikro-Uppercase-Zeilen auf kompaktere,
normal lesbare Kleintext-Typografie umgestellt. Lange Begriffe duerfen umbrechen
und werden nicht mehr kuenstlich verkuerzt.

## 7. Aktiver Zustand

Der aktive Schnellfilter wird ueber Border, Hintergrund und ein kleines Badge
signalisiert. Das Badge ist absolut positioniert und veraendert das Layout der
Zahl nicht.

## 8. Responsive Verhalten

Das neue Raster verhindert zu schmale Karten auf ueblichen Breiten. Besonders
lange Labels koennen auf zwei Zeilen umbrechen, ohne aus der Karte zu laufen
oder andere Inhalte zu ueberlagern.

## 9. Tests

Ergaenzt beziehungsweise abgesichert wurden Helper-Tests fuer:

- alle acht Statuslabels
- alle vier Geldlabels
- unveraenderte Quick-Filter-Hrefs
- voller Labeltext fuer `Teilweise bezahlt` und `Ueberfaellig`

## 10. Offene Risiken

- Ohne visuellen Browser-Check bleibt die exakte Wirkung der Typografie auf
  einzelnen Viewports ein Restrisiko.
- Projektweite Lint- oder Build-Probleme ausserhalb des Stats-Bereichs koennen
  die Endvalidierung beeinflussen.
