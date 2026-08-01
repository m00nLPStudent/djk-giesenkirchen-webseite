-- B13.4B safe backfill dry-run (read-only)
-- This file intentionally contains only SELECT statements and CTE-based SELECTs.
-- No INSERT/UPDATE/DELETE or any other mutating DDL/DCL/PL statements.

-- ==================================================
-- RESULT BLOCK A - Globale Voraussetzungen
-- ==================================================
WITH current_season AS (
  SELECT id AS season_id, name AS season_name
  FROM public.seasons
  WHERE is_current = true
),
current_guard AS (
  SELECT COUNT(*) AS current_season_count
  FROM current_season
),
team_base AS (
  SELECT
    t.id AS team_id,
    COUNT(ts.id) AS current_team_season_match_count
  FROM public.teams AS t
  LEFT JOIN current_season AS cs ON TRUE
  LEFT JOIN public.team_seasons AS ts
    ON ts.team_id = t.id
   AND ts.season_id = cs.season_id
  GROUP BY t.id
),
duplicate_team_pairs AS (
  SELECT COUNT(*) AS duplicate_team_season_pair_count
  FROM (
    SELECT 1
    FROM public.team_seasons
    GROUP BY team_id, season_id
    HAVING COUNT(*) > 1
  ) AS d
)
SELECT
  (SELECT current_season_count FROM current_guard) AS current_season_count,
  (
    SELECT cs.season_id
    FROM current_season AS cs
    ORDER BY cs.season_id
    LIMIT 1
  ) AS current_season_id,
  (
    SELECT cs.season_name
    FROM current_season AS cs
    ORDER BY cs.season_id
    LIMIT 1
  ) AS current_season_name,
  (SELECT COUNT(*) FROM public.teams) AS team_count,
  (
    SELECT COUNT(*)
    FROM public.team_seasons AS ts
    JOIN current_season AS cs
      ON cs.season_id = ts.season_id
  ) AS current_team_season_count,
  (
    SELECT COUNT(*)
    FROM team_base AS tb
    WHERE tb.current_team_season_match_count = 0
  ) AS teams_without_current_team_season_count,
  (SELECT duplicate_team_season_pair_count FROM duplicate_team_pairs) AS duplicate_team_season_pair_count;

-- ==================================================
-- RESULT BLOCK B - Teamdaten (Counts je Feld)
-- ==================================================
WITH current_season AS (
  SELECT id AS season_id
  FROM public.seasons
  WHERE is_current = true
),
current_guard AS (
  SELECT COUNT(*) AS current_season_count
  FROM current_season
),
team_base AS (
  SELECT
    t.id AS team_id,
    COUNT(ts.id) AS current_team_season_match_count,
    ARRAY_AGG(ts.id::text ORDER BY ts.id::text) FILTER (WHERE ts.id IS NOT NULL) AS matched_team_season_ids
  FROM public.teams AS t
  LEFT JOIN current_season AS cs ON TRUE
  LEFT JOIN public.team_seasons AS ts
    ON ts.team_id = t.id
   AND ts.season_id = cs.season_id
  GROUP BY t.id
),
team_target AS (
  SELECT
    tb.team_id,
    tb.current_team_season_match_count,
    CASE
      WHEN tb.current_team_season_match_count = 1 THEN tb.matched_team_season_ids[1]::uuid
      ELSE NULL::uuid
    END AS target_team_season_id
  FROM team_base AS tb
),
team_join AS (
  SELECT
    t.id AS team_id,
    tt.current_team_season_match_count,
    tt.target_team_season_id,
    tsu.id AS resolved_team_season_id,
    (SELECT current_season_count FROM current_guard) AS current_season_count,
    t.description_de,
    t.description_en,
    t.training_times_de,
    t.training_times_en,
    t.team_image_url,
    t.contact_name,
    t.contact_email,
    t.contact_phone,
    t.contact_image_url,
    t.fussball_de_matches_widget_url,
    t.fussball_de_matches_url,
    t.dfb_matches_widget_url,
    t.fussball_de_table_widget_url,
    t.fussball_de_table_url,
    t.dfb_table_widget_url,
    t.fussball_de_team_id,
    t.fussball_de_competition_id,
    t.fussball_de_club_id,
    t.fupa_matches_widget_id,
    t.fupa_table_widget_id,
    t.fupa_club_url,
    tsu.description_de AS ts_description_de,
    tsu.description_en AS ts_description_en,
    tsu.training_times_de AS ts_training_times_de,
    tsu.training_times_en AS ts_training_times_en,
    tsu.team_image_url AS ts_team_image_url,
    tsu.contact_name AS ts_contact_name,
    tsu.contact_email AS ts_contact_email,
    tsu.contact_phone AS ts_contact_phone,
    tsu.contact_image_url AS ts_contact_image_url,
    tsu.fussball_de_matches_widget_url AS ts_fussball_de_matches_widget_url,
    tsu.fussball_de_matches_url AS ts_fussball_de_matches_url,
    tsu.dfb_matches_widget_url AS ts_dfb_matches_widget_url,
    tsu.fussball_de_table_widget_url AS ts_fussball_de_table_widget_url,
    tsu.fussball_de_table_url AS ts_fussball_de_table_url,
    tsu.dfb_table_widget_url AS ts_dfb_table_widget_url,
    tsu.fussball_de_team_id AS ts_fussball_de_team_id,
    tsu.fussball_de_competition_id AS ts_fussball_de_competition_id,
    tsu.fussball_de_club_id AS ts_fussball_de_club_id,
    tsu.fupa_matches_widget_id AS ts_fupa_matches_widget_id,
    tsu.fupa_table_widget_id AS ts_fupa_table_widget_id,
    tsu.fupa_club_url AS ts_fupa_club_url
  FROM public.teams AS t
  LEFT JOIN team_target AS tt
    ON tt.team_id = t.id
  LEFT JOIN public.team_seasons AS tsu
    ON tsu.id = tt.target_team_season_id
),
team_field_rows AS (
  SELECT team_id, resolved_team_season_id AS target_team_season_id, current_season_count, current_team_season_match_count, 'description_de' AS field_key, NULLIF(btrim(description_de), '') AS legacy_value, NULLIF(btrim(ts_description_de), '') AS target_value FROM team_join
  UNION ALL
  SELECT team_id, resolved_team_season_id, current_season_count, current_team_season_match_count, 'description_en', NULLIF(btrim(description_en), ''), NULLIF(btrim(ts_description_en), '') FROM team_join
  UNION ALL
  SELECT team_id, resolved_team_season_id, current_season_count, current_team_season_match_count, 'training_times_de', NULLIF(btrim(training_times_de), ''), NULLIF(btrim(ts_training_times_de), '') FROM team_join
  UNION ALL
  SELECT team_id, resolved_team_season_id, current_season_count, current_team_season_match_count, 'training_times_en', NULLIF(btrim(training_times_en), ''), NULLIF(btrim(ts_training_times_en), '') FROM team_join
  UNION ALL
  SELECT team_id, resolved_team_season_id, current_season_count, current_team_season_match_count, 'team_image_url', NULLIF(btrim(team_image_url), ''), NULLIF(btrim(ts_team_image_url), '') FROM team_join
  UNION ALL
  SELECT team_id, resolved_team_season_id, current_season_count, current_team_season_match_count, 'contact_name', NULLIF(btrim(contact_name), ''), NULLIF(btrim(ts_contact_name), '') FROM team_join
  UNION ALL
  SELECT team_id, resolved_team_season_id, current_season_count, current_team_season_match_count, 'contact_email', NULLIF(btrim(contact_email), ''), NULLIF(btrim(ts_contact_email), '') FROM team_join
  UNION ALL
  SELECT team_id, resolved_team_season_id, current_season_count, current_team_season_match_count, 'contact_phone', NULLIF(btrim(contact_phone), ''), NULLIF(btrim(ts_contact_phone), '') FROM team_join
  UNION ALL
  SELECT team_id, resolved_team_season_id, current_season_count, current_team_season_match_count, 'contact_image_url', NULLIF(btrim(contact_image_url), ''), NULLIF(btrim(ts_contact_image_url), '') FROM team_join
  UNION ALL
  SELECT team_id, resolved_team_season_id, current_season_count, current_team_season_match_count, 'fussball_de_matches_widget_url', NULLIF(btrim(fussball_de_matches_widget_url), ''), NULLIF(btrim(ts_fussball_de_matches_widget_url), '') FROM team_join
  UNION ALL
  SELECT team_id, resolved_team_season_id, current_season_count, current_team_season_match_count, 'fussball_de_matches_url', NULLIF(btrim(fussball_de_matches_url), ''), NULLIF(btrim(ts_fussball_de_matches_url), '') FROM team_join
  UNION ALL
  SELECT team_id, resolved_team_season_id, current_season_count, current_team_season_match_count, 'dfb_matches_widget_url', NULLIF(btrim(dfb_matches_widget_url), ''), NULLIF(btrim(ts_dfb_matches_widget_url), '') FROM team_join
  UNION ALL
  SELECT team_id, resolved_team_season_id, current_season_count, current_team_season_match_count, 'fussball_de_table_widget_url', NULLIF(btrim(fussball_de_table_widget_url), ''), NULLIF(btrim(ts_fussball_de_table_widget_url), '') FROM team_join
  UNION ALL
  SELECT team_id, resolved_team_season_id, current_season_count, current_team_season_match_count, 'fussball_de_table_url', NULLIF(btrim(fussball_de_table_url), ''), NULLIF(btrim(ts_fussball_de_table_url), '') FROM team_join
  UNION ALL
  SELECT team_id, resolved_team_season_id, current_season_count, current_team_season_match_count, 'dfb_table_widget_url', NULLIF(btrim(dfb_table_widget_url), ''), NULLIF(btrim(ts_dfb_table_widget_url), '') FROM team_join
  UNION ALL
  SELECT team_id, resolved_team_season_id, current_season_count, current_team_season_match_count, 'fussball_de_team_id', NULLIF(btrim(fussball_de_team_id), ''), NULLIF(btrim(ts_fussball_de_team_id), '') FROM team_join
  UNION ALL
  SELECT team_id, resolved_team_season_id, current_season_count, current_team_season_match_count, 'fussball_de_competition_id', NULLIF(btrim(fussball_de_competition_id), ''), NULLIF(btrim(ts_fussball_de_competition_id), '') FROM team_join
  UNION ALL
  SELECT team_id, resolved_team_season_id, current_season_count, current_team_season_match_count, 'fussball_de_club_id', NULLIF(btrim(fussball_de_club_id), ''), NULLIF(btrim(ts_fussball_de_club_id), '') FROM team_join
  UNION ALL
  SELECT team_id, resolved_team_season_id, current_season_count, current_team_season_match_count, 'fupa_matches_widget_id', NULLIF(btrim(fupa_matches_widget_id), ''), NULLIF(btrim(ts_fupa_matches_widget_id), '') FROM team_join
  UNION ALL
  SELECT team_id, resolved_team_season_id, current_season_count, current_team_season_match_count, 'fupa_table_widget_id', NULLIF(btrim(fupa_table_widget_id), ''), NULLIF(btrim(ts_fupa_table_widget_id), '') FROM team_join
  UNION ALL
  SELECT team_id, resolved_team_season_id, current_season_count, current_team_season_match_count, 'fupa_club_url', NULLIF(btrim(fupa_club_url), ''), NULLIF(btrim(ts_fupa_club_url), '') FROM team_join
)
SELECT
  field_key,
  COUNT(*) FILTER (
    WHERE current_season_count = 1
      AND current_team_season_match_count = 1
      AND legacy_value IS NOT NULL
      AND target_value IS NULL
  ) AS transfer_candidates,
  COUNT(*) FILTER (
    WHERE current_season_count = 1
      AND current_team_season_match_count = 1
      AND target_value IS NOT NULL
  ) AS already_existing_target_values,
  COUNT(*) FILTER (
    WHERE current_season_count = 1
      AND current_team_season_match_count = 1
      AND legacy_value IS NOT NULL
      AND target_value IS NOT NULL
      AND legacy_value <> target_value
  ) AS differing_legacy_target_values,
  COUNT(*) FILTER (
    WHERE legacy_value IS NOT NULL
      AND current_team_season_match_count = 0
  ) AS skipped_missing_team_season,
  COUNT(*) FILTER (
    WHERE legacy_value IS NOT NULL
      AND (
        current_team_season_match_count > 1
        OR current_season_count <> 1
      )
  ) AS skipped_ambiguity
FROM team_field_rows
GROUP BY field_key
ORDER BY field_key;

-- Technical IDs only for team-field conflicts/skips.
WITH current_season AS (
  SELECT id AS season_id
  FROM public.seasons
  WHERE is_current = true
),
current_guard AS (
  SELECT COUNT(*) AS current_season_count
  FROM current_season
),
team_base AS (
  SELECT
    t.id AS team_id,
    COUNT(ts.id) AS current_team_season_match_count,
    ARRAY_AGG(ts.id::text ORDER BY ts.id::text) FILTER (WHERE ts.id IS NOT NULL) AS matched_team_season_ids
  FROM public.teams AS t
  LEFT JOIN current_season AS cs ON TRUE
  LEFT JOIN public.team_seasons AS ts
    ON ts.team_id = t.id
   AND ts.season_id = cs.season_id
  GROUP BY t.id
),
team_target AS (
  SELECT
    tb.team_id,
    tb.current_team_season_match_count,
    CASE
      WHEN tb.current_team_season_match_count = 1 THEN tb.matched_team_season_ids[1]::uuid
      ELSE NULL::uuid
    END AS target_team_season_id
  FROM team_base AS tb
),
team_join AS (
  SELECT
    t.id AS team_id,
    tt.current_team_season_match_count,
    tt.target_team_season_id,
    tsu.id AS resolved_team_season_id,
    (SELECT current_season_count FROM current_guard) AS current_season_count,
    t.description_de,
    t.description_en,
    t.training_times_de,
    t.training_times_en,
    t.team_image_url,
    t.contact_name,
    t.contact_email,
    t.contact_phone,
    t.contact_image_url,
    t.fussball_de_matches_widget_url,
    t.fussball_de_matches_url,
    t.dfb_matches_widget_url,
    t.fussball_de_table_widget_url,
    t.fussball_de_table_url,
    t.dfb_table_widget_url,
    t.fussball_de_team_id,
    t.fussball_de_competition_id,
    t.fussball_de_club_id,
    t.fupa_matches_widget_id,
    t.fupa_table_widget_id,
    t.fupa_club_url,
    tsu.description_de AS ts_description_de,
    tsu.description_en AS ts_description_en,
    tsu.training_times_de AS ts_training_times_de,
    tsu.training_times_en AS ts_training_times_en,
    tsu.team_image_url AS ts_team_image_url,
    tsu.contact_name AS ts_contact_name,
    tsu.contact_email AS ts_contact_email,
    tsu.contact_phone AS ts_contact_phone,
    tsu.contact_image_url AS ts_contact_image_url,
    tsu.fussball_de_matches_widget_url AS ts_fussball_de_matches_widget_url,
    tsu.fussball_de_matches_url AS ts_fussball_de_matches_url,
    tsu.dfb_matches_widget_url AS ts_dfb_matches_widget_url,
    tsu.fussball_de_table_widget_url AS ts_fussball_de_table_widget_url,
    tsu.fussball_de_table_url AS ts_fussball_de_table_url,
    tsu.dfb_table_widget_url AS ts_dfb_table_widget_url,
    tsu.fussball_de_team_id AS ts_fussball_de_team_id,
    tsu.fussball_de_competition_id AS ts_fussball_de_competition_id,
    tsu.fussball_de_club_id AS ts_fussball_de_club_id,
    tsu.fupa_matches_widget_id AS ts_fupa_matches_widget_id,
    tsu.fupa_table_widget_id AS ts_fupa_table_widget_id,
    tsu.fupa_club_url AS ts_fupa_club_url
  FROM public.teams AS t
  LEFT JOIN team_target AS tt
    ON tt.team_id = t.id
  LEFT JOIN public.team_seasons AS tsu
    ON tsu.id = tt.target_team_season_id
),
team_field_rows AS (
  SELECT team_id, resolved_team_season_id AS target_team_season_id, current_season_count, current_team_season_match_count, 'description_de' AS field_key, NULLIF(btrim(description_de), '') AS legacy_value, NULLIF(btrim(ts_description_de), '') AS target_value FROM team_join
  UNION ALL
  SELECT team_id, resolved_team_season_id, current_season_count, current_team_season_match_count, 'description_en', NULLIF(btrim(description_en), ''), NULLIF(btrim(ts_description_en), '') FROM team_join
  UNION ALL
  SELECT team_id, resolved_team_season_id, current_season_count, current_team_season_match_count, 'training_times_de', NULLIF(btrim(training_times_de), ''), NULLIF(btrim(ts_training_times_de), '') FROM team_join
  UNION ALL
  SELECT team_id, resolved_team_season_id, current_season_count, current_team_season_match_count, 'training_times_en', NULLIF(btrim(training_times_en), ''), NULLIF(btrim(ts_training_times_en), '') FROM team_join
  UNION ALL
  SELECT team_id, resolved_team_season_id, current_season_count, current_team_season_match_count, 'team_image_url', NULLIF(btrim(team_image_url), ''), NULLIF(btrim(ts_team_image_url), '') FROM team_join
  UNION ALL
  SELECT team_id, resolved_team_season_id, current_season_count, current_team_season_match_count, 'contact_name', NULLIF(btrim(contact_name), ''), NULLIF(btrim(ts_contact_name), '') FROM team_join
  UNION ALL
  SELECT team_id, resolved_team_season_id, current_season_count, current_team_season_match_count, 'contact_email', NULLIF(btrim(contact_email), ''), NULLIF(btrim(ts_contact_email), '') FROM team_join
  UNION ALL
  SELECT team_id, resolved_team_season_id, current_season_count, current_team_season_match_count, 'contact_phone', NULLIF(btrim(contact_phone), ''), NULLIF(btrim(ts_contact_phone), '') FROM team_join
  UNION ALL
  SELECT team_id, resolved_team_season_id, current_season_count, current_team_season_match_count, 'contact_image_url', NULLIF(btrim(contact_image_url), ''), NULLIF(btrim(ts_contact_image_url), '') FROM team_join
  UNION ALL
  SELECT team_id, resolved_team_season_id, current_season_count, current_team_season_match_count, 'fussball_de_matches_widget_url', NULLIF(btrim(fussball_de_matches_widget_url), ''), NULLIF(btrim(ts_fussball_de_matches_widget_url), '') FROM team_join
  UNION ALL
  SELECT team_id, resolved_team_season_id, current_season_count, current_team_season_match_count, 'fussball_de_matches_url', NULLIF(btrim(fussball_de_matches_url), ''), NULLIF(btrim(ts_fussball_de_matches_url), '') FROM team_join
  UNION ALL
  SELECT team_id, resolved_team_season_id, current_season_count, current_team_season_match_count, 'dfb_matches_widget_url', NULLIF(btrim(dfb_matches_widget_url), ''), NULLIF(btrim(ts_dfb_matches_widget_url), '') FROM team_join
  UNION ALL
  SELECT team_id, resolved_team_season_id, current_season_count, current_team_season_match_count, 'fussball_de_table_widget_url', NULLIF(btrim(fussball_de_table_widget_url), ''), NULLIF(btrim(ts_fussball_de_table_widget_url), '') FROM team_join
  UNION ALL
  SELECT team_id, resolved_team_season_id, current_season_count, current_team_season_match_count, 'fussball_de_table_url', NULLIF(btrim(fussball_de_table_url), ''), NULLIF(btrim(ts_fussball_de_table_url), '') FROM team_join
  UNION ALL
  SELECT team_id, resolved_team_season_id, current_season_count, current_team_season_match_count, 'dfb_table_widget_url', NULLIF(btrim(dfb_table_widget_url), ''), NULLIF(btrim(ts_dfb_table_widget_url), '') FROM team_join
  UNION ALL
  SELECT team_id, resolved_team_season_id, current_season_count, current_team_season_match_count, 'fussball_de_team_id', NULLIF(btrim(fussball_de_team_id), ''), NULLIF(btrim(ts_fussball_de_team_id), '') FROM team_join
  UNION ALL
  SELECT team_id, resolved_team_season_id, current_season_count, current_team_season_match_count, 'fussball_de_competition_id', NULLIF(btrim(fussball_de_competition_id), ''), NULLIF(btrim(ts_fussball_de_competition_id), '') FROM team_join
  UNION ALL
  SELECT team_id, resolved_team_season_id, current_season_count, current_team_season_match_count, 'fussball_de_club_id', NULLIF(btrim(fussball_de_club_id), ''), NULLIF(btrim(ts_fussball_de_club_id), '') FROM team_join
  UNION ALL
  SELECT team_id, resolved_team_season_id, current_season_count, current_team_season_match_count, 'fupa_matches_widget_id', NULLIF(btrim(fupa_matches_widget_id), ''), NULLIF(btrim(ts_fupa_matches_widget_id), '') FROM team_join
  UNION ALL
  SELECT team_id, resolved_team_season_id, current_season_count, current_team_season_match_count, 'fupa_table_widget_id', NULLIF(btrim(fupa_table_widget_id), ''), NULLIF(btrim(ts_fupa_table_widget_id), '') FROM team_join
  UNION ALL
  SELECT team_id, resolved_team_season_id, current_season_count, current_team_season_match_count, 'fupa_club_url', NULLIF(btrim(fupa_club_url), ''), NULLIF(btrim(ts_fupa_club_url), '') FROM team_join
),
conflict_rows AS (
  SELECT
    field_key,
    team_id,
    target_team_season_id,
    CASE
      WHEN current_season_count <> 1 THEN 'current_season_not_unique'
      WHEN current_team_season_match_count = 0 THEN 'missing_team_season'
      WHEN current_team_season_match_count > 1 THEN 'ambiguous_team_season'
      WHEN legacy_value IS NOT NULL AND target_value IS NOT NULL AND legacy_value <> target_value THEN 'legacy_target_mismatch'
      ELSE NULL
    END AS conflict_type
  FROM team_field_rows
)
SELECT
  field_key,
  team_id,
  target_team_season_id,
  conflict_type
FROM conflict_rows
WHERE conflict_type IS NOT NULL
ORDER BY field_key, team_id;

-- ==================================================
-- RESULT BLOCK C - Spieler-Zuordnungen
-- ==================================================
WITH current_season AS (
  SELECT id AS season_id
  FROM public.seasons
  WHERE is_current = true
),
current_guard AS (
  SELECT COUNT(*) AS cnt FROM current_season
),
team_season_candidates AS (
  SELECT
    p.id AS player_id,
    p.team_id AS legacy_team_id,
    COUNT(ts.id) AS team_season_match_count,
    ARRAY_AGG(ts.id::text ORDER BY ts.id::text) FILTER (WHERE ts.id IS NOT NULL) AS matched_team_season_ids
  FROM public.players AS p
  LEFT JOIN current_season AS cs ON TRUE
  LEFT JOIN public.team_seasons AS ts
    ON ts.team_id = p.team_id
   AND ts.season_id = cs.season_id
  WHERE p.team_id IS NOT NULL
  GROUP BY p.id, p.team_id
),
player_active_rel AS (
  SELECT player_id, COUNT(*) AS active_rel_count
  FROM public.player_team_seasons
  WHERE is_active = true
  GROUP BY player_id
),
player_pair_exists AS (
  SELECT
    tsc.player_id,
    CASE
      WHEN tsc.team_season_match_count = 1 THEN (
        SELECT COUNT(*)
        FROM public.player_team_seasons AS pts
        WHERE pts.player_id = tsc.player_id
          AND pts.team_season_id::text = tsc.matched_team_season_ids[1]
      )
      ELSE 0
    END AS pair_rel_count
  FROM team_season_candidates AS tsc
),
player_conflict_legacy_vs_season AS (
  SELECT DISTINCT p.id AS player_id
  FROM public.players AS p
  JOIN public.player_team_seasons AS pts
    ON pts.player_id = p.id
  JOIN public.team_seasons AS ts
    ON ts.id = pts.team_season_id
  WHERE p.team_id IS NOT NULL
    AND p.team_id <> ts.team_id
),
player_eval AS (
  SELECT
    p.id AS player_id,
    p.team_id AS legacy_team_id,
    CASE
      WHEN COALESCE(tsc.team_season_match_count, 0) = 1 THEN tsc.matched_team_season_ids[1]::uuid
      ELSE NULL::uuid
    END AS target_team_season_id,
    COALESCE(p.shirt_number, p.jersey_number) AS resolved_shirt_number,
    COALESCE(NULLIF(btrim(p.position_de), ''), NULLIF(btrim(p.position), '')) AS resolved_position_de,
    COALESCE(NULLIF(btrim(p.position_en), ''), NULLIF(btrim(p.position), '')) AS resolved_position_en,
    COALESCE(p.is_captain, false) AS resolved_is_captain,
    COALESCE(p.sort_order, 0) AS resolved_sort_order,
    CASE
      WHEN p.team_id IS NOT NULL
       AND (SELECT cnt FROM current_guard) = 1
       AND COALESCE(tsc.team_season_match_count, 0) = 1
       AND COALESCE(par.active_rel_count, 0) = 0
       AND COALESCE(pps.pair_rel_count, 0) = 0
      THEN 'SAFE_INSERT_CANDIDATE'
      ELSE 'SKIP'
    END AS candidate_status,
    CASE
      WHEN p.team_id IS NULL THEN 'missing_legacy_team_id'
      WHEN (SELECT cnt FROM current_guard) <> 1 THEN 'current_season_not_unique'
      WHEN COALESCE(tsc.team_season_match_count, 0) > 1 THEN 'ambiguous_team_season'
      WHEN COALESCE(tsc.team_season_match_count, 0) = 0 THEN 'missing_team_season'
      WHEN COALESCE(par.active_rel_count, 0) > 0 THEN 'existing_active_assignment'
      WHEN COALESCE(pps.pair_rel_count, 0) > 0 THEN 'existing_target_pair'
      ELSE 'safe'
    END AS skip_reason
  FROM public.players AS p
  LEFT JOIN team_season_candidates AS tsc ON tsc.player_id = p.id
  LEFT JOIN player_active_rel AS par ON par.player_id = p.id
  LEFT JOIN player_pair_exists AS pps ON pps.player_id = p.id
)
SELECT
  (SELECT COUNT(*) FROM public.players) AS total_players,
  (SELECT COUNT(*) FROM public.players WHERE team_id IS NOT NULL) AS players_with_legacy_team_id,
  (SELECT COUNT(*) FROM player_active_rel WHERE active_rel_count > 0) AS players_with_active_season_assignment,
  (SELECT COUNT(*) FROM player_eval WHERE candidate_status = 'SAFE_INSERT_CANDIDATE') AS safe_player_insert_candidates,
  (SELECT COUNT(*) FROM player_eval WHERE skip_reason = 'existing_active_assignment') AS players_skipped_existing_assignment,
  (SELECT COUNT(*) FROM player_eval WHERE skip_reason = 'missing_team_season') AS players_skipped_missing_team_season,
  (SELECT COUNT(*) FROM player_eval WHERE skip_reason = 'ambiguous_team_season') AS players_skipped_ambiguous_team_season,
  (SELECT COUNT(*) FROM player_conflict_legacy_vs_season) AS players_with_conflicting_legacy_and_season_team,
  (
    SELECT COUNT(*)
    FROM public.players
    WHERE (image_url IS NULL OR btrim(image_url) = '')
      AND photo_url IS NOT NULL
      AND btrim(photo_url) <> ''
  ) AS players_with_image_fallback_candidate;

-- Technical player candidate list (no PII fields).
WITH current_season AS (
  SELECT id AS season_id
  FROM public.seasons
  WHERE is_current = true
),
current_guard AS (
  SELECT COUNT(*) AS cnt FROM current_season
),
team_season_candidates AS (
  SELECT
    p.id AS player_id,
    p.team_id AS legacy_team_id,
    COUNT(ts.id) AS team_season_match_count,
    ARRAY_AGG(ts.id::text ORDER BY ts.id::text) FILTER (WHERE ts.id IS NOT NULL) AS matched_team_season_ids
  FROM public.players AS p
  LEFT JOIN current_season AS cs ON TRUE
  LEFT JOIN public.team_seasons AS ts
    ON ts.team_id = p.team_id
   AND ts.season_id = cs.season_id
  WHERE p.team_id IS NOT NULL
  GROUP BY p.id, p.team_id
),
player_active_rel AS (
  SELECT player_id, COUNT(*) AS active_rel_count
  FROM public.player_team_seasons
  WHERE is_active = true
  GROUP BY player_id
),
player_pair_exists AS (
  SELECT
    tsc.player_id,
    CASE
      WHEN tsc.team_season_match_count = 1 THEN (
        SELECT COUNT(*)
        FROM public.player_team_seasons AS pts
        WHERE pts.player_id = tsc.player_id
          AND pts.team_season_id::text = tsc.matched_team_season_ids[1]
      )
      ELSE 0
    END AS pair_rel_count
  FROM team_season_candidates AS tsc
),
player_eval AS (
  SELECT
    p.id AS player_id,
    p.team_id AS legacy_team_id,
    CASE
      WHEN COALESCE(tsc.team_season_match_count, 0) = 1 THEN tsc.matched_team_season_ids[1]::uuid
      ELSE NULL::uuid
    END AS target_team_season_id,
    COALESCE(p.shirt_number, p.jersey_number) AS resolved_shirt_number,
    COALESCE(NULLIF(btrim(p.position_de), ''), NULLIF(btrim(p.position), '')) AS resolved_position_de,
    COALESCE(NULLIF(btrim(p.position_en), ''), NULLIF(btrim(p.position), '')) AS resolved_position_en,
    COALESCE(p.is_captain, false) AS resolved_is_captain,
    COALESCE(p.sort_order, 0) AS resolved_sort_order,
    CASE
      WHEN p.team_id IS NOT NULL
       AND (SELECT cnt FROM current_guard) = 1
       AND COALESCE(tsc.team_season_match_count, 0) = 1
       AND COALESCE(par.active_rel_count, 0) = 0
       AND COALESCE(pps.pair_rel_count, 0) = 0
      THEN 'SAFE_INSERT_CANDIDATE'
      ELSE 'SKIP'
    END AS candidate_status,
    CASE
      WHEN p.team_id IS NULL THEN 'missing_legacy_team_id'
      WHEN (SELECT cnt FROM current_guard) <> 1 THEN 'current_season_not_unique'
      WHEN COALESCE(tsc.team_season_match_count, 0) > 1 THEN 'ambiguous_team_season'
      WHEN COALESCE(tsc.team_season_match_count, 0) = 0 THEN 'missing_team_season'
      WHEN COALESCE(par.active_rel_count, 0) > 0 THEN 'existing_active_assignment'
      WHEN COALESCE(pps.pair_rel_count, 0) > 0 THEN 'existing_target_pair'
      ELSE 'safe'
    END AS skip_reason
  FROM public.players AS p
  LEFT JOIN team_season_candidates AS tsc ON tsc.player_id = p.id
  LEFT JOIN player_active_rel AS par ON par.player_id = p.id
  LEFT JOIN player_pair_exists AS pps ON pps.player_id = p.id
)
SELECT
  player_id,
  legacy_team_id,
  target_team_season_id,
  resolved_shirt_number,
  resolved_position_de,
  resolved_position_en,
  resolved_is_captain,
  resolved_sort_order,
  candidate_status,
  skip_reason
FROM player_eval
ORDER BY player_id;

-- ==================================================
-- RESULT BLOCK D - Coach-Zuordnungen
-- ==================================================
WITH current_season AS (
  SELECT id AS season_id
  FROM public.seasons
  WHERE is_current = true
),
current_guard AS (
  SELECT COUNT(*) AS cnt FROM current_season
),
team_season_candidates AS (
  SELECT
    c.id AS coach_id,
    c.team_id AS legacy_team_id,
    COUNT(ts.id) AS team_season_match_count,
    ARRAY_AGG(ts.id::text ORDER BY ts.id::text) FILTER (WHERE ts.id IS NOT NULL) AS matched_team_season_ids
  FROM public.coaches AS c
  LEFT JOIN current_season AS cs ON TRUE
  LEFT JOIN public.team_seasons AS ts
    ON ts.team_id = c.team_id
   AND ts.season_id = cs.season_id
  WHERE c.team_id IS NOT NULL
  GROUP BY c.id, c.team_id
),
coach_active_rel AS (
  SELECT coach_id, COUNT(*) AS active_rel_count
  FROM public.coach_team_seasons
  WHERE is_active = true
  GROUP BY coach_id
),
coach_pair_exists AS (
  SELECT
    tsc.coach_id,
    CASE
      WHEN tsc.team_season_match_count = 1 THEN (
        SELECT COUNT(*)
        FROM public.coach_team_seasons AS cts
        WHERE cts.coach_id = tsc.coach_id
          AND cts.team_season_id::text = tsc.matched_team_season_ids[1]
      )
      ELSE 0
    END AS pair_rel_count
  FROM team_season_candidates AS tsc
),
coach_conflict_legacy_vs_season AS (
  SELECT DISTINCT c.id AS coach_id
  FROM public.coaches AS c
  JOIN public.coach_team_seasons AS cts
    ON cts.coach_id = c.id
  JOIN public.team_seasons AS ts
    ON ts.id = cts.team_season_id
  WHERE c.team_id IS NOT NULL
    AND c.team_id <> ts.team_id
),
coach_eval AS (
  SELECT
    c.id AS coach_id,
    c.team_id AS legacy_team_id,
    CASE
      WHEN COALESCE(tsc.team_season_match_count, 0) = 1 THEN tsc.matched_team_season_ids[1]::uuid
      ELSE NULL::uuid
    END AS target_team_season_id,
    COALESCE(NULLIF(btrim(c.role_de), ''), NULLIF(btrim(c.role), ''), 'Trainer') AS resolved_role_de,
    COALESCE(NULLIF(btrim(c.role_en), ''), NULLIF(btrim(c.role), ''), 'Coach') AS resolved_role_en,
    COALESCE(c.sort_order, 0) AS resolved_sort_order,
    CASE
      WHEN c.team_id IS NOT NULL
       AND (SELECT cnt FROM current_guard) = 1
       AND COALESCE(tsc.team_season_match_count, 0) = 1
       AND COALESCE(car.active_rel_count, 0) = 0
       AND COALESCE(cpe.pair_rel_count, 0) = 0
      THEN 'SAFE_INSERT_CANDIDATE'
      ELSE 'SKIP'
    END AS candidate_status,
    CASE
      WHEN c.team_id IS NULL THEN 'missing_legacy_team_id'
      WHEN (SELECT cnt FROM current_guard) <> 1 THEN 'current_season_not_unique'
      WHEN COALESCE(tsc.team_season_match_count, 0) > 1 THEN 'ambiguous_team_season'
      WHEN COALESCE(tsc.team_season_match_count, 0) = 0 THEN 'missing_team_season'
      WHEN COALESCE(car.active_rel_count, 0) > 0 THEN 'existing_active_assignment'
      WHEN COALESCE(cpe.pair_rel_count, 0) > 0 THEN 'existing_target_pair'
      ELSE 'safe'
    END AS skip_reason
  FROM public.coaches AS c
  LEFT JOIN team_season_candidates AS tsc ON tsc.coach_id = c.id
  LEFT JOIN coach_active_rel AS car ON car.coach_id = c.id
  LEFT JOIN coach_pair_exists AS cpe ON cpe.coach_id = c.id
)
SELECT
  (SELECT COUNT(*) FROM public.coaches) AS total_coaches,
  (SELECT COUNT(*) FROM public.coaches WHERE team_id IS NOT NULL) AS coaches_with_legacy_team_id,
  (SELECT COUNT(*) FROM coach_active_rel WHERE active_rel_count > 0) AS coaches_with_active_season_assignment,
  (SELECT COUNT(*) FROM coach_eval WHERE candidate_status = 'SAFE_INSERT_CANDIDATE') AS safe_coach_insert_candidates,
  (SELECT COUNT(*) FROM coach_eval WHERE skip_reason = 'existing_active_assignment') AS coaches_skipped_existing_assignment,
  (SELECT COUNT(*) FROM coach_eval WHERE skip_reason = 'missing_team_season') AS coaches_skipped_missing_team_season,
  (SELECT COUNT(*) FROM coach_eval WHERE skip_reason = 'ambiguous_team_season') AS coaches_skipped_ambiguous_team_season,
  (SELECT COUNT(*) FROM coach_conflict_legacy_vs_season) AS coaches_with_conflicting_legacy_and_season_team,
  (
    SELECT COUNT(*)
    FROM public.coaches
    WHERE (image_url IS NULL OR btrim(image_url) = '')
      AND photo_url IS NOT NULL
      AND btrim(photo_url) <> ''
  ) AS coaches_with_image_fallback_candidate;

-- Technical coach candidate list (no PII fields).
WITH current_season AS (
  SELECT id AS season_id
  FROM public.seasons
  WHERE is_current = true
),
current_guard AS (
  SELECT COUNT(*) AS cnt FROM current_season
),
team_season_candidates AS (
  SELECT
    c.id AS coach_id,
    c.team_id AS legacy_team_id,
    COUNT(ts.id) AS team_season_match_count,
    ARRAY_AGG(ts.id::text ORDER BY ts.id::text) FILTER (WHERE ts.id IS NOT NULL) AS matched_team_season_ids
  FROM public.coaches AS c
  LEFT JOIN current_season AS cs ON TRUE
  LEFT JOIN public.team_seasons AS ts
    ON ts.team_id = c.team_id
   AND ts.season_id = cs.season_id
  WHERE c.team_id IS NOT NULL
  GROUP BY c.id, c.team_id
),
coach_active_rel AS (
  SELECT coach_id, COUNT(*) AS active_rel_count
  FROM public.coach_team_seasons
  WHERE is_active = true
  GROUP BY coach_id
),
coach_pair_exists AS (
  SELECT
    tsc.coach_id,
    CASE
      WHEN tsc.team_season_match_count = 1 THEN (
        SELECT COUNT(*)
        FROM public.coach_team_seasons AS cts
        WHERE cts.coach_id = tsc.coach_id
          AND cts.team_season_id::text = tsc.matched_team_season_ids[1]
      )
      ELSE 0
    END AS pair_rel_count
  FROM team_season_candidates AS tsc
),
coach_eval AS (
  SELECT
    c.id AS coach_id,
    c.team_id AS legacy_team_id,
    CASE
      WHEN COALESCE(tsc.team_season_match_count, 0) = 1 THEN tsc.matched_team_season_ids[1]::uuid
      ELSE NULL::uuid
    END AS target_team_season_id,
    COALESCE(NULLIF(btrim(c.role_de), ''), NULLIF(btrim(c.role), ''), 'Trainer') AS resolved_role_de,
    COALESCE(NULLIF(btrim(c.role_en), ''), NULLIF(btrim(c.role), ''), 'Coach') AS resolved_role_en,
    COALESCE(c.sort_order, 0) AS resolved_sort_order,
    CASE
      WHEN c.team_id IS NOT NULL
       AND (SELECT cnt FROM current_guard) = 1
       AND COALESCE(tsc.team_season_match_count, 0) = 1
       AND COALESCE(car.active_rel_count, 0) = 0
       AND COALESCE(cpe.pair_rel_count, 0) = 0
      THEN 'SAFE_INSERT_CANDIDATE'
      ELSE 'SKIP'
    END AS candidate_status,
    CASE
      WHEN c.team_id IS NULL THEN 'missing_legacy_team_id'
      WHEN (SELECT cnt FROM current_guard) <> 1 THEN 'current_season_not_unique'
      WHEN COALESCE(tsc.team_season_match_count, 0) > 1 THEN 'ambiguous_team_season'
      WHEN COALESCE(tsc.team_season_match_count, 0) = 0 THEN 'missing_team_season'
      WHEN COALESCE(car.active_rel_count, 0) > 0 THEN 'existing_active_assignment'
      WHEN COALESCE(cpe.pair_rel_count, 0) > 0 THEN 'existing_target_pair'
      ELSE 'safe'
    END AS skip_reason
  FROM public.coaches AS c
  LEFT JOIN team_season_candidates AS tsc ON tsc.coach_id = c.id
  LEFT JOIN coach_active_rel AS car ON car.coach_id = c.id
  LEFT JOIN coach_pair_exists AS cpe ON cpe.coach_id = c.id
)
SELECT
  coach_id,
  legacy_team_id,
  target_team_season_id,
  resolved_role_de,
  resolved_role_en,
  resolved_sort_order,
  candidate_status,
  skip_reason
FROM coach_eval
ORDER BY coach_id;

-- ==================================================
-- RESULT BLOCK E - Bild-Fallbacks
-- ==================================================
SELECT
  (SELECT COUNT(*) FROM public.players WHERE (image_url IS NULL OR btrim(image_url) = '') AND photo_url IS NOT NULL AND btrim(photo_url) <> '') AS players_image_update_candidates,
  (SELECT COUNT(*) FROM public.players WHERE image_url IS NOT NULL AND btrim(image_url) <> '' AND photo_url IS NOT NULL AND btrim(photo_url) <> '' AND image_url <> photo_url) AS players_image_conflicts,
  (SELECT COUNT(*) FROM public.coaches WHERE (image_url IS NULL OR btrim(image_url) = '') AND photo_url IS NOT NULL AND btrim(photo_url) <> '') AS coaches_image_update_candidates,
  (SELECT COUNT(*) FROM public.coaches WHERE image_url IS NOT NULL AND btrim(image_url) <> '' AND photo_url IS NOT NULL AND btrim(photo_url) <> '' AND image_url <> photo_url) AS coaches_image_conflicts;

-- ==================================================
-- RESULT BLOCK F - Erwartete Mutation (aus denselben CTE-Logiken)
-- ==================================================
WITH current_season AS (
  SELECT id AS season_id
  FROM public.seasons
  WHERE is_current = true
),
current_guard AS (
  SELECT COUNT(*) AS cnt
  FROM current_season
),
team_base AS (
  SELECT
    t.id AS team_id,
    COUNT(ts.id) AS current_team_season_match_count,
    ARRAY_AGG(ts.id::text ORDER BY ts.id::text) FILTER (WHERE ts.id IS NOT NULL) AS matched_team_season_ids
  FROM public.teams AS t
  LEFT JOIN current_season AS cs ON TRUE
  LEFT JOIN public.team_seasons AS ts
    ON ts.team_id = t.id
   AND ts.season_id = cs.season_id
  GROUP BY t.id
),
team_target AS (
  SELECT
    tb.team_id,
    tb.current_team_season_match_count,
    CASE
      WHEN tb.current_team_season_match_count = 1 THEN tb.matched_team_season_ids[1]::uuid
      ELSE NULL::uuid
    END AS target_team_season_id
  FROM team_base AS tb
),
team_join AS (
  SELECT
    t.id AS team_id,
    tt.current_team_season_match_count,
    tt.target_team_season_id,
    tsu.id AS resolved_team_season_id,
    (SELECT cnt FROM current_guard) AS current_season_count,
    t.description_de,
    t.description_en,
    t.training_times_de,
    t.training_times_en,
    t.team_image_url,
    t.contact_name,
    t.contact_email,
    t.contact_phone,
    t.contact_image_url,
    t.fussball_de_matches_widget_url,
    t.fussball_de_matches_url,
    t.dfb_matches_widget_url,
    t.fussball_de_table_widget_url,
    t.fussball_de_table_url,
    t.dfb_table_widget_url,
    t.fussball_de_team_id,
    t.fussball_de_competition_id,
    t.fussball_de_club_id,
    t.fupa_matches_widget_id,
    t.fupa_table_widget_id,
    t.fupa_club_url,
    tsu.description_de AS ts_description_de,
    tsu.description_en AS ts_description_en,
    tsu.training_times_de AS ts_training_times_de,
    tsu.training_times_en AS ts_training_times_en,
    tsu.team_image_url AS ts_team_image_url,
    tsu.contact_name AS ts_contact_name,
    tsu.contact_email AS ts_contact_email,
    tsu.contact_phone AS ts_contact_phone,
    tsu.contact_image_url AS ts_contact_image_url,
    tsu.fussball_de_matches_widget_url AS ts_fussball_de_matches_widget_url,
    tsu.fussball_de_matches_url AS ts_fussball_de_matches_url,
    tsu.dfb_matches_widget_url AS ts_dfb_matches_widget_url,
    tsu.fussball_de_table_widget_url AS ts_fussball_de_table_widget_url,
    tsu.fussball_de_table_url AS ts_fussball_de_table_url,
    tsu.dfb_table_widget_url AS ts_dfb_table_widget_url,
    tsu.fussball_de_team_id AS ts_fussball_de_team_id,
    tsu.fussball_de_competition_id AS ts_fussball_de_competition_id,
    tsu.fussball_de_club_id AS ts_fussball_de_club_id,
    tsu.fupa_matches_widget_id AS ts_fupa_matches_widget_id,
    tsu.fupa_table_widget_id AS ts_fupa_table_widget_id,
    tsu.fupa_club_url AS ts_fupa_club_url
  FROM public.teams AS t
  LEFT JOIN team_target AS tt
    ON tt.team_id = t.id
  LEFT JOIN public.team_seasons AS tsu
    ON tsu.id = tt.target_team_season_id
),
team_field_rows AS (
  SELECT team_id, resolved_team_season_id AS target_team_season_id, current_season_count, current_team_season_match_count, NULLIF(btrim(description_de), '') AS legacy_value, NULLIF(btrim(ts_description_de), '') AS target_value FROM team_join
  UNION ALL
  SELECT team_id, resolved_team_season_id, current_season_count, current_team_season_match_count, NULLIF(btrim(description_en), ''), NULLIF(btrim(ts_description_en), '') FROM team_join
  UNION ALL
  SELECT team_id, resolved_team_season_id, current_season_count, current_team_season_match_count, NULLIF(btrim(training_times_de), ''), NULLIF(btrim(ts_training_times_de), '') FROM team_join
  UNION ALL
  SELECT team_id, resolved_team_season_id, current_season_count, current_team_season_match_count, NULLIF(btrim(training_times_en), ''), NULLIF(btrim(ts_training_times_en), '') FROM team_join
  UNION ALL
  SELECT team_id, resolved_team_season_id, current_season_count, current_team_season_match_count, NULLIF(btrim(team_image_url), ''), NULLIF(btrim(ts_team_image_url), '') FROM team_join
  UNION ALL
  SELECT team_id, resolved_team_season_id, current_season_count, current_team_season_match_count, NULLIF(btrim(contact_name), ''), NULLIF(btrim(ts_contact_name), '') FROM team_join
  UNION ALL
  SELECT team_id, resolved_team_season_id, current_season_count, current_team_season_match_count, NULLIF(btrim(contact_email), ''), NULLIF(btrim(ts_contact_email), '') FROM team_join
  UNION ALL
  SELECT team_id, resolved_team_season_id, current_season_count, current_team_season_match_count, NULLIF(btrim(contact_phone), ''), NULLIF(btrim(ts_contact_phone), '') FROM team_join
  UNION ALL
  SELECT team_id, resolved_team_season_id, current_season_count, current_team_season_match_count, NULLIF(btrim(contact_image_url), ''), NULLIF(btrim(ts_contact_image_url), '') FROM team_join
  UNION ALL
  SELECT team_id, resolved_team_season_id, current_season_count, current_team_season_match_count, NULLIF(btrim(fussball_de_matches_widget_url), ''), NULLIF(btrim(ts_fussball_de_matches_widget_url), '') FROM team_join
  UNION ALL
  SELECT team_id, resolved_team_season_id, current_season_count, current_team_season_match_count, NULLIF(btrim(fussball_de_matches_url), ''), NULLIF(btrim(ts_fussball_de_matches_url), '') FROM team_join
  UNION ALL
  SELECT team_id, resolved_team_season_id, current_season_count, current_team_season_match_count, NULLIF(btrim(dfb_matches_widget_url), ''), NULLIF(btrim(ts_dfb_matches_widget_url), '') FROM team_join
  UNION ALL
  SELECT team_id, resolved_team_season_id, current_season_count, current_team_season_match_count, NULLIF(btrim(fussball_de_table_widget_url), ''), NULLIF(btrim(ts_fussball_de_table_widget_url), '') FROM team_join
  UNION ALL
  SELECT team_id, resolved_team_season_id, current_season_count, current_team_season_match_count, NULLIF(btrim(fussball_de_table_url), ''), NULLIF(btrim(ts_fussball_de_table_url), '') FROM team_join
  UNION ALL
  SELECT team_id, resolved_team_season_id, current_season_count, current_team_season_match_count, NULLIF(btrim(dfb_table_widget_url), ''), NULLIF(btrim(ts_dfb_table_widget_url), '') FROM team_join
  UNION ALL
  SELECT team_id, resolved_team_season_id, current_season_count, current_team_season_match_count, NULLIF(btrim(fussball_de_team_id), ''), NULLIF(btrim(ts_fussball_de_team_id), '') FROM team_join
  UNION ALL
  SELECT team_id, resolved_team_season_id, current_season_count, current_team_season_match_count, NULLIF(btrim(fussball_de_competition_id), ''), NULLIF(btrim(ts_fussball_de_competition_id), '') FROM team_join
  UNION ALL
  SELECT team_id, resolved_team_season_id, current_season_count, current_team_season_match_count, NULLIF(btrim(fussball_de_club_id), ''), NULLIF(btrim(ts_fussball_de_club_id), '') FROM team_join
  UNION ALL
  SELECT team_id, resolved_team_season_id, current_season_count, current_team_season_match_count, NULLIF(btrim(fupa_matches_widget_id), ''), NULLIF(btrim(ts_fupa_matches_widget_id), '') FROM team_join
  UNION ALL
  SELECT team_id, resolved_team_season_id, current_season_count, current_team_season_match_count, NULLIF(btrim(fupa_table_widget_id), ''), NULLIF(btrim(ts_fupa_table_widget_id), '') FROM team_join
  UNION ALL
  SELECT team_id, resolved_team_season_id, current_season_count, current_team_season_match_count, NULLIF(btrim(fupa_club_url), ''), NULLIF(btrim(ts_fupa_club_url), '') FROM team_join
),
team_expected_updates AS (
  SELECT COUNT(DISTINCT team_id) AS expected_team_season_updates
  FROM team_field_rows
  WHERE current_season_count = 1
    AND current_team_season_match_count = 1
    AND legacy_value IS NOT NULL
    AND target_value IS NULL
),
team_skips AS (
  SELECT COUNT(*) AS team_skipped_total
  FROM team_field_rows
  WHERE legacy_value IS NOT NULL
    AND (
      current_season_count <> 1
      OR current_team_season_match_count = 0
      OR current_team_season_match_count > 1
    )
),
team_conflicts AS (
  SELECT COUNT(*) AS team_conflict_total
  FROM team_field_rows
  WHERE current_season_count = 1
    AND current_team_season_match_count = 1
    AND legacy_value IS NOT NULL
    AND target_value IS NOT NULL
    AND legacy_value <> target_value
),
player_team_season_candidates AS (
  SELECT
    p.id AS player_id,
    COUNT(ts.id) AS team_season_match_count,
    ARRAY_AGG(ts.id::text ORDER BY ts.id::text) FILTER (WHERE ts.id IS NOT NULL) AS matched_team_season_ids
  FROM public.players AS p
  LEFT JOIN current_season AS cs ON TRUE
  LEFT JOIN public.team_seasons AS ts
    ON ts.team_id = p.team_id
   AND ts.season_id = cs.season_id
  WHERE p.team_id IS NOT NULL
  GROUP BY p.id
),
player_active_rel AS (
  SELECT player_id, COUNT(*) AS active_rel_count
  FROM public.player_team_seasons
  WHERE is_active = true
  GROUP BY player_id
),
player_pair_exists AS (
  SELECT
    tsc.player_id,
    CASE
      WHEN tsc.team_season_match_count = 1 THEN (
        SELECT COUNT(*)
        FROM public.player_team_seasons AS pts
        WHERE pts.player_id = tsc.player_id
          AND pts.team_season_id::text = tsc.matched_team_season_ids[1]
      )
      ELSE 0
    END AS pair_rel_count
  FROM player_team_season_candidates AS tsc
),
player_eval AS (
  SELECT
    p.id AS player_id,
    CASE
      WHEN p.team_id IS NOT NULL
       AND (SELECT cnt FROM current_guard) = 1
       AND COALESCE(tsc.team_season_match_count, 0) = 1
       AND COALESCE(par.active_rel_count, 0) = 0
       AND COALESCE(pps.pair_rel_count, 0) = 0
      THEN 'SAFE_INSERT_CANDIDATE'
      ELSE 'SKIP'
    END AS candidate_status,
    CASE
      WHEN p.team_id IS NULL THEN 'missing_legacy_team_id'
      WHEN (SELECT cnt FROM current_guard) <> 1 THEN 'current_season_not_unique'
      WHEN COALESCE(tsc.team_season_match_count, 0) > 1 THEN 'ambiguous_team_season'
      WHEN COALESCE(tsc.team_season_match_count, 0) = 0 THEN 'missing_team_season'
      WHEN COALESCE(par.active_rel_count, 0) > 0 THEN 'existing_active_assignment'
      WHEN COALESCE(pps.pair_rel_count, 0) > 0 THEN 'existing_target_pair'
      ELSE 'safe'
    END AS skip_reason
  FROM public.players AS p
  LEFT JOIN player_team_season_candidates AS tsc ON tsc.player_id = p.id
  LEFT JOIN player_active_rel AS par ON par.player_id = p.id
  LEFT JOIN player_pair_exists AS pps ON pps.player_id = p.id
),
player_conflict_legacy_vs_season AS (
  SELECT COUNT(DISTINCT p.id) AS conflict_count
  FROM public.players AS p
  JOIN public.player_team_seasons AS pts
    ON pts.player_id = p.id
  JOIN public.team_seasons AS ts
    ON ts.id = pts.team_season_id
  WHERE p.team_id IS NOT NULL
    AND p.team_id <> ts.team_id
),
coach_team_season_candidates AS (
  SELECT
    c.id AS coach_id,
    COUNT(ts.id) AS team_season_match_count,
    ARRAY_AGG(ts.id::text ORDER BY ts.id::text) FILTER (WHERE ts.id IS NOT NULL) AS matched_team_season_ids
  FROM public.coaches AS c
  LEFT JOIN current_season AS cs ON TRUE
  LEFT JOIN public.team_seasons AS ts
    ON ts.team_id = c.team_id
   AND ts.season_id = cs.season_id
  WHERE c.team_id IS NOT NULL
  GROUP BY c.id
),
coach_active_rel AS (
  SELECT coach_id, COUNT(*) AS active_rel_count
  FROM public.coach_team_seasons
  WHERE is_active = true
  GROUP BY coach_id
),
coach_pair_exists AS (
  SELECT
    tsc.coach_id,
    CASE
      WHEN tsc.team_season_match_count = 1 THEN (
        SELECT COUNT(*)
        FROM public.coach_team_seasons AS cts
        WHERE cts.coach_id = tsc.coach_id
          AND cts.team_season_id::text = tsc.matched_team_season_ids[1]
      )
      ELSE 0
    END AS pair_rel_count
  FROM coach_team_season_candidates AS tsc
),
coach_eval AS (
  SELECT
    c.id AS coach_id,
    CASE
      WHEN c.team_id IS NOT NULL
       AND (SELECT cnt FROM current_guard) = 1
       AND COALESCE(tsc.team_season_match_count, 0) = 1
       AND COALESCE(car.active_rel_count, 0) = 0
       AND COALESCE(cpe.pair_rel_count, 0) = 0
      THEN 'SAFE_INSERT_CANDIDATE'
      ELSE 'SKIP'
    END AS candidate_status,
    CASE
      WHEN c.team_id IS NULL THEN 'missing_legacy_team_id'
      WHEN (SELECT cnt FROM current_guard) <> 1 THEN 'current_season_not_unique'
      WHEN COALESCE(tsc.team_season_match_count, 0) > 1 THEN 'ambiguous_team_season'
      WHEN COALESCE(tsc.team_season_match_count, 0) = 0 THEN 'missing_team_season'
      WHEN COALESCE(car.active_rel_count, 0) > 0 THEN 'existing_active_assignment'
      WHEN COALESCE(cpe.pair_rel_count, 0) > 0 THEN 'existing_target_pair'
      ELSE 'safe'
    END AS skip_reason
  FROM public.coaches AS c
  LEFT JOIN coach_team_season_candidates AS tsc ON tsc.coach_id = c.id
  LEFT JOIN coach_active_rel AS car ON car.coach_id = c.id
  LEFT JOIN coach_pair_exists AS cpe ON cpe.coach_id = c.id
),
coach_conflict_legacy_vs_season AS (
  SELECT COUNT(DISTINCT c.id) AS conflict_count
  FROM public.coaches AS c
  JOIN public.coach_team_seasons AS cts
    ON cts.coach_id = c.id
  JOIN public.team_seasons AS ts
    ON ts.id = cts.team_season_id
  WHERE c.team_id IS NOT NULL
    AND c.team_id <> ts.team_id
),
image_metrics AS (
  SELECT
    (SELECT COUNT(*) FROM public.players WHERE (image_url IS NULL OR btrim(image_url) = '') AND photo_url IS NOT NULL AND btrim(photo_url) <> '') AS expected_player_image_updates,
    (SELECT COUNT(*) FROM public.coaches WHERE (image_url IS NULL OR btrim(image_url) = '') AND photo_url IS NOT NULL AND btrim(photo_url) <> '') AS expected_coach_image_updates,
    (SELECT COUNT(*) FROM public.players WHERE image_url IS NOT NULL AND btrim(image_url) <> '' AND photo_url IS NOT NULL AND btrim(photo_url) <> '' AND image_url <> photo_url) AS player_image_conflicts,
    (SELECT COUNT(*) FROM public.coaches WHERE image_url IS NOT NULL AND btrim(image_url) <> '' AND photo_url IS NOT NULL AND btrim(photo_url) <> '' AND image_url <> photo_url) AS coach_image_conflicts
)
SELECT
  (SELECT expected_team_season_updates FROM team_expected_updates) AS expected_team_season_updates,
  (SELECT COUNT(*) FROM player_eval WHERE candidate_status = 'SAFE_INSERT_CANDIDATE') AS expected_player_team_season_inserts,
  (SELECT COUNT(*) FROM coach_eval WHERE candidate_status = 'SAFE_INSERT_CANDIDATE') AS expected_coach_team_season_inserts,
  (SELECT expected_player_image_updates FROM image_metrics) AS expected_player_image_updates,
  (SELECT expected_coach_image_updates FROM image_metrics) AS expected_coach_image_updates,
  (
    (SELECT expected_team_season_updates FROM team_expected_updates)
    + (SELECT COUNT(*) FROM player_eval WHERE candidate_status = 'SAFE_INSERT_CANDIDATE')
    + (SELECT COUNT(*) FROM coach_eval WHERE candidate_status = 'SAFE_INSERT_CANDIDATE')
    + (SELECT expected_player_image_updates FROM image_metrics)
    + (SELECT expected_coach_image_updates FROM image_metrics)
  ) AS expected_total_mutations,
  (
    (SELECT team_skipped_total FROM team_skips)
    + (SELECT COUNT(*) FROM player_eval WHERE candidate_status = 'SKIP')
    + (SELECT COUNT(*) FROM coach_eval WHERE candidate_status = 'SKIP')
  ) AS skipped_total,
  (
    (SELECT team_conflict_total FROM team_conflicts)
    + (SELECT conflict_count FROM player_conflict_legacy_vs_season)
    + (SELECT conflict_count FROM coach_conflict_legacy_vs_season)
    + (SELECT player_image_conflicts FROM image_metrics)
    + (SELECT coach_image_conflicts FROM image_metrics)
  ) AS conflict_total;