import { NextRequest, NextResponse } from 'next/server';
import { HRService } from '@/services/hr-service';
import { connectDB } from '@/lib/sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

let dbReady = false;
const ensureDB = async () => { if (!dbReady) { await connectDB(); dbReady = true; } };

// HR-triggered reset (not the employee's own change-password flow): generates a new
// random password, forces a change on next login, and best-effort emails it to the
// employee's company inbox. Returns the plaintext password once so HR isn't stuck if
// the mailer isn't configured - never persisted or logged anywhere.
export async function POST(request: NextRequest) {
  const auth = requireAuth(request, ['employees.manage', 'hr.update']);
  if (isAuthError(auth)) return auth;
  try {
    await ensureDB();
    const body = await request.json();
    const id = Number.parseInt(String(body.id || ''), 10);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: 'Valid employee id is required' }, { status: 400 });
    }

    const result = await HRService.resetEmployeePassword(id);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to reset password';
    console.error('Error resetting employee password:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
