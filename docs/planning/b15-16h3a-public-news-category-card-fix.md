# B15.16H3A – Öffentliche News-Kategorien

## Sichtbarer Fehler und Root Cause

Der rote Chip wird von `components/website/news/NewsCard.js` gerendert. Die öffentliche Startseite übergab rohe Newszeilen, aber keine Kategorienliste. Der H3-Resolver erhielt dadurch `category_key`, jedoch eine leere Kategorienquelle und lieferte korrekt den Fallback. Newsdetail und Admin funktionierten, weil deren Loader die Kategorien explizit luden.

## Feldnamen und DTO

Die Datenbank liefert `category_key`. Vor dem Rendern normalisiert `createPublicNewsCardDto()` diesen Wert zu `categoryKey` und löst einmalig `categoryLabel` auf. Die Karte rendert ausschließlich `categoryLabel` und kennt weder Datenbankfelder noch Repository oder Resolver.

## Betroffene Oberflächen

Startseite, `/news`, paginierte `/news/uebersicht` sowie Featured- und weitere Karten verwenden denselben DTO-Aufbau. Die funktionierende Newsdetailseite verwendet weiterhin direkt den gemeinsamen Resolver.

## Zentrale Quelle und Performance

Jeder Listenloader ruft genau einmal `loadNewsCategories()` auf und baut anschließend alle DTOs im Speicher. Es gibt keine Abfrage innerhalb einer Karte und kein N+1.

## Fallback

`Unbekannte Kategorie` erscheint nur bei leerem, unbekanntem oder öffentlich nicht lesbarem Key. Das Legacy-Feld `news.category` wird nicht ausgewertet.

## Cache und Revalidation

Erstellen, Bearbeiten und Löschen einer News-Kategorie erweitert die bestehende Revalidation um den vorhandenen Scope `news`. Dieser invalidiert Startseite, Newslisten und Newsdetailseiten. Es wurde keine globale Cacheabschaltung ergänzt.

## Tests

Abgedeckt sind snake_case-zu-camelCase-Normalisierung, unterschiedliche Labels, Fallbacks, reine DTO-Darstellung, eine Kategorieabfrage pro Liste, öffentliche Oberflächen, Admin/Dashboard/Suche und Revalidation.

## Risiken und H4

Öffentlich nicht lesbare deaktivierte Kategorien ergeben vereinbarungsgemäß den Fallback. H4 sollte Terminarten mit demselben Loader-DTO-Muster anbinden, ohne das Event-CHECK-Constraint oder bestehende Daten zu verändern.
