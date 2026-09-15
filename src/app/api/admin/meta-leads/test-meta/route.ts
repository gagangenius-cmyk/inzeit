import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { testMetaConnection } from '@/lib/meta/graph-api';

export async function POST(request: NextRequest) {
  const token =
    request.cookies.get('auth-token')?.value ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const cu = token ? verifyToken(token) : null;
  if (!cu) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const result = await testMetaConnection();
  return NextResponse.json(result);
}
