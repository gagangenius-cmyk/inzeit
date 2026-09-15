import { MonthlyReportService } from '@/services/monthly-report-service';

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
  var __dmMonthlyReportCronStarted: boolean | undefined;
}

const loadNodeCron = async (): Promise<CronModule | null> => {
  try {
    const cronPackage = await import('node-cron');
    return (cronPackage.default || cronPackage) as CronModule;
  } catch (error) {
    console.warn('node-cron is not available; monthly report scheduler was not started.', error);
    return null;
  }
};

export async function startMonthlyReportCron() {
  if (globalThis.__dmMonthlyReportCronStarted) {
    return { started: false, reason: 'already_started' };
  }

  if (process.env.MONTHLY_REPORT_CRON_ENABLED === 'false') {
    return { started: false, reason: 'disabled_by_env' };
  }

  const cron = await loadNodeCron();
  if (!cron) return { started: false, reason: 'node_cron_unavailable' };

  const schedule = MonthlyReportService.getCronSchedule();
  const task = cron.schedule(
    schedule.expression,
    async () => {
      try {
        await MonthlyReportService.runMonthlyReportScan();
      } catch (error) {
        console.error('Monthly report scan failed:', error);
      }
    },
    { timezone: schedule.timezone, scheduled: true }
  );

  task.start();
  globalThis.__dmMonthlyReportCronStarted = true;
  console.log(`Monthly report cron scheduled: ${schedule.expression} ${schedule.timezone}`);
  return { started: true, schedule };
}
