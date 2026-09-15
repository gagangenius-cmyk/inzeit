import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import { HRService } from '@/services/hr-service';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { isBranchManagerOrCeo, isCeo, canViewAllBranches } from '@/lib/roleChecks';
import { sequelize } from '@/lib/sequelize';

const attendanceStatuses = ['Present', 'Absent', 'Late', 'Half-Day', 'Leave', 'Holiday'] as const;
const attendanceSources = ['Manual', 'Biometric', 'Import'] as const;

const isValidStatus = (value: unknown): value is typeof attendanceStatuses[number] => (
  typeof value === 'string' && attendanceStatuses.includes(value as typeof attendanceStatuses[number])
);

const isValidSource = (value: unknown): value is typeof attendanceSources[number] => (
  typeof value === 'string' && attendanceSources.includes(value as typeof attendanceSources[number])
);

const validatePayload = (body: Record<string, unknown>) => {
  if (!body.employee_id) return 'employee_id is required';
  if (!body.date) return 'date is required';
  if (!isValidStatus(body.status)) return 'status must be Present, Absent, Late, Half-Day, Leave, or Holiday';
  if (!isValidSource(body.source)) return 'source must be Manual, Biometric, or Import';
  return null;
};

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['hr.view', 'hr.self']);
  if (isAuthError(auth)) return auth;
  try {
    const { searchParams } = new URL(request.url);

    // requireAuth's permission check is OR-matched, so an employee holding
    // only hr.self (not hr.view) still passed the check above - but this
    // route then trusted whatever employee_id/branch the client sent with
    // zero enforcement, letting any authenticated employee view any other
    // employee's (or any branch's) attendance/timesheet data just by
    // passing a different id. hr.self means "my own record only": force
    // employeeId to the caller and drop any branch filter for that tier.
    // hr.view holders get the real list, still branch-clamped unless they
    // have company-wide visibility - matching this same module's own
    // attendance-report route (companyWideRoleKeys) and every other
    // report in this app.
    const hasHrView = Boolean(auth.permissions?.includes('all') || auth.permissions?.includes('hr.view'));

    let employeeId = searchParams.get('employee_id') || undefined;
    let branch = searchParams.get('branch') || undefined;
    if (!hasHrView) {
      employeeId = String(auth.id);
      branch = undefined;
    } else if (!canViewAllBranches(auth)) {
      branch = String(auth.branch || 0);
    }

    const records = await HRService.listAttendanceRecords({
      employeeId,
      branch,
      dateFrom: searchParams.get('date_from') || undefined,
      dateTo: searchParams.get('date_to') || undefined,
      status: searchParams.get('status') || undefined,
      source: searchParams.get('source') || undefined,
      limit: Number.parseInt(searchParams.get('limit') || '100', 10),
    });

    return NextResponse.json({ data: records });
  } catch (error) {
    console.error('Failed to fetch HR attendance records:', error);
    return NextResponse.json({ error: 'Failed to fetch HR attendance records' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request, ['hr.create', 'hr.update']);
  if (isAuthError(auth)) return auth;
  try {
    const body = await request.json() as Record<string, unknown>;

    if (Array.isArray(body.records)) {
      const records = body.records as Array<Record<string, unknown>>;
      const invalid = records.map(validatePayload).find(Boolean);
      if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });

      const imported = await HRService.importBiometricAttendance(records.map((record) => ({
        employee_id: String(record.employee_id),
        date: String(record.date),
        check_in: record.check_in ? String(record.check_in) : null,
        check_out: record.check_out ? String(record.check_out) : null,
        status: record.status as 'Present' | 'Absent' | 'Late' | 'Half-Day' | 'Leave' | 'Holiday',
        overtime_hours: Number(record.overtime_hours || 0),
        source: record.source as 'Manual' | 'Biometric' | 'Import',
        notes: record.notes ? String(record.notes) : null,
        approved_by: record.approved_by ? String(record.approved_by) : null,
      })));

      return NextResponse.json({ data: imported }, { status: 201 });
    }

    const validationError = validatePayload(body);
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

    const created = await HRService.createAttendanceRecord({
      employee_id: String(body.employee_id),
      date: String(body.date),
      check_in: body.check_in ? String(body.check_in) : null,
      check_out: body.check_out ? String(body.check_out) : null,
      status: body.status as 'Present' | 'Absent' | 'Late' | 'Half-Day' | 'Leave' | 'Holiday',
      overtime_hours: Number(body.overtime_hours || 0),
      source: body.source as 'Manual' | 'Biometric' | 'Import',
      notes: body.notes ? String(body.notes) : null,
      approved_by: body.approved_by ? String(body.approved_by) : null,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Failed to create HR attendance record:', error);
    return NextResponse.json({ error: 'Failed to create HR attendance record' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = requireAuth(request, ['hr.update', 'hr.team.attendance_leave']);
  if (isAuthError(auth)) return auth;
  try {
    const body = await request.json() as Record<string, unknown>;
    if (!body.attendance_id) {
      return NextResponse.json({ error: 'attendance_id is required' }, { status: 400 });
    }

    if (body.status && !isValidStatus(body.status)) {
      return NextResponse.json({ error: 'Invalid attendance status' }, { status: 400 });
    }

    if (body.source && !isValidSource(body.source)) {
      return NextResponse.json({ error: 'Invalid attendance source' }, { status: 400 });
    }

    // Branch Manager may only edit attendance for staff in their own branch;
    // CEO is unrestricted. employee_id isn't always in the body (it's an
    // optional field on the update), so fall back to looking it up from the
    // existing record by attendance_id.
    if (isBranchManagerOrCeo(auth) && !isCeo(auth)) {
      let targetEmployeeId = body.employee_id ? String(body.employee_id) : null;
      if (!targetEmployeeId) {
        const [existingRow] = await sequelize.query<{ employee_id: string }>(
          'SELECT employee_id FROM crm_hr_attendance_records WHERE attendance_id = :attendanceId LIMIT 1',
          { replacements: { attendanceId: body.attendance_id }, type: QueryTypes.SELECT },
        );
        targetEmployeeId = existingRow?.employee_id ?? null;
      }
      if (targetEmployeeId) {
        const [employeeRow] = await sequelize.query<{ branch: number | null }>(
          'SELECT branch FROM crm_employee WHERE id = :employeeId LIMIT 1',
          { replacements: { employeeId: targetEmployeeId }, type: QueryTypes.SELECT },
        );
        if (employeeRow && employeeRow.branch !== null && Number(employeeRow.branch) !== Number(auth.branch || 0)) {
          return NextResponse.json({ error: 'You can only update attendance for staff in your own branch' }, { status: 403 });
        }
      }
    }

    const updated = await HRService.updateAttendanceRecord({
      attendance_id: String(body.attendance_id),
      employee_id: body.employee_id ? String(body.employee_id) : undefined,
      date: body.date ? String(body.date) : undefined,
      check_in: body.check_in ? String(body.check_in) : null,
      check_out: body.check_out ? String(body.check_out) : null,
      status: body.status as 'Present' | 'Absent' | 'Late' | 'Half-Day' | 'Leave' | 'Holiday' | undefined,
      overtime_hours: body.overtime_hours === undefined ? undefined : Number(body.overtime_hours || 0),
      source: body.source as 'Manual' | 'Biometric' | 'Import' | undefined,
      notes: body.notes ? String(body.notes) : null,
      approved_by: body.approved_by ? String(body.approved_by) : null,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update HR attendance record:', error);
    return NextResponse.json({ error: 'Failed to update HR attendance record' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = requireAuth(request, ['hr.delete']);
  if (isAuthError(auth)) return auth;
  try {
    const { searchParams } = new URL(request.url);
    const attendanceId = searchParams.get('attendance_id');
    if (!attendanceId) {
      return NextResponse.json({ error: 'attendance_id is required' }, { status: 400 });
    }
    await HRService.deleteAttendanceRecord(attendanceId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete HR attendance record:', error);
    return NextResponse.json({ error: 'Failed to delete HR attendance record' }, { status: 500 });
  }
}
