export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET must be set in production. Set it in .env.production before starting the server.');
    }

    const { startRenewalReminderCron } = await import('@/lib/renewal-reminder-cron');
    await startRenewalReminderCron();

    const { startMonthlyReportCron } = await import('@/lib/monthly-report-cron');
    await startMonthlyReportCron();

    const { startLeadPoolSlaCron } = await import('@/lib/lead-pool-sla-cron');
    await startLeadPoolSlaCron();

    const { startAutomationRulesCron } = await import('@/lib/automation-rules-cron');
    await startAutomationRulesCron();
  }
}

// Next.js's own catch-all for errors that escape a route/Server Component's
// own try/catch entirely (most API routes here already catch and return a
// normal error response themselves, so this is a backstop for what they
// don't - not full coverage on its own; see src/lib/errorTracking.ts's own
// comment for why route-by-route adoption still matters for the rest).
export async function onRequestError(
  error: unknown,
  request: { path: string; method: string },
) {
  const { captureError } = await import('@/lib/errorTracking');
  captureError(error, { route: `${request.method} ${request.path}` });
}
