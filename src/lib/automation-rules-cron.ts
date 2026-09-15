import { AutomationRulesService } from '@/services/automation-rules-service';

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
  var __dmAutomationRulesCronStarted: boolean | undefined;
}

const loadNodeCron = async (): Promise<CronModule | null> => {
  try {
    const cronPackage = await import('node-cron');
    return (cronPackage.default || cronPackage) as CronModule;
  } catch (error) {
    console.warn('node-cron is not available; automation rules scheduler was not started.', error);
    return null;
  }
};

export async function startAutomationRulesCron() {
  if (globalThis.__dmAutomationRulesCronStarted) {
    return { started: false, reason: 'already_started' };
  }

  if (process.env.AUTOMATION_RULES_CRON_ENABLED === 'false') {
    return { started: false, reason: 'disabled_by_env' };
  }

  const cron = await loadNodeCron();
  if (!cron) return { started: false, reason: 'node_cron_unavailable' };

  const schedule = AutomationRulesService.getCronSchedule();
  const task = cron.schedule(
    schedule.expression,
    async () => {
      try {
        await AutomationRulesService.runScheduledRules();
      } catch (error) {
        console.error('Automation rules scan failed:', error);
      }
    },
    { timezone: schedule.timezone, scheduled: true }
  );

  task.start();
  globalThis.__dmAutomationRulesCronStarted = true;
  console.log(`Automation rules cron scheduled: ${schedule.expression} ${schedule.timezone}`);
  return { started: true, schedule };
}
