import { NextRequest, NextResponse } from 'next/server';
import { requireClientAuth, isClientAuthError } from '@/lib/clientApiAuth';
import { ClientPortalProductService } from '@/services/client-portal-product-service';

type RouteContext = { params: Promise<{ opportunityId: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const client = requireClientAuth(request);
  if (isClientAuthError(client)) return client;

  const { opportunityId } = await context.params;
  try {
    const stages = await ClientPortalProductService.getChecklist(client.leadId, Number(opportunityId));
    return NextResponse.json({ stages });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load checklist';
    return NextResponse.json({ error: message }, { status: 403 });
  }
}
