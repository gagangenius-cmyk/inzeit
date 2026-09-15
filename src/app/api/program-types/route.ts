import { NextRequest, NextResponse } from 'next/server';
import { CrmCountriesTypeProgram } from '@/models/CrmCountriesTypeProgram';
import { CrmProgramType } from '@/models/CrmProgramType';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (isAuthError(auth)) return auth;

    const { searchParams } = new URL(request.url);
    const countryId = searchParams.get('countryId');
    const programId = searchParams.get('programId');

    if (!countryId || !programId) {
      return NextResponse.json(
        { error: 'Country ID and Program ID are required' },
        { status: 400 }
      );
    }

    // Get types available for this country and program combination
    const countryProgramTypes = await CrmCountriesTypeProgram.findAll({
      where: {
        country: parseInt(countryId),
        program: parseInt(programId)
      },
      raw:true
    });

    // Get the type details
    const typeIds = countryProgramTypes.map(cpt => cpt.type);
    const types = await CrmProgramType.findAll({
      where: {
        id: typeIds,
        status: 1
      },
      order: [['type', 'ASC']]
    });

    return NextResponse.json(types);
  } catch (error) {
    console.error('Error fetching program types:', error);
    return NextResponse.json(
      { error: 'Failed to fetch program types' },
      { status: 500 }
    );
  }
}
