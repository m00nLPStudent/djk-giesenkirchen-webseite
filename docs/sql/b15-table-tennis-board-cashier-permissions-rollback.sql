-- B15 rollback: restores the verified pre-block permission and schema contract.
BEGIN;

DELETE FROM public.admin_role_permissions arp
USING public.admin_roles r, public.admin_permissions p
WHERE arp.role_id=r.id AND arp.permission_id=p.id AND r.key='tischtennis-vorstand'
  AND p.key IN ('news.view','news.create','news.edit','news.delete','news.publish','events.view','events.create','events.edit','events.delete','events.publish');
INSERT INTO public.admin_role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM public.admin_roles r CROSS JOIN public.admin_permissions p
WHERE r.key='kassierer' AND p.key IN ('settings.view','settings.edit') ON CONFLICT DO NOTHING;

DROP POLICY IF EXISTS events_authenticated_read ON public.events;
CREATE POLICY events_authenticated_read ON public.events FOR SELECT TO authenticated
USING (is_published=true OR public.current_admin_has_permission('events.view'));

DROP POLICY IF EXISTS news_authenticated_read ON public.news;
DROP POLICY IF EXISTS news_insert_authorized ON public.news;
DROP POLICY IF EXISTS news_update_authorized ON public.news;
DROP POLICY IF EXISTS news_delete_authorized ON public.news;
CREATE POLICY news_authenticated_read ON public.news FOR SELECT TO authenticated USING ((is_published=true AND published_at IS NOT NULL AND published_at<=now()) OR public.current_admin_has_permission('news.view'));
CREATE POLICY news_insert_authorized ON public.news FOR INSERT TO authenticated WITH CHECK (public.current_admin_has_permission('news.create') AND (is_published=false OR public.current_admin_has_permission('news.publish')));
CREATE POLICY news_update_authorized ON public.news FOR UPDATE TO authenticated USING (public.current_admin_has_permission('news.edit')) WITH CHECK (public.current_admin_has_permission('news.edit'));
CREATE POLICY news_delete_authorized ON public.news FOR DELETE TO authenticated USING (public.current_admin_has_permission('news.delete'));

DROP POLICY IF EXISTS news_documents_authenticated_read ON public.news_documents;
DROP POLICY IF EXISTS news_documents_insert_authorized ON public.news_documents;
DROP POLICY IF EXISTS news_documents_update_authorized ON public.news_documents;
DROP POLICY IF EXISTS news_documents_delete_authorized ON public.news_documents;
CREATE POLICY news_documents_authenticated_read ON public.news_documents FOR SELECT TO authenticated USING ((is_public=true AND EXISTS (SELECT 1 FROM public.news n WHERE n.id=news_documents.news_id AND n.is_published=true AND n.published_at IS NOT NULL AND n.published_at<=now())) OR public.current_admin_has_permission('news.view'));
CREATE POLICY news_documents_insert_authorized ON public.news_documents FOR INSERT TO authenticated WITH CHECK (public.current_admin_has_permission('news.edit'));
CREATE POLICY news_documents_update_authorized ON public.news_documents FOR UPDATE TO authenticated USING (public.current_admin_has_permission('news.edit')) WITH CHECK (public.current_admin_has_permission('news.edit'));
CREATE POLICY news_documents_delete_authorized ON public.news_documents FOR DELETE TO authenticated USING (public.current_admin_has_permission('news.edit'));

DROP INDEX IF EXISTS public.news_department_id_idx;
DROP INDEX IF EXISTS public.events_department_id_idx;
ALTER TABLE public.news DROP CONSTRAINT IF EXISTS news_department_id_fkey;
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_department_id_fkey;
ALTER TABLE public.news DROP COLUMN IF EXISTS department_id;
ALTER TABLE public.events DROP COLUMN IF EXISTS department_id;
COMMIT;
