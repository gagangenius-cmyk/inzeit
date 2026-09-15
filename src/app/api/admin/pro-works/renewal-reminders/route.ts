import { NextRequest, NextResponse } from 'next/server';
import { RenewalReminderService, renewalReminderRules } from '@/services/renewal-reminder-service';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['pro.view']);
  if (isAuthError(auth)) return auth;
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number.parseInt(searchParams.get('limit') || '100', 10);
    const [logs, items, tracker] = await Promise.all([
      RenewalReminderService.listNotificationLogs(limit),
      RenewalReminderService.collectRenewalItems({ windowDays: RenewalReminderService.getMaxThresholdDays() }),
      RenewalReminderService.getRenewalTracker({
        documentType: searchParams.get('document_type') || undefined,
        entity: searchParams.get('entity') || undefined,
        responsibleOfficer: searchParams.get('responsible_officer') || undefined,
      }),
    ]);

    return NextResponse.json({
      rules: renewalReminderRules,
      logs,
      trackedItems: items.slice(0, limit),
      tracker,
      schedule: RenewalReminderService.getCronSchedule(),
      implementation: {
        runner: 'node-cron runs daily at 08:00 Asia/Dubai through src/instrumentation.ts. POST can still run a manual scan.',
        queryWindow: `expiry_date between today and today + ${RenewalReminderService.getMaxThresholdDays()} days`,
        duplicateGuard: 'notification_log unique key: module + document type + record + threshold + expiry date',
        channels: ['in_app', 'email', 'sms'],
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch renewal reminder data';
    console.error('Failed to fetch renewal reminder data:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request, ['pro.config', 'admin.access']);
  if (isAuthError(auth)) return auth;
  try {
    const body = await request.json().catch(() => ({})) as Record<string, unknown>;
    const result = await RenewalReminderService.runDailyReminderScan({
      dryRun: body.dryRun === true,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to run renewal reminder scan';
    console.error('Failed to run renewal reminder scan:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
