import { NextRequest, NextResponse } from 'next/server';
import { CrmProgramType } from '@/models/CrmProgramType';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (isAuthError(auth)) return auth;

    const programs = await CrmProgramType.findAll({
      where: {
        status: 1
      },
      order: [['type', 'ASC']]
    });

    return NextResponse.json(programs);
  } catch (error) {
    console.error('Error fetching programs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch programs' },
      { status: 500 }
    );
  }
}
