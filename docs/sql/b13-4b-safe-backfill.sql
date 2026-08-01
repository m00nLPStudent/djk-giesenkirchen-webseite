-- B13.4B safe backfill
-- Do not run automatically. Execute manually after review.
-- Rules: no DELETE/DROP/ALTER, no functions/triggers/tables, only conflict-free INSERT/UPDATE.

BEGIN;

-- ==================================================
-- A) Pre-counts (before DML)
-- ==================================================

-- A1) Current-season status and guard.
WITH current_season AS (
  SELECT id AS season_id
  FROM public.seasons
  WHERE is_current = true
)
SELECT
  COUNT(*) AS current_season_count
FROM current_season;

-- A2) Players: potential candidates and skip reasons.
WITH current_season AS (
  SELECT id AS season_id
  FROM public.seasons
  WHERE is_current = true
), current_guard AS (
  SELECT COUNT(*) AS cnt FROM current_season
), team_season_candidates AS (
  SELECT
    p.id AS player_id,
    COUNT(ts.id) AS team_season_match_count,
    MIN(ts.id::text) AS team_season_id_text
  FROM public.players AS p
  LEFT JOIN current_season AS cs ON TRUE
  LEFT JOIN public.team_seasons AS ts
    ON ts.team_id = p.team_id
   AND ts.season_id = cs.season_id
  WHERE p.team_id IS NOT NULL
  GROUP BY p.id
), player_active_rel AS (
  SELECT player_id, COUNT(*) AS active_rel_count
  FROM public.player_team_seasons
  WHERE is_active = true
  GROUP BY player_id
), player_pair_exists AS (
  SELECT
    tsc.player_id,
    CASE
      WHEN tsc.team_season_match_count = 1 THEN (
        SELECT COUNT(*)
        FROM public.player_team_seasons AS pts
        WHERE pts.player_id = tsc.player_id
          AND pts.team_season_id::text = tsc.team_season_id_text
      )
      ELSE 0
    END AS pair_rel_count
  FROM team_season_candidates AS tsc
)
SELECT
  (SELECT cnt FROM current_guard) AS current_season_count,
  COUNT(*) FILTER (WHERE p.team_id IS NOT NULL) AS players_with_legacy_team,
  COUNT(*) FILTER (WHERE p.team_id IS NULL) AS players_skipped_missing_legacy_team,
  COUNT(*) FILTER (WHERE tsc.team_season_match_count = 0) AS players_skipped_no_team_season_match,
  COUNT(*) FILTER (WHERE tsc.team_season_match_count > 1) AS players_skipped_ambiguous_team_season,
  COUNT(*) FILTER (WHERE COALESCE(par.active_rel_count, 0) > 0) AS players_skipped_existing_active_relation,
  COUNT(*) FILTER (WHERE COALESCE(pps.pair_rel_count, 0) > 0) AS players_skipped_existing_target_pair,
  COUNT(*) FILTER (
    WHERE p.team_id IS NOT NULL
      AND (SELECT cnt FROM current_guard) = 1
      AND tsc.team_season_match_count = 1
      AND COALESCE(par.active_rel_count, 0) = 0
      AND COALESCE(pps.pair_rel_count, 0) = 0
  ) AS players_max_insertable
FROM public.players AS p
LEFT JOIN team_season_candidates AS tsc ON tsc.player_id = p.id
LEFT JOIN player_active_rel AS par ON par.player_id = p.id
LEFT JOIN player_pair_exists AS pps ON pps.player_id = p.id;

-- A3) Coaches: potential candidates and skip reasons.
WITH current_season AS (
  SELECT id AS season_id
  FROM public.seasons
  WHERE is_current = true
), current_guard AS (
  SELECT COUNT(*) AS cnt FROM current_season
), team_season_candidates AS (
  SELECT
    c.id AS coach_id,
    COUNT(ts.id) AS team_season_match_count,
    MIN(ts.id::text) AS team_season_id_text
  FROM public.coaches AS c
  LEFT JOIN current_season AS cs ON TRUE
  LEFT JOIN public.team_seasons AS ts
    ON ts.team_id = c.team_id
   AND ts.season_id = cs.season_id
  WHERE c.team_id IS NOT NULL
  GROUP BY c.id
), coach_active_rel AS (
  SELECT coach_id, COUNT(*) AS active_rel_count
  FROM public.coach_team_seasons
  WHERE is_active = true
  GROUP BY coach_id
), coach_pair_exists AS (
  SELECT
    tsc.coach_id,
    CASE
      WHEN tsc.team_season_match_count = 1 THEN (
        SELECT COUNT(*)
        FROM public.coach_team_seasons AS cts
        WHERE cts.coach_id = tsc.coach_id
          AND cts.team_season_id::text = tsc.team_season_id_text
      )
      ELSE 0
    END AS pair_rel_count
  FROM team_season_candidates AS tsc
)
SELECT
  (SELECT cnt FROM current_guard) AS current_season_count,
  COUNT(*) FILTER (WHERE c.team_id IS NOT NULL) AS coaches_with_legacy_team,
  COUNT(*) FILTER (WHERE c.team_id IS NULL) AS coaches_skipped_missing_legacy_team,
  COUNT(*) FILTER (WHERE tsc.team_season_match_count = 0) AS coaches_skipped_no_team_season_match,
  COUNT(*) FILTER (WHERE tsc.team_season_match_count > 1) AS coaches_skipped_ambiguous_team_season,
  COUNT(*) FILTER (WHERE COALESCE(car.active_rel_count, 0) > 0) AS coaches_skipped_existing_active_relation,
  COUNT(*) FILTER (WHERE COALESCE(cpe.pair_rel_count, 0) > 0) AS coaches_skipped_existing_target_pair,
  COUNT(*) FILTER (
    WHERE c.team_id IS NOT NULL
      AND (SELECT cnt FROM current_guard) = 1
      AND tsc.team_season_match_count = 1
      AND COALESCE(car.active_rel_count, 0) = 0
      AND COALESCE(cpe.pair_rel_count, 0) = 0
  ) AS coaches_max_insertable
FROM public.coaches AS c
LEFT JOIN team_season_candidates AS tsc ON tsc.coach_id = c.id
LEFT JOIN coach_active_rel AS car ON car.coach_id = c.id
LEFT JOIN coach_pair_exists AS cpe ON cpe.coach_id = c.id;

-- A4) Image updates: max possible update counts.
SELECT
  COUNT(*) AS players_max_updatable_image_url
FROM public.players
WHERE image_url IS NULL
  AND photo_url IS NOT NULL;

SELECT
  COUNT(*) AS coaches_max_updatable_image_url
FROM public.coaches
WHERE image_url IS NULL
  AND photo_url IS NOT NULL;

-- ==================================================
-- B) DML with result counts
-- ==================================================

-- B1) players.photo_url -> players.image_url (only when image_url IS NULL).
WITH updated_rows AS (
  UPDATE public.players
  SET image_url = photo_url
  WHERE image_url IS NULL
    AND photo_url IS NOT NULL
  RETURNING id
)
SELECT COUNT(*) AS players_image_updates_applied
FROM updated_rows;

-- B2) coaches.photo_url -> coaches.image_url (only when image_url IS NULL).
WITH updated_rows AS (
  UPDATE public.coaches
  SET image_url = photo_url
  WHERE image_url IS NULL
    AND photo_url IS NOT NULL
  RETURNING id
)
SELECT COUNT(*) AS coaches_image_updates_applied
FROM updated_rows;

-- B3) Insert players into player_team_seasons only for conflict-free, unique candidates.
WITH current_season AS (
  SELECT id AS season_id
  FROM public.seasons
  WHERE is_current = true
), current_guard AS (
  SELECT COUNT(*) AS cnt FROM current_season
), unique_candidate AS (
  SELECT
    p.id AS player_id,
    MIN(ts.id::text) AS team_season_id_text,
    COALESCE(p.shirt_number, p.jersey_number) AS shirt_number,
    COALESCE(NULLIF(btrim(p.position_de), ''), NULLIF(btrim(p.position), '')) AS position_de,
    COALESCE(NULLIF(btrim(p.position_en), ''), NULLIF(btrim(p.position), '')) AS position_en,
    COALESCE(p.is_captain, false) AS is_captain,
    COALESCE(p.sort_order, 0) AS sort_order
  FROM public.players AS p
  JOIN current_season AS cs ON TRUE
  JOIN public.team_seasons AS ts
    ON ts.team_id = p.team_id
   AND ts.season_id = cs.season_id
  WHERE p.team_id IS NOT NULL
  GROUP BY
    p.id,
    COALESCE(p.shirt_number, p.jersey_number),
    COALESCE(NULLIF(btrim(p.position_de), ''), NULLIF(btrim(p.position), '')),
    COALESCE(NULLIF(btrim(p.position_en), ''), NULLIF(btrim(p.position), '')),
    COALESCE(p.is_captain, false),
    COALESCE(p.sort_order, 0)
  HAVING COUNT(ts.id) = 1
), inserted_rows AS (
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
    uc.player_id,
    uc.team_season_id_text::uuid,
    uc.shirt_number,
    uc.position_de,
    uc.position_en,
    uc.is_captain,
    true,
    uc.sort_order
  FROM unique_candidate AS uc
  WHERE (SELECT cnt FROM current_guard) = 1
    AND NOT EXISTS (
      SELECT 1
      FROM public.player_team_seasons AS active_pts
      WHERE active_pts.player_id = uc.player_id
        AND active_pts.is_active = true
    )
    AND NOT EXISTS (
      SELECT 1
      FROM public.player_team_seasons AS existing_pair
      WHERE existing_pair.player_id = uc.player_id
        AND existing_pair.team_season_id = uc.team_season_id_text::uuid
    )
  RETURNING id
)
SELECT COUNT(*) AS player_team_seasons_inserts_applied
FROM inserted_rows;

-- B4) Insert coaches into coach_team_seasons only for conflict-free, unique candidates.
WITH current_season AS (
  SELECT id AS season_id
  FROM public.seasons
  WHERE is_current = true
), current_guard AS (
  SELECT COUNT(*) AS cnt FROM current_season
), unique_candidate AS (
  SELECT
    c.id AS coach_id,
    MIN(ts.id::text) AS team_season_id_text,
    COALESCE(NULLIF(btrim(c.role_de), ''), NULLIF(btrim(c.role), ''), 'Trainer') AS role_de,
    COALESCE(NULLIF(btrim(c.role_en), ''), NULLIF(btrim(c.role), ''), 'Coach') AS role_en,
    COALESCE(c.sort_order, 0) AS sort_order
  FROM public.coaches AS c
  JOIN current_season AS cs ON TRUE
  JOIN public.team_seasons AS ts
    ON ts.team_id = c.team_id
   AND ts.season_id = cs.season_id
  WHERE c.team_id IS NOT NULL
  GROUP BY
    c.id,
    COALESCE(NULLIF(btrim(c.role_de), ''), NULLIF(btrim(c.role), ''), 'Trainer'),
    COALESCE(NULLIF(btrim(c.role_en), ''), NULLIF(btrim(c.role), ''), 'Coach'),
    COALESCE(c.sort_order, 0)
  HAVING COUNT(ts.id) = 1
), inserted_rows AS (
  INSERT INTO public.coach_team_seasons (
    coach_id,
    team_season_id,
    role_de,
    role_en,
    is_active,
    sort_order
  )
  SELECT
    uc.coach_id,
    uc.team_season_id_text::uuid,
    uc.role_de,
    uc.role_en,
    true,
    uc.sort_order
  FROM unique_candidate AS uc
  WHERE (SELECT cnt FROM current_guard) = 1
    AND NOT EXISTS (
      SELECT 1
      FROM public.coach_team_seasons AS active_cts
      WHERE active_cts.coach_id = uc.coach_id
        AND active_cts.is_active = true
    )
    AND NOT EXISTS (
      SELECT 1
      FROM public.coach_team_seasons AS existing_pair
      WHERE existing_pair.coach_id = uc.coach_id
        AND existing_pair.team_season_id = uc.team_season_id_text::uuid
    )
  RETURNING id
)
SELECT COUNT(*) AS coach_team_seasons_inserts_applied
FROM inserted_rows;

-- ==================================================
-- C) Inline postcheck summary
-- ==================================================

WITH current_season AS (
  SELECT id AS season_id
  FROM public.seasons
  WHERE is_current = true
  ORDER BY created_at DESC, id
  LIMIT 1
)
SELECT
  COUNT(*) FILTER (WHERE ts.id IS NULL) AS teams_without_current_team_season
FROM public.teams AS t
CROSS JOIN current_season AS cs
LEFT JOIN public.team_seasons AS ts
  ON ts.team_id = t.id
 AND ts.season_id = cs.season_id;

SELECT
  COUNT(*) AS players_without_any_relation
FROM public.players AS p
WHERE NOT EXISTS (
  SELECT 1
  FROM public.player_team_seasons AS pts
  WHERE pts.player_id = p.id
);

SELECT
  COUNT(*) AS coaches_without_any_relation
FROM public.coaches AS c
WHERE NOT EXISTS (
  SELECT 1
  FROM public.coach_team_seasons AS cts
  WHERE cts.coach_id = c.id
);

SELECT
  COUNT(*) AS players_still_missing_image_url
FROM public.players
WHERE image_url IS NULL
  AND photo_url IS NOT NULL;

SELECT
  COUNT(*) AS coaches_still_missing_image_url
FROM public.coaches
WHERE image_url IS NULL
  AND photo_url IS NOT NULL;

COMMIT;
