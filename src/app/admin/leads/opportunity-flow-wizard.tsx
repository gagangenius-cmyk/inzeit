'use client';

import { SearchableSelect } from '@/components/ui/searchable-select';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lead } from '@/types/lead';
import { useAuth } from '@/contexts/AuthContext';
import { isCeo, isBranchManagerOrCeo } from '@/lib/roleChecks';
import { BANK_PAYMENT_OPTIONS, CARD_PAYMENT_OPTIONS } from '@/lib/paymentOptions';
import { renderAgreementForBranch } from '@/lib/renderAgreementForBranch';
import { uploadFileToBlob } from '@/lib/uploadToBlob';
import { getBranchTaxInfo } from '@/lib/branchTax';
import { getLeadBranchDetails, printReceipt, getAdminFeeAmount, getAdminFeeVatRate } from '@/lib/receiptTemplate';
import { getDiscountTier, getDiscountPercentage, DEFAULT_DISCOUNT_TIER_THRESHOLDS, type DiscountTierThresholds } from '@/lib/discountApproval';
import {
  Search, Plus, Edit, Trash2, Download, Upload, CheckCircle, XCircle, Clock,
  AlertCircle, FileText, Send, Eye, User, Calendar, DollarSign, FileSignature,
  Shield, X, ChevronRight, ChevronLeft, Save, Mail, Phone, Globe,
  Target, TrendingUp, Users, Briefcase, Flag, MessageSquare, FileCheck,
  Receipt, FolderOpen, PenTool, Lock, RefreshCw, KeyRound
} from 'lucide-react';

interface OpportunityFlowWizardProps {
  leadId: number;
  onFlowComplete?: () => void;
  /** Deep-link straight to a stage id (e.g. 'payment') instead of always starting at 'prospect'. */
  initialStage?: string;
  initialOpportunityId?: number;
}

interface FlowStage {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  status: 'pending' | 'current' | 'completed' | 'rejected';
}

interface ProspectData {
  opportunityName: string;
  opportunityType: string;
  estimatedValue: string;
  priority: string;
  description: string;
  serviceRequired: string;
  serviceId: string;
}

interface QuotationData {
  quotationNumber: string;
  validUntil: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: string;
    total: string;
  }>;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  terms: string;
}

interface PaymentData {
  paymentStructure: 'full' | 'installment' | 'milestone';
  totalAmount: number;
  paidAmount: number;
  remainingBalance: number;
  paymentMethod: string;
  transactionId: string;
  paymentDate: string;
  proofOfPayment: File | null;
  proofOfPaymentUrl: string | null;
  dueDate: string;
  remark: string;
  adminFeeIncluded: boolean;
}

interface DocumentData {
  idProof: File | null;
  passportCopy: File | null;
  passportNumber: string;
  clientActualName: string;
  additionalInfo: string;
  allMandatoryDocsUploaded: boolean;
  // Populated from /api/opportunity-documents when a doc was uploaded in an
  // earlier session (idProof/passportCopy only ever hold in-memory File
  // objects, gone after any remount) - keyed by document category, so the
  // Documents stage can link back to what's already on file instead of
  // showing a blank re-upload box with no sign anything was ever uploaded.
  uploadedDocUrls: Record<string, string>;
}

interface AgreementData {
  agreementId?: number | null;
  agreementNumber?: string | null;
  agreementType: string;
  agreementTitle: string;
  duration: string;
  startDate: string;
  endDate: string;
  amount: string;
  terms: string;
  specialConditions: string;
  status: 'draft' | 'generated' | 'sent';
  companyName?: string;
  companyAddress?: string;
  counselorConversationSummary: string;
}

interface SignedAgreementData {
  clientSignature: string;
  signatureDate: string;
  documentUrl: string;
  uploadedTocrm: boolean;
}

interface RetentionData {
  retentionStatus: 'pending' | 'approved' | 'rejected';
  complianceManager: string;
  reviewNotes: string;
  reviewDate: string;
  discountApprovalId: number | null;
  discountStatus: 'not_required' | 'pending' | 'approved' | 'rejected';
  complianceApprovalId: number | null;
  agreementComplianceStatus: 'not_submitted' | 'pending' | 'approved' | 'rejected';
  reassignmentId: number | null;
  notes: string;
}

const stepVariants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -50 }
};

const FLOW_STAGE_IDS = ['prospect', 'quotation', 'payment', 'accounts', 'documents', 'agreement', 'signed-agreement', 'retained', 'retention-rejected', 'closed'];
const COUNSELOR_SUMMARY_MIN_CHARS = 100;

// Agreement expiry is the service's own validity period (crm_service.validity,
// e.g. "18 Months" for Canada/Australia vs "6 Months" for a visit visa)
// counted from the start date, instead of a flat one-year default that
// under-counts the longer immigration programs.
const computeAgreementEndDate = (startDate: string, programValidity?: string | null): string => {
  const validityMonths = parseInt(String(programValidity || ''), 10) || 12;
  const endDateObj = startDate ? new Date(`${startDate}T00:00:00`) : new Date();
  endDateObj.setMonth(endDateObj.getMonth() + validityMonths);
  return endDateObj.toISOString().split('T')[0];
};

export default function OpportunityFlowWizard({ leadId, initialStage, initialOpportunityId }: OpportunityFlowWizardProps) {
  const resolvedInitialStage = initialStage && FLOW_STAGE_IDS.includes(initialStage) ? initialStage : 'prospect';
  const { user, currencyCode } = useAuth();
  const [activeStage, setActiveStage] = useState<string>(resolvedInitialStage);
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [completedOpportunityId, setCompletedOpportunityId] = useState<number | null>(initialOpportunityId || null);
  // Opportunity flow is always editable, even once a deal is marked
  // won/retained — locking it to view-only for non-CEO/BM roles blocked
  // counselors from a deal they'd just closed, before Finance/Compliance
  // had even reviewed it.
  const isReadOnly = false;
  const getComplianceApprovalsUrl = (opportunityId?: number | null) => {
    const params = new URLSearchParams({ leadId: String(leadId) });
    if (opportunityId) params.set('opportunityId', String(opportunityId));
    return `/api/opportunity-compliance-approvals?${params.toString()}`;
  };

  // State for each stage
  const [prospectData, setProspectData] = useState<ProspectData>({
    opportunityName: '',
    opportunityType: 'new_business',
    estimatedValue: '',
    priority: 'medium',
    description: '',
    serviceRequired: '',
    serviceId: ''
  });

  // ── Fee lookup state ──
  interface FeeRecord {
    id: number;
    service: number | null;
    country: number | null;
    branch: number | null;
    currency: number | null;
    currencyCode: string;
    serviceName: string;
    countryName: string;
    branchName: string;
    upfront: number;
    prof_fee: number;
    firstMonth: number;
    secondMonth: number;
    thirdMonth: number;
    prof_fee_month: number;
    firstStage: number;
    secondStage: number;
    thirdStage: number;
    forthStage: number;
    fifthStage: number;
    prof_fee_stage: number;
  }
  const [feeData, setFeeData] = useState<FeeRecord | null>(null);
  const [feeLoading, setFeeLoading] = useState(false);

  const [quotationData, setQuotationData] = useState<QuotationData>({
    quotationNumber: '',
    validUntil: '',
    items: [{
      description: '',
      quantity: 1,
      unitPrice: '',
      total: ''
    }],
    subtotal: 0,
    discount: 0,
    tax: 0,
    total: 0,
    terms: ''
  });

  const [paymentData, setPaymentData] = useState<PaymentData>({
    paymentStructure: 'full',
    totalAmount: 0,
    paidAmount: 0,
    remainingBalance: 0,
    paymentMethod: 'cash',
    transactionId: '',
    paymentDate: new Date().toISOString().split('T')[0],
    proofOfPayment: null,
    proofOfPaymentUrl: null,
    dueDate: '',
    remark: '',
    adminFeeIncluded: false,
  });

  const [documentData, setDocumentData] = useState<DocumentData>({
    idProof: null,
    passportCopy: null,
    passportNumber: '',
    clientActualName: '',
    additionalInfo: '',
    allMandatoryDocsUploaded: false,
    uploadedDocUrls: {}
  });

  const [agreementData, setAgreementData] = useState<AgreementData>({
    agreementId: null,
    agreementType: 'service_agreement',
    agreementTitle: '',
    duration: '',
    startDate: '',
    endDate: '',
    amount: '',
    terms: '',
    specialConditions: '',
    status: 'draft',
    companyName: '',
    companyAddress: '',
    counselorConversationSummary: ''
  });

  const [signedAgreementData, setSignedAgreementData] = useState<SignedAgreementData>({
    clientSignature: '',
    signatureDate: '',
    documentUrl: '',
    uploadedTocrm: false
  });

  const [retentionData, setRetentionData] = useState<RetentionData>({
    retentionStatus: 'pending',
    complianceManager: '',
    reviewNotes: '',
    reviewDate: '',
    discountApprovalId: null,
    discountStatus: 'not_required',
    complianceApprovalId: null,
    agreementComplianceStatus: 'not_submitted',
    reassignmentId: null,
    notes: ''
  });
  const [requestingDiscount, setRequestingDiscount] = useState(false);
  const [closingWon, setClosingWon] = useState(false);
  // crm_opportunity_workflow_reviews (Accounts/finance + CRM Compliance sign-off) -
  // a separate gate from retentionData.agreementComplianceStatus above. A
  // rejection here must block forward progress even if this wizard was
  // deep-linked straight to a later stage (e.g. the Clients tab's "Edit
  // opportunity flow" button), since a stale opportunity_status of 'won' set
  // at conversion time doesn't get corrected when Accounts/Compliance later
  // reject the same opportunity - see CLIENT_STATUS_SQL in api/leads/route.ts.
  const [financeReviewStatus, setFinanceReviewStatus] = useState<{ financeStatus: string | null; complianceStatus: string | null } | null>(null);
  const isFinanceOrComplianceRejected = financeReviewStatus?.financeStatus === 'rejected' || financeReviewStatus?.complianceStatus === 'rejected';

  const [stages, setStages] = useState<FlowStage[]>(() => {
    const baseStages: FlowStage[] = [
      { id: 'prospect', name: 'Prospect', description: 'Initial opportunity identification', icon: Target, status: 'pending' },
      { id: 'quotation', name: 'Quotation', description: 'Generate and send quotation', icon: FileText, status: 'pending' },
      { id: 'payment', name: 'Payment', description: 'Process payment', icon: DollarSign, status: 'pending' },
      { id: 'accounts', name: 'Accounts', description: 'Payment verification', icon: Receipt, status: 'pending' },
      { id: 'documents', name: 'Documents', description: 'Upload required documents', icon: FolderOpen, status: 'pending' },
      { id: 'agreement', name: 'Agreement', description: 'Generate agreement', icon: PenTool, status: 'pending' },
      { id: 'signed-agreement', name: 'Signed Agreement', description: 'Upload signed agreement', icon: FileSignature, status: 'pending' },
      { id: 'retained', name: 'Retained', description: 'Compliance review', icon: Shield, status: 'pending' },
      { id: 'retention-rejected', name: 'Retention Review', description: 'Retention status', icon: Lock, status: 'pending' },
      { id: 'closed', name: 'Closed', description: 'Opportunity closed', icon: CheckCircle, status: 'pending' }
    ];
    // Deep-linking (e.g. from Balance Payments' "Make Payment" button) can land
    // on a stage past 'prospect' — mark everything before it as completed so
    // the stage nav doesn't look like earlier steps were skipped/broken.
    const targetIndex = baseStages.findIndex((s) => s.id === resolvedInitialStage);
    return baseStages.map((s, idx) => ({
      ...s,
      status: idx < targetIndex ? 'completed' : idx === targetIndex ? 'current' : 'pending',
    }));
  });

  // Jumps the stage nav straight to `stageId`, marking everything before it
  // completed — used both for the initialStage deep-link case above and to
  // resume at the lead's persisted opportunity_stage on load (see fetchLeadData).
  const applyStageProgress = (stageId: string) => {
    const targetIndex = FLOW_STAGE_IDS.indexOf(stageId);
    if (targetIndex < 0) return;
    setStages(prev => prev.map((s, idx) => ({
      ...s,
      status: idx < targetIndex ? 'completed' : idx === targetIndex ? 'current' : 'pending',
    })));
    setActiveStage(stageId);
  };

  const applyComplianceStatusToStages = (status: RetentionData['agreementComplianceStatus']) => {
    if (status === 'approved') {
      setStages(prev => prev.map(stage => {
        if (stage.id === 'retained') return { ...stage, status: 'current' as const };
        if (stage.id === 'retention-rejected') return { ...stage, status: 'pending' as const };
        return stage;
      }));
      return;
    }

    if (status === 'rejected') {
      setStages(prev => prev.map(stage => {
        if (stage.id === 'retained') return { ...stage, status: 'rejected' as const };
        if (stage.id === 'retention-rejected') return { ...stage, status: 'current' as const };
        return stage;
      }));
      setActiveStage('retention-rejected');
    }
  };

  useEffect(() => {
    const fetchLeadData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/leads/${leadId}`);
        if (!response.ok) throw new Error('Failed to fetch lead');
        const leadData = await response.json();
        setLead(leadData);
        hydrateFlowFromLead(leadData);
        // Resume on whichever stage this lead was last left on, rather than
        // always reopening at Prospect, so counselor/Branch Manager/CEO all
        // see the same current stage. An explicit initialStage prop (deep
        // link) takes priority over the persisted one.
        let targetStageId = resolvedInitialStage;
        if (!initialStage && leadData.opportunity_stage && FLOW_STAGE_IDS.includes(leadData.opportunity_stage)) {
          targetStageId = leadData.opportunity_stage;
          applyStageProgress(leadData.opportunity_stage);
        }
        if (leadData.opportunity_id && !initialOpportunityId) {
          setCompletedOpportunityId(Number(leadData.opportunity_id));
        }

        let latestOpportunity: any = null;
        const opportunitiesResponse = await fetch(`/api/opportunities?leadId=${leadId}`);
        if (opportunitiesResponse.ok) {
          const opportunities = await opportunitiesResponse.json();
          latestOpportunity = Array.isArray(opportunities) ? opportunities[0] : null;
          if (latestOpportunity?.id && !initialOpportunityId) {
            setCompletedOpportunityId(Number(latestOpportunity.id));
            // The opportunity's own saved product/amount/details are authoritative
            // once it exists — hydrateFlowFromLead (above) only fills blanks from
            // the lead's *current* fields, which can drift from what was actually
            // saved on the opportunity (e.g. the lead's service_interest or payTotal
            // changed after conversion). Force these fields to match the saved
            // opportunity record so reopening the draft doesn't show stale/wrong
            // product details.
            setProspectData(prev => ({
              ...prev,
              opportunityName: latestOpportunity.opportunityName || prev.opportunityName,
              estimatedValue: latestOpportunity.estimatedValue !== undefined && latestOpportunity.estimatedValue !== null
                ? String(latestOpportunity.estimatedValue)
                : prev.estimatedValue,
              priority: normalizePriorityForWizard(latestOpportunity.priority || prev.priority),
              description: latestOpportunity.description || prev.description,
              serviceRequired: latestOpportunity.serviceRequired || latestOpportunity.serviceType || prev.serviceRequired,
            }));
          }
        }

        const discountResponse = await fetch(`/api/discount-approvals?leadId=${leadId}`);
        if (discountResponse.ok) {
          const discountData = await discountResponse.json();
          const latestDiscount = discountData.data?.[0];
          if (latestDiscount) {
            setRetentionData(prev => ({
              ...prev,
              discountApprovalId: latestDiscount.id,
              discountStatus: latestDiscount.status || 'pending',
            }));
            // Restore the approved/pending discount amount into the quotation so
            // reopening this stage doesn't silently reset it to 0 while the
            // status pill still reads "approved" (the amount otherwise only
            // ever lived in local quotationData state, lost on remount).
            const approvedAmount = Number(latestDiscount.discountAmount);
            if ((latestDiscount.status === 'approved' || latestDiscount.status === 'pending') && Number.isFinite(approvedAmount) && approvedAmount > 0) {
              setQuotationData(prev => {
                const discount = Math.min(approvedAmount, prev.subtotal);
                const inferredTaxRate = prev.subtotal > 0 ? Number(prev.tax || 0) / prev.subtotal : 0;
                const taxableAmount = Math.max(0, prev.subtotal - discount);
                const tax = taxableAmount * inferredTaxRate;
                const total = taxableAmount + tax;
                return { ...prev, discount, tax, total };
              });
            }
          }
        }

        const complianceOpportunityId = initialOpportunityId || completedOpportunityId || Number((leadData as any)?.opportunity_id) || Number(latestOpportunity?.id);
        const complianceResponse = await fetch(getComplianceApprovalsUrl(complianceOpportunityId));
        if (complianceResponse.ok) {
          const complianceData = await complianceResponse.json();
          const latestCompliance = complianceData.data?.[0];
          if (latestCompliance) {
            const status = latestCompliance.status || 'pending';
            setRetentionData(prev => ({
              ...prev,
              complianceApprovalId: latestCompliance.id,
              agreementComplianceStatus: status,
              retentionStatus: status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'pending',
              complianceManager: latestCompliance.reviewedBy || prev.complianceManager,
              reviewNotes: latestCompliance.reviewNotes || prev.reviewNotes,
              reviewDate: latestCompliance.reviewedAt ? latestCompliance.reviewedAt.split('T')[0] : prev.reviewDate,
            }));
            applyComplianceStatusToStages(status);
          }
        }

        if (complianceOpportunityId) {
          const workflowResponse = await fetch(`/api/crm-workflow/${complianceOpportunityId}`);
          if (workflowResponse.ok) {
            const workflowJson = await workflowResponse.json();
            const financeStatus = workflowJson.data?.finance_status || null;
            const complianceStatus = workflowJson.data?.compliance_status || null;
            setFinanceReviewStatus({ financeStatus, complianceStatus });
            // A deep link (e.g. the Clients tab's "Edit opportunity flow" button,
            // or a bookmarked/typed ?stage=closed URL) or the lead's own stale
            // persisted opportunity_stage can point past Accounts even though
            // Accounts/Compliance actually rejected this opportunity - opportunity_status
            // only ever reflects full payment at conversion time, not this review.
            // Pull the wizard back to the Accounts stage (where the real
            // verified/rejected status is already shown) instead of silently
            // rendering the Closed/Won screen.
            if ((financeStatus === 'rejected' || complianceStatus === 'rejected')) {
              const accountsIdx = FLOW_STAGE_IDS.indexOf('accounts');
              const currentTargetIdx = FLOW_STAGE_IDS.indexOf(targetStageId);
              if (currentTargetIdx > accountsIdx) {
                applyStageProgress('accounts');
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching lead:', error);
      } finally {
        setLoading(false);
      }
    };

    if (leadId) fetchLeadData();
  }, [leadId]);

  // ── Payment type for package selection ──
  const [paymentType, setPaymentType] = useState<'upfront' | 'monthly' | 'stage'>('stage');

  // ── Helper: compute package totals from a fee record ──
  const getFeePackageTotals = (fee: FeeRecord) => {
    const upfrontTotal  = Number(fee.upfront);
    const monthlyTotal  = Number(fee.firstMonth) + Number(fee.secondMonth) + Number(fee.thirdMonth);
    const stageTotal    = Number(fee.firstStage) + Number(fee.secondStage) + Number(fee.thirdStage) + Number(fee.forthStage) + Number(fee.fifthStage);
    return { upfrontTotal, monthlyTotal, stageTotal };
  };

  // ── Auto-fetch fee: service + country from lead (branch as enhancement; falls back without it) ──
  useEffect(() => {
    // Prefer explicit serviceId from Prospect stage; fall back to lead's service_interest
    const leadAny = lead as any;
    const serviceId = prospectData.serviceId || String(leadAny?.service_interest || '');
    const countryId = Number(leadAny?.country_interest || 0);
    const branchId  = Number(leadAny?.branch || leadAny?.dmBranch?.id || 0);

    if (!serviceId) {
      setFeeData(null);
      return;
    }

    let cancelled = false;
    const fetchFee = async () => {
      setFeeLoading(true);
      try {
        // First try: service + country + branch (most specific)
        if (branchId && countryId) {
          const params = new URLSearchParams({ service: String(serviceId), country: String(countryId), branch: String(branchId) });
          const res  = await fetch(`/api/admin/fees/lookup?${params}`);
          const json = await res.json();
          if (!cancelled && json.data) { setFeeData(json.data); return; }
        }
        // Next: service + branch (catches branch-priced services with no country match, e.g. common-price services)
        if (branchId) {
          const params = new URLSearchParams({ service: String(serviceId), branch: String(branchId) });
          const res  = await fetch(`/api/admin/fees/lookup?${params}`);
          const json = await res.json();
          if (!cancelled && json.data) { setFeeData(json.data); return; }
        }
        // Fallback: service + country only (as set when creating the lead)
        if (countryId) {
          const params = new URLSearchParams({ service: String(serviceId), country: String(countryId) });
          const res  = await fetch(`/api/admin/fees/lookup?${params}`);
          const json = await res.json();
          if (!cancelled && json.data) { setFeeData(json.data); return; }
        }
        // Last resort: service only
        const params = new URLSearchParams({ service: String(serviceId) });
        const res  = await fetch(`/api/admin/fees/lookup?${params}`);
        const json = await res.json();
        if (!cancelled) setFeeData(json.data || null);
      } catch (err) {
        console.error('Fee lookup error:', err);
        if (!cancelled) setFeeData(null);
      } finally {
        if (!cancelled) setFeeLoading(false);
      }
    };

    fetchFee();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prospectData.serviceId, (lead as any)?.service_interest, (lead as any)?.country_interest, (lead as any)?.branch]);

  // ── Pick up an agreement already generated elsewhere in this flow ──
  // The Payment stage's first save silently creates the opportunity (and a
  // "generated" agreement with a real number) via /api/lead-to-opportunity,
  // but this wizard's local agreementData state has no idea that happened —
  // without this, the Agreement stage would show blank defaults even though
  // a real agreement already exists, and the user couldn't see/download it
  // until they clicked Save again. Fetch it as soon as the opportunity id is
  // known, but don't clobber an agreement already loaded/edited locally.
  useEffect(() => {
    if (!completedOpportunityId || agreementData.agreementId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/opportunity-agreements?opportunityId=${completedOpportunityId}`);
        if (!res.ok) return;
        const agreements = await res.json();
        const existing = Array.isArray(agreements) ? agreements[0] : agreements?.data?.[0];
        if (!existing || cancelled) return;
        setAgreementData((prev) => ({
          ...prev,
          agreementId: existing.id ?? prev.agreementId,
          agreementNumber: existing.agreementNumber ?? prev.agreementNumber,
          agreementType: existing.agreementType ?? prev.agreementType,
          agreementTitle: existing.title ?? existing.agreementTitle ?? prev.agreementTitle,
          terms: existing.termsAndConditions ?? existing.terms ?? prev.terms,
          startDate: existing.startDate ? String(existing.startDate).split('T')[0] : prev.startDate,
          endDate: existing.endDate ? String(existing.endDate).split('T')[0] : prev.endDate,
          amount: existing.totalAmount ? String(existing.totalAmount) : prev.amount,
          companyName: existing.companyName ?? prev.companyName,
          companyAddress: existing.companyAddress ?? prev.companyAddress,
          status: existing.status ?? prev.status,
        }));
      } catch (err) {
        console.error('Error fetching existing agreement:', err);
      }
    })();
    return () => { cancelled = true; };
  }, [completedOpportunityId, agreementData.agreementId]);

  // ── Pick up mandatory documents already uploaded in an earlier session ──
  // idProof/passportCopy only ever live as in-memory File objects, which are
  // gone after any remount (navigating away and back, or a page reload) -
  // without this, allMandatoryDocsUploaded silently resets to false and the
  // Documents stage blocks "Save & Continue", pushing the user to re-upload
  // documents that are already saved server-side. Also keeps the actual file
  // URL (uploadedDocUrls) so the Documents stage can link back to what's
  // already on file instead of showing a blank re-upload box with no sign
  // anything was ever uploaded.
  useEffect(() => {
    if (!completedOpportunityId || documentData.allMandatoryDocsUploaded) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/opportunity-documents?opportunityId=${completedOpportunityId}&status=uploaded`);
        if (!res.ok) return;
        const documents = await res.json();
        const list: any[] = Array.isArray(documents) ? documents : documents?.data || [];
        const categories = new Set(list.map((doc) => doc.category || doc.documentType));
        const hasAllMandatory = ['id_proof', 'passport', 'counsellor_sheet'].every((category) => categories.has(category));
        const uploadedDocUrls: Record<string, string> = {};
        list.forEach((doc) => {
          const category = doc.category || doc.documentType;
          if (category && doc.filePath) uploadedDocUrls[category] = doc.filePath;
        });
        if (!cancelled && Object.keys(uploadedDocUrls).length > 0) {
          setDocumentData((prev) => ({ ...prev, uploadedDocUrls: { ...prev.uploadedDocUrls, ...uploadedDocUrls } }));
        }
        if (hasAllMandatory && !cancelled) {
          setDocumentData((prev) => ({ ...prev, allMandatoryDocsUploaded: true }));
        }
      } catch (err) {
        console.error('Error fetching existing documents:', err);
      }
    })();
    return () => { cancelled = true; };
  }, [completedOpportunityId, documentData.allMandatoryDocsUploaded]);

  const hydrateFlowFromLead = (leadData: Lead & Record<string, any>) => {
    const clientName = `${leadData.fname || ''} ${leadData.lname || ''}`.trim() || `Lead #${leadData.id}`;
    const service = String((leadData as Record<string, unknown>).service_interest_label || leadData.service_interest || '');
    const totalAmount = Number(leadData.payTotal || leadData.demandAmt || 0);
    const paidAmount = Number(leadData.paidYet || 0);
    const remainingBalance = Number(leadData.payBalance || Math.max(totalAmount - paidAmount, 0));
    const opportunityName = `${clientName}${service ? ` - ${service}` : ''}`;
    const today = new Date().toISOString().split('T')[0];
    const validUntil = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    // Program validity comes from the lead's crm_service.validity (joined in
    // GET /api/leads/[id]) and drives both the agreement's duration and its
    // end date.
    const programValidityMonths = parseInt(String(leadData.program_validity || ''), 10) || 12;
    const endDate = computeAgreementEndDate(today, leadData.program_validity);
    const branchDetails = getLeadBranchDetails(leadData);

    setProspectData(prev => ({
      ...prev,
      opportunityName: prev.opportunityName || opportunityName,
      estimatedValue: prev.estimatedValue || String(totalAmount || ''),
      priority: normalizePriorityForWizard(prev.priority || leadData.priority),
      description: prev.description || leadData.lead_remark || `Opportunity for ${clientName}`,
      serviceRequired: prev.serviceRequired || service,
      serviceId: prev.serviceId || String((leadData as Record<string, unknown>).service_interest || ''),
    }));

    setQuotationData(prev => {
      const hasExistingItem = prev.items.some(item => item.description || Number(item.unitPrice) > 0);
      return {
        ...prev,
        validUntil: prev.validUntil || validUntil,
        items: hasExistingItem ? prev.items : [{
          description: service || 'Consulting Service',
          quantity: 1,
          unitPrice: String(totalAmount || ''),
          total: String(totalAmount || ''),
        }],
        subtotal: prev.subtotal || totalAmount,
        tax: prev.tax || 0,
        total: prev.total || totalAmount,
        terms: prev.terms || 'Payment as per agreed service package.',
      };
    });

    setPaymentData(prev => ({
      ...prev,
      totalAmount: prev.totalAmount || totalAmount,
      paidAmount: prev.paidAmount || paidAmount,
      remainingBalance: prev.remainingBalance || remainingBalance,
      paymentDate: prev.paymentDate || today,
    }));

    setAgreementData(prev => ({
      ...prev,
      agreementTitle: prev.agreementTitle || `Service Agreement - ${clientName}`,
      amount: prev.amount || String(totalAmount || ''),
      duration: prev.duration || String(programValidityMonths),
      startDate: prev.startDate || today,
      endDate: prev.endDate || endDate,
      companyName: prev.companyName || branchDetails.companyName,
      companyAddress: prev.companyAddress || branchDetails.branchAddress || '',
      terms: prev.terms || 'Standard service agreement terms apply.',
    }));

    setDocumentData(prev => ({
      ...prev,
      passportNumber: prev.passportNumber || leadData.id_number || '',
      clientActualName: prev.clientActualName || (leadData as any).client_actual_name || '',
    }));
  };

  const moveToNextStage = async () => {
    if (isReadOnly) {
      window.toast.info('This won client opportunity flow is view-only for your role.');
      return;
    }

    const validationError = validateStage(activeStage, {
      prospectData,
      quotationData,
      paymentData,
      documentData,
      agreementData,
      signedAgreementData,
    });
    if (validationError) {
      window.toast.error(validationError);
      return;
    }

    if ((activeStage === 'quotation' || activeStage === 'payment') && quotationData.discount > 0 && retentionData.discountStatus !== 'approved') {
      window.toast.error('Discount approval is required before continuing. Discounts over 20% must be approved in Discount Management by a Branch Manager or CEO.');
      return;
    }

    if (activeStage !== 'prospect' && activeStage !== 'quotation' && activeStage !== 'payment' && isFinanceOrComplianceRejected) {
      window.toast.error(
        financeReviewStatus?.financeStatus === 'rejected'
          ? 'Accounts rejected this opportunity\'s payment/discount verification. It cannot proceed until Accounts re-verifies it.'
          : 'Compliance rejected this opportunity. It cannot proceed until Compliance re-approves it.'
      );
      return;
    }

    if (activeStage === 'signed-agreement') {
      if (!signedAgreementData.documentUrl || !signedAgreementData.uploadedTocrm) {
        window.toast.warning('Upload the signed agreement before submitting it for compliance approval.');
        return;
      }

      // Block compliance submission until accounts team has verified a payment via Finance > Payment Verification
      try {
        const pvRes = await fetch(`/api/admin/payment-verification?leadId=${leadId}`);
        if (pvRes.ok) {
          const pvData = await pvRes.json();
          const paymentsArr: Array<{ accountantStatus?: string }> = pvData.data ?? pvData.payments ?? [];
          const hasVerified = paymentsArr.some((p) => p.accountantStatus === 'verified');
          if (!hasVerified) {
            window.toast.warning('Payment must be verified by the accounts team before submitting for compliance approval.\n\nGo to Finance → Payment Verification to verify this client\'s payment.');
            return;
          }
        }
      } catch {
        // Non-blocking: if the check fails, allow to proceed
      }

      await submitComplianceApproval();
    }

    if (activeStage === 'retained' && retentionData.agreementComplianceStatus !== 'approved') {
      window.toast.error('Compliance officer approval is required before closing or marking the opportunity as won.');
      return;
    }

    const currentIndex = stages.findIndex(s => s.id === activeStage);
    if (currentIndex < stages.length - 1) {
      // Save current stage data
      await saveStageData(activeStage);

      // Mark current as completed
      const newStages = [...stages];
      newStages[currentIndex].status = 'completed';
      newStages[currentIndex + 1].status = 'current';
      setStages(newStages);
      const nextStageId = newStages[currentIndex + 1].id;
      setActiveStage(nextStageId);
      persistCurrentStage(nextStageId);
    }
  };

  // Records how far this lead has progressed through the flow so anyone who
  // reopens it (counselor, Branch Manager, CEO) resumes on the same stage
  // instead of restarting at Prospect. Fire-and-forget: a failed write here
  // shouldn't block the counselor from continuing the flow itself.
  const persistCurrentStage = async (stageId: string) => {
    try {
      await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunity_stage: stageId }),
      });
    } catch (error) {
      console.error('Error persisting opportunity stage:', error);
    }
  };

  const saveStageData = async (stageId: string) => {
    if (isReadOnly) {
      window.toast.info('This won client opportunity flow is view-only for your role.');
      return;
    }

    try {
      const stageDataMap: Record<string, any> = {
        prospect: prospectData,
        quotation: quotationData,
        payment: paymentData,
        accounts: {},
        documents: documentData,
        agreement: agreementData,
        'signed-agreement': signedAgreementData,
        retained: retentionData,
      };

      const dataToSave = {
        leadId,
        stage: stageId,
        data: stageDataMap[stageId],
        timestamp: new Date().toISOString()
      };

      console.log('Saving stage data:', dataToSave);
      const response = await fetch('/api/admin/opportunities/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave)
      });

      if (!response.ok) {
        throw new Error('Failed to save stage data');
      }

      const result = await response.json();
      console.log('Stage data saved successfully:', result);
    } catch (error) {
      console.error('Error saving stage data:', error);
      window.toast.error('Failed to save data. Please try again.');
    }
  };

  const moveToPreviousStage = () => {
    if (isReadOnly) {
      return;
    }

    const currentIndex = stages.findIndex(s => s.id === activeStage);
    if (currentIndex > 0) {
      const newStages = [...stages];
      newStages[currentIndex].status = 'pending';
      newStages[currentIndex - 1].status = 'current';
      setStages(newStages);
      setActiveStage(newStages[currentIndex - 1].id);
    }
  };

  const handleStageClick = (stageId: string) => {
    // Stages must be completed one at a time via each stage's own Next/Continue
    // button — a stage that's still 'pending' hasn't been reached yet, so
    // clicking its tab directly (e.g. skipping straight to Documents) is a no-op.
    const targetStage = stages.find(stage => stage.id === stageId);
    const isApprovedRetentionReviewTab = stageId === 'retention-rejected' && retentionData.agreementComplianceStatus === 'approved';
    if (!targetStage || (targetStage.status === 'pending' && !isApprovedRetentionReviewTab)) return;

    const quotationIndex = stages.findIndex(stage => stage.id === 'quotation');
    const targetIndex = stages.findIndex(stage => stage.id === stageId);
    if (quotationData.discount > 0 && retentionData.discountStatus !== 'approved' && targetIndex > quotationIndex) {
      window.toast.error('Discount approval is required before moving past quotation. Please request approval and wait for CEO approval in Discount Management.');
      setActiveStage('quotation');
      return;
    }

    setActiveStage(stageId);
  };

  // Returns the freshly-fetched status so callers that need to gate an
  // immediate action (e.g. creating a receipt) can check the real, current
  // value instead of racing the setRetentionData state update below - the
  // wizard otherwise only ever fetched this once on initial page load,
  // which goes stale the moment a discount is approved (BM/CEO action, or
  // the auto-approve tier's own debounce) while the tab is already open.
  const refreshDiscountApproval = async (): Promise<'not_required' | 'pending' | 'approved' | 'rejected'> => {
    try {
      const discountResponse = await fetch(`/api/discount-approvals?leadId=${leadId}`, { cache: 'no-store' });
      if (!discountResponse.ok) return retentionData.discountStatus;
      const discountData = await discountResponse.json();
      const latestDiscount = discountData.data?.[0];
      if (!latestDiscount) return retentionData.discountStatus;
      const resolvedStatus = (latestDiscount.status || 'pending') as 'not_required' | 'pending' | 'approved' | 'rejected';
      setRetentionData(prev => ({
        ...prev,
        discountApprovalId: latestDiscount.id,
        discountStatus: resolvedStatus,
      }));
      return resolvedStatus;
    } catch (error) {
      console.error('Error refreshing discount approval status:', error);
      return retentionData.discountStatus;
    }
  };

  // Re-check discount status right when the counselor actually reaches the
  // stages the approval gates (Quotation, Payment) rather than only once at
  // initial page load - closes the staleness window without needing the
  // user to know to click a manual refresh button.
  useEffect(() => {
    if ((activeStage === 'quotation' || activeStage === 'payment') && quotationData.discount > 0 && retentionData.discountStatus !== 'approved') {
      refreshDiscountApproval();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStage]);

  const handleDiscountChanged = (discount: number) => {
    if (discount <= 0) {
      setRetentionData(prev => ({ ...prev, discountStatus: 'not_required' }));
      return;
    }

    setRetentionData(prev => {
      if (prev.discountStatus === 'pending' || prev.discountStatus === 'approved') {
        // discountApprovalId is deliberately KEPT (not nulled) here - the next
        // handleRequestDiscount call passes it as supersedesId so the old,
        // now-wrong entry gets soft-deleted instead of left dangling as a
        // stale 'approved'/'pending' row forever once a fresh one is submitted.
        return { ...prev, discountStatus: 'not_required' };
      }
      return prev;
    });
  };

  // isReapply: correcting a wrong amount or a wrongly-approved/rejected
  // discount, rather than the first request. Passes the current
  // discountApprovalId as supersedesId, which the server soft-deletes
  // immediately (before creating the replacement) - see POST
  // /api/discount-approvals - so the old, wrong entry never reads as active
  // again anywhere (this wizard, Discount Management, etc).
  const handleRequestDiscount = async (isReapply = false) => {
    if (requestingDiscount) return;
    setRequestingDiscount(true);
    try {
      const originalAmount = quotationData.subtotal || parseFloat(prospectData.estimatedValue);
      if (!originalAmount || originalAmount <= 0 || quotationData.discount <= 0) {
        window.toast.warning('Please enter quotation line items and a valid discount amount before requesting approval');
        return;
      }

      const discountData = {
        leadId: leadId,
        opportunityId: completedOpportunityId || (lead as any)?.opportunity_id || null,
        discountType: 'fixed',
        discountAmount: quotationData.discount,
        originalAmount,
        discountedAmount: originalAmount - quotationData.discount,
        currency: currencyCode,
        reason: isReapply
          ? `Corrected discount for ${prospectData.opportunityName} (replaces a wrong amount/approval)`
          : `Discount requested for ${prospectData.opportunityName}`,
        requestedBy: user?.id || 1,
        status: 'pending',
        // Superseding whatever old approval-id is still tracked applies
        // whether this is the explicit "Request a correction" flow or a
        // Branch Manager/CEO simply editing an already-approved amount and
        // resubmitting - either way, an old id still present here means the
        // one it belonged to needs to be replaced, not left dangling.
        ...(retentionData.discountApprovalId ? { supersedesId: retentionData.discountApprovalId } : {}),
      };

      const response = await fetch('/api/discount-approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(discountData)
      });

      if (response.ok) {
        const discount = await response.json();
        // 0-20% discounts are auto-approved server-side (see /api/discount-approvals
        // POST) — the server tells us which via data.status, so the flow isn't
        // blocked waiting on an approval that was never actually required.
        const resolvedStatus: 'pending' | 'approved' = discount.data?.status === 'approved' ? 'approved' : 'pending';
        setRetentionData(prev => ({
          ...prev,
          discountApprovalId: discount.data?.id || discount.id,
          discountStatus: resolvedStatus
        }));
        window.toast.success(
          resolvedStatus === 'approved'
            ? 'Discount applied — 0-20% discounts are auto-approved, no sign-off needed.'
            : isReapply
              ? 'Correction submitted. The previous request was replaced and this one now needs Branch Manager or CEO approval.'
              : 'Discount request submitted. Branch Manager or CEO must approve it in Discount Management before you can continue past the payment stage.'
        );
      } else {
        const errorBody = await response.json().catch(() => null);
        window.toast.error(errorBody?.error || 'Failed to submit discount request');
      }
    } catch (error) {
      console.error('Error requesting discount:', error);
      window.toast.error('Error requesting discount');
    } finally {
      setRequestingDiscount(false);
    }
  };

  const handleProcessReassignment = async () => {
    try {
      const reassignmentData = {
        leadId: leadId,
        fromEmployeeId: lead?.assignTo || 1,
        toEmployeeId: 1, // Would be selected from dropdown
        reassignmentType: 'manual',
        reason: retentionData.notes || 'Lead reassignment during retention process',
        previousStatus: lead?.status || 'new',
        newStatus: 'reassigned',
        reassignmentDate: new Date()
      };

      const response = await fetch('/api/lead-reassignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reassignmentData)
      });

      if (response.ok) {
        const reassignment = await response.json();
        setRetentionData(prev => ({ ...prev, reassignmentId: reassignment.id }));
        window.toast.success('Lead reassignment submitted successfully!');
      } else {
        window.toast.error('Failed to submit lead reassignment');
      }
    } catch (error) {
      console.error('Error processing reassignment:', error);
      window.toast.error('Error processing reassignment');
    }
  };

  const submitComplianceApproval = async () => {
    if (retentionData.agreementComplianceStatus === 'approved' || retentionData.agreementComplianceStatus === 'pending') return;

    const response = await fetch('/api/opportunity-compliance-approvals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leadId,
        opportunityId: (lead as any)?.opportunity_id || null,
        signedAgreementUrl: signedAgreementData.documentUrl,
        clientSignature: signedAgreementData.clientSignature,
        signatureDate: signedAgreementData.signatureDate,
        // ensureOpportunityForClient() only records the handover note once, at
        // the Payment stage — before this Counselor Conversation Summary field
        // (entered later, on the Agreement stage) has any value. Send it again
        // here so compliance actually sees what the counselor wrote.
        conversationSummary: agreementData.counselorConversationSummary,
        submittedBy: user?.id || lead?.assignTo || 1,
        status: 'pending'
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to submit signed agreement for compliance review');
    }

    const result = await response.json();
    setRetentionData(prev => ({
      ...prev,
      complianceApprovalId: result.data?.id || prev.complianceApprovalId,
      agreementComplianceStatus: 'pending',
      retentionStatus: 'pending',
    }));
  };

  const handleRefreshComplianceStatus = async () => {
    try {
      const response = await fetch(getComplianceApprovalsUrl(initialOpportunityId || completedOpportunityId || Number((lead as any)?.opportunity_id)));
      if (!response.ok) {
        window.toast.error('Failed to refresh compliance status');
        return;
      }

      const complianceData = await response.json();
      const latestCompliance = complianceData.data?.[0];
      if (!latestCompliance) {
        window.toast.warning('No compliance review found yet.');
        return;
      }

      const status = latestCompliance.status || 'pending';
      setRetentionData(prev => ({
        ...prev,
        complianceApprovalId: latestCompliance.id,
        agreementComplianceStatus: status,
        retentionStatus: status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'pending',
        complianceManager: latestCompliance.reviewedBy || prev.complianceManager,
        reviewNotes: latestCompliance.reviewNotes || prev.reviewNotes,
        reviewDate: latestCompliance.reviewedAt ? latestCompliance.reviewedAt.split('T')[0] : prev.reviewDate,
      }));
      applyComplianceStatusToStages(status);

      if (status === 'approved') {
        window.toast.success('Compliance manager approved the agreement. You can now mark the opportunity as won.');
      } else if (status === 'rejected') {
        window.toast.error('Compliance manager rejected the agreement.');
      } else {
        window.toast.warning('Compliance review is still pending.');
      }
    } catch (error) {
      console.error('Error refreshing compliance status:', error);
      window.toast.error('Error refreshing compliance status');
    }
  };

  const ensureOpportunityForClient = async (paymentOverride: Partial<PaymentData> = {}) => {
    const effectivePaymentData = { ...paymentData, ...paymentOverride };
    const existingOpportunityId = completedOpportunityId || Number((lead as any)?.opportunity_id);
    if (existingOpportunityId) return existingOpportunityId;
    const branchDetails = getLeadBranchDetails(lead as any);

    const existingResponse = await fetch(`/api/opportunities?leadId=${leadId}`);
    if (existingResponse.ok) {
      const opportunities = await existingResponse.json();
      const latestOpportunity = Array.isArray(opportunities) ? opportunities[0] : null;
      if (latestOpportunity?.id) {
        setCompletedOpportunityId(Number(latestOpportunity.id));
        return Number(latestOpportunity.id);
      }
    }

    const createResponse = await fetch('/api/lead-to-opportunity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify((() => {
        const totalAmount = Number(quotationData.total || effectivePaymentData.totalAmount || 0);
        const paidAmount = Math.min(Math.max(0, Number(effectivePaymentData.paidAmount || 0)), totalAmount);
        const remainingBalance = Math.max(totalAmount - paidAmount, 0);

        return {
        leadId,
        // Client creation happens only after Accounts + Compliance approval
        // when the counselor closes/marks the opportunity won.
        createClient: false,
        opportunityData: {
          opportunityName: prospectData.opportunityName || `${lead?.fname || ''} ${lead?.lname || ''} - ${lead?.service_interest || prospectData.serviceRequired}`,
          description: prospectData.description || `Opportunity created for ${lead?.fname || ''} ${lead?.lname || ''}`,
          estimatedValue: parseFloat(prospectData.estimatedValue) || quotationData.total || (lead as any)?.payTotal || 0,
          priority: prospectData.priority || (lead as any)?.priority || 'Medium',
          documentsVerified: documentData.allMandatoryDocsUploaded,
          serviceRequired: prospectData.serviceRequired || (lead as any)?.service_interest || 'Consulting Service',
        },
        paymentData: {
          totalAmount,
          amount: paidAmount,
          paidAmount,
          paymentMethod: effectivePaymentData.paymentMethod || 'cash',
          paymentDate: effectivePaymentData.paymentDate,
          transactionId: effectivePaymentData.transactionId,
          // Without this, /api/lead-to-opportunity falls back to 0 (see its
          // `paymentData.taxAmount || invoiceData.taxAmt || 0`), so the
          // payment/invoice records permanently show no VAT/GST — most
          // visible on India's 18% GST, but wrong for every branch's tax.
          // The printed receipt itself recomputes this live from the branch's
          // vat_gst_percent (buildReceiptHtml) so it isn't affected, but every
          // other screen (Payments list, Invoices) reads this stored column.
          taxAmount: quotationData.tax || 0,
          discountAmount: quotationData.discount || 0,
          proofOfPaymentUrl: effectivePaymentData.proofOfPaymentUrl || null,
          dueDate: effectivePaymentData.dueDate || undefined,
          remark: effectivePaymentData.remark || undefined,
          adminFeeIncluded: effectivePaymentData.adminFeeIncluded || false,
        },
        agreementData: {
          title: agreementData.agreementTitle || `Service Agreement - ${lead?.fname || ''} ${lead?.lname || ''}`,
          agreementType: agreementData.agreementType,
          duration: agreementData.duration,
          startDate: agreementData.startDate,
          endDate: agreementData.endDate,
          totalAmount: quotationData.total || parseFloat(prospectData.estimatedValue) || 0,
          terms: agreementData.terms,
          specialConditions: agreementData.specialConditions,
          companyName: agreementData.companyName || branchDetails.companyName,
          companyAddress: agreementData.companyAddress || branchDetails.branchAddress,
          status: signedAgreementData.uploadedTocrm ? 'uploaded' : 'generated',
          documentUrl: signedAgreementData.documentUrl,
          clientSignature: signedAgreementData.clientSignature,
          signatureDate: signedAgreementData.signatureDate
        },
        invoiceData: {
          purpose: prospectData.serviceRequired || lead?.service_interest || '',
          discount: quotationData.discount || 0,
          taxAmt: quotationData.tax || 0,
          amount: paidAmount,
          totPayAmt: totalAmount,
          payBalance: remainingBalance,
          payment_mode: effectivePaymentData.paymentMethod || 'cash'
        },
        counselorHandover: {
          summary: agreementData.counselorConversationSummary
        }
      };
      })())
    });

    if (!createResponse.ok) {
      const error = await createResponse.json().catch(() => ({}));
      const details = Array.isArray(error.errors) ? `: ${error.errors.join(', ')}` : error.details ? `: ${error.details}` : '';
      throw new Error(`${error.error || 'Failed to create opportunity for operations'}${details}`);
    }

    const result = await createResponse.json();
    const createdOpportunityId = Number(result.data?.opportunity?.id);
    if (!createdOpportunityId) {
      throw new Error('Opportunity conversion did not return an opportunity ID');
    }
    setCompletedOpportunityId(createdOpportunityId);
    return createdOpportunityId;
  };

  const saveAgreement = async () => {
    const opportunityId = await ensureOpportunityForClient();
    let agreementId = agreementData.agreementId;
    let existingAgreementNumber: string | null = null;

    if (!agreementId) {
      const response = await fetch(`/api/opportunity-agreements?opportunityId=${opportunityId}`);
      if (response.ok) {
        const agreements = await response.json();
        agreementId = Number(agreements?.[0]?.id || 0) || null;
        existingAgreementNumber = agreements?.[0]?.agreementNumber || null;
      }
    }

    // Reserve the number once so the value saved to the database and the value
    // shown on the downloaded PDF (downloadAgreementPdf, below) are always the
    // same agreement number instead of two independently-generated timestamps.
    const newAgreementNumber = `AGR-${Date.now()}`;
    const branchDetails = getLeadBranchDetails(lead as any);

    const payload = {
      agreementType: agreementData.agreementType,
      agreementTitle: agreementData.agreementTitle,
      title: agreementData.agreementTitle,
      duration: agreementData.duration,
      startDate: agreementData.startDate || new Date().toISOString().split('T')[0],
      endDate: agreementData.endDate || computeAgreementEndDate(
        agreementData.startDate || new Date().toISOString().split('T')[0],
        (lead as any)?.program_validity,
      ),
      amount: Number(agreementData.amount || quotationData.total || 0),
      totalAmount: Number(agreementData.amount || quotationData.total || 0),
      terms: agreementData.terms,
      termsAndConditions: agreementData.terms,
      specialConditions: agreementData.specialConditions,
      companyName: agreementData.companyName || branchDetails.companyName,
      companyAddress: agreementData.companyAddress || branchDetails.branchAddress,
    };

    const response = await fetch(
      agreementId ? `/api/opportunity-agreements?id=${agreementId}` : '/api/opportunity-agreements',
      {
        method: agreementId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agreementId ? payload : {
          ...payload,
          opportunityId,
          agreementNumber: newAgreementNumber,
          status: 'generated',
          createdBy: user?.id || lead?.assignTo || 1,
          uploadedBy: user?.id || lead?.assignTo || 1,
        }),
      },
    );
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Failed to save agreement');

    const savedId = Number(result.data?.id || result.id || agreementId || 0);
    // On create, the server assigns the real AG/{branch}/{product}/{date}/{seq}
    // number from the new row's own id (it can't be predicted client-side
    // before that id exists) — always prefer whatever it echoes back.
    const savedAgreementNumber = agreementId
      ? (existingAgreementNumber || result.data?.agreementNumber || agreementData.agreementNumber || null)
      : (result.data?.agreementNumber || result.agreementNumber || newAgreementNumber);
    setAgreementData((current) => ({
      ...current,
      agreementId: savedId || current.agreementId,
      agreementNumber: savedAgreementNumber || current.agreementNumber,
      status: 'generated',
    }));
    return savedId;
  };

  const deleteAgreement = async () => {
    const agreementId = agreementData.agreementId;
    if (!agreementId) return;
    const response = await fetch(`/api/opportunity-agreements?id=${agreementId}`, { method: 'DELETE' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Failed to delete agreement');
    setAgreementData((current) => ({ ...current, agreementId: null, status: 'draft' }));
  };

  const handleCompleteRetention = async () => {
    if (closingWon) return;
    setClosingWon(true);
    try {
      if (retentionData.agreementComplianceStatus !== 'approved') {
        window.toast.error('Compliance officer approval is required before this opportunity can be closed or won.');
        return;
      }

      if (isFinanceOrComplianceRejected) {
        window.toast.error(
          financeReviewStatus?.financeStatus === 'rejected'
            ? 'Accounts rejected this opportunity\'s payment/discount verification. It cannot be closed or marked won until Accounts re-verifies it.'
            : 'Compliance rejected this opportunity. It cannot be closed or marked won until Compliance re-approves it.'
        );
        return;
      }

      const opportunityId = await ensureOpportunityForClient();
      const branchDetails = getLeadBranchDetails(lead as any);

      let agreementResult: any = null;
      const existingAgreementResponse = await fetch(`/api/agreement-generation?opportunityId=${opportunityId}`);
      if (existingAgreementResponse.ok) {
        const existingAgreementData = await existingAgreementResponse.json();
        const latestAgreement = Array.isArray(existingAgreementData.data) ? existingAgreementData.data[0] : null;
        if (latestAgreement) {
          // The agreement/receipt must print the client's actual legal name
          // (Documents stage, mandatory) rather than fname/lname once set.
          const clientName = (lead as any)?.client_actual_name || `${lead?.fname || ''} ${lead?.lname || ''}`.trim() || 'Client';
          // A not-yet-signed agreement's stored HTML can predate a later fix to its
          // branch's legal text (branchAgreementProfiles.ts) — regenerate it fresh
          // before finalizing to "won" so the client doesn't get stale branch details.
          // An already-signed/uploaded agreement is a real executed document and must
          // never be silently rewritten.
          const isAlreadySigned = Boolean(latestAgreement.uploadedToCrm) || Boolean(latestAgreement.documentUrl);
          let content = latestAgreement.content;
          if (!isAlreadySigned) {
            const destinationCountry = (lead as any)?.country_interest_label || (lead as any)?.country_interest || 'Not specified';
            const serviceProgram = (lead as any)?.service_interest_label || (lead as any)?.service_interest || agreementData.agreementType || 'Consulting Service';
            const totalAmountForAgreement = quotationData?.total || agreementData.amount || (lead as any)?.payTotal || (lead as any)?.demandAmt || '0';
            // Initial Payment is the amount the client actually paid when the
            // receipt was generated (Payment stage), not the pre-discount
            // quotation subtotal - the subtotal can exceed the (post-discount)
            // Total Advisory Fee itself, which showed an initial payment bigger
            // than the total.
            const initialPaymentForAgreement = String(Math.min(Math.max(0, Number(paymentData.paidAmount || 0)), Number(totalAmountForAgreement) || 0));
            const secondPaymentForAgreement = String(Math.max(0, Number(totalAmountForAgreement) - Number(initialPaymentForAgreement)));

            content = renderAgreementForBranch(branchDetails.branchAbbrv, {
              agreementNumber: latestAgreement.agreementNumber,
              agreementDate: new Date().toLocaleDateString('en-GB'),
              agreementExpiry: agreementData.endDate ? new Date(agreementData.endDate).toLocaleDateString('en-GB') : '',
              clientName,
              clientEmail: (lead as any)?.email || '',
              clientPhone: (lead as any)?.phone || (lead as any)?.mobile || '',
              clientAddress: (lead as any)?.address || '',
              nationality: (lead as any)?.nationality || '',
              passportNumber: (lead as any)?.id_number || '',
              idNumber: (lead as any)?.emirates_id || (lead as any)?.id_number || '',
              serviceProgram,
              programCode: agreementData.agreementType || '',
              programTermSchedule: (lead as any)?.program_validity
                || (agreementData.startDate && agreementData.endDate
                ? `${agreementData.startDate} to ${agreementData.endDate}`
                : ''),
              destinationCountry,
              totalAmount: String(totalAmountForAgreement),
              initialPayment: initialPaymentForAgreement,
              secondPayment: secondPaymentForAgreement,
              clientId: String((lead as any)?.id || ''),
              includedDeliverables: agreementData.agreementTitle || '',
              expressExclusions: '',
              specialTerms: agreementData.terms || '',
            });

            // Persist the refreshed content so the standalone agreement page and any
            // later lookup also see it, not just this in-memory value. Best-effort:
            // if this save fails, "Won" can still proceed with the stale content
            // (same as before this fix), rather than blocking retention on it.
            fetch(`/api/opportunity-agreements?id=${latestAgreement.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ content }),
            }).catch((err) => console.error('Failed to persist refreshed agreement content:', err));
          }

          agreementResult = {
            data: {
              agreementId: latestAgreement.id,
              agreementNumber: latestAgreement.agreementNumber,
              content,
              opportunity: {
                clientName: latestAgreement.clientName || clientName,
                serviceType: prospectData.serviceRequired || lead?.service_interest || 'Service'
              }
            }
          };
        }
      }

      if (!agreementResult) {
        // Same "amount the client actually agreed to" computation used when
        // refreshing an existing agreement above — the fixed amount after
        // the approved discount (and tax), not the opportunity's original
        // pre-discount package/estimated value.
        const firstGenTotalAmount = quotationData?.total || agreementData.amount || (lead as any)?.payTotal || (lead as any)?.demandAmt || 0;
        // Same actual-amount-paid fix as the refresh branch above.
        const firstGenInitialPayment = String(Math.min(Math.max(0, Number(paymentData.paidAmount || 0)), Number(firstGenTotalAmount) || 0));
        const firstGenSecondPayment = String(Math.max(0, Number(firstGenTotalAmount) - Number(firstGenInitialPayment)));

        const agreementResponse = await fetch('/api/agreement-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opportunityId,
          agreementData: {
            agreementType: agreementData.agreementType || 'service_agreement',
            title: `Service Agreement - ${prospectData.opportunityName || `${lead?.fname} ${lead?.lname}`}`,
            description: `Service agreement for ${prospectData.serviceRequired || lead?.service_interest}`,
            terms: generateDefaultTerms(prospectData),
            startDate: agreementData.startDate || new Date().toISOString().split('T')[0],
            endDate: agreementData.endDate || computeAgreementEndDate(
              agreementData.startDate || new Date().toISOString().split('T')[0],
              (lead as any)?.program_validity,
            ),
            paymentMethod: 'Bank Transfer',
            paymentSchedule: 'As per agreed schedule',
            totalAmount: firstGenTotalAmount,
            initialPayment: firstGenInitialPayment,
            secondPayment: firstGenSecondPayment,
          },
          clientData: {
            companyName: agreementData.companyName || branchDetails.companyName,
            companyAddress: agreementData.companyAddress || branchDetails.branchAddress
          },
          templateId: null
        })
      });

        if (!agreementResponse.ok) {
          const agreementError = await agreementResponse.json();
          throw new Error(agreementError.error || 'Failed to generate agreement');
        }

        agreementResult = await agreementResponse.json();
      }

      // Update opportunity status to won
      const opportunityStatusResponse = await fetch(`/api/opportunities/${opportunityId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'won',
          actualCloseDate: new Date(),
          actualValue: quotationData.total || parseFloat(prospectData.estimatedValue) || 0,
          retentionStatus: 'approved',
          retentionDate: new Date(),
          agreementGenerated: true,
          agreementId: agreementResult.data.agreementId,
          agreementSent: true,
          agreementSigned: true,
          paymentReceived: true,
          documentsVerified: true
        })
      });

      if (!opportunityStatusResponse.ok) {
        const opportunityStatusError = await opportunityStatusResponse.json().catch(() => ({}));
        throw new Error(opportunityStatusError.error || 'Failed to update opportunity status');
      }
      setCompletedOpportunityId(opportunityId);

      const leadStatusResponse = await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'retained',
          convet: 'Client',
          opportunity_status: 'won',
          opportunity_stage: 'closed',
          opportunity_id: opportunityId,
          conversion_date: new Date().toISOString().split('T')[0],
          conversion_reason: 'Successfully converted and retained client'
        })
      });

      if (!leadStatusResponse.ok) {
        const leadStatusError = await leadStatusResponse.json().catch(() => ({}));
        throw new Error(leadStatusError.error || 'Failed to update lead status after opportunity conversion');
      }

      // Update stages
      const updatedStages = stages.map(stage =>
        stage.id === 'retained' ? { ...stage, status: 'completed' as const } :
          stage.id === 'closed' ? { ...stage, status: 'current' as const } : stage
      );
      setStages(updatedStages);
      setActiveStage('closed');
      setLead((current: any) => current ? {
        ...current,
        status: 'retained',
        convet: 'Client',
        opportunity_status: 'won',
        opportunity_stage: 'closed',
        opportunity_id: opportunityId,
      } : current);

      window.toast.success(`🎉 Opportunity completed and retained successfully!\n\nAgreement generated: ${agreementResult.data.agreementNumber}\nClient: ${agreementResult.data.opportunity.clientName}\nService: ${agreementResult.data.opportunity.serviceType}`);

    } catch (error) {
      console.error('Error completing retention:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      window.toast.error('Error completing retention: ' + errorMessage);
    } finally {
      setClosingWon(false);
    }
  };

  const generateDefaultTerms = (prospectData: any) => {
    return `
1. SERVICE PROVISION
   The Service Provider agrees to provide ${prospectData.serviceRequired || 'professional'} services to the Client as specified in this agreement.

2. CLIENT OBLIGATIONS
   The Client agrees to:
   - Provide all necessary information and documentation required for the services
   - Make timely payments as agreed
   - Cooperate with the Service Provider throughout the process
   - Maintain confidentiality of all information shared

3. SERVICE PROVIDER OBLIGATIONS
   The Service Provider agrees to:
   - Provide professional and timely services
   - Maintain confidentiality of client information
   - Keep the client informed of progress
   - Deliver services as per agreed standards

4. PAYMENT TERMS
   - Total Amount: ${prospectData.estimatedValue || 'To be determined'}
   - Payment Method: Bank Transfer
   - Payment Schedule: As per agreed schedule
   - Late payments may incur additional charges

5. TERM AND TERMINATION
   - This agreement is valid for the duration specified
   - Either party may terminate with 30 days written notice
   - Termination does not affect obligations accrued prior to termination

6. CONFIDENTIALITY
   - Both parties agree to maintain confidentiality of all information
   - Information shared during the service provision is protected
   - This obligation survives the termination of this agreement

7. GOVERNING LAW
   - This agreement shall be governed by the laws of United Arab Emirates
   - Any disputes shall be resolved through mutual discussion or legal means

8. ENTIRE AGREEMENT
   - This document constitutes the entire agreement between the parties
   - No modifications or amendments shall be valid unless in writing and signed by both parties
   - Both parties acknowledge having read, understood, and agreed to the terms contained herein
  `.trim();
  };

  const renderStageContent = () => {
    switch (activeStage) {
      case 'prospect':
        return <ProspectStage
          lead={lead}
          data={prospectData}
          setData={setProspectData}
          onLeadUpdated={setLead}
          onSaveProspect={() => saveStageData('prospect')}
          onNext={moveToNextStage}
          feeData={feeData}
          feeLoading={feeLoading}
          paymentType={paymentType}
          setPaymentType={setPaymentType}
          getFeePackageTotals={getFeePackageTotals}
        />;
      case 'quotation':
        return <QuotationStage
          lead={lead}
          data={quotationData}
          setData={setQuotationData}
          feeData={feeData}
          feeLoading={feeLoading}
          retentionData={retentionData}
          requestingDiscount={requestingDiscount}
          onRequestDiscount={handleRequestDiscount}
          onRefreshDiscount={refreshDiscountApproval}
          onDiscountChanged={handleDiscountChanged}
          onNext={moveToNextStage}
          onPrevious={moveToPreviousStage}
          paymentType={paymentType}
          setPaymentType={setPaymentType}
        />;
      case 'payment':
        return <PaymentStage
          lead={lead}
          data={paymentData}
          setData={setPaymentData}
          quotationTotal={quotationData.total}
          quotationTax={quotationData.tax}
          quotationDiscount={quotationData.discount}
          opportunityId={completedOpportunityId}
          onEnsureOpportunity={ensureOpportunityForClient}
          discountPending={quotationData.discount > 0 && retentionData.discountStatus !== 'approved'}
          discountStatus={retentionData.discountStatus}
          onRefreshDiscount={refreshDiscountApproval}
          onNext={moveToNextStage}
          onPrevious={moveToPreviousStage}
        />;
      case 'accounts':
        return <AccountsStage
          lead={lead}
          leadId={leadId}
          opportunityId={completedOpportunityId}
          onNext={moveToNextStage}
          onPrevious={moveToPreviousStage}
        />;
      case 'documents':
        return <DocumentsStage
          lead={lead}
          leadId={leadId}
          onLeadUpdated={setLead}
          data={documentData}
          setData={setDocumentData}
          opportunityId={completedOpportunityId}
          onEnsureOpportunity={ensureOpportunityForClient}
          uploadedBy={user?.id || 1}
          paymentProofFile={paymentData.proofOfPayment instanceof File ? paymentData.proofOfPayment : null}
          onNext={moveToNextStage}
          onPrevious={moveToPreviousStage}
        />;
      case 'agreement':
        return <AgreementStage
          lead={lead}
          data={agreementData}
          setData={setAgreementData}
          quotationData={quotationData}
          paidAmount={paymentData.paidAmount}
          programValidity={(lead as any)?.program_validity || ''}
          opportunityId={completedOpportunityId || (lead as any)?.resolved_opportunity_id || (lead as any)?.opportunity_id}
          onSaveAgreement={saveAgreement}
          onDeleteAgreement={deleteAgreement}
          onNext={moveToNextStage}
          onPrevious={moveToPreviousStage}
        />;
      case 'signed-agreement':
        return <SignedAgreementStage
          lead={lead}
          data={signedAgreementData}
          setData={setSignedAgreementData}
          opportunityId={completedOpportunityId}
          uploadedBy={user?.id || 1}
          complianceStatus={retentionData.agreementComplianceStatus}
          onSubmitCompliance={submitComplianceApproval}
          onNext={moveToNextStage}
          onPrevious={moveToPreviousStage}
        />;
      case 'retained':
        return <RetainedStage
          lead={lead}
          data={retentionData}
          setData={setRetentionData}
          onRefreshCompliance={handleRefreshComplianceStatus}
          onCloseWon={handleCompleteRetention}
          closingWon={closingWon}
          onPrevious={moveToPreviousStage}
          onReject={() => {
            const newStages = [...stages];
            const retainedIndex = newStages.findIndex(s => s.id === 'retained');
            newStages[retainedIndex].status = 'rejected';
            const rejectedIndex = newStages.findIndex(s => s.id === 'retention-rejected');
            newStages[rejectedIndex].status = 'current';
            setStages(newStages);
            setActiveStage('retention-rejected');
          }}
        />;
      case 'retention-rejected':
        return <RetentionRejectedStage
          lead={lead}
          leadId={leadId}
          data={retentionData}
          onResubmit={() => {
            const newStages = [...stages];
            const retainedIndex = newStages.findIndex(s => s.id === 'retained');
            newStages[retainedIndex].status = 'current';
            const rejectedIndex = newStages.findIndex(s => s.id === 'retention-rejected');
            newStages[rejectedIndex].status = 'pending';
            setStages(newStages);
            setActiveStage('retained');
          }}
        />;
      case 'closed':
        return <ClosedStage
          lead={lead}
          leadId={leadId}
          prospectData={prospectData}
          quotationData={quotationData}
          paymentData={paymentData}
          currencyCode={feeData?.currencyCode || 'AED'}
        />;
      default:
        return <div>Select a stage</div>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-center">Loading opportunity flow...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] bg-gray-50">
      <div className="bg-white">
        {/* Header with Lead Info */}
        <div className="p-6 border-b border-gray-200 bg-white shadow-sm">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Opportunity Flow Management</h1>
                <p className="text-gray-600 mt-1">Convert lead to opportunity through the complete workflow</p>
              </div>
              <button
                onClick={() => window.history.back()}
                className="self-start sm:self-auto px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center"
              >
                <ChevronLeft className="mr-1" size={20} />
                Back to Leads
              </button>
            </div>

            {lead && (
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <User className="mr-2 text-blue-600" size={18} />
                  <span className="font-semibold text-gray-900">{lead.fname} {lead.lname}</span>
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">ID: #{lead.id}</span>
                </div>
                <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <div className="flex min-w-0 items-center text-gray-700">
                    <Mail className="mr-2 flex-shrink-0 text-gray-400" size={14} />
                    <span className="truncate">{lead.email}</span>
                  </div>
                  <div className="flex min-w-0 items-center text-gray-700">
                    <Phone className="mr-2 flex-shrink-0 text-gray-400" size={14} />
                    <span className="truncate">{lead.phone}</span>
                  </div>
                  <div className="flex min-w-0 items-center text-gray-700">
                    <Globe className="mr-2 flex-shrink-0 text-gray-400" size={14} />
                    <span className="truncate">{lead.nationality}</span>
                  </div>
                  <div className="flex min-w-0 items-center text-gray-700">
                    <Briefcase className="mr-2 flex-shrink-0 text-gray-400" size={14} />
                    <span className="truncate">{lead.service_interest}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Progress Path */}
        <div className="p-4 sm:p-6 border-b border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="flex max-w-full flex-wrap items-center gap-2">
              {stages.map((stage, index) => {
                const Icon = stage.icon;
                const isActive = stage.id === activeStage;
                // A stage the flow hasn't reached yet can't be jumped to directly —
                // only stages already completed/current (or rejected, a past state)
                // are navigable. Forward progress only happens one stage at a time
                // via the stage's own "Next"/"Continue" button.
                const isApprovedRetentionReviewTab = stage.id === 'retention-rejected' && retentionData.agreementComplianceStatus === 'approved';
                const isLocked = stage.status === 'pending' && !isApprovedRetentionReviewTab;

                return (
                  <div key={stage.id} className="flex flex-none items-center">
                    <button
                      onClick={() => handleStageClick(stage.id)}
                      disabled={isLocked}
                      title={isLocked ? 'Complete the earlier stages first' : undefined}
                      className={`flex flex-none items-center whitespace-nowrap px-3 py-2 sm:px-4 rounded-lg transition-all ${isActive
                        ? stage.status === 'completed'
                          ? 'bg-green-600 text-white shadow-md'
                          : stage.status === 'rejected'
                            ? 'bg-red-600 text-white shadow-md'
                            : 'bg-blue-600 text-white shadow-md'
                        : stage.status === 'completed'
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : isApprovedRetentionReviewTab
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : stage.status === 'rejected'
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                    >
                      <Icon size={16} className="mr-2 flex-shrink-0" />
                      <span className="text-xs font-medium sm:text-sm">{stage.name}</span>
                      {stage.status === 'completed' && (
                        <CheckCircle size={14} className="ml-2 flex-shrink-0" />
                      )}
                      {stage.status === 'rejected' && (
                        <XCircle size={14} className="ml-2 flex-shrink-0" />
                      )}
                    </button>

                    {index < stages.length - 1 && (
                      <ChevronRight
                        size={16}
                        className={`mx-1 hidden flex-shrink-0 2xl:block ${stage.status === 'completed' ? 'text-green-600' : 'text-gray-300'
                          }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Stage Content */}
        <div className="p-6 bg-gray-50 min-h-[60vh]">
          <div className="max-w-7xl mx-auto">
            {isReadOnly && (
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                View-only mode: this deal is already marked won. Only CEO and Branch Manager can edit the opportunity flow from the client list.
              </div>
            )}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStage}
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={stepVariants}
                transition={{ duration: 0.3 }}
              >
                {isReadOnly && activeStage !== 'closed' ? (
                  <fieldset disabled className="contents">
                    {renderStageContent()}
                  </fieldset>
                ) : renderStageContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

function validateStage(
  stage: string,
  data: {
    prospectData: ProspectData;
    quotationData: QuotationData;
    paymentData: PaymentData;
    documentData: DocumentData;
    agreementData: AgreementData;
    signedAgreementData: SignedAgreementData;
  },
): string | null {
  const { prospectData, quotationData, paymentData, documentData, agreementData, signedAgreementData } = data;
  const total = Number(quotationData.total);

  if (stage === 'prospect') {
    if (!prospectData.opportunityName.trim()) return 'Enter an opportunity name before continuing.';
    if (!Number.isFinite(Number(prospectData.estimatedValue)) || Number(prospectData.estimatedValue) <= 0) return 'Estimated value must be greater than zero.';
  }

  if (stage === 'quotation') {
    if (!quotationData.validUntil || new Date(`${quotationData.validUntil}T23:59:59`) < new Date()) return 'Set a quotation validity date that is today or later.';
    if (!Number.isFinite(total) || total <= 0) return 'Quotation total must be greater than zero.';
    if (!Number.isFinite(quotationData.discount) || quotationData.discount < 0 || quotationData.discount > quotationData.subtotal) return 'Discount must be between zero and the quotation subtotal.';
    if (!quotationData.items.some((item) => item.description.trim() && Number(item.quantity) > 0 && Number(item.unitPrice) >= 0)) return 'Add at least one complete quotation line item.';
  }

  if (stage === 'payment') {
    const paymentTotal = Number(paymentData.totalAmount || quotationData.total);
    if (!Number.isFinite(paymentTotal) || paymentTotal <= 0) return 'Payment total must be greater than zero.';
    if (!Number.isFinite(paymentData.paidAmount) || paymentData.paidAmount < 0 || paymentData.paidAmount > paymentTotal) return 'Paid amount must be between zero and the payment total.';
    if (!paymentData.paymentDate || Number.isNaN(new Date(paymentData.paymentDate).getTime())) return 'Enter a valid payment date.';
  }

  if (stage === 'documents' && !documentData.allMandatoryDocsUploaded) return 'Upload ID proof, passport copy, and enter the passport number and client actual name before continuing.';

  if (stage === 'agreement') {
    if (!agreementData.agreementTitle.trim()) return 'Enter an agreement title before continuing.';
    if (!agreementData.startDate || !agreementData.endDate || new Date(agreementData.endDate) < new Date(agreementData.startDate)) return 'Agreement end date must be on or after the start date.';
    if (!Number.isFinite(Number(agreementData.amount)) || Number(agreementData.amount) <= 0) return 'Agreement amount must be greater than zero.';
    if (!agreementData.terms.trim()) return 'Enter the agreement terms before continuing.';
    if (!agreementData.counselorConversationSummary.trim()) return 'Counselor conversation summary is required before continuing.';
    if (agreementData.counselorConversationSummary.trim().length < COUNSELOR_SUMMARY_MIN_CHARS) return `Counselor conversation summary must be at least ${COUNSELOR_SUMMARY_MIN_CHARS} characters.`;
  }

  if (stage === 'signed-agreement') {
    if (!signedAgreementData.clientSignature.trim()) return 'Enter the client signature before submitting for approval.';
    if (!signedAgreementData.signatureDate || Number.isNaN(new Date(signedAgreementData.signatureDate).getTime())) return 'Enter a valid signature date.';
  }

  return null;
}

// Stage Components
function ProspectStage({ lead, data, setData, onLeadUpdated, onSaveProspect, onNext, feeData, feeLoading, paymentType, setPaymentType, getFeePackageTotals }: any) {
  const { user } = useAuth();
  // Same rule as the Edit Lead page and the PUT /api/leads/[id] server-side
  // check: once a lead is in the CRM, only Branch Manager/CEO may change its
  // contact details. This workspace previously let anyone edit email/mobile/
  // phone here regardless of role — the save would silently 403 for a
  // counselor since the server already enforces this, so disable it in the UI too.
  const canEditContactInfo = isBranchManagerOrCeo(user as any);
  const [saving, setSaving] = useState(false);
  const [editingLeadField, setEditingLeadField] = useState<string | null>(null);
  const [leadDraft, setLeadDraft] = useState<Record<string, any>>({});
  const [programs, setPrograms] = useState<Array<{ id: number | string; name: string; validity?: string | null }>>([]);
  const [countries, setCountries] = useState<Array<{ id: number; name: string }>>([]);
  const REMARKS_PAGE_SIZE = 5;
  const [remarksLog, setRemarksLog] = useState<Array<{ id: number; action: string; remark: string; actorName?: string; created_at: string }>>([]);
  const [remarksTotal, setRemarksTotal] = useState(0);
  const [loadingRemarks, setLoadingRemarks] = useState(false);
  const [loadingMoreRemarks, setLoadingMoreRemarks] = useState(false);

  useEffect(() => {
    if (lead) setLeadDraft(lead);
  }, [lead]);

  // The opportunity's service is just whatever's set as "Service interest" in
  // the Counselor workspace above — there's no separate program picker for
  // it anymore, so keep it synced here instead (including when the workspace
  // field is edited after the initial load, which the one-time hydration on
  // fetch wouldn't otherwise pick up).
  useEffect(() => {
    const currentServiceId = leadDraft.service_interest ?? lead?.service_interest ?? '';
    if (!currentServiceId) return;
    const currentServiceName = lead?.service_interest_label
      || programs.find((p) => String(p.id) === String(currentServiceId))?.name
      || String(currentServiceId);
    if (String(data.serviceId) === String(currentServiceId) && data.serviceRequired === currentServiceName) return;
    setData((prev: any) => ({ ...prev, serviceRequired: currentServiceName, serviceId: String(currentServiceId) }));
  }, [leadDraft.service_interest, lead?.service_interest_label, programs]);

  // Replaces the free-text opportunity "Description" box — shows the lead's
  // actual activity history from crm_remarks instead. Only fetches this lead's
  // remarks (sections=activityLog skips the appointments/followUps/legacy-remarks
  // queries this page doesn't use) and only the first page, to keep page load light.
  useEffect(() => {
    if (!lead?.id) return;
    let cancelled = false;
    setLoadingRemarks(true);
    fetch(`/api/leads/${lead.id}/activity?sections=activityLog&remarksLimit=${REMARKS_PAGE_SIZE}&remarksOffset=0`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        setRemarksLog(json.activityLog || []);
        setRemarksTotal(Number(json.activityLogTotal) || 0);
      })
      .catch(() => { if (!cancelled) { setRemarksLog([]); setRemarksTotal(0); } })
      .finally(() => { if (!cancelled) setLoadingRemarks(false); });
    return () => { cancelled = true; };
  }, [lead?.id]);

  const loadMoreRemarks = async () => {
    if (!lead?.id || loadingMoreRemarks) return;
    setLoadingMoreRemarks(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}/activity?sections=activityLog&remarksLimit=${REMARKS_PAGE_SIZE}&remarksOffset=${remarksLog.length}`);
      const json = await res.json();
      setRemarksLog((prev) => [...prev, ...(json.activityLog || [])]);
      setRemarksTotal(Number(json.activityLogTotal) || 0);
    } catch (error) {
      console.error('Error loading more remarks:', error);
    } finally {
      setLoadingMoreRemarks(false);
    }
  };

  // Service interest is scoped to the selected country interest — e.g.
  // picking Canada should only offer Canada-based programs, same as the Add
  // Lead form's Program Country -> Program dependency. Falls back to every
  // active service when no country is selected yet.
  useEffect(() => {
    const loadPrograms = async () => {
      try {
        const countryId = leadDraft.country_interest;
        const url = countryId ? `/api/country-programs?countryId=${countryId}` : '/api/services';
        const response = await fetch(url);
        setPrograms(response.ok ? await response.json() : []);
      } catch (error) {
        console.error('Error loading programs:', error);
        setPrograms([]);
      }
    };
    loadPrograms();
  }, [leadDraft.country_interest]);

  useEffect(() => {
    fetch('/api/admin/lookup')
      .then(r => r.json())
      .then(d => setCountries(d.countries || []))
      .catch(() => {});
  }, []);

  const saveLeadField = async (field: string) => {
    if (!lead?.id) return;
    try {
      const response = await fetch(`/api/leads/${lead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: leadDraft[field] ?? '' }),
      });
      const updatedLead = await response.json();
      if (!response.ok) throw new Error(updatedLead.error || 'Failed to save field');
      onLeadUpdated(updatedLead);
      setEditingLeadField(null);
    } catch (error) {
      window.toast.error(error instanceof Error ? error.message : 'Failed to save field');
    }
  };

  const leadField = (field: string, label: string, type = 'text', editable = true) => {
    const editing = editable && editingLeadField === field;
    const value = leadDraft[field] ?? '';
    return (
      <div className="rounded-lg border border-gray-200 p-3">
        <div className="mb-1 flex items-center justify-between gap-2">
          <label className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</label>
          {!editing && editable && (
            <button onClick={() => setEditingLeadField(field)} className="text-xs font-medium text-blue-600 hover:text-blue-800">
              Edit
            </button>
          )}
        </div>
        {editing ? (
          <div className="flex gap-2">
            <input
              type={type}
              value={value}
              onChange={(event) => setLeadDraft((current) => ({ ...current, [field]: event.target.value }))}
              className="min-w-0 flex-1 rounded border border-blue-300 px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button onClick={() => saveLeadField(field)} className="rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700">Save</button>
            <button onClick={() => { setLeadDraft(lead); setEditingLeadField(null); }} className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600 hover:bg-gray-200">Cancel</button>
          </div>
        ) : (
          <p className="min-h-5 break-words text-sm text-gray-900">{value || '—'}</p>
        )}
        {!editable && (
          <p className="mt-1 text-[11px] text-gray-400">Branch Manager/CEO only</p>
        )}
      </div>
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save status and priority to lead record
      if (lead?.id && (leadDraft.status || leadDraft.priority)) {
        await fetch(`/api/leads/${lead.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: leadDraft.status || undefined,
            priority: leadDraft.priority || undefined,
          }),
        });
      }
      await onSaveProspect();
      window.toast.success('Prospect data saved successfully.');
    } catch (error) {
      console.error('Error saving:', error);
      window.toast.error('Failed to save data');
    } finally {
      setSaving(false);
    }
  };

  // "Continue to Quotation" must actually persist the Lead Status/Priority
  // picked in Lead Progression, not just move the wizard forward — the button
  // used to call onNext directly, so a status/priority chosen here was only
  // ever saved if the person separately clicked "Save Draft" first, and the
  // lead record could silently keep its old status/priority even after the
  // wizard had moved on to Quotation.
  const handleContinueToQuotation = async () => {
    if (lead?.id) {
      try {
        await fetch(`/api/leads/${lead.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: leadDraft.status, priority: leadDraft.priority }),
        });
      } catch (error) {
        console.error('Error saving lead status/priority before continuing:', error);
        window.toast.error('Failed to save lead status/priority. Please try again.');
        return;
      }
    }
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <Target className="mr-3 text-blue-600" size={28} />
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Prospect Stage</h3>
          <p className="text-gray-600 text-sm">Identify and qualify the opportunity</p>
        </div>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-blue-950">Counselor workspace</h4>
            <p className="text-sm text-blue-800">Review and correct lead details here. Each field saves immediately, so you can fix data without leaving the flow.</p>
          </div>
          <span className="rounded bg-white px-3 py-1 text-xs font-medium text-blue-700">Lead #{lead?.id || '—'}</span>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {leadField('fname', 'First name')}
          {leadField('lname', 'Last name')}
          {leadField('email', 'Email', 'email', canEditContactInfo)}
          {leadField('mobile', 'Mobile', 'text', canEditContactInfo)}
          {leadField('phone', 'Phone', 'text', canEditContactInfo)}
          {leadField('nationality', 'Nationality')}
          {/* Country interest — dropdown */}
          <div className="rounded-lg border border-gray-200 p-3">
            <div className="mb-1 flex items-center justify-between gap-2">
              <label className="text-xs font-medium uppercase tracking-wide text-gray-500">Country interest</label>
              {editingLeadField !== 'country_interest' && (
                <button onClick={() => setEditingLeadField('country_interest')} className="text-xs font-medium text-blue-600 hover:text-blue-800">Edit</button>
              )}
            </div>
            {editingLeadField === 'country_interest' ? (
              <div className="flex gap-2">
                <SearchableSelect
                  value={leadDraft.country_interest ?? ''}
                  onChange={e => setLeadDraft(cur => ({ ...cur, country_interest: e.target.value }))}
                  className="min-w-0 flex-1 rounded border border-blue-300 px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
                  autoFocus
                >
                  <option value="">Select country</option>
                  {countries.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </SearchableSelect>
                <button onClick={() => saveLeadField('country_interest')} className="rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700">Save</button>
                <button onClick={() => { setLeadDraft(lead); setEditingLeadField(null); }} className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600 hover:bg-gray-200">Cancel</button>
              </div>
            ) : (
              <p className="min-h-5 break-words text-sm text-gray-900">
                {lead?.country_interest_label || countries.find(c => String(c.id) === String(leadDraft.country_interest))?.name || leadDraft.country_interest || '—'}
              </p>
            )}
          </div>

          {/* Service interest — dropdown */}
          <div className="rounded-lg border border-gray-200 p-3">
            <div className="mb-1 flex items-center justify-between gap-2">
              <label className="text-xs font-medium uppercase tracking-wide text-gray-500">Service interest</label>
              {editingLeadField !== 'service_interest' && (
                <button onClick={() => setEditingLeadField('service_interest')} className="text-xs font-medium text-blue-600 hover:text-blue-800">Edit</button>
              )}
            </div>
            {editingLeadField === 'service_interest' ? (
              <div className="flex gap-2">
                <SearchableSelect
                  value={leadDraft.service_interest ?? ''}
                  onChange={e => setLeadDraft(cur => ({ ...cur, service_interest: e.target.value }))}
                  className="min-w-0 flex-1 rounded border border-blue-300 px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
                  autoFocus
                >
                  <option value="">Select program</option>
                  {programs.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </SearchableSelect>
                <button onClick={() => saveLeadField('service_interest')} className="rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700">Save</button>
                <button onClick={() => { setLeadDraft(lead); setEditingLeadField(null); }} className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600 hover:bg-gray-200">Cancel</button>
              </div>
            ) : (
              <p className="min-h-5 break-words text-sm text-gray-900">
                {lead?.service_interest_label || programs.find(p => String(p.id) === String(leadDraft.service_interest))?.name || leadDraft.service_interest || '—'}
              </p>
            )}
          </div>
          {leadField('address', 'Address')}
          {leadField('market_source', 'Lead source')}
          {leadField('priority', 'Lead priority')}
          {leadField('lead_remark', 'Counselor remarks')}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 rounded-lg border border-gray-200 bg-white p-4 text-sm md:grid-cols-4">
        <div><span className="block text-xs text-gray-500">Branch</span><span className="font-medium text-gray-900">{lead?.branch_name || lead?.dmBranch?.name || '—'}</span></div>
        <div><span className="block text-xs text-gray-500">Assigned counselor</span><span className="font-medium text-gray-900">{lead?.counselor_name || lead?.dmEmployeeByCoUNSILOR?.name || '—'}</span></div>
        <div><span className="block text-xs text-gray-500">Current status</span><span className="font-medium text-gray-900">{lead?.status || 'New'}</span></div>
        <div><span className="block text-xs text-gray-500">Current package value</span><span className="font-medium text-gray-900">{lead?.payTotal || '0'}</span></div>
      </div>

      {/* Mandatory Lead Status & Priority */}
      <div className="rounded-lg border border-amber-300 bg-amber-50 p-5">
        <div className="mb-3">
          <h4 className="font-semibold text-amber-950">Lead Progression (Required)</h4>
          <p className="text-sm text-amber-800">Update the lead status and priority before continuing to the next stage.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Lead Status *</label>
            <SearchableSelect
              value={leadDraft.status || ''}
              onChange={(e) => setLeadDraft((prev) => ({ ...prev, status: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select status</option>
              <option value="Prospect">Prospect</option>
              <option value="Not Interested">Not Interested</option>
              <option value="DNQ">DNQ</option>
              <option value="Not_answered">Not Answered</option>
              <option value="Could Not Connect">Could Not Connect</option>
              <option value="Call Back">Call Back</option>
              <option value="Abroad Lead">Abroad Lead</option>
              <option value="Junk">Junk</option>
              <option value="Duplicate">Duplicate</option>
            </SearchableSelect>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Lead Priority *</label>
            <SearchableSelect
              value={leadDraft.priority || ''}
              onChange={(e) => setLeadDraft((prev) => ({ ...prev, priority: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select priority</option>
              <option value="P1">P1 - Payment Expected in a week</option>
              <option value="P2">P2 - Discussions going on can close by Month End</option>
              <option value="P3">P3 - Developing Interest</option>
              <option value="P4">P4 - Not sure when to start / Future Interest</option>
            </SearchableSelect>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-semibold text-lg mb-4 text-gray-900">Opportunity Information</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Opportunity Name *</label>
              <input
                type="text"
                value={data.opportunityName}
                onChange={(e) => setData({ ...data, opportunityName: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter opportunity name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Opportunity Type *</label>
              <SearchableSelect
                value={data.opportunityType}
                onChange={(e) => setData({ ...data, opportunityType: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="new_business">New Business</option>
                <option value="upsell">Upsell</option>
                <option value="renewal">Renewal</option>
                <option value="referral">Referral</option>
              </SearchableSelect>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Value *</label>
              <input
                type="number"
                value={data.estimatedValue}
                onChange={(e) => setData({ ...data, estimatedValue: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority *</label>
              <SearchableSelect
                value={data.priority}
                onChange={(e) => setData({ ...data, priority: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </SearchableSelect>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-semibold text-lg mb-4 text-gray-900">Service Requirements</h4>
          <div className="space-y-4">
            {/* Service Required dropdown removed — the program is already
                set via "Service interest" in the Counselor workspace above;
                data.serviceRequired/serviceId stay in sync with it via the
                effect above instead of a second, duplicate picker here. */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <span className="block text-xs font-medium uppercase tracking-wide text-gray-500">Service Required</span>
              <p className="mt-1 text-sm text-gray-900">{data.serviceRequired || 'Set "Service interest" in the Counselor workspace above.'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Remarks (crm_remarks)</label>
              <div className="space-y-2 rounded-lg border border-gray-300 p-3">
                {loadingRemarks && <p className="text-sm text-gray-400">Loading remarks…</p>}
                {!loadingRemarks && remarksLog.length === 0 && (
                  <p className="text-sm text-gray-400">No remarks recorded for this lead yet.</p>
                )}
                {remarksLog.map((entry) => (
                  <div key={entry.id} className="rounded border border-gray-100 bg-gray-50 p-2">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="font-medium text-gray-700">{entry.actorName || 'System'}</span>
                      <span>{new Date(entry.created_at).toLocaleString()}</span>
                    </div>
                    <p className="mt-1 text-sm text-gray-900">{entry.remark}</p>
                  </div>
                ))}
                {!loadingRemarks && remarksLog.length < remarksTotal && (
                  <button
                    type="button"
                    onClick={loadMoreRemarks}
                    disabled={loadingMoreRemarks}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50"
                  >
                    {loadingMoreRemarks ? 'Loading…' : `Read more (${remarksTotal - remarksLog.length} more)`}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Fee Package Summary ── */}
      {feeLoading && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700 animate-pulse flex items-center gap-2">
          <RefreshCw size={16} className="animate-spin" /> Loading fee package for this service &amp; country…
        </div>
      )}

      {feeData && !feeLoading && (() => {
        const { upfrontTotal, monthlyTotal, stageTotal } = getFeePackageTotals(feeData);
        const cur = feeData.currencyCode || 'AED';
        const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        // A package is only a real, distinct option when crm_fee actually has
        // data for that structure — not just whenever the shared upfront/prof
        // fee rows are non-zero (otherwise stage/monthly buttons show up as
        // fake duplicates of the upfront total for the ~90% of fee records
        // that never populate a monthly or stage breakdown).
        const stageExtra = Number(feeData.firstStage) + Number(feeData.secondStage) + Number(feeData.thirdStage) + Number(feeData.forthStage) + Number(feeData.fifthStage);
        const monthlyExtra = Number(feeData.firstMonth) + Number(feeData.secondMonth) + Number(feeData.thirdMonth);

        const packages: Array<{ key: 'upfront' | 'monthly' | 'stage'; label: string; total: number; rows: Array<{ label: string; amount: number }> }> = ([
          {
            key: 'upfront' as const,
            label: 'Upfront Package',
            total: upfrontTotal,
            rows: [
              { label: 'Upfront Fee', amount: Number(feeData.upfront) },
            ].filter(r => r.amount > 0),
            include: upfrontTotal > 0,
          },
          {
            key: 'stage' as const,
            label: 'Stage-wise Package',
            total: stageTotal,
            rows: [
              { label: 'Stage 1', amount: Number(feeData.firstStage) },
              { label: 'Stage 2', amount: Number(feeData.secondStage) },
              { label: 'Stage 3', amount: Number(feeData.thirdStage) },
              { label: 'Stage 4', amount: Number(feeData.forthStage) },
              { label: 'Stage 5', amount: Number(feeData.fifthStage) },
            ].filter(r => r.amount > 0),
            include: stageExtra > 0,
          },
          {
            key: 'monthly' as const,
            label: 'Monthly Package',
            total: monthlyTotal,
            rows: [
              { label: 'Month 1', amount: Number(feeData.firstMonth) },
              { label: 'Month 2', amount: Number(feeData.secondMonth) },
              { label: 'Month 3', amount: Number(feeData.thirdMonth) },
            ].filter(r => r.amount > 0),
            include: monthlyExtra > 0,
          },
        ] as Array<{ key: 'upfront' | 'monthly' | 'stage'; label: string; total: number; rows: Array<{ label: string; amount: number }>; include: boolean }>).filter(pkg => pkg.include);

        return (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-semibold text-emerald-950">Fee Package from CRM</h4>
                <p className="text-xs text-emerald-700 mt-0.5">
                  {feeData.serviceName} · {feeData.countryName}{feeData.branchName ? ` · ${feeData.branchName}` : ''}
                </p>
              </div>
              <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded text-xs font-medium">{cur}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {packages.map(pkg => {
                const isSelected = paymentType === pkg.key;
                return (
                  <button
                    key={pkg.key}
                    type="button"
                    onClick={() => {
                      setPaymentType(pkg.key);
                      setData({ ...data, estimatedValue: String(pkg.total) });
                    }}
                    className={`text-left rounded-lg border-2 p-3 transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-white shadow'
                        : 'border-gray-200 bg-white hover:border-emerald-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{pkg.label}</span>
                      {isSelected && <span className="text-xs bg-emerald-500 text-white px-1.5 py-0.5 rounded">Selected</span>}
                    </div>
                    <div className="space-y-1 mb-2">
                      {pkg.rows.map(r => (
                        <div key={r.label} className="flex justify-between text-xs text-gray-600">
                          <span>{r.label}</span>
                          <span>{cur} {fmt(r.amount)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-gray-200 pt-1.5 flex justify-between font-bold text-sm text-emerald-800">
                      <span>Total</span>
                      <span>{cur} {fmt(pkg.total)}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {packages.length === 0 && (
              <p className="text-sm text-emerald-700">No fee package found for this service and country.</p>
            )}
          </div>
        );
      })()}

      {!feeData && !feeLoading && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertCircle className="inline mr-2" size={16} />
          No fee package found in CRM for this service &amp; country. Enter the estimated value manually.
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircle className="mr-2 text-blue-600" size={20} />
          <span className="text-sm text-blue-800">Lead Status must be set to "Prospect" and Lead Priority to "P1" before continuing to Quotation.</span>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 flex items-center font-medium"
        >
          <Save className="mr-2" size={20} />
          {saving ? 'Saving...' : 'Save Draft'}
        </button>
        <button
          onClick={handleContinueToQuotation}
          disabled={!data.opportunityName || !data.estimatedValue || !data.serviceRequired || leadDraft.status !== 'Prospect' || leadDraft.priority !== 'P1'}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center font-medium"
        >
          Continue to Quotation
          <ChevronRight className="ml-2" size={20} />
        </button>
      </div>
    </div>
  );
}

function QuotationStage({ lead, data, setData, feeData, feeLoading, retentionData, requestingDiscount, onRequestDiscount, onRefreshDiscount, onDiscountChanged, onNext, onPrevious, paymentType, setPaymentType }: any) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [appliedFeeKey, setAppliedFeeKey] = useState<string | null>(null);
  // Correcting a wrong amount / wrongly-approved-or-rejected discount -
  // temporarily unlocks the amount field even though a request already
  // exists, so a counselor can fix a mistake without needing Branch
  // Manager/CEO to do it for them.
  const [isReapplying, setIsReapplying] = useState(false);
  const currencyCode = feeData?.currencyCode || 'AED';
  // Live discount-approval tier thresholds (staff-editable in Discount
  // Management) - fetched so the counselor sees the real, current tier
  // instead of an assumed 20/30 split baked into the UI.
  const [tierThresholds, setTierThresholds] = useState<DiscountTierThresholds>(DEFAULT_DISCOUNT_TIER_THRESHOLDS);
  useEffect(() => {
    fetch('/api/discount-approvals/tier-config')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => { if (json?.data) setTierThresholds(json.data); })
      .catch(() => {});
  }, []);
  // Tax treatment depends on the lead's own branch, not the fee's billing
  // currency: Dubai/Abu Dhabi charge 5% VAT, India charges 18% GST, Qatar and
  // Kuwait charge nothing.
  const branchDetails = getLeadBranchDetails(lead);
  const nameBasedVatInfo = getBranchTaxInfo(`${branchDetails.branchName} ${branchDetails.branchAddress}`);
  // Prefer the branch's own configured VAT/GST % (set in Admin > Branches) once
  // it's been entered; fall back to the name-based guess for branches nobody
  // has configured yet so tax doesn't just go to 0/undefined for them.
  const vatInfo = branchDetails.vatGstPercent !== null
    ? { rate: branchDetails.vatGstPercent / 100, label: nameBasedVatInfo.label }
    : nameBasedVatInfo;
  const vatRate = vatInfo.rate;
  const calculateQuotationTotals = (subtotal: number, discount: number) => {
    const safeSubtotal = Math.max(0, subtotal);
    const safeDiscount = Math.min(Math.max(0, discount || 0), safeSubtotal);
    const taxableAmount = Math.max(0, safeSubtotal - safeDiscount);
    const tax = taxableAmount * vatRate;
    return {
      subtotal: safeSubtotal,
      discount: safeDiscount,
      tax,
      total: taxableAmount + tax,
    };
  };
  // Manual line items are disabled for now — see the button below.
  const SHOW_ADD_ITEM_BUTTON = false;

  // ── Build fee items for the selected payment type ──
  // A quotation line item is the program the client is buying, not our
  // internal fee-tier breakdown — so this collapses upfront/prof/monthly or
  // stage amounts into a single item described by the selected program
  // (crm_service.name, via feeData.serviceName), priced at the full package total.
  const buildFeeItems = (fee: any, type: 'upfront' | 'monthly' | 'stage') => {
    const upfrontBase = Number(fee.upfront);
    const monthlyExtra = Number(fee.firstMonth) + Number(fee.secondMonth) + Number(fee.thirdMonth);
    const stageExtra = Number(fee.firstStage) + Number(fee.secondStage) + Number(fee.thirdStage) + Number(fee.forthStage) + Number(fee.fifthStage);
    const total = type === 'upfront' ? upfrontBase : type === 'monthly' ? monthlyExtra : stageExtra;
    if (total <= 0) return [];
    return [{ description: fee.serviceName || 'Program Fee', quantity: 1, unitPrice: String(total), total: String(total) }];
  };

  // ── Auto-populate line items when fee data or payment type changes ──
  useEffect(() => {
    if (!feeData) return;
    const key = `${feeData.id}-${paymentType}`;
    if (appliedFeeKey === key) return;

    const items = buildFeeItems(feeData, paymentType);
    if (items.length === 0) return;

    const totals = calculateQuotationTotals(
      items.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0),
      data.discount || 0
    );

    setData({ ...data, items, ...totals });
    setAppliedFeeKey(key);
  }, [feeData, paymentType]);

  const handleSave = async () => {
    setSaving(true);
    try {
      console.log('Saving quotation data:', data);
      await new Promise(resolve => setTimeout(resolve, 500));
      window.toast.success('Quotation saved successfully!');
    } catch (error) {
      console.error('Error saving:', error);
      window.toast.error('Failed to save data');
    } finally {
      setSaving(false);
    }
  };

  const addItem = () => {
    setData({
      ...data,
      items: [...data.items, { description: '', quantity: 1, unitPrice: '', total: '' }]
    });
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...data.items];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === 'quantity' || field === 'unitPrice') {
      const quantity = parseFloat(newItems[index].quantity) || 0;
      const unitPrice = parseFloat(newItems[index].unitPrice) || 0;
      newItems[index].total = (quantity * unitPrice).toFixed(2);
    }

    // Calculate totals
    const totals = calculateQuotationTotals(
      newItems.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0),
      data.discount
    );

    setData({ ...data, items: newItems, ...totals });
  };

  const updateDiscount = (value: string) => {
    const requested = Math.max(0, parseFloat(value) || 0);
    // A discount can never exceed the package's own amount — matches the
    // validateStage check that already blocks "Continue" for this same
    // reason, but catches it immediately as it's typed instead of only when
    // advancing to the next stage.
    const totals = calculateQuotationTotals(data.subtotal, requested);
    setData({ ...data, ...totals });
    onDiscountChanged?.(totals.discount);
  };

  const requiresDiscountApproval = data.discount > 0;
  const discountApproved = !requiresDiscountApproval || retentionData.discountStatus === 'approved';
  const discountStatusLabel = requiresDiscountApproval
    ? retentionData.discountStatus.replace('_', ' ')
    : 'not required';
  // Once a discount is approved (or a request is in flight), lock the amount so
  // it can't be silently changed - the approval was granted for a specific
  // figure, and discountApproved above only checks status, not the amount.
  // Branch Manager/CEO are exempt from this lock: they're the approvers
  // themselves, so they retain the ability to adjust the figure even after a
  // request is pending or already approved.
  const canEditLockedDiscount = isBranchManagerOrCeo(user as any);
  const discountLocked = (retentionData.discountStatus === 'pending' || retentionData.discountStatus === 'approved') && !canEditLockedDiscount && !isReapplying;
  // Only a genuinely existing request (pending/approved/rejected) can be
  // corrected - nothing to replace before the first request is ever made.
  const canReapplyDiscount = ['pending', 'approved', 'rejected'].includes(retentionData.discountStatus) && Boolean(retentionData.discountApprovalId);

  // Display-only: which tier the current amount falls into, purely to decide
  // what the counselor sees (auto-tier shows "Apply Discount" instead of
  // "Request Approval" — same explicit click either way, nothing is ever
  // submitted without the counselor pressing a button). The actual gate that
  // lets them proceed (discountApproved above) is untouched — it still
  // requires the real crm_discount_approvals row to come back 'approved',
  // auto-tier or not, since src/app/api/lead-to-opportunity/route.ts checks
  // for that row regardless of tier.
  const discountPercent = getDiscountPercentage(data.discount, data.subtotal);
  const discountTier = getDiscountTier(data.discount, data.subtotal, tierThresholds);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <FileText className="mr-3 text-blue-600" size={28} />
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Quotation Stage</h3>
            <p className="text-gray-600 text-sm">Generate quotation for the opportunity</p>
          </div>
        </div>
        {feeLoading && (
          <span className="text-sm text-blue-600 animate-pulse">Loading fee package...</span>
        )}
      </div>

      {/* ── Payment Package (read-only here — chosen on the Prospect stage) ── */}
      {feeData && (() => {
        const packageLabel = paymentType === 'stage' ? 'Stage-wise' : paymentType === 'monthly' ? 'Monthly' : 'Upfront Only';
        const packageTotal = paymentType === 'stage'
          ? Number(feeData.firstStage) + Number(feeData.secondStage) + Number(feeData.thirdStage) + Number(feeData.forthStage) + Number(feeData.fifthStage)
          : paymentType === 'monthly'
            ? Number(feeData.firstMonth) + Number(feeData.secondMonth) + Number(feeData.thirdMonth)
            : Number(feeData.upfront);
        return (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <span className="text-sm font-semibold text-blue-900">Payment Package</span>
                <span className="ml-2 text-xs text-blue-600">
                  {feeData.serviceName} · {feeData.countryName}{feeData.branchName ? ` · ${feeData.branchName}` : ''} · {feeData.currencyCode || 'AED'}
                </span>
              </div>
              <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white shadow">
                {packageLabel}
                <span className="ml-1 opacity-80">
                  {(feeData.currencyCode || 'AED')} {packageTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </span>
            </div>
            <p className="text-xs text-blue-600 mt-2">
              Chosen on the Prospect stage. Go back to Prospect to change the package type.
            </p>
          </div>
        );
      })()}

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-semibold text-lg mb-4 text-gray-900">Line Items</h4>
        <div className="space-y-4">
          {data.items.map((item: any, index: number) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                    className="w-full p-2 border rounded-lg"
                    placeholder="Service description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price</label>
                  <input
                    type="number"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>
              <div className="mt-2 text-right">
                <span className="text-sm font-medium text-gray-700">Total: {currencyCode} {item.total || '0.00'}</span>
              </div>
            </div>
          ))}
        </div>
        {/* Hidden for now — line items are auto-populated as a single entry
            from the selected program's fee package; re-enable if/when manual
            extra line items are needed again. */}
        {SHOW_ADD_ITEM_BUTTON && (
          <button onClick={addItem} className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            + Add Item
          </button>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-semibold text-lg mb-4 text-gray-900">Summary</h4>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span className="font-medium">{currencyCode} {data.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Discount:</span>
            <span className="font-medium text-red-600">-{currencyCode} {data.discount.toFixed(2)}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Apply Discount
                {data.discount > 0 && data.subtotal > 0 && (
                  <span className="ml-2 font-normal text-gray-500">
                    ({discountPercent.toFixed(1)}% of package value)
                  </span>
                )}
              </label>
              <input
                type="number"
                min="0"
                max={data.subtotal}
                // Render blank instead of a literal 0 so typing doesn't require
                // deleting a pre-filled zero first — the underlying value stays
                // 0 for calculations until the user actually enters a number.
                value={data.discount || ''}
                onChange={(e) => updateDiscount(e.target.value)}
                disabled={discountLocked}
                className="w-full p-2 border rounded-lg disabled:bg-gray-100 disabled:text-gray-500"
                placeholder="0.00"
              />
              {discountLocked ? (
                <p className="text-xs text-gray-500 mt-1">
                  {retentionData.discountStatus === 'approved'
                    ? 'Discount approved and locked. Changing the amount requires a new approval.'
                    : 'A discount request is pending approval and can\'t be changed until reviewed.'}
                </p>
              ) : (
                <p className="text-xs text-gray-500 mt-1">
                  Cannot exceed the package amount ({currencyCode} {data.subtotal.toFixed(2)}).
                </p>
              )}
            </div>
            <div className="flex items-end gap-3">
              <span className={`px-3 py-2 rounded-lg text-sm font-medium capitalize ${
                discountApproved ? 'bg-green-100 text-green-700' :
                retentionData.discountStatus === 'rejected' ? 'bg-red-100 text-red-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                Discount approval: {discountStatusLabel}
              </span>
              {requiresDiscountApproval && discountTier === 'auto' && retentionData.discountStatus !== 'approved' && retentionData.discountStatus !== 'pending' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onRequestDiscount(isReapplying);
                      setIsReapplying(false);
                    }}
                    disabled={requestingDiscount}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="mr-2" size={16} />
                    {requestingDiscount ? 'Applying...' : isReapplying ? 'Submit Correction' : 'Apply Discount'}
                  </button>
                  <span className="text-xs text-gray-500">0-{tierThresholds.autoMaxPercent}% needs no sign-off</span>
                </div>
              )}
              {requiresDiscountApproval && discountTier !== 'auto' && retentionData.discountStatus !== 'approved' && retentionData.discountStatus !== 'pending' && (
                <button
                  onClick={() => {
                    onRequestDiscount(isReapplying);
                    setIsReapplying(false);
                  }}
                  disabled={requestingDiscount}
                  className="px-4 py-2 bg-[var(--cmg-blue)] text-white rounded-lg hover:bg-[var(--cmg-blue-dark)] flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="mr-2" size={16} />
                  {requestingDiscount ? 'Submitting...' : isReapplying ? 'Submit Correction' : 'Request Approval'}
                </button>
              )}
              {requiresDiscountApproval && discountTier !== 'auto' && retentionData.discountStatus === 'pending' && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-yellow-700">
                    Pending Branch Manager or CEO approval. All next opportunity stages are locked until approval.
                  </span>
                  <button
                    onClick={onRefreshDiscount}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center"
                  >
                    <RefreshCw className="mr-2" size={16} />
                    Refresh Status
                  </button>
                </div>
              )}
              {canReapplyDiscount && !isReapplying && !canEditLockedDiscount && (
                <button
                  onClick={() => setIsReapplying(true)}
                  className="px-4 py-2 border border-amber-300 bg-white text-amber-700 rounded-lg hover:bg-amber-50 flex items-center text-sm font-medium"
                  title="Use this if the discount amount was entered wrong, or the wrong amount got approved/rejected"
                >
                  <RefreshCw className="mr-2" size={14} />
                  Amount wrong? Request a correction
                </button>
              )}
              {isReapplying && (
                <button
                  onClick={async () => {
                    setIsReapplying(false);
                    // Restore the real, still-approved amount/status from the
                    // database in case the field was edited but never submitted.
                    await onRefreshDiscount?.();
                  }}
                  className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
                >
                  Cancel correction
                </button>
              )}
            </div>
          </div>
          <div className="flex justify-between">
            <span>Tax ({(vatInfo.rate * 100).toFixed(0)}% {vatInfo.label}):</span>
            <span className="font-medium">{currencyCode} {data.tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold border-t pt-2">
            <span>Total:</span>
            <span className="text-blue-600">{currencyCode} {data.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onPrevious}
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center font-medium"
        >
          <ChevronLeft className="mr-2" size={20} />
          Back to Prospect
        </button>
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 flex items-center font-medium"
          >
            <Save className="mr-2" size={20} />
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            onClick={onNext}
            disabled={!discountApproved}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center font-medium"
          >
            Continue to Payment
            <ChevronRight className="ml-2" size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

function PaymentStage({ lead, data, setData, quotationTotal, quotationTax, quotationDiscount, opportunityId, onEnsureOpportunity, discountPending, discountStatus, onRefreshDiscount, onNext, onPrevious }: any) {
  const { user, currencyCode } = useAuth();
  const [saving, setSaving] = useState(false);
  const [receipt, setReceipt] = useState<any>(null);
  const [printingReceipt, setPrintingReceipt] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [checkingDiscount, setCheckingDiscount] = useState(false);
  // Once a receipt has been generated, only Branch Manager/CEO may still
  // change the payment details — a counselor's view of that receipt becomes
  // read-only so they can't alter what's already been issued to the client.
  const canEditAfterReceipt = isBranchManagerOrCeo(user as any);
  const receiptLocked = Boolean(receipt) && !canEditAfterReceipt;

  const normalizeReceiptForUi = (payment: any) => ({
    ...payment,
    accountantStatus: payment.accountantStatus || (payment.status === 'verified' || payment.status === 'rejected' ? payment.status : 'pending'),
    receiptNumber: payment.receiptNumber || payment.paymentNumber,
    paidAmount: payment.paidAmount ?? payment.amount ?? 0,
    remainingBalance: payment.remainingBalance ?? payment.balanceAmount ?? 0,
  });

  const syncPaymentDataFromReceipt = (payment: any) => {
    setData((current: PaymentData) => {
      const totalAmount = Number(payment?.totalAmount || current.totalAmount || quotationTotal || payment?.amount || current.paidAmount || 0);
      const paidAmount = Number(payment?.paidAmount ?? payment?.amount ?? current.paidAmount ?? 0);
      const remainingBalance = Number(payment?.remainingBalance ?? payment?.balanceAmount ?? Math.max(totalAmount - paidAmount, 0));

      return {
        ...current,
        totalAmount,
        paidAmount,
        remainingBalance,
        paymentMethod: payment?.paymentMethod || current.paymentMethod,
        transactionId: payment?.transactionId || current.transactionId,
        paymentDate: payment?.paymentDate ? new Date(payment.paymentDate).toISOString().slice(0, 10) : current.paymentDate,
      };
    });
  };

  useEffect(() => {
    // Once a receipt/payment has actually been recorded for this opportunity,
    // its stored totalAmount/paidAmount/remainingBalance are frozen, authoritative
    // history — what the client was actually charged, including whatever
    // discount was approved at that moment. A later live recalculation of
    // quotationTotal (e.g. the discount-approval refresh effect, or simply
    // re-deriving the quotation on remount) must never silently overwrite
    // that with today's numbers, or a fully-paid opportunity's balance can
    // flicker back to non-zero just from reopening it.
    if (receipt) return;
    const total = Number(quotationTotal);
    if (Number.isFinite(total) && total > 0 && data.totalAmount !== total) {
      const paidAmount = Math.min(Number(data.paidAmount || 0), total);
      setData({ ...data, totalAmount: total, paidAmount, remainingBalance: Math.max(total - paidAmount, 0) });
    }
  }, [quotationTotal, receipt]);

  // Re-hydrate the receipt banner when this stage remounts (e.g. navigating away
  // to Documents/Agreement and back, or reloading mid-flow). Without this, a
  // receipt that was already created on an earlier visit silently disappears
  // from view, and the user can be misled into clicking Save again - which
  // takes the "opportunity already exists" branch below and POSTs /api/receipts
  // unconditionally, creating a genuine duplicate payment/receipt.
  useEffect(() => {
    if (!opportunityId || receipt) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/opportunity-payments?opportunityId=${opportunityId}&_=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) return;
        const payments = await res.json();
        const latestPayment = Array.isArray(payments) ? payments[0] : payments?.data?.[0];
        if (latestPayment && !cancelled) {
          const normalizedPayment = normalizeReceiptForUi(latestPayment);
          setReceipt(normalizedPayment);
          syncPaymentDataFromReceipt(normalizedPayment);
        }
      } catch (error) {
        console.error('Error re-hydrating receipt:', error);
      }
    })();
    return () => { cancelled = true; };
  }, [opportunityId]);

  // The re-hydration effect above only runs once (it bails out once `receipt`
  // is set), so a receipt that gets verified by Accounts *after* it was
  // loaded here never updates on its own — the Download Receipt button stays
  // hidden even once approved. This lets the counselor pull the latest
  // accountantStatus/remarks on demand instead of reloading the whole page.
  const refreshVerificationStatus = async () => {
    if (!opportunityId) return;
    setCheckingStatus(true);
    try {
      const res = await fetch(`/api/opportunity-payments?opportunityId=${opportunityId}&_=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to check verification status');
      const payments = await res.json();
      const list = Array.isArray(payments) ? payments : payments?.data || [];
      const latestPayment = receipt
        ? list.find((p: any) => p.id === receipt.id || p.paymentNumber === receipt.paymentNumber) || list[0]
        : list[0];
      if (latestPayment) {
        const normalizedPayment = normalizeReceiptForUi(latestPayment);
        setReceipt(normalizedPayment);
        syncPaymentDataFromReceipt(normalizedPayment);
      }
    } catch (error) {
      console.error('Error refreshing verification status:', error);
      window.toast.error('Failed to refresh verification status');
    } finally {
      setCheckingStatus(false);
    }
  };

  const hasProofOfPayment = data.proofOfPayment instanceof File || Boolean(data.proofOfPaymentUrl || receipt?.proofOfPaymentUrl);
  // Preview only — the amount actually recorded is always recomputed
  // server-side from the branch in /api/receipts, never trusted from here.
  const adminFeeBranchDetails = getLeadBranchDetails(lead as any);
  const adminFeeBaseAmount = getAdminFeeAmount(adminFeeBranchDetails.branchName, adminFeeBranchDetails.branchAddress, currencyCode);
  const adminFeeVatRate = getAdminFeeVatRate(adminFeeBranchDetails.branchName, adminFeeBranchDetails.branchAddress);
  const adminFeeVatPreviewAmount = adminFeeBaseAmount * (adminFeeVatRate / 100);
  const adminFeePreviewAmount = adminFeeBaseAmount + adminFeeVatPreviewAmount;

  const ensureProofOfPaymentUrl = async () => {
    if (data.proofOfPaymentUrl) return data.proofOfPaymentUrl;
    if (!(data.proofOfPayment instanceof File)) return '';

    const safeName = data.proofOfPayment.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const blob = await uploadFileToBlob(
      data.proofOfPayment,
      `payment-proofs/lead-${lead.id}/${Date.now()}_${safeName}`
    );
    setData({ ...data, proofOfPaymentUrl: blob.url });
    return blob.url;
  };

  const handleSave = async () => {
    if (!lead?.id) { window.toast.error('Lead data not loaded.'); return; }
    if (!hasProofOfPayment) { window.toast.warning('Upload proof of payment before creating the receipt.'); return; }
    // Re-check discount approval against the database right before creating
    // the receipt, rather than trusting whatever was cached when this stage
    // first loaded - a discount approved (by BM/CEO, or the auto-approve
    // tier) after the page opened would otherwise still read as "not
    // approved" here even though Discount Management already shows it approved.
    if (Number(quotationDiscount) > 0 && discountStatus !== 'approved' && onRefreshDiscount) {
      const freshStatus = await onRefreshDiscount();
      if (freshStatus !== 'approved') {
        window.toast.error(
          freshStatus === 'pending'
            ? 'This discount is still pending approval in Discount Management. It must be approved before a receipt can be created.'
            : 'This discount is not approved in Discount Management yet. It must be approved before a receipt can be created.'
        );
        return;
      }
    }
    setSaving(true);
    try {
      const proofOfPaymentUrl = await ensureProofOfPaymentUrl();
      if (!proofOfPaymentUrl) throw new Error('Proof of payment upload failed');
      const totalAmount = Number(quotationTotal || data.totalAmount || 0);
      const paidAmount = Math.min(Math.max(0, Number(data.paidAmount || 0)), totalAmount);
      const remainingBalance = Math.max(totalAmount - paidAmount, 0);
      // The opportunity may not exist yet at this stage (Payment comes before
      // Documents/Agreement in the flow). Ensuring it here — rather than
      // leaving opportunityId hardcoded to null — is what lets this payment
      // actually count toward the opportunity: Accounts verification, the
      // Invoices & Payments receipt, and the agreement-number lookup all key
      // off crm_opportunity_payments.opportunityId, so a null value made this
      // payment invisible everywhere except this wizard's own local state.
      const hadOpportunityAlready = Boolean(opportunityId);
      const ensuredOpportunityId = await onEnsureOpportunity({ proofOfPaymentUrl, totalAmount, paidAmount, remainingBalance });

      if (!hadOpportunityAlready) {
        // ensureOpportunityForClient() just created the opportunity via
        // /api/lead-to-opportunity, which already recorded this exact payment
        // (it reads the same paymentData this stage holds) — fetch that
        // record back instead of submitting a second, duplicate payment.
        const payRes = await fetch(`/api/opportunity-payments?opportunityId=${ensuredOpportunityId}`);
        const payments = await payRes.json();
        const latestPayment = Array.isArray(payments) ? payments[0] : null;
        const normalizedPayment = latestPayment ? normalizeReceiptForUi(latestPayment) : null;
        setReceipt(normalizedPayment);
        if (normalizedPayment) syncPaymentDataFromReceipt(normalizedPayment);
        window.toast.success(`Receipt ${normalizedPayment?.paymentNumber || ''} created successfully!`);
      } else {
        const res = await fetch('/api/receipts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            leadId: lead.id,
            opportunityId: ensuredOpportunityId,
            paymentData: {
              paymentStructure: data.paymentStructure,
              paymentMethod: data.paymentMethod,
              transactionId: data.transactionId,
              paymentDate: data.paymentDate,
              paidAmount,
              totalAmount,
              amount: paidAmount,
              proofOfPaymentUrl,
              dueDate: data.dueDate || undefined,
              remark: data.remark || undefined,
              adminFeeIncluded: data.adminFeeIncluded || false,
            },
            receiptData: {
              description: `Payment receipt for ${lead.fname} ${lead.lname}`,
              receiptType: 'payment',
              taxAmount: Number(quotationTax) || 0,
              discountAmount: Number(quotationDiscount) || 0,
              notes: '',
            },
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to create receipt');
        const normalizedPayment = normalizeReceiptForUi(json.data?.receipt || json.data || json);
        setReceipt(normalizedPayment);
        syncPaymentDataFromReceipt(normalizedPayment);
        window.toast.success(`Receipt ${json.data?.receipt?.receiptNumber || ''} created successfully!`);
      }
    } catch (error: any) {
      console.error('Error saving payment:', error);
      window.toast.error(error.message || 'Failed to save payment');
    } finally {
      setSaving(false);
    }
  };

  const downloadReceiptPDF = async () => {
    if (!receipt && !data.paidAmount) { window.toast.warning('Save the payment first to generate a receipt.'); return; }
    setPrintingReceipt(true);
    const r = receipt || {};
    const branchDetails = getLeadBranchDetails(lead as any);
    printReceipt({
      receiptNumber: r.receiptNumber,
      paymentNumber: r.paymentNumber,
      paymentDate: r.paymentDate,
      clientName: r.clientName || (lead as any)?.client_actual_name || `${lead?.fname || ''} ${lead?.lname || ''}`.trim() || 'Client',
      email: lead?.email,
      phone: lead?.mobile || lead?.phone,
      passportNumber: (lead as any)?.id_number || '',
      agreementNumber: r.agreementNumber,
      opportunityId,
      serviceName: r.serviceName || (lead as any)?.service_interest_label || lead?.service_interest,
      consultantName: r.consultantName,
      companyName: r.companyName || branchDetails.companyName,
      branchName: r.branchName || branchDetails.branchName,
      branchAddress: r.branchAddress || branchDetails.branchAddress,
      branchEmail: r.branchEmail || branchDetails.branchEmail,
      branchPhone: r.branchPhone || branchDetails.branchPhone,
      licenseNumber: branchDetails.licenseNumber,
      vatGstPercent: branchDetails.vatGstPercent,
      paymentMethod: data.paymentMethod,
      transactionId: data.transactionId,
      currency: r.currency || currencyCode,
      totalAmount: data.totalAmount || r.totalAmount,
      paidAmount: data.paidAmount || r.paidAmount || r.amount,
      remainingBalance: data.remainingBalance,
      remark: r.remark || data.remark,
      adminFeeIncluded: r.adminFeeIncluded ?? data.adminFeeIncluded,
      adminFeeAmount: r.adminFeeAmount ?? (data.adminFeeIncluded ? getAdminFeeAmount(branchDetails.branchName, branchDetails.branchAddress, r.currency || currencyCode) : 0),
    });
    setPrintingReceipt(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <DollarSign className="mr-3 text-blue-600" size={28} />
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Payment Stage</h3>
          <p className="text-gray-600 text-sm">Process payment and configure payment structure</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-semibold text-lg mb-4 text-gray-900">Payment Structure</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Type</label>
              <SearchableSelect
                value={data.paymentStructure}
                onChange={(e) => setData({ ...data, paymentStructure: e.target.value })}
                disabled={receiptLocked}
                className="w-full p-3 border rounded-lg disabled:bg-gray-50 disabled:text-gray-500"
              >
                <option value="full">Full Payment</option>
                <option value="installment">Installment</option>
                <option value="milestone">Milestone Based</option>
              </SearchableSelect>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Total Amount</label>
              <input
                type="number"
                value={quotationTotal}
                readOnly
                className="w-full p-3 border rounded-lg bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Amount Paid</label>
              <input
                type="number"
                value={data.paidAmount || ''}
                onChange={(e) => {
                  const paid = parseFloat(e.target.value) || 0;
                  setData({ ...data, paidAmount: paid, remainingBalance: quotationTotal - paid });
                }}
                disabled={receiptLocked}
                placeholder="0"
                className="w-full p-3 border rounded-lg disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Remaining Balance</label>
              <input
                type="number"
                value={data.remainingBalance}
                readOnly
                className="w-full p-3 border rounded-lg bg-gray-50"
              />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-semibold text-lg mb-4 text-gray-900">Payment Details</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
              <SearchableSelect
                value={data.paymentMethod}
                onChange={(e) => setData({ ...data, paymentMethod: e.target.value })}
                disabled={receiptLocked}
                className="w-full p-3 border rounded-lg disabled:bg-gray-50 disabled:text-gray-500"
              >
                <option value="cash">Cash</option>
                <option value="credit_card">Credit Card</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cheque">Cheque</option>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Transaction ID</label>
              <input
                type="text"
                value={data.transactionId}
                onChange={(e) => setData({ ...data, transactionId: e.target.value })}
                disabled={receiptLocked}
                className="w-full p-3 border rounded-lg disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="Enter transaction reference"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Date</label>
              <input
                type="date"
                value={data.paymentDate}
                onChange={(e) => setData({ ...data, paymentDate: e.target.value })}
                disabled={receiptLocked}
                className="w-full p-3 border rounded-lg disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Balance Due Date</label>
              <input
                type="date"
                value={data.dueDate}
                onChange={(e) => setData({ ...data, dueDate: e.target.value })}
                disabled={receiptLocked}
                className="w-full p-3 border rounded-lg disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="When the remaining balance is due"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Proof of Payment <span className="text-red-500">*</span></label>
              {data.proofOfPayment instanceof File ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                  <span className="text-sm text-green-800 truncate flex-1">{data.proofOfPayment.name}</span>
                  {!receiptLocked && (
                    <button
                      type="button"
                      onClick={() => setData({ ...data, proofOfPayment: null, proofOfPaymentUrl: null })}
                      className="text-red-500 hover:text-red-700 text-xs shrink-0"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ) : (
                <label className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg transition-colors ${receiptLocked ? 'border-gray-200 bg-gray-50 cursor-not-allowed' : 'border-gray-300 cursor-pointer hover:border-blue-400 hover:bg-blue-50'}`}>
                  <Upload className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Choose file</span>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    className="hidden"
                    disabled={receiptLocked}
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setData({ ...data, proofOfPayment: file, proofOfPaymentUrl: null });
                    }}
                  />
                </label>
              )}
            </div>
          </div>
        </div>
      </div>

      {adminFeePreviewAmount > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={data.adminFeeIncluded}
              onChange={(e) => setData({ ...data, adminFeeIncluded: e.target.checked })}
              disabled={receiptLocked}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium text-gray-700">
              Include Admin Fee (+{currencyCode} {adminFeeBaseAmount}{adminFeeVatRate > 0 ? ` + ${currencyCode} ${adminFeeVatPreviewAmount.toFixed(0)} VAT (${adminFeeVatRate}%)` : ''} = {currencyCode} {adminFeePreviewAmount.toFixed(0)} on the printed receipt)
            </span>
          </label>
          <p className="text-xs text-gray-500 mt-1 ml-7">
            Added as a separate line on the receipt — does not change the client's package balance.
          </p>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Remark</label>
        <textarea
          value={data.remark}
          onChange={(e) => setData({ ...data, remark: e.target.value })}
          rows={3}
          disabled={receiptLocked}
          className="w-full p-3 border rounded-lg disabled:bg-gray-50 disabled:text-gray-500"
          placeholder="Notes about this payment or the remaining balance..."
        />
      </div>

      {receipt && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
          <div>
            <div className="font-semibold text-green-800">Receipt Created: {receipt.receiptNumber || receipt.paymentNumber}</div>
            <div className="text-sm text-green-700">Amount: {receipt.currency || currencyCode} {Number(receipt.paidAmount || receipt.amount || 0).toLocaleString()}</div>
            {receipt.agreementNumber && (
              <div className="text-sm text-green-700">Agreement Number: <span className="font-medium">{receipt.agreementNumber}</span></div>
            )}
            {receiptLocked && (
              <div className="text-xs text-amber-700 mt-1 flex items-center gap-1">
                <Lock size={12} /> Locked — only Branch Manager or CEO can edit a receipt after it's generated.
              </div>
            )}
          </div>
          {receipt.accountantStatus === 'verified' ? (
            <div className="flex items-center gap-2">
              <button onClick={downloadReceiptPDF} disabled={printingReceipt}
                className="px-4 py-2 bg-green-700 text-white rounded-lg text-sm hover:bg-green-800 flex items-center gap-2 disabled:opacity-60">
                <Download size={16}/> {printingReceipt ? 'Opening…' : 'Download Receipt PDF'}
              </button>
              {opportunityId && (
                <button onClick={() => window.open(`/admin/leads/receipt/${opportunityId}`, '_blank')}
                  className="px-4 py-2 border border-green-700 text-green-700 rounded-lg text-sm hover:bg-green-50 flex items-center gap-2">
                  <FileText size={16}/> Open Receipt Page
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-amber-700 bg-amber-100 border border-amber-200 rounded-full px-3 py-1.5">
                Awaiting accounts verification
              </span>
              <button onClick={refreshVerificationStatus} disabled={checkingStatus}
                className="px-3 py-1.5 border border-amber-300 text-amber-800 rounded-lg text-xs hover:bg-amber-100 flex items-center gap-1.5 disabled:opacity-60">
                <RefreshCw size={13} className={checkingStatus ? 'animate-spin' : ''}/> {checkingStatus ? 'Checking…' : 'Check Status'}
              </button>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between">
        <button
          onClick={onPrevious}
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center font-medium"
        >
          <ChevronLeft className="mr-2" size={20} />
          Back to Quotation
        </button>
        <div className="flex gap-3">
          {receipt?.accountantStatus === 'verified' && (
            <button
              onClick={downloadReceiptPDF}
              disabled={printingReceipt}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 flex items-center font-medium"
            >
              <Receipt className="mr-2" size={20} />
              {printingReceipt ? 'Opening…' : 'Print Receipt'}
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving || receiptLocked || !hasProofOfPayment}
            title={receiptLocked ? 'Only Branch Manager or CEO can edit a receipt after it\'s generated.' : !hasProofOfPayment ? 'Upload proof of payment before creating the receipt.' : undefined}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center font-medium"
          >
            {receiptLocked ? <Lock className="mr-2" size={20} /> : <Save className="mr-2" size={20} />}
            {saving ? 'Saving…' : receiptLocked ? 'Receipt Locked' : 'Save & Create Receipt'}
          </button>
          <button
            onClick={() => {
              if (receipt) syncPaymentDataFromReceipt(receipt);
              onNext();
            }}
            disabled={discountPending || !receipt}
            title={discountPending ? 'Waiting on discount approval in Discount Management' : !receipt ? 'Save & Create Receipt before continuing' : undefined}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center font-medium"
          >
            Move to Accounts
            <ChevronRight className="ml-2" size={20} />
          </button>
        </div>
        {discountPending && (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} />
              <span>
                A discount was applied to this opportunity and is {discountStatus === 'pending' ? 'still pending' : 'not yet'} approved in Discount Management by a Branch Manager or CEO. This flow can't continue until it's approved.
                {' '}Already approved it? The status here may just be out of date — use Re-check.
              </span>
            </div>
            <button
              type="button"
              onClick={async () => {
                if (!onRefreshDiscount || checkingDiscount) return;
                setCheckingDiscount(true);
                try {
                  const status = await onRefreshDiscount();
                  if (status === 'approved') window.toast.success('Discount is approved — you can continue.');
                  else window.toast.info('Still not approved in Discount Management.');
                } finally {
                  setCheckingDiscount(false);
                }
              }}
              disabled={checkingDiscount}
              className="flex shrink-0 items-center gap-1.5 rounded-md border border-amber-300 bg-white px-3 py-1.5 font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-50"
            >
              <RefreshCw size={14} className={checkingDiscount ? 'animate-spin' : ''} />
              {checkingDiscount ? 'Checking…' : 'Re-check'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function AccountsStage({ lead, leadId, opportunityId, onNext, onPrevious }: any) {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [printingId, setPrintingId] = useState<number | null>(null);

  const fetchPayments = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      let resolvedOpportunityId = Number(opportunityId || lead?.opportunity_id || 0) || null;
      if (!resolvedOpportunityId) {
        const oppRes = await fetch(`/api/opportunities?leadId=${leadId}&_=${Date.now()}`, { cache: 'no-store' });
        const opps = await oppRes.json();
        const opp = Array.isArray(opps) ? opps[0] : null;
        resolvedOpportunityId = opp?.id ? Number(opp.id) : null;
      }
      if (!resolvedOpportunityId) {
        setPayments([]);
        return;
      }

      const payRes = await fetch(`/api/opportunity-payments?opportunityId=${resolvedOpportunityId}&_=${Date.now()}`, { cache: 'no-store' });
      const pays = await payRes.json();
      const list = Array.isArray(pays) ? pays : pays.data || [];

      // Keep the wizard in sync with the Accounts team's verification screen:
      // both `accountantStatus` and `status` have been used historically for
      // review state, and receiptNumber is often stored as paymentNumber.
      setPayments(list.map((p: any) => ({
        ...p,
        accountantStatus: p.accountantStatus || (p.status === 'verified' || p.status === 'rejected' ? p.status : 'pending'),
        receiptNumber: p.receiptNumber || p.paymentNumber,
        paidAmount: p.paidAmount ?? p.amount ?? 0,
        remainingBalance: p.remainingBalance ?? p.balanceAmount ?? 0,
      })));
    } catch (err) {
      console.error('Error fetching payments:', err);
    } finally {
      setLoading(false);
      if (isManualRefresh) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId, opportunityId]);

  const printReceiptPDF = (p: any) => {
    setPrintingId(p.id);
    const branchDetails = getLeadBranchDetails(lead as any);
    printReceipt({
      receiptNumber: p.receiptNumber,
      paymentNumber: p.paymentNumber,
      paymentDate: p.paymentDate,
      clientName: p.clientName || (lead as any)?.client_actual_name || `${lead?.fname || ''} ${lead?.lname || ''}`.trim(),
      email: p.clientEmail || lead?.email,
      phone: p.clientPhone || lead?.mobile || lead?.phone,
      passportNumber: (lead as any)?.id_number || '',
      agreementNumber: p.agreementNumber,
      opportunityId,
      serviceName: p.serviceName || (lead as any)?.service_interest_label || lead?.service_interest,
      consultantName: p.consultantName,
      companyName: p.companyName || branchDetails.companyName,
      branchName: p.branchName || branchDetails.branchName,
      branchAddress: p.branchAddress || branchDetails.branchAddress,
      branchEmail: p.branchEmail || branchDetails.branchEmail,
      branchPhone: p.branchPhone || branchDetails.branchPhone,
      licenseNumber: branchDetails.licenseNumber,
      vatGstPercent: branchDetails.vatGstPercent,
      paymentMethod: p.paymentMethod,
      transactionId: p.transactionId,
      currency: p.currency,
      totalAmount: p.totalAmount,
      paidAmount: p.paidAmount,
      remainingBalance: p.remainingBalance ?? p.balanceAmount,
      remark: p.remark,
      adminFeeIncluded: p.adminFeeIncluded,
      adminFeeAmount: p.adminFeeAmount,
    });
    setPrintingId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading payment data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Receipt className="mr-3 text-blue-600" size={28} />
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Accounts Verification</h3>
            <p className="text-gray-600 text-sm">Read-only status — reviewed by the Accounts team, not from this wizard</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchPayments(true)}
            disabled={refreshing}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-2 font-medium disabled:opacity-60"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} /> {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {payments.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-10 h-10 text-yellow-500 mx-auto mb-3" />
          <p className="text-yellow-800 font-medium">No payment records found</p>
          <p className="text-yellow-600 text-sm mt-1">Complete the payment stage first before accounts verification.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {payments.map((p: any) => (
            <div key={p.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-lg text-gray-900">{p.paymentNumber || `Payment #${p.id}`}</h4>
                  <p className="text-sm text-gray-500">{p.clientName || lead?.fname + ' ' + lead?.lname || 'N/A'} — {p.serviceName || 'Service'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex px-3 py-1.5 text-sm font-medium rounded-full ${
                    p.accountantStatus === 'verified' ? 'bg-green-100 text-green-800 border border-green-300' :
                    p.accountantStatus === 'rejected' ? 'bg-red-100 text-red-800 border border-red-300' :
                    'bg-yellow-100 text-yellow-800 border border-yellow-300'
                  }`}>
                    {p.accountantStatus === 'verified' && <CheckCircle className="w-4 h-4 mr-1" />}
                    {p.accountantStatus === 'rejected' && <XCircle className="w-4 h-4 mr-1" />}
                    {(p.accountantStatus === 'pending' || !p.accountantStatus) && <Clock className="w-4 h-4 mr-1" />}
                    {(p.accountantStatus || 'pending').charAt(0).toUpperCase() + (p.accountantStatus || 'pending').slice(1)}
                  </span>
                  {p.accountantStatus === 'verified' && (
                    <button
                      onClick={() => printReceiptPDF(p)}
                      disabled={printingId === p.id}
                      className="px-3 py-1.5 bg-green-700 text-white rounded-lg text-xs hover:bg-green-800 flex items-center gap-1.5 disabled:opacity-60"
                    >
                      <Download size={13} /> {printingId === p.id ? 'Opening…' : 'Download Receipt PDF'}
                    </button>
                  )}
                  {p.accountantStatus === 'verified' && p.opportunityId && (
                    <button
                      onClick={() => window.open(`/admin/leads/receipt/${p.opportunityId}`, '_blank')}
                      className="px-3 py-1.5 border border-green-700 text-green-700 rounded-lg text-xs hover:bg-green-50 flex items-center gap-1.5"
                    >
                      <FileText size={13} /> Open Receipt Page
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <span className="text-xs text-gray-500 uppercase">Total Amount</span>
                  <p className="text-lg font-bold text-gray-900">{p.currency || 'AED'} {(p.totalAmount || 0).toLocaleString()}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <span className="text-xs text-green-600 uppercase">Paid Amount</span>
                  <p className="text-lg font-bold text-green-700">{p.currency || 'AED'} {(p.paidAmount || 0).toLocaleString()}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <span className="text-xs text-blue-600 uppercase">Payment Method</span>
                  <p className="text-lg font-bold text-blue-700 capitalize">{(p.paymentMethod || 'N/A').replace('_', ' ')}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-3">
                  <span className="text-xs text-purple-600 uppercase">Payment Status</span>
                  <p className="text-lg font-bold text-purple-700 capitalize">{p.status || 'N/A'}</p>
                </div>
              </div>

              {p.proofOfPaymentUrl && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Proof of Payment: {p.proofOfPaymentUrl.split('/').pop()}</span>
                  </div>
                </div>
              )}

              {p.accountantRemarks && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <span className="text-xs text-blue-600 uppercase font-medium">Accountant Remarks</span>
                  <p className="text-sm text-blue-800 mt-1">{p.accountantRemarks}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircle className="mr-2 text-blue-600" size={20} />
          <span className="text-sm text-blue-800">The Accounts team must verify or reject the payment (via Accounts Verification) before this can proceed to compliance review.</span>
        </div>
      </div>

      <div className="flex justify-between">
        <button onClick={onPrevious} className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center font-medium">
          <ChevronLeft className="mr-2" size={20} />
          Back to Payment
        </button>
        <button
          onClick={onNext}
          disabled={payments.length > 0 && payments.every((p: any) => p.accountantStatus !== 'verified')}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center font-medium"
        >
          Continue to Documents
          <ChevronRight className="ml-2" size={20} />
        </button>
      </div>
    </div>
  );
}

function DocumentsStage({ lead, leadId, onLeadUpdated, data, setData, opportunityId: initialOpportunityId, onEnsureOpportunity, uploadedBy, paymentProofFile, onNext, onPrevious }: any) {
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, 'idle' | 'uploading' | 'done' | 'error'>>({});

  const mandatoryDocs = [
    { key: 'idProof', label: 'ID Proof (Mandatory)', category: 'id_proof' },
    { key: 'passportCopy', label: 'Passport Copy (Mandatory)', category: 'passport' },
    { key: 'counsellorSheet', label: 'Counsellor Sheet (Mandatory)', category: 'counsellor_sheet' },
  ] as const;

  const optionalDocs: { key: string; label: string; category: string }[] = [];

  // Either freshly selected in this session (File objects) or already uploaded
  // server-side in an earlier session (persisted allMandatoryDocsUploaded flag,
  // restored by the wizard's mount-time hydration effect).
  const freshlyUploaded = mandatoryDocs.every(({ key }) => data[key] instanceof File);
  const hasPassportNumber = Boolean(String(data.passportNumber || '').trim());
  const hasClientActualName = Boolean(String(data.clientActualName || '').trim());
  const allMandatoryUploaded = (freshlyUploaded || data.allMandatoryDocsUploaded) && hasPassportNumber && hasClientActualName;

  useEffect(() => {
    if (allMandatoryUploaded !== data.allMandatoryDocsUploaded) {
      setData({ ...data, allMandatoryDocsUploaded: allMandatoryUploaded });
    }
  }, [allMandatoryUploaded]);

  const uploadFileToServer = async (file: File, category: string, oppId: number): Promise<string | null> => {
    // Upload straight from the browser to Vercel Blob (bypasses the ~4.5MB
    // serverless function body limit), then record the metadata separately.
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const blob = await uploadFileToBlob(file, `opportunity-documents/${oppId}/${category}/${Date.now()}_${safeName}`);

    const res = await fetch('/api/opportunity-documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        opportunityId: oppId,
        documentType: category,
        documentName: file.name,
        fileName: safeName,
        filePath: blob.url,
        fileSize: file.size,
        mimeType: file.type || 'application/octet-stream',
        category,
        status: 'uploaded',
        required: true,
        uploadedBy: uploadedBy || 1,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Upload failed for ${file.name}`);
    }
    const result = await res.json();
    return result.filePath || blob.url;
  };

  const handleSave = async () => {
    if (!allMandatoryUploaded) return;
    setSaving(true);
    try {
      // Passport number and client actual name live on the lead record itself
      // (crm_forum_leads.id_number / client_actual_name), not on an
      // opportunity-document row, so they're saved via the same lead-update
      // endpoint the Edit Lead page uses rather than /api/opportunity-documents.
      if (leadId) {
        const leadUpdateRes = await fetch(`/api/leads/${leadId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ passportNumber: data.passportNumber, clientActualName: data.clientActualName }),
        });
        if (!leadUpdateRes.ok) {
          const err = await leadUpdateRes.json().catch(() => ({}));
          throw new Error(err.error || 'Failed to save passport number and client actual name');
        }
        // Keep the wizard's lead state in sync so the client's actual name is
        // immediately available to the Agreement/Signed Agreement stages and
        // any receipt printed afterward, without needing a full page reload.
        const updatedLead = await leadUpdateRes.json();
        onLeadUpdated?.(updatedLead);
      }

      // Ensure we have an opportunity ID — create one if missing
      let oppId: number | null = initialOpportunityId || null;
      if (!oppId && onEnsureOpportunity) {
        try {
          oppId = await onEnsureOpportunity();
        } catch (err) {
          console.error('Could not ensure opportunity for document upload:', err);
        }
      }

      if (oppId) {
        // Upload mandatory documents (ID proof, passport)
        for (const { key, category } of mandatoryDocs) {
          const file = data[key];
          if (file instanceof File) {
            setUploadProgress(p => ({ ...p, [key]: 'uploading' }));
            try {
              await uploadFileToServer(file, category, oppId as number);
              setUploadProgress(p => ({ ...p, [key]: 'done' }));
            } catch (err) {
              setUploadProgress(p => ({ ...p, [key]: 'error' }));
              throw err;
            }
          }
        }
        // Also upload proof of payment if provided from payment stage
        if (paymentProofFile instanceof File) {
          setUploadProgress(p => ({ ...p, proofOfPayment: 'uploading' }));
          try {
            await uploadFileToServer(paymentProofFile, 'proof_of_payment', oppId as number);
            setUploadProgress(p => ({ ...p, proofOfPayment: 'done' }));
          } catch (err) {
            console.warn('Proof of payment upload failed (non-blocking):', err);
            setUploadProgress(p => ({ ...p, proofOfPayment: 'error' }));
          }
        }
      } else {
        console.warn('No opportunity ID available — documents saved to state only, will upload after opportunity creation.');
      }

      window.toast.success('Documents saved successfully!');
      onNext();
    } catch (error) {
      console.error('Error saving documents:', error);
      window.toast.error(`Error saving documents: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Documents & Information</h3>
        {!initialOpportunityId && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            Opportunity will be created automatically when you save documents.
          </div>
        )}
        {data.allMandatoryDocsUploaded && !freshlyUploaded && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
            Mandatory documents were already uploaded in a previous session. You can continue, or re-select a file below to replace one.
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mandatoryDocs.map(({ key, label, category }) => {
            const uploadedUrl = data.uploadedDocUrls?.[category];
            const showUploadedLink = !(data[key] instanceof File) && Boolean(uploadedUrl);
            return (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {label}{' '}
                {uploadProgress[key] === 'done' && <span className="text-green-600 text-xs">(uploaded ✓)</span>}
                {uploadProgress[key] === 'uploading' && <span className="text-blue-600 text-xs">(uploading...)</span>}
                {uploadProgress[key] === 'error' && <span className="text-red-600 text-xs">(upload failed)</span>}
                {!uploadProgress[key] && data[key] instanceof File && <span className="text-green-600 text-xs">(selected)</span>}
              </label>
              {showUploadedLink && (
                <div className="flex items-center gap-2 px-3 py-2 mb-2 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                  <a
                    href={uploadedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-green-800 hover:text-green-900 hover:underline truncate flex-1"
                  >
                    View uploaded file
                  </a>
                </div>
              )}
              <input
                type="file"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setData({ ...data, [key]: file });
                  setUploadProgress(p => ({ ...p, [key]: 'idle' }));
                }}
              />
              {showUploadedLink && (
                <p className="text-xs text-gray-400 mt-1">Choosing a new file will replace the one above.</p>
              )}
            </div>
            );
          })}
          {optionalDocs.map(({ key, label }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {label} {data[key] instanceof File && <span className="text-green-600 text-xs">(selected)</span>}
              </label>
              <input
                type="file"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setData({ ...data, [key]: file });
                }}
              />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Passport Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={data.passportNumber || ''}
              onChange={(e) => setData({ ...data, passportNumber: e.target.value })}
              placeholder="Enter passport number"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client Actual Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={data.clientActualName || ''}
              onChange={(e) => setData({ ...data, clientActualName: e.target.value })}
              placeholder="Client's full legal name as it should appear on the agreement and receipt"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-md font-medium text-gray-900 mb-3">Additional Information</h4>
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          rows={4}
          placeholder="Enter any additional information or notes..."
          value={data.additionalInfo || ''}
          onChange={(e) => setData({...data, additionalInfo: e.target.value})}
        />
      </div>

      <div className="flex justify-between">
        <button
          onClick={onPrevious}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Back to Accounts
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !allMandatoryUploaded}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save & Continue'}
        </button>
      </div>
    </div>
  );
}

function AgreementStage({ lead, data, setData, quotationData, paidAmount, programValidity, opportunityId, onSaveAgreement, onDeleteAgreement, onNext, onPrevious }: any) {
  const { user } = useAuth();
  const canDelete = isCeo(user as any);
  const [saving, setSaving] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const counselorSummaryLength = data.counselorConversationSummary.trim().length;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSaveAgreement();
      window.toast.success('Agreement saved successfully.');
    } catch (error) {
      console.error('Error saving:', error);
      window.toast.error('Failed to save data');
    } finally {
      setSaving(false);
    }
  };

  const downloadAgreementPdf = async () => {
    setGeneratingPdf(true);
    try {
      const clientName = (lead as any)?.client_actual_name || [lead?.fname, lead?.lname].filter(Boolean).join(' ') || lead?.name || 'Client';
      const destinationCountry = (lead as any)?.country_interest_label || (lead as any)?.country_interest || 'Not specified';
      const serviceProgram   = (lead as any)?.service_interest_label  || (lead as any)?.service_interest  || data.agreementType || 'Consulting Service';
      const branchDetails = getLeadBranchDetails(lead as any);

      // Pull payment amounts from quotation if available. Initial Payment is
      // the amount actually paid at receipt generation (Payment stage), not
      // the pre-discount quotation subtotal.
      const totalAmount    = quotationData?.total    || data.amount || (lead as any)?.payTotal || (lead as any)?.demandAmt || '0';
      const initialPayment = String(Math.min(Math.max(0, Number(paidAmount || 0)), Number(totalAmount) || 0));
      const secondPayment  = String(Math.max(0, Number(totalAmount) - Number(initialPayment)));

      const savedAgreementId = await onSaveAgreement();

      const html = renderAgreementForBranch(branchDetails.branchAbbrv, {
        // Use the number that was just saved to (or already existed in) the
        // database rather than minting a new one — otherwise the downloaded
        // PDF shows a different agreement number than the saved record.
        agreementNumber : data.agreementNumber || `AGR-${savedAgreementId || Date.now()}`,
        agreementDate   : new Date().toLocaleDateString('en-GB'),
        agreementExpiry : data.endDate ? new Date(data.endDate).toLocaleDateString('en-GB') : '',
        clientName,
        clientEmail   : (lead as any)?.email      || '',
        clientPhone   : (lead as any)?.phone      || (lead as any)?.mobile || '',
        clientAddress : (lead as any)?.address    || '',
        nationality   : (lead as any)?.nationality || '',
        passportNumber: (lead as any)?.id_number || '',
        idNumber      : (lead as any)?.emirates_id || (lead as any)?.id_number  || '',
        serviceProgram,
        programCode   : data.agreementType || '',
        programTermSchedule: programValidity || (data.startDate && data.endDate ? `${data.startDate} to ${data.endDate}` : ''),
        destinationCountry,
        totalAmount   : String(totalAmount),
        initialPayment,
        secondPayment,
        clientId      : String((lead as any)?.id || ''),
        includedDeliverables: data.agreementTitle || '',
        expressExclusions: '',
        specialTerms: data.terms || '',
      });

      // Open in a new tab — browser renders Arabic natively, user saves as PDF via Ctrl+P / Print dialog
      const win = window.open('', '_blank', 'width=900,height=700');
      if (!win) { window.toast.warning('Please allow pop-ups to open the agreement.'); return; }
      win.document.write(html);
      win.document.close();
      // Trigger print after fonts have loaded
      win.addEventListener('load', () => {
        setTimeout(() => win.print(), 400);
      });
      // Fallback if load already fired
      if (win.document.readyState === 'complete') {
        setTimeout(() => win.print(), 600);
      }

      setData((current: AgreementData) => ({ ...current, status: 'generated' }));
    } catch (error) {
      console.error('Error generating agreement PDF:', error);
      window.toast.error('Failed to generate agreement PDF');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleDelete = async () => {
    if (!data.agreementId) return;
    if (!window.confirm('Delete this agreement? This cannot be undone.')) return;

    setSaving(true);
    try {
      await onDeleteAgreement();
      window.toast.success('Agreement deleted.');
    } catch (error) {
      console.error('Error deleting agreement:', error);
      window.toast.error(error instanceof Error ? error.message : 'Failed to delete agreement');
    } finally {
      setSaving(false);
    }
  };

  const [lookupNumber, setLookupNumber] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);

  // An agreement number is often already generated for this opportunity (the
  // Payment stage's first save auto-creates one) before the counselor ever
  // reaches this stage — pre-fill the lookup box with it instead of leaving
  // it blank, so fetching/downloading is a single click, not manual entry.
  useEffect(() => {
    if (data.agreementNumber && !lookupNumber) {
      setLookupNumber(data.agreementNumber);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.agreementNumber]);

  const handleAgreementLookup = async () => {
    const num = lookupNumber.trim();
    if (!num) return;
    setLookupLoading(true);
    try {
      const res = await fetch(`/api/opportunity-agreements?agreementNumber=${encodeURIComponent(num)}`);
      if (!res.ok) throw new Error('Not found');
      const json = await res.json();
      const agr = Array.isArray(json.data) ? json.data[0] : json.data ?? json;
      if (!agr) { window.toast.warning(`No agreement found with number: ${num}`); return; }
      setData((prev: AgreementData) => ({
        ...prev,
        agreementId: agr.id ?? prev.agreementId,
        agreementNumber: agr.agreementNumber ?? prev.agreementNumber,
        agreementType: agr.agreementType ?? agr.type ?? prev.agreementType,
        agreementTitle: agr.title ?? agr.agreementTitle ?? prev.agreementTitle,
        terms: agr.termsAndConditions ?? agr.terms ?? prev.terms,
        startDate: agr.startDate ? String(agr.startDate).split('T')[0] : prev.startDate,
        endDate: agr.endDate ? String(agr.endDate).split('T')[0] : prev.endDate,
        amount: agr.totalAmount ? String(agr.totalAmount) : prev.amount,
        companyName: agr.companyName ?? prev.companyName,
        companyAddress: agr.companyAddress ?? prev.companyAddress,
        status: agr.status ?? prev.status,
      }));
      window.toast.success(`Agreement ${num} loaded successfully.`);
    } catch {
      window.toast.warning(`No agreement found with number: ${num}`);
    } finally {
      setLookupLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <PenTool className="mr-3 text-blue-600" size={28} />
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Agreement Generation</h3>
          <p className="text-gray-600 text-sm">Generate service agreement document</p>
        </div>
      </div>

      {data.agreementNumber && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-green-700 uppercase">Agreement Number</span>
            <p className="text-lg font-bold text-green-900">{data.agreementNumber}</p>
          </div>
          <FileSignature className="text-green-600" size={24} />
        </div>
      )}

      {/* Agreement number lookup */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <label className="block text-sm font-medium text-blue-900 mb-2">Lookup Existing Agreement</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={lookupNumber}
            onChange={(e) => setLookupNumber(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAgreementLookup()}
            placeholder="Enter Agreement Number (e.g. AGR-001)"
            className="flex-1 p-2.5 border border-blue-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAgreementLookup}
            disabled={lookupLoading || !lookupNumber.trim()}
            className="px-4 py-2.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
          >
            {lookupLoading ? 'Loading...' : 'Fetch & Fill'}
          </button>
        </div>
        <p className="text-xs text-blue-600 mt-1">
          {data.agreementNumber
            ? 'This opportunity\'s agreement number is filled in — click Fetch & Fill to reload its details, or scroll down to download.'
            : 'Enter an agreement number and click Fetch to auto-fill all fields below.'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Agreement Type</label>
          <SearchableSelect
            value={data.agreementType}
            onChange={(e) => setData({ ...data, agreementType: e.target.value })}
            className="w-full p-3 border rounded-lg"
          >
            <option value="service_agreement">Auto by Product</option>
            <option value="canada-single">Canada Single</option>
            <option value="europe-work-permit">Europe Work Permit</option>
            <option value="job-search">Job Search</option>
            <option value="visit-visa">Visit Visa</option>
            <option value="australia-single">Australia Single</option>
            <option value="student-visa">Student Visa</option>
            <option value="goc">Germany Opportunity Card</option>
            <option value="eip">Economic Immigration Program</option>
            <option value="work-permit-visa-application">Work Permit Visa Application</option>
            <option value="yukon-gcc">Yukon GCC</option>
          </SearchableSelect>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Agreement Title</label>
          <input
            type="text"
            value={data.agreementTitle}
            onChange={(e) => setData({ ...data, agreementTitle: e.target.value })}
            className="w-full p-3 border rounded-lg"
            placeholder="Enter agreement title"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Terms and Conditions</label>
        <textarea
          value={data.terms}
          onChange={(e) => setData({ ...data, terms: e.target.value })}
          rows={6}
          className="w-full p-3 border rounded-lg"
          placeholder="Enter terms and conditions..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Counselor Conversation Summary <span className="text-red-500">*</span>
        </label>
        <textarea
          value={data.counselorConversationSummary}
          onChange={(e) => setData({ ...data, counselorConversationSummary: e.target.value })}
          rows={4}
          className={`w-full p-3 border rounded-lg ${counselorSummaryLength > 0 && counselorSummaryLength < COUNSELOR_SUMMARY_MIN_CHARS ? 'border-red-300 focus:border-red-500' : ''}`}
          placeholder="Summarize the conversation with the client regarding their service requirements, expectations, and any commitments made..."
        />
        <div className="mt-1 flex items-center justify-between gap-3 text-xs">
          <span className={counselorSummaryLength < COUNSELOR_SUMMARY_MIN_CHARS ? 'text-red-600' : 'text-green-700'}>
            Minimum {COUNSELOR_SUMMARY_MIN_CHARS} characters required
          </span>
          <span className="text-gray-500">{counselorSummaryLength}/{COUNSELOR_SUMMARY_MIN_CHARS}</span>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={downloadAgreementPdf}
          disabled={generatingPdf}
          className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center justify-center font-medium"
        >
          <Download className="mr-2" size={20} />
          {generatingPdf ? 'Opening Agreement...' : 'Generate & Print Agreement (PDF)'}
        </button>
        {opportunityId && (
          <button
            onClick={() => window.open(`/admin/leads/agreement/${opportunityId}`, '_blank')}
            className="px-6 py-3 border border-green-600 text-green-700 rounded-lg hover:bg-green-50 flex items-center justify-center font-medium"
          >
            <FileText className="mr-2" size={20} />
            Open Agreement Page
          </button>
        )}
      </div>

      <div className="flex justify-between">
        <button
          onClick={onPrevious}
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center font-medium"
        >
          <ChevronLeft className="mr-2" size={20} />
          Back to Documents
        </button>
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 flex items-center font-medium"
          >
            <Save className="mr-2" size={20} />
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          {data.agreementId && canDelete && (
            <button
              onClick={handleDelete}
              disabled={saving || generatingPdf}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 flex items-center font-medium"
            >
              <Trash2 className="mr-2" size={20} />
              Delete Agreement
            </button>
          )}
          <button
            onClick={onNext}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center font-medium"
          >
            Continue to Signed Agreement
            <ChevronRight className="ml-2" size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

function SignedAgreementStage({ lead, data, setData, opportunityId, uploadedBy, complianceStatus, onSubmitCompliance, onNext, onPrevious }: any) {
  const [uploading, setUploading] = useState(false);
  const [submittingCompliance, setSubmittingCompliance] = useState(false);
  const [submittedUrl, setSubmittedUrl] = useState<string | null>(null);

  const handleFileSelect = async (file?: File) => {
    if (!file) return;
    if (!opportunityId) {
      window.toast.warning('Opportunity not yet created. Please complete the agreement stage first.');
      return;
    }
    setUploading(true);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const blob = await uploadFileToBlob(file, `opportunity-documents/${opportunityId}/signed_agreement/${Date.now()}_${safeName}`);

      const res = await fetch('/api/opportunity-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opportunityId,
          documentType: 'signed_agreement',
          documentName: file.name,
          fileName: safeName,
          filePath: blob.url,
          fileSize: file.size,
          mimeType: file.type || 'application/octet-stream',
          category: 'signed_agreement',
          status: 'uploaded',
          required: true,
          uploadedBy: uploadedBy || 1,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Upload failed');
      }
      const result = await res.json();
      setData({
        ...data,
        documentUrl: result.filePath || blob.url,
        uploadedTocrm: true,
      });
    } catch (err) {
      window.toast.error(`Failed to upload signed agreement: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const canSubmit = Boolean(data.documentUrl && data.uploadedTocrm && data.clientSignature && data.signatureDate);

  useEffect(() => {
    if (!canSubmit) return;
    if (!onSubmitCompliance) return;
    if (complianceStatus === 'pending' || complianceStatus === 'approved') return;
    if (submittedUrl === data.documentUrl) return;

    let cancelled = false;
    (async () => {
      setSubmittingCompliance(true);
      try {
        await onSubmitCompliance();
        if (!cancelled) setSubmittedUrl(data.documentUrl);
      } catch (error) {
        console.error('Error submitting signed agreement for compliance:', error);
        if (!cancelled) {
          window.toast.error(error instanceof Error ? error.message : 'Failed to submit signed agreement for compliance review');
        }
      } finally {
        if (!cancelled) setSubmittingCompliance(false);
      }
    })();

    return () => { cancelled = true; };
  }, [canSubmit, complianceStatus, data.documentUrl, onSubmitCompliance, submittedUrl]);

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <FileSignature className="mr-3 text-blue-600" size={28} />
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Signed Agreement Upload</h3>
          <p className="text-gray-600 text-sm">Upload client-signed agreement document</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircle className="mr-2 text-blue-600" size={20} />
          <span className="text-sm text-blue-800">Once uploaded with signature details, the signed agreement will be automatically sent to compliance for review.</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Client Signature</label>
          <input
            type="text"
            value={data.clientSignature}
            onChange={(e) => setData({ ...data, clientSignature: e.target.value })}
            className="w-full p-3 border rounded-lg"
            placeholder="Enter client signature"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Signature Date</label>
          <input
            type="date"
            value={data.signatureDate}
            onChange={(e) => setData({ ...data, signatureDate: e.target.value })}
            className="w-full p-3 border rounded-lg"
          />
        </div>
      </div>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <FileSignature className="mx-auto text-gray-400 mb-3" size={40} />
        {data.documentUrl ? (
          <div className="flex items-center justify-center gap-2 mb-3">
            <CheckCircle className="text-green-600" size={20} />
            <span className="text-sm text-green-800 font-medium">
              Uploaded: {data.documentUrl.split('/').pop()}
            </span>
          </div>
        ) : (
          <p className="text-gray-600 mb-3 text-sm">
            {uploading ? 'Uploading…' : 'Upload the signed agreement document (PDF, DOCX, JPG)'}
          </p>
        )}
        <label className={`inline-flex px-5 py-2 rounded-lg cursor-pointer text-sm font-medium ${
          uploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
        } text-white`}>
          <Upload className="mr-2" size={18} />
          {uploading ? 'Uploading…' : data.documentUrl ? 'Replace File' : 'Choose File'}
          <input
            type="file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            className="hidden"
            disabled={uploading}
            onChange={(e) => handleFileSelect(e.target.files?.[0])}
          />
        </label>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Compliance status</span>
        <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
          complianceStatus === 'approved' ? 'bg-green-100 text-green-700' :
          complianceStatus === 'rejected' ? 'bg-red-100 text-red-700' :
          complianceStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          {complianceStatus.replace('_', ' ')}
        </span>
      </div>
      {submittingCompliance && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800 flex items-center gap-2">
          <Clock size={16} />
          Sending signed agreement to compliance manager...
        </div>
      )}

      <div className="flex justify-between">
        <button
          onClick={onPrevious}
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center font-medium"
        >
          <ChevronLeft className="mr-2" size={20} />
          Back to Agreement
        </button>
        <button
          onClick={onNext}
          disabled={!canSubmit}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center font-medium"
        >
          Submit for Compliance Review
          <ChevronRight className="ml-2" size={20} />
        </button>
      </div>
    </div>
  );
}

function RetainedStage({ lead, data, setData, onRefreshCompliance, onCloseWon, closingWon, onPrevious }: any) {
  const canClose = data.agreementComplianceStatus === 'approved';
  const isRejected = data.agreementComplianceStatus === 'rejected';
  const [refreshing, setRefreshing] = useState(false);

  const handleRefreshClick = async () => {
    setRefreshing(true);
    try {
      await onRefreshCompliance();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Shield className="mr-3 text-blue-600" size={28} />
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Retention & Compliance Review</h3>
            <p className="text-gray-600 text-sm">Compliance manager review for approval</p>
          </div>
        </div>
        <button
          onClick={handleRefreshClick}
          disabled={refreshing}
          className="px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50 flex items-center font-medium text-sm"
        >
          <RefreshCw className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} size={16} />
          Refresh Status
        </button>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircle className="mr-2 text-yellow-600" size={20} />
          <span className="text-sm text-yellow-800">This agreement requires compliance officer approval before closing or marking the opportunity won.</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-2 text-green-800 font-semibold">
            <CheckCircle size={18} />
            Payment Verified
          </div>
          <p className="text-xs text-green-700 mt-1">Accounts verification is complete for this opportunity.</p>
        </div>
        <div className={`rounded-lg border p-4 ${canClose ? 'border-green-200 bg-green-50' : isRejected ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}`}>
          <div className={`flex items-center gap-2 font-semibold ${canClose ? 'text-green-800' : isRejected ? 'text-red-800' : 'text-yellow-800'}`}>
            {canClose ? <CheckCircle size={18} /> : isRejected ? <XCircle size={18} /> : <Clock size={18} />}
            Agreement {canClose ? 'Approved' : isRejected ? 'Rejected' : 'Pending'}
          </div>
          <p className={`text-xs mt-1 ${canClose ? 'text-green-700' : isRejected ? 'text-red-700' : 'text-yellow-700'}`}>
            Compliance manager must approve the signed agreement before close.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Compliance Status</label>
          <div className={`w-full p-3 border rounded-lg capitalize font-medium ${
            canClose ? 'bg-green-50 border-green-200 text-green-700' :
            isRejected ? 'bg-red-50 border-red-200 text-red-700' :
            'bg-yellow-50 border-yellow-200 text-yellow-700'
          }`}>
            {data.agreementComplianceStatus.replace('_', ' ')}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Compliance Manager</label>
          <input
            type="text"
            value={data.complianceManager}
            onChange={(e) => setData({ ...data, complianceManager: e.target.value })}
            className="w-full p-3 border rounded-lg"
            placeholder="Enter manager name"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Review Notes</label>
        <textarea
          value={data.reviewNotes}
          onChange={(e) => setData({ ...data, reviewNotes: e.target.value })}
          rows={4}
          className="w-full p-3 border rounded-lg"
          placeholder="Enter review comments..."
        />
      </div>

      <div className="flex justify-between">
        <button
          onClick={onPrevious}
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center font-medium"
        >
          <ChevronLeft className="mr-2" size={20} />
          Back
        </button>
        <div className="flex gap-3">
          <button
            onClick={onCloseWon}
            disabled={!canClose || closingWon}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center font-medium"
          >
            <CheckCircle className="mr-2" size={20} />
            {closingWon ? 'Closing...' : 'Close / Mark Won'}
          </button>
        </div>
      </div>
    </div>
  );
}

function RetentionRejectedStage({ lead, leadId, data, onResubmit }: any) {
  const isApproved = data.agreementComplianceStatus === 'approved';
  const isPending = data.agreementComplianceStatus === 'pending' || data.agreementComplianceStatus === 'not_submitted';
  const statusLabel = isApproved ? 'Approved' : isPending ? 'Pending' : 'Rejected';
  const StatusIcon = isApproved ? CheckCircle : isPending ? Clock : XCircle;
  const [generatingCredentials, setGeneratingCredentials] = useState(false);
  const [portalMessage, setPortalMessage] = useState('');
  const [portalCredentials, setPortalCredentials] = useState<{
    loginUrl: string;
    username: string;
    temporaryPassword: string;
  } | null>(null);
  const tone = isApproved
    ? {
        icon: 'text-green-600',
        panel: 'bg-green-50 border-green-200',
        heading: 'text-green-900',
        accent: 'border-green-600',
        action: 'Approved By',
        date: 'Approval Date',
        notesTitle: 'Review Notes',
        subtitle: 'Agreement was approved by compliance manager',
      }
    : isPending
      ? {
          icon: 'text-yellow-600',
          panel: 'bg-yellow-50 border-yellow-200',
          heading: 'text-yellow-900',
          accent: 'border-yellow-600',
          action: 'Review By',
          date: 'Review Date',
          notesTitle: 'Review Notes',
          subtitle: 'Agreement is waiting for compliance manager review',
        }
      : {
          icon: 'text-red-600',
          panel: 'bg-red-50 border-red-200',
          heading: 'text-red-900',
          accent: 'border-red-600',
          action: 'Rejected By',
          date: 'Rejection Date',
          notesTitle: 'Rejection Reason',
          subtitle: 'Agreement was rejected by compliance manager',
        };

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <StatusIcon className={`mr-3 ${tone.icon}`} size={28} />
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Retention Review {statusLabel}</h3>
          <p className="text-gray-600 text-sm">{tone.subtitle}</p>
        </div>
      </div>

      <div className={`${tone.panel} border rounded-lg p-6`}>
        <h4 className={`font-semibold text-lg mb-4 ${tone.heading}`}>Retention Review Details</h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center">
            <StatusIcon className={`mr-2 ${tone.icon}`} size={16} />
            <span><strong>{tone.action}:</strong> {data.complianceManager || 'Compliance Manager'}</span>
          </div>
          <div className="flex items-center">
            <Clock className={`mr-2 ${tone.icon}`} size={16} />
            <span><strong>{tone.date}:</strong> {data.reviewDate || new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-semibold text-lg mb-4 text-gray-900">{tone.notesTitle}</h4>
        <div className={`p-4 bg-gray-50 rounded-lg border-l-4 ${tone.accent}`}>
          <p className="text-sm">{data.reviewNotes || (isApproved ? 'Approved' : isPending ? 'Compliance review is still pending.' : 'The submitted agreement requires modifications before approval.')}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 className="font-semibold text-lg text-gray-900">Client Portal</h4>
            <p className="text-sm text-gray-600">Generate and email portal login credentials for this client.</p>
          </div>
          <button
            onClick={async () => {
              setGeneratingCredentials(true);
              setPortalMessage('');
              setPortalCredentials(null);
              try {
                const res = await fetch(`/api/admin/clients/${leadId}/credentials`, { method: 'POST' });
                const json = await res.json();
                if (res.ok) {
                  setPortalMessage(`Portal credentials emailed to ${json.email}.`);
                  setPortalCredentials({
                    loginUrl: json.loginUrl || `${window.location.origin}/clientportal/login`,
                    username: json.username || json.email,
                    temporaryPassword: json.temporaryPassword || '',
                  });
                } else {
                  setPortalMessage(json.error || 'Failed to generate credentials');
                }
              } catch {
                setPortalMessage('Failed to generate credentials');
              } finally {
                setGeneratingCredentials(false);
              }
            }}
            disabled={generatingCredentials}
            className="inline-flex items-center justify-center rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-50"
          >
            <KeyRound className="mr-2 h-4 w-4" />
            {generatingCredentials ? 'Generating...' : 'Generate Client Portal Credentials'}
          </button>
        </div>
        {portalMessage && <p className="mt-3 text-sm text-gray-600">{portalMessage}</p>}
        {portalCredentials && (
          <div className="mt-4 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm sm:grid-cols-3">
            <div className="min-w-0">
              <p className="font-medium text-slate-500">Login URL</p>
              <a
                href={portalCredentials.loginUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block truncate font-semibold text-blue-700 hover:text-blue-800"
              >
                {portalCredentials.loginUrl}
              </a>
            </div>
            <div className="min-w-0">
              <p className="font-medium text-slate-500">Username</p>
              <p className="truncate font-semibold text-slate-900">{portalCredentials.username}</p>
            </div>
            <div className="min-w-0">
              <p className="font-medium text-slate-500">Temporary Password</p>
              <p className="truncate font-semibold text-slate-900">{portalCredentials.temporaryPassword}</p>
            </div>
          </div>
        )}
      </div>

      {!isApproved && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h4 className="font-semibold text-lg mb-4 text-yellow-900">Required Actions</h4>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center">
            <AlertCircle className="mr-2 text-yellow-600" size={16} />
            Review and update agreement terms
          </li>
          <li className="flex items-center">
            <AlertCircle className="mr-2 text-yellow-600" size={16} />
            Address compliance manager feedback
          </li>
          <li className="flex items-center">
            <AlertCircle className="mr-2 text-yellow-600" size={16} />
            Resubmit for review
          </li>
        </ul>
        </div>
      )}

      {!isApproved && (
        <div className="flex justify-end">
        <button
          onClick={onResubmit}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center font-medium"
        >
          <Upload className="mr-2" size={20} />
          Resubmit for Review
        </button>
        </div>
      )}
    </div>
  );
}

function normalizePriorityForWizard(priority?: string) {
  const value = String(priority || 'medium').toLowerCase();
  if (value === 'critical' || value === 'urgent') return 'critical';
  if (value === 'high') return 'high';
  if (value === 'low') return 'low';
  return 'medium';
}

function ReadonlyDetail({ label, value, placeholder = '' }: { label: string; value?: string | null; placeholder?: string }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500">{label}</label>
      <div className={`min-h-[52px] rounded-lg border border-gray-200 bg-white px-4 py-3 text-base ${value ? 'text-gray-900' : 'text-gray-400'}`}>
        {value || placeholder}
      </div>
    </div>
  );
}

function ClosedStage({ lead, leadId, prospectData, quotationData, paymentData, currencyCode = 'AED' }: any) {
  const { user } = useAuth();
  const [generatingCredentials, setGeneratingCredentials] = useState(false);
  const [portalMessage, setPortalMessage] = useState('');
  const [portalCredentials, setPortalCredentials] = useState<{
    loginUrl: string;
    username: string;
    temporaryPassword: string;
    generatedAt?: string | null;
  } | null>(null);

  const clientName = [lead?.fname, lead?.lname].filter(Boolean).join(' ').trim() || lead?.name || 'Client';
  const clientEmail = lead?.email || portalCredentials?.username || '';
  const branchDetails = getLeadBranchDetails(lead as any);
  const branchOffice = branchDetails.companyName || 'Global Navigator LLC FZ';
  const counselorName = user?.name || '';
  const emailSubject = `Welcome to Global Navigator, ${clientName} - Your Client Portal is Ready`;
  const emailBody = [
    `Dear ${clientName},`,
    '',
    "Welcome to Global Navigator! We're glad to have you on board, and we're committed to making your immigration journey as smooth and transparent as possible.",
    '',
    "To help you stay updated at every step, we've set up your Client Portal - a single place to track your case status, view and upload documents, and stay in touch with your counselor.",
    '',
    'Here are your login details:',
    '',
    `Login URL: ${portalCredentials?.loginUrl || ''}`,
    `Username: ${portalCredentials?.username || clientEmail}`,
    `Temporary Password: ${portalCredentials?.temporaryPassword || ''}`,
    '',
    "For security, please log in and change your password as soon as possible. If you run into any trouble accessing the portal, just reply to this email and we'll help you right away.",
    '',
    'Thank you for choosing Global Navigator. We look forward to supporting you through every stage of your journey.',
    '',
    'Warm regards,',
    'The Global Navigator Team',
  ].join('\n');
  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(`Subject: ${emailSubject}\n\n${emailBody}`);
      setPortalMessage('Email content copied.');
    } catch {
      setPortalMessage('Could not copy email content.');
    }
  };
  const openGmailCompose = () => {
    const url = new URL('https://mail.google.com/mail/');
    url.searchParams.set('view', 'cm');
    url.searchParams.set('fs', '1');
    url.searchParams.set('to', clientEmail);
    url.searchParams.set('su', emailSubject);
    url.searchParams.set('body', emailBody);
    window.open(url.toString(), '_blank', 'noopener,noreferrer');
  };
  const generateClientPortal = async () => {
    setGeneratingCredentials(true);
    setPortalMessage('');
    try {
      const res = await fetch(`/api/admin/clients/${leadId}/credentials`, { method: 'POST' });
      const json = await res.json();
      if (res.ok) {
        setPortalCredentials({
          loginUrl: json.loginUrl || `${window.location.origin}/clientportal/login`,
          username: json.username || json.email,
          temporaryPassword: json.temporaryPassword || '',
          generatedAt: json.generatedAt || null,
        });
        setPortalMessage('Client portal details are ready.');
      } else {
        setPortalMessage(json.error || 'Failed to generate credentials');
      }
    } catch {
      setPortalMessage('Failed to generate credentials');
    } finally {
      setGeneratingCredentials(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/clients/${leadId}/credentials`)
      .then((res) => res.json().then((json) => ({ ok: res.ok, json })))
      .then(({ ok, json }) => {
        if (cancelled || !ok || !json.credentials) return;
        setPortalCredentials({
          loginUrl: json.credentials.loginUrl || `${window.location.origin}/clientportal/login`,
          username: json.credentials.username || json.credentials.email,
          temporaryPassword: json.credentials.temporaryPassword || '',
          generatedAt: json.credentials.generatedAt || null,
        });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [leadId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <CheckCircle className="mr-3 text-green-600" size={28} />
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Opportunity Closed - Won!</h3>
          <p className="text-gray-600 text-sm">Lead successfully converted to customer</p>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h4 className="font-semibold text-lg mb-4 text-green-900">Success Summary</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Opportunity:</span> {prospectData.opportunityName}
          </div>
          <div>
            <span className="font-medium">Total Value:</span> {currencyCode} {quotationData.total.toFixed(2)}
          </div>
          <div>
            <span className="font-medium">Amount Paid:</span> {currencyCode} {paymentData.paidAmount.toFixed(2)}
          </div>
          <div>
            <span className="font-medium">Closed Date:</span> {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-semibold text-lg mb-4 text-gray-900">Process Timeline</h4>
        <div className="space-y-2 text-sm">
          {[
            'Prospect → Quotation',
            'Quotation → Payment',
            'Payment → Documents',
            'Documents → Agreement',
            'Agreement → Signed Agreement',
            'Signed Agreement → Retained',
            'Retained → Closed'
          ].map((step, index) => (
            <div key={index} className="flex items-center">
              <CheckCircle className="mr-2 text-green-600" size={16} />
              <span className="text-green-700">{step} ✓</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 className="text-2xl font-bold text-gray-900">Welcome Email - Client Portal Handoff</h4>
            <p className="mt-1 text-sm text-gray-500">Generate once, review the client portal details, then copy or send.</p>
          </div>
          {!portalCredentials?.temporaryPassword && (
            <button
              onClick={generateClientPortal}
              disabled={generatingCredentials}
              className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              <KeyRound className="mr-2 h-4 w-4" />
              {generatingCredentials ? 'Generating...' : 'Generate Client Portal'}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <ReadonlyDetail label="Client Name" value={clientName} />
          <ReadonlyDetail label="Client Email" value={clientEmail} />
          <ReadonlyDetail label="Login URL" value={portalCredentials?.loginUrl || ''} />
          <ReadonlyDetail label="Username" value={portalCredentials?.username || clientEmail} />
          <ReadonlyDetail label="Temporary Password" value={portalCredentials?.temporaryPassword || ''} />
          <ReadonlyDetail label="Counselor Name" value={counselorName} placeholder="Your name" />
          <div className="md:col-span-2">
            <ReadonlyDetail label="Branch / Office" value={branchOffice} />
          </div>
        </div>
        {portalMessage && <p className="mt-4 text-sm text-gray-600">{portalMessage}</p>}
      </div>

      {portalCredentials && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-5 text-gray-900">
            <p className="text-base text-gray-500"><strong className="text-gray-900">Subject:</strong> {emailSubject}</p>
            <div className="my-4 border-t border-dashed border-gray-300" />
            <div className="space-y-5 whitespace-pre-line text-base leading-8">
              <p>Dear {clientName},</p>
              <p>{`Welcome to Global Navigator! We're glad to have you on board, and we're committed to making your immigration journey as smooth and transparent as possible.`}</p>
              <p>{`To help you stay updated at every step, we've set up your Client Portal - a single place to track your case status, view and upload documents, and stay in touch with your counselor.`}</p>
              <p>Here are your login details:</p>
              <p>
                Login URL: {portalCredentials.loginUrl}<br />
                Username: <span className="rounded bg-green-100 px-1 font-semibold text-green-800">{portalCredentials.username}</span><br />
                Temporary Password: <span className="rounded bg-green-100 px-1 font-semibold text-green-800">{portalCredentials.temporaryPassword}</span>
              </p>
              <p>{`For security, please log in and change your password as soon as possible. If you run into any trouble accessing the portal, just reply to this email and we'll help you right away.`}</p>
              <p>Thank you for choosing Global Navigator. We look forward to supporting you through every stage of your journey.</p>
              <p>Warm regards,<br />The Global Navigator Team</p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={openGmailCompose}
              className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              <Mail className="mr-2 h-4 w-4" />
              Send via Gmail
            </button>
            <button
              onClick={copyEmail}
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50"
            >
              <FileText className="mr-2 h-4 w-4" />
              Copy Email
            </button>
          </div>
          <p className="mt-3 text-sm text-gray-500">Send via Gmail opens a pre-filled compose window in your logged-in Gmail account. Copy Email copies the subject and body as plain text.</p>
        </div>
      )}

      <div className="flex justify-end gap-3">
        <button className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center font-medium">
          <Download className="mr-2" size={20} />
          Generate Report
        </button>
        <button
          onClick={() => window.location.href = '/admin/leads'}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center font-medium"
        >
          <CheckCircle className="mr-2" size={20} />
          Back to Leads
        </button>
      </div>
    </div>
  );
}
