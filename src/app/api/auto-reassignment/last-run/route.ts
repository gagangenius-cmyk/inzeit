import { NextRequest, NextResponse } from 'next/server';
import { sequelize } from '@/lib/sequelize';
import { QueryTypes } from 'sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['transfers.manage']);
  if (isAuthError(auth)) return auth;
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS crm_auto_reassignment_runs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        processed INT NOT NULL DEFAULT 0,
        reassigned INT NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const [lastRun] = await sequelize.query<any>(
      'SELECT created_at FROM crm_auto_reassignment_runs ORDER BY created_at DESC LIMIT 1',
      { type: QueryTypes.SELECT }
    );

    const lastRunDate = lastRun?.created_at ? new Date(lastRun.created_at) : null;
    const nextRunDate = lastRunDate
      ? new Date(lastRunDate.getTime() + 6 * 60 * 60 * 1000)
      : null;

    return NextResponse.json({
      lastRun: lastRunDate?.toISOString() || null,
      nextRun: nextRunDate?.toISOString() || null,
    });
  } catch (error) {
    console.error('Error fetching last run time:', error);
    return NextResponse.json(
      { error: 'Failed to fetch last run time' },
      { status: 500 }
    );
  }
}
