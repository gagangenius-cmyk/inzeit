'use client';

import { Building2, FolderOpen, ShieldCheck, DollarSign, FileEdit, FlagOff, MessageSquare } from 'lucide-react';
import OperationsWizardShell, { withPersonalStage, type StageField, type StageMeta, type WizardStage } from '@/components/operations/OperationsWizardShell';

interface BusinessUsaOperationsWizardProps {
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
    { name: 'state', label: 'State' },
    { name: 'industry', label: 'Industry' },
    { name: 'employees', label: 'Number of Employees', type: 'number' },
    { name: 'annualRevenue', label: 'Annual Revenue' },
    { name: 'investmentAmount', label: 'Investment Amount' },
    { name: 'businessPlanSummary', label: 'Business Plan Summary', type: 'textarea', span: 'full' },
    { name: 'marketAnalysis', label: 'Market Analysis', type: 'textarea', span: 'full' },
  ],
  registration: [
    { name: 'companyRegistration', label: 'Company Registration', type: 'select', options: statusOptions, required: true },
    { name: 'federalTaxId', label: 'Federal Tax ID (EIN)', type: 'select', options: statusOptions },
    { name: 'stateTaxId', label: 'State Tax ID', type: 'select', options: statusOptions },
    { name: 'businessLicenses', label: 'Business Licenses', type: 'select', options: statusOptions },
    { name: 'permitsStatus', label: 'Permits', type: 'select', options: statusOptions },
    { name: 'e2InvestorVisaStatus', label: 'E-2 Investor Visa', type: 'select', options: statusOptions },
    { name: 'l1IntraCompanyStatus', label: 'L-1 Intra-Company Transfer', type: 'select', options: statusOptions },
    { name: 'h1bSpecialtyStatus', label: 'H-1B Specialty Occupation', type: 'select', options: statusOptions },
    { name: 'greenCardStatus', label: 'Green Card', type: 'select', options: statusOptions },
    { name: 'comments', label: 'Comments', type: 'textarea', span: 'full' },
  ],
  documents: [
    { name: 'businessPlanFile', label: 'Business Plan', type: 'file' },
    { name: 'financialStatementsFile', label: 'Financial Statements', type: 'file' },
    { name: 'marketResearchFile', label: 'Market Research', type: 'file' },
    { name: 'registrationDocumentsFile', label: 'Registration Documents', type: 'file' },
    { name: 'visaDocumentsFile', label: 'Visa Documents', type: 'file' },
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
  business: { title: 'Business Details', description: 'Company profile, industry, and investment details for the USA business immigration case.', dataKey: 'business' },
  registration: { title: 'Registration & Visa Status', description: 'Company/tax registration, licenses, and E-2/L-1/H-1B/Green Card status tracking.', dataKey: 'registration' },
  documents: { title: 'Documents', description: 'Business plan, financials, market research, registration and visa documents.', dataKey: 'documents' },
  financials: { title: 'Financials', description: 'Service fee, government fees, and payment tracking.', dataKey: 'financials' },
  conversation: { title: 'Conversation', description: 'Log client conversations, calls, and follow-ups for this case.', dataKey: 'conversation' },
  remark: { title: 'Remarks', description: 'General notes about the case progress.', dataKey: 'remark' },
  closure: { title: 'Closure', description: 'Case closure with reason and notes.', dataKey: 'closure' },
};

export default function BusinessUsaOperationsWizard(props: BusinessUsaOperationsWizardProps) {
  return (
    <OperationsWizardShell
      {...props}
      module="business-usa"
      pageTitle="USA Business Operations"
      headerIcon={Building2}
      stages={stages}
      stageFieldMap={stageFieldMap}
      stageMeta={stageMeta}
    />
  );
}
