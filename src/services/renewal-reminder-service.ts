import crypto from 'crypto';
import { QueryTypes } from 'sequelize';
import { sequelize } from '@/lib/sequelize';
import { ModuleNotificationService } from '@/services/module-notification-service';
import { PROService } from '@/services/pro-service';

type ReminderParty = 'pro_officer' | 'super_admin' | 'admin' | 'employee' | 'hr' | 'finance';
type ReminderItem = {
  sourceModule: 'HR' | 'PRO';
  documentType: string;
  recordId: string;
  employeeId?: string | null;
  companyId?: string | null;
  label: string;
  expiryDate: string;
  thresholds: number[];
  parties: ReminderParty[];
};
type RenewalTrackerBucket = 'Expired' | 'Expiring 0-30' | 'Expiring 31-90' | 'Valid > 90';
type RenewalTrackerFilters = {
  documentType?: string;
  entity?: string;
  responsibleOfficer?: string;
};
type NotificationLogRow = {
  logId: string;
  sourceModule: string;
  documentType: string;
  recordId: string;
  employeeId: string | null;
  companyId: string | null;
  thresholdDays: number;
  expiryDate: string;
  notifiedParties: string | null;
  title: string;
  message: string;
  channels: string | null;
  status: 'Sent' | 'Skipped' | 'Failed';
  errorMessage: string | null;
  sentAt: string;
};

export const renewalReminderRules: Array<{
  documentType: string;
  thresholds: number[];
  parties: ReminderParty[];
}> = [
  { documentType: 'Trade License', thresholds: [90, 60, 30, 7], parties: ['pro_officer', 'super_admin'] },
  { documentType: 'Establishment Card', thresholds: [90, 60, 30], parties: ['pro_officer'] },
  { documentType: 'Employee Visa', thresholds: [60, 30, 14, 7], parties: ['pro_officer', 'employee'] },
  { documentType: 'Emirates ID', thresholds: [90, 60, 30, 14], parties: ['pro_officer', 'employee'] },
  { documentType: 'Labour Card', thresholds: [60, 30, 14], parties: ['pro_officer'] },
  { documentType: 'Health Insurance', thresholds: [45, 30, 14], parties: ['pro_officer', 'hr'] },
  { documentType: 'Passport', thresholds: [180, 90, 30], parties: ['pro_officer', 'employee'] },
  { documentType: 'Vehicle Insurance', thresholds: [30, 14, 7], parties: ['pro_officer'] },
  { documentType: 'Professional License', thresholds: [90, 60, 30], parties: ['pro_officer'] },
  { documentType: 'GCC Branch Registration', thresholds: [90, 60], parties: ['pro_officer', 'admin'] },
  { documentType: 'Owner/Partner Visa', thresholds: [90, 60], parties: ['super_admin'] },
  { documentType: 'Power of Attorney', thresholds: [90], parties: ['super_admin', 'pro_officer'] },
  { documentType: 'WPS Filing Deadline', thresholds: [7, 3, 1], parties: ['finance', 'pro_officer'] },
];

const ruleByType = new Map(renewalReminderRules.map((rule) => [rule.documentType, rule]));
const msPerDay = 24 * 60 * 60 * 1000;
const cronSchedule = { expression: '0 8 * * *', timezone: 'Asia/Dubai' };
const maxThresholdDays = Math.max(...renewalReminderRules.flatMap((rule) => rule.thresholds));

const dateOnly = (value: Date) => value.toISOString().slice(0, 10);
const normalizeDate = (value: string | Date | null | undefined) => {
  if (!value) return '';
  if (value instanceof Date) return dateOnly(value);
  return String(value).slice(0, 10);
};
const daysUntil = (dateValue: string, today = new Date()) => {
  const expiry = new Date(`${dateValue}T00:00:00`);
  const start = new Date(`${dateOnly(today)}T00:00:00`);
  if (Number.isNaN(expiry.getTime())) return Number.NaN;
  return Math.ceil((expiry.getTime() - start.getTime()) / msPerDay);
};
const parseUserId = (value: string | number | null | undefined) => {
  const parsed = Number.parseInt(String(value || ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};
const uniqueNumbers = (values: Array<number | null>) => Array.from(new Set(values.filter((value): value is number => Boolean(value))));

export class RenewalReminderService {
  static getCronSchedule() {
    return { ...cronSchedule, maxThresholdDays };
  }

  static getMaxThresholdDays() {
    return maxThresholdDays;
  }

  static async ensureNotificationLogTable() {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS notification_log (
        log_id CHAR(36) PRIMARY KEY,
        source_module VARCHAR(50) NOT NULL,
        document_type VARCHAR(100) NOT NULL,
        record_id VARCHAR(100) NOT NULL,
        employee_id CHAR(36) NULL,
        company_id CHAR(36) NULL,
        threshold_days INT NOT NULL,
        expiry_date DATE NOT NULL,
        notified_parties JSON NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        channels JSON NULL,
        status ENUM('Sent', 'Skipped', 'Failed') NOT NULL DEFAULT 'Sent',
        error_message TEXT NULL,
        sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_notification_log (source_module, document_type, record_id, threshold_days, expiry_date),
        INDEX idx_notification_log_expiry (expiry_date),
        INDEX idx_notification_log_sent (sent_at)
      )
    `);
  }

  private static async roleRecipients(party: ReminderParty, employeeId?: string | null) {
    if (party === 'employee') return uniqueNumbers([parseUserId(employeeId)]);

    const patterns: Record<Exclude<ReminderParty, 'employee'>, string[]> = {
      pro_officer: ['%pro%', '%public relation%'],
      super_admin: ['%super admin%', '%administrator%'],
      admin: ['%admin%', '%administrator%'],
      hr: ['%hr%', '%human resource%'],
      finance: ['%finance%', '%account%'],
    };
    const rolePatterns = patterns[party];

    const rows = await sequelize.query<{ id: number }>(
      `
        SELECT DISTINCT e.id
        FROM crm_employee e
        LEFT JOIN crm_role r ON r.id = e.role
        WHERE (
          ${rolePatterns.map((_, index) => `LOWER(COALESCE(r.name, '')) LIKE :pattern${index} OR LOWER(COALESCE(r.type, '')) LIKE :pattern${index}`).join(' OR ')}
          OR (:party = 'super_admin' AND e.role = 1)
          OR (:party = 'admin' AND e.role = 1)
        )
        LIMIT 100
      `,
      {
        replacements: Object.fromEntries([
          ['party', party],
          ...rolePatterns.map((pattern, index) => [`pattern${index}`, pattern]),
        ]),
        type: QueryTypes.SELECT,
      }
    ).catch(() => []);

    return rows.map((row) => row.id);
  }

  private static async recipientsFor(parties: ReminderParty[], employeeId?: string | null) {
    const batches = await Promise.all(parties.map((party) => this.roleRecipients(party, employeeId)));
    return uniqueNumbers(batches.flat());
  }

  private static async collectCompanyDocumentItems(): Promise<ReminderItem[]> {
    await PROService.ensureDashboardTables();
    const rows = await sequelize.query<{
      recordId: string;
      companyId: string | null;
      title: string | null;
      docType: string | null;
      category: string | null;
      expiryDate: string;
      reminderDays: string | null;
    }>(
      `
        SELECT
          COALESCE(document_id, CAST(id AS CHAR) COLLATE utf8mb4_general_ci) AS recordId,
          company_id AS companyId,
          title,
          doc_type AS docType,
          category,
          expiry_date AS expiryDate,
          reminder_days AS reminderDays
        FROM crm_pro_documents
        WHERE expiry_date IS NOT NULL
          AND status <> 'Cancelled'
      `,
      { type: QueryTypes.SELECT }
    );

    const supportedTypes = new Set([
      'Trade License',
      'Establishment Card',
      'Vehicle Insurance',
      'Professional License',
      'GCC Branch Registration',
      'Owner/Partner Visa',
    ]);

    return rows.flatMap((row) => {
      const searchText = `${row.title || ''} ${row.docType || ''} ${row.category || ''}`.toLowerCase();
      const inferredType = supportedTypes.has(row.docType || '') ? row.docType || '' :
        searchText.includes('vehicle') ? 'Vehicle Insurance' :
        searchText.includes('professional') ? 'Professional License' :
        searchText.includes('gcc') || searchText.includes('branch registration') ? 'GCC Branch Registration' :
        searchText.includes('owner') || searchText.includes('partner visa') ? 'Owner/Partner Visa' :
        '';
      const rule = ruleByType.get(inferredType);
      if (!rule) return [];

      return [{
        sourceModule: 'PRO',
        documentType: inferredType,
        recordId: row.recordId,
        companyId: row.companyId,
        label: row.title || inferredType,
        expiryDate: normalizeDate(row.expiryDate),
        thresholds: rule.thresholds,
        parties: rule.parties,
      }];
    });
  }

  private static async collectEmployeeDocumentItems(): Promise<ReminderItem[]> {
    await PROService.ensureEmployeeImmigrationTable();
    const rows = await sequelize.query<{
      proEmpId: string;
      employeeId: string;
      employeeName: string | null;
      visaExpiryDate: string;
      labourCardExpiry: string;
      insuranceExpiry: string | null;
      emiratesIdExpiry: string | null;
      passportExpiry: string | null;
    }>(
      `
        SELECT
          p.pro_emp_id AS proEmpId,
          p.employee_id AS employeeId,
          e.name AS employeeName,
          p.visa_expiry_date AS visaExpiryDate,
          p.labour_card_expiry AS labourCardExpiry,
          p.insurance_expiry AS insuranceExpiry,
          e.visaExp AS emiratesIdExpiry,
          e.ppExp AS passportExpiry
        FROM crm_pro_employee_immigration p
        LEFT JOIN crm_employee e ON CAST(e.id AS CHAR) COLLATE utf8mb4_general_ci = p.employee_id
        WHERE p.visa_status <> 'Cancelled'
      `,
      { type: QueryTypes.SELECT }
    ).catch(async () => sequelize.query<{
      proEmpId: string;
      employeeId: string;
      employeeName: string | null;
      visaExpiryDate: string;
      labourCardExpiry: string;
      insuranceExpiry: string | null;
      emiratesIdExpiry: string | null;
      passportExpiry: string | null;
    }>(
      `
        SELECT
          p.pro_emp_id AS proEmpId,
          p.employee_id AS employeeId,
          e.name AS employeeName,
          p.visa_expiry_date AS visaExpiryDate,
          p.labour_card_expiry AS labourCardExpiry,
          p.insurance_expiry AS insuranceExpiry,
          e.visaExp AS emiratesIdExpiry,
          NULL AS passportExpiry
        FROM crm_pro_employee_immigration p
        LEFT JOIN crm_employee e ON CAST(e.id AS CHAR) COLLATE utf8mb4_general_ci = p.employee_id
        WHERE p.visa_status <> 'Cancelled'
      `,
      { type: QueryTypes.SELECT }
    ));

    const itemFor = (row: typeof rows[number], documentType: string, expiryDate?: string | null): ReminderItem[] => {
      const rule = ruleByType.get(documentType);
      if (!rule || !expiryDate) return [];
      return [{
        sourceModule: documentType === 'Emirates ID' || documentType === 'Passport' ? 'HR' : 'PRO',
        documentType,
        recordId: `${row.proEmpId}-${documentType.toLowerCase().replace(/\W+/g, '-')}`,
        employeeId: row.employeeId,
        label: `${row.employeeName || `Employee ${row.employeeId}`} - ${documentType}`,
        expiryDate: normalizeDate(expiryDate),
        thresholds: rule.thresholds,
        parties: rule.parties,
      }];
    };

    return rows.flatMap((row) => [
      ...itemFor(row, 'Employee Visa', row.visaExpiryDate),
      ...itemFor(row, 'Labour Card', row.labourCardExpiry),
      ...itemFor(row, 'Health Insurance', row.insuranceExpiry),
      ...itemFor(row, 'Emirates ID', row.emiratesIdExpiry),
      ...itemFor(row, 'Passport', row.passportExpiry),
    ]);
  }

  private static async collectWpsDeadlineItems(): Promise<ReminderItem[]> {
    await PROService.ensureWpsManagementTable();
    const rule = ruleByType.get('WPS Filing Deadline');
    if (!rule) return [];

    const rows = await sequelize.query<{
      recordId: string;
      payrollMonth: string;
      deadlineDate: string;
      status: string;
    }>(
      `
        SELECT
          wps_id AS recordId,
          payroll_month AS payrollMonth,
          DATE_ADD(LAST_DAY(payroll_month), INTERVAL 10 DAY) AS deadlineDate,
          status
        FROM crm_pro_wps_records
        WHERE status IN ('Draft', 'Generated', 'Rejected')
      `,
      { type: QueryTypes.SELECT }
    );

    return rows.map((row) => ({
      sourceModule: 'PRO',
      documentType: 'WPS Filing Deadline',
      recordId: row.recordId,
      label: `WPS filing for ${normalizeDate(row.payrollMonth).slice(0, 7)}`,
      expiryDate: normalizeDate(row.deadlineDate),
      thresholds: rule.thresholds,
      parties: rule.parties,
    }));
  }

  private static async collectInsurancePolicyItems(): Promise<ReminderItem[]> {
    await PROService.ensureInsuranceRecordsTable();
    const healthRule = ruleByType.get('Health Insurance');
    const vehicleRule = ruleByType.get('Vehicle Insurance');
    const rows = await sequelize.query<{
      insuranceId: string;
      insuranceCategory: string;
      employeeId: string | null;
      insuredName: string;
      policyNumber: string;
      policyExpiry: string;
    }>(
      `
        SELECT
          insurance_id AS insuranceId,
          insurance_category AS insuranceCategory,
          employee_id AS employeeId,
          insured_name AS insuredName,
          policy_number AS policyNumber,
          policy_expiry AS policyExpiry
        FROM crm_pro_insurance_records
        WHERE status <> 'Cancelled'
      `,
      { type: QueryTypes.SELECT }
    );

    return rows.flatMap((row) => {
      const documentType = row.insuranceCategory === 'Vehicle' ? 'Vehicle Insurance' : 'Health Insurance';
      const rule = documentType === 'Vehicle Insurance' ? vehicleRule : healthRule;
      if (!rule) return [];

      return [{
        sourceModule: 'PRO',
        documentType,
        recordId: row.insuranceId,
        employeeId: row.employeeId,
        label: `${row.insuredName} - ${row.policyNumber}`,
        expiryDate: normalizeDate(row.policyExpiry),
        thresholds: rule.thresholds,
        parties: rule.parties,
      }];
    });
  }

  private static async collectGccBranchItems(): Promise<ReminderItem[]> {
    await PROService.ensureGccBranchDocumentsTable();
    const rule = ruleByType.get('GCC Branch Registration');
    if (!rule) return [];

    const rows = await sequelize.query<{
      branchId: string;
      branchName: string;
      country: string;
      registrationExpiry: string;
      licenceExpiry: string;
    }>(
      `
        SELECT
          branch_id AS branchId,
          branch_name AS branchName,
          country,
          registration_expiry AS registrationExpiry,
          licence_expiry AS licenceExpiry
        FROM crm_pro_gcc_branch_documents
        WHERE status <> 'Inactive'
      `,
      { type: QueryTypes.SELECT }
    );

    return rows.flatMap((row) => [
      {
        sourceModule: 'PRO' as const,
        documentType: 'GCC Branch Registration',
        recordId: `${row.branchId}-registration`,
        label: `${row.branchName} ${row.country} - registration`,
        expiryDate: normalizeDate(row.registrationExpiry),
        thresholds: rule.thresholds,
        parties: rule.parties,
      },
      {
        sourceModule: 'PRO' as const,
        documentType: 'GCC Branch Registration',
        recordId: `${row.branchId}-licence`,
        label: `${row.branchName} ${row.country} - licence`,
        expiryDate: normalizeDate(row.licenceExpiry),
        thresholds: rule.thresholds,
        parties: rule.parties,
      },
    ]);
  }

  private static async collectOwnerDocumentItems(): Promise<ReminderItem[]> {
    await PROService.ensureOwnerDocumentsTable();
    const rows = await sequelize.query<{
      ownerId: string;
      fullName: string;
      passportExpiry: string;
      emiratesIdExpiry: string | null;
      visaExpiry: string | null;
      poaExpiry: string | null;
    }>(
      `
        SELECT
          owner_id AS ownerId,
          full_name AS fullName,
          passport_expiry AS passportExpiry,
          emirates_id_expiry AS emiratesIdExpiry,
          visa_expiry AS visaExpiry,
          poa_expiry AS poaExpiry
        FROM crm_pro_owner_documents
        WHERE deleted_at IS NULL
      `,
      { type: QueryTypes.SELECT }
    );

    const itemFor = (row: typeof rows[number], documentType: string, expiryDate?: string | null): ReminderItem[] => {
      const rule = ruleByType.get(documentType);
      if (!rule || !expiryDate) return [];
      return [{
        sourceModule: 'PRO',
        documentType,
        recordId: `${row.ownerId}-${documentType.toLowerCase().replace(/\W+/g, '-')}`,
        label: `${row.fullName} - ${documentType}`,
        expiryDate: normalizeDate(expiryDate),
        thresholds: rule.thresholds,
        parties: rule.parties,
      }];
    };

    return rows.flatMap((row) => [
      ...itemFor(row, 'Passport', row.passportExpiry),
      ...itemFor(row, 'Emirates ID', row.emiratesIdExpiry),
      ...itemFor(row, 'Owner/Partner Visa', row.visaExpiry),
      ...itemFor(row, 'Power of Attorney', row.poaExpiry),
    ]);
  }

  static async collectRenewalItems(options: { windowDays?: number } = {}) {
    const [companyDocuments, employeeDocuments, insurancePolicies, gccBranches, ownerDocuments, wpsDeadlines] = await Promise.all([
      this.collectCompanyDocumentItems(),
      this.collectEmployeeDocumentItems(),
      this.collectInsurancePolicyItems(),
      this.collectGccBranchItems(),
      this.collectOwnerDocumentItems(),
      this.collectWpsDeadlineItems(),
    ]);

    return [...companyDocuments, ...employeeDocuments, ...insurancePolicies, ...gccBranches, ...ownerDocuments, ...wpsDeadlines]
      .filter((item) => {
        if (options.windowDays === undefined) return true;
        const daysLeft = daysUntil(item.expiryDate);
        return Number.isFinite(daysLeft) && daysLeft >= 0 && daysLeft <= options.windowDays;
      })
      .filter((item) => item.expiryDate)
      .sort((a, b) => daysUntil(a.expiryDate) - daysUntil(b.expiryDate));
  }

  static async getRenewalTracker(filters: RenewalTrackerFilters = {}) {
    const items = await this.collectRenewalItems();
    const rows = items.map((item) => {
      const daysLeft = daysUntil(item.expiryDate);
      const bucket: RenewalTrackerBucket = daysLeft < 0
        ? 'Expired'
        : daysLeft <= 30
          ? 'Expiring 0-30'
          : daysLeft <= 90
            ? 'Expiring 31-90'
            : 'Valid > 90';

      return {
        ...item,
        daysLeft,
        bucket,
        entity: item.label,
        responsibleOfficer: item.parties.join(', '),
      };
    }).filter((item) => {
      const documentTypeMatch = !filters.documentType || item.documentType === filters.documentType;
      const entityMatch = !filters.entity || item.entity.toLowerCase().includes(filters.entity.toLowerCase());
      const officerMatch = !filters.responsibleOfficer || item.responsibleOfficer.toLowerCase().includes(filters.responsibleOfficer.toLowerCase());
      return documentTypeMatch && entityMatch && officerMatch;
    });

    const grouped: Record<RenewalTrackerBucket, typeof rows> = {
      Expired: [],
      'Expiring 0-30': [],
      'Expiring 31-90': [],
      'Valid > 90': [],
    };
    rows.forEach((item) => grouped[item.bucket].push(item));

    return {
      rows,
      grouped,
      summary: {
        expired: grouped.Expired.length,
        expiring0To30: grouped['Expiring 0-30'].length,
        expiring31To90: grouped['Expiring 31-90'].length,
        validOver90: grouped['Valid > 90'].length,
        total: rows.length,
      },
      filters: {
        documentTypes: Array.from(new Set(items.map((item) => item.documentType))).sort(),
        responsibleOfficers: Array.from(new Set(items.flatMap((item) => item.parties))).sort(),
      },
    };
  }

  private static async hasDuplicateLog(item: ReminderItem, thresholdDays: number) {
    const [existing] = await sequelize.query<{ total: number }>(
      `
        SELECT COUNT(*) AS total
        FROM notification_log
        WHERE source_module = :sourceModule
          AND document_type = :documentType
          AND record_id = :recordId
          AND threshold_days = :thresholdDays
          AND expiry_date = :expiryDate
      `,
      {
        replacements: {
          sourceModule: item.sourceModule,
          documentType: item.documentType,
          recordId: item.recordId,
          thresholdDays,
          expiryDate: item.expiryDate,
        },
        type: QueryTypes.SELECT,
      }
    );

    return Number(existing?.total || 0) > 0;
  }

  private static async writeLog(input: {
    item: ReminderItem;
    thresholdDays: number;
    title: string;
    message: string;
    status: 'Sent' | 'Skipped' | 'Failed';
    recipients: number[];
    errorMessage?: string | null;
  }) {
    await sequelize.query(
      `
        INSERT IGNORE INTO notification_log (
          log_id, source_module, document_type, record_id, employee_id, company_id,
          threshold_days, expiry_date, notified_parties, title, message, channels,
          status, error_message
        ) VALUES (
          :logId, :sourceModule, :documentType, :recordId, :employeeId, :companyId,
          :thresholdDays, :expiryDate, :notifiedParties, :title, :message, :channels,
          :status, :errorMessage
        )
      `,
      {
        replacements: {
          logId: crypto.randomUUID(),
          sourceModule: input.item.sourceModule,
          documentType: input.item.documentType,
          recordId: input.item.recordId,
          employeeId: input.item.employeeId || null,
          companyId: input.item.companyId || null,
          thresholdDays: input.thresholdDays,
          expiryDate: input.item.expiryDate,
          notifiedParties: JSON.stringify({ parties: input.item.parties, recipients: input.recipients }),
          title: input.title,
          message: input.message,
          channels: JSON.stringify(['in_app', 'email', 'sms']),
          status: input.status,
          errorMessage: input.errorMessage || null,
        },
      }
    );
  }

  static async runDailyReminderScan(options: { dryRun?: boolean } = {}) {
    await this.ensureNotificationLogTable();
    const items = await this.collectRenewalItems({ windowDays: maxThresholdDays });
    const results: Array<{
      documentType: string;
      label: string;
      expiryDate: string;
      daysLeft: number;
      thresholdDays: number;
      status: 'Matched' | 'Sent' | 'Skipped' | 'Failed';
      recipients: number[];
      reason?: string;
    }> = [];

    for (const item of items) {
      const daysLeft = daysUntil(item.expiryDate);
      if (!Number.isFinite(daysLeft) || !item.thresholds.includes(daysLeft)) continue;

      const duplicate = await this.hasDuplicateLog(item, daysLeft);
      if (duplicate) {
        results.push({ documentType: item.documentType, label: item.label, expiryDate: item.expiryDate, daysLeft, thresholdDays: daysLeft, status: 'Skipped', recipients: [], reason: 'Duplicate notification already logged' });
        continue;
      }

      const recipients = await this.recipientsFor(item.parties, item.employeeId);
      const title = `${item.documentType} renewal due in ${daysLeft} days`;
      const message = `${item.label} expires on ${item.expiryDate}. Please complete the renewal workflow before the deadline.`;

      if (options.dryRun) {
        results.push({ documentType: item.documentType, label: item.label, expiryDate: item.expiryDate, daysLeft, thresholdDays: daysLeft, status: 'Matched', recipients });
        continue;
      }

      if (!recipients.length) {
        await this.writeLog({ item, thresholdDays: daysLeft, title, message, status: 'Skipped', recipients, errorMessage: 'No matching recipients found' });
        results.push({ documentType: item.documentType, label: item.label, expiryDate: item.expiryDate, daysLeft, thresholdDays: daysLeft, status: 'Skipped', recipients, reason: 'No matching recipients found' });
        continue;
      }

      try {
        await ModuleNotificationService.sendRenewalAlert({
          userIds: recipients,
          title,
          message,
          priority: daysLeft <= 7 ? 'urgent' : 'high',
          channels: ['in_app', 'email', 'sms'],
        });
        await this.writeLog({ item, thresholdDays: daysLeft, title, message, status: 'Sent', recipients });
        results.push({ documentType: item.documentType, label: item.label, expiryDate: item.expiryDate, daysLeft, thresholdDays: daysLeft, status: 'Sent', recipients });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Notification dispatch failed';
        await this.writeLog({ item, thresholdDays: daysLeft, title, message, status: 'Failed', recipients, errorMessage });
        results.push({ documentType: item.documentType, label: item.label, expiryDate: item.expiryDate, daysLeft, thresholdDays: daysLeft, status: 'Failed', recipients, reason: errorMessage });
      }
    }

    return {
      dryRun: Boolean(options.dryRun),
      scanned: items.length,
      matched: results.length,
      sent: results.filter((result) => result.status === 'Sent').length,
      skipped: results.filter((result) => result.status === 'Skipped').length,
      failed: results.filter((result) => result.status === 'Failed').length,
      results,
      schedule: cronSchedule,
    };
  }

  static async listNotificationLogs(limit = 100) {
    await this.ensureNotificationLogTable();
    return sequelize.query<NotificationLogRow>(
      `
        SELECT
          log_id AS logId,
          source_module AS sourceModule,
          document_type AS documentType,
          record_id AS recordId,
          employee_id AS employeeId,
          company_id AS companyId,
          threshold_days AS thresholdDays,
          expiry_date AS expiryDate,
          notified_parties AS notifiedParties,
          title,
          message,
          channels,
          status,
          error_message AS errorMessage,
          sent_at AS sentAt
        FROM notification_log
        ORDER BY sent_at DESC
        LIMIT :limit
      `,
      { replacements: { limit }, type: QueryTypes.SELECT }
    );
  }
}
