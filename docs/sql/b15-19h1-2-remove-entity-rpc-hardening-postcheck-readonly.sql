-- B15.19H1.2 read-only postcheck. No writes.

-- Complete overload, owner, language, security, volatility and configuration inventory.
SELECT p.oid::regprocedure AS signature,
  pg_get_userbyid(p.proowner) AS owner,
  l.lanname AS language,
  p.prosecdef AS security_definer,
  p.provolatile AS volatility,
  p.proconfig,
  pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid=p.pronamespace
JOIN pg_language l ON l.oid=p.prolang
WHERE n.nspname='public' AND p.proname='remove_entity'
ORDER BY p.oid::regprocedure::text;

-- Direct ACL inventory, including PUBLIC (grantee oid 0).
SELECT p.oid::regprocedure AS signature,
  CASE WHEN acl.grantee=0 THEN 'PUBLIC' ELSE pg_get_userbyid(acl.grantee) END AS grantee,
  acl.privilege_type,
  acl.is_grantable
FROM pg_proc p
JOIN pg_namespace n ON n.oid=p.pronamespace
CROSS JOIN LATERAL aclexplode(COALESCE(p.proacl,acldefault('f',p.proowner))) acl
WHERE n.nspname='public' AND p.proname='remove_entity'
ORDER BY signature::text,grantee;

-- Effective role privileges. Expected: false,false,true,true.
SELECT has_function_privilege('anon','public.remove_entity(text,uuid)','EXECUTE') anon_must_be_false,
  has_function_privilege('authenticated','public.remove_entity(text,uuid)','EXECUTE') authenticated_must_be_false,
  has_function_privilege('service_role','public.remove_entity(text,uuid)','EXECUTE') service_role_must_be_true,
  has_function_privilege('postgres','public.remove_entity(text,uuid)','EXECUTE') postgres_must_remain_true;

-- Catalog dependencies. PL/pgSQL relation references may not be represented as pg_depend rows.
SELECT d.deptype,d.classid::regclass AS dependent_catalog,d.refclassid::regclass AS referenced_catalog,
  d.objid,d.refobjid
FROM pg_depend d
WHERE d.objid IN (
  SELECT p.oid FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.proname='remove_entity'
)
ORDER BY d.deptype,d.refclassid::regclass::text,d.refobjid;

-- H1.1 RLS and policy contract remains intact.
SELECT c.relrowsecurity,c.relforcerowsecurity
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relname='sponsors';
SELECT policyname,roles,cmd,qual,with_check FROM pg_policies WHERE schemaname='public' AND tablename='sponsors' ORDER BY policyname;
SELECT count(*) AS sponsor_browser_write_policies_must_be_zero FROM pg_policies
WHERE schemaname='public' AND tablename='sponsors' AND cmd IN('INSERT','UPDATE','DELETE','ALL')
  AND roles && ARRAY['public','anon','authenticated']::name[];

-- H1.1 effective table grants remain SELECT-only for browser roles.
SELECT role_name,
  has_table_privilege(role_name,'public.sponsors','SELECT') AS can_select,
  has_table_privilege(role_name,'public.sponsors','INSERT') AS can_insert,
  has_table_privilege(role_name,'public.sponsors','UPDATE') AS can_update,
  has_table_privilege(role_name,'public.sponsors','DELETE') AS can_delete,
  has_table_privilege(role_name,'public.sponsors','TRUNCATE') AS can_truncate,
  has_table_privilege(role_name,'public.sponsors','REFERENCES') AS can_reference,
  has_table_privilege(role_name,'public.sponsors','TRIGGER') AS can_trigger
FROM (VALUES('anon'),('authenticated'),('service_role')) AS roles(role_name);

-- H1 media structure remains present.
SELECT column_name,data_type,is_nullable FROM information_schema.columns WHERE table_schema='public' AND table_name='sponsors' AND column_name IN('image_url','image_media_asset_id') ORDER BY column_name;
SELECT conname,pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid='public.sponsors'::regclass AND conname='sponsors_image_media_asset_id_fkey';
SELECT indexname,indexdef FROM pg_indexes WHERE schemaname='public' AND tablename='sponsors' AND indexname='sponsors_image_media_asset_idx';
SELECT tgname,pg_get_triggerdef(oid) FROM pg_trigger WHERE tgrelid='public.sponsors'::regclass AND tgname='sponsor_cleanup_media_usage' AND NOT tgisinternal;
