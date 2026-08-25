-- B15.19F3.1 proposal only. Do not execute automatically. No data migration.
BEGIN;

DROP INDEX IF EXISTS public.media_asset_usages_one_field_per_entity;

CREATE UNIQUE INDEX media_asset_usages_one_field_per_entity
  ON public.media_asset_usages(entity_type,entity_id,field_name)
  WHERE NOT (entity_type='news' AND field_name='content');

COMMIT;
