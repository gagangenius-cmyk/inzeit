import { NextRequest, NextResponse } from 'next/server';
import { CrmWorkflowService } from '@/services/crm-workflow-service';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { isCeo } from '@/lib/roleChecks';

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (isAuthError(auth)) return auth;
    // There's no dedicated "compliance officer" permission/role in this codebase
    // (see src/app/api/discount-approvals/route.ts and
    // opportunity-compliance-approvals/route.ts for the same reasoning) — CEO is
    // the documented fallback reviewer for this gate.
    if (!isCeo(auth)) {
      return NextResponse.json({ success: false, error: 'Only the CEO can review compliance for this opportunity' }, { status: 403 });
    }

    const body = await request.json();
    const { opportunityId, decision, checklist, reason } = body;

    if (!opportunityId) {
      return NextResponse.json(
        { success: false, error: 'opportunityId is required' },
        { status: 400 }
      );
    }

    if (!decision || !['approved', 'rejected'].includes(decision)) {
      return NextResponse.json(
        { success: false, error: 'decision must be "approved" or "rejected"' },
        { status: 400 }
      );
    }

    if (!checklist) {
      return NextResponse.json(
        { success: false, error: 'Compliance checklist is required' },
        { status: 400 }
      );
    }

    const result = await CrmWorkflowService.complianceReview({
      opportunityId,
      decision,
      checklist,
      reason,
      actorId: auth.id,
      actorRole: auth.roleName || auth.type || 'crm_compliance_officer',
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, errors: result.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error('Error in compliance review:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process compliance review: ' + error.message },
      { status: 500 }
    );
  }
}
