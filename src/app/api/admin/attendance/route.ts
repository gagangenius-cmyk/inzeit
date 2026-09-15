import { NextResponse } from 'next/server';
import { Op, QueryTypes } from 'sequelize';
import { CrmEmployeeAttendance } from '@/models';
import { createCrudHandlers } from '@/lib/apiCrud';
import { sequelize } from '@/lib/sequelize';
import { isBranchManagerOrCeo, isCeo } from '@/lib/roleChecks';
import { ensureEmployeeAttendanceTable } from '@/lib/employeeAttendanceTable';

const ensureAttendanceTable = ensureEmployeeAttendanceTable;

const handlers = createCrudHandlers({
  model: CrmEmployeeAttendance,
  entityName: 'attendance record',
  searchFields: ['emp_id', 'ip_address', 'device'],
  // This CRUD config previously had no requiredPermissions at all, so any
  // authenticated user could create/edit any employee's raw attendance row.
  requiredPermissions: ['attendance.manage', 'hr.team.attendance_leave'],
  statusFilter: (status) => {
    if (status === 'complete') return { checkin: 1, checkout: 1 };
    if (status === 'checkedin') return { checkin: 1, checkout: 0 };
    return {};
  },
  defaults: (body) => ({
    created: body.created || new Date(),
    created_by: body.created_by || 1,
  }),
  before: ensureAttendanceTable,
  // crm_employee_attendance has no branch column of its own (only emp_id), so
  // Branch Manager's scope is resolved via a subquery of their branch's
  // employee ids - CEO sees everything, everyone else only their own rows.
  listScope: async (auth) => {
    if (isCeo(auth)) return null;
    if (isBranchManagerOrCeo(auth)) {
      const employeeRows = await sequelize.query<{ id: number }>(
        'SELECT id FROM crm_employee WHERE branch = :branch',
        { replacements: { branch: auth.branch || 0 }, type: QueryTypes.SELECT },
      );
      const ids = employeeRows.map((r) => r.id);
      return { emp_id: { [Op.in]: ids.length ? ids : [-1] } };
    }
    return { emp_id: auth.id };
  },
  // Branch Manager may only edit attendance for staff in their own branch;
  // CEO is unrestricted.
  beforeUpdate: async (record, auth) => {
    if (isBranchManagerOrCeo(auth) && !isCeo(auth)) {
      const empId = record.get('emp_id');
      if (empId) {
        const [employeeRow] = await sequelize.query<{ branch: number | null }>(
          'SELECT branch FROM crm_employee WHERE id = :empId LIMIT 1',
          { replacements: { empId }, type: QueryTypes.SELECT },
        );
        if (employeeRow && employeeRow.branch !== null && Number(employeeRow.branch) !== Number(auth.branch || 0)) {
          return NextResponse.json({ error: 'You can only update attendance for staff in your own branch' }, { status: 403 });
        }
      }
    }
    return null;
  },
});

export const GET = handlers.GET;
export const POST = handlers.POST;
export const PUT = handlers.PUT;
export const DELETE = handlers.DELETE;
