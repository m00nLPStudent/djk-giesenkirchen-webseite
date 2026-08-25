-- B15.19F2.2 rollback only. Aborts if central rows cannot satisfy the legacy NOT NULL contract.
BEGIN;

DO $preflight$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.news_documents
    WHERE file_path IS NULL OR file_url IS NULL
  ) THEN
    RAISE EXCEPTION 'B15.19F2.2 rollback blocked: file_path/file_url contain NULL values';
  END IF;
END;
$preflight$;

ALTER TABLE public.news_documents
  ALTER COLUMN file_path SET NOT NULL,
  ALTER COLUMN file_url SET NOT NULL;

COMMIT;
