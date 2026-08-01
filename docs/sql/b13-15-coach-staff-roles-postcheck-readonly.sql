-- B13.15 coach staff roles postcheck
-- Read only. Run only after a later approved schema and data step.

-- 1) Total number of general staff roles.
SELECT COUNT(*) AS coach_staff_role_count_total
FROM public.coach_staff_roles;

-- 2) Duplicate active general staff roles by coach and normalized role identity.
SELECT
  coach_id,
  COALESCE(lower(NULLIF(btrim(role_key), '')), lower(NULLIF(btrim(role_de), ''))) AS normalized_role_identity,
  COUNT(*) AS active_row_count
FROM public.coach_staff_roles
WHERE is_active = true
GROUP BY coach_id, COALESCE(lower(NULLIF(btrim(role_key), '')), lower(NULLIF(btrim(role_de), '')))
HAVING COUNT(*) > 1
ORDER BY active_row_count DESC, coach_id, normalized_role_identity;

-- 3) Invalid date ranges.
SELECT
  id,
  coach_id,
  valid_from,
  valid_until
FROM public.coach_staff_roles
WHERE valid_from IS NOT NULL
  AND valid_until IS NOT NULL
  AND valid_until < valid_from
ORDER BY coach_id, id;

-- 4) Orphaned coach references.
SELECT
  csr.id,
  csr.coach_id
FROM public.coach_staff_roles AS csr
LEFT JOIN public.coaches AS c
  ON c.id = csr.coach_id
WHERE c.id IS NULL
ORDER BY csr.id;

-- 5) Staff role rows without usable role_de.
SELECT
  id,
  coach_id,
  role_key,
  role_de
FROM public.coach_staff_roles
WHERE NULLIF(btrim(role_de), '') IS NULL
ORDER BY coach_id, id;

-- 6) General staff candidates still not represented in coach_staff_roles.
WITH approved_general_roles AS (
  SELECT 'jugend_torwarttrainer' AS role_key, 'jugend-torwarttrainer' AS normalized_role, 'Jugend-Torwarttrainer' AS role_de
  UNION ALL
  SELECT 'trainerkoordinator', 'trainerkoordinator', 'Trainerkoordinator'
  UNION ALL
  SELECT 'athletiktrainer_verein', 'athletiktrainer des vereins', 'Athletiktrainer des Vereins'
  UNION ALL
  SELECT 'trainerpool', 'trainerpool', 'Trainerpool'
  UNION ALL
  SELECT 'scout', 'scout', 'Scout'
  UNION ALL
  SELECT 'sportlicher_berater', 'sportlicher berater', 'Sportlicher Berater'
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
), active_current_assignment_count AS (
  SELECT cts.coach_id, COUNT(*) AS active_current_assignment_count
  FROM public.coach_team_seasons AS cts
  JOIN public.team_seasons AS ts
    ON ts.id = cts.team_season_id
  JOIN public.seasons AS s
    ON s.id = ts.season_id
  WHERE s.is_current = true
    AND cts.is_active = true
  GROUP BY cts.coach_id
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
  cmr.normalized_master_role AS legacy_role_value
FROM coach_master_role AS cmr
JOIN approved_general_roles AS agr
  ON agr.normalized_role = cmr.normalized_master_role
LEFT JOIN active_current_assignment_count AS acac
  ON acac.coach_id = cmr.coach_id
WHERE COALESCE(acac.active_current_assignment_count, 0) = 0
  AND NOT EXISTS (
    SELECT 1
    FROM assignment_roles AS ar
    WHERE ar.coach_id = cmr.coach_id
      AND ar.normalized_role = cmr.normalized_master_role
  )
  AND NOT EXISTS (
    SELECT 1
    FROM public.coach_staff_roles AS csr
    WHERE csr.coach_id = cmr.coach_id
      AND csr.is_active = true
      AND COALESCE(lower(NULLIF(btrim(csr.role_key), '')), lower(NULLIF(btrim(csr.role_de), ''))) IN (agr.role_key, lower(agr.role_de))
  )
ORDER BY cmr.coach_id;

-- 7) Legacy conflict cases still present.
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
  caa.normalized_assignment_role AS current_assignment_role_value
FROM coach_master_role AS cmr
JOIN current_active_assignment_roles AS caa
  ON caa.coach_id = cmr.coach_id
WHERE cmr.normalized_master_role IS NOT NULL
  AND caa.normalized_assignment_role IS NOT NULL
  AND cmr.normalized_master_role <> caa.normalized_assignment_role
ORDER BY cmr.coach_id, caa.normalized_assignment_role;

-- 8) Current legacy master field population snapshot.
SELECT
  COUNT(*) FILTER (WHERE NULLIF(btrim(role), '') IS NOT NULL) AS coaches_role_still_populated,
  COUNT(*) FILTER (WHERE NULLIF(btrim(role_de), '') IS NOT NULL) AS coaches_role_de_still_populated,
  COUNT(*) FILTER (WHERE NULLIF(btrim(role_en), '') IS NOT NULL) AS coaches_role_en_still_populated
FROM public.coaches;

-- 9) coach_team_seasons technical summary remains visible.
SELECT
  COUNT(*) AS coach_team_season_row_count,
  COUNT(*) FILTER (WHERE is_active = true) AS coach_team_season_active_row_count
FROM public.coach_team_seasons;

-- 10) Teamless coaches with active staff roles remain without active current team assignment.
WITH active_staff_role_coaches AS (
  SELECT DISTINCT coach_id
  FROM public.coach_staff_roles
  WHERE is_active = true
), current_active_team_assignment_coaches AS (
  SELECT DISTINCT cts.coach_id
  FROM public.coach_team_seasons AS cts
  JOIN public.team_seasons AS ts
    ON ts.id = cts.team_season_id
  JOIN public.seasons AS s
    ON s.id = ts.season_id
  WHERE s.is_current = true
    AND cts.is_active = true
)
SELECT
  asrc.coach_id,
  'NO_TEAM_SCOPE_EXPECTED' AS scope_expectation
FROM active_staff_role_coaches AS asrc
LEFT JOIN current_active_team_assignment_coaches AS catac
  ON catac.coach_id = asrc.coach_id
WHERE catac.coach_id IS NULL
ORDER BY asrc.coach_id;
