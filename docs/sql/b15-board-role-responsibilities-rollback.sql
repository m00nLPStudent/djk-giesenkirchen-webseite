-- B15 / Version 1.0.6 preparation
-- Exact rollback for b15-board-role-responsibilities-proposal.sql.
-- WARNING: running this after later productive use deletes all responsibility
-- configurations stored exclusively in the feature table.
-- MANUAL EXECUTION ONLY.

BEGIN;

DO $guard$
BEGIN
  IF to_regclass('public.board_role_responsibilities') IS NULL THEN
    RAISE EXCEPTION 'board_role_responsibilities does not exist';
  END IF;

  IF (SELECT count(*) FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'board_role_responsibilities') <> 6
     OR NOT EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'board_role_responsibilities'
         AND column_name = 'responsibilities' AND data_type = 'ARRAY' AND udt_name = '_text'
         AND is_nullable = 'NO'
     ) THEN
    RAISE EXCEPTION 'Unexpected board_role_responsibilities structure';
  END IF;

  IF (SELECT count(*) FROM pg_catalog.pg_policies
      WHERE schemaname = 'public' AND tablename = 'board_role_responsibilities') <> 1
     OR NOT EXISTS (
       SELECT 1 FROM pg_catalog.pg_policies
       WHERE schemaname = 'public' AND tablename = 'board_role_responsibilities'
         AND policyname = 'board_role_responsibilities_public_read_active'
         AND cmd = 'SELECT'
     ) THEN
    RAISE EXCEPTION 'Unexpected board_role_responsibilities policy structure';
  END IF;
END
$guard$;

REVOKE ALL ON TABLE public.board_role_responsibilities FROM PUBLIC, anon, authenticated, service_role;
DROP POLICY board_role_responsibilities_public_read_active
  ON public.board_role_responsibilities;
DROP INDEX public.board_role_responsibilities_department_role_uidx;
DROP INDEX public.board_role_responsibilities_club_role_uidx;
DROP TABLE public.board_role_responsibilities;

DO $self_check$
BEGIN
  IF to_regclass('public.board_role_responsibilities') IS NOT NULL THEN
    RAISE EXCEPTION 'Rollback did not remove board_role_responsibilities';
  END IF;
END
$self_check$;

COMMIT;
