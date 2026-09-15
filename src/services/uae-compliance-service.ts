import { QueryTypes } from 'sequelize';
import { sequelize } from '@/lib/sequelize';
import { PROService } from '@/services/pro-service';
import { HRService } from '@/services/hr-service';

type ComplianceSeverity = 'Info' | 'Warning' | 'Critical';
type ComplianceStatus = 'Compliant' | 'Attention Required' | 'At Risk';
type ComplianceCheck = {
  key: string;
  area: string;
  requirement: string;
  status: ComplianceStatus;
  severity: ComplianceSeverity;
  count: number;
  details: unknown[];
};

export const uaeComplianceNotes = [
  {
    area: 'MOHRE',
    authority: 'Ministry of Human Resources & Emiratisation',
    notes: [
      'Store MOHRE employer code for every WPS filing.',
      'Labour contract references should match MOHRE-registered terms.',
      'Leave entitlements are configured against UAE Federal Decree-Law No. 33 of 2021.',
      'EOSB calculations are aligned to Article 51 rules in the HR EOSB service.',
      'Minimum wage checks should be maintained as a configurable payroll policy.',
    ],
    dataPoints: ['employer_code', 'mohre_contract_ref', 'leave_balances', 'eosb_calculations'],
  },
  {
    area: 'WPS',
    authority: 'Wage Protection System',
    notes: [
      'All salaries must be paid via WPS no later than day 10 of the following month.',
      'SIF output uses the UAE Central Bank pipe-delimited format in the WPS service.',
      'Unsubmitted WPS runs are flagged when the day-10 deadline is approaching or overdue.',
    ],
    dataPoints: ['payroll_month', 'employer_code', 'sif_file_url', 'submission_date', 'status'],
  },
  {
    area: 'GDRFA',
    authority: 'General Directorate of Residency & Foreigners Affairs',
    notes: [
      'Visa UIDs are mandatory for employee immigration records.',
      'Visa cancellation actions are represented in exit checklist PRO tasks.',
      'Medical fitness certificate expiry is tracked in employee immigration records.',
    ],
    dataPoints: ['visa_uid', 'visa_status', 'medical_fitness', 'exit_checklists'],
  },
  {
    area: 'Emirates ID',
    authority: 'Federal Authority for Identity, Citizenship, Customs & Port Security',
    notes: [
      'Emirates ID should be collected for all UAE residents.',
      'Renewal alerts are generated at least 60 days before expiry.',
    ],
    dataPoints: ['EID', 'visaExp'],
  },
  {
    area: 'Health Insurance',
    authority: 'DHA / HAAD',
    notes: [
      'Health insurance is mandatory for Dubai and Abu Dhabi employees.',
      'Minimum network category should be Basic or above.',
      'Dependents can be stored per emirate-specific employer policy.',
    ],
    dataPoints: ['insurance_category', 'network_code', 'dependents', 'policy_expiry'],
  },
  {
    area: 'Data Privacy',
    authority: 'Internal privacy controls',
    notes: [
      'Personal data such as passport, EID, and biometric records must be encrypted at rest with AES-256-compatible controls.',
      'Access must be role-limited; owners database is restricted to Super Admin and designated PRO Officer.',
      'Access audit logs should be retained for sensitive HR and PRO records.',
    ],
    dataPoints: ['pro.owners.restricted', 'DATA_ENCRYPTION_KEY', 'data_access_audit_log'],
  },
];

const statusFor = (count: number, critical = false): ComplianceStatus => {
  if (!count) return 'Compliant';
  return critical ? 'At Risk' : 'Attention Required';
};

export class UAEComplianceService {
  // Column names (metadata/accessed_at) match src/lib/dataAccessAudit.ts,
  // the module that actually writes to this table - this CREATE TABLE
  // previously named these access_reason/created_at, which never matched
  // the table as it exists in any real environment (see dataAccessAudit.ts's
  // own comment) and would only have mattered on a fresh install anyway,
  // since this is a no-op everywhere the table already exists.
  static async ensurePrivacyAuditTable() {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS data_access_audit_log (
        audit_id CHAR(36) PRIMARY KEY,
        user_id CHAR(36) NULL,
        entity_type VARCHAR(100) NOT NULL,
        entity_id VARCHAR(100) NOT NULL,
        action VARCHAR(100) NOT NULL,
        metadata JSON NULL,
        accessed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_data_access_entity (entity_type, entity_id),
        INDEX idx_data_access_user (user_id),
        INDEX idx_data_access_created (accessed_at)
      )
    `);
  }

  static async getComplianceChecks() {
    await Promise.all([
      PROService.ensureWpsManagementTable(),
      PROService.ensureEmployeeImmigrationTable(),
      PROService.ensureInsuranceRecordsTable(),
      PROService.ensureOwnerDocumentsTable(),
      HRService.ensureLeaveManagementTables(),
      HRService.ensureEOSBSettlementTable(),
      this.ensurePrivacyAuditTable(),
    ]);

    const [
      wpsDeadlineRows,
      missingMohreRows,
      missingContractRows,
      missingVisaUidRows,
      medicalFitnessRows,
      missingEidRows,
      eidExpiryRows,
      insuranceRows,
      ownerAccessRows,
      auditCountRows,
    ] = await Promise.all([
      sequelize.query(
        `
          SELECT
            wps_id AS wpsId,
            payroll_month AS payrollMonth,
            employer_code AS employerCode,
            status,
            DATE_ADD(LAST_DAY(payroll_month), INTERVAL 10 DAY) AS deadlineDate,
            DATEDIFF(DATE_ADD(LAST_DAY(payroll_month), INTERVAL 10 DAY), CURRENT_DATE()) AS daysLeft
          FROM crm_pro_wps_records
          WHERE status NOT IN ('Submitted', 'Confirmed')
            AND DATEDIFF(DATE_ADD(LAST_DAY(payroll_month), INTERVAL 10 DAY), CURRENT_DATE()) <= 7
          ORDER BY deadlineDate ASC
        `,
        { type: QueryTypes.SELECT }
      ),
      sequelize.query(
        `
          SELECT wps_id AS wpsId, payroll_month AS payrollMonth, status
          FROM crm_pro_wps_records
          WHERE employer_code IS NULL OR employer_code = ''
        `,
        { type: QueryTypes.SELECT }
      ),
      sequelize.query(
        `
          SELECT pro_emp_id AS proEmpId, employee_id AS employeeId, mohre_contract_ref AS mohreContractRef
          FROM crm_pro_employee_immigration
          WHERE mohre_contract_ref IS NULL OR mohre_contract_ref = ''
        `,
        { type: QueryTypes.SELECT }
      ),
      sequelize.query(
        `
          SELECT pro_emp_id AS proEmpId, employee_id AS employeeId
          FROM crm_pro_employee_immigration
          WHERE visa_uid IS NULL OR visa_uid = ''
        `,
        { type: QueryTypes.SELECT }
      ),
      sequelize.query(
        `
          SELECT
            pro_emp_id AS proEmpId,
            employee_id AS employeeId,
            medical_fitness AS medicalFitness,
            DATEDIFF(medical_fitness, CURRENT_DATE()) AS daysLeft
          FROM crm_pro_employee_immigration
          WHERE medical_fitness IS NOT NULL
            AND DATEDIFF(medical_fitness, CURRENT_DATE()) <= 60
          ORDER BY medical_fitness ASC
        `,
        { type: QueryTypes.SELECT }
      ),
      sequelize.query(
        `
          SELECT id, name, EID
          FROM crm_employee
          WHERE status = 1 AND (EID IS NULL OR EID = '')
        `,
        { type: QueryTypes.SELECT }
      ),
      sequelize.query(
        `
          SELECT id, name, EID, visaExp AS emiratesIdExpiry, DATEDIFF(visaExp, CURRENT_DATE()) AS daysLeft
          FROM crm_employee
          WHERE status = 1
            AND visaExp IS NOT NULL
            AND DATEDIFF(visaExp, CURRENT_DATE()) <= 60
          ORDER BY visaExp ASC
        `,
        { type: QueryTypes.SELECT }
      ),
      sequelize.query(
        `
          SELECT
            insurance_id AS insuranceId,
            insured_name AS insuredName,
            network_code AS networkCode,
            policy_expiry AS policyExpiry,
            DATEDIFF(policy_expiry, CURRENT_DATE()) AS daysLeft
          FROM crm_pro_insurance_records
          WHERE insurance_category = 'Health'
            AND status <> 'Cancelled'
            AND (network_code IS NULL OR network_code = '' OR DATEDIFF(policy_expiry, CURRENT_DATE()) <= 30)
          ORDER BY policy_expiry ASC
        `,
        { type: QueryTypes.SELECT }
      ),
      sequelize.query(
        `
          SELECT owner_id AS ownerId, full_name AS fullName, access_level AS accessLevel
          FROM crm_pro_owner_documents
          WHERE deleted_at IS NULL AND access_level <> 'Restricted'
        `,
        { type: QueryTypes.SELECT }
      ),
      sequelize.query<{ total: number }>(
        'SELECT COUNT(*) AS total FROM data_access_audit_log',
        { type: QueryTypes.SELECT }
      ),
    ]);

    const checks: ComplianceCheck[] = [
      {
        key: 'wps-day-10-deadline',
        area: 'WPS',
        requirement: 'Salaries paid through WPS no later than day 10 of the following month.',
        status: statusFor(wpsDeadlineRows.length, true),
        severity: wpsDeadlineRows.length ? 'Critical' : 'Info',
        count: wpsDeadlineRows.length,
        details: wpsDeadlineRows,
      },
      {
        key: 'mohre-employer-code',
        area: 'MOHRE',
        requirement: 'MOHRE employer code stored on every WPS submission.',
        status: statusFor(missingMohreRows.length),
        severity: missingMohreRows.length ? 'Warning' : 'Info',
        count: missingMohreRows.length,
        details: missingMohreRows,
      },
      {
        key: 'mohre-contract-reference',
        area: 'MOHRE',
        requirement: 'Labour contract reference captured for employee immigration records.',
        status: statusFor(missingContractRows.length),
        severity: missingContractRows.length ? 'Warning' : 'Info',
        count: missingContractRows.length,
        details: missingContractRows,
      },
      {
        key: 'gdrfa-visa-uid',
        area: 'GDRFA',
        requirement: 'Visa UID stored for every employee immigration record.',
        status: statusFor(missingVisaUidRows.length, true),
        severity: missingVisaUidRows.length ? 'Critical' : 'Info',
        count: missingVisaUidRows.length,
        details: missingVisaUidRows,
      },
      {
        key: 'medical-fitness-expiry',
        area: 'GDRFA',
        requirement: 'Medical fitness certificate expiry is tracked and alerted before visa processing risk.',
        status: statusFor(medicalFitnessRows.length),
        severity: medicalFitnessRows.length ? 'Warning' : 'Info',
        count: medicalFitnessRows.length,
        details: medicalFitnessRows,
      },
      {
        key: 'emirates-id-collected',
        area: 'Emirates ID',
        requirement: 'Emirates ID collected for active UAE resident employee records.',
        status: statusFor(missingEidRows.length),
        severity: missingEidRows.length ? 'Warning' : 'Info',
        count: missingEidRows.length,
        details: missingEidRows,
      },
      {
        key: 'emirates-id-renewal-alert',
        area: 'Emirates ID',
        requirement: 'Emirates ID renewal alert at least 60 days before expiry.',
        status: statusFor(eidExpiryRows.length),
        severity: eidExpiryRows.length ? 'Warning' : 'Info',
        count: eidExpiryRows.length,
        details: eidExpiryRows,
      },
      {
        key: 'health-insurance-network',
        area: 'Health Insurance',
        requirement: 'Health insurance has a Basic or higher network and renewal risk is flagged.',
        status: statusFor(insuranceRows.length),
        severity: insuranceRows.length ? 'Warning' : 'Info',
        count: insuranceRows.length,
        details: insuranceRows,
      },
      {
        key: 'owner-access-restricted',
        area: 'Data Privacy',
        requirement: 'Owner and partner records remain restricted to Super Admin and designated PRO Officer.',
        status: statusFor(ownerAccessRows.length, true),
        severity: ownerAccessRows.length ? 'Critical' : 'Info',
        count: ownerAccessRows.length,
        details: ownerAccessRows,
      },
      {
        key: 'privacy-audit-log',
        area: 'Data Privacy',
        requirement: 'Sensitive data access audit table exists and is available for access logging.',
        status: 'Compliant',
        severity: 'Info',
        count: Number(auditCountRows[0]?.total || 0),
        details: [{ auditRows: Number(auditCountRows[0]?.total || 0), encryptionKeyConfigured: Boolean(process.env.DATA_ENCRYPTION_KEY || process.env.ENCRYPTION_KEY) }],
      },
    ];

    return {
      notes: uaeComplianceNotes,
      checks,
      summary: {
        total: checks.length,
        compliant: checks.filter((check) => check.status === 'Compliant').length,
        attentionRequired: checks.filter((check) => check.status === 'Attention Required').length,
        atRisk: checks.filter((check) => check.status === 'At Risk').length,
      },
    };
  }
}
