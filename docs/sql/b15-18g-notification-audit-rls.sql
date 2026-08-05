-- B15.18G proposal only. Uses the established G3 relational authorization model.
BEGIN;
ALTER TABLE public.notification_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY notification_audit_insert_active_admin ON public.notification_audit FOR INSERT TO authenticated
WITH CHECK (auth.role() = 'authenticated' AND EXISTS (
  SELECT 1 FROM public.admin_profiles p JOIN public.admin_user_roles ur ON ur.user_id = p.id JOIN public.admin_roles r ON r.id = ur.role_id
  WHERE p.is_active = true AND (p.id = auth.uid() OR lower(p.email) = lower(auth.jwt()->>'email'))
));

CREATE POLICY notification_audit_select_superadmin ON public.notification_audit FOR SELECT TO authenticated
USING (auth.role() = 'authenticated' AND EXISTS (
  SELECT 1 FROM public.admin_profiles p JOIN public.admin_user_roles ur ON ur.user_id = p.id JOIN public.admin_roles r ON r.id = ur.role_id
  WHERE p.is_active = true AND (p.id = auth.uid() OR lower(p.email) = lower(auth.jwt()->>'email')) AND r.key = 'superadmin'
));

REVOKE ALL ON TABLE public.notification_audit FROM anon, authenticated;
GRANT INSERT, SELECT ON TABLE public.notification_audit TO authenticated;
REVOKE ALL ON FUNCTION public.load_notification_audit_monitoring(text,text,text,integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.load_notification_audit_monitoring(text,text,text,integer) TO authenticated;
COMMIT;
