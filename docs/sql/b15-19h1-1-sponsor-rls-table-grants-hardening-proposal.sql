-- B15.19H1.1 proposal only. Do not execute automatically. No data or storage changes.
BEGIN;

ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sponsors_insert_all ON public.sponsors;
DROP POLICY IF EXISTS sponsors_update_all ON public.sponsors;
DROP POLICY IF EXISTS sponsors_delete_all ON public.sponsors;

REVOKE INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER
ON TABLE public.sponsors
FROM anon,authenticated;

GRANT SELECT ON TABLE public.sponsors TO anon,authenticated;

COMMIT;
