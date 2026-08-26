-- B15.21A final postcheck. READ ONLY. Run immediately after the proposal.

SELECT c.relrowsecurity, c.relforcerowsecurity
FROM pg_class c
WHERE c.oid = 'public.membership_requests'::regclass;

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'membership_requests'
  AND column_name IN ('privacy_consent', 'privacy_consent_at', 'privacy_policy_version')
ORDER BY column_name;

SELECT c.conname, pg_get_constraintdef(c.oid) AS definition
FROM pg_constraint c
WHERE c.conrelid = 'public.membership_requests'::regclass
  AND c.conname = 'membership_requests_privacy_consent_evidence_check';

-- Expected: zero rows. Browser roles have neither current nor historical policies.
SELECT policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'membership_requests'
ORDER BY policyname;

SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'membership_requests'
  AND grantee IN ('PUBLIC', 'anon', 'authenticated', 'service_role')
ORDER BY grantee, privilege_type;

-- Expected: no PUBLIC/anon/authenticated rows; service_role may be listed.
SELECT grantee, column_name, privilege_type
FROM information_schema.column_privileges
WHERE table_schema = 'public'
  AND table_name = 'membership_requests'
  AND grantee IN ('PUBLIC', 'anon', 'authenticated', 'service_role')
ORDER BY grantee, column_name, privilege_type;

-- Expected: every anon/authenticated value false and every service_role value true.
SELECT role_name, privilege,
       has_table_privilege(role_name, 'public.membership_requests', privilege) AS allowed
FROM unnest(ARRAY['anon', 'authenticated', 'service_role']) AS role_name
CROSS JOIN unnest(ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER']) AS privilege
ORDER BY role_name, privilege;

-- Compare count and fingerprint with the final preflight output. Expected directly
-- after rollout: count remains 5 and fingerprint is identical.
SELECT count(*) AS request_count,
       md5(COALESCE(string_agg(
         (to_jsonb(mr) - ARRAY['privacy_consent', 'privacy_consent_at', 'privacy_policy_version'])::text,
         E'\n' ORDER BY mr.id
       ), '')) AS existing_data_fingerprint
FROM public.membership_requests mr;

SELECT count(*) FILTER (WHERE privacy_consent = true AND (privacy_consent_at IS NULL OR nullif(btrim(privacy_policy_version), '') IS NULL)) AS invalid_positive_consent,
       count(*) FILTER (WHERE privacy_consent = false AND (privacy_consent_at IS NOT NULL OR privacy_policy_version IS NOT NULL)) AS invalid_negative_consent
FROM public.membership_requests;

-- Expected: five pre-existing rows have false/no evidence immediately after rollout.
SELECT count(*) AS legacy_rows_without_claimed_consent
FROM public.membership_requests
WHERE privacy_consent = false
  AND privacy_consent_at IS NULL
  AND privacy_policy_version IS NULL;
