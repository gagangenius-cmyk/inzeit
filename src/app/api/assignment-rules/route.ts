import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { listAssignmentRules, createAssignmentRule, AssignmentRuleInput } from '@/lib/assignmentRuleEngine';

// CRUD for enterprise-style Lead Assignment Rules (Zoho/Salesforce concept):
// an ordered list of condition -> owner rules evaluated by
// src/lib/assignmentRuleEngine.ts whenever a new lead is created. Gated by
// the same 'transfers.manage' permission already used for the sibling
// auto-reassignment-rules feature (src/app/api/auto-reassignment/route.ts).

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['transfers.manage']);
  if (isAuthError(auth)) return auth;
  try {
    const rules = await listAssignmentRules();
    return NextResponse.json({ success: true, rules });
  } catch (error) {
    console.error('Error fetching assignment rules:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch assignment rules' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request, ['transfers.manage']);
  if (isAuthError(auth)) return auth;
  try {
    const body = await request.json();
    const input: AssignmentRuleInput = {
      name: body.name,
      description: body.description ?? null,
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
    };
    const rule = await createAssignmentRule(input, auth.id);
    return NextResponse.json({ success: true, rule }, { status: 201 });
  } catch (error) {
    console.error('Error creating assignment rule:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create assignment rule' },
      { status: 400 }
    );
  }
}
