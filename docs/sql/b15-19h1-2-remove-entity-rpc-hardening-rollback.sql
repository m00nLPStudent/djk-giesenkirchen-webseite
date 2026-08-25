-- B15.19H1.2 SECURITY-DOWNGRADE rollback only. Do not execute casually.
-- Restores the confirmed pre-H1.2 browser/PUBLIC EXECUTE exposure and unset function search_path.
BEGIN;

ALTER FUNCTION public.remove_entity(text,uuid) RESET search_path;

GRANT EXECUTE ON FUNCTION public.remove_entity(text,uuid) TO PUBLIC,anon,authenticated;

COMMIT;
