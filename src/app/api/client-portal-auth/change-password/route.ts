import { NextRequest, NextResponse } from 'next/server';
import { requireClientAuth, isClientAuthError } from '@/lib/clientApiAuth';
import { ClientPortalService } from '@/services/client-portal-service';

export async function POST(request: NextRequest) {
  const client = requireClientAuth(request);
  if (isClientAuthError(client)) return client;

  try {
    const { newPassword } = await request.json() as Record<string, unknown>;
    if (!newPassword || String(newPassword).length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 });
    }

    await ClientPortalService.changePassword(client.leadId, String(newPassword));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Client portal change-password error:', error);
    return NextResponse.json({ error: 'Failed to change password' }, { status: 500 });
  }
}
