import { NextRequest, NextResponse } from 'next/server';
import { requireClientAuth, isClientAuthError } from '@/lib/clientApiAuth';
import { ClientPortalProductService } from '@/services/client-portal-product-service';

export async function GET(request: NextRequest) {
  const client = requireClientAuth(request);
  if (isClientAuthError(client)) return client;

  try {
    const products = await ClientPortalProductService.listProducts(client.leadId);
    return NextResponse.json({ products });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load products';
    return NextResponse.json({ error: message }, { status: 403 });
  }
}
