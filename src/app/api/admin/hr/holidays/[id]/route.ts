import { NextRequest, NextResponse } from 'next/server';
import { HRService } from '@/services/hr-service';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = requireAuth(request, ['hr.create', 'hr.update']);
  if (isAuthError(auth)) return auth;
  const { id } = await context.params;
  try {
    await HRService.deleteHoliday(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete HR holiday:', error);
    return NextResponse.json({ error: 'Failed to delete holiday' }, { status: 500 });
  }
}
