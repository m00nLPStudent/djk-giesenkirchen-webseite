-- B15.21B0 live preflight. READ ONLY. DO NOT MODIFY DATA.

SELECT id, name, slug, is_current, is_active, sort_order FROM public.seasons ORDER BY sort_order, name, id;
SELECT count(*) FILTER (WHERE is_current) AS current_count FROM public.seasons;
SELECT id, name_de, slug, age_group, is_active, department_id FROM public.teams ORDER BY sort_order, name_de, id;
SELECT id, team_id, season_id, name_de, slug, age_group, is_active, sort_order FROM public.team_seasons ORDER BY season_id, sort_order, name_de, id;
SELECT id, name_de, slug, is_active FROM public.departments ORDER BY sort_order, name_de, id;

-- Department quality: no name-based classification is performed.
SELECT t.id, t.name_de, t.slug, t.age_group, t.is_active, t.department_id
FROM public.teams t WHERE t.is_active AND t.department_id IS NULL ORDER BY t.name_de, t.id;
SELECT t.id, t.name_de, d.slug AS department_slug, d.is_active AS department_active
FROM public.teams t JOIN public.departments d ON d.id = t.department_id
WHERE t.is_active AND lower(d.slug) NOT IN ('fussball', 'fußball') ORDER BY d.slug, t.name_de;

WITH current_season AS (SELECT id FROM public.seasons WHERE is_current)
SELECT t.id, t.name_de FROM public.teams t
WHERE t.is_active AND NOT EXISTS (SELECT 1 FROM public.team_seasons ts JOIN current_season cs ON cs.id = ts.season_id WHERE ts.team_id = t.id AND ts.is_active)
ORDER BY t.name_de, t.id;
SELECT ts.id, ts.team_id, ts.season_id FROM public.team_seasons ts LEFT JOIN public.teams t ON t.id = ts.team_id WHERE t.id IS NULL ORDER BY ts.id;
SELECT team_id, season_id, count(*) FROM public.team_seasons GROUP BY team_id, season_id HAVING count(*) > 1 ORDER BY team_id, season_id;

SELECT request_type, count(*) FROM public.membership_requests GROUP BY request_type ORDER BY request_type;
SELECT request_type, count(*) FROM public.membership_request_recipients GROUP BY request_type ORDER BY request_type NULLS FIRST;
SELECT desired_team_id, count(*) FROM public.membership_requests GROUP BY desired_team_id ORDER BY desired_team_id NULLS FIRST;
SELECT count(*) AS request_count,
       md5(COALESCE(string_agg((to_jsonb(mr) - 'desired_team_season_id')::text, E'\n' ORDER BY mr.id), '')) AS existing_data_fingerprint
FROM public.membership_requests mr;

SELECT to_regclass('public.team_season_year_groups') AS existing_relation;
SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns
WHERE table_schema = 'public' AND table_name IN ('membership_requests', 'team_season_year_groups') ORDER BY table_name, ordinal_position;

