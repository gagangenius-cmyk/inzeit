import { NextRequest, NextResponse } from 'next/server';
import { sequelize } from '@/lib/sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

type RouteContext = { params: Promise<{ id: string; documentId: string }> };

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = requireAuth(request, ['hr.update']);
  if (isAuthError(auth)) return auth;
  const { id, documentId } = await context.params;
  await sequelize.query(
    `UPDATE crm_hr_employee_documents SET deleted_at = NOW() WHERE document_id = :documentId AND employee_id = :employeeId`,
    { replacements: { documentId, employeeId: id } }
  );
  return NextResponse.json({ success: true });
}
