-- B15.24H2 – Review data contract change proposal
-- MANUAL EXECUTION ONLY. Do not run from application code.
-- Adds two nullable value-contract columns and three scope indexes.

BEGIN;

DO $proposal$
DECLARE
  players_before bigint;
  training_times_before bigint;
  players_fingerprint_before text;
  training_times_fingerprint_before text;
  column_record record;
  constraint_definition text;
  normalized_definition text;
  index_definition text;
  index_valid boolean;
BEGIN
  IF to_regclass('public.players') IS NULL
     OR to_regclass('public.team_training_times') IS NULL
     OR to_regclass('public.teams') IS NULL
     OR to_regclass('public.player_team_seasons') IS NULL
     OR to_regclass('public.coach_team_seasons') IS NULL THEN
    RAISE EXCEPTION 'Required H2 tables are missing; aborting.';
  END IF;

  SELECT count(*), md5(COALESCE(string_agg(md5((to_jsonb(p) - 'strong_hand')::text), '' ORDER BY p.id), ''))
  INTO players_before, players_fingerprint_before
  FROM public.players AS p;

  SELECT count(*), md5(COALESCE(string_agg(md5((to_jsonb(tt) - 'training_location_type')::text), '' ORDER BY tt.id), ''))
  INTO training_times_before, training_times_fingerprint_before
  FROM public.team_training_times AS tt;

  SELECT c.data_type, c.udt_name, c.is_nullable, c.column_default
  INTO column_record
  FROM information_schema.columns AS c
  WHERE c.table_schema = 'public'
    AND c.table_name = 'players'
    AND c.column_name = 'strong_hand';

  IF FOUND AND (column_record.data_type <> 'text' OR column_record.udt_name <> 'text' OR column_record.is_nullable <> 'YES' OR column_record.column_default IS NOT NULL) THEN
    RAISE EXCEPTION 'Existing public.players.strong_hand has an incompatible contract; aborting.';
  END IF;

  ALTER TABLE public.players
    ADD COLUMN IF NOT EXISTS strong_hand text NULL;

  SELECT pg_get_constraintdef(c.oid, true)
  INTO constraint_definition
  FROM pg_catalog.pg_constraint AS c
  WHERE c.conrelid = 'public.players'::regclass
    AND c.conname = 'players_strong_hand_check';

  IF constraint_definition IS NULL THEN
    ALTER TABLE public.players
      ADD CONSTRAINT players_strong_hand_check
      CHECK (strong_hand IS NULL OR strong_hand IN ('Rechts', 'Links'));
  ELSE
    normalized_definition := lower(regexp_replace(constraint_definition, '[[:space:]()]', '', 'g'));
    IF normalized_definition <> 'checkstrong_handisnullorstrong_hand=anyarray[''rechts''::text,''links''::text]' THEN
      RAISE EXCEPTION 'Existing players_strong_hand_check has an unexpected definition; aborting.';
    END IF;
  END IF;

  SELECT c.data_type, c.udt_name, c.is_nullable, c.column_default
  INTO column_record
  FROM information_schema.columns AS c
  WHERE c.table_schema = 'public'
    AND c.table_name = 'team_training_times'
    AND c.column_name = 'training_location_type';

  IF FOUND AND (column_record.data_type <> 'text' OR column_record.udt_name <> 'text' OR column_record.is_nullable <> 'YES' OR column_record.column_default IS NOT NULL) THEN
    RAISE EXCEPTION 'Existing public.team_training_times.training_location_type has an incompatible contract; aborting.';
  END IF;

  ALTER TABLE public.team_training_times
    ADD COLUMN IF NOT EXISTS training_location_type text NULL;

  SELECT pg_get_constraintdef(c.oid, true)
  INTO constraint_definition
  FROM pg_catalog.pg_constraint AS c
  WHERE c.conrelid = 'public.team_training_times'::regclass
    AND c.conname = 'team_training_times_training_location_type_check';

  IF constraint_definition IS NULL THEN
    ALTER TABLE public.team_training_times
      ADD CONSTRAINT team_training_times_training_location_type_check
      CHECK (
        training_location_type IS NULL
        OR training_location_type IN ('kleinfeld', 'rasenplatz', 'kunstrasen', 'halle')
      );
  ELSE
    normalized_definition := lower(regexp_replace(constraint_definition, '[[:space:]()]', '', 'g'));
    IF normalized_definition <> 'checktraining_location_typeisnullortraining_location_type=anyarray[''kleinfeld''::text,''rasenplatz''::text,''kunstrasen''::text,''halle''::text]' THEN
      RAISE EXCEPTION 'Existing team_training_times_training_location_type_check has an unexpected definition; aborting.';
    END IF;
  END IF;

  SELECT pg_get_indexdef(i.indexrelid), i.indisvalid
  INTO index_definition, index_valid
  FROM pg_catalog.pg_index AS i
  JOIN pg_catalog.pg_class AS idx ON idx.oid = i.indexrelid
  JOIN pg_catalog.pg_namespace AS n ON n.oid = idx.relnamespace
  WHERE n.nspname = 'public' AND idx.relname = 'teams_department_id_scope_idx';
  IF index_definition IS NOT NULL AND (
    index_valid IS NOT TRUE
    OR index_definition NOT ILIKE '%ON public.teams USING btree (department_id)%'
    OR index_definition NOT ILIKE '%WHERE (department_id IS NOT NULL)%'
  ) THEN
    RAISE EXCEPTION 'Existing teams_department_id_scope_idx has an unexpected definition; aborting.';
  END IF;
  CREATE INDEX IF NOT EXISTS teams_department_id_scope_idx
    ON public.teams (department_id)
    WHERE department_id IS NOT NULL;

  SELECT pg_get_indexdef(i.indexrelid), i.indisvalid
  INTO index_definition, index_valid
  FROM pg_catalog.pg_index AS i
  JOIN pg_catalog.pg_class AS idx ON idx.oid = i.indexrelid
  JOIN pg_catalog.pg_namespace AS n ON n.oid = idx.relnamespace
  WHERE n.nspname = 'public' AND idx.relname = 'player_team_seasons_team_season_active_idx';
  IF index_definition IS NOT NULL AND (
    index_valid IS NOT TRUE
    OR index_definition NOT ILIKE '%ON public.player_team_seasons USING btree (team_season_id)%'
    OR index_definition NOT ILIKE '%WHERE (is_active = true)%'
  ) THEN
    RAISE EXCEPTION 'Existing player_team_seasons_team_season_active_idx has an unexpected definition; aborting.';
  END IF;
  CREATE INDEX IF NOT EXISTS player_team_seasons_team_season_active_idx
    ON public.player_team_seasons (team_season_id)
    WHERE is_active = true;

  SELECT pg_get_indexdef(i.indexrelid), i.indisvalid
  INTO index_definition, index_valid
  FROM pg_catalog.pg_index AS i
  JOIN pg_catalog.pg_class AS idx ON idx.oid = i.indexrelid
  JOIN pg_catalog.pg_namespace AS n ON n.oid = idx.relnamespace
  WHERE n.nspname = 'public' AND idx.relname = 'coach_team_seasons_team_season_active_idx';
  IF index_definition IS NOT NULL AND (
    index_valid IS NOT TRUE
    OR index_definition NOT ILIKE '%ON public.coach_team_seasons USING btree (team_season_id)%'
    OR index_definition NOT ILIKE '%WHERE (is_active = true)%'
  ) THEN
    RAISE EXCEPTION 'Existing coach_team_seasons_team_season_active_idx has an unexpected definition; aborting.';
  END IF;
  CREATE INDEX IF NOT EXISTS coach_team_seasons_team_season_active_idx
    ON public.coach_team_seasons (team_season_id)
    WHERE is_active = true;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'players'
      AND column_name = 'strong_hand' AND data_type = 'text' AND is_nullable = 'YES'
  ) OR NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'team_training_times'
      AND column_name = 'training_location_type' AND data_type = 'text' AND is_nullable = 'YES'
  ) THEN
    RAISE EXCEPTION 'H2 review data-contract column postcondition failed; aborting.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_constraint
    WHERE conrelid = 'public.players'::regclass AND conname = 'players_strong_hand_check' AND contype = 'c'
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_constraint
    WHERE conrelid = 'public.team_training_times'::regclass
      AND conname = 'team_training_times_training_location_type_check' AND contype = 'c'
  ) THEN
    RAISE EXCEPTION 'H2 review data-contract constraint postcondition failed; aborting.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_index AS i JOIN pg_catalog.pg_class AS c ON c.oid = i.indexrelid
    WHERE c.relname = 'teams_department_id_scope_idx' AND i.indisvalid
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_index AS i JOIN pg_catalog.pg_class AS c ON c.oid = i.indexrelid
    WHERE c.relname = 'player_team_seasons_team_season_active_idx' AND i.indisvalid
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_index AS i JOIN pg_catalog.pg_class AS c ON c.oid = i.indexrelid
    WHERE c.relname = 'coach_team_seasons_team_season_active_idx' AND i.indisvalid
  ) THEN
    RAISE EXCEPTION 'H2 review data-contract index postcondition failed; aborting.';
  END IF;

  IF players_before <> (SELECT count(*) FROM public.players)
     OR training_times_before <> (SELECT count(*) FROM public.team_training_times)
     OR players_fingerprint_before <> (
       SELECT md5(COALESCE(string_agg(md5((to_jsonb(p) - 'strong_hand')::text), '' ORDER BY p.id), ''))
       FROM public.players AS p
     )
     OR training_times_fingerprint_before <> (
       SELECT md5(COALESCE(string_agg(md5((to_jsonb(tt) - 'training_location_type')::text), '' ORDER BY tt.id), ''))
       FROM public.team_training_times AS tt
     ) THEN
    RAISE EXCEPTION 'Existing player or training-time data changed unexpectedly; aborting.';
  END IF;
END
$proposal$;

COMMIT;
