import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { captureError } from '@/lib/errorTracking';
import { AutomationRulesService } from '@/services/automation-rules-service';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['automation.manage']);
  if (isAuthError(auth)) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const ruleId = searchParams.get('ruleId');
    const limit = searchParams.get('limit');
    const runs = await AutomationRulesService.listRuns({
      ruleId: ruleId ? Number(ruleId) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    return NextResponse.json({ runs });
  } catch (error) {
    console.error('Error fetching automation rule runs:', error);
    captureError(error, { route: 'GET /api/admin/automation-rules/runs' });
    return NextResponse.json({ error: 'Failed to fetch automation rule runs' }, { status: 500 });
  }
}
