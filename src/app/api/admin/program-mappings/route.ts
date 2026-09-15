import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import { sequelize } from '@/lib/sequelize';
import { verifyToken } from '@/lib/auth';
import { isCeo } from '@/lib/roleChecks';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (isAuthError(auth)) return auth;

    const { searchParams } = new URL(request.url);
    const programId = searchParams.get('programId');

    if (!programId) {
      return NextResponse.json({ error: 'programId is required' }, { status: 400 });
    }

    const mappings = await sequelize.query(
      `SELECT
        m.id,
        m.country,
        m.type,
        m.program,
        COALESCE(co.name, '') AS countryName,
        COALESCE(pt.type, '') AS typeName
      FROM crm_countries_type_program m
      LEFT JOIN crm_country_proces co ON m.country = co.id
      LEFT JOIN crm_program_type pt ON m.type = pt.id
      WHERE m.program = :programId
      ORDER BY co.name ASC, pt.type ASC`,
      { replacements: { programId: Number(programId) }, type: QueryTypes.SELECT }
    );

    return NextResponse.json({ data: mappings });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: 'Failed to fetch mappings', details: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token =
      request.cookies.get('auth-token')?.value ||
      request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    const cu = token ? verifyToken(token) : null;
    if (!cu) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const body = await request.json();
    const { programId, countryId, typeId } = body as { programId: unknown; countryId: unknown; typeId: unknown };

    if (!programId || !countryId || !typeId) {
      return NextResponse.json({ error: 'programId, countryId, and typeId are required' }, { status: 400 });
    }

    const [existing] = await sequelize.query<{ id: number }>(
      `SELECT id FROM crm_countries_type_program WHERE country = :countryId AND type = :typeId AND program = :programId LIMIT 1`,
      {
        replacements: { countryId: Number(countryId), typeId: Number(typeId), programId: Number(programId) },
        type: QueryTypes.SELECT,
      }
    );

    if (existing) {
      return NextResponse.json({ error: 'This mapping already exists' }, { status: 409 });
    }

    await sequelize.query(
      `INSERT INTO crm_countries_type_program (country, type, program, created, created_by) VALUES (:countryId, :typeId, :programId, NOW(), :userId)`,
      {
        replacements: {
          countryId: Number(countryId),
          typeId: Number(typeId),
          programId: Number(programId),
          userId: Number(cu.id || 0),
        },
        type: QueryTypes.INSERT,
      }
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: 'Failed to create mapping', details: msg }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token =
      request.cookies.get('auth-token')?.value ||
      request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    const cu = token ? verifyToken(token) : null;
    if (!cu) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    if (!isCeo(cu)) {
      return NextResponse.json({ error: 'Only the CEO can delete records' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    await sequelize.query(
      `DELETE FROM crm_countries_type_program WHERE id = :id`,
      { replacements: { id: Number(id) }, type: QueryTypes.DELETE }
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: 'Failed to delete mapping', details: msg }, { status: 500 });
  }
}
