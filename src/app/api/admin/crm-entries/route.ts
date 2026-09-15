import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import { sequelize, connectDB } from '@/lib/sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

let dbReady = false;
const ensureDB = async () => { if (!dbReady) { await connectDB(); dbReady = true; } };

const ENTRY_STATUSES = ['initial_contact', 'qualification', 'consultation', 'proposal', 'agreement', 'onboarding', 'completed'];
const URGENCY_LEVELS = ['low', 'medium', 'high'];

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request, ['operations.view', 'operations.manage']);
    if (isAuthError(auth)) return auth;
    await ensureDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || '';
    const status = searchParams.get('status')?.trim() || '';
    const limit = Math.min(Number.parseInt(searchParams.get('limit') || '100', 10) || 100, 500);

    const conditions: string[] = [];
    const replacements: Record<string, unknown> = { limit };

    if (search) {
      conditions.push('(l.fname LIKE :search OR l.lname LIKE :search OR l.email LIKE :search OR l.mobile LIKE :search OR c.service LIKE :search)');
      replacements.search = `%${search}%`;
    }
    if (status) {
      conditions.push('c.status = :status');
      replacements.status = status;
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const rows = await sequelize.query(
      `SELECT
        c.id, c.leadId, c.opportunityId, c.entry_type, c.source, c.category, c.sub_category,
        c.service, c.budget, c.timeline, c.expectations, c.urgency, c.status,
        c.assigned_to, c.created_by, c.created_at, c.updated_at,
        l.fname, l.lname, l.email, l.mobile, l.phone,
        e.name AS assignedToName,
        (SELECT COUNT(*) FROM crm_crm_entry_documents d WHERE d.entry_id = c.id) AS documentCount,
        (SELECT COUNT(*) FROM crm_crm_entry_documents d WHERE d.entry_id = c.id AND d.status = 'approved') AS documentApprovedCount,
        (SELECT COUNT(*) FROM crm_crm_entry_milestones m WHERE m.entry_id = c.id) AS milestoneCount,
        (SELECT COUNT(*) FROM crm_crm_entry_milestones m WHERE m.entry_id = c.id AND m.status = 'completed') AS milestoneCompletedCount
       FROM crm_crm_entries c
       INNER JOIN crm_forum_leads l ON l.id = c.leadId
       LEFT JOIN crm_employee e ON e.id = c.assigned_to
       ${where}
       ORDER BY c.updated_at DESC
       LIMIT :limit`,
      { replacements, type: QueryTypes.SELECT },
    );

    return NextResponse.json({ success: true, count: rows.length, data: rows });
  } catch (error: unknown) {
    console.error('Failed to list CRM entries:', error);
    return NextResponse.json({ success: false, error: 'Failed to load CRM entries' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request, ['operations.view', 'operations.manage']);
    if (isAuthError(auth)) return auth;
    await ensureDB();

    const body = await request.json();
    const leadId = Number.parseInt(String(body.leadId || ''), 10);
    if (!leadId) return NextResponse.json({ success: false, error: 'leadId is required' }, { status: 400 });

    const [lead] = await sequelize.query<{ id: number }>(
      'SELECT id FROM crm_forum_leads WHERE id = :leadId LIMIT 1',
      { replacements: { leadId }, type: QueryTypes.SELECT },
    );
    if (!lead) return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });

    const status = ENTRY_STATUSES.includes(body.status) ? body.status : 'initial_contact';
    const urgency = URGENCY_LEVELS.includes(body.urgency) ? body.urgency : 'medium';
    const opportunityId = body.opportunityId ? Number.parseInt(String(body.opportunityId), 10) : null;

    const insertResult = await sequelize.query(
      `INSERT INTO crm_crm_entries
        (leadId, opportunityId, entry_type, source, category, sub_category, service, budget, timeline, expectations, urgency, status, assigned_to, created_by)
       VALUES
        (:leadId, :opportunityId, :entryType, :source, :category, :subCategory, :service, :budget, :timeline, :expectations, :urgency, :status, :assignedTo, :createdBy)`,
      {
        replacements: {
          leadId,
          opportunityId,
          entryType: body.entry_type || body.entryType || 'Direct Inquiry',
          source: body.source || null,
          category: body.category || null,
          subCategory: body.sub_category || body.subCategory || null,
          service: body.service || null,
          budget: body.budget || null,
          timeline: body.timeline || null,
          expectations: body.expectations || null,
          urgency,
          status,
          assignedTo: body.assigned_to || body.assignedTo || null,
          createdBy: auth.id,
        },
        type: QueryTypes.INSERT,
      },
    );
    const entryId = Array.isArray(insertResult) ? insertResult[0] : insertResult;

    const requirements: string[] = Array.isArray(body.requirements) ? body.requirements.filter(Boolean) : [];
    for (const requirement of requirements) {
      await sequelize.query(
        'INSERT INTO crm_crm_entry_requirements (entry_id, requirement) VALUES (:entryId, :requirement)',
        { replacements: { entryId, requirement: String(requirement).slice(0, 500) } },
      );
    }

    return NextResponse.json({ success: true, id: entryId }, { status: 201 });
  } catch (error: unknown) {
    console.error('Failed to create CRM entry:', error);
    return NextResponse.json({ success: false, error: 'Failed to create CRM entry' }, { status: 500 });
  }
}
