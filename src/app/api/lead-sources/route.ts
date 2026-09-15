import { NextRequest, NextResponse } from 'next/server';
import { CrmSource } from '@/models/CrmSource';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (isAuthError(auth)) return auth;

    // Get all active lead sources
    const leadSources = await CrmSource.findAll({
      where: {
        status: 1
      },
      order: [['name', 'ASC']],
      raw: true
    });

    return NextResponse.json(leadSources);
  } catch (error) {
    console.error('Error fetching lead sources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lead sources' },
      { status: 500 }
    );
  }
}
