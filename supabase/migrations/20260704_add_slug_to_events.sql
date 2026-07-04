-- Add slug support for public event detail pages

alter table public.events
add column if not exists slug text;

-- Backfill missing slugs from title_de
update public.events
set slug = regexp_replace(
  regexp_replace(
    lower(
      replace(
        replace(
          replace(
            replace(coalesce(title_de, ''), 'ä', 'ae'),
            'ö',
            'oe'
          ),
          'ü',
          'ue'
        ),
        'ß',
        'ss'
      )
    ),
    '[^a-z0-9]+',
    '-',
    'g'
  ),
  '(^-|-$)',
  '',
  'g'
)
where (slug is null or slug = '')
  and coalesce(title_de, '') <> '';

-- Fallback for remaining empty slugs
update public.events
set slug = 'event-' || id::text
where slug is null or slug = '';

alter table public.events
alter column slug set not null;

create unique index if not exists idx_events_slug_unique
on public.events (slug);
