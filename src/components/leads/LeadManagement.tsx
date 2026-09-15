'use client';

import { SearchableSelect } from '@/components/ui/searchable-select';
import { useSortableData, SortableTh } from '@/components/ui/sortable-th';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Search, Plus, Edit, Trash2, Download, Upload, Users,
  Filter, Calendar, Phone, Mail, MapPin, DollarSign, MessageCircle,
  Eye, CheckCircle, Clock,
  Target, X, Save, LayoutList, LayoutGrid, Briefcase, MessageSquare, Settings,
  Receipt, AlertCircle, Printer, Loader2, ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight, RotateCcw, ExternalLink, XCircle,
  ClipboardCheck
} from 'lucide-react';
import LeadKanbanSimple from './LeadKanbanSimple';
import ConversationHistoryModal from '@/components/shared/ConversationHistoryModal';
import { Lead } from '@/types/lead';
import { useAuth } from '@/contexts/AuthContext';
import { isBranchManagerOrCeo, isCeo, isFoe, isFoeOrBranchManagerOrCeo, isCounsellor } from '@/lib/roleChecks';
import { BANK_PAYMENT_OPTIONS, CARD_PAYMENT_OPTIONS } from '@/lib/paymentOptions';
import { getLeadBranchDetails, printReceipt as printReceiptDocument } from '@/lib/receiptTemplate';

interface LeadManagementProps {
  onLeadSelect?: (lead: Lead) => void;
  onConvertToOpportunity?: (leadId: number) => void;
  showActions?: boolean;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface FilterOption {
  value: string;
  label: string;
  region?: string;
}

interface LeadFilterOptions {
  statuses: FilterOption[];
  priorities: FilterOption[];
  branches: FilterOption[];
  regions: FilterOption[];
  countries: FilterOption[];
  services: FilterOption[];
  sources: FilterOption[];
  leadQualities: FilterOption[];
}

type LeadActionType = 'appointment' | 'followup' | 'remark' | 'status';
type LeadTab = 'leads' | 'my-leads' | 'opportunities' | 'clients' | 'duplicates' | 'rejected';

interface QuickPayLeadState {
  lead: Lead;
  amount: string;
  method: string;
  date: string;
  txnId: string;
  saving: boolean;
  msg: string;
  success: boolean;
  receipt: any;
}

interface LeadActionForm {
  date: string;
  time: string;
  employeeId: string;
  title: string;
  notes: string;
  meetingType: string;
  priority: string;
  status: string;
  programId: string;
  countryId: string;
}

interface LeadActivity {
  appointments: Array<{
    id: number;
    date?: string | null;
    appointtime?: string | null;
    booked?: number | null;
    done?: number | null;
    not_done?: number | null;
    screenshot?: string | null;
    counselorName?: string | null;
    branchName?: string | null;
  }>;
  followUps: Array<{
    id: number;
    reminder_date?: string | null;
    message?: string | null;
    status?: string | null;
    priority?: string | null;
    employeeName?: string | null;
  }>;
  remarks: Array<{
    id: number;
    date?: string | null;
    created?: string | null;
    remark?: string | null;
    employeeName?: string | null;
  }>;
  activityLog: Array<{
    id: number;
    action?: string | null;
    remark?: string | null;
    previous_value?: string | null;
    new_value?: string | null;
    actorName?: string | null;
    actor_role?: string | null;
    created_at?: string | null;
  }>;
  summary: {
    appointments: number;
    fixedAppointments: number;
    completedAppointments: number;
    followUps: number;
    pendingFollowUps: number;
    remarks: number;
    activityLog: number;
  };
}

function getSelectableLeadId(lead: Pick<Lead, 'id'>): number | null {
  const id = Number(lead.id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// Builds a windowed list of page numbers around the current page (with '...'
// gaps) so pagination stays usable when there are hundreds of pages.
function getPageWindow(current: number, total: number): Array<number | '...'> {
  if (total <= 1) return total === 1 ? [1] : [];
  const delta = 1;
  const range: Array<number | '...'> = [];
  const left = Math.max(2, current - delta);
  const right = Math.min(total - 1, current + delta);

  range.push(1);
  if (left > 2) range.push('...');
  for (let i = left; i <= right; i++) range.push(i);
  if (right < total - 1) range.push('...');
  if (total > 1) range.push(total);

  return range;
}

export default function LeadManagement({ onLeadSelect, onConvertToOpportunity, showActions = true }: LeadManagementProps) {
  const router = useRouter();
  const { token, isLoading: authLoading, currencyCode } = useAuth();
  const topScrollRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const [tableScrollWidth, setTableScrollWidth] = useState(0);
  const syncingScrollRef = useRef<'top' | 'table' | null>(null);
  const tabBarRef = useRef<HTMLDivElement>(null);
  const [tabBarHeight, setTabBarHeight] = useState(0);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedLeads, setSelectedLeads] = useState<number[]>([]);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    branch: '',
    region: '',
    countryInterest: '',
    serviceInterest: '',
    marketSource: '',
    leadQuality: '',
    dateFrom: '',
    dateTo: '',
    assignTo: ''
  });
  const [filterOptions, setFilterOptions] = useState<LeadFilterOptions>({
    statuses: [],
    priorities: [],
    branches: [],
    regions: [],
    countries: [],
    services: [],
    sources: [],
    leadQualities: []
  });
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [currentLead, setCurrentLead] = useState<Lead | null>(null);
  const [formData, setFormData] = useState<Partial<Lead>>({});
  const [importing, setImporting] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [activeTab, setActiveTab] = useState<LeadTab>('leads');
  const [showLeadActionModal, setShowLeadActionModal] = useState(false);
  const [returnToViewModalOnClose, setReturnToViewModalOnClose] = useState(false);
  const [leadActionType, setLeadActionType] = useState<LeadActionType>('appointment');
  const [leadActionForm, setLeadActionForm] = useState<LeadActionForm>({
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    employeeId: '',
    title: '',
    notes: '',
    meetingType: 'consultation',
    priority: 'medium',
    status: '',
    programId: '',
    countryId: ''
  });
  const [leadActionSaving, setLeadActionSaving] = useState(false);
  // Status popup: the Program dropdown is scoped to whichever Country is
  // selected (crm_fee is the only table that actually links a program to a
  // destination country) - null means "no country picked, show every
  // program", matching filterOptions.services' unscoped list.
  const [statusModalPrograms, setStatusModalPrograms] = useState<FilterOption[] | null>(null);
  const [statusModalProgramsLoading, setStatusModalProgramsLoading] = useState(false);
  // Cross-branch appointment handoff: assign this appointment to a
  // counselor/branch manager in a different branch than the lead's own.
  const [crossBranchEnabled, setCrossBranchEnabled] = useState(false);
  const [crossBranchTargetBranch, setCrossBranchTargetBranch] = useState('');
  const [appointmentEmployees, setAppointmentEmployees] = useState<Array<{ id: number; name: string }>>([]);
  const [appointmentEmployeesLoading, setAppointmentEmployeesLoading] = useState(false);
  const [leadActivity, setLeadActivity] = useState<LeadActivity | null>(null);
  const [conversationHistoryLeadId, setConversationHistoryLeadId] = useState<number | null>(null);
  const [leadActivityLoading, setLeadActivityLoading] = useState(false);
  const [leadActivityError, setLeadActivityError] = useState('');

  const [quickPayLead, setQuickPayLead] = useState<QuickPayLeadState | null>(null);
  const [whatsappTemplate, setWhatsappTemplate] = useState('');

  // ── Assignment modal state ──
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignLead, setAssignLead] = useState<Lead | null>(null);
  const [assignCounselors, setAssignCounselors] = useState<Array<{ id: number; name: string; branch: number | null; role: number | null }>>([]);
  const [assignSearch, setAssignSearch] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignSaving, setAssignSaving] = useState(false);
  const [releasingLeadId, setReleasingLeadId] = useState<number | null>(null);

  // ── Counselor filter dropdown (BM sees their own branch, CEO sees everyone) ──
  const [counselorFilterOptions, setCounselorFilterOptions] = useState<Array<{ id: number; name: string }>>([]);

  // ── Bulk transfer state (Branch Manager: own branch only; CEO: all delete too) ──
  const [bulkTransferCounselorId, setBulkTransferCounselorId] = useState('');
  const [bulkActionSaving, setBulkActionSaving] = useState(false);
  const [showBulkTransferModal, setShowBulkTransferModal] = useState(false);
  const [bulkTransferSearch, setBulkTransferSearch] = useState('');

  const { user } = useAuth();
  const isDSorBM = useMemo(() => {
    const t = String(user?.type || '').toLowerCase().replace(/[\s-]+/g, '_');
    return ['director_of_sales', 'director', 'dos', 'branch_manager', 'bm', 'admin', 'administrator', 'super_admin'].includes(t) || user?.role === 1;
  }, [user]);
  const canBulkUpload = useMemo(() => isFoeOrBranchManagerOrCeo(user) || isCounsellor(user), [user]);
  // FOE and CEO can assign/reassign leads too, in addition to DS/BM/Admin (isDSorBM).
  const canAssignLeads = isDSorBM || isFoeOrBranchManagerOrCeo(user);
  const showMyLeadsTab = isBranchManagerOrCeo(user);

  useEffect(() => {
    if (!isFoeOrBranchManagerOrCeo(user)) return;
    (async () => {
      try {
        // FOE/BM only see counselors in their own branch; CEO sees everyone -
        // same branch-scoping convention used for lead reassignment (loadCounselors, below).
        const params = new URLSearchParams({ status: '1', limit: '200' });
        if (!isCeo(user) && user?.branch) params.set('branch', String(user.branch));
        const res = await fetch(`/api/employees?${params.toString()}`);
        if (!res.ok) return;
        const data = await res.json();
        const employees: Array<{ id: number; name: string }> = data.employees || [];
        setCounselorFilterOptions(employees.map((e) => ({ id: e.id, name: e.name })));
      } catch (err) {
        console.error('Error loading counselor filter options:', err);
      }
    })();
  }, [user]);
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/settings', token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
        if (!res.ok) return;
        const data = await res.json();
        setWhatsappTemplate(data.preferences?.whatsappTemplate || '');
      } catch (err) {
        console.error('Error loading WhatsApp message template:', err);
      }
    })();
  }, [token]);

  const getWhatsAppLink = (number?: string | null) => {
    const digits = (number || '').replace(/\D/g, '');
    if (!digits) return null;
    const query = whatsappTemplate ? `?text=${encodeURIComponent(whatsappTemplate)}` : '';
    return `https://wa.me/${digits}${query}`;
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const filteredBranchOptions = useMemo(() => {
    if (!filters.region) return filterOptions.branches;
    return filterOptions.branches.filter((branch) => !branch.region || branch.region === filters.region);
  }, [filterOptions.branches, filters.region]);
  const selectableLeadIds = useMemo(
    () => leads.map(getSelectableLeadId).filter((id): id is number => id !== null),
    [leads]
  );
  const activeFilterCount = useMemo(
    () => Object.values(filters).filter(Boolean).length,
    [filters]
  );

  const resetLeadFilters = () => setFilters({
    status: '',
    priority: '',
    branch: '',
    region: '',
    countryInterest: '',
    serviceInterest: '',
    marketSource: '',
    leadQuality: '',
    dateFrom: '',
    dateTo: '',
    assignTo: ''
  });

  // Build a lookup map from crm_source id → name using the already-loaded filter options
  const sourceNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    filterOptions.sources.forEach((s) => { map[s.value] = s.label; });
    return map;
  }, [filterOptions.sources]);

  const resolveSourceName = (lead: Lead) => {
    const raw = lead.market_source;
    if (!raw) return '';
    return sourceNameMap[raw] || (lead as any).market_source_label || raw;
  };

  const PIPELINE_STAGES = [
    { id: 'new_lead', label: 'New Lead', short: 'Lead' },
    { id: 'with_counselor', label: 'With Counselor', short: 'Counselor' },
    { id: 'prospect', label: 'Prospect', short: 'Prospect' },
    { id: 'quotation', label: 'Quotation', short: 'Quote' },
    { id: 'payment', label: 'Payment', short: 'Payment' },
    { id: 'accounts', label: 'Accounts Verified', short: 'Accounts' },
    { id: 'documents', label: 'Documents', short: 'Docs' },
    { id: 'agreement', label: 'Agreement', short: 'Agree' },
    { id: 'signed', label: 'Signed Agreement', short: 'Signed' },
    { id: 'compliance', label: 'Compliance', short: 'Compliance' },
    { id: 'client_active', label: 'Client Active', short: 'Client' },
  ];

  const getPipelineStage = (lead: any): { label: string; color: string; stepIndex: number } => {
    const hasOpp = !!(lead.resolved_opportunity_id || lead.opportunity_id);
    const workflowStatus = String(lead.workflow_status || '').toLowerCase();
    const financeOk = lead.finance_status === 'approved';
    const complianceOk = lead.compliance_status === 'approved';
    const hasClient = !!lead.formal_client_id;
    const paymentDone = !!lead.paymentReceived;
    const agreementSigned = !!lead.agreementSigned;
    const oppStage = String(lead.opp_stage || '').toLowerCase();
    const oppStatus = String(lead.opp_status || '').toLowerCase();
    const stepComplete = Number(lead.stepComplete || 0);

    if (hasClient) return { label: 'Client Active', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', stepIndex: 10 };
    if (complianceOk) return { label: 'Compliance Verified', color: 'bg-teal-100 text-teal-800 border-teal-200', stepIndex: 9 };
    if (agreementSigned || oppStage === 'signed-agreement') return { label: 'Signed Agreement', color: 'bg-pink-100 text-pink-800 border-pink-200', stepIndex: 8 };
    if (oppStage === 'agreement') return { label: 'Agreement', color: 'bg-violet-100 text-violet-800 border-violet-200', stepIndex: 7 };
    if (oppStage === 'documents') return { label: 'Documents', color: 'bg-cyan-100 text-cyan-800 border-cyan-200', stepIndex: 6 };
    if (oppStage === 'accounts') return { label: 'Accounts Verified', color: 'bg-indigo-100 text-indigo-800 border-indigo-200', stepIndex: 5 };
    if (oppStage === 'payment' || paymentDone) return { label: 'Payment Done', color: 'bg-purple-100 text-purple-800 border-purple-200', stepIndex: 4 };
    if (oppStage === 'quotation') return { label: 'Quotation', color: 'bg-amber-100 text-amber-800 border-amber-200', stepIndex: 3 };
    if (oppStage === 'prospect' || (hasOpp && workflowStatus === 'opportunity_created')) return { label: 'Prospect', color: 'bg-orange-100 text-orange-800 border-orange-200', stepIndex: 2 };
    if (hasOpp) return { label: 'Opportunity Created', color: 'bg-orange-100 text-orange-800 border-orange-200', stepIndex: 2 };
    if (lead.assignTo || stepComplete >= 1) return { label: 'With Counselor', color: 'bg-sky-100 text-sky-800 border-sky-200', stepIndex: 1 };
    return { label: 'New Lead', color: 'bg-gray-100 text-gray-800 border-gray-200', stepIndex: 0 };
  };

  const normalizeWorkflowStatus = (value?: string | null) => String(value || '').toLowerCase().replace(/[\s_]+/g, '-');

  const getWorkflowBadgeClass = (status?: string | null) => {
    const normalized = normalizeWorkflowStatus(status);
    if (['started', 'approved', 'verified', 'generated', 'signed', 'uploaded', 'completed', 'won'].includes(normalized)) {
      return 'border-emerald-200 bg-emerald-50 text-emerald-800';
    }
    if (['pending', 'pending-finance-review', 'pending-compliance', 'draft', 'sent', 'processing'].includes(normalized)) {
      return 'border-amber-200 bg-amber-50 text-amber-800';
    }
    if (['rejected', 'failed', 'expired', 'finance-review-failed', 'compliance-review-failed'].includes(normalized)) {
      return 'border-rose-200 bg-rose-50 text-rose-800';
    }
    if (['not-required', 'not-submitted', 'missing'].includes(normalized)) {
      return 'border-gray-200 bg-gray-50 text-gray-600';
    }
    return 'border-slate-200 bg-slate-50 text-slate-700';
  };

  const getWorkflowChecks = (lead: Lead) => {
    const row = lead as any;
    const hasOpportunity = Boolean(row.resolved_opportunity_id || row.opportunity_id);
    const discountStatus = row.discount_status || 'not_required';
    const receiptStatus = row.receiptNumber ? (row.receipt_accountant_status || 'generated') : 'missing';
    const agreementStatus = row.agreementNumber ? (row.agreement_status || 'generated') : 'missing';
    const financeStatus = row.finance_status || (row.receipt_accountant_status === 'verified' ? 'verified' : 'pending');
    const complianceStatus = row.compliance_status || row.agreement_compliance_status || 'pending';

    return [
      { id: 'opportunity', label: 'Opportunity Flow', value: hasOpportunity ? 'started' : 'missing', icon: Target },
      { id: 'discount', label: 'Discount Approval', value: discountStatus, icon: DollarSign },
      { id: 'receipt', label: 'Receipt Generate', value: receiptStatus, icon: Receipt, detail: row.receiptNumber || null },
      { id: 'finance', label: 'Finance Approval', value: financeStatus, icon: CheckCircle },
      { id: 'agreement', label: 'Agreement Generate', value: agreementStatus, icon: ClipboardCheck, detail: row.agreementNumber || null },
      { id: 'compliance', label: 'Compliance Approval', value: complianceStatus, icon: AlertCircle },
    ];
  };

  const { sorted: sortedLeadRows, sortKey: leadSortKey, sortDirection: leadSortDirection, toggleSort: toggleLeadSort } = useSortableData(
    leads,
    {
      name: (lead: Lead) => `${lead.fname || ''} ${lead.mname || ''} ${lead.lname || ''}`,
      contact: (lead: Lead) => lead.email || lead.phone,
      interest: (lead: Lead) => (lead as any).country_interest_label || lead.country_interest,
      remark: (lead: Lead) => lead.latest_remark,
      stage: (lead: Lead) => getPipelineStage(lead).stepIndex,
      status: (lead: Lead) => lead.status,
      balanceDue: (lead: Lead) => Number(lead.payBalance || 0),
      registered: (lead: Lead) => lead.regdate,
      branch: (lead: Lead) => lead.dmBranch?.name,
      assignedTo: (lead: Lead) => lead.dmEmployeeByASSIGNTo?.name,
    },
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (searchTerm.length >= 3 || searchTerm.length === 0) {
        setDebouncedSearchTerm(searchTerm);
        setPagination((current) => current.page === 1 ? current : { ...current, page: 1 });
      }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  // API functions
  const fetchLeads = async (forceKanban?: boolean) => {
    if (authLoading) return;
    try {
      setLoading(true);
      setLoadError('');
      const isKanban = forceKanban ?? viewMode === 'kanban';
      const params = new URLSearchParams({
        page: isKanban ? '1' : pagination.page.toString(),
        limit: isKanban ? '500' : pagination.limit.toString(),
        search: debouncedSearchTerm,
        opportunityView: activeTab,
        kanban: isKanban && (activeTab === 'leads' || activeTab === 'my-leads') ? 'true' : 'false',

        ...Object.entries(filters).reduce((acc, [key, value]) => {
          if (value) acc[key] = value;
          return acc;
        }, {} as Record<string, string>)
      });

      const response = await fetch(`/api/leads?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = await response.json();

      if (response.ok) {
        // Console log lead conversion data
        console.log('=== LEAD CONVERSION DATA ===');
        console.log('Total leads fetched:', data.leads?.length || 0);
        console.log('Pagination:', data.pagination);

        // Log conversion statistics
        const conversionStats = {
          total: data.leads?.length || 0,
          prospect: data.leads?.filter((lead: any) => lead.status === 'Prospect')?.length || 0,
          notInterested: data.leads?.filter((lead: any) => lead.status === 'Not Interested')?.length || 0,
          dnq: data.leads?.filter((lead: any) => lead.status === 'DNQ')?.length || 0,
          notAnswered: data.leads?.filter((lead: any) => lead.status === 'Not_answered')?.length || 0,
          couldNotConnect: data.leads?.filter((lead: any) => lead.status === 'Could Not Connect')?.length || 0,
          callBack: data.leads?.filter((lead: any) => lead.status === 'Call Back')?.length || 0,
          abroadLead: data.leads?.filter((lead: any) => lead.status === 'Abroad Lead')?.length || 0
        };

        console.log('Conversion Statistics:', conversionStats);
        console.log('Prospect Rate:', `${((conversionStats.prospect / conversionStats.total) * 100).toFixed(2)}%`);
        console.log('Not Interested Rate:', `${((conversionStats.notInterested / conversionStats.total) * 100).toFixed(2)}%`);
        console.log('DNQ Rate:', `${((conversionStats.dnq / conversionStats.total) * 100).toFixed(2)}%`);
        console.log('Not Answered Rate:', `${((conversionStats.notAnswered / conversionStats.total) * 100).toFixed(2)}%`);
        console.log('Could Not Connect Rate:', `${((conversionStats.couldNotConnect / conversionStats.total) * 100).toFixed(2)}%`);
        console.log('Call Back Rate:', `${((conversionStats.callBack / conversionStats.total) * 100).toFixed(2)}%`);
        console.log('Abroad Lead Rate:', `${((conversionStats.abroadLead / conversionStats.total) * 100).toFixed(2)}%`);

        // Log individual leads with conversion info
        data.leads?.forEach((lead: any, index: number) => {
          console.log(`Lead ${index + 1}:`, {
            id: lead.id,
            name: `${lead.fname} ${lead.lname}`,
            status: lead.status,
            priority: lead.priority,
            countryInterest: lead.country_interest,
            serviceInterest: lead.service_interest,
            created: lead.created,
            isProspect: lead.status === 'Prospect',
            isNotInterested: lead.status === 'Not Interested',
            isDNQ: lead.status === 'DNQ',
            isNotAnswered: lead.status === 'Not_answered',
            isCouldNotConnect: lead.status === 'Could Not Connect',
            isCallBack: lead.status === 'Call Back',
            isAbroadLead: lead.status === 'Abroad Lead'
          });
        });
        console.log('=== END CONVERSION DATA ===');

        setLeads(data.leads || []);
        setPagination(data.pagination);
      } else {
        console.error('Error fetching leads:', data.error);
        setLeads([]);
        setPagination((current) => ({ ...current, total: 0, pages: 0 }));
        setLoadError(data.error || 'Unable to load leads. Please sign in again and retry.');
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
      setLoadError('Unable to load leads. Please check your connection and retry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [pagination.page, pagination.limit, debouncedSearchTerm, filters, activeTab, viewMode, token, authLoading]);

  useEffect(() => {
    setSelectedLeads((current) => current.filter((id) => selectableLeadIds.includes(id)));
  }, [selectableLeadIds]);

  // Re-measure how far the table overflows whenever the rendered rows/columns
  // change, so the top scrollbar's draggable width always matches the table.
  useEffect(() => {
    if (viewMode !== 'list') return;
    const measure = () => setTableScrollWidth(tableScrollRef.current?.scrollWidth || 0);
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [viewMode, leads, activeTab]);

  // Re-measure the sticky tab bar's height so the table header (also sticky)
  // can be offset below it instead of overlapping it - the tab row wraps
  // (flex-wrap) on narrow screens, which changes its height at runtime.
  useEffect(() => {
    const measure = () => setTabBarHeight(tabBarRef.current?.offsetHeight || 0);
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [showMyLeadsTab]);

  const handleTopScroll = () => {
    if (syncingScrollRef.current === 'table') { syncingScrollRef.current = null; return; }
    if (!topScrollRef.current || !tableScrollRef.current) return;
    syncingScrollRef.current = 'top';
    tableScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
  };

  const handleTableScroll = () => {
    if (syncingScrollRef.current === 'top') { syncingScrollRef.current = null; return; }
    if (!topScrollRef.current || !tableScrollRef.current) return;
    syncingScrollRef.current = 'table';
    topScrollRef.current.scrollLeft = tableScrollRef.current.scrollLeft;
  };

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const response = await fetch('/api/lead-filter-options');
        if (!response.ok) throw new Error('Failed to fetch lead filter options');
        const data = await response.json();
        setFilterOptions({
          statuses: data.statuses || [],
          priorities: data.priorities || [],
          branches: data.branches || [],
          regions: data.regions || [],
          countries: data.countries || [],
          services: data.services || [],
          sources: data.sources || [],
          leadQualities: data.leadQualities || []
        });
      } catch (error) {
        console.error('Error fetching lead filter options:', error);
      }
    };

    fetchFilterOptions();
  }, []);

  const handleTabChange = (tab: LeadTab) => {
    setActiveTab(tab);
    setSelectedLeads([]);
    setViewMode('list');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const validateLeadForm = (data: Partial<Lead>): string | null => {
    if (!data.fname?.trim() || !data.lname?.trim()) {
      return 'First Name and Last Name are required';
    }
    if (data.fname.trim().length < 2 || data.lname.trim().length < 2) {
      return 'First Name and Last Name must be at least 2 characters';
    }
    if (!data.email && !data.phone) {
      return 'Either Email or Phone is required';
    }
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
      return 'Please enter a valid email address';
    }
    if (data.phone && data.phone.replace(/\s/g, '').length < 7) {
      return 'Phone number must be at least 7 digits';
    }
    return null;
  };

  const checkDuplicateLead = async (email?: string, mobile?: string): Promise<string | null> => {
    const checks: Promise<boolean>[] = [];
    if (email?.trim()) {
      checks.push(
        fetch(`/api/leads?search=${encodeURIComponent(email.trim())}&limit=1`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        })
          .then(r => r.json())
          .then(d => Number(d?.pagination?.total || 0) > 0)
          .catch(() => false)
      );
    }
    if (mobile?.trim()) {
      checks.push(
        fetch(`/api/leads?search=${encodeURIComponent(mobile.trim())}&limit=1`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        })
          .then(r => r.json())
          .then(d => Number(d?.pagination?.total || 0) > 0)
          .catch(() => false)
      );
    }
    if (checks.length === 0) return null;
    const results = await Promise.all(checks);
    if (results[0] && email?.trim()) return `A lead with email "${email.trim()}" already exists.`;
    if (results[1] && mobile?.trim()) return `A lead with mobile "${mobile.trim()}" already exists.`;
    if (results[0] && !email?.trim() && mobile?.trim()) return `A lead with mobile "${mobile.trim()}" already exists.`;
    return null;
  };

  const handleCreateLead = async () => {
    try {
      const error = validateLeadForm(formData);
      if (error) {
        window.toast.error(error);
        return;
      }

      const dupError = await checkDuplicateLead(formData.email, formData.mobile || formData.phone);
      if (dupError) {
        window.toast.error(`${dupError}\n\nRequest a transfer instead of creating a duplicate lead.`);
        return;
      }

      const response = await fetch('/api/leads-simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowCreateModal(false);
        setFormData({});
        fetchLeads();
        const addedByLabel = `${user?.name || 'you'}${user?.roleName ? ` (${user.roleName})` : ''}`;
        window.toast.success(`Lead added by ${addedByLabel}`);
      } else {
        const errorData = await response.json();
        console.error('Error creating lead:', errorData);
        window.toast.error(`Error creating lead: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating lead:', error);
      window.toast.error('Error creating lead. Please try again.');
    }
  };

  const handleUpdateLead = async () => {
    if (!currentLead) return;

    try {
      const error = validateLeadForm(formData);
      if (error) {
        window.toast.error(error);
        return;
      }

      const response = await fetch(`/api/leads-simple/${currentLead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowEditModal(false);
        setCurrentLead(null);
        setFormData({});
        fetchLeads();
      } else {
        const errorData = await response.json().catch(() => ({}));
        window.toast.error(`Error updating lead: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating lead:', error);
    }
  };

  const handleDeleteLead = async (id: number) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;

    try {
      const response = await fetch(`/api/leads-simple/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchLeads();
      } else {
        const errorData = await response.json().catch(() => ({}));
        window.toast.error(`Error deleting lead: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting lead:', error);
    }
  };

  // CEO-only: undo a lead-to-opportunity conversion that's still sitting in
  // "Opportunity Drafts" (i.e. hasn't been retained as a client yet — the
  // API itself re-checks and rejects this once the lead is a client, this
  // confirm is just the first line of defense). Deletes the draft opportunity
  // and everything under it (payment, agreement, documents, approvals) and
  // sends the lead back to the plain Leads tab.
  const handleRevertOpportunity = async (lead: Lead) => {
    const opportunityId = (lead as any).resolved_opportunity_id || (lead as any).opportunity_id;
    if (!opportunityId) {
      window.toast.error('No opportunity found for this lead.');
      return;
    }
    if (!confirm('Revert this opportunity back to a lead? This permanently deletes its draft payment, agreement, and document records. This cannot be undone.')) return;

    try {
      const response = await fetch(`/api/opportunities/${opportunityId}`, { method: 'DELETE' });
      const result = await response.json().catch(() => ({}));
      if (response.ok) {
        window.toast.success('Opportunity reverted — the lead is back in the Leads tab.');
        fetchLeads();
      } else {
        window.toast.error(result.error || 'Failed to revert opportunity');
      }
    } catch (error) {
      console.error('Error reverting opportunity:', error);
      window.toast.error('Failed to revert opportunity');
    }
  };

  const handleStatusChange = async (leadId: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/leads-simple/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        fetchLeads();
      } else {
        console.error('Error updating lead status');
      }
    } catch (error) {
      console.error('Error updating lead status:', error);
    }
  };

  const handleViewLead = (lead: Lead) => {
    setCurrentLead(lead);
    setShowViewModal(true);
    onLeadSelect?.(lead);
    fetchLeadActivity(Number(lead.id));
  };

  const fetchLeadActivity = async (leadId: number) => {
    if (!leadId) return;

    setLeadActivityLoading(true);
    setLeadActivityError('');
    try {
      const response = await fetch(`/api/leads/${leadId}/activity`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load lead activity');
      }

      setLeadActivity(data);
    } catch (error) {
      console.error('Error loading lead activity:', error);
      setLeadActivity(null);
      setLeadActivityError(error instanceof Error ? error.message : 'Failed to load lead activity');
    } finally {
      setLeadActivityLoading(false);
    }
  };

  const openLeadActionModal = (lead: Lead, actionType: LeadActionType) => {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    const leadName = `${lead.fname || ''} ${lead.lname || ''}`.trim() || `Lead #${lead.id}`;

    setCurrentLead(lead);
    setReturnToViewModalOnClose(showViewModal);
    setShowViewModal(false);
    setLeadActionType(actionType);
    setLeadActionForm({
      date: now.toISOString().split('T')[0],
      time: currentTime,
      employeeId: String(lead.assignTo || lead.dmEmployeeByASSIGNTo?.id || ''),
      title: actionType === 'appointment'
        ? `Appointment with ${leadName}`
        : actionType === 'followup'
          ? `Follow up with ${leadName}`
          : '',
      notes: '',
      meetingType: actionType === 'appointment' ? 'consultation' : 'follow_up',
      priority: String(lead.priority || 'medium').toLowerCase(),
      status: String(lead.status || ''),
      programId: String((lead as any).service_interest || ''),
      countryId: String((lead as any).country_interest || '')
    });
    setCrossBranchEnabled(false);
    setCrossBranchTargetBranch('');
    setAppointmentEmployees([]);
    setShowLeadActionModal(true);
  };

  const closeLeadActionModal = () => {
    setShowLeadActionModal(false);
    setLeadActionSaving(false);
    setCrossBranchEnabled(false);
    setCrossBranchTargetBranch('');
    if (returnToViewModalOnClose) {
      setShowViewModal(true);
      setReturnToViewModalOnClose(false);
    }
  };

  // Scopes the status popup's Program dropdown to the selected Country -
  // clears back to "every program" when no country is picked, matching
  // filterOptions.services.
  useEffect(() => {
    if (!showLeadActionModal || leadActionType !== 'status') return;
    if (!leadActionForm.countryId) {
      setStatusModalPrograms(null);
      return;
    }
    let cancelled = false;
    setStatusModalProgramsLoading(true);
    fetch(`/api/lead-filter-options?country=${encodeURIComponent(leadActionForm.countryId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        setStatusModalPrograms(data?.services || []);
      })
      .catch(() => { if (!cancelled) setStatusModalPrograms([]); })
      .finally(() => { if (!cancelled) setStatusModalProgramsLoading(false); });
    return () => { cancelled = true; };
  }, [showLeadActionModal, leadActionType, leadActionForm.countryId]);

  // Populates the "Assigned Employee" dropdown for the appointment form: the
  // lead's own branch by default, or the chosen cross-branch's staff once
  // "Cross Branch" is toggled on and a target branch is picked.
  useEffect(() => {
    if (!showLeadActionModal || leadActionType !== 'appointment' || !currentLead) return;
    const branchId = crossBranchEnabled ? crossBranchTargetBranch : String(currentLead.branch || '');
    if (!branchId) {
      setAppointmentEmployees([]);
      return;
    }
    let cancelled = false;
    setAppointmentEmployeesLoading(true);
    fetch(`/api/employees/active?branch=${branchId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (cancelled) return;
        setAppointmentEmployees(Array.isArray(data) ? data : []);
      })
      .catch(() => { if (!cancelled) setAppointmentEmployees([]); })
      .finally(() => { if (!cancelled) setAppointmentEmployeesLoading(false); });
    return () => { cancelled = true; };
  }, [showLeadActionModal, leadActionType, currentLead, crossBranchEnabled, crossBranchTargetBranch, token]);

  const handleLeadActionSubmit = async () => {
    if (!currentLead) return;
    if (!currentLead.id || Number.isNaN(Number(currentLead.id))) {
      window.toast.error('Invalid lead ID');
      return;
    }

    const leadId = Number(currentLead.id);
    const employeeId = Number(leadActionForm.employeeId || currentLead.assignTo || currentLead.dmEmployeeByASSIGNTo?.id || 1);
    const timeWithSeconds = leadActionForm.time.length === 5 ? `${leadActionForm.time}:00` : leadActionForm.time;
    const scheduledAt = `${leadActionForm.date}T${timeWithSeconds}`;

    if (leadActionType !== 'remark' && leadActionType !== 'status' && (!leadActionForm.date || !leadActionForm.time)) {
      window.toast.warning('Please select date and time');
      return;
    }

    if (leadActionType !== 'remark' && leadActionType !== 'status' && !leadActionForm.notes.trim()) {
      window.toast.warning('Please enter notes');
      return;
    }

    if (leadActionType === 'remark' && !leadActionForm.notes.trim()) {
      window.toast.warning('Please enter a remark');
      return;
    }

    if (leadActionType === 'status' && !leadActionForm.status.trim()) {
      window.toast.warning('Please select a status');
      return;
    }

    if (leadActionType === 'status' && !leadActionForm.notes.trim()) {
      window.toast.warning('Please enter a remark explaining the status update');
      return;
    }

    if (leadActionType === 'appointment' && !leadActionForm.title.trim()) {
      window.toast.warning('Please enter an appointment title');
      return;
    }

    if (leadActionType !== 'remark' && leadActionType !== 'status' && (!employeeId || employeeId < 1)) {
      window.toast.warning(leadActionType === 'appointment' ? 'Please select an assigned employee' : 'Please enter a valid employee ID');
      return;
    }

    if (leadActionType === 'appointment' && crossBranchEnabled && !crossBranchTargetBranch) {
      window.toast.warning('Please select a branch for the cross-branch assignment');
      return;
    }

    if (leadActionType !== 'remark' && leadActionType !== 'status' && leadActionForm.date) {
      const today = new Date().toISOString().split('T')[0];
      if (leadActionForm.date < today) {
        window.toast.error('Date cannot be in the past');
        return;
      }
    }

    setLeadActionSaving(true);
    try {
      let response: Response;

      if (leadActionType === 'appointment') {
        response = await fetch('/api/appointments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            leadId,
            date: leadActionForm.date,
            appointtime: timeWithSeconds,
            counselorId: employeeId,
            branch: currentLead.branch,
            region: currentLead.region,
            booked: 1,
            screenshot: leadActionForm.notes,
            crossBranch: crossBranchEnabled,
            assignedBranch: crossBranchEnabled ? Number(crossBranchTargetBranch) : undefined,
            leadName: `${currentLead.fname || ''} ${currentLead.lname || ''}`.trim() || undefined,
          })
        });

        if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || 'Failed to book appointment');

        const leadApptRes = await fetch(`/api/leads/${leadId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            appointment: `${leadActionForm.date} ${timeWithSeconds}`
          })
        });
        if (!leadApptRes.ok) {
          console.warn('Appointment created but lead update failed:', await leadApptRes.text());
        }
      } else if (leadActionType === 'followup') {
        response = await fetch('/api/follow-up-reminders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            leadId,
            employeeId,
            scheduledAt,
            subject: leadActionForm.title || 'Lead follow-up',
            message: leadActionForm.notes || leadActionForm.title || 'Lead follow-up',
            priority: leadActionForm.priority || 'medium'
          })
        });

        if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || 'Failed to add follow-up');

        const leadUpdateRes = await fetch(`/api/leads/${leadId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            followup: leadActionForm.date,
            folowuptime: timeWithSeconds,
            followupstat: 0
          })
        });
        if (!leadUpdateRes.ok) {
          console.warn('Follow-up created but lead update failed:', await leadUpdateRes.text());
        }
      } else if (leadActionType === 'status') {
        response = await fetch(`/api/leads/${leadId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: leadActionForm.status,
            notes: leadActionForm.notes,
            ...(leadActionForm.programId ? { service_interest: leadActionForm.programId } : {}),
            ...(leadActionForm.countryId ? { country_interest: leadActionForm.countryId } : {}),
          })
        });

        if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || 'Failed to update status');
      } else {
        response = await fetch('/api/lead-remarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            leadId,
            employeeId,
            remark: leadActionForm.notes
          })
        });

        if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || 'Failed to add remark');
      }

      closeLeadActionModal();
      await fetchLeads();
      await fetchLeadActivity(leadId);
      window.toast.success(
        leadActionType === 'appointment'
          ? 'Appointment booked successfully'
          : leadActionType === 'followup'
            ? 'Follow-up added successfully'
            : leadActionType === 'status'
              ? 'Status updated successfully'
              : 'Remark added successfully'
      );
    } catch (error) {
      console.error('Error saving lead action:', error);
      window.toast.error(error instanceof Error ? error.message : 'Failed to save lead action');
    } finally {
      setLeadActionSaving(false);
    }
  };

  const handleConvertToOpportunity = async (leadId: number) => {
    if (isFoe(user)) {
      window.toast.error('FOE accounts cannot convert leads to opportunities.');
      return;
    }
    try {
      const numericLeadId = Number(leadId);
      const lead = leads.find(l => Number(l.id) === numericLeadId);
      if (!lead) {
        window.toast.error('Lead not found');
        return;
      }

      const confirmed = confirm(`Open opportunity wizard for ${lead.fname} ${lead.lname}?`);
      if (!confirmed) return;

      router.push(`/admin/leads/opportunity-flow?leadId=${numericLeadId}`);
    } catch (error) {
      console.error('Error converting lead to opportunity:', error);
      window.toast.error('Unable to open opportunity wizard. Please try again.');
    }
  };

  const openAssignModal = async (lead: Lead) => {
    setAssignLead(lead);
    setShowAssignModal(true);
    setAssignSearch('');
    setAssignLoading(true);
    try {
      const res = await fetch('/api/employees/active');
      if (!res.ok) throw new Error('Failed to load employees');
      const employees: Array<{ id: number; name: string; branch: number | null; role: number | null }> = await res.json();
      const userBranch = Number(user?.branch || 0);
      const userType = String(user?.type || '').toLowerCase().replace(/[\s-]+/g, '_');
      // Branch Manager and FOE only assign within their own branch's staff; CEO
      // (and everyone else covered by isDSorBM) can assign across all branches.
      const isBranchScoped = ['branch_manager', 'bm', 'foe'].includes(userType) && !isCeo(user);
      const filtered = isBranchScoped && userBranch
        ? employees.filter(e => e.branch === userBranch)
        : employees;
      setAssignCounselors(filtered);
    } catch (err) {
      console.error('Error loading counselors:', err);
      window.toast.error('Failed to load employees');
    } finally {
      setAssignLoading(false);
    }
  };

  const handleAssignLead = async (employeeId: number) => {
    if (!assignLead) return;
    setAssignSaving(true);
    try {
      const res = await fetch(`/api/leads/${assignLead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignTo: employeeId, Counsilor: employeeId }),
      });
      if (!res.ok) throw new Error('Failed to assign lead');
      const updatedLead = await res.json();
      // Merge the server's response (not just the raw employeeId) so
      // dmEmployeeByASSIGNTo/dmEmployeeByCoUNSILOR — which the "Assigned To"
      // column actually renders (lead.dmEmployeeByASSIGNTo?.name) — reflect the
      // new counselor immediately instead of only updating on next page load.
      setLeads(prev => prev.map(l =>
        Number(l.id) === Number(assignLead.id) ? { ...l, ...updatedLead } : l
      ));
      setShowAssignModal(false);
      window.toast.success('Lead assigned successfully');
    } catch (err) {
      console.error('Error assigning lead:', err);
      window.toast.error('Failed to assign lead');
    } finally {
      setAssignSaving(false);
    }
  };

  // Pulls an already-owned lead back into the shared Lead Pool
  // (src/app/admin/lead-pool) so any agent in its branch can claim it -
  // e.g. an overloaded or underperforming counselor's lead. Only ever
  // targets the lead's own record, never a bulk selection.
  const handleReleaseToPool = async (lead: Lead) => {
    const leadName = `${lead.fname} ${lead.lname}`.trim() || `Lead #${lead.id}`;
    if (!confirm(`Release "${leadName}" back to the Lead Pool? Any agent in this branch will be able to claim it.`)) return;
    setReleasingLeadId(lead.id);
    try {
      const res = await fetch('/api/admin/lead-pool/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Failed to release lead to pool');
      setLeads(prev => prev.map(l =>
        Number(l.id) === Number(lead.id) ? { ...l, assignTo: 0, Counsilor: 0, dmEmployeeByASSIGNTo: undefined } : l
      ));
      window.toast.success('Lead released to the pool');
    } catch (err) {
      console.error('Error releasing lead to pool:', err);
      window.toast.error(err instanceof Error ? err.message : 'Failed to release lead to pool');
    } finally {
      setReleasingLeadId(null);
    }
  };

  const openQuickPayForLead = (lead: Lead) => {
    setQuickPayLead({
      lead,
      amount: String(Number(lead.payBalance) > 0 ? lead.payBalance : ''),
      method: 'cash',
      date: new Date().toISOString().split('T')[0],
      txnId: '',
      saving: false,
      msg: '',
      success: false,
      receipt: null,
    });
  };

  // Branch branding (legal name, address, contact, licence) is resolved from
  // the lead's own crm_branch record via the centralized receipt template
  // shared with the Opportunity Flow wizard and the Clients page, instead of
  // a hardcoded per-branch-name lookup table that silently fell back to
  // Dubai's details for any branch it didn't recognize.
  const printLeadReceipt = (receipt: any, lead: Lead, qp: QuickPayLeadState) => {
    const branchDetails = getLeadBranchDetails(lead as any);
    printReceiptDocument({
      receiptNumber: receipt.receiptNumber || receipt.paymentNumber,
      paymentDate: qp.date,
      clientName: (lead as any).client_actual_name || `${lead.fname} ${lead.lname}`,
      email: lead.email,
      phone: lead.mobile || lead.phone,
      agreementNumber: receipt.agreementNumber,
      opportunityId: (lead as any).resolved_opportunity_id || (lead as any).opportunity_id,
      companyName: branchDetails.companyName,
      branchName: branchDetails.branchName,
      branchAddress: branchDetails.branchAddress,
      branchEmail: branchDetails.branchEmail,
      branchPhone: branchDetails.branchPhone,
      licenseNumber: branchDetails.licenseNumber,
      vatGstPercent: branchDetails.vatGstPercent,
      paymentMethod: qp.method,
      transactionId: qp.txnId,
      currency: currencyCode || 'AED',
      totalAmount: lead.payTotal,
      previouslyPaid: lead.paidYet,
      paidAmount: qp.amount,
      remainingBalance: Math.max(0, Number(lead.payBalance || 0) - Number(qp.amount || 0)),
    });
  };

  const submitQuickPayForLead = async () => {
    if (!quickPayLead) return;
    const amount = Number(quickPayLead.amount);
    if (!amount || amount <= 0) { setQuickPayLead(p => p ? { ...p, msg: 'Enter a valid amount.' } : null); return; }
    setQuickPayLead(p => p ? { ...p, saving: true, msg: '' } : null);
    try {
      const res = await fetch('/api/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: quickPayLead.lead.id,
          opportunityId: null,
          paymentData: {
            paymentStructure: 'installment',
            paymentMethod: quickPayLead.method,
            transactionId: quickPayLead.txnId || undefined,
            paymentDate: quickPayLead.date,
            paidAmount: amount,
            totalAmount: quickPayLead.lead.payTotal || amount,
            amount,
          },
          receiptData: {
            description: `Balance payment receipt for ${quickPayLead.lead.fname} ${quickPayLead.lead.lname}`,
            receiptType: 'payment',
            taxAmount: 0,
            discountAmount: 0,
            notes: '',
          },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to create receipt');
      const receipt = json.data?.receipt || json.data || json;
      setQuickPayLead(p => p ? { ...p, saving: false, success: true, receipt, msg: `Receipt ${receipt.receiptNumber || ''} created!` } : null);
      fetchLeads();
    } catch (err: any) {
      setQuickPayLead(p => p ? { ...p, saving: false, msg: err.message || 'Failed to save payment' } : null);
    }
  };

  const getOperationsPath = (lead: Lead) => {
    const country = String(lead.country_interest || '').toLowerCase();
    const service = String(lead.service_interest || '').toLowerCase();
    const combined = `${country} ${service}`;

    if (combined.includes('resume') || combined.includes('rms') || combined.includes('marketing')) {
      return '/admin/leads/rms-operations';
    }
    if (combined.includes('visit') || combined.includes('tourist')) {
      return '/admin/leads/visit-visa-operations';
    }
    if (combined.includes('work visa') || combined.includes('work permit') || combined.includes('employment')) {
      return '/admin/leads/poland-visa-operations';
    }
    if (combined.includes('australia')) {
      return '/admin/leads/skill-australia-operations';
    }
    if (combined.includes('canada')) {
      return '/admin/leads/skill-canada-operations';
    }
    return '/admin/leads/skill-canada-operations';
  };

  const isClientLead = (lead: Lead) => {
    const status = String(lead.status || '').toLowerCase();
    const opportunityStatus = String((lead as any).opportunity_status || '').toLowerCase();
    return ['retained', 'converted', 'client'].includes(status) || opportunityStatus === 'won';
  };

  const handleOpenOperations = async (lead: Lead) => {
    try {
      let opportunityId = Number((lead as any).opportunity_id || (lead as any).resolved_opportunity_id);
      if (!opportunityId) {
        const response = await fetch(`/api/opportunities?leadId=${lead.id}`);
        if (response.ok) {
          const opportunities = await response.json();
          opportunityId = Number(Array.isArray(opportunities) ? opportunities[0]?.id : 0);
        }
      }

      if (!opportunityId) {
        window.toast.warning('No opportunity found for this client. Please complete the opportunity flow first.');
        return;
      }

      const clientName = `${lead.fname || ''} ${lead.lname || ''}`.trim() || 'Client';
      router.push(`${getOperationsPath(lead)}?opportunityId=${opportunityId}&leadId=${lead.id}&clientName=${encodeURIComponent(clientName)}`);
    } catch (error) {
      console.error('Error opening operations:', error);
      window.toast.error('Unable to open operations module for this client.');
    }
  };

  const handleOpenClientOpportunityFlow = async (lead: Lead) => {
    try {
      let opportunityId = Number((lead as any).opportunity_id || (lead as any).resolved_opportunity_id);
      if (!opportunityId) {
        const response = await fetch(`/api/opportunities?leadId=${lead.id}`);
        if (response.ok) {
          const opportunities = await response.json();
          opportunityId = Number(Array.isArray(opportunities) ? opportunities[0]?.id : 0);
        }
      }

      const params = new URLSearchParams({
        leadId: String(lead.id),
        stage: 'closed',
      });
      if (opportunityId) params.set('opportunityId', String(opportunityId));
      router.push(`/admin/leads/opportunity-flow?${params.toString()}`);
    } catch (error) {
      console.error('Error opening opportunity flow:', error);
      window.toast.error('Unable to open opportunity flow for this client.');
    }
  };

  const handleBulkConvertToOpportunity = async () => {
    if (isFoe(user)) {
      window.toast.error('FOE accounts cannot convert leads to opportunities.');
      return;
    }
    if (selectedLeads.length === 0) {
      window.toast.warning('Please select a lead to convert');
      return;
    }

    if (selectedLeads.length > 1) {
      window.toast.warning('Please select only one lead at a time. The opportunity wizard works one lead at a time.');
      return;
    }

    const selectedLeadId = Number(selectedLeads[0]);
    const lead = leads.find(l => Number(l.id) === selectedLeadId);
    if (!lead) {
      window.toast.error('Selected lead not found');
      return;
    }

    const confirmed = confirm(`Open opportunity wizard for ${lead.fname} ${lead.lname}?`);
    if (!confirmed) return;

    // Mark the lead as a draft opportunity immediately so it moves out of the
    // Leads tab and into Opportunity Draft the moment conversion starts, rather
    // than only once the wizard's Payment stage creates the real crm_opportunities
    // row. This intentionally does NOT create that row itself - doing so here
    // would make ensureOpportunityForClient() (opportunity-flow-wizard.tsx) find
    // an "existing opportunity" and skip creating the actual payment/invoice/
    // agreement records later.
    try {
      await fetch(`/api/leads/${selectedLeadId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ opportunity_status: 'draft' }),
      });
    } catch (err) {
      console.error('Error marking lead as draft opportunity:', err);
    }

    router.push(`/admin/leads/opportunity-flow?leadId=${selectedLeadId}`);
  };

  const handleBulkTransfer = async (employeeId?: number) => {
    if (selectedLeads.length === 0) return;
    const counsellorId = employeeId ?? (bulkTransferCounselorId ? Number(bulkTransferCounselorId) : null);
    if (!counsellorId) {
      window.toast.warning('Select a counselor to transfer to');
      return;
    }
    setBulkActionSaving(true);
    try {
      const res = await fetch('/api/admin/lead-pool', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ leadIds: selectedLeads, counsellorId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to transfer leads');
      window.toast.success(`Transferred ${data.transferred} lead(s) to ${data.counsellorName}`);
      setSelectedLeads([]);
      setBulkTransferCounselorId('');
      setShowBulkTransferModal(false);
      fetchLeads();
    } catch (err) {
      console.error('Error bulk-transferring leads:', err);
      window.toast.error(err instanceof Error ? err.message : 'Failed to transfer leads');
    } finally {
      setBulkActionSaving(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedLeads.length === 0) return;
    const confirmed = confirm(`This will permanently delete ${selectedLeads.length} lead(s) and cannot be undone. Continue?`);
    if (!confirmed) return;
    setBulkActionSaving(true);
    try {
      const res = await fetch('/api/leads/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ leadIds: selectedLeads }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete leads');
      window.toast.success(`Deleted ${data.deleted} lead(s)`);
      setSelectedLeads([]);
      fetchLeads();
    } catch (err) {
      console.error('Error bulk-deleting leads:', err);
      window.toast.error(err instanceof Error ? err.message : 'Failed to delete leads');
    } finally {
      setBulkActionSaving(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      const params = new URLSearchParams({
        exportType: 'excel',
        opportunityView: activeTab,
        ...Object.entries(filters).reduce((acc, [key, value]) => {
          if (value) acc[key] = value;
          return acc;
        }, {} as Record<string, string>)
      });

      const response = await fetch(`/api/leads?${params}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = activeTab === 'clients' ? 'client-list-export.xlsx' : activeTab === 'opportunities' ? 'opportunity-draft-export.xlsx' : 'leads-export.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting leads:', error);
    }
  };

  const handleImportExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ['.xlsx', '.xls', '.csv'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!validTypes.includes(ext)) {
      window.toast.warning('Please select a valid Excel file (.xlsx, .xls) or CSV file (.csv)');
      event.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      window.toast.warning('File size must be less than 5MB');
      event.target.value = '';
      return;
    }

    setImporting(true);
    try {
      // FileReader is callback-based, so it has to be wrapped in a Promise -
      // otherwise the try/finally below resolves (and re-enables the Import
      // button via setImporting(false)) as soon as the read is *kicked off*,
      // not once the read and the subsequent upload have actually finished.
      // For a large file that let a user fire a second, overlapping import
      // of the same file well before the first one completed.
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve((e.target?.result as string).split(',')[1]);
        reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });

      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          importType: 'excel',
          fileData: base64
        })
      });

      if (response.ok) {
        const data = await response.json();
        window.toast.info(data.message);
        fetchLeads();
      } else {
        const data = await response.json().catch(() => null);
        window.toast.error(data?.error || 'Error importing leads');
        console.error('Error importing leads');
      }
    } catch (error) {
      console.error('Error importing leads:', error);
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeads(selectableLeadIds);
    } else {
      setSelectedLeads([]);
    }
  };

  const handleSelectLead = (id: number, checked: boolean) => {
    const numericId = Number.isInteger(id) && id > 0 ? id : null;
    if (numericId === null) return;

    if (checked) {
      setSelectedLeads((current) => current.includes(numericId) ? current : [...current, numericId]);
    } else {
      setSelectedLeads((current) => current.filter(leadId => leadId !== numericId));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'untouched': return 'bg-amber-100 text-amber-800';
      case 'Prospect': return 'bg-blue-100 text-blue-800';
      case 'Not Interested': return 'bg-red-100 text-red-800';
      case 'DNQ': return 'bg-gray-100 text-gray-800';
      case 'Not_answered': return 'bg-yellow-100 text-yellow-800';
      case 'Could Not Connect': return 'bg-orange-100 text-orange-800';
      case 'Call Back': return 'bg-purple-100 text-purple-800';
      case 'Abroad Lead': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'Hot': return 'bg-red-100 text-red-800';
      case 'Warm': return 'bg-orange-100 text-orange-800';
      case 'Cold': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLeadActionTitle = () => {
    if (leadActionType === 'appointment') return 'Book Appointment';
    if (leadActionType === 'followup') return 'Add Follow-up';
    if (leadActionType === 'status') return 'Update Status';
    return 'Add Lead Remark';
  };

  const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const formatDate = (value?: string | null) => {
    if (!value) return 'No date';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return String(value);
    // Fixed DD MMM YYYY format (e.g. "06 Jul 2026") - toLocaleDateString() without
    // a pinned locale rendered differently per viewer's browser/OS settings
    // (M/D/YYYY, D/M/YYYY, etc.), which is what this was changed to fix.
    const day = String(parsed.getDate()).padStart(2, '0');
    const month = MONTH_ABBR[parsed.getMonth()];
    return `${day} ${month} ${parsed.getFullYear()}`;
  };

  const formatDateTime = (value?: string | null) => {
    if (!value) return 'No date';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleString();
  };

  const formatTime = (value?: string | null) => {
    if (!value) return 'No time';
    return String(value).slice(0, 5);
  };

  const getAppointmentLabel = (appointment: LeadActivity['appointments'][number]) => {
    if (Number(appointment.done || 0) === 1) return 'Completed';
    if (Number(appointment.not_done || 0) === 1) return 'Not Done';
    if (Number(appointment.booked || 0) === 1) return 'Fixed';
    return 'Pending';
  };

  if (authLoading || (loading && leads.length === 0 && !debouncedSearchTerm)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="overflow-visible rounded-lg border border-gray-200 bg-white shadow-sm">
      {loadError && (
        <div className="m-3 flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{loadError}</span>
          <button onClick={() => fetchLeads()} className="font-medium underline">Retry</button>
        </div>
      )}
      <div className="bg-white rounded-t-lg">
      <div ref={tabBarRef} className="border-b border-gray-200 bg-white px-3 py-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => handleTabChange('leads')}
            className={`flex shrink-0 items-center px-3 py-2 rounded-md text-sm font-semibold transition-colors ${
              activeTab === 'leads'
                ? 'bg-[var(--cmg-blue)] text-white shadow-sm'
                : 'text-[var(--cmg-muted)] hover:bg-[#F6EEDC] hover:text-[var(--cmg-ink)]'
            }`}
          >
            <Users className="w-4 h-4 mr-2" />
            Lead List
          </button>
          {showMyLeadsTab && (
            <button
              onClick={() => handleTabChange('my-leads')}
              className={`flex shrink-0 items-center px-3 py-2 rounded-md text-sm font-semibold transition-colors ${
                activeTab === 'my-leads'
                  ? 'bg-[var(--cmg-blue)] text-white shadow-sm'
                  : 'text-[var(--cmg-muted)] hover:bg-[#F6EEDC] hover:text-[var(--cmg-ink)]'
              }`}
            >
              <Users className="w-4 h-4 mr-2" />
              My Leads
            </button>
          )}
          <button
            onClick={() => handleTabChange('opportunities')}
            className={`flex shrink-0 items-center px-3 py-2 rounded-md text-sm font-semibold transition-colors ${
              activeTab === 'opportunities'
                ? 'bg-[var(--cmg-blue)] text-white shadow-sm'
                : 'text-[var(--cmg-muted)] hover:bg-[#F6EEDC] hover:text-[var(--cmg-ink)]'
            }`}
          >
            <Target className="w-4 h-4 mr-2" />
            Opportunity Draft
          </button>
          <button
            onClick={() => handleTabChange('clients')}
            className={`flex shrink-0 items-center px-3 py-2 rounded-md text-sm font-semibold transition-colors ${
              activeTab === 'clients'
                ? 'bg-[var(--cmg-blue)] text-white shadow-sm'
                : 'text-[var(--cmg-muted)] hover:bg-[#F6EEDC] hover:text-[var(--cmg-ink)]'
            }`}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Client List
          </button>
          <button
            onClick={() => handleTabChange('duplicates')}
            className={`flex shrink-0 items-center px-3 py-2 rounded-md text-sm font-semibold transition-colors ${
              activeTab === 'duplicates'
                ? 'bg-[var(--cmg-red)] text-white shadow-sm'
                : 'text-[var(--cmg-muted)] hover:bg-[#F6EEDC] hover:text-[var(--cmg-ink)]'
            }`}
          >
            <AlertCircle className="w-4 h-4 mr-2" />
            Duplicate Leads
          </button>
          <button
            onClick={() => handleTabChange('rejected')}
            className={`flex shrink-0 items-center px-3 py-2 rounded-md text-sm font-semibold transition-colors ${
              activeTab === 'rejected'
                ? 'bg-[var(--cmg-red)] text-white shadow-sm'
                : 'text-[var(--cmg-muted)] hover:bg-[#F6EEDC] hover:text-[var(--cmg-ink)]'
            }`}
            title="Opportunities rejected by Accounts, CRM Compliance, or a discount request"
          >
            <XCircle className="w-4 h-4 mr-2" />
            Rejected
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="border-b border-gray-200 bg-gradient-to-b from-white to-gray-50 p-3">
        <div className="grid grid-cols-1 gap-3 2xl:grid-cols-[minmax(420px,1fr)_auto] 2xl:items-center">
          <div className="grid min-w-0 grid-cols-1 gap-2 lg:grid-cols-[minmax(320px,1fr)_auto] lg:items-center">
            <div className="min-w-[280px]">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                <input
                  type="text"
                  placeholder={activeTab === 'opportunities' ? 'Search opportunities by name, phone, email...' : 'Search leads by name, phone, email...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-10 w-full rounded-md border border-gray-200 bg-white pl-10 pr-4 text-sm font-medium text-gray-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
                {searchTerm.length > 0 && searchTerm.length < 3 && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                    {3 - searchTerm.length} more
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              <div className="inline-flex h-10 items-center gap-2 rounded-md border border-gray-200 bg-white px-3 text-sm shadow-sm">
                <span className="font-semibold text-gray-500">Records</span>
                <span className="font-bold text-gray-950">{pagination.total.toLocaleString()}</span>
              </div>
              {activeFilterCount > 0 && (
                <button
                  onClick={resetLeadFilters}
                  className="inline-flex h-10 items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 text-sm font-semibold text-green-800 hover:bg-green-100"
                  title="Clear active filters"
                >
                  <X className="h-4 w-4" />
                  {activeFilterCount} active
                </button>
              )}
              {loading && (
                <span className="inline-flex h-10 items-center rounded-md border border-blue-100 bg-blue-50 px-3 text-sm font-semibold text-blue-700">
                  Refreshing...
                </span>
              )}
            </div>
          </div>

          {showActions && (
            <div className="flex flex-wrap items-center gap-2 2xl:justify-end">
              {(activeTab === 'leads' || activeTab === 'my-leads') && (
                <div className="flex h-10 items-center rounded-md bg-gray-100 p-1">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`flex h-8 items-center px-3 rounded-md text-sm font-medium transition-colors ${
                      viewMode === 'list'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <LayoutList className="w-4 h-4 mr-2" />
                    List
                  </button>
                  <button
                    onClick={() => setViewMode('kanban')}
                    className={`flex h-8 items-center px-3 rounded-md text-sm font-medium transition-colors ${
                      viewMode === 'kanban'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4 mr-2" />
                    Kanban
                  </button>
                </div>
              )}

              {(activeTab === 'leads' || activeTab === 'my-leads') && (
                <>
                  {activeTab === 'leads' && (
                    <button
                      onClick={() => router.push('/admin/leads/create')}
                      className="flex h-10 items-center rounded-md bg-blue-600 px-3 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add New Lead
                    </button>
                  )}
                  {!isFoe(user) && (
                    <button
                      onClick={handleBulkConvertToOpportunity}
                      className="flex h-10 items-center rounded-md bg-[var(--dmc-gold)] px-3 text-sm font-semibold text-[var(--dmc-green-dark)] hover:brightness-95"
                    >
                      <Target className="w-4 h-4 mr-2" />
                      Convert Selected to Opportunities
                    </button>
                  )}
                </>
              )}
              {activeTab === 'opportunities' && (
                <button
                  onClick={() => router.push('/admin/leads/create?mode=opportunity')}
                  className="flex h-10 items-center rounded-md bg-[var(--dmc-gold)] px-3 text-sm font-semibold text-[var(--dmc-green-dark)] hover:brightness-95"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Opportunity
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImportExcel}
                className="hidden"
              />
              {activeTab === 'leads' && canBulkUpload && (
                <button
                  type="button"
                  onClick={() => { window.location.href = '/api/leads/sample-template'; }}
                  className="flex h-10 items-center rounded-md border border-gray-300 px-3 text-sm font-semibold hover:bg-gray-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Sample
                </button>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                className={`flex h-10 items-center rounded-md border border-gray-300 px-3 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50 ${activeTab !== 'leads' || !canBulkUpload ? 'hidden' : ''}`}
              >
                <Upload className="w-4 h-4 mr-2" />
                {importing ? 'Importing...' : 'Import'}
              </button>
              {isBranchManagerOrCeo(user) && (
                <button
                  onClick={handleExportExcel}
                  className="flex h-10 items-center rounded-md border border-gray-300 px-3 text-sm font-semibold hover:bg-gray-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </button>
              )}
            </div>
          )}
        </div>

        <div className="mt-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-bold text-gray-900">Lead filters</span>
            </div>
            {activeFilterCount > 0 && (
              <button
                onClick={resetLeadFilters}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-gray-200 px-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
              >
                <X className="h-3.5 w-3.5" />
                Reset
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-6">
            <SearchableSelect value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})} className="h-9 rounded-md border border-gray-200 bg-gray-50 px-3 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500">
              <option value="">Status: All</option>
              {filterOptions.statuses.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </SearchableSelect>
            <SearchableSelect value={filters.priority} onChange={(e) => setFilters({...filters, priority: e.target.value})} className="h-9 rounded-md border border-gray-200 bg-gray-50 px-3 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500">
              <option value="">Priority: All</option>
              {filterOptions.priorities.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </SearchableSelect>
            <SearchableSelect value={filters.region} onChange={(e) => setFilters({...filters, region: e.target.value, branch: ''})} className="h-9 rounded-md border border-gray-200 bg-gray-50 px-3 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500">
              <option value="">Region: All</option>
              {filterOptions.regions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </SearchableSelect>
            <SearchableSelect value={filters.branch} onChange={(e) => setFilters({...filters, branch: e.target.value})} className="h-9 rounded-md border border-gray-200 bg-gray-50 px-3 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500">
              <option value="">Branch: All</option>
              {filteredBranchOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </SearchableSelect>
            {isFoeOrBranchManagerOrCeo(user) && (
              <SearchableSelect value={filters.assignTo} onChange={(e) => setFilters({...filters, assignTo: e.target.value})} className="h-9 rounded-md border border-gray-200 bg-gray-50 px-3 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500">
                <option value="">Counselor: All</option>
                {counselorFilterOptions.map((option) => <option key={option.id} value={String(option.id)}>{option.name}</option>)}
              </SearchableSelect>
            )}
            <SearchableSelect value={filters.countryInterest} onChange={(e) => setFilters({...filters, countryInterest: e.target.value})} className="h-9 rounded-md border border-gray-200 bg-gray-50 px-3 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500">
              <option value="">Country: All</option>
              {filterOptions.countries.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </SearchableSelect>
            <SearchableSelect value={filters.serviceInterest} onChange={(e) => setFilters({...filters, serviceInterest: e.target.value})} className="h-9 rounded-md border border-gray-200 bg-gray-50 px-3 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500">
              <option value="">Program: All</option>
              {filterOptions.services.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </SearchableSelect>
            <SearchableSelect value={filters.marketSource} onChange={(e) => setFilters({...filters, marketSource: e.target.value})} className="h-9 rounded-md border border-gray-200 bg-gray-50 px-3 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500">
              <option value="">Source: All</option>
              {filterOptions.sources.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </SearchableSelect>
            <SearchableSelect value={filters.leadQuality} onChange={(e) => setFilters({...filters, leadQuality: e.target.value})} className="h-9 rounded-md border border-gray-200 bg-gray-50 px-3 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500">
              <option value="">Quality: All</option>
              {filterOptions.leadQualities.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </SearchableSelect>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input type="date" value={filters.dateFrom} onChange={(e) => setFilters({...filters, dateFrom: e.target.value})} className="h-9 w-full rounded-md border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input type="date" value={filters.dateTo} onChange={(e) => setFilters({...filters, dateTo: e.target.value})} className="h-9 w-full rounded-md border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>
      </div>
      </div>

      {activeTab === 'leads' && isBranchManagerOrCeo(user) && selectedLeads.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white rounded-lg shadow-xl px-4 py-3 flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium whitespace-nowrap">{selectedLeads.length} selected</span>
          <button
            onClick={() => { setBulkTransferSearch(''); setShowBulkTransferModal(true); }}
            disabled={bulkActionSaving}
            className="px-3 py-1.5 bg-blue-600 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            Transfer
          </button>
          {isCeo(user) && (
            <button
              onClick={handleBulkDelete}
              disabled={bulkActionSaving}
              className="px-3 py-1.5 bg-[var(--cmg-red)] rounded-md text-sm font-medium hover:bg-[var(--cmg-red-dark)] disabled:opacity-50"
            >
              Delete
            </button>
          )}
          <button
            onClick={() => setSelectedLeads([])}
            className="px-2 py-1.5 text-gray-300 hover:text-white text-sm"
          >
            Clear
          </button>
        </div>
      )}

      {/* Leads Display - List or Kanban View */}
      {viewMode === 'list' ? (
        <div className="bg-slate-50">
          <div className="border-b border-gray-200 bg-white px-3 py-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-gray-600">
                <button onClick={() => toggleLeadSort('name')} className={`rounded-md border px-2.5 py-1.5 hover:bg-gray-50 ${leadSortKey === 'name' ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white'}`}>Name</button>
                <button onClick={() => toggleLeadSort('stage')} className={`rounded-md border px-2.5 py-1.5 hover:bg-gray-50 ${leadSortKey === 'stage' ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white'}`}>Stage</button>
                <button onClick={() => toggleLeadSort('registered')} className={`rounded-md border px-2.5 py-1.5 hover:bg-gray-50 ${leadSortKey === 'registered' ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white'}`}>Newest</button>
                <button onClick={() => toggleLeadSort('assignedTo')} className={`rounded-md border px-2.5 py-1.5 hover:bg-gray-50 ${leadSortKey === 'assignedTo' ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white'}`}>Counselor</button>
              </div>
              {(activeTab === 'leads' || activeTab === 'my-leads') && (
                <label className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm">
                  <input
                    type="checkbox"
                    checked={selectableLeadIds.length > 0 && selectedLeads.length === selectableLeadIds.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  Select visible
                </label>
              )}
            </div>
          </div>

          <div className="overflow-x-hidden p-3">
            {loading && (
              <div className="mb-3 flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading leads...
              </div>
            )}
            {loading && sortedLeadRows.length === 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="flex gap-3">
                      <div className="h-11 w-11 shrink-0 animate-pulse rounded-lg bg-gray-200" />
                      <div className="min-w-0 flex-1 space-y-3">
                        <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                          <div className="h-3 animate-pulse rounded bg-gray-100" />
                          <div className="h-3 animate-pulse rounded bg-gray-100" />
                          <div className="h-3 animate-pulse rounded bg-gray-100" />
                        </div>
                        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                          <div className="h-12 animate-pulse rounded-md bg-gray-100" />
                          <div className="h-12 animate-pulse rounded-md bg-gray-100" />
                          <div className="h-12 animate-pulse rounded-md bg-gray-100" />
                          <div className="h-12 animate-pulse rounded-md bg-gray-100" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : sortedLeadRows.length === 0 ? (
              <div className="flex h-full min-h-[280px] items-center justify-center rounded-lg border border-dashed border-[var(--cmg-border)] bg-white text-center">
                <div>
                  <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--cmg-blue-soft)]">
                    <Users className="h-7 w-7 text-[var(--cmg-blue)]" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900">No leads found</h3>
                  <p className="mt-1 text-sm text-gray-500">Try changing filters or search terms.</p>
                </div>
              </div>
            ) : (
              <div className={`grid grid-cols-1 gap-3 transition-opacity ${loading ? 'pointer-events-none opacity-55' : 'opacity-100'}`}>
                <AnimatePresence initial={false} mode="popLayout">
                {sortedLeadRows.map((lead: Lead, index) => {
                  const leadId = getSelectableLeadId(lead);
                  const stage = getPipelineStage(lead);
                  const totalStages = PIPELINE_STAGES.length;
                  const progressPct = Math.round((stage.stepIndex / (totalStages - 1)) * 100);
                  const waNumber = lead.whatsapp_number || lead.mobile;
                  const waLink = getWhatsAppLink(waNumber);
                  const name = [lead.fname, lead.mname, lead.lname].filter(Boolean).join(' ') || `Lead #${lead.id}`;
                  const initials = `${lead.fname?.[0] || ''}${lead.lname?.[0] || ''}`.toUpperCase() || 'LD';
                  const workflowChecks = getWorkflowChecks(lead);
                  const showWorkflowChecks = activeTab !== 'leads' && activeTab !== 'my-leads';

                  return (
                    <motion.article
                      key={leadId ?? `${lead.email || 'lead'}-${index}`}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.22, delay: Math.min(index * 0.02, 0.2), ease: 'easeOut' }}
                      className="group min-w-0 rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-[var(--cmg-blue)]/25 hover:shadow-md lg:p-4"
                    >
                      <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_auto]">
                        <div className="flex min-w-0 gap-3">
                          {(activeTab === 'leads' || activeTab === 'my-leads') && (
                            <input
                              type="checkbox"
                              checked={leadId !== null && selectedLeads.includes(leadId)}
                              disabled={leadId === null}
                              onChange={(e) => leadId !== null && handleSelectLead(leadId, e.target.checked)}
                              className="mt-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          )}
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--cmg-blue)] to-[var(--dmc-green-medium)] text-sm font-black text-white shadow-sm transition-transform duration-200 group-hover:scale-105">
                            {initials}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              {activeTab === 'leads' || activeTab === 'opportunities' ? (
                                <Link
                                  href={activeTab === 'leads' ? `/admin/leads/${lead.id}/edit` : `/admin/leads/opportunity-flow?leadId=${lead.id}`}
                                  className="min-w-0 break-words text-base font-bold text-gray-950 hover:text-blue-700"
                                >
                                  {name}
                                </Link>
                              ) : (
                                <button
                                  onClick={() => handleOpenOperations(lead)}
                                  className="min-w-0 break-words text-left text-base font-bold text-gray-950 hover:text-blue-700"
                                >
                                  {name}
                                </button>
                              )}
                              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">#{lead.id}</span>
                              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${getQualityColor(lead.lead_quality || 'Unknown')}`}>
                                {lead.lead_quality || 'No Quality'}
                              </span>
                            </div>

                            <div className="mt-2 grid grid-cols-1 gap-2 text-sm text-gray-600 sm:grid-cols-2 xl:grid-cols-3">
                              <div className="flex min-w-0 items-center gap-2">
                                <Mail className="h-4 w-4 shrink-0 text-gray-400" />
                                <span className="truncate" title={lead.email || undefined}>{lead.email || 'No email'}</span>
                              </div>
                              <div className="flex min-w-0 items-center gap-2">
                                <Phone className="h-4 w-4 shrink-0 text-gray-400" />
                                <span className="truncate" title={lead.phone || undefined}>{lead.phone || lead.mobile || 'No phone'}</span>
                              </div>
                              <div className="flex min-w-0 items-center gap-2">
                                <MapPin className="h-4 w-4 shrink-0 text-gray-400" />
                                <span className="truncate" title={lead.address || undefined}>{lead.dmBranch?.name || lead.address || 'No branch'}</span>
                              </div>
                            </div>

                            <div className="mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2 xl:grid-cols-4">
                              <div className="min-w-0 rounded-md bg-gray-50 p-2">
                                <div className="font-semibold uppercase text-gray-400">Interest</div>
                                <div className="mt-0.5 truncate font-semibold text-gray-900" title={(lead as any).country_interest_label || lead.country_interest || undefined}>{(lead as any).country_interest_label || lead.country_interest || '—'}</div>
                                <div className="truncate text-gray-600" title={(lead as any).service_interest_label || lead.service_interest || undefined}>{(lead as any).service_interest_label || lead.service_interest || '—'}</div>
                              </div>
                              <div className="min-w-0 rounded-md bg-gray-50 p-2">
                                <div className="font-semibold uppercase text-gray-400">Source</div>
                                <div className="mt-0.5 truncate font-semibold text-gray-900" title={resolveSourceName(lead) || undefined}>{resolveSourceName(lead) || '—'}</div>
                                <div className="truncate text-gray-600" title={lead.campaign || undefined}>{lead.campaign || 'No campaign'}</div>
                              </div>
                              <div className="min-w-0 rounded-md bg-gray-50 p-2">
                                <div className="flex items-center justify-between gap-1">
                                  <div className="font-semibold uppercase text-gray-400">Owner</div>
                                  {isBranchManagerOrCeo(user) && lead.dmEmployeeByASSIGNTo?.name && (
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); handleReleaseToPool(lead); }}
                                      disabled={releasingLeadId === lead.id}
                                      className="shrink-0 text-[10px] font-semibold uppercase text-amber-600 hover:text-amber-800 disabled:opacity-50"
                                      title="Release this lead back to the shared pool for any agent in this branch to claim"
                                    >
                                      {releasingLeadId === lead.id ? 'Releasing…' : 'Release'}
                                    </button>
                                  )}
                                </div>
                                {canAssignLeads ? (
                                  <button
                                    onClick={() => openAssignModal(lead)}
                                    className="mt-0.5 block max-w-full truncate text-left font-semibold text-blue-700 hover:underline"
                                    title="Assign or reassign"
                                  >
                                    {lead.dmEmployeeByASSIGNTo?.name || 'Unassigned'}
                                  </button>
                                ) : (
                                  <div className="mt-0.5 truncate font-semibold text-gray-900">{lead.dmEmployeeByASSIGNTo?.name || 'Unassigned'}</div>
                                )}
                                <div className="text-gray-600">{formatDate(lead.regdate)}</div>
                              </div>
                              <div className="min-w-0 rounded-md bg-gray-50 p-2">
                                <div className="font-semibold uppercase text-gray-400">Status</div>
                                <button
                                  type="button"
                                  onClick={() => openLeadActionModal(lead, 'status')}
                                  className={`mt-0.5 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${getStatusColor(lead.status || 'Unknown')}`}
                                >
                                  {lead.status || 'No Status'}
                                </button>
                                <div className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${getPriorityColor(lead.priority)}`}>
                                  {lead.priority || 'No'} Priority
                                </div>
                              </div>
                            </div>

                            <div className="mt-3">
                              <div className="mb-1 flex items-center justify-between gap-2">
                                <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${stage.color}`}>{stage.label}</span>
                                <span className="text-xs font-semibold text-gray-400">{stage.stepIndex + 1}/{totalStages}</span>
                              </div>
                              <div className="h-2 overflow-hidden rounded-full bg-[var(--cmg-blue-soft)]">
                                <div className="h-full rounded-full bg-gradient-to-r from-[var(--cmg-blue)] to-[var(--dmc-gold)] transition-[width] duration-300" style={{ width: `${progressPct}%` }} />
                              </div>
                            </div>

                            {showWorkflowChecks && (
                              <div className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2 xl:grid-cols-3">
                                {workflowChecks.map((item) => {
                                  const Icon = item.icon;
                                  const value = String(item.value || 'pending').replace(/[-_]+/g, ' ');
                                  return (
                                    <div
                                      key={item.id}
                                      className={`min-w-0 rounded-md border px-2 py-1.5 text-xs ${getWorkflowBadgeClass(item.value)}`}
                                      title={item.detail || `${item.label}: ${value}`}
                                    >
                                      <div className="flex min-w-0 items-center gap-1.5">
                                        <Icon className="h-3.5 w-3.5 shrink-0" />
                                        <span className="truncate font-bold">{item.label}</span>
                                      </div>
                                      <div className="mt-0.5 truncate pl-5 font-semibold capitalize">
                                        {item.detail || value}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {activeTab === 'rejected' && (() => {
                              const rejections: Array<{ gate: string; note: string | null }> = [];
                              if ((lead as any).finance_status === 'rejected') {
                                rejections.push({ gate: 'Accounts', note: (lead as any).finance_reason || null });
                              }
                              if ((lead as any).compliance_status === 'rejected') {
                                rejections.push({ gate: 'CRM Compliance', note: (lead as any).compliance_reason || null });
                              }
                              if ((lead as any).discount_status === 'rejected') {
                                rejections.push({ gate: 'Discount request', note: null });
                              }
                              if (rejections.length === 0) return null;
                              return (
                                <div className="mt-3 space-y-1.5 rounded-md border border-rose-200 bg-rose-50 p-2 text-xs leading-relaxed text-rose-900">
                                  {rejections.map((r) => (
                                    <div key={r.gate}>
                                      <span className="font-semibold">{r.gate} rejected this opportunity.</span>
                                      {r.note && <span className="break-words"> {r.note}</span>}
                                    </div>
                                  ))}
                                </div>
                              );
                            })()}

                            {lead.latest_remark && (
                              <div className="mt-3 rounded-md border border-amber-100 bg-amber-50/70 p-2 text-xs leading-relaxed text-gray-700">
                                <span className="font-semibold text-amber-800">Latest remark: </span>
                                <span className="break-words">{lead.latest_remark}</span>
                              </div>
                            )}

                            {activeTab === 'clients' && Number(lead.payTotal) > 0 && (
                              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                                <span className="rounded-md bg-gray-100 px-2 py-1 font-semibold text-gray-700">Total AED {Number(lead.payTotal).toLocaleString()}</span>
                                <span className="rounded-md bg-green-50 px-2 py-1 font-semibold text-green-700">Paid AED {Number(lead.paidYet || 0).toLocaleString()}</span>
                                <span className={`rounded-md px-2 py-1 font-semibold ${Number(lead.payBalance) > 0 ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                  {Number(lead.payBalance) > 0 ? `Balance AED ${Number(lead.payBalance).toLocaleString()}` : 'Fully paid'}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 xl:max-w-[210px] xl:justify-end">
                          {activeTab === 'clients' && Number(lead.payBalance) > 0 && (
                            <button onClick={() => openQuickPayForLead(lead)} title="Collect balance and receipt" className="inline-flex h-9 min-w-9 items-center justify-center rounded-md bg-[var(--cmg-red)] px-2 text-xs font-bold text-white hover:bg-[var(--cmg-red-dark)]">
                              <Receipt className="h-4 w-4" />
                            </button>
                          )}
                          <button onClick={() => handleViewLead(lead)} className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[var(--cmg-blue-soft)] text-[var(--cmg-blue)] hover:bg-[#F5D9C6]" title="View lead">
                            <Eye className="h-4 w-4" />
                          </button>
                          <Link
                            href={`/admin/leads/${lead.id}/edit`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[var(--cmg-blue-soft)] text-[var(--cmg-blue)] hover:bg-[#F5D9C6]"
                            title="Open lead in new tab"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                          <button onClick={() => openLeadActionModal(lead, 'appointment')} className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[var(--cmg-blue-soft)] text-[var(--cmg-blue)] hover:bg-[#F5D9C6]" title="Book appointment">
                            <Calendar className="h-4 w-4" />
                          </button>
                          <button onClick={() => openLeadActionModal(lead, 'followup')} className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[var(--cmg-blue-soft)] text-[var(--cmg-blue)] hover:bg-[#F5D9C6]" title="Add follow-up">
                            <Clock className="h-4 w-4" />
                          </button>
                          <button onClick={() => openLeadActionModal(lead, 'remark')} className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[var(--cmg-blue-soft)] text-[var(--cmg-blue)] hover:bg-[#F5D9C6]" title="Add remark">
                            <MessageSquare className="h-4 w-4" />
                          </button>
                          {waLink && (
                            <a href={waLink} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-green-50 text-green-700 hover:bg-green-100" title="WhatsApp">
                              <MessageCircle className="h-4 w-4" />
                            </a>
                          )}
                          {(activeTab === 'leads' || activeTab === 'my-leads') && !isFoe(user) && (
                            <button onClick={() => handleConvertToOpportunity(Number(lead.id))} className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[var(--dmc-gold-soft)] text-[var(--dmc-green-dark)] hover:bg-[var(--dmc-gold)] hover:text-white" title="Start Opportunity Flow">
                              <Target className="h-4 w-4" />
                            </button>
                          )}
                          {(activeTab === 'leads' || activeTab === 'my-leads') && !isFoe(user) && (isBranchManagerOrCeo(user) || String(lead.dmBranch?.abbrv || '').trim().toUpperCase() === 'HYD') && (
                            <Link href={`/admin/leads/evaluation-report-flow?leadId=${lead.id}`} className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[var(--cmg-blue-soft)] text-[var(--cmg-blue)] hover:bg-[#F5D9C6]" title="Generate Evaluation Report">
                              <ClipboardCheck className="h-4 w-4" />
                            </Link>
                          )}
                          {activeTab === 'rejected' && !isFoe(user) && (
                            <button onClick={() => handleConvertToOpportunity(Number(lead.id))} className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[var(--dmc-gold-soft)] text-[var(--dmc-green-dark)] hover:bg-[var(--dmc-gold)] hover:text-white" title="Restart Opportunity Flow from the beginning">
                              <RotateCcw className="h-4 w-4" />
                            </button>
                          )}
                          {activeTab === 'clients' && isClientLead(lead) && (
                            <button onClick={() => handleOpenClientOpportunityFlow(lead)} className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[var(--cmg-blue-soft)] text-[var(--cmg-blue)] hover:bg-[#F5D9C6]" title="Edit opportunity flow">
                              <Settings className="h-4 w-4" />
                            </button>
                          )}
                          {activeTab === 'clients' && isClientLead(lead) && (
                            <button onClick={() => handleOpenOperations(lead)} className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[var(--cmg-blue-soft)] text-[var(--cmg-blue)] hover:bg-[#F5D9C6]" title="Open Operations">
                              <Briefcase className="h-4 w-4" />
                            </button>
                          )}
                          {activeTab === 'opportunities' && (
                            <Link href={`/admin/leads/opportunity-flow?leadId=${lead.id}`} className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[var(--cmg-blue-soft)] text-[var(--cmg-blue)] hover:bg-[#F5D9C6]" title="Edit opportunity flow">
                              <Settings className="h-4 w-4" />
                            </Link>
                          )}
                          {activeTab === 'opportunities' && isCeo(user) && (
                            <button onClick={() => handleRevertOpportunity(lead)} className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[var(--cmg-blue-soft)] text-[var(--cmg-blue)] hover:bg-[#F5D9C6]" title="Revert to lead">
                              <RotateCcw className="h-4 w-4" />
                            </button>
                          )}
                          <Link href={`/admin/leads/${lead.id}/edit`} className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[var(--cmg-blue-soft)] text-[var(--cmg-blue)] hover:bg-[#F5D9C6]" title="Edit lead">
                            <Edit className="h-4 w-4" />
                          </Link>
                          {isCeo(user) && (
                            <button onClick={() => handleDeleteLead(lead.id)} className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-red-50 text-[var(--cmg-red)] hover:bg-red-100" title="Delete lead">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
                </AnimatePresence>
              </div>
            )}
          </div>

          {false && tableScrollWidth > 0 && (
            <div
              ref={topScrollRef}
              onScroll={handleTopScroll}
              className="overflow-x-auto overflow-y-hidden border-b border-gray-200"
              style={{ height: 14 }}
            >
              <div style={{ width: tableScrollWidth, height: 1 }} />
            </div>
          )}
          {/* overflow-x-auto only (not overflow-hidden on the card above) so
              the sticky thead below can actually stick as the page scrolls -
              an ancestor with overflow-hidden on both axes would otherwise
              become the thead's sticky containing block instead of <main>. */}
          <div ref={tableScrollRef} onScroll={handleTableScroll} className="hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="sticky z-10 bg-gray-50 shadow-sm" style={{ top: tabBarHeight }}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {activeTab === 'leads' && (
                      <input
                        type="checkbox"
                        checked={selectableLeadIds.length > 0 && selectedLeads.length === selectableLeadIds.length}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    )}
                  </th>
                  <SortableTh
                    label={activeTab === 'clients' ? 'Client Information' : activeTab === 'opportunities' ? 'Opportunity Draft' : 'Lead Information'}
                    sortKey="name" activeKey={leadSortKey} direction={leadSortDirection} onSort={toggleLeadSort}
                  />
                  <SortableTh label="Contact" sortKey="contact" activeKey={leadSortKey} direction={leadSortDirection} onSort={toggleLeadSort} />
                  <SortableTh label="Interest / Source" sortKey="interest" activeKey={leadSortKey} direction={leadSortDirection} onSort={toggleLeadSort} />
                  <SortableTh label="Latest Remark" sortKey="remark" activeKey={leadSortKey} direction={leadSortDirection} onSort={toggleLeadSort} />
                  <SortableTh label="Pipeline Stage" sortKey="stage" activeKey={leadSortKey} direction={leadSortDirection} onSort={toggleLeadSort} />
                  <SortableTh label="Status" sortKey="status" activeKey={leadSortKey} direction={leadSortDirection} onSort={toggleLeadSort} />
                  {activeTab === 'clients' && (
                    <SortableTh label="Balance Due" sortKey="balanceDue" activeKey={leadSortKey} direction={leadSortDirection} onSort={toggleLeadSort} />
                  )}
                  <SortableTh label="Registered" sortKey="registered" activeKey={leadSortKey} direction={leadSortDirection} onSort={toggleLeadSort} />
                  {isBranchManagerOrCeo(user) && (
                    <SortableTh label="Branch" sortKey="branch" activeKey={leadSortKey} direction={leadSortDirection} onSort={toggleLeadSort} />
                  )}
                  <SortableTh label="Assigned To" sortKey="assignedTo" activeKey={leadSortKey} direction={leadSortDirection} onSort={toggleLeadSort} />
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedLeadRows.map((lead: Lead, index) => {
                  const leadId = getSelectableLeadId(lead);

                  return (
                  <tr key={leadId ?? `${lead.email || 'lead'}-${index}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {activeTab === 'leads' && (
                        <input
                          type="checkbox"
                          checked={leadId !== null && selectedLeads.includes(leadId)}
                          disabled={leadId === null}
                          onChange={(e) => leadId !== null && handleSelectLead(leadId, e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        {activeTab === 'leads' || activeTab === 'opportunities' ? (
                          <Link
                            href={activeTab === 'leads' ? `/admin/leads/${lead.id}/edit` : `/admin/leads/opportunity-flow?leadId=${lead.id}`}
                            className="text-sm font-semibold text-blue-700 hover:text-blue-900 hover:underline text-left"
                          >
                            {lead.fname} {lead.mname} {lead.lname}
                          </Link>
                        ) : (
                          <button
                            onClick={() => handleOpenOperations(lead)}
                            className="text-sm font-semibold text-blue-700 hover:text-blue-900 hover:underline text-left"
                          >
                            {lead.fname} {lead.mname} {lead.lname}
                          </button>
                        )}
                        <Link
                          href={`/admin/leads/${lead.id}/edit`}
                          className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                          title="Open lead"
                        >
                          ID: {lead.id}
                        </Link>
                        <div className="text-sm text-gray-500">
                          {[
                            lead.gender,
                            lead.dob && !String(lead.dob).startsWith('1970-01-01') ? formatDate(lead.dob) : null,
                          ]
                            .filter(Boolean)
                            .join(' • ') || '—'}
                        </div>
                        <div className="flex items-center mt-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getQualityColor(lead.lead_quality || 'Unknown')}`}>
                            {lead.lead_quality || 'No Quality'}
                          </span>
                        </div>
                        {(activeTab === 'opportunities' || activeTab === 'clients') && (
                          <div className="text-xs text-green-700 mt-1">
                            Opp #{(lead as any).resolved_opportunity_id || (lead as any).opportunity_id || '—'}
                          </div>
                        )}
                        {activeTab === 'clients' && (lead as any).agreementNumber && (
                          <div className="text-xs text-violet-700 mt-0.5 font-medium">
                            {(lead as any).agreementNumber}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center">
                        <Mail className="w-4 h-4 mr-1 text-gray-400" />
                        {lead.email}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center mt-1">
                        <Phone className="w-4 h-4 mr-1 text-gray-400" />
                        {lead.phone}
                      </div>
                      {(() => {
                        const waNumber = lead.whatsapp_number || lead.mobile;
                        const waLink = getWhatsAppLink(waNumber);
                        if (!waLink) return null;
                        return (
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-sm text-green-600 flex items-center mt-1 hover:text-green-700 hover:underline"
                            title="Chat on WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4 mr-1 text-green-500" />
                            {waNumber}
                          </a>
                        );
                      })()}
                      <div className="text-sm text-gray-500 flex items-center mt-1" title={lead.address || undefined}>
                        <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                        {/* Braanch is the authoritative "where this lead belongs" — lead.address is
                            free text submitted by external intake forms (web-to-leads, etc.) and can
                            be wrong/inconsistent with the branch (e.g. a residency-country default
                            the visitor never changed), so it's shown as a hover tooltip, not the label. */}
                        {lead.dmBranch?.name || lead.address || '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{(lead as any).country_interest_label || lead.country_interest || '—'}</div>
                      <div className="text-sm text-gray-600">{(lead as any).service_interest_label || lead.service_interest || '—'}</div>
                      {resolveSourceName(lead) ? (
                        <div className="text-xs text-indigo-600 mt-1">
                          Source: {resolveSourceName(lead)}
                        </div>
                      ) : null}
                      {lead.campaign ? (
                        <div className="text-xs text-purple-600 mt-0.5">
                          Campaign: {lead.campaign}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-6 py-4 max-w-[180px]">
                      {/* lead.lead_remark is intentionally excluded here — for
                          web/pop/live-chat intake it's an auto-generated
                          Source/Campaign/UTM summary (already shown in the
                          Interest / Source column), not a real remark. Only
                          genuine entries from crm_forum_leads_remarks count. */}
                      {lead.latest_remark ? (
                        <div
                          className="text-xs text-gray-700 line-clamp-3 leading-relaxed"
                          title={lead.latest_remark}
                        >
                          {lead.latest_remark}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">No remarks</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(() => {
                        const stage = getPipelineStage(lead);
                        const totalStages = PIPELINE_STAGES.length;
                        const progressPct = Math.round(((stage.stepIndex) / (totalStages - 1)) * 100);
                        return (
                          <div className="space-y-1.5">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${stage.color}`}>
                              {stage.label}
                            </span>
                            <div className="relative w-full" title={`Stage ${stage.stepIndex + 1} of ${totalStages}: ${PIPELINE_STAGES[stage.stepIndex]?.label || stage.label}`}>
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div className={`h-1.5 rounded-full transition-all ${
                                  stage.stepIndex >= 10 ? 'bg-emerald-500' :
                                  stage.stepIndex >= 9 ? 'bg-teal-500' :
                                  stage.stepIndex >= 7 ? 'bg-violet-500' :
                                  stage.stepIndex >= 5 ? 'bg-blue-500' :
                                  stage.stepIndex >= 3 ? 'bg-amber-500' :
                                  'bg-gray-400'
                                }`} style={{ width: `${progressPct}%` }} />
                              </div>
                              <span className="text-[10px] text-gray-400 mt-0.5">{stage.stepIndex + 1}/{totalStages}</span>
                            </div>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <button
                          type="button"
                          onClick={() => openLeadActionModal(lead, 'status')}
                          title="Click to update status with a remark"
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium hover:ring-2 hover:ring-offset-1 hover:ring-current transition-shadow ${getStatusColor(lead.status || 'Unknown')}`}
                        >
                          {lead.status || 'No Status'}
                        </button>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(lead.priority)}`}>
                          {lead.priority} Priority
                        </span>
                      </div>
                    </td>
                    {activeTab === 'clients' && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        {Number(lead.payTotal) > 0 ? (
                          <div className="space-y-1">
                            <div className="text-xs text-gray-500">
                              Total: <span className="font-medium text-gray-800">AED {Number(lead.payTotal).toLocaleString()}</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              Paid: <span className="font-medium text-green-700">AED {Number(lead.paidYet || 0).toLocaleString()}</span>
                            </div>
                            {Number(lead.payBalance) > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded-lg bg-red-100 text-red-700 border border-red-200">
                                <AlertCircle className="w-3 h-3" />
                                AED {Number(lead.payBalance).toLocaleString()}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-lg bg-green-100 text-green-700">
                                <CheckCircle className="w-3 h-3" />
                                Fully Paid
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(lead.regdate)}
                    </td>
                    {isBranchManagerOrCeo(user) && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {lead.dmBranch?.name || '—'}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        {canAssignLeads ? (
                          <button
                            onClick={() => openAssignModal(lead)}
                            className={lead.dmEmployeeByASSIGNTo?.name
                              ? 'text-gray-700 hover:text-blue-700 font-medium underline decoration-dotted'
                              : 'text-red-600 hover:text-red-800 font-medium underline'}
                            title="Click to assign or reassign this lead"
                          >
                            {lead.dmEmployeeByASSIGNTo?.name || 'Unassigned'}
                          </button>
                        ) : (
                          lead.dmEmployeeByASSIGNTo?.name || 'Unassigned'
                        )}
                      </div>
                      <div className="text-xs text-gray-400">{lead.dmBranch?.name}</div>
                      {lead.appointment && (
                        <div className="flex items-center text-xs text-blue-600 mt-1">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(lead.appointment).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="relative flex items-center space-x-2 flex-wrap gap-y-1">
                        {activeTab === 'clients' && Number(lead.payBalance) > 0 && (
                          <button
                            onClick={() => openQuickPayForLead(lead)}
                            title={`Collect balance AED ${Number(lead.payBalance).toLocaleString()} & generate receipt`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-orange-500 text-white hover:bg-orange-600"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            Receipt
                          </button>
                        )}
                        <button
                          onClick={() => handleViewLead(lead)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View lead"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openLeadActionModal(lead, 'appointment')}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Book appointment"
                        >
                          <Calendar className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openLeadActionModal(lead, 'followup')}
                          className="text-amber-600 hover:text-amber-900"
                          title="Add follow-up"
                        >
                          <Clock className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openLeadActionModal(lead, 'remark')}
                          className="text-slate-600 hover:text-slate-900"
                          title="Add remark"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openLeadActionModal(lead, 'status')}
                          className="text-emerald-600 hover:text-emerald-900"
                          title="Update status with remark"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        {activeTab === 'leads' && !isFoe(user) && (
                          <button
                            onClick={() => handleConvertToOpportunity(Number(lead.id))}
                            className="text-green-600 hover:text-green-900"
                            title="Start Opportunity Flow"
                          >
                            <Target className="w-4 h-4" />
                          </button>
                        )}
                        {activeTab === 'clients' && isClientLead(lead) && (
                          <button
                            onClick={() => handleOpenClientOpportunityFlow(lead)}
                            className="text-amber-600 hover:text-amber-900"
                            title="Edit opportunity flow"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                        )}
                        {activeTab === 'clients' && isClientLead(lead) && (
                          <button
                            onClick={() => handleOpenOperations(lead)}
                            className="text-purple-600 hover:text-purple-900"
                            title="Open Operations"
                          >
                            <Briefcase className="w-4 h-4" />
                          </button>
                        )}
                        {activeTab === 'opportunities' && (
                          <Link
                            href={`/admin/leads/opportunity-flow?leadId=${lead.id}`}
                            className="text-amber-600 hover:text-amber-900"
                            title="Edit opportunity flow"
                          >
                            <Settings className="w-4 h-4" />
                          </Link>
                        )}
                        {activeTab === 'opportunities' && isCeo(user) && (
                          <button
                            onClick={() => handleRevertOpportunity(lead)}
                            className="text-orange-600 hover:text-orange-900"
                            title="Revert to lead (undo conversion)"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                        <Link
                          href={`/admin/leads/${lead.id}/edit`}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit lead"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        {isCeo(user) && (
                          <button
                            onClick={() => handleDeleteLead(lead.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete lead"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-white px-4 py-3 flex flex-col gap-2 border-t border-gray-200 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-center justify-center space-x-2 sm:hidden">
              <span className="text-sm text-gray-600">Show</span>
              <select
                value={pagination.limit}
                onChange={(e) => setPagination(prev => ({ ...prev, limit: Number(e.target.value), page: 1 }))}
                className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className="flex-1 flex items-center justify-between sm:hidden">
              <button
                onClick={() => setPagination({...pagination, page: 1})}
                disabled={pagination.page === 1}
                className="relative inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPagination({...pagination, page: Math.max(1, pagination.page - 1)})}
                disabled={pagination.page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination({...pagination, page: Math.min(pagination.pages, pagination.page + 1)})}
                disabled={pagination.page === pagination.pages}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
              <button
                onClick={() => setPagination({...pagination, page: pagination.pages})}
                disabled={pagination.page === pagination.pages}
                className="relative inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div className="flex items-center space-x-4">
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
                  <span className="font-medium">{pagination.total}</span> results
                </p>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Show</span>
                  <select
                    value={pagination.limit}
                    onChange={(e) => setPagination(prev => ({ ...prev, limit: Number(e.target.value), page: 1 }))}
                    className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setPagination({...pagination, page: 1})}
                    disabled={pagination.page === 1}
                    title="First page"
                    className="relative inline-flex items-center px-2 py-2 border border-gray-300 text-sm font-medium text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50 rounded-l-md"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPagination({...pagination, page: Math.max(1, pagination.page - 1)})}
                    disabled={pagination.page === 1}
                    title="Previous page"
                    className="relative inline-flex items-center px-2 py-2 border border-gray-300 text-sm font-medium text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {getPageWindow(pagination.page, pagination.pages).map((page, idx) => (
                    typeof page === 'number' ? (
                      <button
                        key={page}
                        onClick={() => setPagination({...pagination, page})}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          pagination.page === page
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ) : (
                      <span
                        key={`ellipsis-${idx}`}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500"
                      >
                        …
                      </span>
                    )
                  ))}
                  <button
                    onClick={() => setPagination({...pagination, page: Math.min(pagination.pages, pagination.page + 1)})}
                    disabled={pagination.page === pagination.pages}
                    title="Next page"
                    className="relative inline-flex items-center px-2 py-2 border border-gray-300 text-sm font-medium text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPagination({...pagination, page: pagination.pages})}
                    disabled={pagination.page === pagination.pages}
                    title="Last page"
                    className="relative inline-flex items-center px-2 py-2 border border-gray-300 text-sm font-medium text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50 rounded-r-md"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <LeadKanbanSimple
          leads={leads}
          onLeadSelect={handleViewLead}
          onConvertToOpportunity={isFoe(user) ? undefined : handleConvertToOpportunity}
          onEditLead={(lead) => router.push(`/admin/leads/${lead.id}/edit`)}
          onDeleteLead={isCeo(user) ? handleDeleteLead : undefined}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* View Lead Modal */}
      {showViewModal && currentLead && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-5/6 lg:w-4/5 shadow-lg rounded-lg bg-white">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {currentLead.fname} {currentLead.mname} {currentLead.lname}
                </h3>
                <p className="text-sm text-gray-500">Lead #{currentLead.id}</p>
              </div>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setCurrentLead(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="rounded-lg border border-gray-200 p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Contact</h4>
                <p><span className="font-medium">Email:</span> {currentLead.email || 'N/A'}</p>
                <p><span className="font-medium">Phone:</span> {currentLead.phone || 'N/A'}</p>
                <p><span className="font-medium">Mobile:</span> {currentLead.mobile || 'N/A'}</p>
                <p><span className="font-medium">Address:</span> {currentLead.address || 'N/A'}</p>
              </div>

              <div className="rounded-lg border border-gray-200 p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Interest</h4>
                <p><span className="font-medium">Country:</span> {currentLead.country_interest_label || currentLead.country_interest || 'N/A'}</p>
                <p><span className="font-medium">Service:</span> {currentLead.service_interest_label || currentLead.service_interest || 'N/A'}</p>
                <p><span className="font-medium">Source:</span> {resolveSourceName(currentLead) || 'N/A'}</p>
                <p><span className="font-medium">Quality:</span> {currentLead.lead_quality || 'N/A'}</p>
              </div>

              <div className="rounded-lg border border-gray-200 p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Status</h4>
                <p><span className="font-medium">Status:</span> {currentLead.status || 'N/A'}</p>
                <p><span className="font-medium">Priority:</span> {currentLead.priority || 'N/A'}</p>
                <p><span className="font-medium">Assigned:</span> {currentLead.dmEmployeeByASSIGNTo?.name || 'Unassigned'}</p>
                <p><span className="font-medium">Branch:</span> {currentLead.dmBranch?.name || 'N/A'}</p>
              </div>

              <div className="rounded-lg border border-gray-200 p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Payment</h4>
                <p><span className="font-medium">Total:</span> {Number(currentLead.payTotal || 0).toLocaleString()}</p>
                <p><span className="font-medium">Paid:</span> {Number(currentLead.paidYet || 0).toLocaleString()}</p>
                <p><span className="font-medium">Balance:</span> {Number(currentLead.payBalance || 0).toLocaleString()}</p>
                <p><span className="font-medium">Appointment:</span> {currentLead.appointment ? new Date(currentLead.appointment).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>

            {currentLead.lead_remark && (
              <div className="mt-4 rounded-lg border border-gray-200 p-4 text-sm">
                <h4 className="font-semibold text-gray-900 mb-2">Lead Remark</h4>
                <p className="text-gray-700 whitespace-pre-wrap">{currentLead.lead_remark}</p>
              </div>
            )}

            <div className="mt-4 rounded-lg border border-gray-200 p-4">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="font-semibold text-gray-900">Appointments, Follow-ups & Remarks</h4>
                  <p className="text-xs text-gray-500">Loaded from appointment, follow-up, and lead remarks tables.</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConversationHistoryLeadId(Number(currentLead.id))}
                    className="px-3 py-1.5 text-sm border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50"
                  >
                    Conversation History
                  </button>
                  <button
                    onClick={() => fetchLeadActivity(Number(currentLead.id))}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Refresh
                  </button>
                </div>
              </div>

              {leadActivityLoading ? (
                <div className="py-6 text-center text-sm text-gray-500">Loading lead activity...</div>
              ) : leadActivityError ? (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{leadActivityError}</div>
              ) : (
                <>
                  <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-6">
                    <div className="rounded-lg bg-indigo-50 p-3">
                      <div className="text-xs text-indigo-700">Fixed Appointments</div>
                      <div className="text-lg font-semibold text-indigo-900">{leadActivity?.summary.fixedAppointments || 0}</div>
                    </div>
                    <div className="rounded-lg bg-green-50 p-3">
                      <div className="text-xs text-green-700">Completed</div>
                      <div className="text-lg font-semibold text-green-900">{leadActivity?.summary.completedAppointments || 0}</div>
                    </div>
                    <div className="rounded-lg bg-amber-50 p-3">
                      <div className="text-xs text-amber-700">Follow-ups</div>
                      <div className="text-lg font-semibold text-amber-900">{leadActivity?.summary.followUps || 0}</div>
                    </div>
                    <div className="rounded-lg bg-orange-50 p-3">
                      <div className="text-xs text-orange-700">Pending Follow-ups</div>
                      <div className="text-lg font-semibold text-orange-900">{leadActivity?.summary.pendingFollowUps || 0}</div>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3">
                      <div className="text-xs text-slate-700">Remarks</div>
                      <div className="text-lg font-semibold text-slate-900">{leadActivity?.summary.remarks || 0}</div>
                    </div>
                    <div className="rounded-lg bg-purple-50 p-3">
                      <div className="text-xs text-purple-700">Activity Log</div>
                      <div className="text-lg font-semibold text-purple-900">{leadActivity?.summary.activityLog || 0}</div>
                    </div>
                  </div>

                  <div className="mb-4 rounded-lg border border-gray-200">
                    <div className="border-b border-gray-200 px-3 py-2 text-sm font-semibold text-gray-900">Activity Log</div>
                    <div className="max-h-64 overflow-y-auto">
                      {(leadActivity?.activityLog || []).length === 0 ? (
                        <div className="p-3 text-sm text-gray-500">No activity recorded yet.</div>
                      ) : leadActivity?.activityLog.map((entry) => (
                        <div key={entry.id} className="border-b border-gray-100 p-3 last:border-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">{(entry.action || '').replace(/_/g, ' ')}</span>
                            <span className="text-xs text-gray-500">{formatDateTime(entry.created_at)}</span>
                          </div>
                          <div className="mt-2 text-xs text-gray-700">{entry.remark}</div>
                          {entry.actorName && <div className="mt-1 text-xs text-gray-500">By {entry.actorName}{entry.actor_role ? ` (${entry.actor_role})` : ''}</div>}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <div className="rounded-lg border border-gray-200">
                      <div className="border-b border-gray-200 px-3 py-2 text-sm font-semibold text-gray-900">Appointments</div>
                      <div className="max-h-64 overflow-y-auto">
                        {(leadActivity?.appointments || []).length === 0 ? (
                          <div className="p-3 text-sm text-gray-500">No appointments found.</div>
                        ) : leadActivity?.appointments.map((appointment) => (
                          <div key={appointment.id} className="border-b border-gray-100 p-3 last:border-0">
                            <div className="flex items-center justify-between gap-2">
                              <div className="text-sm font-medium text-gray-900">{formatDate(appointment.date)} at {formatTime(appointment.appointtime)}</div>
                              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">{getAppointmentLabel(appointment)}</span>
                            </div>
                            <div className="mt-1 text-xs text-gray-500">{appointment.counselorName || 'No counselor'}{appointment.branchName ? ` · ${appointment.branchName}` : ''}</div>
                            {appointment.screenshot && <div className="mt-2 text-xs text-gray-700">{appointment.screenshot}</div>}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-lg border border-gray-200">
                      <div className="border-b border-gray-200 px-3 py-2 text-sm font-semibold text-gray-900">Follow-ups</div>
                      <div className="max-h-64 overflow-y-auto">
                        {(leadActivity?.followUps || []).length === 0 ? (
                          <div className="p-3 text-sm text-gray-500">No follow-ups found.</div>
                        ) : leadActivity?.followUps.map((followUp) => (
                          <div key={followUp.id} className="border-b border-gray-100 p-3 last:border-0">
                            <div className="flex items-center justify-between gap-2">
                              <div className="text-sm font-medium text-gray-900">{formatDateTime(followUp.reminder_date)}</div>
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">{followUp.status || 'pending'}</span>
                            </div>
                            <div className="mt-1 text-xs text-gray-500">{followUp.employeeName || 'No employee'} · {followUp.priority || 'medium'}</div>
                            <div className="mt-2 text-xs text-gray-700">{followUp.message || 'No message'}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-lg border border-gray-200">
                      <div className="border-b border-gray-200 px-3 py-2 text-sm font-semibold text-gray-900">Remarks</div>
                      <div className="max-h-64 overflow-y-auto">
                        {(leadActivity?.remarks || []).length === 0 ? (
                          <div className="p-3 text-sm text-gray-500">No remarks found.</div>
                        ) : leadActivity?.remarks.map((remark) => (
                          <div key={remark.id} className="border-b border-gray-100 p-3 last:border-0">
                            <div className="flex items-center justify-between gap-2">
                              <div className="text-sm font-medium text-gray-900">{formatDate(remark.date)} {formatTime(remark.created)}</div>
                              <span className="text-xs text-gray-500">{remark.employeeName || 'Unknown'}</span>
                            </div>
                            <div className="mt-2 whitespace-pre-wrap text-xs text-gray-700">{remark.remark || 'No remark'}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => openLeadActionModal(currentLead, 'appointment')}
                className="px-4 py-2 border border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-50"
              >
                Book Appointment
              </button>
              <button
                onClick={() => openLeadActionModal(currentLead, 'followup')}
                className="px-4 py-2 border border-amber-200 text-amber-700 rounded-lg hover:bg-amber-50"
              >
                Add Follow-up
              </button>
              <button
                onClick={() => openLeadActionModal(currentLead, 'remark')}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Add Remark
              </button>
              <button
                onClick={() => openLeadActionModal(currentLead, 'status')}
                className="px-4 py-2 border border-emerald-200 text-emerald-700 rounded-lg hover:bg-emerald-50"
              >
                Update Status
              </button>
              <button
                onClick={() => router.push(`/admin/leads/${currentLead.id}/edit`)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setCurrentLead(null);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lead Action Modal */}
      {showLeadActionModal && currentLead && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-lg bg-white">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{getLeadActionTitle()}</h3>
                <p className="text-sm text-gray-500">
                  {currentLead.fname} {currentLead.lname} · Lead #{currentLead.id}
                </p>
              </div>
              <button
                onClick={closeLeadActionModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {leadActionType === 'status' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Status</label>
                  <SearchableSelect
                    value={leadActionForm.status}
                    onChange={(e) => setLeadActionForm({ ...leadActionForm, status: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select status</option>
                    <option value="Prospect">Prospect/Interested</option>
                    <option value="Not Interested">Not Interested</option>
                    <option value="DNQ">DNQ</option>
                    <option value="Not_answered">Not Answered</option>
                    <option value="Could Not Connect">Could Not Connect/Wrong Number</option>
                    <option value="Call Back">Call Back</option>
                    <option value="Abroad Lead">Abroad Lead</option>
                    <option value="Junk">Junk</option>
                    <option value="Duplicate">Duplicate</option>
                  </SearchableSelect>
                </div>
              )}

              {leadActionType === 'status' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country (optional)</label>
                    <SearchableSelect
                      value={leadActionForm.countryId}
                      onChange={(e) => setLeadActionForm({ ...leadActionForm, countryId: e.target.value, programId: '' })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Country</option>
                      {filterOptions.countries.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </SearchableSelect>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Program (optional)</label>
                    <SearchableSelect
                      value={leadActionForm.programId}
                      onChange={(e) => setLeadActionForm({ ...leadActionForm, programId: e.target.value })}
                      disabled={statusModalProgramsLoading}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                    >
                      <option value="">{statusModalProgramsLoading ? 'Loading…' : 'Select Service / Program'}</option>
                      {(statusModalPrograms ?? filterOptions.services).map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </SearchableSelect>
                    {leadActionForm.countryId && (
                      <p className="text-xs text-gray-400 mt-1">Showing programs available for the selected country.</p>
                    )}
                  </div>
                </div>
              )}

              {leadActionType !== 'remark' && leadActionType !== 'status' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={leadActionForm.date}
                      onChange={(e) => setLeadActionForm({ ...leadActionForm, date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                    <input
                      type="time"
                      value={leadActionForm.time}
                      onChange={(e) => setLeadActionForm({ ...leadActionForm, time: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              {leadActionType === 'appointment' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Appointment Type</label>
                  <SearchableSelect
                    value={leadActionForm.meetingType}
                    onChange={(e) => setLeadActionForm({ ...leadActionForm, meetingType: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="consultation">Consultation</option>
                    <option value="document_review">Document Review</option>
                    <option value="follow_up">Follow-up</option>
                    <option value="visa_processing">Visa Processing</option>
                  </SearchableSelect>
                </div>
              )}

              {leadActionType === 'appointment' && (
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <input
                      type="checkbox"
                      checked={crossBranchEnabled}
                      onChange={(e) => {
                        setCrossBranchEnabled(e.target.checked);
                        setCrossBranchTargetBranch('');
                        setLeadActionForm((prev) => ({ ...prev, employeeId: '' }));
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    Cross Branch (assign to a counselor/BM in another branch)
                  </label>
                  {crossBranchEnabled && (
                    <div className="mt-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                      <SearchableSelect
                        value={crossBranchTargetBranch}
                        onChange={(e) => {
                          setCrossBranchTargetBranch(e.target.value);
                          setLeadActionForm((prev) => ({ ...prev, employeeId: '' }));
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select branch</option>
                        {filterOptions.branches
                          .filter((b) => String(b.value) !== String(currentLead?.branch || ''))
                          .map((b) => (
                            <option key={b.value} value={b.value}>{b.label}</option>
                          ))}
                      </SearchableSelect>
                    </div>
                  )}
                </div>
              )}

              {leadActionType !== 'remark' && leadActionType !== 'status' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Employee</label>
                    {leadActionType === 'appointment' ? (
                      <SearchableSelect
                        value={leadActionForm.employeeId}
                        onChange={(e) => setLeadActionForm({ ...leadActionForm, employeeId: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        disabled={crossBranchEnabled && !crossBranchTargetBranch}
                      >
                        <option value="">
                          {appointmentEmployeesLoading
                            ? 'Loading…'
                            : crossBranchEnabled && !crossBranchTargetBranch
                              ? 'Select a branch first'
                              : 'Select employee'}
                        </option>
                        {appointmentEmployees.map((emp) => (
                          <option key={emp.id} value={String(emp.id)}>{emp.name}</option>
                        ))}
                      </SearchableSelect>
                    ) : (
                      <input
                        type="number"
                        value={leadActionForm.employeeId}
                        onChange={(e) => setLeadActionForm({ ...leadActionForm, employeeId: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Employee ID"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <SearchableSelect
                      value={leadActionForm.priority}
                      onChange={(e) => setLeadActionForm({ ...leadActionForm, priority: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </SearchableSelect>
                  </div>
                </div>
              )}

              {leadActionType !== 'remark' && leadActionType !== 'status' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {leadActionType === 'appointment' ? 'Appointment Title' : 'Follow-up Subject'}
                  </label>
                  <input
                    type="text"
                    value={leadActionForm.title}
                    onChange={(e) => setLeadActionForm({ ...leadActionForm, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder={leadActionType === 'appointment' ? 'Appointment title' : 'Follow-up subject'}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {leadActionType === 'remark' || leadActionType === 'status' ? 'Remark' : 'Notes'}
                </label>
                <textarea
                  value={leadActionForm.notes}
                  onChange={(e) => setLeadActionForm({ ...leadActionForm, notes: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder={leadActionType === 'status' ? 'Explain why the status is changing...' : leadActionType === 'remark' ? 'Enter lead remark...' : 'Enter notes...'}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={closeLeadActionModal}
                disabled={leadActionSaving}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleLeadActionSubmit}
                disabled={leadActionSaving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {leadActionSaving ? 'Saving...' : getLeadActionTitle()}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Lead Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-lg bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Create New Lead</h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({});
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="First Name"
                value={formData.fname || ''}
                onChange={(e) => setFormData({...formData, fname: e.target.value})}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Last Name"
                value={formData.lname || ''}
                onChange={(e) => setFormData({...formData, lname: e.target.value})}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="email"
                placeholder="Email"
                value={formData.email || ''}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="tel"
                placeholder="Phone"
                value={formData.phone || ''}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <SearchableSelect
                value={formData.country_interest || ''}
                onChange={(e) => setFormData({...formData, country_interest: e.target.value})}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Country</option>
                {filterOptions.countries.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </SearchableSelect>
              <SearchableSelect
                value={formData.service_interest || ''}
                onChange={(e) => setFormData({...formData, service_interest: e.target.value})}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Service / Program</option>
                {filterOptions.services.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </SearchableSelect>
              <SearchableSelect
                value={formData.priority || ''}
                onChange={(e) => setFormData({...formData, priority: e.target.value})}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Priority</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </SearchableSelect>
              <SearchableSelect
                value={formData.lead_quality || ''}
                onChange={(e) => setFormData({...formData, lead_quality: e.target.value})}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Quality</option>
                <option value="Hot">Hot</option>
                <option value="Warm">Warm</option>
                <option value="Cold">Cold</option>
              </SearchableSelect>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({});
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateLead}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Lead
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Lead Modal */}
      {showEditModal && currentLead && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-lg bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Edit Lead</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setCurrentLead(null);
                  setFormData({});
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="First Name"
                value={formData.fname || ''}
                onChange={(e) => setFormData({...formData, fname: e.target.value})}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Last Name"
                value={formData.lname || ''}
                onChange={(e) => setFormData({...formData, lname: e.target.value})}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="email"
                placeholder="Email"
                value={formData.email || ''}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="tel"
                placeholder="Phone"
                value={formData.phone || ''}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <SearchableSelect
                value={formData.country_interest || ''}
                onChange={(e) => setFormData({...formData, country_interest: e.target.value})}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Country</option>
                {filterOptions.countries.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </SearchableSelect>
              <SearchableSelect
                value={formData.service_interest || ''}
                onChange={(e) => setFormData({...formData, service_interest: e.target.value})}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Service / Program</option>
                {filterOptions.services.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </SearchableSelect>
              <SearchableSelect
                value={formData.status || ''}
                onChange={(e) => {
                  const nextStatus = e.target.value;
                  const wasProspect = formData.status === 'Prospect';
                  const isProspect = nextStatus === 'Prospect';
                  setFormData({
                    ...formData,
                    status: nextStatus,
                    // Prospect leads use a P1-P4 priority scale instead of
                    // High/Medium/Low, so the previously selected priority
                    // may no longer be a valid option once status changes.
                    priority: isProspect && !wasProspect ? 'P1' : !isProspect && wasProspect ? 'Medium' : formData.priority
                  });
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Status</option>
                <option value="Prospect">Prospect/Interested</option>
                <option value="Not Interested">Not Interested</option>
                <option value="DNQ">DNQ</option>
                <option value="Not_answered">Not Answered</option>
                <option value="Could Not Connect">Could Not Connect/Wrong Number</option>
                <option value="Call Back">Call Back</option>
                <option value="Abroad Lead">Abroad Lead</option>
                <option value="Junk">Junk</option>
                <option value="Duplicate">Duplicate</option>
              </SearchableSelect>
              <SearchableSelect
                value={formData.priority || ''}
                onChange={(e) => setFormData({...formData, priority: e.target.value})}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Priority</option>
                {formData.status === 'Prospect' ? (
                  <>
                    <option value="P1">P1</option>
                    <option value="P2">P2</option>
                    <option value="P3">P3</option>
                    <option value="P4">P4</option>
                  </>
                ) : (
                  <>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </>
                )}
              </SearchableSelect>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setCurrentLead(null);
                  setFormData({});
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateLead}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Update Lead
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Quick Pay / Balance Receipt Modal (Client List) ── */}
      {quickPayLead && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Collect Balance Payment</h3>
                <p className="text-sm text-gray-500">{quickPayLead.lead.fname} {quickPayLead.lead.lname}</p>
              </div>
              <button onClick={() => setQuickPayLead(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex gap-3">
                <div className="flex-1 bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-500">Total Fee</div>
                  <div className="font-bold text-gray-800">AED {Number(quickPayLead.lead.payTotal || 0).toLocaleString()}</div>
                </div>
                <div className="flex-1 bg-green-50 rounded-lg p-3 text-center">
                  <div className="text-xs text-green-600">Paid So Far</div>
                  <div className="font-bold text-green-700">AED {Number(quickPayLead.lead.paidYet || 0).toLocaleString()}</div>
                </div>
                <div className="flex-1 bg-red-50 rounded-lg p-3 text-center">
                  <div className="text-xs text-red-600">Balance Due</div>
                  <div className="font-bold text-red-700">AED {Number(quickPayLead.lead.payBalance || 0).toLocaleString()}</div>
                </div>
              </div>
              {!quickPayLead.success ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount Received (AED)</label>
                    <input type="number" min="0" value={quickPayLead.amount}
                      onChange={e => setQuickPayLead(p => p ? { ...p, amount: e.target.value } : null)}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter amount" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                    <SearchableSelect value={quickPayLead.method}
                      onChange={e => setQuickPayLead(p => p ? { ...p, method: e.target.value } : null)}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                      <option value="cash">Cash</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="credit_card">Credit Card</option>
                      <option value="debit_card">Debit Card</option>
                      <option value="cheque">Cheque</option>
                      <option value="online">Online</option>
                      <optgroup label="Bank">
                        {BANK_PAYMENT_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Card / POS">
                        {CARD_PAYMENT_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </optgroup>
                    </SearchableSelect>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                    <input type="date" value={quickPayLead.date}
                      onChange={e => setQuickPayLead(p => p ? { ...p, date: e.target.value } : null)}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID (optional)</label>
                    <input type="text" value={quickPayLead.txnId}
                      onChange={e => setQuickPayLead(p => p ? { ...p, txnId: e.target.value } : null)}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      placeholder="Reference / transaction number" />
                  </div>
                  {quickPayLead.msg && (
                    <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3">
                      <AlertCircle className="w-4 h-4 shrink-0" /> {quickPayLead.msg}
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
                  <p className="font-semibold text-green-800">{quickPayLead.msg}</p>
                  <p className="text-sm text-green-600 mt-1">Payment recorded and lead updated.</p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 p-5 border-t">
              <button onClick={() => setQuickPayLead(null)}
                className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                {quickPayLead.success ? 'Close' : 'Cancel'}
              </button>
              {quickPayLead.success && quickPayLead.receipt && quickPayLead.receipt.accountantStatus === 'verified' ? (
                <button
                  onClick={() => printLeadReceipt(quickPayLead.receipt, quickPayLead.lead, quickPayLead)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
                  <Printer className="w-4 h-4" /> Print Receipt
                </button>
              ) : quickPayLead.success && quickPayLead.receipt ? (
                <span className="text-xs font-medium text-amber-700 bg-amber-100 border border-amber-200 rounded-full px-3 py-2">
                  Awaiting accounts verification
                </span>
              ) : (
                <button onClick={submitQuickPayForLead} disabled={quickPayLead.saving}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
                  {quickPayLead.saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
                  {quickPayLead.saving ? 'Processing…' : 'Save & Create Receipt'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Assign Lead Modal ── */}
      {showAssignModal && assignLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Assign Lead</h2>
                <p className="text-sm text-gray-500">
                  {assignLead.fname} {assignLead.lname}
                  {assignLead.dmBranch?.name ? ` — ${assignLead.dmBranch.name}` : ''}
                </p>
              </div>
              <button onClick={() => setShowAssignModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lead details */}
            <div className="border-b px-6 py-3 bg-gray-50 grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-gray-500">Email:</span> {assignLead.email || '—'}</div>
              <div><span className="text-gray-500">Phone:</span> {assignLead.phone || assignLead.mobile || '—'}</div>
              <div><span className="text-gray-500">Country:</span> {assignLead.country_interest_label || assignLead.country_interest || '—'}</div>
              <div><span className="text-gray-500">Service:</span> {assignLead.service_interest_label || assignLead.service_interest || '—'}</div>
              <div><span className="text-gray-500">Status:</span> {assignLead.status || '—'}</div>
              <div><span className="text-gray-500">Priority:</span> {assignLead.priority || '—'}</div>
            </div>

            {/* Search */}
            <div className="px-6 py-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search counselors..."
                  value={assignSearch}
                  onChange={e => setAssignSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Counselor list */}
            <div className="flex-1 overflow-y-auto px-6 py-2">
              {assignLoading ? (
                <div className="text-center py-8 text-gray-500">Loading employees...</div>
              ) : assignCounselors.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No employees found</div>
              ) : (
                assignCounselors
                  .filter(e => !assignSearch || e.name.toLowerCase().includes(assignSearch.toLowerCase()))
                  .map(emp => (
                    <button
                      key={emp.id}
                      onClick={() => handleAssignLead(emp.id)}
                      disabled={assignSaving || Number(assignLead.assignTo) === emp.id}
                      className="w-full text-left px-4 py-3 rounded-lg hover:bg-blue-50 border border-transparent hover:border-blue-200 mb-1 flex items-center justify-between disabled:opacity-50"
                    >
                      <div>
                        <div className="font-medium text-gray-900 text-sm">{emp.name}</div>
                        <div className="text-xs text-gray-500">ID: {emp.id}</div>
                      </div>
                      {Number(assignLead.assignTo) === emp.id ? (
                        <span className="text-xs text-green-600 font-medium">Current</span>
                      ) : (
                        <span className="text-xs text-blue-600 font-medium">Assign</span>
                      )}
                    </button>
                  ))
              )}
            </div>

            {/* Footer */}
            <div className="border-t px-6 py-3 flex justify-end">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {conversationHistoryLeadId && (
        <ConversationHistoryModal
          leadId={conversationHistoryLeadId}
          clientName={currentLead ? `${currentLead.fname} ${currentLead.lname}` : undefined}
          onClose={() => setConversationHistoryLeadId(null)}
        />
      )}

      {showBulkTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Transfer Leads</h2>
                <p className="text-sm text-gray-500">
                  {selectedLeads.length} lead{selectedLeads.length === 1 ? '' : 's'} selected
                </p>
              </div>
              <button onClick={() => setShowBulkTransferModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="px-6 py-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search counselors..."
                  value={bulkTransferSearch}
                  onChange={e => setBulkTransferSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Counselor list */}
            <div className="flex-1 overflow-y-auto px-6 py-2">
              {counselorFilterOptions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No employees found</div>
              ) : (
                counselorFilterOptions
                  .filter(e => !bulkTransferSearch || e.name.toLowerCase().includes(bulkTransferSearch.toLowerCase()))
                  .map(emp => (
                    <button
                      key={emp.id}
                      onClick={() => handleBulkTransfer(emp.id)}
                      disabled={bulkActionSaving}
                      className="w-full text-left px-4 py-3 rounded-lg hover:bg-blue-50 border border-transparent hover:border-blue-200 mb-1 flex items-center justify-between disabled:opacity-50"
                    >
                      <div>
                        <div className="font-medium text-gray-900 text-sm">{emp.name}</div>
                        <div className="text-xs text-gray-500">ID: {emp.id}</div>
                      </div>
                      <span className="text-xs text-blue-600 font-medium">
                        {bulkActionSaving ? 'Transferring...' : 'Transfer'}
                      </span>
                    </button>
                  ))
              )}
            </div>

            {/* Footer */}
            <div className="border-t px-6 py-3 flex justify-end">
              <button
                onClick={() => setShowBulkTransferModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
