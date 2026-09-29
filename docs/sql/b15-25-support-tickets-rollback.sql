-- B15.25 Support Tickets V1 - rollback
-- MANUAL EXECUTION ONLY after explicit approval.
-- Fail-closed: ticket data blocks this rollback so that support history cannot
-- be destroyed accidentally.

BEGIN;

DO $guard$
BEGIN
  IF to_regclass('public.support_tickets') IS NULL
     OR to_regclass('public.support_ticket_messages') IS NULL
     OR to_regclass('public.support_ticket_events') IS NULL
     OR to_regclass('public.support_ticket_number_seq') IS NULL
     OR to_regprocedure('public.touch_support_ticket_from_message()') IS NULL THEN
    RAISE EXCEPTION 'B15.25 rollback requires the complete ticket schema; stop for manual review';
  END IF;

  IF EXISTS (SELECT 1 FROM public.support_tickets)
     OR EXISTS (SELECT 1 FROM public.support_ticket_messages)
     OR EXISTS (SELECT 1 FROM public.support_ticket_events) THEN
    RAISE EXCEPTION 'B15.25 rollback blocked because ticket history exists';
  END IF;

  IF (SELECT count(*) FROM public.admin_permissions
      WHERE key IN (
        'support_tickets.view_own',
        'support_tickets.create',
        'support_tickets.reply_own',
        'support_tickets.manage'
      )
      AND category = 'support_tickets') <> 4 THEN
    RAISE EXCEPTION 'B15.25 rollback permission ownership cannot be proven';
  END IF;

  IF (SELECT count(*) FROM public.notification_email_settings
      WHERE notification_type IN (
        'ticket_created',
        'ticket_reply_created',
        'ticket_status_changed'
      )) <> 3 THEN
    RAISE EXCEPTION 'B15.25 rollback notification-setting ownership cannot be proven';
  END IF;
END;
$guard$;

DELETE FROM public.notification_email_settings
WHERE notification_type IN (
  'ticket_created',
  'ticket_reply_created',
  'ticket_status_changed'
);

DELETE FROM public.admin_role_permissions link
USING public.admin_permissions permission_row
WHERE link.permission_id = permission_row.id
  AND permission_row.key IN (
    'support_tickets.view_own',
    'support_tickets.create',
    'support_tickets.reply_own',
    'support_tickets.manage'
  )
  AND permission_row.category = 'support_tickets';

DELETE FROM public.admin_permissions
WHERE key IN (
  'support_tickets.view_own',
  'support_tickets.create',
  'support_tickets.reply_own',
  'support_tickets.manage'
)
AND category = 'support_tickets';

DROP TABLE public.support_ticket_events;
DROP TABLE public.support_ticket_messages;
DROP TABLE public.support_tickets;

DROP FUNCTION public.touch_support_ticket_from_message();
DROP SEQUENCE public.support_ticket_number_seq;

COMMIT;
