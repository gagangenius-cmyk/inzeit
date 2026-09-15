import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import { sequelize, connectDB } from '@/lib/sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { pushChatMessage } from '@/lib/pusherServer';

let dbReady = false;
const ensureDB = async () => { if (!dbReady) { await connectDB(); dbReady = true; } };

// Staff-side view of the same two-way crm_client_conversations channel the
// client portal reads/writes via /api/clientportal/[opportunityId]/conversation
// (see ClientPortalProductService.listConversation/postStaffMessage). That
// route requires a client session and can't be called from the staff admin
// UI, and postStaffMessage had no staff-facing route at all until now.
export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request, ['operations.view', 'operations.manage']);
    if (isAuthError(auth)) return auth;
    await ensureDB();

    const { searchParams } = new URL(request.url);
    const leadId = Number.parseInt(searchParams.get('leadId') || '', 10);
    const opportunityId = searchParams.get('opportunityId') ? Number.parseInt(searchParams.get('opportunityId')!, 10) : null;
    if (!leadId) return NextResponse.json({ success: false, error: 'leadId is required' }, { status: 400 });

    const conditions = ['leadId = :leadId'];
    const replacements: Record<string, unknown> = { leadId };
    if (opportunityId) { conditions.push('opportunity_id = :opportunityId'); replacements.opportunityId = opportunityId; }

    const messages = await sequelize.query<{ id: number; text: string; file: string | null; chat_from_client: number; created: string }>(
      `SELECT id, text, file, chat_from_client, created FROM crm_client_conversations
       WHERE ${conditions.join(' AND ')} ORDER BY created ASC`,
      { replacements, type: QueryTypes.SELECT },
    );

    await sequelize.query(
      `UPDATE crm_client_conversations SET read_msg = 1 WHERE ${conditions.join(' AND ')} AND chat_from_client = 1`,
      { replacements },
    );

    return NextResponse.json({
      success: true,
      messages: messages.map((m) => ({ id: m.id, text: m.text, file: m.file || null, fromClient: m.chat_from_client === 1, created: m.created })),
    });
  } catch (error: unknown) {
    console.error('Failed to load client chat:', error);
    return NextResponse.json({ success: false, error: 'Failed to load client chat' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request, ['operations.view', 'operations.manage']);
    if (isAuthError(auth)) return auth;
    await ensureDB();

    const body = await request.json();
    const leadId = Number.parseInt(String(body.leadId || ''), 10);
    const opportunityId = body.opportunityId ? Number.parseInt(String(body.opportunityId), 10) : null;
    const text = String(body.text || '').trim();
    if (!leadId) return NextResponse.json({ success: false, error: 'leadId is required' }, { status: 400 });
    if (!text) return NextResponse.json({ success: false, error: 'text is required' }, { status: 400 });

    const [result] = await sequelize.query(
      `INSERT INTO crm_client_conversations (leadId, opportunity_id, case_manager, chat_from_client, client_id, text, file, status, read_msg)
       VALUES (:leadId, :opportunityId, :caseManager, 0, :leadId, :text, '', 1, 0)`,
      { replacements: { leadId, opportunityId, caseManager: auth.id, text } },
    );

    if (opportunityId) {
      await pushChatMessage(opportunityId, {
        id: Number((result as { insertId?: number })?.insertId || 0),
        text,
        file: null,
        fromClient: false,
        created: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: unknown) {
    console.error('Failed to send client chat message:', error);
    return NextResponse.json({ success: false, error: 'Failed to send message' }, { status: 500 });
  }
}
