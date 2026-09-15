import { NextRequest, NextResponse } from 'next/server';
import { requireClientAuth, isClientAuthError } from '@/lib/clientApiAuth';
import { ClientPortalProductService } from '@/services/client-portal-product-service';

export async function GET(request: NextRequest) {
  const client = requireClientAuth(request);
  if (isClientAuthError(client)) return client;

  try {
    const submissions = await ClientPortalProductService.listFormSubmissions(client.leadId);
    return NextResponse.json({ submissions });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load form submissions';
    return NextResponse.json({ error: message }, { status: 403 });
  }
}

export async function POST(request: NextRequest) {
  const client = requireClientAuth(request);
  if (isClientAuthError(client)) return client;

  try {
    const body = await request.json() as { formKey?: string; opportunityId?: number | null; data?: Record<string, string> };
    if (!body.formKey || !body.data) {
      return NextResponse.json({ error: 'formKey and data are required' }, { status: 400 });
    }
    const result = await ClientPortalProductService.submitForm(client.leadId, body.opportunityId ?? null, body.formKey, body.data);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to submit form';
    return NextResponse.json({ error: message }, { status: 403 });
  }
}
