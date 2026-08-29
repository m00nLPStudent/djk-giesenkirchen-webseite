# Responsive Design (Mobile-First)

## Verbindlicher Stand

Die öffentliche Website ist mobile-first umgesetzt. Der reale Desktop- und Smartphone-Review von B15.24B einschließlich 360–430 Pixel ist bestanden. B15.24C dokumentiert diesen Stand als As-built-Vertrag; es findet kein erneutes Redesign statt.

## Zielbreiten und Breakpoints

- 360, 390, 412/414 und 430 Pixel: kleine Smartphones
- `sm` ab 640 Pixel: große Smartphones und kleine Tablets
- `md` ab 768 Pixel: Tablet
- `lg` ab 1024 Pixel: Laptop und zweispaltige Inhaltslayouts, sofern fachlich passend
- `xl` ab 1280 Pixel: Desktopnavigation und zweistufiger Header
- breiter Desktop: bestehende `max-w-7xl`- beziehungsweise 90-rem-Verträge

## Header und Navigation

- Unter `xl`: Logo, bei ausreichender Breite kompaktes Branding, dynamische Instagram-/Facebook-Serviceicons, permanenter Anfahrt-Pin und separater 44-Pixel-Hamburger.
- Bei 360 Pixel bleibt das Branding reduziert; die Bedienflächen bleiben mindestens 40 Pixel groß.
- Ab `xl`: Desktop-Servicebereich und schwebende Disclosure-Navigation.
- Das Mobile-Panel enthält dieselbe fachliche Hauptstruktur und touchfreundliche Untermenü-Akkordeons.

## Öffentliche Seitengeometrie

- `PublicPageShell` ist der Standard für normale Übersichten: `max-w-7xl`, `px-4`, ab `sm` `px-6`, mobiler Abstand unter dem Header und größerer Abstand ab `md`.
- Das Website-Root liefert den gemeinsamen dunklen Hintergrund und den zentralen Abstand unter Header/Floating Navigation.
- Fachliche Detail-, Formular-, Personen-, News- und Teamlayouts dürfen ihre eigene Struktur behalten, müssen aber innerhalb derselben öffentlichen Designfamilie bleiben.

## Heroes, Karten und Grids

- `PublicPageHero` skaliert Eyebrow, H1 und Einleitung responsiv und schützt lange Inhalte mit Wortumbruch.
- `PublicCard` ist die Standardkarte für öffentliche Übersichten.
- Smartphone: grundsätzlich einspaltig; Tablet und Desktop erweitern nur bei ausreichendem Platz.
- Breitekritische Grid-Kinder verwenden `min-w-0`; die Startseite nutzt mobil explizit `minmax(0,1fr)` und ab `lg` News plus Trainingstermin-Sidebar.
- Tabellen und Tabs scrollen nur in ihren eigenen Wrappern; die Seite selbst erhält keinen horizontalen Scrollbereich.

## Bereichsspezifischer Stand

- Featured-NewsCards besitzen reduzierte mobile Bildhöhe, Abstände und Typografie; die Desktopwerte kehren ab `sm`/`md` zurück.
- Trainingstermine folgen mobil unter den News und stehen ab `lg` daneben.
- Footer-Spalten brechen von einer kompakten mobilen Folge in mehrspaltige Tablet-/Desktop-Grids um.
- Membership-Formulare und öffentliche Karten bleiben mobil einspaltig und touchfreundlich.
- News-Inline-Floats werden unter 640 Pixel auf volle Breite zurückgesetzt.

## Overflow- und Qualitätsvertrag

- `body { overflow-x: hidden; }` ist nur die letzte Schutzschicht; Komponenten müssen selbst durch begrenzte Breiten, `min-w-0` und Umbruchregeln stabil sein.
- Keine horizontalen Überbreiten bei 360, 390, 412/414 und 430 Pixel.
- Fokuszustände, Touchziele und lesbare Zeilenumbrüche bleiben bei jeder Responsive-Änderung erhalten.
