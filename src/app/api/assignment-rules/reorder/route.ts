import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { reorderAssignmentRules } from '@/lib/assignmentRuleEngine';

// Drag-and-drop reordering in the admin UI - rule evaluation order matters
// (first active match wins), so this is a distinct action from editing a
// single rule's own fields.
export async function POST(request: NextRequest) {
  const auth = requireAuth(request, ['transfers.manage']);
  if (isAuthError(auth)) return auth;
  try {
    const body = await request.json();
    const orderedIds = Array.isArray(body.orderedIds) ? body.orderedIds.map((id: unknown) => Number(id)) : [];
    if (orderedIds.length === 0 || orderedIds.some((id: number) => !Number.isFinite(id))) {
      return NextResponse.json({ success: false, error: 'orderedIds must be a non-empty array of rule ids' }, { status: 400 });
    }
    await reorderAssignmentRules(orderedIds);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering assignment rules:', error);
    return NextResponse.json({ success: false, error: 'Failed to reorder assignment rules' }, { status: 500 });
  }
}
