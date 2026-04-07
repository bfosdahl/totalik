
SELECT vault.update_secret(
  (SELECT id FROM vault.secrets WHERE name = 'cron_secret_for_jobs' LIMIT 1),
  'Streetlab123-',
  'cron_secret_for_jobs',
  'CRON secret for scheduled edge function calls'
);
