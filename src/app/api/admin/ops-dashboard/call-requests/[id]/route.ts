import { NextRequest, NextResponse } from 'next/server';
import { CrmCallRequest } from '@/models';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { connectDB } from '@/lib/sequelize';

let dbReady = false;
const ensureDB = async () => {
  if (!dbReady) {
    await connectDB();
    dbReady = true;
  }
};

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(request, ['operations.view', 'operations.manage']);
  if (isAuthError(auth)) return auth;

  try {
    await ensureDB();
    const { id } = await params;
    const record = await CrmCallRequest.findByPk(Number.parseInt(id, 10));
    if (!record) {
      return NextResponse.json({ success: false, error: 'Call request not found' }, { status: 404 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};
    if (body.status) {
      updates.status = body.status;
      if (body.status === 'completed') updates.completed_at = new Date();
    }
    if (typeof body.isHighEscalation === 'boolean') {
      updates.is_high_escalation = body.isHighEscalation ? 1 : 0;
    }
    if (typeof body.notes === 'string') {
      updates.notes = body.notes;
    }

    await record.update(updates);
    return NextResponse.json({ success: true, data: record });
  } catch (error: any) {
    console.error('Failed to update call request:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to update call request' }, { status: 500 });
  }
}
