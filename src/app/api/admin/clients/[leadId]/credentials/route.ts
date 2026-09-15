import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { ClientPortalService } from '@/services/client-portal-service';
import { checkLeadBranchScope } from '@/lib/branchScopeGuard';

type Context = { params: Promise<{ leadId: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  const auth = requireAuth(request, ['clients.update', 'clients.view']);
  if (isAuthError(auth)) return auth;

  try {
    const leadId = Number((await params).leadId);
    if (!Number.isFinite(leadId)) return NextResponse.json({ error: 'Invalid lead id' }, { status: 400 });

    const result = await ClientPortalService.getCredentialDetails(leadId);
    return NextResponse.json({
      success: true,
      credentials: result ? {
        email: result.email,
        username: result.email,
        temporaryPassword: result.temporaryPassword,
        generatedAt: result.generatedAt,
        loginUrl: `${request.nextUrl.origin}/clientportal/login`,
      } : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load client credentials';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// Credential generation is gated server-side on clients.update regardless of what
// the counselor's UI shows, and ClientPortalService.generateCredentials()
// re-derives compliance/finance approval itself - this cannot be bypassed by a
// direct API call with a client-supplied "it's approved" flag.
export async function POST(request: NextRequest, { params }: Context) {
  const auth = requireAuth(request, ['clients.update', 'clients.view']);
  if (isAuthError(auth)) return auth;

  try {
    const leadId = Number((await params).leadId);
    if (!Number.isFinite(leadId)) return NextResponse.json({ error: 'Invalid lead id' }, { status: 400 });

    const scopeError = await checkLeadBranchScope(auth, leadId);
    if (scopeError) return scopeError;

    const result = await ClientPortalService.generateCredentials(leadId, String(auth.id));
    return NextResponse.json({
      success: true,
      email: result.email,
      username: result.email,
      temporaryPassword: result.temporaryPassword,
      generatedAt: result.generatedAt || null,
      loginUrl: `${request.nextUrl.origin}/clientportal/login`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate client credentials';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
