-- B15.19A proposal only. Application mutations use an authorized server-only service-role path.
BEGIN;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_asset_usages ENABLE ROW LEVEL SECURITY;

CREATE POLICY media_assets_select_media_roles ON public.media_assets FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.admin_profiles p JOIN public.admin_user_roles ur ON ur.user_id=p.id JOIN public.admin_roles r ON r.id=ur.role_id
    WHERE p.id=auth.uid() AND p.is_active=true AND r.is_active=true AND r.key IN ('superadmin','webmaster'))
);
CREATE POLICY media_usages_select_media_roles ON public.media_asset_usages FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.admin_profiles p JOIN public.admin_user_roles ur ON ur.user_id=p.id JOIN public.admin_roles r ON r.id=ur.role_id
    WHERE p.id=auth.uid() AND p.is_active=true AND r.is_active=true AND r.key IN ('superadmin','webmaster'))
);

REVOKE ALL ON public.media_assets, public.media_asset_usages FROM anon, authenticated;
GRANT SELECT ON public.media_assets, public.media_asset_usages TO authenticated;
-- No authenticated INSERT/UPDATE/DELETE and no storage.objects mutation policy.
-- Private previews are short-lived signed URLs created only after server-side role authorization.
COMMIT;
