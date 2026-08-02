-- B15.16H2 final schema. Execute manually only after review.
BEGIN;
DO $$ BEGIN IF to_regprocedure('public.set_updated_at()') IS NULL THEN RAISE EXCEPTION 'public.set_updated_at() is missing'; END IF; END $$;

CREATE TABLE public.news_categories (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name_de text NOT NULL, name_en text NULL, slug text NOT NULL UNIQUE, is_active boolean DEFAULT true, sort_order integer DEFAULT 0, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE public.event_types (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name_de text NOT NULL, name_en text NULL, slug text NOT NULL UNIQUE, is_active boolean DEFAULT true, sort_order integer DEFAULT 0, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now(), is_system boolean DEFAULT false);
CREATE TABLE public.download_categories (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name_de text NOT NULL, name_en text NULL, slug text NOT NULL UNIQUE, is_active boolean DEFAULT true, sort_order integer DEFAULT 0, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());

CREATE INDEX news_categories_active_sort_idx ON public.news_categories (is_active, sort_order);
CREATE INDEX event_types_active_sort_idx ON public.event_types (is_active, sort_order);
CREATE INDEX download_categories_active_sort_idx ON public.download_categories (is_active, sort_order);
CREATE TRIGGER news_categories_set_updated_at BEFORE UPDATE ON public.news_categories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER event_types_set_updated_at BEFORE UPDATE ON public.event_types FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER download_categories_set_updated_at BEFORE UPDATE ON public.download_categories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE FUNCTION public.protect_event_system_type() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN IF TG_OP='DELETE' THEN RAISE EXCEPTION 'System event types cannot be deleted'; END IF; IF NEW.slug<>OLD.slug OR NEW.is_system=false OR NEW.is_active=false THEN RAISE EXCEPTION 'System event type cannot be deactivated or technically changed'; END IF; RETURN NEW; END; $$;
CREATE TRIGGER event_types_protect_system BEFORE UPDATE OR DELETE ON public.event_types FOR EACH ROW WHEN (OLD.is_system=true) EXECUTE FUNCTION public.protect_event_system_type();
COMMIT;
