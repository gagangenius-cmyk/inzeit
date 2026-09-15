import { NextRequest, NextResponse } from 'next/server';
import { sequelize } from '@/lib/sequelize';
import { apiError, invalidRequest } from '@/lib/apiError';
import { QueryTypes } from 'sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { getClientIp } from '@/lib/rateLimiter';
import { ensureEmployeeAttendanceTable, CHECKED_IN_TODAY_SQL } from '@/lib/employeeAttendanceTable';
import { HRService } from '@/services/hr-service';

// crm_employee_attendance is shared with the real HR check-in/check-out
// system (src/app/api/admin/attendance/route.ts, src/models/CrmEmployeeAttendance.ts)
// - deliberately so, since the lead-assignment engine
// (src/lib/assignmentRuleEngine.ts / leadAutoAssignment.ts) reads the exact
// same "checkin=1, checkout=0 today" signal from this table to decide who's
// eligible for round-robin, so an admin's manual override here needs to look
// identical to a real check-in for that purpose. Table provisioning is now
// centralized in src/lib/employeeAttendanceTable.ts - this file, the admin
// CRUD, and leadAutoAssignment.ts each used to carry their own separate
// CREATE TABLE with different column sets.
const ensureAttendanceTable = async () => {
  await Promise.all([ensureEmployeeAttendanceTable(), HRService.ensureAttendanceRecordTable()]);
};

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['attendance.manage']);
  if (isAuthError(auth)) return auth;
  try {
    await ensureAttendanceTable();
    const branchId = Number.parseInt(new URL(request.url).searchParams.get('branchId') || '', 10);
    if (!branchId) return invalidRequest('branchId is required');
    // "present" mirrors CHECKED_IN_TODAY_SQL exactly - the same predicate
    // the round-robin engine uses to decide eligibility - so this admin
    // view never disagrees with what will actually happen to a new lead.
    const employees = await sequelize.query<{
      id: number; name: string; email: string | null; present: number;
    }>(`
      SELECT e.id, e.name, e.email,
        ${CHECKED_IN_TODAY_SQL} AS present
      FROM crm_employee e
      WHERE e.status = 1 AND e.branch = :branchId
      ORDER BY e.name ASC`, { replacements: { branchId }, type: QueryTypes.SELECT });
    return NextResponse.json({ success: true, branchId, data: employees });
  } catch (error: unknown) {
    return apiError(error, 'Unable to load employee availability');
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request, ['attendance.manage']);
  if (isAuthError(auth)) return auth;
  try {
    await ensureAttendanceTable();
    const body = await request.json();
    const employeeId = Number.parseInt(String(body.employeeId || body.emp_id || ''), 10);
    const present = body.present === true || body.present === 1 || body.present === 'true';
    if (!employeeId) return invalidRequest('employeeId is required');

    const rows = await sequelize.query<{ id: number }>(
      `SELECT id FROM crm_employee_attendance
       WHERE emp_id = :employeeId AND DATE(created) = CURDATE()
       ORDER BY id DESC LIMIT 1`,
      { replacements: { employeeId }, type: QueryTypes.SELECT },
    );
    if (rows[0]) {
      await sequelize.query(
        `UPDATE crm_employee_attendance
         SET checkin = :checkin, checkout = :checkout
         WHERE id = :id`,
        { replacements: { id: rows[0].id, checkin: present ? 1 : 0, checkout: present ? 0 : 1 } },
      );
    } else {
      // This table predates this route and (on this deployment) was created
      // with several NOT NULL columns that have no default - ip_address,
      // device, agent, login_time, logout_time, total_hours, short_fall,
      // watch_by, created_by, logout_ip_address, extra_hours. Omitting them
      // (as this INSERT used to) fails with "Field 'ip_address' doesn't have
      // a default value" on every employee's first toggle of the day. None
      // of these represent a real login, so they're filled with sentinel
      // values that make it obvious in the raw data this was an admin
      // override rather than the employee's own check-in.
      await sequelize.query(
        `INSERT INTO crm_employee_attendance (
           emp_id, ip_address, device, agent, login_time, logout_time,
           total_hours, short_fall, remarks, watch_by, created, created_by,
           checkin, checkout, logout_ip_address, extra_hours
         ) VALUES (
           :employeeId, :ipAddress, :device, :agent, NOW(), NOW(),
           0, 0, :remarks, :actorId, NOW(), :actorId,
           :checkin, :checkout, '', 0
         )`,
        {
          replacements: {
            employeeId,
            ipAddress: getClientIp(request),
            device: 'Admin Panel',
            agent: 'lead-assignment-availability',
            remarks: 'Manual presence override for lead assignment',
            actorId: auth.id,
            checkin: present ? 1 : 0,
            checkout: present ? 0 : 1,
          },
        },
      );
    }

    return NextResponse.json({ success: true, employeeId, present });
  } catch (error: unknown) {
    return apiError(error, 'Unable to update employee presence');
  }
}
