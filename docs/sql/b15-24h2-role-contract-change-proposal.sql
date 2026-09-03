-- B15.24H2 - Role contract database change proposal
-- MANUAL EXECUTION ONLY. Review the complete transaction before running it.

BEGIN;

-- Fail closed unless the confirmed live baseline is still present.
DO $precheck$
DECLARE
  missing_count integer;
  mismatch_count integer;
  board_full_fingerprint text;
  board_id_fingerprint text;
  baseline_column text;
BEGIN
  SELECT count(*) INTO missing_count
  FROM (VALUES
    ('superadmin'), ('vorstand'), ('fussball-vorstand'),
    ('tischtennis-vorstand'), ('kassierer'), ('webmaster')
  ) expected(role_key)
  LEFT JOIN public.admin_roles role_row ON role_row.key = expected.role_key
  WHERE role_row.id IS NULL OR role_row.is_active IS DISTINCT FROM true;
  IF missing_count <> 0 THEN RAISE EXCEPTION 'Required role inventory changed'; END IF;

  SELECT count(*) INTO missing_count
  FROM (VALUES
    ('board.view'), ('board.create'), ('board.edit'), ('board.delete'),
    ('permissions.view'), ('roles.view'), ('system.view'), ('users.edit'), ('users.view')
  ) expected(permission_key)
  LEFT JOIN public.admin_permissions permission_row ON permission_row.key = expected.permission_key
  WHERE permission_row.id IS NULL;
  IF missing_count <> 0 THEN RAISE EXCEPTION 'Required permission inventory changed'; END IF;

  WITH expected(role_key, permission_key, expected_value) AS (
    VALUES
      ('superadmin','board.view',true), ('superadmin','board.create',true), ('superadmin','board.edit',true), ('superadmin','board.delete',true),
      ('vorstand','board.view',true), ('vorstand','board.create',false), ('vorstand','board.edit',false), ('vorstand','board.delete',false),
      ('fussball-vorstand','board.view',true), ('fussball-vorstand','board.create',false), ('fussball-vorstand','board.edit',false), ('fussball-vorstand','board.delete',false),
      ('tischtennis-vorstand','board.view',true), ('tischtennis-vorstand','board.create',true), ('tischtennis-vorstand','board.edit',true), ('tischtennis-vorstand','board.delete',true),
      ('kassierer','board.view',true), ('kassierer','board.create',false), ('kassierer','board.edit',true), ('kassierer','board.delete',false),
      ('webmaster','board.view',true), ('webmaster','board.create',false), ('webmaster','board.edit',true), ('webmaster','board.delete',false)
  ), evaluated AS (
    SELECT expected.*,
      EXISTS (
        SELECT 1 FROM public.admin_roles role_row
        JOIN public.admin_role_permissions link ON link.role_id = role_row.id
        JOIN public.admin_permissions permission_row ON permission_row.id = link.permission_id
        WHERE role_row.key = expected.role_key AND permission_row.key = expected.permission_key
      ) AS live_value
    FROM expected
  )
  SELECT count(*) INTO mismatch_count FROM evaluated WHERE live_value <> expected_value;
  IF mismatch_count <> 0 THEN RAISE EXCEPTION 'Board permission baseline changed'; END IF;

  IF EXISTS (
    SELECT 1 FROM (VALUES
      ('permissions.view'), ('roles.view'), ('system.view'), ('users.edit'), ('users.view')
    ) expected(permission_key)
    WHERE NOT EXISTS (
      SELECT 1 FROM public.admin_roles role_row
      JOIN public.admin_role_permissions link ON link.role_id = role_row.id
      JOIN public.admin_permissions permission_row ON permission_row.id = link.permission_id
      WHERE role_row.key = 'webmaster' AND permission_row.key = expected.permission_key
    )
  ) THEN RAISE EXCEPTION 'Webmaster system-permission baseline changed'; END IF;

  IF to_regprocedure('public.current_admin_has_permission(text)') IS NULL
     OR to_regprocedure('public.current_admin_has_non_table_tennis_permission(text)') IS NULL
     OR to_regprocedure('public.current_admin_permission_allows_department(text,uuid)') IS NULL
     OR to_regprocedure('public.current_admin_can_create_or_delete_board_member(text,uuid)') IS NULL
     OR to_regprocedure('public.current_admin_can_edit_board_member(uuid,uuid)') IS NULL THEN
    RAISE EXCEPTION 'Expected H1 helper inventory changed';
  END IF;

  SELECT
    md5(COALESCE(string_agg(md5(to_jsonb(member_row)::text), '' ORDER BY member_row.id::text), '')),
    md5(COALESCE(string_agg(member_row.id::text, '' ORDER BY member_row.id::text), ''))
  INTO board_full_fingerprint, board_id_fingerprint
  FROM public.board_members member_row;

  IF (SELECT count(*) FROM public.board_members) <> 6
     OR board_full_fingerprint <> 'c2cea71937735917a06f5463f803c0e4'
     OR board_id_fingerprint <> 'ead41b9e46e85e0cd4619f73f6ad9c7f'
     OR (SELECT count(*) FROM public.board_members WHERE admin_profile_id IS NOT NULL) <> 0
     OR (SELECT count(*) FROM public.board_members WHERE organization_scope = 'club') <> 5
     OR (SELECT count(*) FROM public.board_members WHERE organization_scope = 'department') <> 1
     OR (SELECT count(*) FROM public.board_members WHERE organization_scope = 'unassigned') <> 0 THEN
    RAISE EXCEPTION 'Board data baseline changed';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_class class_row
    JOIN pg_catalog.pg_namespace namespace_row ON namespace_row.oid = class_row.relnamespace
    WHERE namespace_row.nspname = 'public' AND class_row.relname = 'board_members'
      AND class_row.relrowsecurity = true
  ) THEN RAISE EXCEPTION 'board_members RLS is not enabled'; END IF;

  IF (SELECT count(*) FROM pg_catalog.pg_policies
      WHERE schemaname = 'public' AND tablename = 'board_members') <> 5
     OR (SELECT count(*) FROM pg_catalog.pg_policies
      WHERE schemaname = 'public' AND tablename = 'board_members'
        AND policyname IN ('board_members_public_read_active','board_members_admin_read',
          'board_members_insert_department_permission','board_members_update_department_permission',
          'board_members_delete_department_permission')) <> 5 THEN
    RAISE EXCEPTION 'Expected board policy inventory changed';
  END IF;

  IF (SELECT count(*) FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'board_members') <> 16
     OR NOT has_table_privilege('authenticated','public.board_members','SELECT')
     OR NOT has_table_privilege('authenticated','public.board_members','DELETE')
     OR has_table_privilege('authenticated','public.board_members','INSERT')
     OR has_table_privilege('authenticated','public.board_members','UPDATE')
     OR has_column_privilege('authenticated','public.board_members','organization_scope','INSERT')
     OR has_column_privilege('authenticated','public.board_members','organization_scope','UPDATE') THEN
    RAISE EXCEPTION 'Authenticated board ACL baseline changed';
  END IF;
  FOREACH baseline_column IN ARRAY ARRAY[
    'id','first_name','last_name','role_de','role_en','email','phone','image_url',
    'is_active','sort_order','created_at','role_id','admin_profile_id',
    'image_media_asset_id','department_id'
  ] LOOP
    IF NOT has_column_privilege('authenticated','public.board_members',baseline_column,'INSERT')
       OR NOT has_column_privilege('authenticated','public.board_members',baseline_column,'UPDATE') THEN
      RAISE EXCEPTION 'Authenticated column ACL baseline changed for %', baseline_column;
    END IF;
  END LOOP;
END
$precheck$;

-- Apply only the confirmed permission deltas, resolved by stable keys.
WITH additions(role_key, permission_key) AS (
  VALUES
    ('vorstand','board.create'), ('vorstand','board.edit'), ('vorstand','board.delete'),
    ('fussball-vorstand','board.edit')
)
INSERT INTO public.admin_role_permissions(role_id, permission_id)
SELECT role_row.id, permission_row.id
FROM additions
JOIN public.admin_roles role_row ON role_row.key = additions.role_key
JOIN public.admin_permissions permission_row ON permission_row.key = additions.permission_key
ON CONFLICT (role_id, permission_id) DO NOTHING;

WITH removals(role_key, permission_key) AS (
  VALUES
    ('tischtennis-vorstand','board.create'), ('tischtennis-vorstand','board.delete'),
    ('kassierer','board.view'), ('kassierer','board.edit'),
    ('webmaster','board.view'), ('webmaster','board.edit'),
    ('webmaster','permissions.view'), ('webmaster','roles.view'), ('webmaster','system.view'),
    ('webmaster','users.edit'), ('webmaster','users.view')
)
DELETE FROM public.admin_role_permissions link
USING public.admin_roles role_row, public.admin_permissions permission_row, removals
WHERE link.role_id = role_row.id AND link.permission_id = permission_row.id
  AND role_row.key = removals.role_key AND permission_row.key = removals.permission_key;

-- General board contract. The historical H1 helpers remain unchanged because
-- non-board team/player/coach policies still depend on their department logic.
CREATE OR REPLACE FUNCTION public.current_admin_board_access(
  requested_operation text,
  requested_organization_scope text,
  owner_admin_profile_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_profiles profile
    JOIN public.admin_user_roles user_role ON user_role.user_id = profile.id
    JOIN public.admin_roles role_row ON role_row.id = user_role.role_id
    JOIN public.admin_role_permissions role_permission ON role_permission.role_id = role_row.id
    JOIN public.admin_permissions permission_row ON permission_row.id = role_permission.permission_id
    WHERE profile.is_active = true
      AND role_row.is_active = true
      AND profile.id = auth.uid()
      AND requested_operation IN ('view', 'create', 'edit', 'delete')
      AND requested_organization_scope IN ('club', 'department', 'unassigned')
      AND permission_row.key = 'board.' || requested_operation
      AND (
        role_row.key = 'superadmin'
        OR (
          role_row.key = 'vorstand'
          AND requested_organization_scope IN ('club', 'department')
        )
        OR (
          role_row.key IN ('fussball-vorstand', 'tischtennis-vorstand')
          AND requested_operation IN ('view', 'edit')
          AND requested_organization_scope IN ('club', 'department')
          AND owner_admin_profile_id = profile.id
        )
      )
  );
$function$;

ALTER FUNCTION public.current_admin_board_access(text, text, uuid) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.current_admin_board_access(text, text, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.current_admin_board_access(text, text, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.current_admin_board_access(text, text, uuid) TO authenticated, service_role;

-- Keep the public active-only contract, and replace only administrative rules.
DROP POLICY board_members_admin_read ON public.board_members;
CREATE POLICY board_members_admin_read ON public.board_members
  FOR SELECT TO authenticated
  USING (public.current_admin_board_access('view', organization_scope, admin_profile_id));

DROP POLICY board_members_insert_department_permission ON public.board_members;
CREATE POLICY board_members_insert_department_permission ON public.board_members
  FOR INSERT TO authenticated
  WITH CHECK (public.current_admin_board_access('create', organization_scope, admin_profile_id));

DROP POLICY board_members_update_department_permission ON public.board_members;
CREATE POLICY board_members_update_department_permission ON public.board_members
  FOR UPDATE TO authenticated
  USING (public.current_admin_board_access('edit', organization_scope, admin_profile_id))
  WITH CHECK (public.current_admin_board_access('edit', organization_scope, admin_profile_id));

DROP POLICY board_members_delete_department_permission ON public.board_members;
CREATE POLICY board_members_delete_department_permission ON public.board_members
  FOR DELETE TO authenticated
  USING (public.current_admin_board_access('delete', organization_scope, admin_profile_id));

-- The live ACL inventory proves these are exactly the 15 columns currently
-- granted to authenticated. Board writes use the authorized service-role path.
REVOKE INSERT (
  id, first_name, last_name, role_de, role_en, email, phone, image_url,
  is_active, sort_order, created_at, role_id, admin_profile_id,
  image_media_asset_id, department_id
) ON TABLE public.board_members FROM authenticated;
REVOKE UPDATE (
  id, first_name, last_name, role_de, role_en, email, phone, image_url,
  is_active, sort_order, created_at, role_id, admin_profile_id,
  image_media_asset_id, department_id
) ON TABLE public.board_members FROM authenticated;

-- Transaction-local target checks. No board business row is mutated above.
DO $self_check$
DECLARE
  mismatch_count integer;
  protected_column text;
  board_full_fingerprint text;
  board_id_fingerprint text;
BEGIN
  WITH expected(role_key, permission_key, expected_value) AS (
    VALUES
      ('superadmin','board.view',true), ('superadmin','board.create',true), ('superadmin','board.edit',true), ('superadmin','board.delete',true),
      ('vorstand','board.view',true), ('vorstand','board.create',true), ('vorstand','board.edit',true), ('vorstand','board.delete',true),
      ('fussball-vorstand','board.view',true), ('fussball-vorstand','board.create',false), ('fussball-vorstand','board.edit',true), ('fussball-vorstand','board.delete',false),
      ('tischtennis-vorstand','board.view',true), ('tischtennis-vorstand','board.create',false), ('tischtennis-vorstand','board.edit',true), ('tischtennis-vorstand','board.delete',false),
      ('kassierer','board.view',false), ('kassierer','board.create',false), ('kassierer','board.edit',false), ('kassierer','board.delete',false),
      ('webmaster','board.view',false), ('webmaster','board.create',false), ('webmaster','board.edit',false), ('webmaster','board.delete',false)
  ), evaluated AS (
    SELECT expected.*,
      EXISTS (SELECT 1 FROM public.admin_roles role_row
        JOIN public.admin_role_permissions link ON link.role_id = role_row.id
        JOIN public.admin_permissions permission_row ON permission_row.id = link.permission_id
        WHERE role_row.key = expected.role_key AND permission_row.key = expected.permission_key) AS live_value
    FROM expected
  )
  SELECT count(*) INTO mismatch_count FROM evaluated WHERE live_value <> expected_value;
  IF mismatch_count <> 0 THEN RAISE EXCEPTION 'Board target matrix incomplete'; END IF;

  IF EXISTS (SELECT 1 FROM public.admin_roles role_row
    JOIN public.admin_role_permissions link ON link.role_id = role_row.id
    JOIN public.admin_permissions permission_row ON permission_row.id = link.permission_id
    WHERE role_row.key <> 'superadmin'
      AND permission_row.key IN ('users.view','users.create','users.edit','users.delete',
        'roles.view','roles.edit','permissions.view','permissions.edit','system.view')) THEN
    RAISE EXCEPTION 'System contract is not superadmin-only';
  END IF;

  SELECT
    md5(COALESCE(string_agg(md5(to_jsonb(member_row)::text), '' ORDER BY member_row.id::text), '')),
    md5(COALESCE(string_agg(member_row.id::text, '' ORDER BY member_row.id::text), ''))
  INTO board_full_fingerprint, board_id_fingerprint
  FROM public.board_members member_row;

  IF (SELECT count(*) FROM public.board_members) <> 6
     OR board_full_fingerprint <> 'c2cea71937735917a06f5463f803c0e4'
     OR board_id_fingerprint <> 'ead41b9e46e85e0cd4619f73f6ad9c7f'
     OR (SELECT count(*) FROM public.board_members WHERE admin_profile_id IS NOT NULL) <> 0 THEN
    RAISE EXCEPTION 'Board data changed unexpectedly';
  END IF;

  FOREACH protected_column IN ARRAY ARRAY[
    'id','first_name','last_name','role_de','role_en','email','phone','image_url',
    'is_active','sort_order','created_at','role_id','admin_profile_id',
    'image_media_asset_id','department_id','organization_scope'
  ] LOOP
    IF has_column_privilege('authenticated', 'public.board_members', protected_column, 'INSERT')
       OR has_column_privilege('authenticated', 'public.board_members', protected_column, 'UPDATE') THEN
      RAISE EXCEPTION 'authenticated still has structural write access to %', protected_column;
    END IF;
  END LOOP;

  IF NOT has_table_privilege('authenticated','public.board_members','SELECT')
     OR NOT has_table_privilege('authenticated','public.board_members','DELETE')
     OR has_table_privilege('authenticated','public.board_members','INSERT')
     OR has_table_privilege('authenticated','public.board_members','UPDATE') THEN
    RAISE EXCEPTION 'authenticated board table privileges do not match the hardened target';
  END IF;

  IF NOT has_table_privilege('service_role','public.board_members','SELECT')
     OR NOT has_table_privilege('service_role','public.board_members','INSERT')
     OR NOT has_table_privilege('service_role','public.board_members','UPDATE')
     OR NOT has_table_privilege('service_role','public.board_members','DELETE')
     OR NOT has_table_privilege('service_role','public.board_members','TRUNCATE')
     OR NOT has_table_privilege('service_role','public.board_members','REFERENCES')
     OR NOT has_table_privilege('service_role','public.board_members','TRIGGER')
     OR NOT has_table_privilege('service_role','public.board_members','MAINTAIN') THEN
    RAISE EXCEPTION 'service_role board privileges were not preserved';
  END IF;
END
$self_check$;

COMMIT;
