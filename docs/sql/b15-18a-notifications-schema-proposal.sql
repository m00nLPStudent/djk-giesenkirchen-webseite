-- B15.18A proposal only. Do not execute automatically.
BEGIN;

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (char_length(btrim(type)) BETWEEN 1 AND 100),
  title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 240),
  message text NOT NULL DEFAULT '',
  target_url text NULL,
  entity_type text NULL,
  entity_id uuid NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX notifications_recipient_created_idx
  ON public.notifications (recipient_user_id, created_at DESC);
CREATE INDEX notifications_recipient_unread_idx
  ON public.notifications (recipient_user_id, created_at DESC)
  WHERE is_read = false;
CREATE INDEX notifications_entity_idx
  ON public.notifications (entity_type, entity_id)
  WHERE entity_type IS NOT NULL AND entity_id IS NOT NULL;

CREATE TRIGGER notifications_set_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.notifications IS
  'Personal notifications. Application services insert with the server-side service client; recipients can only read/update/delete their own rows.';

COMMIT;
