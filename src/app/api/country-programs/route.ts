import { NextRequest, NextResponse } from 'next/server';
import { CrmCountriesTypeProgram } from '@/models/CrmCountriesTypeProgram';
import { CrmService } from '@/models/CrmService';
import { Op } from 'sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (isAuthError(auth)) return auth;

    const { searchParams } = new URL(request.url);
    const countryId = searchParams.get('countryId');

    if (!countryId) {
      return NextResponse.json(
        { error: 'Country ID is required' },
        { status: 400 }
      );
    }

    const countryPrograms = await CrmCountriesTypeProgram.findAll({
      where: {
        country: parseInt(countryId)
      },
      raw:true
    });

    const programIds = countryPrograms.map(cp => cp.program);

    if (programIds.length === 0) {
      return NextResponse.json([]);
    }

    const programs = await CrmService.findAll({
      where: {
        id: { [Op.in]: programIds },
        status: 1
      },
      order: [['name', 'ASC']]
    });

    return NextResponse.json(programs);
  } catch (error) {
    console.error('Error fetching country programs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch country programs' },
      { status: 500 }
    );
  }
}
