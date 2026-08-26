-- B15.21B3 proposal. DO NOT RUN AUTOMATICALLY. No rows are changed.
BEGIN;
DO $block$ BEGIN
  IF EXISTS (SELECT 1 FROM public.membership_requests WHERE request_type NOT IN ('aktives-mitglied-fussball','aktives-mitglied-tischtennis','aktives-mitglied-gymnastik-damen','aktives-mitglied-behindertensport','trainer-werden','passives-mitglied','sonstiges')) THEN
    RAISE EXCEPTION 'Unknown membership request_type values exist; review preflight.';
  END IF;
  IF EXISTS (SELECT 1 FROM public.membership_request_recipients WHERE request_type IS NOT NULL AND request_type NOT IN ('aktives-mitglied-fussball','aktives-mitglied-tischtennis','aktives-mitglied-gymnastik-damen','aktives-mitglied-behindertensport','trainer-werden','passives-mitglied','sonstiges')) THEN
    RAISE EXCEPTION 'Unknown membership recipient request_type values exist; review preflight.';
  END IF;
END $block$;
ALTER TABLE public.membership_requests DROP CONSTRAINT membership_requests_request_type_check;
ALTER TABLE public.membership_requests ADD CONSTRAINT membership_requests_request_type_check CHECK (request_type IN ('aktives-mitglied-fussball','aktives-mitglied-tischtennis','aktives-mitglied-gymnastik-damen','aktives-mitglied-behindertensport','trainer-werden','passives-mitglied','sonstiges'));
COMMIT;
