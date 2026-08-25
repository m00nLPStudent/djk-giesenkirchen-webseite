-- B15.19H1.1 SECURITY-DOWNGRADE rollback only. Do not execute casually.
-- This restores exactly the historically observed PUBLIC write policies and browser grants.
-- It reopens direct sponsor writes for anon/authenticated and should be used only for an explicit emergency rollback.
BEGIN;

DROP POLICY IF EXISTS sponsors_insert_all ON public.sponsors;
DROP POLICY IF EXISTS sponsors_update_all ON public.sponsors;
DROP POLICY IF EXISTS sponsors_delete_all ON public.sponsors;

CREATE POLICY sponsors_insert_all ON public.sponsors FOR INSERT TO public WITH CHECK (true);
CREATE POLICY sponsors_update_all ON public.sponsors FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY sponsors_delete_all ON public.sponsors FOR DELETE TO public USING (true);

GRANT INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER
ON TABLE public.sponsors
TO anon,authenticated;
GRANT SELECT ON TABLE public.sponsors TO anon,authenticated;

COMMIT;
