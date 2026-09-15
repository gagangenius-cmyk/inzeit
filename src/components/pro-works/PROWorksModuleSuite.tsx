'use client';

import { SearchableSelect } from '@/components/ui/searchable-select';
import { DataTable } from '@/components/ui/data-table';
import { useEffect, useMemo, useState } from 'react';
import type { ComponentType, ReactNode } from 'react';
import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  CalendarClock,
  Download,
  FileText,
  Landmark,
  Plus,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

type ModuleKey =
  | 'company-documents'
  | 'employee-labour-immigration'
  | 'wps-management'
  | 'renewal-reminders'
  | 'insurance-list'
  | 'gcc-branch-documents'
  | 'owners-document-database';

type ProDocument = {
  id?: number;
  documentId?: string;
  companyId: string;
  title: string;
  owner?: string;
  category?: string;
  docType: string;
  docNumber: string;
  authority: string;
  issuingAuthority: string;
  issueDate: string;
  expiryDate: string;
  reminderDays?: string | number[];
  status: 'Valid' | 'Critical' | 'Expiring Soon' | 'Expired' | 'Renewal In Progress' | 'Cancelled';
  docFileUrl?: string | null;
  notes?: string | null;
  managedBy: string;
  renewalCost?: number | string | null;
  lastRenewed?: string | null;
  location?: string;
};

type EmployeeCompliance = {
  proEmpId?: string;
  employeeId?: string;
  employeeName: string;
  nationality?: string | null;
  emiratesId?: string | null;
  emiratesIdExpiry?: string | null;
  visaUid: string;
  visaType: string;
  visaIssueDate?: string;
  visaExpiryDate: string;
  visaStatus: 'Active' | 'Expiring' | 'Expired' | 'Cancelled' | 'Under Processing';
  labourCardNo: string;
  labourCardExpiry: string;
  contractType?: string;
  mohreContractRef?: string | null;
  medicalFitness?: string | null;
  healthInsuranceNo?: string | null;
  insuranceExpiry?: string | null;
  entryPermitNo?: string | null;
  visaDaysLeft?: number | string | null;
  labourDaysLeft?: number | string | null;
  insuranceDaysLeft?: number | string | null;
};

type WpsRecord = {
  id?: number;
  wpsId?: string;
  month?: string;
  payrollMonth?: string;
  employees?: number;
  totalEmployees?: number | string;
  grossPayroll?: number;
  totalAmount?: number | string;
  sifStatus?: 'Prepared' | 'Uploaded' | 'Approved';
  status?: 'Draft' | 'Generated' | 'Submitted' | 'Confirmed' | 'Rejected';
  bank?: string;
  agentId?: string;
  employerCode?: string;
  transferDate?: string;
  submissionDate?: string | null;
  submissionRef?: string | null;
  rejectionReason?: string | null;
  sifFileUrl?: string | null;
  processedBy?: string;
  processedByName?: string | null;
};

type ReminderRule = {
  documentType: string;
  thresholds: number[];
  parties: string[];
};

type NotificationLog = {
  logId: string;
  documentType: string;
  recordId: string;
  thresholdDays: number | string;
  expiryDate: string;
  title: string;
  status: 'Sent' | 'Skipped' | 'Failed';
  sentAt: string;
  errorMessage?: string | null;
};

type TrackedRenewalItem = {
  documentType: string;
  label: string;
  expiryDate: string;
  thresholds: number[];
  parties: string[];
};
type RenewalTrackerBucket = 'Expired' | 'Expiring 0-30' | 'Expiring 31-90' | 'Valid > 90';
type RenewalTrackerRow = TrackedRenewalItem & {
  recordId: string;
  sourceModule: 'HR' | 'PRO';
  daysLeft: number;
  bucket: RenewalTrackerBucket;
  entity: string;
  responsibleOfficer: string;
};
type RenewalTracker = {
  rows: RenewalTrackerRow[];
  grouped: Record<RenewalTrackerBucket, RenewalTrackerRow[]>;
  summary: {
    expired: number;
    expiring0To30: number;
    expiring31To90: number;
    validOver90: number;
    total: number;
  };
  filters: {
    documentTypes: string[];
    responsibleOfficers: string[];
  };
};

type ReminderRunResult = {
  dryRun: boolean;
  scanned: number;
  matched: number;
  sent: number;
  skipped: number;
  failed: number;
  results: Array<{
    documentType: string;
    label: string;
    expiryDate: string;
    daysLeft: number;
    status: 'Matched' | 'Sent' | 'Skipped' | 'Failed';
    recipients: number[];
    reason?: string;
  }>;
};

type InsuranceRecord = {
  id?: number;
  insuranceId?: string;
  insuranceCategory?: string;
  employeeId?: string | null;
  insuredName: string;
  insuredLabel?: string;
  insuranceCompany: string;
  policyNumber: string;
  policyStart: string;
  policyExpiry: string;
  coverageAmount?: number | string | null;
  premiumAmount?: number | string | null;
  dependents?: string | unknown[] | null;
  networkCode?: string | null;
  cardUrl?: string | null;
  daysLeft?: number | string | null;
  status: 'Active' | 'Expiring' | 'Expired' | 'Cancelled';
};

type BranchDocument = {
  id?: number;
  branchId?: string;
  branchName: string;
  country: string;
  city: string;
  registrationNo: string;
  registrationExpiry: string;
  licenceType: string;
  licenceExpiry: string;
  bankAccount?: string | null;
  bankName?: string | null;
  branchManager?: string | null;
  contactPhone?: string | null;
  documents?: string | unknown[] | null;
  notes?: string | null;
  registrationDaysLeft?: number | string | null;
  licenceDaysLeft?: number | string | null;
  status: 'Active' | 'Inactive' | 'Renewal Pending';
};

type OwnerDocument = {
  id?: number;
  ownerId?: string;
  fullName: string;
  role: 'Owner' | 'Partner' | 'Investor' | 'Director' | 'Signatory';
  nationality: string;
  passportNo: string;
  passportExpiry: string;
  emiratesId?: string | null;
  emiratesIdExpiry?: string | null;
  residenceVisaNo?: string | null;
  visaExpiry?: string | null;
  sharePercentage?: number | string | null;
  poaDocument?: string | null;
  poaExpiry?: string | null;
  signatureSpecimen?: string | null;
  bankSignatories?: string | unknown[] | null;
  documents?: string | unknown[] | null;
  accessLevel: 'Restricted';
  passportDaysLeft?: number | string | null;
  emiratesIdDaysLeft?: number | string | null;
  visaDaysLeft?: number | string | null;
  poaDaysLeft?: number | string | null;
};

const modules: Array<{
  key: ModuleKey;
  number: string;
  title: string;
  description: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  { key: 'company-documents', number: '5.1', title: 'Company Documents & Licensing', description: 'Trade licences, MOA, chamber certificates, establishment cards, and authority records.', href: '/admin/pro-works/company-documents', icon: FileText },
  { key: 'employee-labour-immigration', number: '5.2', title: 'Employee List & Labour/Immigration', description: 'Employee labour cards, work permits, visa files, Emirates ID, and immigration status.', href: '/admin/pro-works/employee-labour-immigration', icon: Users },
  { key: 'wps-management', number: '5.3', title: 'WPS Management', description: 'Monthly WPS preparation, SIF upload, bank transfer tracking, and compliance status.', href: '/admin/pro-works/wps-management', icon: Landmark },
  { key: 'renewal-reminders', number: '5.4', title: 'Renewal Reminder System', description: 'Time-bound reminders for licence, visa, insurance, tenancy, and authority renewals.', href: '/admin/pro-works/renewal-reminders', icon: CalendarClock },
  { key: 'insurance-list', number: '5.5', title: 'Insurance List', description: 'Medical, workmen compensation, vehicle, and office policy records.', href: '/admin/pro-works/insurance-list', icon: ShieldCheck },
  { key: 'gcc-branch-documents', number: '5.6', title: 'GCC Branch Documents', description: 'Branch-level GCC licences, tax certificates, chamber documents, and local compliance.', href: '/admin/pro-works/gcc-branch-documents', icon: Building2 },
  { key: 'owners-document-database', number: '5.7', title: 'Owners Document Database', description: 'Owner passport, Emirates ID, shareholder certificates, POA, and signature records.', href: '/admin/pro-works/owners-document-database', icon: BadgeCheck },
];

const docTypeOptions = ['Trade License', 'Chamber Certificate', 'Establishment Card', 'MOA', 'AOA', 'VAT Certificate', 'Tax Registration', 'Office Lease', 'Bank Account', 'Other'];

const visaTypeOptions = ['Employment', 'Mission', 'Investor', 'Partner', 'Other'];
const contractTypeOptions = ['Limited', 'Unlimited'];

const insuranceCategoryOptions = ['Health', 'Vehicle', 'Office', 'Workmen Compensation', 'Other'];
const insuranceNetworkOptions = ['Basic', 'Enhanced', 'Premium'];

const gccCountryOptions = ['UAE', 'Saudi Arabia', 'Qatar', 'Bahrain', 'Kuwait', 'Oman'];

const ownerRoleOptions = ['Owner', 'Partner', 'Investor', 'Director', 'Signatory'];

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
};

const formatMoney = (value: number) => (
  new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED', maximumFractionDigits: 0 }).format(value)
);

const daysUntil = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 0;
  return Math.ceil((date.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
};

const rowStatus = (item: EmployeeCompliance) => {
  const visaDays = daysUntil(item.visaExpiryDate);
  const labourDays = daysUntil(item.labourCardExpiry);
  const insuranceDays = item.insuranceExpiry ? daysUntil(item.insuranceExpiry) : 9999;
  const minDays = Math.min(visaDays, labourDays, insuranceDays);
  if (item.visaStatus === 'Cancelled' || minDays < 0) return 'Expired';
  if (item.visaStatus === 'Under Processing') return 'Review';
  if (minDays < 60 || item.visaStatus === 'Expiring') return 'Renewal Due';
  return 'Compliant';
};

const ownerExpiryStatus = (item: OwnerDocument) => {
  const expiries = [
    item.passportExpiry,
    item.emiratesIdExpiry || '',
    item.visaExpiry || '',
    item.poaExpiry || '',
  ].filter(Boolean).map(daysUntil);
  const minDays = expiries.length ? Math.min(...expiries) : 9999;
  if (minDays < 0) return 'Expired';
  if (minDays <= 90) return 'Expiring';
  return 'Active';
};

const exportEmployeeRecords = (records: EmployeeCompliance[]) => {
  const headers = ['Name', 'Nationality', 'Visa Expiry', 'Labour Expiry', 'Emirates ID Expiry', 'Insurance Expiry', 'Visa UID', 'Labour Card'];
  const rows = records.map((record) => [
    record.employeeName,
    record.nationality || '',
    record.visaExpiryDate,
    record.labourCardExpiry,
    record.emiratesIdExpiry || '',
    record.insuranceExpiry || '',
    record.visaUid,
    record.labourCardNo,
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `mohre_employee_labour_list_${new Date().toISOString().slice(0, 10)}.xls`;
  link.click();
  URL.revokeObjectURL(url);
};

const exportRenewalTracker = (records: RenewalTrackerRow[]) => {
  const headers = ['Bucket', 'Document Type', 'Entity', 'Expiry Date', 'Days Left', 'Responsible Officer', 'Source Module', 'Record ID'];
  const rows = records.map((record) => [
    record.bucket,
    record.documentType,
    record.entity,
    record.expiryDate,
    record.daysLeft,
    record.responsibleOfficer,
    record.sourceModule,
    record.recordId,
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `renewal_tracker_${new Date().toISOString().slice(0, 10)}.xls`;
  link.click();
  URL.revokeObjectURL(url);
};

const badge = (status: string) => {
  const classes: Record<string, string> = {
    Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Compliant: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Expiring: 'bg-amber-50 text-amber-700 border-amber-200',
    Critical: 'bg-orange-50 text-orange-700 border-orange-200',
    'Expiring Soon': 'bg-amber-50 text-amber-700 border-amber-200',
    Valid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Renewal In Progress': 'bg-sky-50 text-sky-700 border-sky-200',
    Cancelled: 'bg-slate-50 text-slate-700 border-slate-200',
    'Renewal Due': 'bg-amber-50 text-amber-700 border-amber-200',
    Prepared: 'bg-sky-50 text-sky-700 border-sky-200',
    Generated: 'bg-sky-50 text-sky-700 border-sky-200',
    Submitted: 'bg-blue-50 text-blue-700 border-blue-200',
    Confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Rejected: 'bg-rose-50 text-rose-700 border-rose-200',
    Sent: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Skipped: 'bg-slate-50 text-slate-700 border-slate-200',
    Failed: 'bg-rose-50 text-rose-700 border-rose-200',
    Matched: 'bg-blue-50 text-blue-700 border-blue-200',
    Uploaded: 'bg-sky-50 text-sky-700 border-sky-200',
    Review: 'bg-violet-50 text-violet-700 border-violet-200',
    Draft: 'bg-slate-50 text-slate-700 border-slate-200',
    Missing: 'bg-rose-50 text-rose-700 border-rose-200',
    Expired: 'bg-rose-50 text-rose-700 border-rose-200',
    'Expiring 0-30': 'bg-orange-50 text-orange-700 border-orange-200',
    'Expiring 31-90': 'bg-amber-50 text-amber-700 border-amber-200',
    'Valid > 90': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Inactive: 'bg-slate-50 text-slate-700 border-slate-200',
    'Renewal Pending': 'bg-amber-50 text-amber-700 border-amber-200',
    Restricted: 'bg-violet-50 text-violet-700 border-violet-200',
    'Action Required': 'bg-rose-50 text-rose-700 border-rose-200',
  };

  return (
    <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${classes[status] || classes.Draft}`}>
      {status}
    </span>
  );
};

export default function PROWorksModuleSuite({ activeModule = 'company-documents' }: { activeModule?: ModuleKey }) {
  const { hasPermission, currencyCode } = useAuth();
  const formatMoney = (value: number) => {
    try {
      return new Intl.NumberFormat('en-AE', { style: 'currency', currency: currencyCode, maximumFractionDigits: 0 }).format(value);
    } catch {
      return `${currencyCode} ${Number(value || 0).toLocaleString()}`;
    }
  };
  const [documents, setDocuments] = useState<ProDocument[]>([]);
  const [employeeRecords, setEmployeeRecords] = useState<EmployeeCompliance[]>([]);
  const [wpsRuns, setWpsRuns] = useState<WpsRecord[]>([]);
  const [insurancePolicies, setInsurancePolicies] = useState<InsuranceRecord[]>([]);
  const [gccBranches, setGccBranches] = useState<BranchDocument[]>([]);
  const [owners, setOwners] = useState<OwnerDocument[]>([]);
  const [loadError, setLoadError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [reminderRules, setReminderRules] = useState<ReminderRule[]>([]);
  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>([]);
  const [trackedRenewalItems, setTrackedRenewalItems] = useState<TrackedRenewalItem[]>([]);
  const [renewalTracker, setRenewalTracker] = useState<RenewalTracker | null>(null);
  const [renewalFilters, setRenewalFilters] = useState({
    documentType: '',
    entity: '',
    responsibleOfficer: '',
  });
  const [renewalRun, setRenewalRun] = useState<ReminderRunResult | null>(null);
  const [renewalBusy, setRenewalBusy] = useState(false);
  const [query, setQuery] = useState('');
  const [documentForm, setDocumentForm] = useState({
    company_id: 'company-dm-uae',
    doc_type: 'Trade License',
    doc_number: '',
    issuing_authority: '',
    issue_date: new Date().toISOString().slice(0, 10),
    expiry_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().slice(0, 10),
    reminder_days: '90,60,30,7',
    doc_file_url: '',
    notes: '',
    managed_by: '1',
    renewal_cost: '',
    last_renewed: '',
  });
  const [employeeImmigrationForm, setEmployeeImmigrationForm] = useState({
    employee_id: '',
    visa_uid: '',
    visa_type: 'Employment',
    visa_issue_date: new Date().toISOString().slice(0, 10),
    visa_expiry_date: new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString().slice(0, 10),
    labour_card_no: '',
    labour_card_expiry: new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString().slice(0, 10),
    contract_type: 'Limited',
    mohre_contract_ref: '',
    medical_fitness: '',
    health_insurance_no: '',
    insurance_expiry: '',
    entry_permit_no: '',
    changed_by: '1',
  });
  const [wpsForm, setWpsForm] = useState({
    payroll_month: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`,
    employer_code: 'MOHRE-DM-001',
    agent_id: 'AGENT001',
    payment_date: new Date().toISOString().slice(0, 10),
    processed_by: '1',
    uid_labour_no: '',
    employee_name: '',
    salary: '',
    routing_code: '',
    account_number: '',
  });
  const [insuranceForm, setInsuranceForm] = useState({
    insurance_category: 'Health',
    employee_id: '',
    insured_name: '',
    insurance_company: '',
    policy_number: '',
    policy_start: new Date().toISOString().slice(0, 10),
    policy_expiry: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().slice(0, 10),
    coverage_amount: '',
    premium_amount: '',
    dependents: '',
    network_code: 'Enhanced',
    card_url: '',
  });
  const [gccBranchForm, setGccBranchForm] = useState({
    branch_name: '',
    country: 'UAE',
    city: '',
    registration_no: '',
    registration_expiry: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().slice(0, 10),
    licence_type: '',
    licence_expiry: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().slice(0, 10),
    bank_account: '',
    bank_name: '',
    branch_manager: '',
    contact_phone: '',
    documents: '',
    notes: '',
  });
  const [ownerForm, setOwnerForm] = useState({
    full_name: '',
    role: 'Owner',
    nationality: '',
    passport_no: '',
    passport_expiry: new Date(new Date().setFullYear(new Date().getFullYear() + 5)).toISOString().slice(0, 10),
    emirates_id: '',
    emirates_id_expiry: '',
    residence_visa_no: '',
    visa_expiry: '',
    share_percentage: '',
    poa_document: '',
    poa_expiry: '',
    signature_specimen: '',
    bank_signatories: '',
    documents: '',
  });
  const activeMeta = modules.find((item) => item.key === activeModule) || modules[0];

  useEffect(() => {
    setLoadError('');
    const loadDocuments = async () => {
      try {
        const response = await fetch('/api/admin/pro-works/company-documents?limit=100');
        const json = response.ok ? await response.json() : null;
        setDocuments((json?.documents || []).map((item: ProDocument) => ({
            ...item,
            owner: item.owner || item.companyId,
            category: item.category || item.docType,
        })));
      } catch (error) {
        console.error('Failed to load PRO company documents:', error);
        setDocuments([]);
        setLoadError('Some PRO records could not be loaded from the database.');
      }
    };

    loadDocuments();
    const loadEmployeeRecords = async () => {
      try {
        const response = await fetch('/api/admin/pro-works/employee-immigration?limit=100');
        const json = response.ok ? await response.json() : null;
        setEmployeeRecords(json?.records || []);
      } catch (error) {
        console.error('Failed to load employee immigration records:', error);
        setEmployeeRecords([]);
        setLoadError('Some PRO records could not be loaded from the database.');
      }
    };

    loadEmployeeRecords();
    const loadWpsRuns = async () => {
      try {
        const response = await fetch('/api/admin/pro-works/wps?limit=100');
        const json = response.ok ? await response.json() : null;
        setWpsRuns(json?.records || []);
      } catch (error) {
        console.error('Failed to load WPS records:', error);
        setWpsRuns([]);
        setLoadError('Some PRO records could not be loaded from the database.');
      }
    };

    loadWpsRuns();
    const loadInsurancePolicies = async () => {
      try {
        const response = await fetch('/api/admin/pro-works/insurance?limit=100');
        const json = response.ok ? await response.json() : null;
        setInsurancePolicies(json?.records || []);
      } catch (error) {
        console.error('Failed to load insurance records:', error);
        setInsurancePolicies([]);
        setLoadError('Some PRO records could not be loaded from the database.');
      }
    };

    loadInsurancePolicies();
    const loadGccBranches = async () => {
      try {
        const response = await fetch('/api/admin/pro-works/gcc-branches?limit=100');
        const json = response.ok ? await response.json() : null;
        setGccBranches(json?.records || []);
      } catch (error) {
        console.error('Failed to load GCC branch documents:', error);
        setGccBranches([]);
        setLoadError('Some PRO records could not be loaded from the database.');
      }
    };

    loadGccBranches();
    const loadOwners = async () => {
      try {
        const response = await fetch('/api/admin/pro-works/owners?limit=100');
        const json = response.ok ? await response.json() : null;
        setOwners(json?.records || []);
      } catch (error) {
        console.error('Failed to load owner documents:', error);
        setOwners([]);
        setLoadError('Some PRO records could not be loaded from the database.');
      }
    };

    loadOwners();
    const loadRenewalReminders = async () => {
      try {
        const response = await fetch('/api/admin/pro-works/renewal-reminders?limit=100');
        const json = response.ok ? await response.json() : null;
        if (json?.rules) setReminderRules(json.rules);
        if (json?.logs) setNotificationLogs(json.logs);
        if (json?.trackedItems) setTrackedRenewalItems(json.trackedItems);
        if (json?.tracker) setRenewalTracker(json.tracker);
      } catch (error) {
        console.error('Failed to load renewal reminder engine data:', error);
        setLoadError('Some PRO records could not be loaded from the database.');
      }
    };

    loadRenewalReminders();
  }, []);

  const renewalItems = useMemo(() => {
    const documentReminders = documents.map((item) => ({
      id: `doc-${item.id}`,
      title: item.title,
      type: item.docType,
      owner: item.owner || item.companyId,
      dueDate: item.expiryDate,
      days: daysUntil(item.expiryDate),
      status: item.status,
    }));

    const insuranceReminders = insurancePolicies.map((item) => ({
      id: `ins-${item.insuranceId || item.id}`,
      title: item.policyNumber,
      type: item.insuranceCategory || 'Insurance',
      owner: item.insuredName,
      dueDate: item.policyExpiry,
      days: daysUntil(item.policyExpiry),
      status: item.status,
    }));

    return [...documentReminders, ...insuranceReminders].sort((a, b) => a.days - b.days);
  }, [documents, insurancePolicies]);
  const filteredRenewalTrackerRows = useMemo(() => (
    (renewalTracker?.rows || []).filter((item) => {
      const documentMatch = !renewalFilters.documentType || item.documentType === renewalFilters.documentType;
      const entityMatch = !renewalFilters.entity || item.entity.toLowerCase().includes(renewalFilters.entity.toLowerCase());
      const officerMatch = !renewalFilters.responsibleOfficer || item.responsibleOfficer.toLowerCase().includes(renewalFilters.responsibleOfficer.toLowerCase());
      return documentMatch && entityMatch && officerMatch;
    })
  ), [renewalFilters, renewalTracker]);
  const filteredRenewalGroups = useMemo(() => {
    const groups: Record<RenewalTrackerBucket, RenewalTrackerRow[]> = {
      Expired: [],
      'Expiring 0-30': [],
      'Expiring 31-90': [],
      'Valid > 90': [],
    };
    filteredRenewalTrackerRows.forEach((item) => groups[item.bucket].push(item));
    return groups;
  }, [filteredRenewalTrackerRows]);

  const searchPool = [
    ...documents.map((item) => `${item.title} ${item.owner || ''} ${item.docType} ${item.docNumber} ${item.authority}`),
    ...employeeRecords.map((item) => `${item.employeeName} ${item.nationality || ''} ${item.labourCardNo} ${item.visaUid}`),
    ...insurancePolicies.map((item) => `${item.insuredName} ${item.insuranceCompany} ${item.policyNumber} ${item.insuranceCategory || ''}`),
    ...gccBranches.map((item) => `${item.branchName} ${item.country} ${item.city} ${item.registrationNo} ${item.licenceType}`),
    ...owners.map((item) => `${item.fullName} ${item.role} ${item.nationality} ${item.passportNo}`),
  ];

  const matchingRecords = query
    ? searchPool.filter((item) => item.toLowerCase().includes(query.toLowerCase())).length
    : searchPool.length;

  const canCreate = hasPermission('pro.create');
  const canViewOwners = hasPermission('pro.owners.restricted') || hasPermission('admin.access');
  const canUseProAddForm = activeModule !== 'renewal-reminders' && (
    activeModule === 'owners-document-database' ? canViewOwners : canCreate
  );
  const canViewCurrentModule = hasPermission('pro.view') ||
    (activeModule === 'wps-management' && hasPermission('pro.wps.view')) ||
    (activeModule === 'owners-document-database' && canViewOwners);
  const runRenewalScan = async (dryRun: boolean) => {
    setRenewalBusy(true);
    try {
      const response = await fetch('/api/admin/pro-works/renewal-reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun }),
      });
      const json = response.ok ? await response.json() : null;
      if (json) setRenewalRun(json);

      const refresh = await fetch('/api/admin/pro-works/renewal-reminders?limit=100');
      const refreshJson = refresh.ok ? await refresh.json() : null;
      if (refreshJson?.logs) setNotificationLogs(refreshJson.logs);
      if (refreshJson?.trackedItems) setTrackedRenewalItems(refreshJson.trackedItems);
      if (refreshJson?.tracker) setRenewalTracker(refreshJson.tracker);
    } catch (error) {
      console.error('Failed to run renewal reminder scan:', error);
    } finally {
      setRenewalBusy(false);
    }
  };

  if (!canViewCurrentModule) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
        <h1 className="text-2xl font-semibold text-slate-950">PRO access required</h1>
        <p className="mt-2 text-sm text-slate-600">Your role does not include access to this PRO module.</p>
      </div>
    );
  }

  const renderCompanyDocuments = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Metric label="Documents" value={documents.length.toString()} />
        <Metric label="Valid" value={documents.filter((item) => item.status === 'Valid').length.toString()} />
        <Metric label="Expiring soon" value={documents.filter((item) => item.status === 'Expiring Soon').length.toString()} />
        <Metric label="Authorities" value={new Set(documents.map((item) => item.authority)).size.toString()} />
      </div>
      {canCreate && showAddForm && (
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            const response = await fetch('/api/admin/pro-works/company-documents', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...documentForm,
                renewal_cost: documentForm.renewal_cost ? Number(documentForm.renewal_cost) : null,
                doc_file_url: documentForm.doc_file_url || null,
                notes: documentForm.notes || null,
                last_renewed: documentForm.last_renewed || null,
              }),
            });

            if (response.ok) {
              const refreshed = await fetch('/api/admin/pro-works/company-documents?limit=100');
              const json = await refreshed.json();
              setDocuments((json.documents || []).map((item: ProDocument) => ({
                ...item,
                owner: item.owner || item.companyId,
                category: item.category || item.docType,
              })));
              setDocumentForm((previous) => ({ ...previous, doc_number: '', notes: '', doc_file_url: '', renewal_cost: '' }));
            }
          }}
          className="rounded-lg border border-slate-200 bg-white p-5"
        >
          <h3 className="text-lg font-semibold text-slate-950">Company Document Record</h3>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Company ID</span>
              <input value={documentForm.company_id} onChange={(event) => setDocumentForm({ ...documentForm, company_id: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Document Type</span>
              <SearchableSelect value={documentForm.doc_type} onChange={(event) => setDocumentForm({ ...documentForm, doc_type: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required>
                {docTypeOptions.map((type) => <option key={type}>{type}</option>)}
              </SearchableSelect>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Document Number</span>
              <input value={documentForm.doc_number} onChange={(event) => setDocumentForm({ ...documentForm, doc_number: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Issuing Authority</span>
              <input value={documentForm.issuing_authority} onChange={(event) => setDocumentForm({ ...documentForm, issuing_authority: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Issue Date</span>
              <input type="date" value={documentForm.issue_date} onChange={(event) => setDocumentForm({ ...documentForm, issue_date: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Expiry Date</span>
              <input type="date" value={documentForm.expiry_date} onChange={(event) => setDocumentForm({ ...documentForm, expiry_date: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Reminder Days</span>
              <input value={documentForm.reminder_days} onChange={(event) => setDocumentForm({ ...documentForm, reminder_days: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Managed By</span>
              <input value={documentForm.managed_by} onChange={(event) => setDocumentForm({ ...documentForm, managed_by: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Renewal Cost</span>
              <input type="number" step="0.01" value={documentForm.renewal_cost} onChange={(event) => setDocumentForm({ ...documentForm, renewal_cost: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Last Renewed</span>
              <input type="date" value={documentForm.last_renewed} onChange={(event) => setDocumentForm({ ...documentForm, last_renewed: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm font-medium text-slate-700">Document File URL</span>
              <input value={documentForm.doc_file_url} onChange={(event) => setDocumentForm({ ...documentForm, doc_file_url: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <label className="block md:col-span-4">
              <span className="text-sm font-medium text-slate-700">Notes</span>
              <textarea value={documentForm.notes} onChange={(event) => setDocumentForm({ ...documentForm, notes: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" rows={3} />
            </label>
          </div>
          <div className="mt-4 flex justify-end">
            <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Save Document
            </button>
          </div>
        </form>
      )}
      <DataTable
        headers={['Document', 'Number', 'Authority', 'Issue', 'Expiry', 'Managed By', 'Cost', 'Status']}
        rows={documents.map((item) => [
          <RecordTitle key={item.id} title={item.title} subtitle={`${item.owner} · ${item.category}`} />,
          item.docNumber,
          item.issuingAuthority || item.authority,
          formatDate(item.issueDate),
          formatDate(item.expiryDate),
          item.managedBy,
          item.renewalCost ? formatMoney(Number(item.renewalCost)) : 'Not set',
          badge(item.status),
        ])}
      />
    </div>
  );

  const renderEmployeeCompliance = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Metric label="Employees tracked" value={employeeRecords.length.toString()} />
        <Metric label="Active visas" value={employeeRecords.filter((item) => item.visaStatus === 'Active').length.toString()} />
        <Metric label="Needs action" value={employeeRecords.filter((item) => item.visaStatus !== 'Active').length.toString()} />
      </div>

      {canCreate && showAddForm && (
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            const response = await fetch('/api/admin/pro-works/employee-immigration', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...employeeImmigrationForm,
                mohre_contract_ref: employeeImmigrationForm.mohre_contract_ref || null,
                medical_fitness: employeeImmigrationForm.medical_fitness || null,
                health_insurance_no: employeeImmigrationForm.health_insurance_no || null,
                insurance_expiry: employeeImmigrationForm.insurance_expiry || null,
                entry_permit_no: employeeImmigrationForm.entry_permit_no || null,
              }),
            });

            if (response.ok) {
              const refreshed = await fetch('/api/admin/pro-works/employee-immigration?limit=100');
              const json = await refreshed.json();
              setEmployeeRecords(json.records || []);
              setEmployeeImmigrationForm((previous) => ({ ...previous, visa_uid: '', labour_card_no: '', mohre_contract_ref: '', entry_permit_no: '' }));
            }
          }}
          className="rounded-lg border border-slate-200 bg-white p-5"
        >
          <h3 className="text-lg font-semibold text-slate-950">Employee Labour & Immigration Record</h3>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">HR Employee ID</span>
              <input value={employeeImmigrationForm.employee_id} onChange={(event) => setEmployeeImmigrationForm({ ...employeeImmigrationForm, employee_id: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">GDRFA UID</span>
              <input value={employeeImmigrationForm.visa_uid} onChange={(event) => setEmployeeImmigrationForm({ ...employeeImmigrationForm, visa_uid: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Visa Type</span>
              <SearchableSelect value={employeeImmigrationForm.visa_type} onChange={(event) => setEmployeeImmigrationForm({ ...employeeImmigrationForm, visa_type: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                {visaTypeOptions.map((type) => <option key={type}>{type}</option>)}
              </SearchableSelect>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Visa Issue</span>
              <input type="date" value={employeeImmigrationForm.visa_issue_date} onChange={(event) => setEmployeeImmigrationForm({ ...employeeImmigrationForm, visa_issue_date: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Visa Expiry</span>
              <input type="date" value={employeeImmigrationForm.visa_expiry_date} onChange={(event) => setEmployeeImmigrationForm({ ...employeeImmigrationForm, visa_expiry_date: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Labour Card No</span>
              <input value={employeeImmigrationForm.labour_card_no} onChange={(event) => setEmployeeImmigrationForm({ ...employeeImmigrationForm, labour_card_no: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Labour Expiry</span>
              <input type="date" value={employeeImmigrationForm.labour_card_expiry} onChange={(event) => setEmployeeImmigrationForm({ ...employeeImmigrationForm, labour_card_expiry: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Contract Type</span>
              <SearchableSelect value={employeeImmigrationForm.contract_type} onChange={(event) => setEmployeeImmigrationForm({ ...employeeImmigrationForm, contract_type: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                {contractTypeOptions.map((type) => <option key={type}>{type}</option>)}
              </SearchableSelect>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">MOHRE Ref</span>
              <input value={employeeImmigrationForm.mohre_contract_ref} onChange={(event) => setEmployeeImmigrationForm({ ...employeeImmigrationForm, mohre_contract_ref: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Medical Fitness Expiry</span>
              <input type="date" value={employeeImmigrationForm.medical_fitness} onChange={(event) => setEmployeeImmigrationForm({ ...employeeImmigrationForm, medical_fitness: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Insurance No</span>
              <input value={employeeImmigrationForm.health_insurance_no} onChange={(event) => setEmployeeImmigrationForm({ ...employeeImmigrationForm, health_insurance_no: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Insurance Expiry</span>
              <input type="date" value={employeeImmigrationForm.insurance_expiry} onChange={(event) => setEmployeeImmigrationForm({ ...employeeImmigrationForm, insurance_expiry: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </label>
          </div>
          <div className="mt-4 flex justify-between gap-2">
            <button
              type="button"
              onClick={() => exportEmployeeRecords(employeeRecords)}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Export Excel
            </button>
            <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Save Record
            </button>
          </div>
        </form>
      )}

      <DataTable
        headers={['Employee', 'Nationality', 'Visa Expiry', 'Labour Expiry', 'Emirates ID', 'Insurance Expiry', 'Status']}
        rows={employeeRecords.map((item) => [
          <RecordTitle key={item.proEmpId || item.employeeId} title={item.employeeName} subtitle={item.visaUid} />,
          item.nationality || 'Not set',
          formatDate(item.visaExpiryDate),
          formatDate(item.labourCardExpiry),
          item.emiratesIdExpiry ? formatDate(item.emiratesIdExpiry) : 'Not set',
          item.insuranceExpiry ? formatDate(item.insuranceExpiry) : 'Not set',
          badge(rowStatus(item)),
        ])}
      />
    </div>
  );

  const renderWps = () => (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Metric label="WPS runs" value={wpsRuns.length.toString()} />
          <Metric label="Total payroll" value={formatMoney(wpsRuns.reduce((sum, item) => sum + Number(item.totalAmount || item.grossPayroll || 0), 0))} />
          <Metric label="Confirmed" value={wpsRuns.filter((item) => item.status === 'Confirmed' || item.sifStatus === 'Approved').length.toString()} />
        </div>

        {canCreate && showAddForm && (
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              const response = await fetch('/api/admin/pro-works/wps', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  payroll_month: wpsForm.payroll_month,
                  employer_code: wpsForm.employer_code,
                  agent_id: wpsForm.agent_id,
                  payment_date: wpsForm.payment_date,
                  processed_by: wpsForm.processed_by,
                  salary_records: [{
                    uid_labour_no: wpsForm.uid_labour_no,
                    name: wpsForm.employee_name,
                    salary: Number(wpsForm.salary || 0),
                    routing_code: wpsForm.routing_code,
                    account_number: wpsForm.account_number,
                  }],
                }),
              });

              if (response.ok) {
                const refreshed = await fetch('/api/admin/pro-works/wps?limit=100');
                const json = await refreshed.json();
                setWpsRuns(json.records || []);
              }
            }}
            className="rounded-lg border border-slate-200 bg-white p-5"
          >
            <h3 className="text-lg font-semibold text-slate-950">Generate WPS SIF</h3>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Payroll Month</span>
                <input type="date" value={wpsForm.payroll_month} onChange={(event) => setWpsForm({ ...wpsForm, payroll_month: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Employer Code</span>
                <input value={wpsForm.employer_code} onChange={(event) => setWpsForm({ ...wpsForm, employer_code: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Agent ID</span>
                <input value={wpsForm.agent_id} onChange={(event) => setWpsForm({ ...wpsForm, agent_id: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Payment Date</span>
                <input type="date" value={wpsForm.payment_date} onChange={(event) => setWpsForm({ ...wpsForm, payment_date: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">UID / Labour No</span>
                <input value={wpsForm.uid_labour_no} onChange={(event) => setWpsForm({ ...wpsForm, uid_labour_no: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Employee Name</span>
                <input value={wpsForm.employee_name} onChange={(event) => setWpsForm({ ...wpsForm, employee_name: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Net Salary</span>
                <input type="number" step="0.01" value={wpsForm.salary} onChange={(event) => setWpsForm({ ...wpsForm, salary: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Routing Code</span>
                <input value={wpsForm.routing_code} onChange={(event) => setWpsForm({ ...wpsForm, routing_code: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Account Number</span>
                <input value={wpsForm.account_number} onChange={(event) => setWpsForm({ ...wpsForm, account_number: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
              </label>
            </div>
            <div className="mt-4 flex justify-end">
              <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                Generate SIF
              </button>
            </div>
          </form>
        )}

        <DataTable
          headers={['Month', 'Employees', 'Total Amount', 'Agent', 'SIF', 'Submission', 'Status']}
          rows={wpsRuns.map((item) => [
            item.payrollMonth ? formatDate(item.payrollMonth) : item.month || 'Not set',
            String(item.totalEmployees || item.employees || 0),
            formatMoney(Number(item.totalAmount || item.grossPayroll || 0)),
            item.agentId || item.bank || 'Not set',
            item.sifFileUrl ? <a key={`${item.wpsId}-sif`} href={item.sifFileUrl} target="_blank" rel="noreferrer" className="font-medium text-blue-700 hover:underline">Download</a> : 'Not generated',
            item.submissionRef || (item.submissionDate ? formatDate(item.submissionDate) : 'Not submitted'),
            badge(item.status || item.sifStatus || 'Draft'),
          ])}
        />
      </div>
      <Workflow actions={['Validate payroll against HR data', 'Generate SIF file', 'Upload to bank portal', 'Archive WPS confirmation']} />
    </div>
  );

  const renderRenewals = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Metric label="Total reminders" value={renewalItems.length.toString()} />
        <Metric label="Due in 90 days" value={renewalItems.filter((item) => item.days <= 90).length.toString()} />
        <Metric label="Overdue" value={renewalItems.filter((item) => item.days < 0).length.toString()} />
        <Metric label="Engine records" value={trackedRenewalItems.length.toString()} />
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">Daily Reminder Engine</h3>
            <p className="mt-1 text-sm text-slate-600">Scheduled for 08:00 UAE time. Duplicate alerts are blocked by the notification log.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => runRenewalScan(true)}
              disabled={renewalBusy}
              className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              Preview Scan
            </button>
            {canCreate && (
              <button
                type="button"
                onClick={() => runRenewalScan(false)}
                disabled={renewalBusy}
                className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                Run & Notify
              </button>
            )}
          </div>
        </div>
        {renewalRun && (
          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-5">
            <Metric label={renewalRun.dryRun ? 'Preview matched' : 'Matched'} value={renewalRun.matched.toString()} />
            <Metric label="Scanned" value={renewalRun.scanned.toString()} />
            <Metric label="Sent" value={renewalRun.sent.toString()} />
            <Metric label="Skipped" value={renewalRun.skipped.toString()} />
            <Metric label="Failed" value={renewalRun.failed.toString()} />
          </div>
        )}
        {renewalRun?.results?.length ? (
          <div className="mt-5">
            <DataTable
              headers={['Result', 'Document', 'Item', 'Expiry', 'Recipients', 'Status']}
              rows={renewalRun.results.map((item) => [
                item.reason || `${item.daysLeft} day threshold`,
                item.documentType,
                item.label,
                formatDate(item.expiryDate),
                item.recipients.length.toString(),
                badge(item.status),
              ])}
            />
          </div>
        ) : null}
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">Renewal Tracker</h3>
            <p className="mt-1 text-sm text-slate-600">Expired, expiring, and valid records grouped from HR and PRO expiry dates.</p>
          </div>
          <button
            type="button"
            onClick={() => exportRenewalTracker(filteredRenewalTrackerRows)}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Download className="h-4 w-4" />
            Export Excel
          </button>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Document Type</span>
            <SearchableSelect value={renewalFilters.documentType} onChange={(event) => setRenewalFilters({ ...renewalFilters, documentType: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
              <option value="">All types</option>
              {(renewalTracker?.filters.documentTypes || []).map((type) => <option key={type}>{type}</option>)}
            </SearchableSelect>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Entity</span>
            <input value={renewalFilters.entity} onChange={(event) => setRenewalFilters({ ...renewalFilters, entity: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Responsible Officer</span>
            <SearchableSelect value={renewalFilters.responsibleOfficer} onChange={(event) => setRenewalFilters({ ...renewalFilters, responsibleOfficer: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
              <option value="">All officers</option>
              {(renewalTracker?.filters.responsibleOfficers || []).map((officer) => <option key={officer} value={officer}>{officer.replace(/_/g, ' ')}</option>)}
            </SearchableSelect>
          </label>
          <div className="flex items-end">
            <button type="button" onClick={() => setRenewalFilters({ documentType: '', entity: '', responsibleOfficer: '' })} className="w-full rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Clear Filters
            </button>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-4">
          {([
            ['Expired', 'border-red-200 bg-red-50 text-red-800'],
            ['Expiring 0-30', 'border-orange-200 bg-orange-50 text-orange-800'],
            ['Expiring 31-90', 'border-amber-200 bg-amber-50 text-amber-800'],
            ['Valid > 90', 'border-emerald-200 bg-emerald-50 text-emerald-800'],
          ] as Array<[RenewalTrackerBucket, string]>).map(([bucket, className]) => (
            <div key={bucket} className={`rounded-lg border p-4 ${className}`}>
              <div className="text-sm font-medium">{bucket}</div>
              <div className="mt-2 text-3xl font-bold">{filteredRenewalGroups[bucket].length}</div>
              <div className="mt-3 space-y-2">
                {filteredRenewalGroups[bucket].slice(0, 3).map((item) => (
                  <div key={`${bucket}-${item.recordId}`} className="rounded-md bg-white/70 p-2 text-xs">
                    <div className="font-semibold">{item.documentType}</div>
                    <div>{item.entity}</div>
                    <div>{formatDate(item.expiryDate)} ({item.daysLeft}d)</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <DataTable
        headers={['Item', 'Type', 'Owner', 'Due Date', 'Days Left', 'Status']}
        rows={filteredRenewalTrackerRows.map((item) => [
          item.entity,
          item.documentType,
          item.responsibleOfficer.replace(/_/g, ' '),
          formatDate(item.expiryDate),
          <span key={item.recordId} className={item.daysLeft <= 90 ? 'font-semibold text-amber-700' : 'text-slate-700'}>{item.daysLeft}</span>,
          badge(item.bucket),
        ])}
      />
      <DataTable
        headers={['Rule', 'Thresholds', 'Notified Parties']}
        rows={reminderRules.map((rule) => [
          rule.documentType,
          rule.thresholds.join(', '),
          rule.parties.map((party) => party.replace(/_/g, ' ')).join(', '),
        ])}
      />
      <DataTable
        headers={['Notification', 'Threshold', 'Expiry', 'Sent At', 'Status']}
        rows={notificationLogs.map((log) => [
          log.title,
          `${log.thresholdDays} days`,
          formatDate(log.expiryDate),
          formatDate(log.sentAt),
          badge(log.status),
        ])}
      />
    </div>
  );

  const renderInsurance = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Metric label="Policies" value={insurancePolicies.length.toString()} />
        <Metric label="Providers" value={new Set(insurancePolicies.map((item) => item.insuranceCompany)).size.toString()} />
        <Metric label="Expiring" value={insurancePolicies.filter((item) => item.status === 'Expiring').length.toString()} />
      </div>
      {canCreate && showAddForm && (
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            const response = await fetch('/api/admin/pro-works/insurance', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...insuranceForm,
                employee_id: insuranceForm.employee_id || null,
                coverage_amount: insuranceForm.coverage_amount ? Number(insuranceForm.coverage_amount) : null,
                premium_amount: insuranceForm.premium_amount ? Number(insuranceForm.premium_amount) : null,
                dependents: insuranceForm.dependents,
                network_code: insuranceForm.network_code || null,
                card_url: insuranceForm.card_url || null,
              }),
            });

            if (response.ok) {
              const refreshed = await fetch('/api/admin/pro-works/insurance?limit=100');
              const json = await refreshed.json();
              setInsurancePolicies(json.records || []);
              setInsuranceForm((previous) => ({
                ...previous,
                employee_id: '',
                insured_name: '',
                insurance_company: '',
                policy_number: '',
                coverage_amount: '',
                premium_amount: '',
                dependents: '',
                card_url: '',
              }));
            }
          }}
          className="rounded-lg border border-slate-200 bg-white p-5"
        >
          <h3 className="text-lg font-semibold text-slate-950">Insurance Policy Record</h3>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Category</span>
              <SearchableSelect value={insuranceForm.insurance_category} onChange={(event) => setInsuranceForm({ ...insuranceForm, insurance_category: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                {insuranceCategoryOptions.map((category) => <option key={category}>{category}</option>)}
              </SearchableSelect>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Employee ID</span>
              <input value={insuranceForm.employee_id} onChange={(event) => setInsuranceForm({ ...insuranceForm, employee_id: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Insured Name</span>
              <input value={insuranceForm.insured_name} onChange={(event) => setInsuranceForm({ ...insuranceForm, insured_name: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Insurance Company</span>
              <input value={insuranceForm.insurance_company} onChange={(event) => setInsuranceForm({ ...insuranceForm, insurance_company: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Policy Number</span>
              <input value={insuranceForm.policy_number} onChange={(event) => setInsuranceForm({ ...insuranceForm, policy_number: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Policy Start</span>
              <input type="date" value={insuranceForm.policy_start} onChange={(event) => setInsuranceForm({ ...insuranceForm, policy_start: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Policy Expiry</span>
              <input type="date" value={insuranceForm.policy_expiry} onChange={(event) => setInsuranceForm({ ...insuranceForm, policy_expiry: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Network</span>
              <SearchableSelect value={insuranceForm.network_code} onChange={(event) => setInsuranceForm({ ...insuranceForm, network_code: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                {insuranceNetworkOptions.map((network) => <option key={network}>{network}</option>)}
              </SearchableSelect>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Coverage Amount</span>
              <input type="number" step="0.01" value={insuranceForm.coverage_amount} onChange={(event) => setInsuranceForm({ ...insuranceForm, coverage_amount: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Premium Amount</span>
              <input type="number" step="0.01" value={insuranceForm.premium_amount} onChange={(event) => setInsuranceForm({ ...insuranceForm, premium_amount: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm font-medium text-slate-700">Dependents</span>
              <input value={insuranceForm.dependents} onChange={(event) => setInsuranceForm({ ...insuranceForm, dependents: event.target.value })} placeholder="Comma names or JSON array" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <label className="block md:col-span-4">
              <span className="text-sm font-medium text-slate-700">Card URL</span>
              <input value={insuranceForm.card_url} onChange={(event) => setInsuranceForm({ ...insuranceForm, card_url: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </label>
          </div>
          <div className="mt-4 flex justify-end">
            <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Save Policy
            </button>
          </div>
        </form>
      )}
      <DataTable
        headers={['Insured', 'Company', 'Policy', 'Coverage', 'Premium', 'Network', 'Expiry', 'Card', 'Status']}
        rows={insurancePolicies.map((item) => [
          <RecordTitle key={item.insuranceId || item.policyNumber} title={item.insuredName} subtitle={item.insuranceCategory || 'Insurance'} />,
          item.insuranceCompany,
          item.policyNumber,
          item.coverageAmount ? formatMoney(Number(item.coverageAmount)) : 'Not set',
          item.premiumAmount ? formatMoney(Number(item.premiumAmount)) : 'Not set',
          item.networkCode || 'Not set',
          formatDate(item.policyExpiry),
          item.cardUrl ? <a key={`${item.insuranceId}-card`} href={item.cardUrl} target="_blank" rel="noreferrer" className="font-medium text-blue-700 hover:underline">Open</a> : 'Not uploaded',
          badge(item.status),
        ])}
      />
    </div>
  );

  const renderGccBranches = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Metric label="GCC branches" value={gccBranches.length.toString()} />
        <Metric label="Countries" value={new Set(gccBranches.map((item) => item.country)).size.toString()} />
        <Metric label="Renewal pending" value={gccBranches.filter((item) => item.status === 'Renewal Pending').length.toString()} />
      </div>
      {canCreate && showAddForm && (
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            const response = await fetch('/api/admin/pro-works/gcc-branches', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...gccBranchForm,
                bank_account: gccBranchForm.bank_account || null,
                bank_name: gccBranchForm.bank_name || null,
                branch_manager: gccBranchForm.branch_manager || null,
                contact_phone: gccBranchForm.contact_phone || null,
                documents: gccBranchForm.documents,
                notes: gccBranchForm.notes || null,
              }),
            });

            if (response.ok) {
              const refreshed = await fetch('/api/admin/pro-works/gcc-branches?limit=100');
              const json = await refreshed.json();
              setGccBranches(json.records || []);
              setGccBranchForm((previous) => ({
                ...previous,
                branch_name: '',
                city: '',
                registration_no: '',
                licence_type: '',
                bank_account: '',
                bank_name: '',
                branch_manager: '',
                contact_phone: '',
                documents: '',
                notes: '',
              }));
            }
          }}
          className="rounded-lg border border-slate-200 bg-white p-5"
        >
          <h3 className="text-lg font-semibold text-slate-950">GCC Branch Registration</h3>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Branch Name</span>
              <input value={gccBranchForm.branch_name} onChange={(event) => setGccBranchForm({ ...gccBranchForm, branch_name: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Country</span>
              <SearchableSelect value={gccBranchForm.country} onChange={(event) => setGccBranchForm({ ...gccBranchForm, country: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                {gccCountryOptions.map((country) => <option key={country}>{country}</option>)}
              </SearchableSelect>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">City</span>
              <input value={gccBranchForm.city} onChange={(event) => setGccBranchForm({ ...gccBranchForm, city: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Registration No</span>
              <input value={gccBranchForm.registration_no} onChange={(event) => setGccBranchForm({ ...gccBranchForm, registration_no: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Registration Expiry</span>
              <input type="date" value={gccBranchForm.registration_expiry} onChange={(event) => setGccBranchForm({ ...gccBranchForm, registration_expiry: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Licence Type</span>
              <input value={gccBranchForm.licence_type} onChange={(event) => setGccBranchForm({ ...gccBranchForm, licence_type: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Licence Expiry</span>
              <input type="date" value={gccBranchForm.licence_expiry} onChange={(event) => setGccBranchForm({ ...gccBranchForm, licence_expiry: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Bank Account</span>
              <input value={gccBranchForm.bank_account} onChange={(event) => setGccBranchForm({ ...gccBranchForm, bank_account: event.target.value })} placeholder="****1234" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Bank Name</span>
              <input value={gccBranchForm.bank_name} onChange={(event) => setGccBranchForm({ ...gccBranchForm, bank_name: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Branch Manager</span>
              <input value={gccBranchForm.branch_manager} onChange={(event) => setGccBranchForm({ ...gccBranchForm, branch_manager: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Contact Phone</span>
              <input value={gccBranchForm.contact_phone} onChange={(event) => setGccBranchForm({ ...gccBranchForm, contact_phone: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm font-medium text-slate-700">Documents JSON</span>
              <input value={gccBranchForm.documents} onChange={(event) => setGccBranchForm({ ...gccBranchForm, documents: event.target.value })} placeholder='[{"type":"Trade License","url":"...","expiry":"2026-09-14"}]' className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <label className="block md:col-span-4">
              <span className="text-sm font-medium text-slate-700">Notes</span>
              <textarea value={gccBranchForm.notes} onChange={(event) => setGccBranchForm({ ...gccBranchForm, notes: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" rows={3} />
            </label>
          </div>
          <div className="mt-4 flex justify-end">
            <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Save Branch
            </button>
          </div>
        </form>
      )}
      <DataTable
        headers={['Branch', 'Country', 'Registration', 'Reg Expiry', 'Licence', 'Licence Expiry', 'Bank', 'Manager', 'Status']}
        rows={gccBranches.map((item) => [
          <RecordTitle key={item.branchId || item.registrationNo} title={item.branchName} subtitle={item.city} />,
          item.country,
          item.registrationNo,
          formatDate(item.registrationExpiry),
          item.licenceType,
          formatDate(item.licenceExpiry),
          item.bankName ? `${item.bankName} ${item.bankAccount || ''}` : 'Not set',
          item.branchManager || 'Not set',
          badge(item.status),
        ])}
      />
    </div>
  );

  const renderOwners = () => (
    <div className="space-y-6">
      {!canViewOwners ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
          <h3 className="text-lg font-semibold text-amber-950">Restricted owner database</h3>
          <p className="mt-1 text-sm text-amber-800">Access is limited to Super Admin and designated PRO Officer roles.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Metric label="Owners" value={owners.length.toString()} />
            <Metric label="Restricted" value={owners.filter((item) => item.accessLevel === 'Restricted').length.toString()} />
            <Metric label="Expiring" value={owners.filter((item) => ownerExpiryStatus(item) === 'Expiring').length.toString()} />
            <Metric label="Total share" value={`${owners.reduce((sum, item) => sum + Number(item.sharePercentage || 0), 0).toFixed(2)}%`} />
          </div>
          {canViewOwners && showAddForm && (
            <form
              onSubmit={async (event) => {
                event.preventDefault();
                const response = await fetch('/api/admin/pro-works/owners', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    ...ownerForm,
                    emirates_id: ownerForm.emirates_id || null,
                    emirates_id_expiry: ownerForm.emirates_id_expiry || null,
                    residence_visa_no: ownerForm.residence_visa_no || null,
                    visa_expiry: ownerForm.visa_expiry || null,
                    share_percentage: ownerForm.share_percentage ? Number(ownerForm.share_percentage) : null,
                    poa_document: ownerForm.poa_document || null,
                    poa_expiry: ownerForm.poa_expiry || null,
                    signature_specimen: ownerForm.signature_specimen || null,
                    bank_signatories: ownerForm.bank_signatories,
                    documents: ownerForm.documents,
                  }),
                });

                if (response.ok) {
                  const refreshed = await fetch('/api/admin/pro-works/owners?limit=100');
                  const json = await refreshed.json();
                  setOwners(json.records || []);
                  setOwnerForm((previous) => ({
                    ...previous,
                    full_name: '',
                    nationality: '',
                    passport_no: '',
                    emirates_id: '',
                    emirates_id_expiry: '',
                    residence_visa_no: '',
                    visa_expiry: '',
                    share_percentage: '',
                    poa_document: '',
                    poa_expiry: '',
                    signature_specimen: '',
                    bank_signatories: '',
                    documents: '',
                  }));
                }
              }}
              className="rounded-lg border border-slate-200 bg-white p-5"
            >
              <h3 className="text-lg font-semibold text-slate-950">Owner / Partner Document Record</h3>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Full Name</span>
                  <input value={ownerForm.full_name} onChange={(event) => setOwnerForm({ ...ownerForm, full_name: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Role</span>
                  <SearchableSelect value={ownerForm.role} onChange={(event) => setOwnerForm({ ...ownerForm, role: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                    {ownerRoleOptions.map((role) => <option key={role}>{role}</option>)}
                  </SearchableSelect>
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Nationality</span>
                  <input value={ownerForm.nationality} onChange={(event) => setOwnerForm({ ...ownerForm, nationality: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Passport No</span>
                  <input value={ownerForm.passport_no} onChange={(event) => setOwnerForm({ ...ownerForm, passport_no: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Passport Expiry</span>
                  <input type="date" value={ownerForm.passport_expiry} onChange={(event) => setOwnerForm({ ...ownerForm, passport_expiry: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Emirates ID</span>
                  <input value={ownerForm.emirates_id} onChange={(event) => setOwnerForm({ ...ownerForm, emirates_id: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">EID Expiry</span>
                  <input type="date" value={ownerForm.emirates_id_expiry} onChange={(event) => setOwnerForm({ ...ownerForm, emirates_id_expiry: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Visa No</span>
                  <input value={ownerForm.residence_visa_no} onChange={(event) => setOwnerForm({ ...ownerForm, residence_visa_no: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Visa Expiry</span>
                  <input type="date" value={ownerForm.visa_expiry} onChange={(event) => setOwnerForm({ ...ownerForm, visa_expiry: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Share %</span>
                  <input type="number" step="0.01" value={ownerForm.share_percentage} onChange={(event) => setOwnerForm({ ...ownerForm, share_percentage: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                </label>
                <label className="block md:col-span-2">
                  <span className="text-sm font-medium text-slate-700">POA Document URL</span>
                  <input value={ownerForm.poa_document} onChange={(event) => setOwnerForm({ ...ownerForm, poa_document: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">POA Expiry</span>
                  <input type="date" value={ownerForm.poa_expiry} onChange={(event) => setOwnerForm({ ...ownerForm, poa_expiry: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                </label>
                <label className="block md:col-span-2">
                  <span className="text-sm font-medium text-slate-700">Signature Specimen URL</span>
                  <input value={ownerForm.signature_specimen} onChange={(event) => setOwnerForm({ ...ownerForm, signature_specimen: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                </label>
                <label className="block md:col-span-2">
                  <span className="text-sm font-medium text-slate-700">Bank Signatories JSON</span>
                  <input value={ownerForm.bank_signatories} onChange={(event) => setOwnerForm({ ...ownerForm, bank_signatories: event.target.value })} placeholder='[{"bank":"ENBD","account_ref":"****4532"}]' className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                </label>
                <label className="block md:col-span-4">
                  <span className="text-sm font-medium text-slate-700">Documents JSON</span>
                  <input value={ownerForm.documents} onChange={(event) => setOwnerForm({ ...ownerForm, documents: event.target.value })} placeholder='[{"type":"Passport","url":"...","expiry":"2028-02-10"}]' className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                </label>
              </div>
              <div className="mt-4 flex justify-end">
                <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                  Save Owner Record
                </button>
              </div>
            </form>
          )}
          <DataTable
            headers={['Owner', 'Role', 'Nationality', 'Passport', 'Passport Expiry', 'EID Expiry', 'Visa Expiry', 'Share', 'POA', 'Access', 'Status']}
            rows={owners.map((item) => [
              <RecordTitle key={item.ownerId || item.passportNo} title={item.fullName} subtitle={item.passportNo} />,
              item.role,
              item.nationality,
              item.passportNo,
              formatDate(item.passportExpiry),
              item.emiratesIdExpiry ? formatDate(item.emiratesIdExpiry) : 'Not set',
              item.visaExpiry ? formatDate(item.visaExpiry) : 'Not set',
              item.sharePercentage ? `${Number(item.sharePercentage).toFixed(2)}%` : 'Not set',
              item.poaDocument ? <a key={`${item.ownerId}-poa`} href={item.poaDocument} target="_blank" rel="noreferrer" className="font-medium text-blue-700 hover:underline">Open</a> : 'Not uploaded',
              badge(item.accessLevel),
              badge(ownerExpiryStatus(item)),
            ])}
          />
        </>
      )}
    </div>
  );

  const renderActiveModule = () => {
    if (activeModule === 'employee-labour-immigration') return renderEmployeeCompliance();
    if (activeModule === 'wps-management') return renderWps();
    if (activeModule === 'renewal-reminders') return renderRenewals();
    if (activeModule === 'insurance-list') return renderInsurance();
    if (activeModule === 'gcc-branch-documents') return renderGccBranches();
    if (activeModule === 'owners-document-database') return renderOwners();
    return renderCompanyDocuments();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">PRO Works Module</p>
          <h1 className="text-3xl font-bold text-slate-950">{activeMeta.number} {activeMeta.title}</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">{activeMeta.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <Download className="h-4 w-4" />
            Export
          </button>
          {canUseProAddForm && (
            <button
              onClick={() => setShowAddForm(v => !v)}
              className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium ${showAddForm ? 'bg-slate-600 hover:bg-slate-700' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
            >
              <Plus className={`h-4 w-4 transition-transform ${showAddForm ? 'rotate-45' : ''}`} />
              {showAddForm ? 'Close Form' : 'New PRO Record'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-7">
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

      {loadError && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {loadError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4 lg:col-span-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search company, employee, licence, insurance, branch, or owner records"
              className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Matching records</p>
          <p className="mt-1 text-2xl font-semibold text-slate-950">{matchingRecords}</p>
        </div>
      </div>

      {renderActiveModule()}
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


function RecordTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <div className="font-medium text-slate-950">{title}</div>
      <div className="text-xs text-slate-500">{subtitle}</div>
    </div>
  );
}

function Workflow({ actions }: { actions: string[] }) {
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
      <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
        <AlertTriangle className="h-4 w-4" />
        Confirm payroll totals before SIF upload.
      </div>
    </div>
  );
}
