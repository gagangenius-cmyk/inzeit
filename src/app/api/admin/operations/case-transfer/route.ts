import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import { sequelize, connectDB } from '@/lib/sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { logLeadRemark } from '@/lib/leadRemarks';

let dbReady = false;
const ensureDB = async () => { if (!dbReady) { await connectDB(); dbReady = true; } };

// GET a lead's current case officer (for the transfer form to show "from").
export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['operations.case_transfer']);
  if (isAuthError(auth)) return auth;

  await ensureDB();
  const { searchParams } = new URL(request.url);
  const leadId = Number(searchParams.get('leadId'));
  if (!leadId) return NextResponse.json({ error: 'leadId is required' }, { status: 400 });

  const [row] = await sequelize.query(
    `SELECT l.id, TRIM(CONCAT(COALESCE(l.fname,''),' ',COALESCE(l.lname,''))) AS leadName,
            l.case_officer AS caseOfficerId, e.name AS caseOfficerName
     FROM crm_forum_leads l
     LEFT JOIN crm_employee e ON e.id = l.case_officer
     WHERE l.id = :leadId
     LIMIT 1`,
    { replacements: { leadId }, type: QueryTypes.SELECT }
  );

  if (!row) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  return NextResponse.json({ case: row });
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request, ['operations.case_transfer']);
  if (isAuthError(auth)) return auth;

  await ensureDB();
  const body = await request.json().catch(() => ({}));
  const leadId = Number(body.leadId);
  const toEmployeeId = Number(body.toEmployeeId);
  const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 255) : null;

  if (!leadId || !toEmployeeId) {
    return NextResponse.json({ error: 'leadId and toEmployeeId are required' }, { status: 400 });
  }

  const [current] = await sequelize.query<{ case_officer: number | null }>(
    `SELECT case_officer FROM crm_forum_leads WHERE id = :leadId LIMIT 1`,
    { replacements: { leadId }, type: QueryTypes.SELECT }
  );
  if (!current) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

  const [[fromEmployee], [toEmployee]] = await Promise.all([
    sequelize.query<{ name: string }>(`SELECT name FROM crm_employee WHERE id = :id LIMIT 1`, { replacements: { id: current.case_officer }, type: QueryTypes.SELECT }),
    sequelize.query<{ name: string }>(`SELECT name FROM crm_employee WHERE id = :id LIMIT 1`, { replacements: { id: toEmployeeId }, type: QueryTypes.SELECT }),
  ]);

  await sequelize.query(
    `UPDATE crm_forum_leads SET case_officer = :toEmployeeId WHERE id = :leadId`,
    { replacements: { toEmployeeId, leadId } }
  );

  await logLeadRemark({
    leadId,
    action: 'operations_case_transfer',
    remark: `Case transferred from ${fromEmployee?.name || 'Unassigned'} to ${toEmployee?.name || `#${toEmployeeId}`}${reason ? ` — ${reason}` : ''}`,
    previousValue: fromEmployee?.name || null,
    newValue: toEmployee?.name || String(toEmployeeId),
    actorId: auth.id,
    actorRole: auth.roleName,
  });

  return NextResponse.json({ success: true });
}
