import { NextRequest, NextResponse } from 'next/server';
import { verifyClientToken, type ClientPrincipal } from '@/lib/clientAuth';

const getToken = (request: NextRequest) =>
  request.cookies.get('client-auth-token')?.value ||
  request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

/**
 * Gate for client-portal API routes. Deliberately distinct from src/lib/apiAuth.ts's
 * requireAuth() (staff) - a client token carries principalType:'client' and is verified
 * with verifyClientToken(), which itself rejects anything without that claim, so a staff
 * auth-token can never satisfy this even if sent under the wrong cookie/header by mistake.
 */
export function requireClientAuth(request: NextRequest): ClientPrincipal | NextResponse {
  const token = getToken(request);
  const client = token ? verifyClientToken(token) : null;

  if (!client) {
    return NextResponse.json({ error: 'Client authentication is required' }, { status: 401 });
  }

  return client;
}

export const isClientAuthError = (result: ClientPrincipal | NextResponse): result is NextResponse => result instanceof NextResponse;
