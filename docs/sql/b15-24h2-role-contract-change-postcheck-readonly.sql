-- B15.24H2 - Role contract change postcheck (READ ONLY)
-- Run manually only after the proposal completed successfully.

-- RC.01 BOARD TARGET MATRIX AND ACTIVE ROLES
WITH expected(role_key,permission_key,expected_value) AS MATERIALIZED (VALUES
 ('superadmin','board.view',true),('superadmin','board.create',true),('superadmin','board.edit',true),('superadmin','board.delete',true),
 ('vorstand','board.view',true),('vorstand','board.create',true),('vorstand','board.edit',true),('vorstand','board.delete',true),
 ('fussball-vorstand','board.view',true),('fussball-vorstand','board.create',false),('fussball-vorstand','board.edit',true),('fussball-vorstand','board.delete',false),
 ('tischtennis-vorstand','board.view',true),('tischtennis-vorstand','board.create',false),('tischtennis-vorstand','board.edit',true),('tischtennis-vorstand','board.delete',false),
 ('kassierer','board.view',false),('kassierer','board.create',false),('kassierer','board.edit',false),('kassierer','board.delete',false),
 ('webmaster','board.view',false),('webmaster','board.create',false),('webmaster','board.edit',false),('webmaster','board.delete',false)
), evaluated AS MATERIALIZED (
 SELECT expected.*,
  EXISTS(SELECT 1 FROM public.admin_roles r WHERE r.key=expected.role_key) AS role_exists,
  COALESCE((SELECT bool_and(r.is_active) FROM public.admin_roles r WHERE r.key=expected.role_key),false) AS role_active,
  EXISTS(SELECT 1 FROM public.admin_roles r JOIN public.admin_role_permissions rp ON rp.role_id=r.id
   JOIN public.admin_permissions p ON p.id=rp.permission_id WHERE r.key=expected.role_key AND p.key=expected.permission_key) AS live_value
 FROM expected
)
SELECT 'RC.01_BOARD_TARGET_MATRIX' AS section, *, role_exists AND role_active AND live_value=expected_value AS matches
FROM evaluated ORDER BY role_key,permission_key;

-- RC.02 COMPLETE SYSTEM TARGET MATRIX
WITH roles(role_key) AS MATERIALIZED (VALUES ('superadmin'),('vorstand'),('fussball-vorstand'),('tischtennis-vorstand'),('kassierer'),('webmaster')),
permissions(permission_key) AS MATERIALIZED (VALUES ('users.view'),('users.create'),('users.edit'),('users.delete'),('roles.view'),('roles.edit'),('permissions.view'),('permissions.edit'),('system.view')),
evaluated AS MATERIALIZED (
 SELECT roles.role_key,permissions.permission_key,roles.role_key='superadmin' AS expected_value,
  EXISTS(SELECT 1 FROM public.admin_roles r JOIN public.admin_role_permissions rp ON rp.role_id=r.id
   JOIN public.admin_permissions p ON p.id=rp.permission_id WHERE r.key=roles.role_key AND p.key=permissions.permission_key) AS live_value
 FROM roles CROSS JOIN permissions
)
SELECT 'RC.02_SYSTEM_TARGET_MATRIX' AS section,*,live_value=expected_value AS matches FROM evaluated ORDER BY role_key,permission_key;

-- RC.03 CONTRIBUTION CONTRACT (UNCHANGED)
WITH permissions(permission_key) AS MATERIALIZED (VALUES ('contributions.view'),('contributions.export'),('contributions.create'),('contributions.edit'),('contributions.record_payment'),('contributions.cancel_payment'),('contributions.defer'),('contributions.exempt'),('contributions.cancel')),
roles(role_key) AS MATERIALIZED (VALUES ('superadmin'),('kassierer'),('vorstand'),('fussball-vorstand'),('tischtennis-vorstand'),('webmaster')),
evaluated AS MATERIALIZED (
 SELECT roles.role_key,permissions.permission_key,
  EXISTS(SELECT 1 FROM public.admin_roles r JOIN public.admin_role_permissions rp ON rp.role_id=r.id JOIN public.admin_permissions p ON p.id=rp.permission_id WHERE r.key=roles.role_key AND p.key=permissions.permission_key) AS live_value,
  CASE WHEN roles.role_key IN ('superadmin','kassierer') THEN true WHEN roles.role_key='vorstand' AND permissions.permission_key IN ('contributions.view','contributions.export') THEN true ELSE false END AS expected_value
 FROM roles CROSS JOIN permissions
)
SELECT 'RC.03_CONTRIBUTION_CONTRACT' AS section,*,live_value=expected_value AS matches FROM evaluated ORDER BY role_key,permission_key;

-- RC.04 BOARD RLS, OWNER AND TABLE ACL
SELECT 'RC.04_BOARD_RLS' AS section,c.relrowsecurity AS rls_enabled,c.relforcerowsecurity AS force_rls,
 pg_catalog.pg_get_userbyid(c.relowner) AS owner,c.relacl AS table_acl
FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relname='board_members';

-- RC.05 COMPLETE BOARD POLICY INVENTORY
SELECT 'RC.05_BOARD_POLICIES' AS section,policyname,cmd,permissive,roles,qual AS using_expression,with_check AS with_check_expression
FROM pg_catalog.pg_policies WHERE schemaname='public' AND tablename='board_members' ORDER BY cmd,policyname;

-- RC.06 STRICT ADMINISTRATIVE POLICY CONTRACT
WITH normalized AS MATERIALIZED (
 SELECT policyname,cmd,permissive,roles,
  replace(regexp_replace(lower(COALESCE(qual,'')),'[[:space:]()]|::text','','g'),'public.','') AS using_norm,
  replace(regexp_replace(lower(COALESCE(with_check,'')),'[[:space:]()]|::text','','g'),'public.','') AS check_norm
 FROM pg_catalog.pg_policies WHERE schemaname='public' AND tablename='board_members'
), expected(policy_name,command_name,expected_using,expected_check) AS MATERIALIZED (VALUES
 ('board_members_admin_read','SELECT','current_admin_board_access''view'',organization_scope,admin_profile_id',''),
 ('board_members_insert_department_permission','INSERT','','current_admin_board_access''create'',organization_scope,admin_profile_id'),
 ('board_members_update_department_permission','UPDATE','current_admin_board_access''edit'',organization_scope,admin_profile_id','current_admin_board_access''edit'',organization_scope,admin_profile_id'),
 ('board_members_delete_department_permission','DELETE','current_admin_board_access''delete'',organization_scope,admin_profile_id','')
)
SELECT 'RC.06_STRICT_ADMIN_POLICY_CONTRACT' AS section,expected.*,
 policy.policyname IS NOT NULL AS exists,policy.permissive='PERMISSIVE' AS permissive_ok,
 policy.roles=ARRAY['authenticated']::name[] AS roles_ok,policy.using_norm=expected.expected_using AS using_ok,
 policy.check_norm=expected.expected_check AS check_ok,
 policy.policyname IS NOT NULL AND policy.permissive='PERMISSIVE' AND policy.roles=ARRAY['authenticated']::name[]
  AND policy.using_norm=expected.expected_using AND policy.check_norm=expected.expected_check AS contract_ok
FROM expected LEFT JOIN normalized policy ON policy.policyname=expected.policy_name AND policy.cmd=expected.command_name
ORDER BY expected.policy_name;

-- RC.07 PUBLIC POLICY AND GENERAL HELPER CONTRACT
WITH helper_inventory AS MATERIALIZED (
 SELECT p.*,pg_catalog.pg_get_functiondef(p.oid) AS function_definition,
  lower(regexp_replace(pg_catalog.pg_get_functiondef(p.oid),'[[:space:]]','','g')) AS compact_definition
 FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.prokind IN ('f','p') AND p.proname='current_admin_board_access'
), helper AS MATERIALIZED (
 SELECT * FROM helper_inventory
 WHERE oid=to_regprocedure('public.current_admin_board_access(text,text,uuid)')::oid
)
SELECT 'RC.07_PUBLIC_POLICY_AND_HELPER' AS section,
 (SELECT count(*)=1 FROM pg_catalog.pg_policies WHERE schemaname='public' AND tablename='board_members'
  AND policyname='board_members_public_read_active' AND cmd='SELECT' AND permissive='PERMISSIVE'
  AND roles=ARRAY['anon','authenticated']::name[] AND lower(qual) LIKE '%is_active%true%'
  AND lower(qual) LIKE '%organization_scope%club%department%') AS public_policy_ok,
 (SELECT count(*)=1 FROM helper_inventory) AS single_helper_instance,
 (SELECT oid=to_regprocedure('public.current_admin_board_access(text,text,uuid)')::oid FROM helper) AS exact_signature,
 (SELECT pg_catalog.pg_get_function_result(oid)='boolean' FROM helper) AS boolean_return,
 (SELECT prosecdef FROM helper) AS security_definer,
 (SELECT pg_catalog.pg_get_userbyid(proowner)='postgres' FROM helper) AS owner_postgres,
 (SELECT proconfig=ARRAY['search_path=pg_catalog, public'] FROM helper) AS search_path_ok,
 (SELECT NOT EXISTS(SELECT 1 FROM pg_catalog.aclexplode(COALESCE(helper.proacl,pg_catalog.acldefault('f',helper.proowner))) acl WHERE acl.grantee=0 AND acl.privilege_type='EXECUTE') FROM helper) AS public_execute_denied,
 (SELECT NOT has_function_privilege('anon',oid,'EXECUTE') FROM helper) AS anon_execute_denied,
 (SELECT has_function_privilege('authenticated',oid,'EXECUTE') FROM helper) AS authenticated_execute,
 (SELECT has_function_privilege('service_role',oid,'EXECUTE') FROM helper) AS service_role_execute,
 (SELECT compact_definition LIKE '%profile.id=auth.uid%' FROM helper) AS auth_uid_only_present,
 (SELECT compact_definition NOT LIKE '%auth.jwt%' AND compact_definition NOT LIKE '%profile.email%' FROM helper) AS email_fallback_absent,
 (SELECT compact_definition LIKE '%requested_organization_scopein%club%department%unassigned%' FROM helper) AS valid_scope_guard_present,
 (SELECT compact_definition LIKE '%permission_row.key=%board.%requested_operation%' FROM helper) AS permission_guard_present,
 (SELECT compact_definition LIKE '%owner_admin_profile_id=profile.id%' FROM helper) AS own_card_guard_present,
 (SELECT function_definition FROM helper) AS function_definition;

-- RC.08 HISTORICAL HELPERS REMAIN AND ARE UNUSED BY BOARD POLICIES
WITH signatures(signature) AS MATERIALIZED (VALUES
 ('public.current_admin_has_permission(text)'::regprocedure),('public.current_admin_has_non_table_tennis_permission(text)'::regprocedure),
 ('public.current_admin_permission_allows_department(text,uuid)'::regprocedure),('public.current_admin_can_create_or_delete_board_member(text,uuid)'::regprocedure),
 ('public.current_admin_can_edit_board_member(uuid,uuid)'::regprocedure)
)
SELECT 'RC.08_HISTORICAL_HELPERS' AS section,p.oid::regprocedure::text AS exact_signature,p.prosecdef AS security_definer,p.proconfig,
 has_function_privilege('authenticated',p.oid,'EXECUTE') AS authenticated_execute,has_function_privilege('service_role',p.oid,'EXECUTE') AS service_role_execute,
 NOT EXISTS(SELECT 1 FROM pg_catalog.pg_policies policy WHERE policy.schemaname='public' AND policy.tablename='board_members'
  AND concat_ws(' ',policy.qual,policy.with_check) LIKE '%'||p.proname||'%') AS unused_by_board_policies
FROM signatures JOIN pg_catalog.pg_proc p ON p.oid=signatures.signature::oid ORDER BY p.oid::regprocedure::text;

-- RC.09 OWN-CARD STRUCTURE AND EXACT BOARD FINGERPRINT
SELECT 'RC.09_OWN_CARD_AND_FINGERPRINT' AS section,count(*) AS board_count,
 md5(COALESCE(string_agg(md5(to_jsonb(b)::text),'' ORDER BY b.id::text),'')) AS full_row_fingerprint,
 md5(COALESCE(string_agg(b.id::text,'' ORDER BY b.id::text),'')) AS ordered_id_set_fingerprint,
 count(*) FILTER(WHERE b.admin_profile_id IS NOT NULL) AS linked_count,
 count(*) FILTER(WHERE b.organization_scope='club') AS club_count,count(*) FILTER(WHERE b.organization_scope='department') AS department_count,
 count(*) FILTER(WHERE b.organization_scope='unassigned') AS unassigned_count,
 EXISTS(SELECT 1 FROM pg_catalog.pg_constraint c WHERE c.conrelid='public.board_members'::regclass AND c.contype='f'
  AND pg_catalog.pg_get_constraintdef(c.oid,true) ILIKE '%admin_profile_id%REFERENCES%admin_profiles%ON DELETE SET NULL%') AS fk_ok,
 EXISTS(SELECT 1 FROM pg_catalog.pg_indexes WHERE schemaname='public' AND tablename='board_members' AND indexname='uq_board_members_admin_profile_id'
  AND indexdef ILIKE '%UNIQUE%' AND indexdef ILIKE '%admin_profile_id IS NOT NULL%') AS partial_unique_index_ok
FROM public.board_members b;

-- RC.10 ORGANIZATION DATA CONSISTENCY
SELECT 'RC.10_ORGANIZATION_DATA' AS section,count(*) AS total,count(*) FILTER(WHERE organization_scope='club') AS club_count,
 count(*) FILTER(WHERE organization_scope='department') AS department_count,count(*) FILTER(WHERE organization_scope='unassigned') AS unassigned_count,
 count(*) FILTER(WHERE organization_scope IS NULL OR organization_scope NOT IN ('club','department','unassigned')
  OR (organization_scope='department' AND department_id IS NULL) OR (organization_scope IN ('club','unassigned') AND department_id IS NOT NULL)) AS inconsistent_count
FROM public.board_members;

-- RC.11 AUTHENTICATED HAS NO DIRECT INSERT/UPDATE ON ANY BOARD COLUMN
WITH columns AS MATERIALIZED (SELECT column_name,ordinal_position FROM information_schema.columns WHERE table_schema='public' AND table_name='board_members')
SELECT 'RC.11_AUTHENTICATED_COLUMN_RIGHTS' AS section,ordinal_position,column_name,
 has_column_privilege('authenticated','public.board_members',column_name,'INSERT') AS can_insert,
 has_column_privilege('authenticated','public.board_members',column_name,'UPDATE') AS can_update
FROM columns ORDER BY ordinal_position;

-- RC.12 TABLE RIGHTS
WITH roles(role_name) AS MATERIALIZED (VALUES ('anon'),('authenticated'),('service_role')),
privileges(privilege_name) AS MATERIALIZED (VALUES ('SELECT'),('INSERT'),('UPDATE'),('DELETE'),('TRUNCATE'),('REFERENCES'),('TRIGGER'),('MAINTAIN'))
SELECT 'RC.12_TABLE_RIGHTS' AS section,role_name,privilege_name,has_table_privilege(role_name,'public.board_members',privilege_name) AS effective_privilege
FROM roles CROSS JOIN privileges ORDER BY role_name,privilege_name;

-- RC.13 ROLE-PERMISSION INTEGRITY
SELECT 'RC.13_ROLE_PERMISSION_INTEGRITY' AS section,
 (SELECT count(*) FROM (SELECT role_id,permission_id FROM public.admin_role_permissions GROUP BY role_id,permission_id HAVING count(*)>1) d) AS duplicates,
 (SELECT count(*) FROM public.admin_role_permissions rp LEFT JOIN public.admin_roles r ON r.id=rp.role_id WHERE r.id IS NULL) AS orphan_roles,
 (SELECT count(*) FROM public.admin_role_permissions rp LEFT JOIN public.admin_permissions p ON p.id=rp.permission_id WHERE p.id IS NULL) AS orphan_permissions;

-- RC.14 STRICT FINAL BOOLEAN SUMMARY
WITH target_roles(role_key) AS MATERIALIZED (VALUES ('superadmin'),('vorstand'),('fussball-vorstand'),('tischtennis-vorstand'),('kassierer'),('webmaster')),
board_expected(role_key,permission_key,expected_value) AS MATERIALIZED (VALUES
 ('superadmin','board.view',true),('superadmin','board.create',true),('superadmin','board.edit',true),('superadmin','board.delete',true),
 ('vorstand','board.view',true),('vorstand','board.create',true),('vorstand','board.edit',true),('vorstand','board.delete',true),
 ('fussball-vorstand','board.view',true),('fussball-vorstand','board.create',false),('fussball-vorstand','board.edit',true),('fussball-vorstand','board.delete',false),
 ('tischtennis-vorstand','board.view',true),('tischtennis-vorstand','board.create',false),('tischtennis-vorstand','board.edit',true),('tischtennis-vorstand','board.delete',false),
 ('kassierer','board.view',false),('kassierer','board.create',false),('kassierer','board.edit',false),('kassierer','board.delete',false),
 ('webmaster','board.view',false),('webmaster','board.create',false),('webmaster','board.edit',false),('webmaster','board.delete',false)
), board_eval AS MATERIALIZED (SELECT e.*,EXISTS(SELECT 1 FROM public.admin_roles r JOIN public.admin_role_permissions rp ON rp.role_id=r.id JOIN public.admin_permissions p ON p.id=rp.permission_id WHERE r.key=e.role_key AND p.key=e.permission_key) AS live_value FROM board_expected e),
system_permissions(permission_key) AS MATERIALIZED (VALUES ('users.view'),('users.create'),('users.edit'),('users.delete'),('roles.view'),('roles.edit'),('permissions.view'),('permissions.edit'),('system.view')),
system_eval AS MATERIALIZED (SELECT r.role_key,p.permission_key,r.role_key='superadmin' AS expected_value,EXISTS(SELECT 1 FROM public.admin_roles ar JOIN public.admin_role_permissions rp ON rp.role_id=ar.id JOIN public.admin_permissions ap ON ap.id=rp.permission_id WHERE ar.key=r.role_key AND ap.key=p.permission_key) AS live_value FROM target_roles r CROSS JOIN system_permissions p),
contribution_permissions(permission_key) AS MATERIALIZED (VALUES ('contributions.view'),('contributions.export'),('contributions.create'),('contributions.edit'),('contributions.record_payment'),('contributions.cancel_payment'),('contributions.defer'),('contributions.exempt'),('contributions.cancel')),
contribution_eval AS MATERIALIZED (SELECT r.role_key,p.permission_key,CASE WHEN r.role_key IN ('superadmin','kassierer') THEN true WHEN r.role_key='vorstand' AND p.permission_key IN ('contributions.view','contributions.export') THEN true ELSE false END AS expected_value,EXISTS(SELECT 1 FROM public.admin_roles ar JOIN public.admin_role_permissions rp ON rp.role_id=ar.id JOIN public.admin_permissions ap ON ap.id=rp.permission_id WHERE ar.key=r.role_key AND ap.key=p.permission_key) AS live_value FROM target_roles r CROSS JOIN contribution_permissions p),
normalized_policies AS MATERIALIZED (SELECT policyname,cmd,permissive,roles,replace(regexp_replace(lower(COALESCE(qual,'')),'[[:space:]()]|::text','','g'),'public.','') AS using_norm,replace(regexp_replace(lower(COALESCE(with_check,'')),'[[:space:]()]|::text','','g'),'public.','') AS check_norm FROM pg_catalog.pg_policies WHERE schemaname='public' AND tablename='board_members'),
expected_policies(policyname,cmd,using_norm,check_norm) AS MATERIALIZED (VALUES
 ('board_members_admin_read','SELECT','current_admin_board_access''view'',organization_scope,admin_profile_id',''),
 ('board_members_insert_department_permission','INSERT','','current_admin_board_access''create'',organization_scope,admin_profile_id'),
 ('board_members_update_department_permission','UPDATE','current_admin_board_access''edit'',organization_scope,admin_profile_id','current_admin_board_access''edit'',organization_scope,admin_profile_id'),
 ('board_members_delete_department_permission','DELETE','current_admin_board_access''delete'',organization_scope,admin_profile_id','')
), policy_eval AS MATERIALIZED (SELECT e.*,EXISTS(SELECT 1 FROM normalized_policies p WHERE p.policyname=e.policyname AND p.cmd=e.cmd AND p.permissive='PERMISSIVE' AND p.roles=ARRAY['authenticated']::name[] AND p.using_norm=e.using_norm AND p.check_norm=e.check_norm) AS matches FROM expected_policies e),
helper_inventory AS MATERIALIZED (SELECT p.*,lower(regexp_replace(pg_catalog.pg_get_functiondef(p.oid),'[[:space:]]','','g')) AS definition FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.prokind IN ('f','p') AND p.proname='current_admin_board_access'),
helper AS MATERIALIZED (SELECT * FROM helper_inventory WHERE oid=to_regprocedure('public.current_admin_board_access(text,text,uuid)')::oid),
fingerprint AS MATERIALIZED (SELECT count(*) AS row_count,md5(COALESCE(string_agg(md5(to_jsonb(b)::text),'' ORDER BY b.id::text),'')) AS full_hash,md5(COALESCE(string_agg(b.id::text,'' ORDER BY b.id::text),'')) AS id_hash,count(*) FILTER(WHERE admin_profile_id IS NOT NULL) AS linked,count(*) FILTER(WHERE organization_scope='club') AS club_count,count(*) FILTER(WHERE organization_scope='department') AS department_count,count(*) FILTER(WHERE organization_scope='unassigned') AS unassigned_count FROM public.board_members b)
SELECT 'RC.14_FINAL_BOOLEAN_SUMMARY' AS section,
 (SELECT count(*)=6 AND bool_and(is_active) FROM public.admin_roles WHERE key IN (SELECT role_key FROM target_roles)) AS active_roles_ok,
 (SELECT bool_and(live_value=expected_value) FROM board_eval) AS board_matrix_ok,
 (SELECT bool_and(live_value=expected_value) FROM system_eval) AS system_matrix_ok,
 (SELECT bool_and(live_value=expected_value) FROM contribution_eval) AS contribution_contract_ok,
 (SELECT relrowsecurity FROM pg_catalog.pg_class WHERE oid='public.board_members'::regclass) AS board_rls_enabled,
 (SELECT count(*)=5 FROM normalized_policies)
  AND (SELECT bool_and(matches) FROM policy_eval)
  AND EXISTS(SELECT 1 FROM pg_catalog.pg_policies WHERE schemaname='public' AND tablename='board_members'
    AND policyname='board_members_public_read_active' AND cmd='SELECT' AND permissive='PERMISSIVE'
    AND roles=ARRAY['anon','authenticated']::name[] AND with_check IS NULL
    AND lower(qual) LIKE '%is_active%true%'
    AND lower(qual) LIKE '%organization_scope%club%department%') AS policies_ok,
 (SELECT count(*)=1 FROM helper_inventory) AS helper_single_instance,
 COALESCE((SELECT oid=to_regprocedure('public.current_admin_board_access(text,text,uuid)')::oid
  AND pg_catalog.pg_get_function_result(oid)='boolean' AND prosecdef
  AND pg_catalog.pg_get_userbyid(proowner)='postgres' AND proconfig=ARRAY['search_path=pg_catalog, public']
  AND definition LIKE '%profile.id=auth.uid%' AND definition NOT LIKE '%auth.jwt%' AND definition NOT LIKE '%profile.email%'
  AND definition LIKE '%requested_operationin%view%create%edit%delete%'
  AND definition LIKE '%requested_organization_scopein%club%department%unassigned%'
  AND definition LIKE '%permission_row.key=%board.%requested_operation%'
  AND definition LIKE '%role_row.key=%superadmin%'
  AND definition LIKE '%role_row.key=%vorstand%requested_organization_scopein%club%department%'
  AND definition LIKE '%role_row.keyin%fussball-vorstand%tischtennis-vorstand%requested_operationin%view%edit%'
  AND definition LIKE '%owner_admin_profile_id=profile.id%' FROM helper),false) AS helper_contract_ok,
 COALESCE((SELECT NOT EXISTS(SELECT 1 FROM pg_catalog.aclexplode(COALESCE(helper.proacl,pg_catalog.acldefault('f',helper.proowner))) acl WHERE acl.grantee=0 AND acl.privilege_type='EXECUTE') AND NOT has_function_privilege('anon',helper.oid,'EXECUTE') AND has_function_privilege('authenticated',helper.oid,'EXECUTE') AND has_function_privilege('service_role',helper.oid,'EXECUTE') FROM helper),false) AS helper_acl_ok,
 (SELECT row_count=6 AND full_hash='c2cea71937735917a06f5463f803c0e4' AND id_hash='ead41b9e46e85e0cd4619f73f6ad9c7f' AND linked=0 AND club_count=5 AND department_count=1 AND unassigned_count=0 FROM fingerprint) AS board_fingerprint_ok,
 NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='board_members' AND (has_column_privilege('authenticated','public.board_members',column_name,'INSERT') OR has_column_privilege('authenticated','public.board_members',column_name,'UPDATE'))) AS authenticated_writes_denied,
 has_table_privilege('authenticated','public.board_members','SELECT') AND has_table_privilege('authenticated','public.board_members','DELETE') AND NOT has_table_privilege('authenticated','public.board_members','INSERT') AND NOT has_table_privilege('authenticated','public.board_members','UPDATE') AS authenticated_table_acl_ok,
 has_table_privilege('service_role','public.board_members','SELECT') AND has_table_privilege('service_role','public.board_members','INSERT') AND has_table_privilege('service_role','public.board_members','UPDATE') AND has_table_privilege('service_role','public.board_members','DELETE') AND has_table_privilege('service_role','public.board_members','TRUNCATE') AND has_table_privilege('service_role','public.board_members','REFERENCES') AND has_table_privilege('service_role','public.board_members','TRIGGER') AND has_table_privilege('service_role','public.board_members','MAINTAIN') AS service_role_rights_ok,
 NOT EXISTS(SELECT 1 FROM public.admin_role_permissions GROUP BY role_id,permission_id HAVING count(*)>1) AS no_permission_duplicates,
 NOT EXISTS(SELECT 1 FROM public.admin_role_permissions rp LEFT JOIN public.admin_roles r ON r.id=rp.role_id LEFT JOIN public.admin_permissions p ON p.id=rp.permission_id WHERE r.id IS NULL OR p.id IS NULL) AS no_permission_orphans;
