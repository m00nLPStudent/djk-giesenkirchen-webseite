-- Phase B12.2a proposal: fixed profile links for board and coach cards.
-- Do not execute automatically.
-- Strategy:
-- - admin_profile_id remains nullable for safe incremental rollout
-- - existing rows stay untouched until explicit mapping step
-- - email can be used once as migration helper, authorization later only via admin_profile_id

begin;

alter table if exists public.board_members
  add column if not exists admin_profile_id uuid;

alter table if exists public.coaches
  add column if not exists admin_profile_id uuid;

alter table if exists public.board_members
  add constraint if not exists board_members_admin_profile_id_fkey
  foreign key (admin_profile_id)
  references public.admin_profiles (id)
  on update cascade
  on delete set null;

alter table if exists public.coaches
  add constraint if not exists coaches_admin_profile_id_fkey
  foreign key (admin_profile_id)
  references public.admin_profiles (id)
  on update cascade
  on delete set null;

create index if not exists idx_board_members_admin_profile_id
  on public.board_members (admin_profile_id);

create index if not exists idx_coaches_admin_profile_id
  on public.coaches (admin_profile_id);

-- Optional: one active board card per profile
-- create unique index if not exists uq_board_members_profile_active
--   on public.board_members (admin_profile_id)
--   where admin_profile_id is not null and is_active = true;

-- Optional: one active coach card per profile
-- create unique index if not exists uq_coaches_profile_active
--   on public.coaches (admin_profile_id)
--   where admin_profile_id is not null and is_active = true;

commit;
