import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/sequelize';
import { MonthlyReportService } from '@/services/monthly-report-service';

let dbReady = false;
async function ensureDB() {
  if (!dbReady) { await connectDB(); dbReady = true; }
}

/**
 * POST /api/cron/monthly-reports
 * Manually triggers the monthly Sales + Balance report email scan (CEO/all
 * branches, Branch Manager/own branch, Counsellor/own sales).
 *
 * Protect with CRON_SECRET header. Pass { "dryRun": true } in the body to
 * resolve recipients/reports without actually sending or logging.
 * Schedule: automatic via node-cron, 8am on the 1st of each month (Asia/Dubai) - see src/lib/monthly-report-cron.ts.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  // Fail closed: an unset CRON_SECRET must not leave this endpoint open to
  // the internet — the in-process scheduler (see src/lib/monthly-report-cron.ts)
  // calls MonthlyReportService directly and never hits this HTTP route, so
  // requiring the secret here can't break it.
  if (!secret) {
    console.error('[cron/monthly-reports] CRON_SECRET is not configured');
    return new NextResponse('Server misconfiguration', { status: 500 });
  }
  const auth = request.headers.get('authorization') || '';
  if (auth.replace(/^Bearer\s+/i, '') !== secret) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  await ensureDB();

  const body = await request.json().catch(() => ({}));
  const result = await MonthlyReportService.runMonthlyReportScan({ dryRun: Boolean(body?.dryRun) });

  return NextResponse.json(result);
}
