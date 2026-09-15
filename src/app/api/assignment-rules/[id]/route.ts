import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { isCeo } from '@/lib/roleChecks';
import { getAssignmentRuleById, updateAssignmentRule, deleteAssignmentRule } from '@/lib/assignmentRuleEngine';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(request, ['transfers.manage']);
  if (isAuthError(auth)) return auth;
  try {
    const { id } = await params;
    const rule = await getAssignmentRuleById(Number.parseInt(id, 10));
    if (!rule) return NextResponse.json({ success: false, error: 'Assignment rule not found' }, { status: 404 });
    return NextResponse.json({ success: true, rule });
  } catch (error) {
    console.error('Error fetching assignment rule:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch assignment rule' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(request, ['transfers.manage']);
  if (isAuthError(auth)) return auth;
  try {
    const { id } = await params;
    const body = await request.json();
    const rule = await updateAssignmentRule(Number.parseInt(id, 10), {
      name: body.name,
      description: body.description,
      isActive: body.isActive,
      sortOrder: body.sortOrder,
      branchIds: body.branchIds,
      sourceIds: body.sourceIds,
      priorities: body.priorities,
      leadQualities: body.leadQualities,
      countryInterestIds: body.countryInterestIds,
      serviceInterestIds: body.serviceInterestIds,
      assignmentMode: body.assignmentMode,
      employeeIds: body.employeeIds,
    }, auth.id);
    return NextResponse.json({ success: true, rule });
  } catch (error) {
    console.error('Error updating assignment rule:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update assignment rule' },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(request, ['transfers.manage']);
  if (isAuthError(auth)) return auth;
  // Mirrors the sibling auto-reassignment-rules DELETE (CEO-only) - deleting
  // a routing rule is a bigger blast-radius action than editing one, so it
  // gets the stricter check on top of the base permission gate.
  if (!isCeo(auth)) {
    return NextResponse.json({ success: false, error: 'Only the CEO can delete assignment rules' }, { status: 403 });
  }
  try {
    const { id } = await params;
    await deleteAssignmentRule(Number.parseInt(id, 10));
    return NextResponse.json({ success: true, message: 'Assignment rule deleted successfully' });
  } catch (error) {
    console.error('Error deleting assignment rule:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete assignment rule' }, { status: 500 });
  }
}
