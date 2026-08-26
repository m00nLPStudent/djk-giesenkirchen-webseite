-- B15.21B3: READ-ONLY diagnosis for birth year 2016.
-- This file performs SELECTs only. Execute manually in the Supabase SQL editor.

-- 1. Resolver prerequisites: exactly one current season and one active football department are required.
SELECT
  s.id,
  s.name,
  s.is_current,
  s.is_active
FROM public.seasons AS s
WHERE s.is_current = true
ORDER BY s.name, s.id;

SELECT
  d.id,
  d.name_de,
  d.slug,
  d.is_active
FROM public.departments AS d
WHERE d.slug = 'fussball'
ORDER BY d.id;

-- 2. Complete relation chain and the exact conditions used by the B2/B3 resolver.
WITH resolver_context AS MATERIALIZED (
  SELECT
    (SELECT count(*) FROM public.seasons WHERE is_current = true) AS current_season_count,
    (SELECT id FROM public.seasons WHERE is_current = true ORDER BY id LIMIT 1) AS current_season_id,
    (SELECT count(*) FROM public.departments WHERE slug = 'fussball' AND is_active = true) AS active_football_department_count,
    (SELECT id FROM public.departments WHERE slug = 'fussball' AND is_active = true ORDER BY id LIMIT 1) AS active_football_department_id
),
candidates AS MATERIALIZED (
  SELECT
    yg.birth_year,
    yg.team_season_id AS mapped_team_season_id,
    ts.id AS team_season_id,
    ts.name_de AS team_season_name,
    ts.season_id,
    s.name AS season_name,
    s.is_current AS season_is_current,
    s.is_active AS season_is_active,
    ts.is_active AS team_season_is_active,
    ts.team_id,
    t.name_de AS team_name,
    t.is_active AS team_is_active,
    t.department_id,
    d.name_de AS department_name,
    d.slug AS department_slug,
    d.is_active AS department_is_active,
    rc.current_season_count,
    rc.current_season_id,
    rc.active_football_department_count,
    rc.active_football_department_id
  FROM public.team_season_year_groups AS yg
  LEFT JOIN public.team_seasons AS ts ON ts.id = yg.team_season_id
  LEFT JOIN public.seasons AS s ON s.id = ts.season_id
  LEFT JOIN public.teams AS t ON t.id = ts.team_id
  LEFT JOIN public.departments AS d ON d.id = t.department_id
  CROSS JOIN resolver_context AS rc
  WHERE yg.birth_year = 2016
)
SELECT
  c.*,
  CASE
    WHEN c.current_season_count = 0 THEN 'EXCLUDED: no current season'
    WHEN c.current_season_count <> 1 THEN 'EXCLUDED: multiple current seasons'
    WHEN c.active_football_department_count = 0 THEN 'EXCLUDED: active football department missing'
    WHEN c.active_football_department_count <> 1 THEN 'EXCLUDED: multiple active football departments with slug fussball'
    WHEN c.team_season_id IS NULL THEN 'EXCLUDED: mapped team_season missing'
    WHEN c.season_id IS DISTINCT FROM c.current_season_id THEN 'EXCLUDED: mapping belongs to a non-current season'
    WHEN c.team_season_is_active IS DISTINCT FROM true THEN 'EXCLUDED: team_season inactive'
    WHEN c.team_id IS NULL OR c.team_name IS NULL THEN 'EXCLUDED: master team missing'
    WHEN c.department_id IS DISTINCT FROM c.active_football_department_id THEN 'EXCLUDED: master team is not assigned to the active football department'
    WHEN c.team_is_active IS DISTINCT FROM true THEN 'EXCLUDED: master team inactive'
    ELSE 'ELIGIBLE: resolver should return this team season'
  END AS resolver_result
FROM candidates AS c
ORDER BY c.team_season_name, c.team_season_id;

-- 3. A missing row above means there is no stored mapping for birth_year 2016 at all.
SELECT count(*) AS birth_year_2016_mapping_count
FROM public.team_season_year_groups
WHERE birth_year = 2016;
