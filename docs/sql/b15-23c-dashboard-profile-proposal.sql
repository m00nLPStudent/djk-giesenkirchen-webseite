-- B15.23C proposal. MANUAL EXECUTION ONLY after live-preflight review.
BEGIN;

DO $guard$
DECLARE
  purpose_definition text;
  path_definition text;
  entity_definition text;
  sync_definition text;
  purpose_values text[];
  entity_values text[];
  path_regex text;
BEGIN
  IF to_regclass('public.admin_profiles') IS NULL OR to_regclass('public.media_assets') IS NULL
     OR to_regclass('public.media_asset_usages') IS NULL THEN
    RAISE EXCEPTION 'B15.23C aborted: prerequisite table missing';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='admin_profiles'
             AND column_name IN ('nickname','phone','profile_image_media_asset_id')) THEN
    RAISE EXCEPTION 'B15.23C aborted: target column already exists';
  END IF;
  IF to_regprocedure('public.update_own_dashboard_profile(text,text)') IS NOT NULL
     OR to_regprocedure('public.touch_own_admin_profile_last_login()') IS NOT NULL THEN
    RAISE EXCEPTION 'B15.23C aborted: target function already exists';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='admin_profiles'
                 AND policyname='admin_profiles_update_own_authenticated' AND cmd='UPDATE'
                 AND roles @> ARRAY['authenticated']::name[]) THEN
    RAISE EXCEPTION 'B15.23C aborted: expected own-update policy missing';
  END IF;
  IF EXISTS (
    SELECT required.policy_name
    FROM (VALUES
      ('admin_profiles_select_authenticated','SELECT'),
      ('admin_profiles_insert_superadmin','INSERT'),
      ('admin_profiles_update_superadmin','UPDATE'),
      ('admin_profiles_delete_superadmin','DELETE')
    ) AS required(policy_name,command)
    WHERE NOT EXISTS (
      SELECT 1 FROM pg_policies p
      WHERE p.schemaname='public' AND p.tablename='admin_profiles'
        AND p.policyname=required.policy_name AND p.cmd=required.command
    )
  ) THEN
    RAISE EXCEPTION 'B15.23C aborted: expected select/superadmin policy baseline missing';
  END IF;
  SELECT pg_get_constraintdef(oid) INTO purpose_definition FROM pg_constraint
  WHERE conrelid='public.media_assets'::regclass AND contype='c' AND conname='media_assets_purpose_check';
  SELECT pg_get_constraintdef(oid) INTO entity_definition FROM pg_constraint
  WHERE conrelid='public.media_asset_usages'::regclass AND contype='c' AND conname='media_asset_usages_entity_type_check';
  SELECT pg_get_constraintdef(oid) INTO path_definition FROM pg_constraint
  WHERE conrelid='public.media_assets'::regclass AND contype='c' AND conname='media_assets_storage_path_check';

  SELECT array_agg(match[1] ORDER BY match[1]) INTO purpose_values
  FROM regexp_matches(purpose_definition, '''([^'']+)''', 'g') AS match;
  SELECT array_agg(match[1] ORDER BY match[1]) INTO entity_values
  FROM regexp_matches(entity_definition, '''([^'']+)''', 'g') AS match;
  SELECT match[1] INTO path_regex
  FROM regexp_matches(path_definition, '''([^'']+)''', 'g') AS match;

  IF purpose_values IS DISTINCT FROM ARRAY[
    'board','club_history','cms','coach','document','download','event','news','player','sponsor','system','team'
  ]::text[] THEN
    RAISE EXCEPTION 'B15.23C aborted: unexpected media purpose constraint';
  END IF;
  IF entity_values IS DISTINCT FROM ARRAY[
    'board_member','club_contact','club_history','coach','document','download','event','event_document','news',
    'news_document','page','player','sponsor','system','team','team_season'
  ]::text[] THEN
    RAISE EXCEPTION 'B15.23C aborted: unexpected usage entity constraint';
  END IF;
  IF path_regex IS DISTINCT FROM '^(images|documents)/(player|coach|board|team|news|cms|club_history|sponsor|event|document|download|system)/[0-9a-f-]+\.(jpg|png|webp|pdf)$' THEN
    RAISE EXCEPTION 'B15.23C aborted: unexpected media storage-path constraint';
  END IF;
  IF to_regprocedure('public.synchronize_media_assignment(text,uuid,uuid,text)') IS NULL THEN
    RAISE EXCEPTION 'B15.23C aborted: media assignment function missing';
  END IF;
  sync_definition:=pg_get_functiondef('public.synchronize_media_assignment(text,uuid,uuid,text)'::regprocedure);
  IF sync_definition NOT ILIKE ALL(ARRAY['%news_document%','%event_document%','%download%','%club_history%','%contact_image%']) THEN
    RAISE EXCEPTION 'B15.23C aborted: unexpected media assignment baseline';
  END IF;
  IF has_function_privilege('anon','public.synchronize_media_assignment(text,uuid,uuid,text)','EXECUTE')
     OR has_function_privilege('authenticated','public.synchronize_media_assignment(text,uuid,uuid,text)','EXECUTE')
     OR NOT has_function_privilege('service_role','public.synchronize_media_assignment(text,uuid,uuid,text)','EXECUTE') THEN
    RAISE EXCEPTION 'B15.23C aborted: unsafe media assignment grants';
  END IF;
  IF EXISTS (SELECT 1 FROM public.media_assets WHERE purpose='profile')
     OR EXISTS (SELECT 1 FROM public.media_asset_usages WHERE entity_type='admin_profile' OR field_name='avatar') THEN
    RAISE EXCEPTION 'B15.23C aborted: unexpected pre-existing profile media data';
  END IF;
END
$guard$;

ALTER TABLE public.admin_profiles
  ADD COLUMN nickname text NULL,
  ADD COLUMN phone text NULL,
  ADD COLUMN profile_image_media_asset_id uuid NULL;

ALTER TABLE public.admin_profiles
  ADD CONSTRAINT admin_profiles_nickname_check CHECK (
    nickname IS NULL OR (nickname=btrim(nickname) AND char_length(nickname) BETWEEN 1 AND 80)
  ),
  ADD CONSTRAINT admin_profiles_phone_check CHECK (
    phone IS NULL OR (phone=btrim(phone) AND char_length(phone) BETWEEN 1 AND 40)
  ),
  ADD CONSTRAINT admin_profiles_profile_image_media_asset_id_fkey
    FOREIGN KEY(profile_image_media_asset_id) REFERENCES public.media_assets(id) ON DELETE SET NULL;

CREATE INDEX admin_profiles_profile_image_media_asset_idx
  ON public.admin_profiles(profile_image_media_asset_id)
  WHERE profile_image_media_asset_id IS NOT NULL;

DO $constraints$
DECLARE constraint_name text;
BEGIN
  SELECT conname INTO constraint_name FROM pg_constraint
  WHERE conrelid='public.media_assets'::regclass AND contype='c' AND pg_get_constraintdef(oid) ILIKE '%purpose%' LIMIT 1;
  EXECUTE format('ALTER TABLE public.media_assets DROP CONSTRAINT %I',constraint_name);
  ALTER TABLE public.media_assets ADD CONSTRAINT media_assets_purpose_check CHECK (purpose IN (
    'player','coach','board','team','news','cms','club_history','sponsor','event','document','download','system','profile'
  ));
  ALTER TABLE public.media_assets DROP CONSTRAINT media_assets_storage_path_check;
  ALTER TABLE public.media_assets ADD CONSTRAINT media_assets_storage_path_check CHECK (
    storage_path ~ '^((images|documents)/(player|coach|board|team|news|cms|club_history|sponsor|event|document|download|system)/[0-9a-f-]+\.(jpg|png|webp|pdf)|images/profile/[0-9a-f-]+\.(jpg|png|webp))$'
  );
  SELECT conname INTO constraint_name FROM pg_constraint
  WHERE conrelid='public.media_asset_usages'::regclass AND contype='c' AND pg_get_constraintdef(oid) ILIKE '%entity_type%' LIMIT 1;
  EXECUTE format('ALTER TABLE public.media_asset_usages DROP CONSTRAINT %I',constraint_name);
  ALTER TABLE public.media_asset_usages ADD CONSTRAINT media_asset_usages_entity_type_check CHECK (entity_type IN (
    'player','coach','board_member','club_contact','team','team_season','news','news_document','event','event_document',
    'page','club_history','sponsor','document','download','system','admin_profile'
  ));
END
$constraints$;

DROP POLICY admin_profiles_update_own_authenticated ON public.admin_profiles;

CREATE FUNCTION public.update_own_dashboard_profile(p_nickname text,p_phone text)
RETURNS public.admin_profiles LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $fn$
DECLARE safe_nickname text:=NULLIF(btrim(COALESCE(p_nickname,'')),''); safe_phone text:=NULLIF(btrim(COALESCE(p_phone,'')),''); result public.admin_profiles;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF safe_nickname IS NOT NULL AND char_length(safe_nickname)>80 THEN
    RAISE EXCEPTION 'Invalid dashboard nickname';
  END IF;
  IF safe_phone IS NOT NULL AND char_length(safe_phone)>40 THEN
    RAISE EXCEPTION 'Invalid dashboard phone';
  END IF;
  UPDATE public.admin_profiles SET nickname=safe_nickname,phone=safe_phone,updated_at=now()
  WHERE id=auth.uid() AND is_active=true RETURNING * INTO result;
  IF NOT FOUND THEN RAISE EXCEPTION 'Active own admin profile not found'; END IF;
  RETURN result;
END
$fn$;
REVOKE ALL ON FUNCTION public.update_own_dashboard_profile(text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.update_own_dashboard_profile(text,text) TO authenticated;

CREATE FUNCTION public.touch_own_admin_profile_last_login()
RETURNS timestamptz LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $fn$
DECLARE touched_at timestamptz:=now();
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  UPDATE public.admin_profiles SET last_login_at=touched_at WHERE id=auth.uid() AND is_active=true;
  IF NOT FOUND THEN RAISE EXCEPTION 'Active own admin profile not found'; END IF;
  RETURN touched_at;
END
$fn$;
REVOKE ALL ON FUNCTION public.touch_own_admin_profile_last_login() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.touch_own_admin_profile_last_login() TO authenticated;

CREATE OR REPLACE FUNCTION public.synchronize_media_assignment(p_entity_type text,p_entity_id uuid,p_media_asset_id uuid,p_field_name text DEFAULT 'image')
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $fn$
DECLARE v_asset public.media_assets%ROWTYPE; v_expected_media_kind text;
BEGIN
  IF NOT (
    (p_field_name='image' AND p_entity_type IN('coach','player','board_member','club_contact','team','team_season','news','event','sponsor','club_history')) OR
    (p_field_name='contact_image' AND p_entity_type IN('team','team_season')) OR
    (p_field_name='file' AND p_entity_type IN('news_document','event_document','download')) OR
    (p_field_name='avatar' AND p_entity_type='admin_profile')
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
    IF p_entity_type='admin_profile' AND (v_asset.storage_bucket<>'media-library-private' OR v_asset.visibility<>'admin' OR v_asset.purpose<>'profile') THEN
      RAISE EXCEPTION 'Dashboard avatars must be private admin image assets with purpose profile';
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
  ELSIF p_entity_type='admin_profile' AND p_field_name='avatar' THEN UPDATE public.admin_profiles SET profile_image_media_asset_id=p_media_asset_id,updated_at=now() WHERE id=p_entity_id;
  END IF;
  IF NOT FOUND THEN RAISE EXCEPTION 'Media assignment entity not found'; END IF;
  DELETE FROM public.media_asset_usages WHERE entity_type=p_entity_type AND entity_id=p_entity_id AND field_name=p_field_name;
  IF p_media_asset_id IS NOT NULL THEN INSERT INTO public.media_asset_usages(media_asset_id,entity_type,entity_id,field_name) VALUES(p_media_asset_id,p_entity_type,p_entity_id,p_field_name); END IF;
  RETURN p_media_asset_id;
END
$fn$;
REVOKE ALL ON FUNCTION public.synchronize_media_assignment(text,uuid,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.synchronize_media_assignment(text,uuid,uuid,text) TO service_role;

CREATE FUNCTION public.cleanup_admin_profile_media_usage()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $fn$
BEGIN
  DELETE FROM public.media_asset_usages WHERE entity_type='admin_profile' AND entity_id=OLD.id AND field_name='avatar';
  RETURN OLD;
END
$fn$;
REVOKE ALL ON FUNCTION public.cleanup_admin_profile_media_usage() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER admin_profile_cleanup_media_usage AFTER DELETE ON public.admin_profiles
FOR EACH ROW EXECUTE FUNCTION public.cleanup_admin_profile_media_usage();

COMMIT;
