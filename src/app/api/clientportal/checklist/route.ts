import { NextRequest, NextResponse } from 'next/server';
import { requireClientAuth, isClientAuthError } from '@/lib/clientApiAuth';
import { ClientPortalService } from '@/services/client-portal-service';

export async function GET(request: NextRequest) {
  const client = requireClientAuth(request);
  if (isClientAuthError(client)) return client;

  try {
    const data = await ClientPortalService.getChecklist(client.leadId);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to load client checklist:', error);
    return NextResponse.json({ error: 'Failed to load checklist' }, { status: 500 });
  }
}
