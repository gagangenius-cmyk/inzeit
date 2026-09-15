import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import { sequelize } from '@/lib/sequelize';
import { verifyToken } from '@/lib/auth';
import { isCeo } from '@/lib/roleChecks';

// Bulk delete is intentionally CEO-only (not Director/Founder/Super Admin,
// which share crm_role.type='director' with CEO — see src/lib/roleChecks.ts).
export async function POST(request: NextRequest) {
  try {
    const token =
      request.cookies.get('auth-token')?.value ||
      request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    const cu = token ? verifyToken(token) : null;
    if (!cu) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    if (!isCeo(cu)) return NextResponse.json({ error: 'Only the CEO can bulk-delete leads' }, { status: 403 });

    const body = await request.json();
    const { leadIds } = body as { leadIds: unknown[] };

    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json({ error: 'leadIds array is required' }, { status: 400 });
    }

    const ids = leadIds.map(Number).filter((id) => id > 0);
    if (ids.length === 0) {
      return NextResponse.json({ error: 'No valid lead IDs' }, { status: 400 });
    }

    await sequelize.query('DELETE FROM crm_forum_leads WHERE id IN (:ids)', {
      replacements: { ids },
      type: QueryTypes.DELETE,
    });

    return NextResponse.json({ success: true, deleted: ids.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Bulk delete leads error:', msg);
    return NextResponse.json({ error: 'Failed to delete leads', details: msg }, { status: 500 });
  }
}
