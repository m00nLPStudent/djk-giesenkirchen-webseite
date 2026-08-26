-- B15.21B3 request-type preflight. READ ONLY.
SELECT request_type, count(*) AS row_count FROM public.membership_requests GROUP BY request_type ORDER BY request_type;
SELECT request_type, count(*) AS recipient_count FROM public.membership_request_recipients GROUP BY request_type ORDER BY request_type NULLS FIRST;
SELECT conname, pg_get_constraintdef(oid) AS definition FROM pg_constraint WHERE conrelid='public.membership_requests'::regclass AND conname='membership_requests_request_type_check';
SELECT count(*) AS request_count, md5(COALESCE(string_agg(to_jsonb(mr)::text, E'\n' ORDER BY mr.id), '')) AS existing_data_fingerprint FROM public.membership_requests mr;
WITH allowed(value) AS (VALUES ('aktives-mitglied-fussball'),('aktives-mitglied-tischtennis'),('aktives-mitglied-gymnastik-damen'),('aktives-mitglied-behindertensport'),('trainer-werden'),('passives-mitglied'),('sonstiges'))
SELECT DISTINCT mr.request_type AS incompatible_value FROM public.membership_requests mr WHERE NOT EXISTS (SELECT 1 FROM allowed WHERE value=mr.request_type)
UNION
SELECT DISTINCT mrr.request_type FROM public.membership_request_recipients mrr WHERE mrr.request_type IS NOT NULL AND NOT EXISTS (SELECT 1 FROM allowed WHERE value=mrr.request_type)
ORDER BY incompatible_value;
