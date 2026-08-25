-- B15.19D3 proposal only. Do not execute automatically. No data migration.
-- Adds the already-supported RPC entity to the media usage table constraint.
BEGIN;

DO $b15_19d3$
DECLARE
  constraint_name text;
BEGIN
  SELECT constraint_row.conname
    INTO constraint_name
    FROM pg_constraint constraint_row
    JOIN pg_attribute attribute_row
      ON attribute_row.attrelid = constraint_row.conrelid
     AND attribute_row.attnum = ANY (constraint_row.conkey)
   WHERE constraint_row.conrelid = 'public.media_asset_usages'::regclass
     AND constraint_row.contype = 'c'
     AND attribute_row.attname = 'entity_type'
   LIMIT 1;

  IF constraint_name IS NULL THEN
    RAISE EXCEPTION 'entity_type check constraint not found on media_asset_usages';
  END IF;

  EXECUTE format('ALTER TABLE public.media_asset_usages DROP CONSTRAINT %I', constraint_name);
  ALTER TABLE public.media_asset_usages
    ADD CONSTRAINT media_asset_usages_entity_type_check
    CHECK (entity_type IN (
      'player', 'coach', 'board_member', 'club_contact', 'team', 'team_season',
      'news', 'page', 'club_history', 'sponsor', 'event', 'document',
      'download', 'system'
    ));
END;
$b15_19d3$;

COMMIT;
