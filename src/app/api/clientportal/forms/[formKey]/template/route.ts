import { NextRequest, NextResponse } from 'next/server';
import { requireClientAuth, isClientAuthError } from '@/lib/clientApiAuth';
import { ClientPortalProductService } from '@/services/client-portal-product-service';

type RouteContext = { params: Promise<{ formKey: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const client = requireClientAuth(request);
  if (isClientAuthError(client)) return client;

  const { formKey } = await context.params;
  try {
    const url = await ClientPortalProductService.getBlankFormPdfUrl(formKey);
    return NextResponse.json({ url });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate template';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
