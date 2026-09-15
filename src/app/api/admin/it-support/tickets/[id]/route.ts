import { NextRequest, NextResponse } from 'next/server';
import { ITSupportService, TicketAccessError } from '@/services/it-support-service';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import type { User } from '@/lib/auth';

const actionPermissionMap: Record<string, string> = {
  approve_manager: 'it.approve.manager',
  reject_manager: 'it.approve.manager',
  approve_branch: 'it.approve.branch',
  reject_branch: 'it.approve.branch',
  approve_director: 'it.approve.director',
  reject_director: 'it.approve.director',
  assign: 'it.manage',
  start_progress: 'it.manage',
  resolve: 'it.manage',
  confirm_close: 'it.self',
  reopen: 'it.self',
};

const hasPermission = (auth: User, permission: string) =>
  auth.permissions?.includes('all') || auth.permissions?.includes(permission);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(request, ['it.self']);
  if (isAuthError(auth)) return auth;
  try {
    const { id } = await params;
    const detail = await ITSupportService.getTicketDetail(id, auth);
    return NextResponse.json(detail);
  } catch (error) {
    if (error instanceof TicketAccessError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    const message = error instanceof Error ? error.message : 'Failed to fetch ticket';
    const status = message === 'Ticket not found' ? 404 : 500;
    console.error('Failed to fetch IT support ticket:', error);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(request);
  if (isAuthError(auth)) return auth;
  try {
    const { id } = await params;
    const body = await request.json() as Record<string, unknown>;
    const action = typeof body.action === 'string' ? body.action : '';
    const requiredPermission = actionPermissionMap[action];
    if (!requiredPermission) {
      return NextResponse.json({ error: 'action is invalid' }, { status: 400 });
    }
    if (!hasPermission(auth, requiredPermission)) {
      return NextResponse.json({ error: 'You do not have permission to perform this action' }, { status: 403 });
    }

    const comment = typeof body.comment === 'string' ? body.comment : null;

    switch (action) {
      case 'approve_manager':
        return NextResponse.json(await ITSupportService.reviewByItManager({ ticketId: id, actor: auth, decision: 'Approved', comment }));
      case 'reject_manager':
        return NextResponse.json(await ITSupportService.reviewByItManager({ ticketId: id, actor: auth, decision: 'Rejected', comment }));
      case 'approve_branch':
        return NextResponse.json(await ITSupportService.reviewByBranchManager({ ticketId: id, actor: auth, decision: 'Approved', comment }));
      case 'reject_branch':
        return NextResponse.json(await ITSupportService.reviewByBranchManager({ ticketId: id, actor: auth, decision: 'Rejected', comment }));
      case 'approve_director':
        return NextResponse.json(await ITSupportService.reviewByDirector({ ticketId: id, actor: auth, decision: 'Approved', comment }));
      case 'reject_director':
        return NextResponse.json(await ITSupportService.reviewByDirector({ ticketId: id, actor: auth, decision: 'Rejected', comment }));
      case 'assign': {
        const assigneeId = Number(body.assignee_id);
        if (!Number.isFinite(assigneeId)) return NextResponse.json({ error: 'assignee_id is required' }, { status: 400 });
        return NextResponse.json(await ITSupportService.assignTicket(id, auth, assigneeId));
      }
      case 'start_progress':
        return NextResponse.json(await ITSupportService.startProgress(id, auth));
      case 'resolve':
        return NextResponse.json(await ITSupportService.markResolved(id, auth, typeof body.resolution_notes === 'string' ? body.resolution_notes : null));
      case 'confirm_close':
        return NextResponse.json(await ITSupportService.confirmClose(id, auth));
      case 'reopen':
        return NextResponse.json(await ITSupportService.reopenTicket(id, auth, comment));
      default:
        return NextResponse.json({ error: 'action is invalid' }, { status: 400 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update ticket';
    console.error('Failed to update IT support ticket:', error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
