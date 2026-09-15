import { NextRequest, NextResponse } from 'next/server';
import { CrmOpsAssignment, CrmEmployee, CrmcForumLeads } from '@/models';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { connectDB } from '@/lib/sequelize';
import { Op, type WhereOptions } from 'sequelize';
import type { CrmOpsAssignmentAttributes } from '@/models';

let dbReady = false;
const ensureDB = async () => {
  if (!dbReady) {
    await connectDB();
    dbReady = true;
  }
};

const ASSIGN_PERMISSIONS = ['operations.view', 'operations.manage', 'operations.assign_activities'];
const ASSIGNMENT_TYPES = ['call', 'task', 'appointment'];

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ASSIGN_PERMISSIONS);
  if (isAuthError(auth)) return auth;

  try {
    await ensureDB();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || '';
    const status = searchParams.get('status') || '';
    const scope = searchParams.get('scope') || 'mine'; // 'mine' | 'assignedByMe' | 'all'
    const limit = Math.min(Number.parseInt(searchParams.get('limit') || '100', 10) || 100, 500);

    const filters: WhereOptions<CrmOpsAssignmentAttributes>[] = [];
    if (ASSIGNMENT_TYPES.includes(type)) filters.push({ type: type as CrmOpsAssignmentAttributes['type'] });
    if (status) filters.push({ status });

    if (scope === 'assignedByMe') {
      filters.push({ assigned_by: auth.id });
    } else if (scope === 'all') {
      // No employee filter - relies on the caller already holding operations.manage
      // or higher; requireAuth above only confirms module access, not scope, so this
      // branch intentionally stays available to any role that already got past it,
      // matching this module's existing "no extra canViewAll tier" list endpoints.
    } else {
      // 'mine' = assigned TO me, mirroring the "Assigned to Me" tab label -
      // 'assignedByMe' already covers the other direction, so combining both
      // here (as an earlier version of this filter did) made the two tabs
      // show overlapping, confusing results.
      filters.push({ assigned_to: auth.id });
    }

    const where: WhereOptions<CrmOpsAssignmentAttributes> = filters.length ? { [Op.and]: filters } : {};

    const rows = await CrmOpsAssignment.findAll({
      where,
      include: [
        { model: CrmEmployee, as: 'assignedToEmployee', attributes: ['id', 'name', 'email'], required: false },
        { model: CrmEmployee, as: 'assignedByEmployee', attributes: ['id', 'name', 'email'], required: false },
        { model: CrmcForumLeads, as: 'lead', attributes: ['id', 'fname', 'lname'], required: false },
      ],
      order: [['created_at', 'DESC']],
      limit,
    });

    return NextResponse.json({ success: true, count: rows.length, data: rows });
  } catch (error: any) {
    console.error('Failed to list ops assignments:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to list assignments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request, ASSIGN_PERMISSIONS);
  if (isAuthError(auth)) return auth;

  try {
    await ensureDB();
    const body = await request.json();

    const type = String(body.type || '');
    if (!ASSIGNMENT_TYPES.includes(type)) {
      return NextResponse.json({ success: false, error: 'type must be one of call, task, appointment' }, { status: 400 });
    }
    const title = String(body.title || '').trim();
    if (!title) {
      return NextResponse.json({ success: false, error: 'title is required' }, { status: 400 });
    }
    const assignedTo = Number.parseInt(String(body.assignedTo || ''), 10);
    if (!assignedTo) {
      return NextResponse.json({ success: false, error: 'assignedTo is required' }, { status: 400 });
    }

    const record = await CrmOpsAssignment.create({
      type: type as 'call' | 'task' | 'appointment',
      title,
      notes: body.notes || null,
      lead_id: body.leadId ? Number.parseInt(String(body.leadId), 10) : null,
      opportunity_id: body.opportunityId ? Number.parseInt(String(body.opportunityId), 10) : null,
      assigned_to: assignedTo,
      assigned_by: auth.id,
      due_at: body.dueAt ? new Date(body.dueAt) : null,
      status: 'pending',
    });

    return NextResponse.json({ success: true, data: record }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create ops assignment:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to create assignment' }, { status: 500 });
  }
}
