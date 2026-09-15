import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import { sequelize, connectDB } from '@/lib/sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

let dbReady = false;
async function ensureDB() {
  if (!dbReady) { await connectDB(); dbReady = true; }
}

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['admin.access', 'marketing.manage']);
  if (isAuthError(auth)) return auth;
  await ensureDB();

  const { searchParams } = new URL(request.url);
  const scope      = searchParams.get('scope') || '';
  const campaignId = searchParams.get('campaign') || '';
  const formId     = searchParams.get('form') || '';

  const conditions: string[] = [];
  const replacements: Record<string, unknown> = {};

  if (scope) { conditions.push('scope_type = :scope'); replacements.scope = scope; }
  if (campaignId) { conditions.push('campaign_id = :campaignId'); replacements.campaignId = campaignId; }
  if (formId) { conditions.push('form_id = :formId'); replacements.formId = formId; }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

  const rows = await sequelize.query(
    `SELECT id, scope_type, campaign_id, form_id, meta_field_key, crm_field_key,
            fallback_value, transform_type, is_enabled, sort_order, created_at, updated_at
     FROM crm_meta_lead_mappings
     ${where}
     ORDER BY scope_type ASC, sort_order ASC, id ASC`,
    { replacements, type: QueryTypes.SELECT }
  );

  return NextResponse.json({ data: rows });
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request, ['admin.access', 'marketing.manage']);
  if (isAuthError(auth)) return auth;
  await ensureDB();

  const body = await request.json() as {
    scope_type?: string;
    campaign_id?: string;
    form_id?: string;
    meta_field_key?: string;
    crm_field_key?: string;
    fallback_value?: string;
    transform_type?: string;
    is_enabled?: number;
    sort_order?: number;
  };

  const { scope_type = 'GLOBAL', meta_field_key, crm_field_key } = body;

  if (!meta_field_key?.trim() || !crm_field_key?.trim()) {
    return NextResponse.json({ error: 'meta_field_key and crm_field_key are required' }, { status: 400 });
  }
  if (!['GLOBAL', 'CAMPAIGN', 'FORM'].includes(scope_type)) {
    return NextResponse.json({ error: 'Invalid scope_type' }, { status: 400 });
  }

  await sequelize.query(
    `INSERT INTO crm_meta_lead_mappings
       (scope_type, campaign_id, form_id, meta_field_key, crm_field_key,
        fallback_value, transform_type, is_enabled, sort_order)
     VALUES
       (:scope_type, :campaign_id, :form_id, :meta_field_key, :crm_field_key,
        :fallback_value, :transform_type, :is_enabled, :sort_order)`,
    {
      replacements: {
        scope_type,
        campaign_id: body.campaign_id ?? null,
        form_id: body.form_id ?? null,
        meta_field_key: meta_field_key.trim(),
        crm_field_key: crm_field_key.trim(),
        fallback_value: body.fallback_value ?? null,
        transform_type: body.transform_type ?? null,
        is_enabled: body.is_enabled ?? 1,
        sort_order: body.sort_order ?? 0,
      },
      type: QueryTypes.INSERT,
    }
  );

  return NextResponse.json({ success: true }, { status: 201 });
}
