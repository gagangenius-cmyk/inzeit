import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import { CrmcForumLeadsContracts } from '@/models';
import { sequelize, connectDB } from '@/lib/sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

let dbReady = false;
const ensureDB = async () => { if (!dbReady) { await connectDB(); dbReady = true; } };

export async function POST(request: NextRequest) {
  const auth = requireAuth(request, ['agreements.create']);
  if (isAuthError(auth)) return auth;
  try {
    await ensureDB();
    const body = await request.json();
    const contractIdStr = `contract_${Date.now()}.pdf`;

    const contract = await CrmcForumLeadsContracts.create({
      leadId: Number(body.leadId),
      contract: body.contract || contractIdStr,
      unsigned_contract: body.unsigned_contract || `unsigned_${contractIdStr}`,
      new_contract: body.new_contract || null,
      ar_contract: body.ar_contract || `ar_${contractIdStr}`,
      garys: body.garys || null,
      remarks: body.specialTerms || body.remarks || null,
      verify: body.verify ?? 0,
      verify_by: body.verify_by ?? 0,
      verify_date: body.verify_date || null,
      batch_id: body.batch_id ?? 0,
      wp_batch_id: body.wp_batch_id ?? 0,
      vendor_id: body.vendor_id ?? 0,
      employer_id: body.employer_id ?? 0,
      old_crm_ag_id: body.old_crm_ag_id ?? 0,
      payment_status: body.payment_status ?? 0,
    } as any);

    return NextResponse.json(contract, { status: 201 });
  } catch (error) {
    console.error('Error creating contract:', error);
    return NextResponse.json({ error: 'Failed to create contract' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['agreements.view']);
  if (isAuthError(auth)) return auth;
  try {
    await ensureDB();
    const { searchParams } = new URL(request.url);
    const leadId = Number.parseInt(searchParams.get('leadId') || '', 10);
    const page = Number.parseInt(searchParams.get('page') || '1', 10);
    const limit = Number.parseInt(searchParams.get('limit') || '50', 10);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    // Per-lead lookup (used by lead detail view)
    if (leadId) {
      const { rows, count } = await CrmcForumLeadsContracts.findAndCountAll({
        where: { leadId },
        limit,
        offset: (page - 1) * limit,
        order: [['id', 'DESC']],
      });
      return NextResponse.json({ contracts: rows, pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) } });
    }

    // Global listing for Contract Management page
    const conditions: string[] = ['1=1'];
    const replacements: Record<string, unknown> = { limit, offset: (page - 1) * limit };

    if (search) {
      conditions.push(`(l.fname LIKE :search OR l.lname LIKE :search OR c.contract LIKE :search OR c.id LIKE :searchId)`);
      replacements.search = `%${search}%`;
      replacements.searchId = `%${search}%`;
    }
    if (status) {
      if (status === 'signed') conditions.push(`c.verify = 1`);
      else if (status === 'pending') conditions.push(`c.verify = 0 AND c.contract IS NOT NULL`);
      else if (status === 'draft') conditions.push(`(c.contract IS NULL OR c.contract = '')`);
    }

    const where = conditions.join(' AND ');
    const rows = await sequelize.query<{
      id: number; leadId: number; lead_fname: string; lead_lname: string;
      lead_email: string; lead_phone: string; contract: string; verify: number;
      verify_date: string; remarks: string; payment_status: number;
      branch_name: string; counselor_name: string; created: string;
    }>(
      `SELECT
        c.id, c.leadId,
        COALESCE(l.fname,'') AS lead_fname, COALESCE(l.lname,'') AS lead_lname,
        COALESCE(l.email,'') AS lead_email, COALESCE(l.phone, l.mobile,'') AS lead_phone,
        COALESCE(c.contract,'') AS contract,
        COALESCE(c.verify,0) AS verify,
        c.verify_date, c.remarks,
        COALESCE(c.payment_status,0) AS payment_status,
        COALESCE(b.branch,'N/A') AS branch_name,
        COALESCE(e.name,'Unassigned') AS counselor_name,
        COALESCE(l.created, l.regdate) AS created
      FROM crm_forum_leads_contracts c
      LEFT JOIN crm_forum_leads l ON l.id = c.leadId
      LEFT JOIN crm_branch b ON b.id = l.branch
      LEFT JOIN crm_employee e ON e.id = l.assignTo
      WHERE ${where}
      ORDER BY c.id DESC
      LIMIT :limit OFFSET :offset`,
      { replacements, type: QueryTypes.SELECT }
    );

    const [countRow] = await sequelize.query<{ total: number }>(
      `SELECT COUNT(*) AS total FROM crm_forum_leads_contracts c LEFT JOIN crm_forum_leads l ON l.id = c.leadId WHERE ${where}`,
      { replacements, type: QueryTypes.SELECT }
    );

    const total = Number(countRow?.total || 0);
    const contracts = rows.map(r => ({
      id: r.id,
      leadId: r.leadId,
      leadName: `${r.lead_fname} ${r.lead_lname}`.trim() || `Lead #${r.leadId}`,
      contractNumber: `CNT-${String(r.id).padStart(5, '0')}`,
      type: 'Immigration Agreement',
      status: r.verify === 1 ? 'signed' : r.contract ? 'pending' : 'draft',
      amount: '0',
      currency: 'AED',
      createdDate: r.created || new Date().toISOString(),
      signedDate: r.verify_date || undefined,
      counsilorName: r.counselor_name,
      branchName: r.branch_name,
      fileName: r.contract || '',
      fileSize: r.contract ? 'PDF' : '',
      paymentStatus: r.payment_status,
    }));

    return NextResponse.json({ contracts, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error('Error fetching contracts:', error);
    return NextResponse.json({ error: 'Failed to fetch contracts' }, { status: 500 });
  }
}
