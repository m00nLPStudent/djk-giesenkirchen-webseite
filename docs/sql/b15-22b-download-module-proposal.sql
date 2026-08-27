-- B15.22B proposal. MANUAL EXECUTION ONLY. No storage or existing-row mutation.
BEGIN;

DO $preflight$
BEGIN
  IF to_regclass('public.download_categories') IS NULL
     OR to_regclass('public.media_assets') IS NULL
     OR to_regclass('public.media_asset_usages') IS NULL THEN
    RAISE EXCEPTION 'B15.22B prerequisites are missing';
  END IF;
  IF to_regclass('public.downloads') IS NOT NULL THEN
    RAISE EXCEPTION 'public.downloads already exists; manual review required';
  END IF;
  IF EXISTS(SELECT 1 FROM public.admin_permissions WHERE key LIKE 'downloads.%') THEN
    RAISE EXCEPTION 'Download permissions already exist; ownership and rollback require manual review';
  END IF;
  IF to_regprocedure('public.set_updated_at()') IS NULL
     OR to_regprocedure('public.synchronize_media_assignment(text,uuid,uuid,text)') IS NULL THEN
    RAISE EXCEPTION 'Required central functions are missing';
  END IF;
  IF NOT (pg_get_functiondef('public.synchronize_media_assignment(text,uuid,uuid,text)'::regprocedure)
       ILIKE ALL (ARRAY['%news_document%','%event_document%','%club_history%','%sponsor%','%contact_image%'])) THEN
    RAISE EXCEPTION 'Unexpected synchronize_media_assignment baseline; aborting safely';
  END IF;
  IF has_function_privilege('anon','public.synchronize_media_assignment(text,uuid,uuid,text)','EXECUTE')
     OR has_function_privilege('authenticated','public.synchronize_media_assignment(text,uuid,uuid,text)','EXECUTE')
     OR NOT has_function_privilege('service_role','public.synchronize_media_assignment(text,uuid,uuid,text)','EXECUTE') THEN
    RAISE EXCEPTION 'Unexpected synchronize_media_assignment grants; aborting safely';
  END IF;
  IF NOT EXISTS(
    SELECT 1 FROM pg_catalog.pg_constraint
    WHERE conrelid='public.media_asset_usages'::regclass AND contype='c'
      AND pg_get_constraintdef(oid) ILIKE '%entity_type%'
      AND pg_get_constraintdef(oid) ILIKE '%download%'
  ) THEN RAISE EXCEPTION 'media_asset_usages does not permit download entities'; END IF;
END;
$preflight$;

CREATE TABLE public.downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.download_categories(id) ON DELETE RESTRICT,
  media_asset_id uuid NOT NULL REFERENCES public.media_assets(id) ON DELETE RESTRICT,
  title text NOT NULL CHECK (title = btrim(title) AND char_length(title) BETWEEN 1 AND 200),
  description text NULL CHECK (description IS NULL OR (description = btrim(description) AND char_length(description) BETWEEN 1 AND 2000)),
  is_published boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0 CHECK (sort_order BETWEEN 0 AND 1000000),
  published_at timestamptz NULL,
  created_by uuid NULL REFERENCES public.admin_profiles(id) ON DELETE SET NULL,
  updated_by uuid NULL REFERENCES public.admin_profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT downloads_publication_state_check CHECK (
    (is_published AND published_at IS NOT NULL) OR
    (NOT is_published AND published_at IS NULL)
  )
);
COMMENT ON TABLE public.downloads IS 'Public download metadata referencing the central media library; no file data is duplicated.';
COMMENT ON COLUMN public.downloads.media_asset_id IS 'Single primary PDF in media_assets; synchronized with media_asset_usages download/file.';

CREATE INDEX downloads_public_listing_idx
  ON public.downloads(category_id, sort_order, created_at DESC, id)
  WHERE is_published = true;
CREATE INDEX downloads_admin_sort_idx
  ON public.downloads(sort_order, created_at DESC, id);
CREATE INDEX downloads_media_asset_idx ON public.downloads(media_asset_id);

CREATE OR REPLACE FUNCTION public.normalize_download_publication_state()
RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $fn$
BEGIN
  NEW.title := btrim(NEW.title);
  NEW.description := NULLIF(btrim(NEW.description), '');
  IF TG_OP='INSERT' AND NOT EXISTS(SELECT 1 FROM public.download_categories c WHERE c.id=NEW.category_id AND c.is_active=true) THEN
    RAISE EXCEPTION 'New download assignments require an active category';
  END IF;
  IF TG_OP='UPDATE' AND NEW.category_id IS DISTINCT FROM OLD.category_id
     AND NOT EXISTS(SELECT 1 FROM public.download_categories c WHERE c.id=NEW.category_id AND c.is_active=true) THEN
    RAISE EXCEPTION 'Changed download assignments require an active category';
  END IF;
  IF NOT EXISTS(
    SELECT 1 FROM public.media_assets a
    WHERE a.id=NEW.media_asset_id AND NOT a.is_archived
      AND a.media_kind='document' AND a.mime_type='application/pdf'
      AND a.storage_bucket='media-library-private'
      AND a.visibility IN('admin','restricted') AND a.purpose='download'
  ) THEN RAISE EXCEPTION 'Download requires a private, active PDF asset with purpose download'; END IF;
  IF TG_OP='INSERT' AND NEW.is_published THEN
    NEW.published_at := now();
  ELSIF TG_OP='UPDATE' AND NEW.is_published AND OLD.is_published=false THEN
    NEW.published_at := now();
  ELSIF NOT NEW.is_published THEN
    NEW.published_at := NULL;
  END IF;
  RETURN NEW;
END;
$fn$;
REVOKE ALL ON FUNCTION public.normalize_download_publication_state() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER downloads_normalize_publication
  BEFORE INSERT OR UPDATE OF category_id,media_asset_id,title,description,is_published ON public.downloads
  FOR EACH ROW EXECUTE FUNCTION public.normalize_download_publication_state();
CREATE TRIGGER downloads_set_updated_at
  BEFORE UPDATE ON public.downloads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.enforce_download_publish_permission()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $fn$
BEGIN
  IF auth.role()='service_role' THEN RETURN NEW; END IF;
  IF ((TG_OP='INSERT' AND NEW.is_published) OR TG_OP='UPDATE') AND NOT EXISTS(
    SELECT 1 FROM public.admin_profiles ap
    JOIN public.admin_user_roles ur ON ur.user_id=ap.id
    JOIN public.admin_roles r ON r.id=ur.role_id
    LEFT JOIN public.admin_role_permissions rp ON rp.role_id=r.id
    LEFT JOIN public.admin_permissions p ON p.id=rp.permission_id
    WHERE ap.is_active=true
      AND (ap.id=auth.uid() OR lower(ap.email)=lower(auth.jwt()->>'email'))
      AND (r.key='superadmin' OR p.key='downloads.publish')
  ) THEN
    IF TG_OP='INSERT' AND NEW.is_published THEN RAISE EXCEPTION 'Missing downloads.publish permission'; END IF;
    IF TG_OP='UPDATE' AND NEW.is_published IS DISTINCT FROM OLD.is_published THEN RAISE EXCEPTION 'Missing downloads.publish permission'; END IF;
  END IF;
  RETURN NEW;
END;
$fn$;
REVOKE ALL ON FUNCTION public.enforce_download_publish_permission() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER downloads_enforce_publish_permission
  BEFORE INSERT OR UPDATE ON public.downloads
  FOR EACH ROW EXECUTE FUNCTION public.enforce_download_publish_permission();

CREATE OR REPLACE FUNCTION public.synchronize_media_assignment(p_entity_type text,p_entity_id uuid,p_media_asset_id uuid,p_field_name text DEFAULT 'image')
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $fn$
DECLARE v_asset public.media_assets%ROWTYPE; v_expected_media_kind text;
BEGIN
  IF NOT (
    (p_field_name='image' AND p_entity_type IN('coach','player','board_member','club_contact','team','team_season','news','event','sponsor','club_history')) OR
    (p_field_name='contact_image' AND p_entity_type IN('team','team_season')) OR
    (p_field_name='file' AND p_entity_type IN('news_document','event_document','download'))
  ) THEN RAISE EXCEPTION 'Unsupported media assignment target'; END IF;
  v_expected_media_kind:=CASE WHEN p_field_name='file' THEN 'document' ELSE 'image' END;
  IF p_media_asset_id IS NOT NULL THEN
    SELECT * INTO v_asset FROM public.media_assets WHERE id=p_media_asset_id FOR SHARE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Media asset was not found'; END IF;
    IF v_asset.is_archived THEN RAISE EXCEPTION 'Archived media asset is not assignable'; END IF;
    IF v_asset.media_kind<>v_expected_media_kind THEN RAISE EXCEPTION 'Media asset is not assignable to %/%',p_entity_type,p_field_name; END IF;
    IF p_entity_type='download' AND (v_asset.mime_type<>'application/pdf' OR v_asset.storage_bucket<>'media-library-private' OR v_asset.visibility NOT IN('admin','restricted') OR v_asset.purpose<>'download') THEN
      RAISE EXCEPTION 'Download files must be private PDF assets with purpose download';
    END IF;
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
  END IF;
  IF NOT FOUND THEN RAISE EXCEPTION 'Media assignment entity not found'; END IF;
  DELETE FROM public.media_asset_usages WHERE entity_type=p_entity_type AND entity_id=p_entity_id AND field_name=p_field_name;
  IF p_media_asset_id IS NOT NULL THEN INSERT INTO public.media_asset_usages(media_asset_id,entity_type,entity_id,field_name) VALUES(p_media_asset_id,p_entity_type,p_entity_id,p_field_name); END IF;
  RETURN p_media_asset_id;
END;
$fn$;
REVOKE ALL ON FUNCTION public.synchronize_media_assignment(text,uuid,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.synchronize_media_assignment(text,uuid,uuid,text) TO service_role;

CREATE OR REPLACE FUNCTION public.cleanup_download_media_usage()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $fn$
BEGIN
  DELETE FROM public.media_asset_usages WHERE entity_type='download' AND entity_id=OLD.id AND field_name='file';
  RETURN OLD;
END;
$fn$;
REVOKE ALL ON FUNCTION public.cleanup_download_media_usage() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER download_cleanup_media_usage AFTER DELETE ON public.downloads
  FOR EACH ROW EXECUTE FUNCTION public.cleanup_download_media_usage();

INSERT INTO public.admin_permissions(key,name,description,category) VALUES
 ('downloads.view','Downloads ansehen','Download-Einträge ansehen','downloads'),
 ('downloads.create','Downloads erstellen','Download-Einträge anlegen','downloads'),
 ('downloads.edit','Downloads bearbeiten','Download-Einträge bearbeiten','downloads'),
 ('downloads.delete','Downloads löschen','Download-Einträge löschen','downloads'),
 ('downloads.publish','Downloads veröffentlichen','Download-Einträge veröffentlichen','downloads')
ON CONFLICT(key) DO NOTHING;

DO $permissions$
BEGIN
  IF (SELECT count(*) FROM public.admin_permissions WHERE key LIKE 'downloads.%') <> 5 THEN
    RAISE EXCEPTION 'Download permission registry is inconsistent';
  END IF;
  IF EXISTS (SELECT 1 FROM (VALUES('superadmin'),('vorstand'),('webmaster')) expected(key) LEFT JOIN public.admin_roles r ON r.key=expected.key AND r.is_active=true WHERE r.id IS NULL) THEN
    RAISE EXCEPTION 'Required active initial download role is missing';
  END IF;
END;
$permissions$;

WITH mapping(role_key,permission_key) AS (
  SELECT r, p FROM unnest(ARRAY['superadmin','vorstand','webmaster']) r
  CROSS JOIN unnest(ARRAY['downloads.view','downloads.create','downloads.edit','downloads.delete','downloads.publish']) p
)
INSERT INTO public.admin_role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM mapping m JOIN public.admin_roles r ON r.key=m.role_key JOIN public.admin_permissions p ON p.key=m.permission_key
ON CONFLICT(role_id,permission_id) DO NOTHING;

ALTER TABLE public.downloads ENABLE ROW LEVEL SECURITY;
CREATE POLICY downloads_public_read ON public.downloads FOR SELECT TO anon,authenticated
USING (is_published=true AND EXISTS(SELECT 1 FROM public.download_categories c WHERE c.id=category_id AND c.is_active=true));
CREATE POLICY downloads_admin_read ON public.downloads FOR SELECT TO authenticated
USING (EXISTS(SELECT 1 FROM public.admin_profiles ap JOIN public.admin_user_roles ur ON ur.user_id=ap.id JOIN public.admin_roles r ON r.id=ur.role_id LEFT JOIN public.admin_role_permissions rp ON rp.role_id=r.id LEFT JOIN public.admin_permissions p ON p.id=rp.permission_id WHERE ap.is_active=true AND (ap.id=auth.uid() OR lower(ap.email)=lower(auth.jwt()->>'email')) AND (r.key='superadmin' OR p.key='downloads.view')));
CREATE POLICY downloads_admin_insert ON public.downloads FOR INSERT TO authenticated
WITH CHECK (EXISTS(SELECT 1 FROM public.admin_profiles ap JOIN public.admin_user_roles ur ON ur.user_id=ap.id JOIN public.admin_roles r ON r.id=ur.role_id LEFT JOIN public.admin_role_permissions rp ON rp.role_id=r.id LEFT JOIN public.admin_permissions p ON p.id=rp.permission_id WHERE ap.is_active=true AND (ap.id=auth.uid() OR lower(ap.email)=lower(auth.jwt()->>'email')) AND (r.key='superadmin' OR p.key='downloads.create')));
CREATE POLICY downloads_admin_update ON public.downloads FOR UPDATE TO authenticated
USING (EXISTS(SELECT 1 FROM public.admin_profiles ap JOIN public.admin_user_roles ur ON ur.user_id=ap.id JOIN public.admin_roles r ON r.id=ur.role_id LEFT JOIN public.admin_role_permissions rp ON rp.role_id=r.id LEFT JOIN public.admin_permissions p ON p.id=rp.permission_id WHERE ap.is_active=true AND (ap.id=auth.uid() OR lower(ap.email)=lower(auth.jwt()->>'email')) AND (r.key='superadmin' OR p.key='downloads.edit')))
WITH CHECK (EXISTS(SELECT 1 FROM public.admin_profiles ap JOIN public.admin_user_roles ur ON ur.user_id=ap.id JOIN public.admin_roles r ON r.id=ur.role_id LEFT JOIN public.admin_role_permissions rp ON rp.role_id=r.id LEFT JOIN public.admin_permissions p ON p.id=rp.permission_id WHERE ap.is_active=true AND (ap.id=auth.uid() OR lower(ap.email)=lower(auth.jwt()->>'email')) AND (r.key='superadmin' OR p.key='downloads.edit')));
CREATE POLICY downloads_admin_delete ON public.downloads FOR DELETE TO authenticated
USING (EXISTS(SELECT 1 FROM public.admin_profiles ap JOIN public.admin_user_roles ur ON ur.user_id=ap.id JOIN public.admin_roles r ON r.id=ur.role_id LEFT JOIN public.admin_role_permissions rp ON rp.role_id=r.id LEFT JOIN public.admin_permissions p ON p.id=rp.permission_id WHERE ap.is_active=true AND (ap.id=auth.uid() OR lower(ap.email)=lower(auth.jwt()->>'email')) AND (r.key='superadmin' OR p.key='downloads.delete')));

REVOKE ALL ON TABLE public.downloads FROM PUBLIC,anon,authenticated;
GRANT SELECT(id,category_id,title,description,sort_order,published_at) ON public.downloads TO anon,authenticated;
GRANT ALL ON TABLE public.downloads TO service_role;

COMMIT;
