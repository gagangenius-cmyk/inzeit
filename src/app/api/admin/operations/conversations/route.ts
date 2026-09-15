import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import { sequelize, connectDB } from '@/lib/sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

let dbReady = false;
const ensureDB = async () => {
  if (!dbReady) { await connectDB(); dbReady = true; }
};

// The only wizards that actually have a real 'conversation' stage today (see
// stageFieldMap in each leads/*-operations-wizard.tsx). The 13 shell-based
// wizards have no conversation stage at all, so there's nothing to read for them.
const MODULES_WITH_CONVERSATIONS = ['skill-canada', 'skill-australia', 'poland-visa', 'eip-canada', 'visit-visa'];

// Field names for the conversation stage drift slightly between wizards
// (e.g. poland-visa uses conversationType/followupDate/status, the others use
// conversation_type/confollowdate/conversationStatus) - normalize here so the
// UI only deals with one shape.
function normalizeConversationData(raw: Record<string, unknown>) {
  return {
    conversationDate: (raw.conversationDate as string) || null,
    type: (raw.conversation_type as string) || (raw.conversationType as string) || '',
    status: (raw.conversationStatus as string) || (raw.status as string) || '',
    followUpDate: (raw.confollowdate as string) || (raw.followupDate as string) || null,
    text: (raw.conversation as string) || '',
    followUpRemarks: (raw.followupRemarks as string) || '',
  };
}

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request, ['operations.view', 'operations.manage']);
    if (isAuthError(auth)) return auth;
    await ensureDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || '';
    const limit = Math.min(Number.parseInt(searchParams.get('limit') || '100', 10) || 100, 500);

    const conditions = [`s.stage = 'conversation'`, `s.module IN (:modules)`];
    const replacements: Record<string, unknown> = { modules: MODULES_WITH_CONVERSATIONS, limit };

    if (search) {
      conditions.push(`(l.fname LIKE :search OR l.lname LIKE :search OR l.email LIKE :search OR l.mobile LIKE :search)`);
      replacements.search = `%${search}%`;
    }

    const rows = await sequelize.query<{
      id: number; module: string; leadId: number; opportunityId: number | null;
      stageData: string; updatedAt: string;
      fname: string | null; lname: string | null; email: string | null; mobile: string | null; phone: string | null;
      caseOfficerName: string | null;
    }>(
      `SELECT s.id, s.module, s.leadId, s.opportunityId, s.stageData, s.updatedAt,
              l.fname, l.lname, l.email, l.mobile, l.phone,
              e.name AS caseOfficerName
       FROM crm_operation_stage_data s
       INNER JOIN crm_forum_leads l ON l.id = s.leadId
       LEFT JOIN crm_employee e ON e.id = l.case_officer
       WHERE ${conditions.join(' AND ')}
       ORDER BY s.updatedAt DESC
       LIMIT :limit`,
      { replacements, type: QueryTypes.SELECT },
    );

    const data = rows.map((row) => {
      let parsed: Record<string, unknown> = {};
      try { parsed = JSON.parse(row.stageData); } catch { /* leave empty */ }
      const conversation = normalizeConversationData(parsed);
      return {
        id: row.id,
        module: row.module,
        leadId: row.leadId,
        opportunityId: row.opportunityId,
        leadName: [row.fname, row.lname].filter(Boolean).join(' ').trim() || `Lead ${row.leadId}`,
        email: row.email || '',
        phone: row.mobile || row.phone || '',
        caseOfficerName: row.caseOfficerName || '',
        updatedAt: row.updatedAt,
        conversation,
      };
    });

    return NextResponse.json({ success: true, count: data.length, data });
  } catch (error: unknown) {
    console.error('Failed to load operations conversations:', error);
    return NextResponse.json({ success: false, error: 'Failed to load conversations' }, { status: 500 });
  }
}
