-- B15.23E5.2.1: sanitized READ-ONLY postcheck for the one-user cleanup.

BEGIN TRANSACTION READ ONLY;

WITH test_input AS MATERIALIZED (
  SELECT NULL::uuid AS test_user_id -- local SQL-Editor copy: controlled test UUID
)
SELECT
  i.test_user_id IS NOT NULL AS input_ready,
  u.id IS NOT NULL AS user_found,
  NULLIF(btrim(u.email_change),'') IS NOT NULL AS pending_email_present,
  NULLIF(btrim(u.email_change_token_new),'') IS NOT NULL AS email_change_token_new_present,
  NULLIF(btrim(u.email_change_token_current),'') IS NOT NULL AS email_change_token_current_present,
  u.email_change_confirm_status,
  u.email_change_sent_at IS NOT NULL AS email_change_sent_at_present
FROM test_input i
LEFT JOIN auth.users u ON u.id=i.test_user_id;

COMMIT;
