-- Removes only B15.18H preference artifacts.
BEGIN;
DROP TABLE IF EXISTS public.notification_preferences;
COMMIT;
