-- Removes only B15.18G objects. Audit rows are permanently deleted by this rollback.
BEGIN;
DROP FUNCTION IF EXISTS public.load_notification_audit_monitoring(text,text,text,integer);
DROP TABLE IF EXISTS public.notification_audit;
COMMIT;
