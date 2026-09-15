'use client';

import { FileCheck, ClipboardCheck, FolderOpen, DollarSign, FileEdit, FlagOff, MessageSquare } from 'lucide-react';
import OperationsWizardShell, { withPersonalStage, type StageField, type StageMeta, type WizardStage } from '@/components/operations/OperationsWizardShell';

interface WorkPermitOperationsWizardProps {
  opportunityId: number;
  leadId: number;
  clientName: string;
}

const statusOptions = ['Pending', 'In Progress', 'Submitted', 'Approved', 'Rejected', 'Not Applicable'];

const stages: WizardStage[] = [
  { id: 'personal', name: 'Personal Details', icon: FileCheck },
  { id: 'employer', name: 'Employer Details', icon: FileCheck },
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
  ]),
  employer: [
    { name: 'employerName', label: 'Employer Name', required: true },
    { name: 'employerAddress', label: 'Employer Address' },
    { name: 'employerPhone', label: 'Employer Phone' },
    { name: 'employerEmail', label: 'Employer Email' },
    { name: 'jobTitle', label: 'Job Title' },
    { name: 'jobCategory', label: 'Job Category' },
    { name: 'workLocation', label: 'Work Location' },
    { name: 'salary', label: 'Salary', type: 'number' },
    { name: 'currency', label: 'Currency' },
    { name: 'permitType', label: 'Permit Type', type: 'select', options: ['Open', 'Employer Specific', 'Post Graduation', 'Intra Company'] },
  ],
  status: [
    { name: 'applicationStatus', label: 'Application Status', type: 'select', options: statusOptions, required: true },
    { name: 'lmiaStatus', label: 'LMIA Status', type: 'select', options: ['Pending', 'Approved', 'Rejected', 'Not Required'] },
    { name: 'workPermitStatus', label: 'Work Permit Status', type: 'select', options: statusOptions },
    { name: 'startDate', label: 'Start Date', type: 'date' },
    { name: 'expectedCompletion', label: 'Expected Completion', type: 'date' },
    { name: 'comments', label: 'Comments', type: 'textarea', span: 'full' },
  ],
  documents: [
    { name: 'passportFile', label: 'Passport', type: 'file', required: true },
    { name: 'jobOfferFile', label: 'Job Offer Letter', type: 'file' },
    { name: 'lmiaFile', label: 'LMIA Document', type: 'file' },
    { name: 'medicalCertificateFile', label: 'Medical Certificate', type: 'file' },
    { name: 'policeClearanceFile', label: 'Police Clearance', type: 'file' },
  ],
  financials: [
    { name: 'serviceFee', label: 'Service Fee', type: 'number', required: true },
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
    { name: 'closureReason', label: 'Closure Reason', type: 'select', options: ['Work Permit Issued', 'Client Withdrew', 'Refused', 'Non-Payment', 'Other'] },
    { name: 'closureNotes', label: 'Closure Notes', type: 'textarea', span: 'full' },
  ],
};

const stageMeta: Record<string, StageMeta> = {
  personal: { title: 'Personal Details', description: 'Client contact, target country, and case information.', dataKey: 'personal' },
  employer: { title: 'Employer Details', description: 'Employer contact information, job title/category, work location, salary, and permit type.', dataKey: 'employer' },
  status: { title: 'Application Status', description: 'Application status, LMIA status, work permit status, and timeline.', dataKey: 'status' },
  documents: { title: 'Documents', description: 'Passport, job offer letter, LMIA document, medical certificate, and police clearance.', dataKey: 'documents' },
  financials: { title: 'Financials', description: 'Service fee and payment tracking.', dataKey: 'financials' },
  conversation: { title: 'Conversation', description: 'Log client conversations, calls, and follow-ups for this case.', dataKey: 'conversation' },
  remark: { title: 'Remarks', description: 'General notes about the case progress.', dataKey: 'remark' },
  closure: { title: 'Closure', description: 'Case closure with reason and notes.', dataKey: 'closure' },
};

export default function WorkPermitOperationsWizard(props: WorkPermitOperationsWizardProps) {
  return (
    <OperationsWizardShell
      {...props}
      module="work-permit"
      pageTitle="Work Permit Operations"
      headerIcon={FileCheck}
      stages={stages}
      stageFieldMap={stageFieldMap}
      stageMeta={stageMeta}
    />
  );
}
