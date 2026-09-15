import { NextRequest, NextResponse } from 'next/server';
import { requireClientAuth, isClientAuthError } from '@/lib/clientApiAuth';
import { ClientPortalProductService } from '@/services/client-portal-product-service';

type RouteContext = { params: Promise<{ opportunityId: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const client = requireClientAuth(request);
  if (isClientAuthError(client)) return client;

  const { opportunityId } = await context.params;
  try {
    const scores = await ClientPortalProductService.getEligibilityScores(client.leadId, Number(opportunityId));
    return NextResponse.json({ scores });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load eligibility & scores';
    return NextResponse.json({ error: message }, { status: 403 });
  }
}
