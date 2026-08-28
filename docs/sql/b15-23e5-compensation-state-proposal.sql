-- B15.23E5.2.4: add the server-only compensation state.
-- MANUAL EXECUTION ONLY. This proposal does not create the auth.users guard.

BEGIN;

DO $preflight$
DECLARE
  v_status_def text;
  v_state_def text;
  v_index_def text;
BEGIN
  IF to_regclass('public.admin_email_change_requests') IS NULL THEN
    RAISE EXCEPTION 'admin_email_change_requests is missing; stop';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_roles r ON r.oid=c.relowner
    WHERE c.oid=to_regclass('public.admin_email_change_requests')
      AND r.rolname='postgres' AND c.relrowsecurity AND NOT c.relforcerowsecurity
  ) THEN RAISE EXCEPTION 'unexpected owner or RLS contract; stop'; END IF;
  IF EXISTS (SELECT 1 FROM pg_policies
             WHERE schemaname='public' AND tablename='admin_email_change_requests') THEN
    RAISE EXCEPTION 'unexpected policy exists; stop';
  END IF;

  IF (SELECT count(*) FROM information_schema.columns
      WHERE table_schema='public' AND table_name='admin_email_change_requests')<>16 THEN
    RAISE EXCEPTION 'unexpected column contract; stop';
  END IF;
  IF (
    SELECT count(*)
    FROM (VALUES
      ('id','uuid','NO'),('user_id','uuid','NO'),('requested_by','uuid','NO'),
      ('old_email','text','NO'),('new_email','text','NO'),('token_hash','text','NO'),
      ('status','text','NO'),('expires_at','timestamptz','NO'),
      ('confirmed_at','timestamptz','YES'),('cancelled_at','timestamptz','YES'),
      ('expired_at','timestamptz','YES'),('completed_at','timestamptz','YES'),
      ('locked_at','timestamptz','YES'),('failure_code','text','YES'),
      ('created_at','timestamptz','NO'),('updated_at','timestamptz','NO')
    ) expected(column_name,udt_name,is_nullable)
    JOIN information_schema.columns actual
      ON actual.table_schema='public'
     AND actual.table_name='admin_email_change_requests'
     AND actual.column_name=expected.column_name
     AND actual.udt_name=expected.udt_name
     AND actual.is_nullable=expected.is_nullable
  )<>16 THEN
    RAISE EXCEPTION 'expected column types or nullability differ; stop';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='admin_email_change_requests'
      AND column_name='id' AND column_default ILIKE '%gen_random_uuid()%'
  ) OR NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='admin_email_change_requests'
      AND column_name='status' AND column_default ILIKE '%pending%'
  ) OR (SELECT count(*) FROM information_schema.columns
        WHERE table_schema='public' AND table_name='admin_email_change_requests'
          AND column_name IN ('created_at','updated_at')
          AND column_default ILIKE '%now()%')<>2
  OR EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='admin_email_change_requests'
      AND column_name NOT IN ('id','status','created_at','updated_at')
      AND column_default IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'unexpected column defaults; stop';
  END IF;
  IF (SELECT count(*) FROM pg_constraint
      WHERE conrelid=to_regclass('public.admin_email_change_requests'))<>9 THEN
    RAISE EXCEPTION 'unexpected constraint inventory; stop';
  END IF;
  IF (SELECT count(*) FROM pg_index
      WHERE indrelid=to_regclass('public.admin_email_change_requests'))<>5 THEN
    RAISE EXCEPTION 'unexpected index inventory; stop';
  END IF;
  IF (SELECT count(*) FROM pg_trigger
      WHERE tgrelid=to_regclass('public.admin_email_change_requests'))<>3
     OR NOT EXISTS (
       SELECT 1 FROM pg_trigger
       WHERE tgrelid=to_regclass('public.admin_email_change_requests')
         AND tgname='admin_email_change_requests_set_updated_at'
         AND NOT tgisinternal
         AND pg_get_triggerdef(oid,true) ILIKE '%BEFORE UPDATE%set_updated_at()%'
     ) THEN
    RAISE EXCEPTION 'unexpected trigger inventory; stop';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='admin_email_change_requests'
               AND column_name='compensation_started_at') THEN
    RAISE EXCEPTION 'compensation_started_at already exists; stop';
  END IF;

  SELECT lower(regexp_replace(pg_get_constraintdef(c.oid,true),'\s+',' ','g'))
  INTO v_status_def
  FROM pg_constraint c
  WHERE c.conrelid=to_regclass('public.admin_email_change_requests')
    AND c.conname='admin_email_change_requests_status_check'
    AND c.contype='c';
  IF v_status_def IS NULL
     OR v_status_def NOT LIKE '%pending%confirming%completed%cancelled%expired%failed%'
     OR v_status_def LIKE '%compensating%' THEN
    RAISE EXCEPTION 'unexpected status constraint; stop';
  END IF;

  SELECT lower(regexp_replace(pg_get_constraintdef(c.oid,true),'\s+',' ','g'))
  INTO v_state_def
  FROM pg_constraint c
  WHERE c.conrelid=to_regclass('public.admin_email_change_requests')
    AND c.conname='admin_email_change_requests_state_check'
    AND c.contype='c';
  IF v_state_def IS NULL
     OR v_state_def NOT LIKE '%status = ''pending''%status = ''confirming''%status = ''completed''%status = ''cancelled''%status = ''expired''%status = ''failed''%'
     OR v_state_def LIKE '%compensat%' THEN
    RAISE EXCEPTION 'unexpected state constraint; stop';
  END IF;

  SELECT lower(regexp_replace(pg_get_indexdef(i.indexrelid),'\s+',' ','g'))
  INTO v_index_def
  FROM pg_index i
  JOIN pg_class x ON x.oid=i.indexrelid
  WHERE i.indrelid=to_regclass('public.admin_email_change_requests')
    AND x.relname='admin_email_change_requests_one_active_user_idx'
    AND i.indisunique AND i.indisvalid;
  IF v_index_def IS NULL
     OR v_index_def NOT LIKE '%unique index admin_email_change_requests_one_active_user_idx%on public.admin_email_change_requests%using btree (user_id)%pending%confirming%'
     OR v_index_def LIKE '%compensating%' THEN
    RAISE EXCEPTION 'unexpected active-request index; stop';
  END IF;

  IF EXISTS (SELECT 1 FROM public.admin_email_change_requests
             WHERE status NOT IN ('pending','confirming','completed','cancelled','expired','failed')) THEN
    RAISE EXCEPTION 'unknown request status exists; stop';
  END IF;
  IF EXISTS (SELECT 1 FROM public.admin_email_change_requests WHERE status='compensating') THEN
    RAISE EXCEPTION 'compensating data already exists; stop';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.admin_email_change_requests
    WHERE NOT (
      (status='pending' AND confirmed_at IS NULL AND cancelled_at IS NULL AND expired_at IS NULL AND completed_at IS NULL AND locked_at IS NULL AND failure_code IS NULL)
      OR (status='confirming' AND confirmed_at IS NOT NULL AND cancelled_at IS NULL AND expired_at IS NULL AND completed_at IS NULL AND locked_at IS NOT NULL AND failure_code IS NULL)
      OR (status='completed' AND confirmed_at IS NOT NULL AND cancelled_at IS NULL AND expired_at IS NULL AND completed_at IS NOT NULL AND locked_at IS NULL AND failure_code IS NULL)
      OR (status='cancelled' AND cancelled_at IS NOT NULL AND expired_at IS NULL AND completed_at IS NULL AND locked_at IS NULL AND failure_code IS NULL)
      OR (status='expired' AND confirmed_at IS NULL AND cancelled_at IS NULL AND expired_at IS NOT NULL AND completed_at IS NULL AND locked_at IS NULL AND failure_code IS NULL)
      OR (status='failed' AND cancelled_at IS NULL AND expired_at IS NULL AND completed_at IS NULL AND locked_at IS NULL AND failure_code IS NOT NULL)
    )
  ) THEN
    RAISE EXCEPTION 'existing request violates current state contract; stop';
  END IF;

  IF EXISTS (
    SELECT 1 FROM (VALUES ('anon'::text),('authenticated')) r(role_name)
    CROSS JOIN (VALUES ('SELECT'::text),('INSERT'),('UPDATE'),('DELETE'),('TRUNCATE'),('REFERENCES'),('TRIGGER')) p(privilege_name)
    WHERE has_table_privilege(r.role_name,'public.admin_email_change_requests',p.privilege_name)
  ) THEN
    RAISE EXCEPTION 'unexpected client privilege exists; stop';
  END IF;
  IF NOT (
    has_table_privilege('service_role','public.admin_email_change_requests','SELECT')
    AND has_table_privilege('service_role','public.admin_email_change_requests','INSERT')
    AND has_table_privilege('service_role','public.admin_email_change_requests','UPDATE')
    AND has_table_privilege('service_role','public.admin_email_change_requests','DELETE')
  ) THEN
    RAISE EXCEPTION 'expected service_role CRUD contract is missing; stop';
  END IF;
END
$preflight$;

ALTER TABLE public.admin_email_change_requests
  ADD COLUMN compensation_started_at timestamptz NULL;

ALTER TABLE public.admin_email_change_requests
  DROP CONSTRAINT admin_email_change_requests_status_check,
  DROP CONSTRAINT admin_email_change_requests_state_check;

ALTER TABLE public.admin_email_change_requests
  ADD CONSTRAINT admin_email_change_requests_status_check CHECK (
    status IN ('pending','confirming','compensating','completed','cancelled','expired','failed')
  ),
  ADD CONSTRAINT admin_email_change_requests_state_check CHECK (
    (status='pending'
      AND confirmed_at IS NULL AND cancelled_at IS NULL AND expired_at IS NULL
      AND completed_at IS NULL AND locked_at IS NULL AND failure_code IS NULL
      AND compensation_started_at IS NULL)
    OR
    (status='confirming'
      AND confirmed_at IS NOT NULL AND cancelled_at IS NULL AND expired_at IS NULL
      AND completed_at IS NULL AND locked_at IS NOT NULL AND failure_code IS NULL
      AND compensation_started_at IS NULL)
    OR
    (status='compensating'
      AND confirmed_at IS NOT NULL AND cancelled_at IS NULL AND expired_at IS NULL
      AND locked_at IS NOT NULL AND failure_code IS NULL
      AND compensation_started_at IS NOT NULL)
    OR
    (status='completed'
      AND confirmed_at IS NOT NULL AND cancelled_at IS NULL AND expired_at IS NULL
      AND completed_at IS NOT NULL AND locked_at IS NULL AND failure_code IS NULL
      AND compensation_started_at IS NULL)
    OR
    (status='cancelled'
      AND cancelled_at IS NOT NULL AND expired_at IS NULL AND completed_at IS NULL
      AND locked_at IS NULL AND failure_code IS NULL
      AND compensation_started_at IS NULL)
    OR
    (status='expired'
      AND confirmed_at IS NULL AND cancelled_at IS NULL AND expired_at IS NOT NULL
      AND completed_at IS NULL AND locked_at IS NULL AND failure_code IS NULL
      AND compensation_started_at IS NULL)
    OR
    (status='failed'
      AND cancelled_at IS NULL AND expired_at IS NULL AND completed_at IS NULL
      AND locked_at IS NULL AND failure_code IS NOT NULL)
  );

DROP INDEX public.admin_email_change_requests_one_active_user_idx;
CREATE UNIQUE INDEX admin_email_change_requests_one_active_user_idx
  ON public.admin_email_change_requests(user_id)
  WHERE status IN ('pending','confirming','compensating');

-- Existing table-level service_role privileges automatically cover the new column.
-- No new grant or policy is required or added.

DO $self_check$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='admin_email_change_requests'
      AND column_name='compensation_started_at'
      AND data_type='timestamp with time zone' AND is_nullable='YES'
      AND column_default IS NULL
  ) THEN RAISE EXCEPTION 'new column contract missing; rollback'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    WHERE c.conrelid=to_regclass('public.admin_email_change_requests')
      AND c.conname='admin_email_change_requests_status_check'
      AND pg_get_constraintdef(c.oid,true) ILIKE '%compensating%'
  ) THEN RAISE EXCEPTION 'new status contract missing; rollback'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    WHERE c.conrelid=to_regclass('public.admin_email_change_requests')
      AND c.conname='admin_email_change_requests_state_check'
      AND pg_get_constraintdef(c.oid,true) ILIKE '%compensation_started_at%'
  ) THEN RAISE EXCEPTION 'new state contract missing; rollback'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_index i JOIN pg_class x ON x.oid=i.indexrelid
    WHERE i.indrelid=to_regclass('public.admin_email_change_requests')
      AND x.relname='admin_email_change_requests_one_active_user_idx'
      AND i.indisunique AND i.indisvalid
      AND pg_get_indexdef(i.indexrelid) ILIKE '%compensating%'
  ) THEN RAISE EXCEPTION 'new active index contract missing; rollback'; END IF;

  IF EXISTS (
    SELECT 1 FROM (VALUES ('anon'::text),('authenticated')) r(role_name)
    CROSS JOIN (VALUES ('SELECT'::text),('INSERT'),('UPDATE'),('DELETE'),('TRUNCATE'),('REFERENCES'),('TRIGGER')) p(privilege_name)
    WHERE has_table_privilege(r.role_name,'public.admin_email_change_requests',p.privilege_name)
  ) THEN RAISE EXCEPTION 'client privilege regression; rollback'; END IF;
END
$self_check$;

COMMIT;
