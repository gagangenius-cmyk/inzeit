import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import { sequelize, connectDB } from '@/lib/sequelize';
import { verifyToken } from '@/lib/auth';

let dbReady = false;
async function ensureDB() {
  if (!dbReady) { await connectDB(); dbReady = true; }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token =
    request.cookies.get('auth-token')?.value ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await ensureDB();
  const { id } = await params;

  const [lead] = await sequelize.query<{
    id: number;
    meta_lead_id: string;
    full_name: string;
    email: string;
    phone: string;
    page_id: string;
    form_id: string;
    form_name: string;
    campaign_id: string;
    campaign_name: string;
    adset_id: string;
    ad_id: string;
    raw_lead_data: string;
    normalized_lead_data: string;
    meta_created_time: string;
    created_at: string;
  }>(
    `SELECT id, meta_lead_id, full_name, email, phone, page_id, form_id, form_name,
            campaign_id, campaign_name, adset_id, ad_id,
            raw_lead_data, normalized_lead_data, meta_created_time, created_at
     FROM crm_meta_leads WHERE id = :id LIMIT 1`,
    { replacements: { id: Number(id) }, type: QueryTypes.SELECT }
  );

  if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const deliveries = await sequelize.query<{
    id: number;
    status: string;
    response_status: number;
    last_error: string;
    retry_count: number;
    next_retry_at: string;
    delivered_at: string;
    created_at: string;
    updated_at: string;
  }>(
    `SELECT id, status, response_status, last_error, retry_count, next_retry_at,
            delivered_at, created_at, updated_at
     FROM crm_meta_lead_deliveries
     WHERE meta_lead_id = :metaLeadId
     ORDER BY created_at DESC`,
    { replacements: { metaLeadId: lead.id }, type: QueryTypes.SELECT }
  );

  return NextResponse.json({
    lead: {
      ...lead,
      raw_lead_data: JSON.parse(lead.raw_lead_data || '{}'),
      normalized_lead_data: JSON.parse(lead.normalized_lead_data || '{}'),
    },
    deliveries,
  });
}
