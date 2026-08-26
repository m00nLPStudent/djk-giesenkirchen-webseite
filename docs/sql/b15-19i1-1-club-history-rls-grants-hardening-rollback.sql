-- SECURITY DOWNGRADE / NOT FOR NORMAL USE.
-- Restores the confirmed pre-I1.1 state, including direct anon/authenticated writes and TRUNCATE.
-- This rollback materially weakens security. It changes no application data.
BEGIN;

DROP POLICY IF EXISTS club_history_pages_dev_write ON public.club_history_pages;
CREATE POLICY club_history_pages_dev_write ON public.club_history_pages FOR ALL TO anon,authenticated USING(true) WITH CHECK(true);
DROP POLICY IF EXISTS club_history_images_dev_write ON public.club_history_images;
CREATE POLICY club_history_images_dev_write ON public.club_history_images FOR ALL TO anon,authenticated USING(true) WITH CHECK(true);
DROP POLICY IF EXISTS club_history_milestones_dev_write ON public.club_history_milestones;
CREATE POLICY club_history_milestones_dev_write ON public.club_history_milestones FOR ALL TO anon,authenticated USING(true) WITH CHECK(true);

GRANT SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER ON TABLE public.club_history_pages TO anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER ON TABLE public.club_history_images TO anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER ON TABLE public.club_history_milestones TO anon,authenticated;

COMMIT;
