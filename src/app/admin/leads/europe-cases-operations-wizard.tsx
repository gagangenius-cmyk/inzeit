'use client';

import { Globe2, ClipboardCheck, FolderOpen, DollarSign, FileEdit, FlagOff, MessageSquare } from 'lucide-react';
import OperationsWizardShell, { withPersonalStage, type StageField, type StageMeta, type WizardStage } from '@/components/operations/OperationsWizardShell';

interface EuropeCasesOperationsWizardProps {
  opportunityId: number;
  leadId: number;
  clientName: string;
}

const statusOptions = ['Not Started', 'In Progress', 'Submitted', 'Approved', 'Rejected', 'Not Applicable'];

const stages: WizardStage[] = [
  { id: 'personal', name: 'Personal Details', icon: Globe2 },
  { id: 'case', name: 'Case Details', icon: ClipboardCheck },
  { id: 'status', name: 'Application Status', icon: ClipboardCheck },
  { id: 'documents', name: 'Documents', icon: FolderOpen },
  { id: 'financials', name: 'Financials', icon: DollarSign },
  { id: 'conversation', name: 'Conversation', icon: MessageSquare },
  { id: 'remark', name: 'Remark', icon: FileEdit },
  { id: 'closure', name: 'Closure', icon: FlagOff },
];

const stageFieldMap: Record<string, StageField[]> = {
  personal: withPersonalStage([
    { name: 'targetCountry', label: 'Target Country', required: true },
    { name: 'education', label: 'Education' },
    { name: 'languages', label: 'Languages Spoken' },
  ]),
  case: [
    { name: 'category', label: 'Case Category', type: 'select', options: ['Business/Investment', 'Employment', 'Study', 'Family Reunification', 'Other'], required: true },
    { name: 'subCategory', label: 'Sub-Category' },
    { name: 'investmentAmount', label: 'Investment Amount' },
    { name: 'businessType', label: 'Business Type' },
    { name: 'position', label: 'Job Position' },
    { name: 'salary', label: 'Salary' },
    { name: 'institution', label: 'Institution' },
    { name: 'program', label: 'Program' },
    { name: 'duration', label: 'Duration' },
  ],
  status: [
    { name: 'initialConsultation', label: 'Initial Consultation', type: 'select', options: statusOptions, required: true },
    { name: 'documentCollection', label: 'Document Collection', type: 'select', options: statusOptions },
    { name: 'applicationSubmission', label: 'Application Submission', type: 'select', options: statusOptions },
    { name: 'governmentReview', label: 'Government Review', type: 'select', options: statusOptions },
    { name: 'approval', label: 'Approval', type: 'select', options: statusOptions },
    { name: 'visaIssuance', label: 'Visa Issuance', type: 'select', options: statusOptions },
    { name: 'relocation', label: 'Relocation', type: 'select', options: statusOptions },
    { name: 'comments', label: 'Comments', type: 'textarea', span: 'full' },
  ],
  documents: [
    { name: 'passportFile', label: 'Passport', type: 'file', required: true },
    { name: 'educationalCertificatesFile', label: 'Educational Certificates', type: 'file' },
    { name: 'financialDocumentsFile', label: 'Financial Documents', type: 'file' },
    { name: 'businessPlanFile', label: 'Business Plan', type: 'file' },
    { name: 'medicalCertificateFile', label: 'Medical Certificate', type: 'file' },
    { name: 'policeClearanceFile', label: 'Police Clearance', type: 'file' },
    { name: 'languageTestFile', label: 'Language Test', type: 'file' },
  ],
  financials: [
    { name: 'serviceFee', label: 'Service Fee', type: 'number', required: true },
    { name: 'governmentFees', label: 'Government Fees', type: 'number' },
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
    { name: 'closureReason', label: 'Closure Reason', type: 'select', options: ['Completed', 'Client Withdrew', 'Refused', 'Non-Payment', 'Other'] },
    { name: 'closureNotes', label: 'Closure Notes', type: 'textarea', span: 'full' },
  ],
};

const stageMeta: Record<string, StageMeta> = {
  personal: { title: 'Personal Details', description: 'Client contact, target country, education, and languages.', dataKey: 'personal' },
  case: { title: 'Case Details', description: 'Case category (business/investment, employment, study, family reunification) and program-specific details.', dataKey: 'case' },
  status: { title: 'Application Status', description: 'Consultation, document collection, submission, government review, approval, visa issuance, and relocation tracking.', dataKey: 'status' },
  documents: { title: 'Documents', description: 'Passport, educational certificates, financial documents, business plan, medical, police clearance, and language test.', dataKey: 'documents' },
  financials: { title: 'Financials', description: 'Service fee, government fees, and payment tracking.', dataKey: 'financials' },
  conversation: { title: 'Conversation', description: 'Log client conversations, calls, and follow-ups for this case.', dataKey: 'conversation' },
  remark: { title: 'Remarks', description: 'General notes about the case progress.', dataKey: 'remark' },
  closure: { title: 'Closure', description: 'Case closure with reason and notes.', dataKey: 'closure' },
};

export default function EuropeCasesOperationsWizard(props: EuropeCasesOperationsWizardProps) {
  return (
    <OperationsWizardShell
      {...props}
      module="europe-cases"
      pageTitle="Europe Cases Operations"
      headerIcon={Globe2}
      stages={stages}
      stageFieldMap={stageFieldMap}
      stageMeta={stageMeta}
    />
  );
}
