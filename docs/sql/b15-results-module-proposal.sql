-- B15 results module DB proposal. MANUAL EXECUTION ONLY.
-- Creates no result rows and does not touch external competition integrations.
BEGIN;

DO $guard$
DECLARE
  v_purpose text;
  v_entity text;
  v_path text;
  v_sync text;
BEGIN
  IF to_regclass('public.club_results') IS NOT NULL THEN
    RAISE EXCEPTION 'public.club_results already exists; manual compatibility review required';
  END IF;
  IF to_regclass('public.team_seasons') IS NULL OR to_regclass('public.teams') IS NULL
     OR to_regclass('public.seasons') IS NULL OR to_regclass('public.departments') IS NULL
     OR to_regclass('public.admin_profiles') IS NULL OR to_regclass('public.admin_roles') IS NULL
     OR to_regclass('public.admin_permissions') IS NULL OR to_regclass('public.admin_role_permissions') IS NULL
     OR to_regclass('public.media_assets') IS NULL OR to_regclass('public.media_asset_usages') IS NULL
     OR to_regprocedure('public.set_updated_at()') IS NULL
     OR to_regprocedure('public.synchronize_media_assignment(text,uuid,uuid,text)') IS NULL THEN
    RAISE EXCEPTION 'Results module prerequisites are missing';
  END IF;
  IF EXISTS (SELECT 1 FROM public.admin_permissions WHERE key LIKE 'results.%') THEN
    RAISE EXCEPTION 'results.* permissions already exist; ownership review required';
  END IF;
  IF EXISTS (
    SELECT 1 FROM (VALUES ('superadmin'),('webmaster'),('fussball-vorstand'),('tischtennis-vorstand')) expected(key)
    LEFT JOIN public.admin_roles role_row ON role_row.key=expected.key AND role_row.is_active IS TRUE
    GROUP BY expected.key HAVING count(role_row.id) <> 1
  ) THEN RAISE EXCEPTION 'Required active technical results role is missing or ambiguous'; END IF;
  IF (SELECT count(*) FROM public.departments WHERE slug IN ('fussball','tischtennis') AND is_active IS TRUE) <> 2 THEN
    RAISE EXCEPTION 'Expected active football/table-tennis department baseline is missing';
  END IF;
  IF (SELECT count(*) FROM public.team_seasons ts JOIN public.teams t ON t.id=ts.team_id
      JOIN public.seasons s ON s.id=ts.season_id JOIN public.departments d ON d.id=t.department_id
      WHERE d.is_active AND t.is_active AND ts.is_active AND s.is_active AND d.slug IN ('fussball','tischtennis')) <> 18
     OR (SELECT count(*) FROM public.team_seasons ts JOIN public.teams t ON t.id=ts.team_id
      JOIN public.seasons s ON s.id=ts.season_id JOIN public.departments d ON d.id=t.department_id
      WHERE d.is_active AND t.is_active AND ts.is_active AND s.is_active AND d.slug='fussball') <> 15
     OR (SELECT count(*) FROM public.team_seasons ts JOIN public.teams t ON t.id=ts.team_id
      JOIN public.seasons s ON s.id=ts.season_id JOIN public.departments d ON d.id=t.department_id
      WHERE d.is_active AND t.is_active AND ts.is_active AND s.is_active AND d.slug='tischtennis') <> 3 THEN
    RAISE EXCEPTION 'Active team-season baseline differs from the reviewed live preflight';
  END IF;
  SELECT pg_get_constraintdef(oid) INTO v_purpose FROM pg_constraint
    WHERE conrelid='public.media_assets'::regclass AND conname='media_assets_purpose_check' AND contype='c';
  SELECT pg_get_constraintdef(oid) INTO v_entity FROM pg_constraint
    WHERE conrelid='public.media_asset_usages'::regclass AND conname='media_asset_usages_entity_type_check' AND contype='c';
  SELECT pg_get_constraintdef(oid) INTO v_path FROM pg_constraint
    WHERE conrelid='public.media_assets'::regclass AND conname='media_assets_storage_path_check' AND contype='c';
  IF v_purpose IS NULL OR v_purpose NOT ILIKE ALL(ARRAY['%player%','%coach%','%board%','%team%','%news%','%cms%','%club_history%','%sponsor%','%event%','%document%','%download%','%system%','%profile%'])
     OR v_purpose ILIKE '%result%' OR v_entity IS NULL OR v_entity NOT ILIKE ALL(ARRAY['%admin_profile%','%department_section%','%download%','%club_history%'])
     OR v_entity ILIKE '%result%' OR v_path IS NULL OR v_path NOT ILIKE '%images/profile%' OR v_path ILIKE '%result%' THEN
    RAISE EXCEPTION 'Unexpected media constraint baseline';
  END IF;
  SELECT pg_get_functiondef('public.synchronize_media_assignment(text,uuid,uuid,text)'::regprocedure) INTO v_sync;
  IF v_sync NOT ILIKE ALL(ARRAY['%department_section%','%admin_profile%','%download%','%contact_image%'])
     OR v_sync ILIKE '%club_result%' OR has_function_privilege('anon','public.synchronize_media_assignment(text,uuid,uuid,text)','EXECUTE')
     OR has_function_privilege('authenticated','public.synchronize_media_assignment(text,uuid,uuid,text)','EXECUTE')
     OR NOT has_function_privilege('service_role','public.synchronize_media_assignment(text,uuid,uuid,text)','EXECUTE') THEN
    RAISE EXCEPTION 'Unexpected media synchronization baseline or grants';
  END IF;
  IF EXISTS (SELECT 1 FROM public.media_assets WHERE purpose='result')
     OR EXISTS (SELECT 1 FROM public.media_asset_usages WHERE entity_type='result' OR field_name='opponent_logo') THEN
    RAISE EXCEPTION 'Unexpected pre-existing result media data';
  END IF;
END;
$guard$;

CREATE TABLE public.club_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_season_id uuid NOT NULL,
  competition_label text NULL,
  played_at timestamptz NOT NULL,
  club_is_home boolean NOT NULL,
  opponent_name text NOT NULL,
  club_score smallint NOT NULL,
  opponent_score smallint NOT NULL,
  opponent_logo_media_asset_id uuid NULL,
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz NULL,
  visible_from timestamptz NULL,
  visible_until timestamptz NULL,
  created_by uuid NULL,
  updated_by uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT club_results_team_season_fkey FOREIGN KEY(team_season_id) REFERENCES public.team_seasons(id) ON DELETE RESTRICT,
  CONSTRAINT club_results_opponent_logo_fkey FOREIGN KEY(opponent_logo_media_asset_id) REFERENCES public.media_assets(id) ON DELETE SET NULL,
  CONSTRAINT club_results_created_by_fkey FOREIGN KEY(created_by) REFERENCES public.admin_profiles(id) ON DELETE SET NULL,
  CONSTRAINT club_results_updated_by_fkey FOREIGN KEY(updated_by) REFERENCES public.admin_profiles(id) ON DELETE SET NULL,
  CONSTRAINT club_results_opponent_name_check CHECK(opponent_name=btrim(opponent_name) AND char_length(opponent_name) BETWEEN 1 AND 160),
  CONSTRAINT club_results_competition_label_check CHECK(competition_label IS NULL OR (competition_label=btrim(competition_label) AND char_length(competition_label) BETWEEN 1 AND 120)),
  CONSTRAINT club_results_club_score_check CHECK(club_score>=0),
  CONSTRAINT club_results_opponent_score_check CHECK(opponent_score>=0),
  CONSTRAINT club_results_visibility_pair_check CHECK((visible_from IS NULL AND visible_until IS NULL) OR (visible_from IS NOT NULL AND visible_until IS NOT NULL)),
  CONSTRAINT club_results_visibility_order_check CHECK(visible_until IS NULL OR visible_until>visible_from),
  CONSTRAINT club_results_publication_state_check CHECK((is_published AND published_at IS NOT NULL) OR (NOT is_published AND published_at IS NULL))
);
COMMENT ON TABLE public.club_results IS 'Manual football/table-tennis results; public visibility defaults to played_at through played_at + 7 days unless both visibility overrides are set.';

CREATE INDEX club_results_team_played_idx ON public.club_results(team_season_id,played_at DESC,id);
CREATE INDEX club_results_public_window_idx ON public.club_results(played_at DESC,id) WHERE is_published IS TRUE;
CREATE INDEX club_results_override_window_idx ON public.club_results(visible_from,visible_until) WHERE is_published IS TRUE AND visible_from IS NOT NULL;
CREATE INDEX club_results_opponent_logo_idx ON public.club_results(opponent_logo_media_asset_id) WHERE opponent_logo_media_asset_id IS NOT NULL;

CREATE FUNCTION public.normalize_club_result()
RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $fn$
BEGIN
  NEW.opponent_name:=btrim(NEW.opponent_name); NEW.competition_label:=NULLIF(btrim(NEW.competition_label),'');
  IF NOT EXISTS(SELECT 1 FROM public.team_seasons ts JOIN public.teams t ON t.id=ts.team_id
    JOIN public.seasons s ON s.id=ts.season_id JOIN public.departments d ON d.id=t.department_id
    WHERE ts.id=NEW.team_season_id AND ts.is_active AND t.is_active AND s.is_active AND d.is_active
      AND d.slug IN('fussball','tischtennis')) THEN RAISE EXCEPTION 'Result requires an active football or table-tennis team season'; END IF;
  IF NEW.opponent_logo_media_asset_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.media_assets a
    WHERE a.id=NEW.opponent_logo_media_asset_id AND a.media_kind='image' AND a.visibility='public'
      AND a.purpose='result' AND a.is_archived IS FALSE) THEN RAISE EXCEPTION 'Opponent logo requires an active public result image'; END IF;
  IF TG_OP='INSERT' AND NEW.is_published THEN NEW.published_at:=now();
  ELSIF TG_OP='UPDATE' AND NEW.is_published AND OLD.is_published IS FALSE THEN NEW.published_at:=now();
  ELSIF NOT NEW.is_published THEN NEW.published_at:=NULL; END IF;
  RETURN NEW;
END;
$fn$;
REVOKE ALL ON FUNCTION public.normalize_club_result() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER club_results_normalize BEFORE INSERT OR UPDATE ON public.club_results FOR EACH ROW EXECUTE FUNCTION public.normalize_club_result();
CREATE TRIGGER club_results_set_updated_at BEFORE UPDATE ON public.club_results FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.media_assets DROP CONSTRAINT media_assets_purpose_check;
ALTER TABLE public.media_assets ADD CONSTRAINT media_assets_purpose_check CHECK(purpose IN('player','coach','board','team','news','cms','club_history','sponsor','event','document','download','system','profile','result'));
ALTER TABLE public.media_assets DROP CONSTRAINT media_assets_storage_path_check;
ALTER TABLE public.media_assets ADD CONSTRAINT media_assets_storage_path_check CHECK(storage_path ~ '^((images|documents)/(player|coach|board|team|news|cms|club_history|sponsor|event|document|download|system|result)/[0-9a-f-]+\.(jpg|png|webp|pdf)|images/profile/[0-9a-f-]+\.(jpg|png|webp))$');
ALTER TABLE public.media_asset_usages DROP CONSTRAINT media_asset_usages_entity_type_check;
ALTER TABLE public.media_asset_usages ADD CONSTRAINT media_asset_usages_entity_type_check CHECK(entity_type IN('player','coach','board_member','club_contact','team','team_season','news','news_document','event','event_document','page','club_history','sponsor','document','download','system','admin_profile','department_section','result'));

CREATE OR REPLACE FUNCTION public.synchronize_media_assignment(p_entity_type text,p_entity_id uuid,p_media_asset_id uuid,p_field_name text DEFAULT 'image')
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $fn$
DECLARE v_asset public.media_assets%ROWTYPE; v_expected_media_kind text;
BEGIN
  IF NOT ((p_field_name='image' AND p_entity_type IN('coach','player','board_member','club_contact','team','team_season','news','event','sponsor','club_history','department_section')) OR
    (p_field_name='contact_image' AND p_entity_type IN('team','team_season')) OR (p_field_name='file' AND p_entity_type IN('news_document','event_document','download')) OR
    (p_field_name='avatar' AND p_entity_type='admin_profile') OR (p_field_name='opponent_logo' AND p_entity_type='result')) THEN RAISE EXCEPTION 'Unsupported media assignment target'; END IF;
  v_expected_media_kind:=CASE WHEN p_field_name='file' THEN 'document' ELSE 'image' END;
  IF p_media_asset_id IS NOT NULL THEN SELECT * INTO v_asset FROM public.media_assets WHERE id=p_media_asset_id FOR SHARE;
    IF NOT FOUND OR v_asset.is_archived OR v_asset.media_kind<>v_expected_media_kind THEN RAISE EXCEPTION 'Media asset is not assignable'; END IF;
    IF p_entity_type='download' AND (v_asset.mime_type<>'application/pdf' OR v_asset.storage_bucket<>'media-library-private' OR v_asset.visibility NOT IN('admin','restricted') OR v_asset.purpose<>'download') THEN RAISE EXCEPTION 'Invalid download asset'; END IF;
    IF p_entity_type='admin_profile' AND (v_asset.storage_bucket<>'media-library-private' OR v_asset.visibility<>'admin' OR v_asset.purpose<>'profile') THEN RAISE EXCEPTION 'Invalid profile asset'; END IF;
    IF p_entity_type='department_section' AND v_asset.visibility<>'public' THEN RAISE EXCEPTION 'Department section images must be public'; END IF;
    IF p_entity_type='result' AND (v_asset.visibility<>'public' OR v_asset.purpose<>'result') THEN RAISE EXCEPTION 'Opponent logos must be public result assets'; END IF;
  END IF;
  IF p_entity_type='coach' THEN UPDATE public.coaches SET image_media_asset_id=p_media_asset_id WHERE id=p_entity_id;
  ELSIF p_entity_type='player' THEN UPDATE public.players SET image_media_asset_id=p_media_asset_id WHERE id=p_entity_id;
  ELSIF p_entity_type='board_member' THEN UPDATE public.board_members SET image_media_asset_id=p_media_asset_id WHERE id=p_entity_id;
  ELSIF p_entity_type='club_contact' THEN UPDATE public.club_contacts SET image_media_asset_id=p_media_asset_id WHERE id=p_entity_id;
  ELSIF p_entity_type='team' AND p_field_name='image' THEN UPDATE public.teams SET team_image_media_asset_id=p_media_asset_id WHERE id=p_entity_id;
  ELSIF p_entity_type='team_season' AND p_field_name='image' THEN UPDATE public.team_seasons SET team_image_media_asset_id=p_media_asset_id WHERE id=p_entity_id;
  ELSIF p_entity_type='team' AND p_field_name='contact_image' THEN UPDATE public.teams SET contact_image_media_asset_id=p_media_asset_id WHERE id=p_entity_id;
  ELSIF p_entity_type='team_season' AND p_field_name='contact_image' THEN UPDATE public.team_seasons SET contact_image_media_asset_id=p_media_asset_id WHERE id=p_entity_id;
  ELSIF p_entity_type='news' THEN UPDATE public.news SET image_media_asset_id=p_media_asset_id WHERE id=p_entity_id;
  ELSIF p_entity_type='news_document' THEN UPDATE public.news_documents SET media_asset_id=p_media_asset_id WHERE id=p_entity_id;
  ELSIF p_entity_type='event' THEN UPDATE public.events SET image_media_asset_id=p_media_asset_id WHERE id=p_entity_id;
  ELSIF p_entity_type='event_document' THEN UPDATE public.event_documents SET media_asset_id=p_media_asset_id WHERE id=p_entity_id;
  ELSIF p_entity_type='sponsor' THEN UPDATE public.sponsors SET image_media_asset_id=p_media_asset_id WHERE id=p_entity_id;
  ELSIF p_entity_type='club_history' THEN UPDATE public.club_history_images SET media_asset_id=p_media_asset_id WHERE id=p_entity_id;
  ELSIF p_entity_type='download' THEN UPDATE public.downloads SET media_asset_id=p_media_asset_id WHERE id=p_entity_id;
  ELSIF p_entity_type='admin_profile' AND p_field_name='avatar' THEN UPDATE public.admin_profiles SET profile_image_media_asset_id=p_media_asset_id,updated_at=now() WHERE id=p_entity_id;
  ELSIF p_entity_type='department_section' AND p_field_name='image' THEN UPDATE public.department_sections SET image_media_asset_id=p_media_asset_id WHERE id=p_entity_id;
  ELSIF p_entity_type='result' AND p_field_name='opponent_logo' THEN UPDATE public.club_results SET opponent_logo_media_asset_id=p_media_asset_id WHERE id=p_entity_id;
  END IF;
  IF NOT FOUND THEN RAISE EXCEPTION 'Media assignment entity not found'; END IF;
  DELETE FROM public.media_asset_usages WHERE entity_type=p_entity_type AND entity_id=p_entity_id AND field_name=p_field_name;
  IF p_media_asset_id IS NOT NULL THEN INSERT INTO public.media_asset_usages(media_asset_id,entity_type,entity_id,field_name) VALUES(p_media_asset_id,p_entity_type,p_entity_id,p_field_name); END IF;
  RETURN p_media_asset_id;
END;
$fn$;
REVOKE ALL ON FUNCTION public.synchronize_media_assignment(text,uuid,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.synchronize_media_assignment(text,uuid,uuid,text) TO service_role;

CREATE FUNCTION public.cleanup_club_result_media_usage() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $fn$
BEGIN DELETE FROM public.media_asset_usages WHERE entity_type='result' AND entity_id=OLD.id AND field_name='opponent_logo'; RETURN OLD; END;
$fn$;
REVOKE ALL ON FUNCTION public.cleanup_club_result_media_usage() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_club_result_media_usage() TO service_role;
CREATE TRIGGER club_result_cleanup_media_usage AFTER DELETE ON public.club_results FOR EACH ROW EXECUTE FUNCTION public.cleanup_club_result_media_usage();

INSERT INTO public.admin_permissions(key,name,description,category) VALUES
 ('results.view','Ergebnisse ansehen','Manuell gepflegte Vereinsresultate ansehen','results'),
 ('results.create','Ergebnisse erstellen','Manuell gepflegte Vereinsresultate anlegen','results'),
 ('results.edit','Ergebnisse bearbeiten','Manuell gepflegte Vereinsresultate bearbeiten','results'),
 ('results.delete','Ergebnisse löschen','Manuell gepflegte Vereinsresultate löschen','results'),
 ('results.publish','Ergebnisse veröffentlichen','Vereinsresultate veröffentlichen und zurückziehen','results');
WITH mapping(role_key,permission_key) AS (
  SELECT role_key,permission_key FROM unnest(ARRAY['superadmin','webmaster','fussball-vorstand','tischtennis-vorstand']) role_key
  CROSS JOIN unnest(ARRAY['results.view','results.create','results.edit','results.delete','results.publish']) permission_key
)
INSERT INTO public.admin_role_permissions(role_id,permission_id)
SELECT role_row.id,permission_row.id FROM mapping
JOIN public.admin_roles role_row ON role_row.key=mapping.role_key AND role_row.is_active IS TRUE
JOIN public.admin_permissions permission_row ON permission_row.key=mapping.permission_key;

ALTER TABLE public.club_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY club_results_public_read ON public.club_results FOR SELECT TO anon,authenticated USING(
  is_published IS TRUE AND CURRENT_TIMESTAMP>=COALESCE(visible_from,played_at)
  AND CURRENT_TIMESTAMP<COALESCE(visible_until,played_at+interval '7 days')
  AND EXISTS(SELECT 1 FROM public.team_seasons ts JOIN public.teams t ON t.id=ts.team_id
    JOIN public.seasons s ON s.id=ts.season_id JOIN public.departments d ON d.id=t.department_id
    WHERE ts.id=team_season_id AND ts.is_active AND t.is_active AND s.is_active AND d.is_active AND d.slug IN('fussball','tischtennis'))
);
REVOKE ALL ON TABLE public.club_results FROM PUBLIC,anon,authenticated;
GRANT SELECT(id,team_season_id,competition_label,played_at,club_is_home,opponent_name,club_score,opponent_score,opponent_logo_media_asset_id,published_at,visible_from,visible_until) ON public.club_results TO anon,authenticated;
GRANT ALL ON TABLE public.club_results TO service_role;

COMMIT;
