-- B15.21B3.1: READ-ONLY inventory. Execute manually only.
SELECT
  t.id,
  t.name_de,
  t.slug,
  t.age_group,
  t.is_active,
  t.department_id,
  count(ts.id) AS team_season_count,
  count(ts.id) FILTER (WHERE ts.is_active = true) AS active_team_season_count
FROM public.teams AS t
LEFT JOIN public.team_seasons AS ts ON ts.team_id = t.id
WHERE t.is_active = true
  AND t.department_id IS NULL
GROUP BY t.id, t.name_de, t.slug, t.age_group, t.is_active, t.department_id
ORDER BY t.name_de, t.id;
