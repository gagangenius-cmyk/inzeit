import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import { HRService, type HRLeaveType } from '@/services/hr-service';
import { sequelize } from '@/lib/sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { getActiveLeaveTypeNames } from '@/lib/leaveTypes';
import { isBranchManagerOrCeo, isCeo } from '@/lib/roleChecks';

const reviewStatuses = ['Approved', 'Rejected', 'Cancelled'] as const;

type ReviewStatus = typeof reviewStatuses[number];

const isReviewStatus = (value: unknown): value is ReviewStatus => (
  typeof value === 'string' && reviewStatuses.includes(value as ReviewStatus)
);

const readString = (body: Record<string, unknown>, key: string) => (
  body[key] === undefined || body[key] === null ? '' : String(body[key]).trim()
);

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['hr.view', 'hr.self']);
  if (isAuthError(auth)) return auth;
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employee_id') || undefined;
    const year = Number.parseInt(searchParams.get('year') || String(new Date().getFullYear()), 10);
    const requests = await HRService.listLeaveManagementRequests({
      employeeId,
      status: searchParams.get('status') || undefined,
      year,
      limit: Number.parseInt(searchParams.get('limit') || '100', 10),
    });
    const balances = await HRService.getLeaveBalances(employeeId, year);

    return NextResponse.json({
      requests,
      balances,
      entitlements: HRService.getLeaveEntitlements(),
      legalBasis: 'UAE Labour Law leave entitlement tracking',
    });
  } catch (error) {
    console.error('Failed to fetch HR leave management data:', error);
    return NextResponse.json({ error: 'Failed to fetch HR leave management data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request, ['hr.create', 'hr.self']);
  if (isAuthError(auth)) return auth;
  try {
    const body = await request.json() as Record<string, unknown>;
    const employeeId = readString(body, 'employee_id');
    const startDate = readString(body, 'start_date');
    const endDate = readString(body, 'end_date');

    const leaveTypes = await getActiveLeaveTypeNames();
    const leaveType = typeof body.leave_type === 'string' ? body.leave_type : '';

    if (!employeeId) return NextResponse.json({ error: 'employee_id is required' }, { status: 400 });
    if (!leaveTypes.includes(leaveType)) return NextResponse.json({ error: 'leave_type is invalid' }, { status: 400 });
    if (!startDate) return NextResponse.json({ error: 'start_date is required' }, { status: 400 });
    if (!endDate) return NextResponse.json({ error: 'end_date is required' }, { status: 400 });

    const created = await HRService.applyLeave({
      employee_id: employeeId,
      manager_id: readString(body, 'manager_id') || null,
      leave_type: leaveType as HRLeaveType,
      start_date: startDate,
      end_date: endDate,
      reason: readString(body, 'reason') || null,
      document_url: readString(body, 'document_url') || null,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to apply HR leave';
    console.error('Failed to apply HR leave:', error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = requireAuth(request, ['hr.update', 'hr.team.attendance_leave']);
  if (isAuthError(auth)) return auth;
  try {
    const body = await request.json() as Record<string, unknown>;
    const leaveId = readString(body, 'leave_id');
    const stage = readString(body, 'stage') || 'hr';

    if (!leaveId) return NextResponse.json({ error: 'leave_id is required' }, { status: 400 });

    // A leave request can never be approved/rejected by the same employee it
    // was filed for, regardless of what manager_id/reviewed_by the client
    // sends — otherwise someone with both hr.self (file leave) and
    // hr.team.attendance_leave (approve leave) could rubber-stamp their own request.
    const [leaveRow] = await sequelize.query<{ employee_id: string; branch: number | null }>(
      `SELECT r.employee_id, e.branch
       FROM crm_hr_leave_requests r
       LEFT JOIN crm_employee e ON e.id = r.employee_id
       WHERE r.leave_id = :leaveId LIMIT 1`,
      { replacements: { leaveId }, type: QueryTypes.SELECT }
    );
    if (leaveRow && String(leaveRow.employee_id) === String(auth.id)) {
      return NextResponse.json({ error: 'You cannot approve or reject your own leave request' }, { status: 403 });
    }

    if (stage === 'manager') {
      const managerStatus = body.manager_status;
      if (managerStatus !== 'Approved' && managerStatus !== 'Rejected') {
        return NextResponse.json({ error: 'manager_status must be Approved or Rejected' }, { status: 400 });
      }

      // Branch Manager may only approve leave for staff in their own branch;
      // CEO is unrestricted. hr.team.attendance_leave is specifically the
      // permission BM holds for this "auto-assigned manager" review stage.
      if (isBranchManagerOrCeo(auth) && !isCeo(auth)) {
        if (leaveRow && leaveRow.branch !== null && Number(leaveRow.branch) !== Number(auth.branch || 0)) {
          return NextResponse.json({ error: 'You can only approve or reject leave for staff in your own branch' }, { status: 403 });
        }
      }

      const updated = await HRService.reviewLeaveByManager({
        leave_id: leaveId,
        manager_status: managerStatus,
        manager_id: readString(body, 'manager_id') || null,
        manager_comment: readString(body, 'manager_comment') || null,
      });

      return NextResponse.json(updated);
    }

    if (!isReviewStatus(body.status)) return NextResponse.json({ error: 'status must be Approved, Rejected, or Cancelled' }, { status: 400 });

    const updated = await HRService.reviewLeave({
      leave_id: leaveId,
      status: body.status,
      reviewed_by: readString(body, 'reviewed_by') || null,
      review_notes: readString(body, 'review_notes') || null,
    });

    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to review HR leave';
    console.error('Failed to review HR leave:', error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// Comp Off has no automatic accrual (see HRService.syncLeaveBalance) - this
// is the only way its balance becomes non-zero. Gated to hr.update (not
// hr.team.attendance_leave) so the manager-tier roles that can approve their
// team's leave don't also gain the ability to grant arbitrary paid-leave days.
export async function PATCH(request: NextRequest) {
  const auth = requireAuth(request, ['hr.update']);
  if (isAuthError(auth)) return auth;
  try {
    const body = await request.json() as Record<string, unknown>;
    const employeeId = readString(body, 'employee_id');
    const days = Number(body.days);
    const year = Number.parseInt(String(body.year || new Date().getFullYear()), 10);

    if (!employeeId) return NextResponse.json({ error: 'employee_id is required' }, { status: 400 });
    if (!Number.isFinite(days) || days <= 0) return NextResponse.json({ error: 'days must be a positive number' }, { status: 400 });

    const balances = await HRService.creditCompensatoryLeave(employeeId, days, year);
    return NextResponse.json({ balances });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to credit Comp Off days';
    console.error('Failed to credit Comp Off days:', error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = requireAuth(request, ['hr.delete']);
  if (isAuthError(auth)) return auth;
  try {
    const { searchParams } = new URL(request.url);
    const leaveId = searchParams.get('leave_id');
    if (!leaveId) {
      return NextResponse.json({ error: 'leave_id is required' }, { status: 400 });
    }
    await HRService.deleteLeaveRequest(leaveId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete HR leave request:', error);
    return NextResponse.json({ error: 'Failed to delete HR leave request' }, { status: 500 });
  }
}
