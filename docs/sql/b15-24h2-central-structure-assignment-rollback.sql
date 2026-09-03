-- B15.24H2 - Immediate rollback for the central structure migration.
-- DESTRUCTIVE: run only immediately after the proposal and before productive use.

BEGIN;

DO $rollback_guard$
BEGIN
  IF EXISTS (SELECT 1 FROM public.players WHERE department_id IS NOT NULL)
     OR EXISTS (SELECT 1 FROM public.coaches WHERE department_id IS NOT NULL)
     OR EXISTS (SELECT 1 FROM public.board_members WHERE organization_scope = 'unassigned')
     OR EXISTS (
       SELECT 1 FROM public.board_members
       WHERE organization_scope IS DISTINCT FROM CASE WHEN department_id IS NULL THEN 'club' ELSE 'department' END
     ) THEN
    RAISE EXCEPTION 'Rollback refused: central structure values are already in productive use';
  END IF;
END
$rollback_guard$;

ALTER POLICY "Public can read players" ON public.players USING (is_active = true);
ALTER POLICY h1_players_public_read_active ON public.players
  USING (COALESCE(((to_jsonb(players.*) ->> 'is_active'::text))::boolean, true));
ALTER POLICY coaches_public_read_active ON public.coaches USING (is_active = true);
ALTER POLICY "Public can read active teams" ON public.teams USING (is_active = true);
ALTER POLICY h1_teams_public_read_active ON public.teams USING (is_active = true);
ALTER POLICY board_members_public_read_active ON public.board_members USING (is_active = true);

DO $restore_privileges$
DECLARE
  target_table text;
  all_columns text;
BEGIN
  FOREACH target_table IN ARRAY ARRAY['players', 'coaches', 'board_members']
  LOOP
    SELECT string_agg(format('%I', a.attname), ', ' ORDER BY a.attnum)
      INTO all_columns
    FROM pg_catalog.pg_attribute a
    WHERE a.attrelid = format('public.%I', target_table)::regclass
      AND a.attnum > 0 AND NOT a.attisdropped;
    EXECUTE format(
      'REVOKE INSERT (%s), UPDATE (%s) ON TABLE public.%I FROM authenticated',
      all_columns, all_columns, target_table
    );
  END LOOP;
END
$restore_privileges$;
GRANT INSERT, UPDATE ON TABLE public.players TO authenticated;
GRANT INSERT, UPDATE ON TABLE public.coaches TO authenticated;
GRANT INSERT, UPDATE ON TABLE public.board_members TO authenticated;

DROP INDEX IF EXISTS public.players_department_id_idx;
DROP INDEX IF EXISTS public.coaches_department_id_idx;
DROP INDEX IF EXISTS public.board_members_organization_scope_idx;

ALTER TABLE public.board_members DROP CONSTRAINT IF EXISTS board_members_organization_scope_department_check;
ALTER TABLE public.board_members DROP CONSTRAINT IF EXISTS board_members_organization_scope_values_check;
ALTER TABLE public.board_members DROP COLUMN organization_scope;
ALTER TABLE public.players DROP COLUMN department_id;
ALTER TABLE public.coaches DROP COLUMN department_id;

DO $team_fk$
DECLARE
  fk_name text;
  definition text;
BEGIN
  SELECT con.conname, pg_get_constraintdef(con.oid, true)
    INTO fk_name, definition
  FROM pg_catalog.pg_constraint con
  JOIN pg_catalog.pg_class tbl ON tbl.oid = con.conrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = tbl.relnamespace
  JOIN pg_catalog.pg_attribute a ON a.attrelid = tbl.oid AND a.attnum = ANY(con.conkey)
  WHERE n.nspname = 'public' AND tbl.relname = 'teams'
    AND con.contype = 'f' AND a.attname = 'department_id';

  IF definition <> 'FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL' THEN
    RAISE EXCEPTION 'Rollback refused: unexpected teams.department_id FK: %', definition;
  END IF;
  EXECUTE format('ALTER TABLE public.teams DROP CONSTRAINT %I', fk_name);
  EXECUTE format(
    'ALTER TABLE public.teams ADD CONSTRAINT %I FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE CASCADE',
    fk_name
  );
END
$team_fk$;

COMMIT;
