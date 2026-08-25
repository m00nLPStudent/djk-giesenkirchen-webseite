-- B15.19E1.1 read-only postcheck. Run manually before and after the proposal.
SELECT constraint_row.conname,
       pg_get_constraintdef(constraint_row.oid) AS constraint_definition
FROM pg_constraint constraint_row
JOIN pg_attribute attribute_row
  ON attribute_row.attrelid = constraint_row.conrelid
 AND attribute_row.attnum = ANY (constraint_row.conkey)
WHERE constraint_row.conrelid = 'public.media_assets'::regclass
  AND constraint_row.contype = 'c'
  AND attribute_row.attname = 'purpose';

SELECT purpose, count(*) AS asset_count
FROM public.media_assets
GROUP BY purpose
ORDER BY purpose;

SELECT count(*) AS team_assets
FROM public.media_assets
WHERE purpose = 'team';
