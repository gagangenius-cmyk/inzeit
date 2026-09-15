import { NextRequest, NextResponse } from 'next/server';
import { CrmWorkflowService } from '@/services/crm-workflow-service';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request, ['leads.view', 'reports.view']);
    if (isAuthError(auth)) return auth;

    const dashboard = await CrmWorkflowService.getWorkflowDashboard();
    return NextResponse.json({ success: true, data: dashboard });
  } catch (error: any) {
    console.error('Error fetching workflow dashboard:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard: ' + error.message },
      { status: 500 }
    );
  }
}
