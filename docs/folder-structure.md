# Ordnerstruktur

Dieses Dokument beschreibt die aktuelle und angestrebte Projektstruktur.

## Hauptstruktur

```txt
src/
├── app/
├── components/
├── constants/
├── lib/
└── styles/
```

## App Router

```txt
src/app/
├── (website)/
└── admin/
```

## Öffentliche Webseite

```txt
src/app/(website)/
├── layout.js
├── page.js
├── news/
├── fussball/
├── trainer/
├── tischtennis/
├── damen-gymnastik/
├── termine/
└── kontakt/
```

## Adminbereich

```txt
src/app/admin/
├── layout.js
├── page.js
├── news/
├── teams/
├── players/
├── coaches/
├── media/
├── events/
├── tournaments/
└── settings/
```

## Komponenten

```txt
src/components/
├── Header.js
├── website/
└── admin/
```

## Website-Komponenten

```txt
src/components/website/
├── navigation/
├── news/
├── football/
├── team/
├── profile/
├── player-profile/
└── coach-profile/
```

## Admin-Komponenten

```txt
src/components/admin/
├── delete/
├── layout/
├── dashboard/
├── forms/
├── media/
├── services/
├── ui/
├── utils/
├── teams/
├── players/
├── coaches/
└── news/
```

## Gemeinsame Admin-Bausteine

```txt
src/components/admin/delete/
├── AdminRemoveButton.js
└── removeActions.js
```

```txt
src/components/admin/forms/
├── FormField.js
├── FormSection.js
├── SettingsFields.js
├── SpecialFields.js
├── StatusSwitch.js
└── index.js
```

```txt
src/components/admin/ui/
├── EntityBadge.js
├── EntityCard.js
├── StatisticGrid.js
└── TabNavigation.js
```

## Gemeinsame Bibliotheken

```txt
src/lib/
├── phone.js
├── supabase.js
└── storage.js
```

## Dokumentation

Aktuell liegen einige historische Dokumente direkt unter `docs`. Langfristig soll die Dokumentation in diese Bereiche konsolidiert werden:

```txt
docs/
├── architecture/
├── roadmap/
├── modules/
└── migration/
```

Da `docs/roadmap.md` bereits existiert, wird diese Datei zunächst weitergeführt. Beim späteren Aufräumen kann sie in `docs/roadmap/roadmap.md` verschoben werden.

## Regel

Neue Module werden nach demselben Muster aufgebaut. Gemeinsame UI-, Formular-, Upload-, Lösch-, Statistik- und Repository-Bausteine werden bevorzugt wiederverwendet.
