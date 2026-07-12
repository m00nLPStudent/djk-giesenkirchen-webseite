-- Phase B12.2c proposal: contribution ledger for players and coaches.
-- Do not execute automatically.

begin;

create table if not exists public.membership_contributions (
  id uuid primary key default gen_random_uuid(),
  season_key text not null,
  contribution_key text not null,
  player_id uuid null references public.players (id) on delete cascade,
  coach_id uuid null references public.coaches (id) on delete cascade,
  team_id uuid null references public.teams (id) on delete set null,
  title text not null,
  amount_due numeric(10,2) not null,
  -- Cache value synchronized server-side from payment rows.
  amount_paid numeric(10,2) not null default 0,
  amount_outstanding numeric(10,2) generated always as (amount_due - amount_paid) stored,
  currency text not null default 'EUR',
  status text not null default 'open',
  due_date date null,
  booked_at timestamptz null,
  paid_at timestamptz null,
  installment_agreement boolean not null default false,
  exemption_reason text null,
  deferral_until date null,
  internal_notes text null,
  created_by uuid null references public.admin_profiles (id) on delete set null,
  updated_by uuid null references public.admin_profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.membership_contributions
  add constraint if not exists membership_contributions_person_xor_check
  check (
    (player_id is not null and coach_id is null)
    or
    (player_id is null and coach_id is not null)
  );

alter table public.membership_contributions
  add constraint if not exists membership_contributions_status_check
  check (status in ('open', 'partially_paid', 'paid', 'exempt', 'deferred', 'canceled'));

alter table public.membership_contributions
  add constraint if not exists membership_contributions_amount_due_check
  check (amount_due >= 0);

alter table public.membership_contributions
  add constraint if not exists membership_contributions_amount_paid_check
  check (amount_paid >= 0 and amount_paid <= amount_due);

alter table public.membership_contributions
  add constraint if not exists membership_contributions_paid_at_requires_paid_check
  check (paid_at is null or status = 'paid');

alter table public.membership_contributions
  add constraint if not exists membership_contributions_deferred_requires_date_check
  check (status <> 'deferred' or deferral_until is not null);

create unique index if not exists uq_membership_contributions_player_key
  on public.membership_contributions (player_id, season_key, contribution_key)
  where player_id is not null;

create unique index if not exists uq_membership_contributions_coach_key
  on public.membership_contributions (coach_id, season_key, contribution_key)
  where coach_id is not null;

create index if not exists idx_membership_contributions_player
  on public.membership_contributions (player_id)
  where player_id is not null;

create index if not exists idx_membership_contributions_coach
  on public.membership_contributions (coach_id)
  where coach_id is not null;

create index if not exists idx_membership_contributions_team
  on public.membership_contributions (team_id);

create index if not exists idx_membership_contributions_status
  on public.membership_contributions (status);

create index if not exists idx_membership_contributions_season
  on public.membership_contributions (season_key);

-- Optional trigger strategy (proposal only): maintain updated_at on UPDATE.
-- If your database already provides a shared updated_at trigger function,
-- bind that existing function instead of creating a new one.
create or replace function public.set_membership_contributions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_membership_contributions_updated_at on public.membership_contributions;

create trigger trg_membership_contributions_updated_at
before update on public.membership_contributions
for each row
execute function public.set_membership_contributions_updated_at();

commit;
