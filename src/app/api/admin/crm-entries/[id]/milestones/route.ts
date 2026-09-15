import { NextRequest, NextResponse } from 'next/server';
import { sequelize, connectDB } from '@/lib/sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

let dbReady = false;
const ensureDB = async () => { if (!dbReady) { await connectDB(); dbReady = true; } };

type RouteContext = { params: Promise<{ id: string }> };
const MILESTONE_STATUSES = ['pending', 'in_progress', 'completed'];

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const auth = requireAuth(request, ['operations.view', 'operations.manage']);
    if (isAuthError(auth)) return auth;
    await ensureDB();

    const { id } = await context.params;
    const entryId = Number.parseInt(id, 10);
    if (!entryId) return NextResponse.json({ success: false, error: 'Invalid entry id' }, { status: 400 });

    const body = await request.json();
    const phase = String(body.phase || '').trim();
    if (!phase) return NextResponse.json({ success: false, error: 'phase is required' }, { status: 400 });
    const status = MILESTONE_STATUSES.includes(body.status) ? body.status : 'pending';

    await sequelize.query(
      `INSERT INTO crm_crm_entry_milestones (entry_id, phase, status, due_date, completed_date, notes)
       VALUES (:entryId, :phase, :status, :dueDate, :completedDate, :notes)`,
      {
        replacements: {
          entryId, phase, status,
          dueDate: body.due_date || body.dueDate || null,
          completedDate: status === 'completed' ? (body.completed_date || body.completedDate || new Date().toISOString().slice(0, 10)) : null,
          notes: body.notes || null,
        },
      },
    );

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: unknown) {
    console.error('Failed to create CRM entry milestone:', error);
    return NextResponse.json({ success: false, error: 'Failed to create milestone' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const auth = requireAuth(request, ['operations.view', 'operations.manage']);
    if (isAuthError(auth)) return auth;
    await ensureDB();

    const { id } = await context.params;
    const entryId = Number.parseInt(id, 10);
    if (!entryId) return NextResponse.json({ success: false, error: 'Invalid entry id' }, { status: 400 });

    const body = await request.json();
    const milestoneId = Number.parseInt(String(body.milestone_id || body.milestoneId || ''), 10);
    if (!milestoneId) return NextResponse.json({ success: false, error: 'milestone_id is required' }, { status: 400 });
    if (body.status !== undefined && !MILESTONE_STATUSES.includes(body.status)) {
      return NextResponse.json({ success: false, error: `status must be one of: ${MILESTONE_STATUSES.join(', ')}` }, { status: 400 });
    }

    await sequelize.query(
      `UPDATE crm_crm_entry_milestones
       SET status = COALESCE(:status, status),
           notes = COALESCE(:notes, notes),
           completed_date = CASE WHEN :status = 'completed' THEN COALESCE(completed_date, CURDATE()) ELSE completed_date END,
           updated_at = NOW()
       WHERE id = :milestoneId AND entry_id = :entryId`,
      { replacements: { milestoneId, entryId, status: body.status ?? null, notes: body.notes ?? null } },
    );

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Failed to update CRM entry milestone:', error);
    return NextResponse.json({ success: false, error: 'Failed to update milestone' }, { status: 500 });
  }
}
