import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../lib/sequelize';

class HrAttendanceRecord extends Model {}
HrAttendanceRecord.init({
  attendance_id: { type: DataTypes.CHAR(36), primaryKey: true },
  employee_id: { type: DataTypes.CHAR(36), allowNull: false },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  check_in: { type: DataTypes.TIME, allowNull: true },
  check_out: { type: DataTypes.TIME, allowNull: true },
  status: { type: DataTypes.ENUM('Present', 'Absent', 'Late', 'Half-Day', 'Leave', 'Holiday'), allowNull: false },
  overtime_hours: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
  source: { type: DataTypes.ENUM('Manual', 'Biometric', 'Import'), allowNull: false },
  notes: { type: DataTypes.TEXT, allowNull: true },
  approved_by: { type: DataTypes.CHAR(36), allowNull: true },
}, { sequelize, modelName: 'HrAttendanceRecord', tableName: 'crm_hr_attendance_records', timestamps: false });

class HrLeaveRequest extends Model {}
HrLeaveRequest.init({
  leave_id: { type: DataTypes.CHAR(36), primaryKey: true },
  employee_id: { type: DataTypes.CHAR(36), allowNull: false },
  manager_id: { type: DataTypes.CHAR(36), allowNull: true },
  leave_type: { type: DataTypes.STRING(80), allowNull: false },
  start_date: { type: DataTypes.DATEONLY, allowNull: false },
  end_date: { type: DataTypes.DATEONLY, allowNull: false },
  days_requested: { type: DataTypes.DECIMAL(6, 2), allowNull: false },
  status: { type: DataTypes.ENUM('Pending', 'Approved', 'Rejected', 'Cancelled'), defaultValue: 'Pending' },
  workflow_status: { type: DataTypes.ENUM('Manager Review', 'HR Confirmation', 'Completed', 'Cancelled'), defaultValue: 'Manager Review' },
  reason: { type: DataTypes.TEXT, allowNull: true },
  medical_certificate_required: { type: DataTypes.BOOLEAN, defaultValue: false },
  document_url: { type: DataTypes.TEXT, allowNull: true },
  manager_status: { type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'), defaultValue: 'Pending' },
  manager_comment: { type: DataTypes.TEXT, allowNull: true },
  hr_status: { type: DataTypes.ENUM('Pending', 'Confirmed', 'Overridden'), defaultValue: 'Pending' },
  reviewed_by: { type: DataTypes.CHAR(36), allowNull: true },
}, { sequelize, modelName: 'HrLeaveRequest', tableName: 'crm_hr_leave_requests', timestamps: false });

class HrLeaveBalance extends Model {}
HrLeaveBalance.init({
  balance_id: { type: DataTypes.CHAR(36), primaryKey: true },
  employee_id: { type: DataTypes.CHAR(36), allowNull: false },
  leave_type: { type: DataTypes.STRING(80), allowNull: false },
  year: { type: DataTypes.INTEGER, allowNull: false },
  entitlement_days: { type: DataTypes.DECIMAL(6, 2), defaultValue: 0 },
  used_days: { type: DataTypes.DECIMAL(6, 2), defaultValue: 0 },
  pending_days: { type: DataTypes.DECIMAL(6, 2), defaultValue: 0 },
  remaining_days: { type: DataTypes.DECIMAL(6, 2), defaultValue: 0 },
}, { sequelize, modelName: 'HrLeaveBalance', tableName: 'crm_hr_leave_balances', timestamps: false });

class HrEosbSettlement extends Model {}
HrEosbSettlement.init({
  eosb_id: { type: DataTypes.CHAR(36), primaryKey: true },
  employee_id: { type: DataTypes.CHAR(36), allowNull: false },
  joining_date: { type: DataTypes.DATEONLY, allowNull: false },
  last_working_day: { type: DataTypes.DATEONLY, allowNull: false },
  years_of_service: { type: DataTypes.DECIMAL(6, 2), defaultValue: 0 },
  separation_reason: { type: DataTypes.ENUM('Resignation', 'Termination', 'Retirement', 'Death', 'Mutual'), allowNull: false },
  last_basic_salary: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  eosb_amount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  leave_balance_days: { type: DataTypes.INTEGER, defaultValue: 0 },
  leave_encashment: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  unpaid_salary: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  total_payable: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  approved_by: { type: DataTypes.CHAR(36), allowNull: false },
  settlement_date: { type: DataTypes.DATEONLY, allowNull: true },
  notes: { type: DataTypes.TEXT, allowNull: true },
  created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, { sequelize, modelName: 'HrEosbSettlement', tableName: 'crm_hr_eosb_settlements', timestamps: false });

class HrPayslip extends Model {}
HrPayslip.init({
  payslip_id: { type: DataTypes.CHAR(36), primaryKey: true },
  employee_id: { type: DataTypes.CHAR(36), allowNull: false },
  pay_year: { type: DataTypes.INTEGER, allowNull: false },
  pay_month: { type: DataTypes.INTEGER, allowNull: false },
  pay_period: { type: DataTypes.STRING(20), allowNull: false },
  gross_salary: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  net_salary: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  currency_code: { type: DataTypes.STRING(10), allowNull: false, defaultValue: 'AED' },
  storage_key: { type: DataTypes.STRING(500), allowNull: false },
  signed_url: { type: DataTypes.TEXT, allowNull: false },
  signed_url_expires_at: { type: DataTypes.DATE, allowNull: false },
}, { sequelize, modelName: 'HrPayslip', tableName: 'crm_hr_payslips', timestamps: false });

class HrExitChecklist extends Model {}
HrExitChecklist.init({
  checklist_id: { type: DataTypes.CHAR(36), primaryKey: true },
  employee_id: { type: DataTypes.CHAR(36), allowNull: false },
  separation_reason: { type: DataTypes.STRING(80), allowNull: true },
  last_working_day: { type: DataTypes.DATEONLY, allowNull: true },
  status: { type: DataTypes.ENUM('Open', 'Completed', 'Cancelled'), defaultValue: 'Open' },
}, { sequelize, modelName: 'HrExitChecklist', tableName: 'crm_hr_exit_checklists', timestamps: false });

class HrExitChecklistItem extends Model {}
HrExitChecklistItem.init({
  item_id: { type: DataTypes.CHAR(36), primaryKey: true },
  checklist_id: { type: DataTypes.CHAR(36), allowNull: false },
  employee_id: { type: DataTypes.CHAR(36), allowNull: false },
  department: { type: DataTypes.STRING(50), allowNull: false },
  item_text: { type: DataTypes.STRING(255), allowNull: false },
  owner_role: { type: DataTypes.STRING(100), allowNull: false },
  status: { type: DataTypes.ENUM('Pending', 'Completed', 'Waived'), defaultValue: 'Pending' },
}, { sequelize, modelName: 'HrExitChecklistItem', tableName: 'crm_hr_exit_checklist_items', timestamps: false });

class HrLetterTemplate extends Model {}
HrLetterTemplate.init({
  template_id: { type: DataTypes.CHAR(36), primaryKey: true },
  letter_type: { type: DataTypes.ENUM('relieving', 'experience'), allowNull: false },
  template_name: { type: DataTypes.STRING(150), allowNull: false },
  body_template: { type: DataTypes.TEXT, allowNull: false },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { sequelize, modelName: 'HrLetterTemplate', tableName: 'crm_hr_letter_templates', timestamps: false });

class HrEmployeeLetter extends Model {}
HrEmployeeLetter.init({
  letter_id: { type: DataTypes.CHAR(36), primaryKey: true },
  employee_id: { type: DataTypes.CHAR(36), allowNull: false },
  letter_type: { type: DataTypes.ENUM('relieving', 'experience'), allowNull: false },
  template_id: { type: DataTypes.CHAR(36), allowNull: false },
  ref_number: { type: DataTypes.STRING(80), allowNull: false },
  issue_date: { type: DataTypes.DATEONLY, allowNull: false },
  last_working_day: { type: DataTypes.DATEONLY, allowNull: false },
}, { sequelize, modelName: 'HrEmployeeLetter', tableName: 'crm_hr_employee_letters', timestamps: false });

class HrExitInterview extends Model {}
HrExitInterview.init({
  exit_id: { type: DataTypes.CHAR(36), primaryKey: true },
  employee_id: { type: DataTypes.CHAR(36), allowNull: false },
  interview_date: { type: DataTypes.DATEONLY, allowNull: false },
  conducted_by: { type: DataTypes.CHAR(36), allowNull: false },
  reason_leaving: { type: DataTypes.ENUM('Better Opportunity', 'Salary', 'Relocation', 'Personal', 'Termination', 'Other'), allowNull: false },
  recommend_company: { type: DataTypes.BOOLEAN, allowNull: false },
  rehire_eligible: { type: DataTypes.BOOLEAN, allowNull: false },
  confidential: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { sequelize, modelName: 'HrExitInterview', tableName: 'crm_hr_exit_interviews', timestamps: false });

class HrHeadcountSnapshot extends Model {}
HrHeadcountSnapshot.init({
  snapshot_id: { type: DataTypes.CHAR(36), primaryKey: true },
  snapshot_date: { type: DataTypes.DATEONLY, allowNull: false },
  snapshot_month: { type: DataTypes.DATEONLY, allowNull: false },
  total: { type: DataTypes.INTEGER, defaultValue: 0 },
  active: { type: DataTypes.INTEGER, defaultValue: 0 },
  inactive: { type: DataTypes.INTEGER, defaultValue: 0 },
  on_leave: { type: DataTypes.INTEGER, defaultValue: 0 },
}, { sequelize, modelName: 'HrHeadcountSnapshot', tableName: 'crm_hr_headcount_snapshots', timestamps: false });

// Column names match the schema the v1 API route (src/app/api/v1/[...path]/route.ts) actually
// creates and uses - this model previously described a different, never-created shape
// (document_type/file_url only) that no code path ever wrote to.
class HrEmployeeDocument extends Model {}
HrEmployeeDocument.init({
  document_id: { type: DataTypes.CHAR(36), primaryKey: true },
  employee_id: { type: DataTypes.CHAR(36), allowNull: false },
  document_type: { type: DataTypes.STRING(255), allowNull: false },
  document_url: { type: DataTypes.STRING(500), allowNull: false },
  expiry_date: { type: DataTypes.DATEONLY, allowNull: true },
  notes: { type: DataTypes.TEXT, allowNull: true },
  deleted_at: { type: DataTypes.DATE, allowNull: true },
  created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, { sequelize, modelName: 'HrEmployeeDocument', tableName: 'crm_hr_employee_documents', timestamps: false });

class ProCompany extends Model {}
ProCompany.init({
  company_id: { type: DataTypes.CHAR(36), primaryKey: true },
  company_name: { type: DataTypes.STRING(255), allowNull: false },
  mohre_employer_code: { type: DataTypes.STRING(255), allowNull: true },
  status: { type: DataTypes.ENUM('Active', 'Inactive'), defaultValue: 'Active' },
  deleted_at: { type: DataTypes.DATE, allowNull: true },
}, { sequelize, modelName: 'ProCompany', tableName: 'crm_pro_companies', timestamps: false });

class ProDocument extends Model {}
ProDocument.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  document_id: { type: DataTypes.CHAR(36), allowNull: true },
  company_id: { type: DataTypes.CHAR(36), allowNull: true },
  doc_type: { type: DataTypes.STRING(120), allowNull: true },
  expiry_date: { type: DataTypes.DATEONLY, allowNull: false },
  status: { type: DataTypes.ENUM('Valid', 'Expiring Soon', 'Expired', 'Renewal In Progress', 'Cancelled'), defaultValue: 'Valid' },
}, { sequelize, modelName: 'ProDocument', tableName: 'crm_pro_documents', timestamps: false });

class ProEmployeeImmigration extends Model {}
ProEmployeeImmigration.init({
  pro_emp_id: { type: DataTypes.CHAR(36), primaryKey: true },
  employee_id: { type: DataTypes.CHAR(36), allowNull: false },
  visa_uid: { type: DataTypes.STRING(255), allowNull: false },
  visa_type: { type: DataTypes.ENUM('Employment', 'Mission', 'Investor', 'Partner', 'Other'), allowNull: false },
  visa_expiry_date: { type: DataTypes.DATEONLY, allowNull: false },
  visa_status: { type: DataTypes.ENUM('Active', 'Expiring', 'Expired', 'Cancelled', 'Under Processing'), defaultValue: 'Active' },
  labour_card_no: { type: DataTypes.STRING(255), allowNull: false },
  labour_card_expiry: { type: DataTypes.DATEONLY, allowNull: false },
}, { sequelize, modelName: 'ProEmployeeImmigration', tableName: 'crm_pro_employee_immigration', timestamps: false });

class ProWpsRecord extends Model {}
ProWpsRecord.init({
  wps_id: { type: DataTypes.CHAR(36), primaryKey: true },
  payroll_month: { type: DataTypes.DATEONLY, allowNull: false },
  employer_code: { type: DataTypes.STRING(255), allowNull: false },
  agent_id: { type: DataTypes.STRING(255), allowNull: false },
  total_employees: { type: DataTypes.INTEGER, defaultValue: 0 },
  total_amount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  status: { type: DataTypes.ENUM('Draft', 'Generated', 'Submitted', 'Confirmed', 'Rejected'), defaultValue: 'Draft' },
  processed_by: { type: DataTypes.CHAR(36), allowNull: false },
}, { sequelize, modelName: 'ProWpsRecord', tableName: 'crm_pro_wps_records', timestamps: false });

class ProInsuranceRecord extends Model {}
ProInsuranceRecord.init({
  insurance_id: { type: DataTypes.CHAR(36), primaryKey: true },
  insurance_category: { type: DataTypes.ENUM('Health', 'Vehicle', 'Office', 'Workmen Compensation', 'Other'), defaultValue: 'Health' },
  insured_name: { type: DataTypes.STRING(255), allowNull: false },
  insurance_company: { type: DataTypes.STRING(255), allowNull: false },
  policy_number: { type: DataTypes.STRING(255), allowNull: false },
  policy_start: { type: DataTypes.DATEONLY, allowNull: false },
  policy_expiry: { type: DataTypes.DATEONLY, allowNull: false },
  status: { type: DataTypes.ENUM('Active', 'Expiring', 'Expired', 'Cancelled'), defaultValue: 'Active' },
}, { sequelize, modelName: 'ProInsuranceRecord', tableName: 'crm_pro_insurance_records', timestamps: false });

class ProGccBranchDocument extends Model {}
ProGccBranchDocument.init({
  branch_id: { type: DataTypes.CHAR(36), primaryKey: true },
  branch_name: { type: DataTypes.STRING(255), allowNull: false },
  country: { type: DataTypes.ENUM('UAE', 'Saudi Arabia', 'Qatar', 'Bahrain', 'Kuwait', 'Oman'), allowNull: false },
  city: { type: DataTypes.STRING(255), allowNull: false },
  registration_no: { type: DataTypes.STRING(255), allowNull: false },
  registration_expiry: { type: DataTypes.DATEONLY, allowNull: false },
  licence_type: { type: DataTypes.STRING(255), allowNull: false },
  licence_expiry: { type: DataTypes.DATEONLY, allowNull: false },
  status: { type: DataTypes.ENUM('Active', 'Inactive', 'Renewal Pending'), defaultValue: 'Active' },
}, { sequelize, modelName: 'ProGccBranchDocument', tableName: 'crm_pro_gcc_branch_documents', timestamps: false });

class ProOwnerDocument extends Model {}
ProOwnerDocument.init({
  owner_id: { type: DataTypes.CHAR(36), primaryKey: true },
  full_name: { type: DataTypes.STRING(255), allowNull: false },
  role: { type: DataTypes.ENUM('Owner', 'Partner', 'Investor', 'Director', 'Signatory'), allowNull: false },
  nationality: { type: DataTypes.STRING(255), allowNull: false },
  passport_no: { type: DataTypes.STRING(255), allowNull: false },
  passport_expiry: { type: DataTypes.DATEONLY, allowNull: false },
  access_level: { type: DataTypes.ENUM('Restricted'), defaultValue: 'Restricted' },
  deleted_at: { type: DataTypes.DATE, allowNull: true },
}, { sequelize, modelName: 'ProOwnerDocument', tableName: 'crm_pro_owner_documents', timestamps: false });

class ProMonthlyTask extends Model {}
ProMonthlyTask.init({
  task_id: { type: DataTypes.CHAR(36), primaryKey: true },
  task_month: { type: DataTypes.DATEONLY, allowNull: false },
  priority: { type: DataTypes.ENUM('Critical', 'High', 'Medium', 'Low'), allowNull: false },
  task_label: { type: DataTypes.STRING(255), allowNull: false },
  entity_type: { type: DataTypes.ENUM('Company', 'Employee', 'Insurance', 'Branch', 'Owner'), allowNull: false },
  entity_ref_id: { type: DataTypes.CHAR(36), allowNull: false },
  doc_type: { type: DataTypes.STRING(120), allowNull: false },
  expiry_date: { type: DataTypes.DATEONLY, allowNull: false },
  status: { type: DataTypes.ENUM('To Do', 'In Progress', 'Renewal Applied', 'Completed', 'On Hold'), defaultValue: 'To Do' },
  due_date: { type: DataTypes.DATEONLY, allowNull: false },
}, { sequelize, modelName: 'ProMonthlyTask', tableName: 'crm_pro_monthly_tasks', timestamps: false });

class NotificationLog extends Model {}
NotificationLog.init({
  log_id: { type: DataTypes.CHAR(36), primaryKey: true },
  source_module: { type: DataTypes.STRING(50), allowNull: false },
  document_type: { type: DataTypes.STRING(100), allowNull: false },
  record_id: { type: DataTypes.STRING(100), allowNull: false },
  threshold_days: { type: DataTypes.INTEGER, allowNull: false },
  expiry_date: { type: DataTypes.DATEONLY, allowNull: false },
  status: { type: DataTypes.ENUM('Sent', 'Skipped', 'Failed'), defaultValue: 'Sent' },
}, { sequelize, modelName: 'NotificationLog', tableName: 'notification_log', timestamps: false });

export {
  HrAttendanceRecord,
  HrLeaveRequest,
  HrLeaveBalance,
  HrEosbSettlement,
  HrPayslip,
  HrExitChecklist,
  HrExitChecklistItem,
  HrLetterTemplate,
  HrEmployeeLetter,
  HrExitInterview,
  HrHeadcountSnapshot,
  HrEmployeeDocument,
  ProCompany,
  ProDocument,
  ProEmployeeImmigration,
  ProWpsRecord,
  ProInsuranceRecord,
  ProGccBranchDocument,
  ProOwnerDocument,
  ProMonthlyTask,
  NotificationLog,
};
