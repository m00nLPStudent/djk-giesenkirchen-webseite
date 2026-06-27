# Ordnerstruktur

Dieses Dokument beschreibt die gewünschte Projektstruktur.

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
├── football/
├── team/
└── player-profile/
```

### Öffentliche Spielerprofil-Komponenten

```txt
src/components/website/player-profile/
├── PlayerProfileImageCard.js
├── PlayerProfileHeader.js
├── PlayerProfileStatsGrid.js
├── PlayerProfileDescription.js
├── playerProfile.helpers.js
└── index.js
```

## Admin-Komponenten

```txt
src/components/admin/
├── layout/
├── dashboard/
├── forms/
├── ui/
├── teams/
└── players/
```

### Gemeinsame Admin-Formularfelder

```txt
src/components/admin/forms/
├── FormField.js
└── index.js
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
│   ├── AdminPlayersForm.js
│   ├── playerForm.config.js
│   ├── playerForm.helpers.js
│   └── fields/
│       ├── FormField.js
│       ├── PlayerBasicFields.js
│       ├── PlayerSportFields.js
│       ├── PlayerProfileFields.js
│       ├── PlayerDescriptionFields.js
│       └── PlayerSettingsFields.js
├── list/
│   └── playerList.helpers.js
├── services/
│   └── players.service.js
└── stats/
    ├── PlayerStatsCard.js
    ├── PlayerNationalityList.js
    └── playerStats.helpers.js
```

## Gemeinsame Bibliotheken

```txt
src/lib/
├── supabase.js
└── storage.js
```

`storage.js` enthält wiederverwendbare Storage-Helfer für Upload, Löschen, Dateinamen und Public-URL-Pfade.

## Regel

Neue Module werden nach demselben Muster aufgebaut, damit das CMS langfristig wartbar bleibt.
