# B13.4B - Safe Backfill Preparation

## Scope

B13.4B covers only safe backfill preparation for:

- public.players -> public.player_team_seasons
- public.coaches -> public.coach_team_seasons
- public.players.photo_url -> public.players.image_url
- public.coaches.photo_url -> public.coaches.image_url

No schema changes and no policy changes are part of B13.4B.

## Files

- docs/sql/b13-4b-safe-backfill.sql
- docs/sql/b13-4b-safe-postcheck.sql
- docs/planning/b13-4b-safe-backfill.md

## Safety Rules Enforced

1. Only conflict-free records are transferred.
2. No target overwrite when target data already exists.
3. No DELETE.
4. No DROP.
5. No ALTER.
6. No RLS changes.
7. No triggers.
8. No functions.
9. No table creation.
10. DML uses only INSERT/UPDATE with WHERE NOT EXISTS logic inside a transaction.

## Backfill Logic

### Players

Legacy source:

- players.team_id

Target:

- player_team_seasons

Insert only when all conditions are true:

- exactly one current season exists
- player has a non-null legacy team_id
- exactly one matching team_seasons row for that team and current season
- no active player_team_seasons row exists for the player
- no existing player_id + team_season_id pair exists

Data mapping priority:

- shirt_number: players.shirt_number, fallback players.jersey_number
- position_de: players.position_de, fallback players.position
- position_en: players.position_en, fallback players.position
- is_captain and sort_order copied as-is with defaults

### Coaches

Legacy source:

- coaches.team_id

Target:

- coach_team_seasons

Insert only when all conditions are true:

- exactly one current season exists
- coach has a non-null legacy team_id
- exactly one matching team_seasons row for that team and current season
- no active coach_team_seasons row exists for the coach
- no existing coach_id + team_season_id pair exists

Data mapping priority:

- role_de: coaches.role_de, fallback coaches.role, fallback Trainer
- role_en: coaches.role_en, fallback coaches.role, fallback Coach
- sort_order copied with default 0

### Image Backfill

- players.photo_url -> players.image_url only when image_url IS NULL and photo_url IS NOT NULL
- coaches.photo_url -> coaches.image_url only when image_url IS NULL and photo_url IS NOT NULL

## Counts and Reporting Flow

The safe backfill SQL is structured in three phases:

1. Pre-counts (eligibility, skip reasons, max possible inserts/updates)
2. DML with per-step affected-row counts
3. Inline postcheck summary

The standalone postcheck SQL provides expanded diagnostics after execution.

## Tables Affected

Direct write targets:

- public.players
- public.coaches
- public.player_team_seasons
- public.coach_team_seasons

Read dependencies:

- public.seasons
- public.team_seasons
- public.teams

## Maximal Possible INSERTs and UPDATEs

Maximal values are emitted by pre-count queries in docs/sql/b13-4b-safe-backfill.sql.
Additional static upper bounds from current inventory cardinalities:

- players total rows: 15 -> theoretical max player inserts <= 15
- coaches total rows: 5 -> theoretical max coach inserts <= 5
- theoretical max player image updates <= 15
- theoretical max coach image updates <= 5

Real applied counts are expected to be lower, because conflict-free filters intentionally skip many rows.

## Records Intentionally Not Transferred

### Players skipped intentionally

- missing legacy team_id
- no matching team_seasons row for current season
- multiple team_seasons matches (ambiguous)
- already has an active player_team_seasons relation
- target pair already exists
- current season guard is invalid (zero or multiple is_current rows)

### Coaches skipped intentionally

- missing legacy team_id
- no matching team_seasons row for current season
- multiple team_seasons matches (ambiguous)
- already has an active coach_team_seasons relation
- target pair already exists
- current season guard is invalid (zero or multiple is_current rows)

### Image updates skipped intentionally

- image_url already set
- photo_url is NULL

## Why skips are required

Skips are by design to guarantee:

- no accidental overwrite
- no automatic resolution of ambiguous season mapping
- no duplicate active assignments
- no hidden behavioral change in production paths

## Execution Guidance

- Do not execute automatically.
- Review pre-count output first.
- Execute in a controlled window.
- Validate with docs/sql/b13-4b-safe-postcheck.sql immediately after run.
- Keep legacy fields active; do not switch read/write paths in this step.
