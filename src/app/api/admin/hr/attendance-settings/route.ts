import { NextRequest, NextResponse } from 'next/server';
import { HRService } from '@/services/hr-service';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Which day(s) of the week don't count as working days for leave-duration
// math (src/services/hr-service.ts calculateWorkingDays) - previously
// hardcoded to "no weekend exclusion at all" with a comment admitting there
// was no configuration for it. Read access matches the attendance report's
// own gate; changing the policy is restricted to hr.config (HR/admin roles)
// since it affects every employee's leave balance calculation company-wide.
export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['hr.view', 'hr.reports.attendance', 'hr.config']);
  if (isAuthError(auth)) return auth;
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branch_id') ? Number(searchParams.get('branch_id')) : null;
    const days = await HRService.getWeeklyOffDays(branchId);
    return NextResponse.json({ days, dayNames: days.map((d) => DAY_NAMES[d]) });
  } catch (error) {
    console.error('Failed to fetch attendance settings:', error);
    return NextResponse.json({ error: 'Failed to fetch attendance settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = requireAuth(request, ['hr.config']);
  if (isAuthError(auth)) return auth;
  try {
    const body = await request.json() as { days?: unknown; branch_id?: unknown };
    const days = Array.isArray(body.days) ? body.days.map(Number) : null;
    if (!days || !days.length || days.some((d) => !Number.isInteger(d) || d < 0 || d > 6)) {
      return NextResponse.json({ error: 'days must be a non-empty array of integers 0 (Sunday) through 6 (Saturday)' }, { status: 400 });
    }

    const result = await HRService.setWeeklyOffDays({
      branchId: body.branch_id ? Number(body.branch_id) : null,
      days,
      updatedBy: String(auth.id),
    });
    return NextResponse.json({ ...result, dayNames: result.days.map((d) => DAY_NAMES[d]) });
  } catch (error) {
    console.error('Failed to update attendance settings:', error);
    const message = error instanceof Error ? error.message : 'Failed to update attendance settings';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
