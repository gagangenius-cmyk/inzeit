import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { testCrmDelivery } from '@/lib/meta/crm-delivery';

export async function POST(request: NextRequest) {
  const token =
    request.cookies.get('auth-token')?.value ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const cu = token ? verifyToken(token) : null;
  if (!cu) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Only admins (role 1) or high-privilege users should trigger test delivery
  if (cu.role !== 1 && !cu.permissions?.includes('all') && !cu.permissions?.includes('admin.access')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  const result = await testCrmDelivery();
  return NextResponse.json({
    success: result.success,
    status: result.status,
    // Mask response body for security — only show first 500 chars
    body: result.body?.slice(0, 500) ?? null,
    error: result.error,
    endpoint: process.env.META_LEADS_CRM_ENDPOINT || 'https://cmgone.org/api/web-to-leads',
  });
}
