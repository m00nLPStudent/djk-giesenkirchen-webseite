-- B15.19I1 read-only schema, data, RLS, grant and bypass inventory. No writes.
SELECT table_name,column_name,data_type,is_nullable,column_default FROM information_schema.columns WHERE table_schema='public' AND table_name IN('club_history_pages','club_history_images','club_history_milestones') ORDER BY table_name,ordinal_position;
SELECT conrelid::regclass::text table_name,conname,contype,pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid IN('public.club_history_pages'::regclass,'public.club_history_images'::regclass,'public.club_history_milestones'::regclass,'public.media_asset_usages'::regclass) ORDER BY table_name,conname;
SELECT tablename,indexname,indexdef FROM pg_indexes WHERE schemaname='public' AND tablename IN('club_history_pages','club_history_images','club_history_milestones') ORDER BY tablename,indexname;
SELECT c.relname,c.relrowsecurity,c.relforcerowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname IN('club_history_pages','club_history_images','club_history_milestones') ORDER BY c.relname;
SELECT tablename,policyname,permissive,roles,cmd,qual,with_check FROM pg_policies WHERE schemaname='public' AND tablename IN('club_history_pages','club_history_images','club_history_milestones') ORDER BY tablename,cmd,policyname;
SELECT table_name,grantee,privilege_type FROM information_schema.role_table_grants WHERE table_schema='public' AND table_name IN('club_history_pages','club_history_images','club_history_milestones') AND grantee IN('anon','authenticated','service_role') ORDER BY table_name,grantee,privilege_type;
SELECT table_name,role_name,privilege_type,has_table_privilege(role_name,format('public.%I',table_name),privilege_type) effective_privilege FROM (SELECT unnest(ARRAY['club_history_pages','club_history_images','club_history_milestones']) table_name) t CROSS JOIN (SELECT unnest(ARRAY['anon','authenticated','service_role']) role_name) r CROSS JOIN (SELECT unnest(ARRAY['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER']) privilege_type) p ORDER BY table_name,role_name,privilege_type;
WITH eligible_proc AS MATERIALIZED (
  SELECT p.oid,p.prosecdef,p.proconfig,p.proowner
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.prokind IN('f','p')
), defined_proc AS MATERIALIZED (
  SELECT p.*,pg_get_functiondef(p.oid) definition FROM eligible_proc p
)
SELECT p.oid::regprocedure function_name,p.prosecdef,p.proconfig,pg_get_userbyid(p.proowner) owner,coalesce(array_agg(DISTINCT dep.refobjid::regclass::text) FILTER(WHERE dep.refobjid IS NOT NULL),'{}') referenced_relations,p.definition
FROM defined_proc p
LEFT JOIN pg_depend dep ON dep.classid='pg_proc'::regclass AND dep.objid=p.oid AND dep.refclassid='pg_class'::regclass
WHERE p.prosecdef OR p.definition ~ 'club_history_(pages|images|milestones)'
GROUP BY p.oid,p.prosecdef,p.proconfig,p.proowner,p.definition
ORDER BY p.oid::regprocedure::text;
WITH eligible_proc AS MATERIALIZED (
  SELECT p.oid,p.prosecdef
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.prokind IN('f','p')
), defined_proc AS MATERIALIZED (
  SELECT p.*,pg_get_functiondef(p.oid) definition FROM eligible_proc p
)
SELECT p.oid::regprocedure function_name,r.rolname,has_function_privilege(r.rolname,p.oid,'EXECUTE') effective_execute
FROM defined_proc p
CROSS JOIN pg_roles r
WHERE r.rolname IN('anon','authenticated','service_role') AND (p.prosecdef OR p.definition ~ 'club_history_(pages|images|milestones)')
ORDER BY p.oid::regprocedure::text,r.rolname;
SELECT count(*) total,count(*) FILTER(WHERE image_url IS NOT NULL AND btrim(image_url)<>'') legacy_images,count(*) FILTER(WHERE to_jsonb(i)->>'media_asset_id' IS NOT NULL) central_images,count(*) FILTER(WHERE to_jsonb(i)->>'media_asset_id' IS NOT NULL AND image_url IS NOT NULL AND btrim(image_url)<>'') dual_references FROM public.club_history_images i;
SELECT i.id,to_jsonb(i)->>'media_asset_id' media_asset_id,ma.media_kind,ma.visibility,ma.is_archived FROM public.club_history_images i LEFT JOIN public.media_assets ma ON ma.id=(to_jsonb(i)->>'media_asset_id')::uuid WHERE to_jsonb(i)->>'media_asset_id' IS NOT NULL AND (ma.id IS NULL OR ma.media_kind<>'image' OR ma.is_archived);
SELECT i.id FROM public.club_history_images i LEFT JOIN public.media_asset_usages u ON u.entity_type='club_history' AND u.entity_id=i.id AND u.field_name='image' AND u.media_asset_id=(to_jsonb(i)->>'media_asset_id')::uuid WHERE to_jsonb(i)->>'media_asset_id' IS NOT NULL AND u.id IS NULL;
SELECT u.* FROM public.media_asset_usages u LEFT JOIN public.club_history_images i ON i.id=u.entity_id WHERE u.entity_type='club_history' AND (i.id IS NULL OR (to_jsonb(i)->>'media_asset_id')::uuid IS DISTINCT FROM u.media_asset_id OR u.field_name<>'image');
SELECT tgname,pg_get_triggerdef(oid) FROM pg_trigger WHERE tgrelid='public.club_history_images'::regclass AND NOT tgisinternal ORDER BY tgname;
