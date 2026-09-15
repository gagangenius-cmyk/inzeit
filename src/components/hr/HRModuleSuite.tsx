'use client';

import { SearchableSelect } from '@/components/ui/searchable-select';
import { Drawer } from '@/components/ui/drawer';
import { PhotoDropzone } from '@/components/ui/photo-dropzone';
import { DataTable } from '@/components/ui/data-table';
import { useSortableData, SortableTh } from '@/components/ui/sortable-th';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, ComponentType, ReactNode } from 'react';
import {
  BadgeCheck,
  Banknote,
  CalendarCheck,
  ClipboardCheck,
  Download,
  FileBadge,
  FileText,
  KeyRound,
  MessageSquareText,
  Pencil,
  Plus,
  Power,
  PowerOff,
  Printer,
  Search,
  Trash2,
  Upload,
  UserCheck,
  Users,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

type ModuleKey =
  | 'employee-data-sheet'
  | 'attendance-management'
  | 'leave-management'
  | 'payroll-management'
  | 'eosb'
  | 'payslip-generation'
  | 'exit-checklist'
  | 'letters'
  | 'exit-interview';

type Employee = {
  id: number;
  name: string;
  email?: string | null;
  cemail?: string | null;
  mobile?: string | null;
  cmobile?: string | null;
  username?: string | null;
  photo?: string | null;
  department?: number | null;
  role?: number | null;
  branch?: number | null;
  region?: number | null;
  status: number;
  EID?: string | null;
  dob?: string | null;
  doj?: string | null;
  dol?: string | null;
  nationality?: string | null;
  gender?: string | null;
  ppNo?: string | null;
  visaExp?: string | null;
  address?: string | null;
  work_location?: string | null;
  work_country?: string | null;
  work_city?: string | null;
  work_site?: string | null;
  employment_type?: string | null;
};

type AttendanceRecord = {
  attendance_id: string;
  employee_id: string;
  employee_name?: string | null;
  date: string;
  check_in?: string | null;
  check_out?: string | null;
  status: 'Present' | 'Absent' | 'Late' | 'Half-Day' | 'Leave' | 'Holiday';
  overtime_hours?: number | string | null;
  source: 'Manual' | 'Biometric' | 'Import';
  notes?: string | null;
  approved_by?: string | null;
  approved_by_name?: string | null;
};

type LeaveRecord = {
  leave_id: string;
  employee_id: string;
  employee_name?: string | null;
  manager_id?: string | null;
  manager_name?: string | null;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  days_requested: number | string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
  workflow_status?: 'Manager Review' | 'HR Confirmation' | 'Completed' | 'Cancelled';
  reason?: string | null;
  medical_certificate_required?: boolean | number;
  document_url?: string | null;
  applied_at: string;
  manager_status?: 'Pending' | 'Approved' | 'Rejected';
  manager_reviewed_at?: string | null;
  manager_comment?: string | null;
  hr_status?: 'Pending' | 'Confirmed' | 'Overridden';
  reviewed_by?: string | null;
  reviewed_by_name?: string | null;
  reviewed_at?: string | null;
  review_notes?: string | null;
};

type LeaveType =
  | 'Annual Leave'
  | 'Sick Leave'
  | 'Emergency Leave'
  | 'Maternity Leave'
  | 'Paternity Leave'
  | 'Hajj Leave'
  | 'Bereavement Leave'
  | 'Unpaid Leave'
  | 'Compensatory Leave';

type LeaveEntitlement = {
  type: LeaveType;
  entitlementDays: number;
  category: string;
  notes: string;
};

type LeaveBalance = {
  balance_id: string;
  employee_id: string;
  leave_type: LeaveType;
  year: number;
  entitlement_days: number | string;
  used_days: number | string;
  pending_days: number | string;
  remaining_days: number | string;
};
type SeparationReason = 'Resignation' | 'Termination' | 'Retirement' | 'Death' | 'Mutual';
type EOSBSettlement = {
  eosb_id?: string;
  employee_id: string;
  employee_name?: string | null;
  joining_date: string;
  last_working_day: string;
  years_of_service: number | string;
  separation_reason: SeparationReason;
  last_basic_salary: number | string;
  eosb_amount: number | string;
  leave_balance_days: number | string;
  leave_encashment: number | string;
  unpaid_salary: number | string;
  total_payable: number | string;
  gratuity_days?: number | string;
  rule_applied?: string;
  approved_by?: string | null;
  approved_by_name?: string | null;
  settlement_date?: string | null;
  notes?: string | null;
};
type EmployeeSummary = {
  total: number;
  active: number;
  inactive: number;
  missingVisaDates: number;
  departments: number;
};
type PayslipRecord = {
  payslip_id: string;
  employee_id: string;
  employee_name?: string | null;
  pay_period: string;
  basic_salary: number | string;
  overtime_hours: number | string;
  overtime_amount: number | string;
  gross_salary: number | string;
  net_salary: number | string;
  currency_code?: string | null;
  bank_name?: string | null;
  masked_iban?: string | null;
  ytd_earnings: number | string;
  signed_url: string;
  signed_url_expires_at: string;
  generated_at: string;
};
type ExitChecklistRecord = {
  checklist_id: string;
  employee_id: string;
  employee_name?: string | null;
  separation_reason?: string | null;
  last_working_day?: string | null;
  status: 'Open' | 'Completed' | 'Cancelled';
  total_items: number | string;
  completed_items: number | string;
  waived_items: number | string;
  pending_items: number | string;
};
type ExitChecklistItem = {
  item_id: string;
  checklist_id: string;
  employee_id: string;
  department: string;
  item_text: string;
  owner_role: string;
  status: 'Pending' | 'Completed' | 'Waived';
  completed_by?: string | null;
  completed_by_name?: string | null;
  completed_at?: string | null;
  notes?: string | null;
  sort_order: number;
};
type LetterRecord = {
  letter_id: string;
  employee_id: string;
  employee_name?: string | null;
  letter_type: 'relieving' | 'experience';
  template_name?: string | null;
  ref_number: string;
  issue_date: string;
  last_working_day: string;
  designation?: string | null;
  department?: string | null;
  signed_url: string;
  signed_url_expires_at: string;
  generated_by_name?: string | null;
  generated_at: string;
};
type LetterTemplate = {
  template_id: string;
  letter_type: 'relieving' | 'experience';
  template_name: string;
  body_template: string;
  is_active: boolean | number;
};
type ExitInterviewRecord = {
  exit_id: string;
  employee_id: string;
  employee_name?: string | null;
  interview_date: string;
  conducted_by: string;
  conducted_by_name?: string | null;
  reason_leaving: ExitReasonLeaving;
  reason_details?: string | null;
  job_satisfaction: number | string;
  mgmt_satisfaction: number | string;
  work_env_rating: number | string;
  compensation_rating: number | string;
  growth_rating: number | string;
  recommend_company: boolean | number;
  rehire_eligible: boolean | number;
  feedback_text?: string | null;
  suggestions?: string | null;
  confidential: boolean | number;
};
type ExitReasonLeaving = 'Better Opportunity' | 'Salary' | 'Relocation' | 'Personal' | 'Termination' | 'Other';
type ExitInterviewAnalytics = {
  total: number;
  reasonBreakdown: Array<{ reason: ExitReasonLeaving; total: number }>;
  averages: {
    jobSatisfaction: number;
    management: number;
    workEnvironment: number;
    compensation: number;
    growth: number;
  };
  recommendPercent: number;
  rehireEligiblePercent: number;
};

const modules: Array<{
  key: ModuleKey;
  number: string;
  title: string;
  description: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  { key: 'employee-data-sheet', number: '4.1', title: 'Employee Data Sheet', description: 'Employee profile, joining, visa, contact, and emergency records.', href: '/admin/hr/employee-data-sheet', icon: Users },
  { key: 'attendance-management', number: '4.2', title: 'Attendance Management', description: 'Daily check-ins, total hours, shortfall, and overtime review.', href: '/admin/hr/attendance-management', icon: CalendarCheck },
  { key: 'leave-management', number: '4.3', title: 'Leave Management', description: 'Leave applications, approval status, balances, and history.', href: '/admin/hr/leave-management', icon: ClipboardCheck },
  { key: 'payroll-management', number: '4.4', title: 'Payroll Management', description: 'Salary components, deductions, net pay, and payroll approval.', href: '/admin/hr/payroll-management', icon: Banknote },
  { key: 'eosb', number: '4.5', title: 'End of Service Benefit (EOSB)', description: 'Gratuity estimate, tenure, final settlement, and exit dues.', href: '/admin/hr/eosb', icon: BadgeCheck },
  { key: 'payslip-generation', number: '4.6', title: 'Payslip Generation', description: 'Generate monthly payslips and export printable statements.', href: '/admin/hr/payslip-generation', icon: FileText },
  { key: 'exit-checklist', number: '4.7', title: 'Exit Checklist', description: 'Asset handover, access removal, finance clearance, and approvals.', href: '/admin/hr/exit-checklist', icon: UserCheck },
  { key: 'letters', number: '4.8', title: 'Relieving & Experience Letters', description: 'Draft HR letters with employee, role, tenure, and branch details.', href: '/admin/hr/letters', icon: FileBadge },
  { key: 'exit-interview', number: '4.9', title: 'Exit Interview & Feedback', description: 'Capture reasons, ratings, retention signals, and feedback notes.', href: '/admin/hr/exit-interview', icon: MessageSquareText },
];

const leaveTypeOptions: LeaveType[] = [
  'Annual Leave',
  'Sick Leave',
  'Emergency Leave',
  'Maternity Leave',
  'Paternity Leave',
  'Hajj Leave',
  'Bereavement Leave',
  'Unpaid Leave',
  'Compensatory Leave',
];
const separationReasons: SeparationReason[] = ['Resignation', 'Termination', 'Retirement', 'Death', 'Mutual'];
const exitLeavingReasons: ExitReasonLeaving[] = ['Better Opportunity', 'Salary', 'Relocation', 'Personal', 'Termination', 'Other'];
const workLocationOptions = ['Onshore', 'Offshore', 'Remote-UAE', 'GCC-Branch'] as const;
const employmentTypeOptions = ['Full-time', 'Contract', 'Freelance', 'Part-time'] as const;
const departmentOptions = [
  { value: '', label: 'Unassigned' },
  { value: '1', label: 'Sales' },
  { value: '2', label: 'Operations' },
  { value: '3', label: 'Admin' },
];

const formatDate = (value?: string | null) => {
  if (!value) return 'Not set';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
};

const formatMoney = (value: number) => (
  new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED', maximumFractionDigits: 0 }).format(value)
);

const yearsBetween = (start?: string | null, end = new Date()) => {
  if (!start) return 0;
  const startDate = new Date(start);
  if (Number.isNaN(startDate.getTime())) return 0;
  return Math.max(0, (end.getTime() - startDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
};

const estimateEOSB = (monthlyBasicSalary: number, yearsOfService: number, separationReason: SeparationReason = 'Termination') => {
  if (yearsOfService < 1) return 0;
  const dailyRate = monthlyBasicSalary / 30;
  let gratuityDays = 0;

  if (separationReason === 'Resignation') {
    if (yearsOfService < 3) gratuityDays = 21 * yearsOfService * (1 / 3);
    else if (yearsOfService < 5) gratuityDays = 21 * yearsOfService * (2 / 3);
    else gratuityDays = 21 * 5 + 30 * (yearsOfService - 5);
  } else if (yearsOfService <= 5) {
    gratuityDays = 21 * yearsOfService;
  } else {
    gratuityDays = 21 * 5 + 30 * (yearsOfService - 5);
  }

  return Math.round(dailyRate * gratuityDays);
};

const departmentName = (department?: number | null) => {
  if (department === 1) return 'Sales';
  if (department === 2) return 'Operations';
  if (department === 3) return 'Admin';
  return 'Unassigned';
};

const statusBadge = (status: string) => {
  const classes: Record<string, string> = {
    Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Present: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Manual: 'bg-slate-50 text-slate-700 border-slate-200',
    Biometric: 'bg-blue-50 text-blue-700 border-blue-200',
    Import: 'bg-violet-50 text-violet-700 border-violet-200',
    Pending: 'bg-amber-50 text-amber-700 border-amber-200',
    'Manager Review': 'bg-amber-50 text-amber-700 border-amber-200',
    'HR Confirmation': 'bg-sky-50 text-sky-700 border-sky-200',
    Late: 'bg-amber-50 text-amber-700 border-amber-200',
    'Half-Day': 'bg-amber-50 text-amber-700 border-amber-200',
    Leave: 'bg-sky-50 text-sky-700 border-sky-200',
    Holiday: 'bg-slate-50 text-slate-700 border-slate-200',
    Approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Overridden: 'bg-violet-50 text-violet-700 border-violet-200',
    Rejected: 'bg-rose-50 text-rose-700 border-rose-200',
    Cancelled: 'bg-slate-50 text-slate-700 border-slate-200',
    Review: 'bg-sky-50 text-sky-700 border-sky-200',
    Draft: 'bg-slate-50 text-slate-700 border-slate-200',
    Complete: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Open: 'bg-sky-50 text-sky-700 border-sky-200',
    Waived: 'bg-violet-50 text-violet-700 border-violet-200',
    'Checked In': 'bg-sky-50 text-sky-700 border-sky-200',
    Absent: 'bg-rose-50 text-rose-700 border-rose-200',
    Inactive: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  return (
    <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${classes[status] || classes.Draft}`}>
      {status}
    </span>
  );
};

export default function HRModuleSuite({ activeModule = 'employee-data-sheet' }: { activeModule?: ModuleKey }) {
  const { hasPermission, currencyCode } = useAuth();
  // Shadows the module-level formatMoney so it shows the logged-in user's own
  // branch currency instead of a hardcoded 'AED'.
  const formatMoney = (value: number, targetCurrency = currencyCode) => {
    try {
      return new Intl.NumberFormat('en-AE', { style: 'currency', currency: targetCurrency, maximumFractionDigits: 0 }).format(value);
    } catch {
      return `${targetCurrency} ${Number(value || 0).toLocaleString()}`;
    }
  };
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeSummary, setEmployeeSummary] = useState<EmployeeSummary | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [attendanceFilters, setAttendanceFilters] = useState({ employeeId: '', branch: '', dateFrom: '', dateTo: '' });
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [leaveEntitlements, setLeaveEntitlements] = useState<LeaveEntitlement[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  // Dropdown options, sourced from crm_leave_type (falls back to the static
  // leaveTypeOptions list below if the fetch fails or the table is empty).
  const [availableLeaveTypes, setAvailableLeaveTypes] = useState<string[]>([]);
  const [eosbSettlements, setEosbSettlements] = useState<EOSBSettlement[]>([]);
  const [eosbPreview, setEosbPreview] = useState<EOSBSettlement | null>(null);
  const [payslips, setPayslips] = useState<PayslipRecord[]>([]);
  const [exitChecklists, setExitChecklists] = useState<ExitChecklistRecord[]>([]);
  const [exitChecklistItems, setExitChecklistItems] = useState<ExitChecklistItem[]>([]);
  const [letters, setLetters] = useState<LetterRecord[]>([]);
  const [letterTemplates, setLetterTemplates] = useState<LetterTemplate[]>([]);
  const [exitInterviews, setExitInterviews] = useState<ExitInterviewRecord[]>([]);
  const [exitInterviewAnalytics, setExitInterviewAnalytics] = useState<ExitInterviewAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [employeeFormBusy, setEmployeeFormBusy] = useState(false);
  const [employeeImporting, setEmployeeImporting] = useState(false);
  const [employeeImportMessage, setEmployeeImportMessage] = useState('');
  const employeeImportInputRef = useRef<HTMLInputElement>(null);
  const [formBusy, setFormBusy] = useState(false);
  const [formError, setFormError] = useState('');

  // Every drawer form's fetch response gets funneled through this so a
  // rejected submit (permission, validation, DB error) shows a message
  // instead of the drawer just silently staying open with no feedback.
  const parseFormError = async (response: Response, fallback: string) => {
    try {
      const json = await response.json();
      return typeof json?.error === 'string' ? json.error : fallback;
    } catch {
      return fallback;
    }
  };
  const FormErrorBanner = () => (
    formError ? (
      <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</div>
    ) : null
  );
  const [payrollCurrency, setPayrollCurrency] = useState(currencyCode || 'AED');
  const emptyEmployeeForm = {
    name: '',
    email: '',
    cemail: '',
    mobile: '',
    cmobile: '',
    photo: '',
    username: '',
    password: '',
    dob: '',
    department: '',
    role: '',
    branch: '',
    region: '',
    status: '1',
    EID: '',
    doj: new Date().toISOString().slice(0, 10),
    nationality: '',
    gender: '',
    ppNo: '',
    visaExp: '',
    address: '',
    work_location: 'Onshore',
    work_country: 'UAE',
    work_city: '',
    work_site: '',
    employment_type: 'Full-time',
  };
  const [employeeForm, setEmployeeForm] = useState(emptyEmployeeForm);
  const [roleOptions, setRoleOptions] = useState<{ id: number; name: string }[]>([]);
  const [branchOptions, setBranchOptions] = useState<{ id: number; name: string }[]>([]);
  const [regionOptions, setRegionOptions] = useState<{ id: number; name: string }[]>([]);
  const [query, setQuery] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [attendanceForm, setAttendanceForm] = useState({
    employee_id: '',
    date: new Date().toISOString().slice(0, 10),
    check_in: '',
    check_out: '',
    status: 'Present' as AttendanceRecord['status'],
    overtime_hours: '0',
    source: 'Manual' as AttendanceRecord['source'],
    notes: '',
    approved_by: '',
  });
  const [leaveForm, setLeaveForm] = useState({
    employee_id: '',
    manager_id: '',
    leave_type: 'Annual Leave' as LeaveType,
    start_date: new Date().toISOString().slice(0, 10),
    end_date: new Date().toISOString().slice(0, 10),
    reason: '',
    document_url: '',
  });
  const [compOffCreditDays, setCompOffCreditDays] = useState('');
  const [creditingCompOff, setCreditingCompOff] = useState(false);
  const [eosbForm, setEosbForm] = useState({
    employee_id: '',
    last_working_day: new Date().toISOString().slice(0, 10),
    separation_reason: 'Termination' as SeparationReason,
    last_basic_salary: '12000',
    unpaid_salary: '0',
    approved_by: '',
    settlement_date: '',
    notes: '',
  });
  const [payslipForm, setPayslipForm] = useState({
    employee_id: '',
    pay_year: String(new Date().getFullYear()),
    pay_month: String(new Date().getMonth() + 1),
    designation: 'Employee',
    department: '',
    currency_code: '',
    basic_salary: '12000',
    housing_allowance: '1500',
    transport_allowance: '900',
    other_allowance: '0',
    overtime_hours: '0',
    overtime_amount: '0',
    deduction_label: 'Deductions',
    deduction_amount: '750',
    bank_name: '',
    iban: '',
    ytd_earnings: '0',
    authorised_by: '',
  });

  // Pre-fills from the employee's saved compensation record (if any) instead of forcing
  // blank re-entry of salary/currency/bank details every time a payslip is generated.
  useEffect(() => {
    if (!payslipForm.employee_id) return;
    let cancelled = false;
    fetch(`/api/admin/hr/compensation?employee_id=${payslipForm.employee_id}`)
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        const compensation = json.compensation as { basic_salary?: number; currency_code?: string; bank_name?: string | null; iban?: string | null } | null;
        setPayslipForm((form) => ({
          ...form,
          basic_salary: compensation?.basic_salary == null ? form.basic_salary : String(compensation.basic_salary),
          currency_code: (compensation?.currency_code || json.defaultCurrency || '').toUpperCase(),
          bank_name: compensation?.bank_name || '',
          iban: compensation?.iban || '',
        }));
      })
      .catch(() => {});
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payslipForm.employee_id]);
  const [exitChecklistForm, setExitChecklistForm] = useState({
    employee_id: '',
    separation_reason: 'Resignation',
    last_working_day: new Date().toISOString().slice(0, 10),
    assigned_by: '',
  });
  const [letterForm, setLetterForm] = useState({
    employee_id: '',
    letter_type: 'experience' as 'relieving' | 'experience',
    designation: 'Employee',
    department: '',
    last_working_day: new Date().toISOString().slice(0, 10),
    hr_manager_name: 'HR Manager',
    hr_manager_designation: 'HR Manager',
    issue_date: new Date().toISOString().slice(0, 10),
    key_responsibilities: 'Handled assigned responsibilities as per role requirements.',
    performance_summary: 'Maintained professional conduct and satisfactory performance.',
    recommendation_statement: 'We wish the employee success in future endeavours.',
    generated_by: '',
  });
  const [exitInterviewForm, setExitInterviewForm] = useState({
    employee_id: '',
    interview_date: new Date().toISOString().slice(0, 10),
    conducted_by: '',
    reason_leaving: 'Better Opportunity' as ExitReasonLeaving,
    reason_details: '',
    job_satisfaction: '3',
    mgmt_satisfaction: '3',
    work_env_rating: '3',
    compensation_rating: '3',
    growth_rating: '3',
    recommend_company: true,
    rehire_eligible: true,
    feedback_text: '',
    suggestions: '',
    confidential: true,
  });

  useEffect(() => {
    if (currencyCode) setPayrollCurrency((current) => (current === 'AED' && currencyCode !== 'AED' ? currencyCode : current || currencyCode));
  }, [currencyCode]);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [rolesResponse, branchesResponse, regionsResponse] = await Promise.all([
          fetch('/api/admin/roles?limit=100&status=1'),
          fetch('/api/admin/branches?limit=200&status=1'),
          fetch('/api/admin/regions?limit=200&status=1'),
        ]);
        const rolesJson = rolesResponse.ok ? await rolesResponse.json() : null;
        const branchesJson = branchesResponse.ok ? await branchesResponse.json() : null;
        const regionsJson = regionsResponse.ok ? await regionsResponse.json() : null;
        setRoleOptions((rolesJson?.data || []).map((r: any) => ({ id: r.id, name: r.name })));
        setBranchOptions((branchesJson?.data || []).map((b: any) => ({ id: b.id, name: b.branch })));
        setRegionOptions((regionsJson?.data || []).map((r: any) => ({ id: r.id, name: r.name })));
      } catch (error) {
        console.error('Failed to load roles/branches/regions:', error);
      }
    };
    loadOptions();
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const [employeeResponse, attendanceResponse, leaveResponse, eosbResponse, payslipResponse, exitChecklistResponse, letterResponse, exitInterviewResponse, leaveTypesResponse] = await Promise.all([
          fetch('/api/admin/employees?limit=100'),
          fetch('/api/admin/hr/attendance?limit=100'),
          fetch('/api/admin/hr/leave?limit=100'),
          fetch('/api/admin/hr/eosb?limit=100'),
          fetch('/api/admin/hr/payslips?limit=100'),
          fetch('/api/admin/hr/exit-checklist?limit=100'),
          fetch('/api/admin/hr/letters?limit=100'),
          fetch('/api/admin/hr/exit-interviews?limit=100'),
          fetch('/api/hr/leave-types'),
        ]);

        const employeeJson = employeeResponse.ok ? await employeeResponse.json() : null;
        const attendanceJson = attendanceResponse.ok ? await attendanceResponse.json() : null;
        const leaveJson = leaveResponse.ok ? await leaveResponse.json() : null;
        const eosbJson = eosbResponse.ok ? await eosbResponse.json() : null;
        const payslipJson = payslipResponse.ok ? await payslipResponse.json() : null;
        const exitChecklistJson = exitChecklistResponse.ok ? await exitChecklistResponse.json() : null;
        const letterJson = letterResponse.ok ? await letterResponse.json() : null;
        const exitInterviewJson = exitInterviewResponse.ok ? await exitInterviewResponse.json() : null;
        const leaveTypesJson = leaveTypesResponse.ok ? await leaveTypesResponse.json() : null;

        const loadedEmployees = employeeJson?.data || [];
        setEmployees(loadedEmployees);
        setEmployeeSummary(employeeJson?.summary || null);
        setSelectedEmployeeId(loadedEmployees[0]?.id || null);
        setAttendanceForm((previous) => ({
          ...previous,
          employee_id: String(loadedEmployees[0]?.id || ''),
        }));
        setLeaveForm((previous) => ({
          ...previous,
          employee_id: String(loadedEmployees[0]?.id || ''),
          manager_id: String(loadedEmployees[1]?.id || loadedEmployees[0]?.id || ''),
        }));
        setEosbForm((previous) => ({
          ...previous,
          employee_id: String(loadedEmployees[0]?.id || ''),
          approved_by: String(loadedEmployees[0]?.id || ''),
        }));
        setPayslipForm((previous) => ({
          ...previous,
          employee_id: String(loadedEmployees[0]?.id || ''),
          department: departmentName(loadedEmployees[0]?.department),
          authorised_by: String(loadedEmployees[0]?.id || ''),
        }));
        setExitChecklistForm((previous) => ({
          ...previous,
          employee_id: String(loadedEmployees[0]?.id || ''),
          assigned_by: String(loadedEmployees[0]?.id || ''),
        }));
        setLetterForm((previous) => ({
          ...previous,
          employee_id: String(loadedEmployees[0]?.id || ''),
          department: departmentName(loadedEmployees[0]?.department),
          generated_by: String(loadedEmployees[0]?.id || ''),
        }));
        setExitInterviewForm((previous) => ({
          ...previous,
          employee_id: String(loadedEmployees[0]?.id || ''),
          conducted_by: String(loadedEmployees[0]?.id || ''),
        }));
        setAttendance(attendanceJson?.data || []);
        setLeaves(leaveJson?.requests || []);
        setLeaveEntitlements(leaveJson?.entitlements || []);
        setLeaveBalances(leaveJson?.balances || []);
        setAvailableLeaveTypes(leaveTypesJson?.leaveTypes || []);
        setEosbSettlements(eosbJson?.settlements || []);
        setPayslips(payslipJson?.payslips || []);
        setExitChecklists(exitChecklistJson?.checklists || []);
        setExitChecklistItems(exitChecklistJson?.items || []);
        setLetters(letterJson?.letters || []);
        setLetterTemplates(letterJson?.templates || []);
        setExitInterviews(exitInterviewJson?.interviews || []);
        setExitInterviewAnalytics(exitInterviewJson?.analytics || null);
      } catch (error) {
        console.error('Failed to load HR module data:', error);
        setEmployees([]);
        setEmployeeSummary(null);
        setLoadError('Unable to load HR records from the database.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const filteredEmployees = useMemo(() => {
    const needle = query.toLowerCase().trim();
    if (!needle) return employees;
    return employees.filter((employee) => (
      employee.name.toLowerCase().includes(needle) ||
      employee.email?.toLowerCase().includes(needle) ||
      employee.EID?.toLowerCase().includes(needle) ||
      employee.mobile?.toLowerCase().includes(needle)
    ));
  }, [employees, query]);
  const { sorted: sortedEmployeeRows, sortKey: employeeSortKey, sortDirection: employeeSortDirection, toggleSort: toggleEmployeeSort } = useSortableData(
    filteredEmployees,
    {
      employee: (employee) => employee.name,
      department: (employee) => departmentName(employee.department),
      joining: (employee) => employee.doj,
      contact: (employee) => employee.mobile || employee.email,
      visaExpiry: (employee) => employee.visaExp,
      status: (employee) => employee.status,
    },
  );
  const payrollCurrencies = useMemo(() => {
    const currencies = new Set<string>([currencyCode || 'AED']);
    payslips.forEach((payslip) => {
      if (payslip.currency_code) currencies.add(String(payslip.currency_code).toUpperCase());
    });
    if (payslipForm.currency_code) currencies.add(payslipForm.currency_code.toUpperCase());
    ['AED', 'QAR', 'SAR', 'OMR', 'KWD', 'BHD', 'USD', 'INR'].forEach((code) => currencies.add(code));
    return Array.from(currencies).sort();
  }, [currencyCode, payslipForm.currency_code, payslips]);

  const selectedEmployee = employees.find((employee) => employee.id === selectedEmployeeId) || employees[0] || null;
  const activeMeta = modules.find((item) => item.key === activeModule) || modules[0];
  const averageHours = attendance.length
    ? attendance.reduce((sum, record) => sum + Number(record.overtime_hours || 0), 0) / attendance.length
    : 0;
  const pendingLeaves = leaves.filter((leave) => leave.status === 'Pending').length;
  const selectedPayrollPayslips = payslips.filter((payslip) => (payslip.currency_code || 'AED').toUpperCase() === payrollCurrency.toUpperCase());
  const payrollTotals = selectedPayrollPayslips.reduce((totals, payslip) => {
    const basic = Number(payslip.basic_salary || 0);
    const gross = Number(payslip.gross_salary || 0);
    const net = Number(payslip.net_salary || 0);
    return {
      basic: totals.basic + basic,
      allowances: totals.allowances + Math.max(gross - basic, 0),
      deductions: totals.deductions + Math.max(gross - net, 0),
      net: totals.net + net,
    };
  }, { basic: 0, allowances: 0, deductions: 0, net: 0 });
  const monthlyBase = payrollTotals.basic;
  const allowances = payrollTotals.allowances;
  const deductions = payrollTotals.deductions;
  const netPay = payrollTotals.net;
  const eosbYears = yearsBetween(selectedEmployee?.doj);
  const selectedEmployeeLatestPayslip = payslips
    .filter((payslip) => payslip.employee_id === String(selectedEmployee?.id || ''))
    .sort((a, b) => new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime())[0];
  const eosbEstimate = estimateEOSB(Number(selectedEmployeeLatestPayslip?.basic_salary || 0), eosbYears, eosbForm.separation_reason);
  const canCreate = hasPermission('hr.create');
  const canUpdate = hasPermission('hr.update');
  const canDelete = hasPermission('hr.delete');
  const canCreateOrUpdate = canCreate || canUpdate;
  const canManageEosb = hasPermission('hr.eosb');
  const canManagePayroll = hasPermission('hr.payroll');
  const canUseAddForm =
    (activeModule === 'employee-data-sheet' && canCreate) ||
    (activeModule === 'leave-management' && canCreate) ||
    (['attendance-management', 'exit-checklist', 'letters', 'exit-interview'].includes(activeModule) && canCreateOrUpdate) ||
    (activeModule === 'eosb' && canManageEosb) ||
    (activeModule === 'payslip-generation' && canManagePayroll);
  const canViewCurrentModule = hasPermission('hr.view') ||
    (['payroll-management', 'payslip-generation'].includes(activeModule) && canManagePayroll) ||
    (activeModule === 'eosb' && canManageEosb) ||
    (['attendance-management', 'leave-management'].includes(activeModule) && hasPermission('hr.team.attendance_leave')) ||
    (activeModule === 'employee-data-sheet' && hasPermission('hr.self')) ||
    (['exit-checklist', 'letters', 'exit-interview'].includes(activeModule) && canCreateOrUpdate);

  if (!canViewCurrentModule) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
        <h1 className="text-2xl font-semibold text-slate-950">HR access required</h1>
        <p className="mt-2 text-sm text-slate-600">Your role does not include access to this HR module.</p>
      </div>
    );
  }

  const openCreateEmployee = () => {
    setEditingEmployee(null);
    setEmployeeForm(emptyEmployeeForm);
    setShowAddForm(true);
  };

  const openEditEmployee = (employee: Employee) => {
    setFormError('');
    setEditingEmployee(employee);
    setEmployeeForm({
      name: employee.name || '',
      email: employee.email || '',
      cemail: employee.cemail || '',
      mobile: employee.mobile || '',
      cmobile: employee.cmobile || '',
      photo: employee.photo || '',
      username: employee.username || '',
      password: '',
      dob: employee.dob ? employee.dob.slice(0, 10) : '',
      department: employee.department ? String(employee.department) : '',
      role: employee.role ? String(employee.role) : '',
      branch: employee.branch ? String(employee.branch) : '',
      region: employee.region ? String(employee.region) : '',
      status: String(employee.status ?? 1),
      EID: employee.EID || '',
      doj: employee.doj ? employee.doj.slice(0, 10) : new Date().toISOString().slice(0, 10),
      nationality: employee.nationality || '',
      gender: employee.gender || '',
      ppNo: employee.ppNo || '',
      visaExp: employee.visaExp ? employee.visaExp.slice(0, 10) : '',
      address: employee.address || '',
      work_location: employee.work_location || 'Onshore',
      work_country: employee.work_country || 'UAE',
      work_city: employee.work_city || '',
      work_site: employee.work_site || '',
      employment_type: employee.employment_type || 'Full-time',
    });
    setShowAddForm(true);
  };

  const toggleEmployeeStatus = async (employee: Employee) => {
    const activating = employee.status !== 1;
    if (!activating && !confirm(`Deactivate ${employee.name}? They will be marked inactive.`)) return;
    const response = await fetch('/api/admin/employees', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: employee.id, status: activating ? 1 : 0 }),
    });
    if (response.ok) await refreshEmployeeData();
  };

  const resetEmployeePassword = async (employee: Employee) => {
    if (!confirm(`Reset the login password for ${employee.name}? A new password will be generated and emailed to their company email.`)) return;
    const response = await fetch('/api/admin/employees/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: employee.id }),
    });
    const result = await response.json().catch(() => ({}));
    if (response.ok) {
      alert(
        result.emailSent
          ? `Password reset and emailed to ${result.recipient}.\n\nNew password (shown once): ${result.newPassword}`
          : `Password reset, but the email could not be sent (no address on file or mail delivery failed).\n\nNew password (shown once, share this with the employee): ${result.newPassword}`
      );
    } else {
      alert(result.error || 'Failed to reset password');
    }
  };

  const handleEmployeeImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const ext = `.${file.name.split('.').pop()?.toLowerCase() || ''}`;
    if (!['.xlsx', '.xls', '.csv'].includes(ext)) {
      setEmployeeImportMessage('Please choose an Excel or CSV file.');
      event.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setEmployeeImportMessage('File size must be less than 5MB.');
      event.target.value = '';
      return;
    }

    setEmployeeImporting(true);
    setEmployeeImportMessage('');
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || '').split(',')[1] || '');
        reader.onerror = () => reject(new Error('Could not read the selected file'));
        reader.readAsDataURL(file);
      });

      const response = await fetch('/api/admin/employees/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileData: base64 }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        setEmployeeImportMessage(result.error || 'Employee import failed.');
        return;
      }

      await refreshEmployeeData();
      const errorText = Array.isArray(result.errors) && result.errors.length
        ? ` First issue: row ${result.errors[0].row} - ${result.errors[0].error}`
        : '';
      setEmployeeImportMessage(`${result.message || 'Employee import complete.'}${errorText}`);
    } catch (error) {
      setEmployeeImportMessage(error instanceof Error ? error.message : 'Employee import failed.');
    } finally {
      setEmployeeImporting(false);
      event.target.value = '';
    }
  };

  const renderEmployeeSheet = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {[
          ['Active employees', employeeSummary?.active ?? employees.filter((employee) => employee.status === 1).length],
          ['Departments', employeeSummary?.departments ?? new Set(employees.map((employee) => employee.department || 0)).size],
          ['Missing visa dates', employeeSummary?.missingVisaDates ?? employees.filter((employee) => !employee.visaExp).length],
          ['Remote/office records', employeeSummary?.total ?? employees.length],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
          </div>
        ))}
      </div>

      {canCreate && (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-950">Bulk employee upload</h2>
              <p className="mt-1 text-xs text-slate-500">Download the sample, fill employee rows, then upload it here.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={employeeImportInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleEmployeeImport}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => { window.location.href = '/api/admin/employees/sample-template'; }}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Download className="h-4 w-4" />
                Download Sample
              </button>
              <button
                type="button"
                onClick={() => employeeImportInputRef.current?.click()}
                disabled={employeeImporting}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <Upload className="h-4 w-4" />
                {employeeImporting ? 'Uploading...' : 'Bulk Upload'}
              </button>
            </div>
          </div>
          {employeeImportMessage && (
            <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {employeeImportMessage}
            </div>
          )}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <SortableTh label="Employee" sortKey="employee" activeKey={employeeSortKey} direction={employeeSortDirection} onSort={toggleEmployeeSort} className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500" />
              <SortableTh label="Department" sortKey="department" activeKey={employeeSortKey} direction={employeeSortDirection} onSort={toggleEmployeeSort} className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500" />
              <SortableTh label="Joining" sortKey="joining" activeKey={employeeSortKey} direction={employeeSortDirection} onSort={toggleEmployeeSort} className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500" />
              <SortableTh label="Contact" sortKey="contact" activeKey={employeeSortKey} direction={employeeSortDirection} onSort={toggleEmployeeSort} className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500" />
              <SortableTh label="Visa Expiry" sortKey="visaExpiry" activeKey={employeeSortKey} direction={employeeSortDirection} onSort={toggleEmployeeSort} className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500" />
              <SortableTh label="Status" sortKey="status" activeKey={employeeSortKey} direction={employeeSortDirection} onSort={toggleEmployeeSort} className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500" />
              {canUpdate && <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedEmployeeRows.map((employee) => (
              <tr key={employee.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-xs font-semibold text-slate-500">
                      {employee.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={employee.photo} alt="" className="h-full w-full object-cover" />
                      ) : (
                        employee.name?.charAt(0)?.toUpperCase() || '?'
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-slate-950">{employee.name}</div>
                      <div className="text-xs text-slate-500">{employee.EID || `#${employee.id}`} · {employee.nationality || 'Nationality not set'}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-slate-700">{departmentName(employee.department)}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{formatDate(employee.doj)}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{employee.mobile || employee.email || 'Not set'}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{formatDate(employee.visaExp)}</td>
                <td className="px-4 py-3">{statusBadge(employee.status === 1 ? 'Active' : 'Inactive')}</td>
                {canUpdate && (
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditEmployee(employee)}
                        className="rounded-md border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 hover:text-blue-700"
                        title="Edit employee"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleEmployeeStatus(employee)}
                        className={`rounded-md border border-slate-200 p-1.5 hover:bg-slate-50 ${employee.status === 1 ? 'text-slate-500 hover:text-rose-700' : 'text-slate-500 hover:text-emerald-700'}`}
                        title={employee.status === 1 ? 'Deactivate employee' : 'Activate employee'}
                      >
                        {employee.status === 1 ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => resetEmployeePassword(employee)}
                        className="rounded-md border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 hover:text-amber-700"
                        title="Reset login password"
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderEmployeeForm = () => (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        setEmployeeFormBusy(true);
        setFormError('');
        try {
          const payload = {
            ...employeeForm,
            department: employeeForm.department || null,
            role: employeeForm.role || null,
            branch: employeeForm.branch || null,
            region: employeeForm.region || null,
            status: Number(employeeForm.status),
            dob: employeeForm.dob || null,
            doj: employeeForm.doj || null,
            visaExp: employeeForm.visaExp || null,
            photo: employeeForm.photo || null,
            wfh: employeeForm.work_location === 'Onshore' ? 0 : 1,
          };

          const response = editingEmployee
            ? await fetch('/api/admin/employees', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...payload, id: editingEmployee.id }),
              })
            : await fetch('/api/admin/employees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
              });

          if (response.ok) {
            const saved = await response.json() as Employee | null;
            await refreshEmployeeData();
            setSelectedEmployeeId(saved?.id || selectedEmployeeId);
            setEditingEmployee(null);
            setEmployeeForm(emptyEmployeeForm);
            setShowAddForm(false);
          } else {
            setFormError(await parseFormError(response, 'Failed to save employee record'));
          }
        } finally {
          setEmployeeFormBusy(false);
        }
      }}
    >
      <FormErrorBanner />
      <div className="grid grid-cols-1 gap-4">
        <PhotoDropzone
          label="Employee Photo"
          value={employeeForm.photo}
          onChange={(url) => setEmployeeForm({ ...employeeForm, photo: url })}
          pathPrefix={`employees/${editingEmployee?.id || 'new'}`}
        />
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Employee Name</span>
          <input value={employeeForm.name} onChange={(event) => setEmployeeForm({ ...employeeForm, name: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Personal Email</span>
          <input type="email" value={employeeForm.email} onChange={(event) => setEmployeeForm({ ...employeeForm, email: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Company Email</span>
          <input type="email" value={employeeForm.cemail} onChange={(event) => setEmployeeForm({ ...employeeForm, cemail: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Mobile</span>
          <input value={employeeForm.mobile} onChange={(event) => setEmployeeForm({ ...employeeForm, mobile: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Company Mobile</span>
          <input value={employeeForm.cmobile} onChange={(event) => setEmployeeForm({ ...employeeForm, cmobile: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Employee ID</span>
          <input value={employeeForm.EID} onChange={(event) => setEmployeeForm({ ...employeeForm, EID: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">CRM Username</span>
          <input value={employeeForm.username} onChange={(event) => setEmployeeForm({ ...employeeForm, username: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Login ID" autoComplete="off" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">{editingEmployee ? 'Set New Password' : 'CRM Password'}</span>
          <input type="password" value={employeeForm.password} onChange={(event) => setEmployeeForm({ ...employeeForm, password: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder={editingEmployee ? 'Leave blank to keep current password' : 'Login password'} autoComplete="new-password" />
          {employeeForm.password && <p className="mt-1 text-xs text-slate-500">The employee will be asked to change this password on their first login.</p>}
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Department</span>
          <SearchableSelect value={employeeForm.department} onChange={(event) => setEmployeeForm({ ...employeeForm, department: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
            {departmentOptions.map((department) => <option key={department.value || 'none'} value={department.value}>{department.label}</option>)}
          </SearchableSelect>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Role</span>
          <SearchableSelect value={employeeForm.role} onChange={(event) => setEmployeeForm({ ...employeeForm, role: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="">Unassigned</option>
            {roleOptions.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
          </SearchableSelect>
          <p className="mt-1 text-xs text-slate-500">Permissions and module access are applied automatically from this role.</p>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Branch</span>
          <SearchableSelect required value={employeeForm.branch} onChange={(event) => setEmployeeForm({ ...employeeForm, branch: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="">Select a branch</option>
            {branchOptions.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
          </SearchableSelect>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Region</span>
          <SearchableSelect required value={employeeForm.region} onChange={(event) => setEmployeeForm({ ...employeeForm, region: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="">Select a region</option>
            {regionOptions.map((region) => <option key={region.id} value={region.id}>{region.name}</option>)}
          </SearchableSelect>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Status</span>
          <SearchableSelect value={employeeForm.status} onChange={(event) => setEmployeeForm({ ...employeeForm, status: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="1">Active</option>
            <option value="0">Inactive</option>
          </SearchableSelect>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Date of Birth</span>
          <input type="date" value={employeeForm.dob} onChange={(event) => setEmployeeForm({ ...employeeForm, dob: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Date of Joining</span>
          <input type="date" value={employeeForm.doj} onChange={(event) => setEmployeeForm({ ...employeeForm, doj: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Visa Expiry</span>
          <input type="date" value={employeeForm.visaExp} onChange={(event) => setEmployeeForm({ ...employeeForm, visaExp: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Nationality</span>
          <input value={employeeForm.nationality} onChange={(event) => setEmployeeForm({ ...employeeForm, nationality: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Gender</span>
          <SearchableSelect value={employeeForm.gender} onChange={(event) => setEmployeeForm({ ...employeeForm, gender: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="">Not set</option>
            <option value="Female">Female</option>
            <option value="Male">Male</option>
            <option value="Other">Other</option>
          </SearchableSelect>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Passport Number</span>
          <input value={employeeForm.ppNo} onChange={(event) => setEmployeeForm({ ...employeeForm, ppNo: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Work Location</span>
          <SearchableSelect value={employeeForm.work_location} onChange={(event) => setEmployeeForm({ ...employeeForm, work_location: event.target.value, work_country: event.target.value === 'Onshore' ? 'UAE' : employeeForm.work_country })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
            {workLocationOptions.map((location) => <option key={location}>{location}</option>)}
          </SearchableSelect>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Employment Type</span>
          <SearchableSelect value={employeeForm.employment_type} onChange={(event) => setEmployeeForm({ ...employeeForm, employment_type: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
            {employmentTypeOptions.map((type) => <option key={type}>{type}</option>)}
          </SearchableSelect>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Work Country</span>
          <input value={employeeForm.work_country} onChange={(event) => setEmployeeForm({ ...employeeForm, work_country: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Work City</span>
          <input value={employeeForm.work_city} onChange={(event) => setEmployeeForm({ ...employeeForm, work_city: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Work Site</span>
          <input value={employeeForm.work_site} onChange={(event) => setEmployeeForm({ ...employeeForm, work_site: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label className="block md:col-span-2">
          <span className="text-sm font-medium text-slate-700">Address</span>
          <input value={employeeForm.address} onChange={(event) => setEmployeeForm({ ...employeeForm, address: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </label>
      </div>
      <div className="mt-4 flex justify-end">
        <button type="submit" disabled={employeeFormBusy} className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
          {employeeFormBusy ? 'Saving…' : editingEmployee ? 'Update HR Record' : 'Save HR Record'}
        </button>
      </div>
    </form>
  );

  const deleteAttendanceRecord = async (attendanceId: string) => {
    if (!confirm('Delete this attendance record?')) return;
    const response = await fetch(`/api/admin/hr/attendance?attendance_id=${encodeURIComponent(attendanceId)}`, { method: 'DELETE' });
    if (response.ok) await refreshAttendance();
  };

  const renderAttendance = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Metric label="Records" value={attendance.length.toString()} />
        <Metric label="Average overtime" value={averageHours.toFixed(1)} />
        <Metric label="Manager overrides" value={attendance.filter((record) => record.approved_by || record.notes).length.toString()} />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div>
            <label className="block text-xs font-medium text-slate-500">Counselor</label>
            <SearchableSelect
              value={attendanceFilters.employeeId}
              onChange={(event) => setAttendanceFilters({ ...attendanceFilters, employeeId: event.target.value })}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">All counselors</option>
              {employees.map((employee) => (
                <option key={employee.id} value={String(employee.id)}>{employee.name}</option>
              ))}
            </SearchableSelect>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500">Branch</label>
            <SearchableSelect
              value={attendanceFilters.branch}
              onChange={(event) => setAttendanceFilters({ ...attendanceFilters, branch: event.target.value })}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">All branches</option>
              {branchOptions.map((branch) => (
                <option key={branch.id} value={String(branch.id)}>{branch.name}</option>
              ))}
            </SearchableSelect>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500">Date from</label>
            <input
              type="date"
              value={attendanceFilters.dateFrom}
              onChange={(event) => setAttendanceFilters({ ...attendanceFilters, dateFrom: event.target.value })}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500">Date to</label>
            <input
              type="date"
              value={attendanceFilters.dateTo}
              onChange={(event) => setAttendanceFilters({ ...attendanceFilters, dateTo: event.target.value })}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => refreshAttendance()}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Apply Filters
          </button>
          <button
            type="button"
            onClick={() => {
              const cleared = { employeeId: '', branch: '', dateFrom: '', dateTo: '' };
              setAttendanceFilters(cleared);
              refreshAttendance(cleared);
            }}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Reset
          </button>
        </div>
      </div>

      <DataTable
        headers={['Employee', 'Date', 'Check In', 'Check Out', 'Status', 'Overtime', 'Source', 'Override', ...(canDelete ? ['Action'] : [])]}
        rows={attendance.map((record) => [
          record.employee_name || `Employee ${record.employee_id}`,
          formatDate(record.date),
          record.check_in || 'Not set',
          record.check_out || 'Not set',
          statusBadge(record.status),
          String(record.overtime_hours || 0),
          statusBadge(record.source),
          record.approved_by_name || record.notes || 'None',
          ...(canDelete ? [(
            <button
              key={`${record.attendance_id}-delete`}
              type="button"
              onClick={() => deleteAttendanceRecord(record.attendance_id)}
              className="rounded-md border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 hover:text-rose-700"
              title="Delete record"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )] : []),
        ])}
      />
    </div>
  );

  const renderAttendanceForm = () => (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        setFormBusy(true);
        setFormError('');
        try {
          const response = await fetch('/api/admin/hr/attendance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...attendanceForm,
              overtime_hours: Number(attendanceForm.overtime_hours || 0),
              check_in: attendanceForm.check_in || null,
              check_out: attendanceForm.check_out || null,
              notes: attendanceForm.notes || null,
              approved_by: attendanceForm.approved_by || null,
            }),
          });

          if (response.ok) {
            await refreshAttendance();
            setAttendanceForm((previous) => ({
              ...previous,
              check_in: '',
              check_out: '',
              overtime_hours: '0',
              notes: '',
              approved_by: '',
            }));
            setShowAddForm(false);
          } else {
            setFormError(await parseFormError(response, 'Failed to save attendance record'));
          }
        } finally {
          setFormBusy(false);
        }
      }}
    >
      <FormErrorBanner />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Employee</span>
          <SearchableSelect
            value={attendanceForm.employee_id}
            onChange={(event) => setAttendanceForm({ ...attendanceForm, employee_id: event.target.value })}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            required
          >
            {employees.map((employee) => (
              <option key={employee.id} value={String(employee.id)}>{employee.name}</option>
            ))}
          </SearchableSelect>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Date</span>
          <input type="date" value={attendanceForm.date} onChange={(event) => setAttendanceForm({ ...attendanceForm, date: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Status</span>
          <SearchableSelect value={attendanceForm.status} onChange={(event) => setAttendanceForm({ ...attendanceForm, status: event.target.value as AttendanceRecord['status'] })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required>
            {['Present', 'Absent', 'Late', 'Half-Day', 'Leave', 'Holiday'].map((status) => <option key={status}>{status}</option>)}
          </SearchableSelect>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Check In</span>
          <input type="time" value={attendanceForm.check_in} onChange={(event) => setAttendanceForm({ ...attendanceForm, check_in: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Check Out</span>
          <input type="time" value={attendanceForm.check_out} onChange={(event) => setAttendanceForm({ ...attendanceForm, check_out: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Overtime Hours</span>
          <input type="number" step="0.25" min="0" value={attendanceForm.overtime_hours} onChange={(event) => setAttendanceForm({ ...attendanceForm, overtime_hours: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Source</span>
          <SearchableSelect value={attendanceForm.source} onChange={(event) => setAttendanceForm({ ...attendanceForm, source: event.target.value as AttendanceRecord['source'] })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required>
            {['Manual', 'Biometric', 'Import'].map((source) => <option key={source}>{source}</option>)}
          </SearchableSelect>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Approved By</span>
          <SearchableSelect value={attendanceForm.approved_by} onChange={(event) => setAttendanceForm({ ...attendanceForm, approved_by: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="">No override approver</option>
            {employees.map((employee) => (
              <option key={employee.id} value={String(employee.id)}>{employee.name}</option>
            ))}
          </SearchableSelect>
        </label>
        <label className="block md:col-span-2">
          <span className="text-sm font-medium text-slate-700">Manager Override Notes</span>
          <textarea value={attendanceForm.notes} onChange={(event) => setAttendanceForm({ ...attendanceForm, notes: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" rows={3} placeholder="Reason for manual adjustment or override" />
        </label>
      </div>
      <div className="mt-4 flex justify-end">
        <button type="submit" disabled={formBusy} className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
          {formBusy ? 'Saving…' : 'Save Attendance'}
        </button>
      </div>
    </form>
  );

  const renderLeaves = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Metric label="Leave requests" value={leaves.length.toString()} />
        <Metric label="Pending approval" value={pendingLeaves.toString()} />
        <Metric label="Approved" value={leaves.filter((leave) => leave.status === 'Approved').length.toString()} />
        <Metric label="Rejected" value={leaves.filter((leave) => leave.status === 'Rejected').length.toString()} />
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-4">
          <h3 className="text-lg font-semibold text-slate-950">UAE Leave Entitlements</h3>
        </div>
        <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {['Type', 'Entitlement', 'Pay Category', 'Notes'].map((head) => (
                <th key={head} className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">{head}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(leaveEntitlements.length ? leaveEntitlements : leaveTypeOptions.map((type) => ({ type, entitlementDays: 0, category: 'Policy', notes: 'Configured by HR policy.' }))).map((entitlement) => (
              <tr key={entitlement.type}>
                <td className="px-4 py-3 text-sm font-medium text-slate-900">{entitlement.type}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{entitlement.entitlementDays || 'Policy based'} days</td>
                <td className="px-4 py-3 text-sm text-slate-700">{entitlement.category}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{entitlement.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      <DataTable
        headers={['Leave Type', 'Entitlement', 'Used', 'Pending', 'Remaining']}
        rows={(leaveBalances.length ? leaveBalances : leaveTypeOptions.map((type) => ({
          balance_id: type,
          employee_id: leaveForm.employee_id,
          leave_type: type,
          year: new Date().getFullYear(),
          entitlement_days: 0,
          used_days: 0,
          pending_days: 0,
          remaining_days: 0,
        }))).map((balance) => [
          balance.leave_type,
          String(balance.entitlement_days),
          String(balance.used_days),
          String(balance.pending_days),
          String(balance.remaining_days),
        ])}
      />

      {canUpdate && (
        <div className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4">
          <div>
            <label className="block text-xs font-medium text-slate-500">Credit Comp Off days</label>
            <p className="mt-0.5 text-xs text-slate-400">Compensatory Leave has no automatic accrual - credit days manually for the employee selected above.</p>
          </div>
          <input
            type="number"
            min="0.5"
            step="0.5"
            value={compOffCreditDays}
            onChange={(event) => setCompOffCreditDays(event.target.value)}
            className="w-28 rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="Days"
          />
          <button
            type="button"
            disabled={creditingCompOff || !leaveForm.employee_id || !compOffCreditDays}
            onClick={async () => {
              setCreditingCompOff(true);
              try {
                const response = await fetch('/api/admin/hr/leave', {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ employee_id: leaveForm.employee_id, days: Number(compOffCreditDays) }),
                });
                if (response.ok) {
                  setCompOffCreditDays('');
                  await refreshLeaveData(leaveForm.employee_id);
                }
              } finally {
                setCreditingCompOff(false);
              }
            }}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:bg-slate-300"
          >
            {creditingCompOff ? 'Crediting...' : 'Credit Comp Off'}
          </button>
          {!leaveForm.employee_id && (
            <span className="text-xs text-amber-600">Select an employee above first.</span>
          )}
        </div>
      )}

      <DataTable
        headers={['Employee', 'Type', 'Dates', 'Days', 'Flow', 'Manager', 'HR', 'Notes', 'Action']}
        rows={leaves.map((leave) => [
          leave.employee_name || `Employee ${leave.employee_id}`,
          leave.leave_type,
          `${formatDate(leave.start_date)} - ${formatDate(leave.end_date)}`,
          String(leave.days_requested),
          <div key={`${leave.leave_id}-flow`} className="space-y-1">
            {statusBadge(leave.workflow_status || 'Manager Review')}
            <div>{statusBadge(leave.status)}</div>
          </div>,
          <div key={`${leave.leave_id}-manager`} className="space-y-1">
            <div>{leave.manager_name || leave.manager_id || 'Auto assign'}</div>
            {statusBadge(leave.manager_status || 'Pending')}
          </div>,
          <div key={`${leave.leave_id}-hr`} className="space-y-1">
            <div>{leave.reviewed_by_name || leave.reviewed_by || 'Pending'}</div>
            {statusBadge(leave.hr_status || 'Pending')}
          </div>,
          [
            leave.reason,
            leave.medical_certificate_required ? 'Medical certificate required' : '',
            leave.manager_comment,
            leave.review_notes,
          ].filter(Boolean).join(' | ') || 'None',
          (leave.status === 'Pending' && canUpdate) || canDelete ? (
            <div className="flex flex-wrap gap-2">
              {leave.status === 'Pending' && canUpdate && (leave.workflow_status === 'HR Confirmation' ? ['Approved', 'Rejected'] : [] as string[]).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={async () => {
                    const response = await fetch('/api/admin/hr/leave', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        leave_id: leave.leave_id,
                        status,
                        reviewed_by: String(selectedEmployeeId || ''),
                        review_notes: status === 'Approved' && leave.manager_status === 'Rejected' ? 'HR override: approved after manager rejection' : `${status} by HR`,
                      }),
                    });
                    if (response.ok) await refreshLeaveData(leaveForm.employee_id);
                  }}
                  className={`rounded-md px-3 py-1 text-xs font-medium ${status === 'Approved' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}
                >
                  HR {status}
                </button>
              ))}
              {leave.status === 'Pending' && canUpdate && (leave.workflow_status !== 'HR Confirmation' ? ['Approved', 'Rejected'] : [] as string[]).map((managerStatus) => (
                <button
                  key={managerStatus}
                  type="button"
                  onClick={async () => {
                    const response = await fetch('/api/admin/hr/leave', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        leave_id: leave.leave_id,
                        stage: 'manager',
                        manager_status: managerStatus,
                        manager_id: leave.manager_id || leaveForm.manager_id || String(selectedEmployeeId || ''),
                        manager_comment: `${managerStatus} by manager`,
                      }),
                    });
                    if (response.ok) await refreshLeaveData(leaveForm.employee_id);
                  }}
                  className={`rounded-md px-3 py-1 text-xs font-medium ${managerStatus === 'Approved' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}
                >
                  Manager {managerStatus}
                </button>
              ))}
              {canDelete && (
                <button
                  type="button"
                  onClick={async () => {
                    if (!confirm('Delete this leave request?')) return;
                    const response = await fetch(`/api/admin/hr/leave?leave_id=${encodeURIComponent(leave.leave_id)}`, { method: 'DELETE' });
                    if (response.ok) await refreshLeaveData(leaveForm.employee_id);
                  }}
                  className="rounded-md border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 hover:text-rose-700"
                  title="Delete leave request"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ) : 'None',
        ])}
      />
    </div>
  );

  const renderLeaveForm = () => (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        setFormBusy(true);
        setFormError('');
        try {
          const response = await fetch('/api/admin/hr/leave', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...leaveForm,
              reason: leaveForm.reason || null,
              document_url: leaveForm.document_url || null,
            }),
          });

          if (response.ok) {
            await refreshLeaveData(leaveForm.employee_id);
            setLeaveForm((previous) => ({
              ...previous,
              reason: '',
              document_url: '',
            }));
            setShowAddForm(false);
          } else {
            setFormError(await parseFormError(response, 'Failed to submit leave request'));
          }
        } finally {
          setFormBusy(false);
        }
      }}
    >
      <FormErrorBanner />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Employee</span>
          <SearchableSelect
            value={leaveForm.employee_id}
            onChange={async (event) => {
              const employeeId = event.target.value;
              setLeaveForm({ ...leaveForm, employee_id: employeeId });
              await refreshLeaveData(employeeId);
            }}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            required
          >
            {employees.map((employee) => (
              <option key={employee.id} value={String(employee.id)}>{employee.name}</option>
            ))}
          </SearchableSelect>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Direct Manager</span>
          <SearchableSelect
            value={leaveForm.manager_id}
            onChange={(event) => setLeaveForm({ ...leaveForm, manager_id: event.target.value })}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Auto assign manager</option>
            {employees.map((employee) => (
              <option key={employee.id} value={String(employee.id)}>{employee.name}</option>
            ))}
          </SearchableSelect>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Leave Type</span>
          <SearchableSelect value={leaveForm.leave_type} onChange={(event) => setLeaveForm({ ...leaveForm, leave_type: event.target.value as LeaveType })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required>
            {(availableLeaveTypes.length ? availableLeaveTypes : leaveTypeOptions).map((type) => <option key={type}>{type}</option>)}
          </SearchableSelect>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Start Date</span>
          <input type="date" value={leaveForm.start_date} onChange={(event) => setLeaveForm({ ...leaveForm, start_date: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">End Date</span>
          <input type="date" value={leaveForm.end_date} onChange={(event) => setLeaveForm({ ...leaveForm, end_date: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Document URL</span>
          <input value={leaveForm.document_url} onChange={(event) => setLeaveForm({ ...leaveForm, document_url: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Medical certificate or proof link" />
        </label>
        <label className="block md:col-span-2">
          <span className="text-sm font-medium text-slate-700">Reason</span>
          <textarea value={leaveForm.reason} onChange={(event) => setLeaveForm({ ...leaveForm, reason: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" rows={3} />
        </label>
      </div>
      <div className="mt-4 flex justify-end">
        <button type="submit" disabled={formBusy} className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
          {formBusy ? 'Submitting…' : 'Submit Leave Request'}
        </button>
      </div>
    </form>
  );

  const renderPayroll = () => (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="rounded-lg border border-slate-200 bg-white p-5 lg:col-span-2">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">Payroll Run</h3>
            <p className="mt-1 text-sm text-slate-500">
              Totals for {selectedPayrollPayslips.length} {payrollCurrency} payslip{selectedPayrollPayslips.length === 1 ? '' : 's'}.
              {payslips.length === 0 && ' Generate payslips in the Payslip Generation tab to populate this run.'}
            </p>
          </div>
          <label className="block min-w-40">
            <span className="text-sm font-medium text-slate-700">Payroll Currency</span>
            <SearchableSelect
              value={payrollCurrency}
              onChange={(event) => setPayrollCurrency(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              {payrollCurrencies.map((code) => <option key={code} value={code}>{code}</option>)}
            </SearchableSelect>
          </label>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          <PayrollBox label="Total Basic Salary" value={monthlyBase} currencyCode={payrollCurrency} />
          <PayrollBox label="Total Allowances" value={allowances} currencyCode={payrollCurrency} />
          <PayrollBox label="Total Deductions" value={deductions} currencyCode={payrollCurrency} tone="danger" />
        </div>
        <div className="mt-5 rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Net payable</span>
            <span className="text-2xl font-semibold text-slate-950">{formatMoney(netPay, payrollCurrency)}</span>
          </div>
        </div>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <h3 className="text-lg font-semibold text-slate-950">Workflow</h3>
        <p className="mt-1 text-xs text-slate-500">
          Attendance validation, leave-without-pay review, and batch approval are done manually
          by HR/Finance today - not yet automated in this screen.
        </p>
        <button
          type="button"
          disabled={selectedPayrollPayslips.length === 0}
          onClick={() => {
            const header = ['Employee', 'Employee ID', 'Pay Period', 'Bank Name', 'IBAN', 'Currency', 'Net Salary'];
            const rows = selectedPayrollPayslips.map((p) => [
              p.employee_name || '', p.employee_id, p.pay_period, p.bank_name || '', p.masked_iban || '',
              p.currency_code || payrollCurrency, String(p.net_salary),
            ]);
            const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `bank-transfer-file-${payrollCurrency}-${new Date().toISOString().slice(0, 7)}.csv`;
            link.click();
            URL.revokeObjectURL(url);
          }}
          className="mt-4 w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Export {payrollCurrency} bank transfer file ({selectedPayrollPayslips.length} payslip{selectedPayrollPayslips.length === 1 ? '' : 's'})
        </button>
      </div>
    </div>
  );

  const renderEosb = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Metric label="Settlements" value={eosbSettlements.length.toString()} />
        <Metric label="Current service" value={`${eosbYears.toFixed(1)} yrs`} />
        <Metric label="Preview total" value={formatMoney(Number(eosbPreview?.total_payable || eosbEstimate))} />
        <Metric label="Leave encashment" value={formatMoney(Number(eosbPreview?.leave_encashment || 0))} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <h3 className="text-lg font-semibold text-slate-950">Computed Settlement</h3>
          <dl className="mt-5 space-y-4">
            <Detail label="Employee" value={eosbPreview?.employee_name || selectedEmployee?.name || 'No employee selected'} />
            <Detail label="Joining date" value={formatDate(eosbPreview?.joining_date || selectedEmployee?.doj)} />
            <Detail label="Years of service" value={`${Number(eosbPreview?.years_of_service || eosbYears).toFixed(2)} years`} />
            <Detail label="Gratuity days" value={String(eosbPreview?.gratuity_days || 'Preview required')} />
            <Detail label="EOSB amount" value={formatMoney(Number(eosbPreview?.eosb_amount || eosbEstimate))} />
            <Detail label="Annual leave balance" value={`${eosbPreview?.leave_balance_days || 0} days`} />
            <Detail label="Leave encashment" value={formatMoney(Number(eosbPreview?.leave_encashment || 0))} />
            <Detail label="Unpaid salary" value={formatMoney(Number(eosbPreview?.unpaid_salary || 0))} />
            <Detail label="Total payable" value={formatMoney(Number(eosbPreview?.total_payable || eosbEstimate))} strong />
          </dl>
          {eosbPreview?.rule_applied && <p className="mt-4 text-sm text-slate-600">{eosbPreview.rule_applied}</p>}
        </div>

        <ActionPanel actions={[
          '< 1 year: no EOSB entitlement',
          'Resignation: 1/3, 2/3, or full based on service',
          'Termination/retirement/death: 21 days up to 5 years, 30 days thereafter',
          'Total payable includes leave encashment and unpaid salary',
        ]} />
      </div>

      <DataTable
        headers={['Employee', 'Reason', 'Service', 'EOSB', 'Leave Encashment', 'Total', 'Approved By', 'Settlement', ...(canDelete ? ['Action'] : [])]}
        rows={(eosbSettlements.length ? eosbSettlements : []).map((settlement) => [
          settlement.employee_name || `Employee ${settlement.employee_id}`,
          settlement.separation_reason,
          `${Number(settlement.years_of_service || 0).toFixed(2)} years`,
          formatMoney(Number(settlement.eosb_amount || 0)),
          formatMoney(Number(settlement.leave_encashment || 0)),
          formatMoney(Number(settlement.total_payable || 0)),
          settlement.approved_by_name || settlement.approved_by || 'Not set',
          formatDate(settlement.settlement_date),
          ...(canDelete ? [(
            <button
              key={`${settlement.eosb_id}-delete`}
              type="button"
              onClick={async () => {
                if (!confirm('Delete this EOSB settlement?')) return;
                const response = await fetch(`/api/admin/hr/eosb?eosb_id=${encodeURIComponent(settlement.eosb_id || '')}`, { method: 'DELETE' });
                if (response.ok) await refreshEOSBData(eosbForm.employee_id);
              }}
              className="rounded-md border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 hover:text-rose-700"
              title="Delete settlement"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )] : []),
        ])}
      />
    </div>
  );

  const renderEosbForm = () => (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        setFormBusy(true);
        setFormError('');
        try {
          const response = await fetch('/api/admin/hr/eosb', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...eosbForm,
              last_basic_salary: Number(eosbForm.last_basic_salary || 0),
              unpaid_salary: Number(eosbForm.unpaid_salary || 0),
              settlement_date: eosbForm.settlement_date || null,
              notes: eosbForm.notes || null,
            }),
          });

          if (response.ok) {
            setEosbPreview(await response.json());
          } else {
            setFormError(await parseFormError(response, 'Failed to preview EOSB'));
          }
        } finally {
          setFormBusy(false);
        }
      }}
    >
      <FormErrorBanner />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Employee</span>
          <SearchableSelect
            value={eosbForm.employee_id}
            onChange={(event) => {
              const employeeId = event.target.value;
              setEosbForm({ ...eosbForm, employee_id: employeeId });
              setSelectedEmployeeId(Number(employeeId));
            }}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            required
          >
            {employees.map((employee) => (
              <option key={employee.id} value={String(employee.id)}>{employee.name}</option>
            ))}
          </SearchableSelect>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Last Working Day</span>
          <input type="date" value={eosbForm.last_working_day} onChange={(event) => setEosbForm({ ...eosbForm, last_working_day: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Separation Reason</span>
          <SearchableSelect value={eosbForm.separation_reason} onChange={(event) => setEosbForm({ ...eosbForm, separation_reason: event.target.value as SeparationReason })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required>
            {separationReasons.map((reason) => <option key={reason}>{reason}</option>)}
          </SearchableSelect>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Last Basic Salary</span>
          <input type="number" min="0" step="0.01" value={eosbForm.last_basic_salary} onChange={(event) => setEosbForm({ ...eosbForm, last_basic_salary: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Unpaid Salary</span>
          <input type="number" step="0.01" value={eosbForm.unpaid_salary} onChange={(event) => setEosbForm({ ...eosbForm, unpaid_salary: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Approved By</span>
          <SearchableSelect value={eosbForm.approved_by} onChange={(event) => setEosbForm({ ...eosbForm, approved_by: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required>
            {employees.map((employee) => (
              <option key={employee.id} value={String(employee.id)}>{employee.name}</option>
            ))}
          </SearchableSelect>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Settlement Date</span>
          <input type="date" value={eosbForm.settlement_date} onChange={(event) => setEosbForm({ ...eosbForm, settlement_date: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label className="block md:col-span-2">
          <span className="text-sm font-medium text-slate-700">Notes</span>
          <input value={eosbForm.notes} onChange={(event) => setEosbForm({ ...eosbForm, notes: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Adjustments or settlement remarks" />
        </label>
      </div>
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button type="submit" disabled={formBusy} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
          {formBusy ? 'Working…' : 'Preview EOSB'}
        </button>
        {canManageEosb && (
          <button
            type="button"
            disabled={formBusy}
            onClick={async () => {
              setFormBusy(true);
              setFormError('');
              try {
                const response = await fetch('/api/admin/hr/eosb', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    ...eosbForm,
                    last_basic_salary: Number(eosbForm.last_basic_salary || 0),
                    unpaid_salary: Number(eosbForm.unpaid_salary || 0),
                    settlement_date: eosbForm.settlement_date || null,
                    notes: eosbForm.notes || null,
                  }),
                });

                if (response.ok) {
                  const settlement = await response.json();
                  setEosbPreview(settlement);
                  await refreshEOSBData(eosbForm.employee_id);
                  setShowAddForm(false);
                } else {
                  setFormError(await parseFormError(response, 'Failed to save EOSB settlement'));
                }
              } finally {
                setFormBusy(false);
              }
            }}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {formBusy ? 'Saving…' : 'Save Settlement'}
          </button>
        )}
      </div>
    </form>
  );

  const renderPayslip = () => {
    const now = Date.now();
    const expiringThresholdMs = now + 3 * 24 * 60 * 60 * 1000;
    const expiredPayslips = payslips.filter((payslip) => new Date(payslip.signed_url_expires_at).getTime() < now);
    const expiringSoonPayslips = payslips.filter((payslip) => {
      const expiresAt = new Date(payslip.signed_url_expires_at).getTime();
      return expiresAt >= now && expiresAt <= expiringThresholdMs;
    });
    const activeLinks = payslips.length - expiredPayslips.length;
    const currencyBreakdown = payslips.reduce<Record<string, number>>((totals, payslip) => {
      const code = (payslip.currency_code || 'AED').toUpperCase();
      totals[code] = (totals[code] || 0) + 1;
      return totals;
    }, {});
    const latestPayslip = [...payslips].sort(
      (a, b) => new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime()
    )[0];

    return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Metric label="Generated payslips" value={payslips.length.toString()} />
        <Metric label="Gross preview" value={formatMoney(Number(payslipForm.basic_salary || 0) + Number(payslipForm.housing_allowance || 0) + Number(payslipForm.transport_allowance || 0) + Number(payslipForm.other_allowance || 0) + Number(payslipForm.overtime_amount || 0), payslipForm.currency_code || currencyCode)} />
        <Metric label="Deductions" value={formatMoney(Number(payslipForm.deduction_amount || 0), payslipForm.currency_code || currencyCode)} />
        <Metric label="Net preview" value={formatMoney(Number(payslipForm.basic_salary || 0) + Number(payslipForm.housing_allowance || 0) + Number(payslipForm.transport_allowance || 0) + Number(payslipForm.other_allowance || 0) + Number(payslipForm.overtime_amount || 0) - Number(payslipForm.deduction_amount || 0), payslipForm.currency_code || currencyCode)} />
      </div>

      <DataTable
        headers={['Employee', 'Period', 'Currency', 'Gross', 'Net', 'Bank', 'Signed URL', 'Expires', ...(canDelete ? ['Action'] : [])]}
        rows={(payslips.length ? payslips : []).map((payslip) => [
          payslip.employee_name || `Employee ${payslip.employee_id}`,
          payslip.pay_period,
          payslip.currency_code || 'AED',
          formatMoney(Number(payslip.gross_salary || 0), payslip.currency_code || 'AED'),
          formatMoney(Number(payslip.net_salary || 0), payslip.currency_code || 'AED'),
          [payslip.bank_name, payslip.masked_iban].filter(Boolean).join(' | ') || 'Not set',
          <a key={`${payslip.payslip_id}-url`} href={payslip.signed_url} target="_blank" rel="noreferrer" className="font-medium text-blue-700 hover:underline">Open PDF</a>,
          formatDate(payslip.signed_url_expires_at),
          ...(canDelete ? [(
            <button
              key={`${payslip.payslip_id}-delete`}
              type="button"
              onClick={async () => {
                if (!confirm('Delete this payslip?')) return;
                const response = await fetch(`/api/admin/hr/payslips?payslip_id=${encodeURIComponent(payslip.payslip_id)}`, { method: 'DELETE' });
                if (response.ok) await refreshPayslipData(payslipForm.employee_id);
              }}
              className="rounded-md border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 hover:text-rose-700"
              title="Delete payslip"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )] : []),
        ])}
      />

      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <h3 className="text-lg font-semibold text-slate-950">Payslip Delivery Status</h3>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Metric label="Active signed links" value={activeLinks.toString()} />
          <Metric label="Expiring within 3 days" value={expiringSoonPayslips.length.toString()} />
          <Metric label="Expired - needs regeneration" value={expiredPayslips.length.toString()} />
        </div>
        {latestPayslip && (
          <p className="mt-4 text-sm text-slate-600">
            Last generated: <span className="font-medium text-slate-900">{latestPayslip.employee_name || `Employee ${latestPayslip.employee_id}`}</span> for {latestPayslip.pay_period} on {formatDate(latestPayslip.generated_at)}.
          </p>
        )}
        {Object.keys(currencyBreakdown).length > 0 && (
          <p className="mt-2 text-xs text-slate-500">
            By currency: {Object.entries(currencyBreakdown).map(([code, count]) => `${code} (${count})`).join(', ')}
          </p>
        )}
        {expiringSoonPayslips.length > 0 && (
          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <p className="font-medium">Links expiring soon:</p>
            <ul className="mt-1 space-y-0.5">
              {expiringSoonPayslips.slice(0, 5).map((payslip) => (
                <li key={payslip.payslip_id}>
                  {payslip.employee_name || `Employee ${payslip.employee_id}`} - {payslip.pay_period} (expires {formatDate(payslip.signed_url_expires_at)})
                </li>
              ))}
            </ul>
          </div>
        )}
        {expiredPayslips.length > 0 && (
          <div className="mt-3 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
            <p className="font-medium">Expired - regenerate to get a working link:</p>
            <ul className="mt-1 space-y-0.5">
              {expiredPayslips.slice(0, 5).map((payslip) => (
                <li key={payslip.payslip_id}>
                  {payslip.employee_name || `Employee ${payslip.employee_id}`} - {payslip.pay_period} (expired {formatDate(payslip.signed_url_expires_at)})
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
    );
  };

  const renderPayslipForm = () => (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        setFormBusy(true);
        setFormError('');
        try {
          const response = await fetch('/api/admin/hr/payslips', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              employee_id: payslipForm.employee_id,
              pay_year: Number(payslipForm.pay_year),
              pay_month: Number(payslipForm.pay_month),
              designation: payslipForm.designation,
              department: payslipForm.department,
              currency_code: payslipForm.currency_code || undefined,
              basic_salary: Number(payslipForm.basic_salary || 0),
              allowances: [
                { label: 'Housing Allowance', amount: Number(payslipForm.housing_allowance || 0) },
                { label: 'Transport Allowance', amount: Number(payslipForm.transport_allowance || 0) },
                { label: 'Other Allowance', amount: Number(payslipForm.other_allowance || 0) },
              ].filter((item) => item.amount > 0),
              overtime_hours: Number(payslipForm.overtime_hours || 0),
              overtime_amount: Number(payslipForm.overtime_amount || 0),
              deductions: [
                { label: payslipForm.deduction_label || 'Deductions', amount: Number(payslipForm.deduction_amount || 0) },
              ].filter((item) => item.amount > 0),
              bank_name: payslipForm.bank_name || null,
              iban: payslipForm.iban || null,
              ytd_earnings: Number(payslipForm.ytd_earnings || 0),
              authorised_by: payslipForm.authorised_by || null,
            }),
          });

          if (response.ok) {
            await refreshPayslipData(payslipForm.employee_id);
            setShowAddForm(false);
          } else {
            setFormError(await parseFormError(response, 'Failed to generate payslip'));
          }
        } finally {
          setFormBusy(false);
        }
      }}
    >
      <FormErrorBanner />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Employee</span>
          <SearchableSelect
            value={payslipForm.employee_id}
            onChange={(event) => {
              const employee = employees.find((item) => String(item.id) === event.target.value);
              setPayslipForm({ ...payslipForm, employee_id: event.target.value, department: departmentName(employee?.department) });
            }}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            required
          >
            {employees.map((employee) => (
              <option key={employee.id} value={String(employee.id)}>{employee.name}</option>
            ))}
          </SearchableSelect>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Pay Year</span>
          <input type="number" value={payslipForm.pay_year} onChange={(event) => setPayslipForm({ ...payslipForm, pay_year: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Pay Month</span>
          <input type="number" min="1" max="12" value={payslipForm.pay_month} onChange={(event) => setPayslipForm({ ...payslipForm, pay_month: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Designation</span>
          <input value={payslipForm.designation} onChange={(event) => setPayslipForm({ ...payslipForm, designation: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Department</span>
          <input value={payslipForm.department} onChange={(event) => setPayslipForm({ ...payslipForm, department: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Currency</span>
          <SearchableSelect value={payslipForm.currency_code || currencyCode || 'AED'} onChange={(event) => setPayslipForm({ ...payslipForm, currency_code: event.target.value.toUpperCase() })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
            {payrollCurrencies.map((code) => <option key={code} value={code}>{code}</option>)}
          </SearchableSelect>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Basic Salary</span>
          <input type="number" min="0" step="0.01" value={payslipForm.basic_salary} onChange={(event) => setPayslipForm({ ...payslipForm, basic_salary: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Housing Allowance</span>
          <input type="number" step="0.01" value={payslipForm.housing_allowance} onChange={(event) => setPayslipForm({ ...payslipForm, housing_allowance: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Transport Allowance</span>
          <input type="number" step="0.01" value={payslipForm.transport_allowance} onChange={(event) => setPayslipForm({ ...payslipForm, transport_allowance: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Other Allowance</span>
          <input type="number" step="0.01" value={payslipForm.other_allowance} onChange={(event) => setPayslipForm({ ...payslipForm, other_allowance: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Overtime Hours</span>
          <input type="number" step="0.25" value={payslipForm.overtime_hours} onChange={(event) => setPayslipForm({ ...payslipForm, overtime_hours: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Overtime Amount</span>
          <input type="number" step="0.01" value={payslipForm.overtime_amount} onChange={(event) => setPayslipForm({ ...payslipForm, overtime_amount: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Deduction Amount</span>
          <input type="number" step="0.01" value={payslipForm.deduction_amount} onChange={(event) => setPayslipForm({ ...payslipForm, deduction_amount: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Bank Name</span>
          <input value={payslipForm.bank_name} onChange={(event) => setPayslipForm({ ...payslipForm, bank_name: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">IBAN</span>
          <input value={payslipForm.iban} onChange={(event) => setPayslipForm({ ...payslipForm, iban: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">YTD Earnings</span>
          <input type="number" step="0.01" value={payslipForm.ytd_earnings} onChange={(event) => setPayslipForm({ ...payslipForm, ytd_earnings: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </label>
      </div>
      <div className="mt-4 flex justify-end">
        <button type="submit" disabled={formBusy} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
          {formBusy ? 'Generating…' : 'Generate Payslip PDF'}
        </button>
      </div>
    </form>
  );

  const renderExitChecklist = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Metric label="Open checklists" value={exitChecklists.filter((checklist) => checklist.status === 'Open').length.toString()} />
        <Metric label="Total items" value={exitChecklistItems.length.toString()} />
        <Metric label="Completed" value={exitChecklistItems.filter((item) => item.status === 'Completed').length.toString()} />
        <Metric label="Pending" value={exitChecklistItems.filter((item) => item.status === 'Pending').length.toString()} />
      </div>

      <DataTable
        headers={['Employee', 'Reason', 'Last Day', 'Status', 'Completed', 'Pending', ...(canDelete ? ['Action'] : [])]}
        rows={(exitChecklists.length ? exitChecklists : []).map((checklist) => [
          checklist.employee_name || `Employee ${checklist.employee_id}`,
          checklist.separation_reason || 'Not set',
          formatDate(checklist.last_working_day),
          statusBadge(checklist.status),
          `${checklist.completed_items || 0}/${checklist.total_items || 0}`,
          String(checklist.pending_items || 0),
          ...(canDelete ? [(
            <button
              key={`${checklist.checklist_id}-delete`}
              type="button"
              onClick={async () => {
                if (!confirm('Delete this offboarding checklist?')) return;
                const response = await fetch(`/api/admin/hr/exit-checklist?checklist_id=${encodeURIComponent(checklist.checklist_id)}`, { method: 'DELETE' });
                if (response.ok) await refreshExitChecklistData(exitChecklistForm.employee_id);
              }}
              className="rounded-md border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 hover:text-rose-700"
              title="Delete checklist"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )] : []),
        ])}
      />

      <DataTable
        headers={['Dept', 'Checklist Item', 'Owner', 'Status', 'Completed By', 'Notes', 'Action']}
        rows={(exitChecklistItems.length ? exitChecklistItems : []).map((item) => [
          item.department,
          item.item_text,
          item.owner_role,
          statusBadge(item.status),
          item.completed_by_name || item.completed_by || 'Not set',
          item.notes || 'None',
          canUpdate ? (
            <div key={`${item.item_id}-actions`} className="flex flex-wrap gap-2">
              {(['Completed', 'Waived', 'Pending'] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={async () => {
                    const response = await fetch('/api/admin/hr/exit-checklist', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        item_id: item.item_id,
                        status,
                        completed_by: exitChecklistForm.assigned_by || String(selectedEmployeeId || ''),
                        notes: status === 'Pending' ? 'Reopened' : `${status} by ${item.owner_role}`,
                      }),
                    });
                    if (response.ok) await refreshExitChecklistData(exitChecklistForm.employee_id);
                  }}
                  className={`rounded-md px-3 py-1 text-xs font-medium ${status === 'Completed' ? 'bg-emerald-600 text-white' : status === 'Waived' ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-700'}`}
                >
                  {status}
                </button>
              ))}
            </div>
          ) : 'None',
        ])}
      />
    </div>
  );

  const renderExitChecklistForm = () => (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        setFormBusy(true);
        setFormError('');
        try {
          const response = await fetch('/api/admin/hr/exit-checklist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(exitChecklistForm),
          });

          if (response.ok) {
            await refreshExitChecklistData(exitChecklistForm.employee_id);
            setShowAddForm(false);
          } else {
            setFormError(await parseFormError(response, 'Failed to assign exit checklist'));
          }
        } finally {
          setFormBusy(false);
        }
      }}
    >
      <FormErrorBanner />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Employee</span>
          <SearchableSelect value={exitChecklistForm.employee_id} onChange={(event) => setExitChecklistForm({ ...exitChecklistForm, employee_id: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required>
            {employees.map((employee) => (
              <option key={employee.id} value={String(employee.id)}>{employee.name}</option>
            ))}
          </SearchableSelect>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Separation Reason</span>
          <SearchableSelect value={exitChecklistForm.separation_reason} onChange={(event) => setExitChecklistForm({ ...exitChecklistForm, separation_reason: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
            {['Resignation', 'Termination', 'Retirement', 'Death', 'Mutual'].map((reason) => <option key={reason}>{reason}</option>)}
          </SearchableSelect>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Last Working Day</span>
          <input type="date" value={exitChecklistForm.last_working_day} onChange={(event) => setExitChecklistForm({ ...exitChecklistForm, last_working_day: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Assigned By</span>
          <SearchableSelect value={exitChecklistForm.assigned_by} onChange={(event) => setExitChecklistForm({ ...exitChecklistForm, assigned_by: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
            {employees.map((employee) => (
              <option key={employee.id} value={String(employee.id)}>{employee.name}</option>
            ))}
          </SearchableSelect>
        </label>
      </div>
      <div className="mt-4 flex justify-end">
        <button type="submit" disabled={formBusy} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
          {formBusy ? 'Assigning…' : 'Assign Checklist'}
        </button>
      </div>
    </form>
  );

  const renderLetters = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Metric label="Generated letters" value={letters.length.toString()} />
        <Metric label="Templates" value={letterTemplates.length.toString()} />
        <Metric label="Relieving" value={letters.filter((letter) => letter.letter_type === 'relieving').length.toString()} />
        <Metric label="Experience" value={letters.filter((letter) => letter.letter_type === 'experience').length.toString()} />
      </div>

      <DataTable
        headers={['Employee', 'Type', 'Ref', 'Issue Date', 'Last Day', 'Template', 'PDF', 'Expires', ...(canDelete ? ['Action'] : [])]}
        rows={(letters.length ? letters : []).map((letter) => [
          letter.employee_name || `Employee ${letter.employee_id}`,
          letter.letter_type === 'experience' ? 'Experience Letter' : 'Relieving Letter',
          letter.ref_number,
          formatDate(letter.issue_date),
          formatDate(letter.last_working_day),
          letter.template_name || 'Default',
          <a key={`${letter.letter_id}-download`} href={letter.signed_url} target="_blank" rel="noreferrer" className="font-medium text-blue-700 hover:underline">Download</a>,
          formatDate(letter.signed_url_expires_at),
          ...(canDelete ? [(
            <button
              key={`${letter.letter_id}-delete`}
              type="button"
              onClick={async () => {
                if (!confirm('Delete this letter?')) return;
                const response = await fetch(`/api/admin/hr/letters?letter_id=${encodeURIComponent(letter.letter_id)}`, { method: 'DELETE' });
                if (response.ok) await refreshLetterData(letterForm.employee_id);
              }}
              className="rounded-md border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 hover:text-rose-700"
              title="Delete letter"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )] : []),
        ])}
      />

      <DataTable
        headers={['Template', 'Type', 'Status']}
        rows={(letterTemplates.length ? letterTemplates : []).map((template) => [
          template.template_name,
          template.letter_type === 'experience' ? 'Experience Letter' : 'Relieving Letter',
          statusBadge(template.is_active ? 'Active' : 'Inactive'),
        ])}
      />
    </div>
  );

  const renderLetterForm = () => (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        setFormBusy(true);
        setFormError('');
        try {
          const response = await fetch('/api/admin/hr/letters', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(letterForm),
          });

          if (response.ok) {
            await refreshLetterData(letterForm.employee_id);
            setShowAddForm(false);
          } else {
            setFormError(await parseFormError(response, 'Failed to generate letter'));
          }
        } finally {
          setFormBusy(false);
        }
      }}
    >
      <FormErrorBanner />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Employee</span>
          <SearchableSelect
            value={letterForm.employee_id}
            onChange={(event) => {
              const employee = employees.find((item) => String(item.id) === event.target.value);
              setLetterForm({ ...letterForm, employee_id: event.target.value, department: departmentName(employee?.department) });
              setSelectedEmployeeId(Number(event.target.value));
            }}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            required
          >
            {employees.map((employee) => (
              <option key={employee.id} value={String(employee.id)}>{employee.name}</option>
            ))}
          </SearchableSelect>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Letter Type</span>
          <SearchableSelect value={letterForm.letter_type} onChange={(event) => setLetterForm({ ...letterForm, letter_type: event.target.value as 'relieving' | 'experience' })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="experience">Experience Letter</option>
            <option value="relieving">Relieving Letter</option>
          </SearchableSelect>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Last Working Date</span>
          <input type="date" value={letterForm.last_working_day} onChange={(event) => setLetterForm({ ...letterForm, last_working_day: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Designation</span>
          <input value={letterForm.designation} onChange={(event) => setLetterForm({ ...letterForm, designation: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Department</span>
          <input value={letterForm.department} onChange={(event) => setLetterForm({ ...letterForm, department: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Issue Date</span>
          <input type="date" value={letterForm.issue_date} onChange={(event) => setLetterForm({ ...letterForm, issue_date: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">HR Manager</span>
          <input value={letterForm.hr_manager_name} onChange={(event) => setLetterForm({ ...letterForm, hr_manager_name: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">HR Designation</span>
          <input value={letterForm.hr_manager_designation} onChange={(event) => setLetterForm({ ...letterForm, hr_manager_designation: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Generated By</span>
          <SearchableSelect value={letterForm.generated_by} onChange={(event) => setLetterForm({ ...letterForm, generated_by: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
            {employees.map((employee) => (
              <option key={employee.id} value={String(employee.id)}>{employee.name}</option>
            ))}
          </SearchableSelect>
        </label>
        <label className="block md:col-span-2">
          <span className="text-sm font-medium text-slate-700">Key Responsibilities</span>
          <textarea value={letterForm.key_responsibilities} onChange={(event) => setLetterForm({ ...letterForm, key_responsibilities: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" rows={2} />
        </label>
        <label className="block md:col-span-2">
          <span className="text-sm font-medium text-slate-700">Performance Summary</span>
          <textarea value={letterForm.performance_summary} onChange={(event) => setLetterForm({ ...letterForm, performance_summary: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" rows={2} />
        </label>
        <label className="block md:col-span-2">
          <span className="text-sm font-medium text-slate-700">Recommendation Statement</span>
          <textarea value={letterForm.recommendation_statement} onChange={(event) => setLetterForm({ ...letterForm, recommendation_statement: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" rows={2} />
        </label>
      </div>
      <div className="mt-4 flex justify-end">
        <button type="submit" disabled={formBusy} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
          <Download className="h-4 w-4" />
          {formBusy ? 'Generating…' : 'Generate Letter PDF'}
        </button>
      </div>
    </form>
  );

  const renderExitInterview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Metric label="Interviews" value={String(exitInterviewAnalytics?.total || exitInterviews.length)} />
        <Metric label="Recommend" value={`${exitInterviewAnalytics?.recommendPercent || 0}%`} />
        <Metric label="Rehire eligible" value={`${exitInterviewAnalytics?.rehireEligiblePercent || 0}%`} />
        <Metric label="Avg satisfaction" value={String(exitInterviewAnalytics?.averages.jobSatisfaction || 0)} />
      </div>

      <DataTable
        headers={['Reason', 'Count']}
        rows={(exitInterviewAnalytics?.reasonBreakdown || []).map((item) => [
          item.reason,
          String(item.total),
        ])}
      />

      <DataTable
        headers={['Employee', 'Date', 'Reason', 'Ratings', 'Recommend', 'Rehire', 'Confidential', ...(canDelete ? ['Action'] : [])]}
        rows={(exitInterviews.length ? exitInterviews : []).map((interview) => [
          interview.employee_name || `Employee ${interview.employee_id}`,
          formatDate(interview.interview_date),
          interview.reason_leaving,
          `Job ${interview.job_satisfaction} | Mgmt ${interview.mgmt_satisfaction} | Env ${interview.work_env_rating} | Comp ${interview.compensation_rating} | Growth ${interview.growth_rating}`,
          interview.recommend_company ? 'Yes' : 'No',
          interview.rehire_eligible ? 'Yes' : 'No',
          interview.confidential ? 'Yes' : 'No',
          ...(canDelete ? [(
            <button
              key={`${interview.exit_id}-delete`}
              type="button"
              onClick={async () => {
                if (!confirm('Delete this exit interview record?')) return;
                const response = await fetch(`/api/admin/hr/exit-interviews?exit_id=${encodeURIComponent(interview.exit_id)}`, { method: 'DELETE' });
                if (response.ok) await refreshExitInterviewData(exitInterviewForm.employee_id);
              }}
              className="rounded-md border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 hover:text-rose-700"
              title="Delete interview record"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )] : []),
        ])}
      />
    </div>
  );

  const renderExitInterviewForm = () => (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        setFormBusy(true);
        setFormError('');
        try {
          const response = await fetch('/api/admin/hr/exit-interviews', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...exitInterviewForm,
              job_satisfaction: Number(exitInterviewForm.job_satisfaction),
              mgmt_satisfaction: Number(exitInterviewForm.mgmt_satisfaction),
              work_env_rating: Number(exitInterviewForm.work_env_rating),
              compensation_rating: Number(exitInterviewForm.compensation_rating),
              growth_rating: Number(exitInterviewForm.growth_rating),
              reason_details: exitInterviewForm.reason_details || null,
              feedback_text: exitInterviewForm.feedback_text || null,
              suggestions: exitInterviewForm.suggestions || null,
            }),
          });

          if (response.ok) {
            await refreshExitInterviewData(exitInterviewForm.employee_id);
            setShowAddForm(false);
          } else {
            setFormError(await parseFormError(response, 'Failed to submit exit interview'));
          }
        } finally {
          setFormBusy(false);
        }
      }}
    >
      <FormErrorBanner />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Employee</span>
          <SearchableSelect value={exitInterviewForm.employee_id} onChange={(event) => setExitInterviewForm({ ...exitInterviewForm, employee_id: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required>
            {employees.map((employee) => (
              <option key={employee.id} value={String(employee.id)}>{employee.name}</option>
            ))}
          </SearchableSelect>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Interview Date</span>
          <input type="date" value={exitInterviewForm.interview_date} onChange={(event) => setExitInterviewForm({ ...exitInterviewForm, interview_date: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Conducted By</span>
          <SearchableSelect value={exitInterviewForm.conducted_by} onChange={(event) => setExitInterviewForm({ ...exitInterviewForm, conducted_by: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required>
            {employees.map((employee) => (
              <option key={employee.id} value={String(employee.id)}>{employee.name}</option>
            ))}
          </SearchableSelect>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Reason Leaving</span>
          <SearchableSelect value={exitInterviewForm.reason_leaving} onChange={(event) => setExitInterviewForm({ ...exitInterviewForm, reason_leaving: event.target.value as ExitReasonLeaving })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required>
            {exitLeavingReasons.map((reason) => <option key={reason}>{reason}</option>)}
          </SearchableSelect>
        </label>
        {[
          ['Job Satisfaction', 'job_satisfaction'],
          ['Management Satisfaction', 'mgmt_satisfaction'],
          ['Work Environment', 'work_env_rating'],
          ['Compensation', 'compensation_rating'],
          ['Growth', 'growth_rating'],
        ].map(([label, key]) => (
          <label key={key} className="block">
            <span className="text-sm font-medium text-slate-700">{label}</span>
            <input type="number" min="1" max="5" value={exitInterviewForm[key as keyof typeof exitInterviewForm] as string} onChange={(event) => setExitInterviewForm({ ...exitInterviewForm, [key]: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
          </label>
        ))}
        <label className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-sm text-slate-700">
          <input type="checkbox" checked={exitInterviewForm.recommend_company} onChange={(event) => setExitInterviewForm({ ...exitInterviewForm, recommend_company: event.target.checked })} className="h-4 w-4 rounded border-slate-300" />
          Recommend company
        </label>
        <label className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-sm text-slate-700">
          <input type="checkbox" checked={exitInterviewForm.rehire_eligible} onChange={(event) => setExitInterviewForm({ ...exitInterviewForm, rehire_eligible: event.target.checked })} className="h-4 w-4 rounded border-slate-300" />
          Rehire eligible
        </label>
        <label className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-sm text-slate-700">
          <input type="checkbox" checked={exitInterviewForm.confidential} onChange={(event) => setExitInterviewForm({ ...exitInterviewForm, confidential: event.target.checked })} className="h-4 w-4 rounded border-slate-300" />
          Confidential
        </label>
        <label className="block md:col-span-2">
          <span className="text-sm font-medium text-slate-700">Reason Details</span>
          <textarea value={exitInterviewForm.reason_details} onChange={(event) => setExitInterviewForm({ ...exitInterviewForm, reason_details: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" rows={2} />
        </label>
        <label className="block md:col-span-2">
          <span className="text-sm font-medium text-slate-700">General Feedback</span>
          <textarea value={exitInterviewForm.feedback_text} onChange={(event) => setExitInterviewForm({ ...exitInterviewForm, feedback_text: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" rows={3} />
        </label>
        <label className="block md:col-span-2">
          <span className="text-sm font-medium text-slate-700">Suggestions</span>
          <textarea value={exitInterviewForm.suggestions} onChange={(event) => setExitInterviewForm({ ...exitInterviewForm, suggestions: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" rows={3} />
        </label>
      </div>
      <div className="mt-4 flex justify-end">
        <button type="submit" disabled={formBusy} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
          {formBusy ? 'Submitting…' : 'Submit Interview'}
        </button>
      </div>
    </form>
  );

  const renderActiveModule = () => {
    if (activeModule === 'attendance-management') return renderAttendance();
    if (activeModule === 'leave-management') return renderLeaves();
    if (activeModule === 'payroll-management') return renderPayroll();
    if (activeModule === 'eosb') return renderEosb();
    if (activeModule === 'payslip-generation') return renderPayslip();
    if (activeModule === 'exit-checklist') return renderExitChecklist();
    if (activeModule === 'letters') return renderLetters();
    if (activeModule === 'exit-interview') return renderExitInterview();
    return renderEmployeeSheet();
  };

  const renderActiveModuleForm = () => {
    if (activeModule === 'attendance-management') return renderAttendanceForm();
    if (activeModule === 'leave-management') return renderLeaveForm();
    if (activeModule === 'eosb') return renderEosbForm();
    if (activeModule === 'payslip-generation') return renderPayslipForm();
    if (activeModule === 'exit-checklist') return renderExitChecklistForm();
    if (activeModule === 'letters') return renderLetterForm();
    if (activeModule === 'exit-interview') return renderExitInterviewForm();
    return renderEmployeeForm();
  };

  const drawerTitle = activeModule === 'employee-data-sheet'
    ? (editingEmployee ? 'Edit Employee HR Record' : 'New Employee HR Record')
    : activeMeta.title;

  // Module-specific label so the add button reads as an action on THIS tab
  // ("New Exit Interview") rather than the generic, easy-to-miss "New HR Record".
  const addButtonLabels: Partial<Record<ModuleKey, string>> = {
    'employee-data-sheet': 'New Employee',
    'attendance-management': 'New Attendance Record',
    'leave-management': 'New Leave Application',
    'eosb': 'New EOSB Settlement',
    'payslip-generation': 'New Payslip',
    'exit-checklist': 'New Exit Checklist',
    'letters': 'New Letter',
    'exit-interview': 'New Exit Interview',
  };
  const addButtonLabel = addButtonLabels[activeModule] || 'New HR Record';

  const refreshEmployeeData = async () => {
    const response = await fetch('/api/admin/employees?limit=100');
    const json = await response.json();
    const loadedEmployees = json.data || [];
    setEmployees(loadedEmployees);
    setEmployeeSummary(json.summary || null);
    if (loadedEmployees.length && !loadedEmployees.some((employee: Employee) => employee.id === selectedEmployeeId)) {
      setSelectedEmployeeId(loadedEmployees[0].id);
    }
  };

  const refreshAttendance = async (filters = attendanceFilters) => {
    const params = new URLSearchParams({ limit: '100' });
    if (filters.employeeId) params.set('employee_id', filters.employeeId);
    if (filters.branch) params.set('branch', filters.branch);
    if (filters.dateFrom) params.set('date_from', filters.dateFrom);
    if (filters.dateTo) params.set('date_to', filters.dateTo);
    const response = await fetch(`/api/admin/hr/attendance?${params.toString()}`);
    const json = await response.json();
    setAttendance(json.data || []);
  };

  const refreshLeaveData = async (employeeId = leaveForm.employee_id) => {
    const response = await fetch(`/api/admin/hr/leave?limit=100${employeeId ? `&employee_id=${encodeURIComponent(employeeId)}` : ''}`);
    const json = await response.json();
    setLeaves(json.requests || []);
    setLeaveEntitlements(json.entitlements || []);
    setLeaveBalances(json.balances || []);
  };

  const refreshEOSBData = async (employeeId = eosbForm.employee_id) => {
    const response = await fetch(`/api/admin/hr/eosb?limit=100${employeeId ? `&employee_id=${encodeURIComponent(employeeId)}` : ''}`);
    const json = await response.json();
    setEosbSettlements(json.settlements || []);
  };

  const refreshPayslipData = async (employeeId = payslipForm.employee_id) => {
    const response = await fetch(`/api/admin/hr/payslips?limit=100${employeeId ? `&employee_id=${encodeURIComponent(employeeId)}` : ''}`);
    const json = await response.json();
    setPayslips(json.payslips || []);
  };

  const refreshExitChecklistData = async (employeeId = exitChecklistForm.employee_id) => {
    const response = await fetch(`/api/admin/hr/exit-checklist?limit=100${employeeId ? `&employee_id=${encodeURIComponent(employeeId)}` : ''}`);
    const json = await response.json();
    setExitChecklists(json.checklists || []);
    setExitChecklistItems(json.items || []);
  };

  const refreshLetterData = async (employeeId = letterForm.employee_id) => {
    const response = await fetch(`/api/admin/hr/letters?limit=100${employeeId ? `&employee_id=${encodeURIComponent(employeeId)}` : ''}`);
    const json = await response.json();
    setLetters(json.letters || []);
    setLetterTemplates(json.templates || []);
  };

  const refreshExitInterviewData = async (employeeId = exitInterviewForm.employee_id) => {
    const response = await fetch(`/api/admin/hr/exit-interviews?limit=100${employeeId ? `&employee_id=${encodeURIComponent(employeeId)}` : ''}`);
    const json = await response.json();
    setExitInterviews(json.interviews || []);
    setExitInterviewAnalytics(json.analytics || null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">HR Module</p>
          <h1 className="text-3xl font-bold text-slate-950">{activeMeta.number} {activeMeta.title}</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">{activeMeta.description}</p>
        </div>
        {canUseAddForm && (
          <button
            onClick={() => {
              setFormError('');
              if (showAddForm) {
                setShowAddForm(false);
                setEditingEmployee(null);
                return;
              }
              if (activeModule === 'employee-data-sheet') {
                openCreateEmployee();
              } else {
                setShowAddForm(true);
              }
            }}
            className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium ${showAddForm ? 'bg-slate-600 hover:bg-slate-700' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
          >
            <Plus className={`h-4 w-4 transition-transform ${showAddForm ? 'rotate-45' : ''}`} />
            {showAddForm ? 'Close Form' : addButtonLabel}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-9">
        {modules.map((item) => {
          const Icon = item.icon;
          const active = item.key === activeModule;
          return (
            <a
              key={item.key}
              href={item.href}
              className={`rounded-lg border p-3 transition-colors ${active ? 'border-blue-300 bg-blue-50 text-blue-800' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span className="text-xs font-semibold">{item.number}</span>
              </div>
              <div className="mt-2 text-sm font-medium">{item.title}</div>
            </a>
          );
        })}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search employees by name, email, ID, or mobile"
            className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex h-56 items-center justify-center rounded-lg border border-slate-200 bg-white">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
        </div>
      ) : loadError ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
          {loadError}
        </div>
      ) : renderActiveModule()}

      <Drawer
        open={canUseAddForm && showAddForm}
        onClose={() => { setShowAddForm(false); setEditingEmployee(null); setFormError(''); }}
        title={drawerTitle}
      >
        {renderActiveModuleForm()}
      </Drawer>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function PayrollBox({ label, value, currencyCode, tone = 'normal' }: { label: string; value: number; currencyCode: string; tone?: 'normal' | 'danger' }) {
  const formatMoney = (v: number) => {
    try {
      return new Intl.NumberFormat('en-AE', { style: 'currency', currency: currencyCode, maximumFractionDigits: 0 }).format(v);
    } catch {
      return `${currencyCode} ${Number(v || 0).toLocaleString()}`;
    }
  };
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-2 text-xl font-semibold ${tone === 'danger' ? 'text-rose-700' : 'text-slate-950'}`}>{formatMoney(value)}</p>
    </div>
  );
}

function ActionPanel({ actions }: { actions: string[] }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <h3 className="text-lg font-semibold text-slate-950">Workflow</h3>
      <div className="mt-4 space-y-3">
        {actions.map((action, index) => (
          <div key={action} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">{index + 1}</span>
            <span className="text-sm text-slate-700">{action}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Detail({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className={`text-right text-sm ${strong ? 'text-lg font-semibold text-slate-950' : 'font-medium text-slate-800'}`}>{value}</dd>
    </div>
  );
}
