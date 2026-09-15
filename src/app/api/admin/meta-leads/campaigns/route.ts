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
  const page   = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit  = Math.min(100, parseInt(searchParams.get('limit') || '20'));
  const offset = (page - 1) * limit;
  const search = (searchParams.get('search') || '').trim();

  const conditions: string[] = [];
  const replacements: Record<string, unknown> = {};

  if (search) {
    conditions.push('(c.campaign_name LIKE :search OR c.campaign_id LIKE :search)');
    replacements.search = `%${search}%`;
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

  const [countRows, rows] = await Promise.all([
    sequelize.query<{ total: number }>(
      `SELECT COUNT(*) AS total FROM crm_meta_campaign_cache c ${where}`,
      { replacements, type: QueryTypes.SELECT }
    ),
    sequelize.query<{
      campaign_id: string;
      campaign_name: string;
      status: string;
      objective: string;
      daily_budget: number;
      lifetime_budget: number;
      spend: number;
      impressions: number;
      clicks: number;
      leads_count: number;
      last_synced_at: string;
    }>(
      `SELECT c.campaign_id, c.campaign_name, c.status, c.objective,
              c.daily_budget, c.lifetime_budget, c.spend, c.impressions,
              c.clicks, c.leads_count, c.last_synced_at
       FROM crm_meta_campaign_cache c
       ${where}
       ORDER BY c.leads_count DESC, c.campaign_name ASC
       LIMIT :limit OFFSET :offset`,
      { replacements: { ...replacements, limit, offset }, type: QueryTypes.SELECT }
    ),
  ]);

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
