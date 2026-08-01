-- B13.4B guarded safe backfill rollback test
-- TEST / ROLLBACK ONLY
-- DRY-RUN VERIFIED
-- EXPECTED MUTATIONS: 3
-- IMPORTANT:
-- 1) This file is for rollback test execution only.
-- 2) Backup required before execution.
-- 3) Do not run multiple times.
-- 4) All changes are rolled back at the end.
--
-- Allowed statements in this file:
-- SELECT, WITH, INSERT, UPDATE, BEGIN, ROLLBACK, PL/pgSQL DO/RAISE EXCEPTION.
-- No DELETE/DROP/ALTER/TRUNCATE/MERGE/CREATE TABLE/RLS or policy changes.

BEGIN;

DO $$
DECLARE
  -- Expected constants from verified dry-run
  v_expected_current_season_count constant integer := 1;
  v_expected_current_season_name  constant text    := '2026/2027';
  v_expected_duplicate_team_pairs constant integer := 0;

  v_expected_team_updates         constant integer := 1;
  v_expected_player_inserts       constant integer := 2;
  v_expected_coach_inserts        constant integer := 0;
  v_expected_player_img_updates   constant integer := 0;
  v_expected_coach_img_updates    constant integer := 0;
  v_expected_total_mutations      constant integer := 3;

  v_expected_skipped_total        constant integer := 19;
  v_expected_conflict_total       constant integer := 5;

  -- Pre-guard actuals (recomputed with dry-run logic)
  v_current_season_count integer;
  v_current_season_name text;
  v_duplicate_team_season_pair_count integer;

  v_expected_team_season_updates integer;
  v_expected_player_team_season_inserts integer;
  v_expected_coach_team_season_inserts integer;
  v_expected_player_image_updates integer;
  v_expected_coach_image_updates integer;
  v_expected_total_mutations_actual integer;
  v_skipped_total integer;
  v_conflict_total integer;

  -- Mutation outputs
  v_team_update_ids uuid[];
  v_player_insert_ids uuid[];
  v_coach_insert_ids uuid[];

  v_actual_team_season_updates integer := 0;
  v_actual_player_team_season_inserts integer := 0;
  v_actual_coach_team_season_inserts integer := 0;
  v_actual_player_image_updates integer := 0;
  v_actual_coach_image_updates integer := 0;
  v_actual_total_mutations integer := 0;

  -- Postchecks
  v_initial_pts_count bigint;
  v_final_pts_count bigint;
  v_initial_cts_count bigint;
  v_final_cts_count bigint;

  v_initial_duplicate_active_player_count integer := 0;
  v_final_duplicate_active_player_count integer := 0;
  v_new_duplicate_active_player_count integer := 0;
  v_initial_duplicate_active_player_ids uuid[] := ARRAY[]::uuid[];
  v_final_duplicate_active_player_ids uuid[] := ARRAY[]::uuid[];
  v_new_duplicate_active_player_ids uuid[] := ARRAY[]::uuid[];
  v_initial_duplicate_active_player_assignment_counts jsonb := '{}'::jsonb;
  v_final_duplicate_active_player_assignment_counts jsonb := '{}'::jsonb;
  v_inserted_player_team_season_pairs jsonb := '[]'::jsonb;
  v_inserted_player_team_season_pair_count integer := 0;
  v_inserted_players_with_multiple_active_assignments integer := 0;
  v_inserted_player_ids_with_multiple_active_assignments uuid[] := ARRAY[]::uuid[];
  v_expected_skipped_total_post integer := 0;
  v_initial_safe_player_candidate_count integer := 0;
  v_final_safe_player_candidate_count integer := 0;
  v_initial_safe_coach_candidate_count integer := 0;
  v_final_safe_coach_candidate_count integer := 0;
  v_initial_safe_player_candidate_ids uuid[] := ARRAY[]::uuid[];
  v_final_safe_player_candidate_ids uuid[] := ARRAY[]::uuid[];
  v_inserted_players_missing_expected_skip_reason_count integer := 0;
  v_inserted_players_missing_expected_skip_reason_ids uuid[] := ARRAY[]::uuid[];
  v_unexpected_lost_safe_player_candidate_count integer := 0;
  v_unexpected_lost_safe_player_candidate_ids uuid[] := ARRAY[]::uuid[];
  v_new_safe_player_candidate_count integer := 0;
  v_new_safe_player_candidate_ids uuid[] := ARRAY[]::uuid[];
  v_teams_without_current_team_season_count integer;
  v_current_team_season_count integer;

  v_conflict_total_post integer;
  v_skipped_total_post integer;
BEGIN
  -- Snapshot baseline counts for later postchecks.
  SELECT COUNT(*) INTO v_initial_pts_count FROM public.player_team_seasons;
  SELECT COUNT(*) INTO v_initial_cts_count FROM public.coach_team_seasons;

  -- Technical duplicate baseline before any mutation.
  WITH duplicate_active_players AS (
    SELECT
      pts.player_id,
      COUNT(*) AS active_assignment_count
    FROM public.player_team_seasons AS pts
    WHERE pts.is_active = true
    GROUP BY pts.player_id
    HAVING COUNT(*) > 1
  )
  SELECT
    COUNT(*),
    COALESCE(array_agg(player_id ORDER BY player_id::text), ARRAY[]::uuid[]),
    COALESCE(jsonb_object_agg(player_id::text, active_assignment_count ORDER BY player_id::text), '{}'::jsonb)
  INTO
    v_initial_duplicate_active_player_count,
    v_initial_duplicate_active_player_ids,
    v_initial_duplicate_active_player_assignment_counts
  FROM duplicate_active_players;

  -- Technical baseline for safe insert candidates before any mutation.
  WITH current_season AS (
    SELECT id AS season_id
    FROM public.seasons
    WHERE is_current = true
  ),
  current_guard AS (
    SELECT COUNT(*) AS cnt
    FROM current_season
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
      END AS candidate_status
    FROM public.players AS p
    LEFT JOIN player_team_season_candidates AS tsc ON tsc.player_id = p.id
    LEFT JOIN player_active_rel AS par ON par.player_id = p.id
    LEFT JOIN player_pair_exists AS pps ON pps.player_id = p.id
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
      END AS candidate_status
    FROM public.coaches AS c
    LEFT JOIN coach_team_season_candidates AS tsc ON tsc.coach_id = c.id
    LEFT JOIN coach_active_rel AS car ON car.coach_id = c.id
    LEFT JOIN coach_pair_exists AS cpe ON cpe.coach_id = c.id
  )
  SELECT
    (SELECT COUNT(*) FROM player_eval WHERE candidate_status = 'SAFE_INSERT_CANDIDATE'),
    (
      SELECT COALESCE(array_agg(player_id ORDER BY player_id::text), ARRAY[]::uuid[])
      FROM player_eval
      WHERE candidate_status = 'SAFE_INSERT_CANDIDATE'
    ),
    (SELECT COUNT(*) FROM coach_eval WHERE candidate_status = 'SAFE_INSERT_CANDIDATE')
  INTO
    v_initial_safe_player_candidate_count,
    v_initial_safe_player_candidate_ids,
    v_initial_safe_coach_candidate_count;

  -- Recompute hard guard metrics with the same candidate/conflict logic as dry-run block F.
  WITH current_season AS (
    SELECT id AS season_id, name AS season_name
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
      END AS candidate_status
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
      END AS candidate_status
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
    (SELECT COUNT(*) FROM current_season) AS current_season_count,
    (
      SELECT cs.season_name
      FROM current_season AS cs
      ORDER BY cs.season_id
      LIMIT 1
    ) AS current_season_name,
    (SELECT duplicate_team_season_pair_count FROM duplicate_team_pairs) AS duplicate_team_season_pair_count,
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
    ) AS conflict_total
  INTO
    v_current_season_count,
    v_current_season_name,
    v_duplicate_team_season_pair_count,
    v_expected_team_season_updates,
    v_expected_player_team_season_inserts,
    v_expected_coach_team_season_inserts,
    v_expected_player_image_updates,
    v_expected_coach_image_updates,
    v_expected_total_mutations_actual,
    v_skipped_total,
    v_conflict_total;

  -- Hard abort conditions (pre-mutation).
  IF v_current_season_count <> v_expected_current_season_count THEN
    RAISE EXCEPTION 'Guard failed: current_season_count expected %, got %', v_expected_current_season_count, v_current_season_count;
  END IF;

  IF v_current_season_name IS DISTINCT FROM v_expected_current_season_name THEN
    RAISE EXCEPTION 'Guard failed: current_season_name expected %, got %', v_expected_current_season_name, v_current_season_name;
  END IF;

  IF v_duplicate_team_season_pair_count <> v_expected_duplicate_team_pairs THEN
    RAISE EXCEPTION 'Guard failed: duplicate_team_season_pair_count expected %, got %', v_expected_duplicate_team_pairs, v_duplicate_team_season_pair_count;
  END IF;

  IF v_expected_team_season_updates <> v_expected_team_updates THEN
    RAISE EXCEPTION 'Guard failed: expected_team_season_updates expected %, got %', v_expected_team_updates, v_expected_team_season_updates;
  END IF;

  IF v_expected_player_team_season_inserts <> v_expected_player_inserts THEN
    RAISE EXCEPTION 'Guard failed: expected_player_team_season_inserts expected %, got %', v_expected_player_inserts, v_expected_player_team_season_inserts;
  END IF;

  IF v_expected_coach_team_season_inserts <> v_expected_coach_inserts THEN
    RAISE EXCEPTION 'Guard failed: expected_coach_team_season_inserts expected %, got %', v_expected_coach_inserts, v_expected_coach_team_season_inserts;
  END IF;

  IF v_initial_safe_player_candidate_count <> v_expected_player_team_season_inserts THEN
    RAISE EXCEPTION 'Guard failed: initial safe player candidate baseline expected %, got %', v_expected_player_team_season_inserts, v_initial_safe_player_candidate_count;
  END IF;

  IF v_initial_safe_coach_candidate_count <> v_expected_coach_team_season_inserts THEN
    RAISE EXCEPTION 'Guard failed: initial safe coach candidate baseline expected %, got %', v_expected_coach_team_season_inserts, v_initial_safe_coach_candidate_count;
  END IF;

  IF v_expected_player_image_updates <> v_expected_player_img_updates THEN
    RAISE EXCEPTION 'Guard failed: expected_player_image_updates expected %, got %', v_expected_player_img_updates, v_expected_player_image_updates;
  END IF;

  IF v_expected_coach_image_updates <> v_expected_coach_img_updates THEN
    RAISE EXCEPTION 'Guard failed: expected_coach_image_updates expected %, got %', v_expected_coach_img_updates, v_expected_coach_image_updates;
  END IF;

  IF v_expected_total_mutations_actual <> v_expected_total_mutations THEN
    RAISE EXCEPTION 'Guard failed: expected_total_mutations expected %, got %. Already applied or data drift.', v_expected_total_mutations, v_expected_total_mutations_actual;
  END IF;

  -- These are not mutation guards in the task list, but enforce the verified dry-run state.
  IF v_skipped_total <> v_expected_skipped_total THEN
    RAISE EXCEPTION 'Guard failed: skipped_total expected %, got %', v_expected_skipped_total, v_skipped_total;
  END IF;

  IF v_conflict_total <> v_expected_conflict_total THEN
    RAISE EXCEPTION 'Guard failed: conflict_total expected %, got %', v_expected_conflict_total, v_conflict_total;
  END IF;

  -- ==================================================
  -- Allowed mutation #1: exactly one conflict-free team_seasons UPDATE
  -- (No team_seasons INSERT, no auto-creation for missing team-season.)
  -- ==================================================
  WITH current_season AS (
    SELECT id AS season_id
    FROM public.seasons
    WHERE is_current = true
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
  candidate_row AS (
    SELECT
      t.id AS team_id,
      tt.target_team_season_id,
      NULLIF(btrim(t.description_de), '') AS description_de,
      NULLIF(btrim(t.description_en), '') AS description_en,
      NULLIF(btrim(t.training_times_de), '') AS training_times_de,
      NULLIF(btrim(t.training_times_en), '') AS training_times_en,
      NULLIF(btrim(t.team_image_url), '') AS team_image_url,
      NULLIF(btrim(t.contact_name), '') AS contact_name,
      NULLIF(btrim(t.contact_email), '') AS contact_email,
      NULLIF(btrim(t.contact_phone), '') AS contact_phone,
      NULLIF(btrim(t.contact_image_url), '') AS contact_image_url,
      NULLIF(btrim(t.fussball_de_matches_widget_url), '') AS fussball_de_matches_widget_url,
      NULLIF(btrim(t.fussball_de_matches_url), '') AS fussball_de_matches_url,
      NULLIF(btrim(t.dfb_matches_widget_url), '') AS dfb_matches_widget_url,
      NULLIF(btrim(t.fussball_de_table_widget_url), '') AS fussball_de_table_widget_url,
      NULLIF(btrim(t.fussball_de_table_url), '') AS fussball_de_table_url,
      NULLIF(btrim(t.dfb_table_widget_url), '') AS dfb_table_widget_url,
      NULLIF(btrim(t.fussball_de_team_id), '') AS fussball_de_team_id,
      NULLIF(btrim(t.fussball_de_competition_id), '') AS fussball_de_competition_id,
      NULLIF(btrim(t.fussball_de_club_id), '') AS fussball_de_club_id,
      NULLIF(btrim(t.fupa_matches_widget_id), '') AS fupa_matches_widget_id,
      NULLIF(btrim(t.fupa_table_widget_id), '') AS fupa_table_widget_id,
      NULLIF(btrim(t.fupa_club_url), '') AS fupa_club_url
    FROM public.teams AS t
    JOIN team_target AS tt
      ON tt.team_id = t.id
    JOIN public.team_seasons AS tsu
      ON tsu.id = tt.target_team_season_id
    WHERE tt.current_team_season_match_count = 1
      AND (
        (NULLIF(btrim(t.description_de), '') IS NOT NULL AND NULLIF(btrim(tsu.description_de), '') IS NULL)
        OR (NULLIF(btrim(t.description_en), '') IS NOT NULL AND NULLIF(btrim(tsu.description_en), '') IS NULL)
        OR (NULLIF(btrim(t.training_times_de), '') IS NOT NULL AND NULLIF(btrim(tsu.training_times_de), '') IS NULL)
        OR (NULLIF(btrim(t.training_times_en), '') IS NOT NULL AND NULLIF(btrim(tsu.training_times_en), '') IS NULL)
        OR (NULLIF(btrim(t.team_image_url), '') IS NOT NULL AND NULLIF(btrim(tsu.team_image_url), '') IS NULL)
        OR (NULLIF(btrim(t.contact_name), '') IS NOT NULL AND NULLIF(btrim(tsu.contact_name), '') IS NULL)
        OR (NULLIF(btrim(t.contact_email), '') IS NOT NULL AND NULLIF(btrim(tsu.contact_email), '') IS NULL)
        OR (NULLIF(btrim(t.contact_phone), '') IS NOT NULL AND NULLIF(btrim(tsu.contact_phone), '') IS NULL)
        OR (NULLIF(btrim(t.contact_image_url), '') IS NOT NULL AND NULLIF(btrim(tsu.contact_image_url), '') IS NULL)
        OR (NULLIF(btrim(t.fussball_de_matches_widget_url), '') IS NOT NULL AND NULLIF(btrim(tsu.fussball_de_matches_widget_url), '') IS NULL)
        OR (NULLIF(btrim(t.fussball_de_matches_url), '') IS NOT NULL AND NULLIF(btrim(tsu.fussball_de_matches_url), '') IS NULL)
        OR (NULLIF(btrim(t.dfb_matches_widget_url), '') IS NOT NULL AND NULLIF(btrim(tsu.dfb_matches_widget_url), '') IS NULL)
        OR (NULLIF(btrim(t.fussball_de_table_widget_url), '') IS NOT NULL AND NULLIF(btrim(tsu.fussball_de_table_widget_url), '') IS NULL)
        OR (NULLIF(btrim(t.fussball_de_table_url), '') IS NOT NULL AND NULLIF(btrim(tsu.fussball_de_table_url), '') IS NULL)
        OR (NULLIF(btrim(t.dfb_table_widget_url), '') IS NOT NULL AND NULLIF(btrim(tsu.dfb_table_widget_url), '') IS NULL)
        OR (NULLIF(btrim(t.fussball_de_team_id), '') IS NOT NULL AND NULLIF(btrim(tsu.fussball_de_team_id), '') IS NULL)
        OR (NULLIF(btrim(t.fussball_de_competition_id), '') IS NOT NULL AND NULLIF(btrim(tsu.fussball_de_competition_id), '') IS NULL)
        OR (NULLIF(btrim(t.fussball_de_club_id), '') IS NOT NULL AND NULLIF(btrim(tsu.fussball_de_club_id), '') IS NULL)
        OR (NULLIF(btrim(t.fupa_matches_widget_id), '') IS NOT NULL AND NULLIF(btrim(tsu.fupa_matches_widget_id), '') IS NULL)
        OR (NULLIF(btrim(t.fupa_table_widget_id), '') IS NOT NULL AND NULLIF(btrim(tsu.fupa_table_widget_id), '') IS NULL)
        OR (NULLIF(btrim(t.fupa_club_url), '') IS NOT NULL AND NULLIF(btrim(tsu.fupa_club_url), '') IS NULL)
      )
  ),
  ensure_single AS (
    SELECT COUNT(*) AS candidate_count FROM candidate_row
  ),
  updated AS (
    UPDATE public.team_seasons AS tsu
    SET
      description_de = COALESCE(NULLIF(btrim(tsu.description_de), ''), cr.description_de),
      description_en = COALESCE(NULLIF(btrim(tsu.description_en), ''), cr.description_en),
      training_times_de = COALESCE(NULLIF(btrim(tsu.training_times_de), ''), cr.training_times_de),
      training_times_en = COALESCE(NULLIF(btrim(tsu.training_times_en), ''), cr.training_times_en),
      team_image_url = COALESCE(NULLIF(btrim(tsu.team_image_url), ''), cr.team_image_url),
      contact_name = COALESCE(NULLIF(btrim(tsu.contact_name), ''), cr.contact_name),
      contact_email = COALESCE(NULLIF(btrim(tsu.contact_email), ''), cr.contact_email),
      contact_phone = COALESCE(NULLIF(btrim(tsu.contact_phone), ''), cr.contact_phone),
      contact_image_url = COALESCE(NULLIF(btrim(tsu.contact_image_url), ''), cr.contact_image_url),
      fussball_de_matches_widget_url = COALESCE(NULLIF(btrim(tsu.fussball_de_matches_widget_url), ''), cr.fussball_de_matches_widget_url),
      fussball_de_matches_url = COALESCE(NULLIF(btrim(tsu.fussball_de_matches_url), ''), cr.fussball_de_matches_url),
      dfb_matches_widget_url = COALESCE(NULLIF(btrim(tsu.dfb_matches_widget_url), ''), cr.dfb_matches_widget_url),
      fussball_de_table_widget_url = COALESCE(NULLIF(btrim(tsu.fussball_de_table_widget_url), ''), cr.fussball_de_table_widget_url),
      fussball_de_table_url = COALESCE(NULLIF(btrim(tsu.fussball_de_table_url), ''), cr.fussball_de_table_url),
      dfb_table_widget_url = COALESCE(NULLIF(btrim(tsu.dfb_table_widget_url), ''), cr.dfb_table_widget_url),
      fussball_de_team_id = COALESCE(NULLIF(btrim(tsu.fussball_de_team_id), ''), cr.fussball_de_team_id),
      fussball_de_competition_id = COALESCE(NULLIF(btrim(tsu.fussball_de_competition_id), ''), cr.fussball_de_competition_id),
      fussball_de_club_id = COALESCE(NULLIF(btrim(tsu.fussball_de_club_id), ''), cr.fussball_de_club_id),
      fupa_matches_widget_id = COALESCE(NULLIF(btrim(tsu.fupa_matches_widget_id), ''), cr.fupa_matches_widget_id),
      fupa_table_widget_id = COALESCE(NULLIF(btrim(tsu.fupa_table_widget_id), ''), cr.fupa_table_widget_id),
      fupa_club_url = COALESCE(NULLIF(btrim(tsu.fupa_club_url), ''), cr.fupa_club_url)
    FROM candidate_row AS cr
    WHERE tsu.id = cr.target_team_season_id
      AND (SELECT candidate_count FROM ensure_single) = 1
      AND (
        (cr.description_de IS NOT NULL AND NULLIF(btrim(tsu.description_de), '') IS NULL)
        OR (cr.description_en IS NOT NULL AND NULLIF(btrim(tsu.description_en), '') IS NULL)
        OR (cr.training_times_de IS NOT NULL AND NULLIF(btrim(tsu.training_times_de), '') IS NULL)
        OR (cr.training_times_en IS NOT NULL AND NULLIF(btrim(tsu.training_times_en), '') IS NULL)
        OR (cr.team_image_url IS NOT NULL AND NULLIF(btrim(tsu.team_image_url), '') IS NULL)
        OR (cr.contact_name IS NOT NULL AND NULLIF(btrim(tsu.contact_name), '') IS NULL)
        OR (cr.contact_email IS NOT NULL AND NULLIF(btrim(tsu.contact_email), '') IS NULL)
        OR (cr.contact_phone IS NOT NULL AND NULLIF(btrim(tsu.contact_phone), '') IS NULL)
        OR (cr.contact_image_url IS NOT NULL AND NULLIF(btrim(tsu.contact_image_url), '') IS NULL)
        OR (cr.fussball_de_matches_widget_url IS NOT NULL AND NULLIF(btrim(tsu.fussball_de_matches_widget_url), '') IS NULL)
        OR (cr.fussball_de_matches_url IS NOT NULL AND NULLIF(btrim(tsu.fussball_de_matches_url), '') IS NULL)
        OR (cr.dfb_matches_widget_url IS NOT NULL AND NULLIF(btrim(tsu.dfb_matches_widget_url), '') IS NULL)
        OR (cr.fussball_de_table_widget_url IS NOT NULL AND NULLIF(btrim(tsu.fussball_de_table_widget_url), '') IS NULL)
        OR (cr.fussball_de_table_url IS NOT NULL AND NULLIF(btrim(tsu.fussball_de_table_url), '') IS NULL)
        OR (cr.dfb_table_widget_url IS NOT NULL AND NULLIF(btrim(tsu.dfb_table_widget_url), '') IS NULL)
        OR (cr.fussball_de_team_id IS NOT NULL AND NULLIF(btrim(tsu.fussball_de_team_id), '') IS NULL)
        OR (cr.fussball_de_competition_id IS NOT NULL AND NULLIF(btrim(tsu.fussball_de_competition_id), '') IS NULL)
        OR (cr.fussball_de_club_id IS NOT NULL AND NULLIF(btrim(tsu.fussball_de_club_id), '') IS NULL)
        OR (cr.fupa_matches_widget_id IS NOT NULL AND NULLIF(btrim(tsu.fupa_matches_widget_id), '') IS NULL)
        OR (cr.fupa_table_widget_id IS NOT NULL AND NULLIF(btrim(tsu.fupa_table_widget_id), '') IS NULL)
        OR (cr.fupa_club_url IS NOT NULL AND NULLIF(btrim(tsu.fupa_club_url), '') IS NULL)
      )
    RETURNING tsu.id
  )
  SELECT COALESCE(array_agg(id), ARRAY[]::uuid[]), COUNT(*)
  INTO v_team_update_ids, v_actual_team_season_updates
  FROM updated;

  IF v_actual_team_season_updates <> v_expected_team_updates THEN
    RAISE EXCEPTION 'Guard failed: team_seasons UPDATE count expected %, got %', v_expected_team_updates, v_actual_team_season_updates;
  END IF;

  -- ==================================================
  -- Allowed mutation #2: exactly two INSERTs into player_team_seasons
  -- ==================================================
  WITH current_season AS (
    SELECT id AS season_id
    FROM public.seasons
    WHERE is_current = true
  ),
  current_guard AS (
    SELECT COUNT(*) AS cnt FROM current_season
  ),
  unique_candidate AS (
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
  ),
  inserted AS (
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
    RETURNING id, player_id, team_season_id
  )
  SELECT
    COALESCE(array_agg(id ORDER BY id::text), ARRAY[]::uuid[]),
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'player_id', player_id,
          'team_season_id', team_season_id
        )
        ORDER BY player_id::text, team_season_id::text
      ),
      '[]'::jsonb
    ),
    COUNT(*)
  INTO
    v_player_insert_ids,
    v_inserted_player_team_season_pairs,
    v_actual_player_team_season_inserts
  FROM inserted;

  IF v_actual_player_team_season_inserts <> v_expected_player_inserts THEN
    RAISE EXCEPTION 'Guard failed: player_team_seasons INSERT count expected %, got %', v_expected_player_inserts, v_actual_player_team_season_inserts;
  END IF;

  -- ==================================================
  -- Allowed mutation #3: no coach mutation expected (must stay 0)
  -- ==================================================
  WITH current_season AS (
    SELECT id AS season_id
    FROM public.seasons
    WHERE is_current = true
  ),
  current_guard AS (
    SELECT COUNT(*) AS cnt FROM current_season
  ),
  unique_candidate AS (
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
  ),
  inserted AS (
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
  SELECT COALESCE(array_agg(id), ARRAY[]::uuid[]), COUNT(*)
  INTO v_coach_insert_ids, v_actual_coach_team_season_inserts
  FROM inserted;

  IF v_actual_coach_team_season_inserts <> v_expected_coach_inserts THEN
    RAISE EXCEPTION 'Guard failed: coach_team_seasons INSERT count expected %, got %', v_expected_coach_inserts, v_actual_coach_team_season_inserts;
  END IF;

  -- Image updates are explicitly forbidden for this guarded execution.
  -- Keep statements present for hard count validation with RETURNING.
  WITH updated AS (
    UPDATE public.players
    SET image_url = photo_url
    WHERE (image_url IS NULL OR btrim(image_url) = '')
      AND photo_url IS NOT NULL
      AND btrim(photo_url) <> ''
    RETURNING id
  )
  SELECT COUNT(*) INTO v_actual_player_image_updates FROM updated;

  WITH updated AS (
    UPDATE public.coaches
    SET image_url = photo_url
    WHERE (image_url IS NULL OR btrim(image_url) = '')
      AND photo_url IS NOT NULL
      AND btrim(photo_url) <> ''
    RETURNING id
  )
  SELECT COUNT(*) INTO v_actual_coach_image_updates FROM updated;

  IF v_actual_player_image_updates <> v_expected_player_img_updates THEN
    RAISE EXCEPTION 'Guard failed: player image updates expected %, got %', v_expected_player_img_updates, v_actual_player_image_updates;
  END IF;

  IF v_actual_coach_image_updates <> v_expected_coach_img_updates THEN
    RAISE EXCEPTION 'Guard failed: coach image updates expected %, got %', v_expected_coach_img_updates, v_actual_coach_image_updates;
  END IF;

  v_actual_total_mutations :=
      v_actual_team_season_updates
    + v_actual_player_team_season_inserts
    + v_actual_coach_team_season_inserts
    + v_actual_player_image_updates
    + v_actual_coach_image_updates;

  IF v_actual_total_mutations <> v_expected_total_mutations THEN
    RAISE EXCEPTION 'Guard failed: actual total mutations expected %, got %', v_expected_total_mutations, v_actual_total_mutations;
  END IF;

  -- ==================================================
  -- In-transaction postchecks before final rollback
  -- ==================================================

  -- Exactly two new player_team_seasons rows.
  SELECT COUNT(*) INTO v_final_pts_count FROM public.player_team_seasons;
  IF (v_final_pts_count - v_initial_pts_count) <> 2 THEN
    RAISE EXCEPTION 'Postcheck failed: expected +2 player_team_seasons rows, got %', v_final_pts_count - v_initial_pts_count;
  END IF;

  -- No coach assignment changed.
  SELECT COUNT(*) INTO v_final_cts_count FROM public.coach_team_seasons;
  IF (v_final_cts_count - v_initial_cts_count) <> 0 THEN
    RAISE EXCEPTION 'Postcheck failed: coach_team_seasons changed by %, expected 0', v_final_cts_count - v_initial_cts_count;
  END IF;

  -- Duplicate-active baseline must remain unchanged and no inserted player may end up duplicated.
  WITH duplicate_active_players AS (
    SELECT
      pts.player_id,
      COUNT(*) AS active_assignment_count
    FROM public.player_team_seasons AS pts
    WHERE pts.is_active = true
    GROUP BY pts.player_id
    HAVING COUNT(*) > 1
  )
  SELECT
    COUNT(*),
    COALESCE(array_agg(player_id ORDER BY player_id::text), ARRAY[]::uuid[]),
    COALESCE(jsonb_object_agg(player_id::text, active_assignment_count ORDER BY player_id::text), '{}'::jsonb)
  INTO
    v_final_duplicate_active_player_count,
    v_final_duplicate_active_player_ids,
    v_final_duplicate_active_player_assignment_counts
  FROM duplicate_active_players;

  WITH initial_duplicate_players AS (
    SELECT unnest(v_initial_duplicate_active_player_ids) AS player_id
  ),
  final_duplicate_players AS (
    SELECT unnest(v_final_duplicate_active_player_ids) AS player_id
  )
  SELECT
    COUNT(*),
    COALESCE(array_agg(fdp.player_id ORDER BY fdp.player_id::text), ARRAY[]::uuid[])
  INTO
    v_new_duplicate_active_player_count,
    v_new_duplicate_active_player_ids
  FROM final_duplicate_players AS fdp
  LEFT JOIN initial_duplicate_players AS idp
    ON idp.player_id = fdp.player_id
  WHERE idp.player_id IS NULL;

  IF v_final_duplicate_active_player_count > v_initial_duplicate_active_player_count THEN
    RAISE EXCEPTION 'Postcheck failed: final duplicate active player count exceeded baseline (initial %, final %)',
      v_initial_duplicate_active_player_count,
      v_final_duplicate_active_player_count;
  END IF;

  IF v_new_duplicate_active_player_count <> 0 THEN
    RAISE EXCEPTION 'Postcheck failed: newly created duplicate active player assignments detected for player_ids %',
      array_to_string(v_new_duplicate_active_player_ids, ',');
  END IF;

  IF v_initial_duplicate_active_player_assignment_counts IS DISTINCT FROM v_final_duplicate_active_player_assignment_counts THEN
    RAISE EXCEPTION 'Postcheck failed: pre-existing duplicate active player baseline changed (initial %, final %)',
      v_initial_duplicate_active_player_assignment_counts,
      v_final_duplicate_active_player_assignment_counts;
  END IF;

  WITH inserted_players AS (
    SELECT DISTINCT (entry->>'player_id')::uuid AS player_id
    FROM jsonb_array_elements(v_inserted_player_team_season_pairs) AS entry
  ),
  inserted_player_active_counts AS (
    SELECT
      ip.player_id,
      COUNT(*) FILTER (WHERE pts.is_active = true) AS active_assignment_count
    FROM inserted_players AS ip
    LEFT JOIN public.player_team_seasons AS pts
      ON pts.player_id = ip.player_id
    GROUP BY ip.player_id
  )
  SELECT
    COUNT(*) FILTER (WHERE active_assignment_count > 1),
    COALESCE(
      array_agg(player_id ORDER BY player_id::text) FILTER (WHERE active_assignment_count > 1),
      ARRAY[]::uuid[]
    )
  INTO
    v_inserted_players_with_multiple_active_assignments,
    v_inserted_player_ids_with_multiple_active_assignments
  FROM inserted_player_active_counts;

  IF v_inserted_players_with_multiple_active_assignments <> 0 THEN
    RAISE EXCEPTION 'Postcheck failed: inserted players have multiple active assignments: %',
      array_to_string(v_inserted_player_ids_with_multiple_active_assignments, ',');
  END IF;

  WITH inserted_pairs AS (
    SELECT
      (entry->>'player_id')::uuid AS player_id,
      (entry->>'team_season_id')::uuid AS team_season_id
    FROM jsonb_array_elements(v_inserted_player_team_season_pairs) AS entry
  ),
  pair_counts AS (
    SELECT
      ip.player_id,
      ip.team_season_id,
      COUNT(*) AS expected_pair_count,
      (
        SELECT COUNT(*)
        FROM public.player_team_seasons AS pts
        WHERE pts.player_id = ip.player_id
          AND pts.team_season_id = ip.team_season_id
      ) AS actual_pair_count
    FROM inserted_pairs AS ip
    GROUP BY ip.player_id, ip.team_season_id
  )
  SELECT COUNT(*)
  INTO v_inserted_player_team_season_pair_count
  FROM pair_counts
  WHERE expected_pair_count = 1
    AND actual_pair_count = 1;

  IF jsonb_array_length(v_inserted_player_team_season_pairs) <> 2
     OR v_inserted_player_team_season_pair_count <> 2 THEN
    RAISE EXCEPTION 'Postcheck failed: inserted player_team_seasons pairs are no longer exactly the two expected player_id + team_season_id combinations';
  END IF;

  -- No team-season row auto-created; missing current mapping team remains missing.
  WITH current_season AS (
    SELECT id AS season_id
    FROM public.seasons
    WHERE is_current = true
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
  )
  SELECT
    COUNT(*) FILTER (WHERE current_team_season_match_count = 0),
    SUM(current_team_season_match_count)
  INTO v_teams_without_current_team_season_count, v_current_team_season_count
  FROM team_base;

  IF v_teams_without_current_team_season_count <> 1 THEN
    RAISE EXCEPTION 'Postcheck failed: teams_without_current_team_season_count expected 1, got %', v_teams_without_current_team_season_count;
  END IF;

  IF v_current_team_season_count <> 8 THEN
    RAISE EXCEPTION 'Postcheck failed: current_team_season_count expected 8, got %', v_current_team_season_count;
  END IF;

  v_expected_skipped_total_post :=
      v_expected_skipped_total
    + v_actual_player_team_season_inserts
    + v_actual_coach_team_season_inserts;

  -- Re-check skipped/conflict totals and candidate transitions.
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
      COALESCE(par.active_rel_count, 0) AS active_rel_count,
      COALESCE(pps.pair_rel_count, 0) AS pair_rel_count,
      CASE
        WHEN p.team_id IS NOT NULL
         AND (SELECT cnt FROM current_guard) = 1
         AND COALESCE(tsc.team_season_match_count, 0) = 1
         AND COALESCE(par.active_rel_count, 0) = 0
         AND COALESCE(pps.pair_rel_count, 0) = 0
        THEN 'SAFE_INSERT_CANDIDATE'
        ELSE 'SKIP'
      END AS candidate_status
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
      END AS candidate_status
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
      (SELECT COUNT(*) FROM public.players WHERE image_url IS NOT NULL AND btrim(image_url) <> '' AND photo_url IS NOT NULL AND btrim(photo_url) <> '' AND image_url <> photo_url) AS player_image_conflicts,
      (SELECT COUNT(*) FROM public.coaches WHERE image_url IS NOT NULL AND btrim(image_url) <> '' AND photo_url IS NOT NULL AND btrim(photo_url) <> '' AND image_url <> photo_url) AS coach_image_conflicts
  ),
  inserted_player_ids AS (
    SELECT DISTINCT (entry->>'player_id')::uuid AS player_id
    FROM jsonb_array_elements(v_inserted_player_team_season_pairs) AS entry
  ),
  initial_safe_player_ids AS (
    SELECT unnest(v_initial_safe_player_candidate_ids) AS player_id
  ),
  final_safe_player_ids AS (
    SELECT player_id
    FROM player_eval
    WHERE candidate_status = 'SAFE_INSERT_CANDIDATE'
  ),
  inserted_player_transitions AS (
    SELECT
      ip.player_id,
      COALESCE(pe.candidate_status, 'SKIP') AS candidate_status,
      COALESCE(pe.active_rel_count, 0) AS active_rel_count,
      COALESCE(pe.pair_rel_count, 0) AS pair_rel_count
    FROM inserted_player_ids AS ip
    LEFT JOIN player_eval AS pe
      ON pe.player_id = ip.player_id
  ),
  unexpected_lost_safe_players AS (
    SELECT isp.player_id
    FROM initial_safe_player_ids AS isp
    LEFT JOIN inserted_player_ids AS ip
      ON ip.player_id = isp.player_id
    LEFT JOIN final_safe_player_ids AS fsp
      ON fsp.player_id = isp.player_id
    WHERE ip.player_id IS NULL
      AND fsp.player_id IS NULL
  ),
  new_safe_players AS (
    SELECT fsp.player_id
    FROM final_safe_player_ids AS fsp
    LEFT JOIN initial_safe_player_ids AS isp
      ON isp.player_id = fsp.player_id
    WHERE isp.player_id IS NULL
  )
  SELECT
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
    ) AS conflict_total,
    (SELECT COUNT(*) FROM player_eval WHERE candidate_status = 'SAFE_INSERT_CANDIDATE') AS final_safe_player_candidate_count,
    (
      SELECT COALESCE(array_agg(player_id ORDER BY player_id::text), ARRAY[]::uuid[])
      FROM player_eval
      WHERE candidate_status = 'SAFE_INSERT_CANDIDATE'
    ) AS final_safe_player_candidate_ids,
    (SELECT COUNT(*) FROM coach_eval WHERE candidate_status = 'SAFE_INSERT_CANDIDATE') AS final_safe_coach_candidate_count,
    (
      SELECT COUNT(*)
      FROM inserted_player_transitions
      WHERE candidate_status <> 'SKIP'
         OR (active_rel_count <= 0 AND pair_rel_count <= 0)
    ) AS inserted_players_missing_expected_skip_reason_count,
    (
      SELECT COALESCE(array_agg(player_id ORDER BY player_id::text), ARRAY[]::uuid[])
      FROM inserted_player_transitions
      WHERE candidate_status <> 'SKIP'
         OR (active_rel_count <= 0 AND pair_rel_count <= 0)
    ) AS inserted_players_missing_expected_skip_reason_ids,
    (SELECT COUNT(*) FROM unexpected_lost_safe_players) AS unexpected_lost_safe_player_candidate_count,
    (
      SELECT COALESCE(array_agg(player_id ORDER BY player_id::text), ARRAY[]::uuid[])
      FROM unexpected_lost_safe_players
    ) AS unexpected_lost_safe_player_candidate_ids,
    (SELECT COUNT(*) FROM new_safe_players) AS new_safe_player_candidate_count,
    (
      SELECT COALESCE(array_agg(player_id ORDER BY player_id::text), ARRAY[]::uuid[])
      FROM new_safe_players
    ) AS new_safe_player_candidate_ids
  INTO
    v_skipped_total_post,
    v_conflict_total_post,
    v_final_safe_player_candidate_count,
    v_final_safe_player_candidate_ids,
    v_final_safe_coach_candidate_count,
    v_inserted_players_missing_expected_skip_reason_count,
    v_inserted_players_missing_expected_skip_reason_ids,
    v_unexpected_lost_safe_player_candidate_count,
    v_unexpected_lost_safe_player_candidate_ids,
    v_new_safe_player_candidate_count,
    v_new_safe_player_candidate_ids;

  IF v_skipped_total_post <> v_expected_skipped_total_post THEN
    RAISE EXCEPTION 'Postcheck failed: skipped_total transition mismatch (initial %, player_inserts %, coach_inserts %, expected_post %, actual_post %)',
      v_expected_skipped_total,
      v_actual_player_team_season_inserts,
      v_actual_coach_team_season_inserts,
      v_expected_skipped_total_post,
      v_skipped_total_post;
  END IF;

  IF v_inserted_players_missing_expected_skip_reason_count <> 0 THEN
    RAISE EXCEPTION 'Postcheck failed: inserted players did not transition to SKIP because of active assignment or existing pair: %',
      array_to_string(v_inserted_players_missing_expected_skip_reason_ids, ',');
  END IF;

  IF v_unexpected_lost_safe_player_candidate_count <> 0 THEN
    RAISE EXCEPTION 'Postcheck failed: non-inserted safe player candidates unexpectedly lost SAFE_INSERT_CANDIDATE status: %',
      array_to_string(v_unexpected_lost_safe_player_candidate_ids, ',');
  END IF;

  IF v_new_safe_player_candidate_count <> 0 THEN
    RAISE EXCEPTION 'Postcheck failed: new safe player candidates appeared after mutation: %',
      array_to_string(v_new_safe_player_candidate_ids, ',');
  END IF;

  IF v_final_safe_player_candidate_count <> 0 THEN
    RAISE EXCEPTION 'Postcheck failed: final safe player candidate count expected 0, got %', v_final_safe_player_candidate_count;
  END IF;

  IF v_final_safe_coach_candidate_count <> 0 THEN
    RAISE EXCEPTION 'Postcheck failed: final safe coach candidate count expected 0, got %', v_final_safe_coach_candidate_count;
  END IF;

  IF v_conflict_total_post <> v_expected_conflict_total THEN
    RAISE EXCEPTION 'Postcheck failed: conflict_total expected %, got %', v_expected_conflict_total, v_conflict_total_post;
  END IF;

  -- Expose mutation outputs for final SELECT outside DO block.
  PERFORM set_config('b13_guarded.actual_team_season_updates', v_actual_team_season_updates::text, true);
  PERFORM set_config('b13_guarded.actual_player_team_season_inserts', v_actual_player_team_season_inserts::text, true);
  PERFORM set_config('b13_guarded.actual_coach_team_season_inserts', v_actual_coach_team_season_inserts::text, true);
  PERFORM set_config('b13_guarded.actual_player_image_updates', v_actual_player_image_updates::text, true);
  PERFORM set_config('b13_guarded.actual_coach_image_updates', v_actual_coach_image_updates::text, true);
  PERFORM set_config('b13_guarded.actual_total_mutations', v_actual_total_mutations::text, true);

  PERFORM set_config('b13_guarded.team_update_ids', COALESCE(array_to_string(v_team_update_ids, ','), ''), true);
  PERFORM set_config('b13_guarded.player_insert_ids', COALESCE(array_to_string(v_player_insert_ids, ','), ''), true);
  PERFORM set_config('b13_guarded.coach_insert_ids', COALESCE(array_to_string(v_coach_insert_ids, ','), ''), true);
  PERFORM set_config('b13_guarded.postcheck_player_team_season_row_delta', (v_final_pts_count - v_initial_pts_count)::text, true);
  PERFORM set_config('b13_guarded.postcheck_coach_team_season_row_delta', (v_final_cts_count - v_initial_cts_count)::text, true);
  PERFORM set_config('b13_guarded.initial_duplicate_active_player_count', v_initial_duplicate_active_player_count::text, true);
  PERFORM set_config('b13_guarded.final_duplicate_active_player_count', v_final_duplicate_active_player_count::text, true);
  PERFORM set_config('b13_guarded.newly_created_duplicate_player_count', v_new_duplicate_active_player_count::text, true);
  PERFORM set_config('b13_guarded.initial_skipped_total', v_skipped_total::text, true);
  PERFORM set_config('b13_guarded.expected_post_skipped_total', v_expected_skipped_total_post::text, true);
  PERFORM set_config('b13_guarded.actual_post_skipped_total', v_skipped_total_post::text, true);
  PERFORM set_config('b13_guarded.initial_safe_player_candidate_count', v_initial_safe_player_candidate_count::text, true);
  PERFORM set_config('b13_guarded.final_safe_player_candidate_count', v_final_safe_player_candidate_count::text, true);
  PERFORM set_config('b13_guarded.initial_safe_coach_candidate_count', v_initial_safe_coach_candidate_count::text, true);
  PERFORM set_config('b13_guarded.final_safe_coach_candidate_count', v_final_safe_coach_candidate_count::text, true);
  PERFORM set_config(
    'b13_guarded.inserted_players_with_multiple_active_assignments',
    COALESCE(array_to_string(v_inserted_player_ids_with_multiple_active_assignments, ','), ''),
    true
  );
  PERFORM set_config('b13_guarded.postcheck_teams_without_current_team_season_count', v_teams_without_current_team_season_count::text, true);
  PERFORM set_config('b13_guarded.postcheck_current_team_season_count', v_current_team_season_count::text, true);
  PERFORM set_config('b13_guarded.postcheck_skipped_total', v_skipped_total_post::text, true);
  PERFORM set_config('b13_guarded.postcheck_conflict_total', v_conflict_total_post::text, true);
END;
$$ LANGUAGE plpgsql;

-- Final transaction-local output (technical IDs only, no PII).
SELECT
  current_setting('b13_guarded.actual_team_season_updates', true)::integer AS actual_team_season_updates,
  current_setting('b13_guarded.actual_player_team_season_inserts', true)::integer AS actual_player_team_season_inserts,
  current_setting('b13_guarded.actual_coach_team_season_inserts', true)::integer AS actual_coach_team_season_inserts,
  current_setting('b13_guarded.actual_player_image_updates', true)::integer AS actual_player_image_updates,
  current_setting('b13_guarded.actual_coach_image_updates', true)::integer AS actual_coach_image_updates,
  current_setting('b13_guarded.actual_total_mutations', true)::integer AS actual_total_mutations,
  NULLIF(current_setting('b13_guarded.team_update_ids', true), '') AS team_seasons_updated_ids,
  NULLIF(current_setting('b13_guarded.player_insert_ids', true), '') AS player_team_seasons_inserted_ids,
  NULLIF(current_setting('b13_guarded.coach_insert_ids', true), '') AS coach_team_seasons_inserted_ids,
  current_setting('b13_guarded.postcheck_player_team_season_row_delta', true)::integer AS postcheck_player_team_season_row_delta,
  current_setting('b13_guarded.postcheck_coach_team_season_row_delta', true)::integer AS postcheck_coach_team_season_row_delta,
  current_setting('b13_guarded.initial_duplicate_active_player_count', true)::integer AS initial_duplicate_active_player_count,
  current_setting('b13_guarded.final_duplicate_active_player_count', true)::integer AS final_duplicate_active_player_count,
  current_setting('b13_guarded.newly_created_duplicate_player_count', true)::integer AS newly_created_duplicate_player_count,
  current_setting('b13_guarded.initial_skipped_total', true)::integer AS initial_skipped_total,
  current_setting('b13_guarded.expected_post_skipped_total', true)::integer AS expected_post_skipped_total,
  current_setting('b13_guarded.actual_post_skipped_total', true)::integer AS actual_post_skipped_total,
  current_setting('b13_guarded.initial_safe_player_candidate_count', true)::integer AS initial_safe_player_candidate_count,
  current_setting('b13_guarded.final_safe_player_candidate_count', true)::integer AS final_safe_player_candidate_count,
  current_setting('b13_guarded.initial_safe_coach_candidate_count', true)::integer AS initial_safe_coach_candidate_count,
  current_setting('b13_guarded.final_safe_coach_candidate_count', true)::integer AS final_safe_coach_candidate_count,
  NULLIF(current_setting('b13_guarded.inserted_players_with_multiple_active_assignments', true), '') AS inserted_players_with_multiple_active_assignments,
  current_setting('b13_guarded.postcheck_teams_without_current_team_season_count', true)::integer AS postcheck_teams_without_current_team_season_count,
  current_setting('b13_guarded.postcheck_current_team_season_count', true)::integer AS postcheck_current_team_season_count,
  current_setting('b13_guarded.postcheck_skipped_total', true)::integer AS postcheck_skipped_total,
  current_setting('b13_guarded.postcheck_conflict_total', true)::integer AS postcheck_conflict_total;

-- ========================= CONTROL POINT =========================
-- Review outputs above. This test file always rolls back changes.
-- ================================================================
ROLLBACK;

-- TEST COMPLETED - CHANGES ROLLED BACK
