'use client';

import { Briefcase, FolderOpen, ClipboardCheck, DollarSign, FileEdit, FlagOff, MessageSquare } from 'lucide-react';
import OperationsWizardShell, { withPersonalStage, type StageField, type StageMeta, type WizardStage } from '@/components/operations/OperationsWizardShell';

interface BusinessOperationsWizardProps {
  opportunityId: number;
  leadId: number;
  clientName: string;
}

const statusOptions = ['Not Started', 'In Progress', 'Submitted', 'Approved', 'Rejected', 'Not Applicable'];

const stages: WizardStage[] = [
  { id: 'personal', name: 'Personal Details', icon: Briefcase },
  { id: 'pipeline', name: 'Business Pipeline', icon: ClipboardCheck },
  { id: 'documents', name: 'Documents', icon: FolderOpen },
  { id: 'payment', name: 'Payment', icon: DollarSign },
  { id: 'conversation', name: 'Conversation', icon: MessageSquare },
  { id: 'remark', name: 'Remark', icon: FileEdit },
  { id: 'closure', name: 'Closure', icon: FlagOff },
];

const stageFieldMap: Record<string, StageField[]> = {
  personal: withPersonalStage(),
  pipeline: [
    { name: 'retainerStatus', label: 'Retainer Status', type: 'select', options: statusOptions, required: true },
    { name: 'registrationStatus', label: 'Registration Status', type: 'select', options: statusOptions },
    { name: 'preApprovalStatus', label: 'Pre-Approval Status', type: 'select', options: statusOptions },
    { name: 'finalApplicationStatus', label: 'Final Application Status', type: 'select', options: statusOptions },
    { name: 'stageDate', label: 'Status Date', type: 'date' },
    { name: 'stageReference', label: 'Reference Number' },
    { name: 'comments', label: 'Comments', type: 'textarea', span: 'full' },
  ],
  documents: [
    { name: 'retainerDocsFile', label: 'Retainer Documents', type: 'file' },
    { name: 'registrationDocsFile', label: 'Registration Documents', type: 'file' },
    { name: 'preApprovalDocsFile', label: 'Pre-Approval Documents', type: 'file' },
    { name: 'finalApplicationDocsFile', label: 'Final Application Documents', type: 'file' },
  ],
  payment: [
    { name: 'paymentDue', label: 'Payment Due', type: 'number', required: true },
    { name: 'paymentDueDate', label: 'Payment Due Date', type: 'date' },
    { name: 'paymentRemarks', label: 'Payment Remarks', type: 'textarea', span: 'full' },
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
  pipeline: { title: 'Business Pipeline', description: 'Retainer, registration, pre-approval, and final application status through the business immigration pipeline.', dataKey: 'pipeline' },
  documents: { title: 'Documents', description: 'Documents collected at each pipeline stage: retainer, registration, pre-approval, final application.', dataKey: 'documents' },
  payment: { title: 'Payment', description: 'Outstanding payment due and remarks.', dataKey: 'payment' },
  conversation: { title: 'Conversation', description: 'Log client conversations, calls, and follow-ups for this case.', dataKey: 'conversation' },
  remark: { title: 'Remarks', description: 'General notes about the case progress.', dataKey: 'remark' },
  closure: { title: 'Closure', description: 'Case closure with reason and notes.', dataKey: 'closure' },
};

export default function BusinessOperationsWizard(props: BusinessOperationsWizardProps) {
  return (
    <OperationsWizardShell
      {...props}
      module="business"
      pageTitle="Business Operations"
      headerIcon={Briefcase}
      stages={stages}
      stageFieldMap={stageFieldMap}
      stageMeta={stageMeta}
    />
  );
}
