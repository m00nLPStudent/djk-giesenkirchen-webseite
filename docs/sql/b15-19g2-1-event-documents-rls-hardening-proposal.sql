-- B15.19G2.1 proposal only. Do not execute automatically. No data or storage mutations.
BEGIN;

ALTER TABLE public.event_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS event_documents_admin_insert ON public.event_documents;
DROP POLICY IF EXISTS event_documents_admin_update ON public.event_documents;
DROP POLICY IF EXISTS event_documents_admin_delete ON public.event_documents;

-- Preserve the existing public read contract. Create it only if it is unexpectedly absent.
DO $policy$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polrelid='public.event_documents'::regclass
      AND polname='event_documents_public_read'
  ) THEN
    CREATE POLICY event_documents_public_read ON public.event_documents
      FOR SELECT TO anon,authenticated
      USING (
        is_public=true
        AND EXISTS (
          SELECT 1 FROM public.events e
          WHERE e.id=event_documents.event_id AND e.is_published=true
        )
      );
  END IF;
END;
$policy$;

REVOKE INSERT,UPDATE,DELETE ON TABLE public.event_documents FROM anon,authenticated;
GRANT SELECT ON TABLE public.event_documents TO anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON TABLE public.event_documents TO service_role;

COMMIT;
