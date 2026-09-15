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

  const [row] = await sequelize.query<{
    id: number;
    is_enabled: number;
    page_id: string;
    page_name: string;
    ad_account_id: string;
    graph_api_version: string;
    default_branch: string;
    default_lead_source: string;
    default_utm_source: string;
    last_webhook_at: string;
    last_campaign_sync_at: string;
    updated_at: string;
  }>(
    `SELECT id, is_enabled, page_id, page_name, ad_account_id, graph_api_version,
            default_branch, default_lead_source, default_utm_source,
            last_webhook_at, last_campaign_sync_at, updated_at
     FROM crm_meta_settings WHERE id = 1 LIMIT 1`,
    { type: QueryTypes.SELECT }
  );

  // Never expose tokens — return env-configured values as masked status
  return NextResponse.json({
    settings: row ?? null,
    envStatus: {
      appId: process.env.META_APP_ID ? '✓ set' : '✗ missing',
      appSecret: process.env.META_APP_SECRET ? '✓ set' : '✗ missing',
      webhookVerifyToken: process.env.META_WEBHOOK_VERIFY_TOKEN ? '✓ set' : '✗ missing',
      pageAccessToken: process.env.META_PAGE_ACCESS_TOKEN ? '✓ set' : '✗ missing',
      graphApiVersion: process.env.META_GRAPH_API_VERSION || 'v21.0 (default)',
      crmEndpoint: process.env.META_LEADS_CRM_ENDPOINT || 'https://cmgone.org/api/web-to-leads (default)',
    },
  });
}

export async function PUT(request: NextRequest) {
  const auth = requireAuth(request, ['admin.access', 'marketing.manage']);
  if (isAuthError(auth)) return auth;
  await ensureDB();

  const body = await request.json() as {
    is_enabled?: number;
    page_id?: string;
    page_name?: string;
    ad_account_id?: string;
    graph_api_version?: string;
    default_branch?: string;
    default_lead_source?: string;
    default_utm_source?: string;
  };

  await sequelize.query(
    `UPDATE crm_meta_settings
     SET is_enabled          = :is_enabled,
         page_id             = :page_id,
         page_name           = :page_name,
         ad_account_id       = :ad_account_id,
         graph_api_version   = :graph_api_version,
         default_branch      = :default_branch,
         default_lead_source = :default_lead_source,
         default_utm_source  = :default_utm_source,
         updated_at          = NOW()
     WHERE id = 1`,
    {
      replacements: {
        is_enabled: body.is_enabled ?? 0,
        page_id: body.page_id ?? null,
        page_name: body.page_name ?? null,
        ad_account_id: body.ad_account_id ?? null,
        graph_api_version: body.graph_api_version || 'v21.0',
        default_branch: body.default_branch ?? null,
        default_lead_source: body.default_lead_source || 'Facebook Lead Ads',
        default_utm_source: body.default_utm_source || 'Facebook Lead Ads',
      },
      type: QueryTypes.UPDATE,
    }
  );

  return NextResponse.json({ success: true });
}
