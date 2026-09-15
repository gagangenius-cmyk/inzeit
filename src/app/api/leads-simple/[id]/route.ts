import { NextRequest, NextResponse } from 'next/server';
import { sequelize } from '@/lib/sequelize';
import { QueryTypes } from 'sequelize';
import { verifyToken } from '@/lib/auth';
import { isCeo } from '@/lib/roleChecks';

const ALLOWED_FIELDS = new Set([
  'status', 'priority', 'lead_quality', 'assignTo', 'branch', 'region',
  'appointment', 'followup', 'folowuptime', 'followupstat',
  'fname', 'mname', 'lname', 'email', 'phone', 'mobile',
  'country_interest', 'service_interest', 'market_source', 'lead_remark',
  'payTotal', 'discount', 'paidYet', 'payBalance',
]);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth-token')?.value
      || request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    const currentUser = token ? verifyToken(token) : null;
    if (!currentUser) {
      return NextResponse.json({ error: 'Authentication is required' }, { status: 401 });
    }

    const { id: idParam } = await params;
    const id = parseInt(idParam, 10);
    if (!id) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const [lead] = await sequelize.query(
      'SELECT * FROM crm_forum_leads WHERE id = ? LIMIT 1',
      { replacements: [id], type: QueryTypes.SELECT }
    );

    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    return NextResponse.json(lead);
  } catch (error) {
    console.error('GET /api/leads-simple/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth-token')?.value
      || request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    const currentUser = token ? verifyToken(token) : null;
    if (!currentUser) {
      return NextResponse.json({ error: 'Authentication is required' }, { status: 401 });
    }

    const { id: idParam } = await params;
    const id = parseInt(idParam, 10);
    if (!id) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const body = await request.json();

    const [existing] = await sequelize.query<{
      payTotal: number | string | null;
      discount: number | string | null;
      paidYet: number | string | null;
    }>(
      'SELECT payTotal, discount, paidYet FROM crm_forum_leads WHERE id = ? LIMIT 1',
      { replacements: [id], type: QueryTypes.SELECT },
    );
    if (!existing) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(body)) {
      if (ALLOWED_FIELDS.has(key)) updates[key] = value;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const hasFinancialUpdate = ['payTotal', 'discount', 'paidYet'].some((field) => updates[field] !== undefined);
    if (hasFinancialUpdate) {
      const total = Number(updates.payTotal ?? existing.payTotal ?? 0);
      const discount = Number(updates.discount ?? existing.discount ?? 0);
      const paidYet = Number(updates.paidYet ?? existing.paidYet ?? 0);
      updates.payTotal = Math.max(total, 0);
      updates.discount = Math.max(discount, 0);
      updates.paidYet = Math.max(paidYet, 0);
      updates.payBalance = Math.max(total - discount - paidYet, 0);
    }

    const setClauses = Object.keys(updates).map(k => `\`${k}\` = ?`).join(', ');
    const values = [...Object.values(updates), id];

    await sequelize.query(
      `UPDATE crm_forum_leads SET ${setClauses} WHERE id = ?`,
      { replacements: values, type: QueryTypes.UPDATE }
    );

    const [updated] = await sequelize.query(
      'SELECT id, fname, lname, status, priority, lead_quality, payTotal, discount, paidYet, payBalance FROM crm_forum_leads WHERE id = ? LIMIT 1',
      { replacements: [id], type: QueryTypes.SELECT }
    );

    return NextResponse.json({ success: true, lead: updated });
  } catch (error) {
    console.error('PUT /api/leads-simple/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth-token')?.value
      || request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    const currentUser = token ? verifyToken(token) : null;
    if (!currentUser || !isCeo(currentUser)) {
      return NextResponse.json({ error: 'Only the CEO can delete records' }, { status: 403 });
    }

    const { id: idParam } = await params;
    const id = parseInt(idParam, 10);
    if (!id) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const [lead] = await sequelize.query<{ id: number }>(
      'SELECT id FROM crm_forum_leads WHERE id = ? LIMIT 1',
      { replacements: [id], type: QueryTypes.SELECT },
    );
    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

    await sequelize.query('DELETE FROM crm_forum_leads WHERE id = ?', {
      replacements: [id], type: QueryTypes.DELETE,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/leads-simple/[id]:', error);
    return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 });
  }
}
