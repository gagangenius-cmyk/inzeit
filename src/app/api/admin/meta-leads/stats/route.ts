import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import { sequelize, connectDB } from '@/lib/sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

let dbReady = false;
async function ensureDB() {
  if (!dbReady) { await connectDB(); dbReady = true; }
}

// Was gated on "logged in" alone (any authenticated employee, regardless of
// role, saw company-wide Meta ad lead delivery stats) - crm_meta_leads has
// no branch column at all (it's a raw ad-platform ingestion feed, not
// attributed to a branch until converted into a real crm_forum_leads row),
// so a permission gate is the right fix here rather than branch scoping.
// Matches the same ['admin.access', 'marketing.manage'] gate this feature's
// settings route already uses (src/app/api/admin/meta-leads/settings/route.ts).
export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['admin.access', 'marketing.manage']);
  if (isAuthError(auth)) return auth;

  await ensureDB();

  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

  const [[todayStats], [weekStats], [deliveryStats], [recentLeads], [recentFailures]] =
    await Promise.all([
      sequelize.query<{ today_count: number }>(
        `SELECT COUNT(*) AS today_count FROM crm_meta_leads WHERE DATE(created_at) = :today`,
        { replacements: { today }, type: QueryTypes.SELECT }
      ),
      sequelize.query<{ week_count: number }>(
        `SELECT COUNT(*) AS week_count FROM crm_meta_leads WHERE DATE(created_at) >= :weekAgo`,
        { replacements: { weekAgo }, type: QueryTypes.SELECT }
      ),
      sequelize.query<{ delivered: number; failed: number; pending: number }>(
        `SELECT
           SUM(status = 'delivered') AS delivered,
           SUM(status IN ('failed')) AS failed,
           SUM(status IN ('pending','retry_scheduled','processing')) AS pending
         FROM crm_meta_lead_deliveries`,
        { type: QueryTypes.SELECT }
      ),
      sequelize.query<{
        id: number; full_name: string; email: string; phone: string;
        campaign_name: string; created_at: string;
        delivery_status: string;
      }>(
        `SELECT ml.id, ml.full_name, ml.email, ml.phone, ml.campaign_name, ml.created_at,
                COALESCE(d.status, 'no_delivery') AS delivery_status
         FROM crm_meta_leads ml
         LEFT JOIN crm_meta_lead_deliveries d ON d.meta_lead_id = ml.id
         ORDER BY ml.created_at DESC
         LIMIT 10`,
        { type: QueryTypes.SELECT }
      ),
      sequelize.query<{
        id: number; meta_lead_id: number; status: string;
        last_error: string; retry_count: number; updated_at: string;
        full_name: string;
      }>(
        `SELECT d.id, d.meta_lead_id, d.status, d.last_error, d.retry_count, d.updated_at,
                ml.full_name
         FROM crm_meta_lead_deliveries d
         JOIN crm_meta_leads ml ON ml.id = d.meta_lead_id
         WHERE d.status IN ('failed','retry_scheduled')
         ORDER BY d.updated_at DESC
         LIMIT 10`,
        { type: QueryTypes.SELECT }
      ),
    ]);

  const [campaignCounts] = await Promise.all([
    sequelize.query<{ campaign_name: string; count: number }>(
      `SELECT campaign_name, COUNT(*) AS count
       FROM crm_meta_leads
       WHERE campaign_name IS NOT NULL
       GROUP BY campaign_name
       ORDER BY count DESC
       LIMIT 10`,
      { type: QueryTypes.SELECT }
    ),
  ]);

  return NextResponse.json({
    todayCount: Number(todayStats?.today_count ?? 0),
    weekCount: Number(weekStats?.week_count ?? 0),
    delivered: Number(deliveryStats?.delivered ?? 0),
    failed: Number(deliveryStats?.failed ?? 0),
    pending: Number(deliveryStats?.pending ?? 0),
    recentLeads,
    recentFailures,
    campaignCounts,
  });
}
