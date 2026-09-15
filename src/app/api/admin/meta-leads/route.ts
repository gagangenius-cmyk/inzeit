import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import { sequelize, connectDB } from '@/lib/sequelize';
import { verifyToken } from '@/lib/auth';

let dbReady = false;
async function ensureDB() {
  if (!dbReady) { await connectDB(); dbReady = true; }
}

export async function GET(request: NextRequest) {
  const token =
    request.cookies.get('auth-token')?.value ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await ensureDB();

  const { searchParams } = new URL(request.url);
  const page       = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit      = Math.min(100, parseInt(searchParams.get('limit') || '20'));
  const offset     = (page - 1) * limit;
  const search     = (searchParams.get('search') || '').trim();
  const status     = searchParams.get('status') || '';
  const campaignId = searchParams.get('campaign') || '';
  const formId     = searchParams.get('form') || '';
  const dateFrom   = searchParams.get('dateFrom') || '';
  const dateTo     = searchParams.get('dateTo') || '';

  const conditions: string[] = [];
  const replacements: Record<string, unknown> = {};

  if (search) {
    conditions.push('(ml.full_name LIKE :search OR ml.email LIKE :search OR ml.phone LIKE :search)');
    replacements.search = `%${search}%`;
  }
  if (campaignId) { conditions.push('ml.campaign_id = :campaignId'); replacements.campaignId = campaignId; }
  if (formId)     { conditions.push('ml.form_id = :formId'); replacements.formId = formId; }
  if (dateFrom)   { conditions.push('DATE(ml.created_at) >= :dateFrom'); replacements.dateFrom = dateFrom; }
  if (dateTo)     { conditions.push('DATE(ml.created_at) <= :dateTo'); replacements.dateTo = dateTo; }
  if (status) {
    conditions.push('d.status = :delivStatus');
    replacements.delivStatus = status;
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

  const countRows = await sequelize.query<{ total: number }>(
    `SELECT COUNT(*) AS total
     FROM crm_meta_leads ml
     LEFT JOIN crm_meta_lead_deliveries d ON d.meta_lead_id = ml.id
     ${where}`,
    { replacements, type: QueryTypes.SELECT }
  );

  const rows = await sequelize.query<{
    id: number;
    meta_lead_id: string;
    full_name: string;
    email: string;
    phone: string;
    campaign_name: string;
    form_name: string;
    created_at: string;
    delivery_status: string;
    retry_count: number;
    last_error: string;
    response_status: number | null;
    next_retry_at: string | null;
    delivered_at: string | null;
  }>(
    `SELECT ml.id, ml.meta_lead_id, ml.full_name, ml.email, ml.phone,
            ml.campaign_name, ml.form_name, ml.created_at,
            COALESCE(d.status, 'no_delivery') AS delivery_status,
            COALESCE(d.retry_count, 0) AS retry_count,
            d.last_error, d.response_status, d.next_retry_at, d.delivered_at
     FROM crm_meta_leads ml
     LEFT JOIN crm_meta_lead_deliveries d ON d.meta_lead_id = ml.id
     ${where}
     ORDER BY ml.created_at DESC
     LIMIT :limit OFFSET :offset`,
    { replacements: { ...replacements, limit, offset }, type: QueryTypes.SELECT }
  );

  return NextResponse.json({
    data: rows,
    pagination: {
      page,
      limit,
      total: Number(countRows[0]?.total ?? 0),
      pages: Math.ceil(Number(countRows[0]?.total ?? 0) / limit),
    },
  });
}
