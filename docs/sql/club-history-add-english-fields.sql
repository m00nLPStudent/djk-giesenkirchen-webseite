begin;

alter table public.club_history_pages
  add column if not exists title_en text,
  add column if not exists teaser_en text,
  add column if not exists content_en text;

alter table public.club_history_images
  add column if not exists alt_text_en text,
  add column if not exists caption_en text;

alter table public.club_history_milestones
  add column if not exists title_en text,
  add column if not exists description_en text;

commit;
