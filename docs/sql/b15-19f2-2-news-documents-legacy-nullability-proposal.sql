-- B15.19F2.2 proposal only. Do not execute automatically. No data migration.
BEGIN;

ALTER TABLE public.news_documents
  ALTER COLUMN file_path DROP NOT NULL,
  ALTER COLUMN file_url DROP NOT NULL;

COMMIT;
