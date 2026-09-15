import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/sequelize';
import { retryFailedDeliveries } from '@/lib/meta/processor';

let dbReady = false;
async function ensureDB() {
  if (!dbReady) { await connectDB(); dbReady = true; }
}

/**
 * POST /api/cron/meta-leads-retry
 * Processes all retry-scheduled Meta lead CRM deliveries.
 *
 * Protect with CRON_SECRET header:
 *   Authorization: Bearer <CRON_SECRET>
 *
 * Vercel Cron config (vercel.json):
 *   { "crons": [{ "path": "/api/cron/meta-leads-retry", "schedule": "* /5 * * * *" }] }
 *
 * VPS / PM2 cron (runs every 5 min):
 *   * /5 * * * * curl -s -X POST -H "Authorization: Bearer $CRON_SECRET" https://your-domain/api/cron/meta-leads-retry
 */
export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  // Fail closed: an unset CRON_SECRET must not leave this endpoint open to
  // the internet — the in-process scheduler (if any) calls the underlying
  // service directly and never hits this HTTP route, so requiring the secret
  // here can't break it.
  if (!secret) {
    console.error('[cron/meta-leads-retry] CRON_SECRET is not configured');
    return new NextResponse('Server misconfiguration', { status: 500 });
  }
  const auth = request.headers.get('authorization') || '';
  if (auth.replace(/^Bearer\s+/i, '') !== secret) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  await ensureDB();

  const result = await retryFailedDeliveries();
  console.log(`[Cron] meta-leads-retry: processed=${result.processed} errors=${result.errors}`);

  return NextResponse.json({ success: true, ...result });
}

// Also allow GET for simple cron triggers that only support GET
export { POST as GET };
