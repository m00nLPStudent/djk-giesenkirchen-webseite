-- B13.15 coach staff roles additive schema proposal
-- Proposal only. Do not execute automatically.
-- Idempotent and additive by design.

BEGIN;

CREATE TABLE IF NOT EXISTS public.coach_staff_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES public.coaches (id) ON DELETE CASCADE,
  role_key text NULL,
  role_de text NOT NULL,
  role_en text NULL,
  valid_from date NULL,
  valid_until date NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL REFERENCES public.admin_profiles (id) ON DELETE SET NULL,
  updated_by uuid NULL REFERENCES public.admin_profiles (id) ON DELETE SET NULL,
  CONSTRAINT coach_staff_roles_role_de_not_blank
    CHECK (NULLIF(btrim(role_de), '') IS NOT NULL),
  CONSTRAINT coach_staff_roles_valid_range
    CHECK (valid_until IS NULL OR valid_from IS NULL OR valid_until >= valid_from),
  CONSTRAINT coach_staff_roles_role_key_not_blank
    CHECK (role_key IS NULL OR NULLIF(btrim(role_key), '') IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_coach_staff_roles_coach_id
  ON public.coach_staff_roles (coach_id);

CREATE INDEX IF NOT EXISTS idx_coach_staff_roles_active_sort
  ON public.coach_staff_roles (coach_id, is_active, sort_order, created_at);

CREATE INDEX IF NOT EXISTS idx_coach_staff_roles_role_key
  ON public.coach_staff_roles (role_key)
  WHERE role_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_coach_staff_roles_validity
  ON public.coach_staff_roles (valid_from, valid_until);

CREATE INDEX IF NOT EXISTS idx_coach_staff_roles_active_role_de
  ON public.coach_staff_roles (coach_id, lower(role_de), is_active);

COMMIT;
