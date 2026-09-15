import { NextRequest, NextResponse } from 'next/server';
import { CrmCallRequest, CrmcForumLeads, CrmEmployee } from '@/models';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { connectDB } from '@/lib/sequelize';

let dbReady = false;
const ensureDB = async () => {
  if (!dbReady) {
    await connectDB();
    dbReady = true;
  }
};

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['operations.view', 'operations.manage']);
  if (isAuthError(auth)) return auth;

  try {
    await ensureDB();
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number.parseInt(searchParams.get('limit') || '25', 10) || 25, 200);
    const branchId = searchParams.get('branch');

    const rows = await CrmCallRequest.findAll({
      where: branchId ? { branch_id: Number.parseInt(branchId, 10) } : undefined,
      include: [
        { model: CrmcForumLeads, as: 'lead', attributes: ['id', 'fname', 'lname'], required: false },
        { model: CrmEmployee, as: 'requestedByEmployee', attributes: ['id', 'name'], required: false },
      ],
      order: [['requested_at', 'DESC']],
      limit,
    });

    return NextResponse.json({ success: true, data: rows });
  } catch (error: any) {
    console.error('Failed to list call requests:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to list call requests' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request, ['operations.view', 'operations.manage']);
  if (isAuthError(auth)) return auth;

  try {
    await ensureDB();
    const body = await request.json();
    const branchId = Number.parseInt(String(body.branchId || ''), 10);
    if (!branchId) {
      return NextResponse.json({ success: false, error: 'branchId is required' }, { status: 400 });
    }

    const record = await CrmCallRequest.create({
      branch_id: branchId,
      lead_id: body.leadId ? Number.parseInt(String(body.leadId), 10) : null,
      opportunity_id: body.opportunityId ? Number.parseInt(String(body.opportunityId), 10) : null,
      requested_by: auth.id,
      assigned_to: body.assignedTo ? Number.parseInt(String(body.assignedTo), 10) : null,
      status: 'pending',
      is_high_escalation: body.isHighEscalation ? 1 : 0,
      notes: body.notes || null,
      created_by: auth.id,
    });

    return NextResponse.json({ success: true, data: record }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create call request:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to create call request' }, { status: 500 });
  }
}
