import { NextRequest, NextResponse } from 'next/server';
import { requireClientAuth, isClientAuthError } from '@/lib/clientApiAuth';
import { ClientPortalService } from '@/services/client-portal-service';

export async function GET(request: NextRequest) {
  const client = requireClientAuth(request);
  if (isClientAuthError(client)) return client;

  try {
    const lead = await ClientPortalService.getMe(client.leadId);
    return NextResponse.json({ profile: lead });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load profile';
    return NextResponse.json({ error: message }, { status: 403 });
  }
}
