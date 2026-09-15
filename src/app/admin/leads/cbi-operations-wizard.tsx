'use client';

import { Award, ClipboardCheck, FolderOpen, DollarSign, FileEdit, FlagOff, MessageSquare } from 'lucide-react';
import OperationsWizardShell, { withPersonalStage, type StageField, type StageMeta, type WizardStage } from '@/components/operations/OperationsWizardShell';

interface CbiOperationsWizardProps {
  opportunityId: number;
  leadId: number;
  clientName: string;
}

const statusOptions = ['Not Started', 'In Progress', 'Submitted', 'Approved', 'Rejected', 'Not Applicable'];

const stages: WizardStage[] = [
  { id: 'personal', name: 'Personal Details', icon: Award },
  { id: 'investment', name: 'Investment Details', icon: DollarSign },
  { id: 'status', name: 'Application Status', icon: ClipboardCheck },
  { id: 'documents', name: 'Documents', icon: FolderOpen },
  { id: 'financials', name: 'Financials', icon: DollarSign },
  { id: 'conversation', name: 'Conversation', icon: MessageSquare },
  { id: 'remark', name: 'Remark', icon: FileEdit },
  { id: 'closure', name: 'Closure', icon: FlagOff },
];

const stageFieldMap: Record<string, StageField[]> = {
  personal: withPersonalStage([
    { name: 'netWorth', label: 'Net Worth' },
    { name: 'sourceOfFunds', label: 'Source of Funds' },
    { name: 'currentLocation', label: 'Current Location' },
    { name: 'maritalStatusCbi', label: 'Marital Status', type: 'select', options: ['Single', 'Married', 'Divorced', 'Widowed'] },
  ]),
  investment: [
    { name: 'program', label: 'CBI Program / Country', required: true },
    { name: 'investmentType', label: 'Investment Type', type: 'select', options: ['Real Estate', 'Government Fund', 'National Development Fund', 'Business Investment'] },
    { name: 'minimumInvestment', label: 'Minimum Investment' },
    { name: 'processingTime', label: 'Expected Processing Time' },
    { name: 'residencyRequirement', label: 'Residency Requirement' },
    { name: 'familyMembers', label: 'Number of Family Members Included', type: 'number' },
  ],
  status: [
    { name: 'initialConsultation', label: 'Initial Consultation', type: 'select', options: statusOptions, required: true },
    { name: 'documentCollection', label: 'Document Collection', type: 'select', options: statusOptions },
    { name: 'applicationSubmission', label: 'Application Submission', type: 'select', options: statusOptions },
    { name: 'dueDiligence', label: 'Due Diligence', type: 'select', options: statusOptions },
    { name: 'governmentApproval', label: 'Government Approval', type: 'select', options: statusOptions },
    { name: 'investmentTransfer', label: 'Investment Transfer', type: 'select', options: statusOptions },
    { name: 'residencyPermit', label: 'Residency/Citizenship Permit', type: 'select', options: statusOptions },
    { name: 'comments', label: 'Comments', type: 'textarea', span: 'full' },
  ],
  documents: [
    { name: 'passportFile', label: 'Passport', type: 'file', required: true },
    { name: 'policeClearanceFile', label: 'Police Clearance Certificate', type: 'file' },
    { name: 'medicalCertificateFile', label: 'Medical Certificate', type: 'file' },
    { name: 'financialProofFile', label: 'Financial Proof', type: 'file' },
    { name: 'sourceOfFundsFile', label: 'Source of Funds Documentation', type: 'file' },
    { name: 'businessDocumentsFile', label: 'Business Documents', type: 'file' },
    { name: 'familyDocumentsFile', label: 'Family Documents', type: 'file' },
  ],
  financials: [
    { name: 'serviceFee', label: 'Service Fee', type: 'number', required: true },
    { name: 'governmentFees', label: 'Government Fees', type: 'number' },
    { name: 'investmentAmount', label: 'Investment Amount', type: 'number' },
    { name: 'paidAmount', label: 'Paid Amount', type: 'number' },
    { name: 'paymentStatus', label: 'Payment Status', type: 'select', options: ['Pending', 'Partial', 'Paid', 'Overdue'], required: true },
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
    { name: 'closureReason', label: 'Closure Reason', type: 'select', options: ['Citizenship Granted', 'Client Withdrew', 'Refused', 'Non-Payment', 'Other'] },
    { name: 'closureNotes', label: 'Closure Notes', type: 'textarea', span: 'full' },
  ],
};

const stageMeta: Record<string, StageMeta> = {
  personal: { title: 'Personal Details', description: 'Client contact, net worth, and source-of-funds information.', dataKey: 'personal' },
  investment: { title: 'Investment Details', description: 'CBI program, investment type, minimum investment, and residency requirements.', dataKey: 'investment' },
  status: { title: 'Application Status', description: 'Consultation, document collection, submission, due diligence, government approval, investment transfer, and residency/citizenship permit tracking.', dataKey: 'status' },
  documents: { title: 'Documents', description: 'Passport, police clearance, medical certificate, financial proof, source of funds, business and family documents.', dataKey: 'documents' },
  financials: { title: 'Financials', description: 'Service fee, government fees, investment amount, and payment tracking.', dataKey: 'financials' },
  conversation: { title: 'Conversation', description: 'Log client conversations, calls, and follow-ups for this case.', dataKey: 'conversation' },
  remark: { title: 'Remarks', description: 'General notes about the case progress.', dataKey: 'remark' },
  closure: { title: 'Closure', description: 'Case closure with reason and notes.', dataKey: 'closure' },
};

export default function CbiOperationsWizard(props: CbiOperationsWizardProps) {
  return (
    <OperationsWizardShell
      {...props}
      module="cbi"
      pageTitle="Citizenship by Investment Operations"
      headerIcon={Award}
      stages={stages}
      stageFieldMap={stageFieldMap}
      stageMeta={stageMeta}
    />
  );
}
