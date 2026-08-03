-- Run after b15-18a-notifications-schema-proposal.sql. Proposal only.
BEGIN;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notifications_select_own
  ON public.notifications FOR SELECT TO authenticated
  USING (recipient_user_id = auth.uid());

CREATE POLICY notifications_update_own
  ON public.notifications FOR UPDATE TO authenticated
  USING (recipient_user_id = auth.uid())
  WITH CHECK (recipient_user_id = auth.uid());

CREATE POLICY notifications_delete_own
  ON public.notifications FOR DELETE TO authenticated
  USING (recipient_user_id = auth.uid());

REVOKE ALL ON TABLE public.notifications FROM anon, authenticated;
GRANT SELECT, DELETE ON TABLE public.notifications TO authenticated;
GRANT UPDATE (is_read, read_at) ON TABLE public.notifications TO authenticated;
GRANT ALL ON TABLE public.notifications TO service_role;

-- Deliberately no authenticated INSERT policy. Notifications are created only
-- by trusted server-side services after their module-specific authorization.
COMMIT;
