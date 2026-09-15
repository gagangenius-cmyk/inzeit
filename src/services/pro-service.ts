import { QueryTypes } from 'sequelize';
import { sequelize } from '@/lib/sequelize';
import crypto from 'crypto';
import { put } from '@vercel/blob';
import { HRService } from '@/services/hr-service';

type RenewalRow = {
  id: number;
  title: string;
  category: string;
  owner: string;
  authority: string;
  expiryDate: string;
  status: string;
  daysLeft: number;
};
type WpsRunRow = {
  id: number;
  month: string;
  employees: number;
  grossPayroll: number;
  sifStatus: string;
  bank: string;
  transferDate: string;
};
type TaskRow = {
  id: number;
  title: string;
  category: string;
  owner: string;
  dueDate: string;
  priority: string;
  status: string;
};
type CompanyDocumentInput = {
  document_id?: string;
  company_id: string;
  doc_type: string;
  doc_number: string;
  issuing_authority: string;
  issue_date: string;
  expiry_date: string;
  reminder_days?: number[];
  status?: string;
  doc_file_url?: string | null;
  notes?: string | null;
  managed_by: string;
  renewal_cost?: number | null;
  last_renewed?: string | null;
};
type EmployeeImmigrationInput = {
  pro_emp_id?: string;
  employee_id: string;
  visa_uid: string;
  visa_type: string;
  visa_issue_date: string;
  visa_expiry_date: string;
  visa_status?: string;
  labour_card_no: string;
  labour_card_expiry: string;
  contract_type: string;
  mohre_contract_ref?: string | null;
  medical_fitness?: string | null;
  health_insurance_no?: string | null;
  insurance_expiry?: string | null;
  entry_permit_no?: string | null;
  changed_by?: string | null;
};
type WpsRecordInput = {
  wps_id?: string;
  payroll_month: string;
  employer_code: string;
  agent_id: string;
  processed_by: string;
  payment_date?: string | null;
  submission_date?: string | null;
  submission_ref?: string | null;
  status?: string;
  rejection_reason?: string | null;
  salary_records?: WpsSalaryRecord[];
};
type InsuranceRecordInput = {
  insurance_id?: string;
  insurance_category?: string;
  employee_id?: string | null;
  insured_name: string;
  insurance_company: string;
  policy_number: string;
  policy_start: string;
  policy_expiry: string;
  coverage_amount?: number | null;
  premium_amount?: number | null;
  dependents?: unknown[] | null;
  network_code?: string | null;
  card_url?: string | null;
  status?: string;
};
type GccBranchDocumentInput = {
  branch_id?: string;
  branch_name: string;
  country: string;
  city: string;
  registration_no: string;
  registration_expiry: string;
  licence_type: string;
  licence_expiry: string;
  bank_account?: string | null;
  bank_name?: string | null;
  branch_manager?: string | null;
  contact_phone?: string | null;
  documents?: unknown[] | null;
  notes?: string | null;
  status?: string;
};
type OwnerDocumentInput = {
  owner_id?: string;
  full_name: string;
  role: string;
  nationality: string;
  passport_no: string;
  passport_expiry: string;
  emirates_id?: string | null;
  emirates_id_expiry?: string | null;
  residence_visa_no?: string | null;
  visa_expiry?: string | null;
  share_percentage?: number | null;
  poa_document?: string | null;
  poa_expiry?: string | null;
  signature_specimen?: string | null;
  bank_signatories?: unknown[] | null;
  documents?: unknown[] | null;
  access_level?: string;
};
type WpsSalaryRecord = {
  uid_labour_no: string;
  name: string;
  salary: number;
  routing_code: string;
  account_number: string;
};

const numberValue = (value: unknown) => Number(value || 0);
const documentTypes = [
  'Trade License',
  'Chamber Certificate',
  'Establishment Card',
  'MOA',
  'AOA',
  'VAT Certificate',
  'Tax Registration',
  'Office Lease',
  'Bank Account',
  'Other',
] as const;
const documentStatuses = ['Valid', 'Critical', 'Expiring Soon', 'Expired', 'Renewal In Progress', 'Cancelled'] as const;
const visaTypes = ['Employment', 'Mission', 'Investor', 'Partner', 'Other'] as const;
const visaStatuses = ['Active', 'Expiring', 'Expired', 'Cancelled', 'Under Processing'] as const;
const contractTypes = ['Limited', 'Unlimited'] as const;
const wpsStatuses = ['Draft', 'Generated', 'Submitted', 'Confirmed', 'Rejected'] as const;
const insuranceStatuses = ['Active', 'Expiring', 'Expired', 'Cancelled'] as const;
const insuranceCategories = ['Health', 'Vehicle', 'Office', 'Workmen Compensation', 'Other'] as const;
const gccCountries = ['UAE', 'Saudi Arabia', 'Qatar', 'Bahrain', 'Kuwait', 'Oman'] as const;
const gccBranchStatuses = ['Active', 'Inactive', 'Renewal Pending'] as const;
const ownerRoles = ['Owner', 'Partner', 'Investor', 'Director', 'Signatory'] as const;
const ownerAccessLevels = ['Restricted'] as const;

const calculateDocumentStatus = (expiryDate: string, requestedStatus?: string) => {
  if (requestedStatus === 'Renewal In Progress' || requestedStatus === 'Cancelled') return requestedStatus;
  const expiry = new Date(`${expiryDate}T00:00:00`);
  if (Number.isNaN(expiry.getTime())) return 'Valid';
  const daysLeft = Math.ceil((expiry.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  if (daysLeft < 0) return 'Expired';
  if (daysLeft <= 30) return 'Critical';
  if (daysLeft <= 90) return 'Expiring Soon';
  return 'Valid';
};

const reminderJson = (days?: number[]) => JSON.stringify(days?.length ? days : [90, 60, 30, 7]);
const cryptoRandomUUID = () => crypto.randomUUID();
const daysUntilDate = (value?: string | null) => {
  if (!value) return 9999;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return 9999;
  return Math.ceil((date.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
};
const calculateVisaStatus = (visaExpiryDate: string, requestedStatus?: string) => {
  if (requestedStatus === 'Cancelled' || requestedStatus === 'Under Processing') return requestedStatus;
  const daysLeft = daysUntilDate(visaExpiryDate);
  if (daysLeft < 0) return 'Expired';
  if (daysLeft <= 60) return 'Expiring';
  return 'Active';
};
const calculateInsuranceStatus = (policyExpiry: string, requestedStatus?: string) => {
  if (requestedStatus === 'Cancelled') return requestedStatus;
  const daysLeft = daysUntilDate(policyExpiry);
  if (daysLeft < 0) return 'Expired';
  if (daysLeft <= 45) return 'Expiring';
  return 'Active';
};
const calculateGccBranchStatus = (registrationExpiry: string, licenceExpiry: string, requestedStatus?: string) => {
  if (requestedStatus === 'Inactive') return requestedStatus;
  const daysLeft = Math.min(daysUntilDate(registrationExpiry), daysUntilDate(licenceExpiry));
  if (daysLeft <= 90) return 'Renewal Pending';
  return 'Active';
};
const statusLogEntry = (status: string, changedBy?: string | null) => JSON.stringify([{
  status,
  changed_by: changedBy || null,
  changed_at: new Date().toISOString(),
}]);
const pipeSafe = (value: string | number) => String(value ?? '').replace(/\|/g, ' ').trim();

export class PROService {
  private static async addColumnIfMissing(table: string, column: string, definition: string) {
    try {
      await sequelize.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
      if (!message.includes('duplicate') && !message.includes('exists')) throw error;
    }
  }

  static async ensureDashboardTables() {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS crm_pro_documents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        document_id CHAR(36) NULL,
        company_id CHAR(36) NULL,
        title VARCHAR(255) NULL,
        doc_type ENUM('Trade License', 'Chamber Certificate', 'Establishment Card', 'MOA', 'AOA', 'VAT Certificate', 'Tax Registration', 'Office Lease', 'Bank Account', 'Other') NULL,
        doc_number VARCHAR(255) NULL,
        issuing_authority VARCHAR(255) NULL,
        category VARCHAR(100) NULL,
        owner VARCHAR(255) NULL,
        authority VARCHAR(255) NULL,
        issue_date DATE NOT NULL,
        expiry_date DATE NOT NULL,
        reminder_days JSON NULL,
        status ENUM('Valid', 'Critical', 'Expiring Soon', 'Expired', 'Renewal In Progress', 'Cancelled') NOT NULL DEFAULT 'Valid',
        doc_file_url VARCHAR(500) NULL,
        notes TEXT NULL,
        managed_by CHAR(36) NULL,
        renewal_cost DECIMAL(12,2) NULL,
        last_renewed DATE NULL,
        location VARCHAR(255) NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await this.addColumnIfMissing('crm_pro_documents', 'document_id', 'CHAR(36) NULL AFTER id');
    await this.addColumnIfMissing('crm_pro_documents', 'company_id', 'CHAR(36) NULL AFTER document_id');
    await this.addColumnIfMissing('crm_pro_documents', 'doc_type', "ENUM('Trade License', 'Chamber Certificate', 'Establishment Card', 'MOA', 'AOA', 'VAT Certificate', 'Tax Registration', 'Office Lease', 'Bank Account', 'Other') NULL AFTER title");
    await this.addColumnIfMissing('crm_pro_documents', 'doc_number', 'VARCHAR(255) NULL AFTER doc_type');
    await this.addColumnIfMissing('crm_pro_documents', 'issuing_authority', 'VARCHAR(255) NULL AFTER doc_number');
    await this.addColumnIfMissing('crm_pro_documents', 'reminder_days', 'JSON NULL AFTER expiry_date');
    await this.addColumnIfMissing('crm_pro_documents', 'doc_file_url', 'VARCHAR(500) NULL AFTER status');
    await this.addColumnIfMissing('crm_pro_documents', 'notes', 'TEXT NULL AFTER doc_file_url');
    await this.addColumnIfMissing('crm_pro_documents', 'managed_by', 'CHAR(36) NULL AFTER notes');
    await this.addColumnIfMissing('crm_pro_documents', 'renewal_cost', 'DECIMAL(12,2) NULL AFTER managed_by');
    await this.addColumnIfMissing('crm_pro_documents', 'last_renewed', 'DATE NULL AFTER renewal_cost');
    await sequelize.query(`
      ALTER TABLE crm_pro_documents MODIFY COLUMN status
      ENUM('Valid', 'Critical', 'Expiring Soon', 'Expired', 'Renewal In Progress', 'Cancelled')
      NOT NULL DEFAULT 'Valid'
    `);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS crm_pro_wps_runs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        month_label VARCHAR(50) NOT NULL,
        employees INT NOT NULL DEFAULT 0,
        gross_payroll DECIMAL(12,2) NOT NULL DEFAULT 0,
        sif_status VARCHAR(50) NOT NULL DEFAULT 'Prepared',
        bank VARCHAR(255) NOT NULL DEFAULT '',
        transfer_date DATE NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS crm_pro_tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        owner VARCHAR(255) NOT NULL,
        due_date DATE NOT NULL,
        priority VARCHAR(50) NOT NULL DEFAULT 'Medium',
        status VARCHAR(50) NOT NULL DEFAULT 'Open',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

  }

  static async getDashboardData() {
    await this.ensureDashboardTables();
    await this.ensureWpsManagementTable();

    const renewals = await sequelize.query<RenewalRow>(
      `
        SELECT
          id, title, category, owner, authority,
          expiry_date AS expiryDate,
          CASE
            WHEN status IN ('Renewal In Progress', 'Cancelled') THEN status
            WHEN expiry_date < CURRENT_DATE() THEN 'Expired'
            WHEN expiry_date <= DATE_ADD(CURRENT_DATE(), INTERVAL 30 DAY) THEN 'Critical'
            WHEN expiry_date <= DATE_ADD(CURRENT_DATE(), INTERVAL 90 DAY) THEN 'Expiring Soon'
            ELSE 'Valid'
          END AS status,
          DATEDIFF(expiry_date, CURRENT_DATE()) AS daysLeft
        FROM crm_pro_documents
        ORDER BY expiry_date ASC
        LIMIT 20
      `,
      { type: QueryTypes.SELECT }
    );

    const [renewalCounts] = await sequelize.query<{ total: number; due30: number; due90: number; expired: number }>(
      `
        SELECT
          COUNT(*) AS total,
          SUM(CASE WHEN expiry_date BETWEEN CURRENT_DATE() AND DATE_ADD(CURRENT_DATE(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) AS due30,
          SUM(CASE WHEN expiry_date BETWEEN CURRENT_DATE() AND DATE_ADD(CURRENT_DATE(), INTERVAL 90 DAY) THEN 1 ELSE 0 END) AS due90,
          SUM(CASE WHEN expiry_date < CURRENT_DATE() THEN 1 ELSE 0 END) AS expired
        FROM crm_pro_documents
      `,
      { type: QueryTypes.SELECT }
    );

    const wpsRuns = await sequelize.query<WpsRunRow>(
      `
        SELECT * FROM (
          SELECT
            id,
            month_label AS month,
            employees,
            gross_payroll AS grossPayroll,
            sif_status AS sifStatus,
            bank,
            transfer_date AS transferDate,
            created_at AS sortDate
          FROM crm_pro_wps_runs
          UNION ALL
          SELECT
            0 AS id,
            DATE_FORMAT(payroll_month, '%M %Y') AS month,
            total_employees AS employees,
            total_amount AS grossPayroll,
            CASE WHEN status = 'Confirmed' THEN 'Approved' ELSE status END AS sifStatus,
            employer_code AS bank,
            submission_date AS transferDate,
            created_at AS sortDate
          FROM crm_pro_wps_records
        ) runs
        ORDER BY sortDate DESC
        LIMIT 6
      `,
      { type: QueryTypes.SELECT }
    );

    const [wpsCounts] = await sequelize.query<{ totalRuns: number; approvedRuns: number; pendingRuns: number; grossPayroll: number }>(
      `
        SELECT
          COUNT(*) AS totalRuns,
          SUM(CASE WHEN sifStatus = 'Approved' THEN 1 ELSE 0 END) AS approvedRuns,
          SUM(CASE WHEN sifStatus <> 'Approved' THEN 1 ELSE 0 END) AS pendingRuns,
          SUM(grossPayroll) AS grossPayroll
        FROM (
          SELECT sif_status AS sifStatus, gross_payroll AS grossPayroll
          FROM crm_pro_wps_runs
          UNION ALL
          SELECT CASE WHEN status = 'Confirmed' THEN 'Approved' ELSE status END AS sifStatus, total_amount AS grossPayroll
          FROM crm_pro_wps_records
        ) runs
      `,
      { type: QueryTypes.SELECT }
    );

    const monthlyTasks = await sequelize.query<TaskRow>(
      `
        SELECT id, title, category, owner, due_date AS dueDate, priority, status
        FROM crm_pro_tasks
        WHERE due_date >= DATE_FORMAT(CURRENT_DATE(), '%Y-%m-01')
          AND due_date < DATE_ADD(DATE_FORMAT(CURRENT_DATE(), '%Y-%m-01'), INTERVAL 1 MONTH)
        ORDER BY due_date ASC, FIELD(priority, 'High', 'Medium', 'Low')
      `,
      { type: QueryTypes.SELECT }
    );

    const [taskCounts] = await sequelize.query<{ total: number; openTasks: number; inProgressTasks: number; completedTasks: number; highPriority: number }>(
      `
        SELECT
          COUNT(*) AS total,
          SUM(CASE WHEN status = 'Open' THEN 1 ELSE 0 END) AS openTasks,
          SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) AS inProgressTasks,
          SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) AS completedTasks,
          SUM(CASE WHEN priority = 'High' THEN 1 ELSE 0 END) AS highPriority
        FROM crm_pro_tasks
        WHERE due_date >= DATE_FORMAT(CURRENT_DATE(), '%Y-%m-01')
          AND due_date < DATE_ADD(DATE_FORMAT(CURRENT_DATE(), '%Y-%m-01'), INTERVAL 1 MONTH)
      `,
      { type: QueryTypes.SELECT }
    );

    const totalRuns = numberValue(wpsCounts?.totalRuns);
    const approvedRuns = numberValue(wpsCounts?.approvedRuns);

    return {
      renewalExpiryOverview: {
        totalDocuments: numberValue(renewalCounts?.total),
        dueIn30Days: numberValue(renewalCounts?.due30),
        dueIn90Days: numberValue(renewalCounts?.due90),
        expired: numberValue(renewalCounts?.expired),
        renewals,
      },
      wpsComplianceStatus: {
        totalRuns,
        approvedRuns,
        pendingRuns: numberValue(wpsCounts?.pendingRuns),
        compliancePercent: totalRuns ? Math.round((approvedRuns / totalRuns) * 100) : 0,
        grossPayroll: numberValue(wpsCounts?.grossPayroll),
        runs: wpsRuns,
      },
      monthlyProTaskList: {
        total: numberValue(taskCounts?.total),
        openTasks: numberValue(taskCounts?.openTasks),
        inProgressTasks: numberValue(taskCounts?.inProgressTasks),
        completedTasks: numberValue(taskCounts?.completedTasks),
        highPriority: numberValue(taskCounts?.highPriority),
        tasks: monthlyTasks,
      },
      apiAndDbQueries: {
        endpoint: '/api/admin/pro-works/dashboard',
        sourceTables: ['crm_pro_documents', 'crm_pro_wps_runs', 'crm_pro_tasks'],
        sections: ['12.1', '12.2', '12.3', '12.4'],
      },
    };
  }

  static async listCompanyDocuments(limit = 100) {
    await this.ensureDashboardTables();
    return sequelize.query(
      `
        SELECT
          id,
          document_id AS documentId,
          company_id AS companyId,
          COALESCE(title, doc_type) AS title,
          COALESCE(doc_type, category) AS docType,
          doc_number AS docNumber,
          issuing_authority AS issuingAuthority,
          COALESCE(owner, company_id) AS owner,
          COALESCE(authority, issuing_authority) AS authority,
          issue_date AS issueDate,
          expiry_date AS expiryDate,
          reminder_days AS reminderDays,
          CASE
            WHEN status IN ('Renewal In Progress', 'Cancelled') THEN status
            WHEN expiry_date < CURRENT_DATE() THEN 'Expired'
            WHEN expiry_date <= DATE_ADD(CURRENT_DATE(), INTERVAL 30 DAY) THEN 'Critical'
            WHEN expiry_date <= DATE_ADD(CURRENT_DATE(), INTERVAL 90 DAY) THEN 'Expiring Soon'
            ELSE 'Valid'
          END AS status,
          doc_file_url AS docFileUrl,
          notes,
          managed_by AS managedBy,
          renewal_cost AS renewalCost,
          last_renewed AS lastRenewed,
          location
        FROM crm_pro_documents
        ORDER BY expiry_date ASC
        LIMIT :limit
      `,
      { replacements: { limit }, type: QueryTypes.SELECT }
    );
  }

  static async createCompanyDocument(input: CompanyDocumentInput) {
    await this.ensureDashboardTables();
    if (!documentTypes.includes(input.doc_type as typeof documentTypes[number])) throw new Error('Invalid document type');
    const status = calculateDocumentStatus(input.expiry_date, input.status);
    if (!documentStatuses.includes(status as typeof documentStatuses[number])) throw new Error('Invalid document status');

    const documentId = input.document_id || cryptoRandomUUID();
    await sequelize.query(
      `
        INSERT INTO crm_pro_documents (
          document_id, company_id, title, doc_type, doc_number, issuing_authority,
          category, owner, authority, issue_date, expiry_date, reminder_days,
          status, doc_file_url, notes, managed_by, renewal_cost, last_renewed, location
        ) VALUES (
          :documentId, :companyId, :title, :docType, :docNumber, :issuingAuthority,
          :category, :owner, :authority, :issueDate, :expiryDate, :reminderDays,
          :status, :docFileUrl, :notes, :managedBy, :renewalCost, :lastRenewed, :location
        )
      `,
      {
        replacements: {
          documentId,
          companyId: input.company_id,
          title: input.doc_type,
          docType: input.doc_type,
          docNumber: input.doc_number,
          issuingAuthority: input.issuing_authority,
          category: input.doc_type,
          owner: input.company_id,
          authority: input.issuing_authority,
          issueDate: input.issue_date,
          expiryDate: input.expiry_date,
          reminderDays: reminderJson(input.reminder_days),
          status,
          docFileUrl: input.doc_file_url || null,
          notes: input.notes || null,
          managedBy: input.managed_by,
          renewalCost: input.renewal_cost ?? null,
          lastRenewed: input.last_renewed || null,
          location: input.company_id,
        },
      }
    );

    return { document_id: documentId, status };
  }

  static async updateCompanyDocument(input: Partial<CompanyDocumentInput> & { document_id: string }) {
    await this.ensureDashboardTables();
    const status = input.expiry_date || input.status
      ? calculateDocumentStatus(input.expiry_date || new Date().toISOString().slice(0, 10), input.status)
      : undefined;

    await sequelize.query(
      `
        UPDATE crm_pro_documents
        SET
          company_id = COALESCE(:companyId, company_id),
          title = COALESCE(:docType, title),
          doc_type = COALESCE(:docType, doc_type),
          doc_number = COALESCE(:docNumber, doc_number),
          issuing_authority = COALESCE(:issuingAuthority, issuing_authority),
          category = COALESCE(:docType, category),
          owner = COALESCE(:companyId, owner),
          authority = COALESCE(:issuingAuthority, authority),
          issue_date = COALESCE(:issueDate, issue_date),
          expiry_date = COALESCE(:expiryDate, expiry_date),
          reminder_days = COALESCE(:reminderDays, reminder_days),
          status = COALESCE(:status, status),
          doc_file_url = :docFileUrl,
          notes = :notes,
          managed_by = COALESCE(:managedBy, managed_by),
          renewal_cost = COALESCE(:renewalCost, renewal_cost),
          last_renewed = COALESCE(:lastRenewed, last_renewed)
        WHERE document_id = :documentId
      `,
      {
        replacements: {
          documentId: input.document_id,
          companyId: input.company_id || null,
          docType: input.doc_type || null,
          docNumber: input.doc_number || null,
          issuingAuthority: input.issuing_authority || null,
          issueDate: input.issue_date || null,
          expiryDate: input.expiry_date || null,
          reminderDays: input.reminder_days ? reminderJson(input.reminder_days) : null,
          status: status || null,
          docFileUrl: input.doc_file_url || null,
          notes: input.notes || null,
          managedBy: input.managed_by || null,
          renewalCost: input.renewal_cost ?? null,
          lastRenewed: input.last_renewed || null,
        },
      }
    );

    return { document_id: input.document_id, status };
  }

  static async ensureEmployeeImmigrationTable() {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS crm_pro_employee_immigration (
        pro_emp_id CHAR(36) PRIMARY KEY,
        employee_id CHAR(36) NOT NULL,
        visa_uid VARCHAR(255) NOT NULL,
        visa_type ENUM('Employment', 'Mission', 'Investor', 'Partner', 'Other') NOT NULL,
        visa_issue_date DATE NOT NULL,
        visa_expiry_date DATE NOT NULL,
        visa_status ENUM('Active', 'Expiring', 'Expired', 'Cancelled', 'Under Processing') NOT NULL DEFAULT 'Active',
        labour_card_no VARCHAR(255) NOT NULL,
        labour_card_expiry DATE NOT NULL,
        contract_type ENUM('Limited', 'Unlimited') NOT NULL,
        mohre_contract_ref VARCHAR(255) NULL,
        medical_fitness DATE NULL,
        health_insurance_no VARCHAR(255) NULL,
        insurance_expiry DATE NULL,
        entry_permit_no VARCHAR(255) NULL,
        status_change_log JSON NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_pro_employee_immigration_employee (employee_id),
        INDEX idx_pro_employee_visa_expiry (visa_expiry_date),
        INDEX idx_pro_employee_labour_expiry (labour_card_expiry),
        INDEX idx_pro_employee_insurance_expiry (insurance_expiry),
        INDEX idx_pro_employee_visa_status (visa_status)
      )
    `);
  }

  static async createEmployeeImmigrationRecord(input: EmployeeImmigrationInput) {
    await this.ensureEmployeeImmigrationTable();
    if (!visaTypes.includes(input.visa_type as typeof visaTypes[number])) throw new Error('Invalid visa type');
    if (!contractTypes.includes(input.contract_type as typeof contractTypes[number])) throw new Error('Invalid contract type');
    const visaStatus = calculateVisaStatus(input.visa_expiry_date, input.visa_status);
    if (!visaStatuses.includes(visaStatus as typeof visaStatuses[number])) throw new Error('Invalid visa status');
    const proEmpId = input.pro_emp_id || crypto.randomUUID();

    await sequelize.query(
      `
        INSERT INTO crm_pro_employee_immigration (
          pro_emp_id, employee_id, visa_uid, visa_type, visa_issue_date,
          visa_expiry_date, visa_status, labour_card_no, labour_card_expiry,
          contract_type, mohre_contract_ref, medical_fitness, health_insurance_no,
          insurance_expiry, entry_permit_no, status_change_log
        ) VALUES (
          :proEmpId, :employeeId, :visaUid, :visaType, :visaIssueDate,
          :visaExpiryDate, :visaStatus, :labourCardNo, :labourCardExpiry,
          :contractType, :mohreContractRef, :medicalFitness, :healthInsuranceNo,
          :insuranceExpiry, :entryPermitNo, :statusChangeLog
        )
        ON DUPLICATE KEY UPDATE
          visa_uid = VALUES(visa_uid),
          visa_type = VALUES(visa_type),
          visa_issue_date = VALUES(visa_issue_date),
          visa_expiry_date = VALUES(visa_expiry_date),
          visa_status = VALUES(visa_status),
          labour_card_no = VALUES(labour_card_no),
          labour_card_expiry = VALUES(labour_card_expiry),
          contract_type = VALUES(contract_type),
          mohre_contract_ref = VALUES(mohre_contract_ref),
          medical_fitness = VALUES(medical_fitness),
          health_insurance_no = VALUES(health_insurance_no),
          insurance_expiry = VALUES(insurance_expiry),
          entry_permit_no = VALUES(entry_permit_no),
          status_change_log = JSON_ARRAY_APPEND(COALESCE(status_change_log, JSON_ARRAY()), '$', JSON_OBJECT('status', VALUES(visa_status), 'changed_by', :changedBy, 'changed_at', NOW()))
      `,
      {
        replacements: {
          proEmpId,
          employeeId: input.employee_id,
          visaUid: input.visa_uid,
          visaType: input.visa_type,
          visaIssueDate: input.visa_issue_date,
          visaExpiryDate: input.visa_expiry_date,
          visaStatus,
          labourCardNo: input.labour_card_no,
          labourCardExpiry: input.labour_card_expiry,
          contractType: input.contract_type,
          mohreContractRef: input.mohre_contract_ref || null,
          medicalFitness: input.medical_fitness || null,
          healthInsuranceNo: input.health_insurance_no || null,
          insuranceExpiry: input.insurance_expiry || null,
          entryPermitNo: input.entry_permit_no || null,
          statusChangeLog: statusLogEntry(visaStatus, input.changed_by),
          changedBy: input.changed_by || null,
        },
      }
    );

    await HRService.syncEmployeeGovernmentSummary(input.employee_id);
    return { pro_emp_id: proEmpId, visa_status: visaStatus };
  }

  static async updateEmployeeImmigrationRecord(input: Partial<EmployeeImmigrationInput> & { pro_emp_id: string }) {
    await this.ensureEmployeeImmigrationTable();
    const visaStatus = input.visa_expiry_date || input.visa_status
      ? calculateVisaStatus(input.visa_expiry_date || new Date().toISOString().slice(0, 10), input.visa_status)
      : undefined;

    await sequelize.query(
      `
        UPDATE crm_pro_employee_immigration
        SET
          visa_uid = COALESCE(:visaUid, visa_uid),
          visa_type = COALESCE(:visaType, visa_type),
          visa_issue_date = COALESCE(:visaIssueDate, visa_issue_date),
          visa_expiry_date = COALESCE(:visaExpiryDate, visa_expiry_date),
          visa_status = COALESCE(:visaStatus, visa_status),
          labour_card_no = COALESCE(:labourCardNo, labour_card_no),
          labour_card_expiry = COALESCE(:labourCardExpiry, labour_card_expiry),
          contract_type = COALESCE(:contractType, contract_type),
          mohre_contract_ref = :mohreContractRef,
          medical_fitness = :medicalFitness,
          health_insurance_no = :healthInsuranceNo,
          insurance_expiry = :insuranceExpiry,
          entry_permit_no = :entryPermitNo,
          status_change_log = CASE
            WHEN :visaStatus IS NULL THEN status_change_log
            ELSE JSON_ARRAY_APPEND(COALESCE(status_change_log, JSON_ARRAY()), '$', JSON_OBJECT('status', :visaStatus, 'changed_by', :changedBy, 'changed_at', NOW()))
          END
        WHERE pro_emp_id = :proEmpId
      `,
      {
        replacements: {
          proEmpId: input.pro_emp_id,
          visaUid: input.visa_uid || null,
          visaType: input.visa_type || null,
          visaIssueDate: input.visa_issue_date || null,
          visaExpiryDate: input.visa_expiry_date || null,
          visaStatus: visaStatus || null,
          labourCardNo: input.labour_card_no || null,
          labourCardExpiry: input.labour_card_expiry || null,
          contractType: input.contract_type || null,
          mohreContractRef: input.mohre_contract_ref || null,
          medicalFitness: input.medical_fitness || null,
          healthInsuranceNo: input.health_insurance_no || null,
          insuranceExpiry: input.insurance_expiry || null,
          entryPermitNo: input.entry_permit_no || null,
          changedBy: input.changed_by || null,
        },
      }
    );

    const [record] = await sequelize.query<{ employee_id: string }>(
      'SELECT employee_id FROM crm_pro_employee_immigration WHERE pro_emp_id = :proEmpId LIMIT 1',
      { replacements: { proEmpId: input.pro_emp_id }, type: QueryTypes.SELECT }
    );
    if (record?.employee_id) await HRService.syncEmployeeGovernmentSummary(record.employee_id);

    return { pro_emp_id: input.pro_emp_id, visa_status: visaStatus };
  }

  static async listEmployeeImmigrationRecords(options: { limit?: number; employeeId?: string } = {}) {
    await this.ensureEmployeeImmigrationTable();
    const conditions: string[] = [];
    const replacements: Record<string, string | number> = { limit: options.limit || 100 };

    if (options.employeeId) {
      conditions.push('CAST(e.id AS CHAR) COLLATE utf8mb4_general_ci = :employeeId');
      replacements.employeeId = options.employeeId;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    return sequelize.query(
      `
        SELECT
          p.pro_emp_id AS proEmpId,
          CAST(e.id AS CHAR) COLLATE utf8mb4_general_ci AS employeeId,
          e.name AS employeeName,
          e.nationality,
          e.EID AS emiratesId,
          e.visaExp AS emiratesIdExpiry,
          COALESCE(p.visa_uid, '') AS visaUid,
          COALESCE(p.visa_type, 'Employment') AS visaType,
          p.visa_issue_date AS visaIssueDate,
          COALESCE(p.visa_expiry_date, e.visaExp) AS visaExpiryDate,
          COALESCE(p.visa_status, CASE
            WHEN e.visaExp IS NULL THEN 'Under Processing'
            WHEN e.visaExp < CURRENT_DATE() THEN 'Expired'
            WHEN e.visaExp <= DATE_ADD(CURRENT_DATE(), INTERVAL 60 DAY) THEN 'Expiring'
            ELSE 'Active'
          END) AS visaStatus,
          COALESCE(p.labour_card_no, '') AS labourCardNo,
          COALESCE(p.labour_card_expiry, e.labexp) AS labourCardExpiry,
          p.contract_type AS contractType,
          p.mohre_contract_ref AS mohreContractRef,
          p.medical_fitness AS medicalFitness,
          p.health_insurance_no AS healthInsuranceNo,
          p.insurance_expiry AS insuranceExpiry,
          p.entry_permit_no AS entryPermitNo,
          p.status_change_log AS statusChangeLog,
          DATEDIFF(COALESCE(p.visa_expiry_date, e.visaExp), CURRENT_DATE()) AS visaDaysLeft,
          DATEDIFF(COALESCE(p.labour_card_expiry, e.labexp), CURRENT_DATE()) AS labourDaysLeft,
          DATEDIFF(p.insurance_expiry, CURRENT_DATE()) AS insuranceDaysLeft
        FROM crm_employee e
        LEFT JOIN crm_pro_employee_immigration p ON CAST(p.employee_id AS CHAR) COLLATE utf8mb4_general_ci = CAST(e.id AS CHAR) COLLATE utf8mb4_general_ci
        ${where}
        ORDER BY COALESCE(p.visa_expiry_date, e.visaExp, '9999-12-31') ASC, e.id DESC
        LIMIT :limit
      `,
      { replacements, type: QueryTypes.SELECT }
    );
  }

  static async ensureWpsManagementTable() {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS crm_pro_wps_records (
        wps_id CHAR(36) PRIMARY KEY,
        payroll_month DATE NOT NULL,
        employer_code VARCHAR(255) NOT NULL,
        agent_id VARCHAR(255) NOT NULL,
        total_employees INT NOT NULL DEFAULT 0,
        total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
        sif_file_url VARCHAR(500) NULL,
        submission_date DATE NULL,
        submission_ref VARCHAR(255) NULL,
        status ENUM('Draft', 'Generated', 'Submitted', 'Confirmed', 'Rejected') NOT NULL DEFAULT 'Draft',
        rejection_reason TEXT NULL,
        processed_by CHAR(36) NOT NULL,
        salary_records JSON NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_pro_wps_month (payroll_month),
        INDEX idx_pro_wps_status (status),
        INDEX idx_pro_wps_processed_by (processed_by)
      )
    `);
  }

  private static async buildSifFile(input: {
    wpsId: string;
    payrollMonth: string;
    agentId: string;
    employerCode: string;
    paymentDate: string;
    salaryRecords: WpsSalaryRecord[];
  }) {
    const fileName = `wps_sif_${input.employerCode}_${input.payrollMonth.slice(0, 7).replace('-', '_')}_${input.wpsId}.txt`;
    const lines = input.salaryRecords.map((record, index) => [
      input.agentId,
      input.employerCode,
      String(index + 1).padStart(6, '0'),
      input.paymentDate,
      record.uid_labour_no,
      record.name,
      Number(record.salary || 0).toFixed(2),
      record.routing_code,
      record.account_number,
    ].map(pipeSafe).join('|'));

    // Public folder writes only work on a persistent filesystem - on serverless
    // hosting the write never survives past the request, and the link was also
    // hardcoded to localhost. Blob storage (already used for payslips/letters)
    // gives back a URL that's actually reachable regardless of host.
    const blob = await put(`generated-documents/wps/${fileName}`, lines.join('\n'), {
      access: 'public',
      contentType: 'text/plain',
      addRandomSuffix: true,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return blob.url;
  }

  static async createWpsRecord(input: WpsRecordInput) {
    await this.ensureWpsManagementTable();
    if (!wpsStatuses.includes((input.status || 'Generated') as typeof wpsStatuses[number])) throw new Error('Invalid WPS status');
    const wpsId = input.wps_id || crypto.randomUUID();
    const salaryRecords = input.salary_records || [];
    const totalEmployees = salaryRecords.length;
    const totalAmount = salaryRecords.reduce((sum, record) => sum + Number(record.salary || 0), 0);
    const status = input.status || 'Generated';
    const paymentDate = input.payment_date || new Date().toISOString().slice(0, 10);
    const sifFileUrl = salaryRecords.length
      ? await this.buildSifFile({
          wpsId,
          payrollMonth: input.payroll_month,
          agentId: input.agent_id,
          employerCode: input.employer_code,
          paymentDate,
          salaryRecords,
        })
      : null;

    await sequelize.query(
      `
        INSERT INTO crm_pro_wps_records (
          wps_id, payroll_month, employer_code, agent_id, total_employees,
          total_amount, sif_file_url, submission_date, submission_ref, status,
          rejection_reason, processed_by, salary_records
        ) VALUES (
          :wpsId, :payrollMonth, :employerCode, :agentId, :totalEmployees,
          :totalAmount, :sifFileUrl, :submissionDate, :submissionRef, :status,
          :rejectionReason, :processedBy, :salaryRecords
        )
      `,
      {
        replacements: {
          wpsId,
          payrollMonth: input.payroll_month,
          employerCode: input.employer_code,
          agentId: input.agent_id,
          totalEmployees,
          totalAmount,
          sifFileUrl,
          submissionDate: input.submission_date || null,
          submissionRef: input.submission_ref || null,
          status,
          rejectionReason: input.rejection_reason || null,
          processedBy: input.processed_by,
          salaryRecords: JSON.stringify(salaryRecords),
        },
      }
    );

    return { wps_id: wpsId, total_employees: totalEmployees, total_amount: totalAmount, sif_file_url: sifFileUrl, status };
  }

  static async updateWpsRecord(input: Partial<WpsRecordInput> & { wps_id: string }) {
    await this.ensureWpsManagementTable();
    if (input.status && !wpsStatuses.includes(input.status as typeof wpsStatuses[number])) throw new Error('Invalid WPS status');
    await sequelize.query(
      `
        UPDATE crm_pro_wps_records
        SET
          submission_date = COALESCE(:submissionDate, submission_date),
          submission_ref = COALESCE(:submissionRef, submission_ref),
          status = COALESCE(:status, status),
          rejection_reason = :rejectionReason
        WHERE wps_id = :wpsId
      `,
      {
        replacements: {
          wpsId: input.wps_id,
          submissionDate: input.submission_date || null,
          submissionRef: input.submission_ref || null,
          status: input.status || null,
          rejectionReason: input.rejection_reason || null,
        },
      }
    );

    return { wps_id: input.wps_id, status: input.status };
  }

  static async listWpsRecords(options: { limit?: number; status?: string } = {}) {
    await this.ensureWpsManagementTable();
    await this.ensureDashboardTables();
    const conditions: string[] = [];
    const replacements: Record<string, string | number> = { limit: options.limit || 100 };
    if (options.status) {
      conditions.push('status = :status');
      replacements.status = options.status;
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    return sequelize.query(
      `
        SELECT *
        FROM (
          SELECT
            w.wps_id AS wpsId,
            w.payroll_month AS payrollMonth,
            w.employer_code AS employerCode,
            w.agent_id AS agentId,
            w.total_employees AS totalEmployees,
            w.total_amount AS totalAmount,
            w.total_amount AS grossPayroll,
            w.sif_file_url AS sifFileUrl,
            w.submission_date AS submissionDate,
            w.submission_ref AS submissionRef,
            w.status,
            CASE WHEN w.status = 'Confirmed' THEN 'Approved' ELSE w.status END AS sifStatus,
            w.rejection_reason AS rejectionReason,
            w.processed_by AS processedBy,
            processor.name AS processedByName,
            w.created_at AS createdAt
          FROM crm_pro_wps_records w
          LEFT JOIN crm_employee processor ON CAST(processor.id AS CHAR) COLLATE utf8mb4_general_ci = w.processed_by
          UNION ALL
          SELECT
            CONCAT('legacy-', r.id) AS wpsId,
            STR_TO_DATE(CONCAT('01 ', r.month_label), '%d %M %Y') AS payrollMonth,
            '' AS employerCode,
            '' AS agentId,
            r.employees AS totalEmployees,
            r.gross_payroll AS totalAmount,
            r.gross_payroll AS grossPayroll,
            NULL AS sifFileUrl,
            r.transfer_date AS submissionDate,
            NULL AS submissionRef,
            CASE WHEN r.sif_status = 'Approved' THEN 'Confirmed' ELSE 'Generated' END AS status,
            r.sif_status AS sifStatus,
            NULL AS rejectionReason,
            '' AS processedBy,
            r.bank AS processedByName,
            r.created_at AS createdAt
          FROM crm_pro_wps_runs r
        ) wps
        ${where}
        ORDER BY payrollMonth DESC, createdAt DESC
        LIMIT :limit
      `,
      { replacements, type: QueryTypes.SELECT }
    );
  }

  static async ensureInsuranceRecordsTable() {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS crm_pro_insurance_records (
        insurance_id CHAR(36) PRIMARY KEY,
        insurance_category ENUM('Health', 'Vehicle', 'Office', 'Workmen Compensation', 'Other') NOT NULL DEFAULT 'Health',
        employee_id CHAR(36) NULL,
        insured_name VARCHAR(255) NOT NULL,
        insurance_company VARCHAR(255) NOT NULL,
        policy_number VARCHAR(255) NOT NULL,
        policy_start DATE NOT NULL,
        policy_expiry DATE NOT NULL,
        coverage_amount DECIMAL(12,2) NULL,
        premium_amount DECIMAL(12,2) NULL,
        dependents JSON NULL,
        network_code VARCHAR(100) NULL,
        card_url VARCHAR(500) NULL,
        status ENUM('Active', 'Expiring', 'Expired', 'Cancelled') NOT NULL DEFAULT 'Active',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_pro_insurance_policy (policy_number),
        INDEX idx_pro_insurance_expiry (policy_expiry),
        INDEX idx_pro_insurance_status (status),
        INDEX idx_pro_insurance_employee (employee_id)
      )
    `);

  }

  static async createInsuranceRecord(input: InsuranceRecordInput) {
    await this.ensureInsuranceRecordsTable();
    const category = input.insurance_category || 'Health';
    if (!insuranceCategories.includes(category as typeof insuranceCategories[number])) throw new Error('Invalid insurance category');
    const status = calculateInsuranceStatus(input.policy_expiry, input.status);
    if (!insuranceStatuses.includes(status as typeof insuranceStatuses[number])) throw new Error('Invalid insurance status');
    const insuranceId = input.insurance_id || crypto.randomUUID();

    await sequelize.query(
      `
        INSERT INTO crm_pro_insurance_records (
          insurance_id, insurance_category, employee_id, insured_name, insurance_company,
          policy_number, policy_start, policy_expiry, coverage_amount, premium_amount,
          dependents, network_code, card_url, status
        ) VALUES (
          :insuranceId, :insuranceCategory, :employeeId, :insuredName, :insuranceCompany,
          :policyNumber, :policyStart, :policyExpiry, :coverageAmount, :premiumAmount,
          :dependents, :networkCode, :cardUrl, :status
        )
      `,
      {
        replacements: {
          insuranceId,
          insuranceCategory: category,
          employeeId: input.employee_id || null,
          insuredName: input.insured_name,
          insuranceCompany: input.insurance_company,
          policyNumber: input.policy_number,
          policyStart: input.policy_start,
          policyExpiry: input.policy_expiry,
          coverageAmount: input.coverage_amount ?? null,
          premiumAmount: input.premium_amount ?? null,
          dependents: JSON.stringify(input.dependents || []),
          networkCode: input.network_code || null,
          cardUrl: input.card_url || null,
          status,
        },
      }
    );

    return { insurance_id: insuranceId, status };
  }

  static async updateInsuranceRecord(input: Partial<InsuranceRecordInput> & { insurance_id: string }) {
    await this.ensureInsuranceRecordsTable();
    if (input.insurance_category && !insuranceCategories.includes(input.insurance_category as typeof insuranceCategories[number])) throw new Error('Invalid insurance category');
    const status = input.policy_expiry || input.status
      ? calculateInsuranceStatus(input.policy_expiry || new Date().toISOString().slice(0, 10), input.status)
      : undefined;

    await sequelize.query(
      `
        UPDATE crm_pro_insurance_records
        SET
          insurance_category = COALESCE(:insuranceCategory, insurance_category),
          employee_id = :employeeId,
          insured_name = COALESCE(:insuredName, insured_name),
          insurance_company = COALESCE(:insuranceCompany, insurance_company),
          policy_number = COALESCE(:policyNumber, policy_number),
          policy_start = COALESCE(:policyStart, policy_start),
          policy_expiry = COALESCE(:policyExpiry, policy_expiry),
          coverage_amount = :coverageAmount,
          premium_amount = :premiumAmount,
          dependents = COALESCE(:dependents, dependents),
          network_code = :networkCode,
          card_url = :cardUrl,
          status = COALESCE(:status, status)
        WHERE insurance_id = :insuranceId
      `,
      {
        replacements: {
          insuranceId: input.insurance_id,
          insuranceCategory: input.insurance_category || null,
          employeeId: input.employee_id || null,
          insuredName: input.insured_name || null,
          insuranceCompany: input.insurance_company || null,
          policyNumber: input.policy_number || null,
          policyStart: input.policy_start || null,
          policyExpiry: input.policy_expiry || null,
          coverageAmount: input.coverage_amount ?? null,
          premiumAmount: input.premium_amount ?? null,
          dependents: input.dependents ? JSON.stringify(input.dependents) : null,
          networkCode: input.network_code || null,
          cardUrl: input.card_url || null,
          status: status || null,
        },
      }
    );

    return { insurance_id: input.insurance_id, status };
  }

  static async listInsuranceRecords(options: { limit?: number; status?: string } = {}) {
    await this.ensureInsuranceRecordsTable();
    const conditions: string[] = [];
    const replacements: Record<string, string | number> = { limit: options.limit || 100 };
    if (options.status) {
      conditions.push('i.status = :status');
      replacements.status = options.status;
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    return sequelize.query(
      `
        SELECT
          i.insurance_id AS insuranceId,
          i.insurance_category AS insuranceCategory,
          i.employee_id AS employeeId,
          COALESCE(e.name, i.insured_name) AS insuredName,
          i.insured_name AS insuredLabel,
          i.insurance_company AS insuranceCompany,
          i.policy_number AS policyNumber,
          i.policy_start AS policyStart,
          i.policy_expiry AS policyExpiry,
          i.coverage_amount AS coverageAmount,
          i.premium_amount AS premiumAmount,
          i.dependents,
          i.network_code AS networkCode,
          i.card_url AS cardUrl,
          i.status,
          DATEDIFF(i.policy_expiry, CURRENT_DATE()) AS daysLeft
        FROM crm_pro_insurance_records i
        LEFT JOIN crm_employee e ON CAST(e.id AS CHAR) COLLATE utf8mb4_general_ci = i.employee_id
        ${where}
        ORDER BY i.policy_expiry ASC
        LIMIT :limit
      `,
      { replacements, type: QueryTypes.SELECT }
    );
  }

  static async getRenewalOverview() {
    const dashboard = await this.getDashboardData();
    return dashboard.renewalExpiryOverview;
  }

  static async getWpsCompliance() {
    const dashboard = await this.getDashboardData();
    return dashboard.wpsComplianceStatus;
  }

  static async getMonthlyTasks() {
    const dashboard = await this.getDashboardData();
    return dashboard.monthlyProTaskList;
  }

  static async ensureGccBranchDocumentsTable() {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS crm_pro_gcc_branch_documents (
        branch_id CHAR(36) PRIMARY KEY,
        branch_name VARCHAR(255) NOT NULL,
        country ENUM('UAE', 'Saudi Arabia', 'Qatar', 'Bahrain', 'Kuwait', 'Oman') NOT NULL,
        city VARCHAR(255) NOT NULL,
        registration_no VARCHAR(255) NOT NULL,
        registration_expiry DATE NOT NULL,
        licence_type VARCHAR(255) NOT NULL,
        licence_expiry DATE NOT NULL,
        bank_account VARCHAR(255) NULL,
        bank_name VARCHAR(255) NULL,
        branch_manager VARCHAR(255) NULL,
        contact_phone VARCHAR(100) NULL,
        documents JSON NULL,
        notes TEXT NULL,
        status ENUM('Active', 'Inactive', 'Renewal Pending') NOT NULL DEFAULT 'Active',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_gcc_branch_registration (country, registration_no),
        INDEX idx_gcc_branch_registration_expiry (registration_expiry),
        INDEX idx_gcc_branch_licence_expiry (licence_expiry),
        INDEX idx_gcc_branch_status (status)
      )
    `);

  }

  static async createGccBranchDocument(input: GccBranchDocumentInput) {
    await this.ensureGccBranchDocumentsTable();
    if (!gccCountries.includes(input.country as typeof gccCountries[number])) throw new Error('Invalid GCC country');
    const status = calculateGccBranchStatus(input.registration_expiry, input.licence_expiry, input.status);
    if (!gccBranchStatuses.includes(status as typeof gccBranchStatuses[number])) throw new Error('Invalid branch status');
    const branchId = input.branch_id || crypto.randomUUID();

    await sequelize.query(
      `
        INSERT INTO crm_pro_gcc_branch_documents (
          branch_id, branch_name, country, city, registration_no, registration_expiry,
          licence_type, licence_expiry, bank_account, bank_name, branch_manager,
          contact_phone, documents, notes, status
        ) VALUES (
          :branchId, :branchName, :country, :city, :registrationNo, :registrationExpiry,
          :licenceType, :licenceExpiry, :bankAccount, :bankName, :branchManager,
          :contactPhone, :documents, :notes, :status
        )
      `,
      {
        replacements: {
          branchId,
          branchName: input.branch_name,
          country: input.country,
          city: input.city,
          registrationNo: input.registration_no,
          registrationExpiry: input.registration_expiry,
          licenceType: input.licence_type,
          licenceExpiry: input.licence_expiry,
          bankAccount: input.bank_account || null,
          bankName: input.bank_name || null,
          branchManager: input.branch_manager || null,
          contactPhone: input.contact_phone || null,
          documents: JSON.stringify(input.documents || []),
          notes: input.notes || null,
          status,
        },
      }
    );

    return { branch_id: branchId, status };
  }

  static async updateGccBranchDocument(input: Partial<GccBranchDocumentInput> & { branch_id: string }) {
    await this.ensureGccBranchDocumentsTable();
    if (input.country && !gccCountries.includes(input.country as typeof gccCountries[number])) throw new Error('Invalid GCC country');
    const status = input.registration_expiry || input.licence_expiry || input.status
      ? calculateGccBranchStatus(input.registration_expiry || new Date().toISOString().slice(0, 10), input.licence_expiry || new Date().toISOString().slice(0, 10), input.status)
      : undefined;

    await sequelize.query(
      `
        UPDATE crm_pro_gcc_branch_documents
        SET
          branch_name = COALESCE(:branchName, branch_name),
          country = COALESCE(:country, country),
          city = COALESCE(:city, city),
          registration_no = COALESCE(:registrationNo, registration_no),
          registration_expiry = COALESCE(:registrationExpiry, registration_expiry),
          licence_type = COALESCE(:licenceType, licence_type),
          licence_expiry = COALESCE(:licenceExpiry, licence_expiry),
          bank_account = :bankAccount,
          bank_name = :bankName,
          branch_manager = :branchManager,
          contact_phone = :contactPhone,
          documents = COALESCE(:documents, documents),
          notes = :notes,
          status = COALESCE(:status, status)
        WHERE branch_id = :branchId
      `,
      {
        replacements: {
          branchId: input.branch_id,
          branchName: input.branch_name || null,
          country: input.country || null,
          city: input.city || null,
          registrationNo: input.registration_no || null,
          registrationExpiry: input.registration_expiry || null,
          licenceType: input.licence_type || null,
          licenceExpiry: input.licence_expiry || null,
          bankAccount: input.bank_account || null,
          bankName: input.bank_name || null,
          branchManager: input.branch_manager || null,
          contactPhone: input.contact_phone || null,
          documents: input.documents ? JSON.stringify(input.documents) : null,
          notes: input.notes || null,
          status: status || null,
        },
      }
    );

    return { branch_id: input.branch_id, status };
  }

  static async listGccBranchDocuments(options: { limit?: number; country?: string; status?: string } = {}) {
    await this.ensureGccBranchDocumentsTable();
    const conditions: string[] = [];
    const replacements: Record<string, string | number> = { limit: options.limit || 100 };
    if (options.country) {
      conditions.push('country = :country');
      replacements.country = options.country;
    }
    if (options.status) {
      conditions.push('status = :status');
      replacements.status = options.status;
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    return sequelize.query(
      `
        SELECT
          branch_id AS branchId,
          branch_name AS branchName,
          country,
          city,
          registration_no AS registrationNo,
          registration_expiry AS registrationExpiry,
          licence_type AS licenceType,
          licence_expiry AS licenceExpiry,
          bank_account AS bankAccount,
          bank_name AS bankName,
          branch_manager AS branchManager,
          contact_phone AS contactPhone,
          documents,
          notes,
          status,
          DATEDIFF(registration_expiry, CURRENT_DATE()) AS registrationDaysLeft,
          DATEDIFF(licence_expiry, CURRENT_DATE()) AS licenceDaysLeft
        FROM crm_pro_gcc_branch_documents
        ${where}
        ORDER BY LEAST(registration_expiry, licence_expiry) ASC
        LIMIT :limit
      `,
      { replacements, type: QueryTypes.SELECT }
    );
  }

  static async ensureOwnerDocumentsTable() {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS crm_pro_owner_documents (
        owner_id CHAR(36) PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        role ENUM('Owner', 'Partner', 'Investor', 'Director', 'Signatory') NOT NULL,
        nationality VARCHAR(255) NOT NULL,
        passport_no VARCHAR(255) NOT NULL,
        passport_expiry DATE NOT NULL,
        emirates_id VARCHAR(255) NULL,
        emirates_id_expiry DATE NULL,
        residence_visa_no VARCHAR(255) NULL,
        visa_expiry DATE NULL,
        share_percentage DECIMAL(6,2) NULL,
        poa_document VARCHAR(500) NULL,
        poa_expiry DATE NULL,
        signature_specimen VARCHAR(500) NULL,
        bank_signatories JSON NULL,
        documents JSON NULL,
        access_level ENUM('Restricted') NOT NULL DEFAULT 'Restricted',
        deleted_at DATETIME NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_owner_passport (passport_no),
        INDEX idx_owner_passport_expiry (passport_expiry),
        INDEX idx_owner_eid_expiry (emirates_id_expiry),
        INDEX idx_owner_visa_expiry (visa_expiry),
        INDEX idx_owner_poa_expiry (poa_expiry),
        INDEX idx_owner_deleted (deleted_at)
      )
    `);

  }

  static async createOwnerDocument(input: OwnerDocumentInput) {
    await this.ensureOwnerDocumentsTable();
    if (!ownerRoles.includes(input.role as typeof ownerRoles[number])) throw new Error('Invalid owner role');
    if (input.access_level && !ownerAccessLevels.includes(input.access_level as typeof ownerAccessLevels[number])) throw new Error('Invalid access level');
    const ownerId = input.owner_id || crypto.randomUUID();

    await sequelize.query(
      `
        INSERT INTO crm_pro_owner_documents (
          owner_id, full_name, role, nationality, passport_no, passport_expiry,
          emirates_id, emirates_id_expiry, residence_visa_no, visa_expiry,
          share_percentage, poa_document, poa_expiry, signature_specimen,
          bank_signatories, documents, access_level
        ) VALUES (
          :ownerId, :fullName, :role, :nationality, :passportNo, :passportExpiry,
          :emiratesId, :emiratesIdExpiry, :residenceVisaNo, :visaExpiry,
          :sharePercentage, :poaDocument, :poaExpiry, :signatureSpecimen,
          :bankSignatories, :documents, 'Restricted'
        )
      `,
      {
        replacements: {
          ownerId,
          fullName: input.full_name,
          role: input.role,
          nationality: input.nationality,
          passportNo: input.passport_no,
          passportExpiry: input.passport_expiry,
          emiratesId: input.emirates_id || null,
          emiratesIdExpiry: input.emirates_id_expiry || null,
          residenceVisaNo: input.residence_visa_no || null,
          visaExpiry: input.visa_expiry || null,
          sharePercentage: input.share_percentage ?? null,
          poaDocument: input.poa_document || null,
          poaExpiry: input.poa_expiry || null,
          signatureSpecimen: input.signature_specimen || null,
          bankSignatories: JSON.stringify(input.bank_signatories || []),
          documents: JSON.stringify(input.documents || []),
        },
      }
    );

    return { owner_id: ownerId, access_level: 'Restricted' };
  }

  static async updateOwnerDocument(input: Partial<OwnerDocumentInput> & { owner_id: string }) {
    await this.ensureOwnerDocumentsTable();
    if (input.role && !ownerRoles.includes(input.role as typeof ownerRoles[number])) throw new Error('Invalid owner role');

    await sequelize.query(
      `
        UPDATE crm_pro_owner_documents
        SET
          full_name = COALESCE(:fullName, full_name),
          role = COALESCE(:role, role),
          nationality = COALESCE(:nationality, nationality),
          passport_no = COALESCE(:passportNo, passport_no),
          passport_expiry = COALESCE(:passportExpiry, passport_expiry),
          emirates_id = :emiratesId,
          emirates_id_expiry = :emiratesIdExpiry,
          residence_visa_no = :residenceVisaNo,
          visa_expiry = :visaExpiry,
          share_percentage = :sharePercentage,
          poa_document = :poaDocument,
          poa_expiry = :poaExpiry,
          signature_specimen = :signatureSpecimen,
          bank_signatories = COALESCE(:bankSignatories, bank_signatories),
          documents = COALESCE(:documents, documents),
          access_level = 'Restricted'
        WHERE owner_id = :ownerId
          AND deleted_at IS NULL
      `,
      {
        replacements: {
          ownerId: input.owner_id,
          fullName: input.full_name || null,
          role: input.role || null,
          nationality: input.nationality || null,
          passportNo: input.passport_no || null,
          passportExpiry: input.passport_expiry || null,
          emiratesId: input.emirates_id || null,
          emiratesIdExpiry: input.emirates_id_expiry || null,
          residenceVisaNo: input.residence_visa_no || null,
          visaExpiry: input.visa_expiry || null,
          sharePercentage: input.share_percentage ?? null,
          poaDocument: input.poa_document || null,
          poaExpiry: input.poa_expiry || null,
          signatureSpecimen: input.signature_specimen || null,
          bankSignatories: input.bank_signatories ? JSON.stringify(input.bank_signatories) : null,
          documents: input.documents ? JSON.stringify(input.documents) : null,
        },
      }
    );

    return { owner_id: input.owner_id, access_level: 'Restricted' };
  }

  static async listOwnerDocuments(options: { limit?: number; role?: string } = {}) {
    await this.ensureOwnerDocumentsTable();
    const conditions = ['deleted_at IS NULL'];
    const replacements: Record<string, string | number> = { limit: options.limit || 100 };
    if (options.role) {
      conditions.push('role = :role');
      replacements.role = options.role;
    }

    return sequelize.query(
      `
        SELECT
          owner_id AS ownerId,
          full_name AS fullName,
          role,
          nationality,
          passport_no AS passportNo,
          passport_expiry AS passportExpiry,
          emirates_id AS emiratesId,
          emirates_id_expiry AS emiratesIdExpiry,
          residence_visa_no AS residenceVisaNo,
          visa_expiry AS visaExpiry,
          share_percentage AS sharePercentage,
          poa_document AS poaDocument,
          poa_expiry AS poaExpiry,
          signature_specimen AS signatureSpecimen,
          bank_signatories AS bankSignatories,
          documents,
          access_level AS accessLevel,
          DATEDIFF(passport_expiry, CURRENT_DATE()) AS passportDaysLeft,
          DATEDIFF(emirates_id_expiry, CURRENT_DATE()) AS emiratesIdDaysLeft,
          DATEDIFF(visa_expiry, CURRENT_DATE()) AS visaDaysLeft,
          DATEDIFF(poa_expiry, CURRENT_DATE()) AS poaDaysLeft
        FROM crm_pro_owner_documents
        WHERE ${conditions.join(' AND ')}
        ORDER BY passport_expiry ASC
        LIMIT :limit
      `,
      { replacements, type: QueryTypes.SELECT }
    );
  }
}
