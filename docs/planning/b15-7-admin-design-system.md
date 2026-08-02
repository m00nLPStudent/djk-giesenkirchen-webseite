# B15.7 – Einheitliches Admin-UI-System

## Ziel und Grenzen

Das Admin-Designsystem liegt unter `src/components/admin/design-system`. Es kapselt ausschließlich Darstellung, Responsive-Verhalten und zugängliche Interaktionsrahmen. Datenbank, Queries, DTOs, Repositories, Actions, Routing, Permissions und Scope Engine bleiben außerhalb der Schicht.

## Architektur

Die öffentliche API wird über `design-system/index.js` exportiert. Die Komponenten sind nach Aufgabe getrennt:

- `AdminModule`: Seite, Header, Toolbar, Suche, Buttons und Abschnittstitel
- `AdminFilters`: standardmäßig eingeklappte Filterhülle
- `AdminList`: Desktoptabelle, Mobile-Karten, Zeilen, Pfeil und Pagination
- `AdminDetail`: Detailheader, Zurücklink, Informationsbereiche, Zeilen, Timeline, Metadaten und Gefahrenbereich
- `AdminStatus`: Statuschip, Kennzahl und kompakte Zusammenfassung
- `AdminFeedback`: Panel und Empty State
- `tokens`: zentrale Klassen für Flächen, Fokus, Typografie, Buttons und Statusfarben

## Komponentenverträge

Komponenten erhalten fertig aufbereitete Anzeigeinhalte und UI-Zustand über Props. Sie laden keine Daten und kennen keine Berechtigungs-, Scope- oder Fachregeln. Modulspezifische Komponenten dürfen fachliche Labels und Statuswerte übersetzen, rendern diese anschließend aber mit den gemeinsamen Primitives.

## Header und Aktionen

`AdminModuleHeader` definiert Titel, Beschreibung, optionale Suche sowie primäre und zusätzliche Aktionen. `AdminPageHeader` bleibt als kompatibler Adapter bestehen. `AdminButton` bietet ausschließlich `primary`, `secondary`, `danger` und `link`; `AdminModulePrimaryAction` ist der semantische Primäraktions-Adapter.

## Filter

`AdminModuleFilters` ist standardmäßig geschlossen, verbindet Trigger und Panel mit `aria-expanded` und `aria-controls` und vereinheitlicht Fläche, Icon, Padding und Chevron-Zustand. Fachmodule liefern nur ihre Filterfelder und aktive Filterhinweise.

## Listen und Responsive-Verhalten

`AdminModuleList` und `AdminModuleCards` bilden das gemeinsame Muster: Mobile-Karten unterhalb `lg`, Desktoptabelle ab `lg`. Zeilen und Karten teilen Fokus-, Hover- und Pfeilmuster. Layoutspalten bleiben als fachmodulspezifisches Grid-Template konfigurierbar.

## Details und Informationen

`AdminDetailLayout` ordnet Header, Inhalte und Gefahrenbereich. `AdminDetailHeader` unterstützt Panel- und Hero-Variante, einheitliche Zurücknavigation, Status und Aktionen. `AdminInformationSection` und `AdminInformationRow` erzwingen Label/Wert-Semantik mit `dl`, `dt` und `dd`. Timeline und Metadaten erhalten eigene semantische Container.

## Status, Kennzahlen und Leerzustände

`AdminStatusChip` ist die einzige visuelle Statusbasis. Bestehende `EntityBadge`-Aufrufer werden kompatibel darüber geführt. `AdminMetric` und `AdminModuleSummary` ersetzen große Statistikflächen bei kompakten Übersichten. `AdminModuleEmptyState` unterstützt Icon, Titel, Beschreibung und optionale Aktion.

## Typografie und Spacing

Die Skala beschränkt sich auf kleine Labels, normalen Inhalt, Abschnittstitel und Seitentitel. Flächen und Komponenten verwenden ein 8-Pixel-orientiertes Raster mit 4/8/12/16/20/24/32 Pixeln; bestehende 2-Pixel-Zwischenschritte bleiben nur zur visuellen Kompatibilität der Referenzmodule erhalten.

## Referenzanbindung

Trainer nutzt gemeinsame Header-, Filter-, Kennzahl-, Status-, Detail-, Informations- und Gefahrenbausteine. Vereinsbeiträge nutzt gemeinsamen Header, Statusbasis, Detailheader und Informationszeilen. Das Dashboard bleibt funktional und visuell unverändert; seine spätere interne Umstellung erfolgt erst nach visueller Abnahme der Referenz-Primitives.

## Qualität

Alle Design-System-Dateien bleiben unter 300 Zeilen. Strukturtests sichern Exporte, eingeklappte Filter, Responsive-Breakpoint, Detailbausteine und die kompatiblen Adapter. Die Migrationsreihenfolge steht in `b15-7-migration-order.csv`.
