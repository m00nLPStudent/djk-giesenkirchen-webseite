-- B15.23E3.1 proposal only. Do not execute automatically.
-- Execute manually only after the read-only preflight was reviewed and approved.
BEGIN;

DO $$
BEGIN
  IF to_regclass('public.admin_email_change_requests') IS NOT NULL THEN
    RAISE EXCEPTION 'public.admin_email_change_requests already exists; stop and review';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname IN (
        'admin_email_change_requests_token_hash_key',
        'admin_email_change_requests_one_active_user_idx',
        'admin_email_change_requests_expiry_idx',
        'admin_email_change_requests_user_created_idx'
      )
  ) THEN
    RAISE EXCEPTION 'an admin_email_change_requests index name already exists; stop and review';
  END IF;
  IF to_regclass('public.admin_profiles') IS NULL THEN
    RAISE EXCEPTION 'public.admin_profiles is missing';
  END IF;
  IF to_regprocedure('public.set_updated_at()') IS NULL THEN
    RAISE EXCEPTION 'public.set_updated_at() is missing';
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'admin_profiles'
      AND column_name = 'id'
      AND udt_name = 'uuid'
      AND is_nullable = 'NO'
  ) THEN
    RAISE EXCEPTION 'public.admin_profiles.id UUID contract is missing';
  END IF;
END $$;

CREATE TABLE public.admin_email_change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.admin_profiles(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL,
  old_email text NOT NULL,
  new_email text NOT NULL,
  token_hash text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  expires_at timestamptz NOT NULL,
  confirmed_at timestamptz NULL,
  cancelled_at timestamptz NULL,
  expired_at timestamptz NULL,
  completed_at timestamptz NULL,
  locked_at timestamptz NULL,
  failure_code text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT admin_email_change_requests_status_check CHECK (
    status IN ('pending', 'confirming', 'completed', 'cancelled', 'expired', 'failed')
  ),
  CONSTRAINT admin_email_change_requests_old_email_check CHECK (
    old_email = lower(btrim(old_email))
    AND char_length(old_email) BETWEEN 3 AND 254
  ),
  CONSTRAINT admin_email_change_requests_new_email_check CHECK (
    new_email = lower(btrim(new_email))
    AND char_length(new_email) BETWEEN 3 AND 254
    AND new_email <> old_email
  ),
  CONSTRAINT admin_email_change_requests_token_hash_check CHECK (
    token_hash ~ '^[0-9a-f]{64}$'
  ),
  CONSTRAINT admin_email_change_requests_expiry_check CHECK (
    expires_at > created_at
  ),
  CONSTRAINT admin_email_change_requests_failure_code_check CHECK (
    failure_code IS NULL OR char_length(failure_code) BETWEEN 1 AND 80
  ),
  CONSTRAINT admin_email_change_requests_state_check CHECK (
    (status = 'pending'
      AND confirmed_at IS NULL
      AND cancelled_at IS NULL
      AND expired_at IS NULL
      AND completed_at IS NULL
      AND locked_at IS NULL
      AND failure_code IS NULL)
    OR
    (status = 'confirming'
      AND confirmed_at IS NOT NULL
      AND cancelled_at IS NULL
      AND expired_at IS NULL
      AND completed_at IS NULL
      AND locked_at IS NOT NULL
      AND failure_code IS NULL)
    OR
    (status = 'completed'
      AND confirmed_at IS NOT NULL
      AND cancelled_at IS NULL
      AND expired_at IS NULL
      AND completed_at IS NOT NULL
      AND locked_at IS NULL
      AND failure_code IS NULL)
    OR
    (status = 'cancelled'
      AND cancelled_at IS NOT NULL
      AND expired_at IS NULL
      AND completed_at IS NULL
      AND locked_at IS NULL
      AND failure_code IS NULL)
    OR
    (status = 'expired'
      AND confirmed_at IS NULL
      AND cancelled_at IS NULL
      AND expired_at IS NOT NULL
      AND completed_at IS NULL
      AND locked_at IS NULL
      AND failure_code IS NULL)
    OR
    (status = 'failed'
      AND cancelled_at IS NULL
      AND expired_at IS NULL
      AND completed_at IS NULL
      AND locked_at IS NULL
      AND failure_code IS NOT NULL)
  )
);

CREATE UNIQUE INDEX admin_email_change_requests_token_hash_key
  ON public.admin_email_change_requests (token_hash);

CREATE UNIQUE INDEX admin_email_change_requests_one_active_user_idx
  ON public.admin_email_change_requests (user_id)
  WHERE status IN ('pending', 'confirming');

CREATE INDEX admin_email_change_requests_expiry_idx
  ON public.admin_email_change_requests (expires_at, created_at)
  WHERE status = 'pending';

CREATE INDEX admin_email_change_requests_user_created_idx
  ON public.admin_email_change_requests (user_id, created_at DESC);

CREATE TRIGGER admin_email_change_requests_set_updated_at
  BEFORE UPDATE ON public.admin_email_change_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.admin_email_change_requests ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public.admin_email_change_requests
  FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.admin_email_change_requests
  TO service_role;

COMMENT ON TABLE public.admin_email_change_requests IS
  'B15.23E3 server-only pending login-email changes. token_hash stores only a SHA-256 digest; plaintext tokens must never be persisted.';

COMMENT ON COLUMN public.admin_email_change_requests.requested_by IS
  'Stable UUID of the initiating superadmin. Deliberately not an FK so request evidence survives actor removal.';

COMMIT;
