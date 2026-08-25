-- B15.19F3.1 rollback only. Aborts rather than deleting multi-inline usages.
BEGIN;
DO $preflight$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.media_asset_usages
    WHERE entity_type='news' AND field_name='content'
    GROUP BY entity_type,entity_id,field_name HAVING count(*)>1
  ) THEN
    RAISE EXCEPTION 'B15.19F3.1 rollback blocked: news/content contains multiple asset usages';
  END IF;
END;
$preflight$;
DROP INDEX IF EXISTS public.media_asset_usages_one_field_per_entity;
CREATE UNIQUE INDEX media_asset_usages_one_field_per_entity
  ON public.media_asset_usages(entity_type,entity_id,field_name);
COMMIT;
