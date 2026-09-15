import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { verifyPassword } from '@/lib/auth';
import { disableMfa } from '@/lib/mfa';
import { CrmEmployee } from '@/models';

// Requires the current password (not just an active session) to disable —
// otherwise a hijacked/left-open session could silently strip the one
// protection MFA exists to add.
export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (isAuthError(auth)) return auth;
  try {
    const { password } = await request.json();
    if (!password) {
      return NextResponse.json({ error: 'Current password is required' }, { status: 400 });
    }

    const employee = await CrmEmployee.findByPk(auth.id, { raw: true }) as { password?: string | null } | null;
    const stored = employee?.password ?? '';
    const passwordOk = stored ? await verifyPassword(password, stored) : false;
    if (!passwordOk) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
    }

    await disableMfa(auth.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to disable MFA:', error);
    return NextResponse.json({ error: 'Failed to disable MFA' }, { status: 500 });
  }
}
