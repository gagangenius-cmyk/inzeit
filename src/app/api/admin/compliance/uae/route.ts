import { NextRequest, NextResponse } from 'next/server';
import { UAEComplianceService } from '@/services/uae-compliance-service';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['pro.view', 'pro.wps.view']);
  if (isAuthError(auth)) return auth;
  try {
    const compliance = await UAEComplianceService.getComplianceChecks();
    return NextResponse.json(compliance);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load UAE compliance checks';
    console.error('Failed to load UAE compliance checks:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
