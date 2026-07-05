alter table public.membership_requests
add column if not exists processed_at timestamptz;

alter table public.membership_requests
add column if not exists processed_by text;

alter table public.membership_requests
add column if not exists mail_sent_at timestamptz;

alter table public.membership_requests
add column if not exists internal_note text;
