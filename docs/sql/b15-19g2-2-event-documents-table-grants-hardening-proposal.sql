-- B15.19G2.2 proposal only. Do not execute automatically. Grants only; no data changes.
BEGIN;

REVOKE INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER
ON TABLE public.event_documents
FROM anon,authenticated;

GRANT SELECT
ON TABLE public.event_documents
TO anon,authenticated;

COMMIT;
