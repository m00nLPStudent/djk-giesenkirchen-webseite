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
├── trainer/
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
├── profile/
├── player-profile/
└── coach-profile/
```

### Gemeinsame öffentliche Profil-Komponenten

```txt
src/components/website/profile/
├── ProfileDetailsCard.js
└── index.js
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

### Öffentliche Trainerprofil-Komponenten

```txt
src/components/website/coach-profile/
├── CoachProfileImageCard.js
├── CoachProfileHeader.js
├── CoachProfileStatsGrid.js
├── coachProfile.helpers.js
└── index.js
```

## Admin-Komponenten

```txt
src/components/admin/
├── layout/
├── dashboard/
├── forms/
├── hooks/
├── media/
├── services/
├── ui/
├── utils/
├── teams/
├── players/
└── coaches/
```

### Gemeinsame Admin-Formularfelder

```txt
src/components/admin/forms/
├── FormField.js
├── FormSection.js
├── SettingsFields.js
├── SpecialFields.js
├── StatusSwitch.js
└── index.js
```

### Gemeinsame Admin-Hooks

```txt
src/components/admin/hooks/
├── useDeleteEntity.js
├── useEntityForm.js
└── useImageUpload.js
```

### Gemeinsame Admin-Services

```txt
src/components/admin/services/
├── deleteEntity.service.js
└── entity.repository.js
```

### Gemeinsame Admin-UI

```txt
src/components/admin/ui/
├── EntityBadge.js
├── EntityCard.js
└── StatisticGrid.js
```

### Gemeinsame Admin-Utils

```txt
src/components/admin/utils/
├── countries.js
├── entity.js
├── list.js
└── validation.js
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
    ├── PlayerNationalityList.js
    └── playerStats.helpers.js
```

## Beispiel: Coaches-Modul

```txt
src/components/admin/coaches/
├── AdminCoachesList.js
├── AdminCoachesOverview.js
├── index.js
├── components/
│   ├── CoachCard.js
│   ├── CoachEmptyState.js
│   ├── CoachFilters.js
│   ├── CoachImageUpload.js
│   ├── CoachStats.js
│   ├── CoachStatusBadge.js
│   └── CoachTeamsOverview.js
├── forms/
│   ├── AdminCoachesForm.js
│   ├── coachForm.config.js
│   ├── coachForm.helpers.js
│   └── fields/
│       ├── CoachBasicFields.js
│       ├── CoachContactFields.js
│       ├── CoachFormField.js
│       ├── CoachProfileFields.js
│       ├── CoachRoleFields.js
│       └── CoachSettingsFields.js
├── services/
│   └── coaches.service.js
└── utils/
    ├── coachStats.js
    └── slug.js
```

## Gemeinsame Bibliotheken

```txt
src/lib/
├── phone.js
├── supabase.js
└── storage.js
```

`storage.js` enthält wiederverwendbare Storage-Helfer für Upload, Löschen, Dateinamen und Public-URL-Pfade.

## Regel

Neue Module werden nach demselben Muster aufgebaut, damit das CMS langfristig wartbar bleibt. Gemeinsame UI-, Formular-, Upload-, Lösch-, Statistik- und Repository-Bausteine werden bevorzugt wiederverwendet.
