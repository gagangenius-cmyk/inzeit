import { NextRequest, NextResponse } from 'next/server';
import { ITSupportService, TicketAccessError } from '@/services/it-support-service';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(request, ['it.self']);
  if (isAuthError(auth)) return auth;
  try {
    const { id } = await params;
    const comments = await ITSupportService.listComments(id, auth);
    return NextResponse.json({ comments });
  } catch (error) {
    if (error instanceof TicketAccessError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Failed to fetch IT support ticket comments:', error);
    return NextResponse.json({ error: 'Failed to fetch ticket comments' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(request, ['it.self']);
  if (isAuthError(auth)) return auth;
  try {
    const { id } = await params;
    const body = await request.json() as Record<string, unknown>;
    const commentBody = typeof body.body === 'string' ? body.body : '';
    const result = await ITSupportService.addComment(id, auth, commentBody);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof TicketAccessError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    const message = error instanceof Error ? error.message : 'Failed to add comment';
    console.error('Failed to add IT support ticket comment:', error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
