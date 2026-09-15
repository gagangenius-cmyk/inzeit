import { NextRequest, NextResponse } from 'next/server';
import { HRService } from '@/services/hr-service';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

const hrLeaveAccessPermissions = ['hr.view', 'hr.create', 'hr.update'];
const hasHrLeaveAccess = (auth: { permissions?: string[] }) => Boolean(
  auth.permissions?.includes('all') || hrLeaveAccessPermissions.some((p) => auth.permissions?.includes(p))
);

// Lets the leave application form show the real day count (holidays excluded) before
// submitting, using the exact same calculation applyLeave() uses server-side - so the
// preview can never drift from what actually gets recorded. Working days depend on the
// employee's branch holiday calendar, so when HR is previewing on behalf of someone
// else, the preview must use that employee's id too, not the HR caller's.
export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (isAuthError(auth)) return auth;

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('start_date') || '';
  const endDate = searchParams.get('end_date') || '';
  const requestedEmployeeId = searchParams.get('employee_id');
  const employeeId = requestedEmployeeId && hasHrLeaveAccess(auth) ? requestedEmployeeId : String(auth.id);
  if (!startDate || !endDate) {
    return NextResponse.json({ error: 'start_date and end_date are required' }, { status: 400 });
  }

  const daysRequested = await HRService.calculateWorkingDays(startDate, endDate, employeeId);
  return NextResponse.json({ daysRequested });
}
