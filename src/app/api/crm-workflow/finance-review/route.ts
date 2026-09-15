import { NextRequest, NextResponse } from 'next/server';
import { CrmWorkflowService } from '@/services/crm-workflow-service';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request, ['finance.view', 'finance.manage']);
    if (isAuthError(auth)) return auth;

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
        { success: false, error: 'Finance checklist is required' },
        { status: 400 }
      );
    }

    const result = await CrmWorkflowService.financeReview({
      opportunityId,
      decision,
      checklist,
      reason,
      actorId: auth.id,
      actorRole: auth.roleName || auth.type || 'finance_officer',
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
    console.error('Error in finance review:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process finance review: ' + error.message },
      { status: 500 }
    );
  }
}
