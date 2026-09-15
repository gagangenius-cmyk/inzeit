import crypto from 'crypto';
import { QueryTypes } from 'sequelize';
import { sequelize } from '@/lib/sequelize';
import { HRService } from '@/services/hr-service';
import { sendEmail } from '@/lib/mailer';

type CandidateInput = { full_name: string; email: string; phone?: string; applied_position: string; applied_date?: string; source?: string; created_by?: string };
type ExitInput = {
  employee_id: string;
  submitted_by: string;
  reason: string;
  requested_lwd?: string;
  notes?: string;
  notice_period_days?: number;
  reason_category?: string;
  additional_comments?: string;
  branch_snapshot?: string;
};
type WorkflowRow = Record<string, string | number | null>;

export class HRJoiningExitService {
  static async ensureTables() {
    await sequelize.query(`CREATE TABLE IF NOT EXISTS crm_hr_recruitment_candidates (
      candidate_id CHAR(36) PRIMARY KEY, full_name VARCHAR(255) NOT NULL, email VARCHAR(255) NOT NULL, phone VARCHAR(80) NULL, applied_position VARCHAR(180) NOT NULL, applied_date DATE NOT NULL, source VARCHAR(120) NULL,
      interview_date DATETIME NULL, interview_outcome ENUM('Pending','Pass','Fail') NOT NULL DEFAULT 'Pending', status ENUM('Applied','Interviewed','Selected','Rejected','Offer Sent','Accepted','Joined') NOT NULL DEFAULT 'Applied', rejection_reason TEXT NULL,
      offer_salary DECIMAL(12,2) NULL, offer_designation VARCHAR(180) NULL, offer_terms TEXT NULL, offer_letter_url TEXT NULL, offer_sent_at DATETIME NULL, offer_accepted_at DATETIME NULL, joining_date DATE NULL, company_email VARCHAR(255) NULL, crm_id_generated_at DATETIME NULL, employee_id CHAR(36) NULL, dos_approved_by CHAR(36) NULL, dos_approved_at DATETIME NULL, acceptance_token CHAR(36) NULL, created_by CHAR(36) NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, INDEX idx_hr_candidate_status (status), INDEX idx_hr_candidate_email (email))`);
    await sequelize.query(`CREATE TABLE IF NOT EXISTS crm_hr_exit_requests (
      exit_request_id CHAR(36) PRIMARY KEY, employee_id CHAR(36) NOT NULL, exit_type ENUM('Resignation','Termination') NOT NULL, submitted_by CHAR(36) NOT NULL, submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, reason TEXT NOT NULL, requested_lwd DATE NULL, approved_lwd DATE NULL, approved_by CHAR(36) NULL, approved_at DATETIME NULL, status ENUM('Pending','Approved','Rejected','Completed','Withdrawn') NOT NULL DEFAULT 'Pending', exit_interview_id CHAR(36) NULL, fnf_email_sent_at DATETIME NULL, fnf_email_status ENUM('Pending','Sent','Failed') NOT NULL DEFAULT 'Pending', notes TEXT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, INDEX idx_hr_exit_request_employee (employee_id), INDEX idx_hr_exit_request_status (status))`);
    await sequelize.query(`CREATE TABLE IF NOT EXISTS crm_hr_workflow_notifications (notification_id CHAR(36) PRIMARY KEY, workflow_type VARCHAR(80) NOT NULL, entity_id CHAR(36) NOT NULL, recipient VARCHAR(255) NOT NULL, subject VARCHAR(255) NOT NULL, status ENUM('Queued','Sent','Failed') NOT NULL DEFAULT 'Queued', created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, INDEX idx_hr_workflow_notification_entity (entity_id))`);
    await this.addColumnIfMissing('crm_hr_exit_requests', 'notice_period_days', 'INT NULL DEFAULT 30 AFTER requested_lwd');
    await this.addColumnIfMissing('crm_hr_exit_requests', 'reason_category', 'VARCHAR(120) NULL AFTER reason');
    await this.addColumnIfMissing('crm_hr_exit_requests', 'additional_comments', 'TEXT NULL AFTER notes');
    await this.addColumnIfMissing('crm_hr_exit_requests', 'branch_snapshot', 'VARCHAR(255) NULL AFTER additional_comments');
    await this.addColumnIfMissing('crm_hr_exit_requests', 'workflow_stage', "ENUM('Submitted','Under Review','Acknowledged','Exit Process') NOT NULL DEFAULT 'Submitted' AFTER status");
  }

  private static async addColumnIfMissing(table: string, column: string, definition: string) {
    const [existing] = await sequelize.query<{ cnt: number }>(
      `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table AND COLUMN_NAME = :column`,
      { replacements: { table, column }, type: QueryTypes.SELECT }
    );
    if (Number(existing?.cnt || 0) > 0) return;
    await sequelize.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
  }

  private static async notify(workflowType: string, entityId: string, recipient: string, subject: string) {
    await sequelize.query('INSERT INTO crm_hr_workflow_notifications (notification_id, workflow_type, entity_id, recipient, subject) VALUES (:id,:workflowType,:entityId,:recipient,:subject)', { replacements: { id: crypto.randomUUID(), workflowType, entityId, recipient, subject } });

    // Only attempt a real send when the recipient is an actual email address - many callers
    // pass a role name (e.g. "HR", "Branch Manager / Director of Sales") that has no inbox to
    // resolve to. Best-effort: a missing RESEND_API_KEY or send failure must never break the
    // workflow action that triggered this notification.
    if (recipient.includes('@')) {
      try {
        await sendEmail({ to: recipient, subject, html: `<p>${subject}</p>` });
      } catch (error) {
        console.warn('HR workflow notification email failed:', error instanceof Error ? error.message : error);
      }
    }
  }

  // Resolves a role name (e.g. 'HR') to the real inboxes of active employees
  // holding it, so notify() has an actual address to send to instead of the
  // role-name placeholders used elsewhere in this file (which never resolve
  // to a real send since notify() only emails when the recipient looks like
  // an address).
  private static async resolveRoleEmails(roleNames: string[]): Promise<string[]> {
    const rows = await sequelize.query<{ email: string | null; cemail: string | null }>(
      `SELECT e.email, e.cemail FROM crm_employee e
       JOIN crm_role r ON r.id = e.role
       WHERE e.status = 1 AND r.name IN (:roleNames)`,
      { replacements: { roleNames }, type: QueryTypes.SELECT }
    );
    const emails = new Set<string>();
    rows.forEach((row) => {
      const address = row.cemail || row.email;
      if (address) emails.add(address);
    });
    return Array.from(emails);
  }

  static async createCandidate(input: CandidateInput) {
    await this.ensureTables();
    const [recentDuplicate] = await sequelize.query<{ candidate_id: string }>(
      `SELECT candidate_id FROM crm_hr_recruitment_candidates
       WHERE email = :email AND applied_position = :applied_position
         AND created_at >= (NOW() - INTERVAL 60 SECOND)
       LIMIT 1`,
      { replacements: { email: input.email, applied_position: input.applied_position }, type: QueryTypes.SELECT }
    );
    if (recentDuplicate) {
      throw new Error('This candidate was already added a moment ago - check the recruitment list before resubmitting.');
    }

    const candidate_id = crypto.randomUUID();
    await sequelize.query(`INSERT INTO crm_hr_recruitment_candidates (candidate_id,full_name,email,phone,applied_position,applied_date,source,created_by) VALUES (:candidate_id,:full_name,:email,:phone,:applied_position,:applied_date,:source,:created_by)`, { replacements: { ...input, candidate_id, phone: input.phone || null, source: input.source || null, created_by: input.created_by || null, applied_date: input.applied_date || new Date().toISOString().slice(0, 10) } });
    return this.getCandidate(candidate_id);
  }
  static async listCandidates(filters?: { status?: string; applied_position?: string }) {
    await this.ensureTables();
    let sql = 'SELECT * FROM crm_hr_recruitment_candidates WHERE 1=1';
    const params: Record<string, string> = {};
    if (filters?.status) { sql += ' AND status=:status'; params.status = filters.status; }
    if (filters?.applied_position) { sql += ' AND applied_position LIKE :applied_position'; params.applied_position = `%${filters.applied_position}%`; }
    sql += ' ORDER BY created_at DESC';
    return sequelize.query<WorkflowRow>(sql, { replacements: params, type: QueryTypes.SELECT });
  }
  static async getCandidate(id: string): Promise<WorkflowRow | null> { await this.ensureTables(); const rows = await sequelize.query<WorkflowRow>('SELECT * FROM crm_hr_recruitment_candidates WHERE candidate_id=:id', { replacements: { id }, type: QueryTypes.SELECT }); return rows[0] || null; }
  static async updateCandidateStatus(id: string, input: Record<string, unknown>) {
    await this.ensureTables(); const current = await this.getCandidate(id); if (!current) return null;
    const status = String(input.status || current.status); const outcome = input.interview_outcome ? String(input.interview_outcome) : null;
    if (!['Applied','Interviewed','Selected','Rejected','Offer Sent','Accepted','Joined'].includes(status)) throw new Error('Invalid candidate status');
    if (outcome && !['Pending','Pass','Fail'].includes(outcome)) throw new Error('Invalid interview outcome');
    await sequelize.query(`UPDATE crm_hr_recruitment_candidates SET status=:status, interview_date=COALESCE(:interview_date,interview_date), interview_outcome=COALESCE(:outcome,interview_outcome), rejection_reason=COALESCE(:reason,rejection_reason) WHERE candidate_id=:id`, { replacements: { id, status, interview_date: input.interview_date ? String(input.interview_date) : null, outcome, reason: input.rejection_reason ? String(input.rejection_reason) : null } });
    if (status === 'Rejected') await this.notify('candidate_rejected', id, String(current.email), 'Update on your application');
    return this.getCandidate(id);
  }
  static async submitOffer(id: string, input: Record<string, unknown>) {
    await this.ensureTables(); const candidate = await this.getCandidate(id); if (!candidate) return null;
    const salary = Number(input.offer_salary); const designation = String(input.offer_designation || '').trim(); if (!Number.isFinite(salary) || salary < 0 || !designation) throw new Error('offer_salary and offer_designation are required');
    await sequelize.query('UPDATE crm_hr_recruitment_candidates SET offer_salary=:salary, offer_designation=:designation, offer_terms=:terms, offer_letter_url=COALESCE(:offerLetterUrl, offer_letter_url), status=\'Selected\' WHERE candidate_id=:id', { replacements: { id, salary, designation, terms: input.offer_terms ? String(input.offer_terms) : null, offerLetterUrl: input.offer_letter_url ? String(input.offer_letter_url) : null } });
    await this.notify('offer_approval', id, 'Director of Sales', `Offer approval required for ${String(candidate.full_name)}`); return this.getCandidate(id);
  }
  static async approveOffer(id: string, approverId: string) {
    await this.ensureTables(); const candidate = await this.getCandidate(id); if (!candidate) return null; if (!candidate.offer_designation) throw new Error('Submit offer terms before approval');
    const token = crypto.randomUUID(); await sequelize.query(`UPDATE crm_hr_recruitment_candidates SET status='Offer Sent', dos_approved_by=:approverId, dos_approved_at=NOW(), offer_sent_at=NOW(), acceptance_token=:token WHERE candidate_id=:id`, { replacements: { id, approverId, token } });
    await this.notify('offer_sent', id, String(candidate.email), 'Your Global Navigator offer is ready'); return { candidate: await this.getCandidate(id), acceptance_token: token };
  }
  static async acceptOffer(id: string, token: string) { await this.ensureTables(); const candidate = await this.getCandidate(id); if (!candidate || candidate.acceptance_token !== token) return null; await sequelize.query(`UPDATE crm_hr_recruitment_candidates SET status='Accepted', offer_accepted_at=NOW() WHERE candidate_id=:id`, { replacements: { id } }); await this.notify('offer_accepted', id, 'HR', `${String(candidate.full_name)} accepted the offer`); return this.getCandidate(id); }
  static async onboardCandidate(id: string, input: Record<string, unknown>) {
    await this.ensureTables(); const candidate = await this.getCandidate(id); if (!candidate) return null; if (candidate.status !== 'Accepted') throw new Error('Only accepted candidates can be onboarded'); const companyEmail = String(input.company_email || '').trim(); if (!companyEmail) throw new Error('company_email is required'); const employeeId = String(input.employee_id || crypto.randomUUID());
    await sequelize.query(`UPDATE crm_hr_recruitment_candidates SET status='Joined', company_email=:companyEmail, employee_id=:employeeId, joining_date=:joiningDate, crm_id_generated_at=NOW() WHERE candidate_id=:id`, { replacements: { id, companyEmail, employeeId, joiningDate: input.joining_date ? String(input.joining_date) : new Date().toISOString().slice(0, 10) } });
    // The offer letter link captured back in submitOffer() becomes this employee's first
    // onboarding document, once there's finally a real employee_id to attach it to.
    if (candidate.offer_letter_url) {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS crm_hr_employee_documents (
          document_id CHAR(36) PRIMARY KEY, employee_id CHAR(36) NOT NULL, document_type VARCHAR(255) NOT NULL,
          document_url VARCHAR(500) NOT NULL, expiry_date DATE NULL, notes TEXT NULL, deleted_at DATETIME NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, INDEX idx_hr_employee_documents_employee (employee_id)
        )
      `);
      await sequelize.query(
        `INSERT INTO crm_hr_employee_documents (document_id, employee_id, document_type, document_url)
         VALUES (UUID(), :employeeId, 'Offer Letter', :documentUrl)`,
        { replacements: { employeeId, documentUrl: String(candidate.offer_letter_url) } }
      );
    }
    await this.notify('welcome', id, companyEmail, 'Welcome to Global Navigator - your CRM access is ready'); return this.getCandidate(id);
  }
  static async pipeline() { const candidates = await this.listCandidates(); const stages = ['Applied','Interviewed','Selected','Rejected','Offer Sent','Accepted','Joined']; return { total: candidates.length, stages: stages.map(status => ({ status, total: candidates.filter(x => x.status === status).length })) }; }

  static async createExit(input: ExitInput, exitType: 'Resignation' | 'Termination') {
    await this.ensureTables();

    // Duplicate-submission guard: an employee can only have one exit request
    // in flight at a time, so a resubmit (double-click, page reload, second
    // tab) would otherwise create a second competing request rather than
    // just being a harmless no-op.
    const [pendingExisting] = await sequelize.query<{ exit_request_id: string }>(
      `SELECT exit_request_id FROM crm_hr_exit_requests WHERE employee_id = :employee_id AND status = 'Pending' LIMIT 1`,
      { replacements: { employee_id: input.employee_id }, type: QueryTypes.SELECT }
    );
    if (pendingExisting) {
      throw new Error('An exit request for this employee is already pending approval.');
    }

    const exit_request_id = crypto.randomUUID();
    await sequelize.query(
      `INSERT INTO crm_hr_exit_requests (exit_request_id,employee_id,exit_type,submitted_by,reason,requested_lwd,notice_period_days,reason_category,additional_comments,branch_snapshot,notes) VALUES (:id,:employee_id,:exitType,:submitted_by,:reason,:requested_lwd,:notice_period_days,:reason_category,:additional_comments,:branch_snapshot,:notes)`,
      { replacements: { employee_id: input.employee_id, submitted_by: input.submitted_by, reason: input.reason, id: exit_request_id, exitType, requested_lwd: input.requested_lwd || null, notice_period_days: input.notice_period_days ?? 30, reason_category: input.reason_category || null, additional_comments: input.additional_comments || null, branch_snapshot: input.branch_snapshot || null, notes: input.notes || null } }
    );
    await this.notify('exit_approval', exit_request_id, 'Director of Sales', `${exitType} approval required`);

    // Resolve real addresses so this actually lands in an inbox, not just the
    // in-app notification log the generic notify() call above writes.
    const employee = await HRService.getEmployeeById(Number(input.employee_id)).catch(() => null) as { name?: string; cemail?: string; email?: string } | null;
    const employeeName = employee?.name || `Employee #${input.employee_id}`;
    const employeeEmail = employee?.cemail || employee?.email || null;
    const lwdText = input.requested_lwd || 'Not specified';

    const hrEmails = await this.resolveRoleEmails(['HR']);
    for (const hrEmail of hrEmails) {
      await this.notify('exit_submitted_hr', exit_request_id, hrEmail, `${exitType} submitted by ${employeeName} - last working day ${lwdText}`);
    }
    if (employeeEmail) {
      await this.notify('exit_submitted_confirmation', exit_request_id, employeeEmail, `Your ${exitType.toLowerCase()} has been submitted to HR`);
    }

    return this.getExit(exit_request_id);
  }
  static async getMyLatestExit(employeeId: string): Promise<WorkflowRow | null> { await this.ensureTables(); const rows = await sequelize.query<WorkflowRow>(`SELECT * FROM crm_hr_exit_requests WHERE employee_id=:employeeId ORDER BY submitted_at DESC LIMIT 1`, { replacements: { employeeId }, type: QueryTypes.SELECT }); return rows[0] || null; }
  static async withdrawExit(id: string, employeeId: string): Promise<WorkflowRow | null> {
    await this.ensureTables();
    const request = await this.getExit(id);
    if (!request) return null;
    if (String(request.employee_id) !== String(employeeId)) throw new Error('You can only withdraw your own resignation');
    if (request.workflow_stage === 'Acknowledged' || request.workflow_stage === 'Exit Process') {
      throw new Error('This resignation has already been acknowledged and can no longer be withdrawn — please contact HR');
    }
    if (request.status === 'Withdrawn') throw new Error('This resignation has already been withdrawn');
    await sequelize.query(`UPDATE crm_hr_exit_requests SET status='Withdrawn' WHERE exit_request_id=:id`, { replacements: { id } });
    return this.getExit(id);
  }
  static async listExits(filters?: { status?: string; exit_type?: string }) {
    await this.ensureTables();
    let sql = `SELECT x.*, e.name AS employee_name FROM crm_hr_exit_requests x LEFT JOIN crm_employee e ON CAST(e.id AS CHAR) COLLATE utf8mb4_general_ci=x.employee_id WHERE 1=1`;
    const params: Record<string, string> = {};
    if (filters?.status) { sql += ' AND x.status=:status'; params.status = filters.status; }
    if (filters?.exit_type) { sql += ' AND x.exit_type=:exit_type'; params.exit_type = filters.exit_type; }
    sql += ' ORDER BY x.submitted_at DESC';
    return sequelize.query<WorkflowRow>(sql, { replacements: params, type: QueryTypes.SELECT });
  }
  static async getExit(id: string): Promise<WorkflowRow | null> { await this.ensureTables(); const rows = await sequelize.query<WorkflowRow>(`SELECT x.*, e.name AS employee_name FROM crm_hr_exit_requests x LEFT JOIN crm_employee e ON CAST(e.id AS CHAR) COLLATE utf8mb4_general_ci=x.employee_id WHERE x.exit_request_id=:id`, { replacements: { id }, type: QueryTypes.SELECT }); return rows[0] || null; }
  static async reviewExit(id: string, approved: boolean, userId: string, lwd?: string, notes?: string) {
    await this.ensureTables();
    const request = await this.getExit(id);
    if (!request) return null;
    await sequelize.query(`UPDATE crm_hr_exit_requests SET status=:status, workflow_stage=:workflowStage, approved_by=:userId, approved_at=NOW(), approved_lwd=:lwd, notes=COALESCE(:notes,notes) WHERE exit_request_id=:id`, { replacements: { id, userId, status: approved ? 'Approved' : 'Rejected', workflowStage: approved ? 'Acknowledged' : 'Under Review', lwd: lwd || null, notes: notes || null } });
    if (approved) {
      await this.notify('exit_approved', id, 'HR', `Exit request approved for ${String(request.employee_name || request.employee_id)}`);
      // Un-silos the exit tooling: approving a resignation/termination now scaffolds a
      // default checklist for it automatically, instead of HR having to remember to open
      // the separate Exit Checklist screen and re-enter the same employee/reason/LWD by hand.
      await HRService.assignExitChecklist({
        employee_id: String(request.employee_id),
        exit_request_id: id,
        separation_reason: String(request.exit_type || ''),
        last_working_day: lwd || (request.requested_lwd ? String(request.requested_lwd) : null),
        assigned_by: userId,
      });
    }
    return this.getExit(id);
  }
  static async completeExit(id: string, interviewId?: string) {
    await this.ensureTables();
    const request = await this.getExit(id);
    if (!request) return null;
    await sequelize.query(`UPDATE crm_hr_exit_requests SET status='Completed', workflow_stage='Exit Process', exit_interview_id=:interviewId, fnf_email_status='Sent', fnf_email_sent_at=NOW() WHERE exit_request_id=:id`, { replacements: { id, interviewId: interviewId || null } });
    // The resignation/termination workflow is now the one place that actually deactivates
    // the employee record - previously this only ever happened via a separate, manual
    // "delete employee" action in Employee Management, so a completed exit could leave
    // someone showing as Active indefinitely.
    const employeeIdNum = Number(request.employee_id);
    if (Number.isFinite(employeeIdNum)) await HRService.softDeleteEmployee(employeeIdNum);
    await this.notify('fnf', id, String(request.employee_name || request.employee_id), 'Full and final settlement process initiated');
    return this.getExit(id);
  }

  static async getFnfSummary(employeeId: string) {
    await this.ensureTables();
    const employees = await sequelize.query<WorkflowRow>(
      `SELECT id, name, doj, email FROM crm_employee WHERE CAST(id AS CHAR) COLLATE utf8mb4_general_ci=:employeeId OR id=:employeeIdNum`,
      { replacements: { employeeId, employeeIdNum: parseInt(employeeId) || 0 }, type: QueryTypes.SELECT }
    );
    if (!employees.length) return null;
    const emp = employees[0];
    const eosb = await sequelize.query<WorkflowRow>(
      `SELECT * FROM crm_hr_eosb_settlements WHERE employee_id=:employeeId ORDER BY created_at DESC LIMIT 1`,
      { replacements: { employeeId }, type: QueryTypes.SELECT }
    );
    const latestExit = await sequelize.query<WorkflowRow>(
      `SELECT * FROM crm_hr_exit_requests WHERE employee_id=:employeeId ORDER BY submitted_at DESC LIMIT 1`,
      { replacements: { employeeId }, type: QueryTypes.SELECT }
    );
    return {
      employee: { id: emp.id, name: emp.name, email: emp.email, doj: emp.doj },
      eosbSettlement: eosb[0] || null,
      exitRequest: latestExit[0] || null,
      summary: eosb[0] ? {
        finalSalary: eosb[0].unpaid_salary || 0,
        eosbAmount: eosb[0].eosb_amount || 0,
        leaveEncashment: eosb[0].leave_encashment || 0,
        deductions: 0,
        totalPayable: eosb[0].total_payable || 0,
      } : null,
    };
  }
}
