import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import { sequelize } from '@/lib/sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (isAuthError(auth)) return auth;

  try {
    const [programs, countries, programTypes, branches] = await Promise.all([
      sequelize.query<{ id: number; name: string }>(
        `SELECT id, name FROM crm_service WHERE status = 1 ORDER BY name ASC`,
        { type: QueryTypes.SELECT }
      ),
      sequelize.query<{ id: number; name: string }>(
        `SELECT id, name FROM crm_country_proces WHERE status = 1 ORDER BY name ASC`,
        { type: QueryTypes.SELECT }
      ),
      sequelize.query<{ id: number; name: string }>(
        `SELECT id, type AS name FROM crm_program_type WHERE status = 1 ORDER BY type ASC`,
        { type: QueryTypes.SELECT }
      ),
      sequelize.query<{ id: number; name: string }>(
        `SELECT id, branch AS name FROM crm_branch WHERE status = 1 ORDER BY branch ASC`,
        { type: QueryTypes.SELECT }
      ),
    ]);

    return NextResponse.json({ programs, countries, programTypes, branches });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: 'Failed to fetch lookup data', details: msg }, { status: 500 });
  }
}
