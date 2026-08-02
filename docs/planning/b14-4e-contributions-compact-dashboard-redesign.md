# B14.4E Contributions Compact Dashboard Redesign

## 1. Ausgangslage

Die Contributions-Uebersicht war funktional, aber zu stark als Karten-Dashboard
gebaut. Dadurch begann die Liste zu spaet und die Seite wirkte fuer den
Arbeitsalltag eines Kassenwarts zu schwer.

## 2. Bisherige UX-Probleme

- zu viele grosse Status- und Geldkarten
- zu hoher vertikaler Platzverbrauch vor der Liste
- gequetschte Tabelleninhalte bei kleineren Desktopbreiten
- Mannschaftstexte konnten in die Detailspalte laufen
- Praesentationsstil statt kompakter Verwaltungsansicht

## 3. Neues Designprinzip

Die Seite besteht jetzt aus vier kompakten Bereichen:

1. schlanker Seitenkopf
2. gemeinsame Summary-Leiste
3. einklappbarer Filterbereich
4. responsive Beitragsliste

## 4. Seitenkopf

Der Kopf wurde zu einem flachen Toolbar-Header reduziert:

- kleineres Padding
- kompakter Titelblock
- Export- und Create-Buttons direkt daneben oder darunter
- kein Hero-Layout mehr

## 5. Summary-Leiste

Status-Schnellfilter und Geldsummen liegen jetzt in einem gemeinsamen Container.
Dadurch entfaellt die bisherige 12-Karten-Ansicht komplett.

## 6. Status-Schnellfilter

Die Statuswerte werden als kompakte Chips dargestellt:

- klickbar ueber bestehende Search-Params-Hrefs
- aktiver Zustand per Border und Hintergrund
- kein zusaetzliches `Aktiv`-Label
- auf kleinen Geraeten horizontal scrollbar nur innerhalb der Leiste

## 7. Geldsummen

Die Geldwerte erscheinen als kompakte Infosegmente innerhalb derselben Summary.
`Offen` wird visuell etwas hervorgehoben, ohne eine eigene grosse Karte zu
erzeugen.

## 8. Filter

Der Filter ist standardmaessig geschlossen und wirkt wie ein kompaktes
Disclosure-Element:

- Icon
- Titel
- aktiver Filter-Badge
- Chevron

Erst im geoeffneten Zustand erscheinen die bestehenden Felder und Aktionen.

## 9. Desktopliste

Die Desktopliste wird nur noch ab `xl` gezeigt. Dadurch wird ein Quetschen der
Spalten zwischen Tablet und kleineren Desktopbreiten vermieden. Die Tabelle
enthaelt nur:

- Spieler
- Status
- Offen
- Faelligkeit
- Saison
- Mannschaft
- Detailspalte

Fehlende Mannschaften werden als `Keine Mannschaft` angezeigt, der volle Hinweis
bleibt ueber `title` erhalten.

## 10. Mobile Karten

Unterhalb von `xl` wird statt der Tabelle eine kompakte Kartenansicht genutzt:

- Spielername
- Statusbadge
- Offener Betrag
- Faelligkeit
- Saison und Mannschaft in einer Zeile
- Chevron rechts

## 11. Responsive Breakpoints

- `xl` und groesser: Tabelle
- unter `xl`: Kartenansicht
- Statuschips umbrechen ab `sm`, scrollen darunter horizontal im eigenen Bereich
- Geldsummen: 1 Reihe mobil, 2x2 auf Tablet, 4 Spalten auf breitem Desktop

## 12. Permissions

Permissions, Export-Link, Create-Link und Schnellfilter-Hrefs wurden nicht
fachlich veraendert. Die Seite nutzt weiterhin nur serverseitig geladene Daten.

## 13. Tests

Erweitert wurden Helper-Tests fuer:

- Quick-Filter-Zielparameter
- kompakte Statuslabels
- Summary-Konfiguration
- Team-Label-Fallback
- Filter-Defaultzustand

## 14. Offene Risiken

- Ohne echte Admin-Session bleibt die visuelle Pruefung der finalen Datenlage
  offen.
- Projektweite Lintfehler ausserhalb des Contributions-Bereichs bestehen weiter.
- Der Build bleibt in dieser Umgebung von externem Font-Fetch abhaengig.

## 15. Empfohlener naechster Schritt

Die Uebersicht einmal mit Admin-Session auf den geforderten Viewports pruefen und
danach nur noch Feinjustierungen an Spaltenbreiten oder Textkuerzungen vornehmen.
