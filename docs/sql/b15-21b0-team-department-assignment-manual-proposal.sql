-- B15.21B0 department data-quality proposal template. DO NOT RUN.
-- No assignments are included because team names are not authoritative.
-- After manual confirmation, replace the abort below with explicit UUID-to-UUID
-- mappings plus assertions. Never infer a department from name/slug/age_group.
DO $block$
BEGIN
  RAISE EXCEPTION 'No manually confirmed team/department mappings supplied; no data changed.';
END
$block$;

