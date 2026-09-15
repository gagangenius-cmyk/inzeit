import { NextRequest, NextResponse } from 'next/server';
import { requireClientAuth, isClientAuthError } from '@/lib/clientApiAuth';
import { ClientPortalProductService } from '@/services/client-portal-product-service';

// Not opportunity-scoped - a client's personal info is one record shared across all their
// products, unlike the per-opportunity pages under /api/clientportal/[opportunityId]/*.
export async function GET(request: NextRequest) {
  const client = requireClientAuth(request);
  if (isClientAuthError(client)) return client;

  try {
    const info = await ClientPortalProductService.getPersonalInfo(client.leadId);
    return NextResponse.json(info);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load personal information';
    return NextResponse.json({ error: message }, { status: 403 });
  }
}

export async function PATCH(request: NextRequest) {
  const client = requireClientAuth(request);
  if (isClientAuthError(client)) return client;

  try {
    const body = await request.json() as { field?: string; value?: string };
    if (body.field !== 'email' && body.field !== 'phone') {
      return NextResponse.json({ error: 'field must be "email" or "phone"' }, { status: 400 });
    }
    if (!body.value || !body.value.trim()) {
      return NextResponse.json({ error: 'value is required' }, { status: 400 });
    }

    const result = await ClientPortalProductService.requestProfileChange(client.leadId, body.field, body.value.trim());
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to submit change request';
    return NextResponse.json({ error: message }, { status: 403 });
  }
}
