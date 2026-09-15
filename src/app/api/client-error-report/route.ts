import { NextRequest, NextResponse } from 'next/server';
import { captureError } from '@/lib/errorTracking';

// Receives crashes from the client-side global error boundary
// (src/app/global-error.tsx, a 'use client' component that can't import
// errorTracking.ts directly - it uses Node's `crypto`, which can't be
// bundled into client code). Deliberately public (no auth): a crash can
// happen before/during login, and the whole point is to hear about it
// regardless of session state. No-ops safely (via captureError) when
// SENTRY_DSN isn't configured.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = typeof body?.message === 'string' ? body.message : 'Unknown client error';
    captureError(new Error(message), {
      route: 'client:global-error',
      extra: { digest: body?.digest, url: body?.url, stack: body?.stack },
    });
    return NextResponse.json({ success: true });
  } catch {
    // Never let a broken error report itself become a visible failure.
    return NextResponse.json({ success: true });
  }
}
