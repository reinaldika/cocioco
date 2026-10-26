-- COCIOCO Phase B: run in the DEDICATED COCIOCO Supabase project SQL Editor only.
-- Run this AFTER COCIOCO_PHASE_B_SETUP.sql and enable Supabase Cron in integrations.
-- If this fails due plan or privilege restrictions, do not launch time-sensitive commissions yet.
-- This is designed to run as postgres, which can execute the service-only expiration function.
create extension if not exists pg_cron with schema pg_catalog;
select cron.schedule(
 'cocioco-commission-deadline-watch',
 '* * * * *',
 $$select public.backend_expire_tasks();$$
);
-- Confirm after scheduling:
-- select jobid,jobname,schedule,command,active from cron.job where jobname='cocioco-commission-deadline-watch';
-- To stop it later: select cron.unschedule('cocioco-commission-deadline-watch');
