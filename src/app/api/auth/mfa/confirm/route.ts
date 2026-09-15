import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { confirmEnrollment } from '@/lib/mfa';

// Step 2 of enrollment: proves the employee actually captured a working
// secret before MFA is switched on for their account, and hands back the
// one-time backup codes — the only moment they're ever available in plain
// text, since they're stored bcrypt-hashed from here on.
export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (isAuthError(auth)) return auth;
  try {
    const { code } = await request.json();
    if (!code) {
      return NextResponse.json({ error: 'Verification code is required' }, { status: 400 });
    }

    const result = await confirmEnrollment(auth.id, code);
    if (!result) {
      return NextResponse.json({ error: 'Invalid verification code. Please scan the QR code again and try once more.' }, { status: 400 });
    }

    return NextResponse.json({ success: true, backupCodes: result.backupCodes });
  } catch (error) {
    console.error('Failed to confirm MFA enrollment:', error);
    return NextResponse.json({ error: 'Failed to confirm MFA enrollment' }, { status: 500 });
  }
}
