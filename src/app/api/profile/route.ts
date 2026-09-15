import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import { sequelize, connectDB } from '@/lib/sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

let dbReady = false;
const ensureDB = async () => { if (!dbReady) { await connectDB(); dbReady = true; } };

const EDITABLE_FIELDS = ['name', 'mobile', 'cmobile', 'address', 'paddress', 'nationality', 'photo', 'em_local_name', 'em_local_number', 'em_home_name', 'em_home_number'] as const;

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (isAuthError(auth)) return auth;

  await ensureDB();
  const userId = auth.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [row] = await sequelize.query<any>(
    `SELECT
       e.id, e.name, e.email, e.cemail, e.mobile, e.cmobile, e.address, e.paddress,
       e.photo, e.nationality, e.EID, e.doj, e.gender, e.work_location,
       e.em_local_name, e.em_local_number, e.em_home_name, e.em_home_number,
       r.name AS roleName, b.branch AS branchName, reg.name AS regionName, d.name AS departmentName,
       m.name AS managerName, mr.name AS managerRoleName
     FROM crm_employee e
     LEFT JOIN crm_role r ON r.id = e.role
     LEFT JOIN crm_branch b ON b.id = e.branch
     LEFT JOIN crm_region reg ON reg.id = e.region
     LEFT JOIN crm_department d ON d.id = e.department
     LEFT JOIN crm_employee m ON m.id = e.manager_id
     LEFT JOIN crm_role mr ON mr.id = m.role
     WHERE e.id = :userId
     LIMIT 1`,
    { replacements: { userId }, type: QueryTypes.SELECT }
  );

  if (!row) return NextResponse.json({ error: 'Employee not found' }, { status: 404 });

  return NextResponse.json({ success: true, profile: row });
}

export async function PUT(request: NextRequest) {
  const auth = requireAuth(request);
  if (isAuthError(auth)) return auth;

  await ensureDB();
  const userId = auth.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const updates: Record<string, unknown> = {};
  for (const field of EDITABLE_FIELDS) {
    if (typeof body[field] === 'string') updates[field] = body[field].trim();
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No editable fields provided' }, { status: 400 });
  }

  const setClause = Object.keys(updates).map((field) => `${field} = :${field}`).join(', ');
  await sequelize.query(
    `UPDATE crm_employee SET ${setClause} WHERE id = :userId`,
    { replacements: { ...updates, userId } }
  );

  return NextResponse.json({ success: true });
}
