import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { captureError } from '@/lib/errorTracking';
import { AutomationRulesService } from '@/services/automation-rules-service';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(request, ['automation.manage']);
  if (isAuthError(auth)) return auth;

  try {
    const { id } = await params;
    const body = await request.json();
    const rule = await AutomationRulesService.updateRule(Number(id), body);
    if (!rule) return NextResponse.json({ error: 'Automation rule not found' }, { status: 404 });
    return NextResponse.json({ success: true, rule });
  } catch (error) {
    console.error('Error updating automation rule:', error);
    captureError(error, { route: 'PATCH /api/admin/automation-rules/[id]' });
    const message = error instanceof Error ? error.message : 'Failed to update automation rule';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(request, ['automation.manage']);
  if (isAuthError(auth)) return auth;

  try {
    const { id } = await params;
    const deleted = await AutomationRulesService.deleteRule(Number(id));
    if (!deleted) return NextResponse.json({ error: 'Automation rule not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting automation rule:', error);
    captureError(error, { route: 'DELETE /api/admin/automation-rules/[id]' });
    return NextResponse.json({ error: 'Failed to delete automation rule' }, { status: 500 });
  }
}
