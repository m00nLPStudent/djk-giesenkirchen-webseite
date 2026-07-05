# Responsive Design (Mobile-First)

## Ansatz

Die öffentliche Website ist mobile-first umgesetzt. Basisstyles gelten für Smartphone, Erweiterungen erfolgen über Breakpoints.

## Zielbreiten

- 360 px
- 375 px
- 390 px
- 414 px
- 768 px
- 1024 px
- Desktop > 1024 px

## Breakpoint-Logik

- Default: Smartphone
- `sm`: größere Smartphones / kleine Tablets
- `md`: Tablet (inkl. Navigation-Wechsel auf Desktop-Menü)
- `lg`: großer Tablet-/Laptopbereich
- `xl`: breiter Desktop

## Verhalten nach Bereichen

### Header / Burger-Menü / Navigation

- Smartphone: Logo links, kompakte Vereinszeilen, Burger rechts
- Mobile-Panel mit allen Hauptlinks
- ab `md`: horizontale Desktop-Navigation mit Dropdowns

### Footer

- Smartphone: Spalten untereinander
- Tablet/Desktop: mehrspaltiges Grid

### Hero-Bereiche

- Headlines skalieren über Breakpoints
- `break-words`/`min-w-0` gegen horizontales Auslaufen
- reduzierte Padding-/Margin-Werte auf kleinen Breiten

### Karten und Grids

- Smartphone: einspaltig
- Tablet: typischerweise 2 Spalten
- Desktop: 3+ Spalten je Modul
- Karteninhalte sind auf `min-w-0` und Wortumbruch abgesichert

### Teamseiten

- Mobile: keine überlappenden Info-Kacheln
- Tabs horizontal scrollbar innerhalb des Tabs-Containers
- Tabellen nur innerhalb eigener Wrapper horizontal scrollbar
- Seite selbst ohne horizontales Scrollen

### News

- Featured/Secondary-Karten mit abgestuften Bildhöhen
- Headlines/Teaser brechen sauber um

### Sponsoren

- Überschriften responsive skaliert
- Sponsor-Karten mobil einspaltig
- Bannerhöhen responsiv reduziert

### Vereinsseiten / Kontakt / Mitglied werden

- mobile-first Spacing und Typografie
- Form- und Kartenlayouts auf kleinen Breiten einspaltig

## Globaler Overflow-Schutz

- `body { overflow-x: hidden; }`
- breitekritische Elemente mit `min-w-0` und Umbruchregeln

## Ergebnis

Die öffentliche Website verhält sich auf 360-414 px stabil ohne horizontales Seiten-Scrolling und skaliert konsistent auf 768 px, 1024 px und Desktop.