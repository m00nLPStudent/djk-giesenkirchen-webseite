-- B15.19E3 read-only postcheck. This file performs no writes.
SELECT table_name,column_name,data_type,is_nullable FROM information_schema.columns
WHERE table_schema='public' AND table_name IN ('teams','team_seasons') AND column_name='contact_image_media_asset_id' ORDER BY table_name;

SELECT conrelid::regclass AS table_name,conname,pg_get_constraintdef(oid) AS definition FROM pg_constraint
WHERE conrelid IN ('public.teams'::regclass,'public.team_seasons'::regclass) AND conname LIKE '%contact_image_media_asset_id%';

SELECT schemaname,tablename,indexname,indexdef FROM pg_indexes WHERE schemaname='public' AND indexname IN ('teams_contact_image_media_asset_idx','team_seasons_contact_image_media_asset_idx');
SELECT pg_get_functiondef('public.synchronize_media_assignment(text,uuid,uuid,text)'::regprocedure) AS assignment_rpc;
SELECT grantee,privilege_type FROM information_schema.routine_privileges WHERE specific_schema='public' AND routine_name='synchronize_media_assignment' ORDER BY grantee;
SELECT has_function_privilege('anon','public.synchronize_media_assignment(text,uuid,uuid,text)','EXECUTE') AS anon_must_be_false,
       has_function_privilege('authenticated','public.synchronize_media_assignment(text,uuid,uuid,text)','EXECUTE') AS authenticated_must_be_false,
       has_function_privilege('service_role','public.synchronize_media_assignment(text,uuid,uuid,text)','EXECUTE') AS service_role_must_be_true;

SELECT 'invalid_team_contact_media_references' AS check_name,count(*) FROM public.teams t LEFT JOIN public.media_assets a ON a.id=t.contact_image_media_asset_id WHERE t.contact_image_media_asset_id IS NOT NULL AND a.id IS NULL
UNION ALL SELECT 'invalid_season_contact_media_references',count(*) FROM public.team_seasons ts LEFT JOIN public.media_assets a ON a.id=ts.contact_image_media_asset_id WHERE ts.contact_image_media_asset_id IS NOT NULL AND a.id IS NULL
UNION ALL SELECT 'archived_or_non_image_references',count(*) FROM (
  SELECT a.id,a.is_archived,a.media_kind FROM public.teams t JOIN public.media_assets a ON a.id=t.contact_image_media_asset_id
  UNION ALL SELECT a.id,a.is_archived,a.media_kind FROM public.team_seasons ts JOIN public.media_assets a ON a.id=ts.contact_image_media_asset_id
) x WHERE is_archived OR media_kind<>'image';

SELECT entity_type,entity_id,field_name,count(*) AS duplicate_count FROM public.media_asset_usages
WHERE field_name='contact_image' AND entity_type IN ('team','team_season') GROUP BY entity_type,entity_id,field_name HAVING count(*)>1;

SELECT u.* FROM public.media_asset_usages u LEFT JOIN public.media_assets a ON a.id=u.media_asset_id
WHERE u.field_name='contact_image' AND u.entity_type IN ('team','team_season') AND a.id IS NULL;

SELECT 'team_reference_without_usage' AS check_name,t.id FROM public.teams t LEFT JOIN public.media_asset_usages u ON u.entity_type='team' AND u.entity_id=t.id AND u.field_name='contact_image' AND u.media_asset_id=t.contact_image_media_asset_id WHERE t.contact_image_media_asset_id IS NOT NULL AND u.id IS NULL
UNION ALL SELECT 'season_reference_without_usage',ts.id FROM public.team_seasons ts LEFT JOIN public.media_asset_usages u ON u.entity_type='team_season' AND u.entity_id=ts.id AND u.field_name='contact_image' AND u.media_asset_id=ts.contact_image_media_asset_id WHERE ts.contact_image_media_asset_id IS NOT NULL AND u.id IS NULL;

SELECT 'team_usage_without_reference' AS check_name,u.entity_id FROM public.media_asset_usages u LEFT JOIN public.teams t ON t.id=u.entity_id AND t.contact_image_media_asset_id=u.media_asset_id WHERE u.entity_type='team' AND u.field_name='contact_image' AND t.id IS NULL
UNION ALL SELECT 'season_usage_without_reference',u.entity_id FROM public.media_asset_usages u LEFT JOIN public.team_seasons ts ON ts.id=u.entity_id AND ts.contact_image_media_asset_id=u.media_asset_id WHERE u.entity_type='team_season' AND u.field_name='contact_image' AND ts.id IS NULL;

-- Legacy inventory only; no backfill.
SELECT 'teams_nonempty_contact_image_url' AS metric,count(*) FROM public.teams WHERE NULLIF(btrim(contact_image_url),'') IS NOT NULL
UNION ALL SELECT 'team_seasons_nonempty_contact_image_url',count(*) FROM public.team_seasons WHERE NULLIF(btrim(contact_image_url),'') IS NOT NULL;
SELECT t.id AS team_id,ts.id AS team_season_id,t.contact_image_url FROM public.teams t JOIN public.team_seasons ts ON NULLIF(btrim(t.contact_image_url),'')=NULLIF(btrim(ts.contact_image_url),'') WHERE NULLIF(btrim(t.contact_image_url),'') IS NOT NULL;
