-- B14.2 additive schema proposal for player contributions
-- Proposal only. Do not execute automatically.

BEGIN;

CREATE TABLE IF NOT EXISTS public.player_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL,
  season_id uuid NOT NULL,
  contribution_key text NOT NULL,
  title text NOT NULL,
  amount_due numeric(10,2) NOT NULL DEFAULT 0,
  amount_paid numeric(10,2) NOT NULL DEFAULT 0,
  amount_waived numeric(10,2) NOT NULL DEFAULT 0,
  amount_outstanding numeric(10,2) GENERATED ALWAYS AS (GREATEST(0::numeric, amount_due - amount_waived - amount_paid)) STORED,
  currency text NOT NULL DEFAULT 'EUR',
  status text NOT NULL DEFAULT 'open',
  due_date date NULL,
  paid_at timestamptz NULL,
  deferred_until date NULL,
  deferred_reason text NULL,
  installment_agreement boolean NOT NULL DEFAULT false,
  installment_notes text NULL,
  exemption_reason text NULL,
  exempted_at timestamptz NULL,
  exempted_by uuid NULL,
  canceled_at timestamptz NULL,
  canceled_by uuid NULL,
  cancellation_reason text NULL,
  internal_notes text NULL,
  team_snapshot_name text NULL,
  created_by uuid NULL,
  updated_by uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT player_contributions_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.players (id) ON DELETE NO ACTION,
  CONSTRAINT player_contributions_season_id_fkey FOREIGN KEY (season_id) REFERENCES public.seasons (id) ON DELETE NO ACTION,
  CONSTRAINT player_contributions_exempted_by_fkey FOREIGN KEY (exempted_by) REFERENCES public.admin_profiles (id) ON DELETE SET NULL,
  CONSTRAINT player_contributions_canceled_by_fkey FOREIGN KEY (canceled_by) REFERENCES public.admin_profiles (id) ON DELETE SET NULL,
  CONSTRAINT player_contributions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.admin_profiles (id) ON DELETE SET NULL,
  CONSTRAINT player_contributions_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.admin_profiles (id) ON DELETE SET NULL,
  CONSTRAINT player_contributions_contribution_key_check CHECK (contribution_key IN ('regular', 'admission_fee', 'adjustment', 'correction', 'special_fee')),
  CONSTRAINT player_contributions_title_check CHECK (NULLIF(btrim(title), '') IS NOT NULL),
  CONSTRAINT player_contributions_currency_check CHECK (currency = 'EUR'),
  CONSTRAINT player_contributions_amount_due_check CHECK (amount_due >= 0),
  CONSTRAINT player_contributions_amount_paid_check CHECK (amount_paid >= 0),
  CONSTRAINT player_contributions_amount_waived_check CHECK (amount_waived >= 0),
  CONSTRAINT player_contributions_amount_balance_check CHECK (amount_paid + amount_waived <= amount_due),
  CONSTRAINT player_contributions_status_check CHECK (status IN ('open', 'partially_paid', 'paid', 'deferred', 'exempt', 'canceled')),
  CONSTRAINT player_contributions_paid_at_check CHECK (paid_at IS NULL OR status = 'paid'),
  CONSTRAINT player_contributions_deferred_check CHECK (status <> 'deferred' OR deferred_until IS NOT NULL),
  CONSTRAINT player_contributions_exempt_check CHECK (
    status <> 'exempt'
    OR (
      amount_waived = amount_due
      AND amount_paid = 0
      AND exempted_at IS NOT NULL
      AND amount_outstanding = 0
      AND canceled_at IS NULL
    )
  ),
  CONSTRAINT player_contributions_canceled_check CHECK (status <> 'canceled' OR canceled_at IS NOT NULL),
  CONSTRAINT player_contributions_status_consistency_check CHECK (
    CASE status
      WHEN 'open' THEN amount_paid = 0 AND amount_waived = 0 AND amount_outstanding > 0 AND deferred_until IS NULL AND canceled_at IS NULL
      WHEN 'partially_paid' THEN amount_paid > 0 AND amount_outstanding > 0 AND canceled_at IS NULL
      WHEN 'paid' THEN amount_outstanding = 0 AND amount_paid = amount_due - amount_waived AND canceled_at IS NULL AND amount_due > 0
      WHEN 'deferred' THEN amount_outstanding > 0 AND deferred_until IS NOT NULL AND canceled_at IS NULL
      WHEN 'exempt' THEN amount_waived = amount_due AND amount_paid = 0 AND amount_outstanding = 0 AND canceled_at IS NULL
      WHEN 'canceled' THEN canceled_at IS NOT NULL
      ELSE false
    END
  )
);

CREATE TABLE IF NOT EXISTS public.player_contribution_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contribution_id uuid NOT NULL,
  amount numeric(10,2) NOT NULL,
  paid_at timestamptz NOT NULL DEFAULT now(),
  payment_method text NULL,
  reference text NULL,
  internal_notes text NULL,
  status text NOT NULL DEFAULT 'booked',
  canceled_at timestamptz NULL,
  canceled_by uuid NULL,
  cancellation_reason text NULL,
  created_by uuid NULL,
  updated_by uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT player_contribution_payments_contribution_id_fkey FOREIGN KEY (contribution_id) REFERENCES public.player_contributions (id) ON DELETE NO ACTION,
  CONSTRAINT player_contribution_payments_canceled_by_fkey FOREIGN KEY (canceled_by) REFERENCES public.admin_profiles (id) ON DELETE SET NULL,
  CONSTRAINT player_contribution_payments_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.admin_profiles (id) ON DELETE SET NULL,
  CONSTRAINT player_contribution_payments_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.admin_profiles (id) ON DELETE SET NULL,
  CONSTRAINT player_contribution_payments_amount_check CHECK (amount > 0),
  CONSTRAINT player_contribution_payments_status_check CHECK (status IN ('booked', 'canceled')),
  CONSTRAINT player_contribution_payments_canceled_check CHECK (status <> 'canceled' OR canceled_at IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS player_contributions_regular_unique
  ON public.player_contributions (player_id, season_id, contribution_key)
  WHERE contribution_key = 'regular' AND status <> 'canceled';

CREATE INDEX IF NOT EXISTS idx_player_contributions_player_season
  ON public.player_contributions (player_id, season_id);

CREATE INDEX IF NOT EXISTS idx_player_contributions_status_due_date
  ON public.player_contributions (status, due_date);

CREATE INDEX IF NOT EXISTS idx_player_contributions_contribution_key
  ON public.player_contributions (contribution_key);

CREATE INDEX IF NOT EXISTS idx_player_contribution_payments_contribution_id
  ON public.player_contribution_payments (contribution_id);

CREATE INDEX IF NOT EXISTS idx_player_contribution_payments_paid_at
  ON public.player_contribution_payments (paid_at DESC);

CREATE INDEX IF NOT EXISTS idx_player_contribution_payments_status_contribution
  ON public.player_contribution_payments (status, contribution_id);

CREATE OR REPLACE FUNCTION public.sync_player_contribution_payment_cache()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  v_contribution_id uuid;
  v_amount_paid numeric(10,2);
  v_latest_paid_at timestamptz;
  v_amount_due numeric(10,2);
  v_amount_waived numeric(10,2);
  v_deferred_until date;
  v_current_status text;
  v_outstanding numeric(10,2);
BEGIN
  v_contribution_id := COALESCE(NEW.contribution_id, OLD.contribution_id);

  SELECT amount_due, amount_waived, deferred_until, status
  INTO v_amount_due, v_amount_waived, v_deferred_until, v_current_status
  FROM public.player_contributions
  WHERE id = v_contribution_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(SUM(amount), 0), MAX(paid_at)
  INTO v_amount_paid, v_latest_paid_at
  FROM public.player_contribution_payments
  WHERE contribution_id = v_contribution_id
    AND status = 'booked';

  v_outstanding := GREATEST(0::numeric, v_amount_due - v_amount_waived - v_amount_paid);

  UPDATE public.player_contributions
  SET
    amount_paid = v_amount_paid,
    paid_at = CASE
      WHEN v_current_status IN ('exempt', 'canceled') THEN NULL
      WHEN v_outstanding = 0 AND v_amount_paid > 0 THEN v_latest_paid_at
      ELSE NULL
    END,
    status = CASE
      WHEN v_current_status = 'canceled' THEN 'canceled'
      WHEN v_current_status = 'exempt' THEN 'exempt'
      WHEN v_deferred_until IS NOT NULL AND v_outstanding > 0 THEN 'deferred'
      WHEN v_outstanding = 0 AND v_amount_paid > 0 THEN 'paid'
      WHEN v_amount_paid > 0 THEN 'partially_paid'
      ELSE 'open'
    END,
    updated_at = now()
  WHERE id = v_contribution_id;

  RETURN NULL;
END;
$function$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trg_player_contributions_set_updated_at'
  ) THEN
    CREATE TRIGGER trg_player_contributions_set_updated_at
    BEFORE UPDATE ON public.player_contributions
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trg_player_contribution_payments_set_updated_at'
  ) THEN
    CREATE TRIGGER trg_player_contribution_payments_set_updated_at
    BEFORE UPDATE ON public.player_contribution_payments
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trg_player_contribution_payments_sync_parent'
  ) THEN
    CREATE TRIGGER trg_player_contribution_payments_sync_parent
    AFTER INSERT OR UPDATE OR DELETE ON public.player_contribution_payments
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_player_contribution_payment_cache();
  END IF;
END
$$;

COMMIT;
