# B15.6A – Trainerbilder in der Admin-Übersicht

## 1. Ausgangslage

Nach B15.6 wurden die normalisierten Trainerbilder in der neuen Desktopliste und den Mobile-Karten teilweise als defektes Bild dargestellt.

## 2. Root Cause

Die Admin-Abfrage lädt `image_url` und `photo_url`. `createCoachReadDto()` gibt daraus den normalisierten UI-Wert `imageUrl` aus. B15.6 renderte diesen Wert neu mit `next/image`. Für den externen Supabase-Storage ist in `next.config.mjs` jedoch kein Remote-Pattern konfiguriert. Das wich vom zuvor im Projekt eingesetzten normalen `<img>`-Rendering ab. Zusätzlich fehlte ein Load-Error-Fallback.

## 3. Kanonische Bildquelle

Die Priorität bleibt `imageUrl`, danach `image_url`, anschließend der ausdrücklich unterstützte Legacy-Fallback `photo_url`.

## 4. DTO-Vertrag

Die Admin-UI erhält weiterhin ausschließlich den normalisierten Wert `imageUrl`. Rollen und saisonale Zuordnungen bleiben assignment-first und wurden nicht verändert.

## 5. Zentraler Resolver

`createCoachReadDto()` und der gemeinsame Admin-Avatar verwenden `resolveCoachImageUrl()`. Damit gibt es keine eigene Feld-Fallbackkette in Desktopliste oder Mobile-Karte.

## 6. Fallback-Verhalten

Fehlende, leere oder nur aus Leerzeichen bestehende Werte werden durch den zentralen Resolver auf das vorhandene neutrale Standardbild abgebildet. Schlägt auch das Laden der aufgelösten URL fehl, ersetzt `CoachAvatar` das Bild durch einen runden Initialen-Platzhalter. Dadurch entsteht weder ein leerer `src` noch eine Fehler-Endlosschleife.

## 7. Desktop und Mobile

Beide Ansichten verwenden dieselbe `CoachAvatar`-Komponente. Nur die feste Größe unterscheidet sich: 40 Pixel in der Desktopliste und 48 Pixel auf der Mobile-Karte. Beide Varianten sind rund und verwenden `object-cover`.

## 8. Tests

Abgedeckt sind die Resolver-Priorität, `image_url`, Legacy-`photo_url`, fehlende und leere Werte, gemeinsame Verwendung in Desktop und Mobile sowie der Load-Error-Fallback. Die bestehenden DTO-, Formular-, saisonalen und B15.6-UI-Tests bleiben Bestandteil der Regression.

## 9. Risiken

Der Initialen-Fallback greift erst nach dem nativen Browser-Fehlerereignis. Sehr langsame oder intermittierend nicht erreichbare Storage-URLs können daher kurz den reservierten Avatarbereich zeigen. Die feste Größe verhindert dabei Layoutverschiebungen.

## 10. Empfohlener nächster Schritt

Den bereits vorhandenen öffentlichen Trainerbild-Komponenten kann später derselbe robuste Load-Error-Fallback gegeben werden. Das sollte als eigener Auftrag erfolgen, weil B15.6A ausschließlich die Admin-Übersicht betrifft.
