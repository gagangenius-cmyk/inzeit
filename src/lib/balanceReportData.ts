import { QueryTypes } from 'sequelize';
import { sequelize } from '@/lib/sequelize';

export interface BalanceReportParams {
  branchId?: number | null;
  counselorId?: number | null;
  limit?: number;
}

export interface BalanceReportRow {
  leadId: number; client: string; branch: string; counselor: string;
  totalFeeAed: number; paidAed: number; balanceAed: number;
}

export interface BalanceReportSummary {
  clients: number; totalFeeAed: number; paidAed: number; balanceAed: number;
}

const n = (v: unknown) => Number(v || 0);

/**
 * Outstanding-balance report (payBalance > 0), AED-normalized the same way
 * as getSalesReportData - shared by the Recovery Report concept already in
 * this app and the monthly report email scheduler.
 */
export async function getBalanceReportData(params: BalanceReportParams): Promise<{
  summary: BalanceReportSummary;
  data: BalanceReportRow[];
}> {
  const limit = Math.min(500, Math.max(1, params.limit || 20));

  const conditions: string[] = ['l.payBalance > 0'];
  const replacements: Record<string, any> = {};
  if (params.branchId) { conditions.push('l.branch = :branchId'); replacements.branchId = params.branchId; }
  if (params.counselorId) { conditions.push('(l.Counsilor = :counselorId OR l.assignTo = :counselorId)'); replacements.counselorId = params.counselorId; }

  const whereSql = conditions.join(' AND ');
  const joins = `
      FROM crm_forum_leads l
      LEFT JOIN crm_branch b ON b.id = l.branch
      LEFT JOIN crm_employee e ON e.id = COALESCE(l.Counsilor, l.assignTo)
      LEFT JOIN crm_branch_exchange_rate_map bm ON bm.branch_id = l.branch
      LEFT JOIN crm_exchange_rate er ON er.id = bm.exchange_rate_id AND er.status = 1`;

  const [rows, summaryRows] = await Promise.all([
    sequelize.query<{
      leadId: number; client: string; branch: string; counselor: string;
      totalFeeAed: number; paidAed: number; balanceAed: number;
    }>(
      `SELECT
        l.id AS leadId,
        CONCAT(COALESCE(l.fname,''),' ',COALESCE(l.lname,'')) AS client,
        COALESCE(b.branch,'N/A') AS branch,
        COALESCE(e.name,'Unassigned') AS counselor,
        COALESCE(l.payTotal,0) * COALESCE(er.rate_to_aed,1) AS totalFeeAed,
        COALESCE(l.paidYet,0) * COALESCE(er.rate_to_aed,1) AS paidAed,
        COALESCE(l.payBalance,0) * COALESCE(er.rate_to_aed,1) AS balanceAed
      ${joins}
      WHERE ${whereSql}
      ORDER BY l.payBalance DESC
      LIMIT :limit`,
      { replacements: { ...replacements, limit }, type: QueryTypes.SELECT }
    ),

    sequelize.query<{ clients: number; totalFeeAed: number; paidAed: number; balanceAed: number }>(
      `SELECT
        COUNT(DISTINCT l.id) AS clients,
        COALESCE(SUM(COALESCE(l.payTotal,0) * COALESCE(er.rate_to_aed,1)),0) AS totalFeeAed,
        COALESCE(SUM(COALESCE(l.paidYet,0) * COALESCE(er.rate_to_aed,1)),0) AS paidAed,
        COALESCE(SUM(COALESCE(l.payBalance,0) * COALESCE(er.rate_to_aed,1)),0) AS balanceAed
      ${joins}
      WHERE ${whereSql}`,
      { replacements, type: QueryTypes.SELECT }
    ),
  ]);

  const s = summaryRows[0] || ({} as any);

  return {
    summary: {
      clients: n(s.clients),
      totalFeeAed: n(s.totalFeeAed),
      paidAed: n(s.paidAed),
      balanceAed: n(s.balanceAed),
    },
    data: rows.map((r) => ({
      leadId: r.leadId,
      client: r.client?.trim() || `Lead #${r.leadId}`,
      branch: r.branch,
      counselor: r.counselor,
      totalFeeAed: n(r.totalFeeAed),
      paidAed: n(r.paidAed),
      balanceAed: n(r.balanceAed),
    })),
  };
}
