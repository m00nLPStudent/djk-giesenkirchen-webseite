-- Add recurrence support to events without creating a new table

alter table public.events
add column if not exists recurrence_type text;

alter table public.events
add column if not exists recurrence_interval integer;

alter table public.events
add column if not exists recurrence_until timestamptz;

alter table public.events
add column if not exists recurrence_count integer;

update public.events
set recurrence_type = 'none'
where recurrence_type is null or trim(recurrence_type) = '';

update public.events
set recurrence_interval = 1
where recurrence_interval is null or recurrence_interval < 1;

alter table public.events
alter column recurrence_type set default 'none';

alter table public.events
alter column recurrence_type set not null;

alter table public.events
alter column recurrence_interval set default 1;

alter table public.events
add constraint events_recurrence_type_check
check (recurrence_type in ('none', 'daily', 'weekly', 'monthly', 'yearly'));

alter table public.events
add constraint events_recurrence_interval_check
check (recurrence_interval >= 1);

alter table public.events
add constraint events_recurrence_count_check
check (recurrence_count is null or recurrence_count >= 1);
