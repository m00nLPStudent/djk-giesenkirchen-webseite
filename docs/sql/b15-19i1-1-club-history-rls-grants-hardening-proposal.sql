-- B15.19I1.1 security proposal only. Do not execute automatically.
-- Removes browser writes from the three club-history tables; public reads stay unchanged.
BEGIN;

ALTER TABLE public.club_history_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_history_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_history_milestones ENABLE ROW LEVEL SECURITY;

DO $drop_browser_write_policies$
DECLARE policy_row record;
BEGIN
  FOR policy_row IN
    SELECT tablename,policyname
    FROM pg_policies
    WHERE schemaname='public'
      AND tablename IN('club_history_pages','club_history_images','club_history_milestones')
      AND cmd IN('ALL','INSERT','UPDATE','DELETE')
      AND roles && ARRAY['public','anon','authenticated']::name[]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I',policy_row.policyname,policy_row.tablename);
  END LOOP;
END;
$drop_browser_write_policies$;

REVOKE INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER ON TABLE public.club_history_pages FROM PUBLIC,anon,authenticated;
REVOKE INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER ON TABLE public.club_history_images FROM PUBLIC,anon,authenticated;
REVOKE INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER ON TABLE public.club_history_milestones FROM PUBLIC,anon,authenticated;
GRANT SELECT ON TABLE public.club_history_pages,public.club_history_images,public.club_history_milestones TO anon,authenticated;

COMMIT;
