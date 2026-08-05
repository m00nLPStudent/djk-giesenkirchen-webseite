-- Unschedules only the B15.18J1 job. It does not delete Vault secrets or application data.
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'b15-18j1-contribution-reminders-hourly';
