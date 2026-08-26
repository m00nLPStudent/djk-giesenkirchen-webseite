-- B15.21B3 rollback. DO NOT RUN AUTOMATICALLY.
-- Aborts if new request types are already stored; no data is rewritten.
BEGIN;
DO $block$ BEGIN
  IF EXISTS (SELECT 1 FROM public.membership_requests WHERE request_type IN ('aktives-mitglied-tischtennis','aktives-mitglied-gymnastik-damen','aktives-mitglied-behindertensport')) THEN
    RAISE EXCEPTION 'Rollback blocked: requests with B15.21B3 request types exist.';
  END IF;
END $block$;
ALTER TABLE public.membership_requests DROP CONSTRAINT membership_requests_request_type_check;
ALTER TABLE public.membership_requests ADD CONSTRAINT membership_requests_request_type_check CHECK (request_type IN ('aktives-mitglied-fussball','trainer-werden','passives-mitglied','sonstiges'));
COMMIT;
