import { NextRequest, NextResponse } from 'next/server';
import { requireClientAuth, isClientAuthError } from '@/lib/clientApiAuth';
import { ClientPortalProductService } from '@/services/client-portal-product-service';

type RouteContext = { params: Promise<{ opportunityId: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const client = requireClientAuth(request);
  if (isClientAuthError(client)) return client;

  const { opportunityId } = await context.params;
  try {
    const messages = await ClientPortalProductService.listConversation(client.leadId, Number(opportunityId));
    return NextResponse.json({ messages });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load conversation';
    return NextResponse.json({ error: message }, { status: 403 });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const client = requireClientAuth(request);
  if (isClientAuthError(client)) return client;

  const { opportunityId } = await context.params;
  try {
    const body = await request.json() as { text?: string };
    if (!body.text || !body.text.trim()) {
      return NextResponse.json({ error: 'text is required' }, { status: 400 });
    }
    await ClientPortalProductService.postClientMessage(client.leadId, Number(opportunityId), body.text.trim());
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send message';
    return NextResponse.json({ error: message }, { status: 403 });
  }
}
