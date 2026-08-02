# B15.6B – Trainerbild im Detailseiten-Header

## Root Cause

`CoachDetailOverview` verwendete nach B15.6 weiterhin ein eigenes `next/image` und löste das Bild direkt über `image_url || photo_url` auf. Damit umging der Detailheader den in B15.6A vereinheitlichten Avatarpfad. Die externe Storage-Domain ist nicht in der globalen Next-Image-Konfiguration freigegeben; außerdem besaß der Header keinen Load-Error-Fallback.

## Betroffene Detailkomponente

Betroffen war ausschließlich `src/components/admin/coaches/components/CoachDetailOverview.js` innerhalb von `/admin/coaches/edit/[id]`.

## Wiederverwendung von CoachAvatar

Der Header verwendet jetzt dieselbe `CoachAvatar`-Komponente wie Desktopübersicht und Mobile-Karte. Die Seite erzeugt mit `createCoachReadDto()` den normalisierten Coach-Datensatz; die UI greift für das Bild ausschließlich auf dessen `imageUrl`-Vertrag über den zentralen Resolver zu.

## Bildgrößen

- Desktoptabelle: 40 × 40 Pixel
- Mobile-Karte: 48 × 48 Pixel
- Detailheader: 64 × 64 Pixel

Alle Varianten sind rund, fest dimensioniert und verwenden `object-cover`.

## Fallback

Fehlende oder leere Bildwerte führen zum vorhandenen Standardbild. Schlägt das Laden einer URL fehl, zeigt `CoachAvatar` einen Initialen-Platzhalter ohne weiteres Bild-Element. Ein leerer `src`, ein defektes Browserbild und eine Fehler-Endlosschleife werden vermieden.

## Tests

Die UI-Strukturtests prüfen die Verwendung von `CoachAvatar`, die Detailgröße, das Fehlen direkter Datenbankbildfelder und den unveränderten gemeinsamen Avatar in Desktop- und Mobileübersicht. Ergänzend laufen Resolver-, DTO-, Formular- und saisonale Regressionstests.

## Risiken

Ein visueller Test mit realen Trainerdaten setzt eine authentifizierte lokale Adminsitzung voraus. Öffentliche Trainerkomponenten bleiben bewusst unverändert.
