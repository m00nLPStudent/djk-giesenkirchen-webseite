-- Removes only the B15.18A notification infrastructure.
BEGIN;
DROP TABLE IF EXISTS public.notifications;
COMMIT;
