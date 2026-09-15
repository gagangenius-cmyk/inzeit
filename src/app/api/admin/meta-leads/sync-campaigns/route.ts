import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import { sequelize, connectDB } from '@/lib/sequelize';
import { verifyToken } from '@/lib/auth';
import { fetchCampaigns } from '@/lib/meta/graph-api';

let dbReady = false;
async function ensureDB() {
  if (!dbReady) { await connectDB(); dbReady = true; }
}

export async function POST(request: NextRequest) {
  const token =
    request.cookies.get('auth-token')?.value ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await ensureDB();

  const [settings] = await sequelize.query<{ ad_account_id: string }>(
    `SELECT ad_account_id FROM crm_meta_settings WHERE id = 1 LIMIT 1`,
    { type: QueryTypes.SELECT }
  );

  if (!settings?.ad_account_id) {
    return NextResponse.json({ error: 'Ad Account ID is not configured in Meta settings' }, { status: 400 });
  }

  let campaigns;
  try {
    campaigns = await fetchCampaigns(settings.ad_account_id);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Meta API error: ${msg}` }, { status: 502 });
  }

  let upserted = 0;
  for (const c of campaigns) {
    const insight = c.insights?.data?.[0];
    await sequelize.query(
      `INSERT INTO crm_meta_campaign_cache
         (campaign_id, campaign_name, status, objective, daily_budget, lifetime_budget,
          spend, impressions, clicks, raw_data, last_synced_at)
       VALUES
         (:id, :name, :status, :objective, :daily_budget, :lifetime_budget,
          :spend, :impressions, :clicks, :rawData, NOW())
       ON DUPLICATE KEY UPDATE
         campaign_name   = VALUES(campaign_name),
         status          = VALUES(status),
         objective       = VALUES(objective),
         daily_budget    = VALUES(daily_budget),
         lifetime_budget = VALUES(lifetime_budget),
         spend           = VALUES(spend),
         impressions     = VALUES(impressions),
         clicks          = VALUES(clicks),
         raw_data        = VALUES(raw_data),
         last_synced_at  = NOW(),
         updated_at      = NOW()`,
      {
        replacements: {
          id: c.id,
          name: c.name ?? null,
          status: c.status ?? null,
          objective: c.objective ?? null,
          daily_budget: c.daily_budget ? parseFloat(c.daily_budget) / 100 : null,
          lifetime_budget: c.lifetime_budget ? parseFloat(c.lifetime_budget) / 100 : null,
          spend: insight?.spend ? parseFloat(insight.spend) : 0,
          impressions: insight?.impressions ? parseInt(insight.impressions) : 0,
          clicks: insight?.clicks ? parseInt(insight.clicks) : 0,
          rawData: JSON.stringify(c),
        },
        type: QueryTypes.INSERT,
      }
    );
    upserted++;
  }

  // Update leads_count for each campaign
  await sequelize.query(
    `UPDATE crm_meta_campaign_cache c
     SET c.leads_count = (
       SELECT COUNT(*) FROM crm_meta_leads ml WHERE ml.campaign_id = c.campaign_id
     )`,
    { type: QueryTypes.UPDATE }
  );

  await sequelize.query(
    `UPDATE crm_meta_settings SET last_campaign_sync_at = NOW() WHERE id = 1`,
    { type: QueryTypes.UPDATE }
  );

  return NextResponse.json({ success: true, synced: upserted });
}
