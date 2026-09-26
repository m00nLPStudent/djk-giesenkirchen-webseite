-- B15 results module post-check (READ ONLY).
-- Run once with "No limit"; exports one ordered resultset including empty-block markers.
WITH
-- RMPC.01_CLUB_RESULTS_COLUMNS
block_01_source AS MATERIALIZED (
SELECT column_row.ordinal_position,column_row.column_name,column_row.data_type,column_row.udt_name,
  column_row.is_nullable,column_row.column_default,column_row.is_identity,column_row.is_generated
FROM information_schema.columns column_row
WHERE column_row.table_schema='public' AND column_row.table_name='club_results'
),
block_01_rows AS MATERIALIZED (
  SELECT 'RMPC.01_CLUB_RESULTS_COLUMNS'::text AS result_block,1::integer AS result_order,
    row_number() OVER(ORDER BY source_row.ordinal_position)::bigint AS row_order,'data'::text AS row_type,to_jsonb(source_row) AS data
  FROM block_01_source source_row
),
block_01_export AS MATERIALIZED (
  SELECT * FROM block_01_rows
  UNION ALL SELECT 'RMPC.01_CLUB_RESULTS_COLUMNS',1,1::bigint,'empty',jsonb_build_object('message','block executed successfully; no rows returned')
  WHERE NOT EXISTS(SELECT 1 FROM block_01_rows)
),

-- RMPC.02_CLUB_RESULTS_CONSTRAINTS
block_02_source AS MATERIALIZED (
SELECT constraint_row.conname AS constraint_name,constraint_row.contype AS constraint_type,
  pg_get_constraintdef(constraint_row.oid,true) AS definition,constraint_row.convalidated AS is_validated
FROM pg_constraint constraint_row
WHERE constraint_row.conrelid='public.club_results'::regclass
),
block_02_rows AS MATERIALIZED (
  SELECT 'RMPC.02_CLUB_RESULTS_CONSTRAINTS'::text AS result_block,2::integer AS result_order,
    row_number() OVER(ORDER BY source_row.constraint_type,source_row.constraint_name)::bigint AS row_order,'data'::text AS row_type,to_jsonb(source_row) AS data
  FROM block_02_source source_row
),
block_02_export AS MATERIALIZED (
  SELECT * FROM block_02_rows
  UNION ALL SELECT 'RMPC.02_CLUB_RESULTS_CONSTRAINTS',2,1::bigint,'empty',jsonb_build_object('message','block executed successfully; no rows returned')
  WHERE NOT EXISTS(SELECT 1 FROM block_02_rows)
),

-- RMPC.03_CLUB_RESULTS_INDEXES
block_03_source AS MATERIALIZED (
SELECT index_row.indexname AS index_name,index_row.indexdef AS definition
FROM pg_indexes index_row WHERE index_row.schemaname='public' AND index_row.tablename='club_results'
),
block_03_rows AS MATERIALIZED (
  SELECT 'RMPC.03_CLUB_RESULTS_INDEXES'::text AS result_block,3::integer AS result_order,
    row_number() OVER(ORDER BY source_row.index_name)::bigint AS row_order,'data'::text AS row_type,to_jsonb(source_row) AS data
  FROM block_03_source source_row
),
block_03_export AS MATERIALIZED (
  SELECT * FROM block_03_rows
  UNION ALL SELECT 'RMPC.03_CLUB_RESULTS_INDEXES',3,1::bigint,'empty',jsonb_build_object('message','block executed successfully; no rows returned')
  WHERE NOT EXISTS(SELECT 1 FROM block_03_rows)
),

-- RMPC.04_CLUB_RESULTS_TRIGGERS
block_04_source AS MATERIALIZED (
SELECT trigger_row.tgname AS trigger_name,trigger_row.tgenabled,
  procedure_row.oid::regprocedure::text AS function_signature,pg_get_triggerdef(trigger_row.oid,true) AS definition
FROM pg_trigger trigger_row JOIN pg_proc procedure_row ON procedure_row.oid=trigger_row.tgfoid
WHERE trigger_row.tgrelid='public.club_results'::regclass AND NOT trigger_row.tgisinternal
),
block_04_rows AS MATERIALIZED (
  SELECT 'RMPC.04_CLUB_RESULTS_TRIGGERS'::text AS result_block,4::integer AS result_order,
    row_number() OVER(ORDER BY source_row.trigger_name)::bigint AS row_order,'data'::text AS row_type,to_jsonb(source_row) AS data
  FROM block_04_source source_row
),
block_04_export AS MATERIALIZED (
  SELECT * FROM block_04_rows
  UNION ALL SELECT 'RMPC.04_CLUB_RESULTS_TRIGGERS',4,1::bigint,'empty',jsonb_build_object('message','block executed successfully; no rows returned')
  WHERE NOT EXISTS(SELECT 1 FROM block_04_rows)
),

-- RMPC.05_RESULTS_ROUTINES_AND_ACL
block_05_source AS MATERIALIZED (
WITH eligible AS MATERIALIZED (
  SELECT procedure_row.oid,procedure_row.proowner,procedure_row.proacl,procedure_row.prosecdef,procedure_row.proconfig
  FROM pg_proc procedure_row JOIN pg_namespace namespace ON namespace.oid=procedure_row.pronamespace
  WHERE namespace.nspname='public' AND procedure_row.prokind IN('f','p')
    AND procedure_row.proname IN('normalize_club_result','cleanup_club_result_media_usage','synchronize_media_assignment')
), public_acl AS MATERIALIZED (
  SELECT routine.oid,coalesce(bool_or(acl.grantee=0 AND acl.privilege_type='EXECUTE'),false) AS public_execute
  FROM eligible routine LEFT JOIN LATERAL aclexplode(coalesce(routine.proacl,acldefault('f',routine.proowner))) acl ON true GROUP BY routine.oid
)
SELECT routine.oid::regprocedure::text AS function_signature,routine.prosecdef AS security_definer,
  routine.proconfig,pg_get_userbyid(routine.proowner) AS owner,acl.public_execute,
  has_function_privilege('anon',routine.oid,'EXECUTE') AS anon_execute,
  has_function_privilege('authenticated',routine.oid,'EXECUTE') AS authenticated_execute,
  has_function_privilege('service_role',routine.oid,'EXECUTE') AS service_role_execute,
  pg_get_functiondef(routine.oid) AS definition
FROM eligible routine JOIN public_acl acl ON acl.oid=routine.oid
),
block_05_rows AS MATERIALIZED (
  SELECT 'RMPC.05_RESULTS_ROUTINES_AND_ACL'::text AS result_block,5::integer AS result_order,
    row_number() OVER(ORDER BY source_row.function_signature)::bigint AS row_order,'data'::text AS row_type,to_jsonb(source_row) AS data
  FROM block_05_source source_row
),
block_05_export AS MATERIALIZED (
  SELECT * FROM block_05_rows
  UNION ALL SELECT 'RMPC.05_RESULTS_ROUTINES_AND_ACL',5,1::bigint,'empty',jsonb_build_object('message','block executed successfully; no rows returned')
  WHERE NOT EXISTS(SELECT 1 FROM block_05_rows)
),

-- RMPC.06_CLUB_RESULTS_RLS_POLICIES
block_06_source AS MATERIALIZED (
SELECT class.relrowsecurity AS rls_enabled,class.relforcerowsecurity AS force_rls,
  policy.policyname AS policy_name,policy.permissive,policy.roles,policy.cmd,
  policy.qual AS using_expression,policy.with_check AS with_check_expression
FROM pg_class class JOIN pg_namespace namespace ON namespace.oid=class.relnamespace
LEFT JOIN pg_policies policy ON policy.schemaname=namespace.nspname AND policy.tablename=class.relname
WHERE namespace.nspname='public' AND class.relname='club_results'
),
block_06_rows AS MATERIALIZED (
  SELECT 'RMPC.06_CLUB_RESULTS_RLS_POLICIES'::text AS result_block,6::integer AS result_order,
    row_number() OVER(ORDER BY source_row.policy_name)::bigint AS row_order,'data'::text AS row_type,to_jsonb(source_row) AS data
  FROM block_06_source source_row
),
block_06_export AS MATERIALIZED (
  SELECT * FROM block_06_rows
  UNION ALL SELECT 'RMPC.06_CLUB_RESULTS_RLS_POLICIES',6,1::bigint,'empty',jsonb_build_object('message','block executed successfully; no rows returned')
  WHERE NOT EXISTS(SELECT 1 FROM block_06_rows)
),

-- RMPC.07_CLUB_RESULTS_GRANTS
block_07_source AS MATERIALIZED (
SELECT 'table'::text AS grant_scope,grant_row.grantee,NULL::text AS column_name,grant_row.privilege_type,grant_row.is_grantable
FROM information_schema.role_table_grants grant_row WHERE grant_row.table_schema='public' AND grant_row.table_name='club_results'
  AND grant_row.grantee IN('anon','authenticated','service_role')
UNION ALL
SELECT 'column',grant_row.grantee,grant_row.column_name,grant_row.privilege_type,grant_row.is_grantable
FROM information_schema.role_column_grants grant_row WHERE grant_row.table_schema='public' AND grant_row.table_name='club_results'
  AND grant_row.grantee IN('anon','authenticated','service_role')
),
block_07_rows AS MATERIALIZED (
  SELECT 'RMPC.07_CLUB_RESULTS_GRANTS'::text AS result_block,7::integer AS result_order,
    row_number() OVER(ORDER BY source_row.grant_scope,source_row.grantee,source_row.column_name NULLS FIRST,source_row.privilege_type)::bigint AS row_order,'data'::text AS row_type,to_jsonb(source_row) AS data
  FROM block_07_source source_row
),
block_07_export AS MATERIALIZED (
  SELECT * FROM block_07_rows
  UNION ALL SELECT 'RMPC.07_CLUB_RESULTS_GRANTS',7,1::bigint,'empty',jsonb_build_object('message','block executed successfully; no rows returned')
  WHERE NOT EXISTS(SELECT 1 FROM block_07_rows)
),

-- RMPC.08_PUBLIC_READ_CONTRACT
block_08_source AS MATERIALIZED (
SELECT policy.policyname AS policy_name,policy.roles,policy.cmd,policy.qual,
  policy.qual ILIKE '%is_published%' AS checks_published,
  policy.qual ILIKE '%played_at%' AND policy.qual ILIKE '%7 days%' AS checks_default_window,
  policy.qual ILIKE '%visible_from%' AND policy.qual ILIKE '%visible_until%' AS checks_override_window,
  policy.qual ILIKE '%team_seasons%' AND policy.qual ILIKE '%departments%' AS checks_team_department,
  policy.qual ILIKE '%fussball%' AND policy.qual ILIKE '%tischtennis%' AS checks_allowed_sports
FROM pg_policies policy WHERE policy.schemaname='public' AND policy.tablename='club_results'
),
block_08_rows AS MATERIALIZED (
  SELECT 'RMPC.08_PUBLIC_READ_CONTRACT'::text AS result_block,8::integer AS result_order,
    row_number() OVER(ORDER BY source_row.policy_name)::bigint AS row_order,'data'::text AS row_type,to_jsonb(source_row) AS data
  FROM block_08_source source_row
),
block_08_export AS MATERIALIZED (
  SELECT * FROM block_08_rows
  UNION ALL SELECT 'RMPC.08_PUBLIC_READ_CONTRACT',8,1::bigint,'empty',jsonb_build_object('message','block executed successfully; no rows returned')
  WHERE NOT EXISTS(SELECT 1 FROM block_08_rows)
),

-- RMPC.09_MEDIA_CONSTRAINTS
block_09_source AS MATERIALIZED (
SELECT class.relname AS table_name,constraint_row.conname AS constraint_name,
  pg_get_constraintdef(constraint_row.oid,true) AS definition
FROM pg_constraint constraint_row JOIN pg_class class ON class.oid=constraint_row.conrelid
WHERE constraint_row.conname IN('media_assets_purpose_check','media_assets_storage_path_check','media_asset_usages_entity_type_check')
),
block_09_rows AS MATERIALIZED (
  SELECT 'RMPC.09_MEDIA_CONSTRAINTS'::text AS result_block,9::integer AS result_order,
    row_number() OVER(ORDER BY source_row.table_name,source_row.constraint_name)::bigint AS row_order,'data'::text AS row_type,to_jsonb(source_row) AS data
  FROM block_09_source source_row
),
block_09_export AS MATERIALIZED (
  SELECT * FROM block_09_rows
  UNION ALL SELECT 'RMPC.09_MEDIA_CONSTRAINTS',9,1::bigint,'empty',jsonb_build_object('message','block executed successfully; no rows returned')
  WHERE NOT EXISTS(SELECT 1 FROM block_09_rows)
),

-- RMPC.10_MEDIA_RESULT_CONTRACT
block_10_source AS MATERIALIZED (
SELECT 'purpose_result_allowed'::text AS check_name,
  pg_get_constraintdef(oid,true) ILIKE '%result%' AS passed
FROM pg_constraint WHERE conrelid='public.media_assets'::regclass AND conname='media_assets_purpose_check'
UNION ALL SELECT 'storage_result_allowed',pg_get_constraintdef(oid,true) ILIKE '%result%'
FROM pg_constraint WHERE conrelid='public.media_assets'::regclass AND conname='media_assets_storage_path_check'
UNION ALL SELECT 'usage_result_allowed',pg_get_constraintdef(oid,true) ILIKE '%result%'
FROM pg_constraint WHERE conrelid='public.media_asset_usages'::regclass AND conname='media_asset_usages_entity_type_check'
UNION ALL SELECT 'sync_result_opponent_logo',
  pg_get_functiondef('public.synchronize_media_assignment(text,uuid,uuid,text)'::regprocedure) ILIKE ALL(ARRAY['%club_results%','%opponent_logo%','%purpose%result%'])
UNION ALL SELECT 'cleanup_result_usage',
  pg_get_functiondef('public.cleanup_club_result_media_usage()'::regprocedure) ILIKE ALL(ARRAY['%media_asset_usages%','%opponent_logo%'])
),
block_10_rows AS MATERIALIZED (
  SELECT 'RMPC.10_MEDIA_RESULT_CONTRACT'::text AS result_block,10::integer AS result_order,
    row_number() OVER(ORDER BY source_row.check_name)::bigint AS row_order,'data'::text AS row_type,to_jsonb(source_row) AS data
  FROM block_10_source source_row
),
block_10_export AS MATERIALIZED (
  SELECT * FROM block_10_rows
  UNION ALL SELECT 'RMPC.10_MEDIA_RESULT_CONTRACT',10,1::bigint,'empty',jsonb_build_object('message','block executed successfully; no rows returned')
  WHERE NOT EXISTS(SELECT 1 FROM block_10_rows)
),

-- RMPC.11_RESULTS_PERMISSIONS
block_11_source AS MATERIALIZED (
SELECT permission_row.id AS permission_id,permission_row.key AS permission_key,permission_row.name,
  permission_row.description,permission_row.category
FROM public.admin_permissions permission_row WHERE permission_row.key LIKE 'results.%'
),
block_11_rows AS MATERIALIZED (
  SELECT 'RMPC.11_RESULTS_PERMISSIONS'::text AS result_block,11::integer AS result_order,
    row_number() OVER(ORDER BY source_row.permission_key)::bigint AS row_order,'data'::text AS row_type,to_jsonb(source_row) AS data
  FROM block_11_source source_row
),
block_11_export AS MATERIALIZED (
  SELECT * FROM block_11_rows
  UNION ALL SELECT 'RMPC.11_RESULTS_PERMISSIONS',11,1::bigint,'empty',jsonb_build_object('message','block executed successfully; no rows returned')
  WHERE NOT EXISTS(SELECT 1 FROM block_11_rows)
),

-- RMPC.12_RESULTS_ROLE_MAPPINGS
block_12_source AS MATERIALIZED (
SELECT role_row.key AS role_key,role_row.name AS role_name,role_row.is_active,
  permission_row.key AS permission_key
FROM public.admin_role_permissions link JOIN public.admin_roles role_row ON role_row.id=link.role_id
JOIN public.admin_permissions permission_row ON permission_row.id=link.permission_id
WHERE permission_row.key LIKE 'results.%'
),
block_12_rows AS MATERIALIZED (
  SELECT 'RMPC.12_RESULTS_ROLE_MAPPINGS'::text AS result_block,12::integer AS result_order,
    row_number() OVER(ORDER BY source_row.role_key,source_row.permission_key)::bigint AS row_order,'data'::text AS row_type,to_jsonb(source_row) AS data
  FROM block_12_source source_row
),
block_12_export AS MATERIALIZED (
  SELECT * FROM block_12_rows
  UNION ALL SELECT 'RMPC.12_RESULTS_ROLE_MAPPINGS',12,1::bigint,'empty',jsonb_build_object('message','block executed successfully; no rows returned')
  WHERE NOT EXISTS(SELECT 1 FROM block_12_rows)
),

-- RMPC.13_PERMISSION_ISOLATION
block_13_source AS MATERIALIZED (
SELECT 'unexpected_results_permission'::text AS check_name,count(*)::bigint AS violation_count
FROM public.admin_permissions WHERE key LIKE 'results.%' AND key NOT IN('results.view','results.create','results.edit','results.delete','results.publish')
UNION ALL SELECT 'unexpected_technical_role_mapping',count(*)
FROM public.admin_role_permissions link JOIN public.admin_roles role_row ON role_row.id=link.role_id
JOIN public.admin_permissions permission_row ON permission_row.id=link.permission_id
WHERE permission_row.key LIKE 'results.%' AND role_row.key NOT IN('superadmin','webmaster','fussball-vorstand','tischtennis-vorstand')
UNION ALL SELECT 'board_webmaster_fk_target_violation',count(*)
FROM pg_constraint constraint_row
WHERE constraint_row.conrelid='public.admin_role_permissions'::regclass
  AND constraint_row.contype='f'
  AND constraint_row.confrelid='public.board_roles'::regclass
),
block_13_rows AS MATERIALIZED (
  SELECT 'RMPC.13_PERMISSION_ISOLATION'::text AS result_block,13::integer AS result_order,
    row_number() OVER(ORDER BY source_row.check_name)::bigint AS row_order,'data'::text AS row_type,to_jsonb(source_row) AS data
  FROM block_13_source source_row
),
block_13_export AS MATERIALIZED (
  SELECT * FROM block_13_rows
  UNION ALL SELECT 'RMPC.13_PERMISSION_ISOLATION',13,1::bigint,'empty',jsonb_build_object('message','block executed successfully; no rows returned')
  WHERE NOT EXISTS(SELECT 1 FROM block_13_rows)
),

-- RMPC.14_FOUNDATION_INVARIANTS
block_14_source AS MATERIALIZED (
SELECT 'active_fussball_team_seasons'::text AS metric,count(*)::bigint AS value
FROM public.team_seasons ts JOIN public.teams t ON t.id=ts.team_id JOIN public.seasons s ON s.id=ts.season_id JOIN public.departments d ON d.id=t.department_id
WHERE d.slug='fussball' AND d.is_active AND t.is_active AND ts.is_active AND s.is_active
UNION ALL SELECT 'active_tischtennis_team_seasons',count(*)
FROM public.team_seasons ts JOIN public.teams t ON t.id=ts.team_id JOIN public.seasons s ON s.id=ts.season_id JOIN public.departments d ON d.id=t.department_id
WHERE d.slug='tischtennis' AND d.is_active AND t.is_active AND ts.is_active AND s.is_active
UNION ALL SELECT 'target_departments',count(*) FROM public.departments WHERE slug IN('fussball','tischtennis') AND is_active
UNION ALL SELECT 'target_admin_roles',count(*) FROM public.admin_roles WHERE key IN('superadmin','webmaster','fussball-vorstand','tischtennis-vorstand') AND is_active
UNION ALL SELECT 'club_results_rows',count(*) FROM public.club_results
UNION ALL SELECT 'result_media_assets',count(*) FROM public.media_assets WHERE purpose='result'
UNION ALL SELECT 'result_media_usages',count(*) FROM public.media_asset_usages WHERE entity_type='result' OR field_name='opponent_logo'
),
block_14_rows AS MATERIALIZED (
  SELECT 'RMPC.14_FOUNDATION_INVARIANTS'::text AS result_block,14::integer AS result_order,
    row_number() OVER(ORDER BY source_row.metric)::bigint AS row_order,'data'::text AS row_type,to_jsonb(source_row) AS data
  FROM block_14_source source_row
),
block_14_export AS MATERIALIZED (
  SELECT * FROM block_14_rows
  UNION ALL SELECT 'RMPC.14_FOUNDATION_INVARIANTS',14,1::bigint,'empty',jsonb_build_object('message','block executed successfully; no rows returned')
  WHERE NOT EXISTS(SELECT 1 FROM block_14_rows)
),

-- RMPC.15_RESULT_RELATION_INVENTORY
block_15_source AS MATERIALIZED (
SELECT namespace.nspname AS schema_name,class.relname AS relation_name,class.relkind,
  pg_get_userbyid(class.relowner) AS owner
FROM pg_class class JOIN pg_namespace namespace ON namespace.oid=class.relnamespace
WHERE class.relkind IN('r','p','v','m','f') AND namespace.nspname NOT IN('pg_catalog','information_schema')
  AND class.relname ~* '(result|match|score|fixture|game)'
),
block_15_rows AS MATERIALIZED (
  SELECT 'RMPC.15_RESULT_RELATION_INVENTORY'::text AS result_block,15::integer AS result_order,
    row_number() OVER(ORDER BY source_row.schema_name,source_row.relation_name)::bigint AS row_order,'data'::text AS row_type,to_jsonb(source_row) AS data
  FROM block_15_source source_row
),
block_15_export AS MATERIALIZED (
  SELECT * FROM block_15_rows
  UNION ALL SELECT 'RMPC.15_RESULT_RELATION_INVENTORY',15,1::bigint,'empty',jsonb_build_object('message','block executed successfully; no rows returned')
  WHERE NOT EXISTS(SELECT 1 FROM block_15_rows)
),

-- RMPC.16_CLOSURE
block_16_source AS MATERIALIZED (
WITH checks AS MATERIALIZED (
SELECT
  to_regclass('public.club_results') IS NOT NULL AS club_results_contract_ok,
  (SELECT count(*)=17 FROM information_schema.columns WHERE table_schema='public' AND table_name='club_results') AS columns_ok,
  (SELECT count(*)=4 FROM pg_constraint WHERE conrelid='public.club_results'::regclass AND contype='f') AS foreign_keys_ok,
  (SELECT count(*)=7 AND bool_and(convalidated) FROM pg_constraint WHERE conrelid='public.club_results'::regclass AND contype='c') AS constraints_ok,
  (SELECT count(*)=4 FROM pg_indexes WHERE schemaname='public' AND tablename='club_results' AND indexname<>'club_results_pkey') AS indexes_ok,
  (SELECT count(*)=3 FROM pg_trigger WHERE tgrelid='public.club_results'::regclass AND NOT tgisinternal) AS triggers_ok,
  (SELECT relrowsecurity AND NOT relforcerowsecurity FROM pg_class WHERE oid='public.club_results'::regclass) AS rls_ok,
  (SELECT count(*)=1 AND bool_and(cmd='SELECT' AND roles @> ARRAY['anon','authenticated']::name[]) FROM pg_policies WHERE schemaname='public' AND tablename='club_results') AS policies_ok,
  (NOT has_table_privilege('anon','public.club_results','INSERT,UPDATE,DELETE')
   AND NOT has_table_privilege('authenticated','public.club_results','INSERT,UPDATE,DELETE')
   AND has_table_privilege('service_role','public.club_results','SELECT,INSERT,UPDATE,DELETE')) AS grants_ok,
  ((SELECT count(*) FROM public.admin_permissions WHERE key LIKE 'results.%')=5
   AND NOT EXISTS(SELECT 1 FROM public.admin_permissions WHERE key LIKE 'results.%'
     AND key NOT IN('results.view','results.create','results.edit','results.delete','results.publish'))) AS permissions_ok,
  (NOT EXISTS(SELECT 1 FROM public.admin_role_permissions link JOIN public.admin_permissions p ON p.id=link.permission_id
     JOIN public.admin_roles r ON r.id=link.role_id WHERE p.key LIKE 'results.%'
       AND r.key NOT IN('superadmin','webmaster','fussball-vorstand','tischtennis-vorstand'))
   AND (SELECT count(*) FROM (
     SELECT r.key FROM public.admin_role_permissions link JOIN public.admin_permissions p ON p.id=link.permission_id
     JOIN public.admin_roles r ON r.id=link.role_id WHERE p.key LIKE 'results.%'
     GROUP BY r.key HAVING count(*)=5
   ) complete_roles)=4) AS role_mappings_ok,
  (NOT EXISTS(
    SELECT 1
    FROM pg_constraint constraint_row
    WHERE constraint_row.conrelid='public.admin_role_permissions'::regclass
      AND constraint_row.contype='f'
      AND constraint_row.confrelid='public.board_roles'::regclass
  )) AS board_role_isolation_ok,
  (pg_get_constraintdef((SELECT oid FROM pg_constraint WHERE conrelid='public.media_assets'::regclass AND conname='media_assets_purpose_check'),true) ILIKE '%result%'
   AND pg_get_constraintdef((SELECT oid FROM pg_constraint WHERE conrelid='public.media_assets'::regclass AND conname='media_assets_storage_path_check'),true) ILIKE '%result%'
   AND pg_get_constraintdef((SELECT oid FROM pg_constraint WHERE conrelid='public.media_asset_usages'::regclass AND conname='media_asset_usages_entity_type_check'),true) ILIKE '%result%'
   AND pg_get_functiondef('public.synchronize_media_assignment(text,uuid,uuid,text)'::regprocedure) ILIKE ALL(ARRAY['%club_results%','%opponent_logo%'])) AS media_contract_ok,
  ((SELECT count(*) FROM public.departments WHERE slug IN('fussball','tischtennis') AND is_active)=2
   AND (SELECT count(*) FROM public.team_seasons ts JOIN public.teams t ON t.id=ts.team_id JOIN public.seasons s ON s.id=ts.season_id
    JOIN public.departments d ON d.id=t.department_id WHERE d.slug='fussball' AND d.is_active AND t.is_active AND ts.is_active AND s.is_active)=15
   AND (SELECT count(*) FROM public.team_seasons ts JOIN public.teams t ON t.id=ts.team_id JOIN public.seasons s ON s.id=ts.season_id
    JOIN public.departments d ON d.id=t.department_id WHERE d.slug='tischtennis' AND d.is_active AND t.is_active AND ts.is_active AND s.is_active)=3
   AND (SELECT count(*) FROM public.club_results)=0
   AND (SELECT count(*) FROM public.media_assets WHERE purpose='result')=0
   AND (SELECT count(*) FROM public.media_asset_usages WHERE entity_type='result' OR field_name='opponent_logo')=0) AS existing_data_unchanged
)
SELECT 1 AS result_order,checks.*,
  (club_results_contract_ok AND columns_ok AND foreign_keys_ok AND constraints_ok AND indexes_ok AND triggers_ok
   AND rls_ok AND policies_ok AND grants_ok AND permissions_ok AND role_mappings_ok AND board_role_isolation_ok
   AND media_contract_ok AND existing_data_unchanged) AS overall_ok
FROM checks
),
block_16_rows AS MATERIALIZED (
  SELECT 'RMPC.16_CLOSURE'::text AS result_block,16::integer AS result_order,
    row_number() OVER(ORDER BY source_row.result_order)::bigint AS row_order,'data'::text AS row_type,to_jsonb(source_row) AS data
  FROM block_16_source source_row
),
block_16_export AS MATERIALIZED (
  SELECT * FROM block_16_rows
  UNION ALL SELECT 'RMPC.16_CLOSURE',16,1::bigint,'empty',jsonb_build_object('message','block executed successfully; no rows returned')
  WHERE NOT EXISTS(SELECT 1 FROM block_16_rows)
),
all_results AS MATERIALIZED (
  SELECT * FROM block_01_export
  UNION ALL
  SELECT * FROM block_02_export
  UNION ALL
  SELECT * FROM block_03_export
  UNION ALL
  SELECT * FROM block_04_export
  UNION ALL
  SELECT * FROM block_05_export
  UNION ALL
  SELECT * FROM block_06_export
  UNION ALL
  SELECT * FROM block_07_export
  UNION ALL
  SELECT * FROM block_08_export
  UNION ALL
  SELECT * FROM block_09_export
  UNION ALL
  SELECT * FROM block_10_export
  UNION ALL
  SELECT * FROM block_11_export
  UNION ALL
  SELECT * FROM block_12_export
  UNION ALL
  SELECT * FROM block_13_export
  UNION ALL
  SELECT * FROM block_14_export
  UNION ALL
  SELECT * FROM block_15_export
  UNION ALL
  SELECT * FROM block_16_export
)
SELECT result_block,result_order,row_order,row_type,data
FROM all_results
ORDER BY result_order ASC,row_order ASC;
