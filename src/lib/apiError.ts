import { NextResponse } from 'next/server';

export function apiError(error: unknown, fallback = 'Request failed', status = 500) {
  const message = error instanceof Error ? error.message : fallback;
  console.error(fallback, error);
  return NextResponse.json({ success: false, error: fallback, ...(process.env.NODE_ENV === 'development' ? { detail: message } : {}) }, { status });
}

export function invalidRequest(error: string) {
  return NextResponse.json({ success: false, error }, { status: 400 });
}
