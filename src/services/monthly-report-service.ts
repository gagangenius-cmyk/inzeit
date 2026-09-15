import { QueryTypes } from 'sequelize';
import { sequelize } from '@/lib/sequelize';
import { getSalesReportData, type SalesReportRow, type SalesReportSummary } from '@/lib/salesReportData';
import { getBalanceReportData, type BalanceReportRow, type BalanceReportSummary } from '@/lib/balanceReportData';
import { sendEmail } from '@/lib/mailer';

type RecipientRole = 'ceo' | 'branch_manager' | 'counsellor';
type Recipient = { id: number; name: string; email: string; role: RecipientRole; branchId: number | null };
type ScanResult = {
  recipientId: number; recipientName: string; role: RecipientRole;
  status: 'Sent' | 'Skipped' | 'Failed' | 'Matched'; reason?: string;
};

const cronSchedule = { expression: '0 8 1 * *', timezone: 'Asia/Dubai' };
const fmtAed = (v: number) => `AED ${Number(v || 0).toLocaleString('en', { maximumFractionDigits: 0 })}`;
// Client/branch/recipient names come from the DB (lead/employee records the
// recipient doesn't control end-to-end), but this HTML is emailed out
// verbatim - escape before interpolating so a stray `<`/`&` in a name can't
// break the table markup or inject content into the sent email.
const escapeHtml = (v: string) => String(v ?? '').replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c] as string));
// toISOString() converts to UTC first, which rolls the date back a day for
// any local timezone ahead of UTC (e.g. Asia/Dubai, GST +4, at local
// midnight) - use local getters instead so "this month" means the server's
// local calendar month, not a UTC-shifted one.
const isoDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function previousMonthRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const to = new Date(now.getFullYear(), now.getMonth(), 0);
  return { dateFrom: isoDate(from), dateTo: isoDate(to), periodMonth: isoDate(from).slice(0, 7) };
}

function salesTable(rows: SalesReportRow[]) {
  if (!rows.length) return '<p style="color:#888">No sales in this period.</p>';
  const body = rows.slice(0, 20).map((r) => `
    <tr>
      <td style="padding:4px 8px;border-bottom:1px solid #eee">${escapeHtml(r.client)}</td>
      <td style="padding:4px 8px;border-bottom:1px solid #eee">${escapeHtml(r.branch)}</td>
      <td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:right">${fmtAed(r.totalFeeAed)}</td>
      <td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:right;color:#0a7d33">${fmtAed(r.paidAed)}</td>
      <td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:right;color:#c0392b">${fmtAed(r.balanceAed)}</td>
    </tr>`).join('');
  return `<table style="width:100%;border-collapse:collapse;font-size:13px">
    <thead><tr style="background:#f5f5f5">
      <th style="padding:4px 8px;text-align:left">Client</th>
      <th style="padding:4px 8px;text-align:left">Branch</th>
      <th style="padding:4px 8px;text-align:right">Total</th>
      <th style="padding:4px 8px;text-align:right">Collected</th>
      <th style="padding:4px 8px;text-align:right">Balance</th>
    </tr></thead><tbody>${body}</tbody></table>`;
}

function balanceTable(rows: BalanceReportRow[]) {
  if (!rows.length) return '<p style="color:#888">No outstanding balances.</p>';
  const body = rows.slice(0, 20).map((r) => `
    <tr>
      <td style="padding:4px 8px;border-bottom:1px solid #eee">${escapeHtml(r.client)}</td>
      <td style="padding:4px 8px;border-bottom:1px solid #eee">${escapeHtml(r.branch)}</td>
      <td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:right;color:#c0392b">${fmtAed(r.balanceAed)}</td>
    </tr>`).join('');
  return `<table style="width:100%;border-collapse:collapse;font-size:13px">
    <thead><tr style="background:#f5f5f5">
      <th style="padding:4px 8px;text-align:left">Client</th>
      <th style="padding:4px 8px;text-align:left">Branch</th>
      <th style="padding:4px 8px;text-align:right">Balance</th>
    </tr></thead><tbody>${body}</tbody></table>`;
}

function renderEmail(input: {
  recipientName: string; role: RecipientRole; periodLabel: string;
  sales: { summary: SalesReportSummary; data: SalesReportRow[] };
  balance: { summary: BalanceReportSummary; data: BalanceReportRow[] };
}) {
  const scopeLabel = input.role === 'ceo' ? 'All branches' : input.role === 'branch_manager' ? 'Your branch' : 'Your own sales';
  return `
    <div style="font-family:Arial,sans-serif;color:#222;max-width:640px">
      <h2 style="margin-bottom:4px">Monthly Report — ${input.periodLabel}</h2>
      <p style="color:#666;margin-top:0">Hi ${escapeHtml(input.recipientName)}, here is your ${scopeLabel.toLowerCase()} summary.</p>
      <h3>Sales Report (AED)</h3>
      <p>
        Total: <b>${fmtAed(input.sales.summary.totalAed)}</b> &middot;
        Collected: <b>${fmtAed(input.sales.summary.collectedAed)}</b> &middot;
        Balance: <b>${fmtAed(input.sales.summary.balanceAed)}</b> &middot;
        ${input.sales.summary.opportunities} opportunities (${input.sales.summary.won} won)
      </p>
      ${salesTable(input.sales.data)}
      <h3 style="margin-top:24px">Outstanding Balances (AED)</h3>
      <p>
        Total Outstanding: <b>${fmtAed(input.balance.summary.balanceAed)}</b> across ${input.balance.summary.clients} clients
      </p>
      ${balanceTable(input.balance.data)}
      <p style="color:#999;font-size:12px;margin-top:24px">Automated monthly report from the Global Navigator CRM.</p>
    </div>`;
}

export class MonthlyReportService {
  static getCronSchedule() {
    return cronSchedule;
  }

  static async ensureLogTable() {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS monthly_report_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        period_month CHAR(7) NOT NULL,
        recipient_id INT NOT NULL,
        recipient_role VARCHAR(30) NOT NULL,
        status ENUM('Sent','Skipped','Failed') NOT NULL,
        error_message TEXT NULL,
        sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_monthly_report_log (period_month, recipient_id),
        INDEX idx_monthly_report_log_period (period_month)
      )
    `);
  }

  // Role text-matching mirrors resolveModuleRoleKey (modulePermissions.ts) /
  // roleChecks.ts, kept independent here (server-side, DB-driven) rather
  // than importing the JWT-shaped roleChecks helpers which expect a decoded
  // token object, not a raw crm_employee/crm_role join row.
  private static async resolveRecipients(): Promise<Recipient[]> {
    const rows = await sequelize.query<{
      id: number; name: string; email: string | null; branch: number | null;
      roleName: string | null; roleType: string | null;
    }>(
      `SELECT e.id, e.name, e.email, e.branch, r.name AS roleName, r.type AS roleType
       FROM crm_employee e
       LEFT JOIN crm_role r ON r.id = e.role
       WHERE e.status = 1 AND e.email IS NOT NULL AND e.email <> ''`,
      { type: QueryTypes.SELECT }
    );

    return rows.flatMap((row): Recipient[] => {
      const text = `${row.roleName || ''} ${row.roleType || ''}`.toLowerCase();
      if (text.includes('ceo') || text.includes('chief executive')) {
        return [{ id: row.id, name: row.name, email: row.email!, role: 'ceo', branchId: null }];
      }
      if (text.includes('branch manager') || text === 'bm' || text.includes('team leader') || text.includes('area manager')) {
        return [{ id: row.id, name: row.name, email: row.email!, role: 'branch_manager', branchId: row.branch }];
      }
      if (text.includes('sales') || text.includes('counsellor') || text.includes('counselor') || text.includes('immigration advisor')) {
        return [{ id: row.id, name: row.name, email: row.email!, role: 'counsellor', branchId: row.branch }];
      }
      return [];
    });
  }

  private static async hasDuplicateLog(periodMonth: string, recipientId: number) {
    const [row] = await sequelize.query<{ total: number }>(
      `SELECT COUNT(*) AS total FROM monthly_report_log WHERE period_month = :periodMonth AND recipient_id = :recipientId`,
      { replacements: { periodMonth, recipientId }, type: QueryTypes.SELECT }
    );
    return Number(row?.total || 0) > 0;
  }

  private static async writeLog(input: { periodMonth: string; recipientId: number; role: RecipientRole; status: 'Sent' | 'Skipped' | 'Failed'; errorMessage?: string | null }) {
    await sequelize.query(
      `INSERT IGNORE INTO monthly_report_log (period_month, recipient_id, recipient_role, status, error_message)
       VALUES (:periodMonth, :recipientId, :role, :status, :errorMessage)`,
      {
        replacements: {
          periodMonth: input.periodMonth,
          recipientId: input.recipientId,
          role: input.role,
          status: input.status,
          errorMessage: input.errorMessage || null,
        },
      }
    );
  }

  static async runMonthlyReportScan(options: { dryRun?: boolean } = {}): Promise<{
    periodMonth: string; scanned: number; sent: number; skipped: number; failed: number; results: ScanResult[];
  }> {
    await this.ensureLogTable();
    const { dateFrom, dateTo, periodMonth } = previousMonthRange();
    const periodLabel = new Date(`${dateFrom}T00:00:00`).toLocaleDateString('en', { month: 'long', year: 'numeric' });

    const recipients = await this.resolveRecipients();
    const results: ScanResult[] = [];

    for (const recipient of recipients) {
      const duplicate = await this.hasDuplicateLog(periodMonth, recipient.id);
      if (duplicate) {
        results.push({ recipientId: recipient.id, recipientName: recipient.name, role: recipient.role, status: 'Skipped', reason: 'Already sent for this period' });
        continue;
      }

      const scopeBranchId = recipient.role === 'branch_manager' ? recipient.branchId : null;
      const scopeCounselorId = recipient.role === 'counsellor' ? recipient.id : null;

      if (recipient.role === 'branch_manager' && !scopeBranchId) {
        await this.writeLog({ periodMonth, recipientId: recipient.id, role: recipient.role, status: 'Skipped', errorMessage: 'No branch assigned' });
        results.push({ recipientId: recipient.id, recipientName: recipient.name, role: recipient.role, status: 'Skipped', reason: 'No branch assigned' });
        continue;
      }

      const [sales, balance] = await Promise.all([
        getSalesReportData({ dateFrom, dateTo, branchId: scopeBranchId, counselorId: scopeCounselorId, limit: 20 }),
        getBalanceReportData({ branchId: scopeBranchId, counselorId: scopeCounselorId, limit: 20 }),
      ]);

      if (options.dryRun) {
        results.push({ recipientId: recipient.id, recipientName: recipient.name, role: recipient.role, status: 'Matched' });
        continue;
      }

      const html = renderEmail({ recipientName: recipient.name, role: recipient.role, periodLabel, sales, balance });

      try {
        await sendEmail({ to: recipient.email, subject: `Monthly Report — ${periodLabel}`, html });
        await this.writeLog({ periodMonth, recipientId: recipient.id, role: recipient.role, status: 'Sent' });
        results.push({ recipientId: recipient.id, recipientName: recipient.name, role: recipient.role, status: 'Sent' });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Email dispatch failed';
        await this.writeLog({ periodMonth, recipientId: recipient.id, role: recipient.role, status: 'Failed', errorMessage });
        results.push({ recipientId: recipient.id, recipientName: recipient.name, role: recipient.role, status: 'Failed', reason: errorMessage });
      }
    }

    return {
      periodMonth,
      scanned: recipients.length,
      sent: results.filter((r) => r.status === 'Sent').length,
      skipped: results.filter((r) => r.status === 'Skipped').length,
      failed: results.filter((r) => r.status === 'Failed').length,
      results,
    };
  }
}
