-- B15.16G3: existing admin permission relations secure team_templates writes.
BEGIN;

CREATE POLICY team_templates_insert_settings_edit ON public.team_templates
FOR INSERT TO authenticated WITH CHECK ((auth.role() = 'authenticated')
AND EXISTS (
  SELECT 1
  FROM public.admin_profiles profile
  JOIN public.admin_user_roles user_role ON user_role.user_id = profile.id
  JOIN public.admin_roles role_record ON role_record.id = user_role.role_id
  LEFT JOIN public.admin_role_permissions role_permission ON role_permission.role_id = role_record.id
  LEFT JOIN public.admin_permissions permission_record ON permission_record.id = role_permission.permission_id
  WHERE profile.is_active = true
    AND (profile.id = auth.uid() OR lower(profile.email) = lower(auth.jwt()->>'email'))
    AND (role_record.key = 'superadmin' OR permission_record.key = 'settings.edit')
));

CREATE POLICY team_templates_update_settings_edit ON public.team_templates
FOR UPDATE TO authenticated USING ((auth.role() = 'authenticated')
AND EXISTS (
  SELECT 1
  FROM public.admin_profiles profile
  JOIN public.admin_user_roles user_role ON user_role.user_id = profile.id
  JOIN public.admin_roles role_record ON role_record.id = user_role.role_id
  LEFT JOIN public.admin_role_permissions role_permission ON role_permission.role_id = role_record.id
  LEFT JOIN public.admin_permissions permission_record ON permission_record.id = role_permission.permission_id
  WHERE profile.is_active = true
    AND (profile.id = auth.uid() OR lower(profile.email) = lower(auth.jwt()->>'email'))
    AND (role_record.key = 'superadmin' OR permission_record.key = 'settings.edit')
)) WITH CHECK ((auth.role() = 'authenticated')
AND EXISTS (
  SELECT 1
  FROM public.admin_profiles profile
  JOIN public.admin_user_roles user_role ON user_role.user_id = profile.id
  JOIN public.admin_roles role_record ON role_record.id = user_role.role_id
  LEFT JOIN public.admin_role_permissions role_permission ON role_permission.role_id = role_record.id
  LEFT JOIN public.admin_permissions permission_record ON permission_record.id = role_permission.permission_id
  WHERE profile.is_active = true
    AND (profile.id = auth.uid() OR lower(profile.email) = lower(auth.jwt()->>'email'))
    AND (role_record.key = 'superadmin' OR permission_record.key = 'settings.edit')
));

CREATE POLICY team_templates_delete_settings_edit ON public.team_templates
FOR DELETE TO authenticated USING ((auth.role() = 'authenticated')
AND EXISTS (
  SELECT 1
  FROM public.admin_profiles profile
  JOIN public.admin_user_roles user_role ON user_role.user_id = profile.id
  JOIN public.admin_roles role_record ON role_record.id = user_role.role_id
  LEFT JOIN public.admin_role_permissions role_permission ON role_permission.role_id = role_record.id
  LEFT JOIN public.admin_permissions permission_record ON permission_record.id = role_permission.permission_id
  WHERE profile.is_active = true
    AND (profile.id = auth.uid() OR lower(profile.email) = lower(auth.jwt()->>'email'))
    AND (role_record.key = 'superadmin' OR permission_record.key = 'settings.edit')
));

COMMIT;
