import { NextRequest, NextResponse } from 'next/server';
import { verifyMfaPendingToken, buildAuthSessionForEmployeeId } from '@/lib/auth';
import { verifyLoginCode } from '@/lib/mfa';
import { checkRateLimit, recordFailedAttempt, clearRateLimit, getClientIp } from '@/lib/rateLimiter';
import { captureError } from '@/lib/errorTracking';

// Second step of login for MFA-enrolled employees (see /api/auth/login,
// which withholds the real auth-token cookie and issues a 5-minute
// mfa-pending-token instead once a password checks out for such an
// employee). This route trades a correct code for the real session cookie.
export async function POST(request: NextRequest) {
  try {
    const pendingToken = request.cookies.get('mfa-pending-token')?.value;
    if (!pendingToken) {
      return NextResponse.json({ message: 'No pending login to verify. Please sign in again.' }, { status: 401 });
    }

    const employeeId = verifyMfaPendingToken(pendingToken);
    if (!employeeId) {
      return NextResponse.json({ message: 'This login attempt has expired. Please sign in again.' }, { status: 401 });
    }

    const { code } = await request.json();
    if (!code) {
      return NextResponse.json({ message: 'Verification code is required' }, { status: 400 });
    }

    // Separate, tighter-scoped rate limit from the password step — keyed by
    // employee id (not username) since only the holder of a valid pending
    // token reaches this point at all.
    const rateLimitKey = `mfa:${getClientIp(request)}:${employeeId}`;
    const rateLimit = checkRateLimit(rateLimitKey, { maxAttempts: 8, windowMs: 15 * 60 * 1000 });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { message: 'Too many attempts. Please try again in a few minutes.' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } }
      );
    }

    const ok = await verifyLoginCode(employeeId, code);
    if (!ok) {
      recordFailedAttempt(rateLimitKey);
      return NextResponse.json({ message: 'Invalid verification code' }, { status: 401 });
    }
    clearRateLimit(rateLimitKey);

    const authUser = await buildAuthSessionForEmployeeId(employeeId);
    if (!authUser) {
      return NextResponse.json({ message: 'Account is no longer active' }, { status: 401 });
    }

    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        id: authUser.id,
        name: authUser.name,
        email: authUser.email,
        cemail: authUser.cemail,
        role: authUser.role,
        branch: authUser.branch,
        region: authUser.region,
        type: authUser.type,
        roleName: authUser.roleName,
        photo: authUser.photo,
        wfh: authUser.wfh,
        permissions: authUser.permissions,
        mustChangePassword: authUser.mustChangePassword,
      },
    });

    response.cookies.set('auth-token', authUser.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60,
    });
    response.cookies.set('mfa-pending-token', '', { httpOnly: true, maxAge: 0 });

    return response;
  } catch (error) {
    console.error('MFA verification error:', error);
    captureError(error, { route: 'POST /api/auth/verify-mfa' });
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
