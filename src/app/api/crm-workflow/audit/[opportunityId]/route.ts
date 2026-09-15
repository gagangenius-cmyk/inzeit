import { NextRequest, NextResponse } from 'next/server';
import { CrmWorkflowService } from '@/services/crm-workflow-service';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ opportunityId: string }> }
) {
  try {
    const auth = requireAuth(request, ['leads.view']);
    if (isAuthError(auth)) return auth;

    const { opportunityId } = await params;
    const id = parseInt(opportunityId, 10);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid opportunity ID' },
        { status: 400 }
      );
    }

    const auditLogs = await CrmWorkflowService.getAuditLogs(id);

    return NextResponse.json({ success: true, data: auditLogs });
  } catch (error: any) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch audit logs: ' + error.message },
      { status: 500 }
    );
  }
}
