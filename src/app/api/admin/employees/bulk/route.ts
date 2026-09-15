import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import { sequelize } from '@/lib/sequelize';
import { HRService } from '@/services/hr-service';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

// Deliberately bypasses HRService.updateEmployee() for activate/deactivate: that
// method does a full-column rewrite (every omitted field defaults to null), so
// a bulk {id, status} call through it would wipe out email/mobile/branch/etc.
// This route does a targeted UPDATE touching only the status column instead.
export async function PATCH(request: NextRequest) {
  const auth = requireAuth(request, ['employees.manage']);
  if (isAuthError(auth)) return auth;
  try {
    const body = await request.json();
    const { ids, action } = body as { ids: unknown[]; action: string };

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids array is required' }, { status: 400 });
    }
    const numericIds = ids.map(Number).filter((id) => id > 0);
    if (numericIds.length === 0) {
      return NextResponse.json({ error: 'No valid employee IDs' }, { status: 400 });
    }

    if (action === 'activate' || action === 'deactivate') {
      const status = action === 'activate' ? 1 : 0;
      await sequelize.query(
        'UPDATE crm_employee SET status = :status WHERE id IN (:ids)',
        { replacements: { status, ids: numericIds }, type: QueryTypes.UPDATE }
      );
      return NextResponse.json({ success: true, updated: numericIds.length });
    }

    if (action === 'delete') {
      for (const id of numericIds) {
        await HRService.softDeleteEmployee(id);
      }
      return NextResponse.json({ success: true, deleted: numericIds.length });
    }

    return NextResponse.json({ error: 'action must be activate, deactivate, or delete' }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Bulk employee action error:', message);
    return NextResponse.json({ error: 'Failed to perform bulk action', details: message }, { status: 500 });
  }
}
