-- B15.24H2 Round 2: read-only inventory for missing football teams,
-- board members and coaches. This script intentionally returns aggregates only.
-- READ ONLY: no DDL, DML, grants, policies or configuration changes.

-- H2R2.01: department identities needed by the scoped loaders.
SELECT
  'H2R2.01_DEPARTMENTS' AS section,
  d.slug,
  d.is_active,
  count(t.id) AS team_count,
  count(t.id) FILTER (WHERE t.is_active IS TRUE) AS active_team_count
FROM public.departments AS d
LEFT JOIN public.teams AS t ON t.department_id = d.id
WHERE d.slug IN ('fussball', 'tischtennis')
GROUP BY d.id, d.slug, d.is_active
ORDER BY d.slug;

-- H2R2.02: teams by department assignment and active state. NULL is kept
-- separate and must never be interpreted as football.
SELECT
  'H2R2.02_TEAMS_BY_SCOPE' AS section,
  coalesce(d.slug, '<none-or-invalid>') AS department_slug,
  t.is_active,
  count(*) AS team_count
FROM public.teams AS t
LEFT JOIN public.departments AS d ON d.id = t.department_id
GROUP BY coalesce(d.slug, '<none-or-invalid>'), t.is_active
ORDER BY department_slug, t.is_active DESC;

-- H2R2.03: season availability behind the dashboard team list.
SELECT
  'H2R2.03_TEAM_SEASONS_BY_SCOPE' AS section,
  coalesce(d.slug, '<none-or-invalid>') AS department_slug,
  s.is_current AS season_is_current,
  ts.is_active AS team_season_is_active,
  count(*) AS team_season_count,
  count(DISTINCT t.id) AS distinct_team_count
FROM public.teams AS t
LEFT JOIN public.departments AS d ON d.id = t.department_id
JOIN public.team_seasons AS ts ON ts.team_id = t.id
JOIN public.seasons AS s ON s.id = ts.season_id
GROUP BY
  coalesce(d.slug, '<none-or-invalid>'),
  s.is_current,
  ts.is_active
ORDER BY department_slug, season_is_current DESC, team_season_is_active DESC;

-- H2R2.04: board-member department assignment. No names/contact data.
SELECT
  'H2R2.04_BOARD_MEMBERS_BY_SCOPE' AS section,
  coalesce(d.slug, '<none-or-invalid>') AS department_slug,
  bm.is_active,
  count(*) AS board_member_count
FROM public.board_members AS bm
LEFT JOIN public.departments AS d ON d.id = bm.department_id
GROUP BY coalesce(d.slug, '<none-or-invalid>'), bm.is_active
ORDER BY department_slug, bm.is_active DESC;

-- H2R2.05: board-role/board-member department compatibility.
SELECT
  'H2R2.05_BOARD_ROLE_COMPATIBILITY' AS section,
  coalesce(member_department.slug, '<none-or-invalid>') AS member_department_slug,
  coalesce(role_department.slug, '<shared-or-invalid>') AS role_department_slug,
  count(*) AS board_member_count
FROM public.board_members AS bm
LEFT JOIN public.departments AS member_department
  ON member_department.id = bm.department_id
LEFT JOIN public.board_roles AS br ON br.id = bm.role_id
LEFT JOIN public.departments AS role_department
  ON role_department.id = br.department_id
GROUP BY
  coalesce(member_department.slug, '<none-or-invalid>'),
  coalesce(role_department.slug, '<shared-or-invalid>')
ORDER BY member_department_slug, role_department_slug;

-- H2R2.06: coaches with active current-season relations per department.
WITH current_active_relations AS MATERIALIZED (
  SELECT DISTINCT
    cts.coach_id,
    t.department_id
  FROM public.coach_team_seasons AS cts
  JOIN public.team_seasons AS ts ON ts.id = cts.team_season_id
  JOIN public.seasons AS s ON s.id = ts.season_id
  JOIN public.teams AS t ON t.id = ts.team_id
  WHERE cts.is_active IS TRUE
    AND ts.is_active IS TRUE
    AND s.is_current IS TRUE
    AND t.is_active IS TRUE
)
SELECT
  'H2R2.06_COACHES_BY_ACTIVE_SCOPE' AS section,
  coalesce(d.slug, '<no-active-department-relation>') AS department_slug,
  count(DISTINCT c.id) AS coach_count
FROM public.coaches AS c
LEFT JOIN current_active_relations AS relation ON relation.coach_id = c.id
LEFT JOIN public.departments AS d ON d.id = relation.department_id
GROUP BY coalesce(d.slug, '<no-active-department-relation>')
ORDER BY department_slug;

-- H2R2.07: compact final inventory, including cross-department relations.
WITH coach_relation_summary AS MATERIALIZED (
  SELECT
    c.id AS coach_id,
    count(DISTINCT t.department_id) FILTER (
      WHERE cts.is_active IS TRUE
        AND ts.is_active IS TRUE
        AND s.is_current IS TRUE
        AND t.is_active IS TRUE
        AND t.department_id IS NOT NULL
    ) AS active_department_count
  FROM public.coaches AS c
  LEFT JOIN public.coach_team_seasons AS cts ON cts.coach_id = c.id
  LEFT JOIN public.team_seasons AS ts ON ts.id = cts.team_season_id
  LEFT JOIN public.seasons AS s ON s.id = ts.season_id
  LEFT JOIN public.teams AS t ON t.id = ts.team_id
  GROUP BY c.id
)
SELECT
  'H2R2.07_FINAL_COUNTS' AS section,
  (SELECT count(*) FROM public.teams) AS total_teams,
  (SELECT count(*) FROM public.teams WHERE department_id IS NULL) AS teams_without_department,
  (SELECT count(*) FROM public.board_members) AS total_board_members,
  (SELECT count(*) FROM public.board_members WHERE department_id IS NULL) AS board_members_without_department,
  (SELECT count(*) FROM public.coaches) AS total_coaches,
  (SELECT count(*) FROM coach_relation_summary WHERE active_department_count = 0) AS coaches_without_active_department,
  (SELECT count(*) FROM coach_relation_summary WHERE active_department_count > 1) AS coaches_with_multiple_active_departments;
