import { QueryTypes } from 'sequelize';
import { sequelize } from '@/lib/sequelize';
import { ModuleNotificationService } from '@/services/module-notification-service';

// Generic trigger -> condition -> action automation engine. Each rule is a
// row of config (crm_automation_rules), not a code change - the point is
// that "notify the manager if a lead goes untouched for 3 days" becomes an
// admin-UI action instead of a new cron file, which is what actually matters
// once there are multiple roles/branches/compliance requirements to keep up
// with (see docs/AUTOMATION_RULES.md for the full rationale and how to add a
// new trigger/action type).
//
// Scope note: only the two SCHEDULED trigger types below are wired up. Real
// event-based triggers (lead.created, lead.stage_changed) are deliberately
// NOT hooked into src/app/api/leads/route.ts (1000+ lines, multiple success
// paths including bulk import) - see docs/AUTOMATION_RULES.md's "Adding an
// event-based trigger" section for the one-line integration a future change
// should add there instead of guessing at it under time pressure here.

export type AutomationTriggerType = 'lead.no_contact' | 'payment.overdue' | 'case.visa_expiring';
export type AutomationActionType = 'notify_assignee' | 'notify_manager' | 'create_follow_up';
export type ConditionOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains';

export interface AutomationCondition {
  field: string;
  operator: ConditionOperator;
  value: string | number;
}

export interface AutomationAction {
  type: AutomationActionType;
  config?: { message?: string; priority?: 'low' | 'medium' | 'high' | 'urgent' };
}

export interface AutomationRule {
  id: number;
  name: string;
  description: string | null;
  triggerType: AutomationTriggerType;
  triggerConfig: Record<string, unknown>;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  isActive: boolean;
  createdBy: number | null;
  createdAt: string;
  updatedAt: string;
}

interface TriggerFieldDef {
  key: string;
  label: string;
  type: 'number';
  default: number;
  min?: number;
}

interface TriggerDef {
  id: AutomationTriggerType;
  label: string;
  description: string;
  entityType: 'lead' | 'opportunity_payment' | 'case_decision';
  configFields: TriggerFieldDef[];
  conditionFields: Array<{ key: string; label: string }>;
}

// Metadata the admin UI renders forms from - single source of truth so the
// UI never hardcodes a trigger/action list that can drift from what the
// engine actually supports.
export const TRIGGER_DEFINITIONS: TriggerDef[] = [
  {
    id: 'lead.no_contact',
    label: 'Lead has had no contact activity for N days',
    description: 'Matches assigned leads (not marked lost) whose most recent remark is older than the configured number of days.',
    entityType: 'lead',
    configFields: [{ key: 'days', label: 'Days without contact', type: 'number', default: 3, min: 1 }],
    conditionFields: [
      { key: 'daysSinceContact', label: 'Days since last contact' },
      { key: 'priority', label: 'Lead priority' },
      { key: 'branchId', label: 'Branch ID' },
      { key: 'countryInterest', label: 'Country of interest' },
    ],
  },
  {
    id: 'payment.overdue',
    label: 'Opportunity payment is overdue',
    description: 'Matches opportunity payments whose due date has passed and which are not completed/paid/failed/refunded.',
    entityType: 'opportunity_payment',
    configFields: [],
    conditionFields: [
      { key: 'daysOverdue', label: 'Days overdue' },
      { key: 'amount', label: 'Payment amount' },
      { key: 'currency', label: 'Currency ID' },
      { key: 'branchId', label: 'Branch ID' },
    ],
  },
  {
    id: 'case.visa_expiring',
    label: 'Client\'s issued visa/residence permit is expiring soon',
    description: 'Matches Case Milestones "Decision & Issuance" records (crm_case_decisions) with an approved decision and an expiry date within N days.',
    entityType: 'case_decision',
    configFields: [{ key: 'days', label: 'Days before expiry', type: 'number', default: 60, min: 1 }],
    conditionFields: [
      { key: 'daysUntilExpiry', label: 'Days until expiry' },
      { key: 'module', label: 'Program module' },
      { key: 'issuedDocumentType', label: 'Issued document type' },
    ],
  },
];

export const ACTION_DEFINITIONS: Array<{ id: AutomationActionType; label: string; hasConfig: boolean }> = [
  { id: 'notify_assignee', label: 'Notify the assigned employee', hasConfig: false },
  { id: 'notify_manager', label: "Notify the assignee's manager", hasConfig: false },
  { id: 'create_follow_up', label: 'Create a follow-up reminder', hasConfig: true },
];

function parseJson<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'object') return value as T;
  try { return JSON.parse(String(value)) as T; } catch { return fallback; }
}

function evaluateCondition(condition: AutomationCondition, context: Record<string, unknown>): boolean {
  const actual = context[condition.field];
  const expected = condition.value;
  switch (condition.operator) {
    case 'eq': return String(actual ?? '') === String(expected);
    case 'neq': return String(actual ?? '') !== String(expected);
    case 'gt': return Number(actual) > Number(expected);
    case 'gte': return Number(actual) >= Number(expected);
    case 'lt': return Number(actual) < Number(expected);
    case 'lte': return Number(actual) <= Number(expected);
    case 'contains': return String(actual ?? '').toLowerCase().includes(String(expected ?? '').toLowerCase());
    default: return true;
  }
}

function matchesConditions(conditions: AutomationCondition[] | undefined, context: Record<string, unknown>): boolean {
  if (!conditions?.length) return true;
  return conditions.every((condition) => evaluateCondition(condition, context));
}

interface NoContactLeadRow {
  leadId: number;
  name: string;
  assigneeId: number | null;
  branchId: number | null;
  priority: string | null;
  countryInterest: string | null;
  serviceInterest: string | null;
  daysSinceContact: number;
}

interface OverduePaymentRow {
  paymentId: number;
  opportunityId: number | null;
  leadId: number | null;
  assigneeId: number | null;
  branchId: number | null;
  amount: number;
  currency: number | null;
  dueDate: string;
  daysOverdue: number;
}

interface ExpiringVisaRow {
  decisionId: number;
  leadId: number;
  opportunityId: number | null;
  module: string;
  assigneeId: number | null;
  branchId: number | null;
  issuedDocumentType: string | null;
  issuedDocumentNumber: string | null;
  expiryDate: string;
  daysUntilExpiry: number;
}

export interface RuleRunOutcome {
  ruleId: number;
  ruleName: string;
  scanned: number;
  matched: number;
  executed: number;
  skipped: number;
  failed: number;
}

export interface RunSummary {
  dryRun: boolean;
  scanned: number;
  matched: number;
  executed: number;
  skipped: number;
  failed: number;
  rules: RuleRunOutcome[];
}

export class AutomationRulesService {
  static getCronSchedule() {
    // Every 30 minutes - these are operational escalations (untouched leads,
    // overdue money), not once-a-day housekeeping like the renewal reminder
    // scan, so they need a tighter loop.
    return { expression: '*/30 * * * *', timezone: 'Asia/Dubai' };
  }

  static async ensureTables() {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS crm_automation_rules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT NULL,
        trigger_type VARCHAR(50) NOT NULL,
        trigger_config JSON NULL,
        conditions JSON NULL,
        actions JSON NOT NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_by INT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_automation_rules_trigger (trigger_type),
        INDEX idx_automation_rules_active (is_active)
      )
    `);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS crm_automation_rule_runs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        rule_id INT NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id INT NOT NULL,
        run_date DATE NOT NULL,
        status ENUM('matched', 'failed') NOT NULL DEFAULT 'matched',
        detail TEXT NULL,
        executed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_automation_rule_run (rule_id, entity_type, entity_id, run_date),
        INDEX idx_automation_rule_runs_rule (rule_id),
        CONSTRAINT fk_automation_rule_runs_rule FOREIGN KEY (rule_id)
          REFERENCES crm_automation_rules(id) ON DELETE CASCADE
      )
    `);
  }

  // ---- CRUD ----

  static async listRules(options: { activeOnly?: boolean } = {}): Promise<AutomationRule[]> {
    await this.ensureTables();
    const rows = await sequelize.query<any>(
      `SELECT id, name, description, trigger_type AS triggerType, trigger_config AS triggerConfig,
              conditions, actions, is_active AS isActive, created_by AS createdBy,
              created_at AS createdAt, updated_at AS updatedAt
       FROM crm_automation_rules
       ${options.activeOnly ? 'WHERE is_active = 1' : ''}
       ORDER BY id DESC`,
      { type: QueryTypes.SELECT }
    );
    return rows.map((row) => ({
      ...row,
      isActive: Boolean(row.isActive),
      triggerConfig: parseJson(row.triggerConfig, {}),
      conditions: parseJson(row.conditions, []),
      actions: parseJson(row.actions, []),
    }));
  }

  static async getRule(id: number): Promise<AutomationRule | null> {
    const rules = await this.listRules();
    return rules.find((rule) => rule.id === id) || null;
  }

  static async createRule(input: {
    name: string;
    description?: string | null;
    triggerType: AutomationTriggerType;
    triggerConfig?: Record<string, unknown>;
    conditions?: AutomationCondition[];
    actions: AutomationAction[];
    isActive?: boolean;
    createdBy?: number | null;
  }) {
    await this.ensureTables();
    if (!TRIGGER_DEFINITIONS.some((trigger) => trigger.id === input.triggerType)) {
      throw new Error(`Unknown trigger type "${input.triggerType}"`);
    }
    if (!input.actions?.length) {
      throw new Error('At least one action is required');
    }

    const [result] = await sequelize.query(
      `INSERT INTO crm_automation_rules (name, description, trigger_type, trigger_config, conditions, actions, is_active, created_by)
       VALUES (:name, :description, :triggerType, :triggerConfig, :conditions, :actions, :isActive, :createdBy)`,
      {
        replacements: {
          name: input.name,
          description: input.description || null,
          triggerType: input.triggerType,
          triggerConfig: JSON.stringify(input.triggerConfig || {}),
          conditions: JSON.stringify(input.conditions || []),
          actions: JSON.stringify(input.actions),
          isActive: input.isActive === false ? 0 : 1,
          createdBy: input.createdBy || null,
        },
        type: QueryTypes.INSERT,
      }
    );
    return this.getRule(Number(result));
  }

  static async updateRule(id: number, input: Partial<{
    name: string;
    description: string | null;
    triggerType: AutomationTriggerType;
    triggerConfig: Record<string, unknown>;
    conditions: AutomationCondition[];
    actions: AutomationAction[];
    isActive: boolean;
  }>) {
    const existing = await this.getRule(id);
    if (!existing) return null;

    const next = {
      name: input.name ?? existing.name,
      description: input.description === undefined ? existing.description : input.description,
      triggerType: input.triggerType ?? existing.triggerType,
      triggerConfig: input.triggerConfig ?? existing.triggerConfig,
      conditions: input.conditions ?? existing.conditions,
      actions: input.actions ?? existing.actions,
      isActive: input.isActive === undefined ? existing.isActive : input.isActive,
    };

    await sequelize.query(
      `UPDATE crm_automation_rules
       SET name = :name, description = :description, trigger_type = :triggerType,
           trigger_config = :triggerConfig, conditions = :conditions, actions = :actions,
           is_active = :isActive
       WHERE id = :id`,
      {
        replacements: {
          id,
          name: next.name,
          description: next.description,
          triggerType: next.triggerType,
          triggerConfig: JSON.stringify(next.triggerConfig),
          conditions: JSON.stringify(next.conditions),
          actions: JSON.stringify(next.actions),
          isActive: next.isActive ? 1 : 0,
        },
      }
    );
    return this.getRule(id);
  }

  static async deleteRule(id: number) {
    const existing = await this.getRule(id);
    if (!existing) return false;
    // No historical-record concern here (unlike leads/employees) - a rule is
    // pure config a CEO/Director authored, so a hard delete is appropriate;
    // its run log cascades via the FK rather than being orphaned.
    await sequelize.query('DELETE FROM crm_automation_rules WHERE id = :id', { replacements: { id } });
    return true;
  }

  static async listRuns(options: { ruleId?: number; limit?: number } = {}) {
    await this.ensureTables();
    return sequelize.query<any>(
      `SELECT r.id, r.rule_id AS ruleId, ar.name AS ruleName, r.entity_type AS entityType,
              r.entity_id AS entityId, r.status, r.detail, r.executed_at AS executedAt
       FROM crm_automation_rule_runs r
       LEFT JOIN crm_automation_rules ar ON ar.id = r.rule_id
       ${options.ruleId ? 'WHERE r.rule_id = :ruleId' : ''}
       ORDER BY r.executed_at DESC
       LIMIT :limit`,
      { replacements: { ruleId: options.ruleId, limit: options.limit ?? 100 }, type: QueryTypes.SELECT }
    );
  }

  // ---- Entity collectors (one per trigger's data source) ----

  private static async collectNoContactLeads(days: number): Promise<NoContactLeadRow[]> {
    return sequelize.query<NoContactLeadRow>(
      `SELECT
         l.id AS leadId,
         TRIM(CONCAT(l.fname, ' ', l.lname)) AS name,
         l.assignTo AS assigneeId,
         l.branch AS branchId,
         l.priority AS priority,
         l.country_interest AS countryInterest,
         l.service_interest AS serviceInterest,
         DATEDIFF(CURDATE(), COALESCE(MAX(r.date), DATE(l.created))) AS daysSinceContact
       FROM crm_forum_leads l
       LEFT JOIN crm_forum_leads_remarks r ON r.lead = l.id
       WHERE l.assignTo IS NOT NULL AND l.assignTo > 0
         AND (l.lost_reason IS NULL OR l.lost_reason = '')
       GROUP BY l.id, l.fname, l.lname, l.assignTo, l.branch, l.priority, l.country_interest, l.service_interest, l.created
       HAVING daysSinceContact >= :days
       ORDER BY daysSinceContact DESC
       LIMIT 500`,
      { replacements: { days }, type: QueryTypes.SELECT }
    );
  }

  private static async collectOverduePayments(): Promise<OverduePaymentRow[]> {
    return sequelize.query<OverduePaymentRow>(
      `SELECT
         p.id AS paymentId,
         p.opportunityId AS opportunityId,
         p.leadId AS leadId,
         COALESCE(o.assignedTo, l.assignTo) AS assigneeId,
         COALESCE(o.branchId, l.branch) AS branchId,
         p.amount AS amount,
         p.currency AS currency,
         p.dueDate AS dueDate,
         DATEDIFF(CURDATE(), p.dueDate) AS daysOverdue
       FROM crm_opportunity_payments p
       LEFT JOIN crm_opportunities o ON o.id = p.opportunityId
       LEFT JOIN crm_forum_leads l ON l.id = p.leadId
       WHERE p.dueDate IS NOT NULL
         AND p.dueDate < CURDATE()
         AND p.status NOT IN ('completed', 'paid', 'failed', 'refunded')
       LIMIT 500`,
      { type: QueryTypes.SELECT }
    );
  }

  private static async collectExpiringVisas(days: number): Promise<ExpiringVisaRow[]> {
    return sequelize.query<ExpiringVisaRow>(
      `SELECT
         d.id AS decisionId,
         d.leadId AS leadId,
         d.opportunityId AS opportunityId,
         d.module AS module,
         COALESCE(o.assignedTo, l.assignTo) AS assigneeId,
         COALESCE(o.branchId, l.branch) AS branchId,
         d.issuedDocumentType AS issuedDocumentType,
         d.issuedDocumentNumber AS issuedDocumentNumber,
         d.expiryDate AS expiryDate,
         DATEDIFF(d.expiryDate, CURDATE()) AS daysUntilExpiry
       FROM crm_case_decisions d
       LEFT JOIN crm_opportunities o ON o.id = d.opportunityId
       LEFT JOIN crm_forum_leads l ON l.id = d.leadId
       WHERE d.decision = 'approved'
         AND d.expiryDate IS NOT NULL
         AND d.expiryDate >= CURDATE()
         AND DATEDIFF(d.expiryDate, CURDATE()) <= :days
       LIMIT 500`,
      { replacements: { days }, type: QueryTypes.SELECT }
    );
  }

  // ---- Actions ----

  private static async resolveManagerId(employeeId: number): Promise<number | null> {
    const [row] = await sequelize.query<{ managerId: number | null }>(
      'SELECT manager_id AS managerId FROM crm_employee WHERE id = :employeeId LIMIT 1',
      { replacements: { employeeId }, type: QueryTypes.SELECT }
    );
    return row?.managerId || null;
  }

  private static async executeActions(actions: AutomationAction[], context: {
    leadId: number | null;
    assigneeId: number | null;
    title: string;
    message: string;
  }) {
    const outcomes: Array<{ type: AutomationActionType; status: string; reason?: string }> = [];

    for (const action of actions) {
      switch (action.type) {
        case 'notify_assignee': {
          if (!context.assigneeId) { outcomes.push({ type: action.type, status: 'skipped', reason: 'No assignee on this record' }); break; }
          await ModuleNotificationService.sendAutomationAlert({
            userIds: [context.assigneeId],
            title: context.title,
            message: action.config?.message || context.message,
            priority: action.config?.priority || 'high',
          });
          outcomes.push({ type: action.type, status: 'sent' });
          break;
        }
        case 'notify_manager': {
          const managerId = context.assigneeId ? await this.resolveManagerId(context.assigneeId) : null;
          if (!managerId) { outcomes.push({ type: action.type, status: 'skipped', reason: 'Assignee has no manager on file' }); break; }
          await ModuleNotificationService.sendAutomationAlert({
            userIds: [managerId],
            title: context.title,
            message: action.config?.message || context.message,
            priority: action.config?.priority || 'high',
          });
          outcomes.push({ type: action.type, status: 'sent' });
          break;
        }
        case 'create_follow_up': {
          if (!context.assigneeId || !context.leadId) { outcomes.push({ type: action.type, status: 'skipped', reason: 'No assignee/lead to attach the follow-up to' }); break; }
          await sequelize.query(
            `INSERT INTO crm_follow_up_reminders (lead_id, user_id, reminder_date, message, status, priority)
             VALUES (:leadId, :userId, NOW(), :message, 'pending', :priority)`,
            {
              replacements: {
                leadId: context.leadId,
                userId: context.assigneeId,
                message: action.config?.message || context.message,
                priority: action.config?.priority || 'high',
              },
              type: QueryTypes.INSERT,
            }
          );
          outcomes.push({ type: action.type, status: 'created' });
          break;
        }
        default:
          outcomes.push({ type: action.type, status: 'skipped', reason: 'Unknown action type' });
      }
    }

    return outcomes;
  }

  private static async alreadyRanToday(ruleId: number, entityType: string, entityId: number) {
    const [row] = await sequelize.query<{ total: number }>(
      `SELECT COUNT(*) AS total FROM crm_automation_rule_runs
       WHERE rule_id = :ruleId AND entity_type = :entityType AND entity_id = :entityId AND run_date = CURDATE()`,
      { replacements: { ruleId, entityType, entityId }, type: QueryTypes.SELECT }
    );
    return Number(row?.total || 0) > 0;
  }

  private static async logRun(input: { ruleId: number; entityType: string; entityId: number; status: 'matched' | 'failed'; detail: string }) {
    await sequelize.query(
      `INSERT IGNORE INTO crm_automation_rule_runs (rule_id, entity_type, entity_id, run_date, status, detail)
       VALUES (:ruleId, :entityType, :entityId, CURDATE(), :status, :detail)`,
      { replacements: input }
    );
  }

  // ---- Main entry point (called by the cron, and by the admin "Run now" button) ----

  static async runScheduledRules(options: { dryRun?: boolean; ruleId?: number } = {}): Promise<RunSummary> {
    await this.ensureTables();
    const rules = (await this.listRules({ activeOnly: true })).filter((rule) => !options.ruleId || rule.id === options.ruleId);

    const summary: RunSummary = { dryRun: Boolean(options.dryRun), scanned: 0, matched: 0, executed: 0, skipped: 0, failed: 0, rules: [] };

    for (const rule of rules) {
      const trigger = TRIGGER_DEFINITIONS.find((definition) => definition.id === rule.triggerType);
      if (!trigger) continue;

      const entities: Array<NoContactLeadRow | OverduePaymentRow | ExpiringVisaRow> = trigger.id === 'lead.no_contact'
        ? await this.collectNoContactLeads(Number(rule.triggerConfig?.days) || 3)
        : trigger.id === 'payment.overdue'
          ? await this.collectOverduePayments()
          : await this.collectExpiringVisas(Number(rule.triggerConfig?.days) || 60);

      const ruleResult: RuleRunOutcome = { ruleId: rule.id, ruleName: rule.name, scanned: entities.length, matched: 0, executed: 0, skipped: 0, failed: 0 };
      summary.scanned += entities.length;

      for (const entity of entities) {
        const context = entity as unknown as Record<string, unknown>;
        if (!matchesConditions(rule.conditions, context)) continue;
        ruleResult.matched++;
        summary.matched++;

        const entityType = trigger.entityType;
        // These row shapes share a `leadId` field (kept on every row for
        // follow-up attachment), so entityType - not an `in` check - is what
        // actually distinguishes which row shape this is.
        const entityId = trigger.id === 'lead.no_contact'
          ? (entity as NoContactLeadRow).leadId
          : trigger.id === 'payment.overdue'
            ? (entity as OverduePaymentRow).paymentId
            : (entity as ExpiringVisaRow).decisionId;

        if (options.dryRun) continue;

        if (await this.alreadyRanToday(rule.id, entityType, entityId)) {
          ruleResult.skipped++;
          summary.skipped++;
          continue;
        }

        const leadRow = entity as NoContactLeadRow;
        const paymentRow = entity as OverduePaymentRow;
        const visaRow = entity as ExpiringVisaRow;
        const title = trigger.id === 'lead.no_contact'
          ? `Lead "${leadRow.name || `#${leadRow.leadId}`}" has had no contact in ${leadRow.daysSinceContact} days`
          : trigger.id === 'payment.overdue'
            ? `Payment of ${paymentRow.amount} is ${paymentRow.daysOverdue} day(s) overdue`
            : `${visaRow.issuedDocumentType || 'Visa/residence permit'} for case #${visaRow.leadId} expires in ${visaRow.daysUntilExpiry} day(s)`;
        const message = `Automation rule "${rule.name}" matched this record. Review it in the CRM.`;

        try {
          const outcomes = await this.executeActions(rule.actions, {
            leadId: trigger.id === 'payment.overdue' ? paymentRow.leadId : (entity as NoContactLeadRow | ExpiringVisaRow).leadId,
            assigneeId: entity.assigneeId,
            title,
            message,
          });
          await this.logRun({ ruleId: rule.id, entityType, entityId, status: 'matched', detail: JSON.stringify(outcomes) });
          ruleResult.executed++;
          summary.executed++;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Action execution failed';
          await this.logRun({ ruleId: rule.id, entityType, entityId, status: 'failed', detail: errorMessage });
          ruleResult.failed++;
          summary.failed++;
        }
      }

      summary.rules.push(ruleResult);
    }

    return summary;
  }
}
