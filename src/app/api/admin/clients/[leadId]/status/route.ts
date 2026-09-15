import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { ClientPortalService } from '@/services/client-portal-service';
import { checkLeadBranchScope } from '@/lib/branchScopeGuard';

type Context = { params: Promise<{ leadId: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  const auth = requireAuth(request, ['clients.view']);
  if (isAuthError(auth)) return auth;

  try {
    const leadId = Number((await params).leadId);
    if (!Number.isFinite(leadId)) return NextResponse.json({ error: 'Invalid lead id' }, { status: 400 });

    const log = await ClientPortalService.listStatusLog(leadId);
    return NextResponse.json({ log });
  } catch (error) {
    console.error('Failed to load status log:', error);
    return NextResponse.json({ error: 'Failed to load status log' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: Context) {
  const auth = requireAuth(request, ['clients.update']);
  if (isAuthError(auth)) return auth;

  try {
    const leadId = Number((await params).leadId);
    if (!Number.isFinite(leadId)) return NextResponse.json({ error: 'Invalid lead id' }, { status: 400 });

    const scopeError = await checkLeadBranchScope(auth, leadId);
    if (scopeError) return scopeError;

    const body = await request.json() as Record<string, unknown>;
    const message = String(body.message || '').trim();
    if (!message) return NextResponse.json({ error: 'message is required' }, { status: 400 });

    const result = await ClientPortalService.postStatus({
      leadId,
      opportunityId: body.opportunity_id ? Number(body.opportunity_id) : null,
      postedBy: String(auth.id),
      message,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Failed to post client status:', error);
    return NextResponse.json({ error: 'Failed to post status update' }, { status: 500 });
  }
}
