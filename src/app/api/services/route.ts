import { NextRequest, NextResponse } from 'next/server';
import { CrmService } from '@/models/CrmService';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (isAuthError(auth)) return auth;

    const services = await CrmService.findAll({
      where: {
        status: 1
      },
      order: [['name', 'ASC']]
    });

    return NextResponse.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    );
  }
}
