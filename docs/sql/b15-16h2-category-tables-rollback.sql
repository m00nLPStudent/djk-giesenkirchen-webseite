BEGIN;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_constraint WHERE contype='f' AND confrelid IN ('public.news_categories'::regclass,'public.event_types'::regclass,'public.download_categories'::regclass)) THEN RAISE EXCEPTION 'Rollback blocked by later foreign keys'; END IF; END $$;
DROP TABLE public.download_categories;
DROP TABLE public.event_types;
DROP TABLE public.news_categories;
DROP FUNCTION public.protect_event_system_type();
COMMIT;
