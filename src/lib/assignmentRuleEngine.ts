import { QueryTypes, Transaction } from 'sequelize';
import { sequelize } from './sequelize';
import { resolveLeadAutoAssignment, LeadAutoAssignmentResult } from './leadAutoAssignment';
import { ensureEmployeeAttendanceTable, CHECKED_IN_TODAY_SQL } from './employeeAttendanceTable';
import { HRService } from '@/services/hr-service';

// Enterprise-style "Assignment Rules" engine (the concept Zoho calls Assignment
// Rules / Rule Entries and Salesforce calls Lead Assignment Rules): an ordered
// list of condition -> owner rules, evaluated top to bottom, first match wins.
// This sits ON TOP of the existing branch-level round robin in
// leadAutoAssignment.ts rather than replacing it - a lead that matches no
// active rule (or whose matched rule has no eligible candidate right now)
// still falls back to that battle-tested per-branch rotation, so this file
// can only ever make assignment MORE specific, never break the existing path.

export type AssignmentMode = 'round_robin' | 'specific_employee';

export interface AssignmentRule {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  branchIds: number[];
  sourceIds: number[];
  priorities: string[];
  leadQualities: string[];
  countryInterestIds: number[];
  serviceInterestIds: number[];
  assignmentMode: AssignmentMode;
  employeeIds: number[];
  createdAt?: string;
  updatedAt?: string;
  createdBy?: number | null;
  updatedBy?: number | null;
}

export interface AssignmentRuleInput {
  name: string;
  description?: string | null;
  isActive?: boolean;
  sortOrder?: number;
  branchIds?: number[];
  sourceIds?: number[];
  priorities?: string[];
  leadQualities?: string[];
  countryInterestIds?: number[];
  serviceInterestIds?: number[];
  assignmentMode: AssignmentMode;
  employeeIds: number[];
}

export interface LeadAssignmentContext {
  branchId: number;
  sourceId?: number | null;
  priority?: string | null;
  leadQuality?: string | null;
  countryInterestId?: number | null;
  serviceInterestId?: number | null;
  preferredEmployeeId?: number | null;
  forceAutoAssign?: boolean;
  roundRobin?: boolean;
  // Previewing an assignment must not move any rotation cursor.
  consumeRoundRobin?: boolean;
}

export interface RuleAssignmentResult extends LeadAutoAssignmentResult {
  ruleId?: number;
  ruleName?: string;
}

interface RuleRow {
  id: number;
  name: string;
  description: string | null;
  is_active: number;
  sort_order: number;
  branch_ids: string | null;
  source_ids: string | null;
  priorities: string | null;
  lead_qualities: string | null;
  country_interest_ids: string | null;
  service_interest_ids: string | null;
  assignment_mode: AssignmentMode;
  employee_ids: string;
  created_at: string;
  updated_at: string;
  created_by: number | null;
  updated_by: number | null;
}

let rulesTableReady: Promise<void> | null = null;
let ruleStateTableReady: Promise<void> | null = null;

const ensureAssignmentRulesTable = async () => {
  if (!rulesTableReady) {
    rulesTableReady = sequelize.query(`
      CREATE TABLE IF NOT EXISTS crm_assignment_rules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        description TEXT NULL,
        is_active TINYINT NOT NULL DEFAULT 1,
        sort_order INT NOT NULL DEFAULT 0,
        branch_ids VARCHAR(255) NULL,
        source_ids VARCHAR(255) NULL,
        priorities VARCHAR(150) NULL,
        lead_qualities VARCHAR(255) NULL,
        country_interest_ids VARCHAR(255) NULL,
        service_interest_ids VARCHAR(255) NULL,
        assignment_mode VARCHAR(20) NOT NULL DEFAULT 'round_robin',
        employee_ids VARCHAR(1000) NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_by INT NULL,
        updated_by INT NULL,
        INDEX idx_assignment_rules_active_order (is_active, sort_order),
        CONSTRAINT fk_assignment_rules_created_by FOREIGN KEY (created_by) REFERENCES crm_employee(id) ON DELETE SET NULL,
        CONSTRAINT fk_assignment_rules_updated_by FOREIGN KEY (updated_by) REFERENCES crm_employee(id) ON DELETE SET NULL
      )
    `).then(() => undefined).catch((error) => {
      rulesTableReady = null;
      throw error;
    });
  }
  await rulesTableReady;
};

const ensureRuleStateTable = async () => {
  if (!ruleStateTableReady) {
    ruleStateTableReady = sequelize.query(`
      CREATE TABLE IF NOT EXISTS crm_assignment_rule_state (
        rule_id INT NOT NULL PRIMARY KEY,
        last_employee_id INT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_assignment_rule_state_rule FOREIGN KEY (rule_id) REFERENCES crm_assignment_rules(id) ON DELETE CASCADE,
        CONSTRAINT fk_assignment_rule_state_employee FOREIGN KEY (last_employee_id) REFERENCES crm_employee(id) ON DELETE SET NULL
      )
    `).then(() => undefined).catch((error) => {
      ruleStateTableReady = null;
      throw error;
    });
  }
  await ruleStateTableReady;
};

const parseIdList = (value: unknown): number[] => {
  if (!value || typeof value !== 'string') return [];
  return value
    .split(',')
    .map((item) => Number.parseInt(item.trim(), 10))
    .filter((id) => Number.isFinite(id) && id > 0);
};

const parseStringList = (value: unknown): string[] => {
  if (!value || typeof value !== 'string') return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const toCsv = (values: Array<string | number> | undefined | null): string | null => {
  if (!values || values.length === 0) return null;
  return values.map((v) => String(v).trim()).filter(Boolean).join(',');
};

// sequelize.query()'s raw return shape for an INSERT varies by how the
// replacements were passed - handles both the [insertId, meta] tuple and a
// nested { insertId } object, mirroring the proven-working helper in
// src/app/api/leads/route.ts rather than assuming one fixed shape.
function extractInsertId(result: unknown): number {
  const values = Array.isArray(result) ? result : [result];
  for (const value of values) {
    if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value;
    if (value && typeof value === 'object') {
      const insertId = (value as { insertId?: unknown }).insertId;
      if (typeof insertId === 'number' && Number.isInteger(insertId) && insertId > 0) return insertId;
      if (typeof insertId === 'string' && Number.isInteger(Number(insertId)) && Number(insertId) > 0) return Number(insertId);
    }
  }
  return 0;
}

const rowToRule = (row: RuleRow): AssignmentRule => ({
  id: row.id,
  name: row.name,
  description: row.description,
  isActive: Boolean(row.is_active),
  sortOrder: row.sort_order,
  branchIds: parseIdList(row.branch_ids),
  sourceIds: parseIdList(row.source_ids),
  priorities: parseStringList(row.priorities),
  leadQualities: parseStringList(row.lead_qualities),
  countryInterestIds: parseIdList(row.country_interest_ids),
  serviceInterestIds: parseIdList(row.service_interest_ids),
  assignmentMode: row.assignment_mode,
  employeeIds: parseIdList(row.employee_ids),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  createdBy: row.created_by,
  updatedBy: row.updated_by,
});

// --- CRUD -------------------------------------------------------------

export async function listAssignmentRules(): Promise<AssignmentRule[]> {
  await ensureAssignmentRulesTable();
  const rows = await sequelize.query<RuleRow>(
    'SELECT * FROM crm_assignment_rules ORDER BY sort_order ASC, id ASC',
    { type: QueryTypes.SELECT }
  );
  return rows.map(rowToRule);
}

export async function getAssignmentRuleById(id: number): Promise<AssignmentRule | null> {
  await ensureAssignmentRulesTable();
  const rows = await sequelize.query<RuleRow>(
    'SELECT * FROM crm_assignment_rules WHERE id = :id LIMIT 1',
    { replacements: { id }, type: QueryTypes.SELECT }
  );
  return rows[0] ? rowToRule(rows[0]) : null;
}

function validateRuleInput(input: AssignmentRuleInput) {
  if (!input.name || !input.name.trim()) throw new Error('Rule name is required');
  if (!input.assignmentMode || !['round_robin', 'specific_employee'].includes(input.assignmentMode)) {
    throw new Error('assignmentMode must be "round_robin" or "specific_employee"');
  }
  if (!Array.isArray(input.employeeIds) || input.employeeIds.length === 0) {
    throw new Error('At least one employee must be selected');
  }
  if (input.assignmentMode === 'specific_employee' && input.employeeIds.length !== 1) {
    throw new Error('"specific_employee" mode requires exactly one employee');
  }
}

export async function createAssignmentRule(input: AssignmentRuleInput, actorId?: number | null): Promise<AssignmentRule> {
  validateRuleInput(input);
  await ensureAssignmentRulesTable();

  let sortOrder = input.sortOrder;
  if (sortOrder === undefined || sortOrder === null) {
    const [{ maxOrder }] = await sequelize.query<{ maxOrder: number | null }>(
      'SELECT MAX(sort_order) AS maxOrder FROM crm_assignment_rules',
      { type: QueryTypes.SELECT }
    );
    sortOrder = (maxOrder ?? -1) + 1;
  }

  const insertResult = await sequelize.query(
    `INSERT INTO crm_assignment_rules
      (name, description, is_active, sort_order, branch_ids, source_ids, priorities,
       lead_qualities, country_interest_ids, service_interest_ids, assignment_mode,
       employee_ids, created_by, updated_by)
     VALUES (:name, :description, :isActive, :sortOrder, :branchIds, :sourceIds, :priorities,
       :leadQualities, :countryInterestIds, :serviceInterestIds, :assignmentMode,
       :employeeIds, :actorId, :actorId)`,
    {
      replacements: {
        name: input.name.trim(),
        description: input.description || null,
        isActive: input.isActive === false ? 0 : 1,
        sortOrder,
        branchIds: toCsv(input.branchIds),
        sourceIds: toCsv(input.sourceIds),
        priorities: toCsv(input.priorities),
        leadQualities: toCsv(input.leadQualities),
        countryInterestIds: toCsv(input.countryInterestIds),
        serviceInterestIds: toCsv(input.serviceInterestIds),
        assignmentMode: input.assignmentMode,
        employeeIds: toCsv(input.employeeIds),
        actorId: actorId ?? null,
      },
      type: QueryTypes.INSERT,
    }
  );

  const insertId = extractInsertId(insertResult);
  const created = await getAssignmentRuleById(insertId);
  if (!created) throw new Error('Failed to load newly created assignment rule');
  return created;
}

export async function updateAssignmentRule(id: number, input: Partial<AssignmentRuleInput>, actorId?: number | null): Promise<AssignmentRule> {
  await ensureAssignmentRulesTable();
  const existing = await getAssignmentRuleById(id);
  if (!existing) throw new Error('Assignment rule not found');

  const merged: AssignmentRuleInput = {
    name: input.name ?? existing.name,
    description: input.description !== undefined ? input.description : existing.description,
    isActive: input.isActive !== undefined ? input.isActive : existing.isActive,
    sortOrder: input.sortOrder !== undefined ? input.sortOrder : existing.sortOrder,
    branchIds: input.branchIds ?? existing.branchIds,
    sourceIds: input.sourceIds ?? existing.sourceIds,
    priorities: input.priorities ?? existing.priorities,
    leadQualities: input.leadQualities ?? existing.leadQualities,
    countryInterestIds: input.countryInterestIds ?? existing.countryInterestIds,
    serviceInterestIds: input.serviceInterestIds ?? existing.serviceInterestIds,
    assignmentMode: input.assignmentMode ?? existing.assignmentMode,
    employeeIds: input.employeeIds ?? existing.employeeIds,
  };
  validateRuleInput(merged);

  await sequelize.query(
    `UPDATE crm_assignment_rules SET
       name = :name, description = :description, is_active = :isActive, sort_order = :sortOrder,
       branch_ids = :branchIds, source_ids = :sourceIds, priorities = :priorities,
       lead_qualities = :leadQualities, country_interest_ids = :countryInterestIds,
       service_interest_ids = :serviceInterestIds, assignment_mode = :assignmentMode,
       employee_ids = :employeeIds, updated_by = :actorId
     WHERE id = :id`,
    {
      replacements: {
        id,
        name: merged.name.trim(),
        description: merged.description || null,
        isActive: merged.isActive === false ? 0 : 1,
        sortOrder: merged.sortOrder,
        branchIds: toCsv(merged.branchIds),
        sourceIds: toCsv(merged.sourceIds),
        priorities: toCsv(merged.priorities),
        leadQualities: toCsv(merged.leadQualities),
        countryInterestIds: toCsv(merged.countryInterestIds),
        serviceInterestIds: toCsv(merged.serviceInterestIds),
        assignmentMode: merged.assignmentMode,
        employeeIds: toCsv(merged.employeeIds),
        actorId: actorId ?? null,
      },
    }
  );

  const updated = await getAssignmentRuleById(id);
  if (!updated) throw new Error('Failed to load updated assignment rule');
  return updated;
}

export async function deleteAssignmentRule(id: number): Promise<void> {
  await ensureAssignmentRulesTable();
  await sequelize.query('DELETE FROM crm_assignment_rules WHERE id = :id', { replacements: { id } });
  await ensureRuleStateTable();
  await sequelize.query('DELETE FROM crm_assignment_rule_state WHERE rule_id = :id', { replacements: { id } });
}

export async function reorderAssignmentRules(orderedIds: number[]): Promise<void> {
  await ensureAssignmentRulesTable();
  await sequelize.transaction(async (transaction) => {
    for (let index = 0; index < orderedIds.length; index += 1) {
      await sequelize.query(
        'UPDATE crm_assignment_rules SET sort_order = :sortOrder WHERE id = :id',
        { replacements: { sortOrder: index, id: orderedIds[index] }, transaction }
      );
    }
  });
}

// --- Matching -----------------------------------------------------------

// A rule "dimension" (branch/source/priority/...) with no configured values
// is a wildcard - it matches every lead. A configured dimension only matches
// when the lead's value for that dimension is in the rule's list. This is
// the same semantics as Zoho's per-field "any/is one of" condition builder.
function matchesRule(rule: AssignmentRule, lead: LeadAssignmentContext): boolean {
  if (rule.branchIds.length > 0 && !rule.branchIds.includes(lead.branchId)) return false;
  if (rule.sourceIds.length > 0 && (!lead.sourceId || !rule.sourceIds.includes(lead.sourceId))) return false;
  if (rule.priorities.length > 0) {
    const p = (lead.priority || '').toLowerCase();
    if (!rule.priorities.some((v) => v.toLowerCase() === p)) return false;
  }
  if (rule.leadQualities.length > 0) {
    const q = (lead.leadQuality || '').toLowerCase();
    if (!rule.leadQualities.some((v) => v.toLowerCase() === q)) return false;
  }
  if (rule.countryInterestIds.length > 0 && (!lead.countryInterestId || !rule.countryInterestIds.includes(lead.countryInterestId))) return false;
  if (rule.serviceInterestIds.length > 0 && (!lead.serviceInterestId || !rule.serviceInterestIds.includes(lead.serviceInterestId))) return false;
  return true;
}

export async function findMatchingRule(lead: LeadAssignmentContext): Promise<AssignmentRule | null> {
  const rules = await listAssignmentRules();
  return rules.find((rule) => rule.isActive && matchesRule(rule, lead)) || null;
}

interface RuleCandidate {
  id: number;
  name: string;
  branch: number | null;
  openLeadCount: number;
}

async function loadRuleCandidates(employeeIds: number[], requireCheckedIn: boolean, transaction?: Transaction): Promise<RuleCandidate[]> {
  // Previously the only one of crm_employee_attendance's four consumers
  // that never called its own table-provisioning - relied entirely on
  // admin/attendance, admin/attendance/presence, or leadAutoAssignment.ts
  // having already run theirs first. Harmless on this deployment (the
  // table has existed since long before this session), but a real
  // "table doesn't exist" landmine on a fresh install if this code path
  // happened to run first. Now also ensures crm_hr_attendance_records,
  // since CHECKED_IN_TODAY_SQL reads both.
  if (requireCheckedIn) {
    await Promise.all([ensureEmployeeAttendanceTable(), HRService.ensureAttendanceRecordTable()]);
  }

  const attendanceClause = requireCheckedIn ? `AND ${CHECKED_IN_TODAY_SQL}` : '';

  return sequelize.query<RuleCandidate>(
    `SELECT e.id, e.name, e.branch, COUNT(l.id) AS openLeadCount
     FROM crm_employee e
     LEFT JOIN crm_forum_leads l
       ON l.assignTo = e.id
       AND COALESCE(l.status, '') NOT IN ('Converted', 'Closed', 'Lost', 'client', 'retained')
     WHERE e.status = 1
       AND e.id IN (:employeeIds)
       ${attendanceClause}
     GROUP BY e.id, e.name, e.branch
     ORDER BY FIELD(e.id, ${employeeIds.join(',')})`,
    { replacements: { employeeIds }, type: QueryTypes.SELECT, transaction }
  );
}

async function getNextRuleRoundRobinCandidate(
  ruleId: number,
  candidates: RuleCandidate[],
  transaction: Transaction,
  consumeRoundRobin: boolean
): Promise<RuleCandidate> {
  await sequelize.query(
    `INSERT INTO crm_assignment_rule_state (rule_id, last_employee_id, created_at, updated_at)
     VALUES (:ruleId, NULL, NOW(), NOW())
     ON DUPLICATE KEY UPDATE rule_id = rule_id`,
    { replacements: { ruleId }, transaction }
  );

  const stateRows = await sequelize.query<{ last_employee_id: number | null }>(
    'SELECT last_employee_id FROM crm_assignment_rule_state WHERE rule_id = :ruleId FOR UPDATE',
    { replacements: { ruleId }, type: QueryTypes.SELECT, transaction }
  );

  const lastEmployeeId = stateRows[0]?.last_employee_id || null;
  const lastIndex = lastEmployeeId ? candidates.findIndex((c) => c.id === lastEmployeeId) : -1;
  const nextIndex = (lastIndex + 1) % candidates.length;
  const selected = candidates[nextIndex];

  if (consumeRoundRobin) {
    await sequelize.query(
      'UPDATE crm_assignment_rule_state SET last_employee_id = :employeeId, updated_at = NOW() WHERE rule_id = :ruleId',
      { replacements: { ruleId, employeeId: selected.id }, transaction }
    );
  }

  return selected;
}

// Resolves a matched rule to a specific employee. Returns null (never
// throws) when the rule's configured pool is currently empty of eligible
// employees, so the caller can fall back to the branch-level engine instead
// of blocking lead creation on a misconfigured or fully-offline rule.
async function resolveRuleAssignment(
  rule: AssignmentRule,
  fallbackBranchId: number,
  consumeRoundRobin: boolean
): Promise<RuleAssignmentResult | null> {
  if (rule.assignmentMode === 'specific_employee') {
    const [employee] = await sequelize.query<{ id: number; branch: number | null; status: number }>(
      'SELECT id, branch, status FROM crm_employee WHERE id = :id LIMIT 1',
      { replacements: { id: rule.employeeIds[0] }, type: QueryTypes.SELECT }
    );
    if (!employee || Number(employee.status) !== 1) return null;
    return {
      assignedEmployeeId: employee.id,
      counselorId: employee.id,
      branchId: employee.branch || fallbackBranchId,
      strategy: 'manual_preferred',
      candidateCount: 1,
      currentLeadCount: 0,
      ruleId: rule.id,
      ruleName: rule.name,
    };
  }

  await ensureRuleStateTable();

  return sequelize.transaction(async (transaction) => {
    // Prefer only employees checked in today; if none of the rule's queue is
    // checked in, degrade to "active member of the queue" rather than
    // abandoning the rule entirely - mirrors the branch engine's own fallback.
    let candidates = await loadRuleCandidates(rule.employeeIds, true, transaction);
    if (candidates.length === 0) {
      candidates = await loadRuleCandidates(rule.employeeIds, false, transaction);
    }
    if (candidates.length === 0) return null;

    const selected = await getNextRuleRoundRobinCandidate(rule.id, candidates, transaction, consumeRoundRobin);
    return {
      assignedEmployeeId: selected.id,
      counselorId: selected.id,
      branchId: selected.branch || fallbackBranchId,
      strategy: 'branch_allocation_round_robin',
      candidateCount: candidates.length,
      currentLeadCount: Number(selected.openLeadCount || 0),
      ruleId: rule.id,
      ruleName: rule.name,
    };
  });
}

// --- Orchestrator ---------------------------------------------------------

// The single entry point every lead-creation/assignment path should call.
// Order of precedence, matching how Zoho/Salesforce assignment rules layer
// on top of manual ownership:
//   1. An explicit preferred owner (manual pick) always wins outright.
//   2. The first active Assignment Rule whose conditions match the lead,
//      provided its queue currently has an eligible candidate.
//   3. The existing per-branch round robin (leadAutoAssignment.ts) as the
//      universal fallback - guarantees a lead is never stuck unassignable
//      just because no rule was configured or a rule's queue is empty.
export async function resolveLeadAssignment(context: LeadAssignmentContext): Promise<RuleAssignmentResult> {
  const { preferredEmployeeId, forceAutoAssign = false, roundRobin = true, consumeRoundRobin = true } = context;

  if (preferredEmployeeId && !forceAutoAssign) {
    return resolveLeadAutoAssignment({
      branchId: context.branchId,
      preferredEmployeeId,
      forceAutoAssign,
      roundRobin,
      consumeRoundRobin,
    });
  }

  await ensureAssignmentRulesTable();
  const matchedRule = await findMatchingRule(context);
  if (matchedRule) {
    const ruleResult = await resolveRuleAssignment(matchedRule, context.branchId, consumeRoundRobin);
    if (ruleResult) return ruleResult;
  }

  return resolveLeadAutoAssignment({
    branchId: context.branchId,
    preferredEmployeeId,
    forceAutoAssign,
    roundRobin,
    consumeRoundRobin,
  });
}

// Non-consuming preview used by the admin UI: which rule would fire for a
// hypothetical lead, and who round robin would pick next, without moving
// any rotation cursor.
export async function previewLeadAssignment(context: Omit<LeadAssignmentContext, 'consumeRoundRobin'>): Promise<RuleAssignmentResult> {
  return resolveLeadAssignment({ ...context, forceAutoAssign: true, consumeRoundRobin: false });
}
