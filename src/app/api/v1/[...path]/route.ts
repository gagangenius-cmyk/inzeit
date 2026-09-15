import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import { verifyToken, type User } from '@/lib/auth';
import { isCeo } from '@/lib/roleChecks';
import { sequelize } from '@/lib/sequelize';
import { HRService } from '@/services/hr-service';
import { PROService } from '@/services/pro-service';
import { RenewalReminderService } from '@/services/renewal-reminder-service';
import { UAEComplianceService } from '@/services/uae-compliance-service';
import { ImplementationRoadmapService } from '@/services/implementation-roadmap-service';

type RouteContext = { params: Promise<{ path?: string[] }> };
type HRLeaveType = 'Annual Leave' | 'Sick Leave' | 'Maternity Leave' | 'Paternity Leave' | 'Hajj Leave' | 'Bereavement Leave' | 'Unpaid Leave' | 'Compensatory Leave';
type HRLetterType = 'relieving' | 'experience';
type HandlerContext = {
  request: NextRequest;
  user: User;
  path: string[];
  searchParams: URLSearchParams;
};

const ok = (body: unknown, init?: ResponseInit) => NextResponse.json(body, init);
const forbidden = () => ok({ error: 'Forbidden' }, { status: 403 });
const notFound = () => ok({ error: 'API v1 endpoint not found' }, { status: 404 });
const methodNotAllowed = () => ok({ error: 'Method not allowed' }, { status: 405 });
const readString = (body: Record<string, unknown>, key: string) => (
  body[key] === undefined || body[key] === null ? '' : String(body[key]).trim()
);
const readNumber = (body: Record<string, unknown>, key: string) => {
  const parsed = Number(body[key]);
  return Number.isFinite(parsed) ? parsed : null;
};
const hasPermission = (user: User, permissions: string[]) => (
  user.permissions?.includes('all') || permissions.some((permission) => user.permissions?.includes(permission))
);
const requirePermission = (user: User, permissions: string[]) => {
  if (!hasPermission(user, permissions)) throw new Error('FORBIDDEN');
};
const parseJsonArray = (value: unknown) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string' || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};
const salaryRecords = (value: unknown) => (
  Array.isArray(value)
    ? value.map((item) => {
        const record = item as Record<string, unknown>;
        return {
          uid_labour_no: String(record.uid_labour_no || '').trim(),
          name: String(record.name || '').trim(),
          salary: Number(record.salary || 0),
          routing_code: String(record.routing_code || '').trim(),
          account_number: String(record.account_number || '').trim(),
        };
      }).filter((record) => record.uid_labour_no && record.name && record.salary > 0 && record.routing_code && record.account_number)
    : []
);

const authenticate = (request: NextRequest) => {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  return token ? verifyToken(token) : null;
};

const listEmployeeDocuments = async (employeeId: string) => {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS crm_hr_employee_documents (
      document_id CHAR(36) PRIMARY KEY,
      employee_id CHAR(36) NOT NULL,
      document_type VARCHAR(255) NOT NULL,
      document_url VARCHAR(500) NOT NULL,
      expiry_date DATE NULL,
      notes TEXT NULL,
      deleted_at DATETIME NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_hr_employee_documents_employee (employee_id)
    )
  `);

  return sequelize.query(
    `
      SELECT
        document_id AS documentId,
        employee_id AS employeeId,
        document_type AS documentType,
        document_url AS documentUrl,
        expiry_date AS expiryDate,
        notes,
        created_at AS createdAt
      FROM crm_hr_employee_documents
      WHERE employee_id = :employeeId
        AND deleted_at IS NULL
      ORDER BY created_at DESC
    `,
    { replacements: { employeeId }, type: QueryTypes.SELECT }
  );
};

const addEmployeeDocument = async (employeeId: string, body: Record<string, unknown>) => {
  await listEmployeeDocuments(employeeId);
  const documentType = readString(body, 'document_type') || readString(body, 'type');
  const documentUrl = readString(body, 'document_url') || readString(body, 'url') || readString(body, 'file_url');
  if (!documentType) return ok({ error: 'document_type is required' }, { status: 400 });
  if (!documentUrl) return ok({ error: 'document_url is required' }, { status: 400 });

  await sequelize.query(
    `
      INSERT INTO crm_hr_employee_documents (
        document_id, employee_id, document_type, document_url, expiry_date, notes
      ) VALUES (
        UUID(), :employeeId, :documentType, :documentUrl, :expiryDate, :notes
      )
    `,
    {
      replacements: {
        employeeId,
        documentType,
        documentUrl,
        expiryDate: readString(body, 'expiry_date') || null,
        notes: readString(body, 'notes') || null,
      },
    }
  );

  return ok({ success: true }, { status: 201 });
};

async function handleGet({ user, path, searchParams }: HandlerContext) {
  const joined = path.join('/');

  if (joined === 'implementation-roadmap') {
    requirePermission(user, ['admin.access', 'hr.view', 'pro.view']);
    return ok(ImplementationRoadmapService.getRoadmap());
  }

  if (joined === 'hr/employees') {
    requirePermission(user, ['hr.view']);
    const employees = await HRService.listEmployees({
      limit: Number.parseInt(searchParams.get('limit') || '100', 10),
      page: Number.parseInt(searchParams.get('page') || '1', 10),
      search: searchParams.get('search') || undefined,
      department: searchParams.get('department') || undefined,
      status: searchParams.get('status') || undefined,
    });
    return ok({ employees: employees.data, pagination: employees.pagination });
  }

  if (path[0] === 'hr' && path[1] === 'employees' && path[2] && path.length === 3) {
    requirePermission(user, ['hr.view']);
    const employee = await HRService.getEmployeeById(Number.parseInt(path[2], 10));
    return employee ? ok({ employee }) : ok({ error: 'Employee not found' }, { status: 404 });
  }

  if (path[0] === 'hr' && path[1] === 'employees' && path[2] && path[3] === 'documents') {
    requirePermission(user, ['hr.view']);
    return ok({ documents: await listEmployeeDocuments(path[2]) });
  }

  if (joined === 'hr/attendance') {
    requirePermission(user, ['hr.view']);
    const records = await HRService.listAttendanceRecords({
      employeeId: searchParams.get('employee_id') || undefined,
      dateFrom: searchParams.get('date_from') || undefined,
      dateTo: searchParams.get('date_to') || undefined,
      status: searchParams.get('status') || undefined,
      source: searchParams.get('source') || undefined,
      limit: Number.parseInt(searchParams.get('limit') || '100', 10),
    });
    return ok({ records });
  }

  if (path[0] === 'hr' && path[1] === 'attendance' && path[2] === 'summary' && path[3]) {
    requirePermission(user, ['hr.view']);
    const [summary] = await sequelize.query(
      `
        SELECT
          employee_id AS employeeId,
          COUNT(*) AS totalDays,
          SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) AS presentDays,
          SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) AS absentDays,
          SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) AS lateDays,
          SUM(CASE WHEN status = 'Leave' THEN 1 ELSE 0 END) AS leaveDays,
          SUM(overtime_hours) AS overtimeHours
        FROM crm_hr_attendance_records
        WHERE employee_id = :employeeId
          AND DATE_FORMAT(date, '%Y-%m') = COALESCE(:month, DATE_FORMAT(CURRENT_DATE(), '%Y-%m'))
        GROUP BY employee_id
      `,
      { replacements: { employeeId: path[3], month: searchParams.get('month') }, type: QueryTypes.SELECT }
    );
    return ok({ summary: summary || null });
  }

  if (joined === 'hr/leaves') {
    requirePermission(user, ['hr.view', 'hr.self']);
    const requests = await HRService.listLeaveManagementRequests({
      employeeId: searchParams.get('employee_id') || undefined,
      status: searchParams.get('status') || undefined,
      limit: Number.parseInt(searchParams.get('limit') || '100', 10),
    });
    return ok({ requests });
  }

  if (path[0] === 'hr' && path[1] === 'leaves' && path[2] === 'balances' && path[3]) {
    requirePermission(user, ['hr.view', 'hr.self']);
    const balances = await HRService.getLeaveBalances(path[3]);
    return ok({ balances });
  }

  if (joined === 'hr/payroll') {
    requirePermission(user, ['hr.payroll']);
    const payslips = await HRService.listPayslips({ limit: Number.parseInt(searchParams.get('limit') || '100', 10) });
    return ok({ payrollRuns: payslips });
  }

  if (path[0] === 'hr' && path[1] === 'payroll' && path[3] === 'payslip' && path[4]) {
    requirePermission(user, ['hr.payroll', 'hr.self']);
    const [payslip] = await HRService.listPayslips({
      employeeId: path[4],
      payYear: Number(path[2]?.slice(0, 4)),
      payMonth: Number(path[2]?.slice(5, 7)),
      limit: 1,
    });
    return payslip ? ok({ payslip }) : ok({ error: 'Payslip not found' }, { status: 404 });
  }

  if (path[0] === 'hr' && path[1] === 'eosb' && path[2]) {
    requirePermission(user, ['hr.eosb']);
    const settlements = await HRService.listEOSBSettlements({ employeeId: path[2], limit: 10 });
    return ok({ settlements });
  }

  if (path[0] === 'hr' && path[1] === 'letters' && path[2]) {
    requirePermission(user, ['hr.view']);
    const letters = await HRService.listEmployeeLetters({ employeeId: path[2], limit: 10 });
    return ok({ letters });
  }

  if (path[0] === 'hr' && path[1] === 'exit' && path[2] === 'checklist' && path[3]) {
    requirePermission(user, ['hr.view']);
    const checklists = await HRService.listExitChecklists({ employeeId: path[3], limit: 10 });
    return ok({ checklists });
  }

  if (joined === 'pro/documents') {
    requirePermission(user, ['pro.view']);
    return ok({ documents: await PROService.listCompanyDocuments(Number.parseInt(searchParams.get('limit') || '100', 10)) });
  }

  if (joined === 'pro/employees') {
    requirePermission(user, ['pro.view']);
    return ok({ records: await PROService.listEmployeeImmigrationRecords({ limit: Number.parseInt(searchParams.get('limit') || '100', 10) }) });
  }

  if (joined === 'pro/wps') {
    requirePermission(user, ['pro.wps.view', 'pro.view']);
    return ok({ records: await PROService.listWpsRecords({ status: searchParams.get('status') || undefined, limit: Number.parseInt(searchParams.get('limit') || '100', 10) }) });
  }

  if (joined === 'pro/renewals/dashboard') {
    requirePermission(user, ['pro.view']);
    const [reminders, overview, tracker] = await Promise.all([
      RenewalReminderService.collectRenewalItems({ windowDays: RenewalReminderService.getMaxThresholdDays() }),
      PROService.getRenewalOverview(),
      RenewalReminderService.getRenewalTracker({
        documentType: searchParams.get('document_type') || undefined,
        entity: searchParams.get('entity') || undefined,
        responsibleOfficer: searchParams.get('responsible_officer') || undefined,
      }),
    ]);
    return ok({ overview, reminders, tracker });
  }

  if (joined === 'pro/compliance') {
    requirePermission(user, ['pro.view', 'hr.view', 'admin.access']);
    return ok(await UAEComplianceService.getComplianceChecks());
  }

  if (joined === 'pro/insurance') {
    requirePermission(user, ['pro.view', 'hr.view']);
    return ok({ records: await PROService.listInsuranceRecords({ status: searchParams.get('status') || undefined, limit: Number.parseInt(searchParams.get('limit') || '100', 10) }) });
  }

  if (joined === 'pro/branches') {
    requirePermission(user, ['pro.view']);
    return ok({ records: await PROService.listGccBranchDocuments({ limit: Number.parseInt(searchParams.get('limit') || '100', 10) }) });
  }

  if (joined === 'pro/owners') {
    requirePermission(user, ['pro.owners.restricted', 'admin.access']);
    return ok({ records: await PROService.listOwnerDocuments({ role: searchParams.get('role') || undefined, limit: Number.parseInt(searchParams.get('limit') || '100', 10) }) });
  }

  return notFound();
}

async function handlePost({ request, user, path }: HandlerContext) {
  const joined = path.join('/');
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;

  if (joined === 'hr/employees') {
    requirePermission(user, ['hr.create']);
    const employee = await HRService.createEmployee(body);
    return ok({ employee }, { status: 201 });
  }

  if (path[0] === 'hr' && path[1] === 'employees' && path[2] && path[3] === 'documents') {
    requirePermission(user, ['hr.create', 'hr.update']);
    return addEmployeeDocument(path[2], body);
  }

  if (joined === 'hr/attendance/mark' || joined === 'hr/attendance/import') {
    requirePermission(user, ['hr.create', 'hr.update']);
    const records = Array.isArray(body.records) ? body.records : [body];
    const created = [];
    for (const record of records as Array<Record<string, unknown>>) {
      created.push(await HRService.createAttendanceRecord({
        employee_id: String(record.employee_id),
        date: String(record.date),
        check_in: record.check_in ? String(record.check_in) : null,
        check_out: record.check_out ? String(record.check_out) : null,
        status: record.status as 'Present' | 'Absent' | 'Late' | 'Half-Day' | 'Leave' | 'Holiday',
        overtime_hours: Number(record.overtime_hours || 0),
        source: (record.source || (joined.endsWith('import') ? 'Import' : 'Manual')) as 'Manual' | 'Biometric' | 'Import',
        notes: record.notes ? String(record.notes) : null,
        approved_by: record.approved_by ? String(record.approved_by) : null,
      }));
    }
    return ok({ records: created }, { status: 201 });
  }

  if (joined === 'hr/leaves') {
    requirePermission(user, ['hr.create', 'hr.self']);
    const created = await HRService.applyLeave({
      employee_id: readString(body, 'employee_id'),
      leave_type: (readString(body, 'leave_type') || 'Annual Leave') as HRLeaveType,
      start_date: readString(body, 'start_date'),
      end_date: readString(body, 'end_date'),
      reason: readString(body, 'reason') || null,
      manager_id: readString(body, 'manager_id') || null,
      document_url: readString(body, 'attachment_url') || readString(body, 'document_url') || null,
    });
    return ok(created, { status: 201 });
  }

  if (joined === 'hr/payroll/run') {
    requirePermission(user, ['hr.payroll']);
    const payslip = await HRService.generatePayslip({
      employee_id: readString(body, 'employee_id'),
      pay_year: Number(body.pay_year),
      pay_month: Number(body.pay_month),
      basic_salary: Number(body.basic_salary || 0),
      allowances: parseJsonArray(body.allowances),
      deductions: parseJsonArray(body.deductions),
      overtime_hours: Number(body.overtime_hours || 0),
      overtime_amount: Number(body.overtime_amount || 0),
      bank_name: readString(body, 'bank_name') || null,
      iban: readString(body, 'iban') || null,
      authorised_by: readString(body, 'authorised_by') || readString(body, 'generated_by') || String(user.id),
    });
    return ok(payslip, { status: 201 });
  }

  if (joined === 'hr/eosb/calculate') {
    requirePermission(user, ['hr.eosb']);
    const preview = await HRService.previewEOSBSettlement({
      employee_id: readString(body, 'employee_id'),
      last_working_day: readString(body, 'last_working_day'),
      separation_reason: body.separation_reason as 'Resignation' | 'Termination' | 'Retirement' | 'Death' | 'Mutual',
      last_basic_salary: Number(body.last_basic_salary || 0),
      unpaid_salary: Number(body.unpaid_salary || 0),
      approved_by: readString(body, 'approved_by') || String(user.id),
      settlement_date: readString(body, 'settlement_date') || null,
      notes: readString(body, 'notes') || null,
    });
    return ok(preview);
  }

  if (joined === 'hr/letters/generate') {
    requirePermission(user, ['hr.create', 'hr.update']);
    const letter = await HRService.generateEmployeeLetter({
      employee_id: readString(body, 'employee_id'),
      letter_type: ((readString(body, 'letter_type') || 'experience').toLowerCase().includes('relieving') ? 'relieving' : 'experience') as HRLetterType,
      generated_by: readString(body, 'generated_by') || String(user.id),
      last_working_day: readString(body, 'last_working_day') || new Date().toISOString().slice(0, 10),
      hr_manager_name: readString(body, 'hr_manager_name') || user.name,
      key_responsibilities: readString(body, 'key_responsibilities') || undefined,
      performance_summary: readString(body, 'performance_summary') || undefined,
    });
    return ok(letter, { status: 201 });
  }

  if (joined === 'hr/exit/interview') {
    requirePermission(user, ['hr.create', 'hr.update']);
    const created = await HRService.createExitInterview({
      employee_id: readString(body, 'employee_id'),
      interview_date: readString(body, 'interview_date'),
      conducted_by: readString(body, 'conducted_by') || String(user.id),
      reason_leaving: body.reason_leaving as 'Better Opportunity' | 'Salary' | 'Relocation' | 'Personal' | 'Termination' | 'Other',
      reason_details: readString(body, 'reason_details') || null,
      job_satisfaction: Number(body.job_satisfaction || 0),
      mgmt_satisfaction: Number(body.mgmt_satisfaction || 0),
      work_env_rating: Number(body.work_env_rating || 0),
      compensation_rating: Number(body.compensation_rating || 0),
      growth_rating: Number(body.growth_rating || 0),
      recommend_company: Boolean(body.recommend_company),
      rehire_eligible: Boolean(body.rehire_eligible),
      feedback_text: readString(body, 'feedback_text') || null,
      suggestions: readString(body, 'suggestions') || null,
    });
    return ok(created, { status: 201 });
  }

  if (joined === 'pro/documents') {
    requirePermission(user, ['pro.create']);
    return ok(await PROService.createCompanyDocument({
      company_id: readString(body, 'company_id'),
      doc_type: readString(body, 'doc_type'),
      doc_number: readString(body, 'doc_number'),
      issuing_authority: readString(body, 'issuing_authority'),
      issue_date: readString(body, 'issue_date'),
      expiry_date: readString(body, 'expiry_date'),
      reminder_days: parseJsonArray(body.reminder_days) as number[],
      doc_file_url: readString(body, 'doc_file_url') || null,
      notes: readString(body, 'notes') || null,
      managed_by: readString(body, 'managed_by') || String(user.id),
      renewal_cost: readNumber(body, 'renewal_cost'),
      last_renewed: readString(body, 'last_renewed') || null,
    }), { status: 201 });
  }

  if (joined === 'pro/wps/generate') {
    requirePermission(user, ['pro.wps.view', 'pro.create']);
    return ok(await PROService.createWpsRecord({
      payroll_month: readString(body, 'payroll_month'),
      employer_code: readString(body, 'employer_code'),
      agent_id: readString(body, 'agent_id'),
      processed_by: readString(body, 'processed_by') || String(user.id),
      payment_date: readString(body, 'payment_date') || null,
      salary_records: salaryRecords(body.salary_records),
    }), { status: 201 });
  }

  if (joined === 'pro/insurance') {
    requirePermission(user, ['pro.create']);
    return ok(await PROService.createInsuranceRecord({
      insurance_category: readString(body, 'insurance_category') || 'Health',
      employee_id: readString(body, 'employee_id') || null,
      insured_name: readString(body, 'insured_name'),
      insurance_company: readString(body, 'insurance_company'),
      policy_number: readString(body, 'policy_number'),
      policy_start: readString(body, 'policy_start'),
      policy_expiry: readString(body, 'policy_expiry'),
      coverage_amount: readNumber(body, 'coverage_amount'),
      premium_amount: readNumber(body, 'premium_amount'),
      dependents: parseJsonArray(body.dependents),
      network_code: readString(body, 'network_code') || null,
      card_url: readString(body, 'card_url') || null,
    }), { status: 201 });
  }

  if (joined === 'pro/branches') {
    requirePermission(user, ['admin.access', 'pro.create']);
    return ok(await PROService.createGccBranchDocument({
      branch_name: readString(body, 'branch_name'),
      country: readString(body, 'country'),
      city: readString(body, 'city'),
      registration_no: readString(body, 'registration_no'),
      registration_expiry: readString(body, 'registration_expiry'),
      licence_type: readString(body, 'licence_type'),
      licence_expiry: readString(body, 'licence_expiry'),
      bank_account: readString(body, 'bank_account') || null,
      bank_name: readString(body, 'bank_name') || null,
      branch_manager: readString(body, 'branch_manager') || null,
      contact_phone: readString(body, 'contact_phone') || null,
      documents: parseJsonArray(body.documents),
      notes: readString(body, 'notes') || null,
    }), { status: 201 });
  }

  if (joined === 'pro/owners') {
    requirePermission(user, ['pro.owners.restricted', 'admin.access']);
    return ok(await PROService.createOwnerDocument({
      full_name: readString(body, 'full_name'),
      role: readString(body, 'role'),
      nationality: readString(body, 'nationality'),
      passport_no: readString(body, 'passport_no'),
      passport_expiry: readString(body, 'passport_expiry'),
      emirates_id: readString(body, 'emirates_id') || null,
      emirates_id_expiry: readString(body, 'emirates_id_expiry') || null,
      residence_visa_no: readString(body, 'residence_visa_no') || null,
      visa_expiry: readString(body, 'visa_expiry') || null,
      share_percentage: readNumber(body, 'share_percentage'),
      poa_document: readString(body, 'poa_document') || null,
      poa_expiry: readString(body, 'poa_expiry') || null,
      signature_specimen: readString(body, 'signature_specimen') || null,
      bank_signatories: parseJsonArray(body.bank_signatories),
      documents: parseJsonArray(body.documents),
      access_level: 'Restricted',
    }), { status: 201 });
  }

  return notFound();
}

async function handlePut({ request, user, path }: HandlerContext) {
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;

  if (path[0] === 'hr' && path[1] === 'employees' && path[2]) {
    requirePermission(user, ['hr.update']);
    const employee = await HRService.updateEmployee({ ...body, id: Number.parseInt(path[2], 10) });
    return ok({ employee });
  }

  if (path[0] === 'hr' && path[1] === 'leaves' && path[2] && (path[3] === 'approve' || path[3] === 'reject')) {
    requirePermission(user, ['hr.update', 'hr.team.attendance_leave']);
    const updated = path[3] === 'approve'
      ? await HRService.reviewLeave({ leave_id: path[2], status: 'Approved', reviewed_by: readString(body, 'reviewed_by') || String(user.id), review_notes: readString(body, 'comment') || null })
      : await HRService.reviewLeave({ leave_id: path[2], status: 'Rejected', reviewed_by: readString(body, 'reviewed_by') || String(user.id), review_notes: readString(body, 'comment') || null });
    return ok(updated);
  }

  if (path[0] === 'hr' && path[1] === 'exit' && path[2] === 'checklist' && path[3] && path[4] === 'item') {
    requirePermission(user, ['hr.update']);
    return ok(await HRService.updateExitChecklistItem({
      item_id: readString(body, 'item_id'),
      status: (readString(body, 'status') || 'Pending') as 'Pending' | 'Completed' | 'Waived',
      completed_by: readString(body, 'completed_by') || String(user.id),
      notes: readString(body, 'notes') || null,
    }));
  }

  if (path[0] === 'pro' && path[1] === 'documents' && path[2]) {
    requirePermission(user, ['pro.update']);
    return ok(await PROService.updateCompanyDocument({
      document_id: path[2],
      company_id: readString(body, 'company_id') || undefined,
      doc_type: readString(body, 'doc_type') || undefined,
      doc_number: readString(body, 'doc_number') || undefined,
      issuing_authority: readString(body, 'issuing_authority') || undefined,
      issue_date: readString(body, 'issue_date') || undefined,
      expiry_date: readString(body, 'expiry_date') || undefined,
      reminder_days: body.reminder_days ? parseJsonArray(body.reminder_days) as number[] : undefined,
      status: readString(body, 'status') || undefined,
      doc_file_url: readString(body, 'doc_file_url') || null,
      notes: readString(body, 'notes') || null,
      managed_by: readString(body, 'managed_by') || undefined,
      renewal_cost: readNumber(body, 'renewal_cost'),
      last_renewed: readString(body, 'last_renewed') || null,
    }));
  }

  if (path[0] === 'pro' && path[1] === 'employees' && path[2]) {
    requirePermission(user, ['pro.update']);
    return ok(await PROService.updateEmployeeImmigrationRecord({ pro_emp_id: path[2], ...body }));
  }

  if (path[0] === 'pro' && path[1] === 'wps' && path[2] && path[3] === 'submit') {
    requirePermission(user, ['pro.wps.view', 'pro.update']);
    return ok(await PROService.updateWpsRecord({
      wps_id: path[2],
      submission_date: readString(body, 'submission_date') || new Date().toISOString().slice(0, 10),
      submission_ref: readString(body, 'submission_ref') || null,
      status: 'Submitted',
    }));
  }

  return notFound();
}

async function handleDelete({ user, path }: HandlerContext) {
  if (path[0] === 'hr' && path[1] === 'employees' && path[2]) {
    requirePermission(user, ['admin.access', 'hr.delete']);
    if (!isCeo(user)) return forbidden();
    return ok(await HRService.softDeleteEmployee(Number.parseInt(path[2], 10)));
  }

  return notFound();
}

async function dispatch(request: NextRequest, context: RouteContext) {
  const user = authenticate(request);
  if (!user) return ok({ error: 'Unauthorized' }, { status: 401 });

  const params = await context.params;
  const handlerContext: HandlerContext = {
    request,
    user,
    path: params.path || [],
    searchParams: new URL(request.url).searchParams,
  };

  try {
    if (request.method === 'GET') return handleGet(handlerContext);
    if (request.method === 'POST') return handlePost(handlerContext);
    if (request.method === 'PUT') return handlePut(handlerContext);
    if (request.method === 'DELETE') return handleDelete(handlerContext);
    return methodNotAllowed();
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') return forbidden();
    const message = error instanceof Error ? error.message : 'API v1 request failed';
    console.error('API v1 request failed:', error);
    return ok({ error: message }, { status: 500 });
  }
}

export const GET = dispatch;
export const POST = dispatch;
export const PUT = dispatch;
export const DELETE = dispatch;
