import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { previewLeadAssignment, findMatchingRule } from '@/lib/assignmentRuleEngine';

// "Test this rule" panel in the admin UI: given a hypothetical lead's
// attributes, report which rule (if any) would fire and who would receive
// it right now, without consuming a round-robin turn.
export async function POST(request: NextRequest) {
  const auth = requireAuth(request, ['transfers.manage']);
  if (isAuthError(auth)) return auth;
  try {
    const body = await request.json();
    const context = {
      branchId: Number(body.branchId) || 1,
      sourceId: body.sourceId ? Number(body.sourceId) : null,
      priority: body.priority || null,
      leadQuality: body.leadQuality || null,
      countryInterestId: body.countryInterestId ? Number(body.countryInterestId) : null,
      serviceInterestId: body.serviceInterestId ? Number(body.serviceInterestId) : null,
    };
    const matchedRule = await findMatchingRule(context);
    const assignment = await previewLeadAssignment(context);
    return NextResponse.json({ success: true, matchedRule, assignment });
  } catch (error) {
    console.error('Error previewing assignment rule:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to preview assignment' },
      { status: 400 }
    );
  }
}
