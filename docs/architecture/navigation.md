# Navigation

## Ziel

Konsistente Hauptnavigation für Desktop und Mobile mit identischer Linkstruktur.

## Hauptpunkte

- Startseite (`/`)
- Verein (`/verein`)
- Fußball (`/fussball`)
- News (`/news`)
- Termine (`/termine`)
- Mitglied werden (`/mitglied-werden`)
- Kontakt (`/kontakt`)

## Untermenüs

- Verein
  - Tischtennis (`/tischtennis`)
  - Damen-Gymnastik (`/damen-gymnastik`)
- Fußball
  - Mannschaften
  - Abteilung
  - Sponsoren
  - Turniere / Events
  - Vereinsgeschichte
- News
  - Aktuelle Meldungen
  - News Übersicht
- Termine
  - Übersicht
  - Trainingstermine
  - Allgemeine Termine

## Responsive Verhalten

- `md` und größer: Desktop-Navigation mit Dropdowns
- unter `md`: Burger-Button mit Mobile-Panel
- Mobile-Panel enthält alle Hauptpunkte

## Komponenten

- `Header`
- `Navigation`
- `NavigationItem`
- `DropdownMenu`

## Qualitätsanforderungen

- keine Weiterleitung von Verein auf Startseite
- Header/Burger auf allen Website-Routen sichtbar
- keine horizontale Navigation-Overflow-Probleme auf Smartphone-Breiten