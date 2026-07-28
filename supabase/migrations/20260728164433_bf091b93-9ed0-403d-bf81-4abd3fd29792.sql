SELECT cron.schedule(
  'publish-scheduled-linkedin',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://project--d2e3f4c5-af50-4937-a780-34a6f78348f7.lovable.app/api/public/hooks/publish-scheduled-linkedin',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);