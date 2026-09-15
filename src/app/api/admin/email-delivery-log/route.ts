import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { listEmailDeliveryLog } from '@/lib/mailer';

// Failed/stuck outbound-email visibility - previously nothing tracked send
// status at all (see src/lib/mailer.ts). Gated by the same permission the
// email-templates admin page itself uses, so anyone who can manage
// templates can also see whether their emails are actually being delivered.
export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['templates.manage', 'settings.manage']);
  if (isAuthError(auth)) return auth;
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const entries = await listEmailDeliveryLog({
      status: status === 'sent' || status === 'failed' ? status : undefined,
      limit: Number.parseInt(searchParams.get('limit') || '100', 10),
    });
    const failedCount = entries.filter((e) => e.status === 'failed').length;
    return NextResponse.json({ success: true, entries, summary: { total: entries.length, failed: failedCount } });
  } catch (error) {
    console.error('Failed to fetch email delivery log:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch email delivery log' }, { status: 500 });
  }
}
