-- B15.19H1.1 read-only postcheck. No writes.

-- A. RLS state.
SELECT c.relrowsecurity,c.relforcerowsecurity
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relname='sponsors';

-- B. Complete policy inventory and explicit absence of browser/public write policies.
SELECT policyname,permissive,roles,cmd,qual,with_check
FROM pg_policies WHERE schemaname='public' AND tablename='sponsors' ORDER BY policyname;
SELECT count(*) AS browser_write_policies_must_be_zero
FROM pg_policies
WHERE schemaname='public' AND tablename='sponsors'
  AND cmd IN('INSERT','UPDATE','DELETE','ALL')
  AND roles && ARRAY['public','anon','authenticated']::name[];

-- C. All seven effective table privileges for each relevant role.
SELECT role_name,
  has_table_privilege(role_name,'public.sponsors','SELECT') AS can_select,
  has_table_privilege(role_name,'public.sponsors','INSERT') AS can_insert,
  has_table_privilege(role_name,'public.sponsors','UPDATE') AS can_update,
  has_table_privilege(role_name,'public.sponsors','DELETE') AS can_delete,
  has_table_privilege(role_name,'public.sponsors','TRUNCATE') AS can_truncate,
  has_table_privilege(role_name,'public.sponsors','REFERENCES') AS can_reference,
  has_table_privilege(role_name,'public.sponsors','TRIGGER') AS can_trigger
FROM (VALUES('anon'),('authenticated'),('service_role')) AS roles(role_name);

-- D. H1 schema, FK, index and cleanup trigger remain present.
SELECT column_name,data_type,is_nullable FROM information_schema.columns WHERE table_schema='public' AND table_name='sponsors' AND column_name IN('image_url','image_media_asset_id') ORDER BY column_name;
SELECT conname,pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid='public.sponsors'::regclass AND conname='sponsors_image_media_asset_id_fkey';
SELECT indexname,indexdef FROM pg_indexes WHERE schemaname='public' AND tablename='sponsors' AND indexname='sponsors_image_media_asset_idx';
SELECT tgname,pg_get_triggerdef(oid) FROM pg_trigger WHERE tgrelid='public.sponsors'::regclass AND tgname='sponsor_cleanup_media_usage' AND NOT tgisinternal;

-- E. Assignment RPC definition, security type and effective execute privileges.
SELECT p.proname,p.prosecdef,pg_get_functiondef(p.oid)
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND p.oid='public.synchronize_media_assignment(text,uuid,uuid,text)'::regprocedure;
SELECT has_function_privilege('anon','public.synchronize_media_assignment(text,uuid,uuid,text)','EXECUTE') anon_must_be_false,
  has_function_privilege('authenticated','public.synchronize_media_assignment(text,uuid,uuid,text)','EXECUTE') authenticated_must_be_false,
  has_function_privilege('service_role','public.synchronize_media_assignment(text,uuid,uuid,text)','EXECUTE') service_role_must_be_true;

-- Inventory only: the historical generic delete RPC is outside the table-grant change.
SELECT grantee,privilege_type FROM information_schema.routine_privileges WHERE routine_schema='public' AND routine_name='remove_entity' ORDER BY grantee;

-- F. Data-integrity inventory; no sponsor rows are modified.
SELECT count(*) total,
  count(*) FILTER(WHERE image_url IS NOT NULL AND btrim(image_url)<>'') legacy_logos,
  count(*) FILTER(WHERE image_media_asset_id IS NOT NULL) central_logos,
  count(*) FILTER(WHERE image_media_asset_id IS NOT NULL AND image_url IS NOT NULL AND btrim(image_url)<>'') dual_references,
  count(*) FILTER(WHERE image_media_asset_id IS NULL AND (image_url IS NULL OR btrim(image_url)='')) without_source
FROM public.sponsors;
SELECT s.id,s.image_media_asset_id,ma.media_kind,ma.visibility,ma.is_archived
FROM public.sponsors s LEFT JOIN public.media_assets ma ON ma.id=s.image_media_asset_id
WHERE s.image_media_asset_id IS NOT NULL AND (ma.id IS NULL OR ma.media_kind<>'image' OR ma.is_archived OR (s.is_active AND ma.visibility<>'public'));
SELECT s.id FROM public.sponsors s LEFT JOIN public.media_asset_usages u ON u.entity_type='sponsor' AND u.entity_id=s.id AND u.field_name='image' AND u.media_asset_id=s.image_media_asset_id WHERE s.image_media_asset_id IS NOT NULL AND u.id IS NULL;
SELECT u.* FROM public.media_asset_usages u LEFT JOIN public.sponsors s ON s.id=u.entity_id WHERE u.entity_type='sponsor' AND (s.id IS NULL OR s.image_media_asset_id IS DISTINCT FROM u.media_asset_id OR u.field_name<>'image');
