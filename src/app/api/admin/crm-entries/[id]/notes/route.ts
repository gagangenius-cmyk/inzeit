import { NextRequest, NextResponse } from 'next/server';
import { sequelize, connectDB } from '@/lib/sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

let dbReady = false;
const ensureDB = async () => { if (!dbReady) { await connectDB(); dbReady = true; } };

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const auth = requireAuth(request, ['operations.view', 'operations.manage']);
    if (isAuthError(auth)) return auth;
    await ensureDB();

    const { id } = await context.params;
    const entryId = Number.parseInt(id, 10);
    if (!entryId) return NextResponse.json({ success: false, error: 'Invalid entry id' }, { status: 400 });

    const body = await request.json();
    const note = String(body.note || '').trim();
    if (!note) return NextResponse.json({ success: false, error: 'note is required' }, { status: 400 });

    await sequelize.query(
      'INSERT INTO crm_crm_entry_notes (entry_id, note, created_by) VALUES (:entryId, :note, :createdBy)',
      { replacements: { entryId, note, createdBy: auth.id } },
    );

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: unknown) {
    console.error('Failed to add CRM entry note:', error);
    return NextResponse.json({ success: false, error: 'Failed to add note' }, { status: 500 });
  }
}
