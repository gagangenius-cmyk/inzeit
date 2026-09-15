import { NextRequest, NextResponse } from 'next/server';
import { ImplementationRoadmapService } from '@/services/implementation-roadmap-service';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['admin.access', 'hr.view', 'pro.view']);
  if (isAuthError(auth)) return auth;

  return NextResponse.json(ImplementationRoadmapService.getRoadmap());
}
