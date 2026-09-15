import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { startEnrollment } from '@/lib/mfa';

// Step 1 of enrollment: mint a fresh secret and return it as a QR-ready
// otpauth:// URL plus the raw secret for manual entry. Not yet enabled —
// /api/auth/mfa/confirm must see a valid code from it first.
export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (isAuthError(auth)) return auth;
  try {
    const { secret, otpauthUrl } = await startEnrollment(auth.id, auth.email || auth.name);
    return NextResponse.json({ secret, otpauthUrl });
  } catch (error) {
    console.error('Failed to start MFA enrollment:', error);
    return NextResponse.json({ error: 'Failed to start MFA enrollment' }, { status: 500 });
  }
}
