-- B15 / Version 1.0.8: guarded rollback of the organization-wide board role "Webmaster".
-- MANUAL EXECUTION ONLY. This refuses deletion after any business assignment.

BEGIN;

DO $$
DECLARE
  target_role public.board_roles%ROWTYPE;
BEGIN
  IF to_regclass('public.board_roles') IS NULL
     OR to_regclass('public.board_members') IS NULL
     OR to_regclass('public.board_role_responsibilities') IS NULL
     OR to_regclass('public.admin_roles') IS NULL THEN
    RAISE EXCEPTION 'Required board-role relations are missing; aborting.';
  END IF;

  IF (SELECT count(*) FROM public.admin_roles WHERE key = 'webmaster') <> 1 THEN
    RAISE EXCEPTION 'Separate technical webmaster admin role baseline changed; aborting.';
  END IF;

  SELECT *
  INTO target_role
  FROM public.board_roles
  WHERE slug = 'webmaster';

  IF NOT FOUND THEN
    IF (SELECT count(*) FROM public.board_roles) <> 19
       OR (SELECT count(*) FROM public.board_roles WHERE department_id IS NULL) <> 12
       OR (SELECT count(*) FROM public.board_roles WHERE department_id IS NOT NULL) <> 7 THEN
      RAISE EXCEPTION 'Webmaster row is absent but board-role baseline has drifted; aborting.';
    END IF;
    RETURN;
  END IF;

  IF target_role.name_de IS DISTINCT FROM 'Webmaster'
     OR target_role.name_en IS DISTINCT FROM 'Webmaster'
     OR target_role.is_active IS DISTINCT FROM true
     OR target_role.sort_order IS DISTINCT FROM 150
     OR target_role.department_id IS NOT NULL THEN
    RAISE EXCEPTION 'Webmaster board role no longer matches the proposal target; refusing deletion.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.board_members WHERE role_id = target_role.id
  ) THEN
    RAISE EXCEPTION 'Webmaster board role is assigned to board members; refusing deletion.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.board_role_responsibilities WHERE role_id = target_role.id
  ) THEN
    RAISE EXCEPTION 'Webmaster board role has responsibility configuration; refusing deletion.';
  END IF;

  DELETE FROM public.board_roles
  WHERE id = target_role.id
    AND slug = 'webmaster'
    AND department_id IS NULL;

  IF NOT FOUND
     OR EXISTS (SELECT 1 FROM public.board_roles WHERE slug = 'webmaster')
     OR (SELECT count(*) FROM public.board_roles) <> 19
     OR (SELECT count(*) FROM public.board_roles WHERE department_id IS NULL) <> 12
     OR (SELECT count(*) FROM public.board_roles WHERE department_id IS NOT NULL) <> 7
     OR (SELECT count(DISTINCT slug) FROM public.board_roles) <> 19 THEN
    RAISE EXCEPTION 'Rollback did not restore the verified board-role baseline; aborting.';
  END IF;
END
$$;

COMMIT;
