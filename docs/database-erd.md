# Database ERD

## Kernmodell

```text
departments
  └── teams
        └── team_seasons
              ├── player_team_seasons ── players
              └── coach_team_seasons ── coaches

seasons
  └── team_seasons

news
  └── teams über football_team_id optional
```

## Bedeutung

- `teams` ist der Stammdatensatz einer Mannschaft.
- `team_seasons` enthält die saisonabhängigen Mannschaftsdaten.
- `players` und `coaches` sind Stammdaten.
- Zuordnungen zu einer Saison laufen über Relationstabellen.
- `news.football_team_id` ist optional und wird beim Löschen einer Mannschaft auf `null` gesetzt.

## Ziel

Beim späteren Livegang wird daraus eine saubere Produktionsstruktur ohne doppelte Altlast-Felder erstellt.
