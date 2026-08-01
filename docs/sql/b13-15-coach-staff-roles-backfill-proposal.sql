-- B13.15 coach staff roles backfill proposal
-- Proposal only. Do not execute automatically.
-- This file intentionally produces a manual approval preview instead of applying inserts.
-- Reason: B13.14 and B13.15 forbid risky automatic adoption of unclear free-text legacy roles.

BEGIN;

-- 1) Controlled general staff role catalog for preview classification.
WITH approved_general_roles AS (
  SELECT 'jugend_torwarttrainer' AS role_key, 'jugend-torwarttrainer' AS normalized_role, 'Jugend-Torwarttrainer' AS role_de, 'Youth Goalkeeper Coach' AS role_en
  UNION ALL
  SELECT 'trainerkoordinator', 'trainerkoordinator', 'Trainerkoordinator', 'Coaching Coordinator'
  UNION ALL
  SELECT 'athletiktrainer_verein', 'athletiktrainer des vereins', 'Athletiktrainer des Vereins', 'Club Athletic Coach'
  UNION ALL
  SELECT 'trainerpool', 'trainerpool', 'Trainerpool', 'Coach Pool'
  UNION ALL
  SELECT 'scout', 'scout', 'Scout', 'Scout'
  UNION ALL
  SELECT 'sportlicher_berater', 'sportlicher berater', 'Sportlicher Berater', 'Sporting Advisor'
), normalized_legacy AS (
  SELECT
    c.id AS coach_id,
    lower(NULLIF(btrim(c.role), '')) AS normalized_role,
    'role' AS source_field
  FROM public.coaches AS c
  WHERE NULLIF(btrim(c.role), '') IS NOT NULL

  UNION ALL

  SELECT
    c.id AS coach_id,
    lower(NULLIF(btrim(c.role_de), '')) AS normalized_role,
    'role_de' AS source_field
  FROM public.coaches AS c
  WHERE NULLIF(btrim(c.role_de), '') IS NOT NULL

  UNION ALL

  SELECT
    c.id AS coach_id,
    lower(NULLIF(btrim(c.role_en), '')) AS normalized_role,
    'role_en' AS source_field
  FROM public.coaches AS c
  WHERE NULLIF(btrim(c.role_en), '') IS NOT NULL
), consistent_legacy AS (
  SELECT
    nl.coach_id,
    MIN(nl.normalized_role) AS normalized_role,
    COUNT(DISTINCT nl.normalized_role) AS distinct_legacy_role_count,
    ARRAY_AGG(DISTINCT nl.source_field ORDER BY nl.source_field) AS source_fields
  FROM normalized_legacy AS nl
  GROUP BY nl.coach_id
), assignment_roles AS (
  SELECT DISTINCT
    cts.coach_id,
    lower(btrim(cts.role_de)) AS normalized_role
  FROM public.coach_team_seasons AS cts
  WHERE NULLIF(btrim(cts.role_de), '') IS NOT NULL

  UNION

  SELECT DISTINCT
    cts.coach_id,
    lower(btrim(cts.role_en)) AS normalized_role
  FROM public.coach_team_seasons AS cts
  WHERE NULLIF(btrim(cts.role_en), '') IS NOT NULL
), current_active_assignment_count AS (
  SELECT cts.coach_id, COUNT(*) AS active_current_assignment_count
  FROM public.coach_team_seasons AS cts
  JOIN public.team_seasons AS ts
    ON ts.id = cts.team_season_id
  JOIN public.seasons AS s
    ON s.id = ts.season_id
  WHERE s.is_current = true
    AND cts.is_active = true
  GROUP BY cts.coach_id
), existing_staff_role_match AS (
  SELECT DISTINCT
    csr.coach_id,
    COALESCE(lower(NULLIF(btrim(csr.role_key), '')), lower(NULLIF(btrim(csr.role_de), ''))) AS normalized_staff_value
  FROM public.coach_staff_roles AS csr
  WHERE csr.is_active = true
), safe_preview_candidates AS (
  SELECT
    cl.coach_id,
    agr.role_key,
    agr.role_de,
    agr.role_en,
    cl.normalized_role AS legacy_role_value,
    cl.source_fields,
    COALESCE(caac.active_current_assignment_count, 0) AS active_current_assignment_count
  FROM consistent_legacy AS cl
  JOIN approved_general_roles AS agr
    ON agr.normalized_role = cl.normalized_role
  LEFT JOIN current_active_assignment_count AS caac
    ON caac.coach_id = cl.coach_id
  LEFT JOIN existing_staff_role_match AS esrm
    ON esrm.coach_id = cl.coach_id
   AND esrm.normalized_staff_value IN (agr.role_key, lower(agr.role_de))
  WHERE cl.distinct_legacy_role_count = 1
    AND COALESCE(caac.active_current_assignment_count, 0) = 0
    AND NOT EXISTS (
      SELECT 1
      FROM assignment_roles AS ar
      WHERE ar.coach_id = cl.coach_id
        AND ar.normalized_role = cl.normalized_role
    )
    AND esrm.coach_id IS NULL
)
SELECT
  coach_id,
  role_key,
  role_de,
  role_en,
  legacy_role_value,
  source_fields,
  active_current_assignment_count,
  'PREVIEW_ONLY' AS proposal_status
FROM safe_preview_candidates
ORDER BY coach_id;

-- 2) Manual approval preview as generated insert text.
WITH approved_general_roles AS (
  SELECT 'jugend_torwarttrainer' AS role_key, 'jugend-torwarttrainer' AS normalized_role, 'Jugend-Torwarttrainer' AS role_de, 'Youth Goalkeeper Coach' AS role_en
  UNION ALL
  SELECT 'trainerkoordinator', 'trainerkoordinator', 'Trainerkoordinator', 'Coaching Coordinator'
  UNION ALL
  SELECT 'athletiktrainer_verein', 'athletiktrainer des vereins', 'Athletiktrainer des Vereins', 'Club Athletic Coach'
  UNION ALL
  SELECT 'trainerpool', 'trainerpool', 'Trainerpool', 'Coach Pool'
  UNION ALL
  SELECT 'scout', 'scout', 'Scout', 'Scout'
  UNION ALL
  SELECT 'sportlicher_berater', 'sportlicher berater', 'Sportlicher Berater', 'Sporting Advisor'
), normalized_legacy AS (
  SELECT
    c.id AS coach_id,
    lower(NULLIF(btrim(c.role), '')) AS normalized_role,
    'role' AS source_field
  FROM public.coaches AS c
  WHERE NULLIF(btrim(c.role), '') IS NOT NULL

  UNION ALL

  SELECT
    c.id AS coach_id,
    lower(NULLIF(btrim(c.role_de), '')) AS normalized_role,
    'role_de' AS source_field
  FROM public.coaches AS c
  WHERE NULLIF(btrim(c.role_de), '') IS NOT NULL

  UNION ALL

  SELECT
    c.id AS coach_id,
    lower(NULLIF(btrim(c.role_en), '')) AS normalized_role,
    'role_en' AS source_field
  FROM public.coaches AS c
  WHERE NULLIF(btrim(c.role_en), '') IS NOT NULL
), consistent_legacy AS (
  SELECT
    nl.coach_id,
    MIN(nl.normalized_role) AS normalized_role,
    COUNT(DISTINCT nl.normalized_role) AS distinct_legacy_role_count
  FROM normalized_legacy AS nl
  GROUP BY nl.coach_id
), assignment_roles AS (
  SELECT DISTINCT
    cts.coach_id,
    lower(btrim(cts.role_de)) AS normalized_role
  FROM public.coach_team_seasons AS cts
  WHERE NULLIF(btrim(cts.role_de), '') IS NOT NULL

  UNION

  SELECT DISTINCT
    cts.coach_id,
    lower(btrim(cts.role_en)) AS normalized_role
  FROM public.coach_team_seasons AS cts
  WHERE NULLIF(btrim(cts.role_en), '') IS NOT NULL
), current_active_assignment_count AS (
  SELECT cts.coach_id, COUNT(*) AS active_current_assignment_count
  FROM public.coach_team_seasons AS cts
  JOIN public.team_seasons AS ts
    ON ts.id = cts.team_season_id
  JOIN public.seasons AS s
    ON s.id = ts.season_id
  WHERE s.is_current = true
    AND cts.is_active = true
  GROUP BY cts.coach_id
), existing_staff_role_match AS (
  SELECT DISTINCT
    csr.coach_id,
    COALESCE(lower(NULLIF(btrim(csr.role_key), '')), lower(NULLIF(btrim(csr.role_de), ''))) AS normalized_staff_value
  FROM public.coach_staff_roles AS csr
  WHERE csr.is_active = true
), safe_preview_candidates AS (
  SELECT
    cl.coach_id,
    agr.role_key,
    agr.role_de,
    agr.role_en
  FROM consistent_legacy AS cl
  JOIN approved_general_roles AS agr
    ON agr.normalized_role = cl.normalized_role
  LEFT JOIN current_active_assignment_count AS caac
    ON caac.coach_id = cl.coach_id
  LEFT JOIN existing_staff_role_match AS esrm
    ON esrm.coach_id = cl.coach_id
   AND esrm.normalized_staff_value IN (agr.role_key, lower(agr.role_de))
  WHERE cl.distinct_legacy_role_count = 1
    AND COALESCE(caac.active_current_assignment_count, 0) = 0
    AND NOT EXISTS (
      SELECT 1
      FROM assignment_roles AS ar
      WHERE ar.coach_id = cl.coach_id
        AND ar.normalized_role = cl.normalized_role
    )
    AND esrm.coach_id IS NULL
)
SELECT
  coach_id,
  'INSERT INTO public.coach_staff_roles (coach_id, role_key, role_de, role_en, valid_from, valid_until, is_active, sort_order, created_at, updated_at, created_by, updated_by) SELECT '''
  || coach_id::text
  || '''::uuid, '''
  || role_key
  || ''', '''
  || replace(role_de, '''', '''''')
  || ''', '
  || CASE
    WHEN role_en IS NULL THEN 'NULL'
    ELSE '''' || replace(role_en, '''', '''''') || ''''
  END
  || ', NULL, NULL, true, 0, now(), now(), NULL, NULL WHERE NOT EXISTS (SELECT 1 FROM public.coach_staff_roles WHERE coach_id = '''
  || coach_id::text
  || '''::uuid AND is_active = true AND COALESCE(lower(NULLIF(btrim(role_key), '''')), lower(NULLIF(btrim(role_de), ''''))) IN ('''
  || role_key
  || ''', '''
  || lower(role_de)
  || '''));' AS proposed_insert_sql
FROM safe_preview_candidates
ORDER BY coach_id;

COMMIT;
