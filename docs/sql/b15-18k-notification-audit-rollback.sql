-- B15.18K rollback proposal only. Restores B15.18G behavior; do not execute automatically.
BEGIN;
DROP FUNCTION IF EXISTS public.append_notification_audit(text,text,uuid,uuid,integer,integer,integer,integer,integer,integer,text,text,text,text,jsonb);

GRANT INSERT, SELECT ON TABLE public.notification_audit TO authenticated;
CREATE POLICY notification_audit_insert_active_admin ON public.notification_audit FOR INSERT TO authenticated
WITH CHECK (auth.role() = 'authenticated' AND EXISTS (
  SELECT 1 FROM public.admin_profiles p
  JOIN public.admin_user_roles ur ON ur.user_id = p.id
  JOIN public.admin_roles r ON r.id = ur.role_id
  WHERE p.is_active = true AND (p.id = auth.uid() OR lower(p.email) = lower(auth.jwt()->>'email'))
));
COMMIT;
