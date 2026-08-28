-- B15.23E5.2.1: MANUAL, ONE-USER cleanup of the controlled unconfirmed test request.
-- DO NOT RUN without replacing v_test_user_id only in a local SQL-Editor copy.
-- This touches Supabase-managed auth state and requires explicit manual approval.

BEGIN;

DO $cleanup$
DECLARE
  v_test_user_id uuid := NULL; -- local SQL-Editor copy: controlled disposable test UUID
  v_changed integer;
BEGIN
  IF v_test_user_id IS NULL THEN
    RAISE EXCEPTION 'test user UUID is required; stop without changes';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.admin_email_change_requests
    WHERE user_id=v_test_user_id AND status IN ('pending','confirming')
  ) THEN
    RAISE EXCEPTION 'active E3 request exists for test user; stop without changes';
  END IF;

  UPDATE auth.users
  SET email_change='',
      email_change_token_new='',
      email_change_token_current='',
      email_change_confirm_status=0,
      email_change_sent_at=NULL,
      updated_at=now()
  WHERE id=v_test_user_id
    AND NULLIF(btrim(email_change),'') IS NOT NULL;

  GET DIAGNOSTICS v_changed=ROW_COUNT;
  IF v_changed<>1 THEN
    RAISE EXCEPTION 'expected exactly one pending test-user email change, changed %; transaction rolled back',v_changed;
  END IF;
END
$cleanup$;

COMMIT;
