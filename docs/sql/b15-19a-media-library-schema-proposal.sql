-- B15.19A proposal only. Do not execute automatically. Does not migrate legacy files.
BEGIN;

CREATE TABLE public.media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_bucket text NOT NULL CHECK (storage_bucket IN ('media-library-public', 'media-library-private')),
  storage_path text NOT NULL CHECK (storage_path ~ '^(images|documents)/(player|coach|board|team|news|cms|club_history|sponsor|event|document|download|system)/[0-9a-f-]+\.(jpg|png|webp|pdf)$'),
  original_filename text NOT NULL CHECK (char_length(original_filename) BETWEEN 1 AND 255),
  display_name text NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 200),
  media_kind text NOT NULL CHECK (media_kind IN ('image', 'document')),
  mime_type text NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp', 'application/pdf')),
  file_extension text NOT NULL CHECK (file_extension IN ('jpg', 'png', 'webp', 'pdf')),
  file_size_bytes bigint NOT NULL CHECK (file_size_bytes > 0 AND file_size_bytes <= 20971520),
  width integer NULL CHECK (width IS NULL OR width > 0),
  height integer NULL CHECK (height IS NULL OR height > 0),
  alt_text text NULL CHECK (char_length(alt_text) <= 500),
  description text NULL CHECK (char_length(description) <= 2000),
  copyright_notice text NULL CHECK (char_length(copyright_notice) <= 500),
  source_label text NULL CHECK (char_length(source_label) <= 300),
  visibility text NOT NULL DEFAULT 'admin' CHECK (visibility IN ('public', 'admin', 'restricted')),
  purpose text NOT NULL CHECK (purpose IN ('player', 'coach', 'board', 'team', 'news', 'cms', 'club_history', 'sponsor', 'event', 'document', 'download', 'system')),
  is_archived boolean NOT NULL DEFAULT false,
  uploaded_by_user_id uuid NULL REFERENCES public.admin_profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (storage_bucket, storage_path),
  CHECK ((visibility = 'public' AND storage_bucket = 'media-library-public') OR (visibility IN ('admin', 'restricted') AND storage_bucket = 'media-library-private')),
  CHECK ((media_kind = 'image' AND mime_type LIKE 'image/%' AND file_size_bytes <= 10485760) OR (media_kind = 'document' AND mime_type = 'application/pdf'))
);

CREATE TABLE public.media_asset_usages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  media_asset_id uuid NOT NULL REFERENCES public.media_assets(id) ON DELETE RESTRICT,
  entity_type text NOT NULL CHECK (entity_type IN ('player', 'coach', 'board_member', 'team', 'team_season', 'news', 'page', 'club_history', 'sponsor', 'event', 'document', 'download', 'system')),
  entity_id uuid NOT NULL,
  field_name text NOT NULL CHECK (field_name ~ '^[a-z][a-z0-9_]{0,62}$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (media_asset_id, entity_type, entity_id, field_name)
);

CREATE INDEX media_assets_active_created_idx ON public.media_assets (is_archived, created_at DESC);
CREATE INDEX media_assets_kind_visibility_idx ON public.media_assets (media_kind, visibility) WHERE is_archived = false;
CREATE INDEX media_assets_search_idx ON public.media_assets USING gin (to_tsvector('simple', coalesce(display_name, '') || ' ' || coalesce(original_filename, '') || ' ' || coalesce(alt_text, '')));
CREATE INDEX media_asset_usages_entity_idx ON public.media_asset_usages (entity_type, entity_id);
CREATE INDEX media_asset_usages_asset_idx ON public.media_asset_usages (media_asset_id);

CREATE TRIGGER media_assets_set_updated_at BEFORE UPDATE ON public.media_assets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('media-library-public', 'media-library-public', true, 20971520, ARRAY['image/jpeg','image/png','image/webp','application/pdf']),
  ('media-library-private', 'media-library-private', false, 20971520, ARRAY['image/jpeg','image/png','image/webp','application/pdf'])
ON CONFLICT (id) DO NOTHING;

COMMIT;
