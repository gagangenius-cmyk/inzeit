import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import { sequelize, connectDB } from '@/lib/sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

let dbReady = false;
const ensureDB = async () => { if (!dbReady) { await connectDB(); dbReady = true; } };

type RouteContext = { params: Promise<{ id: string }> };

const ENTRY_STATUSES = ['initial_contact', 'qualification', 'consultation', 'proposal', 'agreement', 'onboarding', 'completed'];
const URGENCY_LEVELS = ['low', 'medium', 'high'];

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const auth = requireAuth(request, ['operations.view', 'operations.manage']);
    if (isAuthError(auth)) return auth;
    await ensureDB();

    const { id } = await context.params;
    const entryId = Number.parseInt(id, 10);
    if (!entryId) return NextResponse.json({ success: false, error: 'Invalid entry id' }, { status: 400 });

    const [entry] = await sequelize.query(
      `SELECT c.*, l.fname, l.lname, l.email, l.mobile, l.phone, e.name AS assignedToName
       FROM crm_crm_entries c
       INNER JOIN crm_forum_leads l ON l.id = c.leadId
       LEFT JOIN crm_employee e ON e.id = c.assigned_to
       WHERE c.id = :entryId LIMIT 1`,
      { replacements: { entryId }, type: QueryTypes.SELECT },
    );
    if (!entry) return NextResponse.json({ success: false, error: 'CRM entry not found' }, { status: 404 });

    const requirements = await sequelize.query(
      'SELECT id, requirement, created_at FROM crm_crm_entry_requirements WHERE entry_id = :entryId ORDER BY id ASC',
      { replacements: { entryId }, type: QueryTypes.SELECT },
    );
    const documents = await sequelize.query(
      'SELECT id, document_type, status, file_url, created_at, updated_at FROM crm_crm_entry_documents WHERE entry_id = :entryId ORDER BY id ASC',
      { replacements: { entryId }, type: QueryTypes.SELECT },
    );
    const milestones = await sequelize.query(
      'SELECT id, phase, status, due_date, completed_date, notes, created_at, updated_at FROM crm_crm_entry_milestones WHERE entry_id = :entryId ORDER BY id ASC',
      { replacements: { entryId }, type: QueryTypes.SELECT },
    );
    const notes = await sequelize.query(
      `SELECT n.id, n.note, n.created_at, e.name AS createdByName
       FROM crm_crm_entry_notes n LEFT JOIN crm_employee e ON e.id = n.created_by
       WHERE n.entry_id = :entryId ORDER BY n.id DESC`,
      { replacements: { entryId }, type: QueryTypes.SELECT },
    );

    return NextResponse.json({ success: true, data: { ...entry, requirements, documents, milestones, notes } });
  } catch (error: unknown) {
    console.error('Failed to load CRM entry:', error);
    return NextResponse.json({ success: false, error: 'Failed to load CRM entry' }, { status: 500 });
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
    const fields: string[] = [];
    const replacements: Record<string, unknown> = { entryId };

    const setIfPresent = (col: string, key: string, value: unknown) => {
      if (value === undefined) return;
      fields.push(`${col} = :${key}`);
      replacements[key] = value;
    };

    if (body.status !== undefined && !ENTRY_STATUSES.includes(body.status)) {
      return NextResponse.json({ success: false, error: `status must be one of: ${ENTRY_STATUSES.join(', ')}` }, { status: 400 });
    }
    if (body.urgency !== undefined && !URGENCY_LEVELS.includes(body.urgency)) {
      return NextResponse.json({ success: false, error: `urgency must be one of: ${URGENCY_LEVELS.join(', ')}` }, { status: 400 });
    }

    setIfPresent('entry_type', 'entryType', body.entry_type ?? body.entryType);
    setIfPresent('source', 'source', body.source);
    setIfPresent('category', 'category', body.category);
    setIfPresent('sub_category', 'subCategory', body.sub_category ?? body.subCategory);
    setIfPresent('service', 'service', body.service);
    setIfPresent('budget', 'budget', body.budget);
    setIfPresent('timeline', 'timeline', body.timeline);
    setIfPresent('expectations', 'expectations', body.expectations);
    setIfPresent('urgency', 'urgency', body.urgency);
    setIfPresent('status', 'status', body.status);
    setIfPresent('assigned_to', 'assignedTo', body.assigned_to ?? body.assignedTo);

    if (fields.length === 0) return NextResponse.json({ success: false, error: 'No fields to update' }, { status: 400 });

    await sequelize.query(
      `UPDATE crm_crm_entries SET ${fields.join(', ')}, updated_at = NOW() WHERE id = :entryId`,
      { replacements },
    );

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Failed to update CRM entry:', error);
    return NextResponse.json({ success: false, error: 'Failed to update CRM entry' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const auth = requireAuth(request, ['operations.manage']);
    if (isAuthError(auth)) return auth;
    await ensureDB();

    const { id } = await context.params;
    const entryId = Number.parseInt(id, 10);
    if (!entryId) return NextResponse.json({ success: false, error: 'Invalid entry id' }, { status: 400 });

    await sequelize.query('DELETE FROM crm_crm_entry_requirements WHERE entry_id = :entryId', { replacements: { entryId } });
    await sequelize.query('DELETE FROM crm_crm_entry_documents WHERE entry_id = :entryId', { replacements: { entryId } });
    await sequelize.query('DELETE FROM crm_crm_entry_milestones WHERE entry_id = :entryId', { replacements: { entryId } });
    await sequelize.query('DELETE FROM crm_crm_entry_notes WHERE entry_id = :entryId', { replacements: { entryId } });
    await sequelize.query('DELETE FROM crm_crm_entries WHERE id = :entryId', { replacements: { entryId } });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Failed to delete CRM entry:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete CRM entry' }, { status: 500 });
  }
}
