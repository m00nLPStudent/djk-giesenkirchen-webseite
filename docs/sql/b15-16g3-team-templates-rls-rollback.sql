-- B15.16G3 rollback: remove only the three additive policies.
BEGIN;
DROP POLICY IF EXISTS team_templates_insert_settings_edit ON public.team_templates;
DROP POLICY IF EXISTS team_templates_update_settings_edit ON public.team_templates;
DROP POLICY IF EXISTS team_templates_delete_settings_edit ON public.team_templates;
COMMIT;
