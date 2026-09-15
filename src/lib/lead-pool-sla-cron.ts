import { runSlaSweep, getSlaMinutes } from '@/lib/leadPool';

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
  var __dmLeadPoolSlaCronStarted: boolean | undefined;
}

const loadNodeCron = async (): Promise<CronModule | null> => {
  try {
    const cronPackage = await import('node-cron');
    return (cronPackage.default || cronPackage) as CronModule;
  } catch (error) {
    console.warn('node-cron is not available; lead pool SLA sweep was not started.', error);
    return null;
  }
};

// Runs every 5 minutes, independent of the configured SLA window itself
// (LEAD_POOL_SLA_MINUTES) — a 5-minute poll is frequent enough that even a
// 15-minute SLA is enforced within a few minutes of going overdue, without
// hammering the database once a minute.
const SCHEDULE_EXPRESSION = '*/5 * * * *';

export async function startLeadPoolSlaCron() {
  if (globalThis.__dmLeadPoolSlaCronStarted) {
    return { started: false, reason: 'already_started' };
  }

  if (process.env.LEAD_POOL_SLA_CRON_ENABLED === 'false') {
    return { started: false, reason: 'disabled_by_env' };
  }

  const cron = await loadNodeCron();
  if (!cron) return { started: false, reason: 'node_cron_unavailable' };

  const task = cron.schedule(
    SCHEDULE_EXPRESSION,
    async () => {
      try {
        const result = await runSlaSweep();
        if (result.scanned > 0) {
          console.log(`Lead pool SLA sweep: ${result.autoAssigned} auto-assigned, ${result.stillUnassignable} still unassignable (of ${result.scanned} overdue).`);
        }
      } catch (error) {
        console.error('Lead pool SLA sweep failed:', error);
      }
    },
    { timezone: 'Asia/Dubai', scheduled: true }
  );

  task.start();
  globalThis.__dmLeadPoolSlaCronStarted = true;
  console.log(`Lead pool SLA sweep cron scheduled: ${SCHEDULE_EXPRESSION} (threshold ${getSlaMinutes()}m)`);
  return { started: true, schedule: SCHEDULE_EXPRESSION };
}
