-- Phase B12.2e proposal: optional editorial workflow fields for news/events.
-- Do not execute automatically.

begin;

alter table if exists public.news
  add column if not exists workflow_status text,
  add column if not exists submitted_at timestamptz,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid,
  add column if not exists published_by uuid;

alter table if exists public.events
  add column if not exists workflow_status text,
  add column if not exists submitted_at timestamptz,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid,
  add column if not exists published_by uuid;

update public.news
set workflow_status = case when is_published then 'published' else 'draft' end
where workflow_status is null;

update public.events
set workflow_status = case when is_published then 'published' else 'draft' end
where workflow_status is null;

alter table if exists public.news
  alter column workflow_status set default 'draft';

alter table if exists public.events
  alter column workflow_status set default 'draft';

alter table if exists public.news
  add constraint if not exists news_workflow_status_check
  check (workflow_status in ('draft', 'in_review', 'approved', 'published', 'archived'));

alter table if exists public.events
  add constraint if not exists events_workflow_status_check
  check (workflow_status in ('draft', 'in_review', 'approved', 'published', 'archived'));

alter table if exists public.news
  add constraint if not exists news_reviewed_by_fkey
  foreign key (reviewed_by)
  references public.admin_profiles (id)
  on update cascade
  on delete set null;

alter table if exists public.news
  add constraint if not exists news_published_by_fkey
  foreign key (published_by)
  references public.admin_profiles (id)
  on update cascade
  on delete set null;

alter table if exists public.events
  add constraint if not exists events_reviewed_by_fkey
  foreign key (reviewed_by)
  references public.admin_profiles (id)
  on update cascade
  on delete set null;

alter table if exists public.events
  add constraint if not exists events_published_by_fkey
  foreign key (published_by)
  references public.admin_profiles (id)
  on update cascade
  on delete set null;

create index if not exists idx_news_workflow_status
  on public.news (workflow_status);

create index if not exists idx_events_workflow_status
  on public.events (workflow_status);

commit;
