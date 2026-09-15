import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import { sequelize, connectDB } from '@/lib/sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { getModulePermissionsForRole } from '@/lib/modulePermissions';

let dbReady = false;
const ensureDB = async () => { if (!dbReady) { await connectDB(); dbReady = true; } };

// GET recent access-log entries (audit trail for freeze/restore actions).
export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['operations.access_control']);
  if (isAuthError(auth)) return auth;

  await ensureDB();
  const rows = await sequelize.query(
    `SELECT log.id, log.employee_id AS employeeId, emp.name AS employeeName, log.action, log.reason,
            log.actor_id AS actorId, actor.name AS actorName, log.created_at AS createdAt
     FROM crm_employee_access_log log
     LEFT JOIN crm_employee emp ON emp.id = log.employee_id
     LEFT JOIN crm_employee actor ON actor.id = log.actor_id
     ORDER BY log.created_at DESC
     LIMIT 25`,
    { type: QueryTypes.SELECT }
  );

  return NextResponse.json({ log: rows });
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request, ['operations.access_control']);
  if (isAuthError(auth)) return auth;

  await ensureDB();
  const body = await request.json().catch(() => ({}));
  const employeeId = Number(body.employeeId);
  const action = body.action;
  const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 255) : null;

  if (!employeeId) return NextResponse.json({ error: 'employeeId is required' }, { status: 400 });
  if (action !== 'freeze' && action !== 'restore') {
    return NextResponse.json({ error: "action must be 'freeze' or 'restore'" }, { status: 400 });
  }
  if (employeeId === auth.id) {
    return NextResponse.json({ error: 'You cannot freeze or restore your own access' }, { status: 400 });
  }

  const [target] = await sequelize.query<{ id: number; name: string; role: number; status: number }>(
    `SELECT id, name, role, status FROM crm_employee WHERE id = :employeeId LIMIT 1`,
    { replacements: { employeeId }, type: QueryTypes.SELECT }
  );
  if (!target) return NextResponse.json({ error: 'Employee not found' }, { status: 404 });

  const [roleRow] = await sequelize.query<{ name: string; type: string | null }>(
    `SELECT name, type FROM crm_role WHERE id = :roleId LIMIT 1`,
    { replacements: { roleId: target.role }, type: QueryTypes.SELECT }
  );
  const targetPermissions = getModulePermissionsForRole({ roleId: target.role, roleName: roleRow?.name, roleType: roleRow?.type });
  if (targetPermissions.permissions.includes('all')) {
    return NextResponse.json({ error: 'This user holds full admin access and cannot be restricted from here.' }, { status: 403 });
  }

  await sequelize.query(
    `UPDATE crm_employee SET status = :status WHERE id = :employeeId`,
    { replacements: { status: action === 'freeze' ? 0 : 1, employeeId } }
  );

  await sequelize.query(
    `INSERT INTO crm_employee_access_log (employee_id, action, reason, actor_id) VALUES (:employeeId, :logAction, :reason, :actorId)`,
    { replacements: { employeeId, logAction: action === 'freeze' ? 'frozen' : 'restored', reason, actorId: auth.id } }
  );

  return NextResponse.json({ success: true });
}
