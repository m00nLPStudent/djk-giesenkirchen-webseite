-- Phase B12.2b proposal: explicit team assignments only.
-- Do not execute automatically.

begin;

-- Scope strategy (proposal):
-- 1) `global` and `youth_all` are role-derived scopes and are not stored as team rows.
-- 2) For trainer/staff assignment scopes, prefer existing relation chain:
--    admin_profiles -> coaches.admin_profile_id -> coach_team_seasons -> teams.
-- 3) Use this table only for exceptions where no coach/staff record exists.

create table if not exists public.admin_profile_team_assignments (
  id uuid primary key default gen_random_uuid(),
  admin_profile_id uuid not null references public.admin_profiles (id) on delete cascade,
  team_id uuid not null references public.teams (id) on delete cascade,
  assignment_type text not null default 'trainer',
  is_active boolean not null default true,
  starts_at timestamptz null,
  ends_at timestamptz null,
  note text null,
  created_by uuid null references public.admin_profiles (id) on delete set null,
  updated_by uuid null references public.admin_profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.admin_profile_team_assignments
  add constraint if not exists admin_profile_team_assignments_assignment_type_check
  check (assignment_type in ('trainer', 'assistant_coach', 'staff'));

create unique index if not exists uq_admin_profile_team_assignment_active
  on public.admin_profile_team_assignments (admin_profile_id, team_id, assignment_type)
  where is_active = true;

create index if not exists idx_admin_profile_team_assignments_profile
  on public.admin_profile_team_assignments (admin_profile_id);

create index if not exists idx_admin_profile_team_assignments_team
  on public.admin_profile_team_assignments (team_id);

create or replace function public.set_admin_profile_team_assignments_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_admin_profile_team_assignments_updated_at on public.admin_profile_team_assignments;

create trigger trg_admin_profile_team_assignments_updated_at
before update on public.admin_profile_team_assignments
for each row
execute function public.set_admin_profile_team_assignments_updated_at();

commit;
