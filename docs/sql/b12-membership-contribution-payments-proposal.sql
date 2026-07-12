-- Phase B12.2d proposal: optional payment history for contributions.
-- Do not execute automatically.

begin;

create table if not exists public.membership_contribution_payments (
  id uuid primary key default gen_random_uuid(),
  contribution_id uuid not null references public.membership_contributions (id) on delete cascade,
  amount numeric(10,2) not null,
  paid_at timestamptz not null default now(),
  payment_method text null,
  reference text null,
  internal_notes text null,
  created_by uuid null references public.admin_profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.membership_contribution_payments
  add constraint if not exists membership_contribution_payments_amount_check
  check (amount > 0);

create index if not exists idx_membership_contribution_payments_contribution
  on public.membership_contribution_payments (contribution_id);

create index if not exists idx_membership_contribution_payments_paid_at
  on public.membership_contribution_payments (paid_at desc);

-- Payment rows are the source of truth for paid amounts.
-- Proposal: a server-side mutation path updates membership_contributions.amount_paid
-- atomically after payment inserts/deletes and recalculates status/paid_at.

create or replace function public.set_membership_contribution_payments_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_membership_contribution_payments_updated_at on public.membership_contribution_payments;

create trigger trg_membership_contribution_payments_updated_at
before update on public.membership_contribution_payments
for each row
execute function public.set_membership_contribution_payments_updated_at();

commit;
