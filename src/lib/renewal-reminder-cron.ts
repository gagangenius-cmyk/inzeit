import { RenewalReminderService } from '@/services/renewal-reminder-service';

type CronTask = {
  start: () => void;
};
type CronModule = {
  schedule: (
    expression: string,
    task: () => void | Promise<void>,
    options: { timezone: string; scheduled?: boolean }
  ) => CronTask;
};

declare global {
  var __dmRenewalReminderCronStarted: boolean | undefined;
}

const loadNodeCron = async (): Promise<CronModule | null> => {
  try {
    const cronPackage = await import('node-cron');
    return (cronPackage.default || cronPackage) as CronModule;
  } catch (error) {
    console.warn('node-cron is not available; renewal reminder scheduler was not started.', error);
    return null;
  }
};

export async function startRenewalReminderCron() {
  if (globalThis.__dmRenewalReminderCronStarted) {
    return { started: false, reason: 'already_started' };
  }

  if (process.env.RENEWAL_REMINDER_CRON_ENABLED === 'false') {
    return { started: false, reason: 'disabled_by_env' };
  }

  const cron = await loadNodeCron();
  if (!cron) return { started: false, reason: 'node_cron_unavailable' };

  const schedule = RenewalReminderService.getCronSchedule();
  const task = cron.schedule(
    schedule.expression,
    async () => {
      try {
        await RenewalReminderService.runDailyReminderScan();
      } catch (error) {
        console.error('Daily renewal reminder scan failed:', error);
      }
    },
    { timezone: schedule.timezone, scheduled: true }
  );

  task.start();
  globalThis.__dmRenewalReminderCronStarted = true;
  console.log(`Renewal reminder cron scheduled: ${schedule.expression} ${schedule.timezone}`);
  return { started: true, schedule };
}
