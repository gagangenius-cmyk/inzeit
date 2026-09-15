'use client';

import { Building2, FolderOpen, ShieldCheck, DollarSign, FileEdit, FlagOff, MessageSquare } from 'lucide-react';
import OperationsWizardShell, { withPersonalStage, type StageField, type StageMeta, type WizardStage } from '@/components/operations/OperationsWizardShell';

interface PortugalBusinessOperationsWizardProps {
  opportunityId: number;
  leadId: number;
  clientName: string;
}

const statusOptions = ['Not Started', 'In Progress', 'Submitted', 'Approved', 'Rejected', 'Not Applicable'];
const paymentStatusOptions = ['Pending', 'Partial', 'Paid', 'Overdue'];

const stages: WizardStage[] = [
  { id: 'personal', name: 'Personal Details', icon: Building2 },
  { id: 'business', name: 'Business Details', icon: Building2 },
  { id: 'registration', name: 'Registration & Visa Status', icon: ShieldCheck },
  { id: 'documents', name: 'Documents', icon: FolderOpen },
  { id: 'financials', name: 'Financials', icon: DollarSign },
  { id: 'conversation', name: 'Conversation', icon: MessageSquare },
  { id: 'remark', name: 'Remark', icon: FileEdit },
  { id: 'closure', name: 'Closure', icon: FlagOff },
];

const stageFieldMap: Record<string, StageField[]> = {
  personal: withPersonalStage(),
  business: [
    { name: 'companyName', label: 'Company Name', required: true },
    { name: 'businessType', label: 'Business Type' },
    { name: 'registrationNumber', label: 'Registration Number' },
    { name: 'address', label: 'Business Address' },
    { name: 'city', label: 'City' },
    { name: 'industry', label: 'Industry' },
    { name: 'employees', label: 'Number of Employees', type: 'number' },
    { name: 'annualRevenue', label: 'Annual Revenue' },
    { name: 'investmentAmount', label: 'Investment Amount' },
    { name: 'businessPlanSummary', label: 'Business Plan Summary', type: 'textarea', span: 'full' },
    { name: 'marketAnalysis', label: 'Market Analysis', type: 'textarea', span: 'full' },
  ],
  registration: [
    { name: 'companyRegistration', label: 'Company Registration', type: 'select', options: statusOptions, required: true },
    { name: 'taxRegistration', label: 'Tax Registration (NIF)', type: 'select', options: statusOptions },
    { name: 'socialSecurity', label: 'Social Security', type: 'select', options: statusOptions },
    { name: 'bankAccountStatus', label: 'Bank Account Setup', type: 'select', options: statusOptions },
    { name: 'licensesStatus', label: 'Licenses', type: 'select', options: statusOptions },
    { name: 'residencyPermitStatus', label: 'Residency Permit', type: 'select', options: statusOptions },
    { name: 'entrepreneurVisaStatus', label: 'Entrepreneur (D2) Visa', type: 'select', options: statusOptions },
    { name: 'goldenVisaStatus', label: 'Golden Visa', type: 'select', options: statusOptions },
    { name: 'workPermitStatus', label: 'Work Permit', type: 'select', options: statusOptions },
    { name: 'familyVisaStatus', label: 'Family Visa', type: 'select', options: statusOptions },
    { name: 'comments', label: 'Comments', type: 'textarea', span: 'full' },
  ],
  documents: [
    { name: 'businessPlanFile', label: 'Business Plan', type: 'file' },
    { name: 'financialStatementsFile', label: 'Financial Statements', type: 'file' },
    { name: 'marketResearchFile', label: 'Market Research', type: 'file' },
    { name: 'registrationDocumentsFile', label: 'Registration Documents', type: 'file' },
    { name: 'visaDocumentsFile', label: 'Visa Documents', type: 'file' },
    { name: 'investmentProofFile', label: 'Investment Proof', type: 'file' },
  ],
  financials: [
    { name: 'serviceFee', label: 'Service Fee', type: 'number', required: true },
    { name: 'governmentFees', label: 'Government Fees', type: 'number' },
    { name: 'totalCost', label: 'Total Cost', type: 'number' },
    { name: 'paidAmount', label: 'Paid Amount', type: 'number' },
    { name: 'paymentStatus', label: 'Payment Status', type: 'select', options: paymentStatusOptions, required: true },
  ],
  conversation: [
    { name: 'conversationDate', label: 'Conversation Date', type: 'date', required: true },
    { name: 'conversationType', label: 'Conversation Type', type: 'select', options: ['Call', 'Email', 'WhatsApp', 'In-Person', 'Video Call'] },
    { name: 'conversationStatus', label: 'Status', type: 'select', options: ['Open', 'Follow-up Required', 'Resolved'] },
    { name: 'conversation', label: 'Conversation Notes', type: 'textarea', span: 'full', required: true },
    { name: 'followupDate', label: 'Follow-up Date', type: 'date' },
    { name: 'followupRemarks', label: 'Follow-up Remarks', type: 'textarea', span: 'full' },
  ],
  remark: [
    { name: 'remarkDate', label: 'Remark Date', type: 'date' },
    { name: 'remark', label: 'Remark', type: 'textarea', span: 'full', required: true },
  ],
  closure: [
    { name: 'closureDate', label: 'Closure Date', type: 'date' },
    { name: 'closureReason', label: 'Closure Reason', type: 'select', options: ['Completed', 'Client Withdrew', 'Refused', 'Non-Payment', 'Other'] },
    { name: 'closureNotes', label: 'Closure Notes', type: 'textarea', span: 'full' },
  ],
};

const stageMeta: Record<string, StageMeta> = {
  personal: { title: 'Personal Details', description: 'Client contact and case information.', dataKey: 'personal' },
  business: { title: 'Business Details', description: 'Company profile, industry, and investment details for the Portugal business immigration case.', dataKey: 'business' },
  registration: { title: 'Registration & Visa Status', description: 'Company/tax registration, social security, banking, and residency/D2/Golden Visa/Work/Family visa status tracking.', dataKey: 'registration' },
  documents: { title: 'Documents', description: 'Business plan, financials, market research, registration, visa, and investment proof documents.', dataKey: 'documents' },
  financials: { title: 'Financials', description: 'Service fee, government fees, and payment tracking.', dataKey: 'financials' },
  conversation: { title: 'Conversation', description: 'Log client conversations, calls, and follow-ups for this case.', dataKey: 'conversation' },
  remark: { title: 'Remarks', description: 'General notes about the case progress.', dataKey: 'remark' },
  closure: { title: 'Closure', description: 'Case closure with reason and notes.', dataKey: 'closure' },
};

export default function PortugalBusinessOperationsWizard(props: PortugalBusinessOperationsWizardProps) {
  return (
    <OperationsWizardShell
      {...props}
      module="portugal-business"
      pageTitle="Portugal Business Operations"
      headerIcon={Building2}
      stages={stages}
      stageFieldMap={stageFieldMap}
      stageMeta={stageMeta}
    />
  );
}
