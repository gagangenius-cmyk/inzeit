import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import { sequelize, connectDB } from '@/lib/sequelize';
import { fetchCampaigns } from '@/lib/meta/graph-api';

let dbReady = false;
async function ensureDB() {
  if (!dbReady) { await connectDB(); dbReady = true; }
}

/**
 * POST /api/cron/meta-campaign-sync
 * Syncs Meta campaigns into crm_meta_campaign_cache.
 *
 * Protect with CRON_SECRET header.
 * Schedule: every 6 hours (recommended).
 */
export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  // Fail closed: an unset CRON_SECRET must not leave this endpoint open to
  // the internet — the in-process scheduler (if any) calls the underlying
  // service directly and never hits this HTTP route, so requiring the secret
  // here can't break it.
  if (!secret) {
    console.error('[cron/meta-campaign-sync] CRON_SECRET is not configured');
    return new NextResponse('Server misconfiguration', { status: 500 });
  }
  const auth = request.headers.get('authorization') || '';
  if (auth.replace(/^Bearer\s+/i, '') !== secret) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  await ensureDB();

  const [settings] = await sequelize.query<{ ad_account_id: string; is_enabled: number }>(
    `SELECT ad_account_id, is_enabled FROM crm_meta_settings WHERE id = 1 LIMIT 1`,
    { type: QueryTypes.SELECT }
  );

  if (!settings?.is_enabled || !settings?.ad_account_id) {
    return NextResponse.json({ skipped: true, reason: 'Integration disabled or ad account not configured' });
  }

  try {
    const campaigns = await fetchCampaigns(settings.ad_account_id);
    for (const c of campaigns) {
      const insight = c.insights?.data?.[0];
      await sequelize.query(
        `INSERT INTO crm_meta_campaign_cache
           (campaign_id, campaign_name, status, objective, daily_budget, lifetime_budget,
            spend, impressions, clicks, raw_data, last_synced_at)
         VALUES (:id, :name, :status, :objective, :daily_budget, :lifetime_budget,
                 :spend, :impressions, :clicks, :rawData, NOW())
         ON DUPLICATE KEY UPDATE
           campaign_name = VALUES(campaign_name), status = VALUES(status),
           objective = VALUES(objective), daily_budget = VALUES(daily_budget),
           lifetime_budget = VALUES(lifetime_budget), spend = VALUES(spend),
           impressions = VALUES(impressions), clicks = VALUES(clicks),
           raw_data = VALUES(raw_data), last_synced_at = NOW(), updated_at = NOW()`,
        {
          replacements: {
            id: c.id, name: c.name ?? null, status: c.status ?? null,
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
    }

    await sequelize.query(
      `UPDATE crm_meta_campaign_cache c
       SET c.leads_count = (SELECT COUNT(*) FROM crm_meta_leads ml WHERE ml.campaign_id = c.campaign_id)`,
      { type: QueryTypes.UPDATE }
    );

    await sequelize.query(
      `UPDATE crm_meta_settings SET last_campaign_sync_at = NOW() WHERE id = 1`,
      { type: QueryTypes.UPDATE }
    );

    console.log(`[Cron] meta-campaign-sync: synced ${campaigns.length} campaigns`);
    return NextResponse.json({ success: true, synced: campaigns.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Cron] meta-campaign-sync failed:', msg);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}

export { POST as GET };
