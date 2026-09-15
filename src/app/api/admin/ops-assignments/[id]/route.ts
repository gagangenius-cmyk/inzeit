import { NextRequest, NextResponse } from 'next/server';
import { CrmOpsAssignment } from '@/models';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { connectDB } from '@/lib/sequelize';

let dbReady = false;
const ensureDB = async () => {
  if (!dbReady) {
    await connectDB();
    dbReady = true;
  }
};

const ASSIGN_PERMISSIONS = ['operations.view', 'operations.manage', 'operations.assign_activities'];
const STATUSES = ['pending', 'in_progress', 'completed', 'cancelled'];

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(request, ASSIGN_PERMISSIONS);
  if (isAuthError(auth)) return auth;

  try {
    await ensureDB();
    const { id } = await params;
    const record = await CrmOpsAssignment.findByPk(Number.parseInt(id, 10));
    if (!record) {
      return NextResponse.json({ success: false, error: 'Assignment not found' }, { status: 404 });
    }

    const body = await request.json();
    const isParticipant = auth.id === record.assigned_to || auth.id === record.assigned_by;
    const canManage = auth.permissions?.includes('all') || auth.permissions?.includes('operations.manage');
    if (!isParticipant && !canManage) {
      return NextResponse.json({ success: false, error: 'You do not have permission to update this assignment' }, { status: 403 });
    }

    if (body.status !== undefined) {
      if (!STATUSES.includes(body.status)) {
        return NextResponse.json({ success: false, error: `status must be one of ${STATUSES.join(', ')}` }, { status: 400 });
      }
      record.status = body.status;
      record.completed_at = body.status === 'completed' ? new Date() : null;
    }
    if (typeof body.remark === 'string' && body.remark.trim()) {
      // Appended as a running log, not overwritten - "not reachable" today and
      // "confirmed, rescheduled" tomorrow are both worth keeping, not just the
      // latest one. Kept separate from `notes` (the original task/call
      // description set at creation) so logging an outcome never erases it.
      const statusLabel = (body.status !== undefined ? body.status : record.status).replace('_', ' ');
      const entry = `[${new Date().toLocaleString()}] ${statusLabel} — ${body.remark.trim()}`;
      record.outcome_remark = record.outcome_remark ? `${record.outcome_remark}\n${entry}` : entry;
    }
    if (body.assignedTo !== undefined) {
      const assignedTo = Number.parseInt(String(body.assignedTo), 10);
      if (!assignedTo) {
        return NextResponse.json({ success: false, error: 'assignedTo must be a valid employee id' }, { status: 400 });
      }
      record.assigned_to = assignedTo;
    }
    if (body.title !== undefined) record.title = String(body.title).trim();
    if (body.notes !== undefined) record.notes = body.notes || null;
    if (body.dueAt !== undefined) record.due_at = body.dueAt ? new Date(body.dueAt) : null;

    await record.save();

    return NextResponse.json({ success: true, data: record });
  } catch (error: any) {
    console.error('Failed to update ops assignment:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to update assignment' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(request, ASSIGN_PERMISSIONS);
  if (isAuthError(auth)) return auth;

  try {
    await ensureDB();
    const { id } = await params;
    const record = await CrmOpsAssignment.findByPk(Number.parseInt(id, 10));
    if (!record) {
      return NextResponse.json({ success: false, error: 'Assignment not found' }, { status: 404 });
    }

    const canManage = auth.permissions?.includes('all') || auth.permissions?.includes('operations.manage');
    if (auth.id !== record.assigned_by && !canManage) {
      return NextResponse.json({ success: false, error: 'Only the assigner (or an Operations manager) can delete this assignment' }, { status: 403 });
    }

    await record.destroy();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete ops assignment:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to delete assignment' }, { status: 500 });
  }
}
