import { QueryTypes } from 'sequelize';
import { sequelize } from './sequelize';

// Hierarchical monthly Target Assignment (Zoho/Salesforce "Targets" concept):
// a manager picks someone in their org chart (crm_employee.manager_id is the
// backbone - see scripts/seed-employees.js) and sets a monthly target of one
// of two kinds:
//   - 'new_leads'  - meetings / appointments / sales revenue targets, the
//                    acquisition-funnel numbers for new business.
//   - 'collection' - a balance-recovery/collection amount target, for
//                    chasing down existing clients' outstanding balances.
// "Actual achieved" is never stored - it's computed on read from the same
// tables the rest of the CRM already treats as authoritative (see each
// getXActual function below), so a target's progress bar is always live,
// never a stale snapshot.

export type TargetType = 'new_leads' | 'collection';

export interface EmployeeTarget {
  id: number;
  employeeId: number;
  assignedBy: number | null;
  targetMonth: string; // 'YYYY-MM-01'
  targetType: TargetType;
  meetingsTarget: number | null;
  appointmentsTarget: number | null;
  salesRevenueTarget: number | null;
  collectionTarget: number | null;
  notes: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpsertTargetInput {
  employeeId: number;
  assignedBy?: number | null;
  targetMonth: string;
  targetType: TargetType;
  meetingsTarget?: number | null;
  appointmentsTarget?: number | null;
  salesRevenueTarget?: number | null;
  collectionTarget?: number | null;
  notes?: string | null;
}

export interface TargetProgress {
  meetingsActual: number;
  appointmentsActual: number;
  salesRevenueActual: number;
  collectionActual: number;
}

interface TargetRow {
  id: number;
  employee_id: number;
  assigned_by: number | null;
  target_month: string;
  target_type: TargetType;
  meetings_target: number | null;
  appointments_target: number | null;
  sales_revenue_target: string | null;
  collection_target: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

let tableReady: Promise<void> | null = null;

const ensureTargetsTable = async () => {
  if (!tableReady) {
    tableReady = sequelize.query(`
      CREATE TABLE IF NOT EXISTS crm_employee_targets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id INT NOT NULL,
        assigned_by INT NULL,
        target_month DATE NOT NULL,
        target_type VARCHAR(20) NOT NULL DEFAULT 'new_leads',
        meetings_target INT NULL,
        appointments_target INT NULL,
        sales_revenue_target DECIMAL(14,2) NULL,
        collection_target DECIMAL(14,2) NULL,
        notes TEXT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_employee_month_type (employee_id, target_month, target_type),
        INDEX idx_targets_employee (employee_id),
        INDEX idx_targets_month (target_month),
        CONSTRAINT fk_employee_targets_employee FOREIGN KEY (employee_id) REFERENCES crm_employee(id) ON DELETE CASCADE,
        CONSTRAINT fk_employee_targets_assigned_by FOREIGN KEY (assigned_by) REFERENCES crm_employee(id) ON DELETE SET NULL
      )
    `).then(() => undefined).catch((error) => {
      tableReady = null;
      throw error;
    });
  }
  await tableReady;
};

const normalizeMonth = (value: string): string => {
  // Accepts 'YYYY-MM' or 'YYYY-MM-DD' and always stores the 1st of month.
  const match = /^(\d{4})-(\d{2})/.exec(value);
  if (!match) throw new Error('targetMonth must be in YYYY-MM format');
  return `${match[1]}-${match[2]}-01`;
};

const rowToTarget = (row: TargetRow): EmployeeTarget => ({
  id: row.id,
  employeeId: row.employee_id,
  assignedBy: row.assigned_by,
  targetMonth: row.target_month,
  targetType: row.target_type,
  meetingsTarget: row.meetings_target,
  appointmentsTarget: row.appointments_target,
  salesRevenueTarget: row.sales_revenue_target !== null ? Number(row.sales_revenue_target) : null,
  collectionTarget: row.collection_target !== null ? Number(row.collection_target) : null,
  notes: row.notes,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export async function listTargets(filters: { employeeIds?: number[]; month?: string; targetType?: TargetType } = {}): Promise<EmployeeTarget[]> {
  await ensureTargetsTable();
  const conditions: string[] = [];
  const replacements: Record<string, unknown> = {};

  if (filters.employeeIds && filters.employeeIds.length > 0) {
    conditions.push('employee_id IN (:employeeIds)');
    replacements.employeeIds = filters.employeeIds;
  }
  if (filters.month) {
    conditions.push('target_month = :month');
    replacements.month = normalizeMonth(filters.month);
  }
  if (filters.targetType) {
    conditions.push('target_type = :targetType');
    replacements.targetType = filters.targetType;
  }

  const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const rows = await sequelize.query<TargetRow>(
    `SELECT * FROM crm_employee_targets ${whereSql} ORDER BY target_month DESC, id DESC`,
    { replacements, type: QueryTypes.SELECT }
  );
  return rows.map(rowToTarget);
}

export async function getTargetById(id: number): Promise<EmployeeTarget | null> {
  await ensureTargetsTable();
  const rows = await sequelize.query<TargetRow>(
    'SELECT * FROM crm_employee_targets WHERE id = :id LIMIT 1',
    { replacements: { id }, type: QueryTypes.SELECT }
  );
  return rows[0] ? rowToTarget(rows[0]) : null;
}

export async function upsertTarget(input: UpsertTargetInput): Promise<EmployeeTarget> {
  await ensureTargetsTable();
  const targetMonth = normalizeMonth(input.targetMonth);

  await sequelize.query(
    `INSERT INTO crm_employee_targets
      (employee_id, assigned_by, target_month, target_type, meetings_target,
       appointments_target, sales_revenue_target, collection_target, notes)
     VALUES (:employeeId, :assignedBy, :targetMonth, :targetType, :meetingsTarget,
       :appointmentsTarget, :salesRevenueTarget, :collectionTarget, :notes)
     ON DUPLICATE KEY UPDATE
       assigned_by = VALUES(assigned_by),
       meetings_target = VALUES(meetings_target),
       appointments_target = VALUES(appointments_target),
       sales_revenue_target = VALUES(sales_revenue_target),
       collection_target = VALUES(collection_target),
       notes = VALUES(notes)`,
    {
      replacements: {
        employeeId: input.employeeId,
        assignedBy: input.assignedBy ?? null,
        targetMonth,
        targetType: input.targetType,
        meetingsTarget: input.meetingsTarget ?? null,
        appointmentsTarget: input.appointmentsTarget ?? null,
        salesRevenueTarget: input.salesRevenueTarget ?? null,
        collectionTarget: input.collectionTarget ?? null,
        notes: input.notes ?? null,
      },
    }
  );

  const rows = await sequelize.query<TargetRow>(
    'SELECT * FROM crm_employee_targets WHERE employee_id = :employeeId AND target_month = :targetMonth AND target_type = :targetType LIMIT 1',
    { replacements: { employeeId: input.employeeId, targetMonth, targetType: input.targetType }, type: QueryTypes.SELECT }
  );
  if (!rows[0]) throw new Error('Failed to load saved target');
  return rowToTarget(rows[0]);
}

export async function deleteTarget(id: number): Promise<void> {
  await ensureTargetsTable();
  await sequelize.query('DELETE FROM crm_employee_targets WHERE id = :id', { replacements: { id } });
}

// --- Org hierarchy (crm_employee.manager_id backbone) ---------------------

export interface OrgEmployee {
  id: number;
  name: string;
  managerId: number | null;
  branch: number | null;
  roleId: number | null;
  roleName: string | null;
}

export async function listActiveOrgEmployees(): Promise<OrgEmployee[]> {
  const rows = await sequelize.query<{ id: number; name: string; manager_id: number | null; branch: number | null; role: number | null; role_name: string | null }>(
    `SELECT e.id, e.name, e.manager_id, e.branch, e.role, r.name AS role_name
     FROM crm_employee e
     LEFT JOIN crm_role r ON r.id = e.role
     WHERE e.status = 1
     ORDER BY e.name ASC`,
    { type: QueryTypes.SELECT }
  );
  return rows.map((r) => ({ id: r.id, name: r.name, managerId: r.manager_id, branch: r.branch, roleId: r.role, roleName: r.role_name }));
}

// Every employee under `managerId`, at any depth - used both to scope a
// manager's visibility (can only see/set targets for their own subtree) and
// to build the cascading picker on the admin UI.
export async function getSubordinateIds(managerId: number): Promise<number[]> {
  const employees = await listActiveOrgEmployees();
  const result: number[] = [];
  const queue = [managerId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    const directReports = employees.filter((e) => e.managerId === current);
    for (const report of directReports) {
      result.push(report.id);
      queue.push(report.id);
    }
  }
  return result;
}

// --- Actual-achieved computation (never stored, always live) --------------

const monthBounds = (targetMonth: string): { start: string; end: string } => {
  const normalized = normalizeMonth(targetMonth);
  const [year, month] = normalized.split('-').map(Number);
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const end = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
  return { start, end };
};

async function getMeetingsActual(employeeId: number, targetMonth: string): Promise<number> {
  const { start, end } = monthBounds(targetMonth);
  const [row] = await sequelize.query<{ total: number }>(
    `SELECT COUNT(*) AS total FROM crm_meeting_schedules
     WHERE user_id = :employeeId AND meeting_date >= :start AND meeting_date < :end`,
    { replacements: { employeeId, start, end }, type: QueryTypes.SELECT }
  );
  return Number(row?.total || 0);
}

async function getAppointmentsActual(employeeId: number, targetMonth: string): Promise<number> {
  const { start, end } = monthBounds(targetMonth);
  const [row] = await sequelize.query<{ total: number }>(
    `SELECT COUNT(*) AS total FROM appointments
     WHERE counsilorid = :employeeId AND done = 1 AND date >= :start AND date < :end`,
    { replacements: { employeeId, start, end }, type: QueryTypes.SELECT }
  );
  return Number(row?.total || 0);
}

async function getSalesRevenueActual(employeeId: number, targetMonth: string): Promise<number> {
  const { start, end } = monthBounds(targetMonth);
  const [row] = await sequelize.query<{ total: string | null }>(
    `SELECT SUM(COALESCE(l.payTotal, 0)) AS total
     FROM crm_opportunities o
     JOIN crm_forum_leads l ON l.id = o.leadId
     WHERE o.assignedTo = :employeeId AND LOWER(o.status) = 'won'
       AND o.createdAt >= :start AND o.createdAt < :end`,
    { replacements: { employeeId, start, end }, type: QueryTypes.SELECT }
  );
  return Number(row?.total || 0);
}

async function getCollectionActual(employeeId: number, targetMonth: string): Promise<number> {
  const { start, end } = monthBounds(targetMonth);
  const [row] = await sequelize.query<{ total: string | null }>(
    `SELECT SUM(COALESCE(p.paidAmount, 0)) AS total
     FROM crm_opportunity_payments p
     WHERE p.createdBy = :employeeId
       AND p.paymentDate >= :start AND p.paymentDate < :end`,
    { replacements: { employeeId, start, end }, type: QueryTypes.SELECT }
  );
  return Number(row?.total || 0);
}

export async function getTargetProgress(employeeId: number, targetMonth: string): Promise<TargetProgress> {
  const [meetingsActual, appointmentsActual, salesRevenueActual, collectionActual] = await Promise.all([
    getMeetingsActual(employeeId, targetMonth),
    getAppointmentsActual(employeeId, targetMonth),
    getSalesRevenueActual(employeeId, targetMonth),
    getCollectionActual(employeeId, targetMonth),
  ]);
  return { meetingsActual, appointmentsActual, salesRevenueActual, collectionActual };
}
