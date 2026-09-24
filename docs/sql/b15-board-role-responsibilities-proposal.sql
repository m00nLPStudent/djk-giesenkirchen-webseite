-- B15 / Version 1.0.6 preparation
-- Board-role responsibilities: transactional schema and security proposal.
-- MANUAL EXECUTION ONLY after review. Contains no business responsibility data.

BEGIN;

DO $guard$
DECLARE
  missing_column_count integer;
  permission_mismatch_count integer;
BEGIN
  IF to_regclass('public.board_members') IS NULL
     OR to_regclass('public.board_roles') IS NULL
     OR to_regclass('public.departments') IS NULL
     OR to_regclass('public.admin_permissions') IS NULL
     OR to_regclass('public.admin_role_permissions') IS NULL THEN
    RAISE EXCEPTION 'Required board or permission foundation is missing';
  END IF;

  IF to_regclass('public.board_role_responsibilities') IS NOT NULL THEN
    RAISE EXCEPTION 'board_role_responsibilities already exists';
  END IF;

  IF to_regprocedure('gen_random_uuid()') IS NULL THEN
    RAISE EXCEPTION 'gen_random_uuid() is unavailable';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'board_members'
      AND c.relkind = 'r' AND c.relrowsecurity AND NOT c.relforcerowsecurity
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'board_roles'
      AND c.relkind = 'r' AND c.relrowsecurity AND NOT c.relforcerowsecurity
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'departments'
      AND c.relkind = 'r' AND c.relrowsecurity AND NOT c.relforcerowsecurity
  ) THEN
    RAISE EXCEPTION 'Unexpected board RLS baseline';
  END IF;

  WITH required_columns(table_name, column_name, data_type, is_nullable) AS (
    VALUES
      ('board_members', 'id', 'uuid', 'NO'),
      ('board_members', 'role_id', 'uuid', 'YES'),
      ('board_members', 'department_id', 'uuid', 'YES'),
      ('board_members', 'organization_scope', 'text', 'NO'),
      ('board_members', 'is_active', 'boolean', 'YES'),
      ('board_roles', 'id', 'uuid', 'NO'),
      ('board_roles', 'department_id', 'uuid', 'YES'),
      ('departments', 'id', 'uuid', 'NO'),
      ('departments', 'slug', 'text', 'NO')
  )
  SELECT count(*) INTO missing_column_count
  FROM required_columns required
  LEFT JOIN information_schema.columns actual
    ON actual.table_schema = 'public'
   AND actual.table_name = required.table_name
   AND actual.column_name = required.column_name
   AND actual.data_type = required.data_type
   AND actual.is_nullable = required.is_nullable
  WHERE actual.column_name IS NULL;

  IF missing_column_count <> 0 THEN
    RAISE EXCEPTION 'Unexpected board column baseline';
  END IF;

  IF (SELECT count(*) FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'board_members') <> 16
     OR (SELECT count(*) FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'board_roles') <> 8
     OR (SELECT count(*) FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'departments') <> 7 THEN
    RAISE EXCEPTION 'Board core column counts drifted after the preflight';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_constraint con
    JOIN pg_catalog.pg_class tbl ON tbl.oid = con.conrelid
    JOIN pg_catalog.pg_namespace n ON n.oid = tbl.relnamespace
    WHERE n.nspname = 'public' AND tbl.relname = 'board_members'
      AND con.conname = 'board_members_role_id_fkey' AND con.contype = 'f'
      AND pg_catalog.pg_get_constraintdef(con.oid, true)
        = 'FOREIGN KEY (role_id) REFERENCES board_roles(id) ON DELETE SET NULL'
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_constraint con
    JOIN pg_catalog.pg_class tbl ON tbl.oid = con.conrelid
    JOIN pg_catalog.pg_namespace n ON n.oid = tbl.relnamespace
    WHERE n.nspname = 'public' AND tbl.relname = 'board_members'
      AND con.conname = 'board_members_department_id_fkey' AND con.contype = 'f'
      AND pg_catalog.pg_get_constraintdef(con.oid, true)
        = 'FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT'
  ) THEN
    RAISE EXCEPTION 'Unexpected board foreign-key baseline';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name IN ('board_members', 'board_roles')
      AND column_name ~* '(responsib|zust.nd|aufgabe|task|duty)'
  ) OR EXISTS (
    SELECT 1 FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind IN ('r', 'p', 'v', 'm')
      AND c.relname ~* '(board.*responsib|responsib.*board|board.*task|task.*board)'
  ) THEN
    RAISE EXCEPTION 'A board responsibility model appeared after the preflight';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_trigger trigger_row
    JOIN pg_catalog.pg_class table_row ON table_row.oid = trigger_row.tgrelid
    JOIN pg_catalog.pg_namespace namespace_row ON namespace_row.oid = table_row.relnamespace
    WHERE namespace_row.nspname = 'public'
      AND table_row.relname IN ('board_members', 'board_roles', 'departments')
      AND NOT trigger_row.tgisinternal
  ) THEN
    RAISE EXCEPTION 'Board trigger baseline drifted after BRRPF.09';
  END IF;

  WITH expected(permission_key, assigned_role_count) AS (
    VALUES ('board.create', 2), ('board.delete', 2), ('board.edit', 4), ('board.view', 5)
  ), actual AS (
    SELECT p.key AS permission_key, count(DISTINCT arp.role_id)::integer AS assigned_role_count
    FROM public.admin_permissions p
    LEFT JOIN public.admin_role_permissions arp ON arp.permission_id = p.id
    WHERE p.key IN ('board.view', 'board.create', 'board.edit', 'board.delete')
    GROUP BY p.id, p.key
  )
  SELECT count(*) INTO permission_mismatch_count
  FROM expected
  LEFT JOIN actual USING (permission_key)
  WHERE actual.permission_key IS NULL
     OR actual.assigned_role_count <> expected.assigned_role_count;

  IF permission_mismatch_count <> 0
     OR (SELECT count(*) FROM public.admin_permissions
         WHERE key IN ('board.view', 'board.create', 'board.edit', 'board.delete')) <> 4 THEN
    RAISE EXCEPTION 'Unexpected board permission baseline';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_policies
    WHERE schemaname = 'public' AND tablename = 'board_members'
      AND policyname = 'board_members_public_read_active'
      AND cmd = 'SELECT' AND roles @> ARRAY['anon', 'authenticated']::name[]
  ) THEN
    RAISE EXCEPTION 'Public board-member read contract is missing';
  END IF;
END
$guard$;

CREATE TABLE public.board_role_responsibilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_scope text NOT NULL,
  department_id uuid NULL,
  role_id uuid NOT NULL,
  responsibilities text[] NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT board_role_responsibilities_scope_values_check
    CHECK (organization_scope IN ('club', 'department')),
  CONSTRAINT board_role_responsibilities_scope_department_check
    CHECK (
      (organization_scope = 'club' AND department_id IS NULL)
      OR (organization_scope = 'department' AND department_id IS NOT NULL)
    ),
  CONSTRAINT board_role_responsibilities_values_check
    CHECK (
      array_ndims(responsibilities) = 1
      AND cardinality(responsibilities) BETWEEN 1 AND 20
      AND array_position(responsibilities, NULL) IS NULL
      AND array_position(responsibilities, ''::text) IS NULL
      AND octet_length(array_to_string(responsibilities, E'\n')) <= 8000
    ),
  CONSTRAINT board_role_responsibilities_department_id_fkey
    FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE RESTRICT,
  CONSTRAINT board_role_responsibilities_role_id_fkey
    FOREIGN KEY (role_id) REFERENCES public.board_roles(id) ON DELETE RESTRICT
);

ALTER TABLE public.board_role_responsibilities OWNER TO postgres;

CREATE UNIQUE INDEX board_role_responsibilities_club_role_uidx
  ON public.board_role_responsibilities (role_id)
  WHERE organization_scope = 'club' AND department_id IS NULL;

CREATE UNIQUE INDEX board_role_responsibilities_department_role_uidx
  ON public.board_role_responsibilities (department_id, role_id)
  WHERE organization_scope = 'department' AND department_id IS NOT NULL;

ALTER TABLE public.board_role_responsibilities ENABLE ROW LEVEL SECURITY;

-- Public clients may only resolve responsibilities for an active board card.
-- There is deliberately no authenticated write policy: the later dashboard
-- action must assert board.edit plus its organization/department scope before
-- writing with the established server-only service-role path.
CREATE POLICY board_role_responsibilities_public_read_active
  ON public.board_role_responsibilities
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.board_members member
      WHERE member.is_active = true
        AND member.organization_scope = board_role_responsibilities.organization_scope
        AND member.department_id IS NOT DISTINCT FROM board_role_responsibilities.department_id
        AND member.role_id = board_role_responsibilities.role_id
    )
  );

REVOKE ALL ON TABLE public.board_role_responsibilities FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.board_role_responsibilities TO anon, authenticated;
GRANT ALL PRIVILEGES ON TABLE public.board_role_responsibilities TO service_role;

DO $self_check$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'board_role_responsibilities'
      AND c.relkind = 'r' AND c.relrowsecurity AND NOT c.relforcerowsecurity
  ) THEN
    RAISE EXCEPTION 'Responsibility table RLS target state was not reached';
  END IF;

  IF has_table_privilege('anon', 'public.board_role_responsibilities', 'INSERT')
     OR has_table_privilege('anon', 'public.board_role_responsibilities', 'UPDATE')
     OR has_table_privilege('anon', 'public.board_role_responsibilities', 'DELETE')
     OR has_table_privilege('authenticated', 'public.board_role_responsibilities', 'INSERT')
     OR has_table_privilege('authenticated', 'public.board_role_responsibilities', 'UPDATE')
     OR has_table_privilege('authenticated', 'public.board_role_responsibilities', 'DELETE')
     OR NOT has_table_privilege('service_role', 'public.board_role_responsibilities', 'SELECT,INSERT,UPDATE,DELETE') THEN
    RAISE EXCEPTION 'Responsibility table privilege target state was not reached';
  END IF;

  IF (SELECT count(*) FROM pg_catalog.pg_policies
      WHERE schemaname = 'public' AND tablename = 'board_role_responsibilities') <> 1 THEN
    RAISE EXCEPTION 'Unexpected responsibility policy count';
  END IF;

  IF EXISTS (SELECT 1 FROM public.board_role_responsibilities) THEN
    RAISE EXCEPTION 'Schema proposal must not insert responsibility data';
  END IF;
END
$self_check$;

COMMIT;
