
-- Delete old vault secret and create new one
SELECT vault.update_secret(
  (SELECT id FROM vault.secrets WHERE name = 'cron_secret_for_jobs'),
  'totalik-cron-secret-2025',
  'cron_secret_for_jobs',
  'CRON secret for scheduled edge function calls'
);
