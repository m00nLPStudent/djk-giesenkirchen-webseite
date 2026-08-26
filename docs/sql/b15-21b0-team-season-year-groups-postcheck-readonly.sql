-- B15.21B0 postcheck. READ ONLY.
SELECT c.relrowsecurity, c.relforcerowsecurity FROM pg_class c WHERE c.oid = 'public.team_season_year_groups'::regclass;
SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_schema='public' AND table_name='team_season_year_groups' ORDER BY ordinal_position;
SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid='public.team_season_year_groups'::regclass ORDER BY conname;
SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid='public.membership_requests'::regclass AND conname='membership_requests_desired_team_season_id_fkey';
SELECT indexname, indexdef FROM pg_indexes WHERE schemaname='public' AND tablename IN ('team_season_year_groups','membership_requests') AND indexname LIKE '%team_season%' ORDER BY indexname;
SELECT policyname, roles, cmd, qual, with_check FROM pg_policies WHERE schemaname='public' AND tablename='team_season_year_groups';
SELECT role_name, privilege, has_table_privilege(role_name, 'public.team_season_year_groups', privilege) AS allowed
FROM unnest(ARRAY['anon','authenticated','service_role']) role_name CROSS JOIN unnest(ARRAY['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER']) privilege ORDER BY role_name, privilege;
SELECT role_name, privilege, has_column_privilege(role_name, 'public.membership_requests', 'desired_team_season_id', privilege) AS allowed
FROM unnest(ARRAY['anon','authenticated','service_role']) role_name CROSS JOIN unnest(ARRAY['SELECT','INSERT','UPDATE','REFERENCES']) privilege ORDER BY role_name, privilege;
SELECT role_name, has_function_privilege(role_name, 'public.replace_team_season_year_groups(uuid,smallint[])', 'EXECUTE') AS can_execute
FROM unnest(ARRAY['anon','authenticated','service_role']) role_name ORDER BY role_name;
SELECT p.oid::regprocedure::text AS signature, p.prosecdef AS security_definer, p.proconfig, pg_get_functiondef(p.oid) AS definition
FROM pg_proc p WHERE p.oid = 'public.replace_team_season_year_groups(uuid,smallint[])'::regprocedure;
SELECT count(*) AS year_group_count FROM public.team_season_year_groups;
SELECT count(*) AS request_count,
       md5(COALESCE(string_agg((to_jsonb(mr) - 'desired_team_season_id')::text, E'\n' ORDER BY mr.id), '')) AS existing_data_fingerprint
FROM public.membership_requests mr;
SELECT count(*) AS preexisting_requests_with_guessed_backfill FROM public.membership_requests WHERE desired_team_season_id IS NOT NULL;
