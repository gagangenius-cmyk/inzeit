import { NextRequest, NextResponse } from 'next/server';
import { requireClientAuth, isClientAuthError } from '@/lib/clientApiAuth';
import { ClientPortalService } from '@/services/client-portal-service';

export async function GET(request: NextRequest) {
  const client = requireClientAuth(request);
  if (isClientAuthError(client)) return client;

  try {
    const log = await ClientPortalService.listStatusLog(client.leadId);
    return NextResponse.json({ log });
  } catch (error) {
    console.error('Failed to load client status log:', error);
    return NextResponse.json({ error: 'Failed to load status updates' }, { status: 500 });
  }
}
