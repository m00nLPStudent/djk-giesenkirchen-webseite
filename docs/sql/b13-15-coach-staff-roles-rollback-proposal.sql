-- B13.15 coach staff roles rollback proposal
-- Proposal only. Do not execute automatically.
-- No data-changing rollback SQL is proposed at this stage.
-- Reason: without a guaranteed provenance marker or persisted inserted-id ledger,
-- a fully safe machine rollback cannot isolate only rows created by a later backfill step.

-- Manual rollback gate 1:
-- capture the exact staff-role ids created by the approved execution step
-- before any cleanup or reversal is attempted.

-- Manual rollback gate 2:
-- confirm that coaches.role, coaches.role_de and coaches.role_en were not altered,
-- because these fields remain the fallback source during the transition.

-- Manual rollback gate 3:
-- confirm that no runtime read path has already been switched to depend only on coach_staff_roles.

-- Read-only support query A:
-- inspect current staff-role rows by technical id, coach id and role identity.
SELECT
  csr.id,
  csr.coach_id,
  csr.role_key,
  csr.role_de,
  csr.role_en,
  csr.valid_from,
  csr.valid_until,
  csr.is_active,
  csr.sort_order,
  csr.created_at,
  csr.updated_at
FROM public.coach_staff_roles AS csr
ORDER BY csr.created_at, csr.id;

-- Read-only support query B:
-- inspect coaches still carrying legacy master roles.
SELECT
  c.id AS coach_id,
  c.role,
  c.role_de,
  c.role_en
FROM public.coaches AS c
WHERE NULLIF(btrim(c.role), '') IS NOT NULL
   OR NULLIF(btrim(c.role_de), '') IS NOT NULL
   OR NULLIF(btrim(c.role_en), '') IS NOT NULL
ORDER BY c.id;

-- Read-only support query C:
-- inspect active current-season team assignments so staff-role reversal cannot be confused with team-role data.
WITH current_season AS (
  SELECT id
  FROM public.seasons
  WHERE is_current = true
)
SELECT
  cts.id,
  cts.coach_id,
  cts.team_season_id,
  cts.role_de,
  cts.role_en,
  cts.is_active,
  cts.sort_order
FROM public.coach_team_seasons AS cts
JOIN public.team_seasons AS ts
  ON ts.id = cts.team_season_id
JOIN current_season AS cs
  ON cs.id = ts.season_id
WHERE cts.is_active = true
ORDER BY cts.coach_id, cts.sort_order, cts.id;
