-- B15.21B3 postcheck. READ ONLY.
SELECT conname, pg_get_constraintdef(oid) AS definition FROM pg_constraint WHERE conrelid='public.membership_requests'::regclass AND conname='membership_requests_request_type_check';
SELECT request_type, count(*) AS row_count FROM public.membership_requests GROUP BY request_type ORDER BY request_type;
SELECT count(*) AS request_count, md5(COALESCE(string_agg(to_jsonb(mr)::text, E'\n' ORDER BY mr.id), '')) AS existing_data_fingerprint FROM public.membership_requests mr;
SELECT c.relrowsecurity, c.relforcerowsecurity FROM pg_class c WHERE c.oid='public.membership_requests'::regclass;
SELECT role_name, privilege, has_table_privilege(role_name,'public.membership_requests',privilege) AS allowed FROM unnest(ARRAY['anon','authenticated','service_role']) role_name CROSS JOIN unnest(ARRAY['SELECT','INSERT','UPDATE','DELETE']) privilege ORDER BY role_name,privilege;
