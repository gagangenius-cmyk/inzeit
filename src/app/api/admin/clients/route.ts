import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import { CrmClients } from '@/models';
import { createCrudHandlers } from '@/lib/apiCrud';
import { sequelize, connectDB } from '@/lib/sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { isBranchManagerOrCeo, isCeo } from '@/lib/roleChecks';

let dbReady = false;
const ensureDB = async () => { if (!dbReady) { await connectDB(); dbReady = true; } };

const handlers = createCrudHandlers({
  model: CrmClients,
  entityName: 'client',
  searchFields: ['first_name', 'last_name', 'email', 'city', 'nationality'],
  filters: {
    status: 'status',
    verification: 'verify',
  },
  defaults: (body) => ({
    created: body.created || new Date(),
    token_validity:
      body.token_validity || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  }),
});

type ClientListRow = {
  id: number;
  opportunityId: number | null;
  leadId: number;
  case_activated_at: Date | string | null;
  fname: string | null;
  lname: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  dob: Date | string | null;
  address: string | null;
  area: string | null;
  nationality: string | null;
  assignTo: number | null;
  branchName: string | null;
  branchAddress: string | null;
  branchEmail: string | null;
  branchMobile: string | null;
  branchLicenseNumber: string | null;
  branchVatGstPercent: number | null;
  currencyCode: string | null;
};

// A lead becomes a formal "Client" once BOTH accounts (finance) verification
// and compliance verification are approved on its workflow review — see
// crm_opportunity_workflow_reviews.finance_status / .compliance_status, set via
// src/app/api/opportunities/[id]/workflow/route.ts. The legacy crm_clients
// table is never populated by any live code path, so GET reads from the
// workflow review directly instead (POST/PUT/DELETE below are left against
// crm_clients since nothing in the app currently exercises them).
export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['clients.view']);
  if (isAuthError(auth)) return auth;
  try {
    await ensureDB();
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number.parseInt(searchParams.get('limit') || '200', 10), 500);
    const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10));
    const offset = (page - 1) * limit;
    const search = searchParams.get('search') || '';

    const conditions = [
      `w.finance_status = 'approved'`,
      `w.compliance_status = 'approved'`,
      `TRIM(LOWER(COALESCE(o.status, ''))) IN ('won', 'closed won', 'close won')`,
    ];
    const replacements: Record<string, unknown> = { limit, offset };
    if (search) {
      conditions.push(`(l.fname LIKE :search OR l.lname LIKE :search OR l.email LIKE :search)`);
      replacements.search = `%${search}%`;
    }
    // Branch Manager sees only their own branch's clients here - CEO and
    // every other clients.view holder (operations tier, finance, etc.) are
    // unaffected, matching the exemption pattern used across this app.
    if (isBranchManagerOrCeo(auth) && !isCeo(auth)) {
      conditions.push(`l.branch = :userBranch`);
      replacements.userBranch = auth.branch || 0;
    }

    const fromAndWhere = `
       FROM crm_opportunity_workflow_reviews w
       INNER JOIN (
         SELECT wr.lead_id, MAX(wr.id) AS maxId
         FROM crm_opportunity_workflow_reviews wr
         JOIN crm_opportunities owr ON owr.id = wr.opportunity_id
         WHERE wr.finance_status = 'approved' AND wr.compliance_status = 'approved'
           AND TRIM(LOWER(COALESCE(owr.status, ''))) IN ('won', 'closed won', 'close won')
         GROUP BY lead_id
       ) latest ON latest.maxId = w.id
       JOIN crm_forum_leads l ON l.id = w.lead_id
       JOIN crm_opportunities o ON o.id = w.opportunity_id
       LEFT JOIN crm_branch b ON l.branch = b.id
       WHERE ${conditions.join(' AND ')}`;

    const [rows, [{ total }]] = await Promise.all([
      sequelize.query<ClientListRow>(
        `SELECT
           w.id, w.opportunity_id AS opportunityId, w.lead_id AS leadId, w.case_activated_at,
           l.fname, l.lname, l.email, l.phone, l.mobile, l.dob, l.address, l.area, l.nationality, l.assignTo,
           b.name AS branchName, b.address AS branchAddress, b.email AS branchEmail,
           b.mobile AS branchMobile, b.license_number AS branchLicenseNumber, b.vat_gst_percent AS branchVatGstPercent,
           (
             SELECT c.currency_code FROM crm_currency c
             WHERE c.status = 1
               AND LOWER(TRIM(c.country)) IN (
                 LOWER(TRIM(b.branch)), LOWER(TRIM(b.name)), LOWER(TRIM(b.abbrv)),
                 CASE
                   WHEN LOWER(CONCAT_WS(' ', b.name, b.branch, b.abbrv, b.address)) REGEXP 'dubai|abu dhabi|sharjah|ajman|fujairah|ras al khaimah|umm al quwain'
                     THEN 'united arab emirates'
                   ELSE ''
                 END
               )
             ORDER BY CASE
               WHEN LOWER(TRIM(c.country)) = LOWER(TRIM(b.branch)) THEN 1
               WHEN LOWER(TRIM(c.country)) = LOWER(TRIM(b.name)) THEN 2
               ELSE 3
             END
             LIMIT 1
           ) AS currencyCode
         ${fromAndWhere}
         ORDER BY w.case_activated_at DESC
         LIMIT :limit OFFSET :offset`,
        { replacements, type: QueryTypes.SELECT }
      ),
      sequelize.query<{ total: number }>(
        `SELECT COUNT(*) AS total ${fromAndWhere}`,
        { replacements, type: QueryTypes.SELECT }
      ),
    ]);

    const data = rows.map((r) => ({
      id: r.id,
      opportunityId: r.opportunityId,
      leadId: r.leadId,
      first_name: r.fname || '',
      last_name: r.lname || '',
      email: r.email || '',
      phone: r.mobile || r.phone || '',
      image: '',
      dob: r.dob || new Date(0),
      address: r.address || '',
      full_address: r.address || '',
      token: '',
      token_validity: r.case_activated_at || new Date(0),
      verify: 1,
      password: '',
      hash_password: '',
      status: 1,
      accept: 1,
      created: r.case_activated_at || new Date(0),
      case_manager: r.assignTo || 0,
      backend_person: r.assignTo || 0,
      is_deleted: 0,
      city: r.area || '',
      nationality: r.nationality || '',
      branchName: r.branchName || '',
      branchAddress: r.branchAddress || '',
      branchEmail: r.branchEmail || '',
      branchMobile: r.branchMobile || '',
      branchLicenseNumber: r.branchLicenseNumber || null,
      branchVatGstPercent: r.branchVatGstPercent ?? null,
      currencyCode: r.currencyCode || 'AED',
    }));

    return NextResponse.json({ data, pagination: { page, limit, total: Number(total), totalPages: Math.ceil(Number(total) / limit) } });
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}

export const POST = handlers.POST;
export const PUT = handlers.PUT;
export const DELETE = handlers.DELETE;
