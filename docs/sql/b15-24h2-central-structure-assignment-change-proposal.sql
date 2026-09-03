-- B15.24H2 - Central structure and assignment model
-- MANUAL DB CHANGE PROPOSAL. Do not run without reviewing the matching preflight.

BEGIN;

CREATE TEMP TABLE b15_24h2_structure_baseline ON COMMIT DROP AS
SELECT
  (SELECT count(*) FROM public.players) AS player_count,
  (SELECT md5(coalesce(string_agg(md5((to_jsonb(p) - 'department_id')::text), '' ORDER BY p.id), '')) FROM public.players p) AS player_fingerprint,
  (SELECT count(*) FROM public.coaches) AS coach_count,
  (SELECT md5(coalesce(string_agg(md5((to_jsonb(c) - 'department_id')::text), '' ORDER BY c.id), '')) FROM public.coaches c) AS coach_fingerprint,
  (SELECT count(*) FROM public.teams) AS team_count,
  (SELECT md5(coalesce(string_agg(md5(to_jsonb(t)::text), '' ORDER BY t.id), '')) FROM public.teams t) AS team_fingerprint,
  (SELECT count(*) FROM public.board_members) AS board_count,
  (SELECT md5(coalesce(string_agg(md5((to_jsonb(bm) - 'organization_scope')::text), '' ORDER BY bm.id), '')) FROM public.board_members bm) AS board_fingerprint;

DO $guard$
DECLARE
  relation_name text;
BEGIN
  FOREACH relation_name IN ARRAY ARRAY['departments', 'players', 'coaches', 'teams', 'board_members']
  LOOP
    IF to_regclass(format('public.%I', relation_name)) IS NULL THEN
      RAISE EXCEPTION 'Required relation public.% is missing', relation_name;
    END IF;
  END LOOP;

  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname IN ('players', 'coaches', 'teams', 'board_members')
      AND NOT c.relrowsecurity
  ) THEN
    RAISE EXCEPTION 'RLS must already be enabled on all affected relations';
  END IF;
END
$guard$;

ALTER TABLE public.players ADD COLUMN IF NOT EXISTS department_id uuid;
ALTER TABLE public.coaches ADD COLUMN IF NOT EXISTS department_id uuid;
ALTER TABLE public.board_members ADD COLUMN IF NOT EXISTS organization_scope text;

DO $columns$
DECLARE
  target_table text;
  column_type regtype;
  column_not_null boolean;
  default_expression text;
BEGIN
  FOREACH target_table IN ARRAY ARRAY['players', 'coaches']
  LOOP
    SELECT a.atttypid::regtype, a.attnotnull, pg_get_expr(ad.adbin, ad.adrelid)
      INTO column_type, column_not_null, default_expression
    FROM pg_catalog.pg_attribute a
    JOIN pg_catalog.pg_class c ON c.oid = a.attrelid
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    LEFT JOIN pg_catalog.pg_attrdef ad ON ad.adrelid = a.attrelid AND ad.adnum = a.attnum
    WHERE n.nspname = 'public' AND c.relname = target_table
      AND a.attname = 'department_id' AND NOT a.attisdropped;

    IF column_type IS DISTINCT FROM 'uuid'::regtype OR column_not_null OR default_expression IS NOT NULL THEN
      RAISE EXCEPTION 'public.%.department_id has an incompatible definition', target_table;
    END IF;
  END LOOP;

  SELECT a.atttypid::regtype
    INTO column_type
  FROM pg_catalog.pg_attribute a
  JOIN pg_catalog.pg_class c ON c.oid = a.attrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = 'board_members'
    AND a.attname = 'organization_scope' AND NOT a.attisdropped;

  IF column_type IS DISTINCT FROM 'text'::regtype THEN
    RAISE EXCEPTION 'public.board_members.organization_scope is not text';
  END IF;
END
$columns$;

DO $foreign_keys$
DECLARE
  target_table text;
  fk_count integer;
  fk_definition text;
  team_fk_count integer;
  team_fk_name text;
  team_fk_definition text;
BEGIN
  FOREACH target_table IN ARRAY ARRAY['players', 'coaches']
  LOOP
    SELECT count(*), min(pg_get_constraintdef(con.oid, true))
      INTO fk_count, fk_definition
    FROM pg_catalog.pg_constraint con
    JOIN pg_catalog.pg_class tbl ON tbl.oid = con.conrelid
    JOIN pg_catalog.pg_namespace n ON n.oid = tbl.relnamespace
    JOIN pg_catalog.pg_attribute a ON a.attrelid = tbl.oid AND a.attnum = ANY(con.conkey)
    WHERE n.nspname = 'public' AND tbl.relname = target_table
      AND con.contype = 'f' AND a.attname = 'department_id';

    IF fk_count = 0 THEN
      EXECUTE format(
        'ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL',
        target_table, target_table || '_department_id_fkey'
      );
    ELSIF fk_count <> 1 OR fk_definition <> 'FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL' THEN
      RAISE EXCEPTION 'public.%.department_id has an unexpected foreign-key contract: %', target_table, fk_definition;
    END IF;
  END LOOP;

  SELECT count(*), min(con.conname), min(pg_get_constraintdef(con.oid, true))
    INTO team_fk_count, team_fk_name, team_fk_definition
  FROM pg_catalog.pg_constraint con
  JOIN pg_catalog.pg_class tbl ON tbl.oid = con.conrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = tbl.relnamespace
  JOIN pg_catalog.pg_attribute a ON a.attrelid = tbl.oid AND a.attnum = ANY(con.conkey)
  WHERE n.nspname = 'public' AND tbl.relname = 'teams'
    AND con.contype = 'f' AND a.attname = 'department_id';

  IF team_fk_count = 0 THEN
    RAISE EXCEPTION 'teams.department_id foreign key is missing';
  ELSIF team_fk_count <> 1 THEN
    RAISE EXCEPTION 'teams.department_id has % foreign keys; expected exactly one', team_fk_count;
  ELSIF team_fk_definition = 'FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE' THEN
    EXECUTE format('ALTER TABLE public.teams DROP CONSTRAINT %I', team_fk_name);
    EXECUTE format(
      'ALTER TABLE public.teams ADD CONSTRAINT %I FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL',
      team_fk_name
    );
  ELSIF team_fk_definition <> 'FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL' THEN
    RAISE EXCEPTION 'teams.department_id has an unexpected foreign-key contract: %', team_fk_definition;
  END IF;
END
$foreign_keys$;

DO $indexes$
DECLARE
  index_name text;
  expected_fragment text;
  actual_definition text;
BEGIN
  FOR index_name, expected_fragment IN
    VALUES
      ('players_department_id_idx', 'ON public.players USING btree (department_id)'),
      ('coaches_department_id_idx', 'ON public.coaches USING btree (department_id)'),
      ('board_members_organization_scope_idx', 'ON public.board_members USING btree (organization_scope)')
  LOOP
    SELECT indexdef INTO actual_definition
    FROM pg_catalog.pg_indexes
    WHERE schemaname = 'public' AND indexname = index_name;

    IF actual_definition IS NULL THEN
      EXECUTE CASE index_name
        WHEN 'players_department_id_idx' THEN 'CREATE INDEX players_department_id_idx ON public.players (department_id)'
        WHEN 'coaches_department_id_idx' THEN 'CREATE INDEX coaches_department_id_idx ON public.coaches (department_id)'
        ELSE 'CREATE INDEX board_members_organization_scope_idx ON public.board_members (organization_scope)'
      END;
    ELSIF actual_definition NOT LIKE '%' || expected_fragment || '%' OR actual_definition ILIKE '% WHERE %' THEN
      RAISE EXCEPTION 'Index % has an unexpected definition: %', index_name, actual_definition;
    END IF;
  END LOOP;
END
$indexes$;

-- The only business-table DML in this proposal: preserve the established board contract.
UPDATE public.board_members
SET organization_scope = CASE WHEN department_id IS NULL THEN 'club' ELSE 'department' END
WHERE organization_scope IS NULL;

DO $board_guard$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.board_members
    WHERE (organization_scope = 'department') IS DISTINCT FROM (department_id IS NOT NULL)
       OR organization_scope NOT IN ('unassigned', 'club', 'department')
  ) THEN
    RAISE EXCEPTION 'Existing board rows cannot satisfy the organization-scope contract';
  END IF;
END
$board_guard$;

ALTER TABLE public.board_members ALTER COLUMN organization_scope SET DEFAULT 'unassigned';
ALTER TABLE public.board_members ALTER COLUMN organization_scope SET NOT NULL;

DO $board_constraints$
DECLARE
  definition text;
BEGIN
  SELECT pg_get_constraintdef(oid, true) INTO definition
  FROM pg_catalog.pg_constraint
  WHERE conrelid = 'public.board_members'::regclass
    AND conname = 'board_members_organization_scope_values_check';
  IF definition IS NULL THEN
    ALTER TABLE public.board_members ADD CONSTRAINT board_members_organization_scope_values_check
      CHECK (organization_scope IN ('unassigned', 'club', 'department'));
  ELSIF definition NOT ILIKE '%organization_scope%unassigned%club%department%' THEN
    RAISE EXCEPTION 'Unexpected board scope value constraint: %', definition;
  END IF;

  SELECT pg_get_constraintdef(oid, true) INTO definition
  FROM pg_catalog.pg_constraint
  WHERE conrelid = 'public.board_members'::regclass
    AND conname = 'board_members_organization_scope_department_check';
  IF definition IS NULL THEN
    ALTER TABLE public.board_members ADD CONSTRAINT board_members_organization_scope_department_check
      CHECK (
        (organization_scope = 'department' AND department_id IS NOT NULL)
        OR (organization_scope IN ('club', 'unassigned') AND department_id IS NULL)
      );
  ELSIF definition NOT ILIKE '%organization_scope%department%department_id IS NOT NULL%club%unassigned%department_id IS NULL%' THEN
    RAISE EXCEPTION 'Unexpected board scope consistency constraint: %', definition;
  END IF;
END
$board_constraints$;

-- Preserve every policy name/role/command and tighten only the confirmed public SELECT predicates.
DO $policy_inventory$
DECLARE
  actual_count integer;
BEGIN
  SELECT count(*) INTO actual_count
  FROM pg_catalog.pg_policies
  WHERE schemaname = 'public'
    AND (
      (tablename = 'players' AND policyname IN ('Public can read players', 'h1_players_public_read_active'))
      OR (tablename = 'coaches' AND policyname = 'coaches_public_read_active')
      OR (tablename = 'teams' AND policyname IN ('Public can read active teams', 'h1_teams_public_read_active'))
      OR (tablename = 'board_members' AND policyname = 'board_members_public_read_active')
    )
    AND cmd = 'SELECT';
  IF actual_count <> 6 THEN
    RAISE EXCEPTION 'Expected exactly six known public SELECT policies, found %', actual_count;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_policies
    WHERE schemaname = 'public'
      AND (
        (tablename = 'players' AND policyname = 'Public can read players'
          AND qual <> '(is_active = true)' AND qual NOT ILIKE '%department_id IS NOT NULL%')
        OR (tablename = 'players' AND policyname = 'h1_players_public_read_active'
          AND qual <> 'COALESCE(((to_jsonb(players.*) ->> ''is_active''::text))::boolean, true)'
          AND qual NOT ILIKE '%department_id IS NOT NULL%')
        OR (tablename = 'coaches' AND policyname = 'coaches_public_read_active'
          AND qual <> '(is_active = true)' AND qual NOT ILIKE '%department_id IS NOT NULL%')
        OR (tablename = 'teams' AND policyname IN ('Public can read active teams', 'h1_teams_public_read_active')
          AND qual <> '(is_active = true)' AND qual NOT ILIKE '%department_id IS NOT NULL%')
        OR (tablename = 'board_members' AND policyname = 'board_members_public_read_active'
          AND qual <> '(is_active = true)' AND qual NOT ILIKE '%organization_scope%')
      )
  ) THEN
    RAISE EXCEPTION 'A known public SELECT policy has changed since the live preflight';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('players', 'coaches', 'teams', 'board_members')
      AND cmd = 'SELECT'
      AND ('anon' = ANY(roles) OR 'public' = ANY(roles))
      AND policyname NOT IN (
        'Public can read players', 'h1_players_public_read_active',
        'coaches_public_read_active', 'Public can read active teams',
        'h1_teams_public_read_active', 'board_members_public_read_active'
      )
  ) THEN
    RAISE EXCEPTION 'Unexpected public SELECT policy would bypass the central-structure predicates';
  END IF;
END
$policy_inventory$;

ALTER POLICY "Public can read players" ON public.players USING (is_active = true AND department_id IS NOT NULL);
ALTER POLICY h1_players_public_read_active ON public.players
  USING (COALESCE(((to_jsonb(players.*) ->> 'is_active'::text))::boolean, true) AND department_id IS NOT NULL);
ALTER POLICY coaches_public_read_active ON public.coaches USING (is_active = true AND department_id IS NOT NULL);
ALTER POLICY "Public can read active teams" ON public.teams USING (is_active = true AND department_id IS NOT NULL);
ALTER POLICY h1_teams_public_read_active ON public.teams USING (is_active = true AND department_id IS NOT NULL);
ALTER POLICY board_members_public_read_active ON public.board_members
  USING (is_active = true AND organization_scope IN ('club', 'department'));

-- A table-level privilege covers newly added columns. Convert authenticated INSERT/UPDATE
-- to equivalent column grants for all existing columns except the server-only structure fields.
DO $privileges$
DECLARE
  target_table text;
  protected_column text;
  insert_columns text;
  update_columns text;
BEGIN
  FOR target_table, protected_column IN
    VALUES ('players', 'department_id'), ('coaches', 'department_id'), ('board_members', 'organization_scope')
  LOOP
    SELECT string_agg(format('%I', a.attname), ', ' ORDER BY a.attnum)
      INTO insert_columns
    FROM pg_catalog.pg_attribute a
    WHERE a.attrelid = format('public.%I', target_table)::regclass
      AND a.attnum > 0 AND NOT a.attisdropped AND a.attname <> protected_column;
    update_columns := insert_columns;

    EXECUTE format('REVOKE INSERT, UPDATE ON TABLE public.%I FROM authenticated', target_table);

    EXECUTE format('GRANT INSERT (%s) ON TABLE public.%I TO authenticated', insert_columns, target_table);
    EXECUTE format('GRANT UPDATE (%s) ON TABLE public.%I TO authenticated', update_columns, target_table);
  END LOOP;
END
$privileges$;

DO $post_guard$
DECLARE
  baseline b15_24h2_structure_baseline%ROWTYPE;
BEGIN
  SELECT * INTO baseline FROM b15_24h2_structure_baseline;

  IF baseline.player_count <> (SELECT count(*) FROM public.players)
     OR baseline.player_fingerprint <> (SELECT md5(coalesce(string_agg(md5((to_jsonb(p) - 'department_id')::text), '' ORDER BY p.id), '')) FROM public.players p)
     OR EXISTS (SELECT 1 FROM public.players WHERE department_id IS NOT NULL) THEN
    RAISE EXCEPTION 'Player data changed or a forbidden player backfill occurred';
  END IF;
  IF baseline.coach_count <> (SELECT count(*) FROM public.coaches)
     OR baseline.coach_fingerprint <> (SELECT md5(coalesce(string_agg(md5((to_jsonb(c) - 'department_id')::text), '' ORDER BY c.id), '')) FROM public.coaches c)
     OR EXISTS (SELECT 1 FROM public.coaches WHERE department_id IS NOT NULL) THEN
    RAISE EXCEPTION 'Coach data changed or a forbidden coach backfill occurred';
  END IF;
  IF baseline.team_count <> (SELECT count(*) FROM public.teams)
     OR baseline.team_fingerprint <> (SELECT md5(coalesce(string_agg(md5(to_jsonb(t)::text), '' ORDER BY t.id), '')) FROM public.teams t) THEN
    RAISE EXCEPTION 'Team data changed';
  END IF;
  IF baseline.board_count <> (SELECT count(*) FROM public.board_members)
     OR baseline.board_fingerprint <> (SELECT md5(coalesce(string_agg(md5((to_jsonb(bm) - 'organization_scope')::text), '' ORDER BY bm.id), '')) FROM public.board_members bm) THEN
    RAISE EXCEPTION 'A pre-existing board business field changed';
  END IF;
END
$post_guard$;

COMMIT;
