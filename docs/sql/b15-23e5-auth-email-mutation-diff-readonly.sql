-- B15.23E5.2.1: sanitized READ-ONLY auth.users snapshot helper.
-- Copy into the SQL Editor and replace the three NULL values only in that local copy.
-- Never save a real UUID or email address in this repository.

BEGIN TRANSACTION READ ONLY;

WITH test_input AS MATERIALIZED (
  SELECT
    NULL::uuid AS test_user_id,       -- local SQL-Editor copy: controlled test UUID
    NULL::text AS expected_old_email, -- local SQL-Editor copy: controlled old address
    NULL::text AS expected_new_email, -- local SQL-Editor copy: controlled new address
    'before_or_after'::text AS snapshot_label
), normalized AS MATERIALIZED (
  SELECT
    test_user_id,
    lower(btrim(expected_old_email)) AS expected_old_email,
    lower(btrim(expected_new_email)) AS expected_new_email,
    snapshot_label
  FROM test_input
), selected AS MATERIALIZED (
  SELECT n.*,u.*
  FROM normalized n
  LEFT JOIN auth.users u ON u.id=n.test_user_id
), request_state AS MATERIALIZED (
  SELECT
    count(*) FILTER (WHERE r.status='pending') AS pending_request_count,
    count(*) FILTER (WHERE r.status='confirming') AS confirming_request_count,
    count(*) FILTER (WHERE r.status='completed') AS completed_request_count,
    bool_or(r.status='confirming' AND r.confirmed_at<=r.expires_at)
      AS confirming_within_ttl_present
  FROM normalized n
  LEFT JOIN public.admin_email_change_requests r ON r.user_id=n.test_user_id
)
SELECT
  snapshot_label,
  test_user_id IS NOT NULL
    AND expected_old_email IS NOT NULL
    AND expected_new_email IS NOT NULL AS input_ready,
  id IS NOT NULL AS user_found,
  NULLIF(btrim(email),'') IS NOT NULL AS active_email_present,
  lower(btrim(email))=expected_old_email AS active_email_matches_expected_old,
  lower(btrim(email))=expected_new_email AS active_email_matches_expected_new,
  NULLIF(btrim(email_change),'') IS NOT NULL AS pending_email_present,
  lower(btrim(email_change))=expected_new_email AS pending_email_matches_expected_new,
  NULLIF(btrim(email_change_token_new),'') IS NOT NULL AS email_change_token_new_present,
  NULLIF(btrim(email_change_token_current),'') IS NOT NULL AS email_change_token_current_present,
  email_change_confirm_status,
  email_change_sent_at IS NOT NULL AS email_change_sent_at_present,
  NULLIF(btrim(confirmation_token),'') IS NOT NULL AS confirmation_token_present,
  confirmation_sent_at IS NOT NULL AS confirmation_sent_at_present,
  email_confirmed_at IS NOT NULL AS email_confirmed_at_present,
  updated_at IS NOT NULL AS updated_at_present,
  NULLIF(btrim(recovery_token),'') IS NOT NULL AS recovery_token_present,
  recovery_sent_at IS NOT NULL AS recovery_sent_at_present,
  NULLIF(btrim(reauthentication_token),'') IS NOT NULL AS reauthentication_token_present,
  reauthentication_sent_at IS NOT NULL AS reauthentication_sent_at_present,
  pending_request_count,
  confirming_request_count,
  completed_request_count,
  coalesce(confirming_within_ttl_present,false) AS confirming_within_ttl_present
FROM selected
CROSS JOIN request_state;

COMMIT;
