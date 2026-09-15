import { QueryTypes } from 'sequelize';
import { sequelize } from '@/lib/sequelize';

export interface SalesReportParams {
  dateFrom?: string;
  dateTo?: string;
  branchId?: number | null;
  counselorId?: number | null;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface SalesReportRow {
  id: number; name: string; client: string;
  counselorId: number | null; counselor: string;
  branchId: number | null; branch: string;
  status: string; date: string;
  currencyCode: string;
  totalFeeLocal: number; paidLocal: number; balanceLocal: number;
  totalFeeAed: number; paidAed: number; balanceAed: number;
  receiptCount: number; receiptTotalLocal: number; receiptTotalAed: number;
  latestReceiptDate: string | null; receiptNumbers: string;
}

export interface SalesReportSummary {
  opportunities: number; won: number; totalAed: number; collectedAed: number; balanceAed: number;
}

const n = (v: unknown) => Number(v || 0);

/**
 * Shared sales-report query used by both the /api/admin/accounts/sales-report
 * route (Part 1) and the monthly report email scheduler (Part 2), so the AED
 * conversion + scoping logic lives in exactly one place.
 */
export async function getSalesReportData(params: SalesReportParams): Promise<{
  summary: SalesReportSummary;
  data: SalesReportRow[];
  total: number;
}> {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(200, Math.max(1, params.limit || 50));

  const conditions: string[] = ["LOWER(COALESCE(o.status,'')) = 'won'"];
  const replacements: Record<string, any> = {};

  if (params.dateFrom) { conditions.push('o.createdAt >= :dateFrom'); replacements.dateFrom = `${params.dateFrom} 00:00:00`; }
  if (params.dateTo) { conditions.push('o.createdAt <= :dateTo'); replacements.dateTo = `${params.dateTo} 23:59:59`; }
  if (params.branchId) { conditions.push('o.branchId = :branchId'); replacements.branchId = params.branchId; }
  if (params.counselorId) { conditions.push('o.assignedTo = :counselorId'); replacements.counselorId = params.counselorId; }
  if (params.search) {
    conditions.push("(CONCAT(COALESCE(l.fname,''),' ',COALESCE(l.lname,'')) LIKE :search OR e.name LIKE :search OR o.opportunityName LIKE :search)");
    replacements.search = `%${params.search}%`;
  }

  const whereSql = conditions.join(' AND ');
  // crm_branch_exchange_rate_map.branch_id is unique, so this join can never
  // multiply rows. A branch absent from the map (er IS NULL) defaults to
  // AED / rate 1 via the COALESCEs below.
  const joins = `
      FROM crm_opportunities o
      LEFT JOIN crm_forum_leads l ON l.id = o.leadId
      LEFT JOIN crm_employee e ON e.id = o.assignedTo
      LEFT JOIN crm_branch b ON b.id = o.branchId
      LEFT JOIN crm_branch_exchange_rate_map bm ON bm.branch_id = o.branchId
      LEFT JOIN crm_exchange_rate er ON er.id = bm.exchange_rate_id AND er.status = 1
      LEFT JOIN (
        SELECT
          opportunityId,
          COUNT(*) AS receiptCount,
          COALESCE(SUM(COALESCE(paidAmount, amount, 0)), 0) AS receiptTotalLocal,
          MAX(paymentDate) AS latestReceiptDate,
          GROUP_CONCAT(COALESCE(receiptNumber, paymentNumber) ORDER BY paymentDate DESC SEPARATOR ', ') AS receiptNumbers
        FROM crm_opportunity_payments
        GROUP BY opportunityId
      ) pr ON pr.opportunityId = o.id`;

  const [rows, countRows, summaryRows] = await Promise.all([
    sequelize.query<{
      id: number; opportunityName: string; client: string;
      counselorId: number; counselor: string; branchId: number; branch: string;
      status: string; created: string; currencyCode: string; rateToAed: number;
      totalFeeLocal: number; paidLocal: number; balanceLocal: number;
      totalFeeAed: number; paidAed: number; balanceAed: number;
      receiptCount: number; receiptTotalLocal: number; receiptTotalAed: number;
      latestReceiptDate: string | null; receiptNumbers: string | null;
    }>(
      `SELECT
        o.id, o.opportunityName,
        CONCAT(COALESCE(l.fname,''),' ',COALESCE(l.lname,'')) AS client,
        e.id AS counselorId, COALESCE(e.name,'Unassigned') AS counselor,
        b.id AS branchId, COALESCE(b.branch,'N/A') AS branch,
        o.status,
        DATE_FORMAT(o.createdAt,'%Y-%m-%d') AS created,
        COALESCE(er.currency_code,'AED') AS currencyCode,
        COALESCE(er.rate_to_aed,1) AS rateToAed,
        COALESCE(l.payTotal,0) AS totalFeeLocal,
        COALESCE(l.paidYet,0) AS paidLocal,
        COALESCE(l.payBalance,0) AS balanceLocal,
        COALESCE(l.payTotal,0) * COALESCE(er.rate_to_aed,1) AS totalFeeAed,
        COALESCE(l.paidYet,0) * COALESCE(er.rate_to_aed,1) AS paidAed,
        COALESCE(l.payBalance,0) * COALESCE(er.rate_to_aed,1) AS balanceAed,
        COALESCE(pr.receiptCount,0) AS receiptCount,
        COALESCE(pr.receiptTotalLocal,0) AS receiptTotalLocal,
        COALESCE(pr.receiptTotalLocal,0) * COALESCE(er.rate_to_aed,1) AS receiptTotalAed,
        DATE_FORMAT(pr.latestReceiptDate,'%Y-%m-%d') AS latestReceiptDate,
        COALESCE(pr.receiptNumbers,'') AS receiptNumbers
      ${joins}
      WHERE ${whereSql}
      ORDER BY o.createdAt DESC
      LIMIT :limit OFFSET :offset`,
      { replacements: { ...replacements, limit, offset: (page - 1) * limit }, type: QueryTypes.SELECT }
    ),

    sequelize.query<{ total: number }>(
      `SELECT COUNT(*) AS total ${joins} WHERE ${whereSql}`,
      { replacements, type: QueryTypes.SELECT }
    ),

    sequelize.query<{ opportunities: number; won: number; totalAed: number; collectedAed: number; balanceAed: number }>(
      `SELECT
        COUNT(*) AS opportunities,
        COUNT(*) AS won,
        COALESCE(SUM(COALESCE(l.payTotal,0) * COALESCE(er.rate_to_aed,1)),0) AS totalAed,
        COALESCE(SUM(COALESCE(l.paidYet,0) * COALESCE(er.rate_to_aed,1)),0) AS collectedAed,
        COALESCE(SUM(COALESCE(l.payBalance,0) * COALESCE(er.rate_to_aed,1)),0) AS balanceAed
      ${joins}
      WHERE ${whereSql}`,
      { replacements, type: QueryTypes.SELECT }
    ),
  ]);

  const s = summaryRows[0] || ({} as any);

  return {
    summary: {
      opportunities: n(s.opportunities),
      won: n(s.won),
      totalAed: n(s.totalAed),
      collectedAed: n(s.collectedAed),
      balanceAed: n(s.balanceAed),
    },
    data: rows.map((r) => ({
      id: r.id,
      name: r.opportunityName,
      client: r.client?.trim() || `Opp #${r.id}`,
      counselorId: r.counselorId,
      counselor: r.counselor,
      branchId: r.branchId,
      branch: r.branch,
      status: r.status,
      date: r.created,
      currencyCode: r.currencyCode || 'AED',
      totalFeeLocal: n(r.totalFeeLocal),
      paidLocal: n(r.paidLocal),
      balanceLocal: n(r.balanceLocal),
      totalFeeAed: n(r.totalFeeAed),
      paidAed: n(r.paidAed),
      balanceAed: n(r.balanceAed),
      receiptCount: n(r.receiptCount),
      receiptTotalLocal: n(r.receiptTotalLocal),
      receiptTotalAed: n(r.receiptTotalAed),
      latestReceiptDate: r.latestReceiptDate || null,
      receiptNumbers: r.receiptNumbers || '',
    })),
    total: n(countRows[0]?.total),
  };
}
