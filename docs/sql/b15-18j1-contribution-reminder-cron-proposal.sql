-- Proposal only. Do not execute automatically.
-- Prerequisites: pg_cron and pg_net enabled; these Vault secrets created manually:
-- contribution_reminder_endpoint = https://<host>/api/internal/contribution-reminders
-- contribution_reminder_cron_secret = the same high-entropy value as the hosting env var.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name = 'contribution_reminder_endpoint')
     OR NOT EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name = 'contribution_reminder_cron_secret') THEN
    RAISE EXCEPTION 'Required contribution reminder Vault secrets are missing.';
  END IF;
END $$;

SELECT cron.schedule(
  'b15-18j1-contribution-reminders-hourly',
  '0 * * * *',
  $cron$
    SELECT net.http_post(
      url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'contribution_reminder_endpoint'),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'contribution_reminder_cron_secret')
      ),
      body := jsonb_build_object('source', 'supabase-cron'),
      timeout_milliseconds := 10000
    );
  $cron$
);

