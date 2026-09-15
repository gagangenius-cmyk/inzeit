import { NextRequest, NextResponse } from 'next/server';
import { HRService, type HRLeaveType } from '@/services/hr-service';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { getActiveLeaveTypeNames } from '@/lib/leaveTypes';

const hrLeaveAccessPermissions = ['hr.view', 'hr.create', 'hr.update'];
const hasHrLeaveAccess = (auth: { permissions?: string[] }) => Boolean(
  auth.permissions?.includes('all') || hrLeaveAccessPermissions.some((p) => auth.permissions?.includes(p))
);

// Applying for leave is a personal action every employee needs regardless of
// role/module permissions, so this only requires authentication - no permission check.
// employee_id is taken from the authenticated caller by default, so no one can file
// a leave request attributed to a colleague - UNLESS the caller holds HR access, in
// which case an explicit employee_id (query param for GET, body for POST) is honored
// so HR can view/apply leave on behalf of any employee, including themselves.
export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (isAuthError(auth)) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const requestedEmployeeId = searchParams.get('employee_id');
    const employeeId = requestedEmployeeId && hasHrLeaveAccess(auth) ? requestedEmployeeId : String(auth.id);
    const year = Number.parseInt(searchParams.get('year') || String(new Date().getFullYear()), 10);
    const requests = await HRService.listLeaveManagementRequests({ employeeId, year, limit: 100 });
    const balances = await HRService.getLeaveBalances(employeeId, year);
    const leaveTypes = await getActiveLeaveTypeNames();

    return NextResponse.json({ requests, balances, leaveTypes, employeeId, canApplyForOthers: hasHrLeaveAccess(auth) });
  } catch (error) {
    console.error('Failed to fetch my leave applications:', error);
    return NextResponse.json({ error: 'Failed to fetch leave applications' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (isAuthError(auth)) return auth;

  try {
    const body = await request.json() as Record<string, unknown>;
    const requestedEmployeeId = body.employee_id ? String(body.employee_id).trim() : '';
    const employeeId = requestedEmployeeId && hasHrLeaveAccess(auth) ? requestedEmployeeId : String(auth.id);
    const startDate = String(body.start_date || '').trim();
    const endDate = String(body.end_date || '').trim();

    const leaveTypes = await getActiveLeaveTypeNames();
    const leaveType = typeof body.leave_type === 'string' ? body.leave_type : '';
    if (!leaveTypes.includes(leaveType)) {
      return NextResponse.json({ error: `leave_type must be one of: ${leaveTypes.join(', ')}` }, { status: 400 });
    }
    if (!startDate) return NextResponse.json({ error: 'start_date is required' }, { status: 400 });
    if (!endDate) return NextResponse.json({ error: 'end_date is required' }, { status: 400 });

    const created = await HRService.applyLeave({
      employee_id: employeeId,
      // Runtime-validated against crm_leave_type above (getActiveLeaveTypeNames),
      // not compile-time narrowable since the valid set is now DB-driven.
      leave_type: leaveType as HRLeaveType,
      start_date: startDate,
      end_date: endDate,
      reason: body.reason ? String(body.reason).trim() : null,
      document_url: body.document_url ? String(body.document_url).trim() : null,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to apply for leave';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// Edit a request's own dates/type/reason while it's still Pending - see
// HRService.editLeaveRequest for why edits are blocked once it's been acted on.
export async function PATCH(request: NextRequest) {
  const auth = requireAuth(request);
  if (isAuthError(auth)) return auth;

  try {
    const body = await request.json() as Record<string, unknown>;
    const leaveId = body.leave_id ? String(body.leave_id).trim() : '';
    if (!leaveId) return NextResponse.json({ error: 'leave_id is required' }, { status: 400 });

    const requestedEmployeeId = body.employee_id ? String(body.employee_id).trim() : '';
    const employeeId = requestedEmployeeId && hasHrLeaveAccess(auth) ? requestedEmployeeId : String(auth.id);

    let leaveType: HRLeaveType | undefined;
    if (body.leave_type !== undefined) {
      const leaveTypes = await getActiveLeaveTypeNames();
      if (typeof body.leave_type !== 'string' || !leaveTypes.includes(body.leave_type)) {
        return NextResponse.json({ error: `leave_type must be one of: ${leaveTypes.join(', ')}` }, { status: 400 });
      }
      leaveType = body.leave_type as HRLeaveType;
    }

    const updated = await HRService.editLeaveRequest({
      leave_id: leaveId,
      employee_id: employeeId,
      leave_type: leaveType,
      start_date: body.start_date ? String(body.start_date).trim() : undefined,
      end_date: body.end_date ? String(body.end_date).trim() : undefined,
      reason: body.reason !== undefined ? String(body.reason).trim() : undefined,
      document_url: body.document_url ? String(body.document_url).trim() : undefined,
    });

    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update leave application';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
