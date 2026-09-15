import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { captureError } from '@/lib/errorTracking';
import { AutomationRulesService } from '@/services/automation-rules-service';

// Lets an admin preview or force a rule scan on demand instead of waiting for
// the next cron tick - "dryRun: true" reports what WOULD match without
// sending notifications, creating follow-ups, or writing to the run log.
export async function POST(request: NextRequest) {
  const auth = requireAuth(request, ['automation.manage']);
  if (isAuthError(auth)) return auth;

  try {
    const body = await request.json().catch(() => ({}));
    const summary = await AutomationRulesService.runScheduledRules({
      dryRun: Boolean(body.dryRun),
      ruleId: body.ruleId ? Number(body.ruleId) : undefined,
    });
    return NextResponse.json(summary);
  } catch (error) {
    console.error('Error running automation rules:', error);
    captureError(error, { route: 'POST /api/admin/automation-rules/run-now' });
    return NextResponse.json({ error: 'Failed to run automation rules' }, { status: 500 });
  }
}
