# Ordnerstruktur

Dieses Dokument beschreibt die gewünschte Projektstruktur.

## Hauptstruktur

```txt
src/
├── app/
├── components/
├── lib/
└── styles/
```

## App Router

```txt
src/app/
├── (website)/
└── admin/
```

### Öffentliche Webseite

```txt
src/app/(website)/
├── layout.js
├── page.js
├── news/
├── fussball/
├── tischtennis/
├── damen-gymnastik/
├── termine/
└── kontakt/
```

### Adminbereich

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
└── football/
```

## Admin-Komponenten

```txt
src/components/admin/
├── layout/
├── dashboard/
├── ui/
├── teams/
└── players/
```

## Beispiel: Players-Modul

```txt
src/components/admin/players/
├── AdminPlayersList.js
├── index.js
├── components/
│   ├── PlayerCard.js
│   ├── PlayerEmptyState.js
│   ├── PlayerFilters.js
│   ├── PlayerImageUpload.js
│   ├── PlayerStats.js
│   └── PlayerStatusBadge.js
├── forms/
│   └── AdminPlayersForm.js
└── services/
    └── players.service.js
```

## Regel

Neue Module werden nach demselben Muster aufgebaut, damit das CMS langfristig wartbar bleibt.
