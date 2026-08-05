-- Read-only verification. The command column contains secret lookups, never secret values.
SELECT jobid, jobname, schedule, active
FROM cron.job
WHERE jobname = 'b15-18j1-contribution-reminders-hourly';

SELECT status, start_time, end_time, return_message
FROM cron.job_run_details
WHERE jobid IN (SELECT jobid FROM cron.job WHERE jobname = 'b15-18j1-contribution-reminders-hourly')
ORDER BY start_time DESC
LIMIT 20;

SELECT name, created_at, updated_at
FROM vault.decrypted_secrets
WHERE name IN ('contribution_reminder_endpoint', 'contribution_reminder_cron_secret');

