# Öffentliche Navigation

## Ziel und bestätigter Stand

Die Navigation bildet den Gesamtverein und seine vier gleichrangigen Abteilungen konsistent auf Desktop und Mobilgeräten ab. Desktop-Disclosure, Mobile-Akkordeons, Active States, Tastaturbedienung und der reale Responsive-Review sind in B15.24B bestätigt.

## Hauptstruktur

- Startseite (`/`)
- Verein (`/verein`) mit News, allgemeinen Vereinsterminen, Vereinsgeschichte und Vorstand
- Fußball (`/fussball`) mit Mannschaften, Abteilung, Trainer/Vorstand, Sponsoren sowie Turnieren & Events
- Tischtennis (`/tischtennis`) mit Mannschaften, Trainingszeiten, Spielplan/Tabelle und Vorstand
- Behindertensport (`/behindertensport`)
- Damen-Gymnastik (`/damen-gymnastik`)
- Kontakt (`/kontakt`)
- Mitglied werden (`/mitglied-werden`) als hervorgehobener Primary CTA

News verwendet kanonisch `/news/uebersicht`. Allgemeine Vereinstermine verwenden `/termine/allgemein`; Mannschaftstrainings liegen unter `/termine/training`. Tischtennis-Trainingszeiten verwenden `/tischtennis/trainingszeiten`. Bestehende Legacy-/Übersichtsrouten bleiben nur dort erhalten, wo die Anwendung ausdrücklich kompatibel weiterleitet.

## Desktop

- Ab `xl` erscheint die schwebende Hauptnavigation unterhalb des Brandingbereichs.
- Untermenüs öffnen per Hover, Klick und Fokus und schließen über Auswahl, Außeninteraktion oder Escape.
- Haupt- und Unterziele besitzen konsistente Active-, Hover- und Focus-States.
- Der Desktop-Servicebereich zeigt dynamisch konfigurierte Social Links sowie Anfahrt und allgemeine Termine.

## Mobile und Tablet

- Unter `xl` bleibt der Hamburger aktiv.
- Das Mobile-Panel stellt alle Hauptbereiche und Unterseiten über touchfreundliche Akkordeons bereit.
- Instagram und Facebook erscheinen nur bei gültiger zentraler Konfiguration; der Anfahrt-Pin führt immer nach `/anfahrt`.
- Termine sind kein zusätzliches mobiles Serviceicon, da sie über die Navigation erreichbar sind.
- Serviceicons verwenden 40-Pixel-Touchflächen; der separate Hamburger verwendet 44 Pixel.

## Aktive Komponenten

- `src/components/Header.js`
- `src/components/website/navigation/Navigation.js`
- `src/components/website/navigation/navigationConfig.js`
- `src/components/common/SocialLinks/SocialLinks.js`

`src/components/website/WebsiteLayout.js`, `NavigationItem.js` und `DropdownMenu.js` besitzen keine aktiven Imports. Sie bleiben bis zu einem separaten technischen Cleanup als dokumentierter Legacy-Bestand erhalten und sind kein zweiter Navigationspfad.

## Qualitätsanforderungen

- keine erfundenen oder toten Navigationsziele;
- identische fachliche Struktur auf Desktop und Mobilgeräten;
- keine Erweiterung externer Links ohne verifizierte Quelle;
- kein horizontaler Header-/Navigationsoverflow bei 360–430 Pixel;
- `aria-expanded`, `aria-controls`, `aria-current`, Fokuszustände und Escape-Verhalten erhalten.
