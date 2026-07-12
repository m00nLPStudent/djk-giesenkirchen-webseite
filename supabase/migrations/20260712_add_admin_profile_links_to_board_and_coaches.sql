-- Phase B12.2a: stable profile-card links for board/coaches
-- This migration file is prepared but must be executed manually after approval.

begin;

alter table if exists public.board_members
  add column if not exists admin_profile_id uuid;

alter table if exists public.coaches
  add column if not exists admin_profile_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'board_members_admin_profile_id_fkey'
      AND conrelid = 'public.board_members'::regclass
  ) THEN
    ALTER TABLE public.board_members
      ADD CONSTRAINT board_members_admin_profile_id_fkey
      FOREIGN KEY (admin_profile_id)
      REFERENCES public.admin_profiles (id)
      ON DELETE SET NULL;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'coaches_admin_profile_id_fkey'
      AND conrelid = 'public.coaches'::regclass
  ) THEN
    ALTER TABLE public.coaches
      ADD CONSTRAINT coaches_admin_profile_id_fkey
      FOREIGN KEY (admin_profile_id)
      REFERENCES public.admin_profiles (id)
      ON DELETE SET NULL;
  END IF;
END
$$;

create index if not exists idx_board_members_admin_profile_id
  on public.board_members (admin_profile_id);

create index if not exists idx_coaches_admin_profile_id
  on public.coaches (admin_profile_id);

-- Optional but recommended cardinality guardrails:
-- one board card can belong to max one profile, and one profile can own max one board card.
-- one coach card can belong to max one profile, and one profile can own max one coach card.
create unique index if not exists uq_board_members_admin_profile_id
  on public.board_members (admin_profile_id)
  where admin_profile_id is not null;

create unique index if not exists uq_coaches_admin_profile_id
  on public.coaches (admin_profile_id)
  where admin_profile_id is not null;

commit;
