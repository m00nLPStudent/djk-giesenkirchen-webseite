-- SECURITY WARNING: This rollback deliberately restores the insecure pre-G2.1 client-write contract.
-- Run only after an explicit decision to accept anonymous/authenticated direct mutations again.
BEGIN;

GRANT SELECT,INSERT,UPDATE,DELETE ON TABLE public.event_documents TO anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON TABLE public.event_documents TO service_role;

DROP POLICY IF EXISTS event_documents_admin_insert ON public.event_documents;
CREATE POLICY event_documents_admin_insert ON public.event_documents
  FOR INSERT TO anon,authenticated WITH CHECK(true);

DROP POLICY IF EXISTS event_documents_admin_update ON public.event_documents;
CREATE POLICY event_documents_admin_update ON public.event_documents
  FOR UPDATE TO anon,authenticated USING(true) WITH CHECK(true);

DROP POLICY IF EXISTS event_documents_admin_delete ON public.event_documents;
CREATE POLICY event_documents_admin_delete ON public.event_documents
  FOR DELETE TO anon,authenticated USING(true);

COMMIT;
