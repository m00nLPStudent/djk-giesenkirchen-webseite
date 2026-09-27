-- B15: Vorstand Tischtennis / Kassierer permissions and editorial department scope
-- MANUAL EXECUTION ONLY. Do not run together with the rollback.
BEGIN;

DO $guard$
BEGIN
  IF to_regclass('public.news') IS NULL OR to_regclass('public.events') IS NULL
     OR to_regclass('public.departments') IS NULL OR to_regclass('public.admin_role_permissions') IS NULL THEN
    RAISE EXCEPTION 'Required B15 relations are missing';
  END IF;
  IF to_regprocedure('public.current_admin_permission_allows_department(text,uuid)') IS NULL THEN
    RAISE EXCEPTION 'Required department permission helper is missing';
  END IF;
  IF (SELECT count(*) FROM public.departments WHERE slug IN ('fussball','tischtennis') AND is_active) <> 2 THEN
    RAISE EXCEPTION 'Expected active football and table-tennis departments';
  END IF;
  IF EXISTS (
    SELECT 1 FROM unnest(ARRAY[
      'news.view','news.create','news.edit','news.delete','news.publish',
      'events.view','events.create','events.edit','events.delete','events.publish',
      'settings.view','settings.edit',
      'contributions.view','contributions.create','contributions.edit',
      'contributions.record_payment','contributions.cancel_payment','contributions.defer',
      'contributions.exempt','contributions.cancel','contributions.export'
    ]) key WHERE NOT EXISTS (SELECT 1 FROM public.admin_permissions p WHERE p.key=key)
  ) THEN RAISE EXCEPTION 'Expected permission catalog is incomplete'; END IF;
END $guard$;

ALTER TABLE public.news ADD COLUMN IF NOT EXISTS department_id uuid NULL;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS department_id uuid NULL;

DO $constraints$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.news'::regclass AND conname='news_department_id_fkey') THEN
    ALTER TABLE public.news ADD CONSTRAINT news_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.events'::regclass AND conname='events_department_id_fkey') THEN
    ALTER TABLE public.events ADD CONSTRAINT events_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL;
  END IF;
END $constraints$;

CREATE INDEX IF NOT EXISTS news_department_id_idx ON public.news(department_id) WHERE department_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS events_department_id_idx ON public.events(department_id) WHERE department_id IS NOT NULL;

-- Preserve global rows. Only records with an existing team relation receive its department.
UPDATE public.news n SET department_id=t.department_id
FROM public.teams t WHERE n.football_team_id=t.id AND n.department_id IS NULL;
UPDATE public.events e SET department_id=t.department_id
FROM public.teams t WHERE e.team_id=t.id AND e.department_id IS NULL;

DELETE FROM public.admin_role_permissions arp
USING public.admin_roles r, public.admin_permissions p
WHERE arp.role_id=r.id AND arp.permission_id=p.id
  AND r.key='kassierer' AND p.key IN ('settings.view','settings.edit');

INSERT INTO public.admin_role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM public.admin_roles r CROSS JOIN public.admin_permissions p
WHERE r.key='tischtennis-vorstand'
  AND p.key IN ('news.view','news.create','news.edit','news.delete','news.publish',
                'events.view','events.create','events.edit','events.delete','events.publish')
ON CONFLICT DO NOTHING;

DROP POLICY IF EXISTS events_authenticated_read ON public.events;
CREATE POLICY events_authenticated_read ON public.events FOR SELECT TO authenticated
USING (is_published=true OR public.current_admin_permission_allows_department('events.view',department_id));

DROP POLICY IF EXISTS news_authenticated_read ON public.news;
DROP POLICY IF EXISTS news_insert_authorized ON public.news;
DROP POLICY IF EXISTS news_update_authorized ON public.news;
DROP POLICY IF EXISTS news_delete_authorized ON public.news;
CREATE POLICY news_authenticated_read ON public.news FOR SELECT TO authenticated
USING ((is_published=true AND published_at IS NOT NULL AND published_at<=now())
       OR public.current_admin_permission_allows_department('news.view',department_id));
CREATE POLICY news_insert_authorized ON public.news FOR INSERT TO authenticated
WITH CHECK (public.current_admin_permission_allows_department('news.create',department_id)
  AND (is_published=false OR public.current_admin_permission_allows_department('news.publish',department_id)));
CREATE POLICY news_update_authorized ON public.news FOR UPDATE TO authenticated
USING (public.current_admin_permission_allows_department('news.edit',department_id))
WITH CHECK (public.current_admin_permission_allows_department('news.edit',department_id));
CREATE POLICY news_delete_authorized ON public.news FOR DELETE TO authenticated
USING (public.current_admin_permission_allows_department('news.delete',department_id));

DROP POLICY IF EXISTS news_documents_authenticated_read ON public.news_documents;
DROP POLICY IF EXISTS news_documents_insert_authorized ON public.news_documents;
DROP POLICY IF EXISTS news_documents_update_authorized ON public.news_documents;
DROP POLICY IF EXISTS news_documents_delete_authorized ON public.news_documents;
CREATE POLICY news_documents_authenticated_read ON public.news_documents FOR SELECT TO authenticated
USING ((is_public=true AND EXISTS (SELECT 1 FROM public.news n WHERE n.id=news_documents.news_id AND n.is_published=true AND n.published_at IS NOT NULL AND n.published_at<=now()))
 OR EXISTS (SELECT 1 FROM public.news n WHERE n.id=news_documents.news_id AND public.current_admin_permission_allows_department('news.view',n.department_id)));
CREATE POLICY news_documents_insert_authorized ON public.news_documents FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.news n WHERE n.id=news_documents.news_id AND public.current_admin_permission_allows_department('news.edit',n.department_id)));
CREATE POLICY news_documents_update_authorized ON public.news_documents FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.news n WHERE n.id=news_documents.news_id AND public.current_admin_permission_allows_department('news.edit',n.department_id)))
WITH CHECK (EXISTS (SELECT 1 FROM public.news n WHERE n.id=news_documents.news_id AND public.current_admin_permission_allows_department('news.edit',n.department_id)));
CREATE POLICY news_documents_delete_authorized ON public.news_documents FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.news n WHERE n.id=news_documents.news_id AND public.current_admin_permission_allows_department('news.edit',n.department_id)));

DO $verify$
BEGIN
  IF EXISTS (SELECT 1 FROM public.admin_roles r JOIN public.admin_role_permissions arp ON arp.role_id=r.id JOIN public.admin_permissions p ON p.id=arp.permission_id WHERE r.key='kassierer' AND p.key IN ('settings.view','settings.edit')) THEN RAISE EXCEPTION 'Cashier settings permissions remain'; END IF;
  IF (SELECT count(*) FROM public.admin_roles r JOIN public.admin_role_permissions arp ON arp.role_id=r.id JOIN public.admin_permissions p ON p.id=arp.permission_id WHERE r.key='tischtennis-vorstand' AND p.key LIKE ANY(ARRAY['news.%','events.%'])) <> 10 THEN RAISE EXCEPTION 'Table-tennis editorial permission set is incomplete'; END IF;
END $verify$;

COMMIT;
