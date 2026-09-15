import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { getTargetById, deleteTarget } from '@/lib/targetAssignment';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(request, ['transfers.manage']);
  if (isAuthError(auth)) return auth;
  try {
    const { id } = await params;
    const targetId = Number.parseInt(id, 10);
    const existing = await getTargetById(targetId);
    if (!existing) return NextResponse.json({ success: false, error: 'Target not found' }, { status: 404 });
    await deleteTarget(targetId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting target:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete target' }, { status: 500 });
  }
}
