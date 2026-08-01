-- B13.15 coach legacy role inventory
-- Read only. Only SELECT and WITH ... SELECT blocks.
-- Output intentionally excludes names, email addresses, phone numbers and similar personal data.

-- 1) Total coach count.
SELECT COUNT(*) AS coach_count_total
FROM public.coaches;

-- 2) Coaches with non-empty coaches.role.
SELECT COUNT(*) AS coaches_with_role
FROM public.coaches
WHERE NULLIF(btrim(role), '') IS NOT NULL;

-- 3) Coaches with non-empty coaches.role_de.
SELECT COUNT(*) AS coaches_with_role_de
FROM public.coaches
WHERE NULLIF(btrim(role_de), '') IS NOT NULL;

-- 4) Coaches with non-empty coaches.role_en.
SELECT COUNT(*) AS coaches_with_role_en
FROM public.coaches
WHERE NULLIF(btrim(role_en), '') IS NOT NULL;

-- 5) Distinct legacy role values and frequencies by source field.
WITH normalized_values AS (
  SELECT 'role' AS source_field, lower(btrim(role)) AS normalized_role
  FROM public.coaches
  WHERE NULLIF(btrim(role), '') IS NOT NULL

  UNION ALL

  SELECT 'role_de' AS source_field, lower(btrim(role_de)) AS normalized_role
  FROM public.coaches
  WHERE NULLIF(btrim(role_de), '') IS NOT NULL

  UNION ALL

  SELECT 'role_en' AS source_field, lower(btrim(role_en)) AS normalized_role
  FROM public.coaches
  WHERE NULLIF(btrim(role_en), '') IS NOT NULL
)
SELECT
  source_field,
  normalized_role,
  COUNT(*) AS coach_count
FROM normalized_values
GROUP BY source_field, normalized_role
ORDER BY source_field, coach_count DESC, normalized_role;

-- 6) Coaches with at least one active current-season assignment row.
WITH current_season AS (
  SELECT id
  FROM public.seasons
  WHERE is_current = true
)
SELECT COUNT(DISTINCT cts.coach_id) AS coaches_with_current_active_assignment
FROM public.coach_team_seasons AS cts
JOIN public.team_seasons AS ts
  ON ts.id = cts.team_season_id
JOIN current_season AS cs
  ON cs.id = ts.season_id
WHERE cts.is_active = true;

-- 7) Coaches without an active current-season assignment row.
WITH current_season AS (
  SELECT id
  FROM public.seasons
  WHERE is_current = true
), current_active_coaches AS (
  SELECT DISTINCT cts.coach_id
  FROM public.coach_team_seasons AS cts
  JOIN public.team_seasons AS ts
    ON ts.id = cts.team_season_id
  JOIN current_season AS cs
    ON cs.id = ts.season_id
  WHERE cts.is_active = true
)
SELECT COUNT(*) AS coaches_without_current_active_assignment
FROM public.coaches AS c
LEFT JOIN current_active_coaches AS cac
  ON cac.coach_id = c.id
WHERE cac.coach_id IS NULL;

-- 8) Coaches with only historical assignments and no active current-season assignment.
WITH current_season AS (
  SELECT id
  FROM public.seasons
  WHERE is_current = true
), current_active_coaches AS (
  SELECT DISTINCT cts.coach_id
  FROM public.coach_team_seasons AS cts
  JOIN public.team_seasons AS ts
    ON ts.id = cts.team_season_id
  JOIN current_season AS cs
    ON cs.id = ts.season_id
  WHERE cts.is_active = true
), coaches_with_any_assignment AS (
  SELECT DISTINCT coach_id
  FROM public.coach_team_seasons
)
SELECT COUNT(*) AS coaches_with_historical_assignments_only
FROM coaches_with_any_assignment AS cwaa
LEFT JOIN current_active_coaches AS cac
  ON cac.coach_id = cwaa.coach_id
WHERE cac.coach_id IS NULL;

-- 9) Legacy role values fully reconstructable from assignment roles.
WITH coach_master_role AS (
  SELECT
    c.id AS coach_id,
    lower(
      COALESCE(
        NULLIF(btrim(c.role_de), ''),
        NULLIF(btrim(c.role), ''),
        NULLIF(btrim(c.role_en), '')
      )
    ) AS normalized_master_role
  FROM public.coaches AS c
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
)
SELECT
  cmr.coach_id,
  cmr.normalized_master_role AS role_value,
  'TEAM_ROLE_RECONSTRUCTABLE' AS inventory_status
FROM coach_master_role AS cmr
WHERE cmr.normalized_master_role IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM assignment_roles AS ar
    WHERE ar.coach_id = cmr.coach_id
      AND ar.normalized_role = cmr.normalized_master_role
  )
ORDER BY cmr.coach_id;

-- 10) Legacy role values not reconstructable from assignment roles.
WITH coach_master_role AS (
  SELECT
    c.id AS coach_id,
    lower(
      COALESCE(
        NULLIF(btrim(c.role_de), ''),
        NULLIF(btrim(c.role), ''),
        NULLIF(btrim(c.role_en), '')
      )
    ) AS normalized_master_role
  FROM public.coaches AS c
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
)
SELECT
  cmr.coach_id,
  cmr.normalized_master_role AS role_value,
  'NOT_RECONSTRUCTABLE_FROM_ASSIGNMENTS' AS inventory_status
FROM coach_master_role AS cmr
WHERE cmr.normalized_master_role IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM assignment_roles AS ar
    WHERE ar.coach_id = cmr.coach_id
      AND ar.normalized_role = cmr.normalized_master_role
  )
ORDER BY cmr.coach_id;

-- 11) Legacy values that may represent general staff functions.
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
), coach_master_role AS (
  SELECT
    c.id AS coach_id,
    lower(
      COALESCE(
        NULLIF(btrim(c.role_de), ''),
        NULLIF(btrim(c.role), ''),
        NULLIF(btrim(c.role_en), '')
      )
    ) AS normalized_master_role
  FROM public.coaches AS c
), current_active_assignment_coaches AS (
  SELECT DISTINCT cts.coach_id
  FROM public.coach_team_seasons AS cts
  JOIN public.team_seasons AS ts
    ON ts.id = cts.team_season_id
  JOIN public.seasons AS s
    ON s.id = ts.season_id
  WHERE s.is_current = true
    AND cts.is_active = true
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
)
SELECT
  cmr.coach_id,
  agr.role_key,
  cmr.normalized_master_role AS role_value,
  'GENERAL_STAFF_CANDIDATE' AS inventory_status
FROM coach_master_role AS cmr
JOIN approved_general_roles AS agr
  ON agr.normalized_role = cmr.normalized_master_role
LEFT JOIN current_active_assignment_coaches AS caac
  ON caac.coach_id = cmr.coach_id
WHERE cmr.normalized_master_role IS NOT NULL
  AND caac.coach_id IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM assignment_roles AS ar
    WHERE ar.coach_id = cmr.coach_id
      AND ar.normalized_role = cmr.normalized_master_role
  )
ORDER BY cmr.coach_id;

-- 12) Conflicts between master role and active current-season assignment roles.
WITH current_active_assignment_roles AS (
  SELECT DISTINCT
    cts.coach_id,
    lower(
      COALESCE(
        NULLIF(btrim(cts.role_de), ''),
        NULLIF(btrim(cts.role_en), '')
      )
    ) AS normalized_assignment_role
  FROM public.coach_team_seasons AS cts
  JOIN public.team_seasons AS ts
    ON ts.id = cts.team_season_id
  JOIN public.seasons AS s
    ON s.id = ts.season_id
  WHERE s.is_current = true
    AND cts.is_active = true
), coach_master_role AS (
  SELECT
    c.id AS coach_id,
    lower(
      COALESCE(
        NULLIF(btrim(c.role_de), ''),
        NULLIF(btrim(c.role), ''),
        NULLIF(btrim(c.role_en), '')
      )
    ) AS normalized_master_role
  FROM public.coaches AS c
)
SELECT
  cmr.coach_id,
  cmr.normalized_master_role AS master_role_value,
  caa.normalized_assignment_role AS current_assignment_role_value,
  'CONFLICTING' AS inventory_status
FROM coach_master_role AS cmr
JOIN current_active_assignment_roles AS caa
  ON caa.coach_id = cmr.coach_id
WHERE cmr.normalized_master_role IS NOT NULL
  AND caa.normalized_assignment_role IS NOT NULL
  AND cmr.normalized_master_role <> caa.normalized_assignment_role
ORDER BY cmr.coach_id, caa.normalized_assignment_role;

-- 13) Coaches with multiple differing master role values across role, role_de and role_en.
WITH role_variants AS (
  SELECT
    c.id AS coach_id,
    lower(btrim(v.role_value)) AS normalized_role_value
  FROM public.coaches AS c
  CROSS JOIN LATERAL (
    VALUES (c.role), (c.role_de), (c.role_en)
  ) AS v(role_value)
  WHERE NULLIF(btrim(v.role_value), '') IS NOT NULL
)
SELECT
  coach_id,
  COUNT(DISTINCT normalized_role_value) AS distinct_master_role_value_count,
  ARRAY_AGG(DISTINCT normalized_role_value ORDER BY normalized_role_value) AS normalized_role_values
FROM role_variants
GROUP BY coach_id
HAVING COUNT(DISTINCT normalized_role_value) > 1
ORDER BY distinct_master_role_value_count DESC, coach_id;

-- 14) Null, empty and whitespace status summary for legacy fields.
SELECT
  COUNT(*) FILTER (WHERE role IS NULL) AS role_null_count,
  COUNT(*) FILTER (WHERE role IS NOT NULL AND NULLIF(btrim(role), '') IS NULL) AS role_blank_or_whitespace_count,
  COUNT(*) FILTER (WHERE role_de IS NULL) AS role_de_null_count,
  COUNT(*) FILTER (WHERE role_de IS NOT NULL AND NULLIF(btrim(role_de), '') IS NULL) AS role_de_blank_or_whitespace_count,
  COUNT(*) FILTER (WHERE role_en IS NULL) AS role_en_null_count,
  COUNT(*) FILTER (WHERE role_en IS NOT NULL AND NULLIF(btrim(role_en), '') IS NULL) AS role_en_blank_or_whitespace_count
FROM public.coaches;

-- 15) Backfill candidates preview with technical ids and role values only.
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
), coach_master_role AS (
  SELECT
    c.id AS coach_id,
    lower(
      COALESCE(
        NULLIF(btrim(c.role_de), ''),
        NULLIF(btrim(c.role), ''),
        NULLIF(btrim(c.role_en), '')
      )
    ) AS normalized_master_role
  FROM public.coaches AS c
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
  SELECT cts.coach_id, COUNT(*) AS current_active_assignment_count
  FROM public.coach_team_seasons AS cts
  JOIN public.team_seasons AS ts
    ON ts.id = cts.team_season_id
  JOIN public.seasons AS s
    ON s.id = ts.season_id
  WHERE s.is_current = true
    AND cts.is_active = true
  GROUP BY cts.coach_id
), historical_assignment_count AS (
  SELECT coach_id, COUNT(*) AS historical_assignment_count
  FROM public.coach_team_seasons
  GROUP BY coach_id
), conflicting_master_values AS (
  SELECT rv.coach_id
  FROM (
    SELECT
      c.id AS coach_id,
      lower(btrim(v.role_value)) AS normalized_role_value
    FROM public.coaches AS c
    CROSS JOIN LATERAL (
      VALUES (c.role), (c.role_de), (c.role_en)
    ) AS v(role_value)
    WHERE NULLIF(btrim(v.role_value), '') IS NOT NULL
  ) AS rv
  GROUP BY rv.coach_id
  HAVING COUNT(DISTINCT rv.normalized_role_value) > 1
)
SELECT
  cmr.coach_id,
  agr.role_key,
  agr.role_de,
  agr.role_en,
  cmr.normalized_master_role AS legacy_role_value,
  COALESCE(caac.current_active_assignment_count, 0) AS current_active_assignment_count,
  COALESCE(hac.historical_assignment_count, 0) AS assignment_count_total,
  'MANUAL_PREVIEW_ONLY' AS proposal_status
FROM coach_master_role AS cmr
JOIN approved_general_roles AS agr
  ON agr.normalized_role = cmr.normalized_master_role
LEFT JOIN assignment_roles AS ar
  ON ar.coach_id = cmr.coach_id
 AND ar.normalized_role = cmr.normalized_master_role
LEFT JOIN current_active_assignment_count AS caac
  ON caac.coach_id = cmr.coach_id
LEFT JOIN historical_assignment_count AS hac
  ON hac.coach_id = cmr.coach_id
LEFT JOIN conflicting_master_values AS cmv
  ON cmv.coach_id = cmr.coach_id
WHERE cmr.normalized_master_role IS NOT NULL
  AND ar.coach_id IS NULL
  AND COALESCE(caac.current_active_assignment_count, 0) = 0
  AND cmv.coach_id IS NULL
ORDER BY cmr.coach_id;
