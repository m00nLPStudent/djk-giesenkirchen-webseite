-- SECURITY WARNING: This rollback restores excessive browser-role privileges and weakens G2.2.
-- Run only after an explicit decision to re-enable REFERENCES, TRIGGER and RLS-bypassing TRUNCATE.
BEGIN;

GRANT TRUNCATE,REFERENCES,TRIGGER
ON TABLE public.event_documents
TO anon,authenticated;

COMMIT;
