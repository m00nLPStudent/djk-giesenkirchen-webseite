-- B15 postcheck (READ ONLY): exactly one statement and one combined result set.
WITH
expected_permissions(role_key,permission_key,expected) AS MATERIALIZED (
 VALUES
 ('kassierer','settings.view',false),('kassierer','settings.edit',false),
 ('kassierer','contributions.view',true),('kassierer','contributions.create',true),('kassierer','contributions.edit',true),
 ('kassierer','contributions.record_payment',true),('kassierer','contributions.cancel_payment',true),('kassierer','contributions.defer',true),
 ('kassierer','contributions.exempt',true),('kassierer','contributions.cancel',true),('kassierer','contributions.export',true),
 ('vorstand','contributions.view',true),('vorstand','contributions.export',true),
 ('tischtennis-vorstand','news.view',true),('tischtennis-vorstand','news.create',true),('tischtennis-vorstand','news.edit',true),('tischtennis-vorstand','news.delete',true),('tischtennis-vorstand','news.publish',true),
 ('tischtennis-vorstand','events.view',true),('tischtennis-vorstand','events.create',true),('tischtennis-vorstand','events.edit',true),('tischtennis-vorstand','events.delete',true),('tischtennis-vorstand','events.publish',true)
),
actual AS MATERIALIZED (
 SELECT e.*, EXISTS(SELECT 1 FROM public.admin_roles r JOIN public.admin_role_permissions arp ON arp.role_id=r.id JOIN public.admin_permissions p ON p.id=arp.permission_id WHERE r.key=e.role_key AND p.key=e.permission_key) actual
 FROM expected_permissions e
),
blocks(result_block,result_order) AS MATERIALIZED (VALUES
 ('PC.01_PERMISSION_MATRIX',1),('PC.02_CONTRIBUTION_MANAGERS',2),('PC.03_DEPARTMENTS',3),('PC.04_SCOPE_COLUMNS',4),
 ('PC.05_SCOPE_CONSTRAINTS',5),('PC.06_SCOPE_INDEXES',6),('PC.07_POLICIES',7),('PC.08_DUPLICATES',8),('PC.09_INTEGRITY',9),('PC.10_OVERALL',10)
),
rows(result_block,result_order,sort_key,data) AS MATERIALIZED (
 SELECT 'PC.01_PERMISSION_MATRIX',1,role_key||':'||permission_key,jsonb_build_object('role_key',role_key,'permission_key',permission_key,'expected',expected,'actual',actual,'ok',expected=actual) FROM actual
 UNION ALL
 SELECT 'PC.02_CONTRIBUTION_MANAGERS',2,r.key,jsonb_build_object('role_key',r.key,'assigned_contribution_count',count(*),'permission_keys',jsonb_agg(p.key ORDER BY p.key))
 FROM public.admin_roles r JOIN public.admin_role_permissions arp ON arp.role_id=r.id JOIN public.admin_permissions p ON p.id=arp.permission_id WHERE p.key LIKE 'contributions.%' GROUP BY r.key
 UNION ALL
 SELECT 'PC.03_DEPARTMENTS',3,d.slug,jsonb_build_object('slug',d.slug,'id',d.id,'is_active',d.is_active) FROM public.departments d WHERE d.slug IN ('fussball','tischtennis')
 UNION ALL
 SELECT 'PC.04_SCOPE_COLUMNS',4,c.table_name,jsonb_build_object('table_name',c.table_name,'column_name',c.column_name,'data_type',c.data_type,'nullable',c.is_nullable) FROM information_schema.columns c WHERE c.table_schema='public' AND c.table_name IN ('news','events') AND c.column_name='department_id'
 UNION ALL
 SELECT 'PC.05_SCOPE_CONSTRAINTS',5,cl.relname||':'||con.conname,jsonb_build_object('table_name',cl.relname,'constraint_name',con.conname,'definition',pg_get_constraintdef(con.oid,true)) FROM pg_constraint con JOIN pg_class cl ON cl.oid=con.conrelid JOIN pg_namespace n ON n.oid=cl.relnamespace WHERE n.nspname='public' AND cl.relname IN ('news','events') AND con.conname IN ('news_department_id_fkey','events_department_id_fkey')
 UNION ALL
 SELECT 'PC.06_SCOPE_INDEXES',6,tablename||':'||indexname,jsonb_build_object('table_name',tablename,'index_name',indexname,'definition',indexdef) FROM pg_indexes WHERE schemaname='public' AND indexname IN ('news_department_id_idx','events_department_id_idx')
 UNION ALL
 SELECT 'PC.07_POLICIES',7,tablename||':'||policyname,jsonb_build_object('table_name',tablename,'policy_name',policyname,'command',cmd,'roles',roles,'using',qual,'with_check',with_check) FROM pg_policies WHERE schemaname='public' AND tablename IN ('news','news_documents','events') AND policyname IN ('events_authenticated_read','news_authenticated_read','news_insert_authorized','news_update_authorized','news_delete_authorized','news_documents_authenticated_read','news_documents_insert_authorized','news_documents_update_authorized','news_documents_delete_authorized')
 UNION ALL
 SELECT 'PC.08_DUPLICATES',8,r.key||':'||p.key,jsonb_build_object('role_key',r.key,'permission_key',p.key,'count',count(*)) FROM public.admin_role_permissions arp JOIN public.admin_roles r ON r.id=arp.role_id JOIN public.admin_permissions p ON p.id=arp.permission_id GROUP BY r.key,p.key HAVING count(*)>1
 UNION ALL
 SELECT 'PC.09_INTEGRITY',9,'scope_integrity',jsonb_build_object('news_orphan_department_count',(SELECT count(*) FROM public.news x LEFT JOIN public.departments d ON d.id=x.department_id WHERE x.department_id IS NOT NULL AND d.id IS NULL),'event_orphan_department_count',(SELECT count(*) FROM public.events x LEFT JOIN public.departments d ON d.id=x.department_id WHERE x.department_id IS NOT NULL AND d.id IS NULL),'team_linked_news_mismatch_count',(SELECT count(*) FROM public.news n JOIN public.teams t ON t.id=n.football_team_id WHERE n.department_id IS DISTINCT FROM t.department_id),'team_linked_event_mismatch_count',(SELECT count(*) FROM public.events e JOIN public.teams t ON t.id=e.team_id WHERE e.department_id IS DISTINCT FROM t.department_id))
 UNION ALL
 SELECT 'PC.10_OVERALL',10,'overall',jsonb_build_object('overall_ok',
   (SELECT bool_and(expected=actual) FROM actual)
   AND (SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND table_name IN ('news','events') AND column_name='department_id')=2
   AND (SELECT count(*) FROM pg_indexes WHERE schemaname='public' AND indexname IN ('news_department_id_idx','events_department_id_idx'))=2
   AND (SELECT count(*) FROM pg_constraint WHERE conrelid IN ('public.news'::regclass,'public.events'::regclass) AND conname IN ('news_department_id_fkey','events_department_id_fkey'))=2
   AND (SELECT count(*) FROM pg_policies WHERE schemaname='public' AND tablename IN ('news','news_documents','events') AND policyname IN ('events_authenticated_read','news_authenticated_read','news_insert_authorized','news_update_authorized','news_delete_authorized','news_documents_authenticated_read','news_documents_insert_authorized','news_documents_update_authorized','news_documents_delete_authorized') AND COALESCE(qual,'')||COALESCE(with_check,'') LIKE '%current_admin_permission_allows_department%')=9
   AND NOT EXISTS(SELECT 1 FROM public.admin_role_permissions GROUP BY role_id,permission_id HAVING count(*)>1)
   AND (SELECT count(*) FROM public.departments WHERE slug IN ('fussball','tischtennis') AND is_active)=2
   AND (SELECT count(*)=2 AND bool_and(role_key IN ('kassierer','superadmin')) FROM (SELECT r.key role_key FROM public.admin_roles r JOIN public.admin_role_permissions arp ON arp.role_id=r.id JOIN public.admin_permissions p ON p.id=arp.permission_id WHERE p.key LIKE 'contributions.%' GROUP BY r.key HAVING count(*)=9) managers)
   AND (SELECT COALESCE(array_agg(p.key ORDER BY p.key),'{}'::text[])=ARRAY['contributions.export','contributions.view']::text[] FROM public.admin_roles r JOIN public.admin_role_permissions arp ON arp.role_id=r.id JOIN public.admin_permissions p ON p.id=arp.permission_id WHERE r.key='vorstand' AND p.key LIKE 'contributions.%'),
   'full_contribution_manager_roles_ok',(
     SELECT count(*)=2 AND bool_and(role_key IN ('kassierer','superadmin')) FROM (
       SELECT r.key role_key FROM public.admin_roles r JOIN public.admin_role_permissions arp ON arp.role_id=r.id JOIN public.admin_permissions p ON p.id=arp.permission_id
       WHERE p.key LIKE 'contributions.%' GROUP BY r.key HAVING count(*)=9
     ) managers),
   'vorstand_contribution_contract_ok',(
     SELECT COALESCE(array_agg(p.key ORDER BY p.key),'{}'::text[])=ARRAY['contributions.export','contributions.view']::text[]
     FROM public.admin_roles r JOIN public.admin_role_permissions arp ON arp.role_id=r.id JOIN public.admin_permissions p ON p.id=arp.permission_id WHERE r.key='vorstand' AND p.key LIKE 'contributions.%'),
   'read_only',true)
),
numbered AS MATERIALIZED (SELECT result_block,result_order,row_number() OVER(PARTITION BY result_block ORDER BY sort_key)::bigint row_order,'data'::text row_type,data FROM rows),
combined AS (
 SELECT * FROM numbered
 UNION ALL
 SELECT b.result_block,b.result_order,1::bigint,'empty'::text,jsonb_build_object('empty',true) FROM blocks b WHERE NOT EXISTS(SELECT 1 FROM numbered n WHERE n.result_block=b.result_block)
)
SELECT result_block,result_order,row_order,row_type,data FROM combined ORDER BY result_order,row_order;
