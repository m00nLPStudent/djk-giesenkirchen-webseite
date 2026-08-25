-- B15.19E1.1 proposal only. Do not execute automatically. No data migration.
-- Aligns an older installed media_assets purpose CHECK with the B15.19A application allowlist.
BEGIN;

DO $b15_19e1_1$
DECLARE
  constraint_name text;
BEGIN
  SELECT constraint_row.conname
    INTO constraint_name
    FROM pg_constraint constraint_row
    JOIN pg_attribute attribute_row
      ON attribute_row.attrelid = constraint_row.conrelid
     AND attribute_row.attnum = ANY (constraint_row.conkey)
   WHERE constraint_row.conrelid = 'public.media_assets'::regclass
     AND constraint_row.contype = 'c'
     AND attribute_row.attname = 'purpose'
   LIMIT 1;

  IF constraint_name IS NULL THEN
    RAISE EXCEPTION 'purpose check constraint not found on media_assets';
  END IF;

  EXECUTE format('ALTER TABLE public.media_assets DROP CONSTRAINT %I', constraint_name);
  ALTER TABLE public.media_assets
    ADD CONSTRAINT media_assets_purpose_check
    CHECK (purpose IN (
      'player', 'coach', 'board', 'team', 'news', 'cms', 'club_history',
      'sponsor', 'event', 'document', 'download', 'system'
    ));
END;
$b15_19e1_1$;

COMMIT;
