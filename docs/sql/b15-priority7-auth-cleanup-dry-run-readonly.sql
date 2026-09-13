-- PRIORITY 7 auth cleanup dry run - READ ONLY
-- Run manually before any Admin API deletion. Export all 8 resultsets.
-- No email addresses, names, auth metadata, tokens or candidate UUIDs are returned.

-- P7A.01_AUTH_SCOPE_GATE
WITH keep_operator AS MATERIALIZED (
  SELECT DISTINCT ap.id
  FROM public.admin_profiles ap
  JOIN auth.users au ON au.id = ap.id
  JOIN public.admin_user_roles aur ON aur.user_id = ap.id
  JOIN public.admin_roles ar ON ar.id = aur.role_id
  WHERE ap.is_active IS TRUE
    AND ar.key = 'superadmin'
    AND ar.is_active IS TRUE
), delete_candidates AS MATERIALIZED (
  SELECT au.id FROM auth.users au
  WHERE NOT EXISTS (SELECT 1 FROM keep_operator keep WHERE keep.id = au.id)
)
SELECT 'P7A.01_AUTH_SCOPE_GATE' AS section,
  (SELECT count(*) FROM auth.users)::bigint AS auth_user_count,
  (SELECT count(*) FROM keep_operator)::bigint AS keep_operator_count,
  (SELECT count(*) FROM delete_candidates)::bigint AS delete_candidate_count,
  (SELECT count(*) FROM auth.users) = 6 AS expected_auth_user_count,
  (SELECT count(*) FROM keep_operator) = 1 AS exactly_one_keep_operator,
  (SELECT count(*) FROM delete_candidates) = 5 AS exactly_five_delete_candidates;

-- P7A.02_KEEP_OPERATOR_INTEGRITY
WITH keep_operator AS MATERIALIZED (
  SELECT DISTINCT ap.id
  FROM public.admin_profiles ap
  JOIN auth.users au ON au.id = ap.id
  JOIN public.admin_user_roles aur ON aur.user_id = ap.id
  JOIN public.admin_roles ar ON ar.id = aur.role_id
  WHERE ap.is_active IS TRUE AND ar.key = 'superadmin' AND ar.is_active IS TRUE
)
SELECT 'P7A.02_KEEP_OPERATOR_INTEGRITY' AS section,
  (SELECT count(*) FROM keep_operator) = 1 AS exactly_one_keep_operator,
  (SELECT count(*) FROM auth.users au JOIN keep_operator keep ON keep.id = au.id) = 1 AS auth_user_present,
  (SELECT count(*) FROM public.admin_profiles ap JOIN keep_operator keep ON keep.id = ap.id WHERE ap.is_active IS TRUE) = 1 AS active_profile_present,
  EXISTS (
    SELECT 1 FROM public.admin_user_roles aur
    JOIN public.admin_roles ar ON ar.id = aur.role_id
    JOIN keep_operator keep ON keep.id = aur.user_id
    WHERE ar.key = 'superadmin' AND ar.is_active IS TRUE
  ) AS active_superadmin_binding_present;

-- P7A.03_DELETE_CANDIDATE_SHAPE
-- Candidate ordinals are non-identifying within this one resultset; no UUID is emitted.
WITH keep_operator AS MATERIALIZED (
  SELECT DISTINCT ap.id
  FROM public.admin_profiles ap JOIN auth.users au ON au.id = ap.id
  JOIN public.admin_user_roles aur ON aur.user_id = ap.id
  JOIN public.admin_roles ar ON ar.id = aur.role_id
  WHERE ap.is_active IS TRUE AND ar.key = 'superadmin' AND ar.is_active IS TRUE
), candidates AS MATERIALIZED (
  SELECT au.id, row_number() OVER (ORDER BY au.id) AS candidate_number
  FROM auth.users au WHERE NOT EXISTS (SELECT 1 FROM keep_operator keep WHERE keep.id = au.id)
)
SELECT 'P7A.03_DELETE_CANDIDATE_SHAPE' AS section,
  c.candidate_number,
  count(DISTINCT ap.id)::bigint AS profile_count,
  count(DISTINCT aur.role_id)::bigint AS role_binding_count,
  COALESCE(bool_or(ar.key = 'superadmin' AND ar.is_active IS TRUE), false) AS has_active_superadmin_role,
  COALESCE(bool_or(ap.profile_image_media_asset_id IS NOT NULL), false) AS has_profile_media_reference
FROM candidates c
LEFT JOIN public.admin_profiles ap ON ap.id = c.id
LEFT JOIN public.admin_user_roles aur ON aur.user_id = c.id
LEFT JOIN public.admin_roles ar ON ar.id = aur.role_id
GROUP BY c.candidate_number ORDER BY c.candidate_number;

-- P7A.04_AUTH_PROFILE_FOREIGN_KEYS
SELECT 'P7A.04_AUTH_PROFILE_FOREIGN_KEYS' AS section,
  child_ns.nspname AS child_schema,
  child.relname AS child_table,
  con.conname AS constraint_name,
  parent_ns.nspname AS parent_schema,
  parent.relname AS parent_table,
  CASE con.confdeltype WHEN 'a' THEN 'NO ACTION' WHEN 'r' THEN 'RESTRICT'
    WHEN 'c' THEN 'CASCADE' WHEN 'n' THEN 'SET NULL'
    WHEN 'd' THEN 'SET DEFAULT' END AS on_delete,
  pg_get_constraintdef(con.oid, true) AS definition
FROM pg_catalog.pg_constraint con
JOIN pg_catalog.pg_class child ON child.oid = con.conrelid
JOIN pg_catalog.pg_namespace child_ns ON child_ns.oid = child.relnamespace
JOIN pg_catalog.pg_class parent ON parent.oid = con.confrelid
JOIN pg_catalog.pg_namespace parent_ns ON parent_ns.oid = parent.relnamespace
WHERE con.contype = 'f'
  AND con.confrelid IN ('auth.users'::regclass, 'public.admin_profiles'::regclass)
ORDER BY child_ns.nspname, child.relname, con.conname;

-- P7A.05_FOREIGN_KEY_ACTION_SUMMARY
SELECT 'P7A.05_FOREIGN_KEY_ACTION_SUMMARY' AS section,
  CASE con.confdeltype WHEN 'a' THEN 'NO ACTION' WHEN 'r' THEN 'RESTRICT'
    WHEN 'c' THEN 'CASCADE' WHEN 'n' THEN 'SET NULL'
    WHEN 'd' THEN 'SET DEFAULT' END AS on_delete,
  count(*)::bigint AS constraint_count
FROM pg_catalog.pg_constraint con
WHERE con.contype = 'f'
  AND con.confrelid IN ('auth.users'::regclass, 'public.admin_profiles'::regclass)
GROUP BY con.confdeltype ORDER BY on_delete;

-- P7A.06_CANDIDATE_DEPENDENCY_COUNTS
WITH keep_operator AS MATERIALIZED (
  SELECT DISTINCT ap.id
  FROM public.admin_profiles ap JOIN auth.users au ON au.id = ap.id
  JOIN public.admin_user_roles aur ON aur.user_id = ap.id
  JOIN public.admin_roles ar ON ar.id = aur.role_id
  WHERE ap.is_active IS TRUE AND ar.key = 'superadmin' AND ar.is_active IS TRUE
), candidates AS MATERIALIZED (
  SELECT au.id FROM auth.users au
  WHERE NOT EXISTS (SELECT 1 FROM keep_operator keep WHERE keep.id = au.id)
)
SELECT 'P7A.06_CANDIDATE_DEPENDENCY_COUNTS' AS section, metric, row_count FROM (VALUES
  ('admin_profiles', (SELECT count(*)::bigint FROM public.admin_profiles ap JOIN candidates c ON c.id = ap.id)),
  ('admin_user_roles', (SELECT count(*)::bigint FROM public.admin_user_roles aur JOIN candidates c ON c.id = aur.user_id)),
  ('notifications_recipient', (SELECT count(*)::bigint FROM public.notifications n JOIN candidates c ON c.id = n.recipient_user_id)),
  ('notifications_actor', (SELECT count(*)::bigint FROM public.notifications n JOIN candidates c ON c.id = n.actor_user_id)),
  ('notification_preferences', (SELECT count(*)::bigint FROM public.notification_preferences np JOIN candidates c ON c.id = np.user_id)),
  ('admin_email_change_requests', (SELECT count(*)::bigint FROM public.admin_email_change_requests r JOIN candidates c ON c.id = r.user_id)),
  ('media_assets_uploaded_by', (SELECT count(*)::bigint FROM public.media_assets ma JOIN candidates c ON c.id = ma.uploaded_by_user_id)),
  ('notification_audit_total_must_keep', (SELECT count(*)::bigint FROM public.notification_audit))
) x(metric, row_count) ORDER BY metric;

-- P7A.07_FOUNDATION_GATE
SELECT 'P7A.07_FOUNDATION_GATE' AS section,
  (SELECT count(*) FROM public.admin_roles) = 13 AS roles_ok,
  (SELECT count(*) FROM public.admin_permissions) = 64 AS permissions_ok,
  (SELECT count(*) FROM public.admin_role_permissions) = 249 AS role_permissions_ok,
  (SELECT count(*) FROM public.departments) = 4 AS departments_ok,
  (SELECT count(*) FROM public.seasons) = 2 AS seasons_ok,
  (SELECT count(*) FROM public.notification_audit) = 25 AS notification_audit_ok,
  (SELECT count(*) FROM public.notification_email_global_settings) = 1 AS notification_global_settings_ok,
  (SELECT count(*) FROM public.notification_email_settings) = 27 AS notification_type_settings_ok,
  to_regclass('public.membership_request_recipients') IS NOT NULL AS membership_routing_present,
  to_regclass('public.club_settings') IS NOT NULL AS club_settings_present;

-- P7A.08_RELEASE_GATE
WITH keep_operator AS MATERIALIZED (
  SELECT DISTINCT ap.id
  FROM public.admin_profiles ap JOIN auth.users au ON au.id = ap.id
  JOIN public.admin_user_roles aur ON aur.user_id = ap.id
  JOIN public.admin_roles ar ON ar.id = aur.role_id
  WHERE ap.is_active IS TRUE AND ar.key = 'superadmin' AND ar.is_active IS TRUE
), counts AS MATERIALIZED (
  SELECT (SELECT count(*) FROM auth.users)::bigint AS auth_users,
    (SELECT count(*) FROM keep_operator)::bigint AS keep_count
)
SELECT 'P7A.08_RELEASE_GATE' AS section,
  auth_users = 6 AND keep_count = 1 AND auth_users - keep_count = 5 AS scope_counts_releaseable,
  (SELECT count(*) FROM public.admin_roles) = 13
    AND (SELECT count(*) FROM public.admin_permissions) = 64
    AND (SELECT count(*) FROM public.admin_role_permissions) = 249
    AND (SELECT count(*) FROM public.departments) = 4
    AND (SELECT count(*) FROM public.seasons) = 2
    AND (SELECT count(*) FROM public.notification_audit) = 25 AS foundation_releaseable,
  1::bigint AS expected_auth_users_after_cleanup,
  1::bigint AS expected_profiles_after_cleanup,
  0::bigint AS expected_non_operator_users_after_cleanup
FROM counts;

-- Expected resultsets: exactly 8. Every boolean in P7A.01, P7A.02,
-- P7A.07 and P7A.08 must be true. Review every P7A.04 row before release.
