import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import { sequelize } from '@/lib/sequelize';
import { verifyToken } from '@/lib/auth';
import { isBranchManagerOrCeo, isFoe, canViewAllBranches } from '@/lib/roleChecks';
import { resolveBranchCurrency } from '@/lib/branchCurrency';

/**
 * Opportunities with an outstanding balance, scoped by role:
 * - CEO / director / founder / super admin / director of sales: every opportunity.
 * - Branch Manager / FOE: only opportunities in their own branch.
 * - Everyone else (counsellor): only opportunities they own — either the
 *   underlying lead is assigned to them, or the opportunity itself is
 *   assigned to/created by them (mirrors the scoping already used for a
 *   counsellor's "my leads" view in /api/leads).
 */
export async function GET(request: NextRequest) {
  try {
    const token =
      request.cookies.get('auth-token')?.value ||
      request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    const currentUser = token ? verifyToken(token) : null;
    if (!currentUser) {
      return NextResponse.json({ error: 'Authentication is required' }, { status: 401 });
    }

    // Was a locally-maintained whitelist missing 'team_leader'/'area_manager'
    // (the post-restructuring manager tier) - isBranchManagerOrCeo() below
    // matches those roles too, so with the old canViewAll they were silently
    // downgraded to branch-only visibility instead of the company-wide
    // access those roles should have. canViewAllBranches() already includes
    // them, so the !canViewAll guard now correctly short-circuits.
    const canViewAll = canViewAllBranches(currentUser);
    const isBranchScoped = !canViewAll && (isBranchManagerOrCeo(currentUser) || isFoe(currentUser));

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Number.parseInt(searchParams.get('limit') || '20', 10));
    const offset = (page - 1) * limit;
    const search = searchParams.get('search')?.trim();

    const conditions: string[] = ['l.payBalance > 0'];
    const replacements: Record<string, unknown> = { limit, offset };

    if (isBranchScoped) {
      conditions.push('COALESCE(l.branch, o.branchId) = :userBranch');
      replacements.userBranch = currentUser.branch;
    } else if (!canViewAll) {
      conditions.push('(l.Counsilor = :userId OR l.assignTo = :userId OR o.assignedTo = :userId OR o.createdBy = :userId)');
      replacements.userId = currentUser.id;
    }
    if (search) {
      conditions.push(`(
        CONCAT_WS(' ', l.fname, l.lname) LIKE :search
        OR a.agreementNumber LIKE :search
      )`);
      replacements.search = `%${search}%`;
    }

    const fromAndWhere = `
       FROM crm_opportunities o
       JOIN crm_forum_leads l ON l.id = o.leadId
       LEFT JOIN crm_branch b ON b.id = COALESCE(l.branch, o.branchId)
       LEFT JOIN crm_employee e ON e.id = o.assignedTo
       LEFT JOIN crm_service s ON s.id = CAST(l.service_interest AS UNSIGNED)
       LEFT JOIN (
         SELECT da1.opportunityId, da1.agreementNumber
         FROM crm_opportunity_agreements da1
         INNER JOIN (
           SELECT opportunityId, MAX(id) AS maxId FROM crm_opportunity_agreements GROUP BY opportunityId
         ) da2 ON da2.opportunityId = da1.opportunityId AND da2.maxId = da1.id
       ) a ON a.opportunityId = o.id
       WHERE ${conditions.join(' AND ')}`;

    const [rows, [{ total }]] = await Promise.all([
      sequelize.query<any>(
        `SELECT
           o.id AS opportunityId,
           o.opportunityName,
           o.status AS opportunityStatus,
           o.stage,
           l.id AS leadId,
           l.fname, l.lname, l.email, l.phone,
           l.payTotal, l.paidYet, l.payBalance, l.dueDate, l.demdRemark,
           COALESCE(l.branch, o.branchId) AS branchId,
           b.branch AS branchName,
           e.name AS assignedEmployeeName,
           COALESCE(s.name, l.service_interest) AS serviceName,
           a.agreementNumber
         ${fromAndWhere}
         ORDER BY l.payBalance DESC
         LIMIT :limit OFFSET :offset`,
        { replacements, type: QueryTypes.SELECT }
      ),
      sequelize.query<{ total: number }>(
        `SELECT COUNT(*) AS total ${fromAndWhere}`,
        { replacements, type: QueryTypes.SELECT }
      ),
    ]);

    // Each branch trades in its own currency (crm_currency, matched by
    // country in resolveBranchCurrency) — resolve it once per distinct
    // branch in this page of results rather than hardcoding AED.
    const distinctBranchIds = Array.from(new Set(rows.map((row) => row.branchId).filter(Boolean)));
    const currencyByBranch = new Map<number, string>();
    await Promise.all(distinctBranchIds.map(async (branchId) => {
      const branchCurrency = await resolveBranchCurrency(branchId);
      if (branchCurrency) currencyByBranch.set(branchId, branchCurrency.currencyCode);
    }));
    const rowsWithCurrency = rows.map((row) => ({
      ...row,
      currencyCode: (row.branchId && currencyByBranch.get(row.branchId)) || 'AED',
    }));

    return NextResponse.json({
      data: rowsWithCurrency,
      pagination: { page, limit, total: Number(total), totalPages: Math.ceil(Number(total) / limit) },
    });
  } catch (error) {
    console.error('Error fetching balance payments:', error);
    return NextResponse.json({ error: 'Failed to fetch balance payments' }, { status: 500 });
  }
}
