import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import { sequelize } from '@/lib/sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { isCeo, isCounsellor } from '@/lib/roleChecks';
import { getSlaMinutes } from '@/lib/leadPool';

// 'admin'/'branch_manager' can bulk-transfer any/their-branch's leads to a
// chosen counsellor (the original feature this route shipped with). 'agent'
// is the newer self-serve tier — added so a plain counsellor/advisor isn't
// simply 403'd out of the pool (as this local roleCat() used to do for
// anyone who wasn't a manager or admin), and can instead see and claim
// unassigned leads in their own branch. requireAuth(...leads.view) below is
// the actual permission gate; this only decides which extra capabilities a
// permitted caller gets.
function roleCat(cu: { type?: string | null; role?: number | null; roleName?: string | null }) {
  if (Number(cu.role) === 1) return 'admin';
  // CEO shares crm_role.type='director' with Director/Founder/Super Admin, so it's
  // already covered by the type check below — but roleName is checked explicitly
  // too in case that ever changes.
  if (isCeo(cu)) return 'admin';
  const t = String(cu.type || '').toLowerCase().replace(/[\s-]+/g, '_');
  if (['super_admin', 'admin', 'administrator', 'director', 'dos', 'director_of_sales', 'founder'].includes(t)) return 'admin';
  // FOE gets the same branch-scoped access as Branch Manager here — both are
  // meant to assign unassigned leads within their own branch.
  if (['branch_manager', 'bm', 'foe'].includes(t)) return 'branch_manager';
  return 'agent';
}

type LeadFilters = {
  search?: string;
  status?: string;
  assigned?: string;
  dateFrom?: string;
  dateTo?: string;
  priority?: string;
  branch?: string;
  nationality?: string;
  serviceInterest?: string;
  marketSource?: string;
};

// Shared by GET (listing) and POST (the "select all matching leads" transfer)
// so the set of leads a bulk transfer acts on always matches what the user
// filtered down to on screen.
function buildLeadConditions(cat: string, userBranch: number, filters: LeadFilters) {
  const conds: string[] = ['1=1'];
  const rep: Record<string, unknown> = {};

  if ((cat === 'branch_manager' || cat === 'agent') && userBranch) {
    conds.push('l.branch = :userBranch');
    rep.userBranch = userBranch;
  }
  // An agent's pool view is specifically the self-serve claim queue, not a
  // general lead browser (LeadManagement.tsx already covers that, properly
  // permission-scoped) — always unassigned-only regardless of the client's
  // `assigned` filter, so this endpoint can't be used to bulk-browse
  // colleagues' already-assigned leads.
  if (cat === 'agent') {
    conds.push('(l.assignTo IS NULL OR l.assignTo = 0)');
  } else if (filters.assigned === 'unassigned') {
    conds.push('(l.assignTo IS NULL OR l.assignTo = 0)');
  } else if (filters.assigned === 'assigned') {
    conds.push('l.assignTo IS NOT NULL AND l.assignTo > 0');
  }
  if (filters.search) {
    conds.push(`(LOWER(CONCAT(COALESCE(l.fname,''),' ',COALESCE(l.lname,''))) LIKE LOWER(:search) OR LOWER(COALESCE(l.email,'')) LIKE LOWER(:search) OR COALESCE(l.phone,'') LIKE :search OR COALESCE(l.mobile,'') LIKE :search)`);
    rep.search = `%${filters.search}%`;
  }
  if (filters.status) {
    conds.push(`LOWER(COALESCE(l.status,'')) = LOWER(:status)`);
    rep.status = filters.status;
  }
  if (filters.dateFrom) { conds.push('DATE(COALESCE(l.created,l.regdate)) >= :dateFrom'); rep.dateFrom = filters.dateFrom; }
  if (filters.dateTo)   { conds.push('DATE(COALESCE(l.created,l.regdate)) <= :dateTo');   rep.dateTo   = filters.dateTo;   }
  if (filters.priority) { conds.push('LOWER(COALESCE(l.priority,"")) = LOWER(:priority)'); rep.priority = filters.priority; }
  if (filters.branch && cat !== 'branch_manager') { conds.push('l.branch = :branchFilter'); rep.branchFilter = Number(filters.branch); }
  if (filters.nationality) { conds.push('LOWER(COALESCE(l.nationality,"")) LIKE LOWER(:nationality)'); rep.nationality = `%${filters.nationality}%`; }
  if (filters.serviceInterest) { conds.push('l.service_interest = :serviceInterest'); rep.serviceInterest = filters.serviceInterest; }
  if (filters.marketSource) { conds.push('l.market_source = :marketSource'); rep.marketSource = filters.marketSource; }

  return { where: `WHERE ${conds.join(' AND ')}`, rep };
}


export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['leads.view']);
  if (isAuthError(auth)) return auth;
  try {
    const cu = auth;
    const cat = roleCat(cu);
    const userBranch = Number(cu.branch || 0);
    const { searchParams } = new URL(request.url);
    const page   = Math.max(1, Number(searchParams.get('page')  || 1));
    const limit  = Math.min(100, Math.max(1, Number(searchParams.get('limit') || 50)));
    const search        = searchParams.get('search')?.trim() || '';
    const status        = searchParams.get('status') || '';
    const assigned      = searchParams.get('assigned') || '';
    const dateFrom      = searchParams.get('dateFrom') || '';
    const dateTo        = searchParams.get('dateTo')   || '';
    const priority      = searchParams.get('priority') || '';
    const branchFilter  = searchParams.get('branch') || '';
    const nationality   = searchParams.get('nationality') || '';
    const serviceInterest = searchParams.get('serviceInterest') || '';
    const marketSource  = searchParams.get('marketSource') || '';
    const offset   = (page - 1) * limit;

    const { where, rep: filterRep } = buildLeadConditions(cat, userBranch, {
      search, status, assigned, dateFrom, dateTo, priority,
      branch: branchFilter, nationality, serviceInterest, marketSource,
    });
    const rep: Record<string, unknown> = { ...filterRep, limit, offset };

    const [countRow] = await sequelize.query<{ total: number }>(
      `SELECT COUNT(*) AS total FROM crm_forum_leads l ${where}`,
      { replacements: rep, type: QueryTypes.SELECT }
    );
    const total = Number(countRow?.total || 0);

    const leads = await sequelize.query(
      `SELECT
        l.id,
        COALESCE(l.fname,'') AS fname,
        COALESCE(l.lname,'') AS lname,
        COALESCE(l.email,'') AS email,
        COALESCE(l.phone, l.mobile,'') AS phone,
        COALESCE(l.status,'New') AS status,
        COALESCE(l.priority,'') AS priority,
        COALESCE(l.nationality,'') AS nationality,
        COALESCE(l.service_interest,'') AS serviceInterest,
        COALESCE(l.market_source,'') AS marketSource,
        l.branch,
        COALESCE(b.branch,'Unassigned') AS branchName,
        l.assignTo,
        COALESCE(ae.name,'') AS assigneeName,
        l.Counsilor,
        COALESCE(ce.name,'') AS counsellorName,
        CAST(COALESCE(l.created,l.regdate) AS CHAR) AS created,
        CAST(COALESCE(l.pool_entered_at, IF(l.assignTo IS NULL OR l.assignTo = 0, l.created, NULL)) AS CHAR) AS poolEnteredAt,
        TIMESTAMPDIFF(MINUTE, COALESCE(l.pool_entered_at, l.created), NOW()) AS poolMinutesWaiting
      FROM crm_forum_leads l
      LEFT JOIN crm_branch b  ON l.branch   = b.id
      LEFT JOIN crm_employee ae ON l.assignTo  = ae.id
      LEFT JOIN crm_employee ce ON l.Counsilor = ce.id
      ${where}
      ORDER BY COALESCE(l.created, l.regdate) DESC
      LIMIT :limit OFFSET :offset`,
      { replacements: rep, type: QueryTypes.SELECT }
    );

    // Counsellors for transfer dropdown — only needed by the bulk-transfer UI
    // (admin/branch_manager), never by the self-serve 'agent' claim view, so
    // skip the extra queries entirely for that role.
    let counsellors: { id: number; name: string; branch: number; branchName: string }[] = [];
    if (cat !== 'agent') {
      const cRep: Record<string, unknown> = {};
      const cConds = ['e.status = 1'];
      if (cat === 'branch_manager' && userBranch) {
        cConds.push('e.branch = :branchId');
        cRep.branchId = userBranch;
      }
      const counsellorCandidates = await sequelize.query<{
        id: number; name: string; branch: number; branchName: string;
        roleName: string | null; roleType: string | null;
      }>(
        `SELECT e.id, e.name, e.branch, COALESCE(b.branch,'') AS branchName,
          r.name AS roleName, r.type AS roleType
        FROM crm_employee e
        LEFT JOIN crm_branch b ON e.branch = b.id
        LEFT JOIN crm_role r ON r.id = e.role
        WHERE ${cConds.join(' AND ')}
        ORDER BY e.name ASC LIMIT 300`,
        { replacements: cRep, type: QueryTypes.SELECT }
      );
      counsellors = counsellorCandidates
        .filter((row) => isCounsellor({ roleName: row.roleName, type: row.roleType }))
        .map(({ id, name, branch, branchName }) => ({ id, name, branch, branchName }));
    }

    const branches = cat === 'admin'
      ? await sequelize.query(`SELECT id, branch AS name FROM crm_branch WHERE status=1 ORDER BY branch ASC LIMIT 50`, { type: QueryTypes.SELECT })
      : [];

    return NextResponse.json({
      leads,
      total,
      counsellors,
      branches,
      roleCategory: cat,
      userBranch,
      slaMinutes: getSlaMinutes(),
      canClaim: cat === 'agent',
      canBulkTransfer: cat === 'admin' || cat === 'branch_manager',
      canRelease: cat === 'admin' || cat === 'branch_manager',
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Lead pool GET error:', msg);
    return NextResponse.json({ error: 'Failed to load lead pool', details: msg }, { status: 500 });
  }
}

// Bulk transfer — admin/branch_manager only. A plain agent has the newer,
// narrower /api/admin/lead-pool/claim instead (self-claim one lead at a
// time), never this bulk "assign N leads to a chosen counsellor" capability.
export async function POST(request: NextRequest) {
  const auth = requireAuth(request, ['leads.update']);
  if (isAuthError(auth)) return auth;
  try {
    const cu = auth;
    const cat = roleCat(cu);
    if (cat === 'agent') return NextResponse.json({ error: 'Access denied' }, { status: 403 });

    const userBranch = Number(cu.branch || 0);
    const body = await request.json();
    const { leadIds, counsellorId, selectAll, filters } = body as {
      leadIds: unknown[];
      counsellorId: unknown;
      selectAll?: boolean;
      filters?: LeadFilters;
    };

    if (!counsellorId)
      return NextResponse.json({ error: 'counsellorId is required' }, { status: 400 });

    // Row-level scoping below already keeps a Branch Manager's transfer to
    // leads within their own branch, but says nothing about the *target* -
    // without this check a Branch Manager could hand leads to a counsellor
    // in a different branch entirely.
    if (cat === 'branch_manager' && userBranch) {
      const [targetEmployee] = await sequelize.query<{ branch: number | null }>(
        `SELECT branch FROM crm_employee WHERE id = :cid LIMIT 1`,
        { replacements: { cid: Number(counsellorId) }, type: QueryTypes.SELECT }
      );
      if (!targetEmployee || Number(targetEmployee.branch) !== userBranch) {
        return NextResponse.json({ error: 'You can only transfer leads to a counselor in your own branch' }, { status: 403 });
      }
    }

    const upRep: Record<string, unknown> = { cid: Number(counsellorId), actorId: cu.id };
    let whereClause: string;
    let expectedCount: number;

    if (selectAll) {
      // "Select all N leads" spans every page, not just the ones loaded in the
      // browser — re-run the same filters server-side (scoped to the same
      // where-clause GET uses) instead of trusting a client-supplied ID list,
      // which would only ever cover the currently-rendered page.
      const { where, rep: filterRep } = buildLeadConditions(cat, userBranch, filters || {});
      whereClause = where;
      Object.assign(upRep, filterRep);

      const [countRow] = await sequelize.query<{ total: number }>(
        `SELECT COUNT(*) AS total FROM crm_forum_leads l ${whereClause}`,
        { replacements: upRep, type: QueryTypes.SELECT }
      );
      expectedCount = Number(countRow?.total || 0);
      if (expectedCount === 0)
        return NextResponse.json({ error: 'No leads match the current filters' }, { status: 400 });
    } else {
      if (!Array.isArray(leadIds) || leadIds.length === 0)
        return NextResponse.json({ error: 'leadIds array is required' }, { status: 400 });

      const ids = leadIds.map(Number).filter(id => id > 0);
      if (ids.length === 0)
        return NextResponse.json({ error: 'No valid lead IDs' }, { status: 400 });

      upRep.ids = ids;
      whereClause = 'WHERE id IN (:ids)';
      if (cat === 'branch_manager' && userBranch) {
        whereClause += ' AND branch = :userBranch';
        upRep.userBranch = userBranch;
      }
      expectedCount = ids.length;
    }

    // buildLeadConditions() aliases the leads table as `l` (needed for its JOIN-free
    // reuse from GET); the UPDATE statement needs that same alias for the WHERE
    // clause it produced to resolve. Also stamps the same transfer_date/
    // transfer_time/transfered/transfered_by audit columns
    // src/lib/leadRemarks.ts's recordLeadAssignment() stamps for every other
    // assignment path — this bulk transfer used to skip them entirely, so a
    // lead moved here looked untouched by the "assigned since" fields
    // everywhere else in the app reads. pool_entered_at is cleared too, since
    // these leads are no longer sitting in the pool.
    const updateSql = selectAll
      ? `UPDATE crm_forum_leads l SET l.assignTo = :cid, l.Counsilor = :cid, l.transfer_date = NOW(), l.transfer_time = CURTIME(), l.transfered = 1, l.transfered_by = :actorId, l.pool_entered_at = NULL ${whereClause}`
      : `UPDATE crm_forum_leads SET assignTo = :cid, Counsilor = :cid, transfer_date = NOW(), transfer_time = CURTIME(), transfered = 1, transfered_by = :actorId, pool_entered_at = NULL ${whereClause}`;

    // Snapshot each affected lead's *current* assignTo before the UPDATE
    // below overwrites it — needed to log a real "assigned from X to Y" per
    // lead and to know which ones were genuinely unassigned. A claim can
    // span hundreds of leads ("select all"), so this is batched into one
    // SELECT + one INSERT rather than a query per lead.
    const selectSql = selectAll
      ? `SELECT l.id, l.assignTo FROM crm_forum_leads l ${whereClause}`
      : `SELECT id, assignTo FROM crm_forum_leads ${whereClause}`;
    const affectedLeads = await sequelize.query<{ id: number; assignTo: number | null }>(
      selectSql, { replacements: upRep, type: QueryTypes.SELECT }
    );

    await sequelize.query(updateSql, { replacements: upRep, type: QueryTypes.UPDATE });

    const [counsellor] = await sequelize.query<{ name: string }>(
      `SELECT name FROM crm_employee WHERE id = :cid LIMIT 1`,
      { replacements: { cid: Number(counsellorId) }, type: QueryTypes.SELECT }
    );

    if (affectedLeads.length) {
      const oldEmployeeIds = Array.from(new Set(
        affectedLeads.map((l) => l.assignTo).filter((v): v is number => v !== null && v !== undefined)
      ));
      const nameLookupIds = Array.from(new Set([...oldEmployeeIds, cu.id]));
      const employeeNames = nameLookupIds.length
        ? await sequelize.query<{ id: number; name: string }>(
            'SELECT id, name FROM crm_employee WHERE id IN (:ids)',
            { replacements: { ids: nameLookupIds }, type: QueryTypes.SELECT }
          )
        : [];
      const nameOf = (empId: number | null | undefined) =>
        empId === null || empId === undefined ? 'Unassigned' : employeeNames.find((e) => e.id === empId)?.name || `Employee #${empId}`;
      const actorLabel = `${employeeNames.find((e) => e.id === cu.id)?.name || `Employee #${cu.id}`} (${cu.roleName || cu.type})`;
      const newAssigneeName = counsellor?.name || nameOf(Number(counsellorId));

      const remarkRows = affectedLeads.filter((l) => Number(l.assignTo) !== Number(counsellorId));
      if (remarkRows.length) {
        const values = remarkRows.map(() => '(?, ?, ?, ?, ?, ?, ?, NOW())').join(', ');
        const remarkReplacements: unknown[] = [];
        for (const l of remarkRows) {
          remarkReplacements.push(
            l.id, 'lead_assigned',
            `Lead assigned from ${nameOf(l.assignTo)} to ${newAssigneeName} by ${actorLabel}`,
            nameOf(l.assignTo), newAssigneeName, cu.id, cu.roleName || cu.type || null
          );
        }
        await sequelize.query(
          `INSERT INTO crm_remarks (lead_id, action, remark, previous_value, new_value, actor_id, actor_role, created_at) VALUES ${values}`,
          { replacements: remarkReplacements }
        );
      }

      // Genuinely unassigned -> assigned: no longer "unassigned and untouched".
      const untouchedIds = affectedLeads.filter((l) => l.assignTo === null || l.assignTo === undefined).map((l) => l.id);
      if (untouchedIds.length) {
        await sequelize.query(
          `UPDATE crm_forum_leads SET status = 'New' WHERE id IN (:ids) AND status = 'untouched'`,
          { replacements: { ids: untouchedIds } }
        );
      }

      // One aggregate notification for the whole batch rather than one per
      // lead (this can span hundreds of leads via "select all") - this bulk
      // transfer previously never notified the new owner at all, unlike
      // every other assignment path (recordLeadAssignment).
      if (remarkRows.length && Number(counsellorId) !== cu.id) {
        const { notifyUser } = await import('@/lib/notify');
        await notifyUser({
          userId: Number(counsellorId),
          type: 'lead_assigned',
          title: remarkRows.length === 1 ? 'New lead assigned to you' : `${remarkRows.length} leads assigned to you`,
          message: remarkRows.length === 1
            ? `A lead has been assigned to you by ${actorLabel}.`
            : `${remarkRows.length} leads have been assigned to you by ${actorLabel}.`,
          priority: 'high',
          relatedId: remarkRows[0].id,
          relatedType: 'lead',
          link: remarkRows.length === 1 ? `/admin/leads/${remarkRows[0].id}` : '/admin/lead-pool',
        });
      }
    }

    return NextResponse.json({
      success: true,
      transferred: expectedCount,
      counsellorName: counsellor?.name || 'Unknown',
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Lead pool POST error:', msg);
    return NextResponse.json({ error: 'Failed to transfer leads', details: msg }, { status: 500 });
  }
}
