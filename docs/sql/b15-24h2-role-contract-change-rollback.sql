-- B15.24H2 - Role contract database change rollback
-- Restores the exact permission, board-policy and effective column-rights
-- baseline confirmed by the manual live preflight. MANUAL EXECUTION ONLY.

BEGIN;

DO $precheck$
DECLARE
  board_full_fingerprint text;
  board_id_fingerprint text;
BEGIN
  IF to_regprocedure('public.current_admin_board_access(text,text,uuid)') IS NULL THEN
    RAISE EXCEPTION 'Role-contract helper is absent; rollback target not detected';
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
    RAISE EXCEPTION 'Board data no longer matches the rollback baseline';
  END IF;
END
$precheck$;

-- Inverse of the proposal permission changes.
WITH additions(role_key, permission_key) AS (
  VALUES
    ('tischtennis-vorstand','board.create'), ('tischtennis-vorstand','board.delete'),
    ('kassierer','board.view'), ('kassierer','board.edit'),
    ('webmaster','board.view'), ('webmaster','board.edit'),
    ('webmaster','permissions.view'), ('webmaster','roles.view'), ('webmaster','system.view'),
    ('webmaster','users.edit'), ('webmaster','users.view')
)
INSERT INTO public.admin_role_permissions(role_id, permission_id)
SELECT role_row.id, permission_row.id
FROM additions
JOIN public.admin_roles role_row ON role_row.key = additions.role_key
JOIN public.admin_permissions permission_row ON permission_row.key = additions.permission_key
ON CONFLICT (role_id, permission_id) DO NOTHING;

WITH removals(role_key, permission_key) AS (
  VALUES
    ('vorstand','board.create'), ('vorstand','board.edit'), ('vorstand','board.delete'),
    ('fussball-vorstand','board.edit')
)
DELETE FROM public.admin_role_permissions link
USING public.admin_roles role_row, public.admin_permissions permission_row, removals
WHERE link.role_id = role_row.id AND link.permission_id = permission_row.id
  AND role_row.key = removals.role_key AND permission_row.key = removals.permission_key;

-- Restore the confirmed H1 board policies exactly. The five historical H1
-- helpers were never modified by the proposal and therefore require no rewrite.
DROP POLICY board_members_admin_read ON public.board_members;
CREATE POLICY board_members_admin_read ON public.board_members
  FOR SELECT TO authenticated
  USING (public.current_admin_permission_allows_department('board.view', department_id));

DROP POLICY board_members_insert_department_permission ON public.board_members;
CREATE POLICY board_members_insert_department_permission ON public.board_members
  FOR INSERT TO authenticated
  WITH CHECK (public.current_admin_can_create_or_delete_board_member('board.create', department_id));

DROP POLICY board_members_update_department_permission ON public.board_members;
CREATE POLICY board_members_update_department_permission ON public.board_members
  FOR UPDATE TO authenticated
  USING (public.current_admin_can_edit_board_member(department_id, admin_profile_id))
  WITH CHECK (public.current_admin_can_edit_board_member(department_id, admin_profile_id));

DROP POLICY board_members_delete_department_permission ON public.board_members;
CREATE POLICY board_members_delete_department_permission ON public.board_members
  FOR DELETE TO authenticated
  USING (public.current_admin_can_create_or_delete_board_member('board.delete', department_id));

REVOKE ALL ON FUNCTION public.current_admin_board_access(text, text, uuid) FROM PUBLIC, anon, authenticated, service_role;
DROP FUNCTION public.current_admin_board_access(text, text, uuid);

-- Restore exactly the explicit 15-column authenticated ACL captured live.
-- organization_scope and table-level INSERT/UPDATE remain absent.
GRANT INSERT (
  id, first_name, last_name, role_de, role_en, email, phone, image_url,
  is_active, sort_order, created_at, role_id, admin_profile_id,
  image_media_asset_id, department_id
) ON TABLE public.board_members TO authenticated;
GRANT UPDATE (
  id, first_name, last_name, role_de, role_en, email, phone, image_url,
  is_active, sort_order, created_at, role_id, admin_profile_id,
  image_media_asset_id, department_id
) ON TABLE public.board_members TO authenticated;

DO $self_check$
DECLARE
  mismatch_count integer;
  board_full_fingerprint text;
  board_id_fingerprint text;
  allowed_column text;
BEGIN
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
      EXISTS (SELECT 1 FROM public.admin_roles role_row
        JOIN public.admin_role_permissions link ON link.role_id = role_row.id
        JOIN public.admin_permissions permission_row ON permission_row.id = link.permission_id
        WHERE role_row.key = expected.role_key AND permission_row.key = expected.permission_key) AS live_value
    FROM expected
  )
  SELECT count(*) INTO mismatch_count FROM evaluated WHERE live_value <> expected_value;
  IF mismatch_count <> 0 THEN RAISE EXCEPTION 'Board rollback matrix incomplete'; END IF;

  IF EXISTS (SELECT 1 FROM (VALUES
      ('permissions.view'), ('roles.view'), ('system.view'), ('users.edit'), ('users.view')
    ) expected(permission_key)
    WHERE NOT EXISTS (SELECT 1 FROM public.admin_roles role_row
      JOIN public.admin_role_permissions link ON link.role_id = role_row.id
      JOIN public.admin_permissions permission_row ON permission_row.id = link.permission_id
      WHERE role_row.key = 'webmaster' AND permission_row.key = expected.permission_key)) THEN
    RAISE EXCEPTION 'Webmaster system baseline was not restored';
  END IF;

  IF NOT has_table_privilege('authenticated','public.board_members','SELECT')
     OR NOT has_table_privilege('authenticated','public.board_members','DELETE')
     OR has_table_privilege('authenticated','public.board_members','INSERT')
     OR has_table_privilege('authenticated','public.board_members','UPDATE')
     OR has_column_privilege('authenticated','public.board_members','organization_scope','INSERT')
     OR has_column_privilege('authenticated','public.board_members','organization_scope','UPDATE') THEN
    RAISE EXCEPTION 'Authenticated column baseline was not restored';
  END IF;
  FOREACH allowed_column IN ARRAY ARRAY[
    'id','first_name','last_name','role_de','role_en','email','phone','image_url',
    'is_active','sort_order','created_at','role_id','admin_profile_id',
    'image_media_asset_id','department_id'
  ] LOOP
    IF NOT has_column_privilege('authenticated','public.board_members',allowed_column,'INSERT')
       OR NOT has_column_privilege('authenticated','public.board_members',allowed_column,'UPDATE') THEN
      RAISE EXCEPTION 'Authenticated ACL baseline missing for %', allowed_column;
    END IF;
  END LOOP;

  SELECT
    md5(COALESCE(string_agg(md5(to_jsonb(member_row)::text), '' ORDER BY member_row.id::text), '')),
    md5(COALESCE(string_agg(member_row.id::text, '' ORDER BY member_row.id::text), ''))
  INTO board_full_fingerprint, board_id_fingerprint
  FROM public.board_members member_row;
  IF (SELECT count(*) FROM public.board_members) <> 6
     OR board_full_fingerprint <> 'c2cea71937735917a06f5463f803c0e4'
     OR board_id_fingerprint <> 'ead41b9e46e85e0cd4619f73f6ad9c7f'
     OR (SELECT count(*) FROM public.board_members WHERE admin_profile_id IS NOT NULL) <> 0 THEN
    RAISE EXCEPTION 'Board data fingerprint changed during rollback';
  END IF;
END
$self_check$;

COMMIT;
