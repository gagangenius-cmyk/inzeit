import { NextRequest, NextResponse } from 'next/server';
import { ITSupportService } from '@/services/it-support-service';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['it.config', 'it.manage']);
  if (isAuthError(auth)) return auth;
  try {
    const directorApprovalThresholdAed = await ITSupportService.getDirectorThresholdAed();
    return NextResponse.json({ directorApprovalThresholdAed });
  } catch (error) {
    console.error('Failed to fetch IT support settings:', error);
    return NextResponse.json({ error: 'Failed to fetch IT support settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = requireAuth(request, ['it.config']);
  if (isAuthError(auth)) return auth;
  try {
    const body = await request.json() as Record<string, unknown>;
    const value = Number(body.directorApprovalThresholdAed);
    if (!Number.isFinite(value) || value < 0) {
      return NextResponse.json({ error: 'directorApprovalThresholdAed must be a non-negative number' }, { status: 400 });
    }
    const result = await ITSupportService.setDirectorThresholdAed(auth, value);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to update IT support settings:', error);
    return NextResponse.json({ error: 'Failed to update IT support settings' }, { status: 500 });
  }
}
