-- B15.25 Support Tickets V1 - database proposal
-- MANUAL EXECUTION ONLY after explicit approval.
-- Creates the server-only ticket foundation. It creates no ticket content and
-- does not enable notification e-mail delivery for the new types.

BEGIN;

DO $guard$
BEGIN
  IF to_regclass('public.admin_profiles') IS NULL
     OR to_regclass('auth.users') IS NULL
     OR to_regclass('public.admin_roles') IS NULL
     OR to_regclass('public.admin_permissions') IS NULL
     OR to_regclass('public.admin_role_permissions') IS NULL
     OR to_regclass('public.admin_user_roles') IS NULL
     OR to_regclass('public.departments') IS NULL
     OR to_regclass('public.teams') IS NULL
     OR to_regclass('public.notifications') IS NULL
     OR to_regclass('public.notification_email_settings') IS NULL
     OR to_regclass('public.notification_email_global_settings') IS NULL THEN
    RAISE EXCEPTION 'B15.25 prerequisite relation is missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_proc procedure_row
    JOIN pg_catalog.pg_namespace namespace_row
      ON namespace_row.oid = procedure_row.pronamespace
    WHERE procedure_row.proname = 'gen_random_uuid'
      AND pg_catalog.pg_get_function_identity_arguments(procedure_row.oid) = ''
  ) THEN
    RAISE EXCEPTION 'B15.25 gen_random_uuid() prerequisite is missing';
  END IF;

  IF to_regprocedure('public.set_updated_at()') IS NULL THEN
    RAISE EXCEPTION 'B15.25 public.set_updated_at() prerequisite is missing';
  END IF;

  IF to_regrole('anon') IS NULL
     OR to_regrole('authenticated') IS NULL
     OR to_regrole('service_role') IS NULL THEN
    RAISE EXCEPTION 'B15.25 required Supabase role is missing';
  END IF;

  IF to_regclass('public.support_tickets') IS NOT NULL
     OR to_regclass('public.support_ticket_messages') IS NOT NULL
     OR to_regclass('public.support_ticket_events') IS NOT NULL
     OR to_regclass('public.support_ticket_number_seq') IS NOT NULL
     OR to_regprocedure('public.touch_support_ticket_from_message()') IS NOT NULL THEN
    RAISE EXCEPTION 'B15.25 target object already exists; stop for compatibility review';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.admin_permissions
    WHERE key IN (
      'support_tickets.view_own',
      'support_tickets.create',
      'support_tickets.reply_own',
      'support_tickets.manage'
    )
  ) THEN
    RAISE EXCEPTION 'B15.25 support ticket permission already exists';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.notification_email_settings
    WHERE notification_type IN (
      'ticket_created',
      'ticket_reply_created',
      'ticket_status_changed'
    )
  ) THEN
    RAISE EXCEPTION 'B15.25 ticket notification e-mail setting already exists';
  END IF;

  IF (SELECT count(*) FROM public.admin_roles WHERE key = 'superadmin' AND is_active IS TRUE) <> 1 THEN
    RAISE EXCEPTION 'B15.25 requires exactly one active superadmin role';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.admin_roles
    WHERE is_active IS TRUE AND key <> 'superadmin'
  ) THEN
    RAISE EXCEPTION 'B15.25 requires at least one active non-superadmin role';
  END IF;

  IF (SELECT count(*) FROM public.notification_email_global_settings) <> 1
     OR NOT EXISTS (
       SELECT 1 FROM public.notification_email_global_settings
       WHERE setting_key = 'global'
     ) THEN
    RAISE EXCEPTION 'B15.25 unexpected notification e-mail global-settings baseline';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_index index_row
    WHERE index_row.indrelid = 'public.admin_role_permissions'::regclass
      AND index_row.indisunique IS TRUE
      AND index_row.indisexclusion IS FALSE
      AND index_row.indisvalid IS TRUE
      AND index_row.indisready IS TRUE
      AND index_row.indpred IS NULL
      AND index_row.indexprs IS NULL
      AND index_row.indnkeyatts = 2
      AND (
        SELECT pg_catalog.array_agg(attribute_row.attname::text ORDER BY attribute_row.attname::text)
        FROM pg_catalog.unnest(index_row.indkey::smallint[]) WITH ORDINALITY
          AS key_column(attribute_number, key_order)
        JOIN pg_catalog.pg_attribute attribute_row
          ON attribute_row.attrelid = index_row.indrelid
         AND attribute_row.attnum = key_column.attribute_number
        WHERE key_column.key_order <= index_row.indnkeyatts
      ) = ARRAY['permission_id', 'role_id']::text[]
  ) THEN
    RAISE EXCEPTION 'B15.25 admin_role_permissions unique-link contract is missing';
  END IF;
END;
$guard$;

CREATE SEQUENCE public.support_ticket_number_seq
  AS bigint
  START WITH 1
  INCREMENT BY 1
  MINVALUE 1
  NO MAXVALUE
  CACHE 1;

CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number text NOT NULL DEFAULT (
    'ST-' || lpad(nextval('public.support_ticket_number_seq')::text, 8, '0')
  ),
  created_by_profile_id uuid NOT NULL,
  category text NOT NULL,
  area_key text NOT NULL,
  department_id uuid NULL,
  team_id uuid NULL,
  subject text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  priority text NOT NULL DEFAULT 'normal',
  assigned_to_profile_id uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz NULL,
  closed_by_profile_id uuid NULL,

  CONSTRAINT support_tickets_ticket_number_key UNIQUE (ticket_number),
  CONSTRAINT support_tickets_created_by_profile_fkey
    FOREIGN KEY (created_by_profile_id)
    REFERENCES public.admin_profiles(id)
    ON UPDATE NO ACTION ON DELETE RESTRICT,
  CONSTRAINT support_tickets_department_fkey
    FOREIGN KEY (department_id)
    REFERENCES public.departments(id)
    ON UPDATE NO ACTION ON DELETE SET NULL,
  CONSTRAINT support_tickets_team_fkey
    FOREIGN KEY (team_id)
    REFERENCES public.teams(id)
    ON UPDATE NO ACTION ON DELETE SET NULL,
  CONSTRAINT support_tickets_assigned_to_profile_fkey
    FOREIGN KEY (assigned_to_profile_id)
    REFERENCES public.admin_profiles(id)
    ON UPDATE NO ACTION ON DELETE SET NULL,
  CONSTRAINT support_tickets_closed_by_profile_fkey
    FOREIGN KEY (closed_by_profile_id)
    REFERENCES public.admin_profiles(id)
    ON UPDATE NO ACTION ON DELETE SET NULL,
  CONSTRAINT support_tickets_ticket_number_check CHECK (
    ticket_number ~ '^ST-[0-9]{8,}$'
  ),
  CONSTRAINT support_tickets_category_check CHECK (
    category IN ('problem', 'question', 'improvement', 'other')
  ),
  CONSTRAINT support_tickets_area_key_check CHECK (
    area_key = btrim(area_key)
    AND char_length(area_key) BETWEEN 1 AND 80
    AND area_key ~ '^[a-z][a-z0-9_:-]*$'
  ),
  CONSTRAINT support_tickets_subject_check CHECK (
    subject = btrim(subject)
    AND char_length(subject) BETWEEN 3 AND 200
  ),
  CONSTRAINT support_tickets_status_check CHECK (
    status IN ('open', 'in_progress', 'waiting_for_response', 'completed')
  ),
  CONSTRAINT support_tickets_priority_check CHECK (
    priority IN ('low', 'normal', 'high', 'urgent')
  ),
  CONSTRAINT support_tickets_activity_time_check CHECK (
    last_activity_at >= created_at
  ),
  CONSTRAINT support_tickets_closed_state_check CHECK (
    (status = 'completed' AND closed_at IS NOT NULL)
    OR
    (status <> 'completed' AND closed_at IS NULL AND closed_by_profile_id IS NULL)
  ),
  CONSTRAINT support_tickets_closed_time_check CHECK (
    closed_at IS NULL OR closed_at >= created_at
  )
);

CREATE TABLE public.support_ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL,
  author_profile_id uuid NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT support_ticket_messages_ticket_fkey
    FOREIGN KEY (ticket_id)
    REFERENCES public.support_tickets(id)
    ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT support_ticket_messages_author_profile_fkey
    FOREIGN KEY (author_profile_id)
    REFERENCES public.admin_profiles(id)
    ON UPDATE NO ACTION ON DELETE SET NULL,
  CONSTRAINT support_ticket_messages_body_check CHECK (
    body = btrim(body)
    AND char_length(body) BETWEEN 1 AND 10000
  )
);

CREATE TABLE public.support_ticket_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL,
  event_type text NOT NULL,
  actor_profile_id uuid NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT support_ticket_events_ticket_fkey
    FOREIGN KEY (ticket_id)
    REFERENCES public.support_tickets(id)
    ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT support_ticket_events_actor_profile_fkey
    FOREIGN KEY (actor_profile_id)
    REFERENCES public.admin_profiles(id)
    ON UPDATE NO ACTION ON DELETE SET NULL,
  CONSTRAINT support_ticket_events_type_check CHECK (
    event_type IN (
      'created',
      'reply_created',
      'status_changed',
      'assigned',
      'closed',
      'reopened'
    )
  ),
  CONSTRAINT support_ticket_events_metadata_object_check CHECK (
    jsonb_typeof(metadata) = 'object'
  ),
  CONSTRAINT support_ticket_events_metadata_size_check CHECK (
    pg_column_size(metadata) <= 16384
  ),
  CONSTRAINT support_ticket_events_no_message_content_check CHECK (
    NOT (metadata ?| ARRAY['body', 'message', 'subject', 'description', 'content'])
  )
);

CREATE INDEX support_tickets_created_by_idx
  ON public.support_tickets (created_by_profile_id, last_activity_at DESC, id);

CREATE INDEX support_tickets_status_idx
  ON public.support_tickets (status, last_activity_at DESC, id);

CREATE INDEX support_tickets_last_activity_idx
  ON public.support_tickets (last_activity_at DESC, id);

CREATE INDEX support_tickets_department_idx
  ON public.support_tickets (department_id, last_activity_at DESC)
  WHERE department_id IS NOT NULL;

CREATE INDEX support_tickets_team_idx
  ON public.support_tickets (team_id, last_activity_at DESC)
  WHERE team_id IS NOT NULL;

CREATE INDEX support_tickets_assigned_to_idx
  ON public.support_tickets (assigned_to_profile_id, status, last_activity_at DESC)
  WHERE assigned_to_profile_id IS NOT NULL;

CREATE INDEX support_ticket_messages_ticket_id_idx
  ON public.support_ticket_messages (ticket_id, created_at, id);

CREATE INDEX support_ticket_events_ticket_id_idx
  ON public.support_ticket_events (ticket_id, created_at, id);

CREATE TRIGGER support_tickets_set_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE FUNCTION public.touch_support_ticket_from_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
BEGIN
  UPDATE public.support_tickets
  SET last_activity_at = GREATEST(last_activity_at, NEW.created_at)
  WHERE id = NEW.ticket_id;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.touch_support_ticket_from_message()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.touch_support_ticket_from_message()
  TO service_role;

CREATE TRIGGER support_ticket_messages_touch_parent
  AFTER INSERT ON public.support_ticket_messages
  FOR EACH ROW EXECUTE FUNCTION public.touch_support_ticket_from_message();

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_ticket_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public.support_tickets
  FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.support_ticket_messages
  FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.support_ticket_events
  FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON SEQUENCE public.support_ticket_number_seq
  FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE ON TABLE public.support_tickets
  TO service_role;
GRANT SELECT, INSERT ON TABLE public.support_ticket_messages
  TO service_role;
GRANT SELECT, INSERT ON TABLE public.support_ticket_events
  TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.support_ticket_number_seq
  TO service_role;

INSERT INTO public.admin_permissions (key, name, description, category)
VALUES
  (
    'support_tickets.view_own',
    'Eigene Support-Tickets ansehen',
    'Ausschliesslich eigene Support-Tickets und deren Verlauf ansehen',
    'support_tickets'
  ),
  (
    'support_tickets.create',
    'Support-Tickets erstellen',
    'Eigene Support-Tickets im erlaubten fachlichen Bereich erstellen',
    'support_tickets'
  ),
  (
    'support_tickets.reply_own',
    'Auf eigene Support-Tickets antworten',
    'Auf eigene, fachlich antwortbare Support-Tickets antworten',
    'support_tickets'
  ),
  (
    'support_tickets.manage',
    'Support-Tickets verwalten',
    'Alle Support-Tickets beantworten und administrativ verwalten',
    'support_tickets'
  );

WITH base_permissions(permission_key) AS (
  VALUES
    ('support_tickets.view_own'::text),
    ('support_tickets.create'::text),
    ('support_tickets.reply_own'::text)
)
INSERT INTO public.admin_role_permissions (role_id, permission_id)
SELECT role_row.id, permission_row.id
FROM public.admin_roles role_row
CROSS JOIN base_permissions required
JOIN public.admin_permissions permission_row
  ON permission_row.key = required.permission_key
WHERE role_row.is_active IS TRUE
  AND role_row.key <> 'superadmin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO public.admin_role_permissions (role_id, permission_id)
SELECT role_row.id, permission_row.id
FROM public.admin_roles role_row
JOIN public.admin_permissions permission_row
  ON permission_row.key = 'support_tickets.manage'
WHERE role_row.key = 'superadmin'
  AND role_row.is_active IS TRUE
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO public.notification_email_settings (
  notification_type,
  email_enabled
)
VALUES
  ('ticket_created', false),
  ('ticket_reply_created', false),
  ('ticket_status_changed', false);

COMMENT ON TABLE public.support_tickets IS
  'B15.25 server-only support tickets. Record access is authorized in the application service layer; ticket numbers are display identifiers, never authorization tokens.';
COMMENT ON TABLE public.support_ticket_messages IS
  'B15.25 append-only support conversation messages. V1 exposes no update or delete operation.';
COMMENT ON TABLE public.support_ticket_events IS
  'B15.25 append-only ticket lifecycle events without duplicated message content.';

DO $verify$
BEGIN
  IF (SELECT count(*) FROM public.admin_permissions WHERE key LIKE 'support_tickets.%') <> 4 THEN
    RAISE EXCEPTION 'B15.25 permission creation verification failed';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.admin_roles role_row
    CROSS JOIN (VALUES
      ('support_tickets.view_own'::text),
      ('support_tickets.create'::text),
      ('support_tickets.reply_own'::text)
    ) expected(permission_key)
    LEFT JOIN public.admin_permissions permission_row
      ON permission_row.key = expected.permission_key
    LEFT JOIN public.admin_role_permissions link
      ON link.role_id = role_row.id
     AND link.permission_id = permission_row.id
    WHERE role_row.is_active IS TRUE
      AND role_row.key <> 'superadmin'
      AND link.role_id IS NULL
  ) THEN
    RAISE EXCEPTION 'B15.25 non-superadmin base permission mapping is incomplete';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.admin_roles role_row
    JOIN public.admin_role_permissions link ON link.role_id = role_row.id
    JOIN public.admin_permissions permission_row ON permission_row.id = link.permission_id
    WHERE role_row.key = 'superadmin'
      AND role_row.is_active IS TRUE
      AND permission_row.key = 'support_tickets.manage'
  ) THEN
    RAISE EXCEPTION 'B15.25 superadmin manage permission mapping is missing';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.admin_roles role_row
    JOIN public.admin_role_permissions link ON link.role_id = role_row.id
    JOIN public.admin_permissions permission_row ON permission_row.id = link.permission_id
    WHERE role_row.key = 'superadmin'
      AND permission_row.key IN (
        'support_tickets.view_own',
        'support_tickets.create',
        'support_tickets.reply_own'
      )
  ) THEN
    RAISE EXCEPTION 'B15.25 superadmin received an explicit own-ticket permission';
  END IF;

  IF (SELECT count(*) FROM public.notification_email_settings
      WHERE notification_type IN (
        'ticket_created',
        'ticket_reply_created',
        'ticket_status_changed'
      ) AND email_enabled IS FALSE) <> 3 THEN
    RAISE EXCEPTION 'B15.25 fail-closed notification e-mail settings verification failed';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'support_tickets',
        'support_ticket_messages',
        'support_ticket_events'
      )
  ) THEN
    RAISE EXCEPTION 'B15.25 ticket tables unexpectedly expose an RLS policy';
  END IF;

  IF has_table_privilege('anon', 'public.support_tickets', 'SELECT')
     OR has_table_privilege('authenticated', 'public.support_tickets', 'SELECT')
     OR has_table_privilege('anon', 'public.support_ticket_messages', 'SELECT')
     OR has_table_privilege('authenticated', 'public.support_ticket_messages', 'SELECT')
     OR has_table_privilege('anon', 'public.support_ticket_events', 'SELECT')
     OR has_table_privilege('authenticated', 'public.support_ticket_events', 'SELECT') THEN
    RAISE EXCEPTION 'B15.25 ticket tables unexpectedly expose browser table access';
  END IF;
END;
$verify$;

COMMIT;
