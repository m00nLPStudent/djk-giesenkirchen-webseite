-- B13.4A core backfill proposal
-- Transaction-based, idempotent, additive only.
-- No destructive statements. No overwrite of non-empty target values.

BEGIN;

-- 0) Fill players.image_url and coaches.image_url from photo_url only when the current image_url is empty.
UPDATE public.players
SET image_url = photo_url
WHERE (image_url IS NULL OR btrim(image_url) = '')
  AND photo_url IS NOT NULL
  AND btrim(photo_url) <> '';

UPDATE public.coaches
SET image_url = photo_url
WHERE (image_url IS NULL OR btrim(image_url) = '')
  AND photo_url IS NOT NULL
  AND btrim(photo_url) <> '';

-- 1) Backfill teams -> team_seasons for the uniquely current season.
WITH current_season AS (
  SELECT
    id AS season_id,
    COUNT(*) OVER () AS season_count
  FROM public.seasons
  WHERE is_current = true
  ORDER BY created_at DESC, id
  LIMIT 1
), source_rows AS (
  SELECT
    t.id AS team_id,
    cs.season_id,
    NULLIF(btrim(t.name_de), '') AS name_de,
    NULLIF(btrim(t.name_en), '') AS name_en,
    NULLIF(btrim(t.slug), '') AS slug,
    t.age_group,
    NULLIF(btrim(t.description_de), '') AS description_de,
    NULLIF(btrim(t.description_en), '') AS description_en,
    NULLIF(btrim(t.training_times_de), '') AS training_times_de,
    NULLIF(btrim(t.training_times_en), '') AS training_times_en,
    NULLIF(btrim(t.team_image_url), '') AS team_image_url,
    NULLIF(btrim(t.contact_name), '') AS contact_name,
    NULLIF(btrim(t.contact_email), '') AS contact_email,
    NULLIF(btrim(t.contact_phone), '') AS contact_phone,
    NULLIF(btrim(t.contact_image_url), '') AS contact_image_url,
    NULLIF(btrim(t.fussball_de_matches_widget_id), '') AS fussball_de_matches_widget_id,
    NULLIF(btrim(t.fussball_de_matches_widget_url), '') AS fussball_de_matches_widget_url,
    NULLIF(btrim(t.fussball_de_matches_url), '') AS fussball_de_matches_url,
    NULLIF(btrim(t.dfb_matches_widget_url), '') AS dfb_matches_widget_url,
    NULLIF(btrim(t.fussball_de_table_widget_id), '') AS fussball_de_table_widget_id,
    NULLIF(btrim(t.fussball_de_table_widget_url), '') AS fussball_de_table_widget_url,
    NULLIF(btrim(t.fussball_de_table_url), '') AS fussball_de_table_url,
    NULLIF(btrim(t.dfb_table_widget_url), '') AS dfb_table_widget_url,
    NULLIF(btrim(t.fussball_de_team_id), '') AS fussball_de_team_id,
    NULLIF(btrim(t.fussball_de_competition_id), '') AS fussball_de_competition_id,
    NULLIF(btrim(t.fussball_de_club_id), '') AS fussball_de_club_id,
    NULLIF(btrim(t.fussball_de_team_url), '') AS fussball_de_team_url,
    NULLIF(btrim(t.fupa_matches_widget_id), '') AS fupa_matches_widget_id,
    NULLIF(btrim(t.fupa_table_widget_id), '') AS fupa_table_widget_id,
    NULLIF(btrim(t.fupa_club_url), '') AS fupa_club_url,
    t.is_active,
    t.sort_order
  FROM public.teams AS t
  CROSS JOIN current_season AS cs
  WHERE cs.season_count = 1
)
INSERT INTO public.team_seasons (
  team_id,
  season_id,
  name_de,
  name_en,
  slug,
  age_group,
  description_de,
  description_en,
  training_times_de,
  training_times_en,
  team_image_url,
  contact_name,
  contact_email,
  contact_phone,
  contact_image_url,
  fussball_de_matches_widget_id,
  fussball_de_matches_widget_url,
  fussball_de_matches_url,
  dfb_matches_widget_url,
  fussball_de_table_widget_id,
  fussball_de_table_widget_url,
  fussball_de_table_url,
  dfb_table_widget_url,
  fussball_de_team_id,
  fussball_de_competition_id,
  fussball_de_club_id,
  fussball_de_team_url,
  fupa_matches_widget_id,
  fupa_table_widget_id,
  fupa_club_url,
  is_active,
  sort_order
)
SELECT
  team_id,
  season_id,
  name_de,
  name_en,
  slug,
  age_group,
  description_de,
  description_en,
  training_times_de,
  training_times_en,
  team_image_url,
  contact_name,
  contact_email,
  contact_phone,
  contact_image_url,
  fussball_de_matches_widget_id,
  fussball_de_matches_widget_url,
  fussball_de_matches_url,
  dfb_matches_widget_url,
  fussball_de_table_widget_id,
  fussball_de_table_widget_url,
  fussball_de_table_url,
  dfb_table_widget_url,
  fussball_de_team_id,
  fussball_de_competition_id,
  fussball_de_club_id,
  fussball_de_team_url,
  fupa_matches_widget_id,
  fupa_table_widget_id,
  fupa_club_url,
  is_active,
  sort_order
FROM source_rows
ON CONFLICT (team_id, season_id) DO UPDATE SET
  name_de = COALESCE(NULLIF(public.team_seasons.name_de, ''), EXCLUDED.name_de),
  name_en = COALESCE(NULLIF(public.team_seasons.name_en, ''), EXCLUDED.name_en),
  slug = COALESCE(NULLIF(public.team_seasons.slug, ''), EXCLUDED.slug),
  age_group = COALESCE(NULLIF(public.team_seasons.age_group, ''), EXCLUDED.age_group),
  description_de = COALESCE(NULLIF(public.team_seasons.description_de, ''), EXCLUDED.description_de),
  description_en = COALESCE(NULLIF(public.team_seasons.description_en, ''), EXCLUDED.description_en),
  training_times_de = COALESCE(NULLIF(public.team_seasons.training_times_de, ''), EXCLUDED.training_times_de),
  training_times_en = COALESCE(NULLIF(public.team_seasons.training_times_en, ''), EXCLUDED.training_times_en),
  team_image_url = COALESCE(NULLIF(public.team_seasons.team_image_url, ''), EXCLUDED.team_image_url),
  contact_name = COALESCE(NULLIF(public.team_seasons.contact_name, ''), EXCLUDED.contact_name),
  contact_email = COALESCE(NULLIF(public.team_seasons.contact_email, ''), EXCLUDED.contact_email),
  contact_phone = COALESCE(NULLIF(public.team_seasons.contact_phone, ''), EXCLUDED.contact_phone),
  contact_image_url = COALESCE(NULLIF(public.team_seasons.contact_image_url, ''), EXCLUDED.contact_image_url),
  fussball_de_matches_widget_id = COALESCE(NULLIF(public.team_seasons.fussball_de_matches_widget_id, ''), EXCLUDED.fussball_de_matches_widget_id),
  fussball_de_matches_widget_url = COALESCE(NULLIF(public.team_seasons.fussball_de_matches_widget_url, ''), EXCLUDED.fussball_de_matches_widget_url),
  fussball_de_matches_url = COALESCE(NULLIF(public.team_seasons.fussball_de_matches_url, ''), EXCLUDED.fussball_de_matches_url),
  dfb_matches_widget_url = COALESCE(NULLIF(public.team_seasons.dfb_matches_widget_url, ''), EXCLUDED.dfb_matches_widget_url),
  fussball_de_table_widget_id = COALESCE(NULLIF(public.team_seasons.fussball_de_table_widget_id, ''), EXCLUDED.fussball_de_table_widget_id),
  fussball_de_table_widget_url = COALESCE(NULLIF(public.team_seasons.fussball_de_table_widget_url, ''), EXCLUDED.fussball_de_table_widget_url),
  fussball_de_table_url = COALESCE(NULLIF(public.team_seasons.fussball_de_table_url, ''), EXCLUDED.fussball_de_table_url),
  dfb_table_widget_url = COALESCE(NULLIF(public.team_seasons.dfb_table_widget_url, ''), EXCLUDED.dfb_table_widget_url),
  fussball_de_team_id = COALESCE(NULLIF(public.team_seasons.fussball_de_team_id, ''), EXCLUDED.fussball_de_team_id),
  fussball_de_competition_id = COALESCE(NULLIF(public.team_seasons.fussball_de_competition_id, ''), EXCLUDED.fussball_de_competition_id),
  fussball_de_club_id = COALESCE(NULLIF(public.team_seasons.fussball_de_club_id, ''), EXCLUDED.fussball_de_club_id),
  fussball_de_team_url = COALESCE(NULLIF(public.team_seasons.fussball_de_team_url, ''), EXCLUDED.fussball_de_team_url),
  fupa_matches_widget_id = COALESCE(NULLIF(public.team_seasons.fupa_matches_widget_id, ''), EXCLUDED.fupa_matches_widget_id),
  fupa_table_widget_id = COALESCE(NULLIF(public.team_seasons.fupa_table_widget_id, ''), EXCLUDED.fupa_table_widget_id),
  fupa_club_url = COALESCE(NULLIF(public.team_seasons.fupa_club_url, ''), EXCLUDED.fupa_club_url);

-- 2) Backfill players -> player_team_seasons only when there is no active relation yet and the current team match is unique.
WITH current_season AS (
  SELECT id AS season_id
  FROM public.seasons
  WHERE is_current = true
  ORDER BY created_at DESC, id
  LIMIT 1
), candidate_rows AS (
  SELECT
    p.id AS player_id,
    ts.id AS team_season_id,
    COALESCE(p.shirt_number, p.jersey_number) AS shirt_number,
    COALESCE(NULLIF(btrim(p.position_de), ''), NULLIF(btrim(p.position), '')) AS position_de,
    COALESCE(NULLIF(btrim(p.position_en), ''), NULLIF(btrim(p.position), '')) AS position_en,
    COALESCE(p.is_captain, false) AS is_captain,
    COALESCE(p.sort_order, 0) AS sort_order,
    COUNT(*) OVER (PARTITION BY p.id) AS match_count
  FROM public.players AS p
  JOIN public.team_seasons AS ts
    ON ts.team_id = p.team_id
  JOIN current_season AS cs
    ON cs.season_id = ts.season_id
  LEFT JOIN public.player_team_seasons AS active_pts
    ON active_pts.player_id = p.id
   AND active_pts.is_active = true
  WHERE p.team_id IS NOT NULL
    AND active_pts.id IS NULL
)
INSERT INTO public.player_team_seasons (
  player_id,
  team_season_id,
  shirt_number,
  position_de,
  position_en,
  is_captain,
  is_active,
  sort_order
)
SELECT
  player_id,
  team_season_id,
  shirt_number,
  position_de,
  position_en,
  is_captain,
  true,
  sort_order
FROM candidate_rows
WHERE match_count = 1
ON CONFLICT (player_id, team_season_id) DO UPDATE SET
  shirt_number = COALESCE(public.player_team_seasons.shirt_number, EXCLUDED.shirt_number),
  position_de = COALESCE(NULLIF(public.player_team_seasons.position_de, ''), EXCLUDED.position_de),
  position_en = COALESCE(NULLIF(public.player_team_seasons.position_en, ''), EXCLUDED.position_en),
  is_captain = COALESCE(public.player_team_seasons.is_captain, EXCLUDED.is_captain),
  sort_order = COALESCE(public.player_team_seasons.sort_order, EXCLUDED.sort_order),
  is_active = COALESCE(public.player_team_seasons.is_active, EXCLUDED.is_active);

-- 3) Backfill coaches -> coach_team_seasons only when there is no active relation yet and the current team match is unique.
WITH current_season AS (
  SELECT id AS season_id
  FROM public.seasons
  WHERE is_current = true
  ORDER BY created_at DESC, id
  LIMIT 1
), candidate_rows AS (
  SELECT
    c.id AS coach_id,
    ts.id AS team_season_id,
    COALESCE(NULLIF(btrim(c.role_de), ''), NULLIF(btrim(c.role), ''), 'Trainer') AS role_de,
    COALESCE(NULLIF(btrim(c.role_en), ''), NULLIF(btrim(c.role), ''), 'Coach') AS role_en,
    COALESCE(c.sort_order, 0) AS sort_order,
    COUNT(*) OVER (PARTITION BY c.id) AS match_count
  FROM public.coaches AS c
  JOIN public.team_seasons AS ts
    ON ts.team_id = c.team_id
  JOIN current_season AS cs
    ON cs.season_id = ts.season_id
  LEFT JOIN public.coach_team_seasons AS active_cts
    ON active_cts.coach_id = c.id
   AND active_cts.is_active = true
  WHERE c.team_id IS NOT NULL
    AND active_cts.id IS NULL
)
INSERT INTO public.coach_team_seasons (
  coach_id,
  team_season_id,
  role_de,
  role_en,
  is_active,
  sort_order
)
SELECT
  coach_id,
  team_season_id,
  role_de,
  role_en,
  true,
  sort_order
FROM candidate_rows
WHERE match_count = 1
ON CONFLICT (coach_id, team_season_id) DO UPDATE SET
  role_de = COALESCE(NULLIF(public.coach_team_seasons.role_de, ''), EXCLUDED.role_de),
  role_en = COALESCE(NULLIF(public.coach_team_seasons.role_en, ''), EXCLUDED.role_en),
  sort_order = COALESCE(public.coach_team_seasons.sort_order, EXCLUDED.sort_order),
  is_active = COALESCE(public.coach_team_seasons.is_active, EXCLUDED.is_active);

-- Control point before commit:
-- Review the row counts from the inserted/updated statements and compare them with the preflight and postcheck scripts.

COMMIT;
