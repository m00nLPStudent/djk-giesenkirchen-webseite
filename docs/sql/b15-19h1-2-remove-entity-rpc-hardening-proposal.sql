-- B15.19H1.2 proposal only. Do not execute automatically. No data or table changes.
BEGIN;

REVOKE ALL ON FUNCTION public.remove_entity(text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.remove_entity(text,uuid) TO service_role;

ALTER FUNCTION public.remove_entity(text,uuid) SET search_path=public,pg_temp;

COMMIT;
