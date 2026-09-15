import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import { sequelize, connectDB } from '@/lib/sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

let dbReady = false;
const ensureDB = async () => { if (!dbReady) { await connectDB(); dbReady = true; } };

const VALID_COUNTRIES = ['canada', 'australia'] as const;
const VALID_TOOLS = [
  'eligibility_snapshot', 'crs_calculator', 'pnp_matcher', 'clb_converter', 'processing_times',
  'eligibility_checker', 'points_calculator', 'fee_estimator', 'english_competency',
] as const;

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['leads.view']);
  if (isAuthError(auth)) return auth;

  await ensureDB();
  const { searchParams } = new URL(request.url);
  const leadId = searchParams.get('leadId');
  const limit = Math.min(50, Number(searchParams.get('limit')) || 20);

  const where = leadId ? 'WHERE r.lead_id = :leadId' : 'WHERE r.employee_id = :employeeId';
  const rows = await sequelize.query(
    `SELECT
       r.id, r.lead_id AS leadId, r.employee_id AS employeeId, e.name AS employeeName,
       r.country, r.tool, r.headline_score AS headlineScore, r.input, r.result, r.created_at AS createdAt
     FROM crm_immigration_tool_results r
     LEFT JOIN crm_employee e ON e.id = r.employee_id
     ${where}
     ORDER BY r.created_at DESC
     LIMIT :limit`,
    { replacements: { leadId, employeeId: auth.id, limit }, type: QueryTypes.SELECT }
  );

  return NextResponse.json({ success: true, results: rows });
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request, ['leads.view']);
  if (isAuthError(auth)) return auth;

  await ensureDB();
  const body = await request.json().catch(() => ({}));
  const { leadId, country, tool, input, result, headlineScore } = body || {};

  if (!VALID_COUNTRIES.includes(country)) {
    return NextResponse.json({ error: 'Invalid country' }, { status: 400 });
  }
  if (!VALID_TOOLS.includes(tool)) {
    return NextResponse.json({ error: 'Invalid tool' }, { status: 400 });
  }
  if (typeof input !== 'object' || input === null || typeof result !== 'object' || result === null) {
    return NextResponse.json({ error: 'Missing input/result payload' }, { status: 400 });
  }

  const [insertResult] = await sequelize.query(
    `INSERT INTO crm_immigration_tool_results (lead_id, employee_id, country, tool, headline_score, input, result)
     VALUES (:leadId, :employeeId, :country, :tool, :headlineScore, :input, :result)`,
    {
      replacements: {
        leadId: leadId ? Number(leadId) : null,
        employeeId: auth.id,
        country,
        tool,
        headlineScore: headlineScore ? String(headlineScore).slice(0, 60) : null,
        input: JSON.stringify(input),
        result: JSON.stringify(result),
      },
    }
  );

  return NextResponse.json({ success: true, id: (insertResult as { insertId?: number })?.insertId });
}
